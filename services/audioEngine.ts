class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private activeTimeouts: number[] = [];

  constructor() {}

  public async init() {
    if (this.isInitialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.4; 
    this.isInitialized = true;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public playPianoNote(freq: number, duration: number = 1.5) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    osc3.frequency.value = freq;

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc3.type = 'sawtooth';

    osc2.detune.value = -5; 
    osc3.detune.value = 5;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0, t);
    noteGain.gain.linearRampToValueAtTime(0.6, t + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + duration * 0.7);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    
    filter.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    osc1.stop(t + duration);
    osc2.stop(t + duration);
    osc3.stop(t + duration);
    
    setTimeout(() => {
        noteGain.disconnect();
        filter.disconnect();
    }, duration * 1000 + 100);
  }

  public stopAll() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
  }

  public playSequence(notes: {freq: number, delay: number, noteName: string}[], onNotePlayed: (note: string) => void, onComplete: () => void) {
    this.stopAll();
    let currentTime = 0;
    notes.forEach((item, index) => {
      const timeout = window.setTimeout(() => {
        this.playPianoNote(item.freq, 0.8);
        onNotePlayed(item.noteName);
        if (index === notes.length - 1) {
          onComplete();
        }
      }, currentTime);
      this.activeTimeouts.push(timeout);
      currentTime += item.delay;
    });
  }
}

export const audioEngine = new AudioEngine();