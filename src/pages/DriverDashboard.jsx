import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Users, Check, RefreshCcw, Navigation, Play, StopCircle, MapPinOff, BarChart2, LocateFixed, ChevronUp, ChevronDown, X, BellRing, Clock, UserCheck, UserX, Timer } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { doc, collection, query, where, getDocs, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../config/firebase';
import { ensureDailyTripExists, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useDriverAttendanceMap } from '../utils/useTripData';
import Header from '../components/Header';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MapInteractions from '../components/MapInteractions';
import ReactDOM from 'react-dom';
import { playSuccessSound, playBoardingAlarmSound } from '../utils/audioEffects';
import { useCustomAlert } from '../contexts/AlertContext';

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
const CENTER = [-16.6869, -49.2643]; // Goiânia

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

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
      className="flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors"
      title="Centralizar"
    >
      <div className="p-2"><LocateFixed size={24} strokeWidth={2.5} /></div>
      <span className="text-[11px] font-medium mt-0.5">Focar</span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
};

// Detecta modo dia/noite para trocar tile do mapa automaticamente
function isNightTime() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

// URLs dos tiles para dia (CartoDB Positron) e noite (CartoDB Dark)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const TILE_DAY = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
const TILE_NIGHT = `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
const TILE_ATTR_DAY = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';
const TILE_ATTR_NIGHT = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>';

// Zoom tracker: reporta nível de zoom de volta ao componente pai
const ZoomTracker = ({ onZoomChange }) => {
  useMapEvents({ zoomend: (e) => onZoomChange(e.target.getZoom()) });
  return null;
};

// Cria cluster marker estilo Uber: círculo branco com contagem e label acima
const createCustomIcon = (liberados, total, label, isCrominia, isDark = true) => {
  const isComplete = total === undefined ? false : (liberados === total && total > 0);
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

  const labelHtml = label ? `
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
  ` : '';

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
    iconAnchor: [20, label ? 66 : 40]
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

// Marcador de Aluno/Passageiro na visão do Motorista — avatar circular com halo/sonar único por status (sem duplicação de anéis)
const createDriverStudentIcon = (name, isLiberado, isSoIda, response = null, totalInCluster = 1, isDark = true, isNextStop = false) => {
  const night = isDark;
  const isComing = response === 'coming';

  // Paleta do passageiro:
  // - A Caminho (respondeu chamado): Azul Céu (#0ea5e9) com halo vibrante
  // - Liberado: Verde Esmeralda (#10b981) indicando "pronto para embarque"
  // - Aguardando: Âmbar (#f59e0b) indicando "ainda em aula/esperando"
  // - Só Ida: Cinza Neutro (#71717a)
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
    // Aluno aguardando que é a próxima parada com a van a caminho (<= 2.5km) -> sonar âmbar exclusivo
    bg = '#f59e0b';
    haloBg = 'rgba(245, 158, 11, 0.22)';
    haloBorder = 'rgba(245, 158, 11, 0.7)';
    showHalo = true;
  }

  const borderCol = night ? '#18181b' : '#ffffff';
  const labelBg = night ? 'rgba(15,15,15,0.94)' : 'rgba(255,255,255,0.96)';
  const labelText = night ? '#f4f4f5' : '#18181b';

  // Halo / Sonar unificado: renderizado SEMPRE no mesmo elemento e na mesma cor do status
  const haloHtml = showHalo ? `
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
    ${isNextStop ? `
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
    ` : ''}
  ` : '';

  // Silhueta de pessoa / estudante (Avatar 👤) ou ícone de check se a caminho
  const userSvg = isComing ? `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ` : `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  `;

  // Badge indicador de múltiplos alunos no cluster (+1, +2...)
  const countBadge = totalInCluster > 1 ? `
    <span style="
      position: absolute;
      top: -4px;
      right: -6px;
      background: ${night ? '#27272a' : '#18181b'};
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      padding: 0 4px;
      border-radius: 9999px;
      border: 1.5px solid ${borderCol};
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 4;
    ">+${totalInCluster - 1}</span>
  ` : '';

  const labelHtml = name ? `
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
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 3;
    ">${name}</div>
  ` : '';

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
    iconAnchor: [14, name ? 36 : 14]
  });
};

const createStudentPinIcon = (name, isCrominia, isDark = true, isSoIda = false) => {
  return createDriverStudentIcon(name, false, isSoIda, null, 1, isDark, false);
};

// Ícone do motorista (Van / Ônibus) — estilo Uber sobre fundo dia/noite
const createBusIcon = (isCrominia, isDark = true) => {
  const night = isDark;
  const label = isCrominia ? 'Ônibus' : 'VAN';
  const bgColor = isCrominia
    ? (night ? '#ffffff' : '#18181b')
    : '#f97316';
  const borderColor = isCrominia
    ? (night ? '#111' : '#f4f4f5')
    : (night ? '#111' : '#fff7ed');
  const iconColor = isCrominia
    ? (night ? '#111' : '#f4f4f5')
    : '#ffffff';
  const wheelColor = isCrominia
    ? (night ? '#f4f4f5' : '#111')
    : '#111';

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      ">
        <div style="
          background: ${night ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.96)'};
          color: ${night ? '#f4f4f5' : '#18181b'};
          font-size: 10px;
          font-weight: 800;
          font-family: Inter, system-ui, sans-serif;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,${night ? '0.5' : '0.45'});
          border: 1px solid ${night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
          margin-bottom: 4px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        ">${label}</div>
        <div style="
          width: 48px;
          height: 48px;
          background: ${bgColor};
          border-radius: 50%;
          border: 3.5px solid ${borderColor};
          box-shadow: 0 6px 20px rgba(0,0,0,${night ? '0.6' : '0.2'}), 0 0 0 1px ${bgColor}44;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${iconColor};
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2"></path>
            <circle cx="9" cy="17" r="2" stroke="currentColor" fill="${wheelColor}" stroke-width="1.5"></circle>
            <path d="M11 17h4"></path>
            <circle cx="17" cy="17" r="2" stroke="currentColor" fill="${wheelColor}" stroke-width="1.5"></circle>
          </svg>
        </div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [48, 80],
    iconAnchor: [24, 80]
  });
};

// Ícone do Halo de Proximidade (Radar animado para faculdades sem cluster de aluno)
const createHaloIcon = (isCrominia, customColor = null) => {
  const baseColor = customColor || (isCrominia ? '#6366f1' : '#f97316');
  return L.divIcon({
    html: `
      <div class="proximity-halo-container" style="--halo-color: ${baseColor}; --halo-bg: ${baseColor}33; --halo-shadow: ${baseColor}55">
        <div class="proximity-halo-ring"></div>
        <div class="proximity-halo-ring delay-1"></div>
        <div class="proximity-halo-ring delay-2"></div>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [90, 90],
    iconAnchor: [45, 45]
  });
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const busIcon = useMemo(() => createBusIcon(false, isDark), [isDark]);
  const busIconAlt = useMemo(() => createBusIcon(true, isDark), [isDark]);
  const HaloIcon = useMemo(() => createHaloIcon(false), []);
  const HaloIconAlt = useMemo(() => createHaloIcon(true), []);
  const [driver, setDriver] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [mapZoom, setMapZoom] = useState(12);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const [activeLocalRoute, setActiveLocalRoute] = useState(null);
  const activeLocalRouteRef = useRef(null); // ref para acesso no GPS callback sem re-render
  const nextStopRef = useRef(null);          // ref do nextStop para acesso no GPS callback
  const isRecalculatingRef = useRef(false);  // evita chamadas OSRM duplas durante recalculo
  const hasArrivedAlertRef = useRef(false);  // evita alerta de chegada repetido
  const pressTimerRef = useRef(null);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [pendingStudentsConfirm, setPendingStudentsConfirm] = useState(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  // GPS real-time state
  const [gpsStatus, setGpsStatus] = useState('waiting'); // 'waiting' | 'active' | 'error'
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null); // Date
  const [gpsAccuracy, setGpsAccuracy] = useState(null); // metres
  const [arrivedAtStudent, setArrivedAtStudent] = useState(false); // toast de chegada ao aluno

  // --- Chamada de Embarque ---
  const [boardingCall, setBoardingCall] = useState(null);          // objeto da chamada ativa
  const [boardingCallSecondsLeft, setBoardingCallSecondsLeft] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const boardingCallIntervalRef = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId, error: tripError } = useCurrentTrip(driver?.route?.trim());
  const { attendanceMap, error: attendanceError } = useDriverAttendanceMap(tripId);

  // Listener do perfil do motorista (redireciona se aluno ou não cadastrado)
  useEffect(() => {
    if (!user) return;

    let unsubDriver = () => {};

    unsubDriver = onSnapshot(doc(db, 'students', user.uid), (driverSnap) => {
      if (!driverSnap.exists()) {
        setLoading(false);
        navigate('/cadastro', { replace: true });
        return;
      }
      const driverData = driverSnap.data();

      if (driverData.role === 'student') {
        navigate('/aluno/mapa', { replace: true });
        return;
      }

      setDriver(driverData);
      setLoading(false);
    }, (err) => {
      console.error('Erro ao carregar perfil do motorista:', err);
      setLoading(false);
    });

    return () => unsubDriver();
  }, [user]);

  // Listener em tempo real dos alunos cadastrados na rota do motorista
  useEffect(() => {
    if (!driver?.route) return;

    const normalizedRoute = normalizeRoute(driver.route);
    const studentsRef = collection(db, 'students');
    // Escuta em tempo real qualquer mudança de rota, cadastro ou atualização de alunos
    const qStudents = query(studentsRef, where('route', '==', normalizedRoute), where('role', '==', 'student'));

    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const studentsData = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setStudents(studentsData);
    }, (err) => {
      console.error('Erro ao escutar alunos da rota:', err);
    });

    return () => unsubStudents();
  }, [driver?.route]);

  // Countdown do timer da Chamada de Embarque (motorista)
  useEffect(() => {
    if (!boardingCall || boardingCall.status !== 'active') {
      clearInterval(boardingCallIntervalRef.current);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.round((boardingCall.expiresAt - Date.now()) / 1000));
      setBoardingCallSecondsLeft(left);
      if (left <= 0) {
        clearInterval(boardingCallIntervalRef.current);
        // Auto-encerra quando o tempo esgota
        setBoardingCall(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    };
    tick();
    boardingCallIntervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(boardingCallIntervalRef.current);
  }, [boardingCall?.expiresAt, boardingCall?.status]);

  // Lê respostas dos alunos a partir do attendanceMap em tempo real
  const boardingResponseMap = useMemo(() => {
    if (!boardingCall?.targetStudentIds) return {};
    const map = {};
    boardingCall.targetStudentIds.forEach(uid => {
      const att = attendanceMap[uid];
      if (att?.boardingResponse) {
        map[uid] = { response: att.boardingResponse, name: att.studentName || 'Aluno', respondedAt: att.boardingResponseAt };
      }
    });
    return map;
  }, [boardingCall?.targetStudentIds, attendanceMap]);


  // Wake Lock: Mantém a tela ligada enquanto a rota está ativa
  useEffect(() => {
    let wakeLock = null;
    
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && trip?.status === 'in_progress') {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.error("Erro ao solicitar wake lock:", err);
        }
      }
    };
    
    requestWakeLock();
    
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trip?.status]);

  // GPS REAL: Atualizar posição do ônibus via dispositivo do motorista
  // Restrito a 'in_progress' para economizar bateria — o GPS aquece ao pressionar Iniciar.
  useEffect(() => {
    if (!trip?.id || trip.status !== 'in_progress') {
      setGpsStatus('waiting');
      return;
    }

    if (!navigator.geolocation) {
      showAlert("Seu navegador não suporta geolocalização. O rastreamento não funcionará.");
      setGpsStatus('error');
      return;
    }

    setGpsStatus('waiting');

    let watchId;
    let fallbackInterval;

    const sendLocation = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // --- Detecção automática de desvio de rota local ---
      // Se há uma rota local ativa, verifica se o motorista se afastou mais de 200m dela.
      // Em caso positivo, limpa a rota local e recalcula para o próximo aluno.
      const localRoute = activeLocalRouteRef.current;
      if (localRoute && localRoute.length > 1) {
        // Bug 4: Verifica proximidade ao DESTINO (último ponto da rota) — < 50m → chegou
        const dest = localRoute[localRoute.length - 1];
        const dLatD = (latitude - dest[0]) * Math.PI / 180;
        const dLngD = (longitude - dest[1]) * Math.PI / 180;
        const aD = Math.sin(dLatD/2)**2 + Math.cos(latitude * Math.PI/180) * Math.cos(dest[0] * Math.PI/180) * Math.sin(dLngD/2)**2;
        const distToDest = 6371000 * 2 * Math.atan2(Math.sqrt(aD), Math.sqrt(1-aD)); // metros

        if (distToDest < 50) {
          console.log(`[Rota] Chegou ao ponto de embarque (${Math.round(distToDest)}m). Limpando rota.`);
          activeLocalRouteRef.current = null;
          setActiveLocalRoute(null);
          if (!hasArrivedAlertRef.current) {
            hasArrivedAlertRef.current = true;
            setArrivedAtStudent(true); // flag para mostrar toast de chegada
          }
        } else {
          // Bug 3: Desvio de rota (> 200m do traçado) → limpa e recalcula pro próximo aluno
          let minDist = Infinity;
          for (const point of localRoute) {
            const dLat = (latitude - point[0]) * Math.PI / 180;
            const dLng = (longitude - point[1]) * Math.PI / 180;
            const a = Math.sin(dLat/2)**2 + Math.cos(latitude * Math.PI/180) * Math.cos(point[0] * Math.PI/180) * Math.sin(dLng/2)**2;
            const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            if (dist < minDist) minDist = dist;
          }
          if (minDist > 200) {
            console.log(`[Rota] Desvio detectado (${Math.round(minDist)}m). Limpando rota local e recalculando.`);
            activeLocalRouteRef.current = null;
            setActiveLocalRoute(null);

            // Auto-recalcula rota para o próximo aluno mais próximo (sem await — não bloqueia GPS)
            const ns = nextStopRef.current;
            if (ns && !isRecalculatingRef.current) {
              isRecalculatingRef.current = true;
              fetch(`https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${ns.lng},${ns.lat}?overview=full&geometries=geojson`)
                .then(r => r.json())
                .then(data => {
                  if (data.routes?.[0]) {
                    const path = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    activeLocalRouteRef.current = path;
                    setActiveLocalRoute(path);
                  }
                })
                .catch(e => console.warn('[Rota] Falha ao recalcular após desvio:', e))
                .finally(() => { isRecalculatingRef.current = false; });
            }
          }
        }
      }
      // --- Fim da detecção de desvio ---

      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          busLocation: { lat: latitude, lng: longitude },
          locationProviderName: trip.driverName || 'Motorista',
          locationProviderId: user.uid,
          locationProviderRole: 'driver',
          locationProviderStatus: 'active',
          locationUpdatedAt: Date.now()
        });
        setGpsStatus('active');
        setLastGpsUpdate(new Date());
        setGpsAccuracy(Math.round(accuracy));
      } catch (e) {
        console.error("Erro ao enviar coordenadas do GPS para o Firebase", e);
        setGpsStatus('error');
      }
    };

    const handleError = (error) => {
      console.error("Erro de GPS:", error.message);
      setGpsStatus('error');
      if (error.code === 1) {
        showAlert("Permissão de GPS negada. Por favor, autorize nas configurações do navegador para transmitir sua localização.");
      } else if (error.code === 2) {
        showAlert("Sinal de GPS indisponível no momento. Buscando...");
      } else if (error.code === 3) {
        showAlert("O sinal do GPS caiu por instabilidade na rede. Tentando reconectar...");
      } else {
        showAlert("Ocorreu um erro ao obter o GPS. Tente reiniciar o trajeto.");
      }
    };

    // watchPosition: evento nativo de mudança de posição
    watchId = navigator.geolocation.watchPosition(sendLocation, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0
      // Sem timeout — evita que o browser desista em áreas de sinal fraco
    });

    // Fallback: força leitura ativa a cada 10s (mitiga hibernação do watchPosition no iOS)
    fallbackInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 5000
      });
    }, 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(fallbackInterval);
      setGpsStatus('waiting');
    };
  }, [trip?.status, trip?.id]);

  const facultySummary = useMemo(() => {
    const map = {};
    Object.values(attendanceMap).forEach(att => {
      if (att.status !== 'liberado' && att.status !== 'aguardando') return;
      const faculty = att.faculty || 'Outra';
      if (!map[faculty]) {
        map[faculty] = { name: faculty, count: 0 };
      }
      map[faculty].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [attendanceMap]);

  const customClusters = useMemo(() => {
    const clusters = [];
    
    Object.entries(attendanceMap).forEach(([studentId, att]) => {
      if ((att.status === 'liberado' || att.status === 'aguardando' || att.tripType === 'ida') && att.status !== 'cancelado' && att.status !== 'embarcado' && att.lat && att.lng) {
        // Usa os dados do próprio attendance, incluindo tripType e resposta de chamada
        const student = { 
          id: studentId,
          name: att.studentName || 'Aluno', 
          faculty: att.faculty, 
          status: att.status, 
          tripType: att.tripType,
          response: att.response || null,
          responseAt: att.responseAt || null
        };

        // Tentar adicionar a um cluster custom existente
        let addedToCluster = false;
        for (let cluster of clusters) {
          const distToCluster = getDistanceFromLatLonInKm(att.lat, att.lng, cluster.lat, cluster.lng);
          if (distToCluster < 0.15) {
            cluster.students.push(student);
            addedToCluster = true;
            break;
          }
        }
        
        if (!addedToCluster) {
          clusters.push({
            id: `cluster_${studentId}`,
            lat: att.lat,
            lng: att.lng,
            students: [student]
          });
        }
      }
    });
    
    return clusters;
  }, [attendanceMap]);

  // Cálculo da Próxima Parada (Mais próxima do ônibus com passageiros pendentes)
  const nextStop = useMemo(() => {
    if (!trip?.busLocation?.lat || !trip?.busLocation?.lng) return null;
    
    const activeStops = [];
    
    // 1. A partir dos customClusters
    customClusters.forEach(cluster => {
      const pendingStudents = cluster.students.filter(s => s.status !== 'embarcado' && s.status !== 'cancelado');
      if (pendingStudents.length > 0) {
        const distKm = getDistanceFromLatLonInKm(trip.busLocation.lat, trip.busLocation.lng, cluster.lat, cluster.lng);
        const liberadosCount = pendingStudents.filter(s => s.status === 'liberado').length;
        const primaryFaculty = pendingStudents[0]?.faculty || 'Ponto de Embarque';
        const title = pendingStudents.length === 1 ? pendingStudents[0].name : primaryFaculty;
        
        activeStops.push({
          id: cluster.id,
          title,
          faculty: primaryFaculty,
          lat: cluster.lat,
          lng: cluster.lng,
          students: pendingStudents,
          totalCount: pendingStudents.length,
          liberadosCount,
          distKm
        });
      }
    });
    
    // 2. A partir das Faculdades MOCK_FACULTIES caso não agrupadas em customClusters
    Object.entries(MOCK_FACULTIES).forEach(([facName, coords]) => {
      const facAttendances = Object.values(attendanceMap).filter(att => 
        att.faculty === facName && att.status !== 'embarcado' && att.status !== 'cancelado' && att.tripType !== 'ida'
      );
      
      const alreadyInStops = activeStops.some(s => s.faculty === facName);
      if (facAttendances.length > 0 && !alreadyInStops) {
        const distKm = getDistanceFromLatLonInKm(trip.busLocation.lat, trip.busLocation.lng, coords[0], coords[1]);
        const liberadosCount = facAttendances.filter(a => a.status === 'liberado').length;
        
        activeStops.push({
          id: `fac_${facName}`,
          title: facName,
          faculty: facName,
          lat: coords[0],
          lng: coords[1],
          students: facAttendances.map(a => ({ name: a.studentName || 'Aluno', faculty: a.faculty, status: a.status })),
          totalCount: facAttendances.length,
          liberadosCount,
          distKm
        });
      }
    });
    
    if (activeStops.length === 0) return null;
    
    // Ordena pela menor distância em relação ao ônibus
    activeStops.sort((a, b) => a.distKm - b.distKm);
    return activeStops[0];
  }, [trip?.busLocation, customClusters, attendanceMap]);

  // Mantém o ref do nextStop sincronizado para acesso no callback do GPS (sem stale closure)
  useEffect(() => {
    nextStopRef.current = nextStop;
    // Quando o nextStop muda (aluno diferente), reseta o flag de chegada
    hasArrivedAlertRef.current = false;
  }, [nextStop?.id]);

  const openNavigationTo = async (lat, lng) => {
    if (!trip?.busLocation && gpsStatus !== 'active') {
      showAlert("Sua localização GPS não está disponível ainda.");
      return;
    }
    
    try {
      const origin = `${trip.busLocation.lng},${trip.busLocation.lat}`;
      const dest = `${lng},${lat}`;
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates;
        const path = coords.map(c => [c[1], c[0]]);
        activeLocalRouteRef.current = path;
        setActiveLocalRoute(path);
        try { playSuccessSound(); } catch (e) {}
      }
    } catch (e) {
      console.error(e);
      showAlert("Falha ao traçar rota local. Verifique sua conexão.");
    }
  };

  const handleStudentStatus = async (studentId, currentStatus, targetStatus) => {
    if (!trip) return;
    try {
      const attendanceId = `${trip.id}_${studentId}`;
      const newStatus = currentStatus === targetStatus ? 'aguardando' : targetStatus;
      
      // Use attendanceMap as primary source (already synced from Firestore)
      // Fall back to the static students list
      const attData = attendanceMap[studentId];
      const studentObj = students.find(s => s.uid === studentId);
      const resolvedName = attData?.studentName || studentObj?.name || 'Aluno';
      const resolvedFaculty = attData?.faculty || studentObj?.faculty || 'Outra';
      const resolvedRoute = attData?.route || studentObj?.route || driver?.route || 'Professor Jamil';
      
      await setDoc(doc(db, 'attendance', attendanceId), { 
        status: newStatus,
        tripId: trip.id,
        studentId: studentId,
        studentName: resolvedName,
        faculty: resolvedFaculty,
        route: resolvedRoute,
        photoURL: attData?.photoURL || studentObj?.photoURL || null
      }, { merge: true });
    } catch(e) {
      console.error(e);
      showAlert("Erro ao atualizar status do aluno");
    }
  };

  // --- Handlers da Chamada de Embarque ---
  const handleStartBoardingCall = async (durationMinutes) => {
    if (!nextStop || !trip?.id) return;
    setShowDurationPicker(false);

    // Extrai UIDs dos alunos pendentes nesta parada a partir do attendanceMap
    const targetStudents = Object.entries(attendanceMap)
      .filter(([_, att]) =>
        att.status !== 'embarcado' && att.status !== 'cancelado' &&
        att.faculty === nextStop.faculty
      )
      .map(([uid, att]) => ({ uid, name: att.studentName || 'Aluno' }));

    if (targetStudents.length === 0) {
      showAlert('Nenhum aluno pendente neste ponto.');
      return;
    }

    const now = Date.now();
    const callData = {
      faculty: nextStop.faculty,
      stopId: nextStop.id,
      targetStudentIds: targetStudents.map(s => s.uid),
      targetStudentNames: targetStudents,
      startedAt: now,
      durationMinutes,
      expiresAt: now + durationMinutes * 60_000,
      status: 'active'
    };

    try {
      await updateDoc(doc(db, 'trips', trip.id), { boardingCall: callData });
      setBoardingCall(callData);
      setBoardingCallSecondsLeft(durationMinutes * 60);
      try { playSuccessSound(); } catch (e) {}
    } catch (e) {
      console.error('Erro ao iniciar chamada de embarque:', e);
      showAlert('Erro ao iniciar chamada de embarque.');
    }
  };

  const handleExtendBoardingCall = async (extraMinutes) => {
    if (!boardingCall || !trip?.id) return;
    const newExpiresAt = boardingCall.expiresAt + extraMinutes * 60_000;
    const updated = { ...boardingCall, expiresAt: newExpiresAt };
    try {
      await updateDoc(doc(db, 'trips', trip.id), { boardingCall: updated });
      setBoardingCall(updated);
    } catch (e) {
      console.error('Erro ao estender chamada:', e);
    }
  };

  const handleCloseBoardingCall = async () => {
    if (!trip?.id) return;
    const closed = boardingCall ? { ...boardingCall, status: 'closed' } : null;
    try {
      if (trip?.id) await updateDoc(doc(db, 'trips', trip.id), { boardingCall: closed });
    } catch (e) {
      console.error('Erro ao encerrar chamada:', e);
    }
    setBoardingCall(null);
    clearInterval(boardingCallIntervalRef.current);
  };

  const handleMarkerPressStart = (lat, lng) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    
    const cancelPress = () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
      window.removeEventListener('touchmove', cancelPress);
      window.removeEventListener('mousemove', cancelPress);
    };

    window.addEventListener('touchmove', cancelPress, { passive: true });
    window.addEventListener('mousemove', cancelPress, { passive: true });

    pressTimerRef.current = setTimeout(() => {
      cancelPress();
      openNavigationTo(lat, lng);
    }, 500);
  };

  const handleMarkerPressEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };

  const updateTripStatus = async (newStatus) => {
    if (!trip || isUpdatingTrip) return;
    setIsUpdatingTrip(true);
    try {
      if (newStatus === 'in_progress') {
        let currentLat = trip.busLocation?.lat;
        let currentLng = trip.busLocation?.lng;

        if (!currentLat || !currentLng) {
          if (navigator.geolocation) {
            await Promise.race([
              new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  currentLat = pos.coords.latitude;
                  currentLng = pos.coords.longitude;
                  resolve();
                }, () => resolve(), { timeout: 3000, maximumAge: 10000 });
              }),
              new Promise((resolve) => setTimeout(resolve, 3500))
            ]);
          }
        }

        const waypoints = customClusters.map(c => `${c.lng},${c.lat}`);
        let routePath = [];
        
        if (waypoints.length > 0) {
          if (currentLat && currentLng) {
            waypoints.unshift(`${currentLng},${currentLat}`);
          }
          if (waypoints.length >= 2) {
            try {
              const coordsString = waypoints.slice(0, 25).join(';');
              const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
              const data = await res.json();
              if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates;
                routePath = coords.map(c => ({ lat: c[1], lng: c[0] }));
              }
            } catch (routeErr) {
              console.error("Erro ao traçar rota inicial OSRM", routeErr);
            }
          }
        }
        
        let updateData = { status: newStatus };
        if (routePath.length > 0) updateData.driverRoutePath = routePath;
        if (currentLat && currentLng) updateData.busLocation = { lat: currentLat, lng: currentLng };
        
        await updateDoc(doc(db, 'trips', trip.id), updateData);
      } else {
        await updateDoc(doc(db, 'trips', trip.id), { status: newStatus });
      }
      // Nota: não chamar setTrip aqui — o trip é gerenciado pelo hook useCurrentTrip
      // via onSnapshot, que atualizará o estado automaticamente.
      if (newStatus === 'in_progress') {
        try { playSuccessSound(); } catch(e){}
        // O GPS real começará a atualizar o banco pelo useEffect acima
      }
    } catch (err) {
      console.error("Erro ao atualizar status da viagem", err);
      showAlert("Erro ao atualizar status da viagem: " + err.message);
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  const recalculateGlobalRoute = async () => {
    if (!trip || trip.status !== 'in_progress') return;
    setIsUpdatingTrip(true);
    try {
      let currentLat = trip.busLocation?.lat;
      let currentLng = trip.busLocation?.lng;
      const waypoints = customClusters.map(c => `${c.lng},${c.lat}`);
      let routePath = [];
      
      if (waypoints.length > 0) {
        if (currentLat && currentLng) {
          waypoints.unshift(`${currentLng},${currentLat}`);
        }
        if (waypoints.length >= 2) {
          const coordsString = waypoints.slice(0, 25).join(';');
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates;
            routePath = coords.map(c => ({ lat: c[1], lng: c[0] }));
          }
        }
      }

      if (routePath.length > 0) {
        // Limpa a rota local (navegação até aluno único) ao recalcular a rota global
        // para evitar polylines duplicadas no mapa.
        activeLocalRouteRef.current = null;
        setActiveLocalRoute(null);
        await updateDoc(doc(db, 'trips', trip.id), { driverRoutePath: routePath });
        try { playSuccessSound(); } catch(e){}
      } else {
        showAlert("Não foi possível traçar rota global (poucos alunos com GPS).");
      }
    } catch (e) {
      console.error(e);
      showAlert("Erro ao recalcular rota.");
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  const clearAllRoutes = async () => {
    activeLocalRouteRef.current = null;
    setActiveLocalRoute(null);
    if (trip?.id) {
      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          driverRoutePath: [],
          globalRoute: [],
          routePath: []
        });
        showAlert("Todas as rotas foram limpas do mapa.");
      } catch (e) {
        console.error("Erro ao limpar rotas:", e);
      }
    }
  };

  const handleFinishClick = () => {
    const pending = Object.values(attendanceMap).filter(att => att.status === 'aguardando' || att.status === 'liberado');
    if (pending.length > 0) {
      setPendingStudentsConfirm(pending);
    } else {
      updateTripStatus('finished');
    }
  };

  const getStudentName = (uid) => {
    const s = students.find(s => s.uid === uid);
    return s ? s.name : 'Aluno';
  };

  if (loading) {
    return <Loader message="Carregando painel do motorista..." />;
  }

  if (tripError || attendanceError) {
    return <ErrorState message="Não foi possível se conectar aos servidores do Rhyme. Verifique sua internet." />;
  }

  if (!driver) {
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header userProfile={driver} />
      


      {/* Main Content Layout (Map + Table Overlay) */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        
        {/* Mapa Leaflet (Fundo 100%) */}
        <div className="absolute inset-0 z-0">
          {/* Legenda de Rotas (Ocultável) */}
          <div className="absolute top-4 right-4 z-[1000]">
            {isLegendOpen ? (
              <div className="bg-black/90 [html.light_&]:bg-white/95 backdrop-blur-md border border-white/10 [html.light_&]:border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xl [html.light_&]:shadow-lg animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 [html.light_&]:border-slate-200 pb-1">
                  <h4 className="text-white [html.light_&]:text-slate-900 text-[10px] font-bold uppercase tracking-wider opacity-80">Legenda de Rotas</h4>
                  <button 
                    onClick={() => setIsLegendOpen(false)} 
                    className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 p-0.5 rounded hover:bg-white/10 [html.light_&]:hover:bg-slate-100 transition-colors"
                    title="Ocultar legenda"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                  <span className="text-zinc-300 [html.light_&]:text-slate-700 text-xs font-medium">Professor Jamil</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white [html.light_&]:bg-slate-800 [html.light_&]:border [html.light_&]:border-slate-400 shadow-[0_0_8px_rgba(255,255,255,0.6)]"></div>
                  <span className="text-zinc-300 [html.light_&]:text-slate-700 text-xs font-medium">Cromínia</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLegendOpen(true)}
                className="bg-black/80 [html.light_&]:bg-white/95 hover:bg-black/95 [html.light_&]:hover:bg-slate-100 backdrop-blur-md border border-white/10 [html.light_&]:border-slate-200 text-zinc-300 [html.light_&]:text-slate-700 hover:text-white [html.light_&]:hover:text-slate-900 rounded-xl px-2.5 py-1.5 shadow-xl [html.light_&]:shadow-md transition-all flex items-center gap-1.5 active:scale-95 text-xs font-medium"
                title="Mostrar legenda de rotas"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-[10px] uppercase font-bold tracking-wider">Legenda</span>
              </button>
            )}
          </div>

          {/* Toast de Chegada ao Aluno */}
          {arrivedAtStudent && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1005] flex items-center gap-3 bg-green-900/95 [html.light_&]:bg-emerald-50 [html.light_&]:border-emerald-300 backdrop-blur-xl border border-green-500/50 rounded-2xl px-4 py-3 shadow-2xl animate-[fadeIn_0.3s_ease-out] pointer-events-auto"
              style={{ maxWidth: 'calc(100vw - 2rem)' }}
            >
              <span className="text-green-400 [html.light_&]:text-emerald-600 text-xl">📍</span>
              <div className="flex flex-col">
                <span className="text-green-200 [html.light_&]:text-emerald-900 text-sm font-bold">Ponto de embarque alcançado</span>
                <span className="text-green-400 [html.light_&]:text-emerald-700 text-xs opacity-80">Confirme o embarque na lista de alunos</span>
              </div>
              <button
                onClick={() => setArrivedAtStudent(false)}
                className="ml-2 text-green-400 [html.light_&]:text-emerald-700 hover:text-white [html.light_&]:hover:text-emerald-950 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* HUD de Próxima Parada (Estilo Waze/GPS) */}
          {trip?.status === 'in_progress' && nextStop && (
            <div className="absolute top-4 left-4 z-[1001] max-w-[calc(100vw-130px)] sm:max-w-md pointer-events-auto">
              {isHudCollapsed ? (
                <button 
                  onClick={() => setIsHudCollapsed(false)}
                  className="flex items-center gap-2.5 bg-[#0A0A0A]/90 [html.light_&]:bg-white/95 [html.light_&]:border-slate-200 [html.light_&]:shadow-lg backdrop-blur-xl border border-orange-500/40 hover:border-orange-500 text-white [html.light_&]:text-slate-900 rounded-full px-3.5 py-2 shadow-2xl transition-all group active:scale-95"
                  title="Expandir detalhes da próxima parada"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                  </span>
                  <span className="text-xs font-bold text-zinc-100 [html.light_&]:text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                    {nextStop.title}
                  </span>
                  <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                    {nextStop.totalCount} {nextStop.totalCount === 1 ? 'aluno' : 'alunos'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 [html.light_&]:text-slate-500 shrink-0 ml-0.5">
                    {nextStop.distKm < 1 ? `${Math.round(nextStop.distKm * 1000)}m` : `${nextStop.distKm.toFixed(1)}km`}
                  </span>
                  <ChevronDown size={14} className="text-zinc-400 [html.light_&]:text-slate-500 group-hover:text-white [html.light_&]:group-hover:text-slate-900 shrink-0" />
                </button>
              ) : (
                <div className="bg-[#0A0A0A]/95 [html.light_&]:bg-white/95 backdrop-blur-2xl border border-orange-500/30 [html.light_&]:border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.7)] [html.light_&]:shadow-[0_10px_35px_rgba(0,0,0,0.08)] flex flex-col gap-2.5 transition-all animate-[fadeIn_0.2s_ease-out]">
                  {/* Top Row: Tag + Minimize Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400 font-mono">
                        PRÓXIMA PARADA
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsHudCollapsed(true)}
                      className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 p-1 rounded-lg hover:bg-white/5 [html.light_&]:hover:bg-slate-100 transition-colors"
                      title="Minimizar painel"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>

                  {/* Content: Title, students & real-time distance */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-white [html.light_&]:text-slate-900 truncate leading-tight">
                        {nextStop.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-400 [html.light_&]:text-slate-500">
                          {nextStop.totalCount} {nextStop.totalCount === 1 ? 'passageiro' : 'passageiros'}
                        </span>
                        {nextStop.liberadosCount > 0 && (
                          <span className="text-emerald-400 [html.light_&]:text-emerald-600 font-semibold bg-emerald-500/10 [html.light_&]:bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20 [html.light_&]:border-emerald-300">
                            {nextStop.liberadosCount} liberado{nextStop.liberadosCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 bg-white/5 [html.light_&]:bg-slate-100 border border-white/10 [html.light_&]:border-slate-200 rounded-xl px-2.5 py-1.5">
                      <div className="text-base sm:text-lg font-black text-white [html.light_&]:text-slate-900 font-mono tracking-tight leading-none">
                        {nextStop.distKm < 1 ? `${Math.round(nextStop.distKm * 1000)}` : nextStop.distKm.toFixed(1)}
                        <span className="text-[10px] text-zinc-400 [html.light_&]:text-slate-500 font-normal ml-0.5">
                          {nextStop.distKm < 1 ? 'm' : 'km'}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 [html.light_&]:text-slate-400 font-medium block mt-0.5 uppercase tracking-wider">distância</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-col gap-2 mt-0.5">
                    <button
                      onClick={() => openNavigationTo(nextStop.lat, nextStop.lng)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                    >
                      <Navigation size={13} className="shrink-0 fill-current" />
                      Traçar rota até este ponto
                    </button>

                    {/* Chamada de Embarque */}
                    {!boardingCall || boardingCall.status !== 'active' ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowDurationPicker(v => !v)}
                          className="w-full flex items-center justify-center gap-2 bg-white/5 [html.light_&]:bg-emerald-50 [html.light_&]:border-emerald-200 border border-white/10 hover:border-emerald-500/60 hover:bg-emerald-500/10 text-zinc-200 [html.light_&]:text-emerald-700 hover:text-emerald-400 font-bold text-xs py-2 px-3 rounded-xl transition-all active:scale-[0.98]"
                        >
                          <BellRing size={13} className="shrink-0" />
                          Chamar Alunos
                        </button>
                        {/* Seletor de Duração */}
                        {showDurationPicker && (
                          <div className="absolute bottom-[110%] left-0 right-0 z-10 bg-[#0d0d0d]/98 [html.light_&]:bg-white/98 border border-white/10 [html.light_&]:border-slate-200 rounded-xl p-3 shadow-2xl flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 [html.light_&]:text-slate-500 flex items-center gap-1.5">
                              <Timer size={11} /> Tolerância de espera
                            </span>
                            <div className="flex gap-2">
                              {[2, 3, 5].map(min => (
                                <button
                                  key={min}
                                  onClick={() => handleStartBoardingCall(min)}
                                  className="flex-1 py-2 rounded-xl bg-emerald-500/10 [html.light_&]:bg-emerald-50 border border-emerald-500/30 [html.light_&]:border-emerald-300 text-emerald-400 [html.light_&]:text-emerald-700 font-black text-sm hover:bg-emerald-500/20 transition-all active:scale-95"
                                >
                                  {min} min
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Chamada Ativa — Cronômetro + Respostas */
                      <div className="rounded-xl border border-emerald-500/30 [html.light_&]:border-emerald-300 bg-emerald-500/5 [html.light_&]:bg-emerald-50 p-3 flex flex-col gap-2">
                        {/* Header: countdown + encerrar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 [html.light_&]:text-emerald-700">Chamada Ativa</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleExtendBoardingCall(1)}
                              className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 [html.light_&]:border-slate-300 hover:border-white/30 transition-all"
                              title="Adicionar 1 minuto"
                            >+1 min</button>
                            <button
                              onClick={handleCloseBoardingCall}
                              className="text-zinc-500 hover:text-red-400 [html.light_&]:text-slate-500 [html.light_&]:hover:text-red-600 p-0.5 rounded transition-colors"
                              title="Encerrar chamada"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Cronômetro */}
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`font-black font-mono text-2xl leading-none ${
                            boardingCallSecondsLeft <= 30 ? 'text-red-400 [html.light_&]:text-red-600 animate-pulse' :
                            boardingCallSecondsLeft <= 60 ? 'text-amber-400 [html.light_&]:text-amber-600' :
                            'text-emerald-400 [html.light_&]:text-emerald-700'
                          }`}>
                            {String(Math.floor(boardingCallSecondsLeft / 60)).padStart(2,'0')}:{String(boardingCallSecondsLeft % 60).padStart(2,'0')}
                          </span>
                          {/* Barra de progresso */}
                          <div className="w-full h-1 bg-white/10 [html.light_&]:bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${(boardingCallSecondsLeft / (boardingCall.durationMinutes * 60)) * 100}%`,
                                background: boardingCallSecondsLeft <= 30 ? '#f87171' : boardingCallSecondsLeft <= 60 ? '#fbbf24' : '#34d399'
                              }}
                            />
                          </div>
                        </div>

                        {/* Lista de respostas dos alunos */}
                        <div className="flex flex-col gap-1">
                          {boardingCall.targetStudentNames?.map(({ uid, name }) => {
                            const resp = boardingResponseMap[uid];
                            return (
                              <div key={uid} className="flex items-center justify-between py-0.5">
                                <span className="text-xs text-zinc-300 [html.light_&]:text-slate-700 font-medium truncate max-w-[120px]">{name}</span>
                                {!resp ? (
                                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 [html.light_&]:text-slate-400">
                                    <Clock size={10} /> Aguardando
                                  </span>
                                ) : resp.response === 'coming' ? (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 [html.light_&]:text-emerald-700 font-semibold">
                                    <UserCheck size={10} /> A caminho
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 [html.light_&]:text-slate-500 line-through">
                                    <UserX size={10} /> Dispensado
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={handleCloseBoardingCall}
                          className="w-full flex items-center justify-center gap-2 bg-zinc-800 [html.light_&]:bg-slate-200 hover:bg-zinc-700 [html.light_&]:hover:bg-slate-300 text-zinc-200 [html.light_&]:text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-all active:scale-[0.98]"
                        >
                          <Check size={13} /> Partir / Encerrar Chamada
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <MapContainer center={CENTER} zoom={12} className="w-full h-full" zoomControl={false} attributionControl={false} rotate={true} touchRotate={true}>
            <MapInteractions />
            <ZoomTracker onZoomChange={setMapZoom} />
            <TileLayer
              url={isDark ? TILE_NIGHT : TILE_DAY}
              attribution={isDark ? TILE_ATTR_NIGHT : TILE_ATTR_DAY}
              key={isDark ? 'night' : 'day'}
            />
            {/* Linha da Rota Geral OSRM (Original/Fixa) */}
            {(trip?.driverRoutePath || trip?.routePath) && ((trip?.driverRoutePath?.length > 0) || (trip?.routePath?.length > 0)) && trip.status !== 'finished' && (
              <Polyline positions={trip.driverRoutePath || trip.routePath} color={driver?.route === 'Cromínia' ? (isDark ? "#ffffff" : "#334155") : "#f97316"} weight={5} opacity={0.8} />
            )}

            {/* Rota Global Dinâmica (Calculada pelo motorista) */}
            {trip?.globalRoute && trip.globalRoute.length > 0 && trip.status !== 'finished' && (
              <Polyline positions={trip.globalRoute} color="#3b82f6" weight={6} opacity={0.9} dashArray="10, 10" />
            )}

            {/* Linha da Rota Local OSRM */}
            {activeLocalRoute && activeLocalRoute.length > 0 && trip.status !== 'finished' && (
              <Polyline positions={activeLocalRoute} color={driver?.route === 'Cromínia' ? (isDark ? "#ffffff" : "#334155") : "#f97316"} weight={6} opacity={0.9} dashArray="10, 10" />
            )}

            {/* Faculdades com passageiros ativos (Apenas da rota do motorista) */}
            {Object.entries(MOCK_FACULTIES)
              .filter(([facName]) => Object.values(attendanceMap).some(att => att.faculty === facName && att.status !== 'cancelado'))
              .map(([facName, coords]) => {
                const isCrominia = driver?.route === 'Cromínia';
                return (
                  <Marker key={facName} position={coords} icon={createFacultyIcon(facName, isCrominia, isDark)}>
                    <Popup className="dark-popup">
                      <span className="font-bold text-white [html.light_&]:text-slate-900">{facName}</span>
                    </Popup>
                  </Marker>
                );
            })}

            {/* Halo de Proximidade Dinâmico no Ponto Mais Próximo:
                Apenas para faculdades (fac_) sem cluster individual de alunos.
                Para alunos individuais, o próprio marcador já renderiza seu sonar exclusivo na cor correta de status, eliminando qualquer duplicação de sonares âmbar + esmeralda. */}
            {nextStop && nextStop.distKm <= 2.5 && trip?.status === 'in_progress' && nextStop.id.startsWith('fac_') && (
              <Marker 
                key={`halo_${nextStop.id}_${nextStop.liberadosCount}`}
                position={[nextStop.lat, nextStop.lng]} 
                icon={createHaloIcon(driver?.route === 'Cromínia', nextStop.liberadosCount > 0 && nextStop.liberadosCount === nextStop.totalCount ? '#10b981' : null)} 
                zIndexOffset={100}
              />
            )}

            {/* Marcadores de Alunos e Grupos (Avatar de Aluno sem gota e sem duplicação de halo) */}
            {trip?.status !== 'finished' && customClusters.map(cluster => {
              const isCrominia = driver?.route === 'Cromínia';
              const totalStudents = cluster.students.length;
              // Se há apenas 1 aluno OU o zoom está próximo (>= 15), mostra o avatar do aluno
              const showIndividual = mapZoom >= 15 || totalStudents === 1;
              const isNextStop = Boolean(nextStop && nextStop.distKm <= 2.5 && nextStop.id === cluster.id);

              if (showIndividual) {
                const isSoIda = cluster.students.every(s => s.tripType === 'ida');
                const hasLiberado = cluster.students.some(s => s.status === 'liberado');
                const hasComing = cluster.students.some(s => s.response === 'coming');
                const primaryStudent = cluster.students[0];
                const rawName = primaryStudent?.name || 'Aluno';
                const firstName = rawName.split(' ')[0];

                let displayName = firstName;
                if (isSoIda) {
                  displayName = `${firstName} (Só Ida)`;
                } else if (totalStudents > 1) {
                  displayName = `${firstName} +${totalStudents - 1}`;
                }

                const icon = createDriverStudentIcon(
                  displayName,
                  hasLiberado,
                  isSoIda,
                  hasComing ? 'coming' : null,
                  totalStudents,
                  isDark,
                  isNextStop
                );

                return (
                  <Marker 
                    key={`${cluster.id}_${hasLiberado ? 'lib' : 'wait'}_${hasComing ? 'com' : ''}_${isNextStop ? 'next' : ''}`} 
                    position={[cluster.lat, cluster.lng]} 
                    icon={icon} 
                    zIndexOffset={isNextStop ? 700 : 600}
                    eventHandlers={{
                      mousedown: () => handleMarkerPressStart(cluster.lat, cluster.lng),
                      mouseup: handleMarkerPressEnd,
                      mouseout: handleMarkerPressEnd,
                      touchstart: () => handleMarkerPressStart(cluster.lat, cluster.lng),
                      touchend: handleMarkerPressEnd,
                      touchcancel: handleMarkerPressEnd,
                      contextmenu: (e) => {
                        if (e.originalEvent) e.originalEvent.preventDefault();
                        openNavigationTo(cluster.lat, cluster.lng);
                      }
                    }}
                  >
                    <Popup className="dark-popup">
                      <div className="p-1 min-w-[140px] text-xs">
                        <div className="font-bold text-sm mb-1 text-white [html.light_&]:text-slate-900 border-b border-white/10 pb-1 flex items-center justify-between">
                          <span>{totalStudents === 1 ? 'Aluno' : `${totalStudents} Alunos`}</span>
                          {cluster.students[0]?.faculty && (
                            <span className="text-[10px] font-normal text-orange-400">{cluster.students[0].faculty}</span>
                          )}
                        </div>
                        <div className="space-y-1 my-1.5 max-h-36 overflow-y-auto">
                          {cluster.students.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'liberado' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : s.tripType === 'ida' ? 'bg-zinc-400' : 'bg-amber-500'}`}></span>
                                <span className="text-zinc-200 [html.light_&]:text-slate-800 font-medium truncate">{s.name}</span>
                              </div>
                              <div className="flex-shrink-0 text-[10px]">
                                {s.response === 'coming' ? (
                                  <span className="text-sky-400 font-bold bg-sky-500/10 px-1 py-0.5 rounded">A caminho</span>
                                ) : s.status === 'liberado' ? (
                                  <span className="text-emerald-400 font-semibold">Liberado</span>
                                ) : s.tripType === 'ida' ? (
                                  <span className="text-zinc-400">Só ida</span>
                                ) : (
                                  <span className="text-amber-400">Aguardando</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openNavigationTo(cluster.lat, cluster.lng);
                          }}
                          className="mt-2 w-full py-1 px-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Navigation size={12} />
                          Navegar até aqui
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              } else {
                // Zoom out com múltiplos alunos: agrupa num ícone com contador
                const primaryFaculty = cluster.students[0]?.faculty || '';
                const liberados = cluster.students.filter(s => s.status === 'liberado').length;
                const total = totalStudents;
                const icon = createCustomIcon(liberados, total, primaryFaculty, isCrominia, isDark);
                return (
                  <Marker 
                    key={cluster.id} 
                    position={[cluster.lat, cluster.lng]} 
                    icon={icon} 
                    zIndexOffset={500}
                    eventHandlers={{
                      mousedown: () => handleMarkerPressStart(cluster.lat, cluster.lng),
                      mouseup: handleMarkerPressEnd,
                      mouseout: handleMarkerPressEnd,
                      touchstart: () => handleMarkerPressStart(cluster.lat, cluster.lng),
                      touchend: handleMarkerPressEnd,
                      touchcancel: handleMarkerPressEnd,
                      contextmenu: (e) => {
                        if (e.originalEvent) e.originalEvent.preventDefault();
                        openNavigationTo(cluster.lat, cluster.lng);
                      }
                    }}
                  >
                    <Popup className="dark-popup">
                      <div className="p-1 min-w-[140px] text-xs">
                        <div className="font-bold text-sm mb-1 text-white [html.light_&]:text-slate-900 border-b border-white/10 pb-1 flex items-center justify-between">
                          <span>{primaryFaculty || 'Grupo de Alunos'}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">{liberados}/{total}</span>
                        </div>
                        <div className="space-y-1 my-1.5 max-h-36 overflow-y-auto">
                          {cluster.students.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'liberado' ? 'bg-emerald-500' : s.tripType === 'ida' ? 'bg-zinc-400' : 'bg-amber-500'}`}></span>
                                <span className="text-zinc-200 [html.light_&]:text-slate-800 font-medium truncate">{s.name}</span>
                              </div>
                              <div className="flex-shrink-0 text-[10px]">
                                {s.response === 'coming' ? (
                                  <span className="text-sky-400 font-bold">A caminho</span>
                                ) : s.status === 'liberado' ? (
                                  <span className="text-emerald-400">Liberado</span>
                                ) : (
                                  <span className="text-amber-400">Aguardando</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openNavigationTo(cluster.lat, cluster.lng);
                          }}
                          className="mt-2 w-full py-1 px-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Navigation size={12} />
                          Navegar até aqui
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
            })}

            {/* Botão de Centralizar no GPS do Motorista */}
            {trip?.busLocation?.lat && trip?.busLocation?.lng && (
              <>
                <Marker position={[trip.busLocation.lat, trip.busLocation.lng]} icon={driver?.route === 'Cromínia' ? busIconAlt : busIcon} zIndexOffset={1000}>
                  <Popup className="dark-popup">
                    <span className="font-bold text-orange-500">Você ({driver?.route === 'Cromínia' ? 'Ônibus' : 'VAN'})</span>
                  </Popup>
                </Marker>
                <RecenterButton lat={trip.busLocation.lat} lng={trip.busLocation.lng} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Tabela Consolidada (Painel Flutuante) */}
        <div className={`absolute md:relative z-10 w-full md:w-[400px] electric-card bg-[#0A0A0A] [html.light_&]:bg-white p-5 overflow-y-auto border-t md:border-t-0 md:border-r border-orange-500/20 [html.light_&]:border-slate-200 shadow-[10px_0_40px_rgba(249,115,22,0.1)] [html.light_&]:shadow-[10px_0_40px_rgba(0,0,0,0.08)] flex flex-col mt-auto md:mt-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelOpen ? 'translate-y-0 md:translate-x-0 max-h-[55vh] md:max-h-full bottom-0' : 'translate-y-full md:translate-y-0 md:-translate-x-full max-h-[55vh] md:max-h-full bottom-0 md:left-0'} `}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bricolage font-light text-white [html.light_&]:text-slate-900 tracking-tight">Resumo da Rota</h2>
            <button 
              onClick={() => setIsPanelOpen(false)} 
              className="w-8 h-8 flex items-center justify-center bg-white/5 [html.light_&]:bg-slate-100 hover:bg-white/10 [html.light_&]:hover:bg-slate-200 text-neutral-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 rounded-full transition-colors border border-white/10 [html.light_&]:border-slate-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          {!trip && (
             <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-xl mb-4 text-sm font-medium">
               Nenhuma viagem aberta no momento. (Aguardando criação de rota).
             </div>
          )}
          
          <div className="flex-1 space-y-4 pr-2 custom-scrollbar">
            {facultySummary.map(fac => (
              <div key={fac.name} className="bg-white/5 [html.light_&]:bg-slate-50 border border-white/5 [html.light_&]:border-slate-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white [html.light_&]:text-slate-900 text-lg">{fac.name}</h3>
                  <p className="text-zinc-500 [html.light_&]:text-slate-500 text-sm font-medium">Na lista de hoje</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-orange-500">
                    {fac.count} <span className="text-sm font-medium text-zinc-600 [html.light_&]:text-slate-400">passageiros</span>
                  </div>
                </div>
              </div>
            ))}
            {facultySummary.length === 0 && (
              <p className="text-center text-zinc-500 [html.light_&]:text-slate-400 py-6">Nenhum aluno aguardando na rota hoje.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal da Lista Pública (Checklist de Embarque) */}
      {isPublicListOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPublicListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#0A0A0A]/95 [html.light_&]:bg-white/95 border border-white/10 [html.light_&]:border-slate-200 rounded-3xl shadow-2xl overflow-hidden electric-card flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/10 [html.light_&]:border-slate-200 bg-gradient-to-b from-orange-500/10 to-transparent">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white [html.light_&]:text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-orange-500" />
                  Checklist de Embarque
                </h3>
                <button onClick={() => setIsPublicListOpen(false)} className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 p-2 rounded-full hover:bg-white/5 [html.light_&]:hover:bg-slate-100 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {Object.values(attendanceMap).length === 0 ? (
                <div className="text-center py-8 text-zinc-500 [html.light_&]:text-slate-400">
                  <p>Nenhum aluno na lista de hoje.</p>
                </div>
              ) : (
                Object.values(attendanceMap)
                  .sort((a, b) => {
                    const statusOrder = { 'aguardando': 0, 'liberado': 0, 'embarcado': 1, 'cancelado': 2 };
                    const orderA = statusOrder[a.status] ?? 0;
                    const orderB = statusOrder[b.status] ?? 0;
                    if (orderA !== orderB) return orderA - orderB;
                    return (a.studentName || '').localeCompare(b.studentName || '');
                  })
                  .map(att => {
                    const isEmbarcado = att.status === 'embarcado';
                    const isCancelado = att.status === 'cancelado';
                    
                    let bgColor = 'bg-white/5 [html.light_&]:bg-slate-50 border-white/5 [html.light_&]:border-slate-200 hover:bg-white/10 [html.light_&]:hover:bg-slate-100';
                    let avatarBg = 'bg-gradient-to-br from-orange-500 to-yellow-500';
                    let nameColor = 'text-white [html.light_&]:text-slate-900';
                    
                    if (isEmbarcado) {
                      bgColor = 'bg-orange-500/10 border-orange-500/30';
                      avatarBg = 'bg-orange-500 text-black';
                      nameColor = 'text-orange-500 line-through opacity-70';
                    } else if (isCancelado) {
                      bgColor = 'bg-zinc-800/50 [html.light_&]:bg-slate-100 border-zinc-700/50 [html.light_&]:border-slate-200';
                      avatarBg = 'bg-zinc-700 [html.light_&]:bg-slate-300 text-zinc-400 [html.light_&]:text-slate-600';
                      nameColor = 'text-zinc-500 [html.light_&]:text-slate-400 line-through opacity-70';
                    }

                    let tripTypeLabel = '';
                    if (att.tripType === 'ida_volta') tripTypeLabel = 'Ida e Volta';
                    else if (att.tripType === 'ida') tripTypeLabel = 'Só Ida';
                    else if (att.tripType === 'volta') tripTypeLabel = 'Só Volta';
                    
                    return (
                      <div key={att.studentId} className={`flex items-center justify-between border p-4 rounded-2xl transition-colors ${bgColor}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-lg ${avatarBg}`}>
                            {(att.studentName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-bold leading-tight flex items-center gap-2 flex-wrap ${nameColor}`}>
                              {att.studentName || 'Aluno'}
                              {tripTypeLabel && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 [html.light_&]:bg-slate-200 border border-white/20 [html.light_&]:border-slate-300 uppercase tracking-wider font-bold">
                                  {tripTypeLabel}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-zinc-400 [html.light_&]:text-slate-500 mt-1">{att.faculty} • {att.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStudentStatus(att.studentId, att.status, 'cancelado')}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${isCancelado ? 'bg-zinc-800 [html.light_&]:bg-slate-200 text-zinc-400 [html.light_&]:text-slate-700 border-zinc-700 [html.light_&]:border-slate-300 hover:bg-zinc-700' : 'bg-white/10 [html.light_&]:bg-slate-100 text-zinc-400 [html.light_&]:text-slate-600 border-white/10 [html.light_&]:border-slate-200 hover:bg-zinc-800 hover:text-zinc-300'}`}
                            title={isCancelado ? "Desfazer ausência" : "Marcar como não vai"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleStudentStatus(att.studentId, att.status, 'embarcado')}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${isEmbarcado ? 'bg-orange-500 text-black border-orange-500 hover:bg-orange-600' : 'bg-white/10 [html.light_&]:bg-slate-100 text-zinc-400 [html.light_&]:text-slate-600 border-white/10 [html.light_&]:border-slate-200 hover:bg-orange-500 hover:text-black hover:border-orange-500'}`}
                            title={isEmbarcado ? "Desfazer embarque" : "Marcar como embarcado"}
                          >
                            <Check size={20} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (WhatsApp style) */}
      {trip && (
        <div 
          className="bg-[#050505] [html.light_&]:bg-white/95 border-t border-white/5 [html.light_&]:border-slate-200 flex items-center justify-around gap-1 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-50 shrink-0 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] [html.light_&]:shadow-[0_-4px_20px_rgba(0,0,0,0.06)] w-full overflow-hidden select-none touch-none overscroll-none"
          onWheel={(e) => e.preventDefault()}
        >
          
          <button 
            onClick={() => {
              const newState = !isPublicListOpen;
              setIsPublicListOpen(newState);
              if (newState) setIsPanelOpen(false);
            }}
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors relative"
          >
            <div className="relative p-1.5 sm:p-2">
              <Users size={22} />
              <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
                {Object.values(attendanceMap).filter(att => att.status === 'liberado' || att.status === 'aguardando').length}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Lista</span>
          </button>

          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-colors ${isPanelOpen ? 'text-orange-500' : 'text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500'}`}
          >
            <div className="p-1.5 sm:p-2"><BarChart2 size={22} /></div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Resumo</span>
          </button>

          {/* Indicador GPS — visível apenas em in_progress, alinhado ao design system */}
          {trip.status === 'in_progress' && (
            <div
              title={gpsAccuracy != null ? `Precisão: ±${gpsAccuracy}m` : 'Aguardando GPS...'}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center shrink-0 select-none ${
                gpsStatus === 'active' ? 'text-emerald-400 [html.light_&]:text-emerald-600' :
                gpsStatus === 'error' ? 'text-red-400 [html.light_&]:text-red-600' : 'text-zinc-500 [html.light_&]:text-slate-400'
              }`}
            >
              <div className="relative p-1.5 sm:p-2">
                {gpsStatus === 'active' && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400/20 [html.light_&]:bg-emerald-500/20 animate-ping" />
                )}
                <LocateFixed size={22} className="relative" />
              </div>
              <span className="text-[10px] font-bold mt-0.5 leading-none truncate max-w-full">
                {gpsStatus === 'active' ? (gpsAccuracy != null ? `±${gpsAccuracy}m` : 'AO VIVO') :
                 gpsStatus === 'error' ? 'Erro' : 'GPS'}
              </span>
            </div>
          )}

          <div id="navbar-compass-slot" className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"></div>
          <div id="navbar-recenter-slot" className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"></div>

          {trip.status === 'open' && (
            <button 
              onClick={() => updateTripStatus('in_progress')}
              disabled={isUpdatingTrip}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-1.5 sm:p-2"><Play size={22} /></div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">{isUpdatingTrip ? 'Iniciando' : 'Iniciar'}</span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button 
              onClick={recalculateGlobalRoute}
              disabled={isUpdatingTrip}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-1.5 sm:p-2"><RefreshCcw size={22} /></div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">{isUpdatingTrip ? 'Atz...' : 'Atualizar'}</span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button 
              onClick={handleFinishClick}
              className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-red-500 transition-colors"
            >
              <div className="p-1.5 sm:p-2"><StopCircle size={22} /></div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Finalizar</span>
            </button>
          )}

          {trip.status === 'finished' && (
            <button 
              onClick={() => updateTripStatus('open')}
              className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors"
            >
              <div className="p-1.5 sm:p-2"><Play size={22} /></div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Reabrir</span>
            </button>
          )}

          {Boolean((activeLocalRoute && activeLocalRoute.length > 0) || (trip?.driverRoutePath && trip.driverRoutePath.length > 0) || (trip?.routePath && trip.routePath.length > 0) || (trip?.globalRoute && trip.globalRoute.length > 0)) && trip.status !== 'finished' && (
             <button 
               onClick={clearAllRoutes}
               className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors"
               title="Limpar todas as rotas do mapa"
             >
               <div className="p-1.5 sm:p-2"><MapPinOff size={22} /></div>
               <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">Limpar</span>
             </button>
          )}

        </div>
      )}

      {/* Modal de Alunos Deixados para Trás */}
      {pendingStudentsConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0A0A0A] [html.light_&]:bg-white border border-white/10 [html.light_&]:border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-white [html.light_&]:text-slate-900 mb-2 relative z-10">Finalizar Viagem?</h3>
            <p className="text-zinc-400 [html.light_&]:text-slate-600 text-sm mb-4 relative z-10">
              Ainda há <strong className="text-white [html.light_&]:text-slate-900">{pendingStudentsConfirm.length}</strong> aluno(s) aguardando na lista:
              <br/>
              <span className="text-orange-400 font-medium italic mt-1 block">
                {pendingStudentsConfirm.map(s => s.studentName).join(', ')}
              </span>
              <br/>
              Eles embarcaram e você esqueceu de marcar, ou realmente ficaram para trás?
            </p>
            <div className="flex flex-col gap-2 relative z-10">
              <button 
                onClick={async () => {
                  setPendingStudentsConfirm(null);
                  setIsUpdatingTrip(true);
                  try {
                    for (let student of pendingStudentsConfirm) {
                      await handleStudentStatus(student.studentId, student.status, 'embarcado');
                    }
                    await updateTripStatus('finished');
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsUpdatingTrip(false);
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Eles Embarcaram (Marcar e Finalizar)
              </button>
              <button 
                onClick={() => {
                  setPendingStudentsConfirm(null);
                  updateTripStatus('finished');
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
              >
                Ficaram Para Trás (Apenas Finalizar)
              </button>
              <button 
                onClick={() => setPendingStudentsConfirm(null)}
                className="w-full bg-white/10 [html.light_&]:bg-slate-100 hover:bg-white/20 [html.light_&]:hover:bg-slate-200 text-white [html.light_&]:text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors mt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
