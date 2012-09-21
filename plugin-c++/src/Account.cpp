/*
 * Account.cpp
 *
 *  Created on: 04/09/2012
 *      Author: Antonio
 */

#include "Account.h"
#include <PDL.h>
#include <algorithm>
#include "utilities.h"
#include "cJSON.h"
#include <cstdlib>
#include <PDL.h>



Account::Account() throw (WAException) {
	this->urlManager = curl_easy_init();
	if (this->urlManager == NULL) {
		throw WAException("Error initializing curl");
	}
}

Account::~Account() {
	curl_easy_cleanup(this->urlManager);
}


std::string Account::getToken(const std::string& in) {
	return Utilities::md5String(std::string() + ACCOUNT_TOKEN_PREFIX1 + ACCOUNT_TOKEN_PREFIX2 + in);
}

std::string Account::getCountry() {
	char buffer[64];
	PDL_GetLanguage(buffer, 64);
	std::string locale(buffer, 5);
	std::string country =  locale.substr(3,2);
	std::transform(country.begin(), country.end(), country.begin(), ::toupper);
	return country;
}

std::string Account::getLanguage() {
	char buffer[64];
	PDL_GetLanguage(buffer, 64);
	std::string locale(buffer, 5);
	std::string language = locale.substr(0,2);
	std::transform(language.begin(), language.end(), language.begin(), ::tolower);
	return language;
}

size_t Account::WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
	size_t realsize = size * nmemb;
	struct MemoryStruct *mem = (struct MemoryStruct *)userp;

	_LOGDATA("reading response data");

	mem->memory = (char*) realloc(mem->memory, mem->size + realsize + 1);

	_LOGDATA("reallocated memory");

	if (mem->memory == NULL) {
		/* out of memory! */
		_LOGDATA("not enough memory (realloc returned NULL)\n");
		exit(EXIT_FAILURE);
	}

	memcpy(&(mem->memory[mem->size]), contents, realsize);

	_LOGDATA("copied memeory");
	mem->size += realsize;
	mem->memory[mem->size] = 0;

	_LOGDATA("readed response data: %s", mem->memory);

	return realsize;
}


std::string Account::waCodeRequest(const std::string& cc, const std::string& in, const std::string& method) {
	this->addParam("cc", cc);
	this->addParam("in", in);
	this->addParam("to",cc+in);
	this->addParam("lc", getCountry());
	this->addParam("lg", getLanguage());
	this->addParam("mcc","000");
	this->addParam("mnc","000");
	this->addParam("imsi","00000000000000000");
	this->addParam("method",method);
	this->addParam("token", Account::getToken(in));

	CURLcode res;
	struct MemoryStruct chunk;
	chunk.memory = (char*) malloc(1);
	chunk.size = 0;

	std::string url =  this->encodeUrl();

	_LOGDATA("curl encode url: %s", url.c_str());

	curl_easy_setopt(this->urlManager, CURLOPT_URL, ACCOUNT_URL_CODEREQUEST);
	curl_easy_setopt(this->urlManager, CURLOPT_POSTFIELDS, url.c_str());
	curl_easy_setopt(this->urlManager, CURLOPT_POST, 1L);
	curl_easy_setopt(this->urlManager, CURLOPT_USERAGENT, ACCOUNT_USER_AGENT);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEDATA, (void *)&chunk);

	_LOGDATA("curl opts set");
	res = curl_easy_perform(this->urlManager);
	if (res != CURLE_OK) {
		return "error";
	}

	_LOGDATA("curl result %s, size %d", chunk.memory, chunk.size);

	std::string response(chunk.memory);

	if(chunk.memory)
		free(chunk.memory);

	return response;
}


std::string Account::waRegisterRequest(const std::string& cc, const std::string& in, const std::string& password, const std::string& code) {
	this->addParam("cc", cc);
	this->addParam("in", in);
	this->addParam("udid", Utilities::getChatPassword(password));
	this->addParam("code", code);
	// this->addParam("token", Account::getToken(in));

	// _LOGDATA("Password: %s", Utilities::getChatPassword(password).c_str());

	CURLcode res;
	struct MemoryStruct chunk;
	chunk.memory = (char*) malloc(1);
	chunk.size = 0;

	std::string url =  this->encodeUrl();

	_LOGDATA("curl encode url: %s", url.c_str());

	curl_easy_setopt(this->urlManager, CURLOPT_URL, ACCOUNT_URL_REGISTERREQUEST);
	curl_easy_setopt(this->urlManager, CURLOPT_POSTFIELDS, url.c_str());
	curl_easy_setopt(this->urlManager, CURLOPT_POST, 1L);
	curl_easy_setopt(this->urlManager, CURLOPT_USERAGENT, ACCOUNT_USER_AGENT);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEDATA, (void *)&chunk);

	_LOGDATA("curl opts set");
	res = curl_easy_perform(this->urlManager);
	if (res != CURLE_OK) {
		return "error";
	}

	_LOGDATA("curl result %s, size %d", chunk.memory, chunk.size);

	std::string response(chunk.memory);

	if(chunk.memory)
		free(chunk.memory);

	return response;
}


void Account::addParam(const std::string& name, const std::string& value) {
	this->params.push_back(name);
	this->params.push_back(value);
}


