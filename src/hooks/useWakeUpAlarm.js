/**
 * @file useWakeUpAlarm.js
 * @module hooks/useWakeUpAlarm
 * @description Hook customizado para gerenciar o despertador de proximidade do aluno ("Acorda Aluno"),
 * persistência de preferências de parada e notificações ao se aproximar do ponto de descida.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useState, useEffect, useCallback } from 'react';
import { getDistanceFromLatLonInKm } from '../services/geoService';
import { updateStudentDropOffLocation } from '../services/studentService';

export function useWakeUpAlarm({
  student,
  attendance,
  trip,
  isBroadcasting,
  broadcastingLocation,
  user,
  showAlert,
}) {
  const [wakeUpSettings, setWakeUpSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rhyme_wakeup_settings');
      return saved ? JSON.parse(saved) : { enabled: true, distance: 1000, stopLocation: null };
    } catch {
      return { enabled: true, distance: 1000, stopLocation: null };
    }
  });

  const [isWakeUpSettingsOpen, setIsWakeUpSettingsOpen] = useState(false);
  const [isWakeUpAlarmModalOpen, setIsWakeUpAlarmModalOpen] = useState(false);
  const [wakeUpAlarmTriggered, setWakeUpAlarmTriggered] = useState(false);
  const [currentDistanceToStop, setCurrentDistanceToStop] = useState(0);
  const [isSettingDropOffLocation, setIsSettingDropOffLocation] = useState(false);

  // Sincroniza parada do perfil do aluno
  useEffect(() => {
    if (student) {
      setWakeUpSettings((prev) => {
        if (student.dropOffLocation) {
          return { ...prev, stopLocation: student.dropOffLocation };
        }
        if (!prev.stopLocation && attendance?.lat && attendance?.lng) {
          return { ...prev, stopLocation: { lat: attendance.lat, lng: attendance.lng } };
        }
        return prev;
      });
    }
  }, [student, attendance?.lat, attendance?.lng]);

  // Monitoramento de proximidade em tempo real da Van até o ponto de descida
  useEffect(() => {
    if (!wakeUpSettings?.enabled || wakeUpAlarmTriggered) return;
    const target = wakeUpSettings?.stopLocation;
    if (!target?.lat || !target?.lng) return;

    const busLoc = trip?.busLocation || (isBroadcasting ? broadcastingLocation : null);
    if (!busLoc?.lat || !busLoc?.lng) return;

    const distKm = getDistanceFromLatLonInKm(busLoc.lat, busLoc.lng, target.lat, target.lng);
    const distMeters = Math.round(distKm * 1000);
    setCurrentDistanceToStop(distMeters);

    if (distMeters > 0 && distMeters <= wakeUpSettings.distance) {
      setWakeUpAlarmTriggered(true);
      setIsWakeUpAlarmModalOpen(true);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('🚨 ACORDA! SUA PARADA ESTÁ PRÓXIMA!', {
            body: `A Van está a aproximadamente ${distMeters}m do seu ponto de descida!`,
            icon: '/android-chrome-192x192.png',
            tag: 'wakeup-alarm',
            requireInteraction: true,
          });
        } catch (e) {
          console.warn('Erro ao disparar notificação do alarme:', e);
        }
      }
    }
  }, [
    trip?.busLocation,
    broadcastingLocation,
    isBroadcasting,
    wakeUpSettings?.enabled,
    wakeUpSettings?.distance,
    wakeUpSettings?.stopLocation,
    wakeUpAlarmTriggered,
  ]);

  const handleSaveWakeUpSettings = useCallback(
    (newSettings) => {
      setWakeUpSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem('rhyme_wakeup_settings', JSON.stringify(updated));
        return updated;
      });
      setWakeUpAlarmTriggered(false);
      showAlert?.('Configurações do despertador salvas!');
    },
    [showAlert]
  );

  const handleSetStopLocation = useCallback(
    async (coords) => {
      const lat = coords?.lat ?? coords?.[0];
      const lng = coords?.lng ?? coords?.[1];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const stopObj = { lat, lng };
      setWakeUpSettings((prev) => {
        const updated = { ...prev, stopLocation: stopObj, enabled: true };
        localStorage.setItem('rhyme_wakeup_settings', JSON.stringify(updated));
        return updated;
      });
      setWakeUpAlarmTriggered(false);

      if (user?.uid) {
        updateStudentDropOffLocation(user.uid, stopObj).catch((e) =>
          console.warn('Erro ao persistir dropOffLocation:', e)
        );
      }
      showAlert?.('Ponto de descida atualizado com sucesso!');
    },
    [user?.uid, showAlert]
  );

  return {
    wakeUpSettings,
    setWakeUpSettings,
    isWakeUpSettingsOpen,
    setIsWakeUpSettingsOpen,
    isWakeUpAlarmModalOpen,
    setIsWakeUpAlarmModalOpen,
    wakeUpAlarmTriggered,
    setWakeUpAlarmTriggered,
    currentDistanceToStop,
    isSettingDropOffLocation,
    setIsSettingDropOffLocation,
    handleSaveWakeUpSettings,
    handleSetStopLocation,
  };
}
