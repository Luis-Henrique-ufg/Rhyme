import { Bus, UserCheck, UserX, X } from 'lucide-react';

/**
 * BoardingCallModal — High-priority countdown dialog when the van reaches the faculty portaria.
 */
export default function BoardingCallModal({
  isOpen,
  faculty = 'Sua faculdade',
  secondsLeft = 0,
  durationMinutes = 3,
  onClose,
  onResponse
}) {
  if (!isOpen) return null;

  const minutesStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secondsStr = String(secondsLeft % 60).padStart(2, '0');
  const totalSeconds = (durationMinutes || 3) * 60;
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / totalSeconds) * 100));

  const timerColorClass =
    secondsLeft <= 30
      ? 'text-danger animate-pulse'
      : secondsLeft <= 60
      ? 'text-warning'
      : 'text-success';

  const barColor =
    secondsLeft <= 30
      ? '#ef4444'
      : secondsLeft <= 60
      ? '#d97706'
      : '#22c55e';

  return (
    <div className="absolute inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-success/40 rounded-3xl p-5 shadow-2xl animate-[fadeIn_0.3s_ease-out] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Bus size={18} className="text-success" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-success">Van na portaria!</p>
              <p className="text-[11px] text-caption">{faculty || 'Sua faculdade'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose?.();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-caption hover:text-heading hover-bg-subtle transition-colors cursor-pointer border border-subtle"
            aria-label="Fechar aviso"
          >
            <X size={18} />
          </button>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-2">
          <span className={`font-black font-mono text-6xl leading-none tracking-tight ${timerColorClass}`}>
            {minutesStr}:{secondsStr}
          </span>
          <p className="text-xs text-caption">de tolerância para embarque</p>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progressPercent}%`,
                background: barColor
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onResponse('coming')}
            className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-900/30 transition-all"
          >
            <UserCheck size={18} />
            Estou a Caminho / Descendo
          </button>
          <button
            onClick={() => onResponse('skip')}
            className="w-full flex items-center justify-center gap-3 bg-subtle hover-bg-subtle border border-subtle active:scale-[0.98] text-body font-bold text-sm py-3 px-4 rounded-2xl transition-all"
          >
            <UserX size={16} />
            Pode Seguir, Não Vou
          </button>
        </div>
      </div>
    </div>
  );
}
