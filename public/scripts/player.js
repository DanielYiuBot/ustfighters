// Structure referenced from player.js in Lab 4.
// Mostly replaced by the fighter class in classes.js.
/*
const Player = function(ctx, x, y, gameArea, side, initialHP) {
	// new variables / functions!
	
	// movement related
	const gravity = 2; // downwards
	let xvel = 0, yvel = 0; // xvel: right is +ve, yvel: down is +ve
	let xacc = 0, yacc = 0;
	let jumping = false;
	const maxvel = 40; // maximum velocity in one direction
	const getVel = function() {
		return {xvel, yvel};
	}
	const changeVel = function(dx, dy) {
		xvel = xvel + dx;
		yvel = yvel + dy;
		if (Math.abs(xvel) > maxvel) xvel = maxvel * Math.abs(xvel) / xvel;
		if (Math.abs(yvel) > maxvel) yvel = maxvel * Math.abs(yvel) / yvel;
	}
	const setAcc = function (ax, ay) {
		xacc = ax; yacc = ay;
	}
	const jump = function() {
		if (!jumping) {
			changeVel(0, -40);
			jumping = true;
		}
	}
	
	// HP/DMG related
	let HP = initialHP;
	let damageMult = 1; // for cheat mode
	let invincible = false; // for cheat mode
	const getHP = function() {
		return HP;
	}
	const changeHP = function(change) {
		HP = Math.max(0, HP - (invincible ? 0 : change)); // don't let it go below 0!
	}
	const toggleCheating = function() {
		damageMult = invincible ? 1 : 2;
		invincible = !invincible;
	}
	
	let currentSequence = "";
	
    const sequences = { // ignore this if there's already a spritesheet available
		idleRight: { x: 0, y: 0, width: 30, height: 40, count: 2, timing: 1500, loop: false },
		idleLeft: { x: 60, y: 0, width: 30, height: 40, count: 2, timing: 1500, loop: false },
		runningRight: { x: 0, y: 40, width: 30, height: 40, count: 6, timing: 100, loop: true },
		runningLeft: { x: 180, y: 40, width: 30, height: 40, count: 6, timing: 100, loop: true },
		jumpingRight: { x: 180, y: 0, width: 30, height: 40, count: 1, timing: 100, loop: false },
		jumpingLeft: { x: 210, y: 0, width: 30, height: 40, count: 1, timing: 100, loop: false },
		fallingRight: { x: 240, y: 0, width: 30, height: 40, count: 1, timing: 100, loop: false },
		fallingLeft: { x: 270, y: 0, width: 30, height: 40, count: 1, timing: 100, loop: false },
	}
    const sprite = Sprite(ctx, x, y);
	if (side == "left") {
		sprite.setSequence(sequences.idleRight);
		currentSequence = "idleRight";
	} else {
		sprite.setSequence(sequences.idleLeft);
		currentSequence = "idleLeft";
	}
	sprite.setScale(6).useSheet("images/spritesheet.png"); // also ignore this if there's a spritesheet available and used
	
	const changeSequence = function() {
		// set the new sequence (but check if the intended new sequence is already being used)
		if (Math.abs(xvel) < 1 && Math.abs(yvel) < 1) {
			if (side == "left") {
				if (currentSequence == "idleRight") return;
				sprite.setSequence(sequences.idleRight);
				currentSequence = "idleRight";
			} else {
				if (currentSequence == "idleLeft") return;
				sprite.setSequence(sequences.idleLeft);
				currentSequence = "idleLeft";
			}
		} else if (Math.abs(yvel) < 1) {
			if (xvel > 0) {
				if (currentSequence == "runningRight") return;
				sprite.setSequence(sequences.runningRight);
				currentSequence = "runningRight";
			} else if (xvel < 0) {
				if (currentSequence == "runningLeft") return;
				sprite.setSequence(sequences.runningLeft);
				currentSequence = "runningLeft";
			}
		} else if (yvel < 0) {
			if (xvel > 0) {
				if (currentSequence == "jumpingRight") return;
				sprite.setSequence(sequences.jumpingRight);
				currentSequence = "jumpingRight";
			} else if (xvel < 0) {
				if (currentSequence == "jumpingLeft") return;
				sprite.setSequence(sequences.jumpingLeft);
				currentSequence = "jumpingLeft";
			}
		} else {
			if (xvel > 0) {
				if (currentSequence == "fallingRight") return;
				sprite.setSequence(sequences.fallingRight);
				currentSequence = "fallingRight";
			} else if (xvel < 0) {
				if (currentSequence == "fallingLeft") return;
				sprite.setSequence(sequences.fallingLeft);
				currentSequence = "fallingLeft";
			}
		}
	}
	
    const update = function(time) {
		// this one updates the player controlled by the client
		let {x, y} = sprite.getXY();
		
		// change velocities
		changeVel(xacc, yacc + gravity);
		xvel = Math.max(Math.min(xvel + 1, 0), xvel - 1);
		
		// change positions and test if player is still in bounds (separately for x and y)
		x = x + xvel;
		if (!gameArea.isPointInBox(x, y)) {
			// hit the left/right boundary! reset x-pos, set x-vel to 0.
			x = x - xvel;
			xvel = 0;
		}
		y = y + yvel;
		if (!gameArea.isPointInBox(x, y)) {
			// hit the top/bottom boundary! reset y-pos, set y-vel to 0. Also reset "jumping" variable if hit the ground.
			if (yvel > 0) jumping = false;
			y = y - yvel;
			yvel = 0;
		}
		
		// set the new position
		sprite.setXY(x, y);
		
		changeSequence();		
        sprite.update(time);
    };
	
	const updateFromServer = function(time, returnData) {
		// this one deals with the other player
		
		// no update from server yet? do nothing
		if (!returnData) return;
		
		// use the given values
		sprite.setXY(returnData.pos.x, returnData.pos.y);
		xvel = returnData.vel.xvel;
		yvel = returnData.vel.yvel;
		HP = returnData.HP;
		
		changeSequence();
		sprite.update(time);
	};

    return {
		// getPos and getVel only intended for sending player info to the server to be updated on the other screen
		getPos: sprite.getXY,
		getVel: getVel,
		jump: jump,
		setAcc: setAcc,
		getHP: getHP,
		changeHP: changeHP,
		toggleCheating: toggleCheating,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update,
		updateFromServer: updateFromServer,
    };
};
*/
