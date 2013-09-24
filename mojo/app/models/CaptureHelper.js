var CaptureHelper = function CaptureHelper(){
	
	/*global objs*/
	var libraries = MojoLoader.require({ name: "mediacapture", version: "1.0" });
	var mediaCaptureObj = libraries.mediacapture.MediaCapture();
	var captureDevice = {};
	var captureFormat = {};
	
	var finishedCallback = {};
	
	/*public*/
	
	function initDeviceAndFormat (bitRate){
		var dev; 
		for (var i=0; i != mediaCaptureObj.captureDevices.length; ++i){
	   		dev = mediaCaptureObj.captureDevices[i];
	    	if (dev.inputtype.indexOf(mediaCaptureObj.INPUT_TYPE_AUDIO)>-1){
	        	break;
	   		}
		}
		
		captureDevice = dev;
		
		var fmt; 
		Mojo.Log.error("%j", mediaCaptureObj.supportedAudioFormats);
		for (i=0; mediaCaptureObj.supportedAudioFormats.length != i; ++i){
		    f = mediaCaptureObj.supportedAudioFormats[i];
			if (f.samplerate == bitRate){
			     fmt = mediaCaptureObj.supportedAudioFormats[i];
			     if (fmt.mimetype == "audio/vnd.wave")
			         this.extension = ".wav";
			}

            if (f.codecs == "samr") {
                fmt = mediaCaptureObj.supportedAudioFormats[i];
                this.extension = ".3gpp";
                break;
            }
		}
		
		captureFormat = fmt;
		Mojo.Log.error('----CaptureHelper: initted device: '+Object.toJSON(captureDevice) + ' and format: '+
			Object.toJSON(captureFormat));
			
		mediaCaptureObj.addEventListener("audiocapturecomplete", audiocapturecompleteHandler.bind(this) , false);
			
		if (Object.toJSON(captureFormat) != '{}' && Object.toJSON(captureDevice) != '{}'){
			return true;
		}
		else{
			return false;
		}
	
	}
	
	function startRecording(name, callback){
		finishedCallback = callback;
		mediaCaptureObj.load(captureDevice.deviceUri, {"audioCaptureFormat":captureFormat});
		mediaCaptureObj.startAudioCapture(name, {});
	}
	
	function stopRecording(){
		mediaCaptureObj.stopAudioCapture();
		mediaCaptureObj.unload();
	}
	
    function cancelRecording() {
        mediaCaptureObj.removeEventListener("audiocapturecomplete", audiocapturecompleteHandler.bind(this) , false);        
        stopRecording();
    }
	
	
	var audiocapturecompleteHandler = function(event){
		Mojo.Log.error('----CaptureHelper: Capture complete!');
		finishedCallback({returnValue:true})
	}

	return {
		initDeviceAndFormat : initDeviceAndFormat,
		stopRecording: stopRecording,
		startRecording : startRecording,
		cancelRecording : cancelRecording
	};
}