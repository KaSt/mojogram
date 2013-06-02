var colorPalette = ["SlateBlue", "Olive", "red", "green", "brown", "orange", "blue", "DeepPink", "brown", "black", "yellow", "purple", "gold", "violet", "DarkCyan", "Tomato", "Fuchsia", "Indigo"];

function ChatAssistant(chat, msgToSend) {
	this.INCREMENT_LOAD = 25;
	this.messagesToLoad = this.INCREMENT_LOAD;
	this.colorIndex = 0;
	this.chat = chat;
	this.nameDisplayHash = new HashTable();
	this.msgToSend = msgToSend;
	this.forwardMsg = null;	this.messageListModel = {
		items : []
	};
	this.timerTyping = null;
	_openChatAssistant = this;
	this.scrollHolded = false;
}

ChatAssistant.prototype.setup = function() {

	this.appMenuItems = this.buildAppMenuItems();

	this.controller.setupWidget(Mojo.Menu.appMenu, {
		omitDefaultItems : true
	}, this.appMenuModel = {
		visible : true,
		items : this.appMenuItems
	});

	this.buttonMoreWidget = this.controller.get("moreMessages");
	this.controller.setupWidget("moreMessages", {
		type : Mojo.Widget.activityButton
	}, this.moreMessagesModel = {
		label : $L("Show previous messages"),
		buttonClass : "secondary",
		disabled : true
	});

	this.messageListWidget = this.controller.get("messageList");

	this.controller.setupWidget("messageList", {
		itemTemplate : "chat/message-list-entry",
		dividerTemplate : "chat/message-list-divider",
		dividerFunction : this.messageDateTime,
		swipeToDelete : true,
		hasNoWidgets : true,
		formatters : {
			imagePreview : function(value, model) {
				if ("previewImage" in model) {
					return model.previewImage();
				}
				return "";
			},
			time : function(value, model) {
				return Mojo.Format.formatDate(new Date(model.timestamp), {
					time : 'short'
				});
			},
			msgType : function(value, model) {
				if ("data" in model && model.isNotification())
					return "notification";
				return (model.from_me ? "my-chat" : "their-chat");
			},
			statusIcon : function(value, model) {
				if ('statusIconStyle' in model)
					return model.statusIconStyle();
			},
			nameVisible : function(value, model) {
				if ("data" in model && model.isNotification())
					return "none";
				return (this.chat.isGroup && model.notifyname != null ? "inline-block" : "none");
			}.bind(this),
			contactName : function(value, model) {
				var info = this.nameDisplayHash.getItem(model.remote_resource);
				if (info === undefined) {
					return model.notifyname;
				}
				return info.name;
			}.bind(this),
			contactColor : function(value, model) {
				var info = this.nameDisplayHash.getItem(model.remote_resource);
				if (info === undefined) {
					return "blue";
				}
				return info.color;
			}.bind(this),
			data : function(value, model) {
				if ("data" in model)
					return model.formatTextMessage(true, true, Number(_appPrefs.cookieData.chatTextSize) + 2);
			},
			textSize : function(value, model) {
				return String(_appPrefs.cookieData.chatTextSize);
			}
		}
	}, this.messageListModel);

	this.messageTextWidget = this.controller.get("messageText");
	this.controller.setupWidget("messageText", this.attributes = {
		hintText : $L("Write your message here..."),
		autofocus : true,
		multiline : true,
		modifierState : Mojo.Widget.shiftSingle,
		enterSubmits : false,
		focusMode : Mojo.Widget.focusInsertMode,
		changeOnKeyPress : true,
		emoticons : true
	}, this.model = {
		value : String((_chatTextClipboard.getItem(this.chat.jid) !== undefined ? _chatTextClipboard.getItem(this.chat.jid) : ""))
	});

	this.menuModel = {
		visible : true,
		items : []
	};

	if (_mainAssistant != null && _appAssistant.isTouchPad()) {
		this.menuModel.items.push({
			icon : "back",
			command : "goBack"
		});

		this.controller.get("emoticon-Button").addClassName("touchpad");
	}

	this.menuModel.items = this.menuModel.items.concat([{
		icon : "emoticon",
		command : "emoji"
	}, {}, {}, {}, {
		icon : "send",
		command : "send"
	}]);

	this.controller.setupWidget(Mojo.Menu.commandMenu, {
		spacerHeight : 0,
		menuClass : "no-fade right"
	}, this.menuModel);
	

    var imgSize = '32:32';
    // if (_appAssistant.isPre3())
        // imgSize = '48:48';
    var itemPicture = {};
    itemPicture.command = "viewPicture";
    if (this.chat.picturepath) {
        itemPicture.iconPath = '/var/luna/data/extractfs' + encodeURIComponent(this.chat.picturepath) + ':0:0:' + imgSize + ':3'; 
    } else {
        itemPicture.icon = (this.chat.isGroup? "icon-header group": "icon-header person");
    }
    
    var titleWidth = 200;
    if (_appAssistant.isTouchPad()) {
        titleWidth = Mojo.Environment.DeviceInfo.screenWidth - 120;
    }

	this.controller.setupWidget(Mojo.Menu.viewMenu, 
	    this.viewMenuAttributes = {
        spacerHeight : 0,
        menuClass : "no-fade"
    }, 
    this.viewMenuModel = {
        visible : true,
        items : [{
            items : [itemPicture,
            {
                template: "chat/header-title",
                label: emojify(this.chat.chatName, 18),
                command: (this.chat.isGroup? "groupProperties": ""),
                width: titleWidth
            }, {
                icon : "attach",
                command : "attach",
            }]
        }]
    });
	

	// this.controller.get('header').update(emojify(this.chat.chatName, 18));

	this.keyPressHandler = this.keyPressHandler.bindAsEventListener(this);
	this.textChangedHandler = this.textChangedHandler.bindAsEventListener(this);
	this.listDeleteHandler = this.listDeleteHandler.bindAsEventListener(this);
	this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
	this.moreMessagesHandler = this.moreMessagesHandler.bindAsEventListener(this);

	Mojo.Event.listen(this.buttonMoreWidget, Mojo.Event.tap, this.moreMessagesHandler);
	Mojo.Event.listen(this.messageListWidget, Mojo.Event.listDelete, this.listDeleteHandler);
	Mojo.Event.listen(this.messageListWidget, Mojo.Event.listTap, this.listTapHandler);
	Mojo.Event.listen(this.messageTextWidget, Mojo.Event.propertyChange, this.textChangedHandler);
    Mojo.Event.listen(this.messageListWidget, Mojo.Event.dragStart, this.handleScrollHold.bindAsEventListener(this));
    Mojo.Event.listen(this.messageListWidget, Mojo.Event.dragEnd, this.handleScrollHold.bindAsEventListener(this));
    

	this.ctrlKeyPressed = false;
}


