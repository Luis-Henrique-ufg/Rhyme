/**
 * @file DriverBottomBar.jsx
 * @module components/DriverBottomBar
 * @description Barra de navegação inferior e controle de ações da viagem para o motorista
 * (Checklist, Resumo, Indicador GPS, Iniciar, Atualizar, Finalizar, Reabrir e Limpar).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React from 'react';
import {
  Users,
  BarChart2,
  LocateFixed,
  Play,
  RefreshCcw,
  StopCircle,
  MapPinOff,
} from 'lucide-react';

export default function DriverBottomBar({
  trip,
  isPublicListOpen,
  setIsPublicListOpen,
  isPanelOpen,
  setIsPanelOpen,
  attendanceMap = {},
  gpsStatus,
  gpsAccuracy,
  isUpdatingTrip,
  updateTripStatus,
  recalculateGlobalRoute,
  handleFinishClick,
  clearAllRoutes,
  hasActiveRoutes,
}) {
  if (!trip) return null;

  const pendingCount = Object.values(attendanceMap).filter(
    (att) => att.status === 'liberado' || att.status === 'aguardando'
  ).length;

  return (
    <div
      className="bottom-nav bg-surface border-t border-subtle flex items-center justify-around gap-1 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-50 shrink-0 pb-safe shadow-lg w-full overflow-hidden select-none touch-none overscroll-none"
      onWheel={(e) => e.preventDefault()}
    >
      <button
        onClick={() => {
          const newState = !isPublicListOpen;
          setIsPublicListOpen(newState);
          if (newState) setIsPanelOpen(false);
        }}
        className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors relative"
      >
        <div className="relative p-1.5 sm:p-2">
          <Users size={22} />
          <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
            {pendingCount}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
          Lista
        </span>
      </button>

      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-colors ${
          isPanelOpen ? 'text-primary' : 'text-body hover:text-primary'
        }`}
      >
        <div className="p-1.5 sm:p-2">
          <BarChart2 size={22} />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
          Resumo
        </span>
      </button>

      {/* Indicador GPS — visível apenas em in_progress, alinhado ao design system */}
      {trip.status === 'in_progress' && (
        <div
          title={gpsAccuracy != null ? `Precisão: ±${gpsAccuracy}m` : 'Aguardando GPS...'}
          className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center shrink-0 select-none ${
            gpsStatus === 'active'
              ? 'text-success'
              : gpsStatus === 'error'
                ? 'text-danger'
                : 'text-caption'
          }`}
        >
          <div className="relative p-1.5 sm:p-2">
            {gpsStatus === 'active' && (
              <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
            )}
            <LocateFixed size={22} className="relative" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 leading-none truncate max-w-full">
            {gpsStatus === 'active'
              ? gpsAccuracy != null
                ? `±${gpsAccuracy}m`
                : 'AO VIVO'
              : gpsStatus === 'error'
                ? 'Erro'
                : 'GPS'}
          </span>
        </div>
      )}

      <div
        id="navbar-compass-slot"
        className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
      ></div>
      <div
        id="navbar-recenter-slot"
        className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
      ></div>

      {trip.status === 'open' && (
        <button
          onClick={() => updateTripStatus('in_progress')}
          disabled={isUpdatingTrip}
          className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors ${
            isUpdatingTrip ? 'opacity-50' : ''
          }`}
        >
          <div className="p-1.5 sm:p-2">
            <Play size={22} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            {isUpdatingTrip ? 'Iniciando' : 'Iniciar'}
          </span>
        </button>
      )}

      {trip.status === 'in_progress' && (
        <button
          onClick={recalculateGlobalRoute}
          disabled={isUpdatingTrip}
          className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors ${
            isUpdatingTrip ? 'opacity-50' : ''
          }`}
        >
          <div className="p-1.5 sm:p-2">
            <RefreshCcw size={22} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            {isUpdatingTrip ? 'Atz...' : 'Atualizar'}
          </span>
        </button>
      )}

      {trip.status === 'in_progress' && (
        <button
          onClick={handleFinishClick}
          className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-danger transition-colors"
        >
          <div className="p-1.5 sm:p-2">
            <StopCircle size={22} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            Finalizar
          </span>
        </button>
      )}

      {trip.status === 'finished' && (
        <button
          onClick={() => updateTripStatus('open')}
          className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
        >
          <div className="p-1.5 sm:p-2">
            <Play size={22} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            Reabrir
          </span>
        </button>
      )}

      {hasActiveRoutes && trip.status !== 'finished' && (
        <button
          onClick={clearAllRoutes}
          className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
          title="Limpar todas as rotas do mapa"
        >
          <div className="p-1.5 sm:p-2">
            <MapPinOff size={22} />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            Limpar
          </span>
        </button>
      )}
    </div>
  );
}
