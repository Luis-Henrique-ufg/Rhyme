import { describe, it, expect } from 'vitest';
import {
  TRIP_STATUS,
  canTransitionTrip,
  transitionTrip,
  isTripOpen,
  isTripActive,
  isTripFinished,
  ATTENDANCE_STATUS,
  normalizeAttendanceStatus,
  canTransitionAttendance,
  isPassengerPending,
  isPassengerBoarded,
  isPassengerCancelled,
  isPassengerEmergency,
  isPassengerActive,
  getAttendanceStatusPriority,
  GPS_STATE,
  resolveGpsState,
  shouldStudentBroadcastYield,
  formatGpsElapsedLabel,
  BOARDING_CALL_STATUS,
  resolveBoardingCallState,
  isStudentTargetedByBoardingCall,
  WAKEUP_STATE,
  resolveWakeUpState,
  isAlarmActive,
} from '../src/domain/stateMachines';

describe('TripStateMachine (ISO-6.4.7)', () => {
  it('permite transições válidas no ciclo de vida da viagem', () => {
    expect(canTransitionTrip(TRIP_STATUS.OPEN, TRIP_STATUS.IN_PROGRESS)).toBe(true);
    expect(canTransitionTrip(TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.FINISHED)).toBe(true);
    expect(canTransitionTrip(TRIP_STATUS.FINISHED, TRIP_STATUS.OPEN)).toBe(true);
  });

  it('bloqueia saltos de estado inválidos', () => {
    expect(canTransitionTrip(TRIP_STATUS.OPEN, TRIP_STATUS.FINISHED)).toBe(false);
    expect(canTransitionTrip(TRIP_STATUS.FINISHED, TRIP_STATUS.IN_PROGRESS)).toBe(false);
  });

  it('transitionTrip executa transição válida ou lança exceção em transição ilegal', () => {
    expect(transitionTrip(TRIP_STATUS.OPEN, TRIP_STATUS.IN_PROGRESS)).toBe(TRIP_STATUS.IN_PROGRESS);
    expect(() => transitionTrip(TRIP_STATUS.OPEN, TRIP_STATUS.FINISHED)).toThrow();
  });

  it('predicados de estado funcionam corretamente', () => {
    expect(isTripOpen('open')).toBe(true);
    expect(isTripActive('in_progress')).toBe(true);
    expect(isTripFinished('finished')).toBe(true);
    expect(isTripActive('open')).toBe(false);
  });
});

describe('AttendanceStateMachine (ISO-6.4.7)', () => {
  it('normaliza status legado "confirmado" para "embarcado"', () => {
    expect(normalizeAttendanceStatus('confirmado')).toBe(ATTENDANCE_STATUS.EMBARCADO);
    expect(normalizeAttendanceStatus('CONFIRMADO ')).toBe(ATTENDANCE_STATUS.EMBARCADO);
    expect(normalizeAttendanceStatus('liberado')).toBe(ATTENDANCE_STATUS.LIBERADO);
  });

  it('reconhece corretamente predicados de passageiros', () => {
    expect(isPassengerPending('aguardando')).toBe(true);
    expect(isPassengerPending('liberado')).toBe(true);
    expect(isPassengerPending('embarcado')).toBe(false);

    // Compatibilidade com legado para salvar o streak do calendário
    expect(isPassengerBoarded('embarcado')).toBe(true);
    expect(isPassengerBoarded('confirmado')).toBe(true);
    expect(isPassengerBoarded('aguardando')).toBe(false);

    expect(isPassengerCancelled('cancelado')).toBe(true);
    expect(isPassengerEmergency('esquecido')).toBe(true);
    expect(isPassengerActive('cancelado')).toBe(false);
    expect(isPassengerActive('liberado')).toBe(true);
  });

  it('calcula prioridade correta de ordenação para o checklist do motorista', () => {
    expect(getAttendanceStatusPriority('esquecido')).toBe(-1); // Topo
    expect(getAttendanceStatusPriority('liberado')).toBe(0);
    expect(getAttendanceStatusPriority('aguardando')).toBe(0);
    expect(getAttendanceStatusPriority('embarcado')).toBe(1);
    expect(getAttendanceStatusPriority('confirmado')).toBe(1);
    expect(getAttendanceStatusPriority('cancelado')).toBe(2);
  });

  it('valida transições permitidas para o passageiro', () => {
    expect(canTransitionAttendance('aguardando', 'liberado')).toBe(true);
    expect(canTransitionAttendance('liberado', 'embarcado')).toBe(true);
    expect(canTransitionAttendance('embarcado', 'aguardando')).toBe(true); // desfazer engano
    expect(canTransitionAttendance('cancelado', 'aguardando')).toBe(true); // reativar presença
  });
});

