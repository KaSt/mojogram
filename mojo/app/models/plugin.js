function MojowhatsupPluginModel() {
	this.isReady = false;
	this.loginResult = false;
	this.isRunnerExecuting = false;
	this.incomingMessages = [];
	this.processingMessages = false;
	this.accountRequestResponse = false;
	this.pictureIdsQueue = [];
	this.picturesChanged = false;
	this.deleteAccountResult = false;
}

MojowhatsupPluginModel.jsonParse = function(string) {
	try {
		// attempt parser
		return JSON.parse(string);
	} catch (e) {
		//Mojo.Log.logException(e, 'wircPlugin#jsonParse');
		//Mojo.Log.error('string:', string);

		// fall back to eval parser
		return eval(string);
	}
	// wtf?
	return false;
}

MojowhatsupPluginModel.prototype.safePluginCall = function(f) {
	try {
		f();
	} catch (e) {
		Mojo.Log.error("Error calling plugin method! " + e);
		_appAssistant.controller.getActiveStageController().activeScene().showAlertDialog({
			title : $L("Plugin error"),
			message : $L("Plugin does not respond!. Please restart application!"),
			choices : [{
				label : $L('Close application'),
				value : "close",
				type : 'negative'
			}],
			preventCancel : true,
			onChoose : function(value) {
				if (value == 'close') {
					if (_dashboardStageController)
						_appAssistant.controller.closeStage(_notificationStage);
					if (_mainStageController)
						_appAssistant.controller.closeStage(_mainStage);
				}
			}
		});
	}
}

MojowhatsupPluginModel.prototype.createElement = function(document) {
	var pluginObj = document.createElement("object");

	pluginObj.id = "mojowhatsupPlugin";
	pluginObj.type = "application/x-palm-remote";
	pluginObj.width = 0;
	pluginObj.height = 0;
	pluginObj['x-palm-pass-event'] = true;

	var param1 = document.createElement("param");
	param1.name = "appid";
	param1.value = Mojo.Controller.appInfo.id;

	var param2 = document.createElement("param");
	param2.name = "exe";
	param2.value = "mojowhatsup_service_plugin";

	var param3 = document.createElement("param");
	param3.name = "Param1";
	param3.value = "-1";
	// socket read timeout in seconds: -1 block select forever

	var param4 = document.createElement("param");
	param4.name = "Param2";
	param4.value = "1";
	// send ping 1 = true , 0 = false

	var param5 = document.createElement("param");
	param5.name = "Param3";
	param5.value = "1320";

	var param6 = document.createElement("param");
	param6.name = "Param4";
	param6.value = Media.MOJOWHATSUP_MEDIA_DIR;

	// ping interval in seconds

	pluginObj.appendChild(param1);
	pluginObj.appendChild(param2);
	pluginObj.appendChild(param3);
	pluginObj.appendChild(param4);
	pluginObj.appendChild(param5);
	pluginObj.appendChild(param6);

	document.body.appendChild(pluginObj);
}

