import { useState, useEffect, useRef } from "react";

interface HowToPlayProps {
  onClose: () => void;
  interactive?: boolean;
}

type TileColor = "correct" | "present" | "absent" | "empty";

interface TileProps {
  char: string;
  color: TileColor;
  flip?: boolean;
  flipDelay?: number;
}

function Tile({ char, color, flip = false, flipDelay = 0 }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flip) return;
    const el = ref.current;
    if (!el) return;

    // Apply color at the halfway point of the flip
    const colorDelay = (flipDelay + 0.25) * 1000;
    const timer = setTimeout(() => {
      if (!el) return;
      el.classList.remove("bg-transparent", "border-gray-600");
      switch (color) {
        case "correct":
          el.classList.add("bg-[#538d4e]", "border-[#538d4e]");
          break;
        case "present":
          el.classList.add("bg-[#b59f3b]", "border-[#b59f3b]");
          break;
        case "absent":
          el.classList.add("bg-[#3a3a3c]", "border-[#3a3a3c]");
          break;
      }
    }, colorDelay);

    return () => clearTimeout(timer);
  }, [flip, color, flipDelay]);

  const baseClass = flip
    ? "bg-transparent border-gray-600 text-white"
    : color === "empty"
    ? "bg-transparent border-gray-600 text-white"
    : color === "correct"
    ? "bg-[#538d4e] border-[#538d4e] text-white"
    : color === "present"
    ? "bg-[#b59f3b] border-[#b59f3b] text-white"
    : "bg-[#3a3a3c] border-[#3a3a3c] text-white";

  return (
    <div
      ref={ref}
      className={`w-11 h-11 flex items-center justify-center border-2 rounded text-lg font-black uppercase ${baseClass}`}
      style={
        flip
          ? { animation: "flipReveal 0.5s ease forwards", animationDelay: `${flipDelay}s` }
          : {}
      }
    >
      {char}
    </div>
  );
}

// Tutorial steps: target word is КОШКА
// Step 0: БЕТОН - all absent (no letters from КОШКА)
// Step 1: ЛАСКА - К present (pos3->pos0), А correct (pos4), остальные absent
// Step 2: КОШКА - all correct

const STEPS = [
  {
    word: ["б","е","т","о","н"],
    states: ["absent","absent","absent","absent","absent"] as TileColor[],
    hint: "Ни одной буквы нет в слове - все серые",
  },
  {
    word: ["л","а","с","к","а"],
    states: ["absent","absent","absent","present","correct"] as TileColor[],
    hint: "К есть в слове, но не на этом месте. А стоит правильно!",
  },
  {
    word: ["к","о","ш","к","а"],
    states: ["correct","correct","correct","correct","correct"] as TileColor[],
    hint: "Все буквы на своих местах - слово угадано!",
  },
];

type Phase =
  | { kind: "typing"; stepIdx: number; typed: number }   // печатаем буквы
  | { kind: "revealing"; stepIdx: number }               // анимация переворота
  | { kind: "revealed"; stepIdx: number }                // показываем подсказку
  | { kind: "done" };                                    // всё готово

