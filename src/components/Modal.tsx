import { useEffect, useRef, useState } from "react";

interface ModalProps {
  status: "won" | "lost";
  targetWord: string;
  guessCount: number;
  winMessage?: string;
  onNewGame: () => void;
  onClose: () => void;
}

interface LeaderEntry {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
  avatar?: string;
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
  const frozenStatus = useRef(status).current;
  const frozenTarget = useRef(targetWord).current;
  const frozenGuessCount = useRef(guessCount).current;

  const [stats, setStats] = useState({
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  const updatedRef = useRef(false);

  useEffect(() => {
    if (updatedRef.current) return;
    updatedRef.current = true;

    // Update local stats
    const saved = localStorage.getItem("wordle_stats");
    const current = saved
      ? JSON.parse(saved)
      : { played: 0, won: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };

    current.played += 1;
    if (frozenStatus === "won") {
      current.won += 1;
      current.streak += 1;
      current.maxStreak = Math.max(current.maxStreak, current.streak);
      if (frozenGuessCount >= 1 && frozenGuessCount <= 6) {
        current.distribution[frozenGuessCount - 1] += 1;
      }
    } else {
      current.streak = 0;
    }

    localStorage.setItem("wordle_stats", JSON.stringify(current));
    setStats(current);

    // Load leaderboard from Yandex SDK
    const ysdk = window.ysdk;
    if (ysdk) {
      ysdk.getLeaderboards()
        .then(lb => lb.getLeaderboardEntries("wins", {
          includeUser: true,
          quantityTop: 5,
          quantityAround: 2,
        }))
        .then(data => {
          const entries: LeaderEntry[] = data.entries.map(e => ({
            rank: e.rank,
            name: e.player.publicName || "Игрок",
            score: e.score,
            isMe: false,
            avatar: e.player.getAvatarSrc("small"),
          }));
          if (data.userEntry) {
            const myRank = data.userEntry.rank;
            const exists = entries.some(e => e.rank === myRank);
            if (!exists) {
              entries.push({
                rank: myRank,
                name: data.userEntry.player.publicName || "Вы",
                score: data.userEntry.score,
                isMe: true,
              });
            } else {
              const idx = entries.findIndex(e => e.rank === myRank);
              if (idx !== -1) entries[idx].isMe = true;
            }
          }
          entries.sort((a, b) => a.rank - b.rank);
          setLeaderboard(entries);
          setLbLoading(false);
        })
        .catch(() => setLbLoading(false));
    } else {
      // Dev mode — show placeholder
      setLeaderboard([
        { rank: 1, name: "Алексей", score: 600, isMe: false },
        { rank: 2, name: "Мария", score: 500, isMe: false },
        { rank: 3, name: "Вы", score: 400, isMe: true },
        { rank: 4, name: "Дмитрий", score: 300, isMe: false },
        { rank: 5, name: "Анна", score: 200, isMe: false },
      ]);
      setLbLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in overflow-y-auto max-h-[95vh]">
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
          {frozenStatus === "won" ? (
            <>
              <div className="text-5xl mb-2">{["🏆","🎉","👏","😊","😌","😅"][frozenGuessCount - 1] || "🎉"}</div>
              <h2 className="text-xl font-black text-white mb-1">
                {winMessage || "Победа!"}
              </h2>
              <p className="text-gray-400 text-sm">
                Угадал за {frozenGuessCount} {getAttemptWord(frozenGuessCount)}
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
            {frozenTarget}
          </p>
        </div>

        {/* Personal stats */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">Моя статистика</p>
          <div className="grid grid-cols-4 gap-2">
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
        </div>

        {/* Leaderboard */}
        <div className="mb-5">
          <p className="text-gray-500 text-xs uppercase tracking-widest text-center mb-3">Лидеры</p>
          {lbLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-[#538d4e] rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-3">Нет данных</p>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                    entry.isMe
                      ? "bg-[#538d4e]/20 border border-[#538d4e]/40"
                      : "bg-[#252526]"
                  }`}
                >
                  <span className={`w-5 text-center font-black text-xs ${
                    entry.rank === 1 ? "text-yellow-400" :
                    entry.rank === 2 ? "text-gray-300" :
                    entry.rank === 3 ? "text-amber-600" :
                    "text-gray-500"
                  }`}>
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                  </span>
                  {entry.avatar && (
                    <img src={entry.avatar} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <span className={`flex-1 truncate font-bold ${entry.isMe ? "text-[#538d4e]" : "text-white"}`}>
                    {entry.isMe ? "Вы" : entry.name}
                  </span>
                  <span className="text-gray-400 text-xs font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Button */}
        <button
          onClick={onNewGame}
          className="w-full py-3.5 bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white font-black text-sm rounded-xl transition-all uppercase tracking-widest"
        >
          Новая игра
        </button>
      </div>
    </div>
  );
}
