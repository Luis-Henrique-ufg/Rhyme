/**
 * Utilitários Geoespaciais do Sistema Rhyme
 */

/**
 * Função de Haversine para calcular a distância em KM entre duas coordenadas geográficas.
 * Utilizada para geofencing (ex: alerta de proximidade < 1km) e métricas de rota.
 *
 * @param {number} lat1 Latitude do ponto 1
 * @param {number} lon1 Longitude do ponto 1
 * @param {number} lat2 Latitude do ponto 2
 * @param {number} lon2 Longitude do ponto 2
 * @returns {number} Distância em quilômetros
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371; // Raio aproximado da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Verifica se um ponto está dentro do raio de tolerância de outro (padrão 1.0 km).
 *
 * @param {number} lat1 Latitude de referência
 * @param {number} lon1 Longitude de referência
 * @param {number} lat2 Latitude alvo
 * @param {number} lon2 Longitude alvo
 * @param {number} [radiusKm=1.0] Raio máximo em km
 * @returns {boolean}
 */
export function isWithinRadius(lat1, lon1, lat2, lon2, radiusKm = 1.0) {
  return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) <= radiusKm;
}
