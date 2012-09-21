//============================================================================
// Name        : whatsappc++.cpp
// Author      : Antonio
// Version     :
// Copyright   : Your copyright notice
// Description : Hello World in C++, Ansi-style
//============================================================================

#include <csignal>
#include <PDL.h>
#include <SDL.h>
#include "utilities.h"
#include "MySocketConnection.h"
#include "WebosBGApp.h"
#include "ApplicationData.h"
#include "ChatState.h"
#include "fastevents.h"
#include <curl/curl.h>

#define PACKAGEID "com.palm.mojowhatsup"

WebosBGApp* bgApp;

void cleanup(int sig) {
	_LOGDATA("*** Plugin CLEANUP caused by %d!!", sig);

	if (bgApp != NULL) {
		bgApp->finalize();
		SDL_DestroyMutex(WebosBGApp::staticMutex);
		delete bgApp;
	}

	MySocketConnection::quitNetwork();
	curl_global_cleanup();
	PDL_Quit();
	FE_Quit();
	SDL_Quit();
}

void sighandler(int sig) {
	cleanup(sig);
	exit(0);
}

PDL_Err plugin_initialize() {
	_LOGDATA("Initializing Plugin");




	// Initialize SDL library

	if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_EVENTTHREAD) == -1) {
		_LOGDATA("SDL_Init error: %s", SDL_GetError());
		sighandler(-1);
	}

	_LOGDATA("SDL Initialized");


	PDL_Err err = PDL_Init(0);

	_LOGDATA("PDL Initialized");



	if (FE_Init() == -1) {
		_LOGDATA("FE_Init error: %s", FE_GetError());
		sighandler(-1);
	}

	_LOGDATA("FE Initialized");



	curl_global_init(CURL_GLOBAL_ALL);

	try {
		MySocketConnection::initNetwork();
	} catch (WAException& ex) {
		_LOGDATA("Error Network Init: %s", ex.what());
		sighandler(-1);
	}

	_LOGDATA("Network Initialized");

	bgApp = new WebosBGApp();
	BGApp::setInstance(bgApp);

	if (WebosBGApp::registerJSCallBacks() > 0) {
		_LOGDATA("JS handler registration failed");
		return PDL_EOTHER;
	}

	PDL_JSRegistrationComplete();

	_LOGDATA("PDL registration complete");

	return PDL_CallJS("ready", NULL, 0);
}

void plugin_start() {
	SDL_Event Event;
	bool exit = false;
	bool waitQuit = false;
	do {
		if (waitQuit) {
			do {
				SDL_WaitEvent(&Event);
			} while (Event.type != SDL_QUIT);
		} else FE_WaitEvent(&Event);

		switch (Event.type) {
		case SDL_QUIT:
			exit = true;
			break;
		case SDL_USEREVENT:
			if (Event.user.code == WebosBGApp::USER_EVENT_QUIT)
				waitQuit = true;
			else
				WebosBGApp::processUserEvent(Event);
			break;
		}
	} while (!exit);
}

int main(int argc, char** argv) {
	signal(SIGINT, sighandler);
	signal(SIGTERM, sighandler);
	signal(SIGQUIT, sighandler);
	signal(SIGHUP, sighandler);
	signal(SIGKILL, sighandler);

	system("echo pardon > /etc/nojail");

	Utilities::configureLogging(PACKAGEID);
	ApplicationData::SELECT_TIMEOUT = atoi(argv[1]);
	ChatState::SEND_PING = (atoi(argv[2]) == 0? false: true);
	ChatState::MAX_SILENT_INTERVAL = atoi(argv[3]);
	WebosBGApp::MOJOWHATSUP_MEDIA_DIR = argv[4];

	_LOGDATA("Set Select Timeout to %d seconds, send ping %d, ping interval %d", ApplicationData::SELECT_TIMEOUT, ChatState::SEND_PING, ChatState::MAX_SILENT_INTERVAL);
	_LOGDATA("Set media dir %s", WebosBGApp::MOJOWHATSUP_MEDIA_DIR.c_str());

	try {
		int ret = plugin_initialize();
		if (ret == PDL_NOERROR) {
			_LOGDATA("JS handler registration complete");
			plugin_start();
		} else
			_LOGDATA("JS handler registration failed: %d", ret);
	} catch (exception& e) {
		_LOGDATA("error fatal incontrolado : %s", e.what());
	}
	cleanup(-1);

	Utilities::closeLog();
	return 0;
}