ChatAssistant.prototype.handleScrollHold = function (event) {
    if (event.type == Mojo.Event.dragStart) {
        this.scrollHolded = true;
    } else if (event.type == Mojo.Event.dragEnd) {
        this.scrollHolded = false;
    }
}

ChatAssistant.prototype.buildAppMenuItems = function() {
	var items = [Mojo.Menu.editItem, 
	// {
		// label : $L("Send image"),
		// command : "sendImage"
	// }, {
		// label : $L("Send audio"),
		// command : "sendAudio"
	// }, {
		// label : $L("Send video"),
		// command : "sendVideo"
	// }, {
		// label : $L("Send location"),
		// command : "sendLocation"
	// }, {
		// label : $L("Send contact"),
		// command : "sendContact"
	// },
	{
		label : $L("Delete all messages"),
		command : "deleteallmessages"
	},
	{
		label : $L("Preferences"),
		command : Mojo.Menu.prefsCmd
	}, {
		label : $L("Account settings"),
		command : "accountSettings"
	}, {
		label : $L("Help"),
		command : Mojo.Menu.helpCmd
	}, {
		label : $L("Exit"),
		command : "exit"
	}];

	// if (this.chat.isGroup) {
		// items.splice(6, 0, {
			// label : $L("Group properties"),
			// command : "groupProperties"
		// });
	// } else {
		// items.splice(6, 0, {
			// label : $L("View profile picture"),
			// command : "viewPicture"
		// });
	// }

	// if (this.chat.isGroup) {
		// if (this.chat.muteexpiry && (this.chat.muteexpiry > (new Date().getTime()) / 1000)) {
			// items.splice(6, 0, {
				// label : $L("Muted") + " (" + Mojo.Format.formatDate(new Date(this.chat.muteexpiry * 1000), 'short') + ")",
				// items : [{
					// label : $L("Unmute"),
					// command : "unmute"
				// }]
			// });
		// } else {
			// items.splice(6, 0, {
				// label : $L("Mute"),
				// items : [{
					// label : "8 " + $L("hours"),
					// command : "mute8"
				// }, {
					// label : "24 " + $L("hours"),
					// command : "mute24"
				// }, {
					// label : "1 " + $L("week"),
					// command : "muteWeek"
				// }]
			// });
		// }
	// }

	return items;
}

