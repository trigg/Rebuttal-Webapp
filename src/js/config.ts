'use strict';

const getConfig = (name, defaultvalue) => {
    var value = window.localStorage.getItem(name);
    if (value) {
        return value;
    } else {
        return defaultvalue;
    }
}
const setConfig = (name, value) => {
    if (value) {
        window.localStorage.setItem(name, value);
    } else {
        window.localStorage.removeItem(name);
    }
}

theme = getConfig('theme', 'bubblegum');
sfxVolume = getConfig('sfxvolume', 0.5);
font = getConfig('font', null);
detectTalkingLevel = getConfig('voicetriggerlevel', 0.05);
blurUser = getConfig('blurwebcam', false);