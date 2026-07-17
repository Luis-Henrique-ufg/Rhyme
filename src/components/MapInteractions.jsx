import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { Compass } from 'lucide-react';
import ReactDOM from 'react-dom';

export default function MapInteractions() {
  const map = useMap();
  const [bearing, setBearing] = useState(0);
  const [compassMode, setCompassMode] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('navbar-compass-slot');
      setPortalTarget(current => current === el ? current : el);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map) return;

    const hide = () => map.getContainer().classList.add('hide-paths');
    const show = () => map.getContainer().classList.remove('hide-paths');
    const updateBearing = () => setBearing(map.getBearing());

    map.on('movestart zoomstart dragstart rotatestart', hide);
    map.on('moveend zoomend dragend rotateend', show);
    map.on('rotate', updateBearing);

    return () => {
      map.off('movestart zoomstart dragstart rotatestart', hide);
      map.off('moveend zoomend dragend rotateend', show);
      map.off('rotate', updateBearing);
    };
  }, [map]);

  const toggleCompass = () => {
    if (!map.compassBearing) return;
    if (compassMode) {
      map.compassBearing.disable();
      setCompassMode(false);
    } else {
      map.compassBearing.enable();
      setCompassMode(true);
    }
  };

  const content = (
    <button 
      onClick={toggleCompass}
      className={`flex flex-col items-center justify-center transition-colors ${
        compassMode ? 'text-orange-500' : 'text-zinc-400 hover:text-orange-500'
      }`}
      title="Bússola"
    >
      <div className="p-2">
        <Compass size={24} />
      </div>
      <span className="text-[11px] font-medium mt-0.5">Bússola</span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
}
