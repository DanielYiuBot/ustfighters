// New file.

// global variables
let gameAnimFrameId = null; // track requestAnimationFrame's id, in case we need to cancel the callback
let restoreJoinButtonTimeout = null;

// this is global too, in case console throws error accessing this variable from socket
let returnData = null;

// modules

// if timer is already present, ignore this
const timerSprite = function(ctx, x, y) {
	// x and y are in the middle of the timer object
	const draw = function(time, colour = "#000") {
		ctx.save();
		ctx.font = "60px Arial, Helvetica, sans-serif"; // font can be changed if needed
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = colour;
		const m = Math.floor(time / 60), sec = time % 60;
		const s = sec > 9 ? sec : `0${sec}`;
		ctx.fillText(`${m}:${s}`, x, y);
		ctx.restore();
	};
	
	return { draw };
};

// if health bars are already present, ignore this
const healthBar = function(ctx, x, y, w, h, side) {
	// x and y are the top-left corner of the bar
	// side records which side of the screen the health bar refers to
	const draw = function(health, maxHP) {
		ctx.save();
		ctx.fillStyle = "#f00";
		ctx.fillRect(x, y, w, h); // this is the red bar behind the other one showing HP percentage
		ctx.fillStyle = "#0f0";
		if (health == 0) {
			// this side is down! no need to draw the other bar (or the health number)
			return;
		} else if (side == "left") {
			ctx.fillRect(x, y, w * Math.min(health, maxHP) / maxHP, h);
		} else {
			ctx.fillRect(x + w * (1 - Math.min(health, maxHP) / maxHP), y, w * health / maxHP, h);
		};
		ctx.font = `${h*0.9}px Arial, Helvetica, sans-serif`;
		ctx.fillStyle = "#006";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		if (side == "left") {
			ctx.fillText(`${health}`, x + w * health / maxHP / 2, y + h / 2);
		} else {
			ctx.fillText(`${health}`, x + w * (1 - health / maxHP / 2), y + h / 2);
		};
		ctx.restore();
	};
	
	return { draw };
};

// functions
function drawBackground(cv, ctx, unseenBorders, gap) {
	// this draws all the stuff that shouldn't be changed during gameplay (e.g. flavour text)
	// if something similar is present ignore this
	ctx.save();
	ctx.fillStyle = "#999";
	ctx.fillRect(0, 0, cv.width, unseenBorders.top - gap.top);
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = "40px Arial, Helvetica, sans-serif";
	ctx.fillStyle = "#000";
	ctx.fillText("TIME", 640, 30);
	ctx.font = "20px Arial, Helvetica, sans-serif";
	ctx.textAlign = "right";
	ctx.fillText("HP", 50, 90);
	ctx.textAlign = "left";
	ctx.fillText("HP", 1230, 90);
	const groundGradient = ctx.createLinearGradient(0, unseenBorders.bottom + gap.bottom, 0, cv.height);
	groundGradient.addColorStop(0, "white");
	groundGradient.addColorStop(0.4, "lime");
	groundGradient.addColorStop(0.8, "green");
	groundGradient.addColorStop(1, "#040");
	ctx.fillStyle = groundGradient;
	ctx.fillRect(0, unseenBorders.bottom + gap.bottom, cv.width, cv.height);
	ctx.restore();
};

function stopGame() { // called when opponent disconnected, this should stop the game preemptively and restore the main page
	// stop game animations (if game already started)
	if (gameAnimFrameId) {
		cancelAnimationFrame(gameAnimFrameId);
		gameAnimFrameId = null;
	};
	// hide the game canvas
	document.querySelector("canvas").style.display = "none";
	// prepare the message on the main page
	document.getElementById("waitingtext").innerHTML = "Unfortunately, your opponent disconnected! This game will not count towards your records.";
	// show the main page
	document.getElementById("main_page").style.display = "block";
	// allow the player to join another game after a delay
	restoreJoinButtonTimeout = setTimeout(restoreJoinButton, 2000);
};

