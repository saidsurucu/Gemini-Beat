import React, { memo } from 'react';
import { Track } from '../types';

interface TrackRowProps {
  track: Track;
  currentStep: number;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onMuteToggle: (trackId: string) => void;
  onVolumeChange: (trackId: string, val: number) => void;
}

const TrackRow: React.FC<TrackRowProps> = memo(({ track, currentStep, onToggleStep, onMuteToggle, onVolumeChange }) => {
  
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-1 sm:gap-4">
      
      {/* --- Left Module: Channel Strip --- */}
      <div className="w-full sm:w-40 bg-chassis-metal rounded-sm border-t border-white/10 border-b border-black shadow-hardware-out p-2 flex sm:flex-col gap-2 relative shrink-0 items-center sm:items-stretch">
        
        {/* Screws */}
        <div className="hidden sm:block absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#222] shadow-inner"></div>
        <div className="hidden sm:block absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#222] shadow-inner"></div>
        <div className="hidden sm:block absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#222] shadow-inner"></div>
        <div className="hidden sm:block absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#222] shadow-inner"></div>

        {/* Label & Mute */}
        <div className="flex justify-between items-center mt-1 mb-1 px-1">
           <span className="font-tech font-bold text-xs text-gray-300 truncate w-20 tracking-wider uppercase text-shadow">{track.name}</span>
           
           {/* Physical Mute Button */}
           <button 
             onClick={() => onMuteToggle(track.id)}
             className={`w-6 h-4 rounded-sm border border-black shadow-md transition-all flex items-center justify-center relative overflow-hidden ${
                 track.muted 
                 ? 'bg-red-900 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)] translate-y-[1px] border-t-black/50' 
                 : 'bg-gray-400 shadow-hardware-out active:shadow-hardware-pressed active:translate-y-[1px]'
             }`}
             title="Mute"
           >
             <div className={`w-2 h-1 rounded-full ${track.muted ? 'bg-red-500 shadow-[0_0_4px_red]' : 'bg-gray-600'}`}></div>
           </button>
        </div>

        {/* Volume Fader Slot */}
        <div className="fader-track-slot h-8 sm:h-6 w-full flex items-center relative px-2">
            {/* Ruler Lines */}
            <div className="absolute top-1 bottom-1 left-1/2 w-[1px] bg-transparent flex flex-col justify-between h-full opacity-30 pointer-events-none">
               <div className="w-full h-[1px] bg-gray-500 w-2 -ml-1"></div>
               <div className="w-full h-[1px] bg-gray-500 w-2 -ml-1"></div>
               <div className="w-full h-[1px] bg-gray-500 w-2 -ml-1"></div>
            </div>

            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={track.volume}
                onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                className="fader w-full z-10 relative"
            />
        </div>
      </div>

      {/* --- Right Module: Sequencer Steps --- */}
      <div className="flex-1 grid grid-cols-8 sm:grid-cols-16 gap-1 p-1.5 bg-[#111] rounded shadow-hardware-in border border-white/5 items-center justify-center">
        {track.steps.map((active, idx) => {
             const isCurrent = idx === currentStep;
             const isBeatStart = idx % 4 === 0;
             
             return (
                <button
                    key={idx}
                    onClick={() => onToggleStep(track.id, idx)}
                    className={`
                    relative w-full aspect-[4/5] sm:aspect-square rounded-sm transition-all duration-75 group
                    flex flex-col items-center justify-center gap-1
                    ${isBeatStart ? 'mr-[2px]' : ''}
                    ${active 
                        ? `bg-gray-800 border-b-0 mt-[2px] shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]` 
                        : 'bg-chassis-light border-b-4 border-black shadow-hardware-out hover:bg-gray-600 active:border-b-0 active:mt-[4px] active:shadow-none'
                    }
                    `}
                >
                    {/* LED on the pad */}
                    <div 
                        className={`w-2 h-1.5 rounded-sm transition-all duration-150 border border-black/20 ${
                        active 
                            ? `bg-[${track.hue}] shadow-[0_0_6px_${track.hue}] opacity-100` 
                            : 'bg-[#2a1a1a] opacity-60'
                        }`}
                        style={{ backgroundColor: active ? track.hue : undefined }}
                    ></div>

                    {/* Tactile Grip Lines */}
                    {!active && (
                        <div className="w-3 h-[1px] bg-black/30"></div>
                    )}
                    
                    {/* Playhead overlay */}
                    {isCurrent && (
                        <div className="absolute -inset-1 border border-white/40 rounded opacity-100 pointer-events-none shadow-[0_0_4px_white]"></div>
                    )}
                </button>
            )
        })}
      </div>
    </div>
  );
});

export default TrackRow;