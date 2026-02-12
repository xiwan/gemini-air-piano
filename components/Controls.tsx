import React, { useState } from 'react';
import { Volume2, Play, Square, Music } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface ControlsProps {
  isAudioInitialized: boolean;
  onInitializeAudio: () => void;
  onAutoPlayStateChange: (note: string | null) => void;
}

const SONGS = [
  {
    name: "Twinkle Twinkle",
    notes: [
      {freq: 261.63, delay: 500, noteName: 'C4'}, {freq: 261.63, delay: 500, noteName: 'C4'},
      {freq: 392.00, delay: 500, noteName: 'G4'}, {freq: 392.00, delay: 500, noteName: 'G4'},
      {freq: 440.00, delay: 500, noteName: 'A4'}, {freq: 440.00, delay: 500, noteName: 'A4'},
      {freq: 392.00, delay: 1000, noteName: 'G4'},
      {freq: 349.23, delay: 500, noteName: 'F4'}, {freq: 349.23, delay: 500, noteName: 'F4'},
      {freq: 329.63, delay: 500, noteName: 'E4'}, {freq: 329.63, delay: 500, noteName: 'E4'},
      {freq: 293.66, delay: 500, noteName: 'D4'}, {freq: 293.66, delay: 500, noteName: 'D4'},
      {freq: 261.63, delay: 1000, noteName: 'C4'},
    ]
  },
  {
    name: "Ode to Joy",
    notes: [
      {freq: 329.63, delay: 400, noteName: 'E4'}, {freq: 329.63, delay: 400, noteName: 'E4'},
      {freq: 349.23, delay: 400, noteName: 'F4'}, {freq: 392.00, delay: 400, noteName: 'G4'},
      {freq: 392.00, delay: 400, noteName: 'G4'}, {freq: 349.23, delay: 400, noteName: 'F4'},
      {freq: 329.63, delay: 400, noteName: 'E4'}, {freq: 293.66, delay: 400, noteName: 'D4'},
      {freq: 261.63, delay: 400, noteName: 'C4'}, {freq: 261.63, delay: 400, noteName: 'C4'},
      {freq: 293.66, delay: 400, noteName: 'D4'}, {freq: 329.63, delay: 400, noteName: 'E4'},
      {freq: 329.63, delay: 600, noteName: 'E4'}, {freq: 293.66, delay: 200, noteName: 'D4'},
      {freq: 293.66, delay: 800, noteName: 'D4'},
    ]
  },
  {
      name: "Für Elise (Excerpt)",
      notes: [
          {freq: 329.63, delay: 300, noteName: 'E4'}, {freq: 493.88, delay: 300, noteName: 'B4'},
          {freq: 329.63, delay: 300, noteName: 'E4'}, {freq: 493.88, delay: 300, noteName: 'B4'},
          {freq: 329.63, delay: 300, noteName: 'E4'}, {freq: 493.88, delay: 300, noteName: 'B4'},
          {freq: 329.63, delay: 300, noteName: 'E4'}, {freq: 440.00, delay: 300, noteName: 'A4'},
          {freq: 329.63, delay: 600, noteName: 'E4'}
      ]
  }
];

const Controls: React.FC<ControlsProps> = ({ isAudioInitialized, onInitializeAudio, onAutoPlayStateChange }) => {
  const [selectedSongIdx, setSelectedSongIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!isAudioInitialized) {
        onInitializeAudio();
        return;
    }
    if (isPlaying) {
      audioEngine.stopAll();
      setIsPlaying(false);
      onAutoPlayStateChange(null);
    } else {
      setIsPlaying(true);
      const song = SONGS[selectedSongIdx];
      audioEngine.playSequence(
        song.notes, 
        (note) => onAutoPlayStateChange(note),
        () => {
          setIsPlaying(false);
          onAutoPlayStateChange(null);
        }
      );
    }
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tighter">
            Music Center
        </h2>
        <div className={`h-2 w-2 rounded-full ${isAudioInitialized ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`}></div>
      </div>

      {/* Song Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            <Music size={14} /> Select Masterpiece
        </label>
        <select 
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
            value={selectedSongIdx}
            onChange={(e) => {
                setSelectedSongIdx(parseInt(e.target.value));
                if(isPlaying) togglePlay();
            }}
        >
            {SONGS.map((song, idx) => (
                <option key={song.name} value={idx}>{song.name}</option>
            ))}
        </select>
      </div>

      {/* Play Controls */}
      <button 
        onClick={togglePlay}
        disabled={!isAudioInitialized && isPlaying}
        className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
            isPlaying 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/40 hover:brightness-110'
        }`}
      >
        {isPlaying ? <><Square size={20} /> Stop Concert</> : <><Play size={20} /> Start Auto-Play</>}
      </button>

      {/* Hand Mapping Guide */}
      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
         <div className="text-[10px] font-bold text-slate-500 uppercase mb-3">Live Finger Mapping</div>
         <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
                <div className="text-blue-400 font-bold mb-1">Left Hand</div>
                <div className="flex justify-between opacity-70"><span>Ring</span> <span>C4</span></div>
                <div className="flex justify-between opacity-70"><span>Mid</span> <span>D4</span></div>
                <div className="flex justify-between opacity-70"><span>Idx</span> <span>E4</span></div>
                <div className="flex justify-between text-yellow-400"><span>Thumb</span> <span>F4</span></div>
            </div>
            <div className="space-y-1">
                <div className="text-purple-400 font-bold mb-1">Right Hand</div>
                <div className="flex justify-between text-yellow-400"><span>Thumb</span> <span>G4</span></div>
                <div className="flex justify-between opacity-70"><span>Idx</span> <span>A4</span></div>
                <div className="flex justify-between opacity-70"><span>Mid</span> <span>B4</span></div>
                <div className="flex justify-between opacity-70"><span>Ring</span> <span>C5</span></div>
            </div>
         </div>
      </div>

      {!isAudioInitialized && (
          <p className="text-[10px] text-center text-slate-500 animate-pulse uppercase font-bold tracking-widest">
              Audio Engine Offline - Click Start
          </p>
      )}
    </div>
  );
};

export default Controls;