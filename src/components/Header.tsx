interface HeaderProps {
  onHowToPlay: () => void;
  onNewGame: () => void;
}

export default function Header({ onHowToPlay, onNewGame }: HeaderProps) {
  return (
    <header className="w-full max-w-lg border-b border-gray-700 flex items-center justify-between px-4 py-3">
      <button
        onClick={onHowToPlay}
        className="text-gray-400 hover:text-white transition-colors p-1"
        title="Как играть"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <path d="M12 17h.01"/>
        </svg>
      </button>

      <h1 className="text-2xl font-black tracking-[0.15em] text-white uppercase">
        Русский Вордли
      </h1>

      <button
        onClick={onNewGame}
        className="text-gray-400 hover:text-white transition-colors p-1"
        title="Новая игра"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </header>
  );
}
