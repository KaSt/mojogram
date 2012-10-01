StatusRequest.URL = 'https://sro.whatsapp.net/client/iphone/iq.php?';

function StatusRequest(callback) {
    this.requests = [];
    this.count = 0;
}

StatusRequest.prototype.start = function() {
    _appDB.getAllContactsByCc( function(contacts) {
        var myNumber = _appData.cookieData.phoneNumber;
        if (contacts.length > 0) {
            var i = 0;
            while (i < contacts.length) {
                var cc = contacts[i].cc;
                var url = StatusRequest.URL + "me=" + myNumber + "&cc=" + cc;
                do {
                    url += "&u[]=" + contacts[i].mobilePhone;
                    i++;
                    var nextCc = null;
                    if (i < contacts.length)
                        nextCc = contacts[i].cc;
                } while (nextCc == cc);
                Mojo.Log.info("url %s", url);
                var ccRequest = new CcStatusRequest(url, this);
                ccRequest.request.send(null);
            }
        } else {
            this.end();
        }
    }.bind(this));
}

StatusRequest.prototype.end = function() {
    _statusRequest = null;
    _appData.put("lastStatusRequest", new Date().getTime());
}

function CcStatusRequest(url, statusRequest) {
    this.statusRequest = statusRequest;
    this.index = this.statusRequest.requests.length;
    this.statusRequest.count++;
    this.statusRequest.requests.push(this);
    this.request = new XMLHttpRequest();
    this.request.open('GET', url, true);
    this.request.onreadystatechange = this.requestOnSuccess.bind(this);
}

CcStatusRequest.prototype.requestOnSuccess = function() {
    if (this.request.readyState == 4) {
        if (this.request.status == 200) {
            var parser = new DOMParser();
            var xmlObject = parser.parseFromString(this.request.responseText, "text/xml");
            // Mojo.Log.error(this.request.responseText);

            this.processResponse(xmlObject);
        }
        this.statusRequest.count--;
        if (this.statusRequest.count == 0) {
            this.statusRequest.end();
            if (_contactsAssistant != null) {
                _contactsAssistant.loadContacts();
            } else if (_mainAssistant != null) {
                _mainAssistant.loadContacts();
            }
        }
        delete this;
    }
}

CcStatusRequest.prototype.processResponse = function(xmlObject) {
    var nodes = document.evaluate("/plist/array/dict", xmlObject, null, XPathResult.ANY_TYPE, null);
    var node = nodes.iterateNext();
    while (node) {
        var statusNode = document.evaluate("key[.='S']/following-sibling::*[1]", node, null, XPathResult.ANY_TYPE, null).iterateNext();
        var status = "";
        if (statusNode) {
            status = statusNode.firstChild.nodeValue;
        }
        var jidNode = document.evaluate("key[.='JID']/following-sibling::*[1]", node, null, XPathResult.ANY_TYPE, null).iterateNext();
        var jid = "";
        if (jidNode) {
            jid = jidNode.firstChild.nodeValue + "@s.whatsapp.net";
        }
        // Mojo.Log.error("jid %s, status %s", jid, status);
        _appDB.updateContactStatus(jid, status);

        node = nodes.iterateNext();
    }
}

