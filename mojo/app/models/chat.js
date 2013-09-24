function Chat(chatName, jid, isGroup, unread, lastMessage, pictureid, picturepath, muteexpiry, firstunread) {
	this.chatName = chatName;
	this.jid = jid;
	this.isGroup = isGroup;
	this.unread = unread;
	this.firstunread = firstunread;
	if (lastMessage)
		this.lastMessage = lastMessage;
	else
	    this.lastMessage = new Message();

   
	this.pictureid = pictureid;
	this.picturepath = picturepath;	    
	this.muteexpiry = muteexpiry;
}

Chat.prototype.isBroadcast = function () {
	return this.jid.indexOf("broadcast") == 0;
}

