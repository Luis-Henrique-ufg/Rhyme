/**
 * @file CheckInModal.jsx
 * @module components/CheckInModal
 * @description Modal para o aluno selecionar seu trajeto do dia (Ida, Volta, Ida e Volta).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { Navigation, Check } from 'lucide-react';

const TRIP_OPTIONS = [
  { id: 'ida_volta', label: 'Ida e Volta' },
  { id: 'ida', label: 'Só Ida' },
  { id: 'volta', label: 'Só Volta' },
];

export default function CheckInModal({ isOpen, onClose, currentTripType, onSelectTripType }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative electric-card bg-card w-full max-w-sm rounded-3xl border border-subtle shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
          <Navigation size={32} />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-2">Vai embarcar hoje?</h2>
        <p className="text-sm text-caption mb-6">
          Selecione seu trajeto para confirmar sua presença na lista do motorista.
        </p>

        <div className="space-y-3">
          {TRIP_OPTIONS.map((option) => {
            const isSelected = (currentTripType || 'ida_volta') === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectTripType(option.id)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-between px-5 cursor-pointer active:scale-[0.98] ${
                  isSelected
                    ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/20'
                    : 'bg-subtle hover-bg-subtle text-heading border border-subtle'
                }`}
              >
                <span className="flex-1 text-center font-black tracking-wide">{option.label}</span>
                {isSelected && (
                  <Check size={20} strokeWidth={3} className="text-black shrink-0 -ml-5" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-sm text-caption hover:text-heading transition-colors"
        >
          Decidir mais tarde
        </button>
      </div>
    </div>
  );
}
