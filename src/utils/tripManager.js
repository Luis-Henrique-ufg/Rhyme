import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Normaliza strings de rotas para lidar com dados inconsistentes no banco de dados.
 * Ex: 'professor_jamil' -> 'Professor Jamil'
 */
export function normalizeRoute(route) {
  if (!route) return '';
  const r = route.trim();
  if (r.toLowerCase().includes('jamil')) return 'Professor Jamil';
  if (r.toLowerCase().includes('crom')) return 'Cromínia';
  if (r.toLowerCase().includes('hidrol')) return 'Hidrolândia';
  return r;
}

/**
 * Garante que a viagem do dia para uma rota específica exista.
 * Isso substitui a necessidade de um CRON job no backend.
 */
export async function ensureDailyTripExists(route) {
  if (!route) return null;
  const normalizedRoute = normalizeRoute(route);

  // Usa o fuso horário local para pegar a data YYYY-MM-DD
  const today = new Date();
  
  // Format YYYY-MM-DD manually to prevent locale inconsistencies across browsers
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;
  const tripId = `trip_${normalizedRoute}_${dateString}`;
  
  const tripRef = doc(db, 'trips', tripId);

  try {
    const tripSnap = await getDoc(tripRef);
    
    // Se a viagem não existe, cria.
    if (!tripSnap.exists()) {
      const departureTime = normalizedRoute === 'Cromínia' ? '16:30' : '16:00';
      
      await setDoc(tripRef, {
        route: normalizedRoute,
        date: serverTimestamp(),
        departureTime,
        status: 'open'
      });
      
      console.log(`Viagem diária gerada para a rota ${route} (${dateString})`);
      return tripId;
    }
    
    return tripId;
  } catch (error) {
    console.error("Erro ao tentar gerar viagem diária:", error);
    return null;
  }
}

/**
 * Mutação explícita: garante que o aluno está na lista de presença com status 'aguardando'.
 * Chamada pela tela do aluno ao montar, separada do hook de leitura (useTripAttendances).
 *
 * @param {string} tripId
 * @param {{ uid: string, name: string, faculty: string, route: string }} student
 * @param {{ lat: number, lng: number }} coords - Coordenadas padrão da faculdade
 */
export async function joinTrip(tripId, student, coords) {
  if (!tripId || !student?.uid) return;

  const attendanceId = `${tripId}_${student.uid}`;
  const attendanceRef = doc(db, 'attendance', attendanceId);

  try {
    const snap = await getDoc(attendanceRef);
    if (!snap.exists()) {
      await setDoc(attendanceRef, {
        tripId,
        studentId: student.uid,
        studentName: student.name || 'Aluno',
        faculty: student.faculty || 'Outra',
        route: normalizeRoute(student.route) || 'Professor Jamil',
        status: 'aguardando',
        lat: coords?.lat ?? -16.675707046574686,
        lng: coords?.lng ?? -49.24547515495722,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('joinTrip: erro ao criar presença:', error);
  }
}

/**
 * Migra a presença do aluno entre rotas quando ele altera sua rota no perfil.
 * Remove a presença da rota antiga para não poluir o dashboard do motorista anterior
 * e transfere os dados (status liberado/aguardando, GPS exato, etc) para a nova rota.
 */
export async function migrateStudentAttendance(studentId, oldRoute, newRoute, studentData = {}) {
  if (!studentId || !newRoute) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  const normOld = normalizeRoute(oldRoute);
  const normNew = normalizeRoute(newRoute);

  const oldTripId = `trip_${normOld}_${dateString}`;
  const newTripId = await ensureDailyTripExists(normNew);

  if (!newTripId) return;

  const oldAttRef = doc(db, 'attendance', `${oldTripId}_${studentId}`);
  const newAttRef = doc(db, 'attendance', `${newTripId}_${studentId}`);

  try {
    const oldSnap = await getDoc(oldAttRef);
    let previousStatus = 'aguardando';
    let previousLat = null;
    let previousLng = null;

    if (oldSnap.exists()) {
      const oldData = oldSnap.data();
      previousStatus = oldData.status || 'aguardando';
      previousLat = oldData.lat || null;
      previousLng = oldData.lng || null;

      // Deleta da rota antiga para que o motorista anterior deixe de vê-lo imediatamente
      await deleteDoc(oldAttRef);
      console.log(`[Rota] Presença removida da rota antiga (${normOld}) para o aluno ${studentId}`);
    }

    // Se o status não era cancelado, registra na nova rota
    if (previousStatus !== 'cancelado') {
      await setDoc(newAttRef, {
        tripId: newTripId,
        studentId,
        studentName: studentData.name || 'Aluno',
        faculty: studentData.faculty || 'Outra',
        route: normNew,
        photoURL: studentData.photoURL || null,
        status: previousStatus,
        lat: previousLat,
        lng: previousLng,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Rota] Presença migrada com sucesso para a rota ${normNew} (${previousStatus})`);
    }
  } catch (error) {
    console.error('Erro ao migrar presença do aluno entre rotas:', error);
  }
}

