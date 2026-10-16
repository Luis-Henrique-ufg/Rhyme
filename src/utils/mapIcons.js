/**
 * @file mapIcons.js
 * @module utils/mapIcons
 * @description Fábrica de ícones customizados do Leaflet para o mapa interativo (ônibus, van,
 * faculdades, alunos, pedestres e POIs) e definições de camadas de tiles Mapbox.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import L from 'leaflet';

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
export const TILE_DAY = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
export const TILE_NIGHT = `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
export const TILE_ATTR_DAY = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';
export const TILE_ATTR_NIGHT = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';

/**
 * Ícone do motorista (Van / Ônibus) — estilo Uber, adapta ao horário e estado do sinal de GPS.
 * gpsState: 'live' | 'stale' | 'expired' | 'paused'
 */
export const createBusIcon = (isCrominia, isDark = true, gpsState = 'live', elapsedLabel = '') => {
  const night = isDark;
  const isLive = gpsState === 'live';
  const isStale = gpsState === 'stale';
  const isDead = gpsState === 'expired' || gpsState === 'paused';

  let label;
  if (isCrominia) {
    label = isLive
      ? 'ÔNIBUS (AO VIVO)'
      : isDead
        ? `ÔNIBUS (${elapsedLabel || 'SEM SINAL'})`
        : 'ÔNIBUS (PARADO)';
  } else {
    label = isLive
      ? 'VAN (AO VIVO)'
      : isDead
        ? `VAN (${elapsedLabel || 'SEM SINAL'})`
        : 'VAN (PARADA)';
  }

  let bgColor, borderColor, iconColor, wheelColor, opacity;

  if (isDead) {
    bgColor = night ? '#3f3f46' : '#a1a1aa';
    borderColor = night ? '#52525b' : '#d4d4d8';
    iconColor = night ? '#a1a1aa' : '#ffffff';
    wheelColor = night ? '#71717a' : '#e4e4e7';
    opacity = 0.55;
  } else if (isStale) {
    bgColor = isCrominia ? (night ? '#d4a017' : '#92400e') : '#d97706';
    borderColor = night ? '#78350f' : '#fef3c7';
    iconColor = '#ffffff';
    wheelColor = '#fef3c7';
    opacity = 0.85;
  } else {
    bgColor = isCrominia ? (night ? '#ffffff' : '#18181b') : '#f97316';
    borderColor = isCrominia ? (night ? '#111' : '#f4f4f5') : night ? '#111' : '#fff7ed';
    iconColor = isCrominia ? (night ? '#111' : '#f4f4f5') : '#ffffff';
    wheelColor = isCrominia ? (night ? '#f4f4f5' : '#111') : '#111';
    opacity = 1;
  }

  const pulseColor = isCrominia ? (night ? '#818cf8' : '#6366f1') : '#f97316';
  const pulseBg = isCrominia
    ? night
      ? 'rgba(129,140,248,0.25)'
      : 'rgba(99,102,241,0.25)'
    : 'rgba(249,115,22,0.25)';
  const pulseShadow = isCrominia
    ? night
      ? 'rgba(129,140,248,0.45)'
      : 'rgba(99,102,241,0.45)'
    : 'rgba(249,115,22,0.45)';

  const tagColor = isLive
    ? isCrominia
      ? night
        ? '#f4f4f5'
        : '#18181b'
      : '#f97316'
    : isDead
      ? night
        ? '#a1a1aa'
        : '#71717a'
      : '#d97706';
  const tagBorder = isLive
    ? isCrominia
      ? night
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)'
      : 'rgba(249,115,22,0.4)'
    : isDead
      ? night
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.06)'
      : 'rgba(217,119,6,0.4)';

  const pulseRing = isLive
    ? `
    <div style="
      position: absolute; inset: 0; width: 48px; height: 48px;
      border-radius: 50%; border: 2.5px solid ${pulseColor};
      background: radial-gradient(circle, ${pulseBg} 0%, transparent 70%);
      box-shadow: 0 0 16px ${pulseShadow};
      animation: radarPulse 2.4s ease-out infinite;
      pointer-events: none; z-index: 1;
    "></div>
    <div style="
      position: absolute; inset: 0; width: 48px; height: 48px;
      border-radius: 50%; border: 2px solid ${pulseColor};
      background: radial-gradient(circle, ${pulseBg} 0%, transparent 70%);
      box-shadow: 0 0 12px ${pulseShadow};
      animation: radarPulse 2.4s ease-out 1.2s infinite;
      pointer-events: none; z-index: 1;
    "></div>
  `
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:${opacity};">
        <div style="
          background: ${night ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.96)'};
          color: ${tagColor};
          font-size: 10px; font-weight: 800;
          font-family: Inter, system-ui, sans-serif;
          padding: 2px 7px; border-radius: 6px; white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,${night ? '0.5' : '0.15'});
          border: 1px solid ${tagBorder};
          margin-bottom: 4px; letter-spacing: 0.02em; text-transform: uppercase;
          z-index: 3;
        ">${label}</div>
        <div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
          ${pulseRing}
          <div style="
            width:48px; height:48px; background:${bgColor}; border-radius:50%;
            border: 3.5px solid ${borderColor};
            box-shadow: 0 6px 20px rgba(0,0,0,${night ? '0.6' : '0.2'});
            display:flex; align-items:center; justify-content:center; color:${iconColor};
            position:relative; z-index:2;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2"></path>
              <circle cx="9" cy="17" r="2" stroke="currentColor" fill="${wheelColor}" stroke-width="1.5"></circle>
              <path d="M11 17h4"></path>
              <circle cx="17" cy="17" r="2" stroke="currentColor" fill="${wheelColor}" stroke-width="1.5"></circle>
            </svg>
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [48, 80],
    iconAnchor: [24, 80],
  });
};

