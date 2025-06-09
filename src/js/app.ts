// Instance of types.ts RebuttalApp
import { type AppSettings, type RebuttalClient, type RebuttalApp, type Theme, type FullscreenMetadata, ContextMenuItem, ReconstituteValues, ConnectionUUID, AudioList, is_uuid, AppHTML, ClientCredentials, exact_device } from "./types";
import { create_app_settings } from "./app_settings";
import app_context_menu_item from "../templates/app_context_menu_item.html";
import { v4 as uuidv4 } from 'uuid';
import { create_client } from "./client";
import { parser } from "./parser";
import { create_sound_reader } from "./sound_reader";

export function create_app(no_init = false) {
    // Functions in Internal app should not be called from outside and are intended ONLY to assist readability and deduplication

    // Is there a better test? This functions but might be a bad idea.
    const electron_check = /electron/i.test(navigator.userAgent);

    const app_settings = create_app_settings();

    const themes = [
        {
            "id": "accounting",
            "name": "Accounting department",
            "description": "A straightforward theme for those with no joy left in their lives"
        },
        {
            "id": "aspiringwebdev",
            "name": "Aspiring WebDev",
            "description": "A theme as dark as your prospects of releasing a hit new Web App and become an overnight billionaire"
        },
        {
            "id": "bubblegum",
            "name": "Bubblegum (default)",
            "description": "A light hearted theme for those with a weak disposition"
        }
    ];
    const server_list = <HTMLDivElement>document.getElementById("serverpane");
    const server_img = <HTMLImageElement>document.getElementById("serverbutton");
    const server_add_input = <HTMLInputElement>document.getElementById("add_server_host");
    const server_add_form = <HTMLFormElement>document.getElementById("add_server_form");
    const server_add_remember_password = <HTMLInputElement>document.getElementById("add_server_host_remember_password");
    const server_add_auto_connect = <HTMLInputElement>document.getElementById("add_server_host_connect_on_start");
    const popup_custom_outer = <HTMLDivElement>document.getElementById("popupcustomouter");
    const fullscreen_div = <HTMLDivElement>document.getElementById("fullscreen-video-popup-container");
    const context_menu = <HTMLDivElement>document.getElementById("contextmenu");
    const context_menu_outer = <HTMLDivElement>document.getElementById('contextmenuouter');
    const toggle_webcam_img = <HTMLImageElement>document.getElementById('toggleWebcam');
    const toggle_mic_img = <HTMLImageElement>document.getElementById('toggleMute');
    const toggle_livestream_img = <HTMLImageElement>document.getElementById('toggleScreenShare');
    const disconnect_img = <HTMLImageElement>document.getElementById('hangup');
    const settings_img = <HTMLImageElement>document.getElementById('settingbutton')
    const server_settings_img = <HTMLImageElement>document.getElementById('serverbutton');
    const hang_up_img = <HTMLImageElement>document.getElementById("hangup");
    const add_server_tab = <HTMLImageElement>document.getElementById("onemoreserver");
    const all_client_content = <HTMLDivElement>document.getElementById("appWindow");
    type RebuttalAppInternal = RebuttalApp & {
        client_list: Map<ConnectionUUID, RebuttalClient>,
        el: AppHTML,
        parser: typeof parser,
        active_tab: ConnectionUUID | null,
        allow_mic: boolean,
        allow_webcam: boolean,
        allow_livestream_video: boolean,
        allow_livestream_audio: boolean,
        speaker_suppressed: boolean,
        local_webcam_stream: MediaStream | null,
        local_live_stream: MediaStream | null,
        local_filtered_stream: MediaStream | null,
        is_running_in_electron: boolean,
        themes: Theme[],
        settings: AppSettings,
        fullscreen_metadata: FullscreenMetadata | null,
        soundlist: AudioList,
        whitenoise: MediaStream | null,
        addClient: (e: Event) => boolean,
        hideAllTabs: () => void,
        showTab: (hostname: ConnectionUUID | null) => void
        init: () => void,
    };

    const app: RebuttalAppInternal = {
        el: {
            hang_up_img,
            server_img,
            fullscreen_div,
            popup_custom_outer,
            context_menu,
            context_menu_outer,
            toggle_webcam_img,
            toggle_mic_img,
            toggle_livestream_img,
            disconnect_img,
            settings_img,
            server_settings_img,
            server_list,
            server_add_input,
            server_add_form,
            server_add_remember_password,
            server_add_auto_connect,
            add_server_tab,
            all_client_content,
        },
        themes: themes,
        client_list: new Map(),
        active_tab: null,
        allow_webcam: false,
        allow_mic: false,
        allow_livestream_video: false,
        allow_livestream_audio: false,
        speaker_suppressed: false,
        local_filtered_stream: null,
        local_webcam_stream: null,
        local_live_stream: null,
        is_running_in_electron: electron_check,
        settings: app_settings,
        fullscreen_metadata: null,
        whitenoise: null,
        soundlist: {},
        parser: parser,

        getParser: function (): typeof parser {
            return this.parser;
        },
        hideAllTabs: function (): void {
            for (const tab of this.el.all_client_content.childNodes) {
                if (tab instanceof HTMLElement) {
                    tab.style.display = 'none';
                }
            }
        },
        showTab: function (id: ConnectionUUID | null): void {

            this.hideAllTabs();
            let tab = document.getElementById(id + "-client-view");
            if (id == null) {
                tab = document.getElementById("appaddserver");
            }
            if (tab && tab instanceof HTMLElement) {
                tab.style.display = '';
            }
            if (id != null) {
                const client = this.getClient(id);
                if (client != null) {
                    //client.populateRoom();
                    //client.populateRoomList();
                    //client.populateUserList();
                }
            }

        },
        addTab: function (element: HTMLImageElement) {
            this.el.server_list.appendChild(element);
        },
        removeTab: function (id: ConnectionUUID) {
            if (this.active_tab == id) {
                this.showTab(null);
            }
            const server_logo = document.getElementById(id + "-server-icon");
            if (server_logo) {
                this.el.server_list.removeChild(server_logo);
            }
            this.client_list.delete(id);
        },
        getAllClients: function (): MapIterator<RebuttalClient> {
            return this.client_list.values();
        },
        getClient: function (id: ConnectionUUID): RebuttalClient | null {
            for (const client of this.client_list.values()) {
                if (client.get_connection_id() == id) {
                    return client;
                }
            }
            return null;
        },
        setActiveTab: function (id: ConnectionUUID | null): void {
            this.active_tab = id;
            this.hideAllTabs();
            if (id == null) {
                this.showTab(null);
                return;
            }
            this.showTab(id);
            // It disappears when invisible?
            //this.el.server_add_form.onsubmit = (e) => { return this.addClient(e) };
            document.getElementById("add_server_form")!.onsubmit = (e) => { return this.addClient(e); };
        },
        setTheme(theme: string) {
            // Change CSS
            const oldlinks = document.getElementsByTagName('link');
            const head = document.getElementsByTagName('head')[0];
            for (const link of oldlinks) {
                head.removeChild(link);
            }

            const newlink = document.createElement('link');
            newlink.setAttribute('rel', 'stylesheet');
            newlink.setAttribute('type', 'text/css');
            newlink.setAttribute('href', 'css/' + theme + '.css');
            head.appendChild(newlink);

            // Change IMGs!
            const oldimg = document.getElementsByTagName('img');
            for (const img of oldimg) {
                if ('src' in img.dataset) {
                    img.src = 'img/' + theme + '/' + img.dataset.src;
                }
            }
            // And... Image inputs?
            const oldimg2 = document.getElementsByTagName('input');
            for (const img of oldimg2) {
                if (img.getAttribute('type') === 'image') {
                    if ('src' in img.dataset) {
                        img.src = 'img/' + theme + '/' + img.dataset.src;
                    }
                }
            }
        },
        getActiveTab: function (): ConnectionUUID | null {
            return this.active_tab;
        },
        isShowingPopup: function (): boolean {
            throw new Error("Function not implemented.");
        },
        isShowingServerSettings: function (): boolean {
            throw new Error("Function not implemented.");
        },
        isShowingClientSettings: function (): boolean {
            throw new Error("Function not implemented.");
        },
        hasMic(): boolean {
            if (this.local_webcam_stream == null || this.local_webcam_stream.getAudioTracks().length == 0) {
                return false;
            }
            return this.allow_mic;
        },
        hasWebcam(): boolean {
            if (this.local_webcam_stream == null || this.local_webcam_stream.getVideoTracks().length == 0) {
                return false;
            }
            return this.allow_webcam;
        },
        hasLiveStream(): boolean {
            if (this.local_live_stream == null) {
                return false;
            }
            return this.allow_livestream_video;
        },
        hasLiveStreamAudio(): boolean {
            // TODO Also check if livestream has no audio channel
            if (this.local_live_stream == null) {
                return false;
            }
            return this.allow_livestream_audio;
        },
        createAudioConstraints() {

            let device_id: string | undefined | null | exact_device = this.getSettings().getAudioDevice();
            device_id = (device_id === 'undefined') ? 'none' : device_id;
            device_id = (device_id !== 'none') ? { exact: device_id } : undefined;
            const a = {
                sampleSize: 16,
                channelCount: 1,
                echoCancellation: this.getSettings().getAudioEchoCancel(),
                noiseSuppression: this.getSettings().getAudioNoiseSuppress(),
                deviceId: device_id
            };
            return a;
        },
        createVideoConstraints() {
            let device_id: string | undefined | null | exact_device = this.getSettings().getCameraDevice();
            device_id = (device_id === 'undefined') ? 'none' : device_id;
            device_id = (device_id !== 'none') ? { exact: device_id } : undefined;
            const a = {
                width: { min: 640, ideal: 1280 },
                height: { min: 400, ideal: 720 },
                framerate: 30,
                deviceId: device_id
            };
            return a;
        },
        createConstraints() {
            const constraints = {
                video: this.createVideoConstraints(),
                audio: this.createAudioConstraints()
            };
            return constraints;
        },
        closeLivestream() {

        },
        ensureLivestreamPermission() {
            if (!this.allow_livestream_video) {
                this.closeLivestream();
                return;
            }
            if (this.local_live_stream == null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const constraints: any = {
                    video: {
                        displaySurface: "window"
                    },
                    audio: {
                        suppressLocalAudioPlayback: false,
                    },
                    surfaceSwitching: 'include',
                    systemAudio: 'exclude',
                    selfBrowserSurface: 'exclude',
                    monitorTypeSurfaces: 'exclude',
                };
                // Fighting the type checker here. It thinks some newer options aren't valid
                navigator.mediaDevices
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    .getDisplayMedia(constraints)
                    .then(stream => {
                        this.local_live_stream = stream;
                        this.updateDeviceState();
                    }).catch(() => { });
            }
        },
        closeWebcamDevice() {
            if (this.local_webcam_stream == null) { return; }
            this.local_webcam_stream.getTracks().forEach(track => track.stop());
            this.local_webcam_stream = null;
        },

        ensureDevicePermission() {
            console.log("Rechecking device with options mic : " + this.allow_mic + " vid : " + this.allow_webcam)
            if (!this.allow_webcam && !this.allow_mic && this.local_webcam_stream) {
                this.closeWebcamDevice();
                return;
            }
            if (this.local_webcam_stream == null) {
                // Only get a new device stream when cached is null.
                // To force a device change you must first stop the current one
                navigator.mediaDevices
                    .getUserMedia(this.createConstraints())
                    .then(stream => {
                        this.local_webcam_stream = stream;
                        if (this.local_webcam_stream.getAudioTracks().length > 0) {
                            this.local_filtered_stream = create_sound_reader(this.local_webcam_stream).stream;
                        } else {
                            this.local_filtered_stream = null;
                        }
                        this.updateDeviceState();

                        // Any existing PC need the stream
                        for (const client of this.getAllClients()) {
                            client.replaceAllPeerMedia();
                        }
                        return navigator.mediaDevices.enumerateDevices();
                    })
                    .then((devices) => {
                        // Update These Devices into settings dropdown

                        // TODO
                        console.log(devices);

                    })
                    .catch(err => {
                        console.info("No webcam appears to be present:");
                        console.error("error:" + err);
                        if (this.allow_webcam) {
                            this.allow_webcam = false;
                            this.updateDeviceState();
                            this.ensureDevicePermission();
                        }
                        // Put 'Any' back in. At this point we've lost our custom device list

                        // TODO
                        console.log("Removing webcam devices");
                    });
            }
        },
        toggleAllowMic() {
            this.allow_mic = !this.allow_mic;
            this.ensureDevicePermission();
            this.updateDeviceState();
        },
        toggleAllowWebcam() {
            this.allow_webcam = !this.allow_webcam;
            this.ensureDevicePermission();
            this.updateDeviceState();
        },
        toggleAllowLivestream() {
            this.allow_livestream_video = !this.allow_livestream_video;
            this.ensureLivestreamPermission();
            this.updateDeviceState();
        },
        toggleAllowLivestreamAudio() {
            this.allow_livestream_audio = !this.allow_livestream_audio;
            this.updateDeviceState();
        },
        isRunningInElectron: function (): boolean {
            return electron_check;
        },
        getSettings: function (): AppSettings {
            return this.settings;
        },
        playSound: function (sound_name: string) {
            const sfx_volume = this.settings.getSfxVolume();
            const s = this.soundlist[sound_name];
            if (s != null) {
                console.log("Playing sound for '" + sound_name + "' at volume : " + sfx_volume);
                s.volume = sfx_volume;
                s.play().catch((err) => { console.log("Error playing sound : " + err) });

            } else {
                console.log("No sound for '" + sound_name + "'");
            }
        },
        setSoundTheme(theme: string) {
            const sounds = ['login', 'disconnect', 'voicejoin', 'voiceleave', 'streamjoin', 'streamleave', 'newmessage'];
            this.soundlist = {};
            for (const sound of sounds) {
                const s = new Audio('snd/' + theme + '/' + sound);
                s.loop = false;
                this.soundlist[sound] = s;
            }
        },
        getLocalFilteredStream: function (): MediaStream | null {
            return this.local_filtered_stream;
        },
        getLocalLiveStream: function (): MediaStream | null {
            return this.local_live_stream;
        },
        getLocalWebcamStream: function (): MediaStream | null {
            return this.local_webcam_stream;
        },
        updateThemes: function (new_themes: Theme[]) {
            this.themes = new_themes;
        },
        setFullscreenElement(element: HTMLElement, metadata: FullscreenMetadata) {
            if (this.fullscreen_metadata == null) {
                this.fullscreen_metadata = metadata;
                // Implied remove from parent? Probably better to implicitly do so before calling this.
                this.el.fullscreen_div.append(element);
                this.el.fullscreen_div.style.display = "flex";
            }
        },
        closeFullscreen() {
            if (this.fullscreen_metadata) {
                this.el.fullscreen_div.style.display = "none";
                if (this.fullscreen_metadata.closed_callback) {
                    this.fullscreen_metadata.closed_callback();
                }
                this.fullscreen_metadata = null;
            }
        },
        getFullscreenMetadata() {
            return this.fullscreen_metadata;
        },
        updateDeviceState() {
            // Alert all clients just incase
            for (const client of this.client_list.values()) {
                client.updateDeviceState();
            }

            this.el.toggle_mic_img.src = "img/" + this.getSettings().getTheme() + (this.hasMic() ? "/micon.svg" : "/micoff.svg");
            this.el.toggle_webcam_img.src = "img/" + this.getSettings().getTheme() + (this.hasWebcam() ? "/webcamon.svg" : "/webcamoff.svg");
            this.el.toggle_livestream_img.src = "img/" + this.getSettings().getTheme() + (this.hasLiveStream() ? "/screenon.svg" : "/screenoff.svg");

            this.el.toggle_mic_img.dataset.src = this.hasMic() ? "micon.svg" : "micoff.svg";
            this.el.toggle_webcam_img.dataset.src = this.hasWebcam() ? "webcamon.svg" : "webcamoff.svg";
            this.el.toggle_livestream_img.dataset.src = this.hasLiveStream() ? "screenon.svg" : "screenoff.svg";

            // Filter our streams to match
            if (this.local_webcam_stream) {
                for (const audio of this.local_webcam_stream.getAudioTracks()) {
                    audio.enabled = this.allow_mic;
                };
                for (const video of this.local_webcam_stream.getVideoTracks()) {
                    video.enabled = this.allow_webcam;
                };
            }
            if (this.local_live_stream) {
                for (const audio of this.local_live_stream.getAudioTracks()) {
                    audio.enabled = this.allow_livestream_video;
                };
                for (const video of this.local_live_stream.getVideoTracks()) {
                    video.enabled = this.allow_livestream_audio;
                };
            }
        },
        show_context_menu(list: ContextMenuItem[], e: MouseEvent) {
            let x = 0;
            let y = 0;
            if (e.pageX && e.pageY) {
                x = e.pageX; y = e.pageY;
            } else if (e.clientX && e.clientY) {
                x = e.clientX + (document.documentElement.scrollLeft ?
                    document.documentElement.scrollLeft :
                    document.body.scrollLeft);
                y = e.clientY + (document.documentElement.scrollTop ?
                    document.documentElement.scrollTop :
                    document.body.scrollTop);
            } else {
                return;
            }

            this.el.context_menu.style.display = 'none';
            if (x < (window.innerWidth / 2)) {
                x = x + 2;
                this.el.context_menu.style.left = x + "px"
                this.el.context_menu.style.right = '';
            } else {
                x = x - 2;
                this.el.context_menu.style.right = (window.innerWidth - x) + "px"
                this.el.context_menu.style.left = '';
            }
            if (y < (window.innerHeight / 2)) {
                y = y + 2;
                this.el.context_menu.style.top = y + "px"
                this.el.context_menu.style.bottom = '';
            } else {
                y = y - 2;
                this.el.context_menu.style.bottom = (window.innerHeight - y) + "px"
                this.el.context_menu.style.top = '';
            }
            this.el.context_menu.innerHTML = '';
            for (const item of list) {
                const uuid = uuidv4() as unknown as ConnectionUUID; // TODO Is there a cleaner way?
                const itemdiv = this.reconstitute(app_context_menu_item, { text: item.text, uuid: uuid, slidervalue: "" + item.slider });
                const slider = <HTMLInputElement>(itemdiv.getElementsByClassName("slider")[0]);
                const slider_label = <HTMLLabelElement>(itemdiv.getElementsByClassName("slider-label")[0]);
                const text = <HTMLDivElement>(itemdiv.getElementsByClassName("con-text")[0]);
                if ('slider' in item) {
                    slider.id = 'volumeslider';
                    slider.type = 'range';
                    slider.min = '0.0';
                    slider.max = '1.0';
                    slider.step = '0.01';
                    slider.value = "" + item.slider;
                    slider.oninput = item.callback;
                    slider.style.display = '';
                    slider_label.style.display = '';
                    text.style.display = 'none';
                } else {
                    text.innerText = item.text;
                    if ('callback' in item) {
                        itemdiv.onclick = () => { this.close_context_menu(); item.callback(); };
                    }
                    if ('class' in item) {
                        itemdiv.classList.add(item.class);
                    }
                    slider.style.display = 'none';
                    slider_label.style.display = 'none';
                    text.style.display = '';
                }
            }
            this.el.context_menu.style.display = "block";
            this.el.context_menu_outer.style.display = "block";
            this.el.context_menu.onmouseleave = () => {
                this.el.context_menu.onmouseleave = null;
                this.el.context_menu.style.display = 'none';
                this.el.context_menu_outer.style.display = 'none';
            }
        },
        close_context_menu() {
            this.el.context_menu.style.display = 'none';
            this.el.context_menu_outer.style.display = 'none';
        },
        showCustom(element: HTMLElement) {
            this.el.popup_custom_outer.innerHTML = "";
            this.el.popup_custom_outer.append(element);
            this.el.popup_custom_outer.style.display = '';
        },
        hideCustom() {
            this.el.popup_custom_outer.innerHTML = "";
            this.el.popup_custom_outer.style.display = 'none';
        },
        get_or_reconstitute(id, template, values: ReconstituteValues) {
            const try_get = document.getElementById(id);
            if (try_get == null) {
                const recon = this.reconstitute(template, values);
                if (recon.id != id) {
                    throw new Error("Reconstituted HTML Does not have correct ID. Got '" + recon.id + "' expected '" + id + "'");
                }
                return recon;
            }
            return try_get;
        },
        getWhiteNoise(): MediaStream {
            if (this.whitenoise == null) {

                const width = 50;
                const height = 25;
                const canvas = Object.assign(document.createElement("canvas"), { width, height });
                const ctx = canvas.getContext('2d');
                if (ctx == null) {
                    throw new Error("Null canvas context");
                }
                ctx.fillRect(0, 0, width, height);
                const p = ctx.getImageData(0, 0, width, height);
                requestAnimationFrame(function draw() {
                    for (let i = 0; i < p.data.length; i++) {
                        p.data[i++] = p.data[i++] = p.data[i++] = Math.random() * 255;
                    }
                    ctx.putImageData(p, 0, 0);
                    requestAnimationFrame(draw);
                });
                this.whitenoise = canvas.captureStream();
            }
            return this.whitenoise;
        },
        reconstitute(input: string, values: ReconstituteValues): HTMLElement {
            const a = document.createElement("div");
            values.theme = this.getSettings().getTheme();

            for (const key of Object.keys(values)) {
                input = input.replaceAll("{{" + key + "}}", values[key]);
            }
            a.innerHTML = input;
            const value = a.firstChild;
            if (value == null) {
                throw new Error("Invalid reconstitution of HTML");
            }
            if (!(value instanceof HTMLElement)) {
                throw new Error("Invalid reconstitution of HTML");
            }
            return value;
        },
        hangUp() {
            for (const client of this.client_list.values()) {
                client.hangUp();
            }
        },
        addClient: function (e: Event) {
            e.preventDefault();
            // This form needs -at minimum- the hostname and port if not 443.
            // It MUST accept any http(s) ws(s) protocol and silently ignore
            // it must throw away the path and use /ipc
            const hostname = this.el.server_add_input.value.replace(/^(ws|wss|http|https):\/\//i, "");

            try {
                const url = new URL("wss://" + hostname);
                console.log("URL Before mangling : " + url.toString());
                // Check to see if it has an invite. This means an invite URL can be pasted right in to server hostname
                const creds: ClientCredentials = { autoconnect: false };
                const maybe_uuid = url.searchParams.get("invite");
                if (url.searchParams.has("invite") && maybe_uuid && is_uuid(maybe_uuid)) {
                    console.log("We have a UUID invite!");
                    creds.invite = maybe_uuid;
                }
                url.pathname = "/ipc";
                const new_uuid = uuidv4();
                if (!is_uuid(new_uuid)) {
                    throw new Error("UUID was not a UUID");
                }
                console.log("URL After : " + url.toString());
                this.client_list.set(new_uuid, create_client(new_uuid, this, url.href, creds));
                this.setActiveTab(new_uuid);
            } catch (e) {
                console.log("Skipping probable error server hostname : '" + hostname + "'");
                console.log(e);
            }
            return false;
        },
        init: function () {
            this.setTheme(this.getSettings().getTheme());
            this.setSoundTheme(this.getSettings().getSoundTheme());
            this.el.fullscreen_div.onclick = () => { this.closeFullscreen() };
            this.el.toggle_mic_img.onclick = () => { this.toggleAllowMic(); };
            this.el.toggle_webcam_img.onclick = () => { this.toggleAllowWebcam(); };
            this.el.toggle_livestream_img.onclick = () => { this.toggleAllowLivestream(); };
            this.el.hang_up_img.onclick = () => { this.hangUp() };

            const url = new URL(window.location.href);
            let id: string | null | undefined = url.searchParams.get('invite');
            if (id == null || !(typeof id == 'string') || !is_uuid(id)) {
                id = undefined;
            }
            // Callback to return to server-add page
            this.el.add_server_tab.onclick = () => {
                this.setActiveTab(null);
            }

            // Add Server Form
            this.el.server_add_form.onsubmit = (e) => { return this.addClient(e) };

            if (this.isRunningInElectron()) {
                this.el.server_list.style.display = '';
                this.setActiveTab(null);

            } else {
                // We are most likely in a webbrowser as part of the server hosting

                // Don't attempt any username/password store as the browser will be set up to do this already... or not, as the user has decided.

                // Also don't offer any other servers as connection will be impossible to anywhere else
                this.el.server_list.style.display = 'none';

                const not_random_uuid = "3d1462c5-9346-4aed-8813-36a63ed5c3f4";
                if (is_uuid(not_random_uuid)) {
                    this.client_list.set(not_random_uuid, create_client(not_random_uuid, this, "this-server", { autoconnect: false, invite: id }));
                    this.setActiveTab(not_random_uuid);
                    return;
                }
                throw new Error("Yeah no idea how that happened.");
            }
        }
    };
    if (!no_init) {
        app.init();
    }

    return app;
}