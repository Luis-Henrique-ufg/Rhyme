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

/**
 * Obtém o ângulo de rotação da tela em graus (0, 90, 180, 270)
 */
function getScreenOrientationAngle() {
  if (window.screen?.orientation?.angle !== undefined) {
    return window.screen.orientation.angle;
  }
  if (typeof window.orientation === 'number') {
    return (window.orientation + 360) % 360;
  }
  return 0;
}

export default function MapInteractions() {
  const map = useMap();
  const [compassMode, setCompassMode] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  const targetBearingRef = useRef(0);
  const currentBearingRef = useRef(0);
  const smoothedSinRef = useRef(0);
  const smoothedCosRef = useRef(1);
  const hasInitialReadingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const isCompassActiveRef = useRef(false);
  const activeListenerEventRef = useRef(null);

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

  // Loop de animação a 60fps com amortecimento inercial e deadband anti-tremedeira
  const startStabilizationLoop = () => {
    if (animationFrameRef.current) return;

    const loop = () => {
      if (!isCompassActiveRef.current || !map || typeof map.setBearing !== 'function') {
        animationFrameRef.current = null;
        return;
      }

      const current = currentBearingRef.current;
      const target = targetBearingRef.current;
      const diff = shortestAngleDiff(target, current);

      // Deadband: se a diferença for ruído residual (< 0.8°), não re-renderiza o DOM
      // Isso elimina 100% dos microtremores do sensor magnético das mãos
      if (Math.abs(diff) > 0.8) {
        // Interpolação suave (0.12): sem atraso perceptível e sem trepidação
        currentBearingRef.current = (current + diff * 0.12 + 360) % 360;
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
    if (!isCompassActiveRef.current) return;

    let heading = null;
    const screenAngle = getScreenOrientationAngle();

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      // iOS Safari: webkitCompassHeading é graus no sentido horário a partir do Norte (0-360)
      heading = e.webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      // Android: alpha na especificação W3C gira no sentido anti-horário
      // Azimute horário real a partir do Norte = (360 - alpha) % 360
      heading = (360 - e.alpha) % 360;
    }

    if (heading === null || isNaN(heading)) return;

    // Para o Leaflet com leaflet-rotate alinhar o mapa 'heads-up' (frente para cima):
    // O mapa deve girar de acordo com o azimute do usuário compensado pela rotação da tela
    const calculatedBearing = (heading + screenAngle + 360) % 360;

    if (calculatedBearing === null || isNaN(calculatedBearing)) return;

    // Filtro Passa-Baixa Vetorial (Seno / Cosseno)
    // Elimina a descontinuidade em 359° <-> 0° e suaviza ruídos do magnetômetro
    const rad = calculatedBearing * (Math.PI / 180);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);

    if (!hasInitialReadingRef.current) {
      smoothedSinRef.current = sin;
      smoothedCosRef.current = cos;
      hasInitialReadingRef.current = true;
      targetBearingRef.current = calculatedBearing;
      currentBearingRef.current = calculatedBearing;
      if (map && typeof map.setBearing === 'function') {
        map.setBearing(calculatedBearing);
      }
    } else {
      // Peso do filtro: 0.20 suaviza as leituras do sensor antes de ir para o frame loop
      const filterWeight = 0.20;
      smoothedSinRef.current += (sin - smoothedSinRef.current) * filterWeight;
      smoothedCosRef.current += (cos - smoothedCosRef.current) * filterWeight;

      let filteredAngle = Math.atan2(smoothedSinRef.current, smoothedCosRef.current) * (180 / Math.PI);
      if (filteredAngle < 0) filteredAngle += 360;
      targetBearingRef.current = filteredAngle;
    }
  };

  const enableCompass = async () => {
    if (!map || typeof map.setBearing !== 'function') {
      alert("Bússola não suportada neste dispositivo/navegador.");
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

    hasInitialReadingRef.current = false;
    currentBearingRef.current = map.getBearing ? map.getBearing() : 0;
    targetBearingRef.current = currentBearingRef.current;
    isCompassActiveRef.current = true;
    setCompassMode(true);

    // IMPORTANTE: Registrar APENAS UM listener!
    // No Android, escutar 'deviceorientationabsolute' e 'deviceorientation' simultaneamente
    // causa conflito de leituras 60 vezes por segundo, fazendo a bússola tremer descontroladamente.
    const eventName = ('ondeviceorientationabsolute' in window)
      ? 'deviceorientationabsolute'
      : 'deviceorientation';

    activeListenerEventRef.current = eventName;
    window.addEventListener(eventName, handleOrientation, true);
    startStabilizationLoop();
  };

  const disableCompass = () => {
    isCompassActiveRef.current = false;
    setCompassMode(false);
    stopStabilizationLoop();
    hasInitialReadingRef.current = false;

    if (activeListenerEventRef.current) {
      window.removeEventListener(activeListenerEventRef.current, handleOrientation, true);
      activeListenerEventRef.current = null;
    }
    // Remove ambos por garantia caso algum tenha ficado pendente
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
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentDiff = shortestAngleDiff(0, startBearing);
        map.setBearing((startBearing + currentDiff * ease + 360) % 360);

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
      className={`w-full min-w-0 flex flex-col items-center justify-center transition-all cursor-pointer ${
        compassMode 
          ? 'text-orange-500 font-bold scale-105' 
          : 'text-body hover:text-primary'
      }`}
      title={compassMode ? "Desativar Bússola (Alinhar ao Norte)" : "Ativar Bússola Estabilizada"}
    >
      <div className="p-1.5 sm:p-2 relative">
        <Compass size={22} className={compassMode ? "animate-pulse" : ""} />
        {compassMode && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]"></span>
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
        {compassMode ? 'Bússola ON' : 'Bússola'}
      </span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
}