// initialiseGame: runs once, when the game starts
const initialiseGame = function(side) {
	// hide all things related to the main page
	document.getElementById("main_page").style.display = "none";
	// show the game canvas
	document.querySelector("canvas").style.display = "block";
	
	// canvas reference and context
	const cv = document.querySelector("canvas");
	const ctx = cv.getContext("2d");
	
	// variables (some of these can be ignored / replaced)
	let gameTime = 150; // time remaining, in seconds
	const maxGameTime = gameTime; // total duration, in seconds
	let gameStartTime = 0;
	const maxHP = 100; // max HP
	const unseenBorders = { top: 140, bottom: 540 };
	const gap = { top: 20, bottom: 40 };
	const otherside = side == "left" ? "right" : "left";
	
	// game objects (same)
	const gameArea = BoundingBox(ctx, unseenBorders.top, 40, unseenBorders.bottom, 1240);
	const timer = timerSprite(ctx, 640, 90);
	const HPbars = {
		left: healthBar(ctx, 60, 70, 480, 40, "left"),
		right: healthBar(ctx, 740, 70, 480, 40, "right"),
	};
	const players = {
		left: Player(ctx, 240, 360, gameArea, "left", maxHP),
		right: Player(ctx, 1040, 360, gameArea, "right", maxHP),
	};
	
	// handle key presses
	const handleKeydown = function(e) {
		switch(e.key) {
			case "ArrowUp": players[side].jump(); break;
			case "ArrowLeft": players[side].setAcc(-3, 0); break;
			case "ArrowRight": players[side].setAcc(3, 0); break;
			case "c": // cheat mode key (can change)
			case "C": if (!e.repeat) players[side].toggleCheating(); // only trigger once!
			default: break;
		};
	};
	const handleKeyup = function(e) {
		switch(e.key) {
			case "ArrowLeft":
			case "ArrowRight": players[side].setAcc(0, 0); break;
			default: break;
		}
	};
	
	const endGame = function() { // called when some player's HP reaches 0, or if time is up
		// not yet implemented
	};
	
	// gameFrame
	const gameFrame = function(now) {
		// update game time
		if (gameStartTime > 0) {
			gameTime = Math.ceil((maxGameTime * 1000 + gameStartTime - now) / 1000);
		} else gameStartTime = now;
		
		// update this player
		players[side].update(now);
		
		// prepare data to send to server (can add more data inputs if needed)
		let data = {};
		data.pos = players[side].getPos();
		data.vel = players[side].getVel();
		data.HP = players[side].getHP();
		
		// send to server
		Socket.updateOtherPlayer(JSON.stringify(data));
		
		// update other player using data from server
		players[otherside].updateFromServer(now, returnData);
		
		// clear the screen, then draw the game objects and the background
		ctx.clearRect(0, 0, cv.width, cv.height);
		drawBackground(cv, ctx, unseenBorders, gap);
		if (gameTime < 11) {
			timer.draw(gameTime, "#f00");
		} else if (gameTime < 31) {
			timer.draw(gameTime, "#c40");
		} else {
			timer.draw(gameTime);
		}
		HPbars.left.draw(players.left.getHP(), maxHP);
		HPbars.right.draw(players.right.getHP(), maxHP);
		players.left.draw();
		players.right.draw();
		
		// end game detection
		if (gameTime < 1 || players.left.getHP() < 1 || players.right.getHP() < 1) {
			gameAnimFrameId = null;
			removeEventListener("keydown", handleKeydown);
			removeEventListener("keyup", handleKeyup);
			returnData = {};
			endGame();
		} else {
			gameAnimFrameId = requestAnimationFrame(gameFrame);
		};
	};
	
	// game canvas initialisation
	drawBackground(cv, ctx, unseenBorders, gap);
	timer.draw(gameTime);
	HPbars.left.draw(maxHP, maxHP);
	HPbars.right.draw(maxHP, maxHP);
	players.left.draw();
	players.right.draw();
	
	// event listener for keys
	addEventListener("keydown", handleKeydown);
	addEventListener("keyup", handleKeyup);
	
	gameAnimFrameId = requestAnimationFrame(gameFrame);
};