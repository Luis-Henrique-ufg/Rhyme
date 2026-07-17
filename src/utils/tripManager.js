import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Garante que a viagem do dia para uma rota específica exista.
 * Isso substitui a necessidade de um CRON job no backend.
 */
export async function ensureDailyTripExists(route) {
  if (!route) return null;

  // Usa o fuso horário local para pegar a data YYYY-MM-DD
  const today = new Date();
  
  // As rotas são autônomas e não dependem do dia da semana.
  // Permite criação em finais de semana, feriados, etc.

  const dateString = today.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD local
  const tripId = `trip_${route}_${dateString}`;
  
  const tripRef = doc(db, 'trips', tripId);

  try {
    const tripSnap = await getDoc(tripRef);
    
    // Se a viagem não existe, cria.
    if (!tripSnap.exists()) {
      const departureTime = route === 'Cromínia' ? '16:30' : '16:00';
      
      await setDoc(tripRef, {
        route,
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
        route: student.route || 'Professor Jamil',
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
