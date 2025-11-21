import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InstrumentType, Track, MasterEffects } from './types';
import { audioEngine } from './utils/audioEngine';
import TrackRow from './components/TrackRow';
import ControlPanel from './components/ControlPanel';
import FXPanel from './components/FXPanel';
import { generatePattern } from './services/geminiService';

// Default Initial State
const INITIAL_BPM = 120;
const INITIAL_TRACKS: Track[] = [
  { id: 'kick', name: 'BD-808', type: InstrumentType.KICK, steps: Array(16).fill(false), muted: false, volume: 0.9, hue: '#ef4444' }, 
  { id: 'snare', name: 'SD-ANLG', type: InstrumentType.SNARE, steps: Array(16).fill(false), muted: false, volume: 0.8, hue: '#eab308' }, 
  { id: 'hihat', name: 'CH-909', type: InstrumentType.HIHAT, steps: Array(16).fill(false), muted: false, volume: 0.7, hue: '#06b6d4' },
  { id: 'clap', name: 'CP-RETRO', type: InstrumentType.CLAP, steps: Array(16).fill(false), muted: false, volume: 0.8, hue: '#d946ef' },
  { id: 'bass', name: 'BASS-303', type: InstrumentType.BASS, steps: Array(16).fill(false), muted: false, volume: 0.8, hue: '#8b5cf6' },
  { id: 'synth', name: 'LEAD-FM', type: InstrumentType.SYNTH, steps: Array(16).fill(false), muted: false, volume: 0.7, hue: '#10b981' }, 
];

// Set a default pattern
INITIAL_TRACKS[0].steps[0] = true; 
INITIAL_TRACKS[0].steps[4] = true; 
INITIAL_TRACKS[0].steps[8] = true; 
INITIAL_TRACKS[0].steps[12] = true;
INITIAL_TRACKS[2].steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]; 