ChatAssistant.prototype.updatePicture = function (path) {
    var imgSize = '32:32';
    // if (_appAssistant.isPre3())
        // imgSize = '48:48';
            
    this.chat.picturepath = path;
    var itemPicture = this.viewMenuModel.items[0].items[0];
    itemPicture.icon = undefined;
    itemPicture.iconPath = undefined;
    itemPicture.command = "viewPicture";    
    if (this.chat.picturepath) {
        itemPicture.iconPath = '/var/luna/data/extractfs' + encodeURIComponent(this.chat.picturepath) + ':0:0:' + imgSize + ':3'; 
    } else {
        itemPicture.icon = (this.chat.isGroup? "icon-header group": "icon-header person");
    }
    this.controller.modelChanged(this.viewMenuModel);    
}


ChatAssistant.prototype.ready = function() {
	this.loadMessages(this.messagesToLoad, function() {
		if (this.chat.unread > 0) {
			this.chat.unread = 0;
			_appDB.updateChat(this.chat, function(c) {
				_appAssistant.notifyUpdateChats(this);
			});
		}

		if (!this.chat.isGroup) {
			_mojowhatsupPlugin.whenRunnerExecuting( function() {
				_mojowhatsupPlugin.safePluginCall( function() {
					_plugin.doStateRequest(this.chat.jid);
				}.bind(this));
			}.bind(this));
		}

		try {
			_plugin.sendGetPictureIds(JSON.stringify([this.chat.jid]));
		} catch (e) {
			Mojo.Log.error("error chat-assistant: setup: %j", e);
		}

		if (this.msgToSend) {
			Mojo.Log.info("Forward: Message to send = ", this.msgToSend.toJSONString());
			_mojowhatsupPlugin.messageForMe(this.msgToSend, false);
			_mojowhatsupPlugin.safePluginCall( function() {
				_plugin.sendMessage(this.msgToSend.toJSONString());
			}.bind(this));
		}
	}.bind(this));
}

ChatAssistant.prototype.messageTextKeydown = function(event) {
	if (event && event.originalEvent.keyCode === 129) {
		this.ctrlKeyPressed = true;
	}
}

ChatAssistant.prototype.messageTextKeyup = function(event) {
	if (event) {
		if (event.originalEvent.keyCode === 129) {
			this.ctrlKeyPressed = false;
		} else if (Mojo.Char.isEnterKey(event.originalEvent.keyCode) && this.ctrlKeyPressed) {
			Event.stop(event);
			this.handleCommand({
				type : Mojo.Event.command,
				command : "send"
			});
		}
	}
}

ChatAssistant.prototype.textChangedHandler = function(event) {
	if (!this.chat.isGroup) {
		if (this.timerTyping == null) {
			_mojowhatsupPlugin.safePluginCall( function() {
				_plugin.sendTyping(this.chat.jid, 1);
			}.bind(this));
		} else {
			clearTimeout(this.timerTyping);
		}
		this.timerTyping = setTimeout( function() {
			_mojowhatsupPlugin.safePluginCall( function() {
				_plugin.sendTyping(this.chat.jid, 0);
			}.bind(this));
			this.timerTyping = null;
		}.bind(this), 2000);
	}

	_chatTextClipboard.setItem(this.chat.jid, String(this.messageTextWidget.mojo.getValue()));
}

