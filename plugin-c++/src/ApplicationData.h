/*
 * ApplicationData.h
 *
 *  Created on: 04/07/2012
 *      Author: Antonio
 */

#ifndef APPLICATIONDATA_H_
#define APPLICATIONDATA_H_

#include <string>
namespace ApplicationData {
	extern int SELECT_TIMEOUT;
	extern std::string _chatUserId;
	extern std::string _pushName;
	extern std::string _password;

	extern void setData(const std::string& chatUserId, const std::string& pushName, const std::string& password);
}

#endif /* APPLICATIONDATA_H_ */
