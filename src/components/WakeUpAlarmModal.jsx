import { useEffect } from 'react';
import { BellRing, MapPin, CheckCircle } from 'lucide-react';
import { startWakeUpAlarmSound, stopWakeUpAlarmSound } from '../utils/audioEffects';

/**
 * WakeUpAlarmModal — Modal de alta prioridade que dispara quando o aluno
 * está próximo do seu ponto de descida na volta para casa.
 */
export default function WakeUpAlarmModal({
  isOpen,
  distanceMeters = 0,
  stopName = 'Sua Parada / Casa',
  onDismiss,
  onSnooze
}) {
  useEffect(() => {
    if (!isOpen) {
      stopWakeUpAlarmSound();
      return;
    }

    // Inicia som de alarme persistente
    try {
      startWakeUpAlarmSound();
    } catch (e) {
      console.warn('Erro ao iniciar som do despertador:', e);
    }

    // Padrão de vibração contínuo (se suportado pelo celular)
    let vibrateInterval = null;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([600, 200, 600, 200, 1000]);
        vibrateInterval = setInterval(() => {
          navigator.vibrate([600, 200, 600, 200, 1000]);
        }, 3000);
      } catch (e) {
        console.warn('Vibração não permitida:', e);
      }
    }

    return () => {
      stopWakeUpAlarmSound();
      if (vibrateInterval) clearInterval(vibrateInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    stopWakeUpAlarmSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(0); } catch (e) {}
    }
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-[fadeIn_0.3s_ease-out]">
      {/* Luz pulsante de emergência no fundo */}
      <div className="absolute inset-0 bg-radial from-orange-500/20 via-transparent to-black pointer-events-none animate-pulse"></div>

      <div className="relative w-full max-w-sm bg-surface-elevated border-2 border-orange-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(249,115,22,0.4)] flex flex-col items-center text-center gap-5 z-10">
        {/* Ícone pulsante com animação de sino */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/40 flex items-center justify-center shadow-lg animate-bounce">
            <BellRing size={40} className="text-orange-500" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] text-white font-bold items-center justify-center">!</span>
          </span>
        </div>

        {/* Título & Mensagem de Alerta */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
            Alerta de Parada · Não passe do ponto!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-heading mt-3 tracking-tight">
            ACORDA! SUA PARADA ESTÁ CHEGANDO!
          </h2>
          <p className="text-sm text-caption mt-2">
            A Van está a aproximadamente <strong className="text-orange-400 font-black">{Math.round(distanceMeters)}m</strong> do seu ponto de descida.
          </p>
        </div>

        {/* Card do ponto */}
        <div className="w-full bg-surface border border-subtle rounded-2xl p-3.5 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-caption font-bold uppercase tracking-wider">Destino de descida</p>
            <p className="text-sm font-bold text-heading truncate">{stopName}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-black font-black text-base rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={22} strokeWidth={3} />
            JÁ ACORDEI / DESLIGAR
          </button>

          {onSnooze && (
            <button
              type="button"
              onClick={() => {
                stopWakeUpAlarmSound();
                onSnooze?.();
              }}
              className="w-full py-2.5 px-4 bg-subtle hover-bg-subtle text-caption hover:text-heading font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Lembrar de novo em 300m (Soneca)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
