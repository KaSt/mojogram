function HelpAssistant() {
	this.resourcesModel = {
		items: [
			{
				label: $L("Change Log"),
				type: "scene",
				sceneName: "changelog"
			},
			{
				label: $L("Check for updates"),
				type: "scene",
				sceneName: "update"
			},
			{
				label: $L("Discussion Forums"),
				type: "web",
				url: "http://forums.webosnation.com/webos-apps/318833-mojowhatsup-whatsapp-client-webos.html", 
			},
			{
				label: $L("Donate"),
				type: "web",
				url: "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=N3SZKECYCN6HN&lc=ES&item_name=Antonio%20Morales&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted"
			},
			{
				label: $L("Send e-mail"),
				type: "email",
				address: "amoralico@gmail.com",
				subject: "MojoWhatsupp Support Request"				
			}
		]
	}
}

HelpAssistant.prototype.setup = function() {
	if (_mainAssistant != null && _appAssistant.isTouchPad()) {
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
	
	this.controller.setupWidget(Mojo.Menu.appMenu, this.attributesAppMenu = {
        omitDefaultItems: true
    }, this.appMenuModel = {
        visible: true,
        items : [
            Mojo.Menu.editItem,
            {label: $L("Exit"), command: "exit"}
        ]
    });
	
	this.controller.get('header-title').update($L("Help"));
	this.controller.get('helpTitle').update($L("Help & Support"));
	this.controller.get('appName').update($L(Mojo.appInfo.title));
	this.controller.get('version').update($L(Mojo.appInfo.version) + "-" + Mojo.appInfo.vendor);
	this.controller.get('copyright').update($L(Mojo.appInfo.copyright));
	
	this.controller.setupWidget('resourcesList', 
		{
			itemTemplate : "help/resource-entry",
		}, this.resourcesModel 
	);
	
	this.controller.listen('resourcesList', Mojo.Event.listTap, this.onTap.bindAsEventListener(this));
}

HelpAssistant.prototype.onTap = function(event) {
	var resource = event.item;
	switch (resource.type) {
		case 'web':
			var serviceRequest = new Mojo.Service.Request('palm://com.palm.applicationManager', {
				method : 'open',
				parameters : {
					target : resource.url
				}
			});
		break;
		case 'email':
			var serviceRequest = new Mojo.Service.Request('palm://com.palm.applicationManager', {
				method : 'launch',
				parameters : {
					id: 'com.palm.app.email',
					params : {
						summary: resource.subject,
						recipients: [
							{
								type: "email",
								value: resource.address 
							}
						]
					} 
				}
			});
		break;
		case 'scene':
			if (resource.sceneName == "update") {
				Updater.checkUpdate(this.controller, true, true);
			} else {
				this.controller.stageController.pushScene(resource.sceneName);				
			}
		break;
	}
}

HelpAssistant.prototype.handleCommand = function(event) {
	if (event.type == Mojo.Event.command) {
		switch(event.command) {
			case 'goBack':
			this.controller.stageController.popScene();
			break;
            case "exit":
                _exitApp = true;
                Mojo.Controller.getAppController().closeStage(_mainStage);
                break;
		}
	}
}

HelpAssistant.prototype.cleanup = function() {
	this.controller.stopListening('resourcesList', Mojo.Event.listTap, this.onTap);
}
