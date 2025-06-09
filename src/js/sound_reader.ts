
class SoundReader {
    context: AudioContext;
    talked: boolean;
    peak: number;
    script: ScriptProcessorNode;
    dest: MediaStreamAudioDestinationNode;
    mic: MediaStreamAudioSourceNode | undefined;

    constructor(context: AudioContext) {
        this.context = context;
        this.talked = false;
        this.peak = 0.0;
        this.script = context.createScriptProcessor(2048, 1, 1);
        this.dest = context.createMediaStreamDestination();

        this.script.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            const output = event.outputBuffer.getChannelData(0);
            let talked = false;
            let peak = 0.0;
            for (let i = 0; i < input.length; ++i) {
                if (Math.abs(input[i]) > peak) {
                    peak = Math.abs(input[i]);
                }
                if (Math.abs(input[i]) > window.rebuttal_app.getSettings().getDetectTalkingLevel()) {
                    talked = true;
                    break;
                }
            }
            if (talked || !(window.rebuttal_app.getSettings().getDetectTalking())) {
                for (let i = 0; i < output.length; i++) {
                    output[i] = input[i];
                }
            } else {
                for (let i = 0; i < output.length; i++) {
                    output[i] = 0;
                }
            }
            this.talked = talked;
            this.peak = peak;
        }
    }

    connectToSource(stream: MediaStream, callback: () => void) {
        try {
            this.mic = this.context.createMediaStreamSource(stream);
            this.mic.connect(this.script);
            this.script.connect(this.dest);

            if (typeof callback !== 'undefined') {
                callback();
            }
        } catch (e) {
            console.error(e);
            this.stop();
        }
    };

    stop() {
        if (this.mic) {
            this.mic.disconnect();
        }
        this.script.disconnect();
    };
}

export function create_sound_reader(src: MediaStream) {
    const sreader = new SoundReader(new AudioContext());
    sreader.connectToSource(src, () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const timer_id = setInterval(() => {
            if (sreader.talked) {
                for (const client of window.rebuttal_app.getAllClients()) {
                    const uuid = client.getUserUUID();
                    if (uuid != null) {
                        client.send.talking(uuid, true);
                    }

                }
            } else {
                for (const client of window.rebuttal_app.getAllClients()) {
                    const uuid = client.getUserUUID();
                    if (uuid != null) {
                        client.send.talking(uuid, false);
                    }
                }
            }
        }, 200);
    });
    return sreader.dest;
}