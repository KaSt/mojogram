/*
 * WALogin.cpp
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#include "WALogin.h"
#include "ByteArray.h"
#include "utilities.h"
#include "ProtocolTreeNode.h"
#include "WAException.h"
#include "base64.h"
#include <iostream>
#include <vector>
#include <map>
#include <stdlib.h>


using namespace Utilities;

const std::string WALogin::NONCE_KEY = "nonce=\"";

WALogin::WALogin(BinTreeNodeReader *reader, BinTreeNodeWriter *writer) {
	this->inn = reader;
	this->out = writer;
}

void WALogin::setConnection(WAConnection *connection) {
	this->connection = connection;
}

void WALogin::login() {
	this->out->streamStart(this->connection->domain, this->connection->resource);

	_LOGDATA("sent stream start");

	sendFeatures();

	_LOGDATA("sent features");

	sendAuth();

	_LOGDATA("send auth");

	this->inn->streamStart();

	_LOGDATA("read stream start");

	std::string challengedata = readFeaturesAndChallenge();

	_LOGDATA("read features and challenge");

	sendResponse(challengedata);

	_LOGDATA("sent response");

	readSuccess();

}

BinTreeNodeReader* WALogin::getTreeNodeReader() {
	return this->inn;
}

BinTreeNodeWriter* WALogin::getTreeNodeWriter() {
	return this->out;
}

std::string WALogin::getResponse(const std::string& challenge) {
	unsigned char md5_buffer[MD5_DIGEST_SIZE];

	size_t i = challenge.find(WALogin::NONCE_KEY);
	i += WALogin::NONCE_KEY.length();

	size_t j = challenge.find('"', i);
	std::string nonce = challenge.substr(i,j-i);

	std::string cnonce = str(absLong(randLong()), 36);
	_LOGDATA("cnonce = %s", cnonce.c_str());
	std::string nc = "00000001";
	std::string cinfo(this->connection->user + ":" + this->connection->domain + ":" + this->connection->password);

	_LOGDATA("cinfo = %s", cinfo.c_str());

	ByteArrayOutputStream bos;
	_LOGDATA((char*) md5digest((unsigned char*) cinfo.data(), cinfo.length(), md5_buffer), MD5_DIGEST_SIZE);
	bos.write(md5digest((unsigned char*) cinfo.data(), cinfo.length(), md5_buffer), MD5_DIGEST_SIZE);
	bos.write(58);
	bos.write(nonce);
	bos.write(58);
	bos.write(cnonce);
	// bos.print();

	std::string digest_uri = "xmpp/" + this->connection->domain;
	std::vector<unsigned char>* A1 = bos.toByteArray();
	std::string A2 = "AUTHENTICATE:" + digest_uri;
	std::string KD((char*) bytesToHex(md5digest(&A1->front(), A1->size(), md5_buffer), MD5_DIGEST_SIZE), MD5_DIGEST_SIZE * 2);
	KD += + ":" + nonce + ":" + nc + ":" + cnonce + ":auth:" + std::string((char*) bytesToHex(md5digest((unsigned char*) A2.data(), A2.size(), md5_buffer), MD5_DIGEST_SIZE), MD5_DIGEST_SIZE*2);

	_LOGDATA("KD = %s", KD.c_str());

	std::string response((char*) bytesToHex(md5digest((unsigned char*) KD.data(), KD.size(), md5_buffer), MD5_DIGEST_SIZE), MD5_DIGEST_SIZE*2);

	_LOGDATA("response = %s", response.c_str());

	std::string bigger_response;
	bigger_response.append("realm=\"");
	bigger_response.append(this->connection->domain);
	bigger_response.append("\",response=");
	bigger_response.append(response);
	bigger_response.append(",nonce=\"");
	bigger_response.append(nonce);
	bigger_response.append("\",digest-uri=\"");
	bigger_response.append(digest_uri);
	bigger_response.append("\",cnonce=\"");
	bigger_response.append(cnonce);
	bigger_response.append("\",qop=auth");
	bigger_response.append(",username=\"");
	bigger_response.append(this->connection->user);
	bigger_response.append("\",nc=");
	bigger_response.append(nc);

	_LOGDATA("biggerresponse = %s", bigger_response.c_str());

	delete A1;

	return bigger_response;
}

void WALogin::sendResponse(const std::string& challengeData) {
	std::string response = this->getResponse(challengeData);
	std::map<string, string> *attributes = new std::map<string,string>();
	(*attributes)["xmlns"] = "urn:ietf:params:xml:ns:xmpp-sasl";
	ProtocolTreeNode node("response", attributes, new std::string(base64_encode((unsigned char*) response.data(), response.size())));

	this->out->write(&node);
}

void WALogin::sendFeatures() {
	ProtocolTreeNode* child = new ProtocolTreeNode("receipt_acks", NULL);
	std::vector<ProtocolTreeNode*>* children = new std::vector<ProtocolTreeNode*>();
	children->push_back((!this->connection->supports_receipt_acks ? NULL : child));
	ProtocolTreeNode node("stream:features", NULL, NULL, children);
	this->out->write(&node, false);
}

void WALogin::sendAuth() {
	std::map<string, string>* attributes = new std::map<string, string>();
	(*attributes)["xmlns"] = "urn:ietf:params:xml:ns:xmpp-sasl";
	(*attributes)["mechanism"] = "DIGEST-MD5-1";
	ProtocolTreeNode node("auth", attributes);
	this->out->write(&node);
}

std::string WALogin::readFeaturesAndChallenge() {
	bool server_supports_receipt_acks = false;
	ProtocolTreeNode* root;
	while ((root = this->inn->nextTree()) != NULL) {
		if (ProtocolTreeNode::tagEquals(root, "stream:features")) {
			server_supports_receipt_acks = root->getChild("receipt_acks") != NULL;
			delete root;
			continue;
		}
		if (ProtocolTreeNode::tagEquals(root, "challenge")) {
			this->connection->supports_receipt_acks = ((this->connection->supports_receipt_acks) && (server_supports_receipt_acks));
			std::string data =  base64_decode(*root->data);
			delete root;
			return data;
		}
	}
	throw WAException("fell out of loop in readFeaturesAndChallenge");
}

void WALogin::readSuccess() {
	ProtocolTreeNode* node = this->inn->nextTree();

	if (ProtocolTreeNode::tagEquals(node, "failure")) {
		_LOGDATA("login failure %s", node->toString().c_str());
		throw WAException("Login failure",WAException::LOGIN_FAILURE_EX, WAException::LOGIN_FAILURE_EX_TYPE_PASSWORD);
	}

	ProtocolTreeNode::require(node, "success");
	std::string* expiration = node->getAttributeValue("expiration");
	if (expiration != NULL) {
		this->connection->expire_date = atol(expiration->c_str());
		if (this->connection->expire_date == 0)
			throw WAException("invalid expire date: " + *expiration);
	}

	std::string* kind = node->getAttributeValue("kind");
	if (kind != NULL && kind->compare("paid") == 0)
		this->connection->account_kind = 1;
	else if (kind != NULL && kind->compare("free") == 0)
		this->connection->account_kind = 0;
	else
		this->connection->account_kind = -1;
	std::string* status = node->getAttributeValue("status");
	if (status != NULL && status->compare("expired") == 0) {
		throw WAException("Account expired on" + std::string(ctime(&this->connection->expire_date)));
	}
	if (status != NULL && status->compare("active") == 0) {
		if (expiration == NULL) {
			 throw WAException("active account with no expiration");
		}
	} else
		this->connection->account_kind = -1;
}

WALogin::~WALogin() {
	if (this->inn != NULL)
		delete inn;
	if (this->out != NULL)
		delete out;
}

