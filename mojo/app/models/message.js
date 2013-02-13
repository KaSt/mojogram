Message.WA_TYPE_UNDEFINED = 0;
Message.WA_TYPE_IMAGE = 1;
Message.WA_TYPE_AUDIO = 2;
Message.WA_TYPE_VIDEO = 3;
Message.WA_TYPE_CONTACT = 4;
Message.WA_TYPE_LOCATION = 5;
Message.WA_TYPE_SYSTEM = 7;
Message.STATUS_NONE = 128;
Message.STATUS_UNSENT = 0;
Message.STATUS_UPLOADING = 1;
Message.STATUS_UPLOADED = 2;
Message.STATUS_SENT_BY_CLIENT = 3;
Message.STATUS_RECEIVED_BY_SERVER = 4;
Message.STATUS_RECEIVED_BY_TARGET = 5;
Message.STATUS_NEVER_SEND = 6;
Message.STATUS_SERVER_BOUNCE = 7;
Message.STATUS_MEDIA_DOWNLOADED = 10;
Message.STATUS_MEDIA_DOWNLOADING = 11;
Message.STATUS_MEDIA_UPLOADERROR = 12;
Message.STATUS_MEDIA_UPLOADING = 13;
Message.STATUS_USER_ADDED = 191;
Message.STATUS_USER_REMOVED = 192;
Message.STATUS_SUBJECT_CHANGED = 193;
Message.STATUS_PICTURE_CHANGED_SET = 194;
Message.STATUS_PICTURE_CHANGED_DELETE = 195;

function Message(remote_jid, data) {
	this.remote_jid = null;
	this.from_me = null;
	this.keyId = null;
	this.status = null;
	this.data = null;
	this.timestamp = null;
	
	this.media_wa_type = Message.WA_TYPE_UNDEFINED;
	this.remote_resource = null;
	this.notifyname = null;
	this.wants_receipt = null;
	this.media_url = null;
	this.media_name = null;
	this.media_size = null;
	this.media_duration_seconds = null;
	this.longitude = null;
	this.latitude = null;
	this.downloadedFile = null;

	// Only when you have to send a new message
	if (remote_jid) {
		this.remote_jid = remote_jid;
		this.from_me = true;
		this.wants_receipt = false;
		var key;
		_mojowhatsupPlugin.safePluginCall( function() {
			key = "" + _plugin.nextMessageKeyId();
		}.bind(this));
		this.keyId = key;
		this.status = Message.STATUS_UNSENT;
		this.data = data;
		this.timestamp = Math.floor(new Date().getTime() / 1000);
		// in seconds. Method processMessages() in plugin.js converts it into milliseconds.
	}
}



Message.fromJSONString = function(messageString) {
	var msgJson = Mojo.parseJSON(messageString);
	var result = new Message();
	if ('remote_jid' in msgJson)
		result.remote_jid = msgJson.remote_jid;
	if ('from_me' in msgJson)
		result.from_me = msgJson.from_me;
	if ('keyId' in msgJson)
		result.keyId = msgJson.keyId;
	if ('status' in msgJson)
		result.status = msgJson.status;
	if ('data' in msgJson)
		result.data = msgJson.data;
	if ('timestamp' in msgJson)
		result.timestamp = msgJson.timestamp;
	if ('media_wa_type' in msgJson)
		result.media_wa_type = msgJson.media_wa_type;
	if ('remote_resource' in msgJson)
		result.remote_resource = msgJson.remote_resource;
	if ('notifyname' in msgJson)
		result.notifyname = msgJson.notifyname;
	if ('wants_receipt' in msgJson)
		result.wants_receipt = msgJson.wants_receipt;
	if ('media_url' in msgJson)
		result.media_url = msgJson.media_url;
	if ('media_name' in msgJson)
		result.media_name = msgJson.media_name;
	if ('media_size' in msgJson)
		result.media_size = msgJson.media_size;
	if ('media_duration_seconds' in msgJson)
		result.media_duration_seconds = msgJson.media_duration_seconds;
	if ('longitude' in msgJson)
		result.longitude = msgJson.longitude;
	if ('latitude' in msgJson)
		result.latitude = msgJson.latitude;

	return result;
}


Message.removeDomainFromJid = function(jid) {
	return jid.replace(/@s\.whatsapp\.net/g, "");
}

Message.prototype.cloneToSend = function(jid) {
	var msg = new Message(jid, this.data);
	msg.media_wa_type = this.media_wa_type;
	msg.remote_resource = this.remote_resource;
	msg.media_url = this.media_url;
	msg.media_name = this.media_name;
	msg.media_size = this.media_size;
	msg.media_duration_seconds = this.media_duration_seconds;
	msg.longitude = this.longitude;
	msg.latitude = this.latitude;
	if (!this.from_me && this.downloadedFile) {
		msg.downloadedFile = Media.MOJOWHATSUP_MEDIA_DIR + this.downloadedFile;	
	} else {
		msg.downloadedFile = this.downloadedFile;
	}
	return msg;
}

Message.prototype.keyString = function() {
	return this.remote_jid + "-" + this.from_me + "-" + this.keyId;
}

Message.prototype.toJSONString = function() {
	return JSON.stringify(this);
}

