var _displayOn = true;
var ACTIVITY_TIMEOUT = 900000;
var _activity_count = 0;
var _displayManagerRequest;
var _wanManagerRequest;
var _netManagerRequest;
var _powerManagerRequest;
var _timerManagerRequestSet;
var _timerManagerRequestClear;
var _systemPropertiesRequest;

function PalmServices() {
}

// this.controller.serviceRequest("luna://com.palm.systemmanager", {
// method : "takeScreenShot",
// parameters : {
// file: "/media/internal/screenshot.png"
// }
// });

PalmServices.enableWanData = function(dataDisabled) {
    _wanManagerRequest = new Mojo.Service.Request('palm://com.palm.wan', {
        method : 'set',
        parameters : {
            disablewan : dataDisabled
        }
    });
}

PalmServices.subscribeDisplayManager = function() {
    _displayManagerRequest = new Mojo.Service.Request("palm://com.palm.display/control", {
        method : "status",
        parameters : {
            "subscribe" : true
        },
        onSuccess : function(e) {
            Mojo.Log.info("Status success, results=" + JSON.stringify(e));
            switch (e.event) {
                case 'request':
                    (e.state == "on" ? _displayOn = true : _displayOn = false);
                    break;
                case 'displayActive':
                    if (_plugin != null && _dashboardAssistant == null)
                        _plugin.sendActive(1);
                case 'displayOn':
                    _displayOn = true;
                    break;
                case 'displayInactive':
                case 'displayDeactivate':
                    if (_plugin != null && _dashboardAssistant == null)
                        _plugin.sendActive(0);
                case 'displayOff':
                    _displayOn = false;
                    break;
            }
        }.bind(this),
        onFailure : function(e) {
            Mojo.Log.error("Status failure, results=" + JSON.stringify(e));
        }
    });
}

PalmServices.subscribeNetworkStatus = function() {
    _netManagerRequest = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
        method : 'getstatus',
        parameters : {
            subscribe : true
        },
        onSuccess : function(response) {
            Mojo.Log.info("Network Manager Response %j", response);
            if (response.isInternetConnectionAvailable) {
                if (!_networkConnected) {
                    _networkConnected = true;
                    _mojowhatsupPlugin.safePluginCall(function() {
                        _plugin.networkStatusChanged(1);
                        if (_dashboardAssistant != null) {
                            // setTimeout(function() {
                            // _plugin.sendActive(0);
                            // }, 10000);
                            _dashboardAssistant.setBGTimeout();
                        }
                    });
                }
            } else {
                Mojo.Log.info("Internet connection not available!");
                if (_networkConnected) {
                    _networkConnected = false;
                    _mojowhatsupPlugin.safePluginCall(function() {
                        _plugin.networkStatusChanged(0);
                    });

                    if (_dashboardAssistant != null) {
                        _dashboardAssistant.clearBGTimeout();
                    }
                }
            }
        }.bind(this),
        onFailure : function(response) {
            Mojo.Log.info("Connection Status Service Request FAILED!");
        }.bind(this)
    });
}

PalmServices.setActivity = function() {
    _activity_count++;
    _powerManagerRequest = new Mojo.Service.Request("palm://com.palm.power/com/palm/power", {
        method : "activityStart",
        parameters : {
            id : "com.palm.mojowhatsup.alive-" + _activity_count,
            duration_ms : ACTIVITY_TIMEOUT
        },
        onSuccess : function(response) {
            Mojo.Log.info("Power Manager Response: activityStart: %j", response);
        },
        onFailure : function(response) {
            Mojo.Log.error("Power Manager Service Request:activityStart FAILED!");
        }
    });
}

PalmServices.clearActivity = function() {
    _powerManagerRequest = new Mojo.Service.Request("palm://com.palm.power/com/palm/power", {
        method : "activityEnd",
        parameters : {
            id : "com.palm.mojowhatsup.alive-" + _activity_count
        },
        onSuccess : function(response) {
            Mojo.Log.info("Power Manager Response: activityEnd: %j", response);
        },
        onFailure : function(response) {
            Mojo.Log.error("Power Manager Service Request:activityEnd FAILED!");
        }
    });
}

PalmServices.setWakeUpAlarm = function() {
    Mojo.Log.info("Setting wake up alarm!");
    _timerManagerRequestSet = new Mojo.Service.Request('palm://com.palm.power/timeout', {
        method : "set",
        parameters : {
            "key" : "mojoWhatsupTimeoutFG",
            "in" : "00:10:00",
            "wakeup" : true,
            "uri" : "palm://com.palm.applicationManager/open",
            "params" : "{'id':'com.palm.mojowhatsup','params':{'action': 'timeout', 'type': 'foreground'}}"
        }
    });
}

PalmServices.setWakeUpAlarmBG = function() {
    _timerManagerRequestSet = new Mojo.Service.Request('palm://com.palm.power/timeout', {
        method : "set",
        parameters : {
            "key" : "mojoWhatsupTimeoutBG",
            "in" : _appPrefs.get().backgroundTimeout,
            "wakeup" : true,
            "uri" : "palm://com.palm.applicationManager/open",
            "params" : "{'id':'com.palm.mojowhatsup','params':{'action': 'timeout', 'type': 'background'}}"
        }
    });
}

PalmServices.clearWakeUpAlarm = function() {
    Mojo.Log.info("Clearing wake up alarm!");
    _timerManagerRequestClear = new Mojo.Service.Request('palm://com.palm.power/timeout', {
        method : "clear",
        parameters : {
            "key" : "mojoWhatsupTimeoutFG"
        }
    });
}

PalmServices.clearWakeUpAlarmBG = function() {
    Mojo.Log.info("Clearing wake up alarm!");
    _timerManagerRequestClear = new Mojo.Service.Request('palm://com.palm.power/timeout', {
        method : "clear",
        parameters : {
            "key" : "mojoWhatsupTimeoutBG"
        }
    });
}
