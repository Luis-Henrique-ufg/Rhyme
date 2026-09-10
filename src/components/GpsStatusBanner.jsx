/**
 * GpsStatusBanner — Displays floating GPS reception and broadcasting indicators at the top of the map.
 * Motion discipline: Clean fadeIn on appearance without continuous pulsing distractions.
 */
export default function GpsStatusBanner({
  isBroadcasting = false,
  isTripInProgress = false,
  hasBusLocation = false,
  gpsState = 'live',
  elapsedLabel = ''
}) {
  // 1. Student broadcasting location for the van
  if (isBroadcasting) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw] animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-primary/40 text-primary text-xs font-bold px-4 py-2 rounded-full shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0"></span>
          Transmitindo localização da Van em tempo real
        </div>
      </div>
    );
  }

  // 2. Waiting for driver GPS signal (no continuous animate-pulse)
  if (isTripInProgress && !hasBusLocation) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw] animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-subtle text-body text-xs font-medium px-4 py-2 rounded-full shadow-xl">
          <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M3.5 8a9.5 9.5 0 0 1 17 0" />
            <path d="M6.5 11a6 6 0 0 1 11 0" />
            <path d="M10.5 14a2 2 0 0 1 3 0" />
            <line x1="12" y1="22" x2="12" y2="17" />
          </svg>
          Aguardando posição GPS do motorista...
        </div>
      </div>
    );
  }

  // 3. Stale GPS signal
  if (gpsState === 'stale' && hasBusLocation) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw] animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-warning/40 text-warning text-xs font-bold px-4 py-2 rounded-full shadow-xl">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Última posição recebida {elapsedLabel ? elapsedLabel.toLowerCase() : ''} · sinal instável
        </div>
      </div>
    );
  }

  // 4. Expired or Paused GPS signal
  if ((gpsState === 'expired' || gpsState === 'paused') && hasBusLocation) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw] animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center gap-2 bg-card/95 backdrop-blur-md border border-subtle text-caption text-xs font-bold px-4 py-2 rounded-full shadow-xl">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3.5 8a9.5 9.5 0 0 1 17 0"/>
            <path d="M6.5 11a6 6 0 0 1 11 0"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
          GPS offline · última posição: {elapsedLabel}
        </div>
      </div>
    );
  }

  return null;
}
