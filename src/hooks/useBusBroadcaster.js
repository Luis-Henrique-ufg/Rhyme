/**
 * @file useBusBroadcaster.js
 * @module hooks/useBusBroadcaster
 * @description Hook customizado para gerenciar a transmissão colaborativa da localização da van
 * por alunos a bordo quando o motorista não estiver transmitindo (RF05).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  broadcastBusLocationByStudent,
  pauseBusBroadcastByStudent,
} from '../services/studentService';

/**
 * @typedef {Object} UseBusBroadcasterParams
 * @property {Object|null} trip - Objeto da viagem atual
 * @property {string|null} [tripId] - ID da viagem alternativa
 * @property {Object|null} user - Usuário autenticado
 * @property {Object|null} student - Perfil do aluno
 * @property {Object|null} attendance - Registro de presença do aluno
 * @property {string} gpsState - Estado do GPS do motorista ('live'|'stale'|'offline')
 * @property {Function} showAlert - Função para exibição de toasts/alertas
 * @property {Function} [setFocusTrigger] - Dispara recentralização da câmera no mapa
 */

export function useBusBroadcaster({
  trip,
  tripId,
  user,
  student,
  attendance,
  gpsState,
  showAlert,
  setFocusTrigger,
}) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastingLocation, setBroadcastingLocation] = useState(null);

  const watchIdRef = useRef(null);
  const fallbackIntervalRef = useRef(null);

  // Efeito de transmissão de GPS da Van pelo aluno
  useEffect(() => {
    if (isBroadcasting && user?.uid) {
      const sendLocation = async (position) => {
        const { latitude, longitude } = position.coords;
        setBroadcastingLocation({ lat: latitude, lng: longitude });

        const targetTripId = tripId || trip?.id;
        if (targetTripId) {
          try {
            await broadcastBusLocationByStudent(
              targetTripId,
              { lat: latitude, lng: longitude },
              student?.name,
              user.uid
            );
          } catch (e) {
            console.error('Erro ao enviar GPS como aluno:', e);
          }
        }
      };

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        // Chamada imediata para primeira captura precisa
        navigator.geolocation.getCurrentPosition(
          sendLocation,
          (err) => {
            console.warn('GPS inicial:', err);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 1000,
          }
        );

        // Observador contínuo em tempo real (dispara a cada movimento do veículo)
        watchIdRef.current = navigator.geolocation.watchPosition(
          sendLocation,
          (err) => {
            console.error('watchPosition erro:', err);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000,
          }
        );

        // Polling de garantia
        fallbackIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(sendLocation, () => {}, {
            enableHighAccuracy: true,
            maximumAge: 5000,
          });
        }, 6000);
      } else {
        showAlert?.('Geolocalização não disponível no dispositivo.');
      }

      return () => {
        if (watchIdRef.current && typeof navigator !== 'undefined') {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      };
    } else if (!isBroadcasting) {
      setBroadcastingLocation(null);
    }
  }, [
    isBroadcasting,
    trip?.id,
    tripId,
    user?.uid,
    student?.name,
    attendance?.lat,
    attendance?.lng,
    showAlert,
  ]);

  const stopBroadcasting = useCallback(async () => {
    setIsBroadcasting(false);
    setBroadcastingLocation(null);
    if (watchIdRef.current && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    const targetTripId = tripId || trip?.id;
    if (targetTripId && (trip?.locationProviderId === user?.uid || !trip?.locationProviderId)) {
      try {
        await pauseBusBroadcastByStudent(targetTripId);
      } catch (e) {
        console.warn('Falha ao marcar GPS como pausado:', e);
      }
    }
    showAlert?.('Transmissão da Van pausada.');
  }, [tripId, trip?.id, trip?.locationProviderId, user?.uid, showAlert]);

  const startBroadcasting = useCallback(() => {
    if (!user?.uid || !trip?.id) return;

    setIsBroadcasting(true);
    showAlert?.(
      'Transmissão da Van ativada! O ícone da Van agora segue sua posição em tempo real.'
    );

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
            setBroadcastingLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            if (setFocusTrigger) setFocusTrigger((prev) => prev + 1);
          }
        },
        (err) => console.warn('GPS inicial no startBroadcasting:', err),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 1000 }
      );
    }
  }, [user?.uid, trip?.id, showAlert, setFocusTrigger]);

  const handleToggleBroadcasting = useCallback(() => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      startBroadcasting();
    }
  }, [isBroadcasting, stopBroadcasting, startBroadcasting]);

  // Desativa automaticamente a transmissão do aluno caso o motorista assuma o GPS
  useEffect(() => {
    if (
      isBroadcasting &&
      trip?.locationProviderRole === 'driver' &&
      (gpsState === 'live' || gpsState === 'stale')
    ) {
      stopBroadcasting();
      showAlert?.('O motorista iniciou a transmissão do GPS. A sua transmissão foi desativada.');
    }
  }, [trip?.locationProviderRole, gpsState, isBroadcasting, stopBroadcasting, showAlert]);

  return {
    isBroadcasting,
    broadcastingLocation,
    startBroadcasting,
    stopBroadcasting,
    handleToggleBroadcasting,
  };
}
