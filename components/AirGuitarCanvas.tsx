import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as mpHands from '@mediapipe/hands';
import { audioEngine } from '../services/audioEngine';

interface Results {
  multiHandLandmarks?: { x: number; y: number; z: number }[][];
  multiHandedness?: { index: number; score: number; label: string; displayName: string }[];
}

interface AirPianoCanvasProps {
  isAudioReady: boolean;
  autoPlayingNote: string | null;
}

const WHITE_KEYS_CONFIG = [
  { note: 'C4', freq: 261.63, label: 'L-Ring' },
  { note: 'D4', freq: 293.66, label: 'L-Mid' },
  { note: 'E4', freq: 329.63, label: 'L-Idx' },
  { note: 'F4', freq: 349.23, label: 'L-Thumb' },
  { note: 'G4', freq: 392.00, label: 'R-Thumb' },
  { note: 'A4', freq: 440.00, label: 'R-Idx' },
  { note: 'B4', freq: 493.88, label: 'R-Mid' },
  { note: 'C5', freq: 523.25, label: 'R-Ring' },
];

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

function calculateAngle(a: any, b: any, c: any) {
    if (!a || !b || !c) return 180;
    const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
    const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
    return Math.acos(Math.max(-1, Math.min(1, dot / ((mag1 * mag2) || 1)))) * (180 / Math.PI);
}

