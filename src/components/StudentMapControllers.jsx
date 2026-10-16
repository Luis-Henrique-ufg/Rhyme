/**
 * @file StudentMapControllers.jsx
 * @module components/StudentMapControllers
 * @description Controladores, adaptadores de evento e listeners integrados ao Leaflet
 * para navegação, recentralização, seleção de ponto e long-press no mapa.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMap, useMapEvents } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import L from 'leaflet';

export const MapBridge = ({ onReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map && onReady) onReady(map);
  }, [map, onReady]);
  return null;
};

export const RecenterButton = ({ lat, lng, isBroadcasting }) => {
  const map = useMap();
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('navbar-recenter-slot');
      setPortalTarget((current) => (current === el ? current : el));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleRecenter = (e) => {
    e.stopPropagation();
    if (isBroadcasting && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 1.2 });
          } else if (lat && lng) {
            map.flyTo([lat, lng], 16, { duration: 1.2 });
          }
        },
        () => {
          if (lat && lng) map.flyTo([lat, lng], 16, { duration: 1.2 });
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 1000 }
      );
      return;
    }

    if (lat && lng) {
      map.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  };

  const content = (
    <button
      onClick={handleRecenter}
      className="w-full min-w-0 flex flex-col items-center justify-center text-body hover:text-primary transition-colors cursor-pointer"
      title="Centralizar"
    >
      <div className="p-1.5 sm:p-2">
        <LocateFixed size={22} strokeWidth={2.5} />
      </div>
      <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
        Focar
      </span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
};

export const LocationPickerMode = ({ isEditing, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      if (isEditing) {
        onLocationSelected(e.latlng);
      }
    },
  });
  return null;
};

export const MapInteractionListener = ({ onInteract }) => {
  useMapEvents({
    click() {
      onInteract();
    },
    dragstart() {
      onInteract();
    },
  });
  return null;
};

export const MapFlyTo = ({ target, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (trigger && target?.lat && target?.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
    }
  }, [trigger, target, map]);
  return null;
};

/**
 * Listener de clique e segura (long-press) no Modo Campus
 * Permite que o aluno toque e segure por 500ms em qualquer ponto para traçar rota
 */
export const CampusLongPressHandler = ({ isCampusModeActive, onLongPress }) => {
  const map = useMap();

  useEffect(() => {
    if (!isCampusModeActive) return;

    let timer = null;
    let startPoint = null;
    const container = map.getContainer();

    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      startPoint = null;
    };

    // --- Touch (Mobile) ---
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) {
        clear();
        return;
      }
      const touch = e.touches[0];
      startPoint = { x: touch.clientX, y: touch.clientY };

      timer = setTimeout(() => {
        if (!startPoint) return;
        const rect = container.getBoundingClientRect();
        const pt = L.point(startPoint.x - rect.left, startPoint.y - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        clear();
        onLongPress(latlng);
      }, 500);
    };

    const handleTouchMove = (e) => {
      if (!startPoint || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - startPoint.x, touch.clientY - startPoint.y);
      if (dist > 12) {
        clear();
      }
    };

    const handleTouchEnd = () => {
      clear();
    };

    // --- Mouse (Desktop) ---
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      startPoint = { x: e.clientX, y: e.clientY };

      timer = setTimeout(() => {
        if (!startPoint) return;
        const rect = container.getBoundingClientRect();
        const pt = L.point(startPoint.x - rect.left, startPoint.y - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        clear();
        onLongPress(latlng);
      }, 500);
    };

    const handleMouseMove = (e) => {
      if (!startPoint) return;
      const dist = Math.hypot(e.clientX - startPoint.x, e.clientY - startPoint.y);
      if (dist > 12) {
        clear();
      }
    };

    const handleMouseUp = () => {
      clear();
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      clear();
      const rect = container.getBoundingClientRect();
      const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
      const latlng = map.containerPointToLatLng(pt);
      onLongPress(latlng);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clear();
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);

      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isCampusModeActive, map, onLongPress]);

  return null;
};

export const ZoomTracker = ({ onZoomChange }) => {
  useMapEvents({ zoomend: (e) => onZoomChange(e.target.getZoom()) });
  return null;
};
