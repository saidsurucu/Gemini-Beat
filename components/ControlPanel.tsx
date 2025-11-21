import React from 'react';
import { Play, Square, Trash2, Gamepad2 } from 'lucide-react';

interface ControlPanelProps {
  isPlaying: boolean;
  bpm: number;
  setBpm: (bpm: number) => void;
  onPlayToggle: () => void;
  onClear: () => void;
  isChiptune: boolean;
  onToggleChiptune: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isPlaying, bpm, setBpm, onPlayToggle, onClear, isChiptune, onToggleChiptune
}) => {

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-center bg-chassis-metal p-4 rounded shadow-hardware-out border-t border-white/10">
      
      {/* Main Control Section */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 justify-center">
        
        {/* LCD Display Module */}
        <div className="relative group">
            {/* Bezel */}
            <div className="bg-gray-800 p-1 rounded-md shadow-hardware-deep border border-gray-900">
                <div className="bg-lcd-bg w-36 h-24 rounded border-4 border-black relative overflow-hidden shadow-inner">
                    {/* LCD Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                        <div className="scanlines absolute inset-0 opacity-20 pointer-events-none"></div>
                        <span className={`font-lcd text-6xl leading-none drop-shadow-md ${isChiptune ? 'text-led-yellow' : 'text-lcd-text'}`}>
                            {bpm}
                        </span>
                        <span className="font-mono text-[10px] text-lcd-dim mt-1 tracking-widest">MASTER BPM</span>
                        
                        {/* Status Indicators */}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                             <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? (isChiptune ? 'bg-led-yellow animate-pulse' : 'bg-lcd-text animate-pulse') : 'bg-black/50'}`}></div>
                             <div className={`w-1.5 h-1.5 rounded-full ${isChiptune ? 'bg-led-yellow' : 'bg-black/50'}`}></div>
                        </div>
                    </div>
                    {/* Glass Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none shadow-glass rounded-sm"></div>
                </div>
            </div>
        </div>

        {/* Controls Group */}
        <div className="flex gap-6 items-end">
            {/* BPM Slider */}
            <div className="flex flex-col items-center gap-2 w-24">
                <div className="relative w-full h-8 bg-black rounded shadow-inner border border-gray-700 flex items-center px-2">
                     <input
                        type="range"
                        min="60"
                        max="180"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="fader w-full"
                     />
                </div>
                <label className="text-[9px] font-tech text-gray-400 uppercase tracking-widest">Tempo Adj.</label>
            </div>

             {/* Mode Switch */}
            <div className="flex flex-col items-center gap-2">
                <button 
                onClick={onToggleChiptune}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-100 relative overflow-hidden group ${
                    isChiptune 
                    ? 'bg-yellow-600 border-yellow-800 text-yellow-100 shadow-[0_0_15px_#ca8a04]' 
                    : 'bg-gradient-to-b from-gray-700 to-gray-800 border-gray-900 text-gray-500 shadow-hardware-out active:shadow-hardware-pressed active:scale-95'
                }`}
                title="8-Bit Mode"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    <Gamepad2 size={22} />
                </button>
                <label className="text-[9px] font-tech text-gray-400 uppercase tracking-widest">8-BIT</label>
            </div>
        </div>

        {/* Transport Buttons (Chunky) */}
        <div className="flex gap-3 ml-2 p-2 bg-black/20 rounded border border-white/5 shadow-inner">
            <button
              onClick={onPlayToggle}
              className={`w-16 h-14 rounded flex items-center justify-center border-b-4 transition-all active:border-b-0 active:translate-y-1 duration-75 relative overflow-hidden ${
                isPlaying 
                  ? 'bg-red-600 border-red-900 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' 
                  : 'bg-gray-300 border-gray-500 text-gray-800 hover:bg-white shadow-hardware-out'
              }`}
            >
               <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
               {isPlaying ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button 
                onClick={onClear}
                className="w-12 h-14 rounded bg-gray-700 border-b-4 border-gray-900 text-gray-400 flex items-center justify-center active:border-b-0 active:translate-y-1 active:bg-red-900 active:text-red-200 hover:text-gray-200 hover:bg-gray-600 transition-all shadow-hardware-out"
                title="Clear Pattern"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>
      
    </div>
  );
};

export default ControlPanel;