ChatAssistant.prototype.moreMessagesHandler = function(event) {
	this.buttonMoreWidget.mojo.activate();
	this.messagesToLoad += this.INCREMENT_LOAD;
	this.loadMessages(this.messagesToLoad);
}

ChatAssistant.prototype.listDeleteHandler = function(event) {
	var msg = event.item;

	_appDB.deleteMessage(msg, function() {
		if (msg.mediaDownloader != null) {
			if (msg.mediaDownloader.downloading)
				msg.mediaDownloader.stopDownload();
			msg.mediaDownloader.removeDownloader();
		}
		if (msg.mediaUploader != null) {
			if (msg.mediaUploader.uploading)
				msg.mediaUploader.stopUpload();
			msg.mediaUploader.removeUploader();
		}

		this.messageListModel.items.splice(event.index, 1);
		this.messageListWidget.mojo.noticeRemovedItems(event.index, 0);
	}.bind(this));
}

ChatAssistant.prototype.listTapHandler = function(event) {
	this.popupIndex = event.index;
	var msg = event.item;
	var items = this.getPopupMenu(msg);
	if (items.length > 0) {
		this.controller.popupSubmenu({
			onChoose : this.popupHandler,
			placeNear : event.originalEvent.target,
			items : items
		});
	}
}

ChatAssistant.prototype.getPopupMenu = function(msg) {
	var popupCommands = [];
	if (msg.media_wa_type != Message.WA_TYPE_UNDEFINED) {
		if (msg.media_wa_type != Message.WA_TYPE_CONTACT && msg.media_wa_type != Message.WA_TYPE_LOCATION && msg.media_wa_type != Message.WA_TYPE_SYSTEM) {
			if (msg.status == Message.STATUS_MEDIA_DOWNLOADED || (msg.from_me && msg.downloadedFile != null)) {
				popupCommands.push({
					label : $L('Open'),
					command : 'media-open'
				});
			}
			if (msg.from_me && (msg.status == Message.STATUS_MEDIA_UPLOADING || msg.status == Message.STATUS_NONE || msg.status == Message.STATUS_MEDIA_UPLOADERROR)) {
				popupCommands.push({
					label : $L('Upload and send'),
					command : 'media-upload'
				});
			}

			if (msg.status == Message.STATUS_MEDIA_UPLOADING) {
				popupCommands.push({
					label : $L('Stop upload'),
					command : 'media-stop-upload'
				});
			}

			if (!msg.from_me) {
				popupCommands.push({
					label : $L('Download'),
					command : 'media-download'
				});
			}

			if (msg.status == Message.STATUS_MEDIA_DOWNLOADING) {
				popupCommands.push({
					label : $L('Stop download'),
					command : 'media-stop-download'
				});
			}
		} else if ((msg.media_wa_type != Message.WA_TYPE_CONTACT) || !msg.from_me) {
			popupCommands.push({
				label : $L('Open'),
				command : 'media-open'
			});
		}

	} else {
		popupCommands.push({
			label : $L('Copy message text'),
			command : 'copy-text'
		});
	}

	if (msg.isForwardable()) {
		popupCommands.push({
			label : $L('Forward to contact'),
			command : 'forward-contact'
		});
		popupCommands.push({
			label : $L('Forward to group'),
			command : 'forward-group'
		});
	}

	return popupCommands;
}

ChatAssistant.prototype.popupHandler = function(command) {
	var msg = this.messageListModel.items[this.popupIndex];
	switch (command) {
		case 'media-upload':
			Media.getThumbImage(this.controller.document, msg, function(thumbBase64) {
				msg.data = thumbBase64;
				MediaUploader.upload(msg, msg.downloadedFile, this.controller);
			});
			break;
		case 'media-download':
			MediaDownloader.download(msg);
			break;
		case 'media-open':
			Media.openMedia(msg, this.controller.stageController);
			break;
		case 'media-stop-download':
			MediaDownloader.stopDownload(msg);
			break;
		case 'media-stop-upload':
			MediaUploader.stopUpload(msg);
			break;
		case 'copy-text':
			this.controller.stageController.setClipboard(msg.data, false);
			break;
		case 'forward-contact':
			_appDB.getAllContacts( function(contacts) {
				this.forwardMsg = msg;
				this.controller.stageController.pushScene('contact-list', contacts, true);
			}.bind(this));
			break;
		case 'forward-group':
			_appDB.getAllGroupChats( function(chats) {
				this.forwardMsg = msg;
				this.controller.stageController.pushScene('group-chooser', chats);
			}.bind(this));
			break;
	};
}

