/*
 * BinTreeNodeReader.h
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */
#ifndef BINTREENODEREADER_H_
#define BINTREENODEREADER_H_

#include "ProtocolTreeNode.h"
#include "MySocketConnection.h"
#include "ByteArray.h"
#include <string>
#include <vector>
#include <map>

#define BUFFER_SIZE 1024

class BinTreeNodeReader {
private:
	const char** tokenMap;
	int tokenmapsize;
	MySocketConnection *rawIn;
	ByteArrayInputStream* in;
	std::vector<unsigned char>* buf;
	int bufSize;
	int readSize;

	ProtocolTreeNode* nextTreeInternal();
	bool isListTag(int b);
	std::map<string,string>* readAttributes(int attribCount);
	std::vector<ProtocolTreeNode*>* readList(int token);
	int readListSize(int token);
	std::vector<ProtocolTreeNode*>* readList();
	std::string* readString();
	std::string* readString(int token);
	static void fillArray(std::vector<unsigned char>& buff, int len, ByteArrayInputStream* in);
	static void fillArray(std::vector<unsigned char>& buff, int len, MySocketConnection* in);
	std::string getToken(int token);
	void fillBuffer(int stanzaSize);
	static int readInt8(ByteArrayInputStream* in);
	static int readInt8(MySocketConnection* in);
	static int readInt16(ByteArrayInputStream* in);
	static int readInt16(MySocketConnection* in);
	static int readInt24(ByteArrayInputStream* in);
	static int readInt24(MySocketConnection* in);


public:
	BinTreeNodeReader(MySocketConnection* connection, const char** dictionary, const int dictionarysize);
	virtual ~BinTreeNodeReader();
	ProtocolTreeNode* nextTree();
	void streamStart();

};

#endif /* BINTREENODEREADER_H_ */

