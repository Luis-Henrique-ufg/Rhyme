/**
 * @file driverService.js
 * @module services/driverService
 * @description Encapsula todas as operações do Firestore e do ciclo de vida da viagem do motorista:
 * telemetria em tempo real, status de presença dos passageiros, rotas OSRM e chamadas de embarque.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { normalizeRoute } from '../utils/tripManager';

/**
 * Escuta em tempo real o perfil do motorista.
 * @param {string} uid - ID do motorista
 * @param {Function} onData - Callback com o snapshot
 * @param {Function} [onError] - Callback de erro
 * @returns {Function} Unsubscribe
 */
export function subscribeToDriverProfile(uid, onData, onError) {
  if (!uid) return () => {};
  return onSnapshot(doc(db, 'students', uid), onData, onError);
}

/**
 * Escuta em tempo real os alunos cadastrados na rota do motorista.
 * @param {string} route - Nome da rota
 * @param {Function} onData - Callback com os dados dos alunos
 * @param {Function} [onError] - Callback de erro
 * @returns {Function} Unsubscribe
 */
export function subscribeToRouteStudents(route, onData, onError) {
  if (!route) return () => {};
  const normalizedRoute = normalizeRoute(route);
  const qStudents = query(
    collection(db, 'students'),
    where('route', '==', normalizedRoute),
    where('role', '==', 'student')
  );
  return onSnapshot(
    qStudents,
    (snap) => {
      const studentsData = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      onData(studentsData);
    },
    onError
  );
}

/**
 * Atualiza as coordenadas em tempo real do motorista na viagem (Telemetria).
 * @param {string} tripId - ID da viagem ativa
 * @param {Object} params
 * @param {number} params.latitude - Latitude atual
 * @param {number} params.longitude - Longitude atual
 * @param {string} [params.driverName] - Nome do motorista
 * @param {string} params.driverUid - UID do motorista
 * @returns {Promise<void>}
 */
export async function updateDriverLocation(tripId, { latitude, longitude, driverName, driverUid }) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), {
    busLocation: { lat: latitude, lng: longitude },
    locationProviderName: driverName || 'Motorista',
    locationProviderId: driverUid,
    locationProviderRole: 'driver',
    locationProviderStatus: 'active',
    locationUpdatedAt: Date.now(),
  });
}

/**
 * Pausa a telemetria do motorista na viagem.
 * @param {string} tripId - ID da viagem
 * @returns {Promise<void>}
 */
export async function pauseDriverTelemetry(tripId) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), {
    locationProviderStatus: 'paused',
  });
}

/**
 * Atualiza o status da viagem (ex: 'open', 'in_progress', 'finished') e dados adicionais.
 * @param {string} tripId - ID da viagem
 * @param {string} newStatus - Novo status da viagem
 * @param {Object} [extraData={}] - Dados adicionais
 * @returns {Promise<void>}
 */
export async function updateTripStatus(tripId, newStatus, extraData = {}) {
  if (!tripId) throw new Error('tripId é obrigatório');
  return updateDoc(doc(db, 'trips', tripId), {
    status: newStatus,
    ...extraData,
  });
}

/**
 * Atualiza o status de presença de um passageiro individual pelo motorista.
 * @param {string} tripId - ID da viagem
 * @param {string} studentId - UID do aluno
 * @param {string} newStatus - Novo status ('embarcado', 'liberado', 'aguardando', etc)
 * @param {Object} studentInfo - Informações cadastrais de apoio
 * @returns {Promise<void>}
 */
export async function updatePassengerStatus(tripId, studentId, newStatus, studentInfo = {}) {
  if (!tripId || !studentId) return;
  const attendanceId = `${tripId}_${studentId}`;
  return setDoc(
    doc(db, 'attendance', attendanceId),
    {
      status: newStatus,
      tripId,
      studentId,
      studentName: studentInfo.studentName || 'Aluno',
      faculty: studentInfo.faculty || 'Outra',
      route: studentInfo.route || 'Professor Jamil',
      photoURL: studentInfo.photoURL || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Inicia uma chamada de embarque para uma faculdade/parada específica.
 * @param {string} tripId - ID da viagem
 * @param {Object} callData - Dados da chamada de embarque
 * @returns {Promise<void>}
 */
export async function startBoardingCall(tripId, callData) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), { boardingCall: callData });
}

/**
 * Estende o tempo de uma chamada de embarque ativa.
 * @param {string} tripId - ID da viagem
 * @param {Object} updatedCallData - Chamada atualizada com novo tempo
 * @returns {Promise<void>}
 */
export async function extendBoardingCall(tripId, updatedCallData) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), { boardingCall: updatedCallData });
}

/**
 * Encerra e limpa a chamada de embarque da viagem.
 * @param {string} tripId - ID da viagem
 * @returns {Promise<void>}
 */
export async function closeBoardingCall(tripId) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), { boardingCall: null });
}

/**
 * Salva a rota OSRM traçada para a viagem do motorista.
 * @param {string} tripId - ID da viagem
 * @param {Array<{lat: number, lng: number}>} routePath - Coordenadas da rota
 * @returns {Promise<void>}
 */
export async function saveDriverRoutePath(tripId, routePath) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), { driverRoutePath: routePath });
}

/**
 * Limpa todas as rotas ativas da viagem.
 * @param {string} tripId - ID da viagem
 * @returns {Promise<void>}
 */
export async function clearAllDriverRoutes(tripId) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), {
    driverRoutePath: [],
    globalRoute: [],
    routePath: [],
  });
}

/**
 * Atualiza a rota preferencial visualizada pelo motorista.
 * @param {string} uid - UID do motorista
 * @param {string} route - Nome da rota
 * @returns {Promise<void>}
 */
export async function updateDriverRoutePreference(uid, route) {
  if (!uid) return;
  return updateDoc(doc(db, 'students', uid), { route });
}
