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

//#define ACCOUNT_RESOURCE  "S40-2.4.22"
//#define ACCOUNT_USER_AGENT "WhatsApp/2.4.22 S40Version/14.26 Device/Nokia302"
//#define ACCOUNT_TOKEN_PREFIX1 "PdA2DJyKoUrwLw1Bg6EIhzh502dF9noR9uFCllGk"
//#define ACCOUNT_TOKEN_PREFIX2 "1366850357035"

//#define ACCOUNT_RESOURCE  "Android-2.10.750"
//#define ACCOUNT_USER_AGENT "WhatsApp/2.10.750 Android/4.2.1 Device/GalaxyS3"
//#define ACCOUNT_TOKEN_PREFIX1 "30820332308202f0a00302010202044c2536a4300b06072a8648ce3804030500307c310b3009060355040613025553311330110603550408130a43616c69666f726e6961311430120603550407130b53616e746120436c61726131163014060355040a130d576861747341707020496e632e31143012060355040b130b456e67696e656572696e67311430120603550403130b427269616e204163746f6e301e170d3130303632353233303731365a170d3434303231353233303731365a307c310b3009060355040613025553311330110603550408130a43616c69666f726e6961311430120603550407130b53616e746120436c61726131163014060355040a130d576861747341707020496e632e31143012060355040b130b456e67696e656572696e67311430120603550403130b427269616e204163746f6e308201b83082012c06072a8648ce3804013082011f02818100fd7f53811d75122952df4a9c2eece4e7f611b7523cef4400c31e3f80b6512669455d402251fb593d8d58fabfc5f5ba30f6cb9b556cd7813b801d346ff26660b76b9950a5a49f9fe8047b1022c24fbba9d7feb7c61bf83b57e7c6a8a6150f04fb83f6d3c51ec3023554135a169132f675f3ae2b61d72aeff22203199dd14801c70215009760508f15230bccb292b982a2eb840bf0581cf502818100f7e1a085d69b3ddecbbcab5c36b857b97994afbbfa3aea82f9574c0b3d0782675159578ebad4594fe67107108180b449167123e84c281613b7cf09328cc8a6e13c167a8b547c8d28e0a3ae1e2bb3a675916ea37f0bfa213562f1fb627a01243bcca4f1bea8519089a883dfe15ae59f06928b665e807b552564014c3bfecf492a0381850002818100d1198b4b81687bcf246d41a8a725f0a989a51bce326e84c828e1f556648bd71da487054d6de70fff4b49432b6862aa48fc2a93161b2c15a2ff5e671672dfb576e9d12aaff7369b9a99d04fb29d2bbbb2a503ee41b1ff37887064f41fe2805609063500a8e547349282d15981cdb58a08bede51dd7e9867295b3dfb45ffc6b259300b06072a8648ce3804030500032f00302c021400a602a7477acf841077237be090df436582ca2f0214350ce0268d07e71e55774ab4eacd4d071cd1efad"
//#define ACCOUNT_TOKEN_PREFIX2 "022e923a364bfacff3a80de3f950b1e0"

#define ACCOUNT_RESOURCE  "S40-2.11.1"
#define ACCOUNT_USER_AGENT "WhatsApp/2.11.1 S40Version/14.26 Device/Nokia302"
#define ACCOUNT_TOKEN_PREFIX1 "PdA2DJyKoUrwLw1Bg6EIhzh502dF9noR9uFCllGk1377032097395"
#define ACCOUNT_TOKEN_PREFIX2 ""



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
