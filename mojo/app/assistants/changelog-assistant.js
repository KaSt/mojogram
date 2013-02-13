function ChangelogAssistant() {
	this.changelog = [
        {
            version: "v1.5.1",
            changes: [
                "Fixed fail-old-version problem",
                "New improved chat header",
                "Updated italian and chinese translations",
                "NOTE: due to a Whatsapp change, contacts status are not updated"
            ]               
        },	
        {
            version: "v1.5",
            changes: [
                "New registration method (v2)",
                "Integration with  Sony Ericsson MBW-150",
                "Send message using forward gesture on gesture area",
                "Added remove account option in Account Configuration",
                "Added purchase subscription option in Account Configuration",
                "Added forward to group/forward to contact options in message popup menu",
                "Upon firing a notification sound, wait 2 seconds until playing the next"
            ]               
        },	
        {
            version: "v1.4.3",
            changes: [
                "Fixed plugin error problem when receiving picture notification"
            ]               
        },	
		{
			version: "v1.4.2",
			changes: [
				"New voice method to request the registration code",
				"Fixed picture preview problem",
				"Fixed plugin error when sending a picture",
				"Plugin recompiled in order to support Pixi processor",
				"Fixed the visualization problem of some emojis",
				"Fixed the timestamp problem of offline messages",
				"Enabled log ERROR level in the plugin for debugging puposes",
				"Some other minor changes"
			]				
		},
		{
			version: "v1.4.1",
			changes: [
				"Implemented Whatsapp encrypted protocol 1.2",
				"Therefore the login problem is fixed",
				"Updated Chinese, Italian and Netherlands translations"
			]				
		},
		{
			version: "v1.4.0",
			changes: [
				"Added change status feature",
				"Added complete picture support: profile picture, group pictures and contact pictures",
				"Added new emoji collection",
				"Fixed some minor bugs"
			]				
		},
		{
			version: "v1.3.3",
			changes: [
				"Workaround for last login problem",
			]				
		},
		{
			version: "v1.3.2",
			changes: [
				"Shows notification when a new version is available",
				"German translation corrected",
				"Added Russian translation",
				"Sends unavailable message when app is inactive, in background or minimized",
				"Fixed issue with messages not coming in background mode"
			]				
		},
		{
			version: "v1.3.1",
			changes: [
				"Fixed contact load problem",
				"Updated german and italian translations"
			]				
		},
		{
			version: "v1.3.0",
			changes: [
				"Fixed registration problem (fail-old-version)",
				"Added reduce image before sending in preferences",
				"Added contacts phone types to import in preferences",
				"Fixed Chinese translation",
				"Added French translation",
				"Added change language in preferences"
			]
		},
		{
			version: "v1.2.0",
			changes: [
				"Chinese translation (thanks to tonyw)",
				"Updated scaled Pre3 icons (thanks to virox)",
				"Added contacts status (in contacts list)",
				"Fixed image thumb and image viewer (Pre3)",
				"Other minor bugs fixed"
			]
		},
		{
			version:"v1.1.0",
			changes: [
				"German, italian, netherlands translations (thanks to Sonic-NKT, virox, cainvommars, DMeister, wMark90)",
				"Problem importing all contacts fixed (thanks to capepe)",
				"Pre3 1.5 folder with MojoWhatsup scaled icon (thanks to virox)",
				"Orange/Ctrl + Enter sends message",
				"Removed nojail statement",
				"Fixed problem with screen orientation when returning from image viewer",
				"Message font size included in preferences",
				"Fixed some other minor bugs"
			]
		},
		{
			version:"v1.0.0",
			changes: [
				"Public release!",
				"Max phone length corrected in account configuracion."
			]
		}
	];
}

ChangelogAssistant.prototype.setup = function() {
    if (_mainAssistant != null && _appAssistant.isTouchPad()) {
        var menuModel = {
            visible : true,
            items : [{
                icon : "back",
                command : "close"
            }]
        };

        this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
            spacerHeight : 0,
            menuClass : 'no-fade'
        }, menuModel);
    }    
    
	var menuAttr = {omitDefaultItems: true};
  	var menuModel = {
    	visible: true,
    	items: [
      		{label: $L("Back"), command: 'close'}
    	]
  	};
	this.controller.setupWidget(Mojo.Menu.appMenu, menuAttr, menuModel);
	
	this.controller.get("changelogTitle").innerHTML = $L("Change Log");
	var log = "";
	for(var i=0; i<this.changelog.length; i++) {
		log += Mojo.View.render({object:{version:this.changelog[i].version},
				template: "changelog/header"});
		log += "<ul>";
		for(var j=0; j<this.changelog[i].changes.length; j++) {
			log += "<li>" + this.changelog[i].changes[j] + "</li>";
		}
		log += "</ul>";
	}
	log += "<br>";
	this.controller.get("changelog").innerHTML = log;
	this.controller.get("footer").innerHTML = Mojo.Controller.appInfo.copyright;
};

ChangelogAssistant.prototype.activate = function(event) {
	
};

ChangelogAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.command) {
		if(event.command == "close") {
			this.controller.stageController.popScene();
		}
	}
};

ChangelogAssistant.prototype.deactivate = function(event) {

};

ChangelogAssistant.prototype.cleanup = function(event) {
};
