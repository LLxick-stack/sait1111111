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

function getColorClass(state: LetterState): string {
  switch (state) {
    case "correct":
      return "border-[#538d4e] bg-[#538d4e] text-white";
    case "present":
      return "border-[#b59f3b] bg-[#b59f3b] text-white";
    case "absent":
      return "border-[#3a3a3c] bg-[#3a3a3c] text-white";
    default:
      return "border-gray-700 bg-transparent text-white";
  }
}

interface RevealTileProps {
  char: string;
  state: LetterState;
  delay: number; // seconds
}

function RevealTile({ char, state, delay }: RevealTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Color appears at the halfway point of the flip
    const colorDelay = (delay + 0.3) * 1000;
    const timer = setTimeout(() => {
      if (!el) return;
      el.classList.remove("border-[#565758]", "bg-transparent");
      switch (state) {
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
  }, [state, delay]);

  return (
    <div
      ref={ref}
      className="w-14 h-14 flex items-center justify-center text-2xl font-bold uppercase border-2 rounded border-[#565758] bg-transparent text-white"
      style={{
        animation: `flipReveal 0.6s ease forwards`,
        animationDelay: `${delay}s`,
      }}
    >
      {char}
    </div>
  );
}

export default function GameBoard({
  guesses,
  currentInput,
  maxGuesses,
  wordLength,
  shake,
  revealRow,
  revealedHints = {},
}: GameBoardProps) {
  const rows = [];

  // Submitted guess rows
  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    const isRevealRow = i === revealRow;

    rows.push(
      <div
        key={`guess-${i}`}
        className={`flex gap-[5px] ${shake && i === guesses.length - 1 ? "animate-shake" : ""}`}
      >
        {guess.letters.map((letter, j) =>
          isRevealRow ? (
            <RevealTile key={j} char={letter.char} state={letter.state} delay={j * 0.3} />
          ) : (
            <div
              key={j}
              className={`w-14 h-14 flex items-center justify-center text-2xl font-bold uppercase border-2 rounded ${getColorClass(letter.state)}`}
            >
              {letter.char}
            </div>
          )
        )}
      </div>
    );
  }

  // Current input row
  if (guesses.length < maxGuesses) {
    const currentChars = [...currentInput];
    rows.push(
      <div
        key="current"
        className={`flex gap-[5px] ${shake ? "animate-shake" : ""}`}
      >
        {Array(wordLength)
          .fill(null)
          .map((_, j) => {
            const char = currentChars[j] || "";
            const hint = !char && revealedHints[j];
            const hasChar = char !== "";
            return (
              <div
                key={j}
                className={`
                  w-14 h-14 flex items-center justify-center
                  text-2xl font-bold uppercase
                  border-2 rounded
                  transition-all duration-75
                  ${hasChar
                    ? "border-gray-400 bg-transparent text-white"
                    : hint
                    ? "border-[#538d4e] bg-[#538d4e] text-white"
                    : "border-gray-700 bg-transparent text-white"
                  }
                `}
                style={hasChar ? { animation: "popIn 0.08s ease-out forwards" } : {}}
              >
                {char || (hint ? hint.toUpperCase() : "")}
              </div>
            );
          })}
      </div>
    );
  }

  // Empty rows
  const emptyCount = Math.max(0, maxGuesses - guesses.length - 1);
  for (let i = 0; i < emptyCount; i++) {
    rows.push(
      <div key={`empty-${i}`} className="flex gap-[5px]">
        {Array(wordLength)
          .fill(null)
          .map((_, j) => {
            const hint = revealedHints[j];
            return (
              <div
                key={j}
                className={`w-14 h-14 flex items-center justify-center border-2 rounded text-2xl font-bold uppercase
                  ${hint
                    ? "border-[#538d4e] bg-[#538d4e] text-white"
                    : "border-gray-700 bg-transparent text-white"
                  }`}
              >
                {hint ? hint.toUpperCase() : ""}
              </div>
            );
          })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[5px] items-center">
      {rows}
    </div>
  );
}
