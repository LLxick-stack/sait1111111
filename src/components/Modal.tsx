import { useEffect, useState } from "react";

interface ModalProps {
  status: "won" | "lost";
  targetWord: string;
  guessCount: number;
  winMessage?: string;
  onNewGame: () => void;
  onClose: () => void;
}

function getAttemptWord(count: number): string {
  if (count === 1) return "попытку";
  if (count >= 2 && count <= 4) return "попытки";
  return "попыток";
}

export default function Modal({
  status,
  targetWord,
  guessCount,
  winMessage,
  onNewGame,
  onClose,
}: ModalProps) {
  const [stats, setStats] = useState({
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
  });

  useEffect(() => {
    // Load & update stats
    const saved = localStorage.getItem("wordle_stats");
    const current = saved
      ? JSON.parse(saved)
      : { played: 0, won: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };

    current.played += 1;
    if (status === "won") {
      current.won += 1;
      current.streak += 1;
      current.maxStreak = Math.max(current.maxStreak, current.streak);
      if (guessCount >= 1 && guessCount <= 6) {
        current.distribution[guessCount - 1] += 1;
      }
    } else {
      current.streak = 0;
    }

    localStorage.setItem("wordle_stats", JSON.stringify(current));
    setStats(current);
  }, [status, guessCount]);

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
  const maxDist = Math.max(...stats.distribution, 1);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Result header */}
        <div className="text-center mb-5">
          {status === "won" ? (
            <>
              <div className="text-5xl mb-2">{["🏆","🎉","👏","😊","😌","😅"][guessCount - 1] || "🎉"}</div>
              <h2 className="text-xl font-black text-white mb-1">
                {winMessage || "Победа!"}
              </h2>
              <p className="text-gray-400 text-sm">
                Угадал за {guessCount} {getAttemptWord(guessCount)}
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-2">😔</div>
              <h2 className="text-xl font-black text-white mb-1">Не угадал!</h2>
              <p className="text-gray-400 text-sm">Попытки закончились</p>
            </>
          )}
        </div>

        {/* Answer word */}
        <div className="bg-[#252526] rounded-xl p-3 mb-5 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Загаданное слово</p>
          <p className="text-white text-2xl font-black uppercase tracking-[0.2em]">
            {targetWord}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">Статистика</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Игр", value: stats.played },
              { label: "Побед %", value: winRate },
              { label: "Серия", value: stats.streak },
              { label: "Рекорд", value: stats.maxStreak },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{label}</div>
              </div>
            ))}
          </div>

          {/* Guess distribution */}
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-2">Распределение попыток</p>
          <div className="space-y-1">
            {stats.distribution.map((count, i) => {
              const isCurrentRow = status === "won" && guessCount === i + 1;
              const width = count > 0 ? Math.max(8, Math.round((count / maxDist) * 100)) : 8;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-3 text-right font-bold">{i + 1}</span>
                  <div className="flex-1 h-5 bg-[#252526] rounded overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-end pr-1.5 rounded text-xs font-bold text-white transition-all duration-700 ${
                        isCurrentRow ? "bg-[#538d4e]" : "bg-[#3a3a3c]"
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={onNewGame}
          className="w-full py-3.5 bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white font-black text-sm rounded-xl transition-all uppercase tracking-widest"
        >
          🔄 Новая игра
        </button>
      </div>
    </div>
  );
}
