// Slightly modified from registration.js in Labs 5/6. Avatar not needed. All comments removed.

const Registration = (function() {
    const register = function(username, name, password, onSuccess, onError) {
		let userdata = { username, name, password };
		fetch("/register", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(userdata)
		}).then((resp) => resp.json()).then((json) => {
			if (json.status == "success") onSuccess();
			else if (onError) onError(json.error);
		});
    };
    return { register };
})();