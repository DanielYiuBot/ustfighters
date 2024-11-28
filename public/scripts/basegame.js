// New file.

// global variables
const gravity = 0.7;
let gameAnimFrameId = null; // track requestAnimationFrame's id, in case we need to cancel the callback
let endGameTimeout = null;
let restoreJoinButtonTimeout = null;
let returnData = null; // this is global too, in case console throws error accessing this variable from socket
const players = {left: null, right: null}; // so that stopGame can access this variable 

// modules

// timer is already there, ignore this
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

// health bars are already there, ignore this
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

// stopGame: called when opponent disconnects / someone selects return to main page after ending a game - restore the main page
function stopGame(gameEnded = false) {
	// stop game animations (if game already started)
	if (gameAnimFrameId) {
		cancelAnimationFrame(gameAnimFrameId);
		gameAnimFrameId = null;
		// delete the player objects
		delete players.left;
		delete players.right;
	};
	// stop timer (if game already started)
	if (timerId) {
		clearTimeout(timerId);
	}
	sounds.background.pause();
	// hide the game area
	document.getElementById("game_area").style.display = "none";
	// prepare the message on the main page (if game stopped preemptively), otherwise clear the text there
	document.getElementById("waitingtext").innerHTML = gameEnded ? "" : "Unfortunately, your opponent disconnected! This game will not count towards your records.";
	// show the main page
	document.getElementById("main_page").style.display = "block";
	if (gameEnded) {
		// let the player join another game immediately if they wanted to
		restoreJoinButton();
	} else {
		// allow the player to join another game after a delay (2 seconds)
		restoreJoinButtonTimeout = setTimeout(restoreJoinButton, 2000);
	}
};

// returnToFrontpage: event listener for the button of (similar) name
const returnToFrontpage = function(e) {
	document.getElementById("return_to_frontpage").removeEventListener("click", returnToFrontpage); // get rid of the event listener before I destroy the button
	document.getElementById("displayText").innerHTML = "";
	Socket.backtoMain();
	stopGame(true);
}

