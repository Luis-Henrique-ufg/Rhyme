/**
 * @file tripStateMachine.js
 * @module domain/stateMachines/tripStateMachine
 * @description Máquina de estados explícita para o ciclo de vida da viagem (trips).
 * Garante transições determinísticas entre OPEN, IN_PROGRESS e FINISHED,
 * prevenindo estados inconsistentes e elevando a experiência do desenvolvedor (DX)
 * e de agentes de IA (AX).
 */

export const TRIP_STATUS = Object.freeze({
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
});

/**
 * Matriz de transições permitidas para o ciclo de vida da viagem.
 */
const TRIP_TRANSITIONS = Object.freeze({
  [TRIP_STATUS.OPEN]: Object.freeze([TRIP_STATUS.IN_PROGRESS]),
  [TRIP_STATUS.IN_PROGRESS]: Object.freeze([TRIP_STATUS.FINISHED]),
  [TRIP_STATUS.FINISHED]: Object.freeze([TRIP_STATUS.OPEN]), // Permite reabertura se necessário
});

/**
 * Verifica se a transição entre o status atual e o alvo é válida.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function canTransitionTrip(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;
  const allowed = TRIP_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Executa a transição da viagem de forma segura. Lança erro se a transição for inválida.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {string} Novo status validado
 */
export function transitionTrip(currentStatus, targetStatus) {
  if (!canTransitionTrip(currentStatus, targetStatus)) {
    throw new Error(
      `Transição de viagem inválida: não é permitido transitar de '${currentStatus}' para '${targetStatus}'.`
    );
  }
  return targetStatus;
}

/**
 * Predicados de estado para simplificar a lógica de UI e regras de negócio.
 */
export const isTripOpen = (status) => status === TRIP_STATUS.OPEN;
export const isTripActive = (status) => status === TRIP_STATUS.IN_PROGRESS;
export const isTripFinished = (status) => status === TRIP_STATUS.FINISHED;

