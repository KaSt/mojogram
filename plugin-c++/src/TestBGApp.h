/*
 * TestBGApp.h
 *
 *  Created on: 26/07/2012
 *      Author: Antonio
 */

#ifndef TESTBGAPP_H_
#define TESTBGAPP_H_

#include "BGApp.h"

class TestBGApp: public BGApp {
public:
	TestBGApp();
	~TestBGApp();

	void sendOfflineMessages() {};
	void sendNewStateToFG(int new_state) {};
	void sendParticipatingGroupsToFG(const std::vector<string>& groups) {};
	void sendContactInfoToFG(const std::string& jid, int state, time_t lastSeen) {};

	void onGroupAddUser(const std::string& paramString1, const std::string& paramString2) {};
	void onGroupRemoveUser(const std::string& paramString1, const std::string& paramString2) {};
	void onGroupNewSubject(const std::string& from, const std::string& author, const std::string& newSubject, int paramInt) {};
	void onServerProperties(std::map<std::string, std::string>* nameValueMap) {};
	void onGroupInfo(const std::string& paramString1, const std::string& paramString2, const std::string& paramString3, const std::string& paramString4, int paramInt1, int paramInt2) {};
	void onGetParticipants(const std::string& gjid, const std::vector<string>& participants) {};
	void onGroupCreated(const std::string& paramString1, const std::string& paramString2) {};

	void onSendGetPictureIds(std::map<string,string>* ids) {};
	void onSendGetPicture(const std::string& jid, const std::string& data, const std::string& oldId, const std::string& newId) {};
	void onPictureChanged(const std::string& from, const std::string& author, bool set) {};
	void onMessageForMe(FMessage* paramFMessage, bool paramBoolean) throw (WAException) {};
	void onMessageStatusUpdate(FMessage* paramFMessage) {};
};

#endif /* TESTBGAPP_H_ */
