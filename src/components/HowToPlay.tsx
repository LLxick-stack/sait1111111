import { useState, useEffect } from "react";

interface HowToPlayProps {
  onClose: () => void;
  interactive?: boolean;
}

type TileColor = "correct" | "present" | "absent" | "empty" | "active";

interface TileProps {
  char: string;
  color: TileColor;
  animDelay?: number;
  revealed?: boolean;
}

function Tile({ char, color, animDelay = 0, revealed = false }: TileProps) {
  const colorMap: Record<TileColor, string> = {
    correct: "bg-[#538d4e] border-[#538d4e] text-white",
    present: "bg-[#b59f3b] border-[#b59f3b] text-white",
    absent:  "bg-[#3a3a3c] border-[#3a3a3c] text-white",
    empty:   "bg-transparent border-gray-600 text-white",
    active:  "bg-transparent border-gray-400 text-white",
  };

  return (
    <div
      className={`w-11 h-11 flex items-center justify-center border-2 rounded text-lg font-black uppercase transition-all ${colorMap[color]}`}
      style={
        revealed
          ? { animation: "flipReveal 0.5s ease forwards", animationDelay: `${animDelay}s` }
          : {}
      }
    >
      {char}
    </div>
  );
}

// The three demo words for interactive tutorial
// Target word: КОШКА
// Step 1: ЗУБРЫ — all absent
// Step 2: ВОЛНА — some present
// Step 3: КОШКА — all correct

const STEP_WORDS = [
  { word: ["з","у","б","р","ы"], states: ["absent","absent","absent","absent","absent"] as TileColor[] },
  { word: ["в","о","л","к","а"], states: ["absent","present","absent","present","correct"] as TileColor[] },
  { word: ["к","о","ш","к","а"], states: ["correct","correct","correct","correct","correct"] as TileColor[] },
];

const STEP_MESSAGES = [
  "Ни одной буквы нет в слове — все серые",
  "Буквы О и К есть в слове, но не на своём месте. А есть в слове и стоит правильно!",
  "Все буквы на своих местах — слово угадано!",
];

type InteractiveStep = 0 | 1 | 2 | 3; // 0=typing step1, 1=typing step2, 2=typing step3, 3=done

