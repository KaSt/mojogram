/*
 * MySocketConnection.h
 *
 *  Created on: 28/06/2012
 *      Author: Antonio
 */



#ifndef MYSOCKETCONNECTION_H_
#define MYSOCKETCONNECTION_H_

#include <SDL_net.h>
#include <vector>
#include "WAException.h"
#include <sys/socket.h>

struct _TCPsocket {
	int ready;
	int channel;
	IPaddress remoteAddress;
	IPaddress localAddress;
	int sflag;
};

class MySocketConnection {
private:
	int readSize;
	int maxBufRead;
	bool connected;


public:
	TCPsocket socket;
	MySocketConnection(const std::string& dir, int port) throw (WAException);
	void write(int i);
	unsigned char read();
	void flush();
	void write(const std::vector<unsigned char>& b, int length);
	void write(const std::vector<unsigned char>& bytes, int offset, int length);
	int read(std::vector<unsigned char>& b, int off, int length);
	void makeNonBlock();
	int waitForRead();
	void forceShutdown();

	virtual ~MySocketConnection();
	static void initNetwork() throw (WAException);
	static void quitNetwork();
};

#endif /* MYSOCKETCONNECTION_H_ */
