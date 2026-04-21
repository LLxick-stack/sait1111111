import { LetterState } from "../App";

interface KeyboardProps {
  letterStates: Record<string, LetterState>;
  onLetter: (letter: string) => void;
  onDelete: () => void;
  onEnter: () => void;
}

const ROWS = [
  ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
  ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
  ["enter", "я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "del"],
];

function getKeyClass(state: LetterState | undefined): string {
  switch (state) {
    case "correct":
      return "bg-[#538d4e] text-white border-[#538d4e]";
    case "present":
      return "bg-[#b59f3b] text-white border-[#b59f3b]";
    case "absent":
      return "bg-[#3a3a3c] text-gray-400 border-[#3a3a3c]";
    default:
      return "bg-[#818384] text-white border-[#818384] hover:bg-[#9a9a9a]";
  }
}

export default function Keyboard({ letterStates, onLetter, onDelete, onEnter }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-lg px-1">
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1.5">
          {row.map((key) => {
            if (key === "enter") {
              return (
                <button
                  key="enter"
                  onClick={onEnter}
                  className="h-16 px-2 min-w-[64px] bg-[#818384] border border-[#818384] text-white text-sm font-bold rounded uppercase cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                >
                  ввод
                </button>
              );
            }
            if (key === "del") {
              return (
                <button
                  key="del"
                  onClick={onDelete}
                  className="h-16 px-2 min-w-[52px] bg-[#818384] border border-[#818384] text-white text-sm font-bold rounded uppercase cursor-pointer hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                onClick={() => onLetter(key)}
                className={`h-16 w-10 sm:w-11 text-base font-bold rounded border cursor-pointer active:scale-95 transition-all flex items-center justify-center ${getKeyClass(letterStates[key])}`}
              >
                {key.toUpperCase()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
