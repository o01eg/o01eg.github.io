var logElem = null;
const ipregex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/gm;
const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const fingerprintregex = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/gm;

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

/*
 * Uses ICE password from offer so desktop endpoint could use it for ICE STUN confirmation.
 * It doesn't use ICE username fragment because short username fragments cannot be used as passwords.
 */
function fakeAnswer(connHost, connPort, connFingerprint, icePwd) {
	let sdp = "v=0\r\n";
	let sessId = String(Math.floor(Math.random() * 9) + 1);
	for (let i = 0; i < 16; ++ i) {
		sessId += String(Math.floor(Math.random() * 10));
	}
	sdp += `o=- ${sessId} 0 IN IP4 0.0.0.0\r\n`;
	sdp += `s=-\r\nt=0 0\r\na=sendrecv\r\n`;
	sdp += `a=fingerprint:sha-256 ${connFingerprint}\r\n`;
	sdp += "a=group:BUNDLE 0\r\na=msid-semantic:WMS *\r\n";
	sdp += `m=application ${connPort} UDP/DTLS/SCTP webrtc-datachannel\r\n`
	sdp += `c=IN IP4 ${connHost}\r\n`
	sdp += `a=candidate:0 1 UDP 99999999 ${connHost} ${connPort} typ host\r\n`
	sdp += `a=sendrecv\r\na=end-of-candidates\r\n`
	sdp += `a=ice-pwd:${icePwd}\r\n`
	sdp += `a=ice-ufrag:${icePwd}\r\n`
	sdp += `a=mid:0\r\na=setup:active\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n`

	console.log(sdp);

	return {
		type: "answer",
		sdp
	};
}

function fakeCandidate(connHost, connPort, iceUfrag) {
	return {
		candidate: `candidate:0 1 UDP 99999999 ${connHost} ${connPort} typ host`,
		sdpMLineIndex: 0,
		usernameFragment: iceUfrag
	};
}

/*
 * Extract ICE password to send it to desktop endpoint
 */
function extractIcePwdFromSdp(sdp) {
	const attrIcePwd = "a=ice-pwd:";
	let lines = sdp.split("\n");
	var result = null;
	for (const line of lines) {
		if (line.startsWith(attrIcePwd)) {
			if (result) {
				return null;
			}
			result = line.substring(attrIcePwd.length).trim();
		}
	}
	return result;
}

function connect(connHost, connPort, connFingerprint) {
	let conn = new RTCPeerConnection();
	log("Created connection");
	conn.onconnectionstatechange = function(event) {
		log(`connectionstatechange: ${conn.connectionState}`);
	};
	let dataChannel = conn.createDataChannel("chat");
	log("Created data channel");
	conn.createOffer().then(function(offer) {
		log("Created offer");
		conn.setLocalDescription(offer).then(function(_) {
			log("Set offer");
			let icePwd = extractIcePwdFromSdp(offer.sdp);
			if (icePwd) {
				log(`Extracted ICE password: ${icePwd}`);
				let answer = fakeAnswer(connHost, connPort, connFingerprint, icePwd);
				conn.setRemoteDescription(answer).then(function(_) {
					log("Set fake answer");
					conn.addIceCandidate(fakeCandidate(connHost, connPort, icePwd)).then(function(_) {
						log("Set fake candidate");
						conn.addIceCandidate().then(function(_) {
							log("Set fake end of candidates");
						}).catch(function(reason) {
							logErr(`Cannot add fake end of candidate: ${reason}`);
						});
					}).catch(function(reason) {
						logErr(`Cannot add fake candidate: ${reason}`);
					});
				}).catch(function(reason) {
					logErr(`Cannot set answer: ${reason}`);
				});
			} else {
				logErr("Cannot detect ICE password");
			}
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
	let connFingerprint = String(document.forms["conn-form"].elements["conn-fingerprint"].value);

	logElem = document.getElementById("log");
	logElem.innerHTML = "";
	if (connPort > 0 && ipregex.test(connHost) && fingerprintregex.test(connFingerprint)) {
		log(`Connecting to ${connHost}:${connPort} ...`);
		try {
			connect(connHost, connPort, connFingerprint);
		} catch (reason) {
			logErr(`Connection error: ${reason}`);
		}
	} else {
		logErr(`Incorrect host ${connHost} and port ${connPort}`);
	}
	return false;
}

