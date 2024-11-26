// code to load depedencies and activate server:
// npm install express express-session bcrypt socket.io
// [in node.js] node server.js

// required npm modules / constants (similar to labs 5/6)
const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");

// create the express app (same as lab 5)
const app = express();

// socket.io server creation (same as lab 6)
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

// public folder for static files; json middleware for JSON data (same as lab 5)
app.use(express.static("public"));
app.use(express.json());

// session middleware for maintaining browser sessions (similar to lab 5)
const gameSession = session({
	secret: "game",
	resave: false,
	saveUninitialized: false,
	rolling: true,
	cookie: { maxTime: 300000 }
});
app.use(gameSession);

// use the created session (same as lab 6)
io.use((socket, next) => {
	gameSession(socket.request, {}, next);
});

// object for tracking who is online (similar to lab 6)
const onlinePlayers = {};

// object for tracking what game "rooms" are active, will consist of keys for room names and arrays for users in those "rooms"
// can delete if there's a better idea / implementation
const onlineGameRooms = { "main": [], "waiting": [], };

// helper function (same as that given in lab 5)
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// register endpoint (similar to lab 5)
app.post("/register", (req, res) => {
    const { username, name, password } = req.body;
	const currentusers = JSON.parse(fs.readFileSync("data/users.json"));
	let emptydata = 0, errormsg = "";
	emptydata += (username == "" ? 4 : 0);
	emptydata += (name == "" ? 2 : 0);
	emptydata += (password == "" ? 1 : 0);
	if (emptydata > 0) { // might be too clunky, can change if needed
		switch (emptydata) {
			case 1: errormsg = "Please provide a password!"; break;
			case 2: errormsg = "Please provide a name!"; break;
			case 3: errormsg = "Please provide a name and a password!"; break;
			case 4: errormsg = "Please provide a username!"; break;
			case 5: errormsg = "Please provide a username and a password!"; break;
			case 6: errormsg = "Please provide a username and a name!"; break;
			case 7: errormsg = "Please provide a username, a name and a password!"; break;
		};
		res.json({ status: "error", error: errormsg }); return;
	} else if (!containWordCharsOnly(username)) {
		res.json({ status: "error", error: "Invalid username! Usernames should only contain letters, numbers, and/or underscores." }); return;
	} else if (username in currentusers) {
		res.json({ status: "error", error: "This username is already taken! Please provide another one." }); return;
	};
	const hashpwd = bcrypt.hashSync(password, 10);
	currentusers[username] = { name, password: hashpwd, gameStats: {pld: 0, w: 0, l: 0}, }; // added gameStats to track each player's W/L record and games played
	fs.writeFileSync("data/users.json", JSON.stringify(currentusers, null, "  "));
	res.json({ status: "success" });
});

// signin endpoint (similar to lab 5)
app.post("/signin", (req, res) => {
    const { username, password } = req.body;
	const currentusers = JSON.parse(fs.readFileSync("data/users.json"));
	if (!(username in currentusers)) {
		res.json({ status: "error", error: "Username not found!" }); return;
	} else if (username in onlinePlayers) {
		res.json({ status: "error", error: "Already signed in!" }); return;
	} else if (!bcrypt.compareSync(password, currentusers[username].password)) {
		res.json({ status: "error", error: "Incorrect password!" }); return;
	};
	const name = currentusers[username].name, gameStats = currentusers[username].gameStats;
	const user = { username, name, gameStats };
	req.session.user = user;
	res.json({ status: "success", user });
});

// validate endpoint (same as lab 5)
app.get("/validate", (req, res) => {
	user = req.session.user;
	if (user == null) {
		res.json({ status: "error", error: "No user is signed in" });
	} else {
		res.json({ status: "success", user });
	}
});

// signout endpoint (same as lab 5)
app.get("/signout", (req, res) => {
	req.session.user = null;
	res.json({ status: "success" });
});

