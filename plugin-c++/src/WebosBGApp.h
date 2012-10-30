/*
 * WebosBGApp.h
 *
 *  Created on: 05/07/2012
 *      Author: Antonio
 */

#ifndef WEBOSBGAPP_H_
#define WEBOSBGAPP_H_

#include "BGApp.h"
#include "FMessage.h"
#include "Account.h"
#include <map>
#include <string>
#include <PDL.h>
#include <SDL.h>

class WebosBGApp: public BGApp {
private:
	static std::map<std::string, MediaUploader*> uploads;
	static FMessage* fromJSONtoMessage(const char *string);
	static char* fromMessageToJSON(FMessage* message);
	static int waUploadHandler(void* data);

public:
	static SDL_mutex* staticMutex;
	static std::string MOJOWHATSUP_MEDIA_DIR;

	// JS callbacks
	static int registerJSCallBacks();
	static const int USER_EVENT_TESTLOGIN = 0;
	static const int USER_EVENT_STARTBG = 1;
	static const int USER_EVENT_SENDMESSAGE = 2;
	static const int USER_EVENT_SENDTYPING = 3;
	static const int USER_EVENT_DOSTATEREQUEST = 4;
	static const int USER_EVENT_ONMESSAGEFORME = 5;
	static const int USER_EVENT_ONMESSAGESTATUSUPDATE = 6;
	static const int USER_EVENT_SENDOFFLINEMESSAGES = 7;
	static const int USER_EVENT_SENDNEWSTATETOFG = 8;
	static const int USER_EVENT_SENDCONTACTINFOTOFG = 9;
	static const int USER_EVENT_NETWORKSTATUSCHANGED = 10;
	static const int USER_EVENT_ONGROUPINFO = 11;
	static const int USER_EVENT_CREATEGROUPCHAT = 12;
	static const int USER_EVENT_SENDMESSAGERECEIVED = 13;
	static const int USER_EVENT_CLOSECONNECTION = 14;
	static const int USER_EVENT_SENDACTIVE = 15;
	static const int USER_EVENT_SENDCODEREQUEST = 16;
	static const int USER_EVENT_SENDREGISTERREQUEST = 17;
	static const int USER_EVENT_SENDUPLOADREQUEST = 18;
	static const int USER_EVENT_STOPUPLOADREQUEST = 19;
	static const int USER_EVENT_SENDLEAVEGROUP = 20;
	static const int USER_EVENT_SENDENDGROUP = 21;
	static const int USER_EVENT_ONGETPARTICIPANTS = 22;
	static const int USER_EVENT_SENDADDPARTICIPANTS = 23;
	static const int USER_EVENT_SENDREMOVEPARTICIPANTS = 24;
	static const int USER_EVENT_ONGROUPNEWSUBJECT = 25;
	static const int USER_EVENT_ONSERVERPROPERTIES = 26;
	static const int USER_EVENT_SENDSTATUSUPDATE = 27;
	static const int USER_EVENT_SENDGETPICTUREIDS = 28;
	static const int USER_EVENT_SENDGETPICTURE = 29;
	static const int USER_EVENT_SENDSETPICTURE = 30;

	static const int USER_EVENT_QUIT = 100;

	static PDL_bool sendTyping(PDL_JSParameters *params);
	static PDL_bool doStateRequest(PDL_JSParameters *params);
	static PDL_bool pluginTestLogin(PDL_JSParameters *params);
	static PDL_bool pluginStartBG(PDL_JSParameters *params);
	static PDL_bool md5String(PDL_JSParameters *params);
	static PDL_bool networkStatusChanged(PDL_JSParameters *params);
	static PDL_bool nextMessageKeyId(PDL_JSParameters *params);
	static PDL_bool sendMessage(PDL_JSParameters *params);
	static PDL_bool sendMessageReceived(PDL_JSParameters *params);
	static PDL_bool closeConnection(PDL_JSParameters *params);
	static PDL_bool sendActive(PDL_JSParameters *params);
	static PDL_bool exitPlugin(PDL_JSParameters *params);
	static PDL_bool sendCodeRequest(PDL_JSParameters *params);
	static PDL_bool sendRegisterRequest(PDL_JSParameters *params);
	static PDL_bool sendUploadRequest(PDL_JSParameters *params);
	static PDL_bool stopUploadRequest(PDL_JSParameters *params);
	static PDL_bool sendLeaveGroup(PDL_JSParameters *params);
	static PDL_bool sendEndGroup(PDL_JSParameters *params);
	static PDL_bool sendCreateGroupChat(PDL_JSParameters *params);
	static PDL_bool sendAddParticipants(PDL_JSParameters *params);
	static PDL_bool sendRemoveParticipants(PDL_JSParameters *params);
	static PDL_bool sendSetNewSubject(PDL_JSParameters *params);
	static PDL_bool resizeImage(PDL_JSParameters *params);
	static PDL_bool sendStatusUpdate(PDL_JSParameters *params);
	static PDL_bool sendGetPictureIds(PDL_JSParameters *params);
	static PDL_bool sendGetPicture(PDL_JSParameters *params);
	static PDL_bool sendSetPicture(PDL_JSParameters *params);
	static PDL_bool removeFile(PDL_JSParameters *params);

	static void processUserEvent(const SDL_Event& event);

	// de BGApp
	void sendOfflineMessages();
	void sendNewStateToFG(int new_state);
	void sendParticipatingGroupsToFG(const std::vector<string>& groups);
	void sendContactInfoToFG(const std::string& jid, int state, time_t lastSeen);

	// de la interfaz WAListener
	void onMessageForMe(FMessage* paramFMessage, bool paramBoolean) throw (WAException);
	void onMessageStatusUpdate(FMessage* paramFMessage);
	void onSendGetPictureIds(std::map<std::string, std::string>* ids);
	void onSendGetPicture(const std::string& jid, const std::string& data, const std::string& oldId, const std::string& newId);

	// de la interfaz WAGroupListener
	void onGroupAddUser(const std::string& paramString1, const std::string& paramString2);
	void onGroupRemoveUser(const std::string& paramString1, const std::string& paramString2);
	void onPictureChanged(const std::string& jid, const std::string& author, bool set);
	void onGroupNewSubject(const std::string& from, const std::string& author, const std::string& newSubject, int paramInt);
	void onServerProperties(std::map<std::string, std::string>* nameValueMap);
	void onGroupInfo(const std::string& paramString1, const std::string& paramString2, const std::string& paramString3, const std::string& paramString4, int paramInt1, int paramInt2);
	void onGetParticipants(const std::string& paramString, const std::vector<string>& paramVector);
	void onGroupCreated(const std::string& paramString1, const std::string& paramString2);

	WebosBGApp();
	~WebosBGApp();
};

#endif /* WEBOSBGAPP_H_ */
