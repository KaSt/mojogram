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


#define WHATSAPP_LOGIN_SERVER "c2.whatsapp.net"

#define ACCOUNT_URL_CODEREQUEST "https://r.whatsapp.net/v1/code.php"
#define ACCOUNT_URL_CODEREQUESTV2 "https://v.whatsapp.net/v2/code"
#define ACCOUNT_URL_REGISTERREQUEST "https://r.whatsapp.net/v1/register.php"
#define ACCOUNT_URL_REGISTERREQUESTV2 "https://v.whatsapp.net/v2/register"
// #define ACCOUNT_URL_UPLOADREQUEST "https://mms.whatsapp.net/client/iphone/upload.php"
#define ACCOUNT_URL_EXISTSV2 "https://v.whatsapp.net/v2/exist"
#define SYNC_URL_AUTH "https://sro.whatsapp.net/v2/sync/a"
#define SYNC_URL_QUERY "https://sro.whatsapp.net/v2/sync/q"


// WhatsApp 2.8.0 WP7
//#define ACCOUNT_USER_AGENT "WhatsApp/2.8.0 WP7/7.50 Device/Nokia-Lumia_900-1.0"
//#define ACCOUNT_TOKEN_PREFIX1 "k7Iy3bWARdNeSL8gYgY6WveX12A1g4uTNXrRzt1H"
//#define ACCOUNT_TOKEN_PREFIX2 "c0d4db538579a3016902bf699c16d490acf91ff4"

// WhatsApp 2.8.2 WP7
//#define ACCOUNT_RESOURCE  "WP7-2.8.2"
//#define ACCOUNT_USER_AGENT_REGISTRATION "WhatsApp/2.8.2 WP7/7.10.8773.98 Device/NOKIA-Lumia_800-H112.1402.2.3"
//#define ACCOUNT_TOKEN_PREFIX1 "k7Iy3bWARdNeSL8gYgY6WveX12A1g4uTNXrRzt1H"
//#define ACCOUNT_TOKEN_PREFIX2 "889d4f44e479e6c38b4a834c6d8417815f999abe"

// WhatsApp Nokia 302 S40
// #define ACCOUNT_RESOURCE  "S40-2.4.7"
// #define ACCOUNT_USER_AGENT_REGISTRATION "WhatsApp/2.3.53 S40Version/14.26 Device/Nokia302"
// #define ACCOUNT_TOKEN_PREFIX1 "PdA2DJyKoUrwLw1Bg6EIhzh502dF9noR9uFCllGk"
// #define ACCOUNT_TOKEN_PREFIX2 "1354754753509"

// #define ACCOUNT_RESOURCE  "S40-2.4.7"
// #define ACCOUNT_USER_AGENT "WhatsApp/2.4.7 S40Version/14.26 Device/Nokia302"
// #define ACCOUNT_TOKEN_PREFIX1 "PdA2DJyKoUrwLw1Bg6EIhzh502dF9noR9uFCllGk"
// #define ACCOUNT_TOKEN_PREFIX2 "1359594496554"

#define ACCOUNT_RESOURCE  "S40-2.4.22"
#define ACCOUNT_USER_AGENT "WhatsApp/2.4.22 S40Version/14.26 Device/Nokia302"
#define ACCOUNT_TOKEN_PREFIX1 "PdA2DJyKoUrwLw1Bg6EIhzh502dF9noR9uFCllGk"
#define ACCOUNT_TOKEN_PREFIX2 "1366850357035"


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
	std::string waCodeRequestV2(const std::string& cc, const std::string& in, const std::string& idx, const std::string& method);
	std::string waCodeRequest(const std::string& cc, const std::string& in, const std::string& method);
	std::string waRegisterRequest(const std::string& cc, const std::string& in, const std::string& udid, const std::string& code);
	std::string waRegisterRequestV2(const std::string& cc, const std::string& in, const std::string& idx, const std::string& code);
	std::string existsV2(const std::string& cc, const std::string& in, const std::string& idx);
	std::string waSyncAuth(const std::string& username, const std::string& password);
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
	std::string url;
	bool exit;
	bool isTempFile;
	int mediaType;
	int imageResolution;
	bool uploading;

	MediaUploader(const std::string& msgId, const std::string& filePath, const std::string& url, const std::string& contentType, int mediaType, int imageResolution);
	~MediaUploader();
	std::string waUploadFile();
	std::string getUploadFileName();
	void removeFile();
};

#endif /* ACCOUNT_H_ */