ChatAssistant.prototype.updateChat = function() {
	_appDB.findChat(this.chat.jid, function(chat) {
		this.chat = chat;
		// this.controller.get('header').update(emojify(this.chat.chatName, 18));
		this.viewMenuModel.items[0].items[1].label = emojify(this.chat.chatName, 18);
		this.controller.modelChanged(this.viewMenuModel);
	}.bind(this));
}

ChatAssistant.prototype.keyPressHandler = function(event) {
	if (event.originalEvent.keyCode == Mojo.Char.enter) {
		this.handleCommand({
			type : Mojo.Event.command,
			command : "send"
		});
	}
}

ChatAssistant.prototype.updateMessageStatus = function(message) {
	var key = message.keyString();
	for (var i = 0; i < this.messageListModel.items.length; i++) {
		var msg = this.messageListModel.items[i];
		if (msg.keyString() == key) {
			msg.status = message.status;
			// msg.timestamp = message.timestamp;
			this.messageListWidget.mojo.noticeUpdatedItems(i, [msg]);
			break;
		}
	}
}

ChatAssistant.prototype.updateContactInfo = function(contactInfo) {
	if (this.chat.isGroup)
		return;

	var stateString = "";
	switch (contactInfo.status) {
		case 0:
			stateString = $L("(typing)");
			break;
		case 1:
			stateString = $L("(online)");
			break;
		case 2:
		default:
			if (contactInfo.lastSeen == 0)
				stateString = "";
			else {
				var time = "";
				if ((new Date().getTime() - contactInfo.lastSeen) < (24 * 60 * 60 * 1000)) {
					time = Mojo.Format.formatDate(new Date(contactInfo.lastSeen), {
						time : 'short'
					});
				}
				stateString = "(" + Mojo.Format.formatRelativeDate(new Date(contactInfo.lastSeen), 'medium') + (time == "" ? "" : " " + time) + ")";
			}
			break;
	}

	// this.controller.get('header').update(stateString + " " + this.chat.chatName);
	this.viewMenuModel.items[0].items[1].label =  this.chat.chatName;
	this.viewMenuModel.items[0].items[1].status = stateString; 
    this.controller.modelChanged(this.viewMenuModel);
}

ChatAssistant.prototype.loadMessages = function(numrows, onLoad) {
	_appDB.getFirstMessages(this.chat, numrows, function(messages) {
		if (messages.length < this.messagesToLoad) {
			this.moreMessagesModel.disabled = true;
			this.moreMessagesModel.label = $L("No more messages");
		} else {
			this.moreMessagesModel.disabled = false;
		}
		this.controller.modelChanged(this.moreMessagesModel);

		this.messageListModel.items = [];
		this.controller.modelChanged(this.messageListModel);

		Mojo.Log.info("Loaded messages = ", JSON.stringify(messages.length));

		for (var i = 0; i < messages.length; i++) {
			this.setDisplayInfo(messages[i]);
			messages[i].mediaDownloader = MediaDownloader.existsDownloader(messages[i]);
			messages[i].mediaUploader = MediaUploader.existsUploader(messages[i]);
		}

		this.messageListModel.items = messages;

		this.messageListWidget.mojo.noticeAddedItems(0, this.messageListModel.items);
		if (this.messageListModel.items.length <= this.INCREMENT_LOAD) {
			this.controller.getSceneScroller().mojo.revealBottom();
		} else {
			this.messageListWidget.mojo.revealItem(this.messageListModel.items.length - (this.messagesToLoad - this.INCREMENT_LOAD), false);
		}
		this.buttonMoreWidget.mojo.deactivate();

		if (onLoad)
			onLoad();
	}.bind(this));
}

ChatAssistant.prototype.messageDateTime = function(data) {
	return Mojo.Format.formatRelativeDate(new Date(data.timestamp), 'medium');
}

