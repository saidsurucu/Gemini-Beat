import React from 'react';
import { MasterEffects } from '../types';

interface FXPanelProps {
  settings: MasterEffects;
  onUpdate: (newSettings: MasterEffects) => void;
}

const RotaryKnob: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  colorClass?: string;
}> = ({ label, value, min, max, onChange, colorClass = "bg-gray-300" }) => {
  
  // Map value to rotation (-135deg to 135deg)
  const percent = (value - min) / (max - min);
  const rotation = -135 + (percent * 270);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10 sm:w-12 sm:h-12">
        {/* Invisible Range Input for Interaction */}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={(max - min) / 100}
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
          title={`${label}: ${value.toFixed(2)}`}
        />
        
        {/* Visual Knob */}
        <div 
          className="w-full h-full knob-outer shadow-xl transform transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
             <div className="knob-cap"></div>
             <div className={`knob-pointer ${percent > 0.8 ? 'bg-red-500 shadow-[0_0_4px_red]' : 'bg-white'}`}></div>
        </div>
      </div>
      <span className="text-[9px] font-tech text-gray-400 tracking-widest uppercase">{label}</span>
    </div>
  );
};

const FXPanel: React.FC<FXPanelProps> = ({ settings, onUpdate }) => {
  
  const updateDist = (key: keyof MasterEffects['distortion'], val: any) => {
    onUpdate({
      ...settings,
      distortion: { ...settings.distortion, [key]: val }
    });
  };

  const updateDelay = (key: keyof MasterEffects['delay'], val: any) => {
    onUpdate({
      ...settings,
      delay: { ...settings.delay, [key]: val }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 bg-[#1e1e1e] rounded-sm border border-black shadow-hardware-in p-2 mt-2 relative overflow-hidden">
      
      {/* Decorative Vent */}
      <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/50 hidden sm:block"></div>
      
      {/* DISTORTION UNIT */}
      <div className="flex-1 flex items-center justify-between sm:justify-around px-2 sm:px-4 relative">
         <div className="absolute top-1 left-2 text-[10px] font-bold text-gray-600 tracking-widest">OVERDRIVE</div>
         
         {/* Toggle Switch */}
         <div className="flex flex-col items-center gap-2">
             <button 
               onClick={() => updateDist('enabled', !settings.distortion.enabled)}
               className={`w-8 h-4 rounded-full border border-black shadow-inner relative transition-colors ${settings.distortion.enabled ? 'bg-red-900' : 'bg-gray-800'}`}
             >
                 <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 shadow-md ${settings.distortion.enabled ? 'left-[18px] bg-red-500 shadow-[0_0_5px_red]' : 'left-0.5 bg-gray-500'}`}></div>
             </button>
             <span className="text-[8px] text-gray-500">ACTIVE</span>
         </div>

         {/* Knobs */}
         <RotaryKnob 
            label="DRIVE" 
            min={0} max={100} 
            value={settings.distortion.amount} 
            onChange={(v) => updateDist('amount', v)} 
         />
      </div>

      {/* DELAY UNIT */}
      <div className="flex-[2] flex items-center justify-between sm:justify-around px-2 sm:px-4 border-t sm:border-t-0 sm:border-l border-white/5 relative pt-2 sm:pt-0">
         <div className="absolute top-1 left-2 text-[10px] font-bold text-gray-600 tracking-widest">TAPE DELAY</div>

          {/* Toggle */}
         <div className="flex flex-col items-center gap-2">
             <button 
               onClick={() => updateDelay('enabled', !settings.delay.enabled)}
               className={`w-8 h-4 rounded-full border border-black shadow-inner relative transition-colors ${settings.delay.enabled ? 'bg-green-900' : 'bg-gray-800'}`}
             >
                 <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 shadow-md ${settings.delay.enabled ? 'left-[18px] bg-green-500 shadow-[0_0_5px_lime]' : 'left-0.5 bg-gray-500'}`}></div>
             </button>
             <span className="text-[8px] text-gray-500">ACTIVE</span>
         </div>

         <RotaryKnob 
            label="TIME" 
            min={0.01} max={1.0} 
            value={settings.delay.time} 
            onChange={(v) => updateDelay('time', v)} 
         />
         <RotaryKnob 
            label="F.BACK" 
            min={0} max={0.9} 
            value={settings.delay.feedback} 
            onChange={(v) => updateDelay('feedback', v)} 
         />
         <RotaryKnob 
            label="MIX" 
            min={0} max={1} 
            value={settings.delay.mix} 
            onChange={(v) => updateDelay('mix', v)} 
         />
      </div>

    </div>
  );
};

export default FXPanel;