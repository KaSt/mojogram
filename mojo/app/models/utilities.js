Utilities.statusChoices = [{
        label: $L("Available"),
        value: $L("Available")
    }, {
        label: $L("Busy"),
        value: $L("Busy")
    }, {
        label: $L("At school"),
        value: $L("At school")
    }, {
        label: $L("At the movies"),
        value: $L("At the movies")
    }, {
        label: $L("At work"),
        value: $L("At work")
    }, {
        label: $L("Battery about to die"),
        value: $L("Battery about to die")
    }, {
        label: $L("In a meeting"),
        value: $L("In a meeting")
    }, {
        label: $L("At the gym"),
        value: $L("At the gym")
    }, {
        label: $L("Sleeping"),
        value: $L("Sleeping")
    }, {
        label: $L("Custom"),
        value: "_custom_"
    }];
	
function Utilities() {
}

function formatBytes(bytes, precision)
{  
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;
   
    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' B';
 
    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' KB';
 
    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' MB';
 
    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' GB';
 
    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' TB';
 
    } else {
        return bytes + ' B';
    }
}

function formatDurationSeconds(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}

function Error(assistant, msg) {
    if (msg != undefined) {
        if (msg.length > 0) {
            msg = msg.replace(/\n/g, " ");
            assistant.controller.errorDialog($L(msg));
        }
    }
}


