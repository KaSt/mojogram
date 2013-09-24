function GroupAssistant(group, chat, mode) {
    _groupAssistant = this;
	this.mode = mode;
	this.group = group;
	this.chat = chat;
	this.participantsListModel = {
		items : []
	};
	this.addedParticipants = [];
	this.removedParticipants = [];
}

GroupAssistant.prototype.setup = function() {
	if (_chatsAssistant != null && _appAssistant.isTouchPad()) {
		var menuModel = {
			visible : true,
			items : [{
				icon : "back",
				command : "goBack"
			}]
		};

		this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
			spacerHeight : 0,
			menuClass : 'no-fade'
		}, menuModel);
	}
	var headerTitle = "";
	switch(this.mode) {
		case 'new':
			headerTitle = "New group";
			break;
		case 'edit':
			headerTitle = "Group properties";		
			break;
		case 'info':
			headerTitle = "Group properties";		
			break;
	}
	
	
	this.controller.get('headerTitle').update($L(headerTitle));
	this.controller.get('groupInfoTitle').update($L("Info"));
	this.controller.get('ownerLabel').update($L("Owner"));
	this.controller.get('creationLabel').update($L("Creation date"));
	
    this.controller.setupWidget("spinnerId", this.attributesSpinner = {
        spinnerSize : "small"
    }, this.modelSpinner = {
        spinning : false
    });
		
	this.controller.get('spinnerId').hide();
	this.setPicture();	
		
	this.controller.listen("groupImage", Mojo.Event.tap, this.groupImageHandler.bindAsEventListener(this));
	
	if (this.group != null) {
		var owner = Message.removeDomainFromJid(this.group.owner);
	    if (_contactJidNames.getItem(this.group.owner) !== undefined) {
			owner = _contactJidNames.getItem(this.group.owner);
		}
		this.controller.get('ownerValue').update(owner);
        this.controller.get('ownerListValue').update(owner);		
		this.controller.get('creationValue').update(Mojo.Format.formatDate(new Date(this.group.creation_t * 1000), 'short'));
	}
	
	this.controller.setupWidget('textFieldSubject', this.attributesTF = {
		hintText : $L("Insert a subject") + " ...",
		autofocus : true,
		multiline : false,
		modifierState : Mojo.Widget.shiftSingle,
		enterSubmits : true,
		focusMode : Mojo.Widget.focusInsertMode,
        maxLength : _appData.cookieData.max_subject,
        changeOnKeyPress : true
	}, this.modelTF = {
		value : (this.group? this.group.subject: ""),
		// disabled: (this.mode == 'info'? true : false)
	});
	this.controller.listen('textFieldSubject', Mojo.Event.propertyChanged, this.subjectChangedHandler.bindAsEventListener(this));
	
	this.setSubjectTitle((this.group? this.group.subject: ""));
	
	// if (this.mode == 'info') {
		// this.controller.get("emojiButton").hide();
	// }
	
	this.controller.listen('emojiButton', Mojo.Event.tap, this.emojiButtonHandler.bindAsEventListener(this));
		
	this.controller.setupWidget("sendChangesButton", {
		label : $L("Send changes")
	}, {
		value : "",
		buttonClass: "affirmative",
		disabled : false
	});
	this.controller.listen('sendChangesButton', Mojo.Event.tap, this.sendChangesHandler.bindAsEventListener(this));
	
	// if (this.mode == 'info') {
		// this.controller.get("sendChangesButton").hide();
	// }
	
	var removeButtonLabel = $L("End group");
	if (this.mode == 'info') {
		removeButtonLabel = $L("Leave group");
	}
	this.controller.setupWidget("removeGroupButton", {
		label : removeButtonLabel
	}, {
		value : "",
		buttonClass: "negative",
		disabled : false
	});
	this.controller.listen('removeGroupButton', Mojo.Event.tap, this.removeGroupHandler.bindAsEventListener(this));
	
	if (this.mode == 'new') {
		this.controller.get("removeGroupButton").hide();
	}
	
	this.participantsListAttributes = {
		itemTemplate : "group/participant-list-entry",
		swipeToDelete : (this.mode == 'edit'? true: false),
		hasNoWidgets : true,
		fixedHeightItems: true,
		formatters : {
			jid : function(value, model) {
				if (value) {
					var name = _contactJidNames.getItem(value);
					if (name !== undefined) {
						return _contactJidNames.getItem(value);
					} else {
						return Message.removeDomainFromJid(value);
					}
				}
				return "";
			}
		}
	};
	
	if (this.mode == 'edit') {
		this.participantsListAttributes.addItemLabel = $L("Add contact");
	}
	
	if (this.group) {
		this.participantsListModel.items = this.group.getParticipantsArray(this.group.owner);
	}
	
	this.setParticipantsTitle();
			
	this.controller.setupWidget("participantsList", 
		this.participantsListAttributes, 
		this.participantsListModel);

	if (this.mode == 'edit') {
		this.controller.listen('participantsList', Mojo.Event.listAdd, this.addListHandler.bindAsEventListener(this));
		this.controller.listen('participantsList', Mojo.Event.listDelete, this.deleteListHandler.bindAsEventListener(this));
	}
	
	if (this.mode == 'new') {
		this.controller.get('listGroup').hide();
		this.controller.get('infoGroup').hide();
	}
}