std::string Account::encodeUrl() {
	std::string encoded = "";

	for(int i = 0; i<params.size(); i+=2)
	{
		if(i>0)
			encoded+="&";

		encoded+= params[i]+"="+params[i+1];
	}
	return encoded;
}


/*****************
 *  MediaUploader class methods
 */

int MediaUploader::ProgressCallBack(void *clientp, double dltotal, double dlnow, double ultotal, double ulnow) {
	MediaUploader* account = (MediaUploader*) clientp;
	double curtime = 0;

	if (account->exit)
		return 1;

    curl_easy_getinfo(account->urlManager, CURLINFO_TOTAL_TIME, &curtime);

    if((curtime - account->lastruntime) >= MINIMAL_PROGRESS_FUNCTIONALITY_INTERVAL) {
    	account->lastruntime = curtime;
    	int progress = (int) (ulnow * 100.0 / ultotal);

    	_LOGDATA("UP: %g of %g: progresss: %d", ulnow, ultotal, progress);

		cJSON* json = cJSON_CreateObject();
		cJSON_AddItemToObject(json, "returnValue", cJSON_CreateTrue());
		cJSON_AddItemToObject(json, "msgId", cJSON_CreateString(account->msgId.c_str()));
		cJSON_AddItemToObject(json, "completed", cJSON_CreateFalse());
		cJSON_AddItemToObject(json, "progress", cJSON_CreateNumber(progress));
		cJSON_AddItemToObject(json, "size", cJSON_CreateNumber(ultotal));

		std:string ret(cJSON_PrintUnformatted(json));
		cJSON_Delete(json);

		const char *params[1];
		params[0] = ret.c_str();

		PDL_Err err = PDL_CallJS("uploadRequestResponse", params, 1);
		if ( err != PDL_NOERROR ) {
			_LOGDATA("error: %s\n", PDL_GetError());
		}
    }

    return 0;
}

MediaUploader::MediaUploader(const std::string& msgId, const std::string& filePath, const std::string& contentType) {
	this->msgId = msgId;
	this->filePath = filePath;
	this->contentType = contentType;
	this->lastruntime = 0;
	this->exit = false;
}

MediaUploader::~MediaUploader() {

}

std::string MediaUploader::waUploadFile() {
	_LOGDATA("filePath %s, contentType %s", filePath.c_str(), this->contentType.c_str());

	struct curl_httppost *post=NULL;
	struct curl_httppost *last=NULL;
	struct curl_slist *headerlist=NULL;
	CURLcode res;
	struct MemoryStruct chunk;
	chunk.memory = (char*) malloc(1);
	chunk.size = 0;
	const char* header = "Expect:";
	/* Set the form info */
	headerlist = curl_slist_append(headerlist, header);

	std::string ext = filePath.substr(this->filePath.find_last_of('.'));
	std::string filename = Utilities::md5String(this->filePath) + ext;

	_LOGDATA("Filenae upload: %s", filename.c_str());

	curl_formadd(&post, &last, CURLFORM_COPYNAME, "file", CURLFORM_FILE, filePath.c_str(), CURLFORM_CONTENTTYPE, this->contentType.c_str(), CURLFORM_FILENAME, filename.c_str(),CURLFORM_END);

	curl_easy_setopt(this->urlManager, CURLOPT_URL, ACCOUNT_URL_UPLOADREQUEST);
	curl_easy_setopt(this->urlManager, CURLOPT_USERAGENT, ACCOUNT_USER_AGENT);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
	curl_easy_setopt(this->urlManager, CURLOPT_HTTPHEADER, headerlist);
	curl_easy_setopt(this->urlManager, CURLOPT_HTTPPOST, post);
	curl_easy_setopt(this->urlManager, CURLOPT_NOPROGRESS, false);
	curl_easy_setopt(this->urlManager, CURLOPT_PROGRESSFUNCTION, ProgressCallBack);
	curl_easy_setopt(this->urlManager, CURLOPT_PROGRESSDATA, this);
	curl_easy_setopt(this->urlManager, CURLOPT_WRITEDATA, (void *)&chunk);

	_LOGDATA("curl opts set");

	res = curl_easy_perform(this->urlManager);

	cJSON* json = cJSON_CreateObject();

	if (res != CURLE_OK) {
		cJSON_AddItemToObject(json, "returnValue", cJSON_CreateFalse());
		cJSON_AddItemToObject(json, "msgId", cJSON_CreateString(this->msgId.c_str()));
	} else {
		_LOGDATA("curl result %s, size %d", chunk.memory, chunk.size);

		std::string response(chunk.memory);
		cJSON_AddItemToObject(json, "returnValue", cJSON_CreateTrue());
		cJSON_AddItemToObject(json, "msgId", cJSON_CreateString(this->msgId.c_str()));
		cJSON_AddItemToObject(json, "completed", cJSON_CreateTrue());
		cJSON_AddItemToObject(json, "response", cJSON_CreateString(response.c_str()));
	}

	if(chunk.memory)
		free(chunk.memory);

	curl_formfree(post);
	curl_slist_free_all (headerlist);

	std:string ret(cJSON_PrintUnformatted(json));
	cJSON_Delete(json);
	return ret;
}

