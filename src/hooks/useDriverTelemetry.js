/**
 * @file useDriverTelemetry.js
 * @module hooks/useDriverTelemetry
 * @description Hook customizado para gerenciar a telemetria GPS contínua do motorista,
 * detecção de chegada ao destino (<50m), desvio de rota (>200m) e Screen Wake Lock.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useState, useEffect, useRef } from 'react';
import { updateDriverLocation } from '../services/driverService';

export function useDriverTelemetry({
  trip,
  user,
  activeLocalRouteRef,
  setActiveLocalRoute,
  nextStopRef,
  hasArrivedAlertRef,
  setArrivedAtStudent,
  showAlert,
}) {
  const [gpsStatus, setGpsStatus] = useState('waiting');
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const isRecalculatingRef = useRef(false);

  // Screen Wake Lock: Mantém a tela ligada enquanto a rota está ativa
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && trip?.status === 'in_progress') {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error('Erro ao solicitar wake lock:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trip?.status]);

  // GPS Contínuo do motorista
  useEffect(() => {
    if (!trip?.id || trip.status !== 'in_progress') {
      setGpsStatus('waiting');
      return;
    }

    if (!navigator.geolocation) {
      showAlert?.('Seu navegador não suporta geolocalização. O rastreamento não funcionará.');
      setGpsStatus('error');
      return;
    }

    setGpsStatus('waiting');

    let watchId;
    let fallbackInterval;

    const sendLocation = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // --- Detecção automática de desvio de rota local ---
      const localRoute = activeLocalRouteRef?.current;
      if (localRoute && localRoute.length > 1) {
        // Verifica proximidade ao DESTINO (último ponto da rota) — < 50m → chegou
        const dest = localRoute[localRoute.length - 1];
        const dLatD = ((latitude - dest[0]) * Math.PI) / 180;
        const dLngD = ((longitude - dest[1]) * Math.PI) / 180;
        const aD =
          Math.sin(dLatD / 2) ** 2 +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((dest[0] * Math.PI) / 180) *
            Math.sin(dLngD / 2) ** 2;
        const distToDest = 6371000 * 2 * Math.atan2(Math.sqrt(aD), Math.sqrt(1 - aD));

        if (distToDest < 50) {
          if (activeLocalRouteRef) activeLocalRouteRef.current = null;
          if (setActiveLocalRoute) setActiveLocalRoute(null);
          if (hasArrivedAlertRef && !hasArrivedAlertRef.current) {
            hasArrivedAlertRef.current = true;
            if (setArrivedAtStudent) setArrivedAtStudent(true);
          }
        } else {
          // Desvio de rota (> 200m do traçado) → limpa e recalcula pro próximo aluno
          let minDist = Infinity;
          for (const point of localRoute) {
            const dLat = ((latitude - point[0]) * Math.PI) / 180;
            const dLng = ((longitude - point[1]) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos((latitude * Math.PI) / 180) *
                Math.cos((point[0] * Math.PI) / 180) *
                Math.sin(dLng / 2) ** 2;
            const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (dist < minDist) minDist = dist;
          }
          if (minDist > 200) {
            if (activeLocalRouteRef) activeLocalRouteRef.current = null;
            if (setActiveLocalRoute) setActiveLocalRoute(null);

            const ns = nextStopRef?.current;
            if (ns && !isRecalculatingRef.current) {
              isRecalculatingRef.current = true;
              fetch(
                `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${ns.lng},${ns.lat}?overview=full&geometries=geojson`
              )
                .then((r) => r.json())
                .then((data) => {
                  if (data.routes?.[0]) {
                    const path = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
                    if (activeLocalRouteRef) activeLocalRouteRef.current = path;
                    if (setActiveLocalRoute) setActiveLocalRoute(path);
                  }
                })
                .catch((e) => console.warn('[Rota] Falha ao recalcular após desvio:', e))
                .finally(() => {
                  isRecalculatingRef.current = false;
                });
            }
          }
        }
      }

      try {
        await updateDriverLocation(trip.id, {
          latitude,
          longitude,
          driverName: trip.driverName,
          driverUid: user?.uid,
        });
        setGpsStatus('active');
        setLastGpsUpdate(new Date());
        setGpsAccuracy(Math.round(accuracy));
      } catch (e) {
        console.error('Erro ao enviar coordenadas do GPS para o Firebase', e);
        setGpsStatus('error');
      }
    };

    const handleError = (error) => {
      console.error('Erro de GPS:', error.message);
      setGpsStatus('error');
      if (error.code === 1) {
        showAlert?.(
          'Permissão de GPS negada. Por favor, autorize nas configurações do navegador para transmitir sua localização.'
        );
      } else if (error.code === 2) {
        showAlert?.('Sinal de GPS indisponível no momento. Buscando...');
      } else if (error.code === 3) {
        // Timeout silencioso: a próxima leitura tentará novamente
      }
    };

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    };

    navigator.geolocation.getCurrentPosition(sendLocation, handleError, geoOptions);

    watchId = navigator.geolocation.watchPosition(sendLocation, handleError, geoOptions);

    fallbackInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation, handleError, {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 8000,
      });
    }, 5000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [
    trip?.id,
    trip?.status,
    trip?.driverName,
    user?.uid,
    activeLocalRouteRef,
    setActiveLocalRoute,
    nextStopRef,
    hasArrivedAlertRef,
    setArrivedAtStudent,
    showAlert,
  ]);

  return {
    gpsStatus,
    gpsAccuracy,
    lastGpsUpdate,
  };
}
