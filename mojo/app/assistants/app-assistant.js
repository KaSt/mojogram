var _mainStage = 'mainStage';
var _notificationStage = 'nofiticationStage';
var _appData = new AppDataCookie();
var _appPrefs = new PreferencesCookie();
var _plugin = null;
var _mojowhatsupPlugin = null;
var _appDB = null;
var _networkConnected = false;
var _mainAssistant = null;
var _openChatAssistant = null;
var _chatsAssistant = null;
var _appAssistant = null;
var _contactsAssistant = null;
var _mainStageController = null;
var _dashboardAssistant = null;
var _dashboardStageController = null;
var _chatTextClipboard = new HashTable();
var _contactJidNames = new HashTable();
var _lastNotification = 0;
var _contactsImported = false;
var _exitApp = false;
var _myJid = null;
var _statusRequest = null;

function AppAssistant() {
	Mojo.Log.error("******** INTO AppAssistant CONSTRUCTOR");
	_mojowhatsupPlugin = new MojowhatsupPluginModel();
	_appDB = new AppDatabase();
	_appAssistant = this;
	_appData.get();
	_appPrefs.get();
	_myJid = _appData.cookieData.userId + "@s.whatsapp.net";
	// Set locale
    try{
		Mojo.Locale.set(_appPrefs.cookieData.language);
    }catch(e){
        Mojo.Log.error("Error "+Object.toJSON(e));
    }	
	
	PalmServices.subscribeDisplayManager();
}

AppAssistant.prototype.cleanup = function() {
	Mojo.Log.error("******** INTO AppAssistant CLEANUP");
}

AppAssistant.prototype.handleLaunch = function(launchParams) {
	try {
		_mainStageController = this.controller.getStageController(_mainStage);
		_dashboardStageController = this.controller.getStageController(_notificationStage);

		if (!launchParams || launchParams.action == "openChat") {
			Mojo.Log.info("controller is: " + _mainStageController);

			if (_mainStageController) {
				// Application already running (scenario 2)
				Mojo.Log.info("Relaunch!");
				_mainStageController.activate();

				if (launchParams && launchParams.action == "openChat")
					this.openChat(launchParams.chats);

			} else {
				// Need to launch the stage and scene (scenario 1)
				Mojo.Log.info("Launch new stage!");

				var sceneName;
				if (_appData.isRegistered()) {
					sceneName = "main";
				} else {
					sceneName = "account";
				}

				var stageArgs = {
					name : _mainStage,
					lightweight : true
				};
	
				var onSuccess = function(controller) {
					_mainStageController = controller;
					_dashboardStageController = null;
					_mojowhatsupPlugin.createElement(controller.window.document);
					_plugin = controller.get('mojowhatsupPlugin');
					_mojowhatsupPlugin.isReady = false;
					_mojowhatsupPlugin.isRunnerExecuting = false;
					_networkConnected = false;
					_plugin.ready = _mojowhatsupPlugin.ready.bind(_mojowhatsupPlugin);
					_mojowhatsupPlugin.whenReady( function() {
						_mojowhatsupPlugin.registerHandlers();
						controller.pushScene(sceneName);
						if (sceneName == "main" && launchParams) {
							this.openChat(launchParams.chats);
						}
					}.bind(this));
				};
				
				if (_dashboardStageController) {
					this.controller.closeStage(_notificationStage);
				}

				this.controller.createStageWithCallback(stageArgs, onSuccess.bind(this));
			}
		} else if (launchParams.action == "dashboard") {
			Mojo.Log.info(" Launch Parameters: %j", launchParams)

			if (!_dashboardStageController && launchParams && launchParams.action == "dashboard") {
				var onSuccess = function(controller) {
					_dashboardStageController = controller;
					_mainStageController = null;
					_mojowhatsupPlugin.createElement(controller.window.document);
					_plugin = controller.get('mojowhatsupPlugin');
					_mojowhatsupPlugin.isReady = false;
					_mojowhatsupPlugin.isRunnerExecuting = false;
					_networkConnected = false;
					_plugin.ready = _mojowhatsupPlugin.ready.bind(_mojowhatsupPlugin);
					_mojowhatsupPlugin.whenReady(function() {
						_mojowhatsupPlugin.registerHandlers();
						controller.pushScene('dashboard');
					});
				};

				this.controller.createStageWithCallback({
					name : _notificationStage,
					lightweight : true
				}, onSuccess.bind(this), 'dashboard');
			}
		} else if (launchParams.action == "timeout") {
			if (launchParams.type == "foreground") {
				PalmServices.setWakeUpAlarm();
				PalmServices.clearActivity();
				PalmServices.setActivity();
			} else if (launchParams.type == "background") {
				if (_dashboardAssistant != null) {
					_mojowhatsupPlugin.safePluginCall(function() {
						_plugin.closeConnection();
						setTimeout(function() {
							_plugin.sendActive(0);
						}, 10000);
					});
					PalmServices.setWakeUpAlarmBG();
				}
			}
		}
	} catch (e) {
		Mojo.Log.logException(e, "AppAssistant#handleLaunch");
	}
}

AppAssistant.prototype.openChat = function(chats) {
	if (chats) {
		if (chats.length > 1) {
			var allFromTheSame = true;
			var jid = null;
			var chat = null;
			for (var i = 0; i < chats.length; i++) {
				if (chats[i].unread > 0 && chats[i].jid != jid) {
					if (jid == null) {
						jid = chats[i].jid;
						chat = chats[i];
					} else {
						allFromTheSame = false;
						break;
					}
				}
			}
			if (allFromTheSame)
				chats = [chat];
		}

		if (chats.length > 1) {
			if (_openChatAssistant != null)
				_mainStageController.popScene();
			else if (_chatsAssistant != null)
				_mainStageController.activate();
			else
				_mainStageController.pushScene("chats-list", chats);
		} else {
			if (_openChatAssistant != null && _openChatAssistant.chat.jid != chats[0].jid)
				_mainStageController.swapScene("chat", chats[0]);
			else if (_openChatAssistant != null)
				_mainStageController.activate();
			else if (_chatsAssistant != null)
				_mainStageController.pushScene("chat", chats[0]);
			else
				_mainStageController.pushScene("chat", chats[0]);
		}
	}
};


