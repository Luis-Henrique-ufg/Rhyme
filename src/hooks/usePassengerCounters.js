/**
 * @file usePassengerCounters.js
 * @module hooks/usePassengerCounters
 * @description Hook customizado para calcular contadores de passageiros por faculdade (RF06),
 * agrupamento de embarque por proximidade geográfica (clustering) e identificação da próxima parada.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { useMemo } from 'react';
import { getDistanceFromLatLonInKm, MOCK_FACULTIES } from '../services/geoService';

/**
 * @param {Object} params
 * @param {Object} params.attendanceMap - Dicionário de presenças do dia
 * @param {{lat: number, lng: number}|null} [params.busLocation] - Posição atual da van/ônibus
 * @returns {{
 *   facultySummary: Array<{name: string, count: number}>,
 *   customClusters: Array<{id: string, lat: number, lng: number, students: Array<Object>}>,
 *   nextStop: Object|null
 * }}
 */
export function usePassengerCounters({ attendanceMap = {}, busLocation = null }) {
  const facultySummary = useMemo(() => {
    const map = {};
    Object.values(attendanceMap).forEach((att) => {
      if (att.status !== 'liberado' && att.status !== 'aguardando') return;
      const faculty = att.faculty || 'Outra';
      if (!map[faculty]) {
        map[faculty] = { name: faculty, count: 0 };
      }
      map[faculty].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [attendanceMap]);

  const customClusters = useMemo(() => {
    const clusters = [];

    Object.entries(attendanceMap).forEach(([studentId, att]) => {
      if (
        (att.status === 'liberado' || att.status === 'aguardando' || att.tripType === 'ida') &&
        att.status !== 'cancelado' &&
        att.status !== 'embarcado' &&
        att.lat &&
        att.lng
      ) {
        const student = {
          id: att.studentId || studentId,
          name: att.studentName || 'Aluno',
          faculty: att.faculty,
          status: att.status,
          tripType: att.tripType,
          response: att.response || null,
          responseAt: att.responseAt || null,
        };

        let addedToCluster = false;
        for (let cluster of clusters) {
          const distToCluster = getDistanceFromLatLonInKm(
            att.lat,
            att.lng,
            cluster.lat,
            cluster.lng
          );
          if (distToCluster < 0.15) {
            cluster.students.push(student);
            addedToCluster = true;
            break;
          }
        }

        if (!addedToCluster) {
          clusters.push({
            id: `cluster_${studentId}`,
            lat: att.lat,
            lng: att.lng,
            students: [student],
          });
        }
      }
    });

    return clusters;
  }, [attendanceMap]);

  const nextStop = useMemo(() => {
    if (!busLocation?.lat || !busLocation?.lng) return null;

    const activeStops = [];

    // 1. A partir dos customClusters
    customClusters.forEach((cluster) => {
      const pendingStudents = cluster.students.filter(
        (s) => s.status !== 'embarcado' && s.status !== 'cancelado'
      );
      if (pendingStudents.length > 0) {
        const distKm = getDistanceFromLatLonInKm(
          busLocation.lat,
          busLocation.lng,
          cluster.lat,
          cluster.lng
        );
        const liberadosCount = pendingStudents.filter((s) => s.status === 'liberado').length;
        const primaryFaculty = pendingStudents[0]?.faculty || 'Ponto de Embarque';
        const title = pendingStudents.length === 1 ? pendingStudents[0].name : primaryFaculty;

        activeStops.push({
          id: cluster.id,
          title,
          faculty: primaryFaculty,
          lat: cluster.lat,
          lng: cluster.lng,
          students: pendingStudents,
          totalCount: pendingStudents.length,
          liberadosCount,
          distKm,
        });
      }
    });

    // 2. A partir das Faculdades MOCK_FACULTIES caso não agrupadas em customClusters
    Object.entries(MOCK_FACULTIES).forEach(([facName, coords]) => {
      const facAttendances = Object.values(attendanceMap).filter(
        (att) =>
          att.faculty === facName &&
          att.status !== 'embarcado' &&
          att.status !== 'cancelado' &&
          att.tripType !== 'ida'
      );

      const alreadyInStops = activeStops.some((s) => s.faculty === facName);
      if (facAttendances.length > 0 && !alreadyInStops) {
        const distKm = getDistanceFromLatLonInKm(
          busLocation.lat,
          busLocation.lng,
          coords[0],
          coords[1]
        );
        const liberadosCount = facAttendances.filter((a) => a.status === 'liberado').length;

        activeStops.push({
          id: `fac_${facName}`,
          title: facName,
          faculty: facName,
          lat: coords[0],
          lng: coords[1],
          students: facAttendances.map((a) => ({
            name: a.studentName || 'Aluno',
            faculty: a.faculty,
            status: a.status,
          })),
          totalCount: facAttendances.length,
          liberadosCount,
          distKm,
        });
      }
    });

    if (activeStops.length === 0) return null;

    activeStops.sort((a, b) => a.distKm - b.distKm);
    return activeStops[0];
  }, [busLocation, customClusters, attendanceMap]);

  return {
    facultySummary,
    customClusters,
    nextStop,
  };
}
