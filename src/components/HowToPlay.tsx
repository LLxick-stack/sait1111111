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
    const colorDelay = (flipDelay + 0.25) * 1000;
    const timer = setTimeout(() => {
      if (!el) return;
      el.classList.remove("bg-transparent", "border-gray-600");
      switch (color) {
        case "correct": el.classList.add("bg-[#538d4e]", "border-[#538d4e]"); break;
        case "present": el.classList.add("bg-[#b59f3b]", "border-[#b59f3b]"); break;
        case "absent":  el.classList.add("bg-[#3a3a3c]", "border-[#3a3a3c]"); break;
      }
    }, colorDelay);
    return () => clearTimeout(timer);
  }, [flip, color, flipDelay]);

  const baseClass = flip
    ? "bg-transparent border-gray-600 text-white"
    : color === "empty"   ? "bg-transparent border-gray-600 text-white"
    : color === "correct" ? "bg-[#538d4e] border-[#538d4e] text-white"
    : color === "present" ? "bg-[#b59f3b] border-[#b59f3b] text-white"
    : "bg-[#3a3a3c] border-[#3a3a3c] text-white";

  return (
    <div
      ref={ref}
      className={`w-11 h-11 flex items-center justify-center border-2 rounded text-lg font-black uppercase ${baseClass}`}
      style={flip ? { animation: "flipReveal 0.5s ease forwards", animationDelay: `${flipDelay}s` } : {}}
    >
      {char}
    </div>
  );
}

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
  | { kind: "typing"; stepIdx: number; typed: number }
  | { kind: "revealing"; stepIdx: number }
  | { kind: "revealed"; stepIdx: number }
  | { kind: "done" };

// ── Tooltip for header buttons ────────────────────────────────────────────────
interface TooltipItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const HEADER_TIPS: TooltipItem[] = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
      </svg>
    ),
    label: "Как играть",
    desc: "Открывает это окно с инструкцией",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    label: "Настройки",
    desc: "Звук, музыка и тема оформления",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
      </svg>
    ),
    label: "Новая игра",
    desc: "Начать игру с новым словом",
  },
];

export default function HowToPlay({ onClose, interactive = false }: HowToPlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "typing", stepIdx: 0, typed: 0 });
  const [rows, setRows] = useState<("idle" | "typing" | "revealing" | "revealed")[]>(["typing", "idle", "idle"]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  // Auto-type letters
  useEffect(() => {
    if (phase.kind !== "typing") return;
    const { stepIdx, typed } = phase;
    if (typed >= STEPS[stepIdx].word.length) return;
    timerRef.current = setTimeout(() => {
      setPhase({ kind: "typing", stepIdx, typed: typed + 1 });
    }, 120);
    return clear;
  }, [phase]);

  // After all letters typed → reveal
  useEffect(() => {
    if (phase.kind !== "typing") return;
    const { stepIdx, typed } = phase;
    if (typed < STEPS[stepIdx].word.length) return;
    timerRef.current = setTimeout(() => {
      setRows(r => { const n = [...r]; n[stepIdx] = "revealing"; return n; });
      setPhase({ kind: "revealing", stepIdx });
    }, 400);
    return clear;
  }, [phase]);

  // After revealing → revealed
  useEffect(() => {
    if (phase.kind !== "revealing") return;
    const { stepIdx } = phase;
    timerRef.current = setTimeout(() => {
      setRows(r => { const n = [...r]; n[stepIdx] = "revealed"; return n; });
      setPhase({ kind: "revealed", stepIdx });
    }, 5 * 150 + 600);
    return clear;
  }, [phase]);

  const currentHint =
    phase.kind === "revealed" ? STEPS[phase.stepIdx].hint :
    phase.kind === "done"     ? STEPS[STEPS.length - 1].hint : null;

  const isButtonActive = phase.kind === "revealed" || phase.kind === "done";

  const getButtonLabel = () => {
    if (phase.kind === "done") return "Играть!";
    if (phase.kind === "revealed") return phase.stepIdx < STEPS.length - 1 ? "Далее" : "Играть!";
    return "...";
  };

  const handleButton = () => {
    if (!isButtonActive) return;
    if (phase.kind === "done") { onClose(); return; }
    if (phase.kind === "revealed") {
      const next = phase.stepIdx + 1;
      if (next >= STEPS.length) { onClose(); return; }
      setRows(r => { const n = [...r]; n[next] = "typing"; return n; });
      setPhase({ kind: "typing", stepIdx: next, typed: 0 });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-3 animate-fade-in">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white uppercase tracking-widest text-center flex-1">
            Как играть
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {interactive ? (
          /* ── Interactive tutorial ── */
          <div>
            {/* Board */}
            <div className="flex flex-col gap-1.5 mb-5">
              {STEPS.map((step, i) => {
                const rowState = rows[i];
                return (
                  <div key={i} className="flex gap-1.5 justify-center">
                    {step.word.map((char, j) => {
                      if (rowState === "idle") return <Tile key={j} char="" color="empty" />;
                      if (rowState === "typing") {
                        const typed = phase.kind === "typing" && phase.stepIdx === i ? phase.typed : 0;
                        return <Tile key={j} char={j < typed ? char : ""} color="empty" />;
                      }
                      if (rowState === "revealing") {
                        return <Tile key={j} char={char} color={step.states[j]} flip flipDelay={j * 0.15} />;
                      }
                      return <Tile key={j} char={char} color={step.states[j]} />;
                    })}
                  </div>
                );
              })}
            </div>

            {/* Hint */}
            <div className={`bg-[#252526] rounded-xl px-4 py-3 mb-4 text-center min-h-[52px] flex items-center justify-center transition-opacity duration-300 ${currentHint ? "opacity-100" : "opacity-0"}`}>
              <p className="text-gray-300 text-sm">{currentHint ?? " "}</p>
            </div>

            {/* Button tips */}
            <div className="border-t border-gray-700 pt-4 mb-4 space-y-3">
              <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">Кнопки управления</p>
              {HEADER_TIPS.map((tip, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#252526] rounded-xl px-3 py-2.5">
                  <div className="text-gray-400 shrink-0">{tip.icon}</div>
                  <div>
                    <p className="text-white text-sm font-bold">{tip.label}</p>
                    <p className="text-gray-500 text-xs">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleButton}
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
          /* ── Static mode ── */
          <div>
            <div className="text-gray-300 text-sm space-y-3 mb-5 text-center">
              <p>Угадайте <strong className="text-white">СЛОВО</strong> за 6 попыток.</p>
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

            {/* Button tips in static mode too */}
            <div className="border-t border-gray-700 pt-4 mt-5 space-y-3">
              <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">Кнопки управления</p>
              {HEADER_TIPS.map((tip, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#252526] rounded-xl px-3 py-2.5">
                  <div className="text-gray-400 shrink-0">{tip.icon}</div>
                  <div>
                    <p className="text-white text-sm font-bold">{tip.label}</p>
                    <p className="text-gray-500 text-xs">{tip.desc}</p>
                  </div>
                </div>
              ))}
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
