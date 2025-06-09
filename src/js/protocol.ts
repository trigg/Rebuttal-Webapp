/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { RebuttalClient, RebuttalClientInternal } from "./types";
import * as QRCode from 'qrcode';

export const ws_func = {
    "connect": (client: RebuttalClientInternal, data: any) => {
        client.el.login_image.src = client.el.signup_image.src = data.icon;
        client.el.login_desc.innerHTML = client.el.signup_desc.innerHTML = client.getApp().getParser().parse(data.message).innerHTML;

        if (!client.getApp().isRunningInElectron()) {
            client.getApp().updateThemes(data.themelist);
        }
        client.setContextMenus(data.contextmenus);

        /*if (!("v1" in data.protocols)) {
            client.el.login_reply.innerHTML = "Unable to connect : No protocol v1";
        }*/
        if (client.username && client.username.length > 0 && client.password && client.password.length > 0 && client.autoconnect) {
            // If the details are no longer correct, don't go into an infinite login loop
            client.send.login(client.username, client.password, "v1");
            client.password = "";
        }
    },
    "error": (client: RebuttalClient, data: any) => {
        client.el.login_reply.innerHTML = client.el.signup_reply.innerHTML = client.getApp().getParser().parse(data.message).innerHTML;
    },
    "disconnect": (client: RebuttalClient, data: any) => {
        client.cleanupStream(data.userid);
        client.setWatching(data.userid, false);
    },
    "login": (client: RebuttalClient, data: any) => {
        const { success, userid } = data;
        if (success) {
            client.showApp();
            client.setLoginReply("");
            client.setUserUUID(userid);
            client.getApp().playSound('login');
        } else {
            client.showLogin();
            client.setLoginReply('Invalid email or password');
        }
    },
    "refreshNow": () => {
        window.location.href = '/';
    },
    "updateUsers": (client: RebuttalClient, data: any) => {
        client.setUserList(data.userList);
    },
    "updateRooms": (client: RebuttalClient, data: any) => {
        client.setRoomList(data.roomList);
    },
    "chatdev": (client: RebuttalClient, data: any) => {
        client.updateRemoteDeviceState(data.userid, data.video, data.audio);
    },
    "joinRoom": (client: RebuttalClient, data: any) => {
        const { userid, roomid } = data;
        if (client.isInVoiceRoom(roomid)) {
            // Someone joined our room
            client.getApp().playSound('voicejoin');
        }
        if (client.userIsMe(userid)) {
            client.setCurrentVoiceRoom(roomid);
        }
        // TODO Maybe also ensure Client UI

        // Ensure App UI
        client.getApp().updateDeviceState();
    },
    "updateText": (client: RebuttalClient, data: any) => {
        const { roomid, segment, messages } = data;
        client.updateRoomMessageSegment(roomid, segment, messages);

    },
    "leaveRoom": (client: RebuttalClient, data: any) => {
        const { userid, roomid } = data;
        if (client.isInVoiceRoom(roomid)) {
            // Someone left our room
            client.getApp().playSound('voiceleave');
        }
        if (client.userIsMe(userid)) {
            client.setCurrentVoiceRoom(null);
            client.getApp().playSound('voiceleave');
        } else {
            client.cleanupStream(userid);
            client.setWatching(userid, false);
            client.setWatchingMe(userid, false);
        }
    },
    "video": (client: RebuttalClient, data: any) => {
        const { payload, touserid, fromuserid } = data;
        console.log("Got a video packet");
        if (!client.userIsMe(touserid)) {
            console.log("It wasn't for me. Discarding");
            return;
        }
        if (payload.candidate) {
            payload.type = 'candidate';
        }
        console.log(payload);

        switch (payload.type) {
            case "offer":
                {
                    const pc = client.getPeerConnection(fromuserid);
                    if (pc == undefined) {
                        console.log("Video offer but no PeerConnection");
                        return;
                    }
                    console.log("Got offer");

                    if (pc.signalingState != "stable") {
                        if (touserid < fromuserid) {
                            pc.setLocalDescription({ type: "rollback" })
                                .then(() => { console.log("SLD rollback complete") })
                                .catch((err) => { console.log("set Local Description failed to rollback " + err) });
                        } else {
                            pc.setRemoteDescription(payload).catch((e) => console.log("Unable to set remote description " + e))
                        }


                    }
                    pc.setRemoteDescription(payload)
                        .catch((e) => console.log("Unable to setRemoteDescription for offer " + e));
                    pc.createAnswer()
                        .then((answer) => {
                            const ld = pc.setLocalDescription(answer);
                            client.send.video(answer, fromuserid);
                            return ld;
                        })
                        .then(() => {
                            if (pc.localDescription != null) {

                                client.send.video(pc.localDescription, fromuserid);
                            }

                        })
                        .catch((e) => console.log("Unable to answer " + e));
                    break;
                }
            case "answer":
                {
                    const pc = client.getPeerConnection(fromuserid);

                    if (pc == undefined) {
                        console.log("Video answer but no PeerConnection");
                        return;
                    }
                    console.log("Got answer");

                    if (pc.signalingState == "stable") {
                        console.log("Ignoring answer while stable");
                        return
                    }


                    pc.setRemoteDescription(new RTCSessionDescription(payload))
                        .then(() => {
                            console.log("SRD from answer complete")
                            if (pc.localDescription != null) {
                                client.send.video(pc.localDescription, fromuserid);
                            }
                        }
                        ).catch(err => {
                            console.log(err);
                        });

                    break;
                }
            case "candidate":
                {
                    const pc = client.getPeerConnection(fromuserid);

                    if (pc == undefined) {
                        console.log("Video candidate but no PeerConnection");
                        return;
                    }
                    console.log("Got candidate");

                    pc.addIceCandidate(payload)
                        .then(() => {
                            console.log("IceCandidate from candidate complete")
                        })
                        .catch(e => {
                            console.log(e);
                        });

                    break;
                }
            case "fuckoff":
                console.log("Hanging up Peer");
                client.cleanupStream(fromuserid);
                break;
            case "callme":
                console.log("Got a callme");
                client.startCall(fromuserid);
                break;
        }
    },
    "updatePerms": (client: RebuttalClient, data: any) => {
        client.setUserPermissions(data.perms);
    },
    "updateGroups": (client: RebuttalClient, data: any) => {
        console.log(data);
        client.setServerGroups(Object.keys(data.groups));
    },
    'invite': (client: RebuttalClient, data: any) => {
        console.log("invite " + data);
        client.el.invite_user_reply.textContent = data.url;

        client.el.invite_user_reply.onclick = () => {
            navigator.clipboard.writeText(data.url).then(() => { }, () => { });
        }
        QRCode.toCanvas(client.el.invite_qr_code, data.url).catch((err) => { console.log("Unable to generate QR code " + err) });
    },
    'sendMessage': (client: RebuttalClient, data: any) => {
        const { roomid, message } = data;
        if (Notification.permission == 'granted') {
            if (client.userIsMe(message.userid)) {
                return;
            }
            const user = client.getUserByUUID(message.userid);

            console.log(message);
            if (user) {
                new Notification(user.name + " : " + message.text);
            }
        }
        if (client.getCurrentView() == roomid) {
            client.populateRoom();
        }
        client.getApp().playSound("newmessage");
    },
    'servermute': (client: RebuttalClient, data: any) => {
        const { userid, message } = data;
        const sideuser = document.getElementById('user-' + userid)
        const videouser = document.getElementById('videodiv-' + userid);
        if (sideuser != null) {
            if (message) {
                sideuser.classList.add('usermuted');
                if (videouser) { videouser.classList.add('videodivmuted'); }
                if (client.getApp().isRunningInElectron()) { window.ipc.send('muted', userid); }
            } else {
                sideuser.classList.remove('usermuted');
                if (videouser) { videouser.classList.remove('videodivmuted'); }
                if (client.getApp().isRunningInElectron()) { window.ipc.send('unmuted', userid); }
            }
        }
    },
    'talking': (client: RebuttalClient, data: any) => {
        const { userid, talking } = data;
        const sideuser = document.getElementById('user-' + userid)
        const videouser = document.getElementById('videodiv-' + userid);
        if (talking) {
            if (sideuser) { sideuser.classList.add('usertalking'); }
            if (videouser) { videouser.classList.add('videodivtalking'); }
            //if (client.getApp().isRunningInElectron()) { window.ipc.send('talkstart', userid); }
        } else {
            if (sideuser) { sideuser.classList.remove('usertalking'); }
            if (videouser) { videouser.classList.remove('videodivtalking'); }
            //if (client.getApp().isRunningInElectron()) { window.ipc.send('talkstop', userid); }
        }
    },
    'golive': (client: RebuttalClient, data: any) => {
        const { livestate, livelabel, userid, roomid } = data;
        const user = client.getUserByUUID(userid);
        console.log(data);
        if (user) {
            user.livestate = livestate;
            user.livelabel = livelabel;
        }
        if (!livestate) {
            client.setWatching(userid, false);
        }
        if (client.setCurrentVoiceRoom(roomid)) {
            client.getApp().playSound("streamstarted");
        }
        client.populateRoom();
    },
    'letmesee': (client: RebuttalClient, data: any) => {
        const { touserid, fromuserid, message } = data;
        if (client.userIsMe(touserid)) {
            client.setWatching(fromuserid, message);
        }
        client.replacePeerMedia(fromuserid);
        client.populateRoom();
    },
    'presentcustomwindow': (client: RebuttalClient, data: any) => {
        client.showCustomWindow(data.window);
    }
}