MojowhatsupPluginModel.prototype.registerHandlers = function() {
	_plugin.testLoginResult = this.testLoginResult.bind(this);
	_plugin.runnerExecuting = this.runnerExecuting.bind(this);
	_plugin.sendOfflineMessages = function() {
		setTimeout(this.sendOfflineMessages.bind(this), 1);
	}.bind(this);
	_plugin.messageStatusUpdate = function(msgString) {
		setTimeout(this.messageStatusUpdate.bind(this), 1, msgString);
	}.bind(this);
	_plugin.contactInfoUpdated = function(jid, status, lastSeen) {
		setTimeout(this.contactInfoUpdated.bind(this), 1, jid, status, lastSeen);
	}.bind(this);
	_plugin.newChatState = this.newChatState.bind(this);
	_plugin.messageForMe = function(msgString) {
		Mojo.Log.info("Message received: " + msgString);
		var msg = Message.fromJSONString(msgString);
		Mojo.Log.info("Message received JSON: " + JSON.stringify(msg));
		this.messageForMe(msg, true);
	}.bind(this);
	_plugin.onGroupInfo = function(groupString) {
		// var groupString2 = groupString.replace("perras",'\\uF0\\u9F\\u92\\u8B');
		//Mojo.Log.info("group string = " + groupString2);
		var json = MojowhatsupPluginModel.jsonParse(groupString);
		setTimeout(this.onGroupInfo.bind(this), 1, json);
	}.bind(this);
	_plugin.onGroupNewSubject = function(groupString) {
		Mojo.Log.info("group string = " + groupString);
		var json = MojowhatsupPluginModel.jsonParse(groupString);
		setTimeout(this.onGroupNewSubject.bind(this), 1, json);
	}.bind(this);
	_plugin.codeRequestResponse = this.setRequestResponse.bind(this);
	_plugin.registerRequestResponse = this.setRequestResponse.bind(this);
	_plugin.existRequestResponse = this.setRequestResponse.bind(this);
	_plugin.uploadRequestResponse = function(responseString) {
		var json = MojowhatsupPluginModel.jsonParse(responseString);
		setTimeout(this.uploadRequestResponse.bind(this), 1, json);
	}.bind(this);
	_plugin.onGetParticipants = function(gjid, participants) {
		var json = MojowhatsupPluginModel.jsonParse(participants);
		setTimeout(this.onGetParticipants.bind(this), 1, gjid, json);
	}.bind(this);
	_plugin.onServerProperties = function(properties) {
		var json = MojowhatsupPluginModel.jsonParse(properties);
		setTimeout(_appData.setServerProperties.bind(_appData), 1, json);
	}
	_plugin.onSendGetPictureIds = function(ids) {
		setTimeout( function(ids) {
			var arrayIds = MojowhatsupPluginModel.jsonParse(ids);
			if (arrayIds.length == 0) {
				return;
			}
			Mojo.Log.info("onSendGetPictureIds %d, queue %d, %j", arrayIds.length, this.pictureIdsQueue.length, arrayIds);
			if (this.pictureIdsQueue.length == 0) {
				this.picturesChanged = false;
				this.pictureIdsQueue = this.pictureIdsQueue.concat(arrayIds);
				setTimeout(this.processPictureIdsQueue.bind(this), 1);
			} else {
				this.pictureIdsQueue = this.pictureIdsQueue.concat(arrayIds);
				setTimeout(this.processPictureIdsQueue.bind(this), 1);
			}
		}.bind(this), 1, ids);
	}.bind(this);
	_plugin.onSendGetPicture = function(jid, picturePath, id) {
		setTimeout(this.onSendGetPicture.bind(this), 1, jid, picturePath, id);
	}.bind(this);
	_plugin.onPictureChanged = function(jid, author, set) {
		setTimeout(this.onPictureChanged.bind(this), 1, jid, author, set);
	}.bind(this);
	_plugin.ondDeleteAccount = function(result) {
		this.deleteAccountResult = result;
	}.bind(this);
	_plugin.onLoginFailure = function(type, expire_date) {
		setTimeout(this.onLoginFailure.bind(this), 1, type, expire_date);
	}.bind(this);
}

MojowhatsupPluginModel.prototype.onLoginFailure = function(type, expire_date) {
	var message = "";
	if (type == "password") {
		message = $L("Invalid password. Please, check your account settings.");
	} else {
		message = $L("Your account expired on #{date}. You can purchase one year subscription.").interpolate({date: Mojo.Format.formatDate(new Date(expire_date * 1000), 'short')});
	}
	
	
	var controller = _appAssistant.controller.getActiveStageController().activeScene();
	controller.showAlertDialog({
		title : $L("Login failure"),
		message : message,
		choices : [{
			label : $L('Go to account settings'),
			value : "go",
			type : 'negative'
		}],
		preventCancel : true,
		onChoose : function(value) {
			if (value == "go") {
				var stageController = _appAssistant.controller.getActiveStageController();				
				stageController.popScenesTo("main");
				stageController.pushScene("account");
			}
		}
	});
}

