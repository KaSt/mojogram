/*
 * ChatState.h
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#ifndef CHATSTATE_H_
#define CHATSTATE_H_

#include <time.h>
#include <SDL.h>
#include <string>

class ChatState {
private:
	static ChatState* _instance;

	static const int RETRY_INTERVALS_LEN = 17;
	static const std::string STATE_WORDS[];
	static SDL_Thread* _sentinelThread;
	static SDL_Thread* _reconnectThread;
	static int sentinelTaskCallBack(void* param);
	static int reconnectTaskCallBack(void* param);
	static Uint32 scheduleSentinelTask(Uint32 delay);
	static const unsigned int _retryIntvls[RETRY_INTERVALS_LEN];

	SDL_mutex* _connectLock;
	SDL_mutex* _inflightLock;
	ChatState();
	~ChatState();
	unsigned int chooseRetryMins();
	Uint32 processFailInternal();

public:
	static const int CHAT_STATE_CONNECTED = 0;
	static const int CHAT_STATE_SOCKET_CONNECTING = 1;
	static const int CHAT_STATE_XMPP_CONNECTING = 2;
	static const int CHAT_STATE_DISCONNECTED = 3;
	static const int CHAT_STATE_PASSWORD_FAIL = 4;

	static const int TRIGGER_APP_START = 0;
	static const int TRIGGER_COVERAGE = 1;
	static const int TRIGGER_USER_ACTIVITY = 2;
	static const int TRIGGER_INCOMING_PUSH = 3;
	static const int TRIGGER_AUTO_POLL = 4;
	static const int TRIGGER_PUSH_SETTINGS_CHANGED = 5;
	static const int TRIGGER_RECONNECT = 6;

	static int MAX_SILENT_INTERVAL;
	static bool SEND_PING;

	int _state;
	int _startupTaskState;
	time_t _last_successful_login;
	int _xmpp_account_kind;
	time_t _xmpp_expire_date;
	time_t _time_changed;
	int _consecFails;
	time_t _last_user_wakeup;
	int _inflightRecons;
	int _totalDrops;
	int _last_login_trigger;

	static void finalize();
	static ChatState* initialize();
	static ChatState* getState();
	void setState(int s);
	void processFail();
	void userTypingWakeUp();
	bool doConnect(int trigger);
};

#endif /* CHATSTATE_H_ */
