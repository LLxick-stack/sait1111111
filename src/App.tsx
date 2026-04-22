import { useState, useEffect, useCallback, useRef } from "react";
import { getRandomWord, isValidGuess } from "./gameWords";
import Keyboard from "./components/Keyboard";
import GameBoard from "./components/GameBoard";
import Modal from "./components/Modal";
import Header from "./components/Header";
import HowToPlay from "./components/HowToPlay";
import LoadingScreen from "./components/LoadingScreen";
import Settings from "./components/Settings";
import { useAudio, AudioSettings } from "./utils/useAudio";

declare global {
  interface Window {
    YaGames: { init: () => Promise<YaSDK> };
    ysdk: YaSDK | null;
  }
}

interface YaSDK {
  adv: {
    showFullscreenAdv: (opts?: { callbacks?: Record<string, unknown> }) => void;
    showRewardedVideo: (opts: { callbacks: Record<string, unknown> }) => void;
  };
  feedback: {
    canReview: () => Promise<{ value: boolean }>;
    requestReview: () => Promise<void>;
  };
  getLeaderboards: () => Promise<YaLeaderboards>;
}

interface YaLeaderboards {
  setLeaderboardScore: (name: string, score: number) => Promise<void>;
  getLeaderboardEntries: (name: string, opts?: {
    includeUser?: boolean;
    quantityAround?: number;
    quantityTop?: number;
  }) => Promise<{
    entries: Array<{
      score: number;
      rank: number;
      player: { publicName: string; getAvatarSrc: (size: string) => string };
    }>;
    userEntry?: { score: number; rank: number; player: { publicName: string } };
  }>;
}

export type LetterState = "correct" | "present" | "absent" | "empty" | "active";

export interface GuessRow {
  letters: { char: string; state: LetterState }[];
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

function initYandexSDK() {
  if (typeof window !== "undefined" && window.YaGames) {
    window.YaGames.init()
      .then((sdk) => { window.ysdk = sdk; })
      .catch(() => { console.warn("Yandex SDK not available"); });
  }
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem("wordle_settings");
    if (raw) return JSON.parse(raw) as AudioSettings;
  } catch { /* ignore */ }
  return { soundEnabled: true, musicEnabled: false, lightTheme: true };
}

interface SavedGame {
  targetWord: string;
  guesses: GuessRow[];
  currentInput: string;
  gameStatus: "playing" | "won" | "lost";
  letterStates: Record<string, LetterState>;
  revealedHints: Record<number, string>;
  finishedGame: { word: string; guessCount: number; status: "won" | "lost" } | null;
  savedAt: number;
}

const SAVE_KEY = "wordle_game_state";
const SAVE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function saveGame(state: SavedGame) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch { /* ignore */ }
}

