/*
 * BinTreeNodeWriter.cpp
 *
 *  Created on: 26/06/2012
 *      Author: Antonio
 */

#include "BinTreeNodeWriter.h"
#include "WAException.h"
#include <cstring>

BinTreeNodeWriter::BinTreeNodeWriter(MySocketConnection* connection,
		const char** dictionary, const int dictionarysize) {
	this->out = new ByteArrayOutputStream(1024);
	this->realOut = connection;
	for (int i = 0; i < dictionarysize; i++) {
		if (!strcmp(dictionary[i], "") == 0)
			this->tokenMap[dictionary[i]] = i;
	}
	this->mutex = SDL_CreateMutex();
}

void BinTreeNodeWriter::streamStart(std::string domain, std::string resource) {
	SDL_mutexP(this->mutex);
	try {
		this->realOut->write(87);
		this->realOut->write(65);

		// OJO: en la versión python de wazapp las dos siguientes lineas son
		// this->realOut->write(1);
		// this->realOut->write(0);

		// this->realOut->write(0);
		// this->realOut->write(4);

		this->realOut->write(1);
		this->realOut->write(1);

		std::map<string, string> attributes;
		attributes["to"] = domain;
		attributes["resource"] = resource;
		this->writeListStart(attributes.size() * 2 + 1);

		this->out->write(1);

		this->writeAttributes(&attributes);
		this->flushBuffer(false);
	} catch (exception& ex) {
		SDL_mutexV(this->mutex);
		throw ex;
	}
	SDL_mutexV(this->mutex);
}

void BinTreeNodeWriter::writeListStart(int i) {
	if (i == 0) {
		this->out->write(0);
	} else if (i < 256) {
		this->out->write(248);
		writeInt8(i);
	} else {
		this->out->write(249);
		writeInt16(i);
	}
}

void BinTreeNodeWriter::writeInt8(int v) {
	this->out->write(v & 0xFF);
}

void BinTreeNodeWriter::writeInt16(int v, MySocketConnection* o) {
	o->write((v & 0xFF00) >> 8);
	o->write((v & 0xFF) >> 0);
}

void BinTreeNodeWriter::writeInt16(int v) {
	writeInt16(v, this->out);
}

void BinTreeNodeWriter::writeInt16(int v, ByteArrayOutputStream* o) {
	o->write((v & 0xFF00) >> 8);
	o->write((v & 0xFF) >> 0);
}

void BinTreeNodeWriter::writeAttributes(std::map<string, string>* attributes) {
	if (attributes != NULL) {
		std::map<string, string>::iterator ii;
		for (ii = attributes->begin(); ii != attributes->end(); ii++) {
			writeString(ii->first);
			writeString(ii->second);
		}
	}
}

void BinTreeNodeWriter::writeString(const std::string& tag) {
	std::map<string, int>::iterator it = this->tokenMap.find(tag);
	if (it != this->tokenMap.end()) {
		writeToken(it->second);
	} else {
		unsigned int atIndex = tag.find('@');
		if (atIndex == 0 || atIndex == string::npos) {
			writeBytes((unsigned char*) tag.data(), tag.length());
		} else {
			std::string server = tag.substr(atIndex + 1);
			std::string user = tag.substr(0, atIndex);
			writeJid(&user, server);
		}
	}
}

void BinTreeNodeWriter::writeJid(std::string* user, const std::string& server) {
	this->out->write(250);
	if (user != NULL) {
		writeString(*user);
	} else {
		writeToken(0);
	}
	writeString(server);

}

void BinTreeNodeWriter::writeToken(int intValue) {
	if (intValue < 245)
		this->out->write((unsigned char) intValue);
	else if (intValue <= 500) {
		this->out->write(254);
		this->out->write((unsigned char) (intValue - 245));
	}
}

void BinTreeNodeWriter::writeBytes(unsigned char* bytes, int length) {
	if (length >= 256) {
		this->out->write(253);
		writeInt24(length);
	} else {
		this->out->write(252);
		writeInt8(length);
	}
	this->out->write(bytes, length);
}

void BinTreeNodeWriter::writeInt24(int v) {
	this->out->write((v & 0xFF0000) >> 16);
	this->out->write((v & 0xFF00) >> 8);
	this->out->write((v & 0xFF) >> 0);
}

void BinTreeNodeWriter::writeInternal(ProtocolTreeNode* node) {
	writeListStart(
			1 + (node->attributes == NULL ? 0 : node->attributes->size() * 2)
			+ (node->children == NULL ? 0 : 1)
			+ (node->data == NULL ? 0 : 1));
	writeString(node->tag);
	writeAttributes(node->attributes);
	if (node->data != NULL) {
		writeBytes((unsigned char*) node->data->data(), node->data->length());
	}

	if (node->children != NULL && !node->children->empty()) {
		writeListStart(node->children->size());
		for (size_t a = 0; a < node->children->size(); a++) {
			writeInternal((*node->children)[a]);
		}
	}
}

void BinTreeNodeWriter::flushBuffer(bool flushNetwork) {
	int size = this->out->getCount();
	if ((size & 0xFFFF0000) != 0) {
		throw WAException("Buffer too large" + size);
	}

	writeInt16(size, this->realOut);
	// this->out->print();
	this->realOut->write(*this->out->getBuffer(), size);
	this->out->reset();
	if (flushNetwork)
		this->realOut->flush();

}

void BinTreeNodeWriter::streamEnd() {
	SDL_mutexP(this->mutex);
	try {
		writeListStart(1);
		this->out->write(2);
		flushBuffer(true);
	} catch (exception& ex) {
		SDL_mutexV(this->mutex);
		throw ex;
	}
	SDL_mutexV(this->mutex);
}

void BinTreeNodeWriter::write(ProtocolTreeNode* node) {
	write(node, true);
}

void BinTreeNodeWriter::write(ProtocolTreeNode* node, bool needsFlush) {
	SDL_mutexP(this->mutex);
	try {
		if (node == NULL)
			this->out->write(0);
		else
			writeInternal(node);
		flushBuffer(needsFlush);
	} catch (exception& ex) {
		SDL_mutexV(this->mutex);
		throw ex;
	}
	SDL_mutexV(this->mutex);
}

BinTreeNodeWriter::~BinTreeNodeWriter() {
	if (this->out != NULL)
		delete this->out;
	SDL_DestroyMutex(this->mutex);
}

