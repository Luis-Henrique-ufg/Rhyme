/**
 * @file EmergencyRescueModal.jsx
 * @module components/EmergencyRescueModal
 * @description Modal de confirmação exibido ao finalizar viagem quando ainda há
 * passageiros aguardando ou liberados (evitando que alunos sejam esquecidos).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React from 'react';

export default function EmergencyRescueModal({
  pendingStudents,
  onConfirmBoarded,
  onConfirmAbandoned,
  onCancel,
}) {
  if (!pendingStudents || pendingStudents.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-card border border-subtle rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
        <h3 className="text-lg font-bold text-heading mb-2 relative z-10">Finalizar viagem?</h3>
        <p className="text-body text-sm mb-4 relative z-10">
          Ainda há <strong className="text-heading">{pendingStudents.length}</strong> aluno(s)
          aguardando na lista:
          <br />
          <span className="text-orange-400 font-medium italic mt-1 block">
            {pendingStudents.map((s) => s.studentName).join(', ')}
          </span>
          <br />
          Eles embarcaram e você esqueceu de marcar, ou realmente ficaram para trás?
        </p>
        <div className="flex flex-col gap-2 relative z-10">
          <button
            onClick={onConfirmBoarded}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            Eles embarcaram (marcar e finalizar)
          </button>
          <button
            onClick={onConfirmAbandoned}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2 cursor-pointer"
          >
            Ficaram para trás (apenas finalizar)
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-subtle hover-bg-subtle text-heading font-bold py-3 px-4 rounded-xl transition-colors mt-2 border border-subtle cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
