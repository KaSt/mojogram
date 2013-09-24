StatusRequest.URL_AUTH = 'https://sro.whatsapp.net/v2/sync/a';
StatusRequest.URL_QUERY = 'https://sro.whatsapp.net/v2/sync/q';


function StatusRequest(callback) {
}

StatusRequest.prototype.getMyStatus = function() {
	var myNumber = _appData.cookieData.phoneNumber;
	var cc = _appData.cookieData.cc;
    this.contacts = ['+' + cc + myNumber];
    this.sendAuth(this.sendQuery.bind(this));
}


StatusRequest.prototype.end = function() {
	_appData.put("lastStatusRequest", new Date().getTime());
}

StatusRequest.prototype.sync = function() {
    this.contacts = [];
    _appDB.getAllContacts(function(contacts) {
        for (var i = 0; i < contacts.length; i++) {
            this.contacts.push("+" + contacts[i].cc + contacts[i].mobilePhone);
        }
        this.sendAuth(this.sendQuery.bind(this));
    }.bind(this));
}

StatusRequest.prototype.sendAuth = function(onAuth) {
    this.authRequest = new XMLHttpRequest();
    this.authRequest.open('POST', StatusRequest.URL_AUTH, true);
    this.authRequest.onreadystatechange = function() {
        if (this.authRequest.readyState == 4) {
            if (this.authRequest.status == 200) {
                var respH = this.authRequest.getResponseHeader("www-authenticate");
                var nonce = respH.substring(respH.indexOf('nonce="') + 'nonce="'.length, respH.length - 1);
                onAuth(nonce);
            }
        }
    }.bind(this);
    _mojowhatsupPlugin.safePluginCall(function() {
        this.authRequest.setRequestHeader("Authorization", _plugin.getAuthorizationString(_appData.cookieData.userId, _appData.cookieData.password, "0"));
        this.authRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        this.authRequest.send();
    }.bind(this));
}

StatusRequest.prototype.sendQuery = function(nonce) {
    this.queryRequest = new XMLHttpRequest();
    this.queryRequest.open('POST', StatusRequest.URL_QUERY, true);
    this.queryRequest.onreadystatechange = function() {
        if (this.queryRequest.readyState == 4) {
            if (this.queryRequest.status == 200) {
                var respString = this.queryRequest.responseText;
                var resp = Mojo.parseJSON(respString);
                this.processResponse(resp.c);                            
            }
        }
    }.bind(this);
    _mojowhatsupPlugin.safePluginCall(function() {
        this.queryRequest.setRequestHeader("Authorization", _plugin.getAuthorizationString(_appData.cookieData.userId, _appData.cookieData.password, nonce));
        this.queryRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var params = 'ut=all&t=c';
        for (var i = 0; i < this.contacts.length; i++) {
            params += '&u[]=' + encodeURIComponent(this.contacts[i]);
        }
        Mojo.Log.error("params = %s", params);
        this.queryRequest.send(params);
    }.bind(this));    
}

StatusRequest.prototype.processResponse = function(contacts) {
    for (var i = 0; i < contacts.length; i++) {
        if (contacts[i].w != 0) {
            var jid = contacts[i].n + "@s.whatsapp.net";
            var status = contacts[i].s;
            var iswa = (contacts[i].w == 1? true: false);
            _appDB.updateContactStatus(jid, status, iswa);
            if (jid == _myJid) {
                _appData.put("statusMessage", status);
                if (_chatsAssistant != null)
                    _chatsAssistant.updateMyStatus();
            }
        }
    }
    this.end();
    if (_contactsAssistant != null) {
        _contactsAssistant.loadContacts();
    } else if (_chatsAssistant != null) {
        _chatsAssistant.loadContacts();
    }
}

