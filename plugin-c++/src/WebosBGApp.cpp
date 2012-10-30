/*
 * WebosBGApp.cpp
 *
 *  Created on: 05/07/2012
 *      Author: Antonio
 */

#include "WebosBGApp.h"
#include "ApplicationData.h"
#include "utilities.h"
#include "cJSON.h"
#include "FMessage.h"
#include "fastevents.h"
#include "Account.h"
#include "JpegImageResizer.h"
#include <PDL.h>

SDL_mutex* WebosBGApp::staticMutex = SDL_CreateMutex();
std::map<std::string, MediaUploader*> WebosBGApp::uploads;
std::string WebosBGApp::MOJOWHATSUP_MEDIA_DIR;

WebosBGApp::WebosBGApp() {
}

WebosBGApp::~WebosBGApp() {
}

/****
 * PRIVATE STATIC METHODS
 */
int WebosBGApp::waUploadHandler(void* d) {
	MediaUploader* mediaUploader = (MediaUploader*) d;
	try {
		std::string response = mediaUploader->waUploadFile();

		if (mediaUploader->isTempFile)
			mediaUploader->removeFile();

		const char *params[1];
		params[0] = response.c_str();

		PDL_Err err = PDL_CallJS("uploadRequestResponse", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		WebosBGApp::uploads.erase(mediaUploader->msgId);
		delete mediaUploader;
	} catch (WAException& ex) {
		_LOGDATA("Error sending SMS code request");
	}

	return 0;
}

char* WebosBGApp::fromMessageToJSON(FMessage* message) {
	cJSON* json = cJSON_CreateObject();
	cJSON_AddStringToObject(json, "remote_jid",
			message->key->remote_jid.c_str());
	(message->key->from_me ?
			cJSON_AddTrueToObject(json, "from_me") :
			cJSON_AddFalseToObject(json, "from_me"));
	cJSON_AddStringToObject(json, "keyId", message->key->id.c_str());
	cJSON_AddNumberToObject(json, "status", (double) message->status);
	cJSON_AddStringToObject(json, "data", message->data.c_str());
	cJSON_AddNumberToObject(json, "timestamp", (double) message->timestamp);
	cJSON_AddNumberToObject(json, "media_wa_type",
			(double) message->media_wa_type);
	cJSON_AddStringToObject(json, "remote_resource",
			message->remote_resource.c_str());
	cJSON_AddStringToObject(json, "notifyname", message->notifyname.c_str());
	(message->wants_receipt ?
			cJSON_AddTrueToObject(json, "wants_receipt") :
			cJSON_AddFalseToObject(json, "wants_receipt"));

	cJSON_AddStringToObject(json, "media_url", message->media_url.c_str());
	cJSON_AddStringToObject(json, "media_name", message->media_name.c_str());
	cJSON_AddNumberToObject(json, "media_size", (double) message->media_size);
	cJSON_AddNumberToObject(json, "media_duration_seconds",
			(double) message->media_duration_seconds);
	cJSON_AddNumberToObject(json, "longitude", message->longitude);
	cJSON_AddNumberToObject(json, "latitude", message->latitude);

	char* ret = cJSON_PrintUnformatted(json);
	cJSON_Delete(json);
	return ret;
}

FMessage* WebosBGApp::fromJSONtoMessage(const char *string) {
	_LOGDATA("Message JSON = %s", string);
	cJSON* json = cJSON_Parse(string);
	std::string remote_jid(
			cJSON_GetObjectItem(json, "remote_jid")->valuestring);
	std::string keyId(cJSON_GetObjectItem(json, "keyId")->valuestring);
	std::string data(cJSON_GetObjectItem(json, "data")->valuestring);
	Key* key = new Key(remote_jid,
			cJSON_GetObjectItem(json, "from_me")->valueint, keyId);
	FMessage* fmsg = new FMessage(key);
	fmsg->data = data;
	fmsg->media_wa_type = cJSON_GetObjectItem(json, "media_wa_type")->valueint;
	fmsg->status = cJSON_GetObjectItem(json, "status")->valueint;
	if (cJSON_GetObjectItem(json, "media_url")->type != cJSON_NULL) {
		fmsg->media_url = cJSON_GetObjectItem(json, "media_url")->valuestring;
	}
	if (cJSON_GetObjectItem(json, "media_name")->type != cJSON_NULL) {
		fmsg->media_name = cJSON_GetObjectItem(json, "media_name")->valuestring;
	}
	if (cJSON_GetObjectItem(json, "media_size")->type != cJSON_NULL) {
		fmsg->media_size = cJSON_GetObjectItem(json, "media_size")->valueint;
	}
	if (cJSON_GetObjectItem(json, "media_duration_seconds")->type != cJSON_NULL) {
		fmsg->media_duration_seconds = cJSON_GetObjectItem(json,
				"media_duration_seconds")->valueint;
	}
	if (cJSON_GetObjectItem(json, "longitude")->type != cJSON_NULL) {
		fmsg->longitude = cJSON_GetObjectItem(json, "longitude")->valuedouble;
	}
	if (cJSON_GetObjectItem(json, "latitude")->type != cJSON_NULL) {
		fmsg->latitude = cJSON_GetObjectItem(json, "latitude")->valuedouble;
	}

	_LOGDATA("Message key = %s, data = %s",
			key->toString().c_str(), fmsg->data.c_str());
	cJSON_Delete(json);
	return fmsg;
}

/****
 * JS handlers
 */

PDL_bool WebosBGApp::sendTyping(PDL_JSParameters *params) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDTYPING;
	userEvent.data1 = new std::string(PDL_GetJSParamString(params, 0));
	userEvent.data2 = (void*) PDL_GetJSParamInt(params, 1);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::doStateRequest(PDL_JSParameters *params) {
	_LOGDATA("doStateRequest Event: received");
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_DOSTATEREQUEST;
	userEvent.data1 = new std::string(PDL_GetJSParamString(params, 0));
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendMessageReceived(PDL_JSParameters *params) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDMESSAGERECEIVED;
	FMessage* msg = WebosBGApp::fromJSONtoMessage(
			PDL_GetJSParamString(params, 0));
	userEvent.data1 = msg;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendMessage(PDL_JSParameters *params) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDMESSAGE;
	userEvent.data1 = new std::string(PDL_GetJSParamString(params, 0));
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::networkStatusChanged(PDL_JSParameters *params) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_NETWORKSTATUSCHANGED;
	userEvent.data1 = (void*) PDL_GetJSParamInt(params, 0);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

/**
 * params
 * 0 - userId
 * 1 - password
 * 2 - pushName
 *
 * returns: true / false
 */
PDL_bool WebosBGApp::pluginTestLogin(PDL_JSParameters *params) {
	std::string userId(PDL_GetJSParamString(params, 0));
	std::string password(PDL_GetJSParamString(params, 1));
	std::string pushName(PDL_GetJSParamString(params, 2));

	const char *p[1] = { "false" };
	PDL_Err err = PDL_CallJS("runnerExecuting", p, 1);
	if (err != PDL_NOERROR) {
		_LOGDATA("error: %s\n", PDL_GetError());
	}

	_instance->finalize();

	_LOGDATA("fin finalize");

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_TESTLOGIN;
	std::string* data = new std::string[3];
	data[0] = userId;
	data[1] = password;
	data[2] = pushName;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

/**
 * params
 * 0 - userId
 * 1 - password
 * 2 - pushName
 */
PDL_bool WebosBGApp::pluginStartBG(PDL_JSParameters *params) {
	_LOGDATA("Called pluginStargBG");
	std::string userId(PDL_GetJSParamString(params, 0));
	std::string password(PDL_GetJSParamString(params, 1));
	std::string pushName(PDL_GetJSParamString(params, 2));
	std::string bgMode(PDL_GetJSParamString(params, 3));

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_STARTBG;
	std::string* data = new std::string[4];
	data[0] = userId;
	data[1] = password;
	data[2] = pushName;
	data[3] = bgMode;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendActive(PDL_JSParameters *params) {
	_LOGDATA("Called sendActive");
	int active = PDL_GetJSParamInt(params, 0);

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDACTIVE;
	userEvent.data1 = (void *) active;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendCodeRequest(PDL_JSParameters *params) {
	_LOGDATA("Called sendCodeRequest");
	std::string cc(PDL_GetJSParamString(params, 0));
	std::string in(PDL_GetJSParamString(params, 1));
	std::string method(PDL_GetJSParamString(params, 2));

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDCODEREQUEST;
	std::string* data = new std::string[3];
	data[0] = cc;
	data[1] = in;
	data[2] = method;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendRegisterRequest(PDL_JSParameters *params) {
	_LOGDATA("Called sendRegisterRequest");
	std::string cc(PDL_GetJSParamString(params, 0));
	std::string in(PDL_GetJSParamString(params, 1));
	std::string password(PDL_GetJSParamString(params, 2));
	std::string code(PDL_GetJSParamString(params, 3));

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDREGISTERREQUEST;
	std::string* data = new std::string[4];
	data[0] = cc;
	data[1] = in;
	data[2] = password;
	data[3] = code;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendUploadRequest(PDL_JSParameters *params) {
	_LOGDATA("Called sendUploadRequest");
	std::string msgId(PDL_GetJSParamString(params, 0));
	std::string filePath(PDL_GetJSParamString(params, 1));
	std::string contentType(PDL_GetJSParamString(params, 2));
	int isTemp = PDL_GetJSParamInt(params, 3);

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDUPLOADREQUEST;
	std::string* data = new std::string[4];
	data[0] = msgId;
	data[1] = filePath;
	data[2] = contentType;
	data[3] = (isTemp == 1? "true": "false");
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendLeaveGroup(PDL_JSParameters *params) {
	_LOGDATA("Called sendLeaveGroup");
	std::string groupJid(PDL_GetJSParamString(params, 0));

	bool error = false;

	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendLeaveGroup(groupJid);
			} catch (WAException& ex) {
				_LOGDATA("error sending leave group: %s", groupJid.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendAddParticipants(PDL_JSParameters *params) {
	std::string groupJid(PDL_GetJSParamString(params, 0));
	_LOGDATA("Called sendAddParticipants %s", PDL_GetJSParamString(params, 1));
	cJSON* participantsJson = cJSON_Parse(PDL_GetJSParamString(params, 1));

	int size = cJSON_GetArraySize(participantsJson);
	std::vector<std::string> participants(size);
	for (int i = 0; i < size; i++) {
		std::string jid(cJSON_GetArrayItem(participantsJson, i)->valuestring);
		_LOGDATA("participant to add %s", jid.c_str());
		participants[i] = jid;
	}

	cJSON_Delete(participantsJson);
	bool error = false;
	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendAddParticipants(groupJid, participants);
			} catch (WAException& ex) {
				_LOGDATA("error sending add participants to group: %s",
						groupJid.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendRemoveParticipants(PDL_JSParameters *params) {
	_LOGDATA("Called sendRemoveParticipants");
	std::string groupJid(PDL_GetJSParamString(params, 0));
	cJSON* participantsJson = cJSON_Parse(PDL_GetJSParamString(params, 1));

	int size = cJSON_GetArraySize(participantsJson);
	std::vector<std::string> participants(size);
	for (int i = 0; i < size; i++) {
		std::string jid(cJSON_GetArrayItem(participantsJson, i)->valuestring);
		participants[i] = jid;
	}

	cJSON_Delete(participantsJson);
	bool error = false;
	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendRemoveParticipants(groupJid, participants);
			} catch (WAException& ex) {
				_LOGDATA("error sending remove participants to group: %s",
						groupJid.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendSetNewSubject(PDL_JSParameters *params) {
	_LOGDATA("Called sendSetNewSubject");
	std::string groupJid(PDL_GetJSParamString(params, 0));
	std::string subject(PDL_GetJSParamString(params, 1));

	bool error = false;
	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendSetNewSubject(groupJid, subject);
			} catch (WAException& ex) {
				_LOGDATA("error sending new subject %s for group: %s",
						subject.c_str(), groupJid.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendCreateGroupChat(PDL_JSParameters *params) {
	std::string* subject = new std::string(PDL_GetJSParamString(params, 0));
	_LOGDATA("Called createGroupChat: %s", subject->c_str());

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_CREATEGROUPCHAT;
	userEvent.data1 = subject;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendEndGroup(PDL_JSParameters *params) {
	_LOGDATA("Called sendEndGroup");
	std::string groupJid(PDL_GetJSParamString(params, 0));

	bool error = false;

	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendLeaveGroup(groupJid);
			} catch (WAException& ex) {
				_LOGDATA("error sending end group: %s", groupJid.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}

	return PDL_TRUE;
}

PDL_bool WebosBGApp::stopUploadRequest(PDL_JSParameters *params) {
	_LOGDATA("Called stopUploadRequest");
	std::string msgId(PDL_GetJSParamString(params, 0));

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_STOPUPLOADREQUEST;
	std::string* data = new std::string[1];
	data[0] = msgId;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::exitPlugin(PDL_JSParameters *params) {
	_LOGDATA("Called exitPlugin");
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_QUIT;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::nextMessageKeyId(PDL_JSParameters *params) {
	std::string id = FMessage::nextKeyIdNumber();
	PDL_JSReply(params, id.c_str());

	return PDL_TRUE;
}

PDL_bool WebosBGApp::resizeImage(PDL_JSParameters *params) {
	std::string source(PDL_GetJSParamString(params, 0));
	std::string target(PDL_GetJSParamString(params, 1));
	int resolution = PDL_GetJSParamInt(params, 2);

	char buffer[1024];
	PDL_GetDataFilePath(target.c_str(), buffer, 1024);

	JpegImageResizer imgResizer;
	std::string newTarget(buffer);
	int r = imgResizer.resizeImage(source, newTarget, resolution);
	PDL_JSReply(params, (r == 0?buffer:"false"));

	return PDL_TRUE;
}

PDL_bool WebosBGApp::closeConnection(PDL_JSParameters *params) {
	_LOGDATA("Called closeConnection");
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_CLOSECONNECTION;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendStatusUpdate(PDL_JSParameters *params) {
	_LOGDATA("Called sendStatusUpdate");
	std::string status(PDL_GetJSParamString(params, 0));
	bool error = false;

	if (BGApp::getInstance()->_xmpprunner != NULL) {
		WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
		if (fConn != NULL) {
			try {
				fConn->sendStatusUpdate(status);
			} catch (WAException& ex) {
				_LOGDATA("error sending status update %s", status.c_str());
				error = true;
			}
		} else
			error = true;
	} else
		error = true;

	if (error) {
		PDL_JSException(params, "error");
		return PDL_FALSE;
	}
	return PDL_TRUE;
}


PDL_bool WebosBGApp::md5String(PDL_JSParameters *params) {
	std::string data(PDL_GetJSParamString(params, 0));
	std::string result = Utilities::md5String(data);
	PDL_JSReply(params, result.c_str());

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendGetPictureIds(PDL_JSParameters *params) {
	_LOGDATA("Called sendGetPictureIds");
	cJSON *json = cJSON_Parse(PDL_GetJSParamString(params, 0));
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDGETPICTUREIDS;
	userEvent.data1 = json;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendGetPicture(PDL_JSParameters *params) {
	_LOGDATA("Called sendGetPicture");
	std::string jid(PDL_GetJSParamString(params, 0));
	std::string type(PDL_GetJSParamString(params, 1));
	std::string oldId(PDL_GetJSParamString(params, 2));
	std::string newId(PDL_GetJSParamString(params, 3));

	std::string* data = new std::string[4];
	data[0] = jid;
	data[1] = type;
	data[2] = oldId;
	data[3] = newId;

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDGETPICTURE;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::sendSetPicture(PDL_JSParameters *params) {
	_LOGDATA("Called sendSetPicture");
	std::string jid(PDL_GetJSParamString(params, 0));
	std::string path(PDL_GetJSParamString(params, 1));
	std::string cropInfo(PDL_GetJSParamString(params, 2));

	std::string* data = new std::string[3];
	data[0] = jid;
	data[1] = path;
	data[2] = cropInfo;

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDSETPICTURE;
	userEvent.data1 = data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	return PDL_TRUE;
}

PDL_bool WebosBGApp::removeFile(PDL_JSParameters *params) {
	_LOGDATA("Called removeFile");
	std::string filePath(PDL_GetJSParamString(params, 0));

	remove(filePath.c_str());

	return PDL_TRUE;
}



int WebosBGApp::registerJSCallBacks() {
	int ret = 0;
	ret += PDL_RegisterJSHandler("testLogin", pluginTestLogin);
	ret += PDL_RegisterJSHandler("startBG", pluginStartBG);
	ret += PDL_RegisterJSHandler("networkStatusChanged", networkStatusChanged);
	ret += PDL_RegisterJSHandler("nextMessageKeyId", nextMessageKeyId);
	ret += PDL_RegisterJSHandler("sendMessage", sendMessage);
	ret += PDL_RegisterJSHandler("sendTyping", sendTyping);
	ret += PDL_RegisterJSHandler("doStateRequest", doStateRequest);
	ret += PDL_RegisterJSHandler("sendCreateGroupChat", sendCreateGroupChat);
	ret += PDL_RegisterJSHandler("sendMessageReceived", sendMessageReceived);
	ret += PDL_RegisterJSHandler("closeConnection", closeConnection);
	ret += PDL_RegisterJSHandler("sendActive", sendActive);
	ret += PDL_RegisterJSHandler("md5String", md5String);
	ret += PDL_RegisterJSHandler("exitPlugin", exitPlugin);
	ret += PDL_RegisterJSHandler("sendCodeRequest", sendCodeRequest);
	ret += PDL_RegisterJSHandler("sendRegisterRequest", sendRegisterRequest);
	ret += PDL_RegisterJSHandler("sendUploadRequest", sendUploadRequest);
	ret += PDL_RegisterJSHandler("stopUploadRequest", stopUploadRequest);
	ret += PDL_RegisterJSHandler("sendLeaveGroup", sendLeaveGroup);
	ret += PDL_RegisterJSHandler("sendEndGroup", sendEndGroup);
	ret += PDL_RegisterJSHandler("sendAddParticipants", sendAddParticipants);
	ret += PDL_RegisterJSHandler("sendRemoveParticipants",
			sendRemoveParticipants);
	ret += PDL_RegisterJSHandler("sendSetNewSubject", sendSetNewSubject);
	ret += PDL_RegisterJSHandler("resizeImage", resizeImage);
	ret += PDL_RegisterJSHandler("sendStatusUpdate", sendStatusUpdate);
	ret += PDL_RegisterJSHandler("sendGetPictureIds", sendGetPictureIds);
	ret += PDL_RegisterJSHandler("sendGetPicture", sendGetPicture);
	ret += PDL_RegisterJSHandler("sendSetPicture", sendSetPicture);
	ret += PDL_RegisterJSHandler("removeFile", removeFile);
	return ret;
}

/****************************************************************************************
 * Whatsup EVENTS
 ****************************/

void WebosBGApp::onMessageForMe(FMessage* message, bool duplicate)
throw (WAException) {
	_LOGDATA("new incoming message %s from %s",
			message->key->id.c_str(), message->key->remote_jid.c_str());

	if (duplicate) {
		return;
	}

	if (message->media_wa_type == FMessage::WA_TYPE_CONTACT) {
		char buffer[512];
		std::string fileName = message->media_name + ".vcf";
		PDL_GetDataFilePath(fileName.c_str(), buffer, 512);

		if (Utilities::saveStringToFile(message->data, buffer)) {
			//WebosBGApp::MOJOWHATSUP_MEDIA_DIR + message->media_name
			//+ ".vcf")) {
			message->media_url = WebosBGApp::MOJOWHATSUP_MEDIA_DIR
					+ message->media_name + ".vcf";
		}
	}

	if (!message->key->from_me) {
		message->status = 128;
	}

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONMESSAGEFORME;
	userEvent.data1 = WebosBGApp::fromMessageToJSON(message);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::onMessageStatusUpdate(FMessage* message) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONMESSAGESTATUSUPDATE;
	userEvent.data1 = WebosBGApp::fromMessageToJSON(message);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::onSendGetPictureIds(std::map<std::string, std::string>* ids) {
	cJSON* json = cJSON_CreateArray();
	std::map<std::string,std::string>::iterator it;
	for (it = ids->begin(); it != ids->end(); it++) {
		cJSON* object = cJSON_CreateObject();
		cJSON_AddStringToObject(object, "jid", it->first.c_str());
		cJSON_AddStringToObject(object, "id", it->second.c_str());
		cJSON_AddItemToArray(json, object);
	}

	const char* params[1];
	params[0] = cJSON_PrintUnformatted(json);
	PDL_Err err = PDL_CallJS("onSendGetPictureIds", params, 1);
	if (err != PDL_NOERROR) {
		_LOGDATA("error: %s\n", PDL_GetError());
	}
	cJSON_Delete(json);
}

void WebosBGApp::onSendGetPicture(const std::string& jid, const std::string& data, const std::string& oldId, const std::string& newId) {
	char buffer[1024];
	buffer[0] = '\0';

	if (jid.compare("error") != 0) {
		std::string fileName = Utilities::removeWaDomainFromJid(jid) + "-" + oldId + ".jpg";

		PDL_GetDataFilePath(fileName.c_str(), buffer, 1024);
		remove(buffer);

		fileName = Utilities::removeWaDomainFromJid(jid) + "-" + newId + ".jpg";
		PDL_GetDataFilePath(fileName.c_str(), buffer, 1024);

		if (!Utilities::saveBytesToFile(data, buffer)) {
			buffer[0] = '\0';
		}
	}

	const char* params[2];

	params[0] = jid.c_str();
	params[1] = &buffer[0];
	_LOGDATA("bg picturepath %s", &buffer[0]);
	PDL_Err err = PDL_CallJS("onSendGetPicture", params, 2);
	if (err != PDL_NOERROR) {
		_LOGDATA("error: %s\n", PDL_GetError());
	}
}

void WebosBGApp::sendOfflineMessages() {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDOFFLINEMESSAGES;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::sendNewStateToFG(int new_state) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDNEWSTATETOFG;
	userEvent.data1 = (void*) new_state;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::sendContactInfoToFG(const std::string& jid, int state,
		time_t lastSeen) {
	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_SENDCONTACTINFOTOFG;
	std::string* data = new std::string[3];
	data[0] = jid;
	data[1] = Utilities::intToStr(state);
	data[2] = Utilities::intToStr((int) lastSeen);
	userEvent.data1 = (void*) data;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::onGroupAddUser(const std::string& gjid,
		const std::string& jid) {
	_LOGDATA("GRP seeing group add user %s for %s", jid.c_str(), gjid.c_str());

	if (jid.compare(this->_myPlainJid) == 0) {
		try {
			this->_xmpprunner->_connection->sendGetGroupInfo(gjid);
		} catch (WAException& ex) {
			_LOGDATA( "error requesting group info after being added: %s",
					gjid.c_str());
		}
	}

	try {
		this->_xmpprunner->_connection->sendGetParticipants(gjid);
	} catch (exception& ex) {
		_LOGDATA( "error requesting participants after being added: %s",
				gjid.c_str());
	}

	FMessage* msg = new FMessage(gjid, false, "");
	msg->notifyname = jid;
	msg->status = FMessage::STATUS_USER_ADDED;

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONMESSAGEFORME;
	userEvent.data1 = WebosBGApp::fromMessageToJSON(msg);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	delete msg;
}

void WebosBGApp::onPictureChanged(const std::string& jid, const std::string& author, bool set) {
	_LOGDATA("seeing picture changed for %s author %s", jid.c_str(), author.c_str());

	//	if (set) {
	//		try {
	//			this->_xmpprunner->_connection->sendGetPicture(jid, "image");
	//		} catch (exception& ex) {
	//			_LOGDATA("error send get picture:onPictureChanged");
	//		}
	//	}

	const char* params[3];
	params[0] = jid.c_str();
	params[1] = author.c_str();
	params[2] = (set? "true": "false");

	PDL_Err err = PDL_CallJS("onPictureChanged", params, 3);
	if (err != PDL_NOERROR) {
		_LOGDATA("error: %s\n", PDL_GetError());
	}
}

void WebosBGApp::onGroupRemoveUser(const std::string& gjid,
		const std::string& jid) {
	_LOGDATA("GRP seeing group remove user %s for %s",
			jid.c_str(), gjid.c_str());

	try {
		this->_xmpprunner->_connection->sendGetParticipants(gjid);
	} catch (WAException& ex) {
		_LOGDATA( "error requesting participants after being removed: %s",
				gjid.c_str());
	}

	FMessage* msg = new FMessage(gjid, false, "");
	msg->notifyname = jid;
	msg->status = FMessage::STATUS_USER_REMOVED;

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONMESSAGEFORME;
	userEvent.data1 = WebosBGApp::fromMessageToJSON(msg);
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::onGroupCreated(const std::string& jid,
		const std::string& gjid) {
	_LOGDATA("Called on group created");
	if (this->_xmpprunner != NULL) {
		WAConnection* fConn = this->_xmpprunner->_connection;
		this->onGroupInfo(gjid, jid, "", jid, 0, 0);
		if (fConn != NULL) {
			fConn->sendGetGroupInfo(gjid);
		}
	}
}

void WebosBGApp::onGroupNewSubject(const std::string& gjid,
		const std::string& ujid, const std::string& newSubject, int timestamp) {
	_LOGDATA("GRP subject for %s is %s user %s",
			gjid.c_str(), newSubject.c_str(), ujid.c_str());
	cJSON* json = cJSON_CreateObject();
	cJSON_AddStringToObject(json, "gjid", gjid.c_str());
	cJSON_AddNullToObject(json, "owner");
	cJSON_AddStringToObject(json, "subject", newSubject.c_str());
	cJSON_AddStringToObject(json, "subject_owner", ujid.c_str());
	cJSON_AddNumberToObject(json, "subject_t", timestamp);
	cJSON_AddNullToObject(json, "creation_t");

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONGROUPNEWSUBJECT;
	userEvent.data1 = (void*) json;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::onServerProperties(
		std::map<std::string, std::string>* nameValueMap) {
	_LOGDATA("GRP seeing server properties");
	std::map<std::string, std::string>::iterator it;

	cJSON* json = cJSON_CreateObject();
	for (it = nameValueMap->begin(); it != nameValueMap->end(); it++) {
		_LOGDATA("Server property: %s = %s",
				it->first.c_str(), it->second.c_str());
		if (it->first.compare("max_subject") == 0) {
			cJSON_AddItemToObject(json, "max_subject",
					cJSON_CreateNumber(atoi(it->second.c_str())));
		} else if (it->first.compare("max_participants") == 0) {
			cJSON_AddItemToObject(json, "max_participants",
					cJSON_CreateNumber(atoi(it->second.c_str())));
		} else if (it->first.compare("max_groups") == 0) {
			cJSON_AddItemToObject(json, "max_groups",
					cJSON_CreateNumber(atoi(it->second.c_str())));
		}
	}

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONSERVERPROPERTIES;
	userEvent.data1 = (void*) json;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

}

void WebosBGApp::onGroupInfo(const std::string& gjid, const std::string& owner,
		const std::string& subject, const std::string& subject_owner_jid,
		int subject_t, int creation) {
	_LOGDATA("GRP group info for %s subject %s: owner %s: s_o_jid: %s: ",
			gjid.c_str(), subject.c_str(), owner.c_str(), subject_owner_jid.c_str());

	cJSON* json = cJSON_CreateObject();
	cJSON_AddStringToObject(json, "gjid", gjid.c_str());
	cJSON_AddStringToObject(json, "owner", owner.c_str());
	cJSON_AddStringToObject(json, "subject", subject.c_str());
	cJSON_AddStringToObject(json, "subject_owner", subject_owner_jid.c_str());
	cJSON_AddNumberToObject(json, "subject_t", subject_t);
	cJSON_AddNumberToObject(json, "creation_t", creation);

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONGROUPINFO;
	userEvent.data1 = (void*) json;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);

	if (this->_xmpprunner != NULL) {
		WAConnection* fConn = this->_xmpprunner->_connection;
		if (fConn != NULL) {
			fConn->sendGetParticipants(gjid);
		}
	}
}

void WebosBGApp::onGetParticipants(const std::string& gjid,
		const std::vector<string>& participants) {
	size_t size = participants.size();
	_LOGDATA("GRP got %d participants for %s", size, gjid.c_str());

	cJSON* jsonArray = cJSON_CreateArray();
	for (int i = 0; i < participants.size(); i++) {
		_LOGDATA("participant %s: ", participants[i].c_str());
		cJSON* participant = cJSON_CreateObject();
		cJSON_AddItemToObject(participant, "jid",
				cJSON_CreateString(participants[i].c_str()));
		cJSON_AddItemToArray(jsonArray, participant);
	}

	SDL_Event event;
	SDL_UserEvent userEvent;
	userEvent.type = SDL_USEREVENT;
	userEvent.code = USER_EVENT_ONGETPARTICIPANTS;
	userEvent.data1 = new std::string(gjid);
	userEvent.data2 = (void*) jsonArray;
	event.type = SDL_USEREVENT;
	event.user = userEvent;
	FE_PushEvent(&event);
}

void WebosBGApp::sendParticipatingGroupsToFG(
		const std::vector<string>& groups) {

}


/****************************************************************************************
 * EVENT PROCESS
 ****************************/

void WebosBGApp::processUserEvent(const SDL_Event& Event) {
	SDL_mutexP(WebosBGApp::staticMutex);

	switch (Event.user.code) {
	case USER_EVENT_TESTLOGIN: {
		std::string* data = (std::string*) Event.user.data1;
		const char *params[1];
		_LOGDATA("%s %s %s", data[0].c_str(), data[1].c_str(), data[2].c_str());
		if (_instance->testLogin(data[0], data[1], data[2])) {
			params[0] = "true";
		} else {
			params[0] = "false";
		}
		PDL_Err err = PDL_CallJS("testLoginResult", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		delete[] data;
		break;
	}
	case USER_EVENT_STARTBG: {
		std::string* data = (std::string*) Event.user.data1;
		ApplicationData::setData(data[0], data[2], data[1]);
		if (data[3].compare("true") == 0)
			_instance->_bgMode = true;
		else
			_instance->_bgMode = false;
		_instance->finalize();
		_instance->initialize();

		const char *params[1] = { "true" };
		PDL_Err err = PDL_CallJS("runnerExecuting", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
		delete[] data;
		break;
	}
	case USER_EVENT_SENDCODEREQUEST: {
		std::string* data = (std::string*) Event.user.data1;
		try {
			Account* account = new Account();
			std::string response = account->waCodeRequest(data[0], data[1],
					data[2]);

			const char *params[1];
			params[0] = response.c_str();

			PDL_Err err = PDL_CallJS("codeRequestResponse", params, 1);
			if (err != PDL_NOERROR) {
				_LOGDATA("error: %s\n", PDL_GetError());
			}
			delete account;
		} catch (WAException& ex) {
			_LOGDATA("Error sending SMS code request");
		}

		delete[] data;
		break;
	}
	case USER_EVENT_SENDREGISTERREQUEST: {
		std::string* data = (std::string*) Event.user.data1;
		try {
			Account* account = new Account();
			std::string response = account->waRegisterRequest(data[0], data[1],
					data[2], data[3]);

			const char *params[1];
			params[0] = response.c_str();

			PDL_Err err = PDL_CallJS("registerRequestResponse", params, 1);
			if (err != PDL_NOERROR) {
				_LOGDATA("error: %s\n", PDL_GetError());
			}
			delete account;
		} catch (WAException& ex) {
			_LOGDATA("Error sending SMS code request");
		}

		delete[] data;
		break;
	}
	case USER_EVENT_SENDUPLOADREQUEST: {
		std::string* data = (std::string*) Event.user.data1;
		MediaUploader* mediaUploader = new MediaUploader(data[0], data[1],
				data[2], ((data[3].compare("true") == 0)? true: false));

		if ((mediaUploader->thread = SDL_CreateThread(
				WebosBGApp::waUploadHandler, mediaUploader)) == NULL) {
			_LOGDATA("error: %s\n", SDL_GetError());
		} else {
			WebosBGApp::uploads[data[0]] = mediaUploader;
		}
		delete[] data;
		break;
	}
	case USER_EVENT_STOPUPLOADREQUEST: {
		std::string* data = (std::string*) Event.user.data1;
		std::map<std::string, MediaUploader*>::iterator it =
				WebosBGApp::uploads.find(data[0]);
		if (it != WebosBGApp::uploads.end()) {
			SDL_Thread* thread = it->second->thread;
			it->second->exit = true;
		}

		delete[] data;
		break;
	}
	case USER_EVENT_SENDMESSAGE: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				std::string* message = (std::string*) Event.user.data1;
				FMessage* fmsg = WebosBGApp::fromJSONtoMessage(
						message->c_str());
				try {
					fConn->sendMessage(fmsg);
				} catch (WAException& ex) {
					_LOGDATA("error sending message: %s", ex.what());
				}
				delete message;
				delete fmsg;
			} else {
				BGApp::getInstance()->_chatState->userTypingWakeUp();
				_LOGDATA(
						"no connection in bgApp's funrunner, trying typing wakeup");
			}
		}
		break;
	}

	case USER_EVENT_SENDMESSAGERECEIVED: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				FMessage* msg = (FMessage*) Event.user.data1;
				try {
					fConn->sendMessageReceived(msg);
				} catch (WAException& ex) {
					_LOGDATA("error trying to send receipt for %s",
							msg->key->id.c_str());
				}
				delete msg;
			}
		}
		break;
	}

	case USER_EVENT_SENDTYPING: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				std::string* to = (std::string*) Event.user.data1;
				int value = (int) Event.user.data2;
				try {
					if (value == 0) {
						fConn->sendPaused(*to);
					} else {
						fConn->sendComposing(*to);
					}
				} catch (WAException& ex) {
					_LOGDATA("error sending typing: %s", ex.what());
				}
				delete to;
			} else {
				BGApp::getInstance()->_chatState->userTypingWakeUp();
				_LOGDATA(
						"no connection in bgApp's funrunner, trying typing wakeup");
			}
		}
		break;
	}
	case USER_EVENT_DOSTATEREQUEST: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				_LOGDATA("sending stateRequest");
				std::string* to = (std::string*) Event.user.data1;
				try {
					fConn->sendQueryLastOnline(*to);
					fConn->sendPresenceSubscriptionRequest(*to);
				} catch (WAException& ex) {
					_LOGDATA("error sending contact state request: %s",
							ex.what());
				}
				delete to;
			}
		}
		break;
	}
	case USER_EVENT_ONMESSAGEFORME: {
		const char* params[1];
		params[0] = (const char*) Event.user.data1;
		PDL_Err err = PDL_CallJS("messageForMe", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
		free((char*) Event.user.data1);
		break;
	}
	case USER_EVENT_ONMESSAGESTATUSUPDATE: {
		const char* msgString = (const char*) Event.user.data1;
		const char* params[1];
		params[0] = msgString;
		PDL_Err err = PDL_CallJS("messageStatusUpdate", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		free((char*) msgString);

		break;
	}
	case USER_EVENT_SENDOFFLINEMESSAGES: {
		char* params[0];
		PDL_Err err = PDL_CallJS("sendOfflineMessages", NULL, 0);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
		break;
	}
	case USER_EVENT_SENDNEWSTATETOFG: {
		const char* params[1];
		std::string newStateS = Utilities::intToStr((int) Event.user.data1);
		params[0] = newStateS.c_str();
		PDL_Err err = PDL_CallJS("newChatState", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
		break;
	}
	case USER_EVENT_SENDCONTACTINFOTOFG: {
		std::string* data = (std::string*) Event.user.data1;
		const char *params[3];
		params[0] = data[0].c_str();
		params[1] = data[1].c_str();
		params[2] = data[2].c_str();
		_LOGDATA("send Contact info jid = %s, state = %s, lastseen = %s",
				params[0], params[1], params[2]);
		PDL_Err err = PDL_CallJS("contactInfoUpdated", params, 3);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
		delete[] data;
		break;
	}
	case USER_EVENT_NETWORKSTATUSCHANGED: {
		int connected = (int) Event.user.data1;
		BGApp::getInstance()->networkConnectionChanged(connected == 1);
		break;
	}
	case USER_EVENT_ONGROUPINFO: {
		cJSON* json = (cJSON*) Event.user.data1;
		const char* params[1];
		char* text = cJSON_PrintUnformatted(json);
		params[0] = text;

		_LOGDATA("json group info %s", text);

		PDL_Err err = PDL_CallJS("onGroupInfo", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		cJSON_Delete(json);
		free((char*) params[0]);

		break;
	}
	case USER_EVENT_ONSERVERPROPERTIES: {
		cJSON* json = (cJSON*) Event.user.data1;
		const char* params[1];
		params[0] = cJSON_PrintUnformatted(json);
		PDL_Err err = PDL_CallJS("onServerProperties", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		cJSON_Delete(json);
		free((char*) params[0]);

		break;
	}
	case USER_EVENT_ONGROUPNEWSUBJECT: {
		cJSON* json = (cJSON*) Event.user.data1;
		const char* params[1];
		params[0] = cJSON_PrintUnformatted(json);
		PDL_Err err = PDL_CallJS("onGroupNewSubject", params, 1);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		cJSON_Delete(json);
		free((char*) params[0]);

		break;
	}
	case USER_EVENT_ONGETPARTICIPANTS: {
		std::string* gjid = (std::string*) Event.user.data1;
		cJSON* participants = (cJSON*) Event.user.data2;
		const char* params[2];
		params[0] = gjid->c_str();
		params[1] = cJSON_PrintUnformatted(participants);
		PDL_Err err = PDL_CallJS("onGetParticipants", params, 2);
		if (err != PDL_NOERROR) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}

		delete gjid;
		cJSON_Delete(participants);
		free((char*) params[1]);

		break;
	}
	case USER_EVENT_CREATEGROUPCHAT: {
		_LOGDATA("POR AQUI 1");
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			_LOGDATA("POR AQUI 2");
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				_LOGDATA("POR AQUI 3");
				std::string* subject = (std::string*) Event.user.data1;
				try {
					fConn->sendCreateGroupChat(*subject);
				} catch (WAException& ex) {
					_LOGDATA("error sending create group chat: %s",
							subject->c_str());
				}
				delete subject;
			}
		}
		break;
	}
	case USER_EVENT_CLOSECONNECTION: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			BGApp::getInstance()->_xmpprunner->closeConnection();
		}
		break;
	}

	case USER_EVENT_SENDACTIVE: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				int active = (int) Event.user.data1;
				try {
					if (active == 1) {
						fConn->sendActive();
					} else {
						fConn->sendInactive();
					}
				} catch (WAException& ex) {
					_LOGDATA("error sending active/inactive status: %d",
							active);
				}
			}
		}
		break;
	}

	case USER_EVENT_SENDGETPICTUREIDS: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				cJSON* json = (cJSON*) Event.user.data1;
				try {
					std::vector<string> jids;
					for (int i = 0; i < cJSON_GetArraySize(json); i++) {
						jids.push_back(cJSON_GetArrayItem(json, i)->valuestring);
					}
					fConn->sendGetPictureIds(jids);
				} catch (WAException& ex) {
					_LOGDATA("error sending get picture ids");
				}
				cJSON_Delete(json);
			}
		}
		break;
	}

	case USER_EVENT_SENDGETPICTURE: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				std::string* data = (std::string*) Event.user.data1;
				try {
					fConn->sendGetPicture(data[0], data[1], data[2], data[3]);
				} catch (WAException& ex) {
					_LOGDATA("error sending get picture");
				}
				delete [] data;
			}
		}
		break;
	}
	case USER_EVENT_SENDSETPICTURE: {
		if (BGApp::getInstance()->_xmpprunner != NULL) {
			WAConnection* fConn = BGApp::getInstance()->_xmpprunner->_connection;
			if (fConn != NULL) {
				std::string* data = (std::string*) Event.user.data1;
				std::string jid = data[0];
				std::string path = data[1];

				try {
					JpegImageResizer resizer;

					if (path.compare("") != 0) {
						cJSON* json = cJSON_Parse(data[2].c_str());
						int size = cJSON_GetObjectItem(json, "size")->valueint;
						double scale = cJSON_GetObjectItem(json, "scale")->valuedouble;
						int x = cJSON_GetObjectItem(json, "x")->valueint;
						int y = cJSON_GetObjectItem(json, "y")->valueint;

						char buffer[1024];
						std::string tempFile = "temp" + Utilities::getNameFromPath(path);
						PDL_GetDataFilePath(tempFile.c_str(), buffer, 1024);
						std::string destFile(buffer);
						_LOGDATA("Temp file %s", destFile.c_str());
						if (resizer.makeProfileImage2(path, destFile, size, scale, x, y, 64512) == 0) {
							std::vector<unsigned char>* bytes;
							if ((bytes = Utilities::loadFileToBytes(destFile)) != NULL) {
								remove(destFile.c_str());
								_LOGDATA("sending picture data %d", bytes->size());
								std::string* data = new std::string(bytes->begin(), bytes->end());
								fConn->sendSetPicture(jid, data);
								delete bytes;
							}
						}
						cJSON_Delete(json);
					} else {
						fConn->sendSetPicture(jid, NULL);
					}
				} catch (WAException& ex) {
					_LOGDATA("error sending get picture %s", ex.what());
					WebosBGApp::_instance->onSendGetPicture("error","","","");
				}
				delete [] data;
			}
		}
		break;
	}
	}

	SDL_mutexV(WebosBGApp::staticMutex);
}

