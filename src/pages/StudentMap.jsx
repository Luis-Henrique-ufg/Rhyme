import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Users, Check, RefreshCcw, MapPin, Navigation, LocateFixed, X, Radio, BellRing, Bus, Footprints, School, Volume2, Compass, Crosshair } from 'lucide-react';
import { doc, collection, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../config/firebase';
import { joinTrip, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useTripAttendances, useOsrmEta } from '../utils/useTripData';
import Header from '../components/Header';
import GpsStatusBanner from '../components/GpsStatusBanner';
import BoardingCallModal from '../components/BoardingCallModal';
import PublicListModal from '../components/PublicListModal';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MapInteractions from '../components/MapInteractions';
import WakeUpAlarmModal from '../components/WakeUpAlarmModal';
import WakeUpSettingsModal from '../components/WakeUpSettingsModal';
import CampusModeHUD, { CAMPUS_POIS } from '../components/CampusModeHUD';
import MapSearchBar from '../components/MapSearchBar';
import SearchedPlaceCard from '../components/SearchedPlaceCard';
import LocationPickerMap from '../components/LocationPickerMap';
import ReactDOM from 'react-dom';
import { useCustomAlert } from '../contexts/AlertContext';
import { playNotificationSound, playBoardingAlarmSound, playTapSound, playToggleSound, playPopSound, playSuccessSound, triggerHaptic } from '../utils/audioEffects';
import { useFCM } from '../hooks/useFCM';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import L from 'leaflet';

// Correção para os ícones padrão do Leaflet no React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// URLs dos tiles para dia (CartoDB Positron) e noite (CartoDB Dark)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const TILE_DAY = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
const TILE_NIGHT = `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
const TILE_ATTR_DAY = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';
const TILE_ATTR_NIGHT = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';

// Ícone do motorista (Van / Ônibus) — estilo Uber, adapta ao horário e estado do sinal de GPS
// gpsState: 'live' | 'stale' | 'expired' | 'paused'  — controla cor, opacidade e radar
const createBusIcon = (isCrominia, isDark = true, gpsState = 'live', elapsedLabel = '') => {
  const night = isDark;
  const isLive    = gpsState === 'live';
  const isStale   = gpsState === 'stale';
  const isDead    = gpsState === 'expired' || gpsState === 'paused';

  // --- Rótulo da tag acima do ícone ---
  let label;
  if (isCrominia) {
    label = isLive ? 'ÔNIBUS (AO VIVO)' : isDead ? `ÔNIBUS (${elapsedLabel || 'SEM SINAL'})` : 'ÔNIBUS (PARADO)';
  } else {
    label = isLive ? 'VAN (AO VIVO)' : isDead ? `VAN (${elapsedLabel || 'SEM SINAL'})` : 'VAN (PARADA)';
  }

  // --- Cores do corpo do ícone ---
  let bgColor, borderColor, iconColor, wheelColor, opacity;

  if (isDead) {
    // Expirado / pausado: cinza translúcido
    bgColor     = night ? '#3f3f46' : '#a1a1aa';
    borderColor = night ? '#52525b' : '#d4d4d8';
    iconColor   = night ? '#a1a1aa' : '#ffffff';
    wheelColor  = night ? '#71717a' : '#e4e4e7';
    opacity     = 0.55;
  } else if (isStale) {
    // Sinal fraco/parado: âmbar fosco
    bgColor     = isCrominia ? (night ? '#d4a017' : '#92400e') : '#d97706';
    borderColor = night ? '#78350f' : '#fef3c7';
    iconColor   = '#ffffff';
    wheelColor  = '#fef3c7';
    opacity     = 0.85;
  } else {
    // Ao vivo: laranja vibrante normal
    bgColor     = isCrominia ? (night ? '#ffffff' : '#18181b') : '#f97316';
    borderColor = isCrominia ? (night ? '#111' : '#f4f4f5') : (night ? '#111' : '#fff7ed');
    iconColor   = isCrominia ? (night ? '#111' : '#f4f4f5') : '#ffffff';
    wheelColor  = isCrominia ? (night ? '#f4f4f5' : '#111') : '#111';
    opacity     = 1;
  }

  // --- Cor do radar (apenas live) ---
  const pulseColor  = isCrominia ? (night ? '#818cf8' : '#6366f1') : '#f97316';
  const pulseBg     = isCrominia
    ? (night ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.25)')
    : 'rgba(249,115,22,0.25)';
  const pulseShadow = isCrominia
    ? (night ? 'rgba(129,140,248,0.45)' : 'rgba(99,102,241,0.45)')
    : 'rgba(249,115,22,0.45)';

  // --- Tag: cor e borda ---
  const tagColor  = isLive
    ? (isCrominia ? (night ? '#f4f4f5' : '#18181b') : '#f97316')
    : isDead ? (night ? '#a1a1aa' : '#71717a')
    : '#d97706';
  const tagBorder = isLive
    ? (isCrominia ? (night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'rgba(249,115,22,0.4)')
    : isDead ? (night ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
    : 'rgba(217,119,6,0.4)';

  // --- Radar sonar pulsante (apenas live) ---
  const pulseRing = isLive ? `
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
  ` : '';

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
    iconAnchor: [24, 80]
  });
};

// Ícone de faculdade — estilo BANDEIRA: completamente diferente dos POIs circulares do Mapbox
const createFacultyIcon = (name, isCrominia, isDark = true) => {
  const night = isDark;
  const accent = isCrominia ? (isDark ? '#a1a1aa' : '#64748b') : '#f97316';
  const textColor = night ? '#f4f4f5' : '#18181b';
  const labelBg = night ? 'rgba(10,10,10,0.96)' : 'rgba(255,255,255,0.98)';
  const borderCol = night ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
  const shadow = night ? '0 4px 16px rgba(0,0,0,0.7)' : '0 3px 12px rgba(0,0,0,0.28)';
  // Pole height
  const poleH = 22;
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none;">
        <!-- Flag banner attached to a vertical pole -->
        <div style="display:flex;flex-direction:row;align-items:flex-start;">
          <!-- Pole -->
          <div style="width:3px;height:${poleH + 22}px;background:${accent};border-radius:2px;box-shadow:${shadow};"></div>
          <!-- Flag -->
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
        <!-- Base dot -->
        <div style="width:7px;height:7px;background:${accent};border-radius:50%;margin-left:-2px;margin-top:-2px;box-shadow:${shadow};"></div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [140, poleH + 32],
    iconAnchor: [3, poleH + 32]
  });
};

// Ícone para ajuste manual de localização (Ponto circular moderno com halo pulsante, sem formato de gota)
const createAdjustmentPinIcon = (name = 'Novo Ponto', isDark = true) => {
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
    iconAnchor: [21, 52]
  });
};

// Marcador de Aluno/Passageiro — completamente diferenciado da Van (avatar de pessoa, cores azul/verde/cinza, sem radar de veículo)
const createStudentMapIcon = (name, isMe, isLiberado, isSoIda, isDark = true) => {
  const night = isDark;

  // Paleta de passageiro:
  // - Você: Azul Real (#2563eb / #3b82f6) padrão GPS mundial (Google Maps / Uber)
  // - Liberado: Verde Esmeralda (#10b981) indicando "pronto para embarque"
  // - Só Ida: Cinza Neutro (#71717a)
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
  const labelBg = night ? 'rgba(15,15,15,0.94)' : 'rgba(255,255,255,0.96)' ;
  const labelText = night ? '#f4f4f5' : '#18181b';

  // Halo suave apenas para status liberado ou localização própria
  const haloHtml = (!isSoIda && (isLiberado || isMe)) ? `
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
  ` : '';

  // Silhueta de pessoa / estudante (Avatar)
  const userSvg = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  `;

  const labelHtml = roleLabel ? `
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
  ` : '';

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
    iconAnchor: [13, roleLabel ? 34 : 13]
  });
};

const MOCK_FACULTIES = {
  'UFG': [-16.603568359752572, -49.26557447462434],
  'UFG - Campus Colemar': [-16.676109190074012, -49.24516058049558],
  'PUC': [-16.67475162780121, -49.24209015441784],
  'IFG': [-16.665844796098604, -49.25484595828902],
  'UNIP': [-16.71913305820549, -49.23738118914336],
  'FASAM': [-16.72238689347141, -49.23657627622922],
  'Estácio': [-16.661400045241248, -49.261822432566476],
  'Unicamps': [-16.675166089095736, -49.28430043030609],
  'Eseffego': [-16.667398357525514, -49.242543618586815],
  'Colégio Vitória': [-16.672587769018502, -49.252661376350915],
  'Outra': [-16.675707046574686, -49.24547515495722] // Praça Universitária
};

/**
 * Retorna as coordenadas [lat, lng] da faculdade do aluno.
 * Prioridade: 1) facultyLocation customizado no perfil, 2) MOCK_FACULTIES, 3) Praça Universitária (fallback)
 */
function getFacultyCoords(studentObj) {
  if (studentObj?.facultyLocation?.lat != null) {
    return [studentObj.facultyLocation.lat, studentObj.facultyLocation.lng];
  }
  return MOCK_FACULTIES[studentObj?.faculty] || MOCK_FACULTIES['Outra'];
}

const CENTER = [-16.6869, -49.2643]; // Goiânia centro

// Função de Haversine para calcular distância em KM entre duas coordenadas
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distância em km
}

