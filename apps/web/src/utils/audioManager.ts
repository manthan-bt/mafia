class AudioManager {
    private static instance: AudioManager;
    private sounds: Map<string, HTMLAudioElement>;
    private ambientTrack: HTMLAudioElement | null = null;

    private constructor() {
        this.sounds = new Map();
        this.init();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private init() {
        // Preload standard sound effects (using placeholders/silence or free sound URLs for now)
        // In a real production build, these would point to local /assets/audio
        this.loadSound('flip', 'https://actions.google.com/sounds/v1/foley/metal_click.ogg');
        this.loadSound('bassHit', 'https://actions.google.com/sounds/v1/impacts/deep_bass_hit.ogg');
        this.loadSound('tick', 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_short.ogg');
        this.loadSound('ambientNight', 'https://actions.google.com/sounds/v1/ambiences/night_crickets.ogg');
    }

    private loadSound(key: string, url: string) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds.set(key, audio);
    }

    public play(key: string, volume: number = 0.5) {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.volume = volume;
            sound.currentTime = 0;
            // Catch error if browser blocks autoplay before user interaction
            sound.play().catch(e => console.log('Audio play blocked:', e));
        }
    }

    public startAmbient(key: string, volume: number = 0.2) {
        this.stopAmbient();
        const sound = this.sounds.get(key);
        if (sound) {
            sound.loop = true;
            sound.volume = volume;
            sound.play().catch(e => console.log('Ambient play blocked:', e));
            this.ambientTrack = sound;
        }
    }

    public stopAmbient() {
        if (this.ambientTrack) {
            this.ambientTrack.pause();
            this.ambientTrack.currentTime = 0;
            this.ambientTrack = null;
        }
    }
}

export const audioManager = AudioManager.getInstance();
