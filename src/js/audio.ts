`use strict`
onstart.push(() => {
    var sounds = ['login', 'disconnect', 'voicejoin', 'voiceleave', 'streamjoin', 'streamleave', 'newmessage'];

    if (!soundtheme) { soundtheme = 'basic' };

    changeSoundTheme = () => {
        sounds.forEach(sound => {
            var s = new Audio('snd/' + soundtheme + '/' + sound);
            s.loop = false;
            soundlist[sound] = s;
        });
    }

    playSound = (sound) => {
        var s = soundlist[sound];
        if (s) {
            console.log("Playing sound for '" + sound + "' at volume : " + sfxVolume);
            s.volume = sfxVolume;
            s.play().catch((err) => { });

        } else {
            console.log("No sound for '" + sound + "'");
        }
    }

    changeSoundTheme();
});