import { useMemo } from 'react';
import { Footprints, MapPin, Navigation2, X, Compass, School, Utensils, BookOpen, Building2, Sparkles, Crosshair } from 'lucide-react';
import { playTapSound, playToggleSound } from '../utils/audioEffects';

/**
 * Campus POIs com coordenadas exatas (Mapbox / OpenStreetMap)
 */
export const CAMPUS_POIS = {
  'UFG': [
    { id: 'bc', name: 'Biblioteca Central (BC)', type: 'biblio', icon: BookOpen, coords: [-16.605554, -49.261135] },
    { id: 'ru', name: 'Restaurante Universitário (RU)', type: 'food', icon: Utensils, coords: [-16.602050, -49.262147] },
    { id: 'inf', name: 'Instituto de Informática (INF)', type: 'building', icon: Building2, coords: [-16.603557, -49.266572] },
    { id: 'reitoria', name: 'Prédio da Reitoria', type: 'admin', icon: School, coords: [-16.606832, -49.259380] },
    { id: 'baru', name: 'Centro de Aulas Baru (CAB)', type: 'building', icon: Building2, coords: [-16.603100, -49.265819] },
    { id: 'aroeira', name: 'Centro de Aulas Aroeira', type: 'building', icon: Building2, coords: [-16.602705, -49.262764] },
    { id: 'fav', name: 'Faculdade Artes Visuais (FAV)', type: 'building', icon: Building2, coords: [-16.605643, -49.262052] },
    { id: 'letras', name: 'Faculdade de Letras', type: 'building', icon: Building2, coords: [-16.602754, -49.263820] },
    { id: 'eventos', name: 'Centro de Eventos (Bufáiçal)', type: 'admin', icon: School, coords: [-16.604035, -49.258975] }
  ],
  'UFG - CAMPUS COLEMAR': [
    { id: 'direito', name: 'Faculdade de Direito', type: 'building', icon: Building2, coords: [-16.675499, -49.243582] },
    { id: 'bc', name: 'Biblioteca Seccional Câmpus 1', type: 'biblio', icon: BookOpen, coords: [-16.675247, -49.243570] },
    { id: 'ru', name: 'Restaurante Universitário', type: 'food', icon: Utensils, coords: [-16.675507, -49.242882] },
    { id: 'medicina', name: 'Faculdade de Medicina', type: 'building', icon: Building2, coords: [-16.674096, -49.244128] },
    { id: 'odonto', name: 'Faculdade de Odontologia', type: 'building', icon: Building2, coords: [-16.673250, -49.243500] }
  ],
  'PUC': [
    { id: 'bc', name: 'Biblioteca Central PUC', type: 'biblio', icon: BookOpen, coords: [-16.673800, -49.242900] },
    { id: 'area2', name: 'Área 2 (Engenharias)', type: 'building', icon: Building2, coords: [-16.676500, -49.243500] },
    { id: 'area4', name: 'Área 4 (Saúde e Biológicas)', type: 'building', icon: Building2, coords: [-16.675500, -49.240500] },
    { id: 'campus2', name: 'Câmpus 2 (Jardim Goiás)', type: 'building', icon: School, coords: [-16.697500, -49.232000] }
  ],
  'UNIP': [
    { id: 'bc', name: 'Biblioteca UNIP', type: 'biblio', icon: BookOpen, coords: [-16.718500, -49.237900] },
    { id: 'food', name: 'Cantina / Pátio Central', type: 'food', icon: Utensils, coords: [-16.719600, -49.236900] },
    { id: 'bloco', name: 'Bloco Acadêmico', type: 'building', icon: Building2, coords: [-16.719300, -49.238200] }
  ],
  'IFG': [
    { id: 'bc', name: 'Biblioteca Central IFG', type: 'biblio', icon: BookOpen, coords: [-16.671600, -49.255900] },
    { id: 'food', name: 'Cantina IFG', type: 'food', icon: Utensils, coords: [-16.671900, -49.255100] }
  ]
};

/**
 * CampusModeHUD — Painel de navegação pedestre dentro da faculdade
 */