/**
 * Ícone de faculdade — estilo BANDEIRA
 */
export const createFacultyIcon = (name, isCrominia, isDark = true) => {
  const night = isDark;
  const accent = isCrominia ? (isDark ? '#a1a1aa' : '#64748b') : '#f97316';
  const shadow = night ? '0 4px 16px rgba(0,0,0,0.7)' : '0 3px 12px rgba(0,0,0,0.28)';
  const poleH = 22;
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none;">
        <div style="display:flex;flex-direction:row;align-items:flex-start;">
          <div style="width:3px;height:${poleH + 22}px;background:${accent};border-radius:2px;box-shadow:${shadow};"></div>
          <div style="
            background:${accent};
            color:${night ? '#111' : '#fff'};
            font-size:10px;font-weight:800;
            font-family:Inter,system-ui,sans-serif;
            padding:3px 8px 3px 6px;
            border-radius:0 6px 6px 0;
            white-space:nowrap;
            max-width:120px;
            overflow:hidden;text-overflow:ellipsis;
            letter-spacing:-0.01em;
            box-shadow:${shadow};
            margin-top:4px;
          ">${name}</div>
        </div>
        <div style="width:7px;height:7px;background:${accent};border-radius:50%;margin-left:-2px;margin-top:-2px;box-shadow:${shadow};"></div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [140, poleH + 32],
    iconAnchor: [3, poleH + 32],
  });
};

/**
 * Ícone para ajuste manual de localização
 */
export const createAdjustmentPinIcon = (name = 'Novo Ponto', isDark = true) => {
  const night = isDark;
  const labelBg = night ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.96)';
  const labelText = night ? '#f4f4f5' : '#18181b';
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="
          background:${labelBg};
          color:${labelText};
          font-size:10px;font-weight:800;
          font-family:Inter,system-ui,sans-serif;
          padding:2px 8px;border-radius:8px;white-space:nowrap;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          border:1.5px solid #f97316;
          margin-bottom:6px;
        ">${name}</div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;
            width:42px;height:42px;
            border-radius:50%;
            background:rgba(249,115,22,0.25);
            border:1.5px solid rgba(249,115,22,0.6);
            animation:studentHalo 2s ease-out infinite;
          "></div>
          <div style="
            width:26px;height:26px;
            border-radius:50%;
            background:linear-gradient(135deg, #f97316, #ea580c);
            border:2.5px solid #ffffff;
            box-shadow:0 4px 14px rgba(249,115,22,0.5);
            display:flex;align-items:center;justify-content:center;
            color:white;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [42, 60],
    iconAnchor: [21, 52],
  });
};

