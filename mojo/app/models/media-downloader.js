var _mediaDownloads = new HashTable();

function MediaDownloader() {
}

function MediaDownloader(msg) {
    this.msg = msg;
    this.serviceRequest = null;
    this.progress = 0;
    this.ticket = null;
    this.downloading = false;
}

MediaDownloader.prototype.requestDownload = function(fileName) {
    Mojo.Log.info("download file %j", fileName)
    this.downloading = true;
    this.msg.status = Message.STATUS_MEDIA_DOWNLOADING;
    _appDB.updateMessageStatus(this.msg);
    var useUrl = Media.rewriteDownloadURL(this.msg);
    Mojo.Log.info("Used URL = ", useUrl);
    Mojo.Log.info("mime = ", Media.getMimeType(this.msg, Media.getExt(useUrl)));

    this.serviceRequest = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
        method : "download",
        parameters : {
            target : useUrl,
            mime : Media.getMimeType(this.msg, Media.getExt(useUrl)),
            targetDir : Media.MOJOWHATSUP_MEDIA_DIR,
            targetFilename : (fileName != null && fileName != undefined ? fileName : new Date().getTime() + "-" + Media.selectFilename(this.msg, useUrl)),
            keepFilenameOnRedirect : true,
            subscribe : true
        },
        onSuccess : this.downloadSuccess.bind(this),
        onFailure : this.downloadFailure.bind(this)
    });
}

MediaDownloader.prototype.downloadSuccess = function(response) {
    if (response.returnValue)
        this.ticket = response.ticket;

    if (response.amountReceived) {
        this.progress = Math.round((response.amountReceived / this.msg.media_size) * 100);
        Mojo.Log.info("Progress: " + this.progress);
    }

    if (response.completed) {
        this.msg.status = Message.STATUS_MEDIA_DOWNLOADED;
        this.msg.downloadedFile = response.destFile;
        _appDB.updateMediaMessage(this.msg, function() {
            if (_openChatAssistant != null)
                _openChatAssistant.updateMessageStatus(this.msg);
            this.removeDownloader();
        }.bind(this));
    } else {
        if (_openChatAssistant != null)
            _openChatAssistant.updateMessageStatus(this.msg);
    }

    Mojo.Log.info("Power Manager Response: activityStart: %j", response);
}

MediaDownloader.prototype.downloadFailure = function(response) {
    Mojo.Log.info("Power Manager Service Request:activityEnd FAILED!");
    if (this.msg.downloadedFile == null || this.msg.downloadedFile == "")
        this.msg.status = Message.STATUS_NONE;
    else
        this.msg.status = Message.STATUS_MEDIA_DOWNLOADED;

    _appDB.updateMessageStatus(this.msg, function() {
        if (_openChatAssistant != null)
            _openChatAssistant.updateMessageStatus(this.msg);
        this.removeDownloader();
    }.bind(this));
    
}

MediaDownloader.prototype.stopDownload = function() {
    this.serviceRequest = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
        method : "cancelDownload",
        parameters : {
            ticket : this.ticket
        },
        onSuccess : function(r) {
            Mojo.Log.info("Download canceled success: %j", r);
            if (this.msg.downloadedFile == null || this.msg.downloadedFile == "")
                this.msg.status = Message.STATUS_NONE;
            else
                this.msg.status = Message.STATUS_MEDIA_DOWNLOADED;
            _appDB.updateMessageStatus(this.msg, function() {
                if (_openChatAssistant != null)
                    _openChatAssistant.updateMessageStatus(this.msg);
                this.removeDownloader();
            }.bind(this));
        }.bind(this),
        onFailure : function(r) {
            Mojo.Log.info("Download canceled failure: %j", r);
        }
    });
}

MediaDownloader.prototype.removeDownloader = function() {
    this.msg.mediaDownloader = null;
    this.downloading = false;
    _mediaDownloads.removeItem(this.msg.keyString());
    delete this;
}

MediaDownloader.download = function(msg) {
    if (_mediaDownloads.getItem(msg.keyString()) !== undefined) {
        msg.mediaDownloader = _mediaDownloads.getItem(msg.keyString());
        msg.mediaDownloader.msg = msg;
    } else {
        msg.mediaDownloader = new MediaDownloader(msg);
        _mediaDownloads.setItem(msg.keyString(), msg.mediaDownloader);
    }
    if (!msg.mediaDownloader.downloading)
        msg.mediaDownloader.requestDownload(msg.downloadedFile);
}

MediaDownloader.stopDownload = function(msg) {
    if (_mediaDownloads.getItem(msg.keyString()) !== undefined) {
        msg.mediaDownloader = _mediaDownloads.getItem(msg.keyString());
        msg.mediaDownloader.msg = msg;
        if (msg.mediaDownloader.downloading)
            msg.mediaDownloader.stopDownload();
    }
}

MediaDownloader.existsDownloader = function(msg) {
    if (_mediaDownloads.getItem(msg.keyString()) !== undefined) {
        return _mediaDownloads.getItem(msg.keyString());
    }
    return null;
}
