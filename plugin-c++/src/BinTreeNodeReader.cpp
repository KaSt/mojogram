/*
 * BinTreeNodeReader.cpp
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#include "BinTreeNodeReader.h"
#include "WAException.h"
#include "ProtocolTreeNode.h"
#include <string>

BinTreeNodeReader::BinTreeNodeReader(MySocketConnection* connection, const char** dictionary, const int dictionarysize) {
	this->rawIn = connection;
	this->tokenMap = dictionary;
	this->tokenmapsize = dictionarysize;
	this->bufSize = 0;
	this->readSize = 1;
	this->in = NULL;
	this->buf = new std::vector<unsigned char>(BUFFER_SIZE);
}

BinTreeNodeReader::~BinTreeNodeReader() {
	if (this->buf != NULL)
		delete this->buf;
	if (this->in != NULL)
		delete this->in;
}

ProtocolTreeNode* BinTreeNodeReader::nextTreeInternal() {
	int b = this->in->read();
	int size = readListSize(b);
	b = this->in->read();
	if (b == 2)
		return NULL;

	std::string* tag = readString(b);

	if ((size == 0) || (tag == NULL))
		throw WAException("nextTree sees 0 list or null tag", WAException::CORRUPT_STREAM_EX, -1);
	int attribCount = (size - 2 + size % 2) / 2;
	std::map<string,string>* attribs = readAttributes(attribCount);
	if (size % 2 == 1) {
		ProtocolTreeNode* ret = new ProtocolTreeNode(*tag, attribs);
		delete tag;
		return ret;
	}
	b = this->in->read();
	if (isListTag(b)) {
		ProtocolTreeNode* ret = new ProtocolTreeNode(*tag, attribs, NULL, readList(b));
		delete tag;
		return ret;
	}
	ProtocolTreeNode* ret = new ProtocolTreeNode(*tag, attribs, readString(b));
	delete tag;
	return ret;
}

bool BinTreeNodeReader::isListTag(int b) {
	return (b == 248) || (b == 0) || (b == 249);
}

std::map<string, string>* BinTreeNodeReader::readAttributes(int attribCount) {
	std::map<string, string>* attribs = new std::map<string, string>();
	for (int i = 0; i < attribCount; i++) {
		std::string* key = readString();
		std::string* value = readString();
		(*attribs)[*key] = *value;
		delete key;
		delete value;
	}
	return attribs;
}

std::vector<ProtocolTreeNode*>* BinTreeNodeReader::readList(int token) {
	int size = readListSize(token);
	std::vector<ProtocolTreeNode*>* list = new std::vector<ProtocolTreeNode*>(size);
	for (int i = 0; i < size; i++) {
		(*list)[i] = nextTreeInternal();
	}

	return list;
}

int BinTreeNodeReader::readListSize(int token) {
	int size;
	if (token == 0) {
		size = 0;
	}
	else {
		size = 0;
		if (token == 248) {
			size = readInt8(this->in);
		}
		else
		{
			size = 0;
			if (token == 249)
				size = readInt16(this->in);
			else
				throw new WAException("invalid list size in readListSize: token " + token);
		}
	}

	return size;
}

std::vector<ProtocolTreeNode*>* BinTreeNodeReader::readList() {
	return readList(this->in->read());
}

std::string* BinTreeNodeReader::readString() {
	return readString(this->in->read());
}

std::string* BinTreeNodeReader::readString(int token) {
	if (token == -1) {
		throw WAException("-1 token in readString", WAException::CORRUPT_STREAM_EX, -1);
	}

	if ((token > 4) && (token < 245)) {
		return new std::string(getToken(token));
	}

	switch(token) {
	case 0:
		return NULL;
	case 252: {
		int size8 = readInt8(this->in);
		std::vector<unsigned char>* buf8 = new std::vector<unsigned char>(size8);
		fillArray(*buf8, size8, this->in);
		std::string* ret = new std::string(buf8->begin(), buf8->end());
		delete buf8;
		return ret;
	}
	case 253: {
		int size24 = readInt24(this->in);
		std::vector<unsigned char>* buf24 = new std::vector<unsigned char>(size24);
		fillArray(*buf24, size24, this->in);
		std::string* ret = new std::string(buf24->begin(), buf24->end());
		delete buf24;
		return ret;
	}
	case 254: {
		token = (unsigned char) this->in->read();
		return new std::string(getToken(245 + token));
	}
	case 250: {
		std::string* user = readString();
		std::string* server = readString();
		if ((user != NULL) && (server != NULL)) {
			std::string* ret = new std::string(*user + "@" + *server);
			delete user;
			delete server;
			return ret;
		}
		if (server != NULL) {
			return server;
		}
		throw WAException("readString couldn't reconstruct jid", WAException::CORRUPT_STREAM_EX, -1);
	}
	}
	throw WAException("readString couldn't match token" + (int) token, WAException::CORRUPT_STREAM_EX, -1);
}

void BinTreeNodeReader::fillArray(std::vector<unsigned char>& buff, int len, ByteArrayInputStream* in) {
	int count = 0;
	while (count < len) {
		count += in->read(buff, count, len - count);
	}
}

void BinTreeNodeReader::fillArray(std::vector<unsigned char>& buff, int len, MySocketConnection* in) {
	int count = 0;
	while (count < len) {
		count += in->read(buff, count, len - count);
	}
}


std::string BinTreeNodeReader::getToken(int token) {
	std::string ret;

	if ((token >= 0) && (token < this->tokenmapsize))
		ret = std::string(this->tokenMap[token]);
	if (ret.empty()) {
		throw WAException("invalid token/length in getToken");
	}
	return ret;
}

void BinTreeNodeReader::fillBuffer(int stanzaSize) {
	if (this->buf->size() < (size_t) stanzaSize) {
		int newsize = std::max((int) (this->buf->size() * 3 / 2), stanzaSize);
		delete this->buf;
		this->buf = new std::vector<unsigned char>(newsize);
	}
	this->bufSize = stanzaSize;
	fillArray(*this->buf, stanzaSize, this->rawIn);
	if (this->in != NULL)
		delete this->in;
	this->in = new ByteArrayInputStream(this->buf, 0, stanzaSize);
}

int BinTreeNodeReader::readInt8(ByteArrayInputStream* in) {
	return in->read();
}

int BinTreeNodeReader::readInt16(ByteArrayInputStream* in) {
	int intTop = in->read();
	int intBot = in->read();
	int value = (intTop << 8) + intBot;
	return value;
}

int BinTreeNodeReader::readInt24(ByteArrayInputStream* in) {
	int int1 = in->read();
	int int2 = in->read();
	int int3 = in->read();
	int value = (int1 << 16) + (int2 << 8) + (int3 << 0);

	return value;
}

ProtocolTreeNode* BinTreeNodeReader::nextTree() {
	int stanzaSize = readInt16(this->rawIn);
	fillBuffer(stanzaSize);
	return nextTreeInternal();
}

void BinTreeNodeReader::streamStart() {
	int stanzasize = readInt16(this->rawIn);
	fillBuffer(stanzasize);
	int tag = this->in->read();
	int size = readListSize(tag);
	tag = this->in->read();
	if (tag != 1) {
		throw WAException("expecting STREAM_START in streamStart");
	}
	int attribCount = (size - 2 + size % 2) / 2;

	std::map<string,string>* attributes = readAttributes(attribCount);
	delete attributes;
}

int BinTreeNodeReader::readInt8(MySocketConnection* in) {
	return in->read();
}

int BinTreeNodeReader::readInt16(MySocketConnection* in) {
	int intTop = in->read();
	int intBot = in->read();
	int value = (intTop << 8) + intBot;
	return value;
}

int BinTreeNodeReader::readInt24(MySocketConnection* in) {
	int int1 = in->read();
	int int2 = in->read();
	int int3 = in->read();
	int value = (int1 << 16) + (int2 << 8) + (int3 << 0);

	return value;
}



