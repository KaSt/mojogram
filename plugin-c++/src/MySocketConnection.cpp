/*
 * MySocketConnection.cpp
 *
 *  Created on: 28/06/2012
 *      Author: Antonio
 */

#include "MySocketConnection.h"
#include "utilities.h"
#include <iostream>
#include <sys/fcntl.h>
#include <sys/socket.h>
#include "ApplicationData.h"

void MySocketConnection::initNetwork() throw (WAException) {
	if(SDLNet_Init() == -1) {
		throw WAException(SDLNet_GetError(), WAException::SOCKET_EX, WAException::SOCKET_EX_SDL_INIT);
	}
}

void MySocketConnection::quitNetwork() {
	SDLNet_Quit();
}

MySocketConnection::MySocketConnection(const std::string& dir, int port) throw (WAException){
	IPaddress ip;

	if (SDLNet_ResolveHost(&ip, dir.c_str(), port) == -1) {
		throw WAException(SDLNet_GetError(), WAException::SOCKET_EX, WAException::SOCKET_EX_RESOLVE_HOST);
	}

	this->socket = SDLNet_TCP_Open(&ip);
	if (!this->socket) {
		throw WAException(SDLNet_GetError(), WAException::SOCKET_EX, WAException::SOCKET_EX_OPEN);
	}

	// int no = 0;
	// setsockopt(this->socket->channel, SOL_SOCKET, SO_REUSEADDR, (char*)&no, sizeof(no));

	//	long b = 1;
	//	if (setsockopt(this->socket->channel, SOL_SOCKET, SO_KEEPALIVE, &b, sizeof(b)) == -1) {
	//		throw WAException("Error set socket option keepalive", WAException::SOCKET_EX, WAException::SOCKET_EX_OPEN);
	//	}

	this->connected = true;
}

void MySocketConnection::write(int i) {
	unsigned char buffer[1];
	buffer[0] = (unsigned char) i;
	int result = SDLNet_TCP_Send(this->socket, buffer, 1);
	if (result < 1) {
		std::cout << "joder, un error" << SDLNet_GetError() << " " <<  std::endl;
		std::cout.flush();
		throw WAException(std::string(SDLNet_GetError()), WAException::SOCKET_EX, WAException::SOCKET_EX_SEND);
	}
}

void MySocketConnection::makeNonBlock() {
	if (fcntl(socket->channel, F_SETFL, O_NONBLOCK) == -1)
		throw WAException("Error setting socket nonblocking!",  WAException::SOCKET_EX, WAException::SOCKET_EX_OPEN);
}

int MySocketConnection::waitForRead() {
	fd_set rfds;
	struct timeval tv;
	struct timeval* tvp;
	int fd;

	FD_ZERO(&rfds);
	// _LOGDATA("preparando select");
	fd = (this->socket)->channel;
	// _LOGDATA("socket %d", fd);
	FD_SET(fd, &rfds);
	tv.tv_sec = ApplicationData::SELECT_TIMEOUT;
	tv.tv_usec = 0; // 5000000;
	tvp = &tv;
	if (ApplicationData::SELECT_TIMEOUT == -1)
		tvp = NULL;

	int retval = select(fd + 1, &rfds, NULL, NULL, tvp);
	if (!FD_ISSET(fd, &rfds))
		retval = 0;

	return retval;
}

void MySocketConnection::flush() {
}

void MySocketConnection::write(const std::vector<unsigned char>& bytes, int length) {
	int result = SDLNet_TCP_Send(this->socket, &bytes[0], length);
	// _LOGDATA("Socket data send");
	if (result < length) {
		throw WAException(std::string(SDLNet_GetError()), WAException::SOCKET_EX, WAException::SOCKET_EX_SEND);
	}
}

unsigned char MySocketConnection::read() {
	unsigned char c;
	int result = SDLNet_TCP_Recv(this->socket, &c, 1);
	if (result <= 0) {
		throw WAException(std::string(SDLNet_GetError()), WAException::SOCKET_EX, WAException::SOCKET_EX_RECV);
	}
	return c;
}

int MySocketConnection::read(std::vector<unsigned char>& b, int off, int length) {
	unsigned char buffer[length];
	if (off < 0 || length < 0) {
		throw new WAException("Out of bounds", WAException::SOCKET_EX, WAException::SOCKET_EX_RECV);
	}

	int result = SDLNet_TCP_Recv(this->socket, &buffer, length);

	if (result <= 0) {
		throw WAException(std::string(SDLNet_GetError()), WAException::SOCKET_EX, WAException::SOCKET_EX_RECV);
	}

	for (int i = 0; i < result; i++)
		b[off + i] = buffer[i];

	return result;
}

void MySocketConnection::forceShutdown() {
	shutdown(this->socket->channel, 2);
}

MySocketConnection::~MySocketConnection() {
	this->forceShutdown();
	SDLNet_TCP_Close(this->socket);
}