ChatAssistant.prototype.nextNameColor = function() {
	var color = colorPalette[this.colorIndex];
	this.colorIndex++;
	if (this.colorIndex == colorPalette.length)
		this.colorIndex = 0;
	return color;
}

ChatAssistant.prototype.setDisplayInfo = function(msg) {
	if (this.chat.isGroup && !msg.from_me) {
		if (this.nameDisplayHash.getItem(msg.remote_resource) === undefined) {
			var color = this.nextNameColor();
			this.nameDisplayHash.setItem(msg.remote_resource, {
				"name" : _appAssistant.getNameForJid(this.chat, msg),
				"color" : color
			});
		}
	}
}

ChatAssistant.prototype.updateNewMessage = function(msg) {
	this.messageListModel.items.push(msg);
	Mojo.Log.info("List length: " + this.messageListModel.items.length);
	this.setDisplayInfo(msg);
	this.messageListWidget.mojo.noticeAddedItems(this.messageListModel.items.length - 1, [msg]);
	if (!this.scrollHolded)
	   this.controller.getSceneScroller().mojo.revealBottom();
	// this.messageListWidget.mojo.revealItem(this.messageListModel.items.length - 1, false);
}

ChatAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
				break;
			case 'send':
				var text = this.messageTextWidget.mojo.getValue();
				text = text.replace(/\s+$/g, "");
				if (!text.empty()) {
					var msg = new Message(this.chat.jid, text);
					Mojo.Log.info("Message to send = ", msg.toJSONString());
					_mojowhatsupPlugin.messageForMe(msg, false);
					_mojowhatsupPlugin.safePluginCall(function() {
						_plugin.sendMessage(msg.toJSONString());
					});
					this.messageTextWidget.mojo.setValue("");
					_chatTextClipboard.removeItem(this.chat.jid);
				}
				break;
			case 'emoji':
				Event.stop(event);
				this.controller.stageController.pushScene("emoji-dialog");
				break;
			case 'sendImage':
				Event.stop(event);
				this.sendFileHandler(Message.WA_TYPE_IMAGE);
				break;
			case 'sendAudio':
				Event.stop(event);
				this.sendFileHandler(Message.WA_TYPE_AUDIO);
				break;
			case 'sendVideo':
				Event.stop(event);
				this.sendFileHandler(Message.WA_TYPE_VIDEO);
				break;
			case 'sendLocation':
				Event.stop(event);
				this.controller.stageController.pushScene("location");
				break;
			case 'sendContact':
				this.controller.stageController.pushScene({
					appId : 'com.palm.app.contacts',
					name : 'list'
				}, {
					mode : 'picker',
					message : $L("Select a contact")
				});
				break;
			case 'groupProperties':
				_appDB.findGroup(this.chat.jid, function(group) {
					if (group) {
						var mode = "info";
						if (group.owner == _myJid) {
							mode = "edit";
						}
						this.controller.stageController.pushScene('group', group, this.chat, mode);
					}
				}.bind(this));
				break;
			case Mojo.Menu.prefsCmd:
				this.controller.stageController.pushScene("prefs");
				break;
			case "accountSettings":
				this.controller.stageController.pushScene("account");
				break;
			case Mojo.Menu.helpCmd:
				this.controller.stageController.pushScene("help");
				break;
			case "exit":
				_exitApp = true;
				Mojo.Controller.getAppController().closeStage(_mainStage);
				break;
			case "deleteallmessages":
				this.controller.showAlertDialog({
						onChoose : function(value) {
							if (value == "ok") {
								_appDB.deleteAllMessagesFromChat(this.chat, function() {
									this.messagesToLoad = this.INCREMENT_LOAD;
									this.loadMessages(this.messagesToLoad);
									if (_chatsAssistant != null) {
										_chatsAssistant.updateChats();
									}
								}.bind(this));
							}
						},
						title : $L("Confirm"),
						message : $L("Do you really want to delete all messages from this chat?"),
						choices : [{
							label : $L("OK"),
							value : "ok",
							type : "affirmative"
						},
						{
							label: $L("Cancel"),
							value: "cancel",
							type : "negative"
						}]
					});
				break;
			case "viewPicture":
				if (this.chat.picturepath) {
					this.controller.stageController.pushScene("imageview", {
						path : this.chat.picturepath
					});
				} else {
					this.controller.showAlertDialog({
						onChoose : function(value) {
						},
						title : $L("Notification"),
						message : $L("This contact does not have a profile picture"),
						choices : [{
							label : $L("Back"),
							value : "back",
							type : "affirmative"
						}]
					});
				}
				break;
			case "mute8":
				this.mute(8);
				break;
			case "mute24":
				this.mute(24);
				break;
			case "muteWeek":
				this.mute(168);
				break;
			case "unmute":
				this.mute(0);
				break;
			case "attach":
                this.controller.popupSubmenu({
                    onChoose : function(command) {
                        event.command = command;                      
                        this.handleCommand(event);
                    }.bind(this),
                    placeNear : event.originalEvent.target,
                    items : [
                        {label: $L("image"), command: "sendImage", icon: "preview-icon image-default"},
                        {label: $L("audio"), command: "sendAudio", icon: "preview-icon audio-default"},
                        {label: $L("video"), command: "sendVideo", icon: "preview-icon video-default"},
                        {label: $L("location"), command: "sendLocation", icon: "preview-icon location-default"},
                        {label: $L("vcard"), command: "sendContact", icon: "preview-icon contact-default"}
                    ]
                });			     
			    break;
		}
	} else if (event.type == Mojo.Event.forward) {
		this.handleCommand({
			type : Mojo.Event.command,
			command : "send"
		});
	}
}

