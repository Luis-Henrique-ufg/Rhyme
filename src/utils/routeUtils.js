/**
 * Utilitários e Normalização de Rotas do Sistema Rhyme
 */

/**
 * Normaliza strings de rotas para lidar com dados inconsistentes ou variações de digitação.
 * Ex: 'professor_jamil' -> 'Professor Jamil'
 *     'crominia' -> 'Cromínia'
 *     'hidrolandia' -> 'Hidrolândia'
 *
 * @param {string} route Nome da rota a ser normalizada
 * @returns {string} Nome padronizado da rota
 */
export function normalizeRoute(route) {
  if (!route) return '';
  const r = String(route).trim();
  if (r.toLowerCase().includes('jamil')) return 'Professor Jamil';
  if (r.toLowerCase().includes('crom')) return 'Cromínia';
  if (r.toLowerCase().includes('hidrol')) return 'Hidrolândia';
  return r;
}