const INITIAL_FX: MasterEffects = {
  distortion: { enabled: false, amount: 0 },
  delay: { enabled: false, time: 0.3, feedback: 0.3, mix: 0.2 }
};

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [bpm, setBpm] = useState(INITIAL_BPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChiptune, setIsChiptune] = useState(false);
  const [fxSettings, setFxSettings] = useState<MasterEffects>(INITIAL_FX);

  // Timing refs
  const nextNoteTimeRef = useRef<number>(0);
  const currentStepRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const lookahead = 25.0; 
  const scheduleAheadTime = 0.1;

  useEffect(() => {
    const unlockAudio = () => {
      // Just a listener cleanup mainly, play button handles logic
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  // Update AudioEngine when FX settings change
  useEffect(() => {
    audioEngine.updateEffects(fxSettings);
  }, [fxSettings]);

  const toggleChiptune = () => {
    const newState = !isChiptune;
    setIsChiptune(newState);
    audioEngine.setChiptuneMode(newState);
    
    setTracks(prev => prev.map(t => {
      let newName = t.name;
      if (newState) {
        if (t.type === InstrumentType.KICK) newName = 'NES-KICK';
        if (t.type === InstrumentType.SNARE) newName = 'NOISE-SD';
        if (t.type === InstrumentType.HIHAT) newName = 'BIT-HAT';
        if (t.type === InstrumentType.CLAP) newName = 'BIT-CLAP';
        if (t.type === InstrumentType.BASS) newName = 'TRI-BASS';
        if (t.type === InstrumentType.SYNTH) newName = 'PULSE-LD';
      } else {
        const def = INITIAL_TRACKS.find(it => it.id === t.id);
        if (def) newName = def.name;
      }
      return { ...t, name: newName };
    }));
  };

  const nextNote = useCallback(() => {
    const secondsPerBeat = 60.0 / bpm;
    const secondsPerStep = secondsPerBeat / 4; 
    nextNoteTimeRef.current += secondsPerStep;
    currentStepRef.current = (currentStepRef.current + 1) % 16;
  }, [bpm]);

  const scheduleNote = useCallback((stepNumber: number, time: number) => {
    requestAnimationFrame(() => {
        setCurrentStep(stepNumber);
    });

    tracks.forEach(track => {
      if (track.steps[stepNumber] && !track.muted) {
        audioEngine.trigger(track.type, track.volume, time);
      }
    });
  }, [tracks]);

  const scheduler = useCallback(() => {
    if (!audioEngine.getCurrentTime()) return;
    
    while (nextNoteTimeRef.current < audioEngine.getCurrentTime() + scheduleAheadTime) {
      scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  }, [nextNote, scheduleNote]);

  useEffect(() => {
    if (isPlaying) {
      audioEngine.init(); // Ensure context is running
      // Apply FX immediately on start
      audioEngine.updateEffects(fxSettings);
      
      if (audioEngine.getCurrentTime() === 0) audioEngine.init();
      nextNoteTimeRef.current = audioEngine.getCurrentTime() + 0.1;
      currentStepRef.current = 0;
      scheduler();
    } else {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    }
    return () => {
      if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
    };
  }, [isPlaying, scheduler, fxSettings]);

  const togglePlay = () => {
    // Critical for browser autoplay policy
    audioEngine.init();
    setIsPlaying(!isPlaying);
  };

  const handleStepToggle = (trackId: string, stepIndex: number) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        const newSteps = [...t.steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        return { ...t, steps: newSteps };
      }
      return t;
    }));
  };

  const handleMuteToggle = (trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t));
  };

  const handleVolumeChange = (trackId: string, val: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, volume: val } : t));
  };

  const handleClear = () => {
    setTracks(prev => prev.map(t => ({ ...t, steps: Array(16).fill(false) })));
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleAIGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setIsPlaying(false);
    try {
      const data = await generatePattern(prompt);
      if (data) {
        setBpm(Math.min(Math.max(data.bpm, 60), 180));
        setTracks(prevTracks => {
           return prevTracks.map(track => {
             const aiTrack = data.tracks.find(t => t.type.toUpperCase() === track.type.toUpperCase());
             if (aiTrack && aiTrack.steps.length === 16) {
               return {
                 ...track,
                 steps: aiTrack.steps.map(s => s === 1)
               };
             }
             return track;
           });
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-2 md:p-6 overflow-hidden">
      
      {/* Device Container with Wood Cheeks */}
      <div className="relative flex shadow-2xl transform md:rotate-1 transition-transform duration-500">
        
        {/* Left Wood Cheek */}
        <div className="hidden md:block w-8 bg-chassis-base rounded-l-md texture-wood relative z-10 border-r border-black"></div>

        {/* Main Chassis */}
        <div className="relative w-full max-w-6xl bg-chassis-base texture-metal-dark flex flex-col overflow-hidden max-h-[95vh] border-t-2 border-b-4 border-black min-w-[340px] md:min-w-[800px]">
          
          {/* Screws Main Chassis */}
          <div className="absolute top-3 left-3 z-20"><div className="screw-head"></div></div>
          <div className="absolute top-3 right-3 z-20"><div className="screw-head"></div></div>
          <div className="absolute bottom-3 left-3 z-20"><div className="screw-head"></div></div>
          <div className="absolute bottom-3 right-3 z-20"><div className="screw-head"></div></div>

          {/* Master Header Section */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-chassis-light to-chassis-base border-b border-black shadow-lg z-10 shrink-0">
            <div className="flex justify-between items-end mb-4 pl-4 pr-4">
              <div>
                 <h1 className="text-white/90 font-display text-3xl tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    GEMINI<span className="text-sky-500">BEAT</span>
                 </h1>
                 <div className="text-[10px] font-tech text-gray-500 tracking-[0.3em] uppercase pl-1 mt-[-4px]">
                    Integrated Rhythm Station
                 </div>
              </div>
              
              {/* Power LED Simulation */}
              <div className="flex flex-col items-center gap-1">
                 <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_#ff0000] border border-red-900"></div>
                 <span className="text-[9px] font-mono text-gray-500">PWR</span>
              </div>
            </div>
            
            <ControlPanel 
              isPlaying={isPlaying}
              bpm={bpm}
              setBpm={setBpm}
              onPlayToggle={togglePlay}
              onClear={handleClear}
              onGenerate={handleAIGenerate}
              isGenerating={isGenerating}
              isChiptune={isChiptune}
              onToggleChiptune={toggleChiptune}
            />

            {/* NEW: Master FX Rack Unit */}
            <FXPanel settings={fxSettings} onUpdate={setFxSettings} />

          </div>

          {/* Sequencer Section (Recessed) */}
          <div className="flex-1 bg-[#1a1a1a] shadow-hardware-in p-4 md:p-6 overflow-y-auto custom-scroll relative mx-4 mb-4 rounded border border-white/5">
             
             {/* Background Grid Lines */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

             <div className="relative z-10 space-y-4">
               {tracks.map(track => (
                 <TrackRow 
                   key={track.id}
                   track={track}
                   currentStep={currentStep}
                   onToggleStep={handleStepToggle}
                   onMuteToggle={handleMuteToggle}
                   onVolumeChange={handleVolumeChange}
                 />
               ))}
             </div>
          </div>
          
        </div>

        {/* Right Wood Cheek */}
        <div className="hidden md:block w-8 bg-chassis-base rounded-r-md texture-wood relative z-10 border-l border-black"></div>
      </div>
    </div>
  );
};

export default App;