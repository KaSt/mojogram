/*
 * WAException.h
 *
 *  Created on: 27/06/2012
 *      Author: Antonio
 */



#ifndef WAEXCEPTION_H_
#define WAEXCEPTION_H_

#include <stdexcept>
#include <string>

class WAException: public std::runtime_error {

public:
	int type;
	int subtype;

	static const int LOGIN_FAILURE_EX = 1;
	static const int LOGIN_FAILURE_EX_TYPE_PASSWORD = 0;
	static const int LOGIN_FAILURE_EX_TYPE_EXPIRED = 1;

	static const int CORRUPT_STREAM_EX = 2;

	static const int SOCKET_EX = 3;
	static const int SOCKET_EX_RESOLVE_HOST = 0;
	static const int SOCKET_EX_OPEN = 1;
	static const int SOCKET_EX_SDL_INIT = 2;
	static const int SOCKET_EX_SEND = 3;
	static const int SOCKET_EX_RECV = 4;

	WAException(const std::string& err): std::runtime_error(err) {this->type = 0;};
	WAException(const std::string& err, int type, int subtype): std::runtime_error(err) {this->type = type; this->subtype = subtype;};
};

#endif /* WAEXCEPTION_H_ */
