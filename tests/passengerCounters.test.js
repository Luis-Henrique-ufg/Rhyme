/**
 * @file passengerCounters.test.js
 * @description Testes para o algoritmo de clusterização espacial, contagem de passageiros e ordenação de paradas.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processos 6.4.7.2.c e 6.4.9).
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePassengerCounters } from '../src/hooks/usePassengerCounters.js';

describe('usePassengerCounters - Clusterização e Próxima Parada (ISO-6.4.7-VERIF02)', () => {
  const busLocation = { lat: -16.6869, lng: -49.2643 }; // Centro de Goiânia

  it('retorna listas vazias e nextStop nulo quando não há presenças', () => {
    const { result } = renderHook(() =>
      usePassengerCounters({
        attendanceMap: {},
        busLocation,
      })
    );

    expect(result.current.facultySummary).toEqual([]);
    expect(result.current.customClusters).toEqual([]);
    expect(result.current.nextStop).toBeNull();
  });

  it('agrupa passageiros na mesma faculdade no resumo de faculdades', () => {
    const attendanceMap = {
      att1: { studentId: 's1', studentName: 'Ana', faculty: 'UFG', status: 'aguardando' },
      att2: { studentId: 's2', studentName: 'Bia', faculty: 'UFG', status: 'liberado' },
      att3: { studentId: 's3', studentName: 'Caio', faculty: 'PUC', status: 'aguardando' },
      att4: { studentId: 's4', studentName: 'Davi', faculty: 'UFG', status: 'embarcado' },
      att5: { studentId: 's5', studentName: 'Eva', faculty: 'PUC', status: 'cancelado' },
    };

    const { result } = renderHook(() =>
      usePassengerCounters({
        attendanceMap,
        busLocation,
      })
    );

    const summary = result.current.facultySummary;
    // Apenas passageiros não-embarcados e não-cancelados contam
    const ufg = summary.find((f) => f.name === 'UFG');
    const puc = summary.find((f) => f.name === 'PUC');

    expect(ufg).toBeDefined();
    expect(ufg.count).toBe(2); // Ana + Bia

    expect(puc).toBeDefined();
    expect(puc.count).toBe(1); // Caio
  });

  it('agrupa passageiros próximos (<150m) no mesmo customCluster', () => {
    const attendanceMap = {
      // Dois alunos na Praça Universitária (~30m entre si)
      att1: {
        studentId: 's1',
        studentName: 'Lucas',
        faculty: 'PUC',
        status: 'aguardando',
        lat: -16.6747,
        lng: -49.242,
      },
      att2: {
        studentId: 's2',
        studentName: 'Mariana',
        faculty: 'PUC',
        status: 'liberado',
        lat: -16.6749,
        lng: -49.2421,
      },
      // Aluno no Campus Samambaia (~8km de distância)
      att3: {
        studentId: 's3',
        studentName: 'Pedro',
        faculty: 'UFG',
        status: 'aguardando',
        lat: -16.6035,
        lng: -49.2655,
      },
    };

    const { result } = renderHook(() =>
      usePassengerCounters({
        attendanceMap,
        busLocation,
      })
    );

    const clusters = result.current.customClusters;
    expect(clusters.length).toBe(2);

    const clusterPUC = clusters.find((c) => c.students.some((s) => s.id === 's1'));
    expect(clusterPUC.students).toHaveLength(2);
    expect(clusterPUC.students.map((s) => s.name)).toContain('Lucas');
    expect(clusterPUC.students.map((s) => s.name)).toContain('Mariana');
  });

  it('identifica a parada mais próxima da van como nextStop', () => {
    const vanAtPuc = { lat: -16.674, lng: -49.242 };

    const attendanceMap = {
      // Parada perto (~100m)
      att1: {
        studentId: 's1',
        studentName: 'Ana Perto',
        faculty: 'PUC',
        status: 'liberado',
        lat: -16.675,
        lng: -49.242,
      },
      // Parada longe (~8km)
      att2: {
        studentId: 's2',
        studentName: 'Carlos Longe',
        faculty: 'UFG',
        status: 'aguardando',
        lat: -16.6035,
        lng: -49.2655,
      },
    };

    const { result } = renderHook(() =>
      usePassengerCounters({
        attendanceMap,
        busLocation: vanAtPuc,
      })
    );

    const nextStop = result.current.nextStop;
    expect(nextStop).toBeDefined();
    expect(nextStop.title).toBe('Ana Perto');
    expect(nextStop.distKm).toBeLessThan(1.0);
    expect(nextStop.liberadosCount).toBe(1);
    expect(nextStop.totalCount).toBe(1);
  });
});