// initialiseGame: runs once, when the game starts
const initialiseGame = function(side) {
	//play background music
	sounds.background.volume = 0.3
	sounds.background.play();
	// hide all things related to the main page
	document.getElementById("main_page").style.display = "none";
	// reset things in the game area
	// display text
	document.getElementById("displayText").style.display = "none";
	// health bars
	document.getElementById("player1Health").style.width = "100%";
	document.getElementById("player2Health").style.width = "100%";
	// show the game area
	document.getElementById("game_area").style.display = "inline-block";
	
	// variables
	timer = 90; // time remaining, in seconds
	const maxTime = timer;
	const otherside = side == "left" ? "right" : "left";
	let lastkey; // there's only one player, and it could be either, so I'm using a variable outside the sprite
	const attackFrame = { left: 4, right: 2 } // the frame the fighters register their attack at are different
	const keys = {
		ArrowRight: { pressed: false },
		ArrowLeft: { pressed: false }
	};
	
	// game objects
	const background = new Sprite({
		position: { x: 0, y: 0 },
		imageSrc: "img/background.jpg"
	});
	players.left = new Fighter({
		position: { x: 0, y: 0 },
		velocity: { x: 0, y: 0 },
		imageSrc: "img/man/Idle.png",
		framesMax: 10,
		scale: 3,
		offset: { x: 0, y: 125 },
		sprites: {
			idle: { imageSrc: "img/man/Idle.png", framesMax: 10 },
			run: { imageSrc: "img/man/Run.png", framesMax: 8 },
			jump: { imageSrc: "img/man/Jump.png", framesMax: 3 },
			fall: { imageSrc: "img/man/Fall.png", framesMax: 3 },
			attack1: { imageSrc: "img/man/Attack1.png", framesMax: 7 },
			takeHit: { imageSrc: "img/man/TakeHit.png", framesMax: 3 },
			death: { imageSrc: "img/man/Death.png", framesMax: 11 },
		},
		attackBox: {
			offset: { x: 130, y: 50 },
			width: 160,
			height: 50
		}
	});
	players.right = new Fighter({
		position: { x: 700, y: 0 },
		velocity: { x: 0, y: 0 },
		color: "blue",
		imageSrc: "img/woman/Idle.png",
		framesMax: 8,
		scale: 3.2,
		offset: { x: 120, y: 189 },
		sprites: {
			idle: { imageSrc: "img/woman/Idle.png", framesMax: 8 },
			run: { imageSrc: "img/woman/Run.png", framesMax: 8 },
			jump: { imageSrc: "img/woman/Jump.png", framesMax: 2 },
			fall: { imageSrc: "img/woman/Fall.png", framesMax: 2 },
			attack1: { imageSrc: "img/woman/Attack1.png", framesMax: 5 },
			takeHit: { imageSrc: "img/woman/Take hit.png", framesMax: 3 },
			death: { imageSrc: "img/woman/Death.png", framesMax: 8 },
		},
		attackBox: {
			offset: { x: -220, y: 100 },
			width: 170,
			height: 50
		}
	});
	
	// handle key presses
	const handleKeydown = function(e) {
		switch(e.key) {
			case "ArrowUp": players[side].velocity.y = -20; break;
			case "ArrowLeft": keys.ArrowLeft.pressed = true; lastkey = "ArrowLeft"; break;
			case "ArrowRight": keys.ArrowRight.pressed = true; lastkey = "ArrowRight"; break;
			case " ": players[side].attack(); break;
			case "t": if (!e.repeat) {
				players[side].cheat = !players[side].cheat;
			}; break; // only trigger once! (e.repeat is true if the key is continuously pressed)
			default: break;
		};
	};
	const handleKeyup = function(e) {
		switch(e.key) {
			case "ArrowLeft": keys.ArrowLeft.pressed = false; break;
			case "ArrowRight": keys.ArrowRight.pressed = false; break;
			default: break;
		}
	};
	
	// draw non-opaque bluish circle around a cheating player
	const drawCheatingCircle = function(side) {
		c.save();
		const x = players[side].position.x - players[side].offset.x;
		const y = players[side].position.y - players[side].offset.y;
		const w = players[side].image.width * players[side].scale / 2 / players[side].framesMax;
		const h = players[side].image.height * players[side].scale / 2;
		const r = Math.max(w, h);
		const rG = c.createRadialGradient(x + w, y + h, 0, x + w, y + h, r / 2);
		rG.addColorStop(0, "rgba(0, 104, 255, 0)");
		rG.addColorStop(0.75, "rgba(0, 104, 255, 0.1)");
		rG.addColorStop(0.97, "rgba(0, 104, 255, 0.35)");
		rG.addColorStop(1, "rgba(0, 104, 255, 0.7)");
		c.fillStyle = rG;
		c.beginPath();
		c.ellipse(x + w, y + h, r / 2, r / 2, 0, 0, Math.PI * 2);
		c.fill();
		c.restore();
	};
	
	// endGame: called when some player's HP reaches 0, or if time is up
	const endGame = function(side) {
		// stop the timer
		clearTimeout(timerId);
		// temporarily hide displayText
		document.getElementById("displayText").style.display = "none";
		
		// play gameover sounds
		sounds.background.pause();
		sounds.gameover.play();
		
		// frequently-referenced variable
		let finalHP = { me: players[side].health, other: players[otherside].health };
		
		// prepare update package (send to server later)
		let stats = {};
		stats.pld = 1;
		stats.w = finalHP.me > finalHP.other ? 1 : 0;
		stats.l = finalHP.me < finalHP.other ? 1 : 0;
		
		// we need some stats from the server here... (not yet done)
		
		// prepare gameover text
		let gameoverText = "<p>Game Over! You";
		gameoverText += stats.w > 0 ? " WON!" : (stats.l > 0 ? " lost..." : "... tied?");
		gameoverText += "</p><p>==== GAME STATS ====<br>Time taken: <span id=\"time_text\">";
		gameoverText += (maxTime - timer);
		gameoverText += "</span><br>Your health: <span id=\"my_HP_text\">";
		gameoverText += finalHP.me;
		gameoverText += "</span><sub>/100</sub><br>Opponent's health: <span id=\"other_HP_text\">";
		gameoverText += finalHP.other;
		gameoverText += "</span><sub>/100</sub></p>";
		
		gameoverText += "<p></p><button id=\"return_to_frontpage\">Return to frontpage</button>";
		// wrap everything inside a div
		gameoverDiv = "<div>" + gameoverText + "</div>";
		
		document.getElementById("displayText").innerHTML = gameoverDiv;
		
		// set styles
		document.getElementById("displayText").style.backgroundColor = "rgba(0, 0, 0, 0.2)";
		const allDisplayTexts = document.querySelectorAll("#displayText *");
		for (item of allDisplayTexts) {
			item.style.fontFamily = "Bahnschrift, 'Tw Cen MT', 'Comic Sans MS', sans-serif"; // testing new fonts, can change
			item.style.fontSize = "100%";
		}
		const allDisplaySubscripts = document.querySelectorAll("#displayText sub");
		for (item of allDisplaySubscripts) {
			item.style.fontSize = "60%";
		}
		document.getElementById("time_text").style.fontWeight = "bold";
		document.getElementById("time_text").style.color = "orange";
		document.getElementById("my_HP_text").style.color = finalHP.me > 20 ? (finalHP.me > 50 ? "green" : "yellow") : (finalHP.me > 0 ? "orange" : "red");
		document.getElementById("other_HP_text").style.color = finalHP.other > 20 ? (finalHP.other > 50 ? "green" : "yellow") : (finalHP.other > 0 ? "orange" : "red");
		
		// tell the server to update game stats now
		Socket.updateGameStats(JSON.stringify(stats));
		
		// show the text
		document.getElementById("displayText").style.display = "flex";
		document.getElementById("return_to_frontpage").addEventListener("click", returnToFrontpage);
	};
	
	// gameFrame: called every frame
	const gameFrame = function() {		
		// clear the screen, then draw the game objects and the background
		c.fillStyle = "black";
		c.fillRect(0, 0, canvas.width, canvas.height);
		background.update();
		c.fillStyle = "rgba(255, 255, 255, 0.15)";
		c.fillRect(0, 0, canvas.width, canvas.height);
		players[side].update();
		players[otherside].update();

		// prepare data to send to server
		let data = {};
		data.otherPlayerHit = false;
		
		// movement, but only for one player
		players[side].velocity.x = 0;
		if (keys.ArrowRight.pressed && lastkey === "ArrowRight") {
			players[side].velocity.x = 5;
			players[side].switchSprite("run");
			data.newSprite = "run";
		} else if (keys.ArrowLeft.pressed && lastkey === "ArrowLeft") {
			players[side].velocity.x = -5;
			players[side].switchSprite("run");
			data.newSprite = "run";
		} else {
			players[side].switchSprite("idle");
			data.newSprite = "idle";
		}
		if (players[side].velocity.y < 0) {
			players[side].switchSprite("jump");
			data.newSprite = "jump";
		} else if (players[side].velocity.y > 0) {
			players[side].switchSprite("fall");
			data.newSprite = "fall";
		}

		// collision detection, but only for one player
		if (rectangularCollision({ rectangle1: players[side], rectangle2: players[otherside] })
			&& players[side].isAttacking && players[side].framesCurrent === attackFrame[side]) {
			players[otherside].takeHit();
			data.otherPlayerHit = true;
			players[side].isAttacking = false;
			// this is (almost) the only part where the two player scripts have to be separated
			if (side == "left") {
				gsap.to("#player2Health", { width: players.right.health + "%" });
			} else {
				gsap.to("#player1Health", { width: players.left.health + "%" });
			}
		}
		if (players[side].isAttacking && players[side].framesCurrent === attackFrame[side]) {
			players[side].isAttacking = false;
		}

		// fill in other data
		data.velocity = players[side].velocity;
		data.attacking = players[side].isAttacking;
		data.cheating = players[side].cheat;
		
		// send data to server
		Socket.updateOtherPlayer(JSON.stringify(data));
		
		// update other player using data from server (and some attributes of this player too)
		if (returnData) {
			players[otherside].velocity.x = returnData.velocity.x;
			players[otherside].velocity.y = returnData.velocity.y;
			players[otherside].switchSprite(returnData.newSprite);
			if (!players[otherside].isAttacking && returnData.attacking) players[otherside].attack();
			players[otherside].isAttacking = returnData.attacking;
			players[otherside].cheat = returnData.cheating;
			if (returnData.otherPlayerHit) {
				players[side].takeHit();
				//play hit sound effect
				sounds.slash.currentTime = 0;
				sounds.slash.play();
				if (side == "left") {
					gsap.to("#player1Health", { width: players.left.health + "%" });
				} else {
					gsap.to("#player2Health", { width: players.right.health + "%" });
				}
			}
		}

		// draw the cheating outline
		if (players[side].cheat) drawCheatingCircle(side);
		if (players[otherside].cheat) drawCheatingCircle(otherside);
		
		// end game detection
		if (players.left.health <= 0 || players.right.health <= 0 || timer == 0) {
			// no more user inputs!
			removeEventListener("keydown", handleKeydown);
			removeEventListener("keyup", handleKeyup);
			// determineWinner({ player1: players.left, player2: players.right, timerId }); (this unfortunately messes with endGame)
			if (!endGameTimeout) endGame(side);
			// let any death animation play out
			endGameTimeout = setTimeout(()=>{ endGameTimeout = null; returnData = null; cancelAnimationFrame(gameAnimFrameId); }, 2000);
		}
		
		// update: animations only stop a while (2s?) after gameover
		gameAnimFrameId = requestAnimationFrame(gameFrame);
	};
	
	// event listener for keys
	addEventListener("keydown", handleKeydown);
	addEventListener("keyup", handleKeyup);

	// start the timer
	decreaseTimer();
	
	gameAnimFrameId = requestAnimationFrame(gameFrame);
};
