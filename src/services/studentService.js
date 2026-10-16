/**
 * @file studentService.js
 * @module services/studentService
 * @description Encapsula todas as operações do Firestore relacionadas ao aluno
 * e ao controle de presença (attendance), emergências e preferências de viagem.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Escuta em tempo real o perfil do aluno.
 * @param {string} uid - ID do aluno
 * @param {Function} onData - Callback com snapshot de dados
 * @param {Function} [onError] - Callback de erro
 * @returns {Function} Função de cancelamento do listener (unsubscribe)
 */
export function subscribeToStudentProfile(uid, onData, onError) {
  if (!uid) return () => {};
  return onSnapshot(doc(db, 'students', uid), onData, onError);
}

/**
 * Escuta em tempo real o registro de attendance (presença) do aluno na viagem atual.
 * @param {string} attendanceId - Identificador único no formato `${tripId}_${studentUid}`
 * @param {Function} onData - Callback com snapshot de dados
 * @param {Function} [onError] - Callback de erro
 * @returns {Function} Função de cancelamento do listener (unsubscribe)
 */
export function subscribeToAttendance(attendanceId, onData, onError) {
  if (!attendanceId) return () => {};
  return onSnapshot(doc(db, 'attendance', attendanceId), onData, onError);
}

/**
 * Atualiza campos parciais do documento de attendance.
 * @param {string} attendanceId - ID do registro de presença
 * @param {Object} data - Campos a atualizar
 * @returns {Promise<void>}
 */
export async function updateAttendance(attendanceId, data) {
  if (!attendanceId) throw new Error('attendanceId é obrigatório');
  return updateDoc(doc(db, 'attendance', attendanceId), data);
}

/**
 * Define ou mescla dados no documento de attendance.
 * @param {string} attendanceId - ID do registro de presença
 * @param {Object} data - Dados a persistir
 * @param {Object} [options={ merge: true }] - Opções do Firestore
 * @returns {Promise<void>}
 */
export async function setAttendance(attendanceId, data, options = { merge: true }) {
  if (!attendanceId) throw new Error('attendanceId é obrigatório');
  return setDoc(doc(db, 'attendance', attendanceId), data, options);
}

/**
 * Responde à chamada de embarque ativa da van.
 * @param {string} attendanceId - ID do attendance
 * @param {string} response - Resposta ('embarking' | 'skip')
 * @returns {Promise<void>}
 */
export async function respondToBoardingCall(attendanceId, response) {
  if (!attendanceId) return;
  const updates = {
    boardingResponse: response,
    boardingResponseAt: Date.now(),
  };
  if (response === 'skip') {
    updates.status = 'cancelado';
  }
  return updateDoc(doc(db, 'attendance', attendanceId), updates);
}

/**
 * Alterna o status de attendance do aluno (ex: de 'liberado' para 'aguardando' ou vice-versa).
 * @param {string} attendanceId - ID do attendance
 * @param {string} currentStatus - Status atual
 * @param {string} targetStatus - Status alvo
 * @returns {Promise<void>}
 */
export async function toggleAttendanceStatus(attendanceId, currentStatus, targetStatus) {
  if (!attendanceId) return;
  const newStatus = currentStatus === targetStatus ? 'aguardando' : targetStatus;
  return setDoc(doc(db, 'attendance', attendanceId), { status: newStatus }, { merge: true });
}

/**
 * Sincroniza o tipo de viagem (ida, volta, ida_volta) no registro de attendance.
 * @param {string} attendanceId - ID do attendance
 * @param {string} tripType - Tipo de trajeto escolhido
 * @returns {Promise<void>}
 */
