import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeToggle Component
 * Replicates the pill toggle design with Sun & Moon/Disc icons and smooth sliding animation.
 */
export default function ThemeToggle({ className = '' }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Modo Claro' : 'Modo Escuro'}
      className={`relative inline-flex items-center w-[66px] h-[34px] rounded-full p-[3px] cursor-pointer transition-all duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 ${
        isDark
          ? 'bg-[#18181b] border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
          : 'bg-[#f1f5f9] border border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]'
      } ${className}`}
    >
      {/* Background Icons (Sun on Left, Disc on Right) */}
      <div className="absolute inset-0 flex items-center justify-between px-[9px] pointer-events-none">
        {/* Sun Icon */}
        <div className={`transition-opacity duration-300 ${isDark ? 'opacity-40' : 'opacity-100'}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" fill={isDark ? "none" : "#fef08a"} />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </div>

        {/* Moon / Golden Disc Icon */}
        <div className={`transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-40'}`}>
          <div className="w-[14px] h-[14px] rounded-full border-[2.5px] border-[#f59e0b] bg-[#fef3c7]/60" />
        </div>
      </div>

      {/* Sliding Active Pill Indicator */}
      <div
        className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 ${
          isDark
            ? 'translate-x-[32px] bg-[#27272a] border-[2.5px] border-[#f59e0b] shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
            : 'translate-x-0 bg-white border-[2.5px] border-[#f59e0b] shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
        }`}
      >
        {isDark ? (
          <div className="w-[12px] h-[12px] rounded-full bg-[#fde68a]" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" fill="#fef08a" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        )}
      </div>
    </button>
  );
}