describe('TelemetryStateMachine & Arbitragem (ISO-6.4.7)', () => {
  const now = 1000000;

  it('resolve estado "live" quando isBroadcasting está ativo', () => {
    expect(resolveGpsState({ isBroadcasting: true, now })).toBe(GPS_STATE.LIVE);
  });

  it('resolve estado "paused" quando status do provedor é paused', () => {
    expect(resolveGpsState({ providerStatus: 'paused', now })).toBe(GPS_STATE.PAUSED);
  });

  it('resolve "live", "stale" ou "expired" com base na idade das coordenadas', () => {
    // Menos de 60 segundos
    expect(resolveGpsState({ locationUpdatedAt: now - 30_000, now })).toBe(GPS_STATE.LIVE);
    // Entre 60s e 180s
    expect(resolveGpsState({ locationUpdatedAt: now - 120_000, now })).toBe(GPS_STATE.STALE);
    // Mais de 180s
    expect(resolveGpsState({ locationUpdatedAt: now - 200_000, now })).toBe(GPS_STATE.EXPIRED);
  });

  it('arbitra prioridade: transmissão do aluno cede quando motorista assume o GPS', () => {
    const tripWithDriverGps = {
      locationProviderRole: 'driver',
      busLocation: { lat: -16.6, lng: -49.2 },
      locationUpdatedAt: now - 10_000,
    };
    expect(shouldStudentBroadcastYield({ trip: tripWithDriverGps, now })).toBe(true);

    const tripWithOldSignal = {
      locationProviderRole: 'student',
      busLocation: { lat: -16.6, lng: -49.2 },
      locationUpdatedAt: now - 300_000,
    };
    expect(shouldStudentBroadcastYield({ trip: tripWithOldSignal, gpsState: GPS_STATE.EXPIRED, now })).toBe(false);
  });

  it('formata rótulos de tempo decorrido com clareza', () => {
    expect(formatGpsElapsedLabel(GPS_STATE.LIVE, now, now)).toBe('');
    expect(formatGpsElapsedLabel(GPS_STATE.PAUSED, null, now)).toBe('PAUSADO');
    expect(formatGpsElapsedLabel(GPS_STATE.STALE, now - 45_000, now)).toBe('HÁ 45s');
    expect(formatGpsElapsedLabel(GPS_STATE.EXPIRED, now - 125_000, now)).toBe('HÁ 2min');
  });
});

describe('BoardingCallStateMachine (ISO-6.4.7)', () => {
  const now = 500000;

  it('resolve estado da chamada como IDLE se nulo ou sem status', () => {
    expect(resolveBoardingCallState(null, now)).toBe(BOARDING_CALL_STATUS.IDLE);
    expect(resolveBoardingCallState({}, now)).toBe(BOARDING_CALL_STATUS.IDLE);
  });

  it('resolve chamada ativa e verifica expiração após expiresAt', () => {
    const activeCall = { status: 'active', expiresAt: now + 60_000, targetStudentIds: ['user1', 'user2'] };
    expect(resolveBoardingCallState(activeCall, now)).toBe(BOARDING_CALL_STATUS.ACTIVE);
    expect(isStudentTargetedByBoardingCall(activeCall, 'user1', now)).toBe(true);
    expect(isStudentTargetedByBoardingCall(activeCall, 'user3', now)).toBe(false);

    // Passou do tempo limite
    expect(resolveBoardingCallState(activeCall, now + 60_001)).toBe(BOARDING_CALL_STATUS.EXPIRED);
    expect(isStudentTargetedByBoardingCall(activeCall, 'user1', now + 60_001)).toBe(false);
  });
});

describe('WakeUpAlarmStateMachine (ISO-6.4.7)', () => {
  it('gerencia estados do despertador de proximidade corretamente', () => {
    expect(resolveWakeUpState({ enabled: false })).toBe(WAKEUP_STATE.DISABLED);
    expect(resolveWakeUpState({ enabled: true, hasStopLocation: false })).toBe(WAKEUP_STATE.UNCONFIGURED);
    expect(
      resolveWakeUpState({ enabled: true, hasStopLocation: true, distanceMeters: 1500, alertThresholdMeters: 1000 })
    ).toBe(WAKEUP_STATE.MONITORING);
    expect(
      resolveWakeUpState({ enabled: true, hasStopLocation: true, distanceMeters: 800, alertThresholdMeters: 1000 })
    ).toBe(WAKEUP_STATE.RINGING);
    expect(
      resolveWakeUpState({ enabled: true, hasStopLocation: true, distanceMeters: 800, alertThresholdMeters: 1000, isDismissed: true })
    ).toBe(WAKEUP_STATE.DISMISSED);
  });

  it('isAlarmActive dispara apenas em estado RINGING', () => {
    expect(isAlarmActive(WAKEUP_STATE.RINGING)).toBe(true);
    expect(isAlarmActive(WAKEUP_STATE.MONITORING)).toBe(false);
    expect(isAlarmActive(WAKEUP_STATE.DISMISSED)).toBe(false);
  });
});
