var _emojiSelectedGroup = 'people';

function EmojiDialogAssistant(sceneAssistant, callBackFunc) {
    this.callBackFunc = callBackFunc;
    this.maxRenderEmoji = 150;
    this.emojiListModel = {
        items : []
    };
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

    this.handleCommand({type: Mojo.Event.command, command: _emojiSelectedGroup});
}

EmojiDialogAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        if (event.command != 'close')
            _emojiSelectedGroup = event.command;
        switch(event.command) {
            case 'close':
                this.controller.stageController.popScene({
                    selectedEmoji : null
                });
                break;
            case 'people':
                this.loadEmoji(0, 109)
                break;
            case 'nature':
                this.loadEmoji(109, 162)
                break;
            case 'events':
                this.loadEmoji(162, 297)
                break;
            case 'places':
                this.loadEmoji(297, 367)
                break;
            case 'symbols':
                this.loadEmoji(367, 466)
                break;
        }
        
        if (this.emojiListWidget.mojo)        
            this.emojiListWidget.mojo.revealItem(0, false);
    }
}

EmojiDialogAssistant.prototype.loadEmoji = function(start, end) {
    var list = [];
    for (var i = start; i < end; i++) {
        list.push({
            emojiPath : "images/emoji/emoji-E" + emoji_code[i] + ".png",
            emojiCode : emoji_code[i]
        });
    }

    this.emojiListModel.items = list;
 
    this.controller.modelChanged(this.emojiListModel, this);
}

EmojiDialogAssistant.prototype.listTapHandler = function(event) {
    this.controller.stageController.popScene({
        selectedEmoji : event.item.emojiCode
    });
}

EmojiDialogAssistant.prototype.cleanup = function() {
}