// New file.

// functions used in the main page
// register, signin and signout similar to those in lab5/6

const formInitialise = function() {
	document.getElementById("register").addEventListener("submit", (e)=>{
		e.preventDefault();
		const username = document.getElementById("username_reg").value.trim();
		const name = document.getElementById("name_reg").value.trim();
		const pwd = document.getElementById("pwd_reg").value.trim();
		const pwd_cfm = document.getElementById("pwd_cfm").value.trim();
		if (pwd != pwd_cfm) {
			document.getElementById("resp_reg").innerHTML = "Passwords do not match!";
		} else {
			document.getElementById("resp_reg").innerHTML = "";
			Registration.register(username, name, pwd, ()=>{
				document.getElementById("register").reset();
				document.getElementById("resp_reg").innerHTML = "Registration successful! You can sign in now.";
			}, (error)=>{
				document.getElementById("resp_reg").innerHTML = error;
			});
		};
	});
	document.getElementById("signin").addEventListener("submit", (e)=>{
		e.preventDefault();
		const username = document.getElementById("username_signin").value.trim();
		const pwd = document.getElementById("pwd_signin").value.trim();
		Authentication.signin(username, pwd, loginFunction, (error)=>{
			document.getElementById("resp_signin").innerHTML = error;
		});
	});
};

const restoreJoinButton = function() {
	document.getElementById("pairup").style.display = "inline";
	if (restoreJoinButtonTimeout) {
		document.getElementById("waitingtext").innerHTML = "";
		clearTimeout(restoreJoinButtonTimeout);
		restoreJoinButtonTimeout = null;
	}
};

const loginFunction = function() {
	// clear the forms
	document.getElementById("register").reset();
	document.getElementById("resp_reg").innerHTML = "";
	document.getElementById("signin").reset();
	document.getElementById("resp_signin").innerHTML = "";
	// show pairup and signout divs, hide register and signin divs
	document.getElementById("register").style.display = "none";
	document.getElementById("signin").style.display = "none";
	document.getElementById("userinfo").style.display = "flex";
	document.getElementById("joingame").style.display = "flex";
	document.getElementById("signout").style.display = "flex";
	document.getElementById("waitingtext").innerHTML = "";
	// just in case, restore the join game button
	restoreJoinButton();
	Socket.connect();
};

const buttonInitialise = function() {
	document.getElementById("pairup").addEventListener("click", (e)=>{
		Socket.requestOpponent();
	});
	document.getElementById("signoutbutton").addEventListener("click", (e)=>{
		Authentication.signout(()=>{
			Socket.disconnect();
			// undo the changes in signin
			document.getElementById("register").style.display = "flex";
			document.getElementById("signin").style.display = "flex";
			document.getElementById("userinfo").style.display = "none";
			document.getElementById("joingame").style.display = "none";
			document.getElementById("signout").style.display = "none";
		});
	});
};

const initialise = function() {
	formInitialise();
	buttonInitialise();
	Authentication.validate(loginFunction, (error)=>{});
}