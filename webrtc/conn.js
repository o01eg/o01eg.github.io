var logElem = null;

function log(message) {
	if (logElem) {
		logElem.innerHTML += message + '<br/>';
	}
}

function connect(connHost, connPort) {
	let conn = new RTCPeerConnection();
	log("Created connection");
	let dataChannel = conn.createDataChannel("chat");
	log("Created data channel");
	conn.createOffer().catch(function(reason) {
		log(`Cannot create offer: ${reason}`);
	}).then(function(offer) {
		log("Created offer");
		conn.setLocalDescription(offer).catch(function(reason) {
			log(`Cannot set offer: ${reason}`);
		}).then(function(_) {
			log("Set offer");
		});
	});
}

function connToHost() {
	console.log("Start");

	let connHost = String(document.forms["conn-form"].elements["conn-host"].value);
	let connPort = Number(document.forms["conn-form"].elements["conn-port"].value);

	let logElem = document.getElementById("log");
	log(`Connecting to ${connHost}:${connPort} ...`);
	try {
		connect(connHost, connPort, log);
	} catch (reason) {
		log(`Connection error: ${reason}`);
	}
	return false;
}

