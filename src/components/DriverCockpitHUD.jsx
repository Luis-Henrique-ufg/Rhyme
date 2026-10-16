/**
 * @file DriverCockpitHUD.jsx
 * @module components/DriverCockpitHUD
 * @description HUD flutuante no estilo cockpit (Waze/GPS) para o motorista,
 * exibindo próxima parada, distância em tempo real, rota rápida e chamada de embarque.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Navigation,
  Timer,
  X,
  Clock,
  UserCheck,
  UserX,
  Check,
} from 'lucide-react';

export default function DriverCockpitHUD({
  trip,
  nextStop,
  isHudCollapsed,
  setIsHudCollapsed,
  openNavigationTo,
  boardingCall,
  showDurationPicker,
  setShowDurationPicker,
  handleStartBoardingCall,
  handleExtendBoardingCall,
  handleCloseBoardingCall,
  boardingCallSecondsLeft,
  boardingResponseMap,
}) {
  if (trip?.status !== 'in_progress' || !nextStop) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-[1001] max-w-[calc(100vw-130px)] sm:max-w-md pointer-events-auto">
      {isHudCollapsed ? (
        <button
          onClick={() => setIsHudCollapsed(false)}
          className="flex items-center gap-2.5 bg-card/90 backdrop-blur-xl border border-primary/40 hover:border-primary text-heading rounded-full px-3.5 py-2 shadow-2xl transition-all group active:scale-95"
          title="Expandir detalhes da próxima parada"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
          </span>
          <span className="text-xs font-bold text-heading truncate max-w-[120px] sm:max-w-[180px]">
            {nextStop.title}
          </span>
          <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
            {nextStop.totalCount} {nextStop.totalCount === 1 ? 'aluno' : 'alunos'}
          </span>
          <span className="text-xs font-mono text-caption shrink-0 ml-0.5">
            {nextStop.distKm < 1
              ? `${Math.round(nextStop.distKm * 1000)}m`
              : `${nextStop.distKm.toFixed(1)}km`}
          </span>
          <ChevronDown size={14} className="text-caption group-hover:text-heading shrink-0" />
        </button>
      ) : (
        <div className="bg-card/95 backdrop-blur-2xl border border-primary/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col gap-2.5 transition-all animate-[fadeIn_0.2s_ease-out]">
          {/* Top Row: Tag + Minimize Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 font-mono">
                PRÓXIMA PARADA
              </span>
            </div>
            <button
              onClick={() => setIsHudCollapsed(true)}
              className="text-caption hover:text-heading p-1 rounded-lg hover-bg-subtle transition-colors"
              title="Minimizar painel"
            >
              <ChevronUp size={16} />
            </button>
          </div>

          {/* Content: Title, students & real-time distance */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-heading truncate leading-tight">
                {nextStop.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-caption">
                  {nextStop.totalCount} {nextStop.totalCount === 1 ? 'passageiro' : 'passageiros'}
                </span>
                {nextStop.liberadosCount > 0 && (
                  <span className="text-success font-semibold bg-success-bg px-1.5 py-0.5 rounded text-[10px] border border-success-border">
                    {nextStop.liberadosCount} liberado{nextStop.liberadosCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0 bg-subtle border border-subtle rounded-xl px-2.5 py-1.5">
              <div className="text-base sm:text-lg font-black text-heading font-mono tracking-tight leading-none">
                {nextStop.distKm < 1
                  ? `${Math.round(nextStop.distKm * 1000)}`
                  : nextStop.distKm.toFixed(1)}
                <span className="text-[10px] text-caption font-normal ml-0.5">
                  {nextStop.distKm < 1 ? 'm' : 'km'}
                </span>
              </div>
              <span className="text-[9px] text-caption font-medium block mt-0.5 uppercase tracking-wider">
                distância
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col gap-2 mt-0.5">
            <button
              onClick={() => openNavigationTo(nextStop.lat, nextStop.lng)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              <Navigation size={13} className="shrink-0 fill-current" />
              Traçar rota até este ponto
            </button>

            {/* Chamada de Embarque */}
            {!boardingCall || boardingCall.status !== 'active' ? (
              <div className="relative">
                <button
                  onClick={() => setShowDurationPicker((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 bg-subtle hover:bg-success-bg border border-subtle hover:border-success/60 text-heading hover:text-success font-bold text-xs py-2 px-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  <Timer size={13} className="shrink-0" />
                  Iniciar Chamada de Embarque
                </button>
                {/* Seletor de Duração */}
                {showDurationPicker && (
                  <div className="absolute bottom-[110%] left-0 right-0 z-10 bg-card border border-subtle rounded-xl p-3 shadow-2xl flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-caption flex items-center gap-1.5">
                      <Timer size={11} /> Tolerância de espera
                    </span>
                    <div className="flex gap-2">
                      {[2, 3, 5].map((min) => (
                        <button
                          key={min}
                          onClick={() => handleStartBoardingCall(min)}
                          className="flex-1 py-2 rounded-xl badge-success font-black text-sm hover:brightness-110 transition-all active:scale-95"
                        >
                          {min} min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Chamada Ativa — Cronômetro + Respostas */
              <div className="rounded-xl border border-success/30 bg-success-bg p-3 flex flex-col gap-2">
                {/* Header: countdown + encerrar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-success">
                      Chamada Ativa
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleExtendBoardingCall(1);
                      }}
                      className="text-caption hover:text-heading text-xs font-bold px-2.5 py-1 rounded-lg border border-subtle transition-all active:scale-95 cursor-pointer bg-surface/80"
                      title="Adicionar 1 minuto"
                    >
                      +1 min
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleCloseBoardingCall();
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/80 hover:bg-danger/15 text-caption hover:text-danger border border-subtle transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Encerrar chamada"
                      aria-label="Encerrar chamada"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Cronômetro */}
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={`font-black font-mono text-2xl leading-none ${
                      boardingCallSecondsLeft <= 30
                        ? 'text-danger animate-pulse'
                        : boardingCallSecondsLeft <= 60
                          ? 'text-warning'
                          : 'text-success'
                    }`}
                  >
                    {String(Math.floor(boardingCallSecondsLeft / 60)).padStart(2, '0')}:
                    {String(boardingCallSecondsLeft % 60).padStart(2, '0')}
                  </span>
                  {/* Barra de progresso */}
                  <div className="w-full h-1 bg-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(boardingCallSecondsLeft / (boardingCall.durationMinutes * 60)) * 100}%`,
                        background:
                          boardingCallSecondsLeft <= 30
                            ? '#f87171'
                            : boardingCallSecondsLeft <= 60
                              ? '#fbbf24'
                              : '#34d399',
                      }}
                    />
                  </div>
                </div>

                {/* Lista de respostas dos alunos */}
                <div className="flex flex-col gap-1">
                  {boardingCall.targetStudentNames?.map(({ uid, name }) => {
                    const resp = boardingResponseMap[uid];
                    return (
                      <div key={uid} className="flex items-center justify-between py-0.5">
                        <span className="text-xs text-body font-medium truncate max-w-[120px]">
                          {name}
                        </span>
                        {!resp ? (
                          <span className="flex items-center gap-1 text-[10px] text-caption">
                            <Clock size={10} /> Aguardando
                          </span>
                        ) : resp.response === 'coming' ? (
                          <span className="flex items-center gap-1 text-[10px] text-success font-semibold">
                            <UserCheck size={10} /> A caminho
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-caption line-through">
                            <UserX size={10} /> Dispensado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleCloseBoardingCall();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-subtle hover-bg-subtle text-body hover:text-heading font-bold text-xs py-2.5 px-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Check size={14} /> Partir / Encerrar chamada
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
