import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const steps = [20, 45, 70, 90, 100];
    const timings = [200, 400, 600, 900, 1200];
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, i) => {
      timers.push(setTimeout(() => setProgress(step), timings[i]));
    });

    timers.push(setTimeout(() => setFadeOut(true), 1500));
    timers.push(setTimeout(() => onDone(), 1900));

    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-[100] transition-opacity duration-400 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "#f9f9f9" }}
    >
      <div className="flex gap-2 mb-8">
        {["Р", "У", "С", "В", "Д"].map((letter, i) => {
          const colors = [
            "bg-[#538d4e] border-[#538d4e]",
            "bg-[#b59f3b] border-[#b59f3b]",
            "bg-[#538d4e] border-[#538d4e]",
            "bg-[#3a3a3c] border-[#3a3a3c]",
            "bg-[#538d4e] border-[#538d4e]",
          ];
          return (
            <div
              key={i}
              className={`w-12 h-12 flex items-center justify-center border-2 rounded text-xl font-black text-white ${colors[i]}`}
              style={{
                animation: `popIn 0.3s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              {letter}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 mt-8">
        <p className="font-black tracking-widest uppercase" style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)", color: "#1a1a1b" }}>Загрузка</p>
        <div className="w-56 h-1.5 rounded-full overflow-hidden" style={{ background: "#d3d6da" }}>
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, background: "#538d4e" }}
          />
        </div>
      </div>
    </div>
  );
}
