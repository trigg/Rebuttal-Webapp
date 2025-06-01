'use strict';
import bodyPix from '@tensorflow-models/body-pix';
import showdown from 'showdown';

onstart.push(() => {

    // Helpful functions

    const showLogin = () => {
        el.appWindow.style.display = 'none';
        el.loginWindow.style.display = '';

        el.signup.style.display = 'none';
    }

    const showLoginWithSignUp = () => {
        el.appWindow.style.display = 'none';
        el.loginWindow.style.display = '';

        el.login.style.display = 'none';
    }

    const showApp = () => {
        el.appWindow.style.display = '';
        el.loginWindow.style.display = 'none';
    }

    const showInvite = () => {
        el.popupinvite.style.display = 'flex';
    }

    const hideInvite = () => {
        el.popupinvite.style.display = 'none';
    }

    const setLoginMessage = (message) => {
        el.loginReply.innerText = message;
    }

    const hideCustom = () => {
        el.popupcustomouter.style.display = 'none';
    }

    const popupChangeMessage = (message) => {
        if ('idx' in message && 'roomid' in message) {
            var form = document.createElement('form');
            var input = document.createElement('textarea');
            var submit = document.createElement('input')
            input.value = message.text;
            submit.type = 'submit';
            submit.value = 'Change message';
            form.onsubmit = (e) => {
                e.preventDefault();
                message.text = input.value;
                send({
                    type: 'updatemessage',
                    roomid: message.roomid,
                    messageid: message.idx,
                    message: message,
                });
                hideCustom();
                return false;
            }
            form.appendChild(input);
            form.appendChild(submit);
            showCustom(form);
        } else {
            console.log("Details missing - can't edit");
        }
    }
    const popupChangeUserGroup = (user) => {
        var form = document.createElement('form');
        var divName = div({ className: 'previousName', id: 'previousName' });
        divName.innerText = user.name;
        var input = document.createElement('select');
        input.id = 'newgroup';
        var override = hasPerm("inviteUserAny");
        Object.keys(groups).forEach(group => {
            var pL = groups[group];
            var allowInvitesFor = pL.indexOf('noInviteFor') === -1;
            if (override || allowInvitesFor) {
                var opt = document.createElement('option');
                opt.value = group;
                opt.innerText = group;
                input.appendChild(opt);
            }
        })
        var submit = document.createElement('input')
        submit.type = 'submit';
        submit.value = 'Change user group';
        form.onsubmit = (e) => {
            e.preventDefault();
            send({
                type: 'setusergroup',
                userid: user.id,
                groupName: input.value
            });
            hideCustom();
            return false;
        }
        form.appendChild(divName);
        form.appendChild(input);
        form.appendChild(submit);
        showCustom(form);
    }

    const popupChangeUserName = (user) => {
        var form = document.createElement('form');
        var divName = div({ className: 'previousName', id: 'previousName' });
        divName.innerText = user.name;
        var input = document.createElement('input');
        input.id = 'newname';
        var submit = document.createElement('input')
        submit.type = 'submit';
        submit.value = 'Change user name';
        form.onsubmit = (e) => {
            e.preventDefault();
            if (input.value.match(/^[a-zA-Z0-9-_ ]+$/)) {
                send({
                    type: 'updateuser',
                    userid: user.id,
                    userName: input.value
                });
                hideCustom();
            } else {
                divName.innerText = 'Username must only have a-z 0-9 - _ and space';
            }
            return false;
        }
        form.appendChild(divName);
        form.appendChild(input);
        form.appendChild(submit);
        showCustom(form);
    }

    const popupChangeRoomName = (room) => {
        var form = document.createElement('form');
        var divName = div({ className: 'previousName', id: 'previousName' });
        divName.innerText = room.name;
        var input = document.createElement('input');
        input.id = 'newname';
        var submit = document.createElement('input')
        submit.type = 'submit';
        submit.value = 'Change room name';
        form.onsubmit = (e) => {
            e.preventDefault();
            send({
                type: 'updateroom',
                roomid: room.id,
                roomName: input.value
            });
            hideCustom();
            return false;
        }
        form.appendChild(divName);
        form.appendChild(input);
        form.appendChild(submit);
        showCustom(form);
    }

    const showCustom = (ele) => {
        el.popupcustominner.innerText = '';
        el.popupcustominner.appendChild(ele);
        el.popupcustomouter.style.display = 'flex';
    }

    const div = ({ className, id }) : HTMLDivElement => {
        var d = document.createElement("div");
        if (className) { d.className = className; }
        if (id) { d.id = id; }
        return d;
    }

    const img = ({ className, id, src, alt, title }) : HTMLImageElement => {
        var i = document.createElement('img');
        if (className) { i.className = className; }
        if (alt) { i.setAttribute('alt', alt); }
        if (title) { i.setAttribute('title', title); }
        if (id) { i.id = id; }
        if (src) {
            i.src = 'img/' + theme + '/' + src;
            i.dataset.src = src;
        }
        return i;
    }

    const closeContextMenu = () => {
        el.contextmenu.style.display = 'none';
    }

    const openConfirmContext = (question, answer, callback) => {
        var list = [
            { text: question },
            { text: answer, callback }
        ];
        showContextMenu(list, 0, 0);// TODO Placement for this needs fixing
    }

    const isInVoiceRoom = () => {
        var room = getRoom(currentVoiceRoom);
        if (room && room.type === 'voice') {
            return true;
        }
        return false;
    }

    const setUserList = (userList) => {
        var elementParent = div({ className: 'userListParent', id:null });
        if (hasPerm('inviteUser')) {
            var inviteDiv = div({ className: 'invitebutton', id:null });
            inviteDiv.onclick = () => {
                showInvite();
            };
            inviteDiv.innerText = 'Invite someone';

            elementParent.appendChild(inviteDiv);
        }

        userList.forEach((user) => {
            if (user.hidden) {
                return;
            }
            var elementUser = div({ className: 'user', id:null });
            var textUser = div({ className: 'usertext', id:null });
            var imageUser = document.createElement('img');
            imageUser.className = "userimg";
            imageUser.alt = 'avatar for ' + user.name;
            imageUser.src = user.avatar;
            textUser.innerText = user.name;
            if (user.status) {
                elementUser.classList.add('useronline');
            }
            textUser.innerText = user.name;
            elementUser.appendChild(imageUser);
            elementUser.appendChild(textUser);

            elementUser.oncontextmenu = (e) => {
                e.preventDefault();
                var list = populateContextMenu('user', user.id);

                // Add client-only options
                list.push({
                    text: 'volume', slider: getConfig('volume-' + user.id, 1.0), callback: (e) => {
                        setConfig('volume-' + user.id, e.target.value);
                        var video = document.getElementById('video-' + user.id);
                        if (video) {
                            video.setAttribute('volume', e.target.value);
                        }
                    }
                });
                if (hasPerm('renameUser') || user.id === iam) {
                    list.push({
                        text: 'Change user name',
                        callback: () => {
                            popupChangeUserName(user);
                        },
                        class: 'contextrenameuser'
                    });
                }
                if (hasPerm('setUserGroup')) {
                    list.push({
                        text: 'Change user group',
                        callback: () => {
                            popupChangeUserGroup(user);
                        },
                        class: 'contextsetusergroup'
                    });
                }
                if (hasPerm('removeUser') && user.id !== iam) {
                    list.push({
                        text: 'Delete User',
                        callback: () => {
                            openConfirmContext('Confirm delete ' + user.name, 'DELETE USER', () => {
                                send({
                                    type: 'removeuser',
                                    userid: user.id
                                });
                            })
                        },
                        class: 'contextremoveuser'
                    });
                }
                showContextMenu(list, mouseX(e), mouseY(e))

            }

            elementParent.appendChild(elementUser);
        });
        el.appUserList.innerText = '';
        el.appUserList.appendChild(elementParent);
    }

    const mouseX = (evt) => {
        if (evt.pageX) {
            return evt.pageX;
        } else if (evt.clientX) {
            return evt.clientX + (document.documentElement.scrollLeft ?
                document.documentElement.scrollLeft :
                document.body.scrollLeft);
        } else {
            return null;
        }
    }

    const mouseY = (evt) => {
        if (evt.pageY) {
            return evt.pageY;
        } else if (evt.clientY) {
            return evt.clientY + (document.documentElement.scrollTop ?
                document.documentElement.scrollTop :
                document.body.scrollTop);
        } else {
            return null;
        }
    }

    const populateContextMenu = (type, id) => {
        var list :any[] = [];
        if (type in contextmenus) {
            contextmenus[type].forEach(option => {
                if ('permissionRequired' in option) {
                    if (!hasPerm(option.permissionRequired)) {
                        return;
                    }
                }

                list.push(
                    {
                        text: option.label,
                        class: option.class,
                        callback: function () {
                            send({
                                type: 'contextoption',
                                context: type,
                                option: option.option,
                                value: id
                            })
                        }
                    }
                );
            });
        }

        return list;
    }

    const showContextMenu = (list:any[], x:number, y:number) => {
        el.contextmenu.style.display = 'none';
        if (x < (window.innerWidth / 2)) {
            x = x + 2;
            el.contextmenu.style.left = x + "px"
            el.contextmenu.style.right = '';
        } else {
            x = x - 2;
            el.contextmenu.style.right = (window.innerWidth - x) + "px"
            el.contextmenu.style.left = '';
        }
        if (y < (window.innerHeight / 2)) {
            y = y + 2;
            el.contextmenu.style.top = y + "px"
            el.contextmenu.style.bottom = '';
        } else {
            y = y - 2;
            el.contextmenu.style.bottom = (window.innerHeight - y) + "px"
            el.contextmenu.style.top = '';
        }
        el.contextmenu.innerHTML = '';

        list.forEach(item => {
            var itemdiv = div({ className: 'contextmenuitem', id:null });
            if ('slider' in item) {
                var anotherDiv = <HTMLLabelElement> document.createElement('label');
                anotherDiv.htmlFor = 'volumeslider'
                anotherDiv.innerText = item.text;
                var slider = document.createElement('input');
                slider.id = 'volumeslider';
                slider.type = 'range';
                slider.min = '0.0';
                slider.max = '1.0';
                slider.step = '0.01';
                slider.value = item.slider;
                slider.oninput = item.callback;
                itemdiv.appendChild(anotherDiv);
                itemdiv.appendChild(slider);
            } else {
                itemdiv.innerText = item.text;
                if ('callback' in item) {
                    itemdiv.onclick = () => { closeContextMenu(); item.callback(); };
                }
                if ('class' in item) {
                    itemdiv.classList.add(item.class);
                }
            }
            el.contextmenu.appendChild(itemdiv);
        })
        el.contextmenu.style.display = "block";
        el.contextmenuouter.style.display = "block";
        el.contextmenu.onmouseleave = (e) => {
            el.contextmenu.onmouseout = null;
            el.contextmenu.style.display = 'none';
            el.contextmenuouter.style.display = 'none';
        }
    }

    const setRoomList = (roomList) => {
        if (electronMode) {
            var room = getRoom(currentVoiceRoom);
            if (room) {
                window.ipc.send('userlist', room.userlist);
            }
        }
        var elementParent = div({ className: 'roomListParent', id:null });
        roomList.forEach((room) => {
            var elementRoom = div({ className: 'room', id:null });
            elementRoom.oncontextmenu = (e) => {
                e.preventDefault();
                var list :any[] = [];
                if (room.type == 'voice') {
                    list = populateContextMenu('voiceroom', room.id);
                    if (currentVoiceRoom == room.id) {
                        // User is in this room
                        list.push({ text: "Leave chat", callback: () => { switchRoom(null) } });
                    } else {
                        list.push({ text: "Join chat", callback: () => { switchRoom(room.id) } });
                    }
                } else {
                    list = populateContextMenu('textroom', room.id);
                }
                if (hasPerm('renameRoom')) {
                    list.push({
                        text: 'Change room name',
                        callback: () => { popupChangeRoomName(room); },
                        class: 'contextrenameroom'
                    });
                }
                if (hasPerm('removeRoom')) {
                    list.push({
                        text: 'Delete room',
                        callback: () => { },
                        class: 'contextremoveroom'
                    });
                }
                showContextMenu(list, mouseX(e), mouseY(e))

            }
            elementRoom.onclick = () => {
                if (!localWebcamStream) {
                    startLocalDevices();
                }
                switchRoom(room.id);

            }
            var textRoom = div({ className: 'roomtext', id:null });
            var imageRoom
            if (room.type === 'voice') {
                imageRoom = img({ className: 'roomimg', src: 'vroom.svg', alt: 'voice room', id:null, title:null });
            } else {
                imageRoom = img({ className: 'roomimg', src: 'room.svg', alt: 'text room', id:null, title:null });
            }
            var usersInRoom = div({ className: 'roomusers', id:null });
            textRoom.innerText = room.name;

            room.userlist.forEach((user) => {
                var user = getUserByID(user.id);
                var elementUser = div({ className: 'user', id: 'user-' + user.id });
                var textUser = div({ className: 'usertext', id:null });
                var imageUser = document.createElement('img');
                imageUser.className = "userimg";
                imageUser.alt = 'avatar for ' + user.name;
                imageUser.src = user.avatar;
                textUser.innerText = user.name;
                elementUser.appendChild(imageUser);
                elementUser.appendChild(textUser);

                elementUser.oncontextmenu = (e) => {
                    e.preventDefault();
                    var list = populateContextMenu('user', user.id);
                    list.push({
                        text: 'Volume', slider: getConfig('volume-' + user.id, 1.0), callback: (e) => {
                            setConfig('volume-' + user.id, e.target.value);
                            var video = document.getElementById('video-' + user.id);
                            if (video) {
                                video.setAttribute('volume', e.target.value);
                            }
                        }
                    });
                    if (hasPerm('renameUser') || user.id === iam) {
                        list.push({
                            text: 'Change user name',
                            callback: () => {
                                popupChangeUserName(user);
                            },
                            class: 'contextrenameuser'
                        });
                    }
                    if (hasPerm('setUserGroup')) {
                        list.push({
                            text: 'Change user group',
                            callback: () => {
                                popupChangeUserGroup(user);
                            },
                            class: 'contextsetusergroup'
                        });
                    }
                    if (hasPerm('removeUser') && user.id !== iam) {
                        list.push({
                            text: 'Delete User',
                            callback: () => {
                                openConfirmContext('Confirm delete ' + user.name, 'DELETE USER', () => {
                                    send({
                                        type: 'removeuser',
                                        userid: user.id
                                    });
                                })
                            },
                            class: 'contextremoveuser'
                        });
                    }
                    showContextMenu(list, mouseX(e), mouseY(e))

                }
                usersInRoom.appendChild(elementUser);
            });


            elementRoom.appendChild(imageRoom);
            elementRoom.appendChild(textRoom);
            elementParent.appendChild(elementRoom);
            elementParent.appendChild(usersInRoom);
        });
        el.appRoomList.innerText = '';
        el.appRoomList.appendChild(elementParent);
        populateRoom();
    }

    send = (message) => {
        if(ws != null){
            ws.send(JSON.stringify(message));
        }
    }

    connect = () => {
        if (!electronMode) {
            ws = new WebSocket("wss://" + location.hostname + (location.port ? ':' + location.port : '') + "/ipc");
        } else {
            if (!customUrl) {
                return;
            }
            customUrl = customUrl.replace(/^https/i, 'wss');
            customUrl = customUrl.replace(/^http/i, 'ws');
            ws = new WebSocket(customUrl);
        }
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data['type'] in wsFunc) {
                wsFunc[data['type']](data);
            } else {
                console.log("Unknown message type : " + data['type']);
                console.log(data);
            }
        };
        ws.onclose = () => {
            console.log("Connection lost");
            ws = null;
            showLogin();
            setLoginMessage('Connection Lost');
        };
    }

    const wsFunc = {
        "connect": (data) => {
            (<HTMLImageElement>el.signuplogo).src = (<HTMLImageElement>el.loginlogo).src = data.icon;
            el.signuptitle.innerHTML = el.logintitle.innerHTML = markupParser.makeHtml(data.message);

            if (!electronMode) {
                themelist = data.themelist;
            }
            updateThemesInSettings();
            contextmenus = data.contextmenus;

            if (! ("v1" in data.protocols)) {
                el.loginReply.innerHTML = el.signupReply.innerHTML = "Unable to connect : No protocol v1";
            }
            if (customUsername && customPassword) {
                send({ type: 'login', email: customUsername, password: customPassword, protocol: "v1" });
                // If the details are no longer correct, don't go into an infinite login loop
                customUsername = null;
                customPassword = null;
            }
        },
        "error": (data) => {
            el.loginReply.innerHTML = el.signupReply.innerHTML = markupParser.makeHtml(data.message);
            console.log(data.message);
        },
        "disconnect": (data) => {
            cleanupStream(data.userid);
            setNotWatching(data.userid);
        },
        "login": (data) => {
            const { success, userid } = data;
            if (success) {
                showApp();
                setLoginMessage('');
                iam = userid;
                playSound('login');
            } else {
                showLogin();
                setLoginMessage('Invalid email or password');
            }
        },
        "refreshNow": (data) => {
            window.location.href = '/';
        },
        "updateUsers": (data) => {
            userlist = data.userList;
            setUserList(data.userList);
        },
        "updateRooms": (data) => {
            roomlist = data.roomList;
            setRoomList(data.roomList);
            roomlist.forEach(room => {
                if (!(room.id in messagelist) && room.type === 'text') {
                    send({ type: 'getmessages', roomid: room.id });
                }
            });
        },
        "chatdev": (data) => {
            var { audio, video, userid } = data;
            var am = document.getElementById("noaudio-" + userid);
            var vm = document.getElementById("novideo-" + userid);
            if (am && vm) {
                am.style.display = audio ? "none" : "flex";
                vm.style.display = video ? "none" : "flex";
            }
        },
        "joinRoom": (data) => {
            const { userid, roomid } = data;
            if (roomid == currentVoiceRoom) {
                // Someone joined our room
                playSound('voicejoin');
            }
            if (userid === iam) {
                currentVoiceRoom = roomid;
            }
            if (currentVoiceRoom) {
                updateDeviceState();
            }
        },
        "updateText": (data) => {
            const { roomid, segment, messages } = data;
            if (!(roomid in messagelist)) {
                messagelist[roomid] = [];
            }
            messagelist[roomid][segment] = messages;
            if (currentView === roomid) {
                populateRoom();
            }
        },
        "leaveRoom": (data) => {
            const { userid, roomid } = data;
            if (roomid === currentVoiceRoom) {
                // Someone left our room
                playSound('voiceleave');
            }
            if (userid === iam) {
                currentVoiceRoom = null;
                for(const pc of peerConnection){
                    cleanupStream(pc.userid);
                }
                for(const uuid of amWatching){
                    setNotWatching(uuid);
                }
                peerConnection = {};
                remoteWebcamStream = {};
                amWatching = {};
                isWatching = {};
                playSound('voiceleave');
            } else {
                cleanupStream(userid);
                setNotWatching(userid)
                isWatching[userid] = false;
            }
        },
        "groupplay": (data) => {
            const { roomid, url } = data;
            if (currentView === roomid) {
                sharedVideo = url;
                if (url) {
                    populateRoom();
                }
            }
        },
        "video": (data) => {
            const { payload, touserid, fromuserid } = data;
            if (touserid !== iam) { return; }
            if (payload.candidate) {
                payload.type = 'candidate';
            }
            switch (payload.type) {
                case "offer":
                    createPeerConnection(fromuserid);
                    if (peerConnection[fromuserid].signalingState != "stable") {
                        peerConnection[fromuserid].setLocalDescription({ type: "rollback" });
                    }
                    peerConnection[fromuserid].setRemoteDescription(new RTCSessionDescription(payload));
                    peerConnection[fromuserid].createAnswer()
                        .then(
                            (sD) => {
                                peerConnection[fromuserid].setLocalDescription(sD); send({ payload: sD, type: 'video', fromuserid: touserid, touserid: fromuserid })
                            })
                        .catch(err => {
                            console.log(err);
                            //console.log(pc.getSenders());
                        })
                    break;
                case "answer":
                    peerConnection[fromuserid].setRemoteDescription(new RTCSessionDescription(payload))
                        .then(
                            () => send({ payload: peerConnection[fromuserid].localDescription, type: 'video', fromuserid: touserid, touserid: fromuserid })
                        ).catch(err => {
                            console.log(err);
                        });
                    break;
                case "candidate":
                    if (peerConnection[fromuserid]) {
                        var newpayload = {
                            candidate: payload.candidate,
                            sdpMLineIndex: payload.sdpMLineIndex
                        }
                        peerConnection[fromuserid].addIceCandidate(
                            new RTCIceCandidate(newpayload)).catch(e => { console.log(e); console.log(e.trace) });

                    }
                    break;
                case "fuckoff":
                    cleanupStream(fromuserid);
                    break;
                case "callme":
                    startCall(fromuserid);
                    break;
            }
        },
        "updatePerms": (data) => {
            permissions = data.perms;
            updatePerms();
        },
        "updateGroups": (data) => {
            groups = data.groups;
            updateGroups();
        },
        'invite': (data) => {
            // TODO Reimplement later
            /*var { url } = data;
            el.inviteuserreply.innerText = url;
            el.onclick = () => {
                navigator.clipboard.writeText(link).then(() => { }, () => { });
            }
            new QRCode(el.inviteqrcode, {
                text: url,
                colorDark: "#000000",
                colorLight: "#FFFFFF"
            });*/
        },
        'sendMessage': (data) => {
            var { roomid, message } = data;
            if (Notification.permission == 'granted') {
                if (message.userid === iam) {
                    return;
                }
                var user = getUserByID(message.userid);
                console.log(message);
                new Notification(user.name + " : " + message.text);
            }
            playSound("newmessage");
        },
        'servermute': (data) => {
            var { userid, message } = data;
            var sideuser = document.getElementById('user-' + userid)
            var videouser = document.getElementById('videodiv-' + userid);
            if(sideuser != null){
                if (message) {
                    sideuser.classList.add('usermuted');
                    if (videouser) { videouser.classList.add('videodivmuted'); }
                    if (electronMode) { window.ipc.send('muted', userid); }
                } else {
                    sideuser.classList.remove('usermuted');
                    if (videouser) { videouser.classList.remove('videodivmuted'); }
                    if (electronMode) { window.ipc.send('unmuted', userid); }
                }
            }
        },
        'talking': (data) => {
            var { userid, talking } = data;
            var sideuser = document.getElementById('user-' + userid)
            var videouser = document.getElementById('videodiv-' + userid);
            if (talking) {
                if (sideuser) { sideuser.classList.add('usertalking'); }
                if (videouser) { videouser.classList.add('videodivtalking'); }
                if (electronMode) { window.ipc.send('talkstart', userid); }
            } else {
                if (sideuser) { sideuser.classList.remove('usertalking'); }
                if (videouser) { videouser.classList.remove('videodivtalking'); }
                if (electronMode) { window.ipc.send('talkstop', userid); }
            }
        },
        'golive': (data) => {
            var { livestate, livelabel, userid, roomid } = data;
            var user = getUserByID(userid);
            console.log(data);
            if (user) {
                user.livestate = livestate;
                user.livelabel = livelabel;
            }
            if (!livestate) {
                amIWatching[userid] = false;
            }
            if (roomid === currentVoiceRoom) {
                // TODO Play sound for stream start or finish
            }

            populateRoom();
        },
        'letmesee': (data) => {
            var { touserid, fromuserid, message } = data;
            if (touserid == iam) {
                isWatching[fromuserid] = message;
            }
            replacePeerMedia(peerConnection[fromuserid]);
            populateRoom();
        },
        'presentcustomwindow': (data) => {
            var window = createWindow(data.window);
            showCustom(window);
        }
    }

    const createWindow = (data) => {
        var [element, inputlist] = createWindowElement(data);
        var allinput = {};
        inputlist.forEach(input2 => {
            allinput[input2.id] = input2.value;
        });

        inputlist.forEach(input => {

            input.onchange = (_changeevent) => {
                send({
                    userid: iam,
                    inputid: input.id,
                    value: input.value,
                    allinputs: allinput
                });
            }
            if (input.type == 'button') {
                input.onclick = (_changeevent) => {
                    send({
                        userid: iam,
                        inputid: input.id,
                        value: input.value,
                        allinputs: allinput
                    });
                }
            }
        });
        return element;
    }

    const createWindowElement = (data) => {
        // Things we are not doing :
        // - script elements
        // - innerHtml
        // - video elements?

        // Since we can't be sure what people might try
        // Let's leave this open to feature requests
        // Tell us what you need!
        switch (data.type) {
            case 'div':
            case 'span':
            case 'textarea':
            case 'img':
            case 'input':
                var el = document.createElement(data.type);
                if ('id' in data) {
                    el.id = data.id;
                }
                if ('classList' in data) {
                    el.classList = data.classList;
                }
                if ('text' in data) {
                    el.innerText = data.text;
                }
                if ('inputtype' in data) {
                    el.type = data.inputtype;
                }
                if ('value' in data) {
                    el.value = data.value;
                }
                var inputlist : any[] = []
                if ('children' in data) {
                    data.children.forEach(child => {
                        var [childElement, inputlist2] = createWindowElement(child);
                        if (childElement) {
                            el.appendChild(childElement);
                            inputlist = inputlist.concat(inputlist2)
                        }
                    });
                }
                inputlist.push(el)

                return [el, inputlist];
            default:
                return [null, []];
        }

    }

    const hasPerm = (perm) => {
        return permissions.indexOf(perm) > -1;
    }

    const updatePerms = () => {
        // Set elements based on if the user is allowed specific actions
        if (hasPerm('createRoom') || hasPerm('createUser')) {
            el.serverbutton.style.display = 'block';
        } else {
            el.serverbutton.style.display = 'none';
        }
    }

    const updateGroups = () => {
        var override = hasPerm("inviteUserAny");
        el.createusergroup.innerText = '';
        el.inviteusergroup.innerText = '';

        Object.keys(groups).forEach(group => {
            var opt = document.createElement('option');
            opt.value = group;
            opt.innerText = group;
            el.createusergroup.appendChild(opt);
            var pL = groups[group];
            var allowInvitesFor = pL.indexOf('noInviteFor') === -1;
            if (override || allowInvitesFor) {
                var opt2 = document.createElement('option');
                opt2.value = group;
                opt2.innerText = group;
                el.inviteusergroup.appendChild(opt2);
            }
        })


    }

    const processSignup = () => {
        var email = (<HTMLInputElement>el.signupEmail).value;
        var email2 = (<HTMLInputElement>el.signupEmail2).value;
        var user = (<HTMLInputElement>el.signupUser).value;
        var password = (<HTMLInputElement>el.signupPassword).value;
        var password2 = (<HTMLInputElement>el.signupPassword2).value;
        var reply = el.signupReply;
        el.signupReply.innerText = ''
        if (!email) { el.signupEmail.focus(); return; }
        if (!(email.indexOf('@') > -1 && email.indexOf('.') > -1)) {
            el.signupReply.innerText = 'Please use an email address'
            el.signupEmail.focus(); return;
        }
        if (email !== email2) {
            el.signupReply.innerText = 'Email Addresses must match!'
            el.signupEmail2.focus(); return;
        }
        if (!user) { el.signupUser.focus(); return; }
        // TODO Probably want to be less stringent
        if (!user.match(/^[a-zA-Z0-9-_ ]+$/)) {
            el.signupReply.innerText = 'Username must only contain alphanumeric, dash, underscore and space';
            el.signupUser.focus(); return;
        }
        if (user.length < 3) {
            el.signupReply.innerText = 'Username must be longer than 3 characters';
            el.signupUser.focus(); return;
        }
        if (!password) { el.signupPassword.focus(); return; }
        if (password.length < 7) {
            el.signupReply.innerText = 'Password must be at least 7 characters';

        }
        if (password !== password2) {
            el.signupReply.innerText = 'Passwords must match!'
            return;
        }

        send({
            type: 'signup',
            email,
            password,
            userName: user,
            signUp: signUpCode
        })

    }
    // 'Next step' in login process.
    const processLogin = () => {
        var email = (<HTMLInputElement>el.loginEmail).value;
        var password = (<HTMLInputElement>el.loginPassword).value;

        el.loginReply.innerText = ''
        if (email) {
            if (password) {
                if (electronMode) { window.ipc.send('savepassword', { server: customUrl, email, password }); }
                send({ type: 'login', email, password, protocol: "v1" });
                startLocalDevices();
                Notification.requestPermission();
            } else {
                el.loginPassword.focus();
            }
        } else {
            el.loginEmail.focus();
        }
    }

    const getRoom = (roomid) => {
        var ret :Room|null = null;
        for (const room of roomlist){
            if (room.id == roomid) {
                return room;
            }
        }
        return null;
    }

    populateRoom = () => {
        var room = getRoom(currentView);
        var voiceroom = getRoom(currentVoiceRoom);
        if (!room) {
            el.appCoreView.innerText = '';
            return;
        }
        var contents = div({id:null, className:null});
        var after : any = null;
        if (room.type === 'voice') {
            var liveDiv = div({ className: 'appLiveRoom', id:null });
            var voiceDiv = div({ className: 'appVoiceRoom', id:null });
            contents.className = 'appContainer';
            if (sharedVideo) {
                var divcont = div({ className: 'videodiv', id: 'sharedVideoDiv' });
                var video = <HTMLVideoElement>document.getElementById('sharedVideo');
                if (!video) {
                    video = <HTMLVideoElement>document.createElement('video');
                    video.setAttribute('autoPlay', "true");
                    video.setAttribute('playsInline', "true");
                    video.setAttribute('id', 'sharedVideo');
                    video.src = sharedVideo;
                    video.onended = () => {
                        video.pause();
                        video.removeAttribute('src'); // empty source
                        video.load();
                        sharedVideo = null;
                        var divrm = document.getElementById('sharedVideoDiv');
                        if (divrm != null && divrm.parentElement!=null){
                            divrm.parentElement.removeChild(divrm);
                        }
                        playToGroup(null);
                    };


                    //<video src="youtu.be/MLeIBFYY6UY" controls="true"></video>
                }
                divcont.appendChild(video);
                voiceDiv.appendChild(divcont);
            }

            room.userlist.forEach((user) => {
                populateRoomVideo(voiceDiv, liveDiv, user);
            });
            contents.appendChild(liveDiv);
            contents.appendChild(voiceDiv);
        } else if (room.type === 'text') {
            if (voiceroom) {
                var videoOverlayDiv = div({ className: 'chatWebcamOverlay', id: 'chatWebcamOverlay' })
                voiceroom.userlist.forEach((user) => {
                    populateRoomVideo(videoOverlayDiv, videoOverlayDiv, user);
                });
                contents.append(videoOverlayDiv);
            }

            var scrollingDiv = div({ className: 'chatscroller', id: 'chatscroller' });
            new ResizeObserver(entries => {
                entries.forEach(entry => {
                    if (scrollingDiv.offsetHeight === 0) { return; }
                    console.log("Setting scroll to " + lastChatYPos);
                    scrollingDiv.scrollTo(0, scrollingDiv.scrollHeight - lastChatYPos - scrollingDiv.offsetHeight);
                })
            }).observe(scrollingDiv);


            scrollingDiv.onscroll = (event) => {
                lastChatYPos = scrollingDiv.scrollHeight - (scrollingDiv.scrollTop + scrollingDiv.offsetHeight);
                console.log("User Scrolled to 0");
            }

            var chatDiv = div({ className: 'chatroom', id:null });

            if (!(currentView in messagelist)) {
                var divWaiting = div({ className: 'waitingonmessages', id:null });
                divWaiting.innerText = "Loading Messages...";
                scrollingDiv.appendChild(divWaiting);
            } else {
                var list = Object.keys(messagelist[currentView]).sort(function (a:string, b:string) { return ((+a) - (+b)) })
                var onebefore = (+list[0]) - 1;
                if (onebefore >= 0) {
                    var dudSegment = div({ className: 'messagesegment dudmessagesegment', id:null });
                    dudSegment.innerText = 'loading more...';
                    scrollingDiv.appendChild(dudSegment);
                    new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            if (entry.intersectionRatio > 0) {
                                loadMoreText();
                            }
                        });
                    }, { root: scrollingDiv }).observe(dudSegment);
                }
                var lastHtml = '';
                list.forEach(segmentkey => {
                    var segment = div({ className: 'messagesegment', id: 'messagesegment-' + segmentkey });
                    console.log(currentView);
                    console.log(messagelist);
                    messagelist[currentView][segmentkey].forEach(message => {
                        var messageDiv = div({ className: 'message', id:null });
                        var messageUserDiv = div({ className: 'messageuser', id:null });
                        var messageMessageDiv = div({ className: 'messagemessage', id:null });
                        var messageUserImage = document.createElement('img');
                        var messageUserText = div({ className: 'messageusertext', id:null });
                        messageUserImage.className = 'messageuserimg userimg';
                        messageUserDiv.appendChild(messageUserImage);
                        messageUserDiv.appendChild(messageUserText);


                        messageDiv.appendChild(messageUserDiv);
                        messageDiv.appendChild(messageMessageDiv);
                        segment.appendChild(messageDiv);
                        if (message.type && message.type === 'webhook') {
                            messageUserText.innerText = message.username;
                            messageUserImage.src = message.avatar;
                            messageMessageDiv.innerHTML = markupParser.makeHtml(message.text);
                            messageMessageDiv.onclick = () => window.open(message.url, '_blank')?.focus()
                        } else {
                            var user = getUserByID(message.userid);
                            var username = user ? user.name : '[deleted user]';

                            if (message.tags && message.tags.includes(iam)) {
                                messageDiv.classList.add('tagged');
                            }
                            if (user && user.avatar) {
                                messageUserImage.src = user.avatar;
                            } else {
                                // Use theme-specific avatar
                                messageUserImage.src = 'img/' + theme + '/avatar.svg';
                                messageUserImage.dataset.src = 'avatar.svg';
                            }
                            messageUserText.innerText = username + ":";
                            if ('text' in message) {
                                messageMessageDiv.innerHTML = markupParser.makeHtml(message.text);
                                messageMessageDiv.oncontextmenu = (e) => {
                                    e.preventDefault();
                                    var list = populateContextMenu('message', message.id);
                                    if (message.userid === iam || hasPerm('changeMessage')) {
                                        list.push(
                                            {
                                                text: 'Edit Message',
                                                callback: () => {
                                                    popupChangeMessage(message);
                                                },
                                                class: 'contexteditmessage'
                                            });
                                    }
                                    if (hasPerm('removeMessage')) {
                                        list.push(
                                            {
                                                text: 'Delete Message',
                                                callback: () => {
                                                    //TODO
                                                },
                                                class: 'contextremovemessage'
                                            }
                                        )
                                    }
                                    showContextMenu(list, mouseX(e), mouseY(e));

                                }
                            }

                            if ('url' in message) {
                                var urlElement = document.createElement('a');
                                urlElement.className = 'messageurl';
                                urlElement.setAttribute('href', message.url);
                                urlElement.innerText = message.url;
                                segment.appendChild(urlElement);
                            }
                            if ('img' in message) {
                                var imgElement = document.createElement('img');
                                imgElement.className = 'messageimg';
                                imgElement.setAttribute('height', message['height']);
                                imgElement.setAttribute('width', message['width']);
                                imgElement.src = message['img'];
                                imgElement.setAttribute('alt', 'user submitted image');
                                segment.appendChild(imgElement);
                            }
                        }
                        if (getConfig('hidedupename', false)) {
                            var html = messageUserDiv.innerHTML;
                            console.log(html + " " + lastHtml);
                            if (html === lastHtml) {
                                messageUserDiv.style.opacity = "0.0";
                            } else {
                                lastHtml = html;
                            }
                        }
                    });

                    //segment.innerHTML = markupParser.makeHtml(text);
                    scrollingDiv.appendChild(segment);
                });

            }
            chatDiv.appendChild(scrollingDiv);
            // Input Section
            if (cacheDragAndDropFile) {
                var outer = div({ className: 'chatroominputdraganddropouter', id:null });
                var dragDropSection = div({ className: 'chatroominputdraganddrop', id:null });
                var dragDropImage = document.createElement('img');
                var close = div({ className: 'chatroominputdraganddropclose', id:null });
                dragDropImage.className = 'chatroominputdraganddropimg';
                dragDropImage.setAttribute('alt', 'user submitted image');
                chatDiv.appendChild(outer);
                outer.appendChild(dragDropSection);
                dragDropSection.appendChild(dragDropImage);
                dragDropSection.appendChild(close);
                close.onclick = () => { cacheDragAndDropFile = null; populateRoom(); };

                var reader = new FileReader();
                reader.onload = function (event) {
                    if(event.target){
                        var result = event.target.result;
                        if(result && typeof(result) == "string"){
                            var split = result.split(',');
                            dragDropImage.src = result;
                        }
                    }
                };
                reader.readAsDataURL(cacheDragAndDropFile);
            }
            var autocomplete = div({ className: 'autocomplete', id: 'autocomplete' });
            chatDiv.appendChild(autocomplete);
            var input = document.createElement('form');
            var inputtext = document.createElement('textarea');
            inputtext.id = 'inputtext';
            var lastinput = <HTMLInputElement> document.getElementById('inputtext');
            if (lastinput) {
                inputtext.value = lastinput.value;
                if (lastinput.selectionStart != null && lastinput.selectionEnd !=null){
                    inputtext.selectionStart = lastinput.selectionStart;
                    inputtext.selectionEnd = lastinput.selectionEnd;
                }
            }
            var inputbutton = document.createElement('input');
            inputbutton.setAttribute('type', 'image');
            inputbutton.setAttribute('alt', 'Send message');
            inputbutton.dataset.src = 'send.svg';
            inputbutton.src = 'img/' + theme + "/send.svg";
            input.className = 'chatroominput';
            inputtext.classList = 'chatroominputtext';
            inputbutton.classList = 'chatroominputbutton';
            inputbutton.setAttribute('value', 'Send');

            inputtext.oninput = (event : Event) => {
                console.log(event);
                const ievent = event as InputEvent;
                if(ievent.target == null) { return; }

                // We've written an @ and not already autocompleteing
                if ((!autocompleteing) && ievent.inputType === 'insertText' && ievent.data === '@') {
                    autocompleteing = currentView;
                    autocompletestart = inputtext.selectionStart;
                    autocompleteselection = 0;
                    return;
                }
                // We've moved before the @. Stop autocompleteing
                if (inputtext.selectionStart < autocompletestart) {
                    autocompleteing = null;
                    autocompletestart = 0;
                    autocompleteselection = 0;
                    return;
                }
                // We're currently autocompleteing
                if (autocompleteing === currentView) {
                    console.log("Caret : " + inputtext.selectionStart + " End : " + inputtext.value.length);
                    var soFar = inputtext.value.substring(autocompletestart, inputtext.selectionStart);
                    console.log(soFar);
                    var userList = getUsersByPartialName(soFar);
                    updateAutocomplete(userList);
                }
            }
            inputtext.onkeydown = (event) => {
                if (autocompleteing === currentView) {
                    var soFar = inputtext.value.substring(autocompletestart, inputtext.selectionStart - 1);
                    var userList = getUsersByPartialName(soFar);
                    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
                        autoComplete();
                        return false;
                    }
                    if (event.key == 'ArrowUp') {
                        if (autocompleteselection > 0) {
                            autocompleteselection--;
                        }
                        updateAutocomplete(userList);
                        return false;
                    }
                    if (event.key == 'ArrowDown') {
                        if (autocompleteselection < (userList.length - 1)) {
                            autocompleteselection++;
                        }
                        updateAutocomplete(userList);
                        return false;
                    }
                    if (event.key == 'Escape') {
                        autocompleteselection = 0;
                        autocompleteing = null;
                        autocompletestart = 0;
                        updateAutocomplete(null);
                        return false;
                    }
                }

                if (event.key === "Enter") {
                    if (event.shiftKey) {
                        return true;
                    }
                    event.preventDefault();
                    //input.onsubmit(); //TODO Come back for enter-to-send
                    return false;
                }
            }
            input.onsubmit = (event) => {
                if (event) { event.preventDefault(); }
                var text = inputtext.value;

                if (cacheDragAndDropFile) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        // Result Preambles too much!
                        // Split it out
                        var result = input.result;
                        var split = result.split(',');
                        send({
                            type: 'message',
                            roomid: currentView,
                            message: { text, tags: cacheUserTagged },
                            filename: cacheDragAndDropFile.name,
                            rawfile: split[1]
                        })
                        inputtext.value = '';
                        cacheUserTagged = [];
                        cacheDragAndDropFile = null;
                        populateRoom();
                    };

                    reader.readAsDataURL(cacheDragAndDropFile);
                } else {
                    send({
                        type: 'message',
                        roomid: currentView,
                        message: { text, tags: cacheUserTagged, }
                    })
                    inputtext.value = '';
                    cacheUserTagged = [];
                    inputtext.focus();
                }
                return false;
            };
            after = () => {
                inputtext.focus();
            }
            input.appendChild(inputtext);
            input.appendChild(inputbutton);
            chatDiv.appendChild(input);
            contents.appendChild(chatDiv);

        }
        el.appCoreView.innerText = '';
        el.appCoreView.appendChild(contents);
        if (after) { after(); }

        updateDeviceState();
    }

    const populateRoomVideo = (webcam_parent, live_parent, user) => {
        var user = getUserByID(user.id);
        // Create a Video element for voice chat
        var divid = div({ className: 'videodiv', id: 'videodiv-' + user.id });
        var video = document.createElement('video');
        video.setAttribute('poster', user.avatar);
        video.setAttribute('autoPlay', "true");
        video.setAttribute('playsInline', "true");
        video.setAttribute('id', 'video-' + user.id);
        video.setAttribute('volume', getConfig('volume-' + user.id, 1.0));

        var novid = img({ src: 'webcamoff.svg', id: "novideo-" + user.id, className: "videonovideo", alt: 'has no video stream', title: "No video" });
        var noaud = img({ src: 'micoff.svg', id: "noaudio-" + user.id, className: "videonoaudio", alt: 'has no audio stream', title: "No Audio" });
        var nocon = img({ src: 'noconnection.svg', id: "noconn-" + user.id, className: "videonoconn", alt: 'not connected', title: "No Connection" });
        divid.appendChild(novid);
        divid.appendChild(noaud);
        divid.appendChild(nocon);

        divid.appendChild(video);
        webcam_parent.appendChild(divid);
        if (user.livestate) {
            var livediv = div({ className: 'livediv', id:null });
            if (amIWatching(user.id)) {
                var livevideo = document.createElement('video');
                livevideo.setAttribute('autoPlay', "true");
                livevideo.setAttribute('playsInline', "true");
                livevideo.setAttribute('id', 'live-' + user.id);
                if (user.id === iam) {
                    if (localLiveStream !== null) {
                        livevideo.srcObject = localLiveStream;
                    }
                } else {
                    if (user.id in remoteLiveStream) {
                        livevideo.srcObject = remoteLiveStream[user.id];
                    }
                }

                livediv.oncontextmenu = (e) => {
                    e.preventDefault();
                    var list = populateContextMenu('livestream', user.id);

                    list.push(
                        {
                            text: 'Stop watching',
                            callback: () => {
                                console.log("Stop watching " + user.id);
                                setNotWatching(user.id);
                            },
                            class: 'contextstopstream'
                        });
                    list.push(
                        {
                            text: 'Fullscreen',
                            callback: () => {
                                goFullscreen(livevideo, livediv, user.id);
                            },
                            class: 'contextfullscreen'
                        }
                    )
                    showContextMenu(list, mouseX(e), mouseY(e));
                }
                livediv.appendChild(livevideo);
            } else {
                var span1 = document.createElement('span');
                var span2 = document.createElement('span');
                var span3 = document.createElement('span');
                span1.innerText = user.name;
                span2.innerText = 'is streaming';
                span3.innerText = user.livelabel;
                livediv.appendChild(span1);
                livediv.appendChild(span2);
                livediv.appendChild(span3);

                livediv.oncontextmenu = (e) => {
                    e.preventDefault();
                    var list = populateContextMenu('livestream', user.id);

                    list.push(
                        {
                            text: 'Watch',
                            callback: () => {
                                setWatching(user.id);
                            },
                            class: 'contextstartstream'
                        });
                    showContextMenu(list, mouseX(e), mouseY(e));
                }

                livediv.onclick = () => {
                    setWatching(user.id);
                }
            }
            live_parent.appendChild(livediv);
        }

        // If Me
        if (user.id === iam) {
            video.muted = true;
            nocon.style.display = 'none';
            if (localWebcamStream !== null) {
                video.srcObject = localWebcamStream;
                video.muted = true;
                video.volume = 0.0;
                video.classList.add('selfie');
                if ((<HTMLInputElement> el.settingFlipWebcam).checked) {
                    video.style.transform = 'rotateY(180deg)';
                }
            }
            if (getConfig('blurwebcam', false)) {
                var canvas = document.createElement('canvas');
                video.hidden = true;
                video.height = 250;
                video.width = 444;
                canvas.hidden = false;
                canvas.id = 'blurcanvas';
                divid.appendChild(canvas);
                video.onloadeddata = () => {
                    bodyPix.load({
                        architecture: 'MobileNetV1',
                        multiplier: 0.75,
                        outputStride: 16,
                        quantBytes: 4,
                    })
                        .then(net => performBodyPix(net, canvas, video))
                        .catch(err => console.log(err));

                }
            }
        } else {
            if (user.id in remoteWebcamStream) {
                video.srcObject = remoteWebcamStream[user.id];
            } else {
                startCall(user.id);
            }
        }
    }

    const performBodyPix = async (net, canvas, video) => {
        console.log("Started blur thread");
        while (canvas && video && document.body.contains(canvas) && document.contains(video)) {
            const segm = await net.segmentPerson(video);
            bodyPix.drawBokehEffect(
                canvas,
                video,
                segm,
                blurValue,
                blurEdgeValue,
                false
            );
        }
        console.log("Stopped blur thread");
    }

    const goFullscreen = (element, parent, userid) => {
        el.fullscreenpopup.style.display = 'flex';
        el.fullscreenpopup.appendChild(element);
        fullscreenUserID = userid;
        fullscreenParent = parent;
        fullscreenElement = element;
        el.fullscreenpopup.onclick = () => {
            closeFullscreen();
        }
    }

    const closeFullscreen = () => {
        fullscreenParent.appendChild(fullscreenElement);
        el.fullscreenpopup.style.display = 'none';
        fullscreenUserID = null;
        fullscreenElement = null;
        fullscreenParent = null;
    }

    const autoComplete = () => {
        if (autocompleteing === currentView) {
            var inputtext = <HTMLInputElement> document.getElementById('inputtext');
            if (inputtext == null) {
                return;
            }
            if (!inputtext.selectionStart){
                return;
            }
            var soFar = inputtext.value.substring(autocompletestart, inputtext.selectionStart);
            var userList = getUsersByPartialName(soFar);

            // We're done autocompleteing. Did we get anything?

            autocompleteing = null;
            var text = inputtext.value;
            var endtext = text.substring(inputtext.selectionStart, text.length);
            if (endtext.length < 1) {
                endtext = " ";
            }
            text = text.substring(0, autocompletestart) + userList[autocompleteselection].name + endtext;
            cacheUserTagged.push(userList[autocompleteselection].id);
            inputtext.value = text;
            inputtext.selectionEnd = inputtext.selectionStart = text.length;
            updateAutocomplete(null);
        }
    }

    const updateAutocomplete = (userList) => {
        var count = 0;
        var ac = document.getElementById('autocomplete')
        if (ac == null){
            return;
        }
        var autocompleteinner = div({ className: 'autocompleteinner', id: 'autocompleteinner' });
        if (userList === null) {
            ac.innerText = '';
            return;
        }
        userList.forEach(user => {
            var d = div({ className: 'autocompleteentry', id: null });
            if (count === autocompleteselection) {
                d.classList.add('selected');
            }
            var name = div({ className: 'autocompleteentrytext', id:null });
            var img = document.createElement('img');
            img.src = user.avatar;
            img.className = 'userimg';

            name.innerText = user.name;
            d.appendChild(img);
            d.appendChild(name);

            d.onmouseenter = function (count2) {
                return () => {
                    autocompleteselection = count2;
                    var aci = document.getElementById('autocompleteinner');
                    if(aci==null){
                        return;
                    }
                    var c = 0;
                    aci.childNodes.forEach(e => {
                        const e2 = <HTMLElement> e;
                        if (c == count2) {
                            e2.classList.add('selected');
                        } else {
                            e2.classList.remove('selected');
                        }
                        c++;
                    });
                };
            }(count);
            d.onclick = autoComplete;
            autocompleteinner.appendChild(d);
            count++;
        })
        ac.innerText = ''
        ac.appendChild(autocompleteinner);
    }

    const switchRoom = (roomid) => {
        // Same room chosen = noop
        if (currentView === roomid) { return; }
        var room = getRoom(roomid);
        // Moving TO a voice room
        if (room && room.type === 'voice') {
            stopStreaming();
            if (roomid !== currentVoiceRoom) {
                // From a different room, close connections
                for(const pc of peerConnection){
                    pc.close();
                }
            }
            // Set new voice room
            currentVoiceRoom = roomid;
        }
        // Leaving voice room
        if (!room) {
            // Close connections
            stopStreaming();
            for (const pc of peerConnection){
                pc.close();
            }
            currentVoiceRoom = null;
        }
        // Set view
        currentView = roomid;

        populateRoom();
        updateDeviceState();
        if (electronMode) {

            if (overlayEnable && isInVoiceRoom()) {
                window.ipc.send('enableoverlay', []);
            } else {
                window.ipc.send('disableoverlay', []);
            }

        }
        // Tell the server
        if (roomid) {
            send({
                type: 'joinroom',
                roomid
            });
        } else {
            send({ type: 'leaveroom' });
        }
    }

    loadMoreText = () => {
        var list = Object.keys(messagelist[currentView]).sort(function (a, b) { return ((+a) - (+b)) });
        var onebefore = (+list[0]) - 1;
        if (onebefore >= 0) {
            send({ type: 'getmessages', roomid: currentView, segment: onebefore });
        }

        // If this was caused by putting scroll to top then reposition so we don't loop on it
        var chatscroller = document.querySelector('#chatscroller');
        if (chatscroller == null){
            return;
        }
        if (chatscroller.scrollTop < 50) {
            chatscroller.scrollTop = 50;
        }

    }

    // Webcam RTC

    const createPeerConnection = (userid) => {
        if (!(userid in peerConnection)) {
            var pc = peerConnection[userid] = new RTCPeerConnection({
                bundlePolicy: 'max-bundle',
                iceServers: [
                    {
                        urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"]
                    }
                ]
            });
            
            (pc as any).userid = userid;
            replacePeerMedia(pc);
            pc.onicecandidate = (event) => { handleIceCandidate(userid, event) };
            pc.ontrack = (event) => { handleTrack(userid, event) };
            pc.oniceconnectionstatechange = (event) => { handleIceStateChange(userid, event) };
            pc.onconnectionstatechange = (_event) => {
                if (pc.connectionState === 'failed') {
                    restartStream(userid)
                }
                if (pc.connectionState === 'connected') {
                    var vc = document.getElementById("noconn-" + userid);
                    if (vc) {
                        vc.style.display = 'none';
                    }
                } else {
                    var vc = document.getElementById("noconn-" + userid);
                    if (vc) {
                        vc.style.display = 'block';
                    }
                }

            };
            pc.onnegotiationneeded = async () => {
                pc.createOffer().then((o) => {
                    pc.setLocalDescription(o).then(() => {
                        send({ type: 'video', touserid: userid, fromuserid: iam, payload: pc.localDescription })
                    }).catch((err) => {
                        console.log("Unable to set Local Description : " + err);
                        console.log(o);
                    });
                }).catch((err) => {
                    console.log("Unable to create offer : " + err);
                });
            }
        }
    }

    const handleIceStateChange = (userid, event) => {
        if (peerConnection[userid].iceConnectionState === 'failed') {
            //restartStream(userid);
        } else if (peerConnection[userid].iceConnectionState == 'connected') {
            console.log("ICE Connected to " + userid);
        }
    };

    const handleIceCandidate = (userid, event) => {
        if (event.candidate) {
            send({
                payload: event.candidate,
                type: 'video',
                fromuserid: iam,
                touserid: userid
            });
        } else {
        }

    }

    const restartStream = (userid) => {
        cleanupStream(userid);// Have you tried turning it off and on again
        send(
            {
                payload: { type: 'fuckoff' },
                type: 'video',
                fromuserid: iam,
                touserid: userid
            }
        );
        startCall(userid);
    }

    const handleTrack = (userid, event) => {
        var ele = <HTMLVideoElement> document.getElementById('video-' + userid);
        var ele2 = <HTMLVideoElement> document.getElementById('live-' + userid);

        var stream = event.streams[0];

        if (stream === remoteLiveStream[userid]) { return }
        if (stream === remoteWebcamStream[userid]) { return }

        if (ele && ele.srcObject === null) {
            // First stream from a user is webcam/audio
            remoteWebcamStream[userid] = stream;
            ele.srcObject = stream;
        } else {
            // Second stream from a user is livestream. But probably just static
            remoteLiveStream[userid] = stream;
            if (ele2) {
                ele2.srcObject = stream;
            }
        }
    }

    const prepareSoundReader = (src, uuid) => {
        var sreader = new SoundReader(new AudioContext());
        sreader.connectToSource(src, function (e) {
            var timerID = setInterval(() => {
                var sideuser = document.getElementById('user-' + uuid)
                var videouser = document.getElementById('videodiv-' + uuid);
                if (!sideuser) {
                    sreader.stop();
                    clearInterval(timerID);
                } else if (sreader.talked) {
                    sideuser.classList.add('usertalking');
                    if (videouser) { videouser.classList.add('videodivtalking'); }
                    if (electronMode) { window.ipc.send('talkstart', uuid); }
                    send({ type: 'talking', userid: uuid, talking: true });
                } else {
                    sideuser.classList.remove('usertalking');
                    if (videouser) { videouser.classList.remove('videodivtalking'); }
                    if (electronMode) { window.ipc.send('talkstop', uuid); }
                    send({ type: 'talking', userid: uuid, talking: false });
                }
            }, 200);
        });
        return sreader.dest;
    }

    const cleanupStream = (userid) => {
        console.log("Removing peer data " + userid);
        var ele = <HTMLVideoElement> document.getElementById('video-' + userid);
        if (peerConnection[userid]) {
            var pc = peerConnection[userid];
            pc.ontrack = null;
            pc.onremovetrack = null;
            pc.onicecandidate = null;
            pc.oniceconnectionstatechange = null;
            pc.onconnectionstatechange = null;
            pc.close();
        }
        if (ele && ele.srcObject) {
            if ('getTracks' in ele.srcObject){
                ele.srcObject.getTracks().forEach(track => track.stop());
            }
            ele.srcObject = null;
        }

        delete peerConnection[userid];
        delete remoteWebcamStream[userid];
    }

    const startCall = (userid) => {
        // Awful race condition if both ends attempt to call at the same time
        // Only one needs to call and we have unique IDs!
        if(iam==null){return;}
        if (iam < userid) {
            send({ type: 'video', payload: { type: 'callme' }, touserid: userid, fromuserid: iam });
            return;
        }
        if (userid in peerConnection) {
            return;
        }
        createPeerConnection(userid);
    }
    function whiteNoise() {
        var width = 50;
        var height = 25;
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        const ctx = canvas.getContext('2d');
        if(ctx == null){
            return;
        }
        ctx.fillRect(0, 0, width, height);
        const p = ctx.getImageData(0, 0, width, height);
        requestAnimationFrame(function draw() {
            for (var i = 0; i < p.data.length; i++) {
                p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
            }
            ctx.putImageData(p, 0, 0);
            requestAnimationFrame(draw);
        });
        return canvas.captureStream();
    }

    startLocalDevices = () => {
        if (localWebcamStream) {
            localWebcamStream.getTracks().forEach(track => track.stop());
        }
        navigator.mediaDevices
            .getUserMedia(createConstraints())
            .then(stream => {
                var ele = <HTMLVideoElement> document.getElementById('video-' + iam);
                if (ele) {
                    ele.srcObject = null;
                    ele.srcObject = stream;
                }
                localWebcamStream = stream;
                localFilteredWebcamStream = prepareSoundReader(localWebcamStream, iam).stream;
                updateDeviceState();

                // Any existing PC need the stream
                replaceAllPeerMedia();
                return navigator.mediaDevices.enumerateDevices();
            })
            .then(updateInputsInSettings)
            .catch(err => {
                console.info("No webcam appears to be present:");
                console.error("error:" + err);
                if (!noWebcamFound) {
                    noWebcamFound = true;
                    startLocalDevices();
                }
                // Put 'Any' back in. At this point we've lost our custom device list
                updateInputsInSettings(null);
            });
    }

    replaceAllPeerMedia = () => {
        for(const pc of peerConnection){
            replacePeerMedia(pc);
        }
    }

    const replacePeerMedia = (pc) => {
        if (!pc) {
            return;
        }
        var senders = pc.getSenders().length;
        var sources :any[] = []
        var tracks :any[] = [];

        var blurCanvas = <HTMLCanvasElement>document.getElementById('blurcanvas');
        if (!localWebcamStream) {
            console.log('Local Webcam Stream null : cannot replace peer media');
            return;
        }

        sources.push(localWebcamStream);

        if (getConfig('blurwebcam', false) && blurCanvas) {
            tracks.push(blurCanvas.captureStream().getVideoTracks()[0]);
        }
        if (localWebcamStream.getVideoTracks().length == 1) {
            tracks.push(localWebcamStream.getVideoTracks()[0]);
        } else {
            var whiteNoiseStream = whiteNoise();
            if(whiteNoiseStream){
                whiteNoiseStream.getTracks()[0].enabled = false;
                tracks.push(whiteNoiseStream.getTracks()[0]);
            }
        }
        tracks.push(localFilteredWebcamStream.getAudioTracks()[0]);


        if (localLiveStream && isUserWatchingMe(pc.userid)) {
            sources.push(localLiveStream);
            tracks.push(localLiveStream.getVideoTracks()[0]);
        } else {
            var whiteNoiseStream = whiteNoise();
            if(whiteNoiseStream){
                sources.push(whiteNoiseStream);
                tracks.push(whiteNoiseStream.getTracks()[0]);
            }
        }

        if (senders === 3) {
            pc.getSenders()[0].replaceTrack(tracks[0]);
            pc.getSenders()[1].replaceTrack(tracks[1]);
            pc.getSenders()[2].replaceTrack(tracks[2]);
        } else if (senders == 0) {
            pc.addTrack(tracks[0], sources[0]);
            pc.addTrack(tracks[1], sources[0]);
            pc.addTrack(tracks[2], sources[1]);
        } else {
            console.log("SENDERS " + senders);
            throw new Error("Peer connection has wrong number of senders! (" + senders + ")");
        }
    }

    const toggleWebcam = () => {
        isWebcam = !isWebcam;
        updateDeviceState();

    }
    const toggleScreenShare = () => {
        if (isScreenShare) {
            stopStreaming();
        } else {
            selectScreenShare();
        }
    }

    const stopStreaming = () => {
        send({ type: 'golive', livestate: false, livelabel: '' });
        isScreenShare = false;
        localLiveStream = null;
        replaceAllPeerMedia();
    }

    const isUserWatchingMe = (uuid) => {
        return (uuid in isWatching && isWatching[uuid]);
    }

    const amIWatching = (uuid) => {
        return (uuid in amWatching && amWatching[uuid]);
    }

    const setNotWatching = (uuid) => {
        if (uuid == fullscreenUserID) {
            closeFullscreen();
        }
        amWatching[uuid] = false;
        send({ type: 'letmesee', touserid: uuid, fromuserid: iam, message: false });
        populateRoom();
    }

    const setWatching = (uuid) => {
        console.log('Start watching ' + uuid);
        send({ type: 'letmesee', touserid: uuid, fromuserid: iam, message: true });
        amWatching[uuid] = true;
        populateRoom();
    }

    showStreamingOptions = (sources) => {
        console.log("STREAMING");
        console.log(sources);
        if (!sources) {
            // TODO Hide when null
            el.popupscreenshare.style.display = 'none';
        } else {
            el.popupscreenshare.style.display = 'flex';
            el.popupscreenshare.innerText = '';
            for (const source of sources) {
                console.log(source);

                var container = div({ className: 'appscreen', id:null });
                var text = document.createElement('nobr');
                text.innerText = source.name;
                container.appendChild(text);
                if (source.icon) {
                    var icon = document.createElement('img');
                    icon.src = source.icon;
                    icon.alt = 'Icon for ' + source.name;
                    icon.classList.add('appicon');
                    container.appendChild(icon);
                }
                if (source.thumbnail) {
                    var thumb = document.createElement('img');
                    thumb.src = source.thumbnail;
                    thumb.alt = 'Thumbnail for ' + source.name;
                    container.appendChild(thumb);
                }

                container.onclick = () => {
                    showStreamingOptions(null);
                    navigator.mediaDevices
                        .getUserMedia({
                            video: {
                                height: getConfig('streamresolution', 1080),
                                displaySurface: 'window',
                            },
                            audio: false
                        })
                        .then(stream => {
                            localLiveStream = stream;
                            console.log("Started Streaming window : " + stream.getVideoTracks()[0].label);
                            console.log(stream);
                            console.log(stream.getTracks())
                            replaceAllPeerMedia();
                            send({ type: 'golive', livestate: true, livelabel: stream.getTracks()[0].label });
                            isScreenShare = true;
                        })
                        .catch(err => {
                            console.error("error:", err);
                        });
                }

                el.popupscreenshare.appendChild(container);
            }
        }
    }

    const selectScreenShare = () => {
        // TODO In-app choice of windows?
        if (electronMode) {
            window.ipc.send('screenshare', []);
        } else {
            navigator.mediaDevices
                .getDisplayMedia(createScreenConstraints())
                .then(stream => {
                    localLiveStream = stream;
                    console.log("Started Streaming window : " + stream.getVideoTracks()[0].label);
                    console.log(stream);
                    console.log(stream.getTracks())
                    replaceAllPeerMedia();
                    send({ type: 'golive', livestate: true, livelabel: stream.getTracks()[0].label });
                    isScreenShare = true;
                })
                .catch(err => {
                    console.error("error:", err);
                });
        }
    };
    const toggleMuted = () => {
        isMute = !isMute
        updateDeviceState();
    }

    const updateDeviceState = () => {
        if (isInVoiceRoom()) {
            send({
                type: 'chatdev',
                audio: !isMute,
                video: isWebcam
            });
        }
        // Set Mic icon
        changeImg(el.toggleMute, isMute ? 'micoff.svg' : 'micon.svg');
        // Set Webcam icon
        changeImg(el.toggleWebcam, isWebcam ? 'webcamon.svg' : 'webcamoff.svg');
        console.log("AudioStream : " + (!isMute) + " VideoStream : " + isWebcam + " isVideoChat : " + isInVoiceRoom());
        if (isInVoiceRoom()) {
            // Set all local audio streams
            if (localWebcamStream) {
                localWebcamStream.getAudioTracks().forEach((audio) => {
                    audio.enabled = !isMute;
                });
                // Set all local video streams
                localWebcamStream.getVideoTracks().forEach((video) => {
                    video.enabled = isWebcam;
                });
            }
        } else {
            if (localWebcamStream) {
                // Set all local audio streams
                localWebcamStream.getAudioTracks().forEach((audio) => {
                    audio.enabled = false;
                });
                // Set all local video streams
                localWebcamStream.getVideoTracks().forEach((video) => {
                    video.enabled = false;
                });
            }
        }
    }


    const createAudioConstraints = () => {
        var deviceId = getConfig('microphonedevice', 'none');
        deviceId = (deviceId === 'undefined') ? 'none' : deviceId;
        deviceId = (deviceId !== 'none') ? { exact: deviceId } : undefined;
        var a = {
            sampleSize: 16,
            channelCount: 1,
            echoCancellation: getConfig('echocancel', true),
            noiseSuppression: getConfig('noisesupress', true),
            sampleRate: getConfig('audiobitrate', 96) * 1000,
            deviceId: deviceId
        };
        return a;
    }
    const createVideoConstraints = () => {
        if (noWebcamFound) {
            return false;
        }
        var deviceId = getConfig('cameradevice', 'none');
        deviceId = (deviceId === 'undefined') ? 'none' : deviceId;
        deviceId = (deviceId !== 'none') ? { exact: deviceId } : undefined;
        var a = {
            width: { min: 640, ideal: 1280 },
            height: { min: 400, ideal: 720 },
            framerate: 30,
            deviceId: deviceId
        };
        return a;
    }
    const createConstraints = () => {
        var constraints = {
            video: createVideoConstraints(),
            audio: createAudioConstraints()
        };
        return constraints;
    }
    const createScreenConstraints = () => {
        return {
            video: {
                cursor: 'motion',
                framerate: getConfig('streamrate', 30),
                height: getConfig('streamresolution', 1080),
            }/*,
            audio: {
                sampleSize: 16,
                channelCount: 2,
            }*/
        };
    }

    const changeImg = (img, src) => {
        img.src = 'img/' + theme + '/' + src;
        img.dataset.src = src;
    }

    changeFont = (fontName) => {
        console.log("Changing to font " + fontName);
        font = fontName;
        if (fontName) {
            el.app.style = 'font-family: ' + fontName;
        } else {
            el.app.style = '';
        }

    }

    changeTheme = (themeName) => {
        // Change CSS
        theme = themeName;
        var oldlinks = document.getElementsByTagName('link');
        var head = document.getElementsByTagName('head')[0];
        for(const link of oldlinks){
            head.removeChild(link);
        }

        var newlink = document.createElement('link');
        newlink.setAttribute('rel', 'stylesheet');
        newlink.setAttribute('type', 'text/css');
        newlink.setAttribute('href', 'css/' + themeName + '.css');
        head.appendChild(newlink);

        // Change IMGs!
        var oldimg = document.getElementsByTagName('img');
        for(const img of oldimg){
            if ('src' in img.dataset) {
                img.src = 'img/' + theme + '/' + img.dataset.src;
            }
        }
        // And... Image inputs?
        var oldimg2 = document.getElementsByTagName('input');
        for(const img of oldimg2){
            if (img.getAttribute('type') === 'image') {
                if ('src' in img.dataset) {
                    img.src = 'img/' + theme + '/' + img.dataset.src;
                }
            }
        }
    }


    const dragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.app.classList.add('draganddrop');
    }
    const dragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.app.classList.add('draganddrop');
    }
    const dragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.app.classList.remove('draganddrop');
    }
    const dragDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer && e.dataTransfer.files) {

            // User upload
            if (currentView) {
                var file = e.dataTransfer.files[0]
                cacheDragAndDropFile = file;
                populateRoom();
            }

            return false;
        }

        return false;
    }
    playToGroup = (videoUrl) => {
        send({ type: 'groupplay', 'url': videoUrl });
    }

    // Prepare callbacks 

    el.login.onsubmit = (e) => {
        e.preventDefault();
        processLogin();
        return false;
    }
    el.signup.onsubmit = (e) => {
        e.preventDefault();
        processSignup();
        return false;
    }
    el.inviteuserform.onsubmit = (e) => {
        e.preventDefault();
        var group = (<HTMLInputElement>el.inviteusergroup).value;
        if (group) {
            send({ type: 'invite', groupName: group })
        } else {
            el.inviteuserreply.innerText = 'Choose a group to create invite for';
        }
        return false;
    }
    el.toggleWebcam.onclick = toggleWebcam;
    el.toggleScreenShare.onclick = toggleScreenShare;
    el.toggleMute.onclick = toggleMuted;
    el.hangup.onclick = () => switchRoom(null);
    el.inviteclose.onclick = hideInvite;
    el.customclose.onclick = hideCustom;
    el.app.addEventListener('dragenter', dragEnter, false);
    el.app.addEventListener('dragover', dragOver, false);
    el.app.addEventListener('dragleave', dragLeave, false);
    el.app.addEventListener('drop', dragDrop, false)

    showdown.setOption('tables', true);

    // Connect to W
    if (!electronMode) {
        connect();
    }

    markupParser = new showdown.Converter();
    updatePerms();
    changeTheme(theme);
    changeFont(font);

    signUpCode = window.location.search
    signUpCode = signUpCode.replace(/\?/g, '');

    if (signUpCode) {
        // New user?
        showLoginWithSignUp();
    } else {
        // Straight to login page!
        showLogin();

    }
});