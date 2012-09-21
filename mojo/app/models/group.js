function Group(gjid, subject, owner, s_o, s_t, creationt, participants) {
	this.gjid = gjid;
	this.subject = subject;
	this.owner = owner;
	this.subject_owner = s_o;
	this.subject_t = s_t;
	this.creation_t = creationt;
	this.participants = participants;
}

Group.OWNING_GROUPS = [];

Group.addOwningGroup = function (group) {
    if (Group.OWNING_GROUPS.indexOf(group.gjid) == -1) {
        Group.OWNING_GROUPS.push(group.gjid);
    }
}

Group.prototype.getParticipantsArray = function(exclude) {
	var participantsObjects = [];
	var participants = this.participants.split(";");
	if (participants.length > 1) {
		participants.splice(participants.length - 1, 1);
		for (var i = 0; i < participants.length; i++) {
			if (participants[i] != exclude)
				participantsObjects.push({jid: participants[i]});
		}
	}
	
	return participantsObjects;
}

Group.prototype.existsParticipant = function(jid) {
	return (this.participants.indexOf(jid) != -1);
}

Group.prototype.removeParticipant = function(contact) {
	this.participants.replace('/' + contact.jid + '/g', "");
	Mojo.Log.error("group participants: %j", this.participants);
}

Group.prototype.addParticipant = function(contact) {
	this.participants += contact.jid + ";";
}

Group.prototype.setParticipantsArray = function(participants) {
	this.participants = "";
	for (var i = 0; i < participants.length; i++) {
		this.addParticipant(participants[i]);
	}
}

