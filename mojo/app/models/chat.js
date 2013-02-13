function Chat(chatName, jid, isGroup, unread, lastMessage, pictureid, picturepath, muteexpiry) {
	this.chatName = chatName;
	this.jid = jid;
	this.isGroup = isGroup;
	this.unread = unread;
	if (lastMessage)
		this.lastMessage = lastMessage;
	else
	    this.lastMessage = new Message();

   
	this.pictureid = pictureid;
	this.picturepath = picturepath;	    
	this.muteexpiry = muteexpiry;
}

