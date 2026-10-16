/**
 * @file useStudentLocation.js
 * @module hooks/useStudentLocation
 * @description Hook customizado para monitoramento em tempo real do GPS do aluno como pedestre
 * no campus universitário.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export function useStudentLocation() {
  const [userWalkingCoords, setUserWalkingCoords] = useState(null);
  const walkingWatchIdRef = useRef(null);

  const startCampusWalkingWatch = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // 1. Obter posição GPS imediatamente com alta precisão sem depender do delay do watchPosition
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
            setUserWalkingCoords([pos.coords.latitude, pos.coords.longitude]);
          }
        },
        (err) => console.warn('Aviso GPS imediato:', err?.message || err),
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
      );

      // 2. Acompanhar em tempo real conforme o usuário caminha
      if (walkingWatchIdRef.current) {
        navigator.geolocation.clearWatch(walkingWatchIdRef.current);
      }
      walkingWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
            setUserWalkingCoords([pos.coords.latitude, pos.coords.longitude]);
          }
        },
        (err) => console.warn('Aviso GPS contínuo pedestre:', err?.message || err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  }, []);

  const stopCampusWalkingWatch = useCallback(() => {
    if (walkingWatchIdRef.current && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(walkingWatchIdRef.current);
      walkingWatchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (walkingWatchIdRef.current && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(walkingWatchIdRef.current);
      }
    };
  }, []);

  return {
    userWalkingCoords,
    setUserWalkingCoords,
    startCampusWalkingWatch,
    stopCampusWalkingWatch,
  };
}
