import { useState, useEffect, useCallback, useRef } from "react";
import { getRandomWord, isValidGuess } from "./gameWords";
import Keyboard from "./components/Keyboard";
import GameBoard from "./components/GameBoard";
import Modal from "./components/Modal";
import Header from "./components/Header";
import HowToPlay from "./components/HowToPlay";
import LoadingScreen from "./components/LoadingScreen";

declare global {
  interface Window {
    YaGames: {
      init: () => Promise<YaSDK>;
    };
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
      .then((sdk) => {
        window.ysdk = sdk;
        console.log("Yandex Games SDK initialized");
      })
      .catch(() => {
        console.warn("Yandex SDK not available");
      });
  }
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [targetWord, setTargetWord] = useState<string>(() => getRandomWord());
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [interactiveHowToPlay, setInteractiveHowToPlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});
  const [revealingRow, setRevealingRow] = useState<number>(-1);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedHints, setRevealedHints] = useState<Record<number, string>>({});
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLoadingDone = useCallback(() => {
    setLoading(false);
    const visited = localStorage.getItem("wordle_visited");
    if (!visited) {
      setInteractiveHowToPlay(true);
      setShowHowToPlay(true);
      localStorage.setItem("wordle_visited", "1");
    }
  }, []);

  useEffect(() => {
    initYandexSDK();
  }, []);

  const showToast = useCallback((msg: string, duration = 2000) => {
    setMessage(msg);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), duration);
  }, []);

  const evaluateGuess = useCallback(
    (guess: string): { char: string; state: LetterState }[] => {
      const result: { char: string; state: LetterState }[] = Array(WORD_LENGTH)
        .fill(null)
        .map((_, i) => ({ char: guess[i], state: "absent" as LetterState }));

      const targetArr = [...targetWord];
      const usedTarget = Array(WORD_LENGTH).fill(false);
      const usedGuess = Array(WORD_LENGTH).fill(false);

      // First pass: correct positions
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === targetArr[i]) {
          result[i].state = "correct";
          usedTarget[i] = true;
          usedGuess[i] = true;
        }
      }

      // Second pass: present but wrong position
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
      showToast("Слово должно быть из 5 букв!");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    if (!/^[а-яё]{5}$/.test(guess)) {
      showToast("Используйте только русские буквы!");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    if (!isValidGuess(guess)) {
      showToast("Слова нет в словаре!");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }

    const evaluated = evaluateGuess(guess);
    const newGuess: GuessRow = { letters: evaluated };
    const newGuesses = [...guesses, newGuess];
    const rowIdx = newGuesses.length - 1;

    setGuesses(newGuesses);
    setCurrentInput("");
    setRevealingRow(rowIdx);
    setIsRevealing(true);

    // Reveal delay: WORD_LENGTH tiles * 300ms per tile + 200ms buffer
    const revealDuration = WORD_LENGTH * 300 + 400;

    setTimeout(() => {
      // Update keyboard letter states
      const newLetterStates = { ...letterStates };
      evaluated.forEach(({ char, state }) => {
        const current = newLetterStates[char];
        if (state === "correct") {
          newLetterStates[char] = "correct";
        } else if (state === "present" && current !== "correct") {
          newLetterStates[char] = "present";
        } else if (state === "absent" && !current) {
          newLetterStates[char] = "absent";
        }
      });
      setLetterStates(newLetterStates);
      setRevealingRow(-1);
      setIsRevealing(false);

      const isWon = guess === targetWord;
      const isLost = !isWon && newGuesses.length >= MAX_GUESSES;

      if (isWon) {
        setGameStatus("won");
        const winMsgs = ["Гений! 🏆", "Отлично! 🎉", "Молодец! 👏", "Хорошо! 😊", "Неплохо! 😌", "Уфф, успел! 😅"];
        showToast(winMsgs[newGuesses.length - 1] || "Победа! 🎉");
        setTimeout(() => {
          setShowModal(true);
          if (window.ysdk) {
            window.ysdk.adv.showFullscreenAdv({});
          }
        }, 1500);
      } else if (isLost) {
        setGameStatus("lost");
        showToast(`Слово: ${targetWord.toUpperCase()}`, 4000);
        setTimeout(() => {
          setShowModal(true);
          if (window.ysdk) {
            window.ysdk.adv.showFullscreenAdv({});
          }
        }, 2000);
      }
    }, revealDuration);
  }, [currentInput, guesses, evaluateGuess, letterStates, showToast, isRevealing, targetWord]);

  const handleLetter = useCallback(
    (letter: string) => {
      if (gameStatus !== "playing" || isRevealing) return;
      if ([...currentInput].length < WORD_LENGTH) {
        setCurrentInput((prev) => prev + letter);
      }
    },
    [gameStatus, currentInput, isRevealing]
  );

  const handleDelete = useCallback(() => {
    if (gameStatus !== "playing" || isRevealing) return;
    setCurrentInput((prev) => [...prev].slice(0, -1).join(""));
  }, [gameStatus, isRevealing]);

  const handleEnter = useCallback(() => {
    if (gameStatus !== "playing" || isRevealing) return;
    submitGuess();
  }, [gameStatus, submitGuess, isRevealing]);

  // Physical keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showModal || showHowToPlay) return;
      if (e.key === "Enter") {
        handleEnter();
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (/^[а-яёА-ЯЁ]$/.test(e.key)) {
        handleLetter(e.key.toLowerCase());
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleEnter, handleDelete, handleLetter, showModal, showHowToPlay]);

  const startNewGame = useCallback(() => {
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentInput("");
    setGameStatus("playing");
    setLetterStates({});
    setShowModal(false);
    setRevealingRow(-1);
    setIsRevealing(false);
    setMessage("");
    setRevealedHints({});
  }, []);

  // Reveal a random unrevealed letter as a hint after watching an ad
  const handleHint = useCallback(() => {
    if (gameStatus !== "playing") return;

    const revealHint = () => {
      const knownCorrect = new Set<number>();
      guesses.forEach(g => {
        g.letters.forEach((l, i) => { if (l.state === "correct") knownCorrect.add(i); });
      });
      // also exclude already hinted positions
      Object.keys(revealedHints).forEach(k => knownCorrect.add(Number(k)));
      const unknown = [...targetWord].map((_, i) => i).filter(i => !knownCorrect.has(i));
      if (unknown.length === 0) return;
      const idx = unknown[Math.floor(Math.random() * unknown.length)];
      const letter = [...targetWord][idx];
      setRevealedHints(prev => ({ ...prev, [idx]: letter }));
    };

    if (window.ysdk) {
      window.ysdk.adv.showRewardedVideo({
        callbacks: {
          onRewarded: revealHint,
          onError: () => showToast("Реклама недоступна"),
        },
      });
    } else {
      revealHint();
    }
  }, [gameStatus, guesses, targetWord, revealedHints, showToast]);

  return (
    <div className="min-h-screen bg-[#121213] flex flex-col items-center text-white select-none touch-manipulation">
      {loading && <LoadingScreen onDone={handleLoadingDone} />}

      <Header
        onHowToPlay={() => { setInteractiveHowToPlay(false); setShowHowToPlay(true); }}
        onNewGame={startNewGame}
      />

      {/* Toast notification */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-gray-900 font-bold px-5 py-3 rounded-xl shadow-2xl text-sm pointer-events-none animate-fade-in whitespace-nowrap">
          {message}
        </div>
      )}

      <main className="flex flex-col items-center gap-5 pt-6 pb-4 flex-1 w-full max-w-lg px-2">
        <GameBoard
          guesses={guesses}
          currentInput={currentInput}
          maxGuesses={MAX_GUESSES}
          wordLength={WORD_LENGTH}
          shake={shake}
          revealRow={revealingRow}
          revealedHints={revealedHints}
        />

        {/* Hint button */}
        {gameStatus === "playing" && (
          <button
            onClick={handleHint}
            title="Посмотреть рекламу и получить подсказку"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all bg-[#252526] hover:bg-[#2f2f30] active:scale-95 text-gray-300"
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

      {/* How to play modal */}
      {showHowToPlay && (
        <HowToPlay
          onClose={() => setShowHowToPlay(false)}
          interactive={interactiveHowToPlay}
        />
      )}

      {/* Game over modal */}
      {showModal && gameStatus !== "playing" && (
        <Modal
          status={gameStatus}
          targetWord={targetWord}
          guessCount={guesses.length}
          onNewGame={startNewGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
