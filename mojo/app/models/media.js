function Media(){
}

Media.MOJOWHATSUP_MEDIA_DIR = "/media/internal/mojowhatsup/";

Media.MEDIA_EXTENSION_AMR = "amr";
Media.MEDIA_EXTENSION_MP3 = "mp3";
Media.MEDIA_EXTENSION_JPG = "jpg";
Media.MEDIA_EXTENSION_3GP = "3gp";
Media.MEDIA_EXTENSION_GIF = "gif";
Media.MEDIA_EXTENSION_PNG = "png";
Media.MEDIA_EXTENSION_MP4 = "mp4";
Media.MEDIA_EXTENSION_CAF = "caf";
Media.MEDIA_EXTENSION_MOV = "mov";
Media.MEDIA_MIME_TYPE_AMR = "audio/amr";
Media.MEDIA_MIME_TYPE_AUDIO_MPEG = "audio/mpeg";
Media.MEDIA_MIME_TYPE_JPEG = "image/jpeg";
Media.MEDIA_MIME_TYPE_GIF = "image/gif";
Media.MEDIA_MIME_TYPE_PNG = "image/png";
Media.MEDIA_MIME_TYPE_AUDIO_3GPP = "audio/3gpp";
Media.MEDIA_MIME_TYPE_VIDEO_3GPP = "video/3gpp";
Media.MEDIA_MIME_TYPE_MP4 = "video/mp4";
Media.MEDIA_MIME_TYPE_OCTET = "application/octet-stream";
Media.MEDIA_MIME_TYPE_TEXT_PLAIN_UTF8 = "text/plain;charset=UTF-8";
Media.MEDIA_MIME_TYPE_TEXT_PLAIN = "text/plain";
Media.MEDIA_MIME_TYPE_IMAGE = "image";
Media.MEDIA_MIME_TYPE_AUDIO = "audio";

String.prototype.endsWith = function(str){
    var lastIndex = this.lastIndexOf(str);
    return (lastIndex != -1) && (lastIndex + str.length == this.length);
}

String.prototype.startsWith = function(str){
    var firstIndex = this.indexOf(str);
    return (firstIndex == 0);
}

Media.getDateFormatted = function() {
	var d = new Date();
	var f = function (n, milliseconds) {
		if (milliseconds) {
			if (n <= 9)
				return '00' + n;
			if (n <= 99)
				return '0' + n;
			return '' + n;
		}
		return '' + (n <= 9 ? '0' + n: n);
	}
	
	return  '' + d.getFullYear() + f(d.getMonth() + 1) + f(d.getDate()) + '_' + f(d.getHours()) + f(d.getMinutes()) + f(d.getSeconds()) + f(d.getMilliseconds(), true);
}

Media.openMedia = function(msg, stageController){
    switch (msg.media_wa_type) {
        case Message.WA_TYPE_IMAGE:
            stageController.pushScene("imageview", {
                path: (msg.from_me ? "" : Media.MOJOWHATSUP_MEDIA_DIR) + msg.downloadedFile
            });
            break;
            
        case Message.WA_TYPE_VIDEO:
        case Message.WA_TYPE_AUDIO:
            Mojo.Log.error("open file media %s", (msg.from_me ? "" : Media.MOJOWHATSUP_MEDIA_DIR) + msg.downloadedFile);
            stageController.activeScene().serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
                    target: 'file://' + (msg.from_me ? "" : Media.MOJOWHATSUP_MEDIA_DIR) + msg.downloadedFile
                },
                onFailure: function(r){
                    Mojo.Log.error("Error calling applicationManager:open: %j", r);
                }
            });
            break;
        case Message.WA_TYPE_CONTACT:
            Mojo.Log.info("Media url %s", msg.media_url);
            stageController.activeScene().serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
                    target: 'file://' + msg.media_url
                },
                onFailure: function(r){
                    Mojo.Log.error("Error calling applicationManager:open: %j", r);
                }
            });
            break;
        case Message.WA_TYPE_LOCATION:
            stageController.activeScene().serviceRequest("palm://com.palm.applicationManager", {
                method: "open",
                parameters: {
                    target: "maploc:" + msg.latitude + ", " + msg.longitude
                }
            });
            break;
    }
}

