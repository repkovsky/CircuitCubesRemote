const checkboxes =    ["steer_invert",  "drive_invert"];
const values =        ["steer_speed",   "drive_speed"];
const radiobuttons =  ["steer_channel", "drive_channel"];
const COOKIE_EXT_DAYS = 364;
const COOKIE_PREFIX = "circuit_cube_";

function enableSleepLock(){
    // playing video avoids disabling screen and limiting activity of browser, which spoils Bluetooth communication
    let video = document.getElementById('sleep_lock');
    video.play();
}

function disableSleepLock(){
    let video = document.getElementById('sleep_lock');
    video.pause();
}

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

function openFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
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

function checkBluetooth() {
    if (!navigator.bluetooth) {
        window.alert("WebBluetooth is not available on your browser! Connection with Circuit Cubes or Lego remote is not possible. Use Chrome for Android or Bluefy for iOS")
        return false
    } else {
        return true
    }
}

function onLoad(){
    checkBluetooth();
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