GroupAssistant.prototype.setPicture = function() {
	var imgSize = '80:80';
	if (_appAssistant.isPre3())
		imgSize = '120:120';
			
	if ((this.mode != "new") && this.chat.picturepath) {
       	this.controller.get('groupImage').update('<div class="group-image picture" style="background-image:url(/var/luna/data/extractfs' + encodeURIComponent(this.chat.picturepath) + ':0:0:' + imgSize + ':3)"></div>');
    } else if (this.mode != "new") {
       	this.controller.get('groupImage').update('<div class="group-image group-icon"></div>');
    } else {
       	this.controller.get('groupImage').update('<div style="display: none"></div>');
    }
}

GroupAssistant.prototype.updatePicture = function(path) {
    if (path != "error") {
    	this.chat.picturepath = path;
    	this.setPicture();
    }
    
	this.modelSpinner.spinning = false;
    this.controller.modelChanged(this.modelSpinner);
   	this.controller.get("spinnerId").hide();
}

GroupAssistant.prototype.subjectChangedHandler = function(event) {
    var text = this.controller.get('textFieldSubject').mojo.getValue();    
    this.setSubjectTitle(text);
}

GroupAssistant.prototype.groupImageHandler = function(event) {
    Event.stop(event);
    var items = [];
    items.push({
                label: $L("Change"),
                command: "change"
        });
        
    if (this.chat.picturepath) {
        items.push({
                label: $L("View"),
                command: "view"
            });
        items.push({
                label: $L("Delete"),
                command: "delete"
            });
    }
        
	this.controller.popupSubmenu({
        onChoose : this.popupImageHandler,
        placeNear : this.controller.get("groupImage"),
        items : items
    });
}

GroupAssistant.prototype.popupImageHandler = function (command) {
    switch (command) {
        case 'change':
             var params = {
                kind : "image",
                actionName : $L("Send"),
                extensions : ["jpg"],
				crop: { width: 320, height: 320 },                
                onSelect : function(file) {
   					this.modelSpinner.spinning = true;
   					this.controller.modelChanged(this.modelSpinner);
   					this.controller.get("spinnerId").show();
   					Mojo.Log.info("Crop info: %j", file.cropInfo);
                    _mojowhatsupPlugin.safePluginCall(function() {
                    	var cropInfo = {
                    		size: 480,
                    		scale: file.cropInfo.window.scale * 1.5,
                    		x: Math.floor(file.cropInfo.window.suggestedXTop * file.cropInfo.window.scale * 1.5),
                    		y: Math.floor(file.cropInfo.window.suggestedYTop * file.cropInfo.window.scale * 1.5)
                    	};
                        _plugin.sendSetPicture(this.chat.jid, file.fullPath, JSON.stringify(cropInfo));   
                    }.bind(this));
                }.bind(this)
            };
            Mojo.FilePicker.pickFile(params, this.controller.stageController);
            break;
        case 'view':
            this.controller.stageController.pushScene("imageview", {path: this.chat.picturepath});
            break;
        case 'delete':
   			this.modelSpinner.spinning = true;
   			this.controller.modelChanged(this.modelSpinner);
   			this.controller.get("spinnerId").show();
        
            _mojowhatsupPlugin.safePluginCall(function() {
 	           _plugin.sendSetPicture(this.chat.jid, "", "");   
            }.bind(this));
        	break;	
    }
}

GroupAssistant.prototype.setParticipantsTitle = function() {
	if (this.mode == 'edit')
		this.controller.get('groupParticipantsTitle').update($L("Participants") + " (" + (this.participantsListModel.items.length + 1) + " " + $L("of") + " " + _appData.cookieData.max_participants + ")");
	else {
		this.controller.get('groupParticipantsTitle').update($L("Participants") + " (" + (this.participantsListModel.items.length + 1) + ")");		
	}
}

GroupAssistant.prototype.setSubjectTitle = function(subject) {
    var left = (_appData.cookieData.max_subject - subject.length);
    this.controller.get('subjectTitle').update($L("Subject") + " (" + $L("#{left} remaining").interpolate({left: left}) + ")");      
}

GroupAssistant.prototype.emojiButtonHandler = function(event) {
    var text = this.controller.get('textFieldSubject').mojo.getValue();
    if (text.length < _appData.cookieData.max_subject) 
	   this.controller.stageController.pushScene("emoji-dialog");
	else {
	    Event.stop(event);
	    this.controller.get('textFieldSubject').mojo.focus();
	}
}

