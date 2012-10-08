/*
 * BGApp2.cpp
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#include "BGApp.h"
#include "utilities.h"
#include "ApplicationData.h"
#include "SDL_thread.h"
#include "BinTreeNodeWriter.h"
#include "BinTreeNodeReader.h"
#include "WAConnection.h"
#include "Account.h"
BGApp* BGApp::_instance = NULL;

BGApp::BGApp() {
	this->_mutex = SDL_CreateMutex();
	this->_initialized = false;
	this->_gotGroups = false;
	this->_isNetworkConnected = false;
	this->_lastXMPPRunnerKill = 0;
	this->_xmpprunner = NULL;
	this->_chatState = NULL;
	this->_xmppthread = NULL;
	this->_bgMode = false;
}

BGApp::~BGApp() {
	SDL_DestroyMutex(this->_mutex);
	if (this->_xmpprunner != NULL)
		delete this->_xmpprunner;
}

BGApp* BGApp::getInstance() {
	return BGApp::_instance;
}

void BGApp::finalize() {
	SDL_mutexP(this->_mutex);
	if (this->_initialized) {
		if (this->_xmpprunner != NULL && this->_xmpprunner->_connection != NULL) {
			try {
				this->_xmpprunner->_connection->sendClose();
			} catch (exception& ex) {
				_LOGDATA("Error sending BGApp::finalize:sendingClose: %s", ex.what());
			}
		}
		if (this->_xmpprunner != NULL)
			this->_xmpprunner->killWithConfirmation();

		SDL_KillThread(this->_xmppthread);

		ChatState::finalize();

		if (this->_xmpprunner != NULL)
			delete _xmpprunner;

		this->_lastXMPPRunnerKill = time(NULL);
		this->_chatState = NULL;
		this->_xmpprunner = NULL;
		this->_initialized = false;
	}
	SDL_mutexV(this->_mutex);
}

bool BGApp::testLogin(const std::string& userId, const std::string& password, const std::string& pushName) {
	_LOGDATA("Test Login");
	std::string usePushName = pushName;
	MySocketConnection* conn = NULL;
	WAConnection* connection = NULL;

	try {
		std::string resource = ACCOUNT_RESOURCE;
		std::string socketURL = WHATSAPP_LOGIN_SERVER;
		int socketPort = WHATSAPP_LOGIN_PORT;
		if (usePushName.empty())
			usePushName = "HP Webos user";

		conn = new MySocketConnection(socketURL, socketPort);
		WALogin* login = new WALogin(new BinTreeNodeReader(conn, WAConnection::dictionary, WAConnection::DICTIONARY_LEN),
				new BinTreeNodeWriter(conn, WAConnection::dictionary, WAConnection::DICTIONARY_LEN));
		connection = new WAConnection(login, "s.whatsapp.net", resource, userId, usePushName, Utilities::getChatPassword(password), NULL, NULL);
		connection->setVerboseId(true);
		login->setConnection(connection);
		connection->setReceiptAckCapable(true);
		login->login();
	} catch (WAException& ex) {
		_LOGDATA("Error test login: %s, %d, %d", ex.what(), ex.type, ex.subtype);
		if (conn != NULL)
			delete conn;
		if (connection != NULL)
			delete connection;
		return false;
	}

	if (conn != NULL)
		delete conn;
	if (connection != NULL)
		delete connection;
	return true;
}

void BGApp::initialize() {
	SDL_mutexP(this->_mutex);
	if (this->_initialized)
		return;

	_LOGDATA("bg initializing chat state");
	this->_chatState = ChatState::initialize();

	this->_chatState->_startupTaskState |= 1;

	_LOGDATA("bg creating fun runner");
	this->_xmpprunner = new XmppRunner(this);

	_LOGDATA("bg starting fun runner thread in pause");
	_xmppthread = SDL_CreateThread(XmppRunner::startXmppThreadCallback, this->_xmpprunner);
	if (_xmppthread == NULL) {
		_LOGDATA("No se puede crear el thread para llamar a XmppRunner::startXmppThreadCallback");
	}

	this->_chatState->_startupTaskState |= 32;
	this->_initialized = true;

	if (!ApplicationData::_chatUserId.empty()) {
		this->_myPlainJid = ApplicationData::_chatUserId + "@" + "s.whatsapp.net";
		if (SDL_CreateThread(BGApp::initialXMPPConnectionThreadCallback, this) == NULL) {
			_LOGDATA("No se puede crear el thread para llmar a BGApp::initialXMPPConnectionThreadCallback");
		}
	}
	SDL_mutexV(this->_mutex);
}

int BGApp::initialXMPPConnectionThreadCallback(void *data) {
	SDL_Delay(4000L);
	_LOGDATA("waking up xmpp");
	((BGApp*) data)->_chatState->doConnect(ChatState::TRIGGER_APP_START);

	return 0;
}

bool BGApp::gotGroups() {
	return _gotGroups;
}

void BGApp::setInstance(BGApp* app) {
	BGApp::_instance = app;
}

bool BGApp::canConnect() {
	return this->_isNetworkConnected;
}

void BGApp::networkConnectionChanged(bool isConnected) {
	SDL_mutexP(this->_mutex);
	bool runnerActive = (this->_xmpprunner) != NULL && (this->_xmpprunner->_connection != NULL);

	bool registered = (!ApplicationData::_chatUserId.empty());

	_LOGDATA("BGApp sees wifi changed to %d with active runnner %d and registered %d ", isConnected, runnerActive, registered);
	this->_isNetworkConnected = isConnected;

	if ((isConnected) && (this->_chatState->_state == ChatState::CHAT_STATE_SOCKET_CONNECTING)) {
		Uint32 curStateHeld = (time(NULL) - this->_chatState->_time_changed);
		if ((curStateHeld > ChatState::MAX_SILENT_INTERVAL) && ((Uint32) ((time(NULL) - this->_lastXMPPRunnerKill)) > (3 * ChatState::MAX_SILENT_INTERVAL))) {
			XmppRunner* oldRunner = this->_xmpprunner;
			XmppRunner* newRunner = new XmppRunner(this);

			if (oldRunner != NULL && oldRunner->killWithConfirmation()) {
				_LOGDATA("killed old fun runner");
				this->_xmpprunner = newRunner;
				this->_chatState->setState(ChatState::CHAT_STATE_DISCONNECTED);
				_xmppthread = SDL_CreateThread(XmppRunner::startXmppThreadCallback, this->_xmpprunner);
				this->_lastXMPPRunnerKill = time(NULL);
			} else {
				_LOGDATA("attempted fun runner kill was denied");
			}
		}
	}
	if (isConnected && (this->_xmpprunner != NULL) && (this->_xmpprunner->_connection == NULL) && (registered)) {
		_LOGDATA("kicking off delayed internet connect attempt");
		SDL_CreateThread(BGApp::doConnect1TrheadCallBack, this);
	}
	SDL_mutexV(this->_mutex);
}

int BGApp::doConnect1TrheadCallBack(void *data) {
	SDL_Delay(1000);
	((BGApp*) data)->_chatState->doConnect(ChatState::TRIGGER_COVERAGE);
	return 0;
}

void BGApp::onPing(const std::string& id) throw (WAException) {
	WAConnection* fconn = this->_xmpprunner->_connection;
	if (fconn != NULL) {
		try {
			_LOGDATA("got ping id %s sending pong", id.c_str());
			fconn->sendPong(id);
		} catch (exception& ex) {

		}
	}
}

void BGApp::onParticipatingGroups(const std::vector<string>& groups) {
	_LOGDATA("GRP particpating in %d groups", groups.size());

	WAConnection* fconn = this->_xmpprunner->_connection;
	if (fconn != NULL) {
		this->sendParticipatingGroupsToFG(groups);
		fconn->sendClearDirty("groups");
	}
}

void BGApp::onAvailable(const std::string& jid, bool what) {
	std::string nakedJid = WAConnection::removeResourceFromJid(jid);

	time_t lastSeen;
	int state;
	if (what) {
		lastSeen = 0L;
		state = 1;
		_LOGDATA("here: %s", nakedJid.c_str());
	} else {
		lastSeen = time(NULL);
		state = 2;
		_LOGDATA("gone: %s", nakedJid.c_str());
	}
	sendContactInfoToFG(nakedJid, state, lastSeen);
}

void BGApp::onIsTyping(const std::string& jid, bool what) {
	std::string nakedJid = WAConnection::removeResourceFromJid(jid);
	int state;
	if (what) {
		state = 0;
		_LOGDATA("is typing: %s", nakedJid.c_str());
	} else {
		state = 1;
		_LOGDATA("stop typing: %s", nakedJid.c_str());
	}
	sendContactInfoToFG(nakedJid, state, (time_t) 0);
}

void BGApp::onGroupInfoFromList(const std::string& gjid, const std::string& owner, const std::string& subject, const std::string& subject_owner_jid, int subject_t, int creation) {
	onGroupInfo(gjid, owner, subject, subject_owner_jid, subject_t, creation);
}

void BGApp::onOwningGroups(const std::vector<string>& groups) {
	if (!groups.empty())
		_LOGDATA("GRP seeing owning groups %d", groups.size());
}

void BGApp::onSetSubject(const std::string& paramString) {}

void BGApp::onAddGroupParticipants(const std::string& paramString, const std::vector<string>& paramVector, int paramHashtable) {}

void BGApp::onRemoveGroupParticipants(const std::string& paramString, const std::vector<string>& paramVector, int paramHashtable) {}

void BGApp::onLeaveGroup(const std::string& from) {
	_LOGDATA("GRP %s left group", from.c_str());
}

void BGApp::onMessageError(FMessage* message, int codeError) {
	this->onMessageStatusUpdate(message);
}

void BGApp::onPingResponseReceived() {
	_LOGDATA("ping response received");
}

void BGApp::onClientConfigReceived(const std::string& push_id) {
	_LOGDATA("client config received with id %s", push_id.c_str());
}

void BGApp::onLastSeen(const std::string& jid, int seconds, std::string* status) {
	std::string nakedJid = WAConnection::removeResourceFromJid(jid);
	_LOGDATA("last seen info for %s, %d seconds: status %s", nakedJid.c_str(), seconds, (status == NULL?"":status->c_str()));

	time_t lastSeen = time(NULL) - (time_t) seconds;
	this->sendContactInfoToFG(nakedJid, 2, lastSeen);
}

void BGApp::onAccountChange(int paramInt, long paramLong) {}
void BGApp::onPrivacyBlockListAdd(const std::string& paramString) {}
void BGApp::onPrivacyBlockListClear() {}
void BGApp::onDirty(const std::map<string,string>& paramHashtable) {}
void BGApp::onDirtyResponse(int paramHashtable) {}
void BGApp::onRelayRequest(const std::string& paramString1, int paramInt, const std::string& paramString2) {}




