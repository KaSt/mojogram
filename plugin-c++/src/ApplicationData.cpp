/*
 * ApplicationData.cpp
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#include "ApplicationData.h"

namespace ApplicationData {
int SELECT_TIMEOUT = 600; // 10 minutes
std::string _chatUserId = "";
std::string _pushName = "";
std::string _password = "";

void setData(const std::string& chatUserId, const std::string& pushName, const std::string& password) {
	_chatUserId = chatUserId;
	_pushName = pushName;
	_password = password;
}

}
