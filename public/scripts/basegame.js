// New file.

// other global variables
let gameAnimFrameId = null; // track requestAnimationFrame's id, in case we need to cancel the callback
let restoreJoinButtonTimeout = null;
let returnData = null; // this is global too, in case console throws error accessing this variable from socket

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

// stopGame: called when opponent disconnects, this should stop the game preemptively and restore the main page
function stopGame() {
	// stop game animations (if game already started)
	if (gameAnimFrameId) {
		cancelAnimationFrame(gameAnimFrameId);
		gameAnimFrameId = null;
	};
	// hide the game area
	document.getElementById("game_area").style.display = "none";
	// prepare the message on the main page
	document.getElementById("waitingtext").innerHTML = "Unfortunately, your opponent disconnected! This game will not count towards your records.";
	// show the main page
	document.getElementById("main_page").style.display = "block";
	// allow the player to join another game after a delay (2 seconds)
	restoreJoinButtonTimeout = setTimeout(restoreJoinButton, 2000);
};

// initialiseGame: runs once, when the game starts
const initialiseGame = function(side) {
	// hide all things related to the main page
	document.getElementById("main_page").style.display = "none";
	// show the game area
	document.getElementById("game_area").style.display = "inline-block";
	
	// variables
	const gravity = 0.7;
	timer = 90; // time remaining, in seconds
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
	const players = {
		left: new Fighter({
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
		}),
		right: new Fighter({
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
		})
	};
	
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
			case "ArrowLeft": keys.ArrowLeft.pressed = true; break;
			case "ArrowRight": keys.ArrowRight.pressed = false; break;
			default: break;
		}
	};

	// endGame: called when some player's HP reaches 0, or if time is up
	const endGame = function() {
		// not yet implemented
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
		
		// send data to server
		Socket.updateOtherPlayer(JSON.stringify(data));
		
		// update other player using data from server (and some attributes of this player too)
		if (returnData) {
			players[otherside].velocity.x = data.velocity.x;
			players[otherside].velocity.y = data.velocity.y;
			players[otherside].switchSprite(data.newSprite);
			players[otherside].isAttacking = data.attacking;
			if (data.otherPlayerHit) {
				players[side].takeHit();
				if (side == "left") {
					gsap.to("#player1Health", { width: players.left.health + "%" });
				} else {
					gsap.to("#player2Health", { width: players.right.health + "%" });
				}
			}
		}
		
		// end game detection
		if (players.left.health <= 0 || players.right.health <= 0) {
			gameAnimFrameId = null;
			removeEventListener("keydown", handleKeydown);
			removeEventListener("keyup", handleKeyup);
			returnData = null;
			determineWinner({ players.left, players.right, timerId });
			endGame();
		} else {
			gameAnimFrameId = requestAnimationFrame(gameFrame);
		};
	};
	
	// event listener for keys
	addEventListener("keydown", handleKeydown);
	addEventListener("keyup", handleKeyup);

	// start the timer
	decreaseTimer();
	
	gameAnimFrameId = requestAnimationFrame(gameFrame);
};