export default function HowToPlay({ onClose, interactive = false }: HowToPlayProps) {
  const [step, setStep] = useState<InteractiveStep>(0);
  const [input, setInput] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const currentTarget = STEP_WORDS[step < 3 ? step : 2].word;
  const isInputComplete = input.length === 5;

  // Reveal animation for current step
  const revealStep = () => {
    if (isRevealing || step >= 3) return;
    setIsRevealing(true);
    setShowMessage(false);

    // After reveal animation (5 tiles * 0.15s delay + 0.5s anim = ~1.25s)
    setTimeout(() => {
      const newRevealed = [...revealed];
      newRevealed[step] = true;
      setRevealed(newRevealed);
      setIsRevealing(false);
      setShowMessage(true);

      setTimeout(() => {
        if (step < 2) {
          setStep((s) => (s + 1) as InteractiveStep);
          setInput([]);
          setShowMessage(false);
        } else {
          setStep(3);
        }
      }, 1800);
    }, 5 * 150 + 600);
  };

  const handleKey = (key: string) => {
    if (step >= 3 || isRevealing) return;
    if (key === "del") {
      setInput((prev) => prev.slice(0, -1));
    } else if (key === "enter") {
      if (isInputComplete) revealStep();
    } else if (input.length < 5) {
      setInput((prev) => [...prev, key]);
    }
  };

  // Keyboard rows for mini keyboard
  const KB_ROWS = [
    ["й","ц","у","к","е","н","г","ш","щ","з","х"],
    ["ф","ы","в","а","п","р","о","л","д","ж","э"],
    ["enter","я","ч","с","м","и","т","ь","б","ю","del"],
  ];

  const renderRow = (wordData: typeof STEP_WORDS[0], rowIdx: number) => {
    const isCurrentStep = rowIdx === step && step < 3;
    const isRevealedRow = revealed[rowIdx];
    const isRevealingRow = isRevealing && rowIdx === step;

    return (
      <div key={rowIdx} className="flex gap-1.5 justify-center">
        {wordData.word.map((char, j) => {
          if (isRevealedRow || isRevealingRow) {
            return (
              <Tile
                key={j}
                char={char}
                color={wordData.states[j]}
                animDelay={isRevealingRow ? j * 0.15 : 0}
                revealed={isRevealingRow}
              />
            );
          }
          if (isCurrentStep) {
            const inputChar = input[j] || "";
            return (
              <Tile
                key={j}
                char={inputChar}
                color={inputChar ? "active" : "empty"}
              />
            );
          }
          // Future rows — empty
          return <Tile key={j} char="" color="empty" />;
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-3 animate-fade-in">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white uppercase tracking-widest text-center flex-1">
            {interactive ? "Попробуй сам!" : "Как играть"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {interactive ? (
          /* ── INTERACTIVE MODE ── */
          <div>
            <p className="text-gray-400 text-sm text-center mb-4">
              {step < 3
                ? <>Угадай слово <strong className="text-white">КОШКА</strong> — введи слово и нажми ВВОД</>
                : <span className="text-[#538d4e] font-bold">Отлично! Теперь ты знаешь как играть!</span>
              }
            </p>

            {/* Mini board */}
            <div className="flex flex-col gap-1.5 mb-4">
              {STEP_WORDS.map((w, i) => renderRow(w, i))}
            </div>

            {/* Step message */}
            {showMessage && step < 3 && (
              <div className="bg-[#252526] rounded-xl px-4 py-2.5 mb-4 text-center animate-fade-in">
                <p className="text-gray-300 text-xs">{STEP_MESSAGES[step > 0 ? step - 1 : 0]}</p>
              </div>
            )}
            {step === 3 && (
              <div className="bg-[#252526] rounded-xl px-4 py-2.5 mb-4 text-center animate-fade-in">
                <p className="text-gray-300 text-xs">{STEP_MESSAGES[2]}</p>
              </div>
            )}

            {/* Mini keyboard */}
            {step < 3 && (
              <div className="flex flex-col gap-1.5 mb-4">
                {KB_ROWS.map((row, ri) => (
                  <div key={ri} className="flex justify-center gap-1">
                    {row.map((key) => {
                      if (key === "enter") {
                        return (
                          <button
                            key="enter"
                            onClick={() => handleKey("enter")}
                            disabled={!isInputComplete || isRevealing}
                            className={`h-10 px-2 min-w-[48px] text-xs font-bold rounded uppercase transition-all flex items-center justify-center
                              ${isInputComplete && !isRevealing
                                ? "bg-[#538d4e] text-white active:scale-95"
                                : "bg-[#3a3a3c] text-gray-500 cursor-not-allowed"
                              }`}
                          >
                            ввод
                          </button>
                        );
                      }
                      if (key === "del") {
                        return (
                          <button
                            key="del"
                            onClick={() => handleKey("del")}
                            className="h-10 px-2 min-w-[36px] bg-[#818384] text-white text-xs font-bold rounded active:scale-95 transition-all flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                              <line x1="18" y1="9" x2="12" y2="15"/>
                              <line x1="12" y1="9" x2="18" y2="15"/>
                            </svg>
                          </button>
                        );
                      }
                      return (
                        <button
                          key={key}
                          onClick={() => handleKey(key)}
                          className="h-10 w-7 text-xs font-bold rounded bg-[#818384] text-white active:scale-95 transition-all flex items-center justify-center"
                        >
                          {key.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className={`w-full py-3 font-bold rounded-xl transition-all uppercase tracking-wider text-sm
                ${step === 3
                  ? "bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white"
                  : "bg-[#252526] text-gray-500 cursor-default"
                }`}
            >
              {step === 3 ? "Играть!" : "Пройди обучение..."}
            </button>
          </div>
        ) : (
          /* ── STATIC MODE ── */
          <div>
            <div className="text-gray-300 text-sm space-y-3 mb-5 text-center">
              <p>Угадайте <strong className="text-white">ВОРДЛИ</strong> за 6 попыток.</p>
              <ul className="space-y-1 list-none">
                <li>Каждая попытка — <strong className="text-white">настоящее слово</strong> из 5 букв.</li>
                <li>Цвет плиток подсказывает, насколько верна попытка.</li>
              </ul>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-5">
              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 mb-2">
                  {["к","о","ш","к","а"].map((c, i) => (
                    <Tile key={i} char={c} color={i === 0 ? "correct" : "empty"} />
                  ))}
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Буква <strong className="text-white">К</strong> стоит на <strong className="text-[#538d4e]">правильном месте</strong>.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 mb-2">
                  {["с","л","о","в","о"].map((c, i) => (
                    <Tile key={i} char={c} color={i === 2 ? "present" : "empty"} />
                  ))}
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Буква <strong className="text-white">О</strong> есть в слове, но <strong className="text-[#b59f3b]">не на этом месте</strong>.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 mb-2">
                  {["г","р","о","з","а"].map((c, i) => (
                    <Tile key={i} char={c} color={i === 3 ? "absent" : "empty"} />
                  ))}
                </div>
                <p className="text-gray-400 text-xs text-center">
                  Буквы <strong className="text-white">З</strong> <strong className="text-white">нет</strong> в слове ни на одном месте.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full py-3 bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white font-bold rounded-xl transition-all uppercase tracking-wider text-sm"
            >
              Играть!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