export async function updateAttendanceTripType(attendanceId, tripType) {
  if (!attendanceId) return;
  return updateDoc(doc(db, 'attendance', attendanceId), {
    tripType,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Salva a preferência de viagem padrão no perfil de usuário do Firestore.
 * @param {string} uid - ID do aluno
 * @param {string} defaultTripType - Tipo padrão ('ida', 'volta', 'ida_volta')
 * @returns {Promise<void>}
 */
export async function saveUserDefaultTripType(uid, defaultTripType) {
  if (!uid) return;
  return updateDoc(doc(db, 'users', uid), { defaultTripType });
}

/**
 * Realiza o check-in do aluno na viagem definindo os metadados iniciais e trajeto.
 * @param {string} attendanceId - ID do attendance
 * @param {Object} checkInData - Dados do check-in
 * @returns {Promise<void>}
 */
export async function checkInAttendance(attendanceId, checkInData) {
  if (!attendanceId) throw new Error('attendanceId é obrigatório');
  return setDoc(
    doc(db, 'attendance', attendanceId),
    {
      ...checkInData,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Marca o aluno como 'liberado' com as coordenadas geográficas capturadas.
 * @param {string} attendanceId - ID do attendance
 * @param {Object} studentDetails - Dados cadastrais do aluno
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<void>}
 */
export async function markStudentLiberado(attendanceId, studentDetails, lat, lng) {
  if (!attendanceId) throw new Error('attendanceId é obrigatório');
  return setDoc(
    doc(db, 'attendance', attendanceId),
    {
      ...studentDetails,
      status: 'liberado',
      lat,
      lng,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Atualiza localização customizada e marca o aluno como 'liberado'.
 * @param {string} attendanceId - ID do attendance
 * @param {Object} studentDetails - Dados cadastrais do aluno
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<void>}
 */
export async function updateStudentCustomLocation(attendanceId, studentDetails, lat, lng) {
  return markStudentLiberado(attendanceId, studentDetails, lat, lng);
}

/**
 * Cancela o embarque do aluno na viagem atual.
 * @param {string} attendanceId - ID do attendance
 * @returns {Promise<void>}
 */
export async function cancelAttendance(attendanceId) {
  if (!attendanceId) return;
  return updateDoc(doc(db, 'attendance', attendanceId), { status: 'cancelado' });
}

/**
 * Dispara um chamado de emergência ('Esquecido') e marca o status do aluno.
 * @param {Object} params
 * @param {string} params.tripId - ID da viagem atual
 * @param {string} params.studentId - UID do aluno
 * @param {string} params.studentName - Nome do aluno
 * @param {string} params.route - Rota cadastrada
 * @param {string} params.faculty - Faculdade
 * @param {number|null} params.lat - Latitude aproximada
 * @param {number|null} params.lng - Longitude aproximada
 * @returns {Promise<void>}
 */
export async function reportEmergencyAndMarkForgotten({
  tripId,
  studentId,
  studentName,
  route,
  faculty,
  lat,
  lng,
}) {
  const attendanceId = `${tripId}_${studentId}`;
  const emergencyRef = doc(collection(db, 'emergencies'));
  await setDoc(emergencyRef, {
    tripId,
    studentId,
    studentName: studentName || 'Aluno',
    route: route || 'Professor Jamil',
    faculty: faculty || 'Outra',
    lat: lat || null,
    lng: lng || null,
    timestamp: serverTimestamp(),
    resolved: false,
  });

  await setDoc(doc(db, 'attendance', attendanceId), { status: 'esquecido' }, { merge: true });
}

/**
 * Atualiza o ponto de descida preferencial do aluno.
 * @param {string} uid - ID do aluno
 * @param {{lat: number, lng: number}} dropOffLocation - Coordenadas da descida
 * @returns {Promise<void>}
 */
export async function updateStudentDropOffLocation(uid, dropOffLocation) {
  if (!uid) return;
  return updateDoc(doc(db, 'students', uid), { dropOffLocation });
}

/**
 * Atualiza a rota ativa visualizada ou preferencial do aluno.
 * @param {string} uid - ID do aluno
 * @param {string} route - Nome da rota
 * @returns {Promise<void>}
 */
export async function updateStudentRoute(uid, route) {
  if (!uid) return;
  return updateDoc(doc(db, 'students', uid), { route });
}

/**
 * Transmite a telemetria GPS da van a partir do dispositivo do aluno a bordo.
 * @param {string} tripId - ID da viagem
 * @param {{lat: number, lng: number}} coords - Coordenadas da van
 * @param {string} studentName - Nome do aluno transmissor
 * @param {string} studentUid - UID do aluno transmissor
 * @returns {Promise<void>}
 */
export async function broadcastBusLocationByStudent(tripId, coords, studentName, studentUid) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), {
    busLocation: coords,
    locationProviderName: studentName || 'Aluno',
    locationProviderId: studentUid,
    locationProviderRole: 'student',
    locationProviderStatus: 'active',
    locationUpdatedAt: Date.now(),
  });
}

/**
 * Pausa a transmissão da van feita pelo aluno.
 * @param {string} tripId - ID da viagem
 * @returns {Promise<void>}
 */
export async function pauseBusBroadcastByStudent(tripId) {
  if (!tripId) return;
  return updateDoc(doc(db, 'trips', tripId), {
    locationProviderStatus: 'paused',
  });
}