Media.rewriteDownloadURL = function(msg){
    if (msg == null || msg.media_url == null || msg.media_url == "") 
        return null;
    
    var url = msg.media_url;
    
    // Mojo.Log.info("Original url = %j", msg.media_url);
    // if (url.endsWith(Media.MEDIA_EXTENSION_CAF)) {
    // var spos = url.indexOf('whatsapp.net/');
    // var result = url.substr(0, spos + 13) + "a.php?i=" + url.substr(spos + 12, url.length - 3 - (spos + 12)) + Media.MEDIA_EXTENSION_MP3;
    //
    // return result;
    // }
    //
    // if ((msg.media_wa_type == Message.WA_TYPE_VIDEO) && ((url.toLowerCase().endsWith(Media.MEDIA_EXTENSION_MOV)) || (url.toLowerCase().endsWith(Media.MEDIA_EXTENSION_3GP)))) {
    // var spos = url.indexOf("whatsapp.net/");
    // var result = url.substr(0, spos + 13) + "v.php?i=" + url.substr(spos + 12, url.length - 3 - (spos + 12)) + Media.MEDIA_EXTENSION_MP4;
    // return result;
    // }
    
    return url;
}

Media.selectFilename = function(msg, url){
    var filename = msg.media_name;
    if (filename == null || filename == "") {
        filename = Media.getFileName(url);
    }
    else {
        var mediaNameExt = Media.getExt(filename);
        var urlExt = Media.getExt(url);
        
        if (mediaNameExt != urlExt) {
            if (mediaNameExt.length == 0) 
                filename = filename + urlExt;
            else 
                filename = filename.substr(0, filename.length - mediaNameExt.length) + urlExt;
        }
    }
    Mojo.Log.info("filename %j", filename);
    return filename;
}

Media.getExt = function(filename){
    var lastDot = filename.lastIndexOf('.');
    if (lastDot == -1) 
        return "";
    return filename.substr(lastDot + 1);
}

Media.getFileName = function(filepath){
    var lastSlash = filepath.lastIndexOf('/');
    if (lastSlash == -1) 
        return filepath;
    else 
        return filepath.substr(lastSlash + 1);
}

Media.getMimeType = function(fmsg, extension){
    var lowerExt = extension.toLowerCase();
    if (lowerExt == Media.MEDIA_EXTENSION_JPG) 
        return Media.MEDIA_MIME_TYPE_JPEG;
    if (lowerExt.startsWith(Media.MEDIA_EXTENSION_3GP)) {
        if (fmsg.media_wa_type == Message.WA_TYPE_AUDIO) {
            return Media.MEDIA_MIME_TYPE_AUDIO_3GPP;
        }
        return Media.MEDIA_MIME_TYPE_VIDEO_3GPP;
    }
    
    if (lowerExt == Media.MEDIA_EXTENSION_AMR) 
        return Media.MEDIA_MIME_TYPE_AMR;
    if (lowerExt == Media.MEDIA_EXTENSION_GIF) 
        return Media.MEDIA_MIME_TYPE_GIF;
    if (lowerExt == Media.MEDIA_EXTENSION_MP3) 
        return Media.MEDIA_MIME_TYPE_AUDIO_MPEG;
    if (lowerExt == Media.MEDIA_EXTENSION_MP4) 
        return Media.MEDIA_MIME_TYPE_MP4;
    if (lowerExt == Media.MEDIA_EXTENSION_PNG) {
        return Media.MEDIA_MIME_TYPE_PNG;
    }
    return Media.MEDIA_MIME_TYPE_OCTET;
}

Media.resizeImageWithAspectRation = function(img){
	var maxWidth = 100; // Max width for the image
	var maxHeight = 77; // Max height for the image
	var ratio = 0; // Used for aspect ratio
	var width = img.width; // Current image width
	var height = img.height; // Current image height
	// Check if the current width is larger than the max
	if (width > maxWidth) {
		ratio = maxWidth / width; // get ratio for scaling image
		height = height * ratio; // Reset height to match scaled image
		width = width * ratio; // Reset width to match scaled image
	}
	
	if (height > maxHeight) {
		ratio = maxHeight / height; // get ratio for scaling image
		width = width * ratio; // Reset width to match scaled image
		height = maxHeight;
	}
	
	return [width, height];
}

