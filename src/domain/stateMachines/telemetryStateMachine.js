/**
 * @file telemetryStateMachine.js
 * @module domain/stateMachines/telemetryStateMachine
 * @description Máquina de estados para telemetria GPS e regras de arbitragem
 * entre motorista e aluno transmissor. Garante integridade do sinal em tempo real.
 */

export const GPS_STATE = Object.freeze({
  LIVE: 'live',
  STALE: 'stale',
  EXPIRED: 'expired',
  PAUSED: 'paused',
  OFFLINE: 'offline',
});

export const GPS_LIVE_MS = 60_000; // Até 1 minuto: sinal vivo
export const GPS_STALE_MS = 180_000; // 1 a 3 minutos: sinal instável/parado

/**
 * Resolve o estado do GPS a partir dos metadados da viagem.
 * @param {Object} params
 * @param {boolean} [params.isBroadcasting=false] - Se o usuário local está transmitindo ativamente
 * @param {string|null} [params.providerStatus=null] - Status explicitamente salvo no Firestore ('active' | 'paused')
 * @param {number|null} [params.locationUpdatedAt=null] - Timestamp Unix da última localização
 * @param {boolean} [params.hasCoordinates=true] - Se existem latitude e longitude válidas
 * @param {number} [params.now=Date.now()] - Timestamp atual de referência
 * @returns {string} Membro de GPS_STATE
 */
export function resolveGpsState({
  isBroadcasting = false,
  providerStatus = null,
  locationUpdatedAt = null,
  hasCoordinates = true,
  now = Date.now(),
}) {
  if (isBroadcasting) return GPS_STATE.LIVE;
  if (providerStatus === 'paused') return GPS_STATE.PAUSED;
  if (!hasCoordinates) return GPS_STATE.EXPIRED;

  if (locationUpdatedAt) {
    const age = now - locationUpdatedAt;
    if (age < GPS_LIVE_MS) return GPS_STATE.LIVE;
    if (age < GPS_STALE_MS) return GPS_STATE.STALE;
    return GPS_STATE.EXPIRED;
  }

  return hasCoordinates ? GPS_STATE.LIVE : GPS_STATE.EXPIRED;
}

/**
 * Avalia se o aluno que está transmitindo GPS deve ceder e desligar sua transmissão
 * porque o motorista iniciou sua telemetria oficial.
 * @param {Object} params
 * @param {Object} params.trip - Objeto da viagem atual
 * @param {string} [params.gpsState] - Estado do GPS resolvido
 * @param {number} [params.now=Date.now()]
 * @returns {boolean}
 */
export function shouldStudentBroadcastYield({ trip, gpsState = null, now = Date.now() }) {
  if (!trip) return false;

  const isDriverProvider = trip.locationProviderRole === 'driver';
  const hasCoords = Boolean(trip.busLocation?.lat && trip.busLocation?.lng);
  const isFresh =
    !trip.locationUpdatedAt || now - trip.locationUpdatedAt < GPS_STALE_MS;

  const isDriverActive = isDriverProvider && hasCoords && isFresh;

  return isDriverActive || gpsState === GPS_STATE.LIVE || gpsState === GPS_STATE.STALE;
}

/**
 * Formata o rótulo de tempo decorrido para exibição no marcador do ônibus/van.
 * @param {string} gpsState
 * @param {number|null} locationUpdatedAt
 * @param {number} [now=Date.now()]
 * @returns {string}
 */
export function formatGpsElapsedLabel(gpsState, locationUpdatedAt, now = Date.now()) {
  if (gpsState === GPS_STATE.LIVE) return '';
  if (gpsState === GPS_STATE.PAUSED) return 'PAUSADO';
  if (!locationUpdatedAt) return 'SEM SINAL';

  const seconds = Math.round((now - locationUpdatedAt) / 1000);
  if (seconds < 60) return `HÁ ${Math.max(1, seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `HÁ ${minutes}min`;
  return `HÁ ${Math.floor(minutes / 60)}h`;
}