export default function HowToPlay({ onClose, interactive = false }: HowToPlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "typing", stepIdx: 0, typed: 0 });
  // rows[i] = null (not started) | "typing" | "revealed"
  const [rows, setRows] = useState<("idle" | "typing" | "revealing" | "revealed")[]>(["typing", "idle", "idle"]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const advance = () => {
    if (phase.kind === "done") { onClose(); return; }

    if (phase.kind === "typing") {
      const { stepIdx, typed } = phase;
      const step = STEPS[stepIdx];

      if (typed < step.word.length) {
        // type next letter
        timerRef.current = setTimeout(() => {
          setPhase({ kind: "typing", stepIdx, typed: typed + 1 });
        }, 80);
      } else {
        // all letters typed → start reveal
        setRows(r => { const n = [...r]; n[stepIdx] = "revealing"; return n; });
        setPhase({ kind: "revealing", stepIdx });
        // wait for flip animation (5 tiles * 150ms delay + 500ms anim)
        timerRef.current = setTimeout(() => {
          setRows(r => { const n = [...r]; n[stepIdx] = "revealed"; return n; });
          setPhase({ kind: "revealed", stepIdx });
        }, 5 * 150 + 600);
      }
    }

    if (phase.kind === "revealed") {
      const next = phase.stepIdx + 1;
      if (next >= STEPS.length) {
        setPhase({ kind: "done" });
      } else {
        setRows(r => { const n = [...r]; n[next] = "typing"; return n; });
        setPhase({ kind: "typing", stepIdx: next, typed: 0 });
      }
    }
  };

  // Auto-type letters one by one when phase is "typing"
  useEffect(() => {
    if (phase.kind !== "typing") return;
    const { stepIdx, typed } = phase;
    if (typed >= STEPS[stepIdx].word.length) return;
    timerRef.current = setTimeout(() => {
      setPhase({ kind: "typing", stepIdx, typed: typed + 1 });
    }, 120);
    return clear;
  }, [phase]);

  // After all letters typed, auto-trigger reveal after short pause
  useEffect(() => {
    if (phase.kind !== "typing") return;
    const { stepIdx, typed } = phase;
    if (typed < STEPS[stepIdx].word.length) return;
    // small pause before reveal starts
    timerRef.current = setTimeout(() => {
      setRows(r => { const n = [...r]; n[stepIdx] = "revealing"; return n; });
      setPhase({ kind: "revealing", stepIdx });
    }, 400);
    return clear;
  }, [phase]);

  // After revealing, mark as revealed
  useEffect(() => {
    if (phase.kind !== "revealing") return;
    const { stepIdx } = phase;
    timerRef.current = setTimeout(() => {
      setRows(r => { const n = [...r]; n[stepIdx] = "revealed"; return n; });
      setPhase({ kind: "revealed", stepIdx });
    }, 5 * 150 + 600);
    return clear;
  }, [phase]);

  const getButtonLabel = () => {
    if (phase.kind === "done") return "Играть!";
    if (phase.kind === "revealed") {
      return phase.stepIdx < STEPS.length - 1 ? "Далее" : "Начать игру!";
    }
    return "...";
  };

  const isButtonActive = phase.kind === "revealed" || phase.kind === "done";

  const currentHint =
    phase.kind === "revealed" ? STEPS[phase.stepIdx].hint :
    phase.kind === "done" ? STEPS[STEPS.length - 1].hint : null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-3 animate-fade-in">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white uppercase tracking-widest text-center flex-1">
            {interactive ? "Как играть" : "Как играть"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {interactive ? (
          <div>
            {/* Board */}
            <div className="flex flex-col gap-1.5 mb-5">
              {STEPS.map((step, i) => {
                const rowState = rows[i];
                return (
                  <div key={i} className="flex gap-1.5 justify-center">
                    {step.word.map((char, j) => {
                      if (rowState === "idle") {
                        return <Tile key={j} char="" color="empty" />;
                      }
                      if (rowState === "typing") {
                        const typed = phase.kind === "typing" && phase.stepIdx === i ? phase.typed : 0;
                        return (
                          <Tile
                            key={j}
                            char={j < typed ? char : ""}
                            color="empty"
                          />
                        );
                      }
                      if (rowState === "revealing") {
                        return (
                          <Tile
                            key={j}
                            char={char}
                            color={step.states[j]}
                            flip
                            flipDelay={j * 0.15}
                          />
                        );
                      }
                      // revealed
                      return <Tile key={j} char={char} color={step.states[j]} />;
                    })}
                  </div>
                );
              })}
            </div>

            {/* Hint box */}
            <div className={`bg-[#252526] rounded-xl px-4 py-3 mb-5 text-center min-h-[52px] flex items-center justify-center transition-opacity duration-300 ${currentHint ? "opacity-100" : "opacity-0"}`}>
              <p className="text-gray-300 text-sm">{currentHint ?? " "}</p>
            </div>

            {/* Button */}
            <button
              onClick={() => { if (isButtonActive) advance(); }}
              disabled={!isButtonActive}
              className={`w-full py-3.5 font-black rounded-xl transition-all uppercase tracking-widest text-sm
                ${isButtonActive
                  ? "bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white"
                  : "bg-[#252526] text-gray-600 cursor-not-allowed"
                }`}
            >
              {getButtonLabel()}
            </button>
          </div>
        ) : (
          /* Static mode */
          <div>
            <div className="text-gray-300 text-sm space-y-3 mb-5 text-center">
              <p>Угадайте <strong className="text-white">ВОРДЛИ</strong> за 6 попыток.</p>
              <ul className="space-y-1 list-none">
                <li>Каждая попытка - <strong className="text-white">настоящее слово</strong> из 5 букв.</li>
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