const createPedestrianIcon = () => {
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;pointer-events:none;">
        <div style="
          position:absolute;
          width:36px;height:36px;
          border-radius:50%;
          background:rgba(249,115,22,0.25);
          border:1.5px solid rgba(249,115,22,0.6);
          animation:studentHalo 2s ease-out infinite;
        "></div>
        <div style="
          width:24px;height:24px;
          border-radius:50%;
          background:#f97316;
          border:2px solid #ffffff;
          box-shadow:0 4px 12px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:#000000;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 16v-2.38C4 11.5 6.5 9 9.5 9H10V7a3 3 0 0 1 6 0v2h.5c3 0 5.5 2.5 5.5 4.62V16"/>
            <circle cx="12" cy="4" r="2"/>
          </svg>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createCampusPoiIcon = (name, type = 'building', isSelected = false, isDark = true) => {
  if (!isSelected) {
    // Marcador oculto por padrão (mantém o mapa limpo), mas funcional (área clicável transparente)
    return L.divIcon({
      html: `<div style="width: 38px; height: 38px; cursor: pointer; background: transparent;" title="${name}"></div>`,
      className: 'bg-transparent border-none',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
  }

  // Original Laranja quando selecionado
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
    iconAnchor: [90, 42]
  });
};

const createCustomDestinationIcon = (distanceLabel = '', durationMinutes = null, isDark = true) => {
  const night = isDark;
  const bg = night ? 'rgba(15, 15, 15, 0.94)' : 'rgba(255, 255, 255, 0.96)';
  const border = night ? 'rgba(249, 115, 22, 0.8)' : '#f97316';
  const durationText = durationMinutes ? ` (~${durationMinutes}min)` : '';
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;width:180px;pointer-events:auto;">
        <!-- Badge Flutuante com Distância e Tempo Estimado -->
        <div style="
          background:${bg};
          color:#f97316;
          font-size:10px;
          font-weight:800;
          font-family:Inter,system-ui,sans-serif;
          padding:3px 9px;
          border-radius:9999px;
          border:1.5px solid ${border};
          box-shadow:0 4px 14px rgba(249,115,22,0.35);
          white-space:nowrap;
          margin-bottom:3px;
          display:flex;
          align-items:center;
          gap:4.5px;
        ">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f97316;"></span>
          Destino ${distanceLabel ? `• ${distanceLabel}` : ''}${durationText}
        </div>
        <!-- Anéis de Radar e Pino Central -->
        <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;
            border:2px solid #f97316;animation:radarPulse 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          "></div>
          <div style="
            position:relative;width:28px;height:28px;border-radius:50%;
            background:#f97316;border:2.5px solid #ffffff;
            box-shadow:0 4px 14px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
            color:#000000;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="10" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          </div>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [160, 56],
    iconAnchor: [80, 38]
  });
};

const createSearchedPlaceIcon = (name) => {
  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 160px; pointer-events: none;">
        <!-- Container concêntrico exato para o Pin e o Sonar -->
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <!-- Anel 1 do Sonar Pulsante (concentricidade perfeita) -->
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

          <!-- Anel 2 do Sonar Pulsante (defasado) -->
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

          <!-- Pin Central com Marcador -->
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

        <!-- Badge com o nome do local -->
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
    iconAnchor: [80, 18]
  });
};

const MapBridge = ({ onReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map && onReady) onReady(map);
  }, [map, onReady]);
  return null;
};

const RecenterButton = ({ lat, lng }) => {
  const map = useMap();
  const [portalTarget, setPortalTarget] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const el = document.getElementById('navbar-recenter-slot');
      setPortalTarget(current => current === el ? current : el);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (lat && lng) map.flyTo([lat, lng], 15, { duration: 1.5 });
      }}
      className="w-full min-w-0 flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
      title="Centralizar"
    >
      <div className="p-1.5 sm:p-2"><LocateFixed size={22} strokeWidth={2.5} /></div>
      <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Focar</span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
};

const LocationPickerMode = ({ isEditing, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      if (isEditing) {
        onLocationSelected(e.latlng);
      }
    },
  });
  return null;
};

const MapInteractionListener = ({ onInteract }) => {
  useMapEvents({
    click() { onInteract(); },
    dragstart() { onInteract(); }
  });
  return null;
};

const MapFlyTo = ({ target, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (trigger && target?.lat && target?.lng) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
    }
  }, [trigger]);
  return null;
};

/**
 * Listener de clique e segura (long-press) no Modo Campus
 * Permite que o aluno toque e segure por 500ms em qualquer ponto para traçar rota
 */
const CampusLongPressHandler = ({ isCampusModeActive, onLongPress }) => {
  const map = useMap();

  useEffect(() => {
    if (!isCampusModeActive) return;

    let timer = null;
    let startPoint = null;
    const container = map.getContainer();

    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      startPoint = null;
    };

    // --- Touch (Mobile) ---
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) {
        clear();
        return;
      }
      const touch = e.touches[0];
      startPoint = { x: touch.clientX, y: touch.clientY };

      timer = setTimeout(() => {
        if (!startPoint) return;
        const rect = container.getBoundingClientRect();
        const pt = L.point(startPoint.x - rect.left, startPoint.y - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        clear();
        onLongPress(latlng);
      }, 500);
    };

    const handleTouchMove = (e) => {
      if (!startPoint || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - startPoint.x, touch.clientY - startPoint.y);
      if (dist > 12) {
        clear();
      }
    };

    const handleTouchEnd = () => {
      clear();
    };

    // --- Mouse (Desktop) ---
    const handleMouseDown = (e) => {
      if (e.button !== 0) return; // apenas botão esquerdo
      startPoint = { x: e.clientX, y: e.clientY };

      timer = setTimeout(() => {
        if (!startPoint) return;
        const rect = container.getBoundingClientRect();
        const pt = L.point(startPoint.x - rect.left, startPoint.y - rect.top);
        const latlng = map.containerPointToLatLng(pt);
        clear();
        onLongPress(latlng);
      }, 500);
    };

    const handleMouseMove = (e) => {
      if (!startPoint) return;
      const dist = Math.hypot(e.clientX - startPoint.x, e.clientY - startPoint.y);
      if (dist > 12) {
        clear();
      }
    };

    const handleMouseUp = () => {
      clear();
    };

    // --- ContextMenu (Desktop right-click fallback) ---
    const handleContextMenu = (e) => {
      e.preventDefault();
      clear();
      const rect = container.getBoundingClientRect();
      const pt = L.point(e.clientX - rect.left, e.clientY - rect.top);
      const latlng = map.containerPointToLatLng(pt);
      onLongPress(latlng);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clear();
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);

      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [map, isCampusModeActive, onLongPress]);

  return null;
};

