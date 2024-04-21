const checkboxes =    ["steer_invert",  "drive_invert"];
const values =        ["steer_speed",   "drive_speed"];
const radiobuttons =  ["steer_channel", "drive_channel"];
const COOKIE_EXT_DAYS = 364;
const COOKIE_PREFIX = "circuit_cube_";

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function terminal_write(str) {
    var textarea = document.getElementById('terminal');
    textarea.value += str;
    textarea.scrollTop = textarea.scrollHeight;
}

function terminal_writeln(str) {
    terminal_write(str + '\n');
}

function inc(id, by=5){
    let input = document.getElementById(id);
    input.value = Math.min(parseInt(input.value) + by, 255);
    input.onchange();
}

function dec(id, by=5){
    let input = document.getElementById(id);
    input.value = Math.max(0, parseInt(input.value) - by)
    input.onchange();
}

function toggleTerminal(){
    let terminal = document.getElementById("terminal");
    if (terminal.style.display === "block") {
        terminal.style.display = "none";
    } else {
        terminal.style.display = "block";
    }
}

function toggleSettings(){
    let settings = document.getElementById("settings");
    if (settings.style.display === "block") {
        settings.style.display = "none";
    } else {
        settings.style.display = "block";
    }
}

function alreadyTouched(touch){
    if (touch) {
        touchScreen = true;
    } else if (touchScreen){
        return true;
    }
    return false;
}

function setCookie(cname, cvalue) {
    const d = new Date();
    d.setTime(d.getTime() + (COOKIE_EXT_DAYS * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function onSetup(){
    checkboxes.forEach(id => {
        setCookie(COOKIE_PREFIX + id, document.getElementById(id).checked);
    });
    values.forEach(id => {
        setCookie(COOKIE_PREFIX + id, document.getElementById(id).value);
    });
    radiobuttons.forEach(name => {
        setCookie(COOKIE_PREFIX + name, document.querySelector(`input[name="${name}"]:checked`).value);
    });
}

function onLoad(){
    if (!isChrome()) {
        window.alert("Only Chrome browser is supported.")
    }
    checkboxes.forEach(id => {
        let value = getCookie(COOKIE_PREFIX + id);
        const input = document.getElementById(id);
        if (value != "") {
            input.checked = value === "true";
        }
        input.onchange = onSetup;
    });
    values.forEach(id => {
        let value = getCookie(COOKIE_PREFIX + id);
        const input = document.getElementById(id);
        if (value != "") {
            input.value = Number(value)
        }
        input.onchange = onSetup;
    });
    radiobuttons.forEach(name => {
        let value = getCookie(COOKIE_PREFIX + name);
        if (value != "") {
            document.querySelector(`input[name="${name}"][value="${value}"]`).click();
        }
        document.getElementsByName(name).forEach(input => {
            input.onchange = onSetup;
        });
    });
}


function isChrome(){
	var isChromium = window.chrome;
	var winNav = window.navigator;
	var vendorName = winNav.vendor;
	var isOpera = typeof window.opr !== "undefined";
	var isIEedge = winNav.userAgent.indexOf("Edg") > -1;
	var isIOSChrome = winNav.userAgent.match("CriOS");

	if (isIOSChrome) {
		return true;
	} else if(
	isChromium !== null &&
	typeof isChromium !== "undefined" &&
	vendorName === "Google Inc." &&
	isOpera === false &&
	isIEedge === false
	) {
		return true;
	} else { 
		return false;
	}
}