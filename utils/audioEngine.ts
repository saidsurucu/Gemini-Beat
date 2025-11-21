import { InstrumentType, MasterEffects } from '../types';

// Singleton-ish class for handling Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private mixBus: GainNode | null = null; // Main mix before FX
  
  // FX Nodes
  private distortionNode: WaveShaperNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackNode: GainNode | null = null;
  private delayDryNode: GainNode | null = null;
  private delayWetNode: GainNode | null = null;
  
  private isChiptune: boolean = false;

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Create Master Output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);

      // Create Mix Bus (Sources connect here)
      this.mixBus = this.ctx.createGain();
      this.mixBus.gain.value = 1.0;

      // --- FX CHAIN SETUP ---
      // Signal Flow: mixBus -> Distortion -> (Delay Split) -> Master
      
      // 1. Distortion
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.oversample = '4x';
      this.distortionNode.curve = this.makeDistortionCurve(0);

      // 2. Delay System
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayFeedbackNode = this.ctx.createGain();
      this.delayDryNode = this.ctx.createGain();
      this.delayWetNode = this.ctx.createGain();

      // Connect MixBus to Distortion
      this.mixBus.connect(this.distortionNode);

      // Distortion connects to Delay Input AND Dry Output
      // DRY PATH
      this.distortionNode.connect(this.delayDryNode);
      this.delayDryNode.connect(this.masterGain);

      // WET PATH
      this.distortionNode.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedbackNode);
      this.delayFeedbackNode.connect(this.delayNode); // Loop
      this.delayNode.connect(this.delayWetNode);
      this.delayWetNode.connect(this.masterGain);

      // Defaults - ENSURE DRY SIGNAL IS ON BY DEFAULT
      this.delayDryNode.gain.value = 1.0;
      this.delayWetNode.gain.value = 0.0;
      this.delayFeedbackNode.gain.value = 0.0;
    }
  }

  public async resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public updateEffects(fx: MasterEffects) {
    if (!this.ctx || !this.distortionNode || !this.delayNode || !this.delayWetNode || !this.delayFeedbackNode || !this.delayDryNode) return;

    // Update Distortion
    if (fx.distortion.enabled) {
      this.distortionNode.curve = this.makeDistortionCurve(fx.distortion.amount);
    } else {
      this.distortionNode.curve = this.makeDistortionCurve(0);
    }

    // Update Delay
    if (fx.delay.enabled) {
       const now = this.ctx.currentTime;
       this.delayNode.delayTime.setValueAtTime(Math.max(0.01, fx.delay.time), now);
       this.delayFeedbackNode.gain.setValueAtTime(fx.delay.feedback, now);
       this.delayWetNode.gain.setValueAtTime(fx.delay.mix, now);
       this.delayDryNode.gain.setValueAtTime(1 - (fx.delay.mix * 0.5), now); // Slight dry dip when wet increases
    } else {
       // Bypass delay completely if disabled
       const now = this.ctx.currentTime;
       this.delayWetNode.gain.setValueAtTime(0, now);
       this.delayDryNode.gain.setValueAtTime(1, now);
       this.delayFeedbackNode.gain.setValueAtTime(0, now);
    }
  }

  private makeDistortionCurve(amount: number) {
    const k = typeof amount === 'number' ? amount : 0;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    if (k === 0) {
       for (let i = 0; i < n_samples; ++i) {
           curve[i] = (i * 2) / n_samples - 1;
       }
       return curve;
    }

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public setChiptuneMode(enabled: boolean) {
    this.isChiptune = enabled;
  }

  public trigger(type: InstrumentType, volume: number = 1, time: number = 0) {
    if (!this.ctx || !this.mixBus) this.init();
    if (!this.ctx) return;

    const t = time || this.ctx.currentTime;
    const safeVol = Math.min(Math.max(volume, 0), 1);

    if (this.isChiptune) {
        this.trigger8Bit(type, safeVol, t);
    } else {
        this.triggerAnalog(type, safeVol, t);
    }
  }

  // --- STANDARD ANALOG ENGINE ---
  private triggerAnalog(type: InstrumentType, volume: number, t: number) {
      switch (type) {
        case InstrumentType.KICK: this.playKick(t, volume); break;
        case InstrumentType.SNARE: this.playSnare(t, volume); break;
        case InstrumentType.HIHAT: this.playHiHat(t, volume); break;
        case InstrumentType.CLAP: this.playClap(t, volume); break;
        case InstrumentType.BASS: this.playBass(t, volume); break;
        case InstrumentType.SYNTH: this.playSynth(t, volume); break;
      }
  }

  // --- 8-BIT CHIPTUNE ENGINE ---
  private trigger8Bit(type: InstrumentType, volume: number, t: number) {
      switch (type) {
        case InstrumentType.KICK: this.play8BitKick(t, volume); break;
        case InstrumentType.SNARE: this.play8BitSnare(t, volume); break;
        case InstrumentType.HIHAT: this.play8BitHiHat(t, volume); break;
        case InstrumentType.CLAP: this.play8BitClap(t, volume); break;
        case InstrumentType.BASS: this.play8BitBass(t, volume); break;
        case InstrumentType.SYNTH: this.play8BitSynth(t, volume); break;
      }
  }

  // --- 8-BIT IMPLEMENTATIONS ---
  private play8BitKick(time: number, vol: number) {
      if (!this.ctx || !this.mixBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square'; 
      osc.connect(gain);
      gain.connect(this.mixBus); // Ensure connection to mixBus
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.12);
      osc.start(time);
      osc.stop(time + 0.12);
  }

  private play8BitSnare(time: number, vol: number) {
      this.playNoise(time, vol, 0.1, 'lowpass', 3000); 
  }

  private play8BitHiHat(time: number, vol: number) {
      this.playNoise(time, vol * 0.8, 0.05, 'highpass', 1000); 
  }

  private play8BitClap(time: number, vol: number) {
      this.playNoise(time, vol, 0.15, 'bandpass', 1500);
  }

  private play8BitBass(time: number, vol: number) {
      if (!this.ctx || !this.mixBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle'; 
      osc.connect(gain);
      gain.connect(this.mixBus);
      const notes = [110, 130.81, 146.83, 164.81]; 
      const freq = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.setValueAtTime(vol, time + 0.2);
      gain.gain.linearRampToValueAtTime(0, time + 0.25);
      osc.start(time);
      osc.stop(time + 0.25);
  }

  private play8BitSynth(time: number, vol: number) {
      if (!this.ctx || !this.mixBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(this.mixBus);
      const notes = [440, 523.25, 659.25, 783.99];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vol * 0.8, time);
      gain.gain.setValueAtTime(vol * 0.8, time + 0.1);
      gain.gain.linearRampToValueAtTime(0, time + 0.12);
      osc.start(time);
      osc.stop(time + 0.12);
  }

  private playNoise(time: number, vol: number, duration: number, filterType: BiquadFilterType, filterFreq: number) {
      if (!this.ctx || !this.mixBus) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() > 0.5 ? 1 : -1; 
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.mixBus); // Ensure connection
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      noise.start(time);
  }

  // --- ANALOG IMPLEMENTATIONS (Original) ---

  private playKick(time: number, vol: number) {
    if (!this.ctx || !this.mixBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.mixBus);
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playSnare(time: number, vol: number) {
    if (!this.ctx || !this.mixBus) return;
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.connect(oscGain);
    oscGain.connect(this.mixBus);
    osc.frequency.setValueAtTime(250, time);
    oscGain.gain.setValueAtTime(vol * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);
    const bufferSize = this.ctx.sampleRate * 0.2; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.mixBus);
    noiseGain.gain.setValueAtTime(vol, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    noise.start(time);
  }

  private playHiHat(time: number, vol: number) {
    if (!this.ctx || !this.mixBus) return;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixBus);
    gain.gain.setValueAtTime(vol * 0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    noise.start(time);
  }

  private playClap(time: number, vol: number) {
     if (!this.ctx || !this.mixBus) return;
     const bufferSize = this.ctx.sampleRate * 0.2;
     const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
     }
     const noise = this.ctx.createBufferSource();
     noise.buffer = buffer;
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'bandpass';
     filter.frequency.value = 900;
     const gain = this.ctx.createGain();
     noise.connect(filter);
     filter.connect(gain);
     gain.connect(this.mixBus);
     gain.gain.setValueAtTime(0, time);
     gain.gain.linearRampToValueAtTime(vol, time + 0.01);
     gain.gain.exponentialRampToValueAtTime(0.1, time + 0.03);
     gain.gain.linearRampToValueAtTime(vol, time + 0.04);
     gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
     noise.start(time);
  }

  private playBass(time: number, vol: number) {
    if (!this.ctx || !this.mixBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixBus);
    const notes = [32.70, 38.89, 43.65, 49.00]; 
    const freq = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(freq, time);
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(50, time + 0.3);
    gain.gain.setValueAtTime(vol * 0.9, time);
    gain.gain.linearRampToValueAtTime(vol * 0.7, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  private playSynth(time: number, vol: number) {
    if (!this.ctx || !this.mixBus) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    const notes = [261.63, 311.13, 392.00, 466.16]; 
    const freq = notes[Math.floor(Math.random() * notes.length)];
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.01; 
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 2;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.mixBus);
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.5);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol * 0.5, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.6);
    osc2.stop(time + 0.6);
  }

  public getCurrentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
}

export const audioEngine = new AudioEngine();