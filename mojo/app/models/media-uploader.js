var _mediaUploads = new HashTable();

function MediaUploader() {
}

MediaUploader.ACCOUNT_URL_UPLOADREQUEST = "https://mms.whatsapp.net/client/iphone/upload.php";

function MediaUploader(msg, controllers) {
	this.msg = msg;
	this.serviceRequest = null;
	this.progress = 0;
	this.ticket = null;
	this.uploading = false;
	this.controller = controllers;
}

MediaUploader.prototype.requestUpload = function(file) {
	Mojo.Log.info("upload file %j", file)
	this.uploading = true;
	this.msg.status = Message.STATUS_MEDIA_UPLOADING;
	_appDB.updateMessageStatus(this.msg);
	
	_mojowhatsupPlugin.safePluginCall( function() {
		var isFileTemp = 0;		
		if (this.msg.media_wa_type == Message.WA_TYPE_IMAGE && _appPrefs.cookieData.imageResolution != 0) {
			var tempFile = "temp" + Media.getFileName(file);
			var result = _plugin.resizeImage(file, tempFile, _appPrefs.cookieData.imageResolution);
			if (result != "false") {
				file = result;
				isFileTemp = 1;
			}
		}					
		_plugin.sendUploadRequest(this.msg.keyString(), file, Media.getMimeType(this.msg, Media.getExt(file)), isFileTemp);
	}.bind(this));

	//
	// this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
	// method : "upload",
	// parameters : {
	// "fileName" : file,
	// "fileLabel" : "file",
	// "url" : MediaUploader.ACCOUNT_URL_UPLOADREQUEST,
	// "contentType" : Media.getMimeType(this.msg, Media.getExt(file)),
	// "postParameters" : [
	// // {key:"name" , data: "file"},
	// // {"key":"password" , "data": "kd9o$#Pk"},
	// // {key: "User-Agent", data: "WhatsApp/2.7.7811 Android/4.0.3 Device/unknown-sdk"},
	// ],
	// "customHttpHeaders" : ["Expect: "],
	// "subscribe" : true
	// },
	// onSuccess : this.uploadSuccess.bind(this),
	// onFailure : this.uploadFailure.bind(this)
	// });
}

MediaUploader.prototype.uploadSuccess = function(response) {
	Mojo.Log.error("Uploader Media success: %j", response);

	if (response.completed == true) {
		var parser = new DOMParser();
		var xmlObject = parser.parseFromString(response.response, "text/xml");

		var node = document.evaluate("/plist/dict/key[.='url']/following-sibling::*[1]", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
		if (node) {
			this.msg.media_url = node.firstChild.nodeValue;
		}
		node = document.evaluate("/plist/dict/key[.='name']/following-sibling::*[1]", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
		if (node) {
			this.msg.media_name = node.firstChild.nodeValue;
		}
		node = document.evaluate("/plist/dict/key[.='size']/following-sibling::*[1]", xmlObject, null, XPathResult.ANY_TYPE, null).iterateNext();
		if (node) {
			this.msg.media_size = parseInt(node.firstChild.nodeValue);
		}

		if (this.msg.media_url != null) {
			this.msg.status = Message.STATUS_UNSENT;
			Mojo.Log.error("%j", this.msg.downloadedFile);

			_appDB.updateMediaMessage(this.msg, function() {
				if (_openChatAssistant != null)
					_openChatAssistant.updateMessageStatus(this.msg);

				_mojowhatsupPlugin.safePluginCall( function() {
					this.msg.mediaUploader = null;
					Mojo.Log.error("%j", this.msg);
					_plugin.sendMessage(this.msg.toJSONString());
					this.removeUploader();
				}.bind(this));
			}.bind(this));
		} else {
			this.uploadFailure(response);
		}
	} else if (response.completed == false) {
		this.progress = response.progress;
		if (this.msg.media_size == null && response.size) 
			this.msg.media_size = response.size;
		if (_openChatAssistant != null)
			_openChatAssistant.updateMessageStatus(this.msg);
	}
}

MediaUploader.prototype.uploadFailure = function(response) {
	Mojo.Log.error("Uploader Media failure!, %j", response);
	this.msg.status = Message.STATUS_NONE;

	_appDB.updateMessageStatus(this.msg, function() {
		if (_openChatAssistant != null)
			_openChatAssistant.updateMessageStatus(this.msg);
		this.removeUploader();
	}.bind(this));
}

MediaUploader.prototype.stopUpload = function() {
	_mojowhatsupPlugin.safePluginCall( function() {
		_plugin.stopUploadRequest(this.msg.keyString());
		this.msg.status = Message.STATUS_NONE;
		_appDB.updateMessageStatus(this.msg, function() {
			if (_openChatAssistant != null)
				_openChatAssistant.updateMessageStatus(this.msg);
			this.removeUploader();
		}.bind(this));
	}.bind(this));
}

MediaUploader.prototype.removeUploader = function() {
	this.msg.mediaUploader = null;
	this.uploading = false;
	_mediaUploads.removeItem(this.msg.keyString());
	delete this;
}

MediaUploader.upload = function(msg, file, controller) {
	if (_mediaUploads.getItem(msg.keyString()) !== undefined) {
		msg.mediaUploader = _mediaUploads.getItem(msg.keyString());
		msg.mediaUploader.msg = msg;
	} else {
		msg.mediaUploader = new MediaUploader(msg, controller);
		_mediaUploads.setItem(msg.keyString(), msg.mediaUploader);
	}
	if (!msg.mediaUploader.uploading)
		msg.mediaUploader.requestUpload(file);
}

MediaUploader.stopUpload = function(msg) {
	if (_mediaUploads.getItem(msg.keyString()) !== undefined) {
		msg.mediaUploader = _mediaUploads.getItem(msg.keyString());
		msg.mediaUploader.msg = msg;
		if (msg.mediaUploader.uploading)
			msg.mediaUploader.stopUpload();
	}
}

MediaUploader.existsUploader = function(msg) {
	if (_mediaUploads.getItem(msg.keyString()) !== undefined) {
		return _mediaUploads.getItem(msg.keyString());
	}
	return null;
}

MediaUploader.getUploader = function(msgId) {
	return _mediaUploads.getItem(msgId);
}
