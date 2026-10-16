/**
 * @file StudentControls.jsx
 * @module components/StudentControls
 * @description Barra inferior de ações rápidas do aluno no mapa (Ajustar local, Trajeto, Transmitir GPS e Alarme).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { MapPin, Navigation, Radio, BellRing } from 'lucide-react';

export default function StudentControls({
  isLiberado,
  isEmbarcado,
  isDriverActive,
  isBroadcasting,
  wakeUpEnabled,
  onOpenLocationAdjust,
  onOpenCheckIn,
  onToggleBroadcasting,
  onOpenWakeUpSettings,
}) {
  return (
    <>
      <div
        id="navbar-compass-slot"
        className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
      ></div>
      <div
        id="navbar-recenter-slot"
        className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
      ></div>

      {isLiberado && (
        <>
          <button
            type="button"
            onClick={onOpenLocationAdjust}
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors cursor-pointer"
          >
            <div className="p-1.5 sm:p-2">
              <MapPin size={22} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              Ajustar
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCheckIn}
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors cursor-pointer"
          >
            <div className="p-1.5 sm:p-2">
              <Navigation size={22} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              Trajeto
            </span>
          </button>
        </>
      )}

      {(isEmbarcado || !isDriverActive || isBroadcasting) && (
        <button
          type="button"
          onClick={onToggleBroadcasting}
          className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-all cursor-pointer ${
            isBroadcasting
              ? 'text-red-500 hover:text-red-400 font-bold scale-105'
              : 'text-body hover:text-primary'
          }`}
          title={
            isBroadcasting
              ? 'Pausar transmissão de GPS da van'
              : 'Transmitir GPS da van para os outros alunos'
          }
        >
          <div className="p-1.5 sm:p-2 relative">
            <Radio size={22} className={isBroadcasting ? 'animate-pulse' : ''} />
            {isBroadcasting ? (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-ping"></span>
            ) : (
              !isDriverActive && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_6px_#f59e0b]"></span>
              )
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
            {isBroadcasting ? 'GPS Ativo' : 'Enviar GPS'}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onOpenWakeUpSettings}
        className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-all cursor-pointer ${
          wakeUpEnabled ? 'text-orange-500 font-bold' : 'text-body hover:text-primary'
        }`}
        title="Configurar alarme para não perder a parada na volta"
      >
        <div className="p-1.5 sm:p-2 relative">
          <BellRing size={22} className={wakeUpEnabled ? 'text-orange-500' : ''} />
          {wakeUpEnabled && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]"></span>
          )}
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
          {wakeUpEnabled ? 'Alarme ON' : 'Alarme'}
        </span>
      </button>
    </>
  );
}
