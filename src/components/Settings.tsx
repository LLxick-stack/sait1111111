import { AudioSettings } from "../utils/useAudio";

interface SettingsProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  onClose: () => void;
}

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-white text-base font-medium">{label}</span>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          enabled ? "bg-[#538d4e]" : "bg-[#3a3a3c]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings({ settings, onChange, onClose }: SettingsProps) {
  const toggle = (key: keyof AudioSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    onChange(next);
    localStorage.setItem("wordle_settings", JSON.stringify(next));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a1b] border border-gray-700 rounded-2xl w-full max-w-sm mx-4 p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-black tracking-wide uppercase">Настройки</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="border-t border-gray-700 mb-2" />
        <Toggle label="Звуки" enabled={settings.soundEnabled} onToggle={() => toggle("soundEnabled")} />
        <div className="border-t border-gray-800" />
        <Toggle label="Музыка" enabled={settings.musicEnabled} onToggle={() => toggle("musicEnabled")} />
      </div>
    </div>
  );
}
