/*
 * ChatState.cpp
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#include "ChatState.h"
#include "BGApp.h"
#include "utilities.h"
#include <cstdlib>

int ChatState::MAX_SILENT_INTERVAL = 1320;
bool ChatState::SEND_PING = true;
ChatState* ChatState::_instance = NULL;
const std::string ChatState::STATE_WORDS[] = { "CONNECTED", "SOCKET_CONNECTING", "XMPP_CONNECTING", "DISCONNECTED", "PASSWORD_FAIL" };
SDL_Thread* ChatState::_sentinelThread = NULL;
SDL_Thread* ChatState::_reconnectThread = NULL;
const unsigned int ChatState::_retryIntvls[] = { 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584 };

ChatState::ChatState() {
	this->_connectLock = SDL_CreateMutex();
	this->_inflightLock = SDL_CreateMutex();
	this->_startupTaskState = 0;
	this->_time_changed = 0;
	this->_consecFails = 0;
	this->_last_user_wakeup = 0;
	this->_inflightRecons = 0;
	this->_state = ChatState::CHAT_STATE_DISCONNECTED;

	this->_totalDrops = 0;
	this->_last_login_trigger = -1;
}

ChatState::~ChatState() {
	SDL_DestroyMutex(this->_connectLock);
	SDL_DestroyMutex(this->_inflightLock);
}

void ChatState::finalize() {
	if (_instance != NULL) {
		if (_sentinelThread != NULL)
			SDL_KillThread(_sentinelThread);
		if (_reconnectThread != NULL)
			SDL_KillThread(_reconnectThread);
		delete _instance;
		_instance = NULL;
	}
}

ChatState* ChatState::initialize() {
	if (_instance != NULL) {
		if (_sentinelThread != NULL)
			SDL_KillThread(_sentinelThread);
		if (_reconnectThread != NULL)
			SDL_KillThread(_reconnectThread);
		delete _instance;
	}

	ChatState* curState = new ChatState();
	curState->setState(ChatState::CHAT_STATE_DISCONNECTED);
	_instance = curState;
	if (SEND_PING) {
		_sentinelThread = SDL_CreateThread(ChatState::sentinelTaskCallBack, (void*) ((Uint32) (MAX_SILENT_INTERVAL * 1000)));
		if (_sentinelThread == NULL)
			_LOGDATA("Error adding timer sentinelTask");
	}
	return curState;
}

Uint32 ChatState::scheduleSentinelTask(Uint32 delay) {
	//	_sentinelThread = SDL_CreateThread(ChatState::sentinelTaskCallBack, (void*) delay);
	//	if (_sentinelThread == NULL)
	//		_LOGDATA("Error adding timer sentinelTask");
	_LOGDATA("new SentinelTask scheduled for wakeup mins from now: %d", delay / 60000);
	return delay;
}

ChatState* ChatState::getState() {
	return _instance;
}

void ChatState::setState(int new_state) {
	_LOGDATA("ChatState change %s -> %s", STATE_WORDS[this->_state].c_str(), STATE_WORDS[new_state].c_str());
	this->_state = new_state;
	this->_time_changed = time(NULL);
	if (new_state == CHAT_STATE_CONNECTED) {
		this->_consecFails = 0;
		BGApp::getInstance()->sendNewStateToFG(new_state);
	}
}

void ChatState::userTypingWakeUp() {
	if ((time(NULL) - this->_last_user_wakeup) > 60) {
		this->_last_user_wakeup = time(NULL);
		doConnect(TRIGGER_USER_ACTIVITY);
	}
}

bool ChatState::doConnect(int trigger) {
	if (this->_state == CHAT_STATE_DISCONNECTED) {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			SDL_mutexP(this->_connectLock);
			_LOGDATA("got lock, with trigger %d connecting to chat [%d total drops]", trigger, this->_totalDrops);
			this->_last_login_trigger = trigger;
			BGApp::getInstance()->_xmpprunner->wakeUp();
			this->_totalDrops += 1;
			SDL_mutexV(this->_connectLock);
			return true;
		} else {
			_LOGDATA("no XmppRunner available...");
		}
	}
	_LOGDATA("doConnect bailing on non-disconnected state %s", STATE_WORDS[this->_state].c_str());
	return false;
}

void ChatState::processFail() {
	Uint32 delay = processFailInternal();
	if (delay > 0)
		_reconnectThread = SDL_CreateThread(ChatState::reconnectTaskCallBack, (void*) delay);
}

Uint32 ChatState::processFailInternal() {
	_LOGDATA("entering processFail with state %s and inflights %d", STATE_WORDS[this->_state].c_str(), this->_inflightRecons);
	SDL_mutexP(this->_inflightLock);
	if (this->_inflightRecons > 0) {
		_LOGDATA("ProcessFail finds inflight already, no new task.");
		SDL_mutexV(this->_inflightLock);
		return 0;
	}
	this->_inflightRecons += 1;
	SDL_mutexV(this->_inflightLock);

	unsigned int mins = chooseRetryMins();
	this->_consecFails += 1;
	if ((this->_consecFails > RETRY_INTERVALS_LEN) && (this->_xmpp_expire_date < time(NULL))) {
		_LOGDATA("expired and at the end of all intervals... not scheduling another delayed connect");
		return 0;
	}
	srand(time(NULL));
	unsigned int jitter = rand() % 10000;
	_LOGDATA("ProcessFail after consec fail %d, launching timed chat connector with delay %d mins %d seconds of jitter", this->_consecFails, mins, jitter);

	return (60000 * mins + jitter);
}

unsigned int ChatState::chooseRetryMins() {
	if (this->_consecFails > RETRY_INTERVALS_LEN - 1) {
		return ChatState::_retryIntvls[(RETRY_INTERVALS_LEN - 1)];
	}
	return ChatState::_retryIntvls[this->_consecFails];
}


int ChatState::sentinelTaskCallBack(void* param) {
	Uint32 newDelay = (Uint32) param;
	while (true) {
		SDL_Delay(newDelay);
		try {
			ChatState* _cs = ChatState::getState();

			if (_cs->_state == CHAT_STATE_CONNECTED) {
				XmppRunner* xmppRunner = BGApp::getInstance()->_xmpprunner;

				if (xmppRunner != NULL) {
					WAConnection* fConn = xmppRunner->_connection;
					if (fConn != NULL) {
						int quietInterval = (int) difftime(time(NULL), fConn->lastTreeRead);
						if (quietInterval >= MAX_SILENT_INTERVAL) {
							_LOGDATA("sending ping after quiet on xmpp conn for 1QI mins %d", quietInterval / 60);
							try {
								fConn->sendPing();
							} catch (exception& ex) {
								_LOGDATA("ChatState: error sending ping! %s", ex.what());
							}
						} else {
							newDelay = scheduleSentinelTask((Uint32) ((MAX_SILENT_INTERVAL - quietInterval) * 1000));
							continue;
						}
					}
				} else {
					_LOGDATA("sentinel sees null fun conn in connected state");
				}
			} else if (_cs->_state == CHAT_STATE_SOCKET_CONNECTING) {
				time_t curStateHeld = (time(NULL) - _cs->_time_changed);
				_LOGDATA("LOCKED? sentinel sees SOCKETING_CONNECTING held for seconds: %d",  (curStateHeld));
			} else if (_cs->_state == CHAT_STATE_XMPP_CONNECTING) {
				time_t curStateHeld = (time(NULL) - _cs->_time_changed);
				_LOGDATA("LOCKED? sentinel sees XMPP_CONNECTING held for seconds: %d", (curStateHeld));
			} else if (_cs->_state == CHAT_STATE_DISCONNECTED) {
				_LOGDATA("sentinel sees DISCONNECTED, inflight recons: %d", (_cs->_inflightRecons));
			} else {
				if (_cs->_state == CHAT_STATE_PASSWORD_FAIL) {
					_LOGDATA("sentinel sees PASSWD_FAIL, no more sentinel");
					break;
				}
				_LOGDATA("sentinel sees unknown chat state %d", (_cs->_state));
			}
			newDelay = scheduleSentinelTask((Uint32) (MAX_SILENT_INTERVAL * 1000));
			continue;
		} catch (exception& ex) {
			_LOGDATA("SentinelTask blowup: %s", ex.what());
			break;
		}
	}
	return 0;
}

int ChatState::reconnectTaskCallBack(void* param) {
	Uint32 newDelay = (Uint32) param;
	while (true) {
		SDL_Delay(newDelay);
		ChatState* _cs = ChatState::getState();
		try {
			SDL_mutexP(_cs->_inflightLock);
			if (_cs->_inflightRecons > 0)
				_cs->_inflightRecons--;
			SDL_mutexV(_cs->_inflightLock);

			if (_cs->_state == CHAT_STATE_DISCONNECTED) {
				_LOGDATA("ReconnectTask woke up and is trying to connect");
				bool res = _cs->doConnect(TRIGGER_RECONNECT);
				if ((!res) && (_cs->_state == CHAT_STATE_DISCONNECTED)) {
					Uint32 delay = _cs->processFailInternal();
					if (delay > 0) {
						newDelay = delay;
						continue;
					}
				}
			} else {
				_LOGDATA("ReconnectTask woke up but it looks like we're already connected or connecting.");
			}
		} catch (exception& ex) {
			_LOGDATA("ReconnectTask blowup: %s", ex.what());
		}
		break;
	}
	return 0;
}