ChatAssistant.prototype.mute = function(hours) {
	if (hours > 0) {
		this.chat.muteexpiry = (new Date().getTime() / 1000) + (hours * 3600);
		_appDB.updateChat(this.chat, function(chat) {
			_appDB.getAllGroupSettingsWithMuteExpiration(function (groupSettings) {
				_mojowhatsupPlugin.safePluginCall( function() {
					_plugin.sendClientConfig(JSON.stringify(groupSettings));
				});
				this.appMenuItems = this.buildAppMenuItems();
				this.appMenuModel.items = this.appMenuItems;
				this.controller.modelChanged(this.appMenuModel);
			}.bind(this));							
		}.bind(this));		
	} else {
		this.chat.muteexpiry = null;
		_appDB.updateChat(this.chat, function(chat) {
			_appDB.getAllGroupSettingsWithMuteExpiration(function (groupSettings) {
				groupSettings.push({
					jid: this.chat.jid,
					enabled: true,
					muteExpiry: 0
				});
				_mojowhatsupPlugin.safePluginCall( function() {
					_plugin.sendClientConfig(JSON.stringify(groupSettings));
				});				
				this.appMenuItems = this.buildAppMenuItems();
				this.appMenuModel.items = this.appMenuItems;
				this.controller.modelChanged(this.appMenuModel);
			}.bind(this));							
		}.bind(this));				
	}
}


ChatAssistant.prototype.sendFileHandler = function(fileType) {
	var params = null;
	var msg = new Message(this.chat.jid, "");

	switch (fileType) {
		case Message.WA_TYPE_IMAGE:
			params = {
				kind : "image",
				actionName : $L("Send"),
				extensions : ["jpg", "bmp", "gif", "png"],
				onSelect : function(file) {
					msg.media_wa_type = Message.WA_TYPE_IMAGE;
					this.uploadFileMedia(file, msg);
				}.bind(this)
			};
			break;
		case  Message.WA_TYPE_AUDIO:
			params = {
				kind : "audio",
				actionName : "Send",
				extensions : ["mp3", "wav"],
				onSelect : function(file) {
					msg.media_wa_type = Message.WA_TYPE_AUDIO;
					this.uploadFileMedia(file, msg);
				}.bind(this)
			};
			break;
		case  Message.WA_TYPE_VIDEO:
			params = {
				kind : "video",
				actionName : "Send",
				extensions : ["mpg", "avi", "mp4", "3gp"],
				onSelect : function(file) {
					msg.media_wa_type = Message.WA_TYPE_VIDEO
					this.uploadFileMedia(file, msg);
				}.bind(this)
			};

			break;
	}

	Mojo.FilePicker.pickFile(params, this.controller.stageController);
};

