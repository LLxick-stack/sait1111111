import { useRef, useEffect, useCallback } from "react";

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

// Melody notes: frequencies in Hz (simple pentatonic loop)
const MELODY: { freq: number; duration: number }[] = [
  { freq: 523.25, duration: 0.3 },  // C5
  { freq: 659.25, duration: 0.3 },  // E5
  { freq: 783.99, duration: 0.3 },  // G5
  { freq: 659.25, duration: 0.3 },  // E5
  { freq: 587.33, duration: 0.3 },  // D5
  { freq: 523.25, duration: 0.3 },  // C5
  { freq: 440.00, duration: 0.3 },  // A4
  { freq: 523.25, duration: 0.6 },  // C5 (longer)
];

export function useAudio(settings: AudioSettings) {
  const ctxRef = useRef<AudioContext | null>(null);
  const musicTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicNoteIndexRef = useRef(0);
  const musicRunningRef = useRef(false);
  const gainNodeRef = useRef<GainNode | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = "sine", gainPeak = 0.3, freqEnd?: number) => {
      if (!settings.soundEnabled) return;
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    },
    [settings.soundEnabled, getCtx]
  );

  const playLetterClick = useCallback(() => {
    playTone(880, 0.06, "square", 0.15);
  }, [playTone]);

  const playDeleteClick = useCallback(() => {
    playTone(440, 0.06, "square", 0.12);
  }, [playTone]);

  const playInvalidWord = useCallback(() => {
    playTone(120, 0.35, "sine", 0.4, 60);
  }, [playTone]);

  const playTileFlip = useCallback((delayIndex: number) => {
    if (!settings.soundEnabled) return;
    const ctx = getCtx();
    const startTime = ctx.currentTime + delayIndex * 0.3;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, startTime);
    osc.frequency.linearRampToValueAtTime(900, startTime + 0.05);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    osc.start(startTime);
    osc.stop(startTime + 0.15);
  }, [settings.soundEnabled, getCtx]);

  const playWin = useCallback(() => {
    if (!settings.soundEnabled) return;
    const ctx = getCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.65);
    });
  }, [settings.soundEnabled, getCtx]);

  const playLose = useCallback(() => {
    if (!settings.soundEnabled) return;
    const ctx = getCtx();
    const notes = [220, 185, 155, 110];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      osc.frequency.linearRampToValueAtTime(freq * 0.85, ctx.currentTime + i * 0.2 + 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.35);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.4);
    });
  }, [settings.soundEnabled, getCtx]);

  const stopMusic = useCallback(() => {
    musicRunningRef.current = false;
    if (musicTimeoutRef.current) {
      clearTimeout(musicTimeoutRef.current);
      musicTimeoutRef.current = null;
    }
    if (gainNodeRef.current && ctxRef.current) {
      const g = gainNodeRef.current;
      const ctx = ctxRef.current;
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
  }, []);

  const startMusic = useCallback(() => {
    if (musicRunningRef.current) return;
    const ctx = getCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;
    musicRunningRef.current = true;
    musicNoteIndexRef.current = 0;

    const scheduleNote = () => {
      if (!musicRunningRef.current) return;
      const note = MELODY[musicNoteIndexRef.current % MELODY.length];
      musicNoteIndexRef.current++;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime);
      noteGain.gain.setValueAtTime(0, ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.02);
      noteGain.gain.setValueAtTime(0.6, ctx.currentTime + note.duration * 0.7);
      noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + note.duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + note.duration + 0.05);
      musicTimeoutRef.current = setTimeout(scheduleNote, note.duration * 1000);
    };

    scheduleNote();
  }, [getCtx]);

  useEffect(() => {
    if (settings.musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [settings.musicEnabled, startMusic, stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      ctxRef.current?.close();
    };
  }, [stopMusic]);

  return { playLetterClick, playDeleteClick, playInvalidWord, playTileFlip, playWin, playLose };
}
