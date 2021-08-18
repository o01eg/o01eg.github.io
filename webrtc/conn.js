var logElem = null;
const ipregex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function log(message) {
	if (logElem) {
		logElem.innerHTML += message + '<br/>';
	}
}

function logErr(message) {
	if (logElem) {
		logElem.innerHTML += '<span class="error">' + message + '</span><br/>';
	}
}

function randomBase64String(length) {
	let res = "";
	for (let i = 0; i < length; ++ i) {
		res += base64[Math.floor(Math.random() * base64.length)];
	}
	return res;
}

function fakeAnswer(connHost, connPort) {
	let sdp = "v=0\r\n";
	let sessId = String(Math.floor(Math.random() * 9) + 1);
	for (let i = 0; i < 20; ++ i) {
		sessId = String(Math.floor(Math.random() * 10));
	}
	sdp += `o=- ${sessId} 0 IN IP4 0.0.0.0\r\n`;
	sdp += `s=-\r\nt=0 0\r\na=sendrecv\r\n`;
	// ToDo: a=fingerprint
	sdp += "a=group:BUNDLE 0\r\na=msid-semantic:WMS *\r\n";
	sdp += `m=application ${connPort} UDP/DTLS/SCTP webrtc-datachannel\r\n`
	sdp += `c=IN IP4 ${connHost}\r\n`
	sdp += `a=candidate:0 1 UDP 99999999 ${connHost} ${connPort} typ host\r\n`
	sdp += `a=sendrecv\r\na=end-of-candidates\r\n`
	icePwd = randomBase64String(22);
	sdp += `a=ice-pwd: ${icePwd}\r\n`
	iceUfrag = randomBase64String(4);
	sdp += `a=ice-ufrag: ${iceUfrag}\r\n`
	sdp += `a=mid:0\r\na=setup:active\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n`

	console.log(sdp);

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
				logErr(`Cannot set answer: ${reason}`);
			});
		}).catch(function(reason) {
			logErr(`Cannot set offer: ${reason}`);
		});
	}).catch(function(reason) {
		logErr(`Cannot create offer: ${reason}`);
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
			logErr(`Connection error: ${reason}`);
		}
	} else {
		logErr("Incorrect host and port");
	}
	return false;
}