MojowhatsupPluginModel.prototype.onPictureChanged = function(jid, author, set) {
	if ((jid.indexOf("@g.us") != -1) && (author != null) && (author != "")) {
		var msg = new Message(jid, "");
		msg.from_me = false;
		msg.notifyname = (author == "" ? _myJid : author);
		if (set == "true") {
			msg.status = Message.STATUS_PICTURE_CHANGED_SET;
			try {
				_plugin.sendGetPictureIds(JSON.stringify([jid]));
			} catch (e) {
				Mojo.Log.error("error plugin:onPictureChanged: %j", e);
			}
		} else {
			msg.status = Message.STATUS_PICTURE_CHANGED_DELETE;
		}
		this.messageForMe(msg, false);
	}

	if ((jid.indexOf("@g.us") == -1) && (author != null)) {
		if (set == "true") {
			try {
				_plugin.sendGetPictureIds(JSON.stringify([jid]));
			} catch (e) {
				Mojo.Log.error("error plugin:onPictureChanged: %j", e);
			}
		}
	}

	if (set == "false") {
		_appDB.findChat(jid, function(chat) {
			if (chat != null) {
				_mojowhatsupPlugin.safePluginCall(function() {
					_plugin.removeFile(chat.picturepath);
				});
				_appDB.updateChatPicture(chat.jid, null, null, function() {
					_appAssistant.notifyUpdateChats(undefined);
					this.updatePicture(jid, null);
				}.bind(this));
			}
		}.bind(this));

		if (jid == _myJid) {
			_mojowhatsupPlugin.safePluginCall(function() {
				_plugin.removeFile(_appData.cookieData.mypicture);
			});
			_appData.put("mypicture", "");
			if (_prefsAssistant != null) {
				_prefsAssistant.updatePicture(null);
			}
		}
	}
}

MojowhatsupPluginModel.prototype.onSendGetPicture = function(jid, picturePath, id) {
	if ((jid != "error") && (picturePath != "")) {
		Mojo.Log.info("onSendGetPicture no error %s %s", jid, picturePath);
		_appDB.findChat(jid, function(chat) {
			if (jid == _myJid) {
				_appData.put("mypicture", picturePath);
				_appData.put("mypictureid", id);
				if (_prefsAssistant != null) {
					_prefsAssistant.updatePicture(picturePath);
				}
			}
			if (chat != null) {
				_appDB.updateChatPicture(chat.jid, id, picturePath, function() {
					this.updatePicture(jid, picturePath);
				}.bind(this));
			} else {
			    this.updatePicture(jid, picturePath);
			}
			setTimeout(this.processPictureIdsQueue.bind(this), 1);
		}.bind(this));
	} else {
		this.updatePicture(jid, "error");

		if (jid == _myJid) {
			if (_prefsAssistant != null) {
				_prefsAssistant.updatePicture("error");
			}
		}

		setTimeout(this.processPictureIdsQueue.bind(this), 1);
	}
}

MojowhatsupPluginModel.prototype.updatePicture = function(jid, picturepath) {
	if ((_groupAssistant != null) && (_groupAssistant.chat.jid == jid)) {
		_groupAssistant.updatePicture(picturepath);
	}
	if (picturepath != "error") {
		if ((_openChatAssistant != null) && (_openChatAssistant.chat.jid == jid)) {
			_openChatAssistant.updatePicture(picturepath);
		}

		if (_contactsAssistant != null) {
			_contactsAssistant.updateContactPicture(jid, picturepath);
		}
	}
}

