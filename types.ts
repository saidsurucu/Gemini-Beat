export enum InstrumentType {
  KICK = 'KICK',
  SNARE = 'SNARE',
  HIHAT = 'HIHAT',
  CLAP = 'CLAP',
  BASS = 'BASS',
  SYNTH = 'SYNTH'
}

export interface Track {
  id: string;
  name: string;
  type: InstrumentType;
  steps: boolean[]; // Array of 16 steps
  muted: boolean;
  volume: number; // 0 to 1
  hue: string; // Color for UI
}

export interface PatternData {
  bpm: number;
  description: string;
  tracks: Track[];
}

export interface AIResponseSchema {
  bpm: number;
  tracks: {
    type: string;
    steps: number[]; // 0 or 1
  }[];
}

export interface AudioContextState {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
}

export interface MasterEffects {
  distortion: {
    enabled: boolean;
    amount: number; // 0 to 100
  };
  delay: {
    enabled: boolean;
    time: number; // 0.0 to 1.0s
    feedback: number; // 0.0 to 0.9
    mix: number; // 0.0 to 1.0 (Wet level)
  };
}