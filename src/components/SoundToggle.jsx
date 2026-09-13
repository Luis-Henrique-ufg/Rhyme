import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playToggleSound } from '../utils/audioEffects';

/**
 * SoundToggle Component
 * Replicates the pill toggle design matching ThemeToggle.
 * Switches UI sound effects on/off and persists preference in localStorage.
 */
export default function SoundToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());

    const handleToggle = (e) => {
      if (typeof e.detail === 'boolean') {
        setEnabled(e.detail);
      }
    };

    window.addEventListener('rhyme-sound-toggle', handleToggle);
    return () => window.removeEventListener('rhyme-sound-toggle', handleToggle);
  }, []);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    setSoundEnabled(nextState);
    playToggleSound(nextState);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={enabled ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
      title={enabled ? 'Sons Ativados' : 'Sons Desativados'}
      className={`relative inline-flex items-center w-[66px] h-[34px] rounded-full p-[3px] cursor-pointer transition-all duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50 bg-[#18181b] border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${className}`}
    >
      {/* Background Icons (Mute on Left, Sound on Right) */}
      <div className="absolute inset-0 flex items-center justify-between px-[9px] pointer-events-none">
        {/* Mute Icon */}
        <div className={`transition-opacity duration-300 ${!enabled ? 'opacity-100 text-caption' : 'opacity-30 text-caption'}`}>
          <VolumeX size={15} />
        </div>

        {/* Sound Icon */}
        <div className={`transition-opacity duration-300 ${enabled ? 'opacity-100 text-primary' : 'opacity-30 text-caption'}`}>
          <Volume2 size={15} />
        </div>
      </div>

      {/* Sliding Active Pill Indicator */}
      <div
        className={`w-[28px] h-[28px] rounded-full flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 ${
          enabled
            ? 'translate-x-[32px] bg-[#27272a] border-[2.5px] border-primary shadow-[0_2px_8px_rgba(245,158,11,0.35)] text-primary'
            : 'translate-x-0 bg-[#27272a] border-[2.5px] border-caption/50 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-caption'
        }`}
      >
        {enabled ? (
          <Volume2 size={13} />
        ) : (
          <VolumeX size={13} />
        )}
      </div>
    </button>
  );
}
