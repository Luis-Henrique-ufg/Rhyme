import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Compass } from 'lucide-react';
import ReactDOM from 'react-dom';

/**
 * Calcula a menor diferença angular entre dois ângulos (-180° a +180°)
 * Evita o 'giro completo' na transição 359° <-> 0°
 */
function shortestAngleDiff(target, current) {
  return ((((target - current) % 360) + 540) % 360) - 180;
}

export default function MapInteractions() {
  const map = useMap();
  const [compassMode, setCompassMode] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  const targetHeadingRef = useRef(0);
  const currentBearingRef = useRef(0);
  const animationFrameRef = useRef(null);
  const isCompassActiveRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('navbar-compass-slot');
      setPortalTarget(current => current === el ? current : el);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Performance: ocultar paths pesados durante rotações rápidas
  useEffect(() => {
    if (!map) return;

    const hide = () => map.getContainer()?.classList.add('hide-paths');
    const show = () => map.getContainer()?.classList.remove('hide-paths');

    map.on('movestart zoomstart dragstart rotatestart', hide);
    map.on('moveend zoomend dragend rotateend', show);

    return () => {
      map.off('movestart zoomstart dragstart rotatestart', hide);
      map.off('moveend zoomend dragend rotateend', show);
    };
  }, [map]);

  // Loop de animação estabilizado a 60fps com amortecimento inercial (Low-Pass Filter)
  const startStabilizationLoop = () => {
    if (animationFrameRef.current) return;

    const loop = () => {
      if (!isCompassActiveRef.current || !map || typeof map.setBearing !== 'function') {
        animationFrameRef.current = null;
        return;
      }

      const diff = shortestAngleDiff(targetHeadingRef.current, currentBearingRef.current);

      // Deadband: se a diferença for insignificante (< 0.2°), não força redesenho no DOM
      if (Math.abs(diff) > 0.2) {
        // Fator de suavização (0.14 = ultra-suave, sem tremores de mão e sem lag)
        currentBearingRef.current += diff * 0.14;
        map.setBearing(currentBearingRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const stopStabilizationLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleOrientation = (e) => {
    let heading = null;

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      // iOS: heading magnético verdadeiro direto em graus (0-360)
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      // Android / Padrão: alpha com compensação de orientação de tela
      const screenAngle = (window.screen?.orientation?.angle) || (window.orientation) || 0;
      heading = (360 - e.alpha - screenAngle + 360) % 360;
    }

    if (heading !== null && !isNaN(heading)) {
      targetHeadingRef.current = heading;
    }
  };

  const enableCompass = async () => {
    if (!map || typeof map.setBearing !== 'function') {
      alert("Bússola não suportada neste dispositivo/navegador (map.setBearing is undefined).");
      return;
    }

    // Suporte a permissão de sensores no iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          alert('Permissão de orientação do dispositivo negada.');
          return;
        }
      } catch (err) {
        console.error('Erro ao solicitar permissão de orientação:', err);
        alert('Erro ao solicitar bússola (precisa de HTTPS e clique do usuário).');
        return;
      }
    }

    // Desativa o handler padrão não filtrado do leaflet-rotate se existente
    if (map.compassBearing) {
      map.compassBearing.disable();
    }

    currentBearingRef.current = map.getBearing ? map.getBearing() : 0;
    targetHeadingRef.current = currentBearingRef.current;
    isCompassActiveRef.current = true;
    setCompassMode(true);

    // Escuta os dois eventos para cobrir Androids modernos e antigos/iOS
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    startStabilizationLoop();
  };

  const disableCompass = () => {
    isCompassActiveRef.current = false;
    setCompassMode(false);
    stopStabilizationLoop();
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);

    // Retorno suave com animação inercial para o Norte (0°)
    if (map && typeof map.setBearing === 'function') {
      const startBearing = map.getBearing() || 0;
      const startTime = performance.now();
      const duration = 350; // ms

      const resetLoop = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Easing ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentDiff = shortestAngleDiff(0, startBearing);
        map.setBearing(startBearing + currentDiff * ease);

        if (progress < 1) {
          requestAnimationFrame(resetLoop);
        } else {
          map.setBearing(0);
        }
      };

      requestAnimationFrame(resetLoop);
    }
  };

  const toggleCompass = () => {
    if (compassMode) {
      disableCompass();
    } else {
      enableCompass();
    }
  };

  useEffect(() => {
    return () => {
      disableCompass();
    };
  }, []);

  const content = (
    <button 
      onClick={toggleCompass}
      className={`flex flex-col items-center justify-center transition-colors ${
        compassMode ? 'text-orange-500' : 'text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500'
      }`}
      title="Bússola Estabilizada"
    >
      <div className="p-2">
        <Compass size={24} />
      </div>
      <span className="text-[11px] font-medium mt-0.5">Bússola</span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
}
