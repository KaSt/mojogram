/*
 * WALogin.h
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#ifndef WALOGIN_H_
#define WALOGIN_H_

#include "BinTreeNodeReader.h"
#include "BinTreeNodeWriter.h"
#include "WAConnection.h"
#include <string>

class WAConnection;

class WALogin {
private:
	static const std::string NONCE_KEY;
	BinTreeNodeReader* inn;
	BinTreeNodeWriter* out;
	WAConnection* connection;

	void sendResponse(const std::string& challengeData);
	void sendFeatures();
	void sendAuth();
	std::string readFeaturesAndChallenge();
	void readSuccess();
	std::string getResponse(const std::string& challenge);

public:
	WALogin(BinTreeNodeReader *reader, BinTreeNodeWriter *writer);
	void login();
	void setConnection(WAConnection *connection);
	BinTreeNodeReader *getTreeNodeReader();
	BinTreeNodeWriter *getTreeNodeWriter();
	virtual ~WALogin();
};

#endif /* WALOGIN_H_ */
