var logElem = null;
const ipregex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;

function log(message) {
	if (logElem) {
		logElem.innerHTML += message + '<br/>';
	}
}

function fakeAnswer(connHost, connPort) {
	let sdp = "v=0\r\n";
	return {
		type: "answer",
		sdp
	};
}

function connect(connHost, connPort) {
	let conn = new RTCPeerConnection();
	log("Created connection");
	let dataChannel = conn.createDataChannel("chat");
	log("Created data channel");
	conn.createOffer().then(function(offer) {
		log("Created offer");
		conn.setLocalDescription(offer).then(function(_) {
			log("Set offer");
			conn.setRemoteDescription(fakeAnswer(connHost, connPort)).then(function(_) {
				log("Set answer");
			}).catch(function(reason) {
				log(`Cannot set answer: ${reason}`);
			});
		}).catch(function(reason) {
			log(`Cannot set offer: ${reason}`);
		});
	}).catch(function(reason) {
		log(`Cannot create offer: ${reason}`);
	});
}

function connToHost() {
	console.log("Start");

	let connHost = String(document.forms["conn-form"].elements["conn-host"].value);
	let connPort = Number(document.forms["conn-form"].elements["conn-port"].value);

	logElem = document.getElementById("log");
	logElem.innerHTML = "";
	if (connPort > 0 && ipregex.test(connHost)) {
		log(`Connecting to ${connHost}:${connPort} ...`);
		try {
			connect(connHost, connPort, log);
		} catch (reason) {
			log(`Connection error: ${reason}`);
		}
	} else {
		log("Incorrect host and port");
	}
	return false;
}

