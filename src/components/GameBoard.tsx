import { GuessRow, LetterState } from "../App";

interface GameBoardProps {
  guesses: GuessRow[];
  currentInput: string;
  maxGuesses: number;
  wordLength: number;
  shake: boolean;
  revealRow: number;
}

function getRevealedClass(state: LetterState): string {
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

export default function GameBoard({
  guesses,
  currentInput,
  maxGuesses,
  wordLength,
  shake,
  revealRow,
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
        {guess.letters.map((letter, j) => (
          <div
            key={j}
            className={`
              w-14 h-14 flex items-center justify-center
              text-2xl font-bold uppercase
              border-2 rounded
              ${getRevealedClass(letter.state)}
            `}
            style={
              isRevealRow
                ? {
                    animation: `flipReveal 0.6s ease forwards`,
                    animationDelay: `${j * 0.3}s`,
                  }
                : {}
            }
          >
            {letter.char}
          </div>
        ))}
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
                    : "border-gray-700 bg-transparent text-white"
                  }
                `}
                style={hasChar ? { animation: "popIn 0.08s ease-out forwards" } : {}}
              >
                {char}
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
          .map((_, j) => (
            <div
              key={j}
              className="w-14 h-14 flex items-center justify-center border-2 border-gray-700 rounded bg-transparent"
            />
          ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[5px] items-center">
      {rows}
    </div>
  );
}
