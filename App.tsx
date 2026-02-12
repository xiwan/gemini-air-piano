import React, { useState } from 'react';
import AirPianoCanvas from './components/AirGuitarCanvas';
import Controls from './components/Controls';
import { audioEngine } from './services/audioEngine';

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [autoPlayingNote, setAutoPlayingNote] = useState<string | null>(null);

  const handleInitializeAudio = async () => {
    await audioEngine.init();
    setIsAudioInitialized(true);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8">
        
        {/* Main Stage */}
        <div className="flex-[2] relative aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)]">
            {!isAudioInitialized && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                    <div className="w-24 h-24 mb-8 relative">
                        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative z-10 w-full h-full border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <button 
                        onClick={handleInitializeAudio}
                        className="px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:scale-105 transition-transform active:scale-95"
                    >
                        INITIALIZE AI PIANO
                    </button>
                    <p className="mt-6 text-slate-500 text-xs tracking-widest uppercase font-bold">Requesting Camera & Audio Access</p>
                </div>
            )}
            
            <AirPianoCanvas 
                isAudioReady={isAudioInitialized}
                autoPlayingNote={autoPlayingNote}
            />
        </div>

        {/* Control Panel */}
        <div className="flex-1">
            <Controls 
                isAudioInitialized={isAudioInitialized}
                onInitializeAudio={handleInitializeAudio}
                onAutoPlayStateChange={(note) => setAutoPlayingNote(note)}
            />
            
            <div className="mt-6 p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-2">System Status</p>
                <div className="flex justify-center gap-2">
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] border border-blue-500/20">MediaPipe v0.4</div>
                    <div className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] border border-purple-500/20">Web Audio API</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;