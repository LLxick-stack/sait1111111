import { AudioSettings } from "../utils/useAudio";

interface SettingsProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
  onClose: () => void;
}

function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-base font-medium" style={{ color: "var(--text)" }}>{label}</span>
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
      <div
        className="rounded-2xl w-full max-w-sm mx-4 p-6 animate-fade-in"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black tracking-wide uppercase" style={{ color: "var(--text)" }}>Настройки</h2>
          <button onClick={onClose} className="transition-colors p-1" style={{ color: "var(--text2)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="mb-2" style={{ borderTop: "1px solid var(--border)" }} />
        <Toggle label="Светлая тема" enabled={settings.lightTheme} onToggle={() => toggle("lightTheme")} />
        <div style={{ borderTop: "1px solid var(--border)" }} />
        <Toggle label="Звуки" enabled={settings.soundEnabled} onToggle={() => toggle("soundEnabled")} />
        <div style={{ borderTop: "1px solid var(--border)" }} />
        <Toggle label="Музыка" enabled={settings.musicEnabled} onToggle={() => toggle("musicEnabled")} />
      </div>
    </div>
  );
}
