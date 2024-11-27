// Structure referenced from socket.js in Labs 5/6.

const Socket = (function() {
    let socket = null;
	let waitingTimeout = waitingTextInterval = loadGameTimeout = null; // declare timeout/interval variables
	let numberOfDots = 0; // number of dots in the "Looking for opponent..." flavour text (- 1, because 0-indexed)
    const getSocket = function() {
        return socket;
    };
    const connect = function() {
        socket = io();
        socket.on("connect", () => {
			// get user info
			socket.emit("get user info");
			// put user in main room
			socket.emit("send me to", "main"); // join the main room
        });
		socket.on("return user info", (userinfo, username) => {
			const { name, room, side, gameStats } = JSON.parse(userinfo);
			document.getElementById("userinfotext").innerHTML = `<span style="font-size:150%">Hello, ${name} (${username}) !</span><br><br>Here are your stats:<br><br>Total games played: ${gameStats.pld}<br>Total wins: ${gameStats.w}<br>Total losses: ${gameStats.l}`; // template literals used (in a few other spots too), can change if needed
		});
		socket.on("opponent found", (matchedPlayers, newRoom) => {
			const username = Authentication.getUser().username;
			const players = JSON.parse(matchedPlayers);
			if (players[username]) {
				// clear the timeouts/intervals
				clearTimeout(waitingTimeout);
				clearInterval(waitingTextInterval);
				waitingTimeout = waitingTextInterval = null;
				// tell the player which side they're on
				document.getElementById("waitingtext").innerHTML = `Opponent found!<br>You will play on the <span style="font-weight:bold">${players[username]}</span> side of the screen.`;
				socket.emit("send me to", newRoom);
				// 2 seconds later, load the game screen and also let initialiseGame know which side the player is on
				loadGameTimeout = setTimeout(initialiseGame, 2000, players[username]); 
			}
		});
		socket.on("opponent disconnected", ()=>{
			// clear the waiting timeout if there is any
			if (loadGameTimeout) clearTimeout(loadGameTimeout);
			// stop the game (preemptively)
			stopGame();
			// put user back in the main room
			socket.emit("send me to", "main");
		});
		socket.on("force disconnect", ()=>{
			// forced disconnection from server
			Authentication.signout(()=>{
				disconnect();
				// tell the client they've been disconnected because of a server restart
				alert("Sorry, you have been signed out because the server restarted.");
				// undo the changes in signin
				document.getElementById("register").style.display = "flex";
				document.getElementById("signin").style.display = "flex";
				document.getElementById("userinfo").style.display = "none";
				document.getElementById("joingame").style.display = "none";
				document.getElementById("signout").style.display = "none";
			});
		});
		socket.on("player update from server", (data)=>{
			returnData = JSON.parse(data);
		});
    };
    const disconnect = function() {
		// clear all timeouts/intervals
		if (loadGameTimeout) {
			clearTimeout(loadGameTimeout);
			loadGameTimeout = null;
		};
		if (waitingTimeout) {
			clearTimeout(waitingTimeout);
			waitingTimeout = null;
			Socket.requestFailed();
		}
        socket.disconnect();
        socket = null;
    };
	const requestOpponent = function() {
		if (socket && socket.connected) {
			const maxWaitingTime = 30000; // wait max 30s for opponent
			// put user in waiting room, waiting for opponent
			socket.emit("send me to", "waiting");
			// tell server to search for opponent
			socket.emit("look for opponent");
			document.getElementById("pairup").style.display = "none";
			document.getElementById("waitingtext").innerHTML = `Looking for opponent${".".repeat(numberOfDots+1)}`;
			waitingTimeout = setTimeout(Socket.requestFailed, maxWaitingTime);
			waitingTextInterval = setInterval(Socket.rotateWaitingText, 500);
		}
	};
	const requestFailed = function() {
		if (socket && socket.connected) {
			clearInterval(waitingTextInterval);
			waitingTextInterval = null;
			document.getElementById("waitingtext").innerHTML = "Timed out! You can try again.";
			restoreJoinButton();
			// put user back in main room
			socket.emit("send me to", "main");
		}
	};
	const rotateWaitingText = function() {
		numberOfDots = (numberOfDots + 1) % 3;
		document.getElementById("waitingtext").innerHTML = `Looking for opponent${".".repeat(numberOfDots+1)}`;
	};
	const updateOtherPlayer = function(data) {
		if (socket && socket.connected) {
			// transmit the data to server
			socket.emit("player update", data);
		}
	};
    return { getSocket, connect, disconnect, requestOpponent, requestFailed, rotateWaitingText, updateOtherPlayer };
})();
