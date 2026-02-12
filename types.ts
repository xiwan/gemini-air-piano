export interface PianoKey {
  note: string;
  freq: number;
  color: string; // 'white' | 'black'
  isActive: boolean;
  rect: { x: number, y: number, w: number, h: number }; // Normalized coordinates (0-1)
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Keep Chord interface for compatibility if we switch modes later, 
// but currently we focus on direct key mapping.
export interface Chord {
  name: string;
  notes: number[]; 
  color: string;
}
