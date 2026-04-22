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

function getKeyStyle(state: LetterState | undefined): React.CSSProperties {
  switch (state) {
    case "correct": return { background: "#538d4e", borderColor: "#538d4e", color: "#fff" };
    case "present": return { background: "#b59f3b", borderColor: "#b59f3b", color: "#fff" };
    case "absent":  return { background: "#3a3a3c", borderColor: "#3a3a3c", color: "#888" };
    default:        return { background: "var(--key-bg)", borderColor: "var(--key-bg)", color: "var(--key-text)" };
  }
}

export default function Keyboard({ letterStates, onLetter, onDelete, onEnter }: KeyboardProps) {
  return (
    <div className="w-full px-1" style={{ display: "flex", flexDirection: "column", gap: "var(--key-gap)" }}>
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: "flex", justifyContent: "center", gap: "var(--key-gap)" }}>
          {row.map((key) => {
            if (key === "enter") {
              return (
                <button
                  key="enter"
                  onClick={onEnter}
                  className="font-bold rounded-lg uppercase cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                  style={{ height: "var(--key-height)", fontSize: "var(--key-font)", flex: "1.6", border: "1px solid", ...getKeyStyle(undefined) }}
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
                  className="font-bold rounded-lg uppercase cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                  style={{ height: "var(--key-height)", flex: "1.4", border: "1px solid", ...getKeyStyle(undefined) }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                className="font-bold rounded-lg border cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                style={{ height: "var(--key-height)", fontSize: "var(--key-font)", flex: "1", border: "1px solid", ...getKeyStyle(letterStates[key]) }}
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