const AirPianoCanvas: React.FC<AirPianoCanvasProps> = ({ isAudioReady, autoPlayingNote }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsInstanceRef = useRef<any>(null);
  const requestRef = useRef<number>(0);

  const isAudioReadyRef = useRef(isAudioReady);
  const activeNotesRef = useRef<Set<string>>(new Set()); 

  useEffect(() => { isAudioReadyRef.current = isAudioReady; }, [isAudioReady]);

  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    
    const horizontalPadding = 20;
    const usableWidth = w - (horizontalPadding * 2);
    const keyWidth = usableWidth / WHITE_KEYS_CONFIG.length;
    const keyHeight = h * 0.35;
    const keyY = h - keyHeight;

    const notesToTriggerNow = new Set<string>();
    const fingerPositions = new Map<number, {x: number, y: number, isHooked: boolean}>();

    if (results.multiHandLandmarks && results.multiHandedness) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const handedness = results.multiHandedness?.[index];
            if (!handedness) return;
            const label = handedness.label;

            const fingerMap: {tip: number, keyIdx: number}[] = [];
            // Note: Camera is mirrored visually, but MediaPipe 'Left' usually means the person's actual left hand.
            // In mirrored view, actual left hand is on the right side of the frame.
            if (label === 'Right') { 
                fingerMap.push({ tip: 16, keyIdx: 0 }, { tip: 12, keyIdx: 1 }, { tip: 8, keyIdx: 2 }, { tip: 4, keyIdx: 3 });
            } else if (label === 'Left') {
                fingerMap.push({ tip: 4, keyIdx: 4 }, { tip: 8, keyIdx: 5 }, { tip: 12, keyIdx: 6 }, { tip: 16, keyIdx: 7 });
            }

            fingerMap.forEach(({ tip, keyIdx }) => {
                const tipP = landmarks[tip];
                if (!tipP) return;
                const angle = calculateAngle(landmarks[tip-2], landmarks[tip-1], tipP);
                const isHooked = angle < 160;
                const visualX = (1 - tipP.x) * w;
                const visualY = tipP.y * h;
                fingerPositions.set(keyIdx, { x: visualX, y: visualY, isHooked });
                if (isHooked) notesToTriggerNow.add(WHITE_KEYS_CONFIG[keyIdx].note);
            });
        });
    }

    // 3. Draw Keys
    WHITE_KEYS_CONFIG.forEach((k, i) => {
      const x = horizontalPadding + (i * keyWidth);
      const isHandPressed = activeNotesRef.current.has(k.note);
      const isAutoPlaying = autoPlayingNote === k.note;
      const isPressed = isHandPressed || isAutoPlaying;

      const gradient = ctx.createLinearGradient(x, keyY, x, h);
      if (isPressed) {
        gradient.addColorStop(0, isAutoPlaying ? '#f59e0b' : '#3b82f6'); 
        gradient.addColorStop(1, isAutoPlaying ? '#b45309' : '#1d4ed8');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(220, 220, 220, 0.9)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 5, keyY, keyWidth - 10, keyHeight - 10, [10, 10, 15, 15]);
      ctx.fill();

      if (isPressed) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = isAutoPlaying ? '#f59e0b' : '#3b82f6';
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isPressed ? '#FFF' : '#333';
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px Arial';
      ctx.fillText(k.note, x + keyWidth / 2, h - 60);
      ctx.font = '12px Arial';
      ctx.fillStyle = isPressed ? 'rgba(255,255,255,0.7)' : '#666';
      ctx.fillText(k.label, x + keyWidth / 2, h - 35);
    });

    // 4. Draw Hand Skeleton (Mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);
    if (results.multiHandLandmarks) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        results.multiHandLandmarks.forEach(landmarks => {
            HAND_CONNECTIONS.forEach(([start, end]) => {
                if (landmarks[start] && landmarks[end]) {
                    ctx.beginPath();
                    ctx.moveTo(landmarks[start].x * w, landmarks[start].y * h);
                    ctx.lineTo(landmarks[end].x * w, landmarks[end].y * h);
                    ctx.stroke();
                }
            });
        });
    }
    ctx.restore();

    // 5. Connection Lines
    fingerPositions.forEach((pos, keyIdx) => {
        const targetX = horizontalPadding + (keyIdx * keyWidth) + (keyWidth / 2);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.bezierCurveTo(pos.x, pos.y + 100, targetX, keyY - 100, targetX, keyY);
        ctx.strokeStyle = pos.isHooked ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = pos.isHooked ? 4 : 1;
        ctx.stroke();
    });

    notesToTriggerNow.forEach(note => {
        if (!activeNotesRef.current.has(note)) {
            const key = WHITE_KEYS_CONFIG.find(k => k.note === note);
            if (key && isAudioReadyRef.current) audioEngine.playPianoNote(key.freq);
        }
    });
    activeNotesRef.current = notesToTriggerNow;
  }, [autoPlayingNote]);

  const detect = useCallback(async () => {
    const video = webcamRef.current?.video;
    // CRITICAL: Ensure video is ready and has dimensions to avoid "buffer" and "abort" errors
    if (video && video.readyState === 4 && video.videoWidth > 0 && handsInstanceRef.current) {
        try {
            await handsInstanceRef.current.send({ image: video });
        } catch (err) {
            console.error("MediaPipe send error:", err);
            // If it's a fatal error, we might want to recreate the instance, 
            // but for now we just skip the frame.
        }
    }
    requestRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    let hands: any = null;
    const init = async () => {
        // More robust module resolution for different environments
        const mpModule = mpHands as any;
        const HandsClass = mpModule.Hands || mpModule.default?.Hands || mpModule.default;
        
        if (!HandsClass) {
          console.error("Could not find Hands class in MediaPipe module");
          return;
        }

        try {
          hands = new HandsClass({ 
              locateFile: (file: string) => {
                  // Using a specific versioned CDN path that matches the JS library version
                  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
              }
          });

          hands.setOptions({ 
              maxNumHands: 2, 
              modelComplexity: 1, 
              minDetectionConfidence: 0.5, 
              minTrackingConfidence: 0.5 
          });

          hands.onResults(onResults);
          handsInstanceRef.current = hands;
          requestRef.current = requestAnimationFrame(detect);
        } catch (e) {
          console.error("Failed to initialize Hands:", e);
        }
    };

    init();

    return () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (hands) {
            hands.close();
        }
        handsInstanceRef.current = null;
    };
  }, [detect, onResults]);

  return (
    <div className="relative w-full h-full bg-black">
      <Webcam 
        ref={webcamRef} 
        audio={false} 
        mirrored={true}
        className="absolute inset-0 w-full h-full object-fill opacity-40" 
      />
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        className="absolute inset-0 w-full h-full object-fill pointer-events-none" 
      />
    </div>
  );
};

export default AirPianoCanvas;