/**
 * @file useNearbyStudents.js
 * @module hooks/useNearbyStudents
 * @description Hook customizado para filtrar e preparar a lista de alunos visíveis no mapa
 * excluindo o usuário ativo e o transmissor da van.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useMemo } from 'react';

/**
 * @param {Object} params
 * @param {Array} params.publicList - Lista de presenças da viagem
 * @param {Object|null} params.user - Usuário autenticado
 * @param {Object|null} params.trip - Objeto da viagem atual
 * @returns {Array} Lista de alunos elegíveis para exibição no mapa
 */
export function useNearbyStudents({ publicList = [], user, trip }) {
  return useMemo(() => {
    return publicList.filter((a) => {
      if (a.studentId === user?.uid) return false;
      if (
        trip?.locationProviderId &&
        a.studentId === trip.locationProviderId &&
        trip?.locationProviderStatus === 'active'
      ) {
        return false;
      }
      if (a.status === 'cancelado' || a.status === 'embarcado') return false;
      if (!a.lat || !a.lng || isNaN(a.lat) || isNaN(a.lng)) return false;
      return a.status === 'liberado' || a.tripType === 'ida';
    });
  }, [publicList, user?.uid, trip?.locationProviderId, trip?.locationProviderStatus]);
}
