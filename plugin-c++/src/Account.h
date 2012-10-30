/*
 * Account.h
 *
 *  Created on: 04/09/2012
 *      Author: Antonio
 */

#ifndef ACCOUNT_H_
#define ACCOUNT_H_

#include <curl/curl.h>
#include <string>
#include "WAException.h"
#include <vector>
#include <map>
#include <SDL.h>

struct MemoryStruct {
  char *memory;
  size_t size;
};

#define ACCOUNT_RESOURCE "iPhone-2.8.3" //"WP7-2.8-5222"
#define WHATSAPP_LOGIN_SERVER "bin-short.whatsapp.net"
#define WHATSAPP_LOGIN_PORT 5222
#define ACCOUNT_URL_CODEREQUEST "https://r.whatsapp.net/v1/code.php"
#define ACCOUNT_URL_REGISTERREQUEST "https://r.whatsapp.net/v1/register.php"
#define ACCOUNT_URL_UPLOADREQUEST "https://mms.whatsapp.net/client/iphone/upload.php"
// WhatsApp 2.8.0 WP7
//#define ACCOUNT_USER_AGENT "WhatsApp/2.8.0 WP7/7.50 Device/Nokia-Lumia_900-1.0"
//#define ACCOUNT_TOKEN_PREFIX1 "k7Iy3bWARdNeSL8gYgY6WveX12A1g4uTNXrRzt1H"
//#define ACCOUNT_TOKEN_PREFIX2 "c0d4db538579a3016902bf699c16d490acf91ff4"

// WhatsApp 2.8.2 WP7
#define ACCOUNT_USER_AGENT_REGISTRATION "WhatsApp/2.8.2 WP7/7.10.8773.98 Device/NOKIA-Lumia_800-H112.1402.2.3"
#define ACCOUNT_USER_AGENT "WhatsApp/2.8.3 iPhone_OS/5.0.1 Device/Unknown_(iPhone4,1)"
#define ACCOUNT_TOKEN_PREFIX1 "k7Iy3bWARdNeSL8gYgY6WveX12A1g4uTNXrRzt1H"
#define ACCOUNT_TOKEN_PREFIX2 "889d4f44e479e6c38b4a834c6d8417815f999abe"


#define MINIMAL_PROGRESS_FUNCTIONALITY_INTERVAL   3

class Account {
protected:
	static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp);

	std::vector<std::string> params;
	CURL* urlManager;
	void addParam(const std::string& name, const std::string& value);
	std::string encodeUrl();
	std::string getCountry();
	std::string getLanguage();


public:
	Account() throw (WAException);
	virtual ~Account();
	static std::string getToken(const std::string& in);
	std::string waCodeRequest(const std::string& cc, const std::string& in, const std::string& method);
	std::string waRegisterRequest(const std::string& cc, const std::string& in, const std::string& udid, const std::string& code);
	void waRegisterRequest();
};

class MediaUploader: Account {
private:
	static int ProgressCallBack(void *clientp, double dltotal, double dlnow, double ultotal, double ulnow);
	double lastruntime;

public:
	SDL_Thread* thread;
	std::string filePath;
	std::string contentType;
	std::string msgId;
	bool exit;
	bool isTempFile;

	MediaUploader(const std::string& msgId, const std::string& filePath, const std::string& contentType, bool isTempFile);
	~MediaUploader();
	std::string waUploadFile();
	void removeFile();
};

#endif /* ACCOUNT_H_ */
