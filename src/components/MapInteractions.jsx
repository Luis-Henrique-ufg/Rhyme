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

/**
 * Calcula a direção da bússola com compensação de inclinação (tilt compensation)
 * usando a fórmula da matriz de rotação do W3C (ZXY order).
 * 
 * Esta abordagem é matematicamente superior ao uso simples de `alpha` porque:
 * - A variável `alpha` no W3C indica rotação no eixo Z (vertical), que é afetada
 *   pela inclinação do dispositivo (beta/gamma).
 * - A rotação de matriz ZXY decompõe corretamente a orientação e extrai o azimute
 *   real independente do tilt, evitando erros de direção quando o celular não está
 *   perfeitamente plano (situação 100% da prática).
 * 
 * @param {number} alpha - Rotação Z (0-360°)
 * @param {number} beta  - Inclinação frontal/traseira X (-180° a 180°)
 * @param {number} gamma - Inclinação lateral Y (-90° a 90°)
 * @returns {number} Azimute em graus [0, 360)
 */
function computeTiltCompensatedHeading(alpha, beta, gamma) {
  const toRad = Math.PI / 180;
  const aR = alpha * toRad;
  const bR = beta  * toRad;
  const gR = gamma * toRad;

  const cA = Math.cos(aR);
  const sA = Math.sin(aR);
  const cB = Math.cos(bR);
  const sB = Math.sin(bR);
  const cG = Math.cos(gR);
  const sG = Math.sin(gR);

  // Componentes da matriz de rotação no plano horizontal (ZXY)
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;

  // Azimute real via atan2 para evitar ambiguidade
  let heading = Math.atan2(rA, rB) * (180 / Math.PI);
  if (heading < 0) heading += 360;

  // Compensa rotação física da tela (retrato → paisagem etc.)
  const screenAngle = getScreenOrientationAngle();
  heading = (heading + screenAngle + 360) % 360;

  return heading;
}

