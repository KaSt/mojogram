/*
 * BGApp.h
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#ifndef BGAPP_H_
#define BGAPP_H_

#include "XmppRunner.h"
#include "WAConnection.h"
#include "SDL.h"
#include "ChatState.h"
#include <string>
#include <time.h>

class XmppRunner;

class BGApp: public  WAListener, public WAGroupListener {
protected:
	BGApp();
	virtual ~BGApp();
	bool _gotGroups;
	static BGApp* _instance;
	bool _initialized;
	std::string _myPlainJid;
	time_t _lastXMPPRunnerKill;

	static int initialXMPPConnectionThreadCallback(void *data);
	static int doConnect1TrheadCallBack(void *data);

public:
	XmppRunner* _xmpprunner;
	SDL_Thread* _xmppthread;
	ChatState* _chatState;
	bool _isNetworkConnected;
	SDL_mutex* _mutex;

	static BGApp* getInstance();
	static void setInstance(BGApp* app);

	bool gotGroups();
	void initialize();
	void finalize();
	bool canConnect();
	void networkConnectionChanged(bool isConnected);
	bool testLogin(const std::string& userId, const std::string& password, const std::string& pushName);
	virtual void sendOfflineMessages()=0;
	virtual void sendNewStateToFG(int new_state)=0;
	virtual void sendParticipatingGroupsToFG(const std::vector<string>& groups)=0;
	virtual void sendContactInfoToFG(const std::string& jid, int state, time_t lastSeen)=0;


	void onPing(const std::string& id) throw (WAException);
	void onMessageError(FMessage* message, int paramInt);
	void onPingResponseReceived();
	void onClientConfigReceived(const std::string& paramString);
	void onLastSeen(const std::string& paramString1, int paramInt, std::string* paramString2);
	void onAccountChange(int paramInt, long paramLong);
	void onPrivacyBlockListAdd(const std::string& paramString);
	void onPrivacyBlockListClear();
	void onDirty(const std::map<string,string>& paramHashtable);
	void onDirtyResponse(int paramHashtable);
	void onRelayRequest(const std::string& paramString1, int paramInt, const std::string& paramString2);

	void onParticipatingGroups(const std::vector<string>& groups);
	void onAvailable(const std::string& paramString, bool paramBoolean);
	void onIsTyping(const std::string& paramString, bool paramBoolean);
	void onGroupInfoFromList(const std::string& gjid, const std::string& owner, const std::string& subject, const std::string& subject_owner_jid, int subject_t, int creation);
	void onOwningGroups(const std::vector<string>& groups);
	void onSetSubject(const std::string& paramString);
	void onAddGroupParticipants(const std::string& paramString, const std::vector<string>& paramVector, int paramHashtable);
	void onRemoveGroupParticipants(const std::string& paramString, const std::vector<string>& paramVector, int paramHashtable);
	void onLeaveGroup(const std::string& from);
};

#endif /* BGAPP_H_ */
