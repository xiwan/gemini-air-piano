import { GoogleGenAI, Type } from "@google/genai";
import { Chord } from "../types";

// Ukulele Standard Tuning (G4, C4, E4, A4) - Re-entrant tuning
// Frequencies for 4th and 5th octaves
const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
  'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46
};

// Map chords to 4 Ukulele strings: [G, C, E, A]
// 0: G string (Top visually usually, but technically String 4)
// 1: C string
// 2: E string
// 3: A string (Bottom visually, String 1)
const CHORD_MAP: Record<string, number[]> = {
  // C Major: 0 0 0 3 (G C E C5)
  'C':  [NOTE_FREQS.G4, NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.C5],
  
  // G Major: 0 2 3 2 (G D G B) -> G4, D4, G4, B4
  'G':  [NOTE_FREQS.G4, NOTE_FREQS.D4, NOTE_FREQS.G4, NOTE_FREQS.B4],
  
  // Am: 2 0 0 0 (A C E A) -> A4, C4, E4, A4
  'Am': [NOTE_FREQS.A4, NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.A4],
  
  // F Major: 2 0 1 0 (A C F A) -> A4, C4, F4, A4
  'F':  [NOTE_FREQS.A4, NOTE_FREQS.C4, NOTE_FREQS.F4, NOTE_FREQS.A4],
  
  // Em: 0 4 3 2 (G E G B) -> G4, E4, G4, B4
  'Em': [NOTE_FREQS.G4, NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4],
  
  // Dm: 2 2 1 0 (A D F A) -> A4, D4, F4, A4
  'Dm': [NOTE_FREQS.A4, NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.A4],
};

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];

export const generateChordsWithGemini = async (mood: string): Promise<Chord[]> => {
  if (!process.env.API_KEY) {
    return getDefaultChords();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a 4-chord Ukulele progression for a "${mood}" mood. Return exactly 4 chords. Use standard chords (C, G, F, Am, Em, Dm).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            progressionName: { type: Type.STRING },
            chords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const chordNames: string[] = data.chords || ['C', 'Am', 'F', 'G'];

    return chordNames.map((name, idx) => {
      // Clean name
      const cleanName = name.replace('maj', '').trim();
      const notes = CHORD_MAP[cleanName] || CHORD_MAP['C']; 
      return {
        name: cleanName,
        notes: notes,
        color: COLORS[idx % COLORS.length]
      };
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return getDefaultChords();
  }
};

export const getDefaultChords = (): Chord[] => [
  { name: 'C', notes: CHORD_MAP.C, color: COLORS[0] },
  { name: 'G', notes: CHORD_MAP.G, color: COLORS[1] },
  { name: 'Am', notes: CHORD_MAP.Am, color: COLORS[2] },
  { name: 'F', notes: CHORD_MAP.F, color: COLORS[3] },
];