export default function MapInteractions() {
  const map = useMap();
  const [compassMode, setCompassMode] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  const targetBearingRef      = useRef(0);
  const currentBearingRef     = useRef(0);
  const smoothedSinRef        = useRef(0);
  const smoothedCosRef        = useRef(1);
  const hasInitialReadingRef  = useRef(false);
  const animationFrameRef     = useRef(null);
  const isCompassActiveRef    = useRef(false);
  const activeListenerRef     = useRef(null);   // { eventName, fn }

  // Portal para o slot da navbar
  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('navbar-compass-slot');
      setPortalTarget(current => current === el ? current : el);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Esconde paths pesados durante rotações para manter 60fps
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

  // ─── Loop de animação (interpolação suave a 60fps) ───
  const startStabilizationLoop = () => {
    if (animationFrameRef.current) return;
    const loop = () => {
      if (!isCompassActiveRef.current || !map || typeof map.setBearing !== 'function') {
        animationFrameRef.current = null;
        return;
      }
      const diff = shortestAngleDiff(targetBearingRef.current, currentBearingRef.current);
      // Deadband de 0.5° — elimina microtremores do magnetômetro sem atraso visível
      if (Math.abs(diff) > 0.5) {
        currentBearingRef.current = (currentBearingRef.current + diff * 0.15 + 360) % 360;
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

  // ─── Handler do evento de orientação ───
  const handleOrientation = (e) => {
    if (!isCompassActiveRef.current) return;

    let heading = null;

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
      // iOS Safari: nativo e já tilt-compensado pelo sistema operacional
      heading = e.webkitCompassHeading;
      // No iOS, webkitCompassHeading já é azimute absoluto relativo ao Norte magnético.
      // Apenas compensa a rotação de tela se necessário.
      const screenAngle = getScreenOrientationAngle();
      heading = (heading + screenAngle + 360) % 360;
    } else if (
      e.alpha !== null && e.alpha !== undefined &&
      e.beta  !== null && e.beta  !== undefined &&
      e.gamma !== null && e.gamma !== undefined
    ) {
      // Android (Chrome/Firefox): usa fórmula de matriz de rotação W3C
      // com compensação de inclinação completa via beta e gamma.
      // O evento 'deviceorientationabsolute' garante referência ao Norte magnético.
      heading = computeTiltCompensatedHeading(e.alpha, e.beta, e.gamma);
    }

    if (heading === null || isNaN(heading)) return;

    // ─── Filtro passa-baixa vetorial ───
    // Opera sobre seno/cosseno para eliminar a descontinuidade 359°↔0°
    // e suavizar ruídos de alta frequência do magnetômetro.
    const rad = heading * (Math.PI / 180);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);

    if (!hasInitialReadingRef.current) {
      smoothedSinRef.current = sin;
      smoothedCosRef.current = cos;
      hasInitialReadingRef.current = true;
      targetBearingRef.current  = heading;
      currentBearingRef.current = heading;
      if (map && typeof map.setBearing === 'function') {
        map.setBearing(heading);
      }
    } else {
      // Peso 0.25: responsivo sem jitter. Aumentar → mais rápido mas mais errático.
      const w = 0.25;
      smoothedSinRef.current += (sin - smoothedSinRef.current) * w;
      smoothedCosRef.current += (cos - smoothedCosRef.current) * w;

      let filtered = Math.atan2(smoothedSinRef.current, smoothedCosRef.current) * (180 / Math.PI);
      if (filtered < 0) filtered += 360;
      targetBearingRef.current = filtered;
    }
  };

  // ─── Habilitar bússola ───
  const enableCompass = async () => {
    if (!map || typeof map.setBearing !== 'function') {
      alert('Bússola não suportada neste dispositivo/navegador.');
      return;
    }

    // iOS 13+: solicita permissão de sensores via gesto do usuário
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
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

    // Desativa plugin nativo do leaflet-rotate para evitar conflito
    if (map.compassBearing) {
      map.compassBearing.disable();
    }

    hasInitialReadingRef.current  = false;
    currentBearingRef.current     = map.getBearing ? map.getBearing() : 0;
    targetBearingRef.current      = currentBearingRef.current;
    isCompassActiveRef.current    = true;
    setCompassMode(true);

    // Usa 'deviceorientationabsolute' quando disponível (Android Chrome/Firefox ≥ 66).
    // É garantido que o 'alpha' seja relativo ao Norte magnético, eliminando a necessidade
    // de calibração manual. Cai para 'deviceorientation' como fallback (iOS).
    const eventName = ('ondeviceorientationabsolute' in window)
      ? 'deviceorientationabsolute'
      : 'deviceorientation';

    const fn = handleOrientation;
    activeListenerRef.current = { eventName, fn };
    window.addEventListener(eventName, fn, { passive: true });
    startStabilizationLoop();
  };

  // ─── Desabilitar bússola ───
  const disableCompass = () => {
    isCompassActiveRef.current = false;
    setCompassMode(false);
    stopStabilizationLoop();
    hasInitialReadingRef.current = false;

    if (activeListenerRef.current) {
      window.removeEventListener(activeListenerRef.current.eventName, activeListenerRef.current.fn, { passive: true });
      activeListenerRef.current = null;
    }
    // Garantia de limpeza
    window.removeEventListener('deviceorientationabsolute', handleOrientation, { passive: true });
    window.removeEventListener('deviceorientation', handleOrientation, { passive: true });

    // Animação de retorno suave ao Norte (0°)
    if (map && typeof map.setBearing === 'function') {
      const startBearing = map.getBearing() || 0;
      const startTime = performance.now();
      const duration = 400;
      const resetLoop = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const diff = shortestAngleDiff(0, startBearing);
        map.setBearing((startBearing + diff * ease + 360) % 360);
        if (progress < 1) requestAnimationFrame(resetLoop);
        else map.setBearing(0);
      };
      requestAnimationFrame(resetLoop);
    }
  };

  const toggleCompass = () => {
    if (compassMode) disableCompass();
    else enableCompass();
  };

  useEffect(() => {
    return () => { disableCompass(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
    <button
      onClick={toggleCompass}
      className={`w-full min-w-0 flex flex-col items-center justify-center transition-all cursor-pointer ${
        compassMode
          ? 'text-orange-500 font-bold scale-105'
          : 'text-body hover:text-primary'
      }`}
      title={compassMode ? 'Desativar Bússola (Alinhar ao Norte)' : 'Ativar Bússola'}
    >
      <div className="p-1.5 sm:p-2 relative">
        <Compass size={22} className={compassMode ? 'animate-pulse' : ''} />
        {compassMode && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]" />
        )}
      </div>
      <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
        {compassMode ? 'Bússola ON' : 'Bússola'}
      </span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
}
