/**
 * @file wakeUpAlarmStateMachine.js
 * @module domain/stateMachines/wakeUpAlarmStateMachine
 * @description Máquina de estados para o despertador de proximidade ("Acorda Aluno").
 * Transiciona entre estados de monitoramento geográfico, disparo de alarme e silenciamento.
 */

export const WAKEUP_STATE = Object.freeze({
  DISABLED: 'disabled',
  UNCONFIGURED: 'unconfigured',
  MONITORING: 'monitoring',
  RINGING: 'ringing',
  DISMISSED: 'dismissed',
});

/**
 * Resolve o estado atual do despertador de proximidade.
 * @param {Object} params
 * @param {boolean} params.enabled - Se o alarme está habilitado nas preferências
 * @param {boolean} params.hasStopLocation - Se as coordenadas do ponto de descida estão configuradas
 * @param {number} params.distanceMeters - Distância atual da van até o ponto de descida
 * @param {number} params.alertThresholdMeters - Distância configurada de disparo (ex: 1000m)
 * @param {boolean} params.isDismissed - Se o aluno já silenciou/dispensou o alarme nesta perna
 * @returns {string} Membro de WAKEUP_STATE
 */
export function resolveWakeUpState({
  enabled = true,
  hasStopLocation = false,
  distanceMeters = Infinity,
  alertThresholdMeters = 1000,
  isDismissed = false,
}) {
  if (!enabled) return WAKEUP_STATE.DISABLED;
  if (!hasStopLocation) return WAKEUP_STATE.UNCONFIGURED;
  if (isDismissed) return WAKEUP_STATE.DISMISSED;

  if (distanceMeters > 0 && distanceMeters <= alertThresholdMeters) {
    return WAKEUP_STATE.RINGING;
  }

  return WAKEUP_STATE.MONITORING;
}

/**
 * Indica se o alarme deve disparar notificação ou tocar som.
 * @param {string} state
 * @returns {boolean}
 */
export function isAlarmActive(state) {
  return state === WAKEUP_STATE.RINGING;
}

