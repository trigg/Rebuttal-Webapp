'use strict';

/**
 * List of parts that need to be globally passed about
 */
// Websocket
var ws = null;
// State of client
var roomlist = [];
var userlist = [];
var messagelist = [];
var contextmenus = [];
var currentView = '';
var currentVoiceRoom = '';
var iam = null;
var localWebcamStream = null;
var localFilteredWebcamStream = null;
var localLiveStream = null;
var remoteWebcamStream = {};
var remoteLiveStream = {};
var peerConnection = {};
var isWatching = {};
var amWatching = {};
var el = {};
var isWebcam = false;
var isScreenShare = false;
var isMute = false;
var isSettings = false;
var isServer = false;
var lastChatYPos = 0;
var cacheDragAndDropFile = null;
var cacheUserTagged = [];
var sharedVideo = null;
var permissions = [];
var groups = [];
var signUpCode = null;
var autocompleteing = null;
var autocompletestart = 0;
var autocompleteselection = 0;
var electronMode = false;
var customUrl = null;
var customUsername = null;
var customPassword = null;
var overlayEnable = true;
var noWebcamFound = false;
var sfxVolume = 0.5;
var detectTalking = true;
var detectTalkingLevel = 0.05;
var fullscreenUserID = null;
var fullscreenParent = null;
var fullscreenElement = null;
var blurUser = true;
var blurValue = 5;
var blurEdgeValue = 2;
// Browser storage

var theme = null;
var soundtheme = null;
var font = null;
var themelist = [
    {
        "id": 'accounting',
        "name": "Accounting department",
        "description": "A straightforward theme for those with no joy left in their lives"
    },
    {
        "id": 'aspiringwebdev',
        "name": "Aspiring WebDev",
        "description": "A theme as dark as your prospects of releasing a hit new Web App and become an overnight billionaire"
    },
    {
        "id": 'bubblegum',
        "name": "Bubblegum (default)",
        "description": "A light hearted theme for those with a weak disposition"
    }
];
var soundlist = [];

// Functions to allow to be used in console
var markupParser;
var changeTheme;
var changeSoundTheme;
var changeFont;
var toggleSettings;
var toggleServer;
var startLocalDevices;
var updateThemesInSettings;
var updateInputsInSettings;
var updateOutputsInSettings;
var getUserByID;
var getUsersByPartialName;
var loadMoreText;
var playToGroup;
var send;
var connect;
var populateRoom;
var playSound;
var showStreamingOptions;
var replaceAllPeerMedia;


getUserByID = (id) => {
    var ret = null;
    userlist.forEach(user => {
        if (user.id == id) {
            ret = user;
        }
    })
    return ret;
}

getUsersByPartialName = (nameFrag) => {
    var ret = [];
    userlist.forEach(user => {
        if (user.name.toLowerCase().indexOf(nameFrag.toLowerCase()) == 0) {
            console.log(nameFrag + " matches " + user.name);
            ret.push(user);
        }
    });
    return ret;
}

electronMode = /electron/i.test(navigator.userAgent)
console.log("Electron: " + electronMode);


if (electronMode) {
    window.ipc.recv('screenshare', (a, e) => { console.log("RECV RECVD"); showStreamingOptions(a) });
}