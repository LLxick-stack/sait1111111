interface HowToPlayProps {
  onClose: () => void;
}

function ExampleTile({ char, color }: { char: string; color: "correct" | "present" | "absent" | "empty" }) {
  const colorMap = {
    correct: "bg-[#538d4e] border-[#538d4e] text-white",
    present: "bg-[#b59f3b] border-[#b59f3b] text-white",
    absent: "bg-[#3a3a3c] border-[#3a3a3c] text-white",
    empty: "bg-transparent border-gray-600 text-white",
  };
  return (
    <div className={`w-10 h-10 flex items-center justify-center border-2 rounded text-lg font-bold uppercase ${colorMap[color]}`}>
      {char}
    </div>
  );
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Как играть</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="text-gray-300 text-sm space-y-3 mb-5">
          <p>Угадайте <strong className="text-white">ВОРДЛИ</strong> за 6 попыток.</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Каждая попытка должна быть <strong className="text-white">настоящим словом</strong> из 5 букв.</li>
            <li>Цвет плиток меняется, подсказывая, насколько верна ваша попытка.</li>
          </ul>
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-5">
          <div>
            <div className="flex gap-1.5 mb-2">
              {["к", "о", "ш", "к", "а"].map((c, i) => (
                <ExampleTile key={i} char={c} color={i === 0 ? "correct" : "empty"} />
              ))}
            </div>
            <p className="text-gray-400 text-xs">
              Буква <strong className="text-white">К</strong> стоит на <strong className="text-[#538d4e]">правильном месте</strong>.
            </p>
          </div>

          <div>
            <div className="flex gap-1.5 mb-2">
              {["с", "л", "о", "в", "о"].map((c, i) => (
                <ExampleTile key={i} char={c} color={i === 2 ? "present" : "empty"} />
              ))}
            </div>
            <p className="text-gray-400 text-xs">
              Буква <strong className="text-white">О</strong> есть в слове, но <strong className="text-[#b59f3b]">не на этом месте</strong>.
            </p>
          </div>

          <div>
            <div className="flex gap-1.5 mb-2">
              {["г", "р", "о", "з", "а"].map((c, i) => (
                <ExampleTile key={i} char={c} color={i === 3 ? "absent" : "empty"} />
              ))}
            </div>
            <p className="text-gray-400 text-xs">
              Буквы <strong className="text-white">З</strong> <strong className="text-white">нет</strong> в слове ни на одном месте.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <p className="text-gray-400 text-xs text-center">
            Каждый день — новое слово!
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-[#538d4e] hover:bg-[#4a7d45] active:scale-95 text-white font-bold rounded-xl transition-all uppercase tracking-wider text-sm"
        >
          Играть!
        </button>
      </div>
    </div>
  );
}