// note: some of the following utilises socket.io "rooms" feature, can change if needed
// for reference: https://socket.io/docs/v4/rooms/

io.on("connection", (socket) => {
	const sessionUser = socket.request.session.user;
	// user signin (similar to lab 6)
	if (sessionUser != null && !(sessionUser.username in onlinePlayers)) { // second condition catches double connections e.g. from two tabs of the same browser
		onlinePlayers[sessionUser.username] = {
			name: sessionUser.name,
			room: null, // for organising event listeners
			side: "left", // which side is the player on?
			gameStats: sessionUser.gameStats,
		};
	};
	// user signout / disconnection (similar to lab 6)
	socket.on("disconnect", ()=>{
		if (!(sessionUser.username in onlinePlayers)) return; // double disconnections?? must be at least two tabs of the same browser
		const originalRoom = onlinePlayers[sessionUser.username].room;
		if (typeof(originalRoom) == "number") {
			// tell the client of the opponent that the player disconnected
			socket.to(originalRoom).emit("opponent disconnected");
		}
		// cleanup
		if (originalRoom) {
			onlineGameRooms[originalRoom].splice(onlineGameRooms[originalRoom].indexOf(sessionUser.username), 1);
		};
		delete onlinePlayers[sessionUser.username];
	});
	// get user info
	socket.on("get user info", ()=>{
		socket.emit("return user info", JSON.stringify(onlinePlayers[sessionUser.username]), sessionUser.username);
	});
	// "send me to" event listener: assign user/player to specific room (and socket.io room)
	socket.on("send me to", (room)=>{
		const originalRoom = onlinePlayers[sessionUser.username].room;
		if (originalRoom) {
			// remove player from original room
			onlineGameRooms[originalRoom].splice(onlineGameRooms[originalRoom].indexOf(sessionUser.username), 1);
			socket.leave(originalRoom);
			// if it is a game room and both players have left, delete that room id
			if (typeof(originalRoom) == "number" && onlineGameRooms[originalRoom].length < 1) delete(onlineGameRooms[originalRoom]);
		};
		onlinePlayers[sessionUser.username].room = room;
		if (room) {
			// add player to new room
			onlineGameRooms[room].push(sessionUser.username);
			socket.join(room);
		};
	});
	// look for opponent (specifically)
	socket.on("look for opponent", ()=>{
		if (onlineGameRooms.waiting.length > 1) { // are there (at least) two players waiting for a game?
			// find an unused game room index
			let i = 1;
			while (onlineGameRooms[i]) i++;
			onlineGameRooms[i] = []; // initialise the new game room
			// prepare response objects
			let matchedPlayers = {};
			const seed = Math.random(); // random number for determining who goes on the left / right side of screen
			if (seed < 0.5) {
				matchedPlayers[onlineGameRooms["waiting"][0]] = "left";
				onlinePlayers[onlineGameRooms["waiting"][0]].side = "left";
				matchedPlayers[onlineGameRooms["waiting"][1]] = "right";
				onlinePlayers[onlineGameRooms["waiting"][1]].side = "right";
			} else {
				matchedPlayers[onlineGameRooms["waiting"][0]] = "right";
				onlinePlayers[onlineGameRooms["waiting"][0]].side = "right";
				matchedPlayers[onlineGameRooms["waiting"][1]] = "left";
				onlinePlayers[onlineGameRooms["waiting"][1]].side = "left";
			};
			// tell everyone in the waiting room that the first two players in the waiting room are matched and should move to room number i
			io.to("waiting").emit("opponent found", JSON.stringify(matchedPlayers), i);
		}; // otherwise just leave them waiting, a second player should activate this script again (if one comes in time)
	});
	socket.on("player update", (data)=>{
		// send the data to the opponent
		socket.to(onlinePlayers[sessionUser.username].room).emit("player update from server", data);
	});
});

// listen at port 8000
httpServer.listen(8000);