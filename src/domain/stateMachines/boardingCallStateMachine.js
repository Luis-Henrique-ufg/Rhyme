/**
 * @file boardingCallStateMachine.js
 * @module domain/stateMachines/boardingCallStateMachine
 * @description Máquina de estados para chamadas de embarque disparadas na portaria das faculdades.
 * Normaliza o ciclo de vida da contagem regressiva e as respostas dos passageiros convocados.
 */

export const BOARDING_CALL_STATUS = Object.freeze({
  IDLE: 'idle',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CLOSED: 'closed',
});

export const BOARDING_RESPONSE = Object.freeze({
  COMING: 'coming',
  SKIP: 'skip',
  PENDING: 'pending',
});

/**
 * Resolve o estado atual de uma chamada de embarque.
 * @param {Object|null} boardingCall
 * @param {number} [now=Date.now()]
 * @returns {string} Membro de BOARDING_CALL_STATUS
 */
export function resolveBoardingCallState(boardingCall, now = Date.now()) {
  if (!boardingCall || !boardingCall.status) return BOARDING_CALL_STATUS.IDLE;
  if (boardingCall.status === BOARDING_CALL_STATUS.CLOSED) return BOARDING_CALL_STATUS.CLOSED;

  if (boardingCall.status === BOARDING_CALL_STATUS.ACTIVE) {
    if (boardingCall.expiresAt && now >= boardingCall.expiresAt) {
      return BOARDING_CALL_STATUS.EXPIRED;
    }
    return BOARDING_CALL_STATUS.ACTIVE;
  }

  return BOARDING_CALL_STATUS.IDLE;
}

/**
 * Verifica se um aluno específico é alvo de uma chamada de embarque ativa.
 * @param {Object|null} boardingCall
 * @param {string} studentUid
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function isStudentTargetedByBoardingCall(boardingCall, studentUid, now = Date.now()) {
  if (!boardingCall || !studentUid) return false;
  const state = resolveBoardingCallState(boardingCall, now);
  if (state !== BOARDING_CALL_STATUS.ACTIVE) return false;
  return Boolean(boardingCall.targetStudentIds?.includes(studentUid));
}
