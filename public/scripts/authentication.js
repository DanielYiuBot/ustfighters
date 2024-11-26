// This is a copy of authentication.js in Labs 5/6. All comments removed.

const Authentication = (function() {
    let user = null;
    const getUser = function() {
        return user;
    }
    const signin = function(username, password, onSuccess, onError) {
		let signindata = { username, password };
		fetch("/signin", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(signindata)
		}).then((resp) => resp.json()).then((json) => {
			if (json.status == "success") {
				user = json.user;
				onSuccess();
			} else if (onError) onError(json.error);
		});
	};
    const validate = function(onSuccess, onError) {
		fetch("/validate").then((resp) => resp.json()).then((json) => {
			if (json.status == "success") {
				user = json.user;
				onSuccess();
			} else if (onError) onError(json.error);
		});
    };
    const signout = function(onSuccess, onError) {
		fetch("/signout").then((resp) => resp.json()).then((json) => {
			user = null;
			onSuccess();
		});
    };
    return { getUser, signin, validate, signout };
})();