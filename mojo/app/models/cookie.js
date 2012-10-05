function PreferencesCookie() {
    this.cookieName = "prefs";
    this.cookie = false;
    this.cookieData = false;
    this.load();
};

function AppDataCookie() {
    this.cookieName = "appdata";
    this.cookie = false;
    this.cookieData = false;
    this.load();
};

AppDataCookie.prototype.load = function() {
    try {
        if (!this.cookie)
            this.cookie = new Mojo.Model.Cookie(this.cookieName);
    } catch (e) {
        Mojo.Log.logException(e, 'appdatacookie#load');
    }

};

AppDataCookie.prototype.put = function(obj, value) {
    try {
        this.load();
        if (value != undefined) {
            this.cookieData[obj] = value;
            this.cookie.put(this.cookieData);
        } else {
            this.cookieData = obj;
            this.cookie.put(obj);
        }
    } catch (e) {
        Mojo.Log.logException(e, 'preferenceCookie#put');
    }
};

AppDataCookie.prototype.isRegistered = function() {
    try {
        this.get();
        return this.cookieData.registered;
    } catch (e) {
        Mojo.Log.logException(e, 'appdatacookie#isRegistered');
    }
};

AppDataCookie.prototype.get = function(reload) {
    try {
        this.cookieData = this.cookie.get();
        if (!this.cookieData || reload) {
            this.cookieData = {
                cc : "",
                phoneNumber : "",
                password : "",
                userId : "",
                pushName : "",
                smsCode : "",
                max_groups : 30,
                max_participants : 31,
                max_subject : 25,
                registered : false,
                lastStatusRequest : 0
            };

            this.put(this.cookieData);
        }
        if (!("max_groups" in this.cookieData)) {
            this.setDefaultServerProperties();
            this.put(this.cookieData);
        }
        this.setDefaultNewValues();
        return this.cookieData;
    } catch (e) {
        Mojo.Log.logException(e, 'appdatacookie#get');
    }
};

AppDataCookie.prototype.setDefaultNewValues = function() {
    if (!("lastStatusRequest" in this.cookieData)) 
        this.cookieData.lastStatusRequest = 0;
    this.put(this.cookieData);              
}


AppDataCookie.prototype.setDefaultServerProperties = function() {
    this.cookieData.max_groups = 30;
    this.cookieData.max_participants = 31;
    this.cookieData.max_subject = 25;
}

AppDataCookie.prototype.setServerProperties = function(properties) {
    if ("max_subject" in properties)
        this.put("max_subject", properties.max_subject);
    if ("max_groups" in properties)
        this.put("max_groups", properties.max_groups);
    if ("max_participants" in properties)
        this.put("max_participants", properties.max_participants);
}

/**
 * Preferences cookie
 */

PreferencesCookie.prototype.load = function() {
    try {
        if (!this.cookie)
            this.cookie = new Mojo.Model.Cookie(this.cookieName);
    } catch (e) {
        Mojo.Log.logException(e, 'prefscookie#load');
    }

};

PreferencesCookie.prototype.put = function(obj, value) {
    try {
        this.load();
        if (value != undefined) {
            this.cookieData[obj] = value;
            this.cookie.put(this.cookieData);
        } else {
            this.cookieData = obj;
            this.cookie.put(obj);
        }
    } catch (e) {
        Mojo.Log.logException(e, 'prefscookie#put');
    }
};

PreferencesCookie.prototype.get = function(reload) {
    try {
        this.cookieData = this.cookie.get();
        if (!this.cookieData || reload) {
            this.cookieData = {
                personVibrate : true,
                personSound : "system",
                personTonePath : "",
                personToneName : "",
                personBanner : true,
                personBlink : true,
                groupVibrate : true,
                groupSound : "system",
                groupTonePath : "",
                groupToneName : "",
                groupBanner : true,
                groupBlink : true,
                backgroundTimeout : "00:15:00",
                chatTextSize : 16,
                imageResolution: 800,
                phoneTypes: "mobile",
                language: Mojo.Locale.getCurrentLocale()
            };

            this.put(this.cookieData);
        }
	    this.setDefaultNewValues();
        
        return this.cookieData;
    } catch (e) {
        Mojo.Log.logException(e, 'prefscookie#get');
    }
};


PreferencesCookie.prototype.setDefaultNewValues = function() {
	if (!("chatTextSize" in this.cookieData)) 
		this.cookieData.chatTextSize = 16;
	if (!("imageResolution" in this.cookieData))
		this.cookieData.imageResolution = 800;
	if (!("phoneTypes" in this.cookieData))
		this.cookieData.phoneTypes = "mobile";
	if (!("language" in this.cookieData))
		this.cookieData.language = Mojo.Locale.getCurrentLocale();
	this.put(this.cookieData);				
}