export default function CampusModeHUD({
  facultyName = 'UFG',
  vanCoords,
  userWalkingCoords,
  isUserNearby = false,
  selectedPoi = null,
  selectedPoiId = null,
  customDestination = null,
  customDestinationDistance = null,
  routeMetrics = null,
  onClearCustomDestination,
  onExit,
  onSelectPoi,
  onToggleCompass,
  isCompassActive,
  onCenterUser
}) {
  // POIs do campus atual ou fallback para genérico da faculdade
  const pois = useMemo(() => {
    const key = Object.keys(CAMPUS_POIS).find(k => facultyName?.toUpperCase().includes(k));
    if (key && CAMPUS_POIS[key]) return CAMPUS_POIS[key];

    return [
      { id: 'campus', name: `${facultyName} (Campus Principal)`, type: 'building', icon: School, coords: vanCoords }
    ];
  }, [facultyName, vanCoords]);

  // Cálculo de distância pedestre em linha reta até o ponto da van (apenas se estiver próximo ao campus)
  const distanceInfo = useMemo(() => {
    if (!isUserNearby || !userWalkingCoords || !vanCoords) return null;
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
  }, [isUserNearby, userWalkingCoords, vanCoords]);

  return (
    <div className="absolute top-2 left-2 right-2 z-[1500] flex flex-col gap-2 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      {/* Barra de Topo do Modo Campus */}
      <div className="bg-surface-elevated/95 backdrop-blur-md border border-orange-500/30 rounded-2xl p-3 shadow-xl flex items-center justify-between pointer-events-auto transition-all">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-black flex items-center justify-center shrink-0 shadow-md">
            <Footprints size={18} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black text-heading tracking-wide truncate leading-tight" title={facultyName}>
              {facultyName}
            </h3>

            <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${
                isUserNearby
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                {isUserNearby ? 'No Campus' : 'Exploração'}
              </span>

              {selectedPoi ? (
                <p className="text-[11px] text-caption truncate min-w-0">
                  <strong className="text-heading font-semibold">{selectedPoi.name}</strong>:{' '}
                  {routeMetrics?.distanceMeters != null ? (
                    <span className="text-orange-400 font-bold">
                      {routeMetrics.distanceMeters < 1000 ? `${routeMetrics.distanceMeters}m` : `${(routeMetrics.distanceMeters / 1000).toFixed(1)}km`}
                      {routeMetrics.durationMinutes ? ` (~${routeMetrics.durationMinutes} min a pé)` : ''}
                    </span>
                  ) : (
                    <span className="text-orange-400 font-semibold">Traçando trajeto a pé...</span>
                  )}
                </p>
              ) : isUserNearby && distanceInfo ? (
                <p className="text-[11px] text-caption truncate min-w-0">
                  Ponto da Van: <strong className="text-orange-400 font-bold">{distanceInfo.meters}m</strong> (~{distanceInfo.minutes} min a pé)
                </p>
              ) : (
                <p className="text-[11px] text-caption truncate min-w-0">
                  Toque em um prédio ou segure no mapa
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isUserNearby && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onCenterUser?.();
              }}
              className="p-2 rounded-xl bg-subtle hover-bg-subtle text-caption hover:text-heading border border-subtle transition-all cursor-pointer"
              title="Centralizar no meu passo"
            >
              <Navigation2 size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onToggleCompass?.();
            }}
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
            onClick={() => {
              playToggleSound(false);
              onExit?.();
            }}
            className="p-2 rounded-xl bg-subtle hover:bg-danger/20 text-caption hover:text-danger border border-subtle transition-all cursor-pointer"
            title="Sair do Modo Campus"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Destino Personalizado (Clique e Segura no Mapa) */}
      {customDestination && (
        <div className="bg-surface-elevated/95 border border-orange-500/40 rounded-2xl px-3.5 py-2 shadow-lg backdrop-blur-md flex items-center justify-between pointer-events-auto animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              <Crosshair size={14} />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-xs font-bold text-heading truncate">Destino no Mapa</span>
              {customDestinationDistance && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-black shrink-0 shadow-sm">
                  {customDestinationDistance}
                  {routeMetrics?.durationMinutes ? ` • ~${routeMetrics.durationMinutes} min` : ''}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClearCustomDestination?.();
            }}
            className="p-1 rounded-lg text-caption hover:text-heading hover:bg-subtle transition-colors cursor-pointer"
            title="Remover destino"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Carrossel Horizontal de Atalhos dos Prédios/POIs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto select-none">
        {pois.map((poi) => {
          const IconComponent = poi.icon || MapPin;
          const isSelected = selectedPoiId === poi.id;
          return (
            <button
              key={poi.id}
              type="button"
              onClick={() => {
                playTapSound();
                onSelectPoi?.(poi);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-semibold shrink-0 shadow-md transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-black border-2 border-white shadow-orange-500/30 font-bold'
                  : 'bg-surface-elevated/90 border border-subtle hover:border-orange-500/40 text-heading hover:text-orange-400'
              }`}
            >
              <IconComponent size={13} className={isSelected ? 'text-black' : 'text-orange-400'} />
              <span className="truncate max-w-[170px]">{poi.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