/**
 * Marcador de Aluno/Passageiro
 */
export const createStudentMapIcon = (name, isMe, isLiberado, isSoIda, isDark = true) => {
  const night = isDark;
  let bg = '#10b981';
  let haloBg = 'rgba(16, 185, 129, 0.22)';
  let haloBorder = 'rgba(16, 185, 129, 0.5)';
  let roleLabel = name || '';

  if (isSoIda) {
    bg = '#71717a';
    haloBg = 'transparent';
    haloBorder = 'transparent';
  } else if (isMe && !isLiberado) {
    bg = '#2563eb';
    haloBg = 'rgba(37, 99, 235, 0.25)';
    haloBorder = 'rgba(37, 99, 235, 0.55)';
    roleLabel = 'Você';
  } else if (isMe && isLiberado) {
    bg = '#10b981';
    haloBg = 'rgba(16, 185, 129, 0.28)';
    haloBorder = 'rgba(16, 185, 129, 0.65)';
    roleLabel = 'Você (Liberado)';
  }

  const borderCol = night ? '#18181b' : '#ffffff';
  const labelBg = night ? 'rgba(15,15,15,0.94)' : 'rgba(255,255,255,0.96)';
  const labelText = night ? '#f4f4f5' : '#18181b';

  const haloHtml =
    !isSoIda && (isLiberado || isMe)
      ? `
    <div style="
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 1.5px solid ${haloBorder};
      background: ${haloBg};
      animation: studentHalo 2.5s ease-out infinite;
      pointer-events: none;
      z-index: 1;
    "></div>
  `
      : '';

  const userSvg = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  `;

  const labelHtml = roleLabel
    ? `
    <div style="
      background: ${labelBg};
      color: ${labelText};
      font-size: 9.5px;
      font-weight: 700;
      font-family: Inter, system-ui, sans-serif;
      padding: 1px 6px;
      border-radius: 5px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,${night ? '0.6' : '0.15'});
      border: 1px solid ${night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      margin-bottom: 3px;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 3;
    ">${roleLabel}</div>
  `
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        ${labelHtml}
        <div style="position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center;">
          ${haloHtml}
          <div style="
            width: 26px;
            height: 26px;
            background: ${bg};
            border-radius: 50%;
            border: 2px solid ${borderCol};
            box-shadow: 0 3px 10px rgba(0,0,0,${night ? '0.6' : '0.25'}), 0 0 0 1px ${bg}44;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
          ">
            ${userSvg}
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [26, roleLabel ? 48 : 26],
    iconAnchor: [13, roleLabel ? 34 : 13],
  });
};

/**
 * Ícone do pedestre
 */
export const createPedestrianIcon = (isDark = true, isLiberado = false) => {
  const night = isDark;
  const labelBg = night ? 'rgba(15,15,15,0.94)' : 'rgba(255,255,255,0.96)';
  const labelText = night ? '#f4f4f5' : '#18181b';
  const mainColor = isLiberado ? '#10b981' : '#f97316';
  const haloBg = isLiberado ? 'rgba(16, 185, 129, 0.25)' : 'rgba(249,115,22,0.22)';
  const haloBorder = isLiberado ? 'rgba(16, 185, 129, 0.65)' : 'rgba(249,115,22,0.65)';
  const roleLabel = isLiberado ? 'Você (Liberado)' : 'Você';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="
          background: ${labelBg};
          color: ${labelText};
          font-size: 9.5px;
          font-weight: 800;
          font-family: Inter, system-ui, sans-serif;
          padding: 1.5px 7px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,${night ? '0.6' : '0.18'});
          border: 1px solid ${night ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'};
          margin-bottom: 3px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 3.5px;
        ">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: ${mainColor}; display: inline-block; box-shadow: 0 0 6px ${mainColor};"></span>
          <span>${roleLabel}</span>
        </div>

        <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;
            inset:-3px;
            border-radius:50%;
            background:${haloBg};
            border:1.5px solid ${haloBorder};
            animation:studentHalo 2.2s ease-out infinite;
          "></div>
          <div style="
            width:26px;height:26px;
            border-radius:50%;
            background:${mainColor};
            border:2px solid #ffffff;
            box-shadow:0 3px 10px rgba(0,0,0,${night ? '0.6' : '0.25'}), 0 0 0 1px rgba(16,185,129,0.3);
            display:flex;align-items:center;justify-content:center;
            color:#ffffff;
            position:relative;
            z-index:2;
          ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [60, 50],
    iconAnchor: [30, 36],
  });
};

/**
 * Ícone de POI no campus
 */
export const createCampusPoiIcon = (name, type = 'building', isSelected = false, isDark = true) => {
  if (!isSelected) {
    return L.divIcon({
      html: `<div style="width: 38px; height: 38px; cursor: pointer; background: transparent;" title="${name}"></div>`,
      className: 'bg-transparent border-none',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        <div style="
          background:#f97316;
          color:#000000;
          font-size:10px;
          font-weight:800;
          font-family:Inter,system-ui,sans-serif;
          padding:3px 9px;
          border-radius:8px;
          white-space:nowrap;
          box-shadow:0 4px 14px rgba(249,115,22,0.4);
          border:1.5px solid #ffffff;
          margin-bottom:4px;
          max-width:180px;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${name}</div>
        <div style="
          width:30px;
          height:30px;
          border-radius:50%;
          background:#ffffff;
          border:2.5px solid #f97316;
          box-shadow:0 4px 12px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:#f97316;
          transition:all 0.2s;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [180, 56],
    iconAnchor: [90, 42],
  });
};

/**
 * Ícone de destino personalizado
 */
export const createCustomDestinationIcon = (
  distanceLabel = '',
  durationMinutes = null,
  isDark = true
) => {
  const durationText = durationMinutes ? ` (~${durationMinutes}min)` : '';
  const label = distanceLabel ? `Destino • ${distanceLabel}${durationText}` : 'Destino';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;width:180px;pointer-events:auto;">
        <div style="
          background:#f97316;
          color:#000000;
          font-size:10px;
          font-weight:800;
          font-family:Inter,system-ui,sans-serif;
          padding:3px 9px;
          border-radius:8px;
          white-space:nowrap;
          box-shadow:0 4px 14px rgba(249,115,22,0.45);
          border:1.5px solid #ffffff;
          margin-bottom:3px;
          max-width:175px;
          overflow:hidden;
          text-overflow:ellipsis;
          display:flex;
          align-items:center;
          gap:4px;
        ">
          <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#000000;"></span>
          <span>${label}</span>
        </div>

        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
            <path d="M14 1C6.82 1 1 6.82 1 14c0 9.8 13 19 13 19s13-9.2 13-19c0-7.18-5.82-13-13-13z" fill="#f97316" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
            <circle cx="14" cy="14" r="2.5" fill="#f97316"/>
          </svg>

          <div style="
            position:absolute;
            bottom:-2px;
            width:12px;
            height:4px;
            border-radius:50%;
            background:rgba(0,0,0,0.35);
            filter:blur(1px);
          "></div>
          <div style="
            position:absolute;
            bottom:-5px;
            width:16px;
            height:8px;
            border-radius:50%;
            border:1.5px solid rgba(249,115,22,0.6);
            animation:studentHalo 2s ease-out infinite;
            pointer-events:none;
          "></div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [180, 64],
    iconAnchor: [90, 61],
  });
};

/**
 * Ícone de local pesquisado no mapa
 */
export const createSearchedPlaceIcon = (name) => {
  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 160px; pointer-events: none;">
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            top: 0; left: 0;
            width: 36px; height: 36px;
            border-radius: 50%;
            border: 2.5px solid #f97316;
            background: radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%);
            box-shadow: 0 0 16px rgba(249,115,22,0.6);
            animation: radarPulse 2.2s cubic-bezier(0.1, 0.5, 0.3, 1) infinite;
            transform-origin: center center;
            pointer-events: none;
          "></div>

          <div style="
            position: absolute;
            top: 0; left: 0;
            width: 36px; height: 36px;
            border-radius: 50%;
            border: 2px solid #fb923c;
            background: radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%);
            animation: radarPulse 2.2s cubic-bezier(0.1, 0.5, 0.3, 1) 1.1s infinite;
            transform-origin: center center;
            pointer-events: none;
          "></div>

          <div style="
            position: relative; z-index: 10;
            width: 34px; height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #f59e0b);
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35), 0 0 12px rgba(249,115,22,0.5);
            display: flex; align-items: center; justify-content: center;
            color: #000000;
          ">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>

        <div style="
          margin-top: 5px;
          background: rgba(15, 15, 15, 0.94);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          font-family: Outfit, Inter, system-ui, sans-serif;
          padding: 3px 10px;
          border-radius: 9999px;
          border: 1.5px solid rgba(249, 115, 22, 0.5);
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          white-space: nowrap;
          max-width: 155px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 12;
          pointer-events: auto;
        ">
          ${name}
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [160, 65],
    iconAnchor: [80, 18],
  });
};

/**
 * Cria cluster marker estilo Uber: círculo com contagem e label acima
 */
export const createCustomIcon = (liberados, total, label, isCrominia, isDark = true) => {
  const isComplete = total === undefined ? false : liberados === total && total > 0;
  const accentColor = isCrominia ? (isDark ? '#27272a' : '#475569') : '#f97316';
  const badgeColor = isComplete ? '#16a34a' : accentColor;
  const night = isDark;

  const containerStyle = `
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  `;

  const labelHtml = label
    ? `
    <div style="
      background: ${night ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.96)'};
      color: ${night ? '#f4f4f5' : '#18181b'};
      font-size: 11px;
      font-weight: 700;
      font-family: Inter, system-ui, sans-serif;
      padding: 3px 8px;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,${night ? '0.5' : '0.15'});
      border: 1px solid ${night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
      margin-bottom: 4px;
      letter-spacing: -0.01em;
    ">${label}</div>
  `
    : '';

  const circleStyle = `
    width: 40px;
    height: 40px;
    background: ${night ? '#111' : '#ffffff'};
    border-radius: 50%;
    border: 3px solid ${badgeColor};
    box-shadow: 0 4px 12px rgba(0,0,0,${night ? '0.5' : '0.15'}), 0 0 0 1px ${badgeColor}22;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: ${night ? '#fff' : '#18181b'};
  `;

  return L.divIcon({
    html: `
      <div style="${containerStyle}">
        ${labelHtml}
        <div style="${circleStyle}">
          <span style="font-weight: 900; font-size: 14px; color: ${badgeColor}; ${total !== undefined ? 'margin-bottom: -3px;' : ''}">${liberados}</span>
          ${total !== undefined ? `<span style="font-size: 9px; opacity: 0.6; color: ${night ? '#a1a1aa' : '#52525b'};">/${total}</span>` : ''}
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [40, label ? 66 : 40],
    iconAnchor: [20, label ? 66 : 40],
  });
};