MojowhatsupPluginModel.prototype.processPictureIdsQueue = function() {
	if (this.pictureIdsQueue.length == 0) {
		if (this.picturesChanged) {
			Mojo.Log.info("Updating chats...");
			_appAssistant.notifyUpdateChats(undefined);
			this.picturesChanged = false;
		}
		return;
	}

	var item = this.pictureIdsQueue[0];
	Mojo.Log.info("Processing next picture id item %j, left %d", item, this.pictureIdsQueue.length);
	this.pictureIdsQueue.shift();

	_appDB.findChat(item.jid, function(chat) {
		if (item.jid == _myJid) {
			var mypictureid = _appData.cookieData.mypictureid;
			if (!mypictureid)
				mypictureid = "";
			if ((mypictureid != item.id) || (chat == null)) {
				// _appData.put("mypictureid", item.id);
				try {
					_plugin.sendGetPicture(_myJid, "image", mypictureid, item.id);
				} catch (e) {
					Mojo.Log.error("error plugin onSendGetPictureIds %j", e);
					setTimeout(this.processPictureIdsQueue.bind(this), 1);
				}
			}
		}
		if (chat != null)
			Mojo.Log.info("chat pictureid = %s, item id = %s", chat.pictureid, item.id);
		if ((chat != null) && (item.id == "")) {
			if (chat.picturepath != null) {
				// Mojo.Log.error("A borrar toca %s", item.jid);
				this.picturesChanged = true;
				this.onPictureChanged(item.jid, null, "false");
			}
			setTimeout(this.processPictureIdsQueue.bind(this), 1);
		} else if ((chat != null) && (item.id != chat.pictureid)) {
			Mojo.Log.info("picture changed for %s", item.jid);
			this.picturesChanged = true;
			// _appDB.updateChatPicture(chat.jid, item.id, chat.picturepath);
			try {
				_plugin.sendGetPicture(chat.jid, "image", (chat.pictureid ? chat.pictureid : ""), item.id);
			} catch (e) {
				Mojo.Log.error("error plugin onSendGetPictureIds %j", e);
				setTimeout(this.processPictureIdsQueue.bind(this), 1);
			}
		} else if (!chat) {
            try {
                _plugin.sendGetPicture(item.jid, "preview", "", item.id);
            } catch (e) {
                Mojo.Log.error("error plugin onSendGetPictureIds %j", e);
                setTimeout(this.processPictureIdsQueue.bind(this), 1);
            }
		}
	}.bind(this));
}

MojowhatsupPluginModel.prototype.uploadRequestResponse = function(response) {
	var mu = MediaUploader.getUploader(response.msgId);
	if (mu != undefined) {
		if (response.returnValue) {
			mu.uploadSuccess(response);
		} else {
			mu.uploadFailure(response);
		}
	}
}

MojowhatsupPluginModel.prototype.ready = function() {
	this.isReady = true;
}

MojowhatsupPluginModel.prototype.runnerExecuting = function(status) {
	this.isRunnerExecuting = (status == "true" ? true : false);
}

MojowhatsupPluginModel.prototype.testLoginResult = function(result) {
	this.loginResult = result;
}

MojowhatsupPluginModel.prototype.setRequestResponse = function(response) {
	this.accountRequestResponse = response;
}

MojowhatsupPluginModel.prototype.onGetParticipants = function(gjid, participants) {
	_appDB.findGroup(gjid, function(group) {
		if (group != null) {
			group.setParticipantsArray(participants);
			_appDB.updateGroupParticipants(group);
		}
	}.bind(this));
}

MojowhatsupPluginModel.prototype.onGroupInfo = function(gJson) {
	var group = new Group(gJson.gjid, gJson.subject, gJson.owner, gJson.subject_owner, gJson.subject_t, gJson.creation_t, "");

	if (group.owner == _myJid) {
		Group.addOwningGroup(group);
	}

	_appDB.createOrUpdateGroup(group, function(group) {
		_appDB.findOrCreateChat(group.gjid, function(chat) {
			if (chat.chatName != group.subject) {
				if (group.subject != null && group.subject != "")
					chat.chatName = group.subject;
				_appDB.updateChat(chat, function(c) {
					_appAssistant.notifyUpdateChats(undefined, chat);
				});
			} else {
				_appAssistant.notifyUpdateChats(undefined);
			}
		});
	});
}

MojowhatsupPluginModel.prototype.onGroupNewSubject = function(gJson) {
	var group = new Group(gJson.gjid, gJson.subject, gJson.owner, gJson.subject_owner, gJson.subject_t, gJson.creation_t, "");
	_appDB.updateGroupSubject(group, function(group) {
		_appDB.findOrCreateChat(group.gjid, function(chat) {
			if (chat.chatName != group.subject) {
				if (group.subject != null && group.subject != "")
					chat.chatName = group.subject;
				_appDB.updateChat(chat, function(c) {
					_appAssistant.notifyUpdateChats(undefined, chat);
				});
			} else {
				_appAssistant.notifyUpdateChats(undefined, chat);
			}
		});
		var msg = new Message(group.gjid, group.subject);
		msg.from_me = false;
		msg.timestamp = group.subject_t;
		msg.notifyname = group.subject_owner;
		msg.status = Message.STATUS_SUBJECT_CHANGED;
		this.messageForMe(msg, true);
	}.bind(this));
}

