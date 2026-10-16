/**
 * Serviço de Operações Geoespaciais e Georreferenciamento do Sistema Rhyme
 * Conforme ISO/IEC/IEEE 12207:2017 - Processo 6.4.7 (Construção de Software)
 */

export const CENTER = [-16.6869, -49.2643]; // Goiânia centro

export const MOCK_FACULTIES = {
  UFG: [-16.603568359752572, -49.26557447462434],
  'UFG - Campus Colemar': [-16.676109190074012, -49.24516058049558],
  PUC: [-16.67475162780121, -49.24209015441784],
  IFG: [-16.665844796098604, -49.25484595828902],
  UNIP: [-16.71913305820549, -49.23738118914336],
  FASAM: [-16.72238689347141, -49.23657627622922],
  Estácio: [-16.661400045241248, -49.261822432566476],
  Unicamps: [-16.675166089095736, -49.28430043030609],
  Eseffego: [-16.667398357525514, -49.242543618586815],
  'Colégio Vitória': [-16.672587769018502, -49.252661376350915],
  Outra: [-16.675707046574686, -49.24547515495722], // Praça Universitária
};

/**
 * Retorna as coordenadas [lat, lng] da faculdade do aluno.
 * Prioridade: 1) facultyLocation customizado no perfil, 2) MOCK_FACULTIES, 3) Praça Universitária (fallback)
 * @param {object} studentObj
 * @returns {[number, number]}
 */
export function getFacultyCoords(studentObj) {
  if (studentObj?.facultyLocation?.lat != null) {
    return [studentObj.facultyLocation.lat, studentObj.facultyLocation.lng];
  }
  return MOCK_FACULTIES[studentObj?.faculty] || MOCK_FACULTIES['Outra'];
}

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
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    Number.isNaN(Number(lat1)) ||
    Number.isNaN(Number(lon1)) ||
    Number.isNaN(Number(lat2)) ||
    Number.isNaN(Number(lon2))
  )
    return Infinity;
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

/**
 * Calcula a menor diferença angular entre dois ângulos (-180° a +180°)
 * Evita o 'giro completo' na transição 359° <-> 0°
 * @param {number} target
 * @param {number} current
 * @returns {number}
 */
export function shortestAngleDiff(target, current) {
  return ((((target - current) % 360) + 540) % 360) - 180;
}

/**
 * Obtém o ângulo de rotação da tela em graus (0, 90, 180, 270)
 * @returns {number}
 */
export function getScreenOrientationAngle() {
  if (typeof window !== 'undefined') {
    if (window.screen?.orientation?.angle !== undefined) {
      return window.screen.orientation.angle;
    }
    if (typeof window.orientation === 'number') {
      return (window.orientation + 360) % 360;
    }
  }
  return 0;
}

/**
 * Calcula o rumo (heading em graus 0-360) com compensação de inclinação (tilt compensation).
 * Usa os ângulos de Euler (alpha, beta, gamma) da DeviceOrientationEvent
 * e aplica matriz de rotação 3D para obter o norte verdadeiro independentemente
 * da inclinação do smartphone em relação ao plano horizontal.
 *
 * @param {number} alpha - Rotação Z (0-360°)
 * @param {number} beta  - Inclinação X frente/trás (-180 a 180°)
 * @param {number} gamma - Inclinação Y esquerda/direita (-90 a 90°)
 * @param {number} [screenAngle=0] - Ângulo de rotação da tela (ex: window.screen.orientation.angle)
 * @returns {number} Rumo em graus [0, 360)
 */
export function computeTiltCompensatedHeading(alpha, beta, gamma, screenAngle = 0) {
  const toRad = Math.PI / 180;
  const aR = (alpha || 0) * toRad;
  const bR = (beta || 0) * toRad;
  const gR = (gamma || 0) * toRad;

  const cA = Math.cos(aR);
  const sA = Math.sin(aR);
  const cB = Math.cos(bR);
  const sB = Math.sin(bR);
  const cG = Math.cos(gR);
  const sG = Math.sin(gR);

  // Se o dispositivo estiver perfeitamente plano sobre a mesa, o rumo é diretamente o alpha
  if (Math.abs(bR) < 1e-6 && Math.abs(gR) < 1e-6) {
    let heading = alpha || 0;
    heading = (heading + (screenAngle || 0) + 360) % 360;
    return heading;
  }

  // Componentes do vetor norte projetado no plano do dispositivo
  const rA = -cA * sG - sA * sB * cG;
  const rB = -sA * sG + cA * sB * cG;

  let heading = Math.atan2(rA, rB) * (180 / Math.PI);
  if (heading < 0) heading += 360;

  heading = (heading + (screenAngle || 0) + 360) % 360;
  return heading;
}
