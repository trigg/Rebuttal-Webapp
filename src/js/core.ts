'use strict';

interface ElementCollection {
    [key:string]: HTMLElement
}

interface User {
    [key:string]: any
}

interface Room {
    [key:string]: any
}

/**
 * List of parts that need to be globally passed about
 */
// Websocket
var ws : WebSocket|null = null;
// State of client
var roomlist : Room[] = [];
var userlist : User[] = [];
var messagelist : any[] = [];
var contextmenus : any[] = [];
var currentView = '';
var currentVoiceRoom : string | null = '';
var iam : string|null = null;
var localWebcamStream : any = null;
var localFilteredWebcamStream : any = null;
var localLiveStream: any = null;
var remoteWebcamStream :any = {};
var remoteLiveStream :any = {};
var peerConnection :any = {};
var isWatching :any = {};
var amWatching :any = {};
var el : ElementCollection = {};
var isWebcam = false;
var isScreenShare = false;
var isMute = false;
var isSettings = false;
var isServer = false;
var lastChatYPos = 0;
var cacheDragAndDropFile :any = null;
var cacheUserTagged :any[] = [];
var sharedVideo :any = null;
var permissions :any[] = [];
var groups : any[] = [];
var signUpCode :any = null;
var autocompleteing :any = null;
var autocompletestart = 0;
var autocompleteselection = 0;
var electronMode = false;
var customUrl :any = null;
var customUsername :any = null;
var customPassword : any= null;
var overlayEnable = true;
var noWebcamFound = false;
var sfxVolume = 0.5;
var detectTalking = true;
var detectTalkingLevel = 0.05;
var fullscreenUserID :any = null;
var fullscreenParent :any = null;
var fullscreenElement :any = null;
var blurUser = true;
var blurValue = 5;
var blurEdgeValue = 2;
// Browser storage

var theme : any = null;
var soundtheme : any = null;
var font :any = null;
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
var soundlist :any[] = [];

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
    for(const user of userlist){
        if (user.id == id) {
            return user;
        }
    }
    return null;
}

getUsersByPartialName = (nameFrag) => {
    var ret :User[] = [];
    for(const user of userlist){
        if (user.name.toLowerCase().indexOf(nameFrag.toLowerCase()) == 0) {
            console.log(nameFrag + " matches " + user.name);
            ret.push(user);
        }
    };
    return ret;
}

electronMode = /electron/i.test(navigator.userAgent)
console.log("Electron: " + electronMode);


if (electronMode) {
    window.ipc.recv('screenshare', (a, e) => { console.log("RECV RECVD"); showStreamingOptions(a) });
}