AppAssistant.prototype.notifyUpdateGroup = function(group) {

}

AppAssistant.prototype.notifyUpdateChats = function(notMe, updated) {
	Mojo.Log.info("[AppAssistant]Received notifyUpdateChats!")

	if (_mainAssistant != null && _mainAssistant !== notMe)
		_mainAssistant.updateChats();
	if (_chatsAssistant != null && _chatsAssistant !== notMe)
		_chatsAssistant.updateChats();
	if (updated &&_openChatAssistant != null 
		&& _openChatAssistant.chat.jid == updated.jid) {
		_openChatAssistant.updateChat();																		
	}		
}

AppAssistant.prototype.notifyNewMessage = function(chat, msg) {
	Mojo.Log.info("[AppAssistant]Received notifyNewMessage!")
	if (_openChatAssistant != null) {
		if (_openChatAssistant.chat.jid == msg.remote_jid) {
			_openChatAssistant.updateNewMessage(msg);

			if (_mainStageController.isActiveAndHasScenes() && _displayOn)
				return;
		}
	}

	if (_dashboardAssistant != null)
		_dashboardAssistant.updateDashboardText(chat, msg);

	this.alertNewMessage(chat, msg);
}

AppAssistant.prototype.alertNewMessage = function(chat, msg) {
	var name = this.getNameForJid(chat, msg);
	var bannerText = (name == null? "": name + ": " + msg.formatTextMessage(false, false, 0));

	var launchArguments = {
		action : "openChat",
		chats : [chat]
	};

	// if ((new Date().getTime() - _lastNotification) > 2000) {
	if ((chat.isGroup && _appPrefs.cookieData.groupSound != "silence") || (!chat.isGroup && _appPrefs.cookieData.personSound != "silence")) {
		if ((chat.isGroup && _appPrefs.cookieData.groupSound == "system") || (!chat.isGroup && _appPrefs.cookieData.personSound == "system")) {
			this.controller.playSoundNotification("notifications");
		} else if (chat.isGroup && _appPrefs.cookieData.groupSound == "custom") {
			this.controller.playSoundNotification("notifications", _appPrefs.cookieData.groupTonePath);
		} else if (!chat.isGroup && _appPrefs.cookieData.personSound == "custom") {
			this.controller.playSoundNotification("notifications", _appPrefs.cookieData.personTonePath);
		}
	}

	if ((chat.isGroup && _appPrefs.cookieData.groupVibrate) || (!chat.isGroup && _appPrefs.cookieData.personVibrate))
		this.controller.playSoundNotification("vibrate");
	// }

	_lastNotification = new Date().getTime();

	if ((chat.isGroup && _appPrefs.cookieData.groupBanner) || (!chat.isGroup && _appPrefs.cookieData.personBanner)) {
		this.controller.showBanner({
			messageText : bannerText,
		}, launchArguments, "newMessage");
	}

	if ((chat.isGroup && _appPrefs.cookieData.groupBlink) || (!chat.isGroup && _appPrefs.cookieData.personBlink)) {
		if (_mainStageController != null)
			_mainStageController.indicateNewContent(true);
		else if (_dashboardAssistant != null)
			_dashboardStageController.indicateNewContent(true);
	}
}

AppAssistant.prototype.notifyMessageStatusUpdated = function(message) {
	Mojo.Log.info("[AppAssistant]Received notifyMessageStatusUpdated!")
	if (_openChatAssistant != null) {
		if (_openChatAssistant.chat.jid == message.remote_jid) {
			_openChatAssistant.updateMessageStatus(message);
		}
	}

	this.notifyUpdateChats();
}

AppAssistant.prototype.notifyContactInfoUpdated = function(contactInfo) {
	Mojo.Log.info("[AppAssistant]Received notifyContactInfoUpdated!")

	if (_openChatAssistant != null) {
		if (_openChatAssistant.chat.jid == contactInfo.jid) {
			_openChatAssistant.updateContactInfo(contactInfo);
		}
	}
}

AppAssistant.prototype.getNameForJid = function(chat, msg) {
	var name = "";

	if (msg.from_me)
		return null;
		
	if (msg.isNotification()) return null;

	if (chat.isGroup && _contactJidNames.getItem(msg.remote_resource) !== undefined)
		return _contactJidNames.getItem(msg.remote_resource);

	if (_contactJidNames.getItem(msg.remote_jid) !== undefined)
		return _contactJidNames.getItem(msg.remote_jid);

	return ((msg.notifyname != null && msg.notifyname != "") ? msg.notifyname : chat.jid);
}

AppAssistant.prototype.isTouchPad = function() {
	if (Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("ouch") > -1) {
		return true;
	}

	if (Mojo.Environment.DeviceInfo.screenWidth == 1024) {
		return true;
	}

	if (Mojo.Environment.DeviceInfo.screenHeight == 1024) {
		return true;
	}

	return false;
}

AppAssistant.prototype.isPre3 = function() {
	if (Mojo.Environment.DeviceInfo.screenHeight == 800) {
		return true;
	}

	if (Mojo.Environment.DeviceInfo.screenWidth == 800) {
		return true;
	}

	return false;
}