export default function StudentMap() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastingLocation, setBroadcastingLocation] = useState(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // --- Chamada de Embarque (visão do aluno) ---
  const [boardingAlertDismissed, setBoardingAlertDismissed] = useState(false);
  const [boardingAlertKey, setBoardingAlertKey] = useState(null); // startedAt da chamada atual
  const [boardingSecondsLeft, setBoardingSecondsLeft] = useState(0);
  const boardingTimerRef = useRef(null);

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState('ida_volta');
  const [hasNotified, setHasNotified] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [hasSeenCheckInModal, setHasSeenCheckInModal] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [routePath, setRoutePath] = useState([]);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const watchIdRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const simulationInterval = useRef(null);

  // --- 1. Alerta de Descida / Acorda Aluno ---
  const [wakeUpSettings, setWakeUpSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rhyme_wakeup_settings');
      return saved ? JSON.parse(saved) : { enabled: true, distance: 1000, stopLocation: null };
    } catch (e) {
      return { enabled: true, distance: 1000, stopLocation: null };
    }
  });
  const [isWakeUpSettingsOpen, setIsWakeUpSettingsOpen] = useState(false);
  const [isWakeUpAlarmModalOpen, setIsWakeUpAlarmModalOpen] = useState(false);
  const [wakeUpAlarmTriggered, setWakeUpAlarmTriggered] = useState(false);
  const [currentDistanceToStop, setCurrentDistanceToStop] = useState(0);
  const [isSettingDropOffLocation, setIsSettingDropOffLocation] = useState(false);

  // --- 2. Modo Campus Pedestre ---
  const [isCampusModeActive, setIsCampusModeActive] = useState(false);
  const [campusFacultyData, setCampusFacultyData] = useState(null);
  const [selectedCampusPoi, setSelectedCampusPoi] = useState(null);
  const [customCampusDestination, setCustomCampusDestination] = useState(null);
  const [userWalkingCoords, setUserWalkingCoords] = useState(null);
  const walkingWatchIdRef = useRef(null);

  // POIs do campus ativo
  const campusPois = useMemo(() => {
    const key = Object.keys(CAMPUS_POIS).find(k => (campusFacultyData?.name || student?.faculty || 'UFG').toUpperCase().includes(k));
    return (key && CAMPUS_POIS[key]) ? CAMPUS_POIS[key] : [];
  }, [campusFacultyData, student]);

  // Checa se o usuário está realmente no campus ou próximo (<= 3km) para evitar traçados de longa distância
  const isUserNearCampus = useMemo(() => {
    if (!userWalkingCoords) return false;
    const campusCenter = campusFacultyData?.coords || getFacultyCoords(student);
    if (!campusCenter) return false;
    const distKm = getDistanceFromLatLonInKm(
      userWalkingCoords[0], userWalkingCoords[1],
      campusCenter[0], campusCenter[1]
    );
    return distKm <= 3.0; // Usuário no campus (até 3km)
  }, [userWalkingCoords, campusFacultyData, student]);

  // Origem da rota pedestre dentro do campus
  const campusRouteOrigin = useMemo(() => {
    if (!isCampusModeActive) return null;
    return (isUserNearCampus && userWalkingCoords) 
      ? userWalkingCoords 
      : (userWalkingCoords || campusFacultyData?.coords || getFacultyCoords(student));
  }, [isCampusModeActive, isUserNearCampus, userWalkingCoords, campusFacultyData, student]);

  // Destino da rota pedestre (destino customizado, POI selecionado ou ponto da van)
  const campusRouteTarget = useMemo(() => {
    if (!isCampusModeActive) return null;
    if (customCampusDestination) {
      return [customCampusDestination.lat, customCampusDestination.lng];
    }
    if (selectedCampusPoi) {
      return selectedCampusPoi.coords;
    }
    if (isUserNearCampus && userWalkingCoords) {
      return campusFacultyData?.coords || getFacultyCoords(student);
    }
    return null;
  }, [isCampusModeActive, customCampusDestination, selectedCampusPoi, isUserNearCampus, userWalkingCoords, campusFacultyData, student]);

  // Traçado Pedestre pelas calçadas e passarelas internas do campus (Mapbox Walking + OSM Routed-Foot fallback)
  const campusRouteCacheRef = useRef(new Map());
  const [campusWalkingRoute, setCampusWalkingRoute] = useState(null);
  const [campusRouteMetrics, setCampusRouteMetrics] = useState({ distanceMeters: null, durationMinutes: null });

  useEffect(() => {
    if (!isCampusModeActive || !campusRouteOrigin || !campusRouteTarget) {
      setCampusWalkingRoute(null);
      setCampusRouteMetrics({ distanceMeters: null, durationMinutes: null });
      return;
    }

    const [oLat, oLng] = campusRouteOrigin;
    const [tLat, tLng] = campusRouteTarget;

    const straightDistKm = getDistanceFromLatLonInKm(oLat, oLng, tLat, tLng);
    if (straightDistKm < 0.003) {
      setCampusWalkingRoute(null);
      setCampusRouteMetrics({ distanceMeters: 0, durationMinutes: 0 });
      return;
    }

    const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${tLat.toFixed(4)},${tLng.toFixed(4)}`;
    const cached = campusRouteCacheRef.current.get(cacheKey);

    if (cached) {
      setCampusWalkingRoute(cached.route);
      setCampusRouteMetrics(cached.metrics);
      return;
    }

    // Linha inicial imediata para resposta instantânea na UI
    setCampusWalkingRoute([campusRouteOrigin, campusRouteTarget]);
    setCampusRouteMetrics({
      distanceMeters: Math.round(straightDistKm * 1000),
      durationMinutes: Math.max(1, Math.round((straightDistKm * 1000) / 70))
    });

    let isCancelled = false;

    const fetchPedestrianRoute = async () => {
      try {
        // 1ª Opção: Mapbox Directions API (Perfil Walking)
        if (MAPBOX_TOKEN) {
          const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${oLng},${oLat};${tLng},${tLat}?overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(mapboxUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes[0]?.geometry?.coordinates?.length > 1) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              const fullRoute = [campusRouteOrigin, ...coords, campusRouteTarget];
              const dist = Math.round(data.routes[0].distance);
              const mins = Math.max(1, Math.round(data.routes[0].duration / 60));

              if (!isCancelled) {
                const metrics = { distanceMeters: dist, durationMinutes: mins };
                campusRouteCacheRef.current.set(cacheKey, { route: fullRoute, metrics });
                setCampusWalkingRoute(fullRoute);
                setCampusRouteMetrics(metrics);
                return;
              }
            }
          }
        }

        // 2ª Opção (Fallback): OpenStreetMap Routed Foot (Pedestre)
        const osmFootUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${oLng},${oLat};${tLng},${tLat}?overview=full&geometries=geojson`;
        const osmRes = await fetch(osmFootUrl);
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          if (osmData.routes && osmData.routes[0]?.geometry?.coordinates?.length > 1) {
            const coords = osmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            const fullRoute = [campusRouteOrigin, ...coords, campusRouteTarget];
            const dist = Math.round(osmData.routes[0].distance);
            const duration = osmData.routes[0].duration || (dist / 1.16);
            const mins = Math.max(1, Math.round(duration / 60));

            if (!isCancelled) {
              const metrics = { distanceMeters: dist, durationMinutes: mins };
              campusRouteCacheRef.current.set(cacheKey, { route: fullRoute, metrics });
              setCampusWalkingRoute(fullRoute);
              setCampusRouteMetrics(metrics);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Campus walking route fallback to straight line:', err);
      }
    };

    fetchPedestrianRoute();

    return () => {
      isCancelled = true;
    };
  }, [isCampusModeActive, campusRouteOrigin, campusRouteTarget]);

  // Distância até o destino customizado selecionado com clique-e-segura
  const customDestinationDistance = useMemo(() => {
    if (!customCampusDestination) return null;
    if (campusRouteMetrics.distanceMeters != null) {
      const m = campusRouteMetrics.distanceMeters;
      if (m < 1000) return `${m}m`;
      return `${(m / 1000).toFixed(1)}km`;
    }
    const origin = campusRouteOrigin;
    if (!origin) return null;
    const km = getDistanceFromLatLonInKm(
      origin[0], origin[1],
      customCampusDestination.lat, customCampusDestination.lng
    );
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }, [customCampusDestination, campusRouteMetrics, campusRouteOrigin]);

  const handleCampusLongPress = useCallback((latlng) => {
    playSuccessSound();
    triggerHaptic('medium');
    setCustomCampusDestination({
      lat: latlng.lat,
      lng: latlng.lng,
      name: 'Destino no Mapa'
    });
    setSelectedCampusPoi(null);
  }, []);

  // --- 3. Busca no Mapa ---
  const [searchedPlace, setSearchedPlace] = useState(null);
  const mapInstanceRef = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId, loading: tripLoading, error: tripError } = useCurrentTrip(student?.route?.trim());
  const { attendances: publicList, error: attendancesError } = useTripAttendances(tripId);

  // --- Relógio para reatualizar elapsed label a cada 30 s ---
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // --- Sistema de Frescor do GPS ---
  // Limiares: live < 45 s | stale 45 s – 3 min | expired > 3 min
  const GPS_LIVE_MS  = 45_000;
  const GPS_STALE_MS = 3 * 60_000;

  const gpsState = useMemo(() => {
    // O aluno está transmitindo manualmente: sempre live
    if (isBroadcasting) return 'live';
    // Sinal pausado intencionalmente pelo transmissor anterior
    if (trip?.locationProviderStatus === 'paused') return 'paused';
    // Sem localização alguma
    if (!trip?.busLocation?.lat) return 'expired';
    // Com timestamp: calcular idade
    if (trip?.locationUpdatedAt) {
      const age = now - trip.locationUpdatedAt;
      if (age < GPS_LIVE_MS)  return 'live';
      if (age < GPS_STALE_MS) return 'stale';
      return 'expired';
    }
    // Sem timestamp (dados legados): assume live se há posição
    return 'live';
  }, [isBroadcasting, trip?.locationProviderStatus, trip?.busLocation, trip?.locationUpdatedAt, now]);

  const elapsedLabel = useMemo(() => {
    if (gpsState === 'live') return '';
    if (gpsState === 'paused') return 'PAUSADO';
    if (!trip?.locationUpdatedAt) return 'SEM SINAL';
    const seconds = Math.round((now - trip.locationUpdatedAt) / 1000);
    if (seconds < 60) return `HÁ ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `HÁ ${minutes}min`;
    return `HÁ ${Math.floor(minutes / 60)}h`;
  }, [gpsState, trip?.locationUpdatedAt, now]);

  // --- Prioridade Motorista > Aluno ---
  // O motorista está ativo (live ou stale): aluno não deve transmitir
  const isDriverActive = trip?.locationProviderRole === 'driver' && (gpsState === 'live' || gpsState === 'stale');

  const busIcon    = useMemo(() => createBusIcon(false, isDark, gpsState, elapsedLabel), [isDark, gpsState, elapsedLabel]);
  const busIconAlt = useMemo(() => createBusIcon(true,  isDark, gpsState, elapsedLabel), [isDark, gpsState, elapsedLabel]);

  const loading = studentLoading || (Boolean(student?.route) && tripLoading);

  // Posição ativa da Van:
  // Se o aluno transmite manualmente → posição local; caso contrário → última do Firestore (sempre visível)
  const activeBusLocation = (isBroadcasting && broadcastingLocation)
    ? broadcastingLocation
    : (trip?.busLocation?.lat != null && trip?.busLocation?.lng != null ? trip.busLocation : null);
  const busLocation = activeBusLocation;

  const _isLiberadoForEta = attendance?.status === 'liberado';
  const { etaMinutes } = useOsrmEta(
    _isLiberadoForEta ? (busLocation?.lat ?? null) : null,
    _isLiberadoForEta ? (busLocation?.lng ?? null) : null,
    _isLiberadoForEta ? (attendance?.lat ?? null) : null,
    _isLiberadoForEta ? (attendance?.lng ?? null) : null
  );

  // Hook to handle FCM permissions and tokens
  useFCM(user);

  // --- Chamada de Embarque: detectar se este aluno é alvo ---
  const isTargetedByBoardingCall = useMemo(() => {
    const bc = trip?.boardingCall;
    if (!bc || bc.status !== 'active') return false;
    if (!bc.targetStudentIds?.includes(user?.uid)) return false;
    if (Date.now() > bc.expiresAt) return false;
    return true;
  }, [trip?.boardingCall, user?.uid]);

  // Dispara som e notificação do sistema ao ser alvo de uma nova chamada de embarque
  useEffect(() => {
    if (!isTargetedByBoardingCall) {
      // Reseta dismissed quando a chamada encerrar (próxima chamada começa limpa)
      if (!trip?.boardingCall || trip.boardingCall.status !== 'active') {
        setBoardingAlertDismissed(false);
        setBoardingAlertKey(null);
      }
      return;
    }
    const callKey = trip.boardingCall.startedAt;
    if (boardingAlertKey === callKey) return; // já processamos esta chamada
    setBoardingAlertKey(callKey);
    setBoardingAlertDismissed(false);
    // Alarme sonoro
    try { playBoardingAlarmSound(); } catch (e) {}
    // Notificação do sistema (toca mesmo com celular bloqueado se a permissão foi concedida)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Van na portaria!', {
          body: `A Van chegou em ${trip.boardingCall.faculty || 'sua faculdade'}. Você tem ${trip.boardingCall.durationMinutes} min para embarcar.`,
          icon: '/android-chrome-192x192.png',
          tag: 'boarding-call',
          requireInteraction: true
        });
      } catch (e) { console.warn('Notificação de embarque bloqueada:', e); }
    }
  }, [isTargetedByBoardingCall, trip?.boardingCall?.startedAt]);

  // Countdown sincronizado com expiresAt da chamada
  useEffect(() => {
    if (!isTargetedByBoardingCall || boardingAlertDismissed) {
      clearInterval(boardingTimerRef.current);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.round((trip.boardingCall.expiresAt - Date.now()) / 1000));
      setBoardingSecondsLeft(left);
    };
    tick();
    boardingTimerRef.current = setInterval(tick, 1000);
    return () => clearInterval(boardingTimerRef.current);
  }, [isTargetedByBoardingCall, boardingAlertDismissed, trip?.boardingCall?.expiresAt]);

  // Resposta do aluno à chamada de embarque
  const handleBoardingResponse = async (response) => {
    if (!trip?.id || !user?.uid) return;
    const attendanceId = `${trip.id}_${user.uid}`;
    try {
      const updates = { boardingResponse: response, boardingResponseAt: Date.now() };
      if (response === 'skip') updates.status = 'cancelado';
      await updateDoc(doc(db, 'attendance', attendanceId), updates);
    } catch (e) {
      console.error('Erro ao responder chamada de embarque:', e);
    }
    setBoardingAlertDismissed(true);
  };

  // Listener do perfil do aluno (redireciona se motorista ou não cadastrado)
  useEffect(() => {
    if (!user) return;

    setStudentLoading(true);
    setStudentError(null);

    const unsub = onSnapshot(doc(db, 'students', user.uid), (snap) => {
      if (!snap.exists()) {
        setStudentLoading(false);
        navigate('/cadastro', { replace: true });
        return;
      }
      const data = snap.data();
      if (data.role === 'driver') {
        navigate('/motorista/dashboard', { replace: true });
        return;
      }
      setStudent(data);
      setStudentLoading(false);
    }, (err) => {
      console.error('Erro ao carregar perfil do aluno:', err);
      setStudentError(err);
      setStudentLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Listener do attendance próprio do aluno + joinTrip explícito
  useEffect(() => {
    if (!trip || !user || !student) return;

    const attendanceId = `${trip.id}_${user.uid}`;

    // Ação explícita de mutação separada do hook de leitura
    const facCoords = getFacultyCoords(student);
    joinTrip(trip.id, { uid: user.uid, ...student }, { lat: facCoords[0], lng: facCoords[1] });

    const unsub = onSnapshot(doc(db, 'attendance', attendanceId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAttendance(data);
      } else {
        setAttendance(null);
      }
    });

    return () => unsub();
  }, [trip?.id, user?.uid, student?.uid]);

  // Geofencing: dispara notificação push quando o ônibus se aproxima
  useEffect(() => {
    if (!student?.faculty || !trip?.busLocation || hasNotified) return;
    if (attendance?.status !== 'liberado') return;

    const facCoords = getFacultyCoords(student);
    if (!facCoords) return;

    const distKm = getDistanceFromLatLonInKm(
      facCoords[0], facCoords[1],
      trip.busLocation.lat, trip.busLocation.lng
    );

    if (distKm <= 1.0) {
      setHasNotified(true);
      try { playNotificationSound(); } catch (e) { console.error('Audio blocked', e); }
      showAlert('O ônibus está chegando na sua localização!');
    }
  }, [trip?.busLocation, student?.faculty, hasNotified, attendance?.status]);

  const prevPublicList = useRef([]);
  useEffect(() => {
    if (prevPublicList.current.length > publicList.length) {
      const removed = prevPublicList.current.filter(p1 => !publicList.find(p2 => p2.id === p1.id));
      removed.forEach(r => {
        if (r.studentId !== user?.uid && trip?.status !== 'finished') {
          showAlert(`${r.studentName || 'Um passageiro'} cancelou a viagem e saiu da lista.`);
        }
      });
    }
    prevPublicList.current = publicList;
  }, [publicList, user?.uid, trip?.status]);

  const clearRoute = () => {
    setRoutePath([]);
  };

  const handleStudentStatus = async (studentId, currentStatus, targetStatus) => {
    if (!trip) return;
    try {
      const attendanceId = `${trip.id}_${studentId}`;
      const newStatus = currentStatus === targetStatus ? 'aguardando' : targetStatus;
      await setDoc(doc(db, 'attendance', attendanceId), { status: newStatus }, { merge: true });
    } catch(e) {
      console.error(e);
      showAlert("Erro ao atualizar status do aluno");
    }
  };

  useEffect(() => {
    return () => clearRoute();
  }, []);

  const drawRouteToBus = async (studentLat, studentLng) => {
    if (!trip) return;
    clearRoute();

    let startLat = trip.busLocation?.lat;
    let startLng = trip.busLocation?.lng;

    if (!startLat || !startLng) {
      return;
    }

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${studentLng},${studentLat}?overview=full&geometries=geojson`);
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates;
        const path = coords.map(c => [c[1], c[0]]);
        setRoutePath(path);
      }
    } catch (e) {
      console.error("Erro ao traçar rota", e);
    }
  };

  const isLiberado = attendance?.status === 'liberado';
  const isCancelado = attendance?.status === 'cancelado';
  const isEmbarcado = attendance?.status === 'embarcado';
  const isAguardando = attendance?.status === 'aguardando';

  // Solicita a opção de embarque apenas uma única vez por usuário
  useEffect(() => {
    if (!user?.uid || !trip?.id || studentLoading) return;

    const alreadyPrompted = localStorage.getItem(`rhyme_checkin_prompted_${user.uid}`) === 'true';
    const hasTripType = !!attendance?.tripType || !!student?.defaultTripType;

    // Apenas solicita se o aluno estiver aguardando, ainda não tiver opção de embarque e nunca tiver sido solicitado
    if (isAguardando && !hasTripType && !alreadyPrompted && !hasSeenCheckInModal) {
      setShowCheckInModal(true);
      setHasSeenCheckInModal(true);
      localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
    }
  }, [isAguardando, attendance?.tripType, student?.defaultTripType, user?.uid, trip?.id, studentLoading, hasSeenCheckInModal]);

  // Se o aluno já possui uma preferência de trajeto no perfil, sincroniza automaticamente com o attendance diário sem reabrir modal
  useEffect(() => {
    if (!attendance?.tripType && student?.defaultTripType && trip?.id && user?.uid && isAguardando) {
      updateDoc(doc(db, 'attendance', `${trip.id}_${user.uid}`), {
        tripType: student.defaultTripType
      }).catch((e) => console.warn('Erro ao sincronizar defaultTripType com attendance:', e));
    }
  }, [attendance?.tripType, student?.defaultTripType, trip?.id, user?.uid, isAguardando]);

  useEffect(() => {
    if (attendance?.tripType) {
      setSelectedTripType(attendance.tripType);
    }
  }, [attendance?.tripType]);

  // Garante que a rota seja traçada ao carregar a página (F5) caso já esteja liberado
  useEffect(() => {
    if (isLiberado && attendance?.lat && attendance?.lng && routePath.length === 0) {
      drawRouteToBus(attendance.lat, attendance.lng);
    }
  }, [isLiberado, attendance?.lat, attendance?.lng, trip?.busLocation]);

  // Efeito de transmissão de GPS da Van pelo aluno embarcado
  useEffect(() => {
    if (isBroadcasting && user?.uid) {
      // 1. Imediatamente inicializa a posição com os dados disponíveis para não ter delay visual
      if (!broadcastingLocation) {
        if (attendance?.lat && attendance?.lng) {
          setBroadcastingLocation({ lat: attendance.lat, lng: attendance.lng });
        } else if (trip?.busLocation?.lat && trip?.busLocation?.lng) {
          setBroadcastingLocation({ lat: trip.busLocation.lat, lng: trip.busLocation.lng });
        }
      }

      const sendLocation = async (position) => {
        const { latitude, longitude } = position.coords;
        setBroadcastingLocation({ lat: latitude, lng: longitude });

        const targetTripId = tripId || trip?.id;
        if (targetTripId) {
          try {
            await updateDoc(doc(db, 'trips', targetTripId), {
              busLocation: { lat: latitude, lng: longitude },
              locationProviderName: student?.name || 'Aluno',
              locationProviderId: user.uid,
              locationProviderRole: 'student',
              locationProviderStatus: 'active',
              locationUpdatedAt: Date.now()
            });
          } catch (e) {
            console.error("Erro ao enviar GPS como aluno:", e);
          }
        }
      };

      if (navigator.geolocation) {
        // Chamada imediata para primeira captura precisa
        navigator.geolocation.getCurrentPosition(sendLocation, (err) => {
          console.warn("GPS inicial:", err);
        }, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 1000
        });

        // Observador contínuo em tempo real (dispara a cada movimento do veículo)
        watchIdRef.current = navigator.geolocation.watchPosition(sendLocation, (err) => {
          console.error("watchPosition erro:", err);
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        });

        // Polling de garantia
        fallbackIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(sendLocation, () => {}, {
            enableHighAccuracy: true,
            maximumAge: 5000
          });
        }, 6000);
      } else {
        showAlert("Geolocalização não disponível no dispositivo.");
      }

      return () => {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      };
    } else if (!isBroadcasting) {
      setBroadcastingLocation(null);
    }
  }, [isBroadcasting, trip?.id, tripId, user?.uid, student?.name, attendance?.lat, attendance?.lng]);

  const handleToggleBroadcasting = async () => {
    // Bloqueia aluno se motorista já está transmitindo ao vivo
    if (!isBroadcasting && isDriverActive) {
      showAlert('O motorista já está compartilhando a localização. Você não precisa ativar o GPS.');
      return;
    }

    const nextState = !isBroadcasting;
    setIsBroadcasting(nextState);

    if (nextState) {
      if (attendance?.lat && attendance?.lng) {
        setBroadcastingLocation({ lat: attendance.lat, lng: attendance.lng });
      } else if (trip?.busLocation?.lat && trip?.busLocation?.lng) {
        setBroadcastingLocation({ lat: trip.busLocation.lat, lng: trip.busLocation.lng });
      }
      setFocusTrigger(prev => prev + 1);
      showAlert('Transmissão da Van ativada! O ícone da Van agora segue sua posição em tempo real.');
    } else {
      setBroadcastingLocation(null);
      // Marca o sinal como pausado no Firestore para todos os outros usuários
      const targetTripId = tripId || trip?.id;
      if (targetTripId && (trip?.locationProviderId === user?.uid || !trip?.locationProviderId)) {
        try {
          await updateDoc(doc(db, 'trips', targetTripId), {
            locationProviderStatus: 'paused'
          });
        } catch (e) {
          console.warn('Falha ao marcar GPS como pausado:', e);
        }
      }
      showAlert('Transmissão da Van pausada.');
    }
  };

  const handleTripTypeChange = async (type) => {
    setSelectedTripType(type);
    if (attendance && attendance.status !== 'cancelado') {
      try {
        await updateDoc(doc(db, 'attendance', `${trip.id}_${user.uid}`), { tripType: type, updatedAt: serverTimestamp() });
      } catch (e) {
        console.error("Erro ao atualizar trajeto", e);
      }
    }
  };

  // Check-in: registra apenas o tipo de viagem (ida, volta, ida_volta) mantendo o status aguardando
  const handleCheckIn = async (type) => {
    if (!trip || !user) {
      console.warn("handleCheckIn abortado: trip ou user não carregados", { trip, user });
      return;
    }
    
    setSelectedTripType(type);
    setIsSubmitting(true);
    
    const facCoords = getFacultyCoords(student);
    const initialLat = attendance?.lat ?? (facCoords ? facCoords[0] : CENTER[0]);
    const initialLng = attendance?.lng ?? (facCoords ? facCoords[1] : CENTER[1]);
    const attendanceId = `${trip.id}_${user.uid}`;
    
    try {
      // 1. Salva o trajeto no Firestore mantendo o status (aguardando)
      await setDoc(doc(db, 'attendance', attendanceId), {
        tripId: trip.id,
        studentId: user.uid,
        studentName: student?.name || 'Aluno',
        faculty: student?.faculty || 'Outra',
        route: normalizeRoute(student?.route) || 'Professor Jamil',
        photoURL: student?.photoURL || null,
        status: attendance?.status || 'aguardando',
        tripType: type,
        lat: initialLat,
        lng: initialLng,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Salva preferência para não solicitar novamente nas próximas visitas/viagens
      if (user?.uid) {
        localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
        localStorage.setItem('rhyme_default_trip_type', type);
        try {
          await updateDoc(doc(db, 'users', user.uid), { defaultTripType: type });
        } catch (profileErr) {
          console.warn('Erro ao salvar defaultTripType no perfil do aluno:', profileErr);
        }
      }

      if (type === 'ida') {
        clearRoute();
      }
      
      // 2. Confirmação visual imediata: abre a lista de passageiros com o trajeto atualizado
      setIsPublicListOpen(true);
      setIsPanelCollapsed(true);
    } catch (err) {
      console.error("Erro ao salvar trajeto:", err);
      showAlert("Erro ao salvar trajeto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Botão LIBERADO: acionado quando o aluno está pronto; realiza nova captura de localização e muda para 'liberado'
  const handleLiberar = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);

    const attendanceId = `${trip.id}_${user.uid}`;

    const executeLiberacao = async (lat, lng) => {
      try {
        await setDoc(doc(db, 'attendance', attendanceId), {
          tripId: trip.id,
          studentId: user.uid,
          studentName: student?.name || 'Aluno',
          faculty: student?.faculty || 'Outra',
          route: normalizeRoute(student?.route) || 'Professor Jamil',
          photoURL: student?.photoURL || null,
          status: 'liberado',
          lat,
          lng,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (attendance?.tripType !== 'ida' && selectedTripType !== 'ida') {
          drawRouteToBus(lat, lng);
        }
        showAlert("Você foi liberado! Sua localização foi atualizada para o motorista.");
      } catch (err) {
        console.error("Erro ao marcar liberação:", err);
        showAlert("Erro ao liberar. Tente novamente.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          executeLiberacao(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("GPS não capturado com precisão, usando coordenadas base:", error?.message || error);
          const facCoords = getFacultyCoords(student);
          const fallbackLat = attendance?.lat ?? (facCoords ? facCoords[0] : CENTER[0]);
          const fallbackLng = attendance?.lng ?? (facCoords ? facCoords[1] : CENTER[1]);
          executeLiberacao(fallbackLat, fallbackLng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const facCoords = getFacultyCoords(student);
      const fallbackLat = attendance?.lat ?? (facCoords ? facCoords[0] : CENTER[0]);
      const fallbackLng = attendance?.lng ?? (facCoords ? facCoords[1] : CENTER[1]);
      executeLiberacao(fallbackLat, fallbackLng);
    }
  };

  const handleSaveLocation = async () => {
    if (!tempLocation || !trip || !user) return;
    setIsSubmitting(true);
    try {
      const attendanceId = `${trip.id}_${user.uid}`;
      await setDoc(doc(db, 'attendance', attendanceId), {
        tripId: trip.id,
        studentId: user.uid,
        studentName: student?.name || 'Aluno',
        faculty: student?.faculty || 'Outra',
        route: student?.route || 'Professor Jamil',
        photoURL: student?.photoURL || null,
        status: 'liberado',
        lat: tempLocation.lat,
        lng: tempLocation.lng,
        updatedAt: serverTimestamp()
      }, { merge: true });
      drawRouteToBus(tempLocation.lat, tempLocation.lng);
      setIsEditingLocation(false);
      setTempLocation(null);
      showAlert("Seu local de embarque foi atualizado!");
    } catch (err) {
      console.error("Erro ao atualizar localização:", err);
      showAlert("Erro ao atualizar o local. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarEmbarque = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);
    try {
      const attendanceId = `${trip.id}_${user.uid}`;
      await updateDoc(doc(db, 'attendance', attendanceId), { status: 'cancelado' });
      clearRoute();
      showAlert("Embarque cancelado. O motorista não passará na sua localização.");
    } catch (err) {
      console.error("Erro ao cancelar:", err);
      showAlert("Erro ao cancelar embarque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencia = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);
    try {
      const { updateDoc } = await import('firebase/firestore');
      const docRef = doc(collection(db, 'emergencies'));
      await setDoc(docRef, {
        tripId: trip.id,
        studentId: user.uid,
        studentName: student.name,
        route: student.route,
        faculty: student.faculty,
        lat: attendance?.lat || null,
        lng: attendance?.lng || null,
        timestamp: serverTimestamp(),
        resolved: false
      });
      
      // Atualiza status do attendance para esquecido para refletir a denúncia
      const attendanceId = `${trip.id}_${user.uid}`;
      await setDoc(doc(db, 'attendance', attendanceId), { status: 'esquecido' }, { merge: true });
      clearRoute();
      
      showAlert("Alerta registrado! A coordenação da frota foi notificada da sua situação e localização.");
    } catch (err) {
      console.error("Erro ao enviar alerta:", err);
      showAlert("Falha ao registrar o alerta. Por favor, ligue diretamente para o motorista ou coordenação.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- 1. Handlers do Alarme de Descida (Acorda Aluno) ---
  useEffect(() => {
    if (student) {
      setWakeUpSettings(prev => {
        if (student.dropOffLocation) {
          return { ...prev, stopLocation: student.dropOffLocation };
        }
        if (!prev.stopLocation && attendance?.lat && attendance?.lng) {
          return { ...prev, stopLocation: { lat: attendance.lat, lng: attendance.lng } };
        }
        return prev;
      });
    }
  }, [student, attendance?.lat, attendance?.lng]);

  // Monitoramento de proximidade em tempo real da Van até o ponto de descida
  useEffect(() => {
    if (!wakeUpSettings?.enabled || wakeUpAlarmTriggered) return;
    const target = wakeUpSettings?.stopLocation;
    if (!target?.lat || !target?.lng) return;

    // Posição atual da van (ou GPS transmitido)
    const busLoc = trip?.busLocation || (isBroadcasting ? broadcastingLocation : null);
    if (!busLoc?.lat || !busLoc?.lng) return;

    const distKm = getDistanceFromLatLonInKm(busLoc.lat, busLoc.lng, target.lat, target.lng);
    const distMeters = Math.round(distKm * 1000);
    setCurrentDistanceToStop(distMeters);

    if (distMeters > 0 && distMeters <= wakeUpSettings.distance) {
      setWakeUpAlarmTriggered(true);
      setIsWakeUpAlarmModalOpen(true);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('🚨 ACORDA! SUA PARADA ESTÁ PRÓXIMA!', {
            body: `A Van está a aproximadamente ${distMeters}m do seu ponto de descida!`,
            icon: '/android-chrome-192x192.png',
            tag: 'wakeup-alarm',
            requireInteraction: true
          });
        } catch (e) {
          console.warn('Erro ao disparar notificação do alarme:', e);
        }
      }
    }
  }, [trip?.busLocation, broadcastingLocation, isBroadcasting, wakeUpSettings?.enabled, wakeUpSettings?.distance, wakeUpSettings?.stopLocation, wakeUpAlarmTriggered]);

  const handleSaveWakeUpSettings = (newSettings) => {
    setWakeUpSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('rhyme_wakeup_settings', JSON.stringify(updated));
      return updated;
    });
    setWakeUpAlarmTriggered(false);
    showAlert('Configurações do despertador salvas!');
  };

  const handleSetStopLocation = async (coords) => {
    const lat = coords?.lat ?? coords?.[0];
    const lng = coords?.lng ?? coords?.[1];
    if (lat == null || lng == null) return;

    const stopObj = { lat, lng };
    setWakeUpSettings(prev => {
      const updated = { ...prev, stopLocation: stopObj, enabled: true };
      localStorage.setItem('rhyme_wakeup_settings', JSON.stringify(updated));
      return updated;
    });
    setWakeUpAlarmTriggered(false);

    if (user?.uid) {
      updateDoc(doc(db, 'students', user.uid), { dropOffLocation: stopObj })
        .catch(e => console.warn('Erro ao persistir dropOffLocation:', e));
    }
    showAlert('Ponto de descida atualizado com sucesso!');
  };

  // --- 2. Handlers do Modo Campus Pedestre ---
  const startCampusWalkingWatch = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      walkingWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserWalkingCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn('Erro GPS pedestre:', err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  };

  const stopCampusWalkingWatch = () => {
    if (walkingWatchIdRef.current && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(walkingWatchIdRef.current);
      walkingWatchIdRef.current = null;
    }
  };

  const handleSelectCampusPoi = (poi) => {
    setCustomCampusDestination(null);
    setSelectedCampusPoi(poi);
    if (poi?.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(poi.coords, 18, { animate: true, duration: 1.2 });
    }
  };

  const toggleCampusMode = (targetPlace = null) => {
    if (isCampusModeActive && !targetPlace) {
      playToggleSound(false);
      setIsCampusModeActive(false);
      setCampusFacultyData(null);
      setSelectedCampusPoi(null);
      setCustomCampusDestination(null);
      stopCampusWalkingWatch();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(CENTER, 13, { animate: true, duration: 1.2 });
      }
    } else {
      playToggleSound(true);
      setIsCampusModeActive(true);
      setSelectedCampusPoi(null);
      setCustomCampusDestination(null);
      if (targetPlace) setCampusFacultyData(targetPlace);
      startCampusWalkingWatch();
      const coords = targetPlace?.coords || getFacultyCoords(student);
      if (coords && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(coords, 18, { animate: true, duration: 1.5 });
      }
    }
  };

  useEffect(() => {
    return () => stopCampusWalkingWatch();
  }, []);

  // --- 3. Handlers da Busca no Mapa ---
  const handleSelectSearchedPlace = (place) => {
    setSearchedPlace(place);
    if (place.coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(place.coords, 17, { animate: true, duration: 1.2 });
    }
  };

  if (loading || studentLoading) {
    return <Loader message="Carregando seu perfil e mapa..." />;
  }

  if (studentError || tripError || attendancesError) {
    return (
      <ErrorState 
        message="Não foi possível se conectar aos servidores do Rhyme. Verifique sua conexão com a internet." 
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!student) {
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden select-none overscroll-none bg-background">
      <Header userProfile={student} />

      {student?.role === 'admin' && (
        <div 
          className="bg-card-elevated border-b border-subtle px-4 py-2 flex items-center justify-between z-30 shrink-0 select-none touch-none overscroll-none"
          onWheel={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 tracking-wider">
              ADMIN
            </span>
            <span className="text-xs font-semibold text-heading hidden sm:inline">Visualizando Rota:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {['Professor Jamil', 'Hidrolândia', 'Cromínia'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={async () => {
                  if (student.route !== r) {
                    await updateDoc(doc(db, 'students', user.uid), { route: r });
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  student.route === r
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-subtle text-caption hover:text-heading hover-bg-subtle'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="flex-1 relative z-0 overflow-hidden">

        {/* Barra de Busca de Faculdades e Locais (quando não estiver no Modo Campus e não estiver ajustando local) */}
        {!isCampusModeActive && !isEditingLocation && (
          <MapSearchBar
            onSelectPlace={handleSelectSearchedPlace}
            userCoords={attendance?.lat && attendance?.lng ? [attendance.lat, attendance.lng] : null}
          />
        )}

        {/* HUD do Modo Campus Pedestre */}
        {isCampusModeActive && !isEditingLocation && (
          <CampusModeHUD
            facultyName={campusFacultyData?.name || student?.faculty || 'UFG'}
            vanCoords={campusFacultyData?.coords || getFacultyCoords(student)}
            userWalkingCoords={userWalkingCoords}
            isUserNearby={isUserNearCampus}
            selectedPoi={selectedCampusPoi}
            selectedPoiId={selectedCampusPoi?.id}
            customDestination={customCampusDestination}
            customDestinationDistance={customDestinationDistance}
            routeMetrics={campusRouteMetrics}
            onClearCustomDestination={() => setCustomCampusDestination(null)}
            onExit={() => toggleCampusMode()}
            onSelectPoi={handleSelectCampusPoi}
            onToggleCompass={() => {
              const compassBtn = document.querySelector('#navbar-compass-slot button');
              compassBtn?.click();
            }}
            isCompassActive={false}
            onCenterUser={() => {
              if (userWalkingCoords && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(userWalkingCoords, 18, { animate: true, duration: 1 });
              }
            }}
          />
        )}

        {/* Card de Local Pesquisado */}
        {searchedPlace && !isCampusModeActive && !isEditingLocation && (
          <SearchedPlaceCard
            place={searchedPlace}
            onClose={() => setSearchedPlace(null)}
            onStartCampusMode={(place) => toggleCampusMode(place)}
            onSetAsDropOff={(place) => handleSetStopLocation(place.coords)}
          />
        )}

        {/* Indicadores flutuantes de GPS */}
        <GpsStatusBanner
          isBroadcasting={isBroadcasting}
          isTripInProgress={trip?.status === 'in_progress'}
          hasBusLocation={!!busLocation}
          gpsState={gpsState}
          elapsedLabel={elapsedLabel}
        />

        {/* Modal de Chamada de Embarque na Portaria */}
        <BoardingCallModal
          isOpen={isTargetedByBoardingCall && !boardingAlertDismissed}
          faculty={trip?.boardingCall?.faculty}
          secondsLeft={boardingSecondsLeft}
          durationMinutes={trip?.boardingCall?.durationMinutes}
          onClose={() => setBoardingAlertDismissed(true)}
          onResponse={handleBoardingResponse}
        />

        {/* Mapa */}
        <MapContainer center={CENTER} zoom={13} className="w-full h-full" zoomControl={false} attributionControl={false} rotate={true} touchRotate={true}>
          <MapBridge onReady={(m) => { mapInstanceRef.current = m; }} />
          <MapInteractions />
          <CampusLongPressHandler
            isCampusModeActive={isCampusModeActive}
            onLongPress={handleCampusLongPress}
          />
          <TileLayer
            url={isDark ? TILE_NIGHT : TILE_DAY}
            attribution={isDark ? TILE_ATTR_NIGHT : TILE_ATTR_DAY}
            key={isDark ? 'night' : 'day'}
          />

          {/* Marcador pedestre no Modo Campus (apenas se estiver próximo ou dentro do campus) */}
          {isCampusModeActive && isUserNearCampus && userWalkingCoords && (
            <Marker position={userWalkingCoords} icon={createPedestrianIcon()} zIndexOffset={1100}>
              <Popup className="dark-popup">
                <span className="font-bold text-heading">Você caminhando no campus</span>
              </Popup>
            </Marker>
          )}

          {/* Marcador do Destino Personalizado (Clique e Segura no Modo Campus) */}
          {isCampusModeActive && customCampusDestination && (
            <Marker
              position={[customCampusDestination.lat, customCampusDestination.lng]}
              icon={createCustomDestinationIcon(customDestinationDistance, campusRouteMetrics?.durationMinutes, isDark)}
              zIndexOffset={1400}
            >
              <Popup className="dark-popup">
                <div className="flex flex-col gap-1 p-0.5">
                  <span className="font-bold text-heading text-xs">Destino Selecionado</span>
                  <span className="text-[11px] text-orange-400 font-semibold">
                    Distância a pé: {customDestinationDistance || 'Calculando...'}
                    {campusRouteMetrics?.durationMinutes ? ` (~${campusRouteMetrics.durationMinutes} min)` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setCustomCampusDestination(null);
                    }}
                    className="mt-1 py-1 px-2 text-[10px] font-bold bg-danger/10 text-danger hover:bg-danger/20 rounded-lg border border-danger/20 transition-colors cursor-pointer"
                  >
                    Remover Destino
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Traçado pontilhado pedestre pelas calçadas e caminhos internos do campus */}
          {isCampusModeActive && campusWalkingRoute && campusWalkingRoute.length > 1 && (
            <>
              {/* Glow sutil ao redor da rota */}
              <Polyline
                positions={campusWalkingRoute}
                pathOptions={{
                  color: '#f97316',
                  weight: 8,
                  opacity: 0.25,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Linha pontilhada pedestre */}
              <Polyline
                positions={campusWalkingRoute}
                pathOptions={{
                  color: '#f97316',
                  dashArray: '6, 8',
                  weight: 4.5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </>
          )}

          {/* Marcadores dos Prédios/POIs do Campus */}
          {isCampusModeActive && campusPois.map((poi) => {
            const isSelected = selectedCampusPoi?.id === poi.id;
            return (
              <Marker
                key={poi.id}
                position={poi.coords}
                icon={createCampusPoiIcon(poi.name, poi.type, isSelected, isDark)}
                zIndexOffset={isSelected ? 1300 : 950}
                eventHandlers={{
                  click: () => handleSelectCampusPoi(poi)
                }}
              >
                {isSelected && (
                  <Popup className="dark-popup">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-heading text-xs">{poi.name}</span>
                      {campusRouteMetrics?.distanceMeters != null && (
                        <span className="text-[11px] text-orange-400 font-semibold">
                          A pé: {campusRouteMetrics.distanceMeters < 1000 ? `${campusRouteMetrics.distanceMeters}m` : `${(campusRouteMetrics.distanceMeters / 1000).toFixed(1)}km`}
                          {campusRouteMetrics.durationMinutes ? ` (~${campusRouteMetrics.durationMinutes} min)` : ''}
                        </span>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {/* Marcador de local pesquisado */}
          {searchedPlace && (
            <Marker position={searchedPlace.coords} icon={createSearchedPlaceIcon(searchedPlace.name)} zIndexOffset={1200} />
          )}
          {/* Marcador do próprio aluno — antes de liberar (oculto se o aluno estiver transmitindo como a Van) */}
          {attendance?.status !== 'liberado' && attendance?.status !== 'embarcado' && !isBroadcasting && attendance?.lat != null && attendance?.lng != null && !isNaN(attendance.lat) && !isNaN(attendance.lng) && (() => {
            const isSoIda = attendance?.tripType === 'ida';
            const icon = createStudentMapIcon('Você', true, false, isSoIda, isDark);
            return (
              <Marker key={`my_loc_${attendance?.status || 'waiting'}`} position={[attendance.lat, attendance.lng]} icon={icon} zIndexOffset={900}>
                <Popup className="dark-popup">
                  <span className="font-bold text-heading">Sua localização {isSoIda ? '(Só Ida)' : ''}</span>
                </Popup>
              </Marker>
            );
          })()}

          {/* Marcadores de Alunos — Alunos com status liberado ou só ida */}
          {publicList.filter(a => {
            // Se o próprio aluno está transmitindo o GPS da van, a Van já representa sua posição na rota
            if (isBroadcasting && a.studentId === user?.uid) return false;
            // Se este aluno é o transmissor da viagem (a bordo), a Van já representa sua posição
            if (trip?.locationProviderId && a.studentId === trip.locationProviderId) return false;
            if (a.studentId === user?.uid && attendance?.status !== 'liberado') return false;
            if (a.status === 'cancelado' || a.status === 'embarcado') return false;
            if (!a.lat || !a.lng || isNaN(a.lat) || isNaN(a.lng)) return false;
            return a.status === 'liberado' || a.tripType === 'ida';
          }).map(att => {
            const isMe = att.studentId === user?.uid;
            const isSoIda = att.tripType === 'ida';
            const displayName = isMe ? 'Você' : (att.studentName ? att.studentName.split(' ')[0] : 'Aluno');
            const icon = createStudentMapIcon(displayName, isMe, true, isSoIda, isDark);
            return (
              <Marker key={`${att.id}_${att.status}`} position={[att.lat, att.lng]} icon={icon} zIndexOffset={isMe ? 850 : (isSoIda ? 750 : 800)}>
                <Popup className="dark-popup">
                  <span className="font-bold text-heading">{isMe ? `Você (${att.studentName})` : att.studentName} {isSoIda ? '(Só Ida)' : ''}</span>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador do Ônibus / Van em Tempo Real */}
          {activeBusLocation?.lat != null && activeBusLocation?.lng != null && !isNaN(activeBusLocation.lat) && !isNaN(activeBusLocation.lng) && (
            <Marker 
              key={trip?.id ? `${trip.id}_bus` : 'active_bus'} 
              position={[activeBusLocation.lat, activeBusLocation.lng]} 
              icon={student.route === 'Cromínia' ? busIconAlt : busIcon} 
              zIndexOffset={1000}
            >
              <Popup className="dark-popup">
                <span className="font-bold flex flex-col gap-1" style={{color: gpsState === 'live' ? '#f97316' : gpsState === 'stale' ? '#d97706' : '#71717a'}}>
                  <span>{student.route === 'Cromínia' ? 'Ônibus' : 'Van'} ({trip?.route || student.route})</span>
                  <span className="text-[10px] text-caption uppercase tracking-wider font-semibold">
                    {isBroadcasting
                      ? 'Transmitido por você (Você está a bordo)'
                      : gpsState === 'live'
                        ? `Ao vivo · ${trip?.locationProviderName || trip?.driverName || 'Motorista'}`
                        : gpsState === 'stale'
                          ? `Sinal instável · ${elapsedLabel} · ${trip?.locationProviderName || 'Motorista'}`
                          : `Offline · ${elapsedLabel} · última posição conhecida`
                    }
                  </span>
                </span>
              </Popup>
            </Marker>
          )}

          {/* Linha da Rota OSRM (Apenas para o ônibus do próprio aluno, se não for só ida) */}
          {attendance?.tripType !== 'ida' && routePath && routePath.length > 0 && (
            <Polyline positions={routePath} color={student.route === 'Cromínia' ? (isDark ? "#ffffff" : "#334155") : "#f97316"} weight={5} opacity={0.8} />
          )}

          {/* Rota Global Dinâmica (Calculada pelo motorista) */}
          {trip?.globalRoute && trip.globalRoute.length > 0 && trip?.status !== 'finished' && (
            <Polyline positions={trip.globalRoute} color="#3b82f6" weight={6} opacity={0.9} dashArray="10, 10" />
          )}

          <LocationPickerMode isEditing={isEditingLocation} onLocationSelected={setTempLocation} />
          {!isEditingLocation && <MapInteractionListener onInteract={() => setIsPanelCollapsed(true)} />}
          
          {/* Pino temporário do ajuste de local (Circular moderno com pulso, sem gota) */}
          {isEditingLocation && tempLocation?.lat != null && tempLocation?.lng != null && (
            <Marker position={[tempLocation.lat, tempLocation.lng]} icon={createAdjustmentPinIcon('Novo Ponto', isDark)} zIndexOffset={900} />
          )}

          {/* Botão de Centralizar no GPS */}
          {!isEditingLocation && (
            isEmbarcado && activeBusLocation?.lat != null && activeBusLocation?.lng != null ? (
              <RecenterButton lat={activeBusLocation.lat} lng={activeBusLocation.lng} isPanelCollapsed={isPanelCollapsed} />
            ) : attendance?.lat != null && attendance?.lng != null && !isNaN(attendance.lat) && !isNaN(attendance.lng) ? (
              <RecenterButton lat={attendance.lat} lng={attendance.lng} isPanelCollapsed={isPanelCollapsed} />
            ) : null
          )}

          {/* Controlador de Voo Suave no Início da Transmissão */}
          <MapFlyTo target={activeBusLocation} trigger={focusTrigger} />
        </MapContainer>

        {/* UI do Modo de Edição de Local */}
        {isEditingLocation && (
          <>
            <div className="absolute top-4 left-4 right-4 z-[2000] bg-card/90 backdrop-blur-md border border-primary p-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-center text-primary font-bold text-sm">Toque no mapa para mover seu pino</p>
            </div>
            
            <div className="absolute bottom-6 left-4 right-4 z-[2000] flex gap-3 animate-in slide-in-from-bottom-6">
              <button 
                onClick={() => { setIsEditingLocation(false); setTempLocation(null); }}
                className="flex-1 btn-secondary text-sm !px-4 !py-3 border border-subtle"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveLocation}
                disabled={isSubmitting || !tempLocation}
                className="flex-1 btn-primary text-sm !px-4 !py-3 disabled:opacity-50"
              >
                {isSubmitting ? "Salvando..." : "Salvar Local"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Container Flutuante Inferior (Ações do Aluno) */}
      {!isEditingLocation && (
        <div className={`absolute bottom-[72px] w-full electric-card bg-card border-t border-subtle rounded-t-[2.5rem] shadow-2xl z-[2000] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelCollapsed ? 'translate-y-[calc(100%+72px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        {/* Espaçamento superior que substitui o drag handle */}
        <div className="w-full flex justify-center pt-6 pb-2"></div>

        <div className="px-6 pb-8">
          {!trip ? (
            <div className="text-center py-6">
              <p className="text-caption font-medium">Nenhuma viagem ativa no momento</p>
            </div>
          ) : trip.status === 'finished' ? (
            isLiberado ? (
              <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-2 tracking-tight">Viagem Encerrada</h2>
                <p className="text-body font-medium leading-relaxed mb-4 text-sm">O motorista finalizou a rota, mas você ainda estava aguardando. Você ficou para trás?</p>
                <button 
                  onClick={handleEmergencia}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "REGISTRANDO..." : "FUI ESQUECIDO"}
                </button>
              </div>
            ) : attendance?.status === 'esquecido' ? (
              <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-orange-500 mb-2 tracking-tight">Alerta Ativo</h2>
                <p className="text-body font-medium leading-relaxed">Sua ocorrência foi registrada e a coordenação foi avisada do incidente.</p>
              </div>
            ) : (
              <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-green-500/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold text-heading mb-2 tracking-tight">Viagem Finalizada</h2>
                <p className="text-body font-medium leading-relaxed">Todos os alunos foram entregues aos seus destinos.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-5">
              
              {/* Status Header: Destino e ETA */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                    {student?.faculty || 'DESTINO'}
                  </span>
                  <h2 className="text-xl font-bold text-heading truncate">
                    {isEmbarcado ? (
                      'Embarcado no ônibus'
                    ) : isLiberado ? (
                      'Confirmado! Aguarde na portaria'
                    ) : isCancelado ? (
                      'Presença cancelada hoje'
                    ) : (
                      'Aguardando sua confirmação'
                    )}
                  </h2>
                </div>

                {/* Previsão OSRM / Distância Dinâmica */}
                {isLiberado && trip?.status === 'in_progress' && (
                  <div className="text-right shrink-0 bg-subtle border border-subtle rounded-2xl px-4 py-2">
                    <span className="text-[10px] text-caption uppercase tracking-wider block font-bold">Chegada Estimada</span>
                    <span className="text-2xl font-black text-heading font-mono tracking-tight">
                      {etaMinutes !== null ? (
                        etaMinutes <= 1 ? '<1 min' : `~${etaMinutes} min`
                      ) : (
                        'Calculando...'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de Ação Principal */}
              <div className="pt-2 flex flex-col gap-2">
                {/* Se liberado: Mostra o botão LIBERADO com status e opção de atualizar localização */}
                {isLiberado && (
                  <>
                    <button
                      onClick={handleLiberar}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-full font-display font-black text-base uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                      title="Toque para atualizar sua localização novamente"
                    >
                      <Check size={22} strokeWidth={3} />
                      LIBERADO {attendance?.tripType === 'ida' ? '(SÓ IDA)' : attendance?.tripType === 'volta' ? '(SÓ VOLTA)' : '(IDA E VOLTA)'}
                    </button>
                    
                    <button
                      onClick={() => handleCancelarEmbarque()}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 text-caption hover:text-danger hover:bg-danger-bg border border-subtle cursor-pointer"
                    >
                      <X size={15} />
                      Cancelar embarque
                    </button>
                  </>
                )}

                {/* Se não liberado (aguardando ou cancelado): botão LIBERADO que faz a captura de localização */}
                {!isLiberado && (
                  <button
                    onClick={handleLiberar}
                    disabled={isSubmitting || isEmbarcado}
                    className={`w-full py-4 rounded-full font-display font-black text-base uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] cursor-pointer ${
                      isEmbarcado
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : 'btn-primary'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isEmbarcado ? (
                        <>
                          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          EMBARCADO
                        </>
                      ) : (
                        <>
                          <Check size={24} strokeWidth={2.5} />
                          LIBERADO
                        </>
                      )}
                    </span>
                  </button>
                )}
                {/* Botão de Compartilhar GPS foi movido para a barra inferior */}
              </div>

            </div>
          )}
        </div>
      </div>
      )}

      {/* Bottom Navigation Bar (WhatsApp style) */}
      {!isEditingLocation && (
        <div 
          className="bottom-nav bg-surface border-t border-subtle flex items-center justify-around gap-1 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-[3000] shrink-0 pb-safe shadow-lg w-full overflow-hidden select-none touch-none overscroll-none"
          onWheel={(e) => e.preventDefault()}
        >
          
          <button 
            onClick={() => {
              const newState = !isPublicListOpen;
              playTapSound();
              setIsPublicListOpen(newState);
              if (newState) setIsPanelCollapsed(true);
            }}
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors relative"
          >
            <div className="relative p-1.5 sm:p-2">
              <Users size={22} />
              <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
                {publicList.length}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Lista</span>
          </button>

          <button 
            onClick={() => {
              const nextCollapsed = !isPanelCollapsed;
              if (!nextCollapsed) {
                playPopSound();
              } else {
                playTapSound();
              }
              setIsPanelCollapsed(nextCollapsed);
              setIsPublicListOpen(false);
            }}
            className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-colors cursor-pointer ${
              !isPanelCollapsed
                ? 'text-orange-500 font-bold'
                : 'text-body hover:text-primary'
            }`}
          >
            <div className="p-1.5 sm:p-2 relative">
              {isLiberado ? (
                <>
                  <Check size={22} className={!isPanelCollapsed ? "text-orange-500" : "text-heading"} strokeWidth={2.5} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]"></span>
                </>
              ) : isEmbarcado ? (
                <Bus size={22} />
              ) : (
                <Navigation size={22} />
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              {isEmbarcado ? 'Embarcado' : isLiberado ? 'Liberado' : 'Embarque'}
            </span>
          </button>

          <div id="navbar-compass-slot" className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"></div>
          <div id="navbar-recenter-slot" className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"></div>

          {isLiberado && (
             <>
               <button 
                 onClick={() => {
                   setIsEditingLocation(true);
                   setTempLocation(attendance?.lat && attendance?.lng ? { lat: attendance.lat, lng: attendance.lng } : null);
                   setIsPanelCollapsed(true);
                   setIsPublicListOpen(false);
                 }}
                 className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
               >
                 <div className="p-1.5 sm:p-2"><MapPin size={22} /></div>
                 <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Ajustar</span>
               </button>

               <button 
                 onClick={() => setShowCheckInModal(true)}
                 className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
               >
                 <div className="p-1.5 sm:p-2"><Navigation size={22} /></div>
                 <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Trajeto</span>
               </button>
             </>
          )}

          {isEmbarcado && (
            <button 
              onClick={handleToggleBroadcasting}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-all cursor-pointer ${
                isBroadcasting 
                  ? 'text-red-500 hover:text-red-400 font-bold scale-105' 
                  : 'text-body hover:text-primary'
              }`}
              title={isBroadcasting ? "Pausar transmissão de GPS da van" : "Transmitir GPS da van para os outros alunos"}
            >
              <div className="p-1.5 sm:p-2 relative">
                <Radio size={22} className={isBroadcasting ? "animate-pulse" : ""} />
                {isBroadcasting && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-ping"></span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">{isBroadcasting ? 'GPS Ativo' : 'Enviar GPS'}</span>
            </button>
          )}

          {/* Botão de Alerta de Parada (Acorda Aluno) */}
          <button
            type="button"
            onClick={() => setIsWakeUpSettingsOpen(true)}
            className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-all cursor-pointer ${
              wakeUpSettings.enabled ? 'text-orange-500 font-bold' : 'text-body hover:text-primary'
            }`}
            title="Configurar alarme para não perder a parada na volta"
          >
            <div className="p-1.5 sm:p-2 relative">
              <BellRing size={22} className={wakeUpSettings.enabled ? 'text-orange-500' : ''} />
              {wakeUpSettings.enabled && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]"></span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              {wakeUpSettings.enabled ? 'Alarme ON' : 'Alarme'}
            </span>
          </button>

        </div>
      )}

{/* Modal de Check-in (Trajeto) */}
        {showCheckInModal && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => {
                setShowCheckInModal(false);
                if (user?.uid) {
                  localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
                }
              }}
            ></div>
            <div className="relative electric-card bg-card w-full max-w-sm rounded-3xl border border-subtle shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                <Navigation size={32} />
              </div>
              <h2 className="text-2xl font-bold text-heading mb-2">Vai embarcar hoje?</h2>
              <p className="text-sm text-caption mb-6">Selecione seu trajeto para confirmar sua presença na lista do motorista.</p>
              
              <div className="space-y-3">
                {[
                  { id: 'ida_volta', label: 'Ida e Volta' },
                  { id: 'ida', label: 'Só Ida' },
                  { id: 'volta', label: 'Só Volta' }
                ].map((option) => {
                  const currentSelection = attendance?.tripType || selectedTripType || 'ida_volta';
                  const isSelected = currentSelection === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedTripType(option.id);
                        setShowCheckInModal(false);
                        handleCheckIn(option.id);
                      }}
                      className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-between px-5 cursor-pointer active:scale-[0.98] ${
                        isSelected
                          ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/20'
                          : 'bg-subtle hover-bg-subtle text-heading border border-subtle'
                      }`}
                    >
                      <span className="flex-1 text-center font-black tracking-wide">{option.label}</span>
                      {isSelected && (
                        <Check size={20} strokeWidth={3} className="text-black shrink-0 -ml-5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => {
                  setShowCheckInModal(false);
                  if (user?.uid) {
                    localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
                  }
                }}
                className="mt-6 text-sm text-caption hover:text-heading transition-colors"
              >
                Decidir mais tarde
              </button>
            </div>
          </div>
        )}

        {/* Modal da Lista Pública */}
        {/* Modal Lista de Passageiros */}
        <PublicListModal
          isOpen={isPublicListOpen}
          onClose={() => setIsPublicListOpen(false)}
          list={publicList}
          title="Lista de Passageiros"
          onStudentStatus={handleStudentStatus}
        />

        {/* Modal de Alarme de Descida (Acorda Aluno) */}
        <WakeUpAlarmModal
          isOpen={isWakeUpAlarmModalOpen}
          distanceMeters={currentDistanceToStop}
          stopName={wakeUpSettings?.stopLocation ? 'Sua Parada Configurada' : (student?.route ? `Parada em ${student.route}` : 'Seu Ponto de Descida')}
          onDismiss={() => {
            setIsWakeUpAlarmModalOpen(false);
            setWakeUpAlarmTriggered(true);
          }}
          onSnooze={() => {
            setIsWakeUpAlarmModalOpen(false);
            setWakeUpSettings(prev => ({ ...prev, distance: Math.max(200, prev.distance - 300) }));
            setWakeUpAlarmTriggered(false);
          }}
        />

        {/* Modal de Configuração do Alarme */}
        <WakeUpSettingsModal
          isOpen={isWakeUpSettingsOpen}
          onClose={() => setIsWakeUpSettingsOpen(false)}
          settings={wakeUpSettings}
          onSaveSettings={handleSaveWakeUpSettings}
          onChangeStopLocation={() => {
            setIsWakeUpSettingsOpen(false);
            setIsSettingDropOffLocation(true);
          }}
        />

        {/* Seletor do Ponto de Descida no Mapa */}
        {isSettingDropOffLocation && (
          <LocationPickerMap
            title="Definir Ponto de Descida (Alarme)"
            subtitle="Marque no mapa o ponto onde você costuma descer na volta para casa."
            initialCenter={
              wakeUpSettings?.stopLocation
                ? [wakeUpSettings.stopLocation.lat, wakeUpSettings.stopLocation.lng]
                : CENTER
            }
            initialPin={wakeUpSettings?.stopLocation || null}
            onConfirm={(loc) => {
              setIsSettingDropOffLocation(false);
              if (loc) {
                handleSetStopLocation([loc.lat, loc.lng]);
              }
            }}
            onClose={() => setIsSettingDropOffLocation(false)}
          />
        )}
      </div>
  );
}
