import { useEffect, useRef } from "react";
import { GuessRow, LetterState } from "../App";

interface GameBoardProps {
  guesses: GuessRow[];
  currentInput: string;
  maxGuesses: number;
  wordLength: number;
  shake: boolean;
  revealRow: number;
  revealedHints?: Record<number, string>;
}

const tileStyle: React.CSSProperties = {
  width: "var(--tile-size)",
  height: "var(--tile-size)",
  fontSize: "calc(var(--tile-size) * 0.45)",
};

function getColorClass(state: LetterState): string {
  switch (state) {
    case "correct":  return "border-[#538d4e] bg-[#538d4e] text-white";
    case "present":  return "border-[#b59f3b] bg-[#b59f3b] text-white";
    case "absent":   return "border-[#3a3a3c] bg-[#3a3a3c] text-white";
    default:         return "border-gray-700 bg-transparent text-white";
  }
}

interface RevealTileProps {
  char: string;
  state: LetterState;
  delay: number;
}

function RevealTile({ char, state, delay }: RevealTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const colorDelay = (delay + 0.3) * 1000;
    const timer = setTimeout(() => {
      if (!el) return;
      el.classList.remove("border-[#565758]", "bg-transparent");
      switch (state) {
        case "correct": el.classList.add("bg-[#538d4e]", "border-[#538d4e]"); break;
        case "present": el.classList.add("bg-[#b59f3b]", "border-[#b59f3b]"); break;
        case "absent":  el.classList.add("bg-[#3a3a3c]", "border-[#3a3a3c]"); break;
      }
    }, colorDelay);
    return () => clearTimeout(timer);
  }, [state, delay]);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center font-bold uppercase border-2 rounded border-[#565758] bg-transparent text-white"
      style={{
        ...tileStyle,
        animation: `flipReveal 0.6s ease forwards`,
        animationDelay: `${delay}s`,
      }}
    >
      {char}
    </div>
  );
}

export default function GameBoard({
  guesses, currentInput, maxGuesses, wordLength, shake, revealRow, revealedHints = {},
}: GameBoardProps) {
  const rows = [];

  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    const isRevealRow = i === revealRow;
    rows.push(
      <div key={`guess-${i}`} className={`flex gap-[4px] ${shake && i === guesses.length - 1 ? "animate-shake" : ""}`}>
        {guess.letters.map((letter, j) =>
          isRevealRow ? (
            <RevealTile key={j} char={letter.char} state={letter.state} delay={j * 0.3} />
          ) : (
            <div key={j} className={`flex items-center justify-center font-bold uppercase border-2 rounded ${getColorClass(letter.state)}`} style={tileStyle}>
              {letter.char}
            </div>
          )
        )}
      </div>
    );
  }

  if (guesses.length < maxGuesses) {
    const currentChars = [...currentInput];
    rows.push(
      <div key="current" className={`flex gap-[4px] ${shake ? "animate-shake" : ""}`}>
        {Array(wordLength).fill(null).map((_, j) => {
          const char = currentChars[j] || "";
          const hint = !char && revealedHints[j];
          const hasChar = char !== "";
          return (
            <div
              key={j}
              className={`flex items-center justify-center font-bold uppercase border-2 rounded transition-all duration-75
                ${hasChar ? "border-gray-400 bg-transparent text-white"
                  : hint ? "border-[#538d4e] bg-[#538d4e] text-white"
                  : "border-gray-700 bg-transparent text-white"}`}
              style={{ ...tileStyle, ...(hasChar ? { animation: "popIn 0.08s ease-out forwards" } : {}) }}
            >
              {char || (hint ? hint.toUpperCase() : "")}
            </div>
          );
        })}
      </div>
    );
  }

  const emptyCount = Math.max(0, maxGuesses - guesses.length - 1);
  for (let i = 0; i < emptyCount; i++) {
    rows.push(
      <div key={`empty-${i}`} className="flex gap-[4px]">
        {Array(wordLength).fill(null).map((_, j) => {
          const hint = revealedHints[j];
          return (
            <div key={j} className={`flex items-center justify-center border-2 rounded font-bold uppercase ${hint ? "border-[#538d4e] bg-[#538d4e] text-white" : "border-gray-700 bg-transparent text-white"}`} style={tileStyle}>
              {hint ? hint.toUpperCase() : ""}
            </div>
          );
        })}
      </div>
    );
  }

  return <div className="flex flex-col gap-[4px] items-center">{rows}</div>;
}
