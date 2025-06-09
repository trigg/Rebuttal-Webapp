// Instance of types.ts RebuttalClient
import { ws_func } from './protocol';
import { create_sender } from './sender';
import { type Room, type User, ServerState, type RebuttalClientInternal, type RebuttalApp, FullscreenType, type ReconstituteValues, Message, ContextMenuItem, UserUUID, ConnectionUUID, RoomUUID, is_uuid, ClientCredentials } from './types';
import client_template from '../templates/client.html';
import client_template_text_segment from '../templates/client-text-segment.html';
import client_template_text_message from '../templates/client-text-message.html';
import client_template_video from '../templates/client-video.html';
import client_template_text_complete from '../templates/client-text-autocomplete.html';
import client_template_room_selector from '../templates/client-room-selector.html';
import client_template_user_selector from '../templates/client-user-selector.html';
import app_template_server_icon from '../templates/app_server_icon.html';
import { drawBokehEffect, load } from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

console.log('Using TensorFlow backend: ', tf.getBackend());
export function create_client(connection_id: ConnectionUUID, app: RebuttalApp, hostname: string, credentials: ClientCredentials) {

    // Create room HTML.
    const app_window = document.getElementById("appWindow");
    const client_html = client_template.replaceAll("{{client}}", connection_id);
    if (app_window != null) {
        app_window.innerHTML = app_window.innerHTML + client_html;
    }

    const login_form = <HTMLFormElement>document.getElementById(connection_id + "-login-form");
    const login_view = <HTMLDivElement>document.getElementById(connection_id + "-login-view");
    const login_desc = <HTMLParagraphElement>document.getElementById(connection_id + "-login-desc");
    const login_name = <HTMLInputElement>document.getElementById(connection_id + "-login-name");
    const login_password = <HTMLInputElement>document.getElementById(connection_id + "-login-pass");
    const login_image = <HTMLImageElement>document.getElementById(connection_id + "-login-img");
    const login_reply = <HTMLParagraphElement>document.getElementById(connection_id + "-login-reply");

    const signup_view = <HTMLDivElement>document.getElementById(connection_id + "-signup-view");
    const signup_form = <HTMLFormElement>document.getElementById(connection_id + "-signup-form");
    const signup_image = <HTMLImageElement>document.getElementById(connection_id + "-signup-img");
    const signup_desc = <HTMLParagraphElement>document.getElementById(connection_id + "-signup-desc");
    const signup_friendly_name = <HTMLInputElement>document.getElementById(connection_id + "-signup-friendly-name");
    const signup_name = <HTMLInputElement>document.getElementById(connection_id + "-signup-name");
    const signup_pass1 = <HTMLInputElement>document.getElementById(connection_id + "-signup-pass");
    const signup_pass2 = <HTMLInputElement>document.getElementById(connection_id + "-signup-pass2");
    const signup_reply = <HTMLParagraphElement>document.getElementById(connection_id + "-signup-reply");

    const room_list = <HTMLDivElement>document.getElementById(connection_id + "-room-list");
    const user_list = <HTMLDivElement>document.getElementById(connection_id + "-user-list");
    const core_view = <HTMLDivElement>document.getElementById(connection_id + "-core-view");

    const text_view = <HTMLDivElement>document.getElementById(connection_id + "-text-view");
    const text_chat_scroller = <HTMLDivElement>document.getElementById(connection_id + "-chat-scroller");
    const text_input = <HTMLInputElement>document.getElementById(connection_id + "-text-input");
    const text_input_form = <HTMLFormElement>document.getElementById(connection_id + "-text-input-form");
    const text_drag_and_drop_outer = <HTMLDivElement>document.getElementById(connection_id + "-drag-and-drop-outer");
    const text_drag_and_drop = <HTMLDivElement>document.getElementById(connection_id + "-drag-and-drop");
    const text_drag_and_drop_image = <HTMLImageElement>document.getElementById(connection_id + "-drag-and-drop-img");
    const text_drag_and_drop_cancel = <HTMLDivElement>document.getElementById(connection_id + "-drag-and-drop-cancel");
    const text_auto_complete = <HTMLDivElement>document.getElementById(connection_id + "-autocomplete");
    const load_more_text = <HTMLDivElement>document.getElementById(connection_id + "-load-more-text");

    const add_room_button = <HTMLDivElement>document.getElementById(connection_id + "-room-add");
    const add_user_button = <HTMLDivElement>document.getElementById(connection_id + "-user-add");

    const popup_container = <HTMLDivElement>document.getElementById(connection_id + "-popup-container");

    const invite_popup = <HTMLDivElement>document.getElementById(connection_id + "-popup-invite");
    const invite = <HTMLDivElement>document.getElementById(connection_id + "-invite");
    const invite_close = <HTMLDivElement>document.getElementById(connection_id + "-invite-close");
    const invite_user_groups = <HTMLSelectElement>document.getElementById(connection_id + "-invite-user-group");
    const invite_user_reply = <HTMLDivElement>document.getElementById(connection_id + "-invite-user-reply");
    const invite_qr_code = <HTMLCanvasElement>document.getElementById(connection_id + "-invite-qr-code");
    const invite_form = <HTMLFormElement>document.getElementById(connection_id + "-invite-user-form");

    const voice_view = <HTMLDivElement>document.getElementById(connection_id + "-voice-view");

    const rebuttal: RebuttalClientInternal = {
        app,
        ws: null,
        user_list: [],
        room_list: [],
        messages: new Map(),
        current_view: null,
        current_voice: null,
        connection_id,
        context_menus: new Map(),
        send: create_sender(),
        popups: {},
        state: ServerState.NO_CONNECTION,
        server_image_url: "",
        server_name: "",
        user_uuid: null,
        user_friendly_name: "",
        user_email: "",
        user_permissions: [],
        server_group_names: [],
        i_am_watching: [],
        watching_me: [],
        last_chat_y_pos: 0,
        cached_file_upload: null,
        peer_connection: new Map(),
        cached_tags: [],
        autocompleteing: false,
        autocompletestart: null,
        autocompleteselection: 0,
        live_streams: new Map(),
        webcam_streams: new Map(),
        hostname,
        username: credentials.username,
        password: credentials.password,
        autoconnect: credentials.autoconnect,
        invite: credentials.invite,
        skip_scroll_calc: false,
        el: {
            load_more_text,
            room_list,
            user_list,
            core_view,
            text_view,
            text_input,
            voice_view,
            login_form,
            login_view,
            login_name,
            login_password,
            login_image,
            login_desc,
            login_reply,
            text_chat_scroller,
            text_input_form,
            text_auto_complete,
            dnd: text_drag_and_drop,
            dnd_outer: text_drag_and_drop_outer,
            dnd_img: text_drag_and_drop_image,
            dnd_cancel: text_drag_and_drop_cancel,
            add_room_button,
            add_user_button,
            invite,
            invite_close,
            invite_popup,
            invite_qr_code,
            invite_user_groups,
            invite_user_reply,
            invite_form,
            signup_view,
            signup_desc,
            signup_form,
            signup_image,
            signup_friendly_name,
            signup_name,
            signup_pass1,
            signup_pass2,
            signup_reply,
            popup_container
        },
        showSignUp() {
            this.el.login_view.style.display = "none";
            this.el.core_view.style.display = "none";
            this.el.signup_view.style.display = '';
        },
        showApp() {
            this.el.core_view.style.display = "";
            this.el.login_view.style.display = "none";
            this.el.signup_view.style.display = 'none';
        },
        showLogin() {
            this.el.core_view.style.display = "none";
            this.el.login_view.style.display = "";
            this.el.signup_view.style.display = 'none';
        },
        setLoginReply(message: string) {
            this.el.login_reply.innerHTML = this.el.signup_reply.innerHTML = this.getApp().getParser().parse(message).innerHTML;
        },
        setUserUUID(userid: UserUUID) {
            this.user_uuid = userid;
        },
        setUserList(userlist: User[]) {
            this.user_list = userlist;
            this.populateUserList();
        },
        getApp: function (): RebuttalApp {
            return app;
        },
        getState: function (): ServerState {
            return this.state;
        },
        getServerImage: function (): string {
            return this.server_image_url;
        },
        getServerName: function (): string {
            return this.server_name;
        },
        getUserUUID: function (): UserUUID | null {
            return this.user_uuid;
        },
        getUsername: function (): string {
            return this.user_friendly_name;
        },
        getLogin: function (): string {
            return this.user_email;
        },
        getUserPermissions: function (): string[] {
            return this.user_permissions;
        },
        setUserPermissions(data: string[]) {
            this.user_permissions = data;
            this.updatePerms();
        },
        updatePerms() {
            this.el.add_room_button.style.display = this.has_perm("createRoom") ? '' : 'none';
            this.el.add_user_button.style.display = this.has_perm("inviteUserAny") ? '' : 'none';
        },
        getServerGroups: function (): string[] {
            return this.server_group_names;
        },
        setServerGroups(groups: string[]) {
            this.server_group_names = groups;

            this.el.invite_user_groups.innerHTML = '';
            for (const group_name of groups) {
                const option = this.reconstitute("<option value='{{value}}'>{{value}}</option>", { value: group_name });
                this.el.invite_user_groups.appendChild(option);
            }
        },
        getRoom(roomid: RoomUUID): Room | null {
            for (const room of this.room_list) {
                if (room.id == roomid) {
                    return room;
                }
            }
            return null;
        },
        getRoomList: function (): Room[] {
            return this.room_list;
        },
        setRoomList: function (roomlist: Room[]) {
            this.room_list = roomlist;
            this.populateRoomList();
            this.populateRoom();
        },
        getUserList: function (): User[] {
            return this.user_list;
        },
        updateRoomMessageSegment: function (roomid: RoomUUID, idx: number, messages: Message[]) {
            if (!this.messages.has(roomid)) {
                this.messages.set(roomid, new Map());
            }
            const room = this.messages.get(roomid);
            if (room != undefined) {
                room.set(idx, messages);
                if (roomid == this.current_view) {
                    this.el.load_more_text.textContent = "";
                    this.populateRoom();
                }

            }
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setContextMenus(new_menus: Map<string, ContextMenuItem[]>) {
            //this.context_menus = new_menus;
            // TODO Populate anything?
        },
        getCurrentView: function (): Room | null {
            if (this.current_view != null) {
                for (const room of this.room_list) {
                    if (room.id == this.current_view) {
                        return room;
                    }
                }
            }
            return null;
        },
        setCurrentView(roomid: RoomUUID): void {
            const room = this.getRoom(roomid);
            if (room != null) {
                if (room.type == 'voice') {
                    // Viewing a voice room joins it.
                    if (this.current_voice == null) {
                        this.current_voice = roomid;
                        this.current_view = roomid;

                        this.send.join_room(roomid);
                    } else {
                        if (this.current_voice == roomid) {
                            // We're already chatting here, now we want to look at it again
                            this.current_view = roomid;
                        } else {
                            this.current_voice = roomid;
                            this.current_view = roomid;
                            this.send.leave_room();
                            this.send.join_room(roomid);
                            // TODO Confirmation window
                            // Ok => Leave last room, join this one
                            // Cancel => void
                        }
                    }
                } else if (room.type == 'text') {
                    this.current_view = roomid;
                    this.send.get_messages(roomid);
                }
                this.populateRoomList();
                this.populateRoom();
            }
        },
        getCurrentVoiceRoom: function (): Room | null {
            if (this.current_voice != null) {
                for (const room of this.room_list) {
                    if (room.id == this.current_voice) {
                        return room;
                    }
                }
            }
            return null;
        },
        isShowingPopup: function (): boolean {
            throw new Error('Function not implemented.');
        },
        getUserByUUID: function (uuid: string): User | null {
            for (const user of this.user_list) {
                if (user.id == uuid) {
                    return user;
                }
            }
            return null;
        },
        getUsersByPartialName: function (bit: string): User[] {
            const ret: User[] = [];
            for (const user of this.user_list) {
                if (user.name.toLowerCase().indexOf(bit.toLowerCase()) == 0) {
                    ret.push(user);
                }
            };
            return ret;
        },
        loadMoreText: function () {
            if (this.current_view == null) {
                return;
            }
            if (!this.messages.has(this.current_view)) {
                console.log("We currently have no room.");
                return;
            }
            const segment = this.getEarliestTextSegment(this.current_view);
            if (segment != undefined && segment <= 0) {
                return;
            }
            this.el.load_more_text.textContent = "Loading more...";
            if (segment == undefined) {
                this.send.get_messages(this.current_view);
            } else {
                this.send.get_messages(this.current_view, segment - 1);
            }
            // If this was caused by putting scroll to top then reposition so we don't loop on it
            if (this.el.text_chat_scroller.scrollTop < 1) {
                this.el.text_chat_scroller.scrollTop = 1;
            }
        },
        connect: function (): void {
            let ipc_location: string = "";
            if (!app.isRunningInElectron()) {
                ipc_location = "wss://" + location.hostname + (location.port ? ':' + location.port : '') + "/ipc";
            } else {
                if (!this.hostname) {
                    return;
                }
                ipc_location = this.hostname;
            }
            if (ipc_location == "") {
                throw new Error("No url to connect to");
            }
            try {
                this.ws = new WebSocket(ipc_location);
            } catch (e) {
                console.log(e);
                return;
            }
            this.send.ws = this.ws;
            this.ws.onmessage = (message) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                const data: any = JSON.parse(message.data);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (data['type'] in ws_func) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    ws_func[data['type']](this, data);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    console.log("Unknown message type : " + data['type']);
                    console.log(data);
                }
            };
            this.ws.onclose = () => {
                console.log("Connection lost");
                this.showLogin();
                this.el.login_reply.textContent = "Connection lost";
                this.ws = null;
                //app.setActiveTab(null);
                //app.removeTab(this.connection_id);
            };
        },
        populateStreamsInVoiceRoom: function (): void {
            throw new Error('Function not implemented.');
        },
        replaceAllPeerMedia: function (): void {
            const vr = this.getCurrentVoiceRoom();
            if (vr != null) {
                for (const user of vr.userlist) {
                    this.replacePeerMedia(user.id);
                }
            }
            this.populateRoom();
        },
        replacePeerMedia: function (user: UserUUID): void {
            const pc = this.peer_connection.get(user);
            if (!pc) {
                console.log("Not replacing peer media : no PC")
                return;
            }

            const blur_canvas = <HTMLCanvasElement>document.getElementById('blurcanvas');
            const local_webcam = this.getApp().getLocalWebcamStream();
            const local_filtered_stream = this.getApp().getLocalFilteredStream();
            const local_live_stream = this.getApp().getLocalLiveStream();


            const expected_stream = (local_webcam ? 2 : 0) + (local_live_stream ? 1 : 0);
            // Cull streams if needed
            // Remove past two tracks
            const senders = pc.getSenders();
            for (let idx = expected_stream; idx < senders.length; idx++) {
                pc.removeTrack(senders[idx]);
            }
            if (local_webcam) {
                // Add one Video stream
                let video_track: MediaStreamTrack | null = null
                if (this.getApp().getSettings().getBlurUser() && blur_canvas) {
                    video_track = blur_canvas.captureStream().getVideoTracks()[0];
                } else if (local_webcam.getVideoTracks().length > 0) {
                    video_track = local_webcam.getVideoTracks()[0];
                } else {
                    throw new Error("No video stream available, somehow");
                }
                if (senders.length < 1) {
                    pc.addTrack(video_track, local_webcam);
                } else {
                    senders[0].replaceTrack(video_track).catch(() => { console.log("Unable to replace webcam video stream") });
                }

                // Add one Audio stream
                let audio_track: MediaStreamTrack | null = null;
                if (this.getApp().getSettings().getDetectTalking() && local_filtered_stream && local_filtered_stream.getAudioTracks().length > 0) {
                    audio_track = local_filtered_stream.getAudioTracks()[0];
                } else if (local_webcam.getAudioTracks().length > 0) {
                    audio_track = local_webcam.getAudioTracks()[0]
                } else {
                    throw new Error("No audio stream available, somehow");
                }
                if (senders.length < 2) {
                    pc.addTrack(audio_track, local_webcam);
                } else {
                    senders[1].replaceTrack(audio_track).catch(() => { console.log("Unable to replace webcam audio stream") });
                }
            }
            if (local_live_stream) {
                // Add one Video Stream
                let video_track: MediaStreamTrack | null = null;
                if (local_live_stream && this.isWatchingMe(user)) {
                    video_track = local_live_stream.getVideoTracks()[0];
                } else {
                    const white_noise_stream = this.getApp().getWhiteNoise();
                    if (white_noise_stream) {
                        video_track = white_noise_stream.getTracks()[0];
                    }
                }
                if (video_track == null) {
                    throw new Error("Got a null livestream");
                }
                if (senders.length < 1) {
                    pc.addTrack(video_track, local_live_stream);
                } else {
                    senders[2].replaceTrack(video_track).catch(() => { console.log("Unable to replace webcam video stream") });
                }
            }
        },
        cleanupStream: function (userid: UserUUID) {
            const pc = this.peer_connection.get(userid);
            if (pc) {
                pc.close();
                this.peer_connection.delete(userid);
            }
            this.webcam_streams.delete(userid);
            this.live_streams.delete(userid);
            const video_pair = document.getElementById(connection_id + "-video-pair-" + userid);
            if (video_pair) {
                video_pair.outerHTML = '';
            }
        },
        amIWatching(userid: UserUUID): boolean {
            return this.i_am_watching.includes(userid);
        },
        isWatchingMe(userid: UserUUID): boolean {
            return this.watching_me.includes(userid);
        },
        setWatchingMe(userid, watching) {
            if (watching) {
                this.watching_me.push(userid);
            } else {
                this.watching_me = this.watching_me.filter(item => item != userid);
            }
        },
        setWatching: function (user: UserUUID, watching: boolean) {
            if ((user in this.i_am_watching) == watching) {
                return;
            }
            if (watching) {
                this.i_am_watching.push(user);
            } else {
                // We no longer have data from this stream, if they're fullscreen close it
                const metadata = this.getApp().getFullscreenMetadata();
                if (metadata && metadata.type == FullscreenType.WEBCAM && 'userid' in metadata && metadata.userid == user) {
                    this.getApp().closeFullscreen();
                }
                this.i_am_watching = this.i_am_watching.filter(item => item != user);
            }
            this.populateRoom();
            this.send.letmesee(user, this.getUserUUID()!, watching);

        },
        populateRoom() {
            if (!this.current_view) {
                // TODO A server page, or client view for this connection to server
                this.el.core_view.textContent = '';
                return;
            }
            const room = this.getCurrentView();
            const voiceroom = this.getCurrentVoiceRoom();
            if (!room) {
                // Error, maybe the server hasn't updated us correctly that a room was added
                this.el.core_view.textContent = '';
                return;
            }
            if (voiceroom) {
                // Collect all Video Pairs from view
                let userid_elements: HTMLElement[] = [];
                for (const child_element of this.el.voice_view.children) {
                    if (child_element instanceof HTMLElement) {
                        if ('userid' in child_element.dataset && typeof child_element.dataset.userid == 'string') {
                            userid_elements.push(child_element);
                        }
                    }
                }
                // Update all users, remove from above list
                for (const user of room.userlist) {
                    this.populateRoomVideo(user);
                    userid_elements = userid_elements.filter((x) => (x.dataset.userid != user.id));
                };
                // Any left over no longer exist, remove from view
                for (const delete_element of userid_elements) {
                    this.el.voice_view.removeChild(delete_element);
                }
                this.el.voice_view.style.display = '';
                this.el.text_view.style.display = 'none';
                this.el.text_input.style.display = 'none';
            } else {
                this.el.voice_view.innerHTML = ''; // Blank after user leaves room
            }
            if (room.type === 'text') {
                this.el.voice_view.style.display = 'none';
                this.el.text_view.style.display = '';
                this.el.text_input.style.display = '';
                const curent_view_messages = this.messages.get(this.current_view);
                if (curent_view_messages == undefined) {
                    // No action, we currently havn't been told about this room.
                } else {
                    let previous_user_uuid: UserUUID | null = null;
                    for (const segment_key of curent_view_messages.keys()) {
                        const segment_div = this.get_or_reconstitute(this.connection_id + "-text-segment-" + segment_key, client_template_text_segment, { segment: "" + segment_key })
                        const segment = curent_view_messages.get(segment_key);
                        if (segment != undefined) {
                            for (const message of segment) {

                                const message_div = this.get_or_reconstitute(this.connection_id + "-text-message-" + message.idx, client_template_text_message, { messageid: "" + message.idx });
                                const message_user_text = <HTMLElement>message_div.getElementsByClassName("messageusertext")[0];
                                const message_user_image = <HTMLImageElement>message_div.getElementsByClassName("messageavatar")[0];
                                const message_message = <HTMLSpanElement>message_div.getElementsByClassName("messagemessage")[0];
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const message_time = <HTMLSpanElement>message_div.getElementsByClassName("messagetime")[0];
                                const message_user = <HTMLSpanElement>message_div.getElementsByClassName("messageuser")[0];
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const message_edit = <HTMLSpanElement>message_div.getElementsByClassName("messageedit")[0];
                                const message_url = <HTMLLinkElement>message_div.getElementsByClassName("messageurl")[0];
                                const message_img = <HTMLImageElement>message_div.getElementsByClassName("messageimg")[0];
                                if (!message.userid) {
                                    message_message.textContent = "Message has no user";
                                    continue;
                                }
                                segment_div.append(message_div);
                                if (message.type && message.type === 'webhook' && message.img) {
                                    message_user_text.textContent = message.username;
                                    message_user_image.src = message.img;
                                    message_message.innerHTML = this.getApp().getParser().parse(message.text).innerHTML;
                                    message_message.onclick = () => window.open(message.url, '_blank')?.focus()
                                } else {
                                    const user = this.getUserByUUID(message.userid);
                                    const username = user ? user.name : '[deleted user]';
                                    const me = this.getUserUUID();
                                    if (message.tags && me && message.tags.includes(me)) {
                                        message_div.classList.add('tagged');
                                    }
                                    if (user && user.avatar) {
                                        message_user_image.src = user.avatar;
                                    } else {
                                        // Use theme-specific avatar
                                        message_user_image.src = 'img/' + this.getApp().getSettings().getTheme() + '/avatar.svg';
                                        message_user_image.dataset.src = 'avatar.svg';
                                    }
                                    message_user_text.textContent = username + ":";
                                    if ('text' in message) {
                                        message_message.innerHTML = this.getApp().getParser().parse(message.text).innerHTML;
                                        if (!message_message.oncontextmenu) {

                                            message_message.oncontextmenu = (e) => {
                                                e.preventDefault();
                                                const list = this.populate_context_menu('message', "" + message.idx);
                                                if (message.userid == this.getUserUUID() || this.has_perm('changeMessage')) {
                                                    list.push(
                                                        {
                                                            text: 'Edit Message',
                                                            callback: () => {
                                                                this.popup_change_message(message);
                                                            },
                                                            class: 'contexteditmessage'
                                                        });
                                                }
                                                if (this.has_perm('removeMessage')) {
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
                                                this.getApp().show_context_menu(list, e);

                                            }
                                        }
                                    }

                                    if (message.url) {
                                        message_url.setAttribute('href', message.url);
                                        message_url.textContent = message.url;
                                        message_url.style.display = '';
                                    } else {
                                        message_url.style.display = 'none';
                                    }
                                    if (message.img && message.height && message.width) {
                                        message_img.setAttribute('height', "" + message.height);
                                        message_img.setAttribute('width', "" + message.width);
                                        message_img.src = message['img'];
                                        message_img.setAttribute('alt', 'user submitted image');
                                        message_img.style.display = "flex";
                                    } else {
                                        message_img.style.display = 'none';
                                    }
                                }
                                if (this.getApp().getSettings().getHideDuplicateName()) {
                                    if (previous_user_uuid == message.userid) {
                                        message_user.style.opacity = "0.0";
                                        previous_user_uuid = message.userid;
                                    }
                                }
                            }
                        }

                        this.el.text_chat_scroller.appendChild(segment_div);

                    }
                    if (this.el.text_chat_scroller.clientHeight >= this.el.text_chat_scroller.scrollHeight) {
                        console.log("Not a full screen of text yet...");
                        const earliest_seg_num = this.getEarliestTextSegment(this.current_view);
                        if (earliest_seg_num == undefined || earliest_seg_num > 0) {
                            this.loadMoreText();
                        }
                    }
                    // If the user was scrolled to the bottom, move down to bottom of new message.
                    // If the user has scrolled away to another message, don't jolt the screen! 
                    if (this.last_chat_y_pos == 0) {
                        this.skip_scroll_calc = true;
                        this.el.text_chat_scroller.scrollTo(0, this.el.text_chat_scroller.scrollHeight - this.last_chat_y_pos - this.el.text_chat_scroller.clientHeight);
                        this.skip_scroll_calc = false;
                    } else {
                        // TODO Show a 'new messages!' thing to alert the user they might be missing convo
                    }
                }
                // Input Section
                if (this.cached_file_upload) {
                    this.el.dnd_outer.style.display = '';
                    const image = this.el.dnd_img;
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        if (event.target) {
                            const result = event.target.result;
                            if (result && typeof (result) == "string") {
                                image.src = result;
                            }
                        }
                    };
                    reader.readAsDataURL(this.cached_file_upload);
                } else {
                    this.el.dnd_outer.style.display = 'none';
                }
            }
        },
        populateRoomList() {
            for (const room of this.room_list) {
                if (room.type == 'text' && this.current_view == null) {
                    this.setCurrentView(room.id);
                    return; // We'll return after the current view is set
                }

                const room_label = this.get_or_reconstitute(this.connection_id + "-room-" + room.id + "-selector", client_template_room_selector,
                    {
                        roomid: room.id,
                        roomname: room.name,
                        roomimg: room.type == 'text' ? 'room.svg' : 'vroom.svg'
                    }
                );

                room_label.onclick = () => this.setCurrentView(room.id);
                (<HTMLDivElement>room_label.getElementsByClassName("room-selector-text")[0]).textContent = room.name;


                room_label.oncontextmenu = (e) => {
                    e.preventDefault();
                    const list = this.populate_context_menu('voiceroom', room.id);
                    const send = this.send;
                    if (room.type == 'voice') {
                        if (room.id == this.current_voice) {
                            list.push({ text: "Leave chat", class: "", callback: () => { send.leave_room() } })
                        } else {
                            list.push({
                                text: "Join chat",
                                class: "",
                                callback: () => { send.join_room(room.id) }
                            });
                        }
                    }
                };

                if (room_label.parentElement != this.el.room_list) {
                    this.el.room_list.appendChild(room_label);
                }

            }

        },
        getEarliestTextSegment(roomid: RoomUUID): number | undefined {
            const room_messages = this.messages.get(roomid);
            if (room_messages == undefined) {
                return undefined;
            }
            const keys = room_messages.keys();
            const seg_id = Math.min(...keys);
            return seg_id;
        },
        populateUserList() {
            for (const user of this.user_list) {
                const user_label = this.get_or_reconstitute(this.connection_id + "-user-" + user.id + "-selector", client_template_user_selector,
                    {
                        userid: user.id,
                        username: user.name,
                    }
                );

                const user_text = <HTMLDivElement>user_label.getElementsByClassName("user-selector-text")[0];
                const user_img = <HTMLImageElement>user_label.getElementsByClassName('user-selector-image')[0];
                user_text.textContent = user.name;
                if (user.avatar) {
                    user_img.src = user.avatar;
                }

                if (user_label.parentElement != this.el.user_list) {
                    this.el.user_list.appendChild(user_label);
                }

            }
        },
        getLiveStream(userid: UserUUID): MediaStream | null {
            if (userid == this.getUserUUID()) {
                return this.getApp().getLocalLiveStream();
            }
            const stream = this.live_streams.get(userid);
            return stream ? stream : null;
        },
        getWebcamStream(userid: UserUUID): MediaStream | null {
            if (userid == this.getUserUUID()) {
                return this.getApp().getLocalWebcamStream();
            }
            const stream = this.webcam_streams.get(userid);
            return stream ? stream : null;
        },
        populateRoomVideo(user: User) {
            const user_video = this.get_or_reconstitute(this.connection_id + "-video-pair-" + user.id, client_template_video, { userid: user.id, avatar: user.avatar ? user.avatar : "", uservolume: "1.0" });
            this.el.voice_view.appendChild(user_video);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const video_pair = <HTMLDivElement>user_video.getElementsByClassName("videopair")[0];

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const webcam_div = <HTMLDivElement>user_video.getElementsByClassName("videodiv")[0];
            const webcam_video = <HTMLVideoElement>user_video.getElementsByClassName('videovideo')[0];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const webcam_no_video = <HTMLImageElement>user_video.getElementsByClassName('videonovideo')[0];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const webcam_no_audio = <HTMLImageElement>user_video.getElementsByClassName('videonoaudio')[0];
            const webcam_no_conn = <HTMLImageElement>user_video.getElementsByClassName("videonoconn")[0];

            const livestream_container = <HTMLDivElement>user_video.getElementsByClassName("livediv")[0];
            const livestream_video = <HTMLVideoElement>user_video.getElementsByClassName("livestreamvideo")[0];
            const livestream_message = <HTMLDivElement>user_video.getElementsByClassName("livestreamavailable")[0];
            // if (user.livestate) {
            livestream_container.style.display = '';
            if (this.amIWatching(user.id)) {

                const live_stream_media = this.getLiveStream(user.id);
                livestream_video.srcObject = live_stream_media;

                livestream_container.oncontextmenu = (e) => {
                    e.preventDefault();
                    const list = this.populate_context_menu('livestream', user.id);

                    list.push(
                        {
                            text: 'Stop watching',
                            callback: () => {
                                console.log("Stop watching " + user.id);
                                this.setWatching(user.id, false);
                            },
                            class: 'contextstopstream'
                        });
                    list.push(
                        {
                            text: 'Fullscreen',
                            callback: () => {
                                this.getApp().setFullscreenElement(livestream_video, { userid: user.id, type: FullscreenType.LIVESTREAM });
                            },
                            class: 'contextfullscreen'
                        }
                    )
                    this.getApp().show_context_menu(list, e);
                }
                livestream_message.style.display = 'none';
                livestream_video.style.display = '';
            } else {
                livestream_message.textContent = user.name + " is streaming " + user.livelabel;

                livestream_container.oncontextmenu = (e) => {
                    e.preventDefault();
                    const list = this.populate_context_menu('livestream', user.id);

                    list.push(
                        {
                            text: 'Watch',
                            callback: () => {
                                this.setWatching(user.id, true);
                            },
                            class: 'contextstartstream'
                        });
                    this.getApp().show_context_menu(list, e);
                }

                livestream_container.onclick = () => {
                    this.setWatching(user.id, true);
                }

                livestream_message.style.display = '';
                livestream_video.style.display = 'none';
            }
            //} else {
            //    livestream_container.style.display = 'none';
            //}

            // If Me
            if (user.id === this.getUserUUID()) {
                const canvas = <HTMLCanvasElement>document.getElementById(this.connection_id + "-blur-" + user.id);
                if (canvas == null) {
                    throw new Error("No canvas for user");
                }

                webcam_video.muted = true;
                webcam_no_conn.style.display = 'none';
                const stream = this.getWebcamStream(user.id);
                console.log("Setting webcam stream " + user.id + (stream ? " with a stream" : " without a stream"));
                webcam_video.srcObject = stream;

                if (this.getApp().getSettings().getWebcamFlip()) {
                    webcam_video.style.transform = 'rotateY(180deg)';
                    canvas.style.transform = 'rotateY(180deg);';
                }
                if (this.getApp().getSettings().getBlurUser()) {
                    webcam_video.hidden = true;
                    canvas.hidden = false;
                    webcam_video.onloadeddata = () => {
                        console.log("Attach onload for bodypix");
                        load({
                            architecture: 'MobileNetV1',
                            multiplier: 0.75,
                            outputStride: 16,
                            quantBytes: 4,
                        })
                            .then(net => this.performBodyPix(net, canvas, webcam_video))
                            .catch(err => console.log(err));

                    }
                } else {
                    webcam_video.muted = true;
                    webcam_video.classList.add('selfie');

                    webcam_video.hidden = false;
                    canvas.hidden = true;

                }
            } else {
                const stream = this.getWebcamStream(user.id);
                if (!stream) {
                    this.startCall(user.id);
                }
                webcam_video.srcObject = stream;
            }

        },
        startCall(userid: UserUUID) {
            console.log("Starting call");
            if (this.user_uuid == null) {
                throw new Error("Cannot start call without being connected");
            }
            if (this.peer_connection.has(userid)) {
                console.log("Already in a call with this peer");
                return;
            }
            console.log("Creating a peer");
            this.createPeerConnection(userid);
        },
        getPeerConnection(userid: UserUUID): RTCPeerConnection | undefined {
            return this.peer_connection.get(userid);
        },
        createPeerConnection(userid: UserUUID): void {
            if (!this.user_uuid) {
                throw new Error("Cannot create peers without knowing our User ID");
            }
            const peer = this.peer_connection.get(userid);
            if (this.userIsMe(userid)) {
                throw new Error("That's us.");
            }
            if (peer != undefined) {
                return;
            }
            const pc = new RTCPeerConnection({
                bundlePolicy: 'max-bundle',
                iceServers: [
                    {
                        urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"]
                    }
                ]
            });

            pc.onicecandidate = (event) => {
                console.log("onicecandidate");
                this.send.video(event, userid);
            };
            pc.ontrack = (event) => {
                console.log("ontrack");
                const ele = <HTMLVideoElement>document.getElementById(connection_id + '-video-' + userid);
                const ele2 = <HTMLVideoElement>document.getElementById(connection_id + '-live-' + userid);

                if (event.streams.length > 0 && ele) {
                    const stream = event.streams[0];
                    this.webcam_streams.set(userid, stream);
                    ele.srcObject = stream;
                }

                if (event.streams.length > 1 && ele2) {
                    const stream = event.streams[1];
                    this.live_streams.set(userid, stream);
                    ele2.srcObject = stream;
                }
            };
            pc.oniceconnectionstatechange = () => {
                console.log("oniceconnectionstatechange");
                const pc = this.peer_connection.get(userid);
                if (pc == undefined) {
                    return;
                }
                if (pc.iceConnectionState === 'failed') {
                    throw new Error("ICE CONNECTION FAIL");
                    //restartStream(userid);
                } else if (pc.iceConnectionState == 'connected') {
                    console.log("ICE Connected to " + userid);
                }
            };
            pc.onconnectionstatechange = () => {
                console.log("onconnectionstatechange");
                if (pc.connectionState === 'failed') {
                    this.restartStream(userid)
                }
                if (pc.connectionState === 'connected') {
                    const vc = document.getElementById("noconn-" + userid);
                    if (vc) {
                        vc.style.display = 'none';
                    }
                } else {
                    const vc = document.getElementById("noconn-" + userid);
                    if (vc) {
                        vc.style.display = 'block';
                    }
                }

            };
            pc.onnegotiationneeded = () => {
                if (pc.signalingState == "closed") {
                    return;
                }
                console.log("onnegotiationneeded ");
                pc.createOffer()
                    .then((offer) =>
                        pc.setLocalDescription(offer)
                    )
                    .then(() => {
                        if (pc.localDescription) {
                            this.send.video(pc.localDescription, userid);
                        } else {
                            console.log("NULL local description");
                        }
                    })
                    .catch((e) => console.log("Failed to offer call " + e))
            };

            console.log(pc);
            this.peer_connection.set(userid, pc);

            this.replacePeerMedia(userid);
        },
        restartStream(userid: UserUUID) {
            this.cleanupStream(userid);// Have you tried turning it off and on again
            this.send.video({ type: 'fuckoff' }, userid);
            this.startCall(userid);
        },
        updateDeviceState() {
            if (this.getCurrentVoiceRoom != null) {
                this.send.chatdev(this.getApp().hasMic(), this.getApp().hasWebcam());
                this.populateRoom();
            }
        },
        updateRemoteDeviceState(userid: UserUUID, has_video: boolean, has_audio: boolean) {
            const no_video_img = <HTMLImageElement>document.getElementById(this.connection_id + "-novideo-" + userid);
            if (no_video_img) {
                no_video_img.style.display = has_video ? "none" : "flex";
            }
            const no_audio_img = <HTMLImageElement>document.getElementById(this.connection_id + "-noaudio-" + userid);
            if (no_audio_img) {
                no_audio_img.style.display = has_audio ? "none" : "flex";
            }
        },
        async performBodyPix(net, canvas, video) {
            while (canvas && video && document.body.contains(canvas) && document.contains(video) && this.getApp().getLocalWebcamStream != null) {
                const segm = await net.segmentPerson(video);
                drawBokehEffect(
                    canvas,
                    video,
                    segm,
                    5,
                    3,
                    false
                );
            }
            console.log("Stopped blur thread");
        },
        isInVoiceRoom(voice_room: RoomUUID) {
            return this.current_voice == voice_room;
        },
        userIsMe(user: UserUUID) {
            return user == this.user_uuid;
        },
        closeConnections() {
            for (const pc of this.peer_connection.values()) {
                pc.close();
            }
            this.peer_connection.clear();
            this.webcam_streams.clear();
            this.live_streams.clear();
            this.i_am_watching = [];
            this.watching_me = [];
            this.el.voice_view.innerHTML = "";
        },
        setCurrentVoiceRoom(room: RoomUUID | null) {
            if (this.current_voice && (!room || room != this.current_voice)) {
                this.closeConnections();
            }
            this.current_voice = room;
        },
        popup_change_message(message) {
            if ('idx' in message && 'roomid' in message && is_uuid(message.roomid)) {
                const form = document.createElement('form');
                const input = document.createElement('textarea');
                const submit = document.createElement('input')
                input.value = message.text;
                submit.type = 'submit';
                submit.value = 'Change message';
                const roomid: RoomUUID = message.roomid;
                form.onsubmit = (e) => {
                    e.preventDefault();
                    message.text = input.value;
                    this.send.update_message(
                        roomid,
                        message.idx,
                        message,
                    );
                    this.getApp().hideCustom();
                    return false;
                }
                form.appendChild(input);
                form.appendChild(submit);
                this.getApp().showCustom(form);
            } else {
                console.log("Details missing - can't edit");
            }
        },
        hangUp() {
            this.send.leave_room();

            this.current_voice = null;
            this.closeConnections();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        showCustomWindow(custom_window: any) {
            //TODO
        },
        populate_context_menu(type, id): ContextMenuItem[] {
            const list: ContextMenuItem[] = [];
            const menu_item_list = this.context_menus.get(type);
            if (menu_item_list == undefined) { return []; }
            for (const option of menu_item_list) {
                if (option.permissionRequired != undefined) {
                    if (!this.has_perm(option.permissionRequired)) {
                        return [];
                    }
                }
                list.push(
                    {
                        text: option.label,
                        class: "",
                        callback: () => {
                            this.send.contextoption(
                                type,
                                option.option,
                                id
                            );
                        }
                    }
                );
            }


            return list;
        },
        has_perm(perm: string): boolean {
            return this.user_permissions.indexOf(perm) > -1;
        },
        get_or_reconstitute(id, template, values: ReconstituteValues) {
            values.client = this.connection_id;
            return this.getApp().get_or_reconstitute(id, template, values);
        },
        reconstitute(input: string, values: ReconstituteValues): HTMLElement {
            values.client = this.connection_id;
            return this.getApp().reconstitute(input, values);
        },
        updateAutocomplete(userlist: User[] | null) {
            let count = 0;
            const ac = document.getElementById('autocomplete')
            if (ac == null) {
                return;
            }
            if (userlist == null) {
                this.el.text_auto_complete.style.display = 'none';
                ac.textContent = '';
                return;
            }
            this.el.text_auto_complete.style.display = '';
            this.el.text_auto_complete.innerHTML = '';
            for (const user of userlist) {
                const selected = (count == this.autocompleteselection) ? "selected" : "";
                const complete = this.get_or_reconstitute(connection_id + "-complete-" + user.id, client_template_text_complete, { selected, userid: user.id, username: user.name, src: "" + user.avatar });
                complete.onclick = () => {
                    this.autocomplete(user.id);
                }
                this.el.text_auto_complete.appendChild(complete);
                count++;
            }
        },
        autocomplete(userid: UserUUID | null) {
            if (this.autocompleteing && this.autocompletestart != null) {
                if (this.el.text_input == null) {
                    return;
                }
                if (!this.el.text_input.selectionStart) {
                    return;
                }
                const so_far = this.el.text_input.value.substring(this.autocompletestart, this.el.text_input.selectionStart);
                const user_list = this.getUsersByPartialName(so_far);
                const user = userid != null ? this.getUserByUUID(userid) : user_list[this.autocompleteselection];
                if (user == null) {
                    return;
                }
                this.autocompleteing = false;
                let text = this.el.text_input.value;
                let endtext = text.substring(this.el.text_input.selectionStart, text.length);
                if (endtext.length < 1) {
                    endtext = " ";
                }
                text = text.substring(0, this.autocompletestart) + user.name + endtext;
                this.cached_tags.push(user.id);
                this.el.text_input.value = text;
                this.el.text_input.selectionEnd = this.el.text_input.selectionStart = text.length;
                this.updateAutocomplete(null);
            }

        },
        get_connection_id() {
            return this.connection_id;
        },
        init() {
            if (credentials.invite) {
                this.showSignUp();
            } else {
                this.showLogin();
            }
            // Add callback to cancel sending attachment
            this.el.dnd_cancel.onclick = () => { this.cached_file_upload = null; this.populateRoom(); };

            // Callback to scroller moved
            const scroller = this.el.text_chat_scroller;
            new ResizeObserver(entries => {
                entries.forEach(() => {
                    if (scroller.clientHeight === 0) { return; }
                    console.log("Setting scroll to " + this.last_chat_y_pos);
                    this.skip_scroll_calc = true;
                    scroller.scrollTo(0, scroller.scrollHeight - this.last_chat_y_pos - scroller.clientHeight);
                    this.skip_scroll_calc = false;
                })
            }).observe(this.el.text_chat_scroller);

            scroller.onscroll = () => {
                if (this.skip_scroll_calc) { return; } // Used to skip code running scrollTo
                this.last_chat_y_pos = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
            }

            const server_icon = <HTMLImageElement>this.reconstitute(app_template_server_icon, {});
            server_icon.onclick = () => { this.app.setActiveTab(this.connection_id) };
            this.app.addTab(server_icon);
            server_icon.onclick = () => {
                this.getApp().setActiveTab(this.connection_id);
            }

            // Callback for create-room
            this.el.add_room_button.onclick = () => {
                //this.el.room_popup.style.display = '';
                this.el.popup_container.style.display = '';
            };
            // Callback for create-user-invite
            this.el.add_user_button.onclick = () => {
                this.el.invite_popup.style.display = '';
                this.el.popup_container.style.display = '';
            };
            // Callback for closing...
            this.el.invite_close.onclick = () => {
                this.el.invite_popup.style.display = 'none';
                this.el.popup_container.style.display = 'none';
            }
            // Callback to scroller reached top
            new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0) {
                        this.loadMoreText();
                    }
                });
            }, { root: scroller }).observe(this.el.load_more_text);

            this.el.popup_container.style.display = 'none';
            this.el.invite_popup.style.display = 'none';
            this.el.invite_form.onsubmit = (event) => {
                event.preventDefault();
                this.send.invite(this.el.invite_user_groups.value);
            }
            this.el.signup_form.onsubmit = (event) => {
                event.preventDefault();
                if (!this.invite) {
                    this.el.signup_reply.textContent = "Invalid invite code";
                    return;
                }
                if (this.el.signup_pass1.value == this.el.signup_pass2.value && this.el.signup_pass1.value.length >= 7) {
                    this.username = this.el.login_name.value = this.el.signup_name.value;
                    this.password = this.el.login_password.value = this.el.signup_pass1.value;
                    const friendly_name = this.el.signup_friendly_name.value;
                    if (friendly_name.length > 3 && friendly_name.match(/^[a-zA-Z0-9-_ ]+$/)) {
                        this.send.signup(this.invite, friendly_name, this.username, this.password);
                    } else {
                        this.el.signup_reply.textContent = "Friendly name must be at least 3 characters long and /a-zA-Z0-9-_ /";
                    }
                } else {
                    this.el.signup_reply.textContent = "Passwords must match and be at least 7 characters long.";
                }
            }
            this.el.login_form.onsubmit = (event) => {
                event.preventDefault();
                this.username = this.el.login_name.value;
                this.password = this.el.login_password.value;
                console.log("Logging in : " + this.username);
                this.send.login(this.username, this.password, 'v1');
            };
            // Callback to send message
            this.el.text_input.oninput = (event: Event) => {
                console.log(event);
                const ievent = event as InputEvent;
                if (ievent.target == null) { return; }

                // We've written an @ and not already autocompleteing
                if ((!this.autocompleteing) && ievent.inputType === 'insertText' && ievent.data === '@') {
                    this.autocompleteing = true;
                    this.autocompletestart = this.el.text_input.selectionStart;
                    this.autocompleteselection = 0;
                    return;
                }
                // We've moved before the @. Stop autocompleteing
                if (this.el.text_input.selectionStart != null && this.autocompletestart && this.el.text_input.selectionStart < this.autocompletestart) {
                    this.autocompleteing = false;
                    this.autocompletestart = 0;
                    this.autocompleteselection = 0;
                    return;
                }
                // We're currently autocompleteing
                if (this.autocompleteing && this.autocompletestart && this.el.text_input.selectionStart != null) {
                    console.log("Caret : " + this.el.text_input.selectionStart + " End : " + this.el.text_input.value.length);
                    const so_far = this.el.text_input.value.substring(this.autocompletestart, this.el.text_input.selectionStart);
                    console.log(so_far);
                    const user_list = this.getUsersByPartialName(so_far);
                    console.log(user_list);
                    this.updateAutocomplete(user_list);
                }
            }
            this.el.text_input.onkeydown = (event) => {
                if (this.autocompleteing && this.autocompletestart && this.el.text_input.selectionStart != null) {
                    const so_far = this.el.text_input.value.substring(this.autocompletestart, this.el.text_input.selectionStart - 1);
                    const user_list = this.getUsersByPartialName(so_far);
                    if (event.key === ' ' || event.key === 'Enter' || event.key === 'Tab') {
                        this.autocomplete(null);
                        return false;
                    }
                    if (event.key == 'ArrowUp') {
                        if (this.autocompleteselection > 0) {
                            this.autocompleteselection--;
                        }
                        this.updateAutocomplete(user_list);
                        return false;
                    }
                    if (event.key == 'ArrowDown') {
                        if (this.autocompleteselection < (user_list.length - 1)) {
                            this.autocompleteselection++;
                        }
                        this.updateAutocomplete(user_list);
                        return false;
                    }
                    if (event.key == 'Escape') {
                        this.autocompleteselection = 0;
                        this.autocompleteing = false;
                        this.autocompletestart = 0;
                        this.updateAutocomplete(null);
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
            this.el.text_input_form.onsubmit = (event) => {
                if (event) { event.preventDefault(); }
                const text = this.el.text_input.value;

                if (this.cached_file_upload) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (!this.cached_file_upload) {
                            return;
                        }
                        if (event.target) {
                            const result = event.target.result as string;
                            const split = result.split(',');
                            this.send.message_with_upload(
                                rebuttal.getCurrentView()!.id,
                                { text, tags: rebuttal.cached_tags },
                                "upload",
                                split[1]
                            );

                        }
                    };
                    reader.readAsDataURL(this.cached_file_upload);
                } else {
                    this.send.message(this.getCurrentView()!.id,
                        { text, tags: this.cached_tags }
                    );
                }
                rebuttal.el.text_input.value = '';
                rebuttal.cached_tags = [];
                rebuttal.cached_file_upload = null;
                rebuttal.populateRoom();
                rebuttal.el.text_input.focus();
                return false;
            };
            this.el.dnd.style.display = 'none';
            this.connect();
        },
    };

    rebuttal.init();
    return rebuttal;
}