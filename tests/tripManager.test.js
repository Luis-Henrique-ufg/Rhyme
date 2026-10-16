/**
 * @file tripManager.test.js
 * @description Testes unitários para o ciclo de vida da viagem e máquina de estados de presença.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processos 6.4.7.2.c e 6.4.9).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simulação dos módulos do Firestore
const mockDocStore = new Map();

vi.mock('../src/config/firebase', () => ({
  db: { _mock: true },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collection, id) => `${collection}/${id}`),
  getDoc: vi.fn(async (docPath) => ({
    exists: () => mockDocStore.has(docPath),
    data: () => mockDocStore.get(docPath),
  })),
  setDoc: vi.fn(async (docPath, data, options = {}) => {
    if (options.merge && mockDocStore.has(docPath)) {
      mockDocStore.set(docPath, { ...mockDocStore.get(docPath), ...data });
    } else {
      mockDocStore.set(docPath, data);
    }
  }),
  deleteDoc: vi.fn(async (docPath) => {
    mockDocStore.delete(docPath);
  }),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
}));

import {
  ensureDailyTripExists,
  joinTrip,
  migrateStudentAttendance,
  normalizeRoute,
} from '../src/utils/tripManager.js';

describe('tripManager - Ciclo de Vida e Máquina de Estados (ISO-6.4.7-VERIF02)', () => {
  beforeEach(() => {
    mockDocStore.clear();
    vi.clearAllMocks();
  });

  describe('ensureDailyTripExists', () => {
    it('retorna null quando nenhuma rota é informada', async () => {
      expect(await ensureDailyTripExists('')).toBeNull();
      expect(await ensureDailyTripExists(null)).toBeNull();
    });

    it('cria uma nova viagem com status "open" quando a viagem do dia não existe', async () => {
      const tripId = await ensureDailyTripExists('Professor Jamil');
      expect(tripId).toMatch(/^trip_Professor Jamil_\d{4}-\d{2}-\d{2}$/);

      const savedTrip = mockDocStore.get(`trips/${tripId}`);
      expect(savedTrip).toBeDefined();
      expect(savedTrip.route).toBe('Professor Jamil');
      expect(savedTrip.status).toBe('open');
      expect(savedTrip.departureTime).toBe('16:00');
    });

    it('define o horário de saída correto para a rota Cromínia (16:30)', async () => {
      const tripId = await ensureDailyTripExists('Cromínia');
      expect(tripId).toMatch(/^trip_Cromínia_\d{4}-\d{2}-\d{2}$/);

      const savedTrip = mockDocStore.get(`trips/${tripId}`);
      expect(savedTrip.departureTime).toBe('16:30');
      expect(savedTrip.status).toBe('open');
    });

    it('retorna o tripId existente sem sobrescrever dados se a viagem já existir', async () => {
      const tripId = await ensureDailyTripExists('Professor Jamil');
      // Altera o status manualmente para in_progress
      mockDocStore.get(`trips/${tripId}`).status = 'in_progress';

      const secondTripId = await ensureDailyTripExists('Professor Jamil');
      expect(secondTripId).toBe(tripId);
      expect(mockDocStore.get(`trips/${tripId}`).status).toBe('in_progress');
    });
  });

  describe('joinTrip', () => {
    it('ignora execução quando tripId ou student.uid forem inválidos', async () => {
      await joinTrip('', { uid: 'u1' });
      await joinTrip('t1', null);
      expect(mockDocStore.size).toBe(0);
    });

    it('adiciona o aluno na lista de presença com status inicial "aguardando"', async () => {
      const student = {
        uid: 'student_123',
        name: 'Maria Silva',
        faculty: 'UFG',
        route: 'Professor Jamil',
      };
      const coords = { lat: -16.6035, lng: -49.2655 };

      await joinTrip('trip_pj_today', student, coords);

      const attendance = mockDocStore.get('attendance/trip_pj_today_student_123');
      expect(attendance).toBeDefined();
      expect(attendance.status).toBe('aguardando');
      expect(attendance.studentName).toBe('Maria Silva');
      expect(attendance.faculty).toBe('UFG');
      expect(attendance.lat).toBe(-16.6035);
      expect(attendance.lng).toBe(-49.2655);
      expect(attendance.tripType).toBe('ida_volta');
    });

    it('não sobrescreve presença já existente (preserva status como liberado ou embarcado)', async () => {
      const student = { uid: 'student_123', name: 'Maria Silva' };
      mockDocStore.set('attendance/trip_pj_today_student_123', {
        status: 'liberado',
        studentName: 'Maria Silva',
      });

      await joinTrip('trip_pj_today', student, { lat: 0, lng: 0 });

      const attendance = mockDocStore.get('attendance/trip_pj_today_student_123');
      expect(attendance.status).toBe('liberado'); // manteve liberado
    });
  });

  describe('migrateStudentAttendance', () => {
    it('deleta a presença da rota antiga e migra o status para a nova rota', async () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const oldTripId = `trip_Professor Jamil_${dateString}`;
      const oldAttKey = `attendance/${oldTripId}_student_456`;

      // Simula presença já existente na rota antiga
      mockDocStore.set(oldAttKey, {
        status: 'liberado',
        studentId: 'student_456',
        lat: -16.68,
        lng: -49.26,
      });

      await migrateStudentAttendance('student_456', 'Professor Jamil', 'Cromínia', {
        name: 'Carlos Oliveira',
        faculty: 'PUC',
      });

      // Rota antiga deve ter sido deletada
      expect(mockDocStore.has(oldAttKey)).toBe(false);

      // Nova rota deve existir com os dados preservados
      const newTripId = `trip_Cromínia_${dateString}`;
      const newAttKey = `attendance/${newTripId}_student_456`;
      expect(mockDocStore.has(newAttKey)).toBe(true);

      const newAtt = mockDocStore.get(newAttKey);
      expect(newAtt.status).toBe('liberado'); // manteve status
      expect(newAtt.studentName).toBe('Carlos Oliveira');
      expect(newAtt.route).toBe('Cromínia');
    });

    it('não migra presença caso o status anterior tenha sido "cancelado"', async () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const oldTripId = `trip_Professor Jamil_${dateString}`;
      const oldAttKey = `attendance/${oldTripId}_student_cancelled`;

      mockDocStore.set(oldAttKey, {
        status: 'cancelado',
        studentId: 'student_cancelled',
      });

      await migrateStudentAttendance('student_cancelled', 'Professor Jamil', 'Cromínia', {
        name: 'Aluno Cancelado',
      });

      // Removeu da rota antiga
      expect(mockDocStore.has(oldAttKey)).toBe(false);

      // Não deve ter criado na nova rota
      const newTripId = `trip_Cromínia_${dateString}`;
      const newAttKey = `attendance/${newTripId}_student_cancelled`;
      expect(mockDocStore.has(newAttKey)).toBe(false);
    });
  });
});
