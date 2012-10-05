var jidsufix = "@s.whatsapp.net";

function AppDatabase() {
    this.appDb = openDatabase("ext:com.palm.mojowhatsup.db", "1.0", "Mojowhatsup Database", 25000);
    if (!this.appDb)
        Mojo.log.error("Failed to open the database on disk.  This is probably because the version was bad or there is not enough space left in this domain's quota");
    this.createTables();
    this.contactResults = 0;
    this.contactRequestSize = 100;
    this.contacts = [];
    this.contactRequest = false;
}

AppDatabase.getJidList = function(contacts) {
    var result = "";
    if (contacts.length > 0)
        result = "'" + contacts[0].jid + "'";
    for (var i = 1; i < contacts.length; i++)
        result += "," + "'" + contacts[i].jid + "'";
    return result;
}

AppDatabase.prototype.createTables = function() {
    var sql1 = "CREATE TABLE IF NOT EXISTS 'contacts' (name TEXT, mobilePhone TEXT, jid TEXT PRIMARY KEY, favourite BOOLEAN DEFAULT 0);";
    var sql2 = "CREATE TABLE IF NOT EXISTS 'chats' (jid TEXT PRIMARY KEY, chatname TEXT, isgroup BOOLEAN DEFAULT 0, unread INTEGER, lmremotejid TEXT DEFAULT NULL, lmfromme BOOLEAN DEFAULT NULL, lmkeyid TEXT DEFAULT NULL);";
    var sql3 = "CREATE TABLE IF NOT EXISTS 'messages' (remotejid TEXT, fromme BOOLEAN, keyid TEXT, data TEXT, status INTEGER, mediawatype INTEGER, timestamp DATETIME, remoteresource TEXT, notifyname TEXT, wantsreceipt BOOLEAN, mediaurl TEXT, medianame TEXT, mediasize INTEGER, mediaseconds INTEGER, longitude DOUBLE, latitude DOUBLE, downloadfile TEXT, PRIMARY KEY (remotejid,fromme,keyid));";
    var sql4 = "CREATE TABLE IF NOT EXISTS 'groups' (gjid TEXT PRIMARY KEY, subject TEXT, owner TEXT, subjectowner TEXT, subjectt DATETIME, creationt DATETIME, participants TEXT);";
    var sql5 = "CREATE INDEX IF NOT EXISTS 'contact_name' ON 'contacts' (name ASC)";
    var sql6 = "CREATE INDEX IF NOT EXISTS 'messages_list_desc' ON 'messages' (remotejid, timestamp DESC)";
    var sql7 = "CREATE INDEX IF NOT EXISTS 'messages_list_status_asc' ON 'messages' (status ASC, timestamp ASC)";
    var sql8 = "ALTER TABLE 'contacts' ADD COLUMN status TEXT";
    var sql9 = "ALTER TABLE 'contacts' ADD COLUMN cc INTEGER";
    var sql10 = "CREATE INDEX IF NOT EXISTS 'contact_cc' ON 'contacts' (cc ASC)";
    this.appDb.transaction( function(t) {
        t.executeSql(sql1, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql2, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql3, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql4, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql5, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql6, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql7, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
        t.executeSql(sql8, [], this.nullDataHandler.bind(this), this.errorHandlerFalse.bind(this));
        t.executeSql(sql9, [], this.nullDataHandler.bind(this), this.errorHandlerFalse.bind(this));
        t.executeSql(sql10, [], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.importContacts = function() {
    this.contactResults = 0;
    this.contacts = [];
    if (this.contactRequest)
        this.contactRequest.cancel();

    this.contactRequest = new Mojo.Service.Request("palm://com.palm.db/", {
        method : "find",
        parameters : {
            "query" : {
                "from" : "com.palm.person:1",
                "limit" : this.contactRequestSize
            },
            "count" : true
        },
        onSuccess : this.impersonate.bind(this),
        onFailure : this.errorHandlerTrue.bind(this)
    });
}

AppDatabase.prototype.impersonate = function(e1) {
    if (e1.results) {
        Mojo.Log.info("find success!, results= %s, count = %d, next  = %s", JSON.stringify(e1.results.length), e1.count, e1.next);
        for (var i = 0; i < e1.results.length; i++) {
            if ('name' in e1.results[i] || 'nickname' in e1.results[i]) {
                var name = (e1.results[i].name.givenName ? e1.results[i].name.givenName : "") + (e1.results[i].name.middleName ? " " + e1.results[i].name.middleName : "") + (e1.results[i].name.familyName ? " " + e1.results[i].name.familyName : "");
                name = name.replace(/^\s+/, "").replace(/\s+$/, "");
                var nickname = ("nickname" in e1.results[i] ? e1.results[i].nickname : "");
                if (name == "")
                    name = nickname;
                // trim string
                if ('phoneNumbers' in e1.results[i]) {
                    for (var j = 0; j < e1.results[i].phoneNumbers.length; j++) {
                    	var checkPhoneType = false;
                    	switch (_appPrefs.cookieData.phoneTypes) {
                    		case "all":
                    		checkPhoneType = true;
                    		break;
                    		case "mobile":
                    		checkPhoneType = (e1.results[i].phoneNumbers[j].type.toLowerCase().indexOf("mobile") != -1);
                    		break;
                    		case "mobilework":
                    		checkPhoneType = (e1.results[i].phoneNumbers[j].type.toLowerCase().indexOf("mobile") != -1) ||
                    						 (e1.results[i].phoneNumbers[j].type.toLowerCase().indexOf("work") != -1);
                    		break;
                    	}
                    	
                        if (checkPhoneType == true) {
                        	
                            var cc = _appData.cookieData.cc;
                            var number = e1.results[i].phoneNumbers[j].value;
                            number = PhoneNumber.normalizeMobile(number);
                            if (PhoneNumber.isInternational(number)) {
                                cc = PhoneNumber.parseCc(number);
                                if (cc == null)
                                    cc = "";
                                number = PhoneNumber.removeCc(cc, number);
                                number = PhoneNumber.normalizeMobile(number);
                            }
                            
                            if (cc != "" && number != "") {
                                var contact = {
                                    "name" : name,
                                    "cc" : cc,
                                    "mobilePhone" : number,
                                    "jid" : "" + cc + number + "@s.whatsapp.net"
                                };
                                this.contacts.push(contact);
                            }
                        }
                    }
                }
            }
            this.contactResults++;
        }
        Mojo.Log.info("Contacts! = " + JSON.stringify(this.contacts.length));

        var total = this.contactResults + e1.count - e1.results.length;
        
        if (this.contactResults < total) {
            if (this.contactRequest)
                this.contactRequest.cancel();
            this.contactRequest = new Mojo.Service.Request("palm://com.palm.db/", {
                method : "find",
                parameters : {
                    "query" : {
                        "from" : "com.palm.person:1",
                        "limit" : this.contactRequestSize,
                        "page" : e1.next
                    },
                    "count" : true
                },
                onSuccess : this.impersonate.bind(this),
                onFailure : this.errorHandlerTrue.bind(this)
            });
        } else {
            if (this.contactRequest)
                this.contactRequest.cancel();
            this.contactRequest = false;
            this.contactResults = 0;
            this.updateContacts(this.contacts);
            _contactsImported = true;
        }
    }
}

AppDatabase.prototype.updateContacts = function(contacts) {
    var sql = "INSERT INTO 'contacts' (name, mobilePhone, jid, cc) VALUES (?,?,?,?);";
    var sql2 = "UPDATE 'contacts' SET name = ?, cc = ?, mobilePhone = ? WHERE jid = ?";
    var sql3 = "UPDATE chats SET chatName = ? WHERE jid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql("DELETE FROM 'contacts' WHERE jid NOT IN (" + AppDatabase.getJidList(contacts) + ")", [], function(t, r) {
            for (var i = 0; i < contacts.length; i++) {
                var contact = contacts[i];
                
                t.executeSql(sql, [contact.name, contact.mobilePhone, contact.jid, contact.cc], this.nullDataHandler.bind(this), this.errorHandlerFalse.bind(this));
                t.executeSql(sql2, [contact.name, contact.cc, contact.mobilePhone, contact.jid], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
                t.executeSql(sql3, [contact.name, contact.jid], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
                _contactJidNames.setItem(contact.jid, contact.name);
                if (contact.jid == _myJid)
                    _contactJidNames.setItem(_myJid, $L("You"));
            }
            this.contacts = [];
        }.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateContact = function(contact) {
    Mojo.Log.info("Update Contact = " + JSON.stringify(contact));
    var sql = "UPDATE contacts SET name=?, mobilePhone=?,favourite=?,cc = ? WHERE jid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [contact.name, contact.mobilePhone, (contact.favourite ? 1 : 0), contact.cc, contact.jid], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateContactStatus = function(jid, status) {
    var sql = "UPDATE contacts SET status = ? WHERE jid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [status, jid], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.findContact = function(jid, callback) {
    var sql = "SELECT * FROM contacts WHERE jid = ?";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [jid], function(t, r) {
            var contact = null;
            if (r.rows.length > 0) {
                contact = {
                    name : r.rows.item(0).name,
                    mobilePhone : r.rows.item(0).mobilePhone,
                    favourite : (r.rows.item(0).favourite == 0 ? false : true),
                    jid : r.rows.item(0).jid,
                    cc : r.rows.item(0).cc,
                    status : r.rows.item(0).status
                };
            }
            callback(contact);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getAllContacts = function(callback) {
    var sql = "SELECT * FROM 'contacts' ORDER BY name ASC;";
    var contacts = [];
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [], function(t, r) {
            for (var i = 0; i < r.rows.length; i++) {
                var contact = {
                    "name" : r.rows.item(i).name,
                    "mobilePhone" : r.rows.item(i).mobilePhone,
                    "jid" : r.rows.item(i).jid,
                    "favourite" : (r.rows.item(i).favourite == 1 ? true : false),
                    "cc" : (r.rows.item(i).cc),
                    "status" : (r.rows.item(i).status)
                };
                contacts.push(contact);
            }
            callback(contacts);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getAllContactsByCc = function(callback) {
    var sql = "SELECT * FROM 'contacts' ORDER BY cc ASC;";
    var contacts = [];
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [], function(t, r) {
            for (var i = 0; i < r.rows.length; i++) {
                var contact = {
                    "name" : r.rows.item(i).name,
                    "mobilePhone" : r.rows.item(i).mobilePhone,
                    "jid" : r.rows.item(i).jid,
                    "favourite" : (r.rows.item(i).favourite == 1 ? true : false),
                    "cc" : (r.rows.item(i).cc),
                    "status" : (r.rows.item(i).status)
                };
                contacts.push(contact);
            }
            callback(contacts);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.saveMessage = function(message, callback) {
    var sql = "INSERT INTO messages (remotejid, fromme, keyid, status, mediawatype, data, timestamp, remoteresource, notifyname, wantsreceipt, mediaurl, medianame, mediasize, mediaseconds, longitude, latitude, downloadfile) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?)";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [message.remote_jid, (message.from_me ? 1 : 0), message.keyId, message.status, message.media_wa_type, message.data, message.timestamp, message.remote_resource, message.notifyname, (message.wants_receipt ? 1 : 0), message.media_url, message.media_name, message.media_size, message.media_duration_seconds, message.longitude, message.latitude, message.downloadedFile], function(t, r) {
            callback(message);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateMediaMessage = function(message, callback) {
    var sql = "UPDATE messages SET status = ?, data = ?, downloadfile = ?, mediaurl = ?, medianame = ?, mediasize = ?, mediaseconds = ?, longitude = ?, latitude = ? WHERE remotejid = ? AND fromme = ? AND keyid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [message.status, message.data, message.downloadedFile, message.media_url, message.media_name, message.media_size, message.media_duration_seconds, message.longitude, message.latitude, message.remote_jid, (message.from_me ? 1 : 0), message.keyId], function(t, r) {
            if (callback)
                callback();
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateMessageStatus = function(message, callback) {
    var sql = "UPDATE messages SET status = ? WHERE remotejid = ? AND fromme = ? AND keyid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [message.status, message.remote_jid, (message.from_me ? 1 : 0), message.keyId], function(t, r) {
            if (callback)
                callback();
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.findMessage = function(message, callback) {
    var sql = "SELECT * FROM  messages WHERE remotejid = ? AND fromme = ? AND keyid = ?";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [message.remote_jid, (message.from_me ? 1 : 0), message.keyId], function(t, r) {
            var message = null;
            if (r.rows.length == 1) {
                message = AppDatabase.messageFromRowItem(r.rows.item(0));
            }
            callback(message);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getAllMessages = function(chat, callback) {
    var sql = "SELECT * FROM 'messages' WHERE remotejid = ? ORDER BY timestamp DESC, fromme ASC";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [chat.jid], function(t, r) {
            var messages = [];
            for (var i = 0; i < r.rows.length; i++) {
                var msg = AppDatabase.messageFromRowItem(r.rows.item(i));
                messages.push(msg);
            }
            callback(messages.reverse());
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getFirstMessages = function(chat, numrows, callback) {
    var sql = "SELECT * FROM 'messages' WHERE remotejid = ? ORDER BY timestamp DESC, fromme ASC LIMIT ?";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [chat.jid, numrows], function(t, r) {
            var messages = [];
            for (var i = 0; i < r.rows.length; i++) {
                var msg = AppDatabase.messageFromRowItem(r.rows.item(i));
                messages.push(msg);
            }
            callback(messages.reverse());
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.deleteMessage = function(msg, callback) {
    var sql = "DELETE FROM 'messages' WHERE remotejid = ? AND fromme = ? AND keyid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [msg.remote_jid, (msg.from_me ? 1 : 0), msg.keyId], function(t, r) {
            callback();
        }.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getUnsentMessages = function(callback) {
    var sql = "SELECT * FROM messages WHERE status = 0 ORDER BY timestamp ASC";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [], function(t, r) {
            var messages = [];
            for (var i = 0; i < r.rows.length; i++) {
                var msg = AppDatabase.messageFromRowItem(r.rows.item(i));
                messages.push(msg);
            }
            Mojo.Log.info("unsent messages " + messages.length);
            callback(messages);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.messageFromRowItem = function(rowitem) {
    var msg = new Message();
    msg.remote_jid = rowitem.remotejid;
    msg.from_me = (rowitem.fromme == 1 ? true : false);
    msg.keyId = rowitem.keyid;
    msg.status = rowitem.status;
    msg.media_wa_type = rowitem.mediawatype;
    msg.timestamp = rowitem.timestamp;
    msg.data = rowitem.data;
    msg.remote_resource = rowitem.remoteresource;
    msg.notifyname = rowitem.notifyname;
    msg.wants_receipt = (rowitem.wantsreceipt == 1 ? true : false);
    msg.media_url = rowitem.mediaurl;
    msg.media_name = rowitem.medianame;
    msg.media_size = rowitem.mediasize;
    msg.media_duration_seconds = rowitem.mediaseconds;
    msg.longitude = rowitem.longitude;
    msg.latitude = rowitem.latitude;
    msg.downloadedFile = rowitem.downloadfile;

    return msg;
}

AppDatabase.prototype.createChat = function(chat, callback) {
    var sql = "INSERT INTO chats (jid, chatname, isgroup, unread, lmremotejid, lmfromme, lmkeyid) VALUES (?,?,?,?,?,?,?)";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [chat.jid, chat.chatName, (chat.isGroup ? 1 : 0), 0, chat.lastMessage.remote_jid, (chat.lastMessage.from_me ? 1 : 0), chat.lastMessage.keyId], function(t, r) {
            callback(chat);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.findOrCreateChat = function(jid, callback) {
    this.findChat(jid, function(chat) {
        if (chat == null) {
            var newChat = new Chat(jid, jid, (jid.search("@g.us") > 0), 0);
            this.getNameForJid(jid, function(name) {
                if (name != null)
                    newChat.chatName = name;
                this.createChat(newChat, function(newChat) {
                    Mojo.Log.info("Chat creado = " + JSON.stringify(newChat));
                    this.findOrCreateChat(jid, callback);
                }.bind(this));
            }.bind(this));
        } else {
            callback(chat);
        }
    }.bind(this));
}

AppDatabase.prototype.getNameForJid = function(jid, callback) {
    var isGroup = (jid.search("@g.us") > 0);

    if (isGroup) {
        this.findGroup(jid, function(group) {
            if (group != null)
                callback(group.subject);
            else
                callback(null);
        });
    } else {
        this.findContact(jid, function(contact) {
            if (contact != null) {
                callback(Message.removeDomainFromJid(contact.name));
            } else
                callback(null);
        });
    }
}

AppDatabase.prototype.deleteChat = function(chat, callback) {
    var sql1 = "DELETE FROM messages WHERE remotejid = ?";
    var sql2 = "DELETE FROM chats WHERE jid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql1, [chat.jid], function(t, r) {
            t.executeSql(sql2, [chat.jid], function(t, r) {
                callback();
            }, this.errorHandlerTrue.bind(this));
        }.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.deleteGroup = function(group, callback) {
    var sql1 = "DELETE FROM groups WHERE gjid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql1, [group.gjid], function(t, r) {
            callback();
        }.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.deleteGroupAndChat = function(group, chat, callback) {
    this.deleteGroup(group, function() {
        this.deleteChat(chat, callback);
    }.bind(this));
}

AppDatabase.prototype.findChat = function(jid, callback) {
    var sql = "SELECT * FROM chats c LEFT OUTER JOIN messages m ON (m.remotejid = c.lmremotejid AND m.fromme = c.lmfromme AND m.keyid = c.lmkeyid) WHERE c.jid = ?";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [jid], function(t, result) {
            var chat = null;
            if (result.rows.length > 0) {
                row = result.rows.item(0);
                chat = new Chat(row.chatname, row.jid, (row.isgroup == 0 ? false : true), row.unread, AppDatabase.messageFromRowItem(row));
            }
            callback(chat);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateChat = function(chat, callback) {
    // Mojo.Log.info("update chat = " + JSON.stringify(chat));
    var sql = "UPDATE chats SET chatname = ?, unread = ?, isgroup = ?, lmremotejid = ?, lmfromme = ?, lmkeyid = ? WHERE jid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [chat.chatName, chat.unread, (chat.isGroup ? 1 : 0), chat.lastMessage.remote_jid, (chat.lastMessage.from_me ? 1 : 0), chat.lastMessage.keyId, chat.jid], function(t, r) {
            if (callback)
                callback(chat);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.getAllChatsWithMessages = function(callback) {
    var sql = "SELECT * FROM chats c LEFT OUTER JOIN messages m ON (c.lmremotejid = m.remotejid AND c.lmfromme = m.fromme AND c.lmkeyid = m.keyid) WHERE (c.lmremotejid IS NOT NULL OR c.isgroup = 1) ORDER BY m.timestamp DESC, c.chatname ASC";
    // "SELECT * FROM chats ORDER BY chatName ASC"; //
    var chats = [];
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [], function(t, r) {
            for (var i = 0; i < r.rows.length; i++) {
                var row = r.rows.item(i);
                var chat = new Chat(row.chatname, row.jid, (row.isgroup == 0 ? false : true), row.unread, AppDatabase.messageFromRowItem(row));
                // chat.lastMessage.remote_jid = row.lmremotejid;
                // chat.lastMessage.from_me= (row.lmfromme == 1?true:false);
                // chat.lastMessage.keyId = row.lmkeyid;
                // Mojo.Log.info("Chat de la lista = " + JSON.stringify(chat));
                chats.push(chat);
            }
            callback(chats);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}
/******
 * GROUP storage
 */
AppDatabase.prototype.createGroup = function(group, callback) {
    var sql = "INSERT INTO groups (gjid, subject, owner, subjectowner, subjectt, creationt, participants) VALUES (?,?,?,?,?,?,?)";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [group.gjid, group.subject, group.owner, group.subject_owner, group.subject_t, group.creation_t, group.participants], function(t, r) {
            callback(group);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.findGroup = function(gjid, callback) {
    var sql = "SELECT * FROM groups WHERE gjid = ?";
    this.appDb.readTransaction( function(t) {
        t.executeSql(sql, [gjid], function(t, result) {
            var group = null;
            if (result.rows.length > 0) {
                row = result.rows.item(0);
                group = new Group(row.gjid, row.subject, row.owner, row.subjectowner, row.subjectt, row.creationt, row.participants);
            }
            callback(group);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateGroup = function(group, callback) {
    Mojo.Log.info("update group = " + JSON.stringify(group));
    var sql = "UPDATE groups SET subject = ?, owner = ?, subjectowner = ?, subjectt = ?, creationt = ? WHERE gjid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [group.subject, group.owner, group.subject_owner, group.subject_t, group.creation_t, group.gjid], function(t, r) {
            if (callback)
                callback(group);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateGroupSubject = function(group, callback) {
    Mojo.Log.info("update group subject = " + JSON.stringify(group));
    var sql = "UPDATE groups SET subject = ?, subjectowner = ?, subjectt = ? WHERE gjid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [group.subject, group.subject_owner, group.subject_t, group.gjid], function(t, r) {
            if (callback)
                callback(group);
        }, this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.updateGroupParticipants = function(group) {
    Mojo.Log.info("update group participants = " + JSON.stringify(group));
    var sql = "UPDATE groups SET participants = ? WHERE gjid = ?";
    this.appDb.transaction( function(t) {
        t.executeSql(sql, [group.participants, group.gjid], this.nullDataHandler.bind(this), this.errorHandlerTrue.bind(this));
    }.bind(this));
}

AppDatabase.prototype.createOrUpdateGroup = function(group, callback) {
    this.findGroup(group.gjid, function(groupFound) {
        if (groupFound == null && group.owner != null) {
            this.createGroup(group, function(newGroup) {
                // Mojo.Log.info("Grupo creado = " + JSON.stringify(newGroup));
                callback(newGroup);
            }.bind(this));
        } else {
            group.owner = groupFound.owner;
            group.creation_t = groupFound.creation_t;
            this.updateGroup(group, function(group) {
                // Mojo.Log.info("Grupo actualizado = " + JSON.stringify(group));
                callback(group);
            });
        }
    }.bind(this));
}
/*! When passed as the error handler, this silently causes a transaction to fail. */
AppDatabase.prototype.killTransaction = function(transaction, error) {
    return true;
    // fatal transaction error
}
/*! When passed as the error handler, this causes a transaction to fail with a warning message. */
AppDatabase.prototype.errorHandlerTrue = function(transaction, error) {
    // error.message is a human-readable string.
    // error.code is a numeric error code
    Mojo.Log.info("find failure treu! Err = " + JSON.stringify(transaction) + ":" + JSON.stringify(error));

    return true;
}

AppDatabase.prototype.errorHandlerFalse = function(transaction, error) {
    // error.message is a human-readable string.
    // error.code is a numeric error code
    Mojo.Log.info("find failure false! Err = " + JSON.stringify(transaction) + ":" + JSON.stringify(error));

    return false;
}
/*! This is used as a data handler for a request that should return no data. */
AppDatabase.prototype.nullDataHandler = function(transaction, results) {

}

