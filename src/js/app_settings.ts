import { type AppSettings } from "./types";

function get_config<T extends string | number | boolean | null>(
    name: string,
    default_value: T
): T {
    const value = window.localStorage.getItem(name);
    if (value == null) {
        return default_value;
    }
    if (typeof default_value == "string") {
        return value as T;
    } else if (typeof default_value == "number") {
        return parseFloat(value) as T;
    } else if (typeof default_value == "boolean") {
        return (value == "true") as T;
    }
    return default_value;
}

function set_config(name: string, value: string | number | boolean | null) {
    if (value != null) {
        window.localStorage.setItem(name, value + "");
    } else {
        window.localStorage.removeItem(name);
    }
}

export function create_app_settings(): AppSettings {
    type AppSettingsInternal = AppSettings & {
        detect_talking: boolean;
        detect_talking_level: number;
        theme: string;
        sound_theme: string;
        font: string | null;
        sfx_volume: number;
        blur_user: boolean;
        hide_dupe: boolean;
        flip_user: boolean;
        webcam_device: string;
        audio_device: string;
        audio_echo_cancel: boolean;
        audio_noise_sup: boolean;
    };

    const sound_theme = get_config("soundtheme", "basic");
    const theme = get_config("theme", "bubblegum");
    const sfx_volume = get_config("sfxvolume", 0.5);
    const font = get_config("font", null);
    const detect_talking_level = get_config("voicetriggerlevel", 0.05);
    const detect_talking = get_config("voicetrigger", true);
    let blur_user = get_config("blurwebcam", false);
    const hide_dupe = get_config("hidedupename", false);
    const flip_user = get_config("flipuser", true);
    const webcam_device = get_config("cameradevice", "none");
    const audio_device = get_config("audiodevice", "none");
    const audio_echo_cancel = get_config("echocancel", true);
    const audio_noise_sup = get_config("noisesuppress", true);

    blur_user = false;

    const settings: AppSettingsInternal = {
        detect_talking,
        detect_talking_level,
        blur_user,
        sfx_volume,
        hide_dupe,
        font: font,
        theme: theme,
        flip_user,
        sound_theme: sound_theme,
        webcam_device,
        audio_device,
        audio_echo_cancel,
        audio_noise_sup,
        getDetectTalking() {
            return this.detect_talking;
        },
        getDetectTalkingLevel() {
            return this.detect_talking_level;
        },
        getTheme() {
            return this.theme;
        },
        getSoundTheme() {
            return this.sound_theme;
        },
        getFont() {
            return this.font;
        },
        getSfxVolume() {
            return this.sfx_volume;
        },
        getBlurUser() {
            return this.blur_user;
        },
        getHideDuplicateName() {
            return this.hide_dupe;
        },
        getWebcamFlip() {
            return this.flip_user;
        },
        getCameraDevice() {
            return this.webcam_device;
        },
        getAudioDevice() {
            return this.audio_device;
        },
        getAudioEchoCancel() {
            return this.audio_echo_cancel;
        },
        getAudioNoiseSuppress() {
            return this.audio_noise_sup;
        },
        setDetectTalking(talking: boolean) {
            this.detect_talking = talking;
            set_config("voicetrigger", talking);
        },
        setDetectTalkingLevel(level: number) {
            this.detect_talking_level = level;
            set_config("voicetriggerlevel", level);
        },
        setTheme(theme: string) {
            this.theme = theme;
            set_config("theme", theme);
        },
        setSoundTheme(theme: string) {
            this.sound_theme = theme;
            set_config("soundtheme", theme);
        },
        setFont(font: string) {
            this.font = font;
            set_config("font", font);
        },
        setSfxVolume(vol: number) {
            this.sfx_volume = vol;
            set_config("sfxvolume", vol);
        },
        setBlurUser(blur: boolean) {
            this.blur_user = blur;
            set_config("blurwebcam", blur);
        },
        setHideDuplicateName(hide: boolean) {
            this.hide_dupe = hide;
            set_config("hidedupename", hide);
        },
        setWebcamFlip(flip: boolean) {
            this.flip_user = flip;
            set_config("flipuser", flip);
        },
        setCameraDevice(dev) {
            this.webcam_device = dev;
            set_config("cameradevice", dev);
        },
        setAudioDevice(dev) {
            this.audio_device = dev;
            set_config("audiodevice", dev);
        },
        setAudioEchoCancel(cancel) {
            this.audio_echo_cancel = cancel;
            set_config("echocancel", cancel);
        },
        setAudioNoiseSuppress(suppress) {
            this.audio_noise_sup = suppress;
            set_config("noisesuppress", suppress);
        },
    };

    return settings;
}
