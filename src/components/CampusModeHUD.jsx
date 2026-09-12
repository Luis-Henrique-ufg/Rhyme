import { useMemo } from 'react';
import { Footprints, MapPin, Navigation2, X, Compass, School, Utensils, BookOpen, Building2 } from 'lucide-react';

/**
 * Campus POIs para universidades suportadas
 */
export const CAMPUS_POIS = {
  'UFG': [
    { id: 'portaria', name: 'Portaria da Van (Ponto de Encontro)', type: 'van', icon: MapPin, coords: [-16.603568, -49.265574] },
    { id: 'bc', name: 'Biblioteca Central (BC)', type: 'biblio', icon: BookOpen, coords: [-16.602230, -49.262500] },
    { id: 'ru', name: 'Restaurante Universitário (RU)', type: 'food', icon: Utensils, coords: [-16.604500, -49.264200] },
    { id: 'inf', name: 'Instituto de Informática (INF)', type: 'building', icon: Building2, coords: [-16.598500, -49.264000] },
    { id: 'reitoria', name: 'Prédio da Reitoria', type: 'admin', icon: School, coords: [-16.606200, -49.263500] }
  ],
  'PUC': [
    { id: 'portaria', name: 'Portaria Área 1 (Ponto da Van)', type: 'van', icon: MapPin, coords: [-16.674751, -49.242090] },
    { id: 'bc', name: 'Biblioteca Central PUC', type: 'biblio', icon: BookOpen, coords: [-16.673800, -49.242900] },
    { id: 'food', name: 'Praça de Alimentação / Cantina', type: 'food', icon: Utensils, coords: [-16.675200, -49.241500] },
    { id: 'area2', name: 'Área 2 (Engenharias)', type: 'building', icon: Building2, coords: [-16.676500, -49.243500] }
  ],
  'UNIP': [
    { id: 'portaria', name: 'Portaria Principal (Ponto da Van)', type: 'van', icon: MapPin, coords: [-16.719133, -49.237381] },
    { id: 'bc', name: 'Biblioteca UNIP', type: 'biblio', icon: BookOpen, coords: [-16.718500, -49.237900] },
    { id: 'food', name: 'Cantina / Pátio Central', type: 'food', icon: Utensils, coords: [-16.719600, -49.236900] }
  ]
};

/**
 * CampusModeHUD — Painel de navegação pedestre dentro da faculdade
 */
export default function CampusModeHUD({
  facultyName = 'UFG',
  vanCoords,
  userWalkingCoords,
  onExit,
  onFlyTo,
  onToggleCompass,
  isCompassActive,
  onCenterUser
}) {
  // POIs do campus atual ou fallback para genérico da faculdade
  const pois = useMemo(() => {
    const key = Object.keys(CAMPUS_POIS).find(k => facultyName?.toUpperCase().includes(k));
    if (key && CAMPUS_POIS[key]) return CAMPUS_POIS[key];

    return [
      { id: 'portaria', name: `Portaria ${facultyName} (Ponto da Van)`, type: 'van', icon: MapPin, coords: vanCoords }
    ];
  }, [facultyName, vanCoords]);

  // Cálculo de distância pedestre em linha reta até o ponto da van
  const distanceInfo = useMemo(() => {
    if (!userWalkingCoords || !vanCoords) return null;
    const [lat1, lng1] = userWalkingCoords;
    const [lat2, lng2] = vanCoords;

    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const meters = Math.round(R * c);

    // Média de velocidade de caminhada humana: ~1.2 m/s (~70m por minuto)
    const minutes = Math.max(1, Math.round(meters / 70));

    return { meters, minutes };
  }, [userWalkingCoords, vanCoords]);

  return (
    <div className="absolute top-2 left-2 right-2 z-[1500] flex flex-col gap-2 pointer-events-none">
      {/* Barra de Topo do Modo Campus */}
      <div className="bg-surface-elevated/95 backdrop-blur-md border border-orange-500/30 rounded-2xl p-3 shadow-xl flex items-center justify-between pointer-events-auto transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-black flex items-center justify-center shrink-0 shadow-md">
            <Footprints size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-heading tracking-wide truncate">{facultyName}</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                Pedestre
              </span>
            </div>
            {distanceInfo ? (
              <p className="text-[11px] text-caption truncate">
                Portaria: <strong className="text-orange-400 font-bold">{distanceInfo.meters}m</strong> (~{distanceInfo.minutes} min a pé)
              </p>
            ) : (
              <p className="text-[11px] text-caption truncate">Navegação a pé pelo campus</p>
            )}
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onCenterUser}
            className="p-2 rounded-xl bg-subtle hover-bg-subtle text-caption hover:text-heading border border-subtle transition-all cursor-pointer"
            title="Centralizar no meu passo"
          >
            <Navigation2 size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleCompass}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isCompassActive
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-subtle hover-bg-subtle text-caption hover:text-heading border-subtle'
            }`}
            title="Girar com a Bússola"
          >
            <Compass size={16} />
          </button>
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl bg-subtle hover:bg-danger/20 text-caption hover:text-danger border border-subtle transition-all cursor-pointer"
            title="Sair do Modo Campus"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Carrossel Horizontal de Atalhos dos Prédios/POIs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto select-none">
        {pois.map((poi) => {
          const IconComponent = poi.icon || MapPin;
          return (
            <button
              key={poi.id}
              type="button"
              onClick={() => onFlyTo?.(poi.coords, poi.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated/90 backdrop-blur-md border border-subtle hover:border-orange-500/40 text-heading hover:text-orange-400 text-xs font-semibold shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <IconComponent size={13} className="text-orange-400" />
              <span className="truncate max-w-[150px]">{poi.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
