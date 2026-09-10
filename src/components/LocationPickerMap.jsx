/**
 * LocationPickerMap — Modal de seleção de localização no mapa.
 */
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Ícone de pino customizado para o picker
const PickerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px; height:36px;
    background: linear-gradient(135deg, #f97316, #f59e0b);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #fff;
    box-shadow: 0 4px 14px rgba(249,115,22,0.6);
    position: relative;
  "><div style="
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%) rotate(45deg);
    width:10px; height:10px;
    background:#fff;
    border-radius:50%;
  "></div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Componente interno que captura cliques no mapa
function MapClickHandler({ onPin }) {
  useMapEvents({
    click(e) {
      onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Componente que re-centraliza o mapa suavemente
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ initialCenter, initialPin, onConfirm, onClose, title, subtitle }) {
  const { isDark } = useTheme();
  const [pin, setPin] = useState(initialPin || null);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const center = initialCenter || [-16.6869, -49.2643];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-subtle flex justify-between items-start shrink-0 bg-gradient-to-b from-primary/10 to-transparent">
          <div>
            <h2 className="text-lg font-bold text-heading flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              {title || 'Selecionar Localização'}
            </h2>
            <p className="text-xs text-caption mt-1">{subtitle || 'Toque no mapa para marcar o ponto.'}</p>
          </div>
          <button onClick={onClose} className="text-caption hover:text-heading p-1.5 rounded-full hover-bg-subtle transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Instrução */}
        <div className="px-6 py-3 bg-primary/5 border-b border-primary/15 shrink-0">
          <p className="text-xs text-primary text-center font-medium">
            {pin ? 'Pino marcado! Confirme abaixo ou toque novamente para ajustar.' : 'Toque no mapa para soltar um pino'}
          </p>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative" style={{ minHeight: '300px' }}>
          <MapContainer
            center={center}
            zoom={16}
            className="w-full h-full"
            style={{ minHeight: '300px' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url={isDark 
                ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
                : `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
              }
              attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
              key={isDark ? 'dark' : 'light'}
            />
            <MapClickHandler onPin={setPin} />
            <MapRecenter center={pin ? [pin.lat, pin.lng] : center} />
            {pin && (
              <Marker position={[pin.lat, pin.lng]} icon={PickerIcon} />
            )}
          </MapContainer>
        </div>

        {/* Ações */}
        <div className="px-6 py-5 bg-card border-t border-subtle flex gap-3 shrink-0">
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-2 text-xs font-medium text-body border border-subtle hover:border-primary/50 hover:text-primary bg-subtle hover-bg-subtle px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'Localizando...' : 'Minha loc.'}
          </button>

          <button
            onClick={() => onConfirm(null)}
            className="flex-1 text-xs font-medium text-caption hover:text-heading border border-subtle bg-subtle hover-bg-subtle px-4 py-2.5 rounded-xl transition-all"
          >
            Usar padrão
          </button>

          <button
            onClick={() => pin && onConfirm(pin)}
            disabled={!pin}
            className="flex items-center gap-2 flex-1 justify-center text-sm font-bold text-black bg-primary hover:bg-primary-hover disabled:bg-subtle disabled:text-caption px-4 py-2.5 rounded-xl transition-all"
          >
            <Check size={16} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
