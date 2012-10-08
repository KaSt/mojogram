/*
 * XmppRunner.cpp
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#include "XmppRunner.h"
#include "ChatState.h"
#include "ApplicationData.h"
#include "WALogin.h"
#include "utilities.h"
#include "Account.h"
#include <time.h>
#include <ctime>
#include <sys/select.h>
#include <SDL_net.h>



XmppRunner::XmppRunner(BGApp* app) {
	this->_app = app;
	this->_mutex = SDL_CreateMutex();
	this->_cond = SDL_CreateCond();
	this->_killed = false;
	this->_inSockectOpen = false;
	this->_connectRequested = false;
	this->_connection = NULL;
	this->hardFail = true;
}

XmppRunner::~XmppRunner() {
	SDL_DestroyMutex(this->_mutex);
	SDL_DestroyCond(this->_cond);
}

void XmppRunner::awaitReconnect() {
	SDL_mutexP(this->_mutex);
	if (! this->_connectRequested) {
		SDL_CondWait(this->_cond, this->_mutex);
	}
	this->_connectRequested = false;
	SDL_mutexV(this->_mutex);
}

void XmppRunner::closeConnection() {
	if (this->conn != NULL)
		conn->forceShutdown();
}

void XmppRunner::wakeUp() {
	SDL_mutexP(this->_mutex);
	this->_connectRequested = true;
	SDL_CondSignal(this->_cond);
	SDL_mutexV(this->_mutex);
}

bool XmppRunner::killWithConfirmation() {
	SDL_mutexP(this->_mutex);
	if (this->_inSockectOpen) {
		this->_killed = true;
		SDL_mutexV(this->_mutex);
		return true;
	}
	SDL_mutexV(this->_mutex);
	return false;
}

bool XmppRunner::proceedPastKill() {
	SDL_mutexP(this->_mutex);
	if (this->_killed) {
		_LOGDATA("FunRunner woke up killed, exiting");
		SDL_mutexV(this->_mutex);
		return true;
	}
	this->_inSockectOpen = false;
	SDL_mutexV(this->_mutex);
	return false;
}

void XmppRunner::stayConnectedLoop() {
	hardFail = true;
	WAConnection* connection = NULL;
	this->conn = NULL;


	ChatState* chatState = ChatState::getState();
	bool sendConfig = false;

	int conTries = 0;

	std::string resource = ACCOUNT_RESOURCE;
	while (true) {
		if (connection != NULL)
			delete connection;
		if (this->conn != NULL)
			delete conn;

		connection = NULL;
		conn = NULL;

		if (hardFail) {
			awaitReconnect();
			_LOGDATA("fun runner woken up");
			conTries = 0;
		}
		chatState->setState(ChatState::CHAT_STATE_SOCKET_CONNECTING);

		std::string chatUserId = ApplicationData::_chatUserId;
		if (chatUserId.empty()) {
			_LOGDATA("woke up but we are app-expired or have no chat user ID, back to sleep");
			chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
			hardFail = true;
			continue;
		}

		if (! this->_app->canConnect()) {
			_LOGDATA("system roam settings preclude connect, back to sleep");
			chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
			hardFail = true;
			continue;
		}
		std::string socketURL = WHATSAPP_LOGIN_SERVER;

		_LOGDATA("trying xmpp login user %s to socket url", chatUserId.c_str());

		int socketPort = WHATSAPP_LOGIN_PORT;
		try {
			this->_inSockectOpen = true;
			conn = new MySocketConnection(socketURL, socketPort);
			_LOGDATA("Connector.open returned a socket for xmpprunner");
			hardFail = false;
		} catch (exception& ex) {
			hardFail = true;
			_LOGDATA("FunRunner connect error building socket: %s", ex.what());
		}

		if (proceedPastKill()) {
			if (connection != NULL)
				delete connection;
			if (conn != NULL)
				delete conn;
			return;
		}

		if (hardFail) {
			chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
			chatState->processFail();
			continue;
		}

		try {
			std::string usePushName = ApplicationData::_pushName;
			if (usePushName.empty())
				usePushName = "HP Webos user";
			WALogin* login = new WALogin(new BinTreeNodeReader(conn, WAConnection::dictionary, WAConnection::DICTIONARY_LEN),
					new BinTreeNodeWriter(conn, WAConnection::dictionary, WAConnection::DICTIONARY_LEN));
			connection = new WAConnection(login, "s.whatsapp.net", resource, chatUserId, usePushName, Utilities::getChatPassword(ApplicationData::_password), this->_app, this->_app);
			connection->setVerboseId(true);
			login->setConnection(connection);
			connection->setReceiptAckCapable(true);
		} catch (exception& ex) {
			hardFail = true;
			_LOGDATA("FunRunner error setting up connection: %s", ex.what());
			chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
			chatState->processFail();
			continue;
		}

		hardFail = false;
		bool acctExpired = false;
		bool passwordFail = false;

		chatState->setState(ChatState::CHAT_STATE_XMPP_CONNECTING);

		try {
			conTries++;
			try {
				connection->do_login();
				if (!this->_app->_bgMode)
					connection->sendAvailableForChat();
				conTries = 0;
				chatState->_last_successful_login = time(NULL);
			} catch (WAException& ex) {
				if (ex.type == WAException::LOGIN_FAILURE_EX) {
					if (ex.subtype == WAException::LOGIN_FAILURE_EX_TYPE_EXPIRED) {
						acctExpired = true;

						_LOGDATA("xmpp login failed, we're expired!");

						if (connection->expire_date > 0L) {
							chatState->_xmpp_account_kind = connection->account_kind;
							time_t newExpire = connection->expire_date;
							if ((chatState->_xmpp_expire_date > 0L) && (newExpire - chatState->_xmpp_expire_date > 2592000L)) {
								chatState->_xmpp_expire_date = newExpire;

							} else
								chatState->_xmpp_expire_date = newExpire;
						}

						this->_connection = NULL;
						if (passwordFail) {
							chatState->setState(ChatState::CHAT_STATE_PASSWORD_FAIL);
						} else {
							chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
							if (acctExpired) {
								_LOGDATA("exiting loop after expired, setting hardfail and timer");
								hardFail = true;
								chatState->processFail();
							} else if (conTries > 1) {
								if ((chatState->_startupTaskState & 0x10) != 16) {
									if (conTries < 10) {
										_LOGDATA("fail on first login, sleeping and extra retries");
										SDL_Delay(conTries * 500);
									} else {
										hardFail = true;
										chatState->processFail();
									}
								} else {
									hardFail = true;
									chatState->processFail();
								}
							}
						}
						continue;
					}

					if (ex.subtype == WAException::LOGIN_FAILURE_EX_TYPE_PASSWORD) {
						_LOGDATA("xmpp login password failed");
						passwordFail = true;
						if (connection->expire_date > 0L) {
							chatState->_xmpp_account_kind = connection->account_kind;
							time_t newExpire = connection->expire_date;
							if ((chatState->_xmpp_expire_date > 0L) && (newExpire - chatState->_xmpp_expire_date > 2592000L)) {
								chatState->_xmpp_expire_date = newExpire;

							} else
								chatState->_xmpp_expire_date = newExpire;
						}

						this->_connection = NULL;
						if (passwordFail) {
							chatState->setState(ChatState::CHAT_STATE_PASSWORD_FAIL);
						} else {
							chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
							if (acctExpired) {
								_LOGDATA("exiting loop after expired, setting hardfail and timer");
								hardFail = true;
								chatState->processFail();
							} else if (conTries > 1) {
								if ((chatState->_startupTaskState & 0x10) != 16) {
									if (conTries < 10) {
										_LOGDATA("fail on first login, sleeping and extra retries");
										SDL_Delay(conTries * 500);
									} else {
										hardFail = true;
										chatState->processFail();
									}
								} else {
									hardFail = true;
									chatState->processFail();
								}
							}
						}
						break;
					}

					_LOGDATA("unknown LoginFailure type %d msg %s", ex.subtype, ex.what());
				} else {
					_LOGDATA("detected corrupt stream: %s", ex.what());

					if (connection->expire_date > 0L) {
						chatState->_xmpp_account_kind = connection->account_kind;
						time_t newExpire = connection->expire_date;
						if ((chatState->_xmpp_expire_date > 0L) && (newExpire - chatState->_xmpp_expire_date > 2592L)) {
							chatState->_xmpp_expire_date = newExpire;

						} else
							chatState->_xmpp_expire_date = newExpire;
					}

					this->_connection = NULL;
					if (passwordFail) {
						chatState->setState(ChatState::CHAT_STATE_PASSWORD_FAIL);
					} else {
						chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
						if (acctExpired) {
							_LOGDATA("exiting loop after expired, setting hardfail and timer");
							hardFail = true;
							chatState->processFail();
						} else if (conTries > 1) {
							if ((chatState->_startupTaskState & (0x10)) != 16) {
								if (conTries < 10) {
									_LOGDATA("fail on first login, sleeping and extra retries");
									SDL_Delay(conTries * 500);
								} else {
									hardFail = true;
									chatState->processFail();
								}
							} else {
								hardFail = true;
								chatState->processFail();
							}
						}
					}
					continue;
				}

				if (connection->expire_date > 0L) {
					chatState->_xmpp_account_kind = connection->account_kind;
					time_t newExpire = connection->expire_date;
					if ((chatState->_xmpp_expire_date > 0L) && (newExpire - chatState->_xmpp_expire_date > 2592L)) {
						chatState->_xmpp_expire_date = newExpire;
					} else
						chatState->_xmpp_expire_date = newExpire;
				}
			}

			_LOGDATA("logical login completed, account kind is %d expires at %s", connection->account_kind, ctime(&connection->expire_date));

			this->_connection = connection;
			// conn->makeNonBlock();
			chatState->setState(ChatState::CHAT_STATE_CONNECTED);
			chatState->_startupTaskState |= 16;
			if (!sendConfig) {
				this->_connection->sendClientConfig("", "", false, "");
				sendConfig = true;
				this->_connection->sendGetPrivacyList();
			}
			this->_app->sendOfflineMessages();
			updateGroupChats();
			_LOGDATA("entering xmpp read loop");

			bool cont = true;
			do {
				// int ret = conn->waitForRead();
				// if (ret < 0) {
				// 	throw WAException("Select error");
				// } else if (ret > 0) {
					cont =  this->_connection->read();
				// }
			} while (cont);

			_LOGDATA("clean exit from xmpp read loop");
		} catch (exception& ex) {
			_LOGDATA("blew up inside xmpp connection with error: %s", ex.what());
		}

		this->_connection = NULL;
		if (passwordFail) {
			chatState->setState(ChatState::CHAT_STATE_PASSWORD_FAIL);
		} else {
			chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
			if (acctExpired) {
				_LOGDATA("exiting loop after expired, setting hardfail and timer");
				hardFail = true;
				chatState->processFail();
			} else if (conTries > 1) {
				if ((chatState->_startupTaskState & 0x10) != 16) {
					if (conTries < 10) {
						_LOGDATA("fail on first login, sleeping and extra retries");
						SDL_Delay(conTries * 500);
					} else {
						hardFail = true;
						chatState->processFail();
					}
				} else {
					hardFail = true;
					chatState->processFail();
				}
			}
		}
	}
}

void XmppRunner::updateGroupChats() throw(WAException) {
	this->_connection->sendGetServerProperties();
	if (!BGApp::getInstance()->gotGroups() && !this->_app->_bgMode) {
		this->_connection->sendGetGroups();
		this->_connection->sendGetOwningGroups();
	}
}

int XmppRunner::startXmppThreadCallback(void *data) {
	((XmppRunner*) data)->stayConnectedLoop();
	((XmppRunner*) data)->_app->_xmpprunner = NULL;
	delete ((XmppRunner*) data);
	_LOGDATA("Exit XmppThreadCallBack");
	return 0;
}
