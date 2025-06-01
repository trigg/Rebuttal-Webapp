'use strict';

onstart.push(() => {
    toggleSettings = () => {
        isSettings = !isSettings;
        if (isSettings) {
            navigator.mediaDevices.enumerateDevices().then(updateOutputsInSettings).catch(e => console.error(e));
            el.popupsettings.style.display = 'flex';
        } else {
            el.popupsettings.style.display = 'none';
        }
    }

    toggleServer = () => {
        isServer = !isServer;
        if (isServer) {
            el.popupserver.style.display = 'flex';
        } else {
            el.popupserver.style.display = 'none';
        }
    }

    // Custom Selects
    const customSelect = function (this: any) {
        this.querySelector('.custom-select').classList.toggle('open');
    }

    document.querySelectorAll('.custom-select-wrapper').forEach((sel => {
        sel.addEventListener('click', customSelect);
    }));

    const dropDownCallback = function (this: any) {
        const lastselected = this.parentNode.querySelector('.custom-option.selected');
        if (lastselected) { lastselected.classList.remove('selected'); }
        this.classList.add('selected');
        this.closest('.custom-select').querySelector('.custom-select__trigger span').textContent = this.textContent;

        console.log(this.textContent);
        console.log(this.dataset.value);
        console.log(this.parentNode.dataset.id);

        switch (this.parentNode.dataset.id) {
            case "settingsfont":
                setConfig('font', this.dataset.value);
                changeFont(this.dataset.value);
                break;
            case "settingstheme":
                setConfig('theme', this.dataset.value);
                changeTheme(this.dataset.value);
                break;
            case "settingscamdevice":
                setConfig('cameradevice', this.dataset.value);
                startLocalDevices();
                break;
            case "settingsmicdevice":
                setConfig('microphonedevice', this.dataset.value);
                startLocalDevices();
                break;
        }


    }

    for (const option of document.querySelectorAll(".custom-option")) {
        option.addEventListener('click', dropDownCallback);
    }

    const setCustomSelect = function (ele, option) {
        ele.querySelectorAll(".custom-option").forEach(element => {
            if (element.dataset.value === option) {
                const lastselected = element.parentNode.querySelector('.custom-option.selected');
                if (lastselected) {
                    lastselected.classList.remove('selected');
                }

                ele.querySelector('.custom-select__trigger span').textContent = element.textContent;
                element.classList.add('selected');
            }
        })
    }

    const emptyCustomSelect = function (ele) {
        ele.querySelector('.custom-options').innerText = ''
    }

    const populateCustomSelect = function (ele, opts) {
        const innerlist = ele.querySelector('.custom-options');

        opts.forEach(opt => {

            const span = document.createElement('span');
            span.className = 'custom-option';
            span.dataset.value = opt.value;
            span.innerText = opt.text;
            span.addEventListener('click', dropDownCallback);

            innerlist.appendChild(span);
            if (innerlist.childElementCount == 1) {
                setCustomSelect(ele, opt.value);
            }
        })

    }

    setCustomSelect(el.settingsfont, font);

    updateThemesInSettings = function () {
        if (!themelist) { return; }
        el.settingsthemelist.innerText = '';
        themelist.forEach(theme => {
            const span = document.createElement('span');
            span.className = 'custom-option';
            span.dataset.value = theme.id;
            span.innerText = theme.name;
            span.addEventListener('click', dropDownCallback);
            el.settingsthemelist.appendChild(span);
        });
        setCustomSelect(el.settingstheme, theme);
    }

    // Settings Tabs

    const switchToSettingsPane = (pane : string | undefined) => {
        if(!pane){
            return;
        }
        el.settings.querySelectorAll('.settingspane').forEach((pane : Element) => {
            const htmlpane = pane as HTMLElement;
            htmlpane.style.display = 'none';
        });
        el[pane].style.display = 'block';
    }

    const switchToServerPane = (pane: string | undefined) => {
        if(!pane){
            return;
        }
        el.server.querySelectorAll('.serverpane').forEach((pane:Element) => {
            const htmlpane = pane as HTMLElement;
            htmlpane.style.display = 'none';
        });
        el[pane].style.display = 'block';
    }

    el.settings.querySelectorAll('.settingstab').forEach(tab => {
        const htmltab = tab as HTMLElement;
        htmltab.onclick = (event) => {
            if (!(event.target instanceof HTMLButtonElement)) {
                return;
            }
            switchToSettingsPane(event?.target?.dataset?.link);
        }
    })

    el.server.querySelectorAll('.servertab').forEach(tab => {
        const htmltab = tab as HTMLElement;
        htmltab.onclick = (event) => {
            if (!(event.target instanceof HTMLButtonElement)) {
                return;
            }
            switchToServerPane(event?.target?.dataset?.link);
        }
    })

    switchToSettingsPane('settingspaneappearance');
    switchToServerPane('serverpanecreateroom');

    // Enumerate Devices

    updateInputsInSettings = function (devices) {
        // First, clear lists
        emptyCustomSelect(el.settingsmicdevice);
        emptyCustomSelect(el.settingscamdevice);

        populateCustomSelect(el.settingsmicdevice, [{ text: 'Any', value: 'none' }]);
        populateCustomSelect(el.settingscamdevice, [{ text: 'Any', value: 'none' }]);
        if (!devices) { return; }
        devices.forEach(device => {
            switch (device.kind) {
                case 'videoinput':
                    populateCustomSelect(el.settingscamdevice, [{ text: device.label, value: device.deviceId }]);
                    break;
                case 'audioinput':
                    populateCustomSelect(el.settingsmicdevice, [{ text: device.label, value: device.deviceId }]);
                    break;
                default:
                    console.log("Unknown device");
                    console.log(device);
                    break;
            }

        })
        const micId = getConfig('microphonedevice', 'none');
        const cameraId = getConfig('cameradevice', 'none');
        setCustomSelect(el.settingscamdevice, cameraId);
        setCustomSelect(el.settingsmicdevice, micId);

    }

    updateOutputsInSettings = function (devices) {
        emptyCustomSelect(el.settingsaudio);
        populateCustomSelect(el.settingsaudio, [{ text: 'Any', value: 'none' }]);
        if (!devices) { return; }
        devices.forEach(device => {
            switch (device.kind) {
                case 'audiooutput':
                    populateCustomSelect(el.settingsaudio, [{ text: device.label, value: device.deviceid }]);
                    break;
                default:
                    console.log("Unknown output devices");
                    console.log(device);
                    break;
            }
        })
        const outputId = getConfig('audiodevice', 'none');
        setCustomSelect(el.settingsaudio, outputId);
    }

    const setupCheckbox = function (setting, element, callback) {
        if (callback) {
            element.onclick = () => { setConfig(setting, element.checked); callback(); };
        }
        element.checked = getConfig(setting, false);
    }

    const setupSlider = function (setting, def, slider, label, callback) {
        if (callback) {
            slider.oninput = () => {
                setConfig(setting, slider.value);
                label.innerText = (label.dataset.prefix ? label.dataset.prefix : '') + slider.value + (label.dataset.postfix ? label.dataset.postfix : '');
                callback();
            }
        }
        slider.value = getConfig(setting, def);
        label.innerText = (label.dataset.prefix ? label.dataset.prefix : '') + slider.value + (label.dataset.postfix ? label.dataset.postfix : '');

    }
    // Callbacks for server commands

    el.createroomform.onsubmit = (event) => {
        event.preventDefault();
        const crn = (el.createroomname as HTMLInputElement);
        const name = crn.value;
        crn.value = '';
        const type = (el.createroomtype as HTMLSelectElement).value;
        send({ type: 'createroom', roomName: name, roomType: type });
        return false;
    };

    el.createuserform.onsubmit = (event) => {
        event.preventDefault();
        const cun = el.createusername as HTMLInputElement;
        const name = cun.value;
        cun.value = "";
        const cue = el.createuseremail as HTMLInputElement;
        const email = cue.value;
        cue.value = "";
        const group = (el.createusergroup as HTMLSelectElement).value;
        console.log(name + " " + email + " " + group);
        send({ type: 'createuser', userName: name, groupName: group, email: email });
        return false;
    }

    // Options
    setupCheckbox('fliplocal', el.settingFlipWebcam, function (event) {
        const myselfie = document.querySelector('.selfie') as HTMLElement;
        if (myselfie) {
            if (event.target.checked) {
                myselfie.style.transform = 'rotateY(180deg)';
            } else {
                myselfie.style.transform = '';
            }
        }
    })

    setupCheckbox('blurwebcam', el.settingBlurWebcam, () => { populateRoom(); replaceAllPeerMedia() });
    setupCheckbox('noisesupress', el.settingNoiseSupress, () => { startLocalDevices(); });
    setupCheckbox('echocancel', el.settingEchoCancellation, () => { startLocalDevices(); });
    setupCheckbox('hidedupename', el.settingsappearancehidedupename, () => { populateRoom(); });
    setupCheckbox('voicetrigger', el.settingVoiceTrigger, () => { detectTalking = (<HTMLInputElement>el.settingVoiceTrigger).checked });

    setupSlider('audiobitrate', 64, el.settingbitrate, el.settingbitrateoutput, () => { startLocalDevices(); });
    setupSlider('streamresolution', 1080, el.settingsstreamresolution, el.settingsstreamresolutionoutput, () => { if (localLiveStream) { startLocalDevices(); } });
    setupSlider('streamrate', 30, el.settingsstreamrate, el.settingsstreamrateoutput, () => { if (localLiveStream) { startLocalDevices(); } });
    setupSlider('sfxvolume', 50, el.settingssfxvolume, el.settingssfxvolumeoutput, () => { sfxVolume = +(<HTMLInputElement>el.settingssfxvolume).value / 100; setConfig('sfxvolume', +(<HTMLInputElement>el.settingssfxvolume).value / 100) })
    setupSlider('voicetriggerlevel', 0.05, el.settingsvoicetriggervolume, el.settingsvoicetriggervolumeoutput, () => { detectTalkingLevel = +(<HTMLInputElement>el.settingsvoicetriggervolume).value });

    el.settingbutton.onclick = toggleSettings;
    el.settingsclose.onclick = toggleSettings;

    el.serverbutton.onclick = toggleServer;
    el.serverclose.onclick = toggleServer;

});