function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const saved: SavedGame = JSON.parse(raw);
    // Discard saves older than 24h
    if (Date.now() - saved.savedAt > SAVE_TTL) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return saved;
  } catch { /* ignore */ }
  return null;
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // Restore saved game or start fresh
  const savedGame = loadGame();

  const [targetWord, setTargetWord] = useState<string>(() => savedGame?.targetWord ?? getRandomWord());
  const [guesses, setGuesses] = useState<GuessRow[]>(() => savedGame?.guesses ?? []);
  const [currentInput, setCurrentInput] = useState<string>(() => savedGame?.currentInput ?? "");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(() => savedGame?.gameStatus ?? "playing");
  const [shake, setShake] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [interactiveHowToPlay, setInteractiveHowToPlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>(() => savedGame?.letterStates ?? {});
  const [revealingRow, setRevealingRow] = useState<number>(-1);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, string>>(() => savedGame?.revealedHints ?? {});
  const [finishedGame, setFinishedGame] = useState<{ word: string; guessCount: number; status: "won" | "lost" } | null>(() => savedGame?.finishedGame ?? null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadSettings);
  const _timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useAudio(audioSettings);

  const handleLoadingDone = useCallback(() => {
    setLoading(false);
    const visited = localStorage.getItem("wordle_visited");
    if (!visited) {
      setInteractiveHowToPlay(true);
      setShowHowToPlay(true);
      localStorage.setItem("wordle_visited", "1");
    }
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", audioSettings.lightTheme ? "light" : "dark");
  }, [audioSettings.lightTheme]);
  useEffect(() => {
    const noContext = (e: MouseEvent) => e.preventDefault();
    const noSelect = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", noContext);
    document.addEventListener("selectstart", noSelect);
    return () => {
      document.removeEventListener("contextmenu", noContext);
      document.removeEventListener("selectstart", noSelect);
    };
  }, []);

  // Auto-save game state whenever it changes
  useEffect(() => {
    if (loading) return;
    saveGame({
      targetWord,
      guesses,
      currentInput,
      gameStatus,
      letterStates,
      revealedHints,
      finishedGame,
      savedAt: Date.now(),
    });
  }, [loading, targetWord, guesses, currentInput, gameStatus, letterStates, revealedHints, finishedGame]);

  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    const MIN_W = 320;
    const MIN_H = 480;
    const check = () => setTooSmall(window.innerWidth < MIN_W || window.innerHeight < MIN_H);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { initYandexSDK(); }, []);

  const evaluateGuess = useCallback(
    (guess: string): { char: string; state: LetterState }[] => {
      const result: { char: string; state: LetterState }[] = Array(WORD_LENGTH)
        .fill(null)
        .map((_, i) => ({ char: guess[i], state: "absent" as LetterState }));
      const targetArr = [...targetWord];
      const usedTarget = Array(WORD_LENGTH).fill(false);
      const usedGuess = Array(WORD_LENGTH).fill(false);
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === targetArr[i]) {
          result[i].state = "correct";
          usedTarget[i] = true;
          usedGuess[i] = true;
        }
      }
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (usedGuess[i]) continue;
        for (let j = 0; j < WORD_LENGTH; j++) {
          if (!usedTarget[j] && guess[i] === targetArr[j]) {
            result[i].state = "present";
            usedTarget[j] = true;
            break;
          }
        }
      }
      return result;
    },
    [targetWord]
  );

  const submitGuess = useCallback(() => {
    if (isRevealing) return;
    const guess = currentInput.toLowerCase();

    if ([...guess].length !== WORD_LENGTH) {
      audio.playInvalidWord();
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (!/^[а-яё]{5}$/.test(guess)) {
      audio.playInvalidWord();
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (!isValidGuess(guess)) {
      audio.playInvalidWord();
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const evaluated = evaluateGuess(guess);
    const newGuesses = [...guesses, { letters: evaluated }];
    const rowIdx = newGuesses.length - 1;

    setGuesses(newGuesses);
    setCurrentInput("");
    setRevealingRow(rowIdx);
    setIsRevealing(true);

    for (let i = 0; i < WORD_LENGTH; i++) audio.playTileFlip(i);

    const revealDuration = WORD_LENGTH * 300 + 400;

    setTimeout(() => {
      const newLetterStates = { ...letterStates };
      evaluated.forEach(({ char, state }: { char: string; state: LetterState }) => {
        const current = newLetterStates[char];
        if (state === "correct") newLetterStates[char] = "correct";
        else if (state === "present" && current !== "correct") newLetterStates[char] = "present";
        else if (state === "absent" && !current) newLetterStates[char] = "absent";
      });
      setLetterStates(newLetterStates);
      setRevealingRow(-1);
      setIsRevealing(false);

      const isWon = guess === targetWord;
      const isLost = !isWon && newGuesses.length >= MAX_GUESSES;

      if (isWon) {
        setGameStatus("won");
        audio.playWin();
        setFinishedGame({ word: targetWord, guessCount: newGuesses.length, status: "won" });
        if (window.ysdk) {
          window.ysdk.adv.showFullscreenAdv({ callbacks: { onClose: () => setShowModal(true), onError: () => setShowModal(true) } });
          window.ysdk.getLeaderboards().then(lb => {
            lb.setLeaderboardScore("wins", (MAX_GUESSES + 1 - newGuesses.length) * 100).catch(() => {});
          }).catch(() => {});
        } else {
          setShowModal(true);
        }
      } else if (isLost) {
        setGameStatus("lost");
        audio.playLose();
        setFinishedGame({ word: targetWord, guessCount: newGuesses.length, status: "lost" });
        if (window.ysdk) {
          window.ysdk.adv.showFullscreenAdv({ callbacks: { onClose: () => setShowModal(true), onError: () => setShowModal(true) } });
        } else {
          setShowModal(true);
        }
      }
    }, revealDuration);
  }, [currentInput, guesses, evaluateGuess, letterStates, isRevealing, targetWord, audio]);

  const handleLetter = useCallback((letter: string) => {
    if (gameStatus !== "playing" || isRevealing) return;
    if ([...currentInput].length < WORD_LENGTH) {
      audio.playLetterClick();
      setCurrentInput((prev: string) => prev + letter);
    }
  }, [gameStatus, currentInput, isRevealing, audio]);

  const handleDelete = useCallback(() => {
    if (gameStatus !== "playing" || isRevealing) return;
    audio.playDeleteClick();
    setCurrentInput((prev: string) => [...prev].slice(0, -1).join(""));
  }, [gameStatus, isRevealing, audio]);

  const handleEnter = useCallback(() => {
    if (gameStatus !== "playing" || isRevealing) return;
    submitGuess();
  }, [gameStatus, submitGuess, isRevealing]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showModal || showHowToPlay || showSettings) return;
      if (e.key === "Enter") handleEnter();
      else if (e.key === "Backspace") handleDelete();
      else if (/^[а-яёА-ЯЁ]$/.test(e.key)) handleLetter(e.key.toLowerCase());
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleEnter, handleDelete, handleLetter, showModal, showHowToPlay, showSettings]);

  const startNewGame = useCallback(() => {
    clearSave();
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentInput("");
    setGameStatus("playing");
    setLetterStates({});
    setShowModal(false);
    setRevealingRow(-1);
    setIsRevealing(false);
    setRevealedHints({});
    setFinishedGame(null);
  }, []);

  const handleNewGame = useCallback(() => {
    if (window.ysdk) {
      window.ysdk.adv.showFullscreenAdv({ callbacks: { onClose: () => startNewGame(), onError: () => startNewGame() } });
    } else {
      startNewGame();
    }
  }, [startNewGame]);

  const handleHint = useCallback(() => {
    if (gameStatus !== "playing") return;
    const revealHint = () => {
      const knownCorrect = new Set<number>();
      guesses.forEach((g: GuessRow) => g.letters.forEach((l, i: number) => {
        if (l.state === "correct") knownCorrect.add(i);
      }));
      Object.keys(revealedHints).forEach(k => knownCorrect.add(Number(k)));
      const unknown = [...targetWord].map((_, i) => i).filter(i => !knownCorrect.has(i));
      if (unknown.length === 0) return;
      const idx = unknown[Math.floor(Math.random() * unknown.length)];
      setRevealedHints((prev: Record<number, string>) => ({ ...prev, [idx]: [...targetWord][idx] }));
    };
    if (window.ysdk) {
      window.ysdk.adv.showRewardedVideo({ callbacks: { onRewarded: revealHint, onError: () => {} } });
    } else {
      revealHint();
    }
  }, [gameStatus, guesses, targetWord, revealedHints]);

  // suppress unused warning
  void _timerRef;

  return (
    <div className="h-[100dvh] h-screen flex flex-col items-center select-none touch-manipulation overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}>
      {loading && <LoadingScreen onDone={handleLoadingDone} />}

      {tooSmall && (
        <div className="fixed inset-0 bg-[#121213] z-[200] flex flex-col items-center justify-center gap-3 p-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#538d4e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          <p className="text-white text-lg font-black text-center uppercase tracking-widest">
            Увеличьте экран
          </p>
          <p className="text-gray-500 text-xs text-center">
            Минимальный размер: 320 × 480
          </p>
        </div>
      )}

      <Header
        onHowToPlay={() => { setInteractiveHowToPlay(false); setShowHowToPlay(true); }}
        onNewGame={handleNewGame}
        onSettings={() => setShowSettings(true)}
      />

      <main className="flex flex-col items-center gap-2 pt-2 pb-2 flex-1 w-full max-w-lg px-2 justify-between overflow-hidden">
        <GameBoard
          guesses={guesses}
          currentInput={currentInput}
          maxGuesses={MAX_GUESSES}
          wordLength={WORD_LENGTH}
          shake={shake}
          revealRow={revealingRow}
          revealedHints={revealedHints}
        />

        {gameStatus === "playing" && (
          <button
            onClick={handleHint}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all bg-[#252526] hover:bg-[#2f2f30] active:scale-95 text-gray-300"
          >
            Подсказка за рекламу
          </button>
        )}

        <Keyboard
          letterStates={letterStates}
          onLetter={handleLetter}
          onDelete={handleDelete}
          onEnter={handleEnter}
        />
      </main>

      {showHowToPlay && (
        <HowToPlay onClose={() => setShowHowToPlay(false)} interactive={interactiveHowToPlay} />
      )}

      {showSettings && (
        <Settings settings={audioSettings} onChange={setAudioSettings} onClose={() => setShowSettings(false)} />
      )}

      {showModal && finishedGame && (
        <Modal
          status={finishedGame.status}
          targetWord={finishedGame.word}
          guessCount={finishedGame.guessCount}
          onNewGame={handleNewGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