ChatAssistant.prototype.uploadFileMedia = function(file, msg) {
	msg.status = Message.STATUS_MEDIA_UPLOADING;
	msg.downloadedFile = file.fullPath;
	msg.timestamp = msg.timestamp * 1000;

	_appDB.saveMessage(msg, function(msg) {
		this.chat.lastMessage = msg;
		_appDB.updateChat(this.chat, function(updated) {
			_appAssistant.notifyUpdateChats(undefined);
			setTimeout( function() {
				this.updateNewMessage(msg);
				Media.getThumbImage(this.controller.document, msg, function(thumbBase64) {
					msg.data = thumbBase64;
					MediaUploader.upload(msg, file.fullPath, this.controller);
				});
			}.bind(this), 1000);
		}.bind(this));
	}.bind(this));
}

ChatAssistant.prototype.activate = function(event) {
	this.keyDownHandler = this.messageTextKeydown.bindAsEventListener(this);
	this.keyUpHandler = this.messageTextKeyup.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
	Mojo.Event.listen(this.controller.document, Mojo.Event.keyup, this.keyUpHandler, true);

	if (event && "selectedEmoji" in event) {
		if (event.selectedEmoji != null) {
			var message = this.messageTextWidget.mojo.getValue();
			var cursorPosition = {
				selectionStart : 0,
				selectionEnd : 0
			};
			if (message.length > 0) {
				cursorPosition = this.messageTextWidget.mojo.getCursorPosition();
			}
			var emojiText = convertUnicodeCodePointsToString(['0x' + event.selectedEmoji]);
			var text = message.substr(0, cursorPosition.selectionStart);
			text += emojiText;
			var newCursorPosition = text.length;
			this.messageTextWidget.mojo.setCursorPosition(newCursorPosition, newCursorPosition);
			text += message.substr(cursorPosition.selectionEnd);

			this.messageTextWidget.mojo.setValue(text);
		}
	} else if (event && "longitude" in event) {
		var msg = new Message(this.chat.jid, "");
		msg.media_wa_type = Message.WA_TYPE_LOCATION;
		msg.longitude = event.longitude;
		msg.latitude = event.latitude;
		_mojowhatsupPlugin.messageForMe(msg, false);
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.sendMessage(msg.toJSONString());
		});
	} else if (event && "_id" in event) {
		var msg = new Message(this.chat.jid, "");
		msg.media_wa_type = Message.WA_TYPE_CONTACT;
		var vcardData = Media.fromPersonToVcard(event);
		msg.media_name = vcardData.name;
		msg.data = vcardData.vcard;
		_mojowhatsupPlugin.messageForMe(msg, false);
		_mojowhatsupPlugin.safePluginCall(function() {
			_plugin.sendMessage(msg.toJSONString());
		});
	} else if (event && "jid" in event) {
		this.openChatAndSendMessage(event.jid, this.forwardMsg);
	}
	this.messageTextWidget.mojo.focus();
}

ChatAssistant.prototype.openChatAndSendMessage = function(jid, msg) {
	var newMsg = msg.cloneToSend(jid);
	_appDB.findOrCreateChat(jid, function(chat) {
		this.controller.stageController.popScene();
		this.controller.stageController.pushScene("chat", chat, newMsg);
		setTimeout(_appAssistant.notifyUpdateChats.bind(_appAssistant), 500);
	}.bind(this));
}

ChatAssistant.prototype.refreshList = function(event) {
	this.controller.modelChanged(this.messageListModel);
	this.controller.getSceneScroller().mojo.revealBottom();
}

ChatAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	 this scene is popped or another scene is pushed on top */
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpHandler, true);
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownHandler, true);
}

ChatAssistant.prototype.cleanup = function(event) {
	_openChatAssistant = null;
	Mojo.Event.stopListening(this.buttonMoreWidget, Mojo.Event.tap, this.moreMessagesHandler);
	Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.listDelete, this.listDeleteHandler);
	Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.listTap, this.listTapHandler);
	Mojo.Event.stopListening(this.messageTextWidget, Mojo.Event.propertyChange, this.textChangedHandler);
	
    Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.dragStart, this.handleScrollHold);
    Mojo.Event.stopListening(this.messageListWidget, Mojo.Event.dragEnd, this.handleScrollHold);

	delete this.namesHash;
	this.namesHash = null;
}
