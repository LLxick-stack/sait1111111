import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animate progress bar
    const steps = [20, 45, 70, 90, 100];
    const timings = [200, 400, 600, 900, 1200];
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((step, i) => {
      timers.push(setTimeout(() => setProgress(step), timings[i]));
    });

    // Start fade out after progress hits 100
    timers.push(
      setTimeout(() => {
        setFadeOut(true);
      }, 1500)
    );

    // Notify parent after fade out
    timers.push(
      setTimeout(() => {
        onDone();
      }, 1900)
    );

    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 bg-[#121213] flex flex-col items-center justify-center z-[100] transition-opacity duration-400 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo tiles */}
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

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-[#3a3a3c] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#538d4e] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