Message.getTypeString = function(type) {
	switch (type) {
		case Message.WA_TYPE_UNDEFINED:
			return "";
		case Message.WA_TYPE_SYSTEM:
			return "system";
		case Message.WA_TYPE_AUDIO:
			return "audio";
		case Message.WA_TYPE_CONTACT:
			return "vcard";
		case Message.WA_TYPE_IMAGE:
			return "image";
		case Message.WA_TYPE_LOCATION:
			return "location";
		case Message.WA_TYPE_VIDEO:
			return "video";
	}

	return "";
}
Message.prototype.previewImage = function() {
	switch (this.media_wa_type) {
		case Message.WA_TYPE_IMAGE:
			if (this.data != null && this.data != "") {
				return '<div class="preview-image image-custom" style="background-image:url(data:image/jpeg;base64,' + this.data + ')"></div>';
			} else if (this.downloadedFile != null && this.downloadedFile != undefined) {
				var imageFile = (this.from_me ? '' : Media.MOJOWHATSUP_MEDIA_DIR) + this.downloadedFile;
				var imgSize = "80:64";
				if (_appAssistant.isPre3())
					imgSize = "120:96"; 
				return '<div class="preview-image image-custom" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(imageFile) + ':0:0:' + imgSize + ':3)"></div>';
			} else {
				return '<div class="preview-image image-default"></div>';
			}
			break;
		case Message.WA_TYPE_AUDIO:
			return '<div class="preview-image audio-default"></div>';
			break;
		case Message.WA_TYPE_VIDEO:
			if (this.data != null && this.data != "") {
				return '<div class="preview-image image-custom" style="background-image:url(data:image/jpeg;base64,' + this.data + ')"></div>';
			} else {
				return '<div class="preview-image video-default"></div>';
			}
			break;
		case Message.WA_TYPE_LOCATION:
			return '<div class="preview-image location-default"></div>';
			break;
		case Message.WA_TYPE_CONTACT:
			return '<div class="preview-image contact-default"></div>';
			break;
	}
	return "";
}

Message.prototype.formatTextMessage = function(newlinefyBool, emojifyBool, emojiSize) {
	if (this.isNotification()) {
		var id = _contactJidNames.getItem(this.notifyname);
		if (id === undefined) 
			id = Message.removeDomainFromJid(this.notifyname);
			
		switch(this.status) {
			case Message.STATUS_USER_ADDED:
				return $L("#{id} has joined the group").interpolate({id: id});
				break;
			case Message.STATUS_USER_REMOVED:
				return $L("#{id} has left the group").interpolate({id: id});	
			case Message.STATUS_SUBJECT_CHANGED:
			    var subject = this.data;
			    return emojify($L("#{id} has changed the group subject by '#{subject}'").interpolate({id: id, subject: subject}), 16);		
				break;
			case Message.STATUS_PICTURE_CHANGED_SET:
				return $L("#{id} updated the group picture").interpolate({id: id});
				break;
			case Message.STATUS_PICTURE_CHANGED_DELETE:
				return $L("#{id} deleted the group picture").interpolate({id: id});
				break;
		}
	} else if (this.media_wa_type == Message.WA_TYPE_UNDEFINED) {
		if (this.data) {
			var text = linkify(this.data);
			if (newlinefyBool)
				text = newlinefy(text);
			if (emojifyBool)
				text = emojify(text, emojiSize);
			return text;
		}
	} else {
		var text = "";
		text += "[" + $L(Message.getTypeString(this.media_wa_type)) + "] ";
		text += ((this.media_size != null) && (this.media_size != "") ? "(" + formatBytes(this.media_size) + ") " : "") + (this.media_duration_seconds != null && this.media_duration_seconds != 0 ? " (" + formatDurationSeconds(this.media_duration_seconds) + ")" : "");
		if (this.status == Message.STATUS_MEDIA_DOWNLOADING && this.mediaDownloader != null) {
			text += "<br>" + $L("Downloading") + ": " + Math.round(this.mediaDownloader.progress) + "%";
		} else if (this.status == Message.STATUS_MEDIA_UPLOADING && this.mediaUploader != null) {
			text += "<br>" + $L("Uploading") + ": " + Math.round(this.mediaUploader.progress) + "%";
		} else if (this.media_wa_type == Message.WA_TYPE_LOCATION) {
			text += "<br>" + $L("Longitude") + ": " + this.longitude;
			text += "<br> " + $L("Latitude") + ": " + this.latitude;
		} else if (this.media_wa_type == Message.WA_TYPE_CONTACT) {
			text += "<br>" + this.media_name;
		}
		if (!newlinefyBool) {
			text = text.replace(/<br>/g, ' ');
		}
		return text;
	}
	return "";
}

Message.prototype.statusIconStyle = function() {
	switch (this.status) {
		case Message.STATUS_UNSENT:
			return "sending";
		case Message.STATUS_RECEIVED_BY_SERVER:
			return "received-server";
		case Message.STATUS_RECEIVED_BY_TARGET:
			return "received-target";
		case Message.STATUS_MEDIA_DOWNLOADING:
			return "media-downloading";
		case Message.STATUS_MEDIA_DOWNLOADED:
			return "media-downloaded";
		case Message.STATUS_MEDIA_UPLOADING:
			return "media-uploading";
		case Message.STATUS_SERVER_BOUNCE:
			return "server-bounce";
		default:
			return "none";
	}
}

Message.prototype.isNotification = function() {
	return (this.status == Message.STATUS_USER_ADDED 
	    || this.status == Message.STATUS_USER_REMOVED
	    || this.status == Message.STATUS_SUBJECT_CHANGED
	    || this.status == Message.STATUS_PICTURE_CHANGED_SET
	    || this.status == Message.STATUS_PICTURE_CHANGED_DELETE);
}

Message.prototype.isForwardable = function() {
	return 	!this.isNotification() && 
			!(this.status == Message.STATUS_MEDIA_DOWNLOADING || 
				this.status == Message.STATUS_MEDIA_UPLOADING || 
				this.status == Message.STATUS_MEDIA_UPLOADERROR);
}

