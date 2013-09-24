var _emojiSelectedGroup = 'people';
var _emojiSelectedIndex = 0;

function EmojiDialogAssistant(sceneAssistant, callBackFunc) {
    this.callBackFunc = callBackFunc;
    this.maxRenderEmoji = 240;
    this.emojiListModel = {
        items : []
    };
    this.commands = ['people','nature','events','places','symbols'];
    this.groupIndex = this.commands.indexOf(_emojiSelectedGroup);
}

EmojiDialogAssistant.prototype.setup = function(widget) {
    this.emojiListWidget = this.controller.get('emojiList');
    this.controller.setupWidget('emojiList', {
        itemTemplate : "emoji-dialog/emoji-list-entry",
        hasNoWidgets : true,
        renderLimit : this.maxRenderEmoji,
        fixedHeightItems : true,
    }, this.emojiListModel);

    this.listTapHandler = this.listTapHandler.bindAsEventListener(this);
    Mojo.Event.listen(this.emojiListWidget, Mojo.Event.listTap, this.listTapHandler);

    this.controller.setupWidget(Mojo.Menu.viewMenu, this.attributes = {
        spacerHeight : 50,
        menuClass : 'no-fade'
    }, this.model = {
        visible : true,
        items : [{
            toggleCmd : _emojiSelectedGroup,
            items : [{
                icon : "people-emoji",
                command : "people"
            }, {
                icon : "nature-emoji",
                command : "nature"
            }, {
                icon : "events-emoji",
                command : "events"
            }, {
                icon : "places-emoji",
                command : "places"
            }, {
                icon : "symbols-emoji",
                command : "symbols"
            }]
        }, {}, {
            icon : "back",
            command : "close"
        }]
    });
    this.flickHandler = this.onFlick.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.window, Mojo.Event.flick, this.flickHandler, false);
}


EmojiDialogAssistant.prototype.onFlick = function(event) {
    Mojo.Log.info("velocidad %j", event.velocity);
    if (event.velocity.x >= 500) {
        if (this.groupIndex > 0) {
            this.groupIndex--;
            _emojiSelectedIndex = 0;
            _emojiSelectedGroup = this.commands[this.groupIndex];
            this.model.items[0].toggleCmd = _emojiSelectedGroup;
            this.controller.modelChanged(this.model);
            this.handleCommand({type: Mojo.Event.command, command: _emojiSelectedGroup, open:true});
        }
    } else if (event.velocity.x <= -500) {
        if (this.groupIndex < 4) {
            this.groupIndex++;
            _emojiSelectedIndex = 0;
            _emojiSelectedGroup = this.commands[this.groupIndex];
            this.model.items[0].toggleCmd = _emojiSelectedGroup;
            this.controller.modelChanged(this.model);
            this.handleCommand({type: Mojo.Event.command, command: _emojiSelectedGroup, open:true});
        }

    }
}


EmojiDialogAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        if (event.command != 'close') {
            _emojiSelectedGroup = event.command;
         }
        switch(event.command) {
            case 'close':
                this.controller.stageController.popScene({
                    selectedEmoji : null
                });
                break;
            case 'people':
                this.loadEmoji(0, 189)
                break;
            case 'nature':
                this.loadEmoji(189, 305)
                break;
            case 'events':
                this.loadEmoji(305, 535)
                break;
            case 'places':
				this.loadEmoji(535, 637)            
                break;
            case 'symbols':
                this.loadEmoji(637, 846)
                break;
        }

		if (!event.open)
			_emojiSelectedIndex = 0; 
        if (this.emojiListWidget.mojo) {
        	this.emojiListWidget.mojo.revealItem(_emojiSelectedIndex, false);
        }        
    }
}

EmojiDialogAssistant.prototype.ready = function() {
	this.handleCommand({type: Mojo.Event.command, command: _emojiSelectedGroup, open:true});
}

EmojiDialogAssistant.prototype.loadEmoji = function(start, end) {
    var list = [];
    for (var i = start; i < end; i++) {
        list.push({
            emojiPath : "images/emoji/" + emoji_code[i] + ".png",
            emojiCode : emoji_code[i]
        });
    }

    this.emojiListModel.items = list;
 
    this.controller.modelChanged(this.emojiListModel, this);
}

EmojiDialogAssistant.prototype.listTapHandler = function(event) {
	_emojiSelectedIndex = event.index;
    this.controller.stageController.popScene({
        selectedEmoji : event.item.emojiCode
    });
}

EmojiDialogAssistant.prototype.cleanup = function() {
    Mojo.Event.stopListening( this.controller.window, Mojo.Event.flick, this.flickHandler, false ); 
}