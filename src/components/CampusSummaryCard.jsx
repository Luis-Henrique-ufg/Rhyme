/**
 * @file CampusSummaryCard.jsx
 * @module components/CampusSummaryCard
 * @description Painel flutuante consolidado com o resumo da rota por faculdade
 * e contagem de passageiros aguardando.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React from 'react';
import { X } from 'lucide-react';

export default function CampusSummaryCard({
  isPanelOpen,
  setIsPanelOpen,
  trip,
  facultySummary = [],
}) {
  return (
    <div
      className={`absolute md:relative z-10 w-full md:w-[400px] electric-card bg-card p-5 overflow-y-auto border-t md:border-t-0 md:border-r border-subtle shadow-2xl flex flex-col mt-auto md:mt-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isPanelOpen
          ? 'translate-y-0 md:translate-x-0 max-h-[55vh] md:max-h-full bottom-0'
          : 'translate-y-full md:translate-y-0 md:-translate-x-full max-h-[55vh] md:max-h-full bottom-0 md:left-0'
      } `}
    >
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bricolage font-light text-heading tracking-tight">
          Resumo da Rota
        </h2>
        <button
          onClick={() => setIsPanelOpen(false)}
          className="w-8 h-8 flex items-center justify-center bg-subtle hover-bg-subtle text-caption hover:text-heading rounded-full transition-colors border border-subtle"
          title="Fechar resumo"
          aria-label="Fechar resumo"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {!trip && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-xl mb-4 text-sm font-medium">
          Nenhuma viagem aberta no momento. (Aguardando criação de rota).
        </div>
      )}

      <div className="flex-1 space-y-4 pr-2 custom-scrollbar">
        {facultySummary.map((fac) => (
          <div
            key={fac.name}
            className="bg-subtle border border-subtle p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-heading text-lg">{fac.name}</h3>
              <p className="text-caption text-sm font-medium">Na lista de hoje</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tracking-tight text-orange-500">
                {fac.count} <span className="text-sm font-medium text-caption">passageiros</span>
              </div>
            </div>
          </div>
        ))}
        {facultySummary.length === 0 && (
          <p className="text-center text-caption py-6">Nenhum aluno aguardando na rota hoje.</p>
        )}
      </div>
    </div>
  );
}