Media.getThumbImage = function(document, msg, callback){
    if (msg.media_wa_type == Message.WA_TYPE_IMAGE || msg.media_wa_type == Message.WA_TYPE_AUDIO) {
        var imageFile = (msg.from_me ? '' : Media.MOJOWHATSUP_MEDIA_DIR) + msg.downloadedFile;
        
        if (msg.media_wa_type == Message.WA_TYPE_AUDIO) {
            if (msg.thumb && msg.thumb != "") {
                imageFile = msg.thumb;
            }
            else {
                callback("");
                return;
            }
        }
        
        imageFile = '/var/luna/data/extractfs' + encodeURIComponent(imageFile) + ':0:0:120:92:3';
        
		var img = new Image();
        img.onload = function() {
            var canvas = document.createElement("canvas");
           
			if (_appAssistant.isPre3()) {
                canvas.width = Math.round(img.width * 1.5);
                canvas.height = Math.round(img.height * 1.5);
            }
            else {
                canvas.width = img.width;
                canvas.height = img.height;
            }
            
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            var imageData = ctx.getImageData(0, 0, img.width, img.height);
            var data = imageData.data;
            
            Mojo.Log.info("Canvas size %d %d, lenght %d ", canvas.width, canvas.height, data.length);
            
            var p = new PNGlib(canvas.width, canvas.height, 256);
            var background = p.color(0, 0, 0, 0);
            var sourceWidth = canvas.width;
            var sourceHeight = canvas.height;
            
            var cont = 1;
            for (var y = 0; y < sourceHeight; y++) {
                for (var x = 0; x < sourceWidth; x++) {
                    var red = data[((sourceWidth * y) + x) * 4];
                    var green = data[((sourceWidth * y) + x) * 4 + 1];
                    var blue = data[((sourceWidth * y) + x) * 4 + 2];
                    var alpha = data[((sourceWidth * y) + x) * 4 + 3];
                    
                    p.buffer[p.index(x, y)] = p.color(Media.reduceColor(red, 8), Media.reduceColor(green, 8), Media.reduceColor(blue, 4), alpha);
                    cont++;
                }
            }
            
            var base64 = p.getBase64();
            delete img;
            delete p;
            delete canvas;
            callback(base64);
        };

		img.src = imageFile;

    }
    else {
		callback("");
    }
}

Media.reduceColor = function(color, a){
    return Math.floor(color / (255 / a)) * (255 / a);
}

Media.checkNull = function(string, space){
    return ((string == null || string == undefined) ? "" : (space ? string + " " : string));
}

Media.fromPersonToVcard = function(person){
    Mojo.Log.info("person data: %s", JSON.stringify(person.photos));
    
    var personName = "";
    var vcard = "BEGIN:VCARD\r\nVERSION:2.1\r\n";
    // name
    if (person.name) {
        var name = person.name;
        vcard += "N:" + Media.checkNull(name.familyName) + ";" + Media.checkNull(name.givenName) + ";" + Media.checkNull(name.middleName) + ";" + Media.checkNull(name.honorificPrefix) + ";" + Media.checkNull(name.honorificSuffix) + '\r\n';
        personName = Media.checkNull(name.givenName, true) + Media.checkNull(name.middleName, true) + Media.checkNull(name.familyName);
    }
    
    // phone numbers
    if (person.phoneNumbers) {
        for (var i = 0; i < person.phoneNumbers.length; i++) {
            var number = person.phoneNumbers[i];
            var type = "";
            if (number.type.toLowerCase().indexOf("mobile") != -1) {
                type = "CELL";
            }
            else 
                if (number.type.toLowerCase().indexOf("home") != -1) {
                    type = "HOME";
                }
                else 
                    if (number.type.toLowerCase().indexOf("work") != -1) {
                        type = "WORK";
                    }
            
            vcard += "TEL;" + type + ":" + number.value + '\r\n';
        }
    }
    
    // address
    if (person.addressses) {
        for (var i = 0; i < person.addressses.length; i++) {
            var address = person.addressses[i];
            vcard += "ADR:;" + ";" + address.normalizedStreetAddress + ";" + address.normalizedLocality + ";" + address.normalizedRegion + ";" + address.normalizedPostalCode + ";" + address.normalizedCountry + '\r\n';
        }
    }
    
    // emails
    if (person.emails) {
        for (var i = 0; i < person.emails.length; i++) {
            var email = person.emails[i];
            vcard += "EMAIL:" + email.value + '\r\n';
        }
    }
    
    vcard += "END:VCARD";
    
    return {
        name: personName,
        vcard: vcard
    };
}
