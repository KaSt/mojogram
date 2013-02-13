/*
 * XmppRunner.h
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#ifndef XMPPRUNNER_H_
#define XMPPRUNNER_H_

#include "WAConnection.h"
#include <SDL.h>
#include "BGApp.h"
#include "WAException.h"
#include "MySocketConnection.h"

class BGApp;

class XmppRunner {
private:
	bool _connectRequested;
	bool _inSockectOpen;
	bool _killed;
	bool hardFail;
	BGApp* _app;
	SDL_mutex* _mutex;
	SDL_cond* _cond;
	MySocketConnection* conn;

	void awaitReconnect();
	bool proceedPastKill();
	void stayConnectedLoop();
	void updateGroupChats() throw(WAException);

public:
	WAConnection* _connection;
	static const int PORTS[2];
	static const int NUM_PORTS;
	static int LAST_USED_PORT_INDEX;
	XmppRunner(BGApp* app);
	~XmppRunner();

	void wakeUp();
	bool killWithConfirmation();
	void closeConnection();
	static int startXmppThreadCallback(void *data);

};

#endif /* XMPPRUNNER_H_ */
