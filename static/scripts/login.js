window.addEventListener("load", pageLoaded, false);

function checkInput(event) {
    var currentPwd = this.value;
    var loginMsgDiv = document.getElementById("loginMsg");

    if (currentPwd.match(/[а-яА-я]/)) {
        loginMsgDiv.style.display = "block";
    } else {
        loginMsgDiv.style.display = "none";
    }

    var code = event.charCode || event.keyCode;
    if (code < 32 ||
        event.charCode == 0 ||
        event.ctrlKey || event.altKey)
        return; 
    var text = String.fromCharCode(code);
    var cyr = text.match(/[а-яА-я]/);

    if (cyr) {
        var loginMsgDiv = document.getElementById("loginMsg");
        loginMsgDiv.style.display = "block";
    }
}

function pageLoaded() {
    var passwordInput = document.getElementById("password");
    passwordInput.addEventListener("keypress", checkInput, false);
}
