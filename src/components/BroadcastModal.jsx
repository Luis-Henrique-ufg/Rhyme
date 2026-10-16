/**
 * @file BroadcastModal.jsx
 * @module components/BroadcastModal
 * @description Modal de confirmação para início de transmissão de GPS da Van pelo Aluno.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { Radio } from 'lucide-react';

export default function BroadcastModal({
  isOpen,
  onClose,
  onConfirm,
  isAnotherStudentActive,
  locationProviderName,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative electric-card bg-card w-full max-w-sm rounded-3xl border border-subtle shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] relative">
          <Radio size={32} className="animate-pulse" />
          <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-ping"></span>
        </div>
        <h2 className="text-xl font-bold text-heading mb-2">Transmitir GPS da Van</h2>

        {isAnotherStudentActive ? (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium text-left flex items-start gap-2.5">
            <Radio size={18} className="shrink-0 mt-0.5" />
            <span>
              <strong>Aviso:</strong> {locationProviderName || 'Outro passageiro'} já está
              transmitindo no momento. Ao confirmar, você assumirá a transmissão oficial da van.
            </span>
          </div>
        ) : (
          <p className="text-sm text-caption mb-5 leading-relaxed">
            O motorista ainda não compartilhou a localização. Você já está a bordo da van?
          </p>
        )}

        <div className="bg-subtle/50 rounded-2xl p-4 mb-6 text-xs text-body text-left space-y-2.5 border border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_#10b981]"></div>
            <span>O ícone da Van seguirá sua posição em tempo real para todos na rota.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 shadow-[0_0_6px_#f97316]"></div>
            <span>
              Ao chegar na faculdade, basta pausar o GPS; seu trajeto e presença continuam normais.
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_6px_#3b82f6]"></div>
            <span>
              Na volta da aula, você continua podendo usar o botão <strong>LIBERADO</strong>{' '}
              normalmente.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="w-full py-3.5 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Radio size={18} />
            <span>Sim, estou na van e quero transmitir</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-medium text-caption hover:text-heading transition-colors cursor-pointer text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