GroupAssistant.prototype.deleteListHandler = function(event) {
	this.participantsListModel.items.splice(event.index, 1);	
	this.setParticipantsTitle();
	
	var p = event.item;
	if (this.group.existsParticipant(p.jid)) { 
		this.removedParticipants.push(p.jid);
	}
	
	var i = this.addedParticipants.indexOf(p.jid);
	Mojo.Log.error("index %d", i);
	if (i != -1) {
		this.addedParticipants.splice(i, 1);
	}
}

GroupAssistant.prototype.addListHandler = function(event) {
	if ((this.participantsListModel.items.length + 1) < _appData.cookieData.max_participants) {
		_appDB.getAllContacts(function(contacts) {
			this.controller.stageController.pushScene('contact-list', contacts, true);	
		}.bind(this));
	}
}

GroupAssistant.prototype.activate = function(param) {
	if (param && ("jid" in param)) {
		if (!this.group.existsParticipant(param.jid) && (this.addedParticipants.indexOf(param.jid) == -1)) {
			this.addedParticipants.push(param.jid);			
			this.participantsListModel.items.push(param);
			this.setParticipantsTitle();			
			this.controller.get('participantsList').mojo.noticeAddedItems(this.participantsListModel.items.length - 1, [param]);						
		}
	} else if (param && "selectedEmoji" in param) {
		if (param.selectedEmoji != null) {
			var text = this.controller.get('textFieldSubject').mojo.getValue();
			this.controller.get('textFieldSubject').mojo.setValue(text + convertUnicodeCodePointsToString(['0x' + param.selectedEmoji]));
		}
        this.controller.get('textFieldSubject').mojo.focus();		
	} 
}

GroupAssistant.prototype.removeGroupHandler = function(event) {
	var message = $L("Are you sure you want to remove/end this group?");
	if (this.mode == 'info')
		message = $L("Are you sure you want to remove/leave this group?");					
	this.controller.showAlertDialog({
		onChoose: function(value) {
			if (value == "yes") {
				try {
					if (this.mode == 'edit') {
						_plugin.sendEndGroup(this.group.gjid);
					} else if (this.mode == 'info') {
						_plugin.sendLeaveGroup(this.group.gjid);
					}
                    this.controller.stageController.popScenesTo("chats-list");                  
                    _appDB.deleteGroupAndChat(this.group, this.chat, function() {
                        _appAssistant.notifyUpdateChats(this);
                    }.bind(this));
    			} catch (e) {
					Mojo.Log.error("Error sending end/leave group! " + e);
				}								
			}
		}.bind(this),
		title: $L("Confirm"),
		message: message,
		choices: [
			{label: $L("Yes"), value:"yes", type:"affirmative"},
			{label: $L("No"), value:"no", type:"negative"},
		]
	});	
}

GroupAssistant.prototype.sendChangesHandler = function(event) {
	var subject = this.controller.get('textFieldSubject').mojo.getValue();
	if (subject != null && subject != "") {
		if (this.mode == 'new') {
			try {
				_plugin.sendCreateGroupChat(subject);
				this.controller.stageController.popScene();
			} catch (e) {
				Mojo.Log.error("Error sending create group! " + e);
			}
		} else {
			var subjectChanged = (subject != this.group.subject);
			try  {
				if (subjectChanged) {
					_plugin.sendSetNewSubject(this.group.gjid, subject);
				}
				if (this.addedParticipants.length > 0) {
					_plugin.sendAddParticipants(this.group.gjid, JSON.stringify(this.addedParticipants));
				}
				if (this.removedParticipants.length > 0) {
					_plugin.sendRemoveParticipants(this.group.gjid, JSON.stringify(this.removedParticipants));
				}
				this.controller.stageController.popScene();
			} catch (e) {
				Mojo.Log.error("Error sending changes to group!" + e);
			}
		}
	} else {
		this.controller.get('errorMessageText').update($L("Empty subject. Please insert a subject for the group"));
		this.controller.get('error_message').show();
	}						
}

GroupAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
				this.controller.stageController.popScene();
				break;
		}
	}
}

GroupAssistant.prototype.cleanup = function() {
    _groupAssistant = null;
	this.controller.stopListening('sendChangesButton', Mojo.Event.tap, this.sendChangesHandler);
	this.controller.stopListening('removeGroupButton', Mojo.Event.tap, this.removeGroupHandler);
	this.controller.stopListening('emojiButton', Mojo.Event.tap, this.emojiButtonHandler);
    this.controller.stopListening('textFieldSubject', Mojo.Event.propertyChanged, this.subjectChangedHandler);		
	if (this.mode == 'edit') {
		this.controller.stopListening('participantsList', Mojo.Event.listAdd, this.addListHandler);
		this.controller.stopListening('participantsList', Mojo.Event.listDelete, this.deleteListHandler);		
	}
	this.controller.stopListening("groupImage", Mojo.Event.tap, this.groupImageHandler);
}