

function MojoWhatsupService(){
    this.requests = [];
}

MojoWhatsupService.prototype.exportMessages = function(params, onSuccess, onFailure){
	Mojo.Log.error("Por aqui 1");	
    return this.doRequest("exportmessages", params, onSuccess, onFailure);
}

MojoWhatsupService.prototype.doRequest = function(method, params, onSuccess, onFailure){
    var requestId = 0;
	Mojo.Log.error("Por aqui 2");
    for (var i = 0; i < this.requests.length; i++) {
        if (this.requests[i] == undefined) {
            requestId = i;
            break;
        }
    }
    Mojo.Log.error("service id asigned = " + requestId);
    this.requests[requestId] = new Mojo.Service.Request(this.identifier, {
        method: method,
        parameters: params ||
        {},
        onSuccess: onSuccess || Mojo.doNothing,
        onFailure: onFailure || Mojo.doNothing,
        onComplete: this.onComplete.bind(this, requestId)
    });
    
    return this.requests[requestId];
}

MojoWhatsupService.prototype.onComplete = function(id){
    Mojo.Log.error("service id completed = " + id);
    delete this.requests[id];
}

MojoWhatsupService.prototype.identifier = "palm://com.palm.mojowhatsup.service";