MojowhatsupPluginModel.prototype.processMessages = function() {
	var msg = this.incomingMessages[0];
	this.incomingMessages.shift();

	msg.timestamp = msg.timestamp * 1000;

	_appDB.findMessage(msg, function(found) {
		if (found == null) {
			_appDB.saveMessage(msg, function(msg) {
				_appDB.findOrCreateChat(msg.remote_jid, function(chat) {
					Mojo.Log.info("update chat = " + JSON.stringify(chat));
					if (_openChatAssistant != null && _openChatAssistant.chat.jid == chat.jid)
						chat.unread = 0;
					else
						chat.unread = chat.unread + 1;
					chat.lastMessage = msg;

					_appDB.updateChat(chat, function(updated) {
						_appAssistant.notifyUpdateChats(undefined);
						_appAssistant.notifyNewMessage(chat, msg);
						Mojo.Log.info("Mensajes en la cola = " + this.incomingMessages.length);

						if (this.incomingMessages.length > 0)
							setTimeout(this.processMessages.bind(this), 1);
						else
							this.processingMessages = false;

					}.bind(this));
				}.bind(this));
				if (!msg.from_me && msg.wants_receipt) {
					_mojowhatsupPlugin.safePluginCall(function() {
						_plugin.sendMessageReceived(msg.toJSONString());
					});
				}
			}.bind(this));
		} else {
			if (!found.from_me && found.wants_receipt) {
				_mojowhatsupPlugin.safePluginCall(function() {
					_plugin.sendMessageReceived(found.toJSONString());
				});
			}
			if (this.incomingMessages.length > 0)
				setTimeout(this.processMessages.bind(this), 10);
			else
				this.processingMessages = false;
		}
	}.bind(this));
}

MojowhatsupPluginModel.prototype.messageForMe = function(msg, timeout) {
	// Ignore server messages
	if (msg.remote_jid == "Server@s.whatsapp.net")
		return;

	this.incomingMessages.push(msg);
	if (!this.processingMessages) {
		this.processingMessages = true;
		if (timeout)
			setTimeout(this.processMessages.bind(this), 1);
		else
			this.processMessages();
	}
}

MojowhatsupPluginModel.prototype.newChatState = function(newState) {
	Mojo.Log.info("[plugin.js] Received new chat state " + parseInt(newState));
}

MojowhatsupPluginModel.prototype.contactInfoUpdated = function(jid, status, lastSeen) {
	Mojo.Log.info("[plugin.js] Received contact info " + String(jid) + " " + String(status) + " " + String(lastSeen));
	_appAssistant.notifyContactInfoUpdated({
		jid : jid,
		status : parseInt(status),
		lastSeen : parseInt(lastSeen * 1000)
	});
}

MojowhatsupPluginModel.prototype.sendOfflineMessages = function() {
	Mojo.Log.info("[plugin.js] Received send offline messages ");
	_appDB.getUnsentMessages( function(messages) {
		this.whenRunnerExecuting(function() {
			for (var i = 0; i < messages.length; i++) {
				_mojowhatsupPlugin.safePluginCall(function() {
					_plugin.sendMessage(messages[i].toJSONString());
				});
			}
		});
	}.bind(this));
}

MojowhatsupPluginModel.prototype.messageStatusUpdate = function(msgString) {
	Mojo.Log.info("[plugin.js] Received message status updated " + msgString);
	var msg = Message.fromJSONString(msgString);
	// msg.timestamp = new Date().getTime();
	_appDB.updateMessageStatus(msg);
	_appAssistant.notifyMessageStatusUpdated(msg);
}

MojowhatsupPluginModel.prototype.whenReady = function(callback) {
	if (!this.isReady) {
		setTimeout(this.whenReady.bind(this), 100, callback);
	} else {
		callback();
	}
}

MojowhatsupPluginModel.prototype.whenRunnerExecuting = function(callback) {
	if (this.isRunnerExecuting === false) {
		setTimeout(this.whenRunnerExecuting.bind(this), 250, callback);
	} else {
		callback();
	}
}