/**
 * Marcador de Passageiro visto pelo motorista
 */
export const createDriverStudentIcon = (
  name,
  isLiberado,
  isSoIda,
  response = null,
  totalInCluster = 1,
  isDark = true,
  isNextStop = false
) => {
  const night = isDark;
  const isComing = response === 'coming';

  let bg = '#f59e0b';
  let haloBg = 'transparent';
  let haloBorder = 'transparent';
  let showHalo = false;

  if (isSoIda) {
    bg = '#71717a';
  } else if (isComing) {
    bg = '#0ea5e9';
    haloBg = 'rgba(14, 165, 233, 0.25)';
    haloBorder = 'rgba(14, 165, 233, 0.7)';
    showHalo = true;
  } else if (isLiberado) {
    bg = '#10b981';
    haloBg = 'rgba(16, 185, 129, 0.25)';
    haloBorder = 'rgba(16, 185, 129, 0.7)';
    showHalo = true;
  } else if (isNextStop) {
    bg = '#f59e0b';
    haloBg = 'rgba(245, 158, 11, 0.22)';
    haloBorder = 'rgba(245, 158, 11, 0.7)';
    showHalo = true;
  }

  const borderCol = night ? '#18181b' : '#ffffff';
  const labelBg = night ? 'rgba(15,15,15,0.94)' : 'rgba(255,255,255,0.96)';
  const labelText = night ? '#f4f4f5' : '#18181b';

  const haloHtml = showHalo
    ? `
    <div style="
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: ${isNextStop ? '2px' : '1.5px'} solid ${haloBorder};
      background: ${haloBg};
      animation: studentHalo ${isNextStop ? '2.1s' : '2.5s'} ease-out infinite;
      box-shadow: 0 0 ${isNextStop ? '12px' : '6px'} ${haloBorder};
      pointer-events: none;
      z-index: 1;
    "></div>
    ${
      isNextStop
        ? `
      <div style="
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        border: 1.5px solid ${haloBorder};
        background: transparent;
        animation: studentHalo 2.1s ease-out 1.05s infinite;
        pointer-events: none;
        z-index: 1;
      "></div>
    `
        : ''
    }
  `
    : '';

  const userSvg = isComing
    ? `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `
    : `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  `;

  const countBadge =
    totalInCluster > 1
      ? `
    <span style="
      position: absolute;
      top: -4px;
      right: -6px;
      background: ${night ? '#27272a' : '#18181b'};
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      padding: 1px 4.5px;
      border-radius: 9999px;
      border: 1.5px solid ${borderCol};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 4;
      line-height: 1.1;
    ">+${totalInCluster - 1}</span>
  `
      : '';

  const labelHtml = name
    ? `
    <div style="
      background: ${labelBg};
      color: ${labelText};
      font-size: 9.5px;
      font-weight: 700;
      font-family: Inter, system-ui, sans-serif;
      padding: 1px 6px;
      border-radius: 5px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,${night ? '0.6' : '0.15'});
      border: 1px solid ${night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};
      margin-bottom: 3px;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 3;
    ">${name}</div>
  `
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        ${labelHtml}
        <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          ${haloHtml}
          ${countBadge}
          <div style="
            width: 28px;
            height: 28px;
            background: ${bg};
            border-radius: 50%;
            border: 2px solid ${borderCol};
            box-shadow: 0 3px 10px rgba(0,0,0,${night ? '0.6' : '0.25'}), 0 0 0 1px ${bg}44;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
          ">
            ${userSvg}
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [28, name ? 50 : 28],
    iconAnchor: [14, name ? 36 : 14],
  });
};

/**
 * Halo de Proximidade animado
 */
export const createHaloIcon = (isCrominia, customColor = null) => {
  const baseColor = customColor || (isCrominia ? '#6366f1' : '#f97316');
  return L.divIcon({
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2.5px solid ${baseColor};
          background: radial-gradient(circle, ${baseColor}33 0%, transparent 70%);
          animation: radarPulse 2s cubic-bezier(0.1, 0.5, 0.3, 1) infinite;
        "></div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

/**
 * Detecta modo dia/noite para alternar tile do mapa automaticamente.
 */
export function isNightTime() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

/**
 * Marcador simplificado para pino de estudante
 */
export const createStudentPinIcon = (name, isCrominia, isDark = true, isSoIda = false) => {
  return createDriverStudentIcon(name, false, isSoIda, null, 1, isDark, false);
};
