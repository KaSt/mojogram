function DashboardAssistant() {
	this.chats = [];
	this.nunread = 0;
	this.lastChat = null;
	this.lastMessage = null;
	this.closed = false;
}

DashboardAssistant.prototype.setup = function() {
	_dashboardAssistant = this;

	_mojowhatsupPlugin.safePluginCall(function() {
		delete _mediaUploads;
		delete _mediaDownloads;
		_mediaUploads = new HashTable();
		_mediaDownloads = new HashTable();
         if (!_appData.cookieData.passwordV2) {
            _appData.put("password", _plugin.processPassword(_appData.cookieData.password));
            _appData.put("passwordV2", true);
         }    
		_plugin.startBG(_appData.cookieData.userId, _appData.cookieData.password, _appData.cookieData.pushName, "true");
	});

	_mojowhatsupPlugin.whenRunnerExecuting( function() {
		PalmServices.subscribeNetworkStatus();
		setTimeout(function() {
			_plugin.sendActive(0)
		}, 10000);
	}.bind(this));

	this.updateDashboardText();

	this.switchHandler = this.launchMain.bindAsEventListener(this);
	this.dashboardInfoElement = this.controller.get("dashboardinfo");
	Mojo.Event.listen(this.dashboardInfoElement, Mojo.Event.tap, this.switchHandler);
};

DashboardAssistant.prototype.setBGTimeout = function() {
	if (_appPrefs.get().backgroundTimeout == "asArrive") {
		PalmServices.setWakeUpAlarm();
		PalmServices.setActivity();
	} else {
		PalmServices.setWakeUpAlarmBG();
	}
}

DashboardAssistant.prototype.clearBGTimeout = function() {
	if (_appPrefs.get().backgroundTimeout == "asArrive") {
		PalmServices.clearWakeUpAlarm();
		PalmServices.clearActivity();
	} else {
		PalmServices.clearWakeUpAlarmBG();
	}
}

DashboardAssistant.prototype.launchMain = function() {
	this.controller.stageController.popScene();
};

DashboardAssistant.prototype.activate = function(event) {
};

DashboardAssistant.prototype.deactivate = function(event) {
};

DashboardAssistant.prototype.cleanup = function(event) {
	if (!this.closed) {
		_dashboardAssistant = null;
		this.closed = true;
		Mojo.Event.stopListening(this.dashboardInfoElement, Mojo.Event.tap, this.switchHandler);
		try {
			_plugin.exitPlugin();
		} catch (ex) {}
		this.clearBGTimeout();
		if (this.nunread == 0)
			_appAssistant.handleLaunch();
		else if (this.nunread == 1)
			_appAssistant.handleLaunch({
				action : "openChat",
				chats : [this.lastChat]
			});
		else
			_appAssistant.handleLaunch({
				action : "openChat",
				chats : this.chats
			});
	}
};

DashboardAssistant.prototype.updateDashboardText = function(chat, msg) {
	this.lastChat = chat;
	this.lastMessage = msg;

	_appDB.getAllChatsWithMessages( function(chats) {
		this.nunread = 0;
		this.chats = chats;
		var lastChat = null;
		for (var i = 0; i < chats.length; i++) {
			if (lastChat == null && chats[i].unread > 0)
				lastChat = chats[i];
			this.nunread += chats[i].unread;
		}

		if (!chat) {
			this.lastChat = lastChat;
		}

		var renderInfo;
		if (!this.lastChat) {
			renderInfo = Mojo.View.render({
				object : {},
				template : "dashboard/nomessages-template"
			});
		} else {
			var title = emojify(this.lastChat.chatName);
			var jidName = _appAssistant.getNameForJid(this.lastChat, this.lastChat.lastMessage);
			var message = this.lastChat.lastMessage.formatTextMessage(false, true, null, true);
			var subtitle = (jidName == null || !this.lastChat.isGroup ? message : jidName + ": " + message);
			renderInfo = Mojo.View.render({
				object : {
					title : title,
					subtitle : subtitle,
					nunread : this.nunread
				},
				template : "dashboard/notification-template"
			});
		}
		this.controller.get('dashboardinfo').innerHTML = renderInfo;
	}.bind(this), true);
}

