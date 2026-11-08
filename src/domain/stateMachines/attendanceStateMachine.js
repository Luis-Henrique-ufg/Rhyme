/**
 * @file attendanceStateMachine.js
 * @module domain/stateMachines/attendanceStateMachine
 * @description Máquina de estados explícita para o ciclo de vida da presença do passageiro (attendance).
 * Normaliza estados históricos ('confirmado' -> 'embarcado'), padroniza predicados de UI
 * e centraliza a ordenação da lista de chamada do motorista.
 */

export const ATTENDANCE_STATUS = Object.freeze({
  AGUARDANDO: 'aguardando',
  LIBERADO: 'liberado',
  EMBARCADO: 'embarcado',
  CANCELADO: 'cancelado',
  ESQUECIDO: 'esquecido',
});

/**
 * Matriz de transições permitidas para a presença do passageiro.
 */
const ATTENDANCE_TRANSITIONS = Object.freeze({
  [ATTENDANCE_STATUS.AGUARDANDO]: Object.freeze([
    ATTENDANCE_STATUS.LIBERADO,
    ATTENDANCE_STATUS.EMBARCADO,
    ATTENDANCE_STATUS.CANCELADO,
    ATTENDANCE_STATUS.ESQUECIDO,
  ]),
  [ATTENDANCE_STATUS.LIBERADO]: Object.freeze([
    ATTENDANCE_STATUS.AGUARDANDO,
    ATTENDANCE_STATUS.EMBARCADO,
    ATTENDANCE_STATUS.CANCELADO,
    ATTENDANCE_STATUS.ESQUECIDO,
  ]),
  [ATTENDANCE_STATUS.EMBARCADO]: Object.freeze([
    ATTENDANCE_STATUS.AGUARDANDO, // Desfazer embarque em caso de engano do motorista
    ATTENDANCE_STATUS.CANCELADO,
  ]),
  [ATTENDANCE_STATUS.CANCELADO]: Object.freeze([
    ATTENDANCE_STATUS.AGUARDANDO, // Aluno reativou sua presença
    ATTENDANCE_STATUS.LIBERADO,
  ]),
  [ATTENDANCE_STATUS.ESQUECIDO]: Object.freeze([
    ATTENDANCE_STATUS.EMBARCADO, // Resgatado pelo motorista
    ATTENDANCE_STATUS.AGUARDANDO,
    ATTENDANCE_STATUS.CANCELADO,
  ]),
});

/**
 * Normaliza status legados ou variantes históricas.
 * Ex: 'confirmado' era usado em componentes antigos para representar o embarque.
 * @param {string} status
 * @returns {string} Status canônico
 */
export function normalizeAttendanceStatus(status) {
  if (!status) return ATTENDANCE_STATUS.AGUARDANDO;
  const s = String(status).toLowerCase().trim();
  if (s === 'confirmado') return ATTENDANCE_STATUS.EMBARCADO;
  return s;
}

/**
 * Verifica se a transição entre o status atual e o novo é permitida.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function canTransitionAttendance(currentStatus, targetStatus) {
  const current = normalizeAttendanceStatus(currentStatus);
  const target = normalizeAttendanceStatus(targetStatus);
  if (current === target) return true;
  const allowed = ATTENDANCE_TRANSITIONS[current];
  return Boolean(allowed && allowed.includes(target));
}

/**
 * Predicados de estado universais (retrocompatíveis com registros legados).
 */

/** Aluno está na lista e aguarda embarque (ainda não subiu na van e não cancelou) */
export function isPassengerPending(status) {
  const norm = normalizeAttendanceStatus(status);
  return norm === ATTENDANCE_STATUS.AGUARDANDO || norm === ATTENDANCE_STATUS.LIBERADO;
}

/** Aluno já embarcou no veículo */
export function isPassengerBoarded(status) {
  const norm = normalizeAttendanceStatus(status);
  return norm === ATTENDANCE_STATUS.EMBARCADO;
}

/** Aluno cancelou ou informou que não vai */
export function isPassengerCancelled(status) {
  const norm = normalizeAttendanceStatus(status);
  return norm === ATTENDANCE_STATUS.CANCELADO;
}

/** Aluno disparou SOS / alerta de esquecido */
export function isPassengerEmergency(status) {
  const norm = normalizeAttendanceStatus(status);
  return norm === ATTENDANCE_STATUS.ESQUECIDO;
}

/** Aluno está ativo na viagem (embarcado, aguardando ou liberado - não cancelado) */
export function isPassengerActive(status) {
  const norm = normalizeAttendanceStatus(status);
  return norm !== ATTENDANCE_STATUS.CANCELADO;
}

/**
 * Retorna o peso numérico para ordenação consistente no checklist da van.
 * Ordem: Liberados/Aguardando (0) -> Embarcados (1) -> Cancelados (2) -> Esquecidos (-1, topo emergencial).
 * @param {string} status
 * @returns {number}
 */
export function getAttendanceStatusPriority(status) {
  const norm = normalizeAttendanceStatus(status);
  switch (norm) {
    case ATTENDANCE_STATUS.ESQUECIDO:
      return -1; // Máxima prioridade (topo absoluto)
    case ATTENDANCE_STATUS.LIBERADO:
    case ATTENDANCE_STATUS.AGUARDANDO:
      return 0; // Pendentes de embarque
    case ATTENDANCE_STATUS.EMBARCADO:
      return 1; // Já no veículo
    case ATTENDANCE_STATUS.CANCELADO:
      return 2; // Não vão
    default:
      return 0;
  }
}
