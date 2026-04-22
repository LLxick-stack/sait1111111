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
      el.style.background = "";
      el.style.borderColor = "";
      switch (color) {
        case "correct": el.style.background = "#538d4e"; el.style.borderColor = "#538d4e"; el.style.color = "#fff"; break;
        case "present": el.style.background = "#b59f3b"; el.style.borderColor = "#b59f3b"; el.style.color = "#fff"; break;
        case "absent":  el.style.background = "#3a3a3c"; el.style.borderColor = "#3a3a3c"; el.style.color = "#fff"; break;
      }
    }, colorDelay);
    return () => clearTimeout(timer);
  }, [flip, color, flipDelay]);

  const getStyle = (): React.CSSProperties => {
    if (flip) return { background: "transparent", borderColor: "var(--border)", color: "var(--text)" };
    switch (color) {
      case "correct": return { background: "#538d4e", borderColor: "#538d4e", color: "#fff" };
      case "present": return { background: "#b59f3b", borderColor: "#b59f3b", color: "#fff" };
      case "absent":  return { background: "#3a3a3c", borderColor: "#3a3a3c", color: "#fff" };
      default:        return { background: "transparent", borderColor: "var(--border)", color: "var(--text)" };
    }
  };

  return (
    <div
      ref={ref}
      className="w-11 h-11 flex items-center justify-center border-2 rounded text-lg font-black uppercase"
      style={{ ...getStyle(), ...(flip ? { animation: "flipReveal 0.5s ease forwards", animationDelay: `${flipDelay}s` } : {}) }}
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
    word: ["с","о","к","о","л"],
    states: ["absent","correct","present","absent","absent"] as TileColor[],
    hint: "О стоит правильно! К есть в слове, но не на этом месте.",
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

interface TooltipItem { icon: React.ReactNode; label: string; desc: string; badge?: string; }

const HEADER_TIPS: TooltipItem[] = [
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
    label: "Как играть", desc: "Открывает это окно с инструкцией",
  },
  {
    icon: (
      <div className="relative inline-flex">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"/>
          <rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center" style={{ background: "#e53e3e", fontSize: "0.5rem", fontWeight: 900 }}>1</span>
      </div>
    ),
    label: "Подсказка", desc: "Посмотри рекламу и узнай одну букву",
    badge: "реклама",
  },
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    label: "Настройки", desc: "Звук, музыка и тема оформления",
  },
  {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
    label: "Новая игра", desc: "Начать игру с новым словом",
  },
];

export default function HowToPlay({ onClose, interactive = false }: HowToPlayProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "typing", stepIdx: 0, typed: 0 });
  const [rows, setRows] = useState<("idle" | "typing" | "revealing" | "revealed")[]>(["typing", "idle", "idle"]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  useEffect(() => {
    if (phase.kind !== "typing") return;
    const { stepIdx, typed } = phase;
    if (typed >= STEPS[stepIdx].word.length) return;
    timerRef.current = setTimeout(() => setPhase({ kind: "typing", stepIdx, typed: typed + 1 }), 120);
    return clear;
  }, [phase]);

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

  const TipsList = () => (
    <div className="pt-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs uppercase tracking-widest text-center mb-3" style={{ color: "var(--text2)" }}>Кнопки управления</p>
      {HEADER_TIPS.map((tip, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--bg3)", color: "var(--text2)" }}>
          <div className="shrink-0">{tip.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{tip.label}</p>
              {tip.badge && (
                <span className="text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background: "#e53e3e" }}>
                  {tip.badge}
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--text2)" }}>{tip.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-3 animate-fade-in" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="rounded-2xl p-5 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[95vh]"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-center flex-1" style={{ color: "var(--text)" }}>
            Как играть
          </h2>
          <button onClick={onClose} className="transition-colors ml-2 shrink-0" style={{ color: "var(--text2)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {interactive ? (
          <div>
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
                      if (rowState === "revealing") return <Tile key={j} char={char} color={step.states[j]} flip flipDelay={j * 0.15} />;
                      return <Tile key={j} char={char} color={step.states[j]} />;
                    })}
                  </div>
                );
              })}
            </div>

            <div className={`rounded-xl px-4 py-3 mb-4 text-center min-h-[52px] flex items-center justify-center transition-opacity duration-300 ${currentHint ? "opacity-100" : "opacity-0"}`}
              style={{ background: "var(--bg3)" }}>
              <p className="text-sm" style={{ color: "var(--text)" }}>{currentHint ?? " "}</p>
            </div>

            <TipsList />

            <button
              onClick={handleButton}
              disabled={!isButtonActive}
              className="mt-4 w-full py-3.5 font-black rounded-xl transition-all uppercase tracking-widest text-sm"
              style={isButtonActive
                ? { background: "#538d4e", color: "#fff" }
                : { background: "var(--bg3)", color: "var(--text2)", cursor: "not-allowed" }}
            >
              {getButtonLabel()}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm space-y-3 mb-5 text-center" style={{ color: "var(--text2)" }}>
              <p>Угадайте <strong style={{ color: "var(--text)" }}>СЛОВО</strong> за 6 попыток.</p>
              <ul className="space-y-1 list-none">
                <li>Каждая попытка - <strong style={{ color: "var(--text)" }}>настоящее слово</strong> из 5 букв.</li>
                <li>Цвет плиток подсказывает, насколько верна попытка.</li>
              </ul>
            </div>

            <div className="pt-4 space-y-5" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { word: ["к","о","ш","к","а"], colorIdx: 0, color: "correct" as TileColor, text: <p className="text-xs text-center" style={{ color: "var(--text2)" }}>Буква <strong style={{ color: "var(--text)" }}>К</strong> стоит на <strong style={{ color: "#538d4e" }}>правильном месте</strong>.</p> },
                { word: ["с","л","о","в","о"], colorIdx: 2, color: "present" as TileColor, text: <p className="text-xs text-center" style={{ color: "var(--text2)" }}>Буква <strong style={{ color: "var(--text)" }}>О</strong> есть в слове, но <strong style={{ color: "#b59f3b" }}>не на этом месте</strong>.</p> },
                { word: ["г","р","о","з","а"], colorIdx: 3, color: "absent" as TileColor,  text: <p className="text-xs text-center" style={{ color: "var(--text2)" }}>Буквы <strong style={{ color: "var(--text)" }}>З</strong> <strong style={{ color: "var(--text)" }}>нет</strong> в слове ни на одном месте.</p> },
              ].map((row, ri) => (
                <div key={ri} className="flex flex-col items-center">
                  <div className="flex gap-1.5 mb-2">
                    {row.word.map((c, i) => <Tile key={i} char={c} color={i === row.colorIdx ? row.color : "empty"} />)}
                  </div>
                  {row.text}
                </div>
              ))}
            </div>

            <TipsList />

            <button
              onClick={onClose}
              className="mt-5 w-full py-3 active:scale-95 text-white font-bold rounded-xl transition-all uppercase tracking-wider text-sm"
              style={{ background: "#538d4e" }}
            >
              Играть!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
