var _mediaUploads = new HashTable();

function MediaUploader() {
}

function MediaUploader(msg, controllers, file) {
	this.msg = msg;
	this.serviceRequest = null;
	this.progress = 0;
	this.ticket = null;
	this.uploading = false;
	this.controller = controllers;
	this.file = file;
}

MediaUploader.prototype.requestUpload = function() {
	Mojo.Log.info("upload request %j", this.file);
	this.uploading = true;
	this.msg.status = Message.STATUS_MEDIA_UPLOADING;
	_appDB.updateMessageStatus(this.msg, function() {
		if (_openChatAssistant != null)
				_openChatAssistant.updateMessageStatus(this.msg);
	}.bind(this));
	
	
	_mojowhatsupPlugin.safePluginCall( function() {
		_plugin.sendMediaUploadRequest(this.msg.keyString(), this.file, Message.getTypeString(this.msg.media_wa_type), _appPrefs.cookieData.imageResolution); // Media.getMimeType(this.msg, Media.getExt(file)));		
	}.bind(this));
}

MediaUploader.prototype.uploadFile = function(url) {
	_mojowhatsupPlugin.safePluginCall( function() {
		Mojo.Log.info("uploadFile file %s url %s", this.file, url);
		_plugin.uploadFile(this.msg.keyString(), url, Media.getMimeType(this.msg, Media.getExt(this.file)));
	}.bind(this));
}

MediaUploader.prototype.uploadSuccess = function(response) {
	Mojo.Log.error("Uploader Media success: %j", response);

	if (response.completed == true) {
		var jsonResponse = MojowhatsupPluginModel.jsonParse(response.response);
		this.msg.media_url = jsonResponse.url;
		this.msg.media_name = jsonResponse.name;
		this.msg.media_size = jsonResponse.size;

		if (this.msg.media_url) {
			this.msg.status = Message.STATUS_UNSENT;
			this.msg.timestamp = new Date().getTime();
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
	this.msg.status = Message.STATUS_MEDIA_UPLOADERROR;

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
		msg.mediaUploader = new MediaUploader(msg, controller, file);
		_mediaUploads.setItem(msg.keyString(), msg.mediaUploader);
	}
	if (!msg.mediaUploader.uploading)
		msg.mediaUploader.requestUpload();
}

MediaUploader.stopUpload = function(msg) {
	if (_mediaUploads.getItem(msg.keyString()) !== undefined) {
		msg.mediaUploader = _mediaUploads.getItem(msg.keyString());
		msg.mediaUploader.msg = msg;
		if (msg.mediaUploader.uploading)
			msg.mediaUploader.stopUpload();
	} else {
		msg.status = Message.STATUS_NONE;
		_appDB.updateMessageStatus(msg, function() {
			if (_openChatAssistant != null)
				_openChatAssistant.updateMessageStatus(msg);
		}.bind(this));		
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
