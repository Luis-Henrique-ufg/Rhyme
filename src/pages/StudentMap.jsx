import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Users, Check, RefreshCcw, MapPin, Navigation, LocateFixed, X, Radio } from 'lucide-react';
import { doc, collection, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../config/firebase';
import { joinTrip, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useTripAttendances, useOsrmEta } from '../utils/useTripData';
import Header from '../components/Header';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MapInteractions from '../components/MapInteractions';
import ReactDOM from 'react-dom';
import { useCustomAlert } from '../contexts/AlertContext';
import { playNotificationSound } from '../utils/audioEffects';
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

// Ícone do motorista (Van / Ônibus) — estilo Uber, adapta ao horário e transmissão ao vivo
const createBusIcon = (isCrominia, isDark = true, isBroadcasting = false) => {
  const night = isDark;
  const label = isCrominia ? 'Ônibus' : (isBroadcasting ? 'VAN (AO VIVO)' : 'VAN');
  const bgColor = isCrominia
    ? (night ? '#ffffff' : '#18181b')
    : '#f97316';
  const borderColor = isCrominia
    ? (night ? '#111' : '#f4f4f5')
    : (night ? '#111' : '#fff7ed');
  const iconColor = isCrominia ? (night ? '#111' : '#f4f4f5') : '#ffffff';
  const wheelColor = isCrominia ? (night ? '#f4f4f5' : '#111') : '#111';

  const pulseColor = isCrominia ? (night ? '#818cf8' : '#6366f1') : '#f97316';
  const pulseBg = isCrominia
    ? (night ? 'rgba(129, 140, 248, 0.25)' : 'rgba(99, 102, 241, 0.25)')
    : 'rgba(249, 115, 22, 0.25)';
  const pulseShadow = isCrominia
    ? (night ? 'rgba(129, 140, 248, 0.45)' : 'rgba(99, 102, 241, 0.45)')
    : 'rgba(249, 115, 22, 0.45)';

  const pulseRing = isBroadcasting ? `
    <div style="
      position: absolute;
      inset: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2.5px solid ${pulseColor};
      background: radial-gradient(circle, ${pulseBg} 0%, transparent 70%);
      box-shadow: 0 0 16px ${pulseShadow};
      animation: radarPulse 2.4s ease-out infinite;
      pointer-events: none;
      z-index: 1;
    "></div>
    <div style="
      position: absolute;
      inset: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid ${pulseColor};
      background: radial-gradient(circle, ${pulseBg} 0%, transparent 70%);
      box-shadow: 0 0 12px ${pulseShadow};
      animation: radarPulse 2.4s ease-out 1.2s infinite;
      pointer-events: none;
      z-index: 1;
    "></div>
  ` : '';

  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        <div style="
          background: ${night ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.96)'};
          color: ${isBroadcasting ? '#f97316' : (night ? '#f4f4f5' : '#18181b')};
          font-size: 10px; font-weight: 800;
          font-family: Inter, system-ui, sans-serif;
          padding: 2px 7px; border-radius: 6px; white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,${night ? '0.5' : '0.15'});
          border: 1px solid ${isBroadcasting ? 'rgba(249,115,22,0.4)' : (night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
          margin-bottom: 4px; letter-spacing: 0.02em; text-transform: uppercase;
          z-index: 3;
        ">${label}</div>
        <div style="
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${pulseRing}
          <div style="
            width:48px; height:48px; background:${bgColor}; border-radius:50%;
            border: 3.5px solid ${borderColor};
            box-shadow: 0 6px 20px rgba(0,0,0,${night ? '0.6' : '0.2'});
            display:flex; align-items:center; justify-content:center; color:${iconColor};
            position: relative;
            z-index: 2;
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

// Ícone de aluno — teardrop/pin nativo do Mapbox, mas com foto ou inicial
const createStudentPinIcon = (name, isCrominia, isDark = true) => {
  const night = isDark;
  const accent = isCrominia ? (isDark ? '#71717a' : '#475569') : '#f97316';
  const textColor = night ? '#f4f4f5' : '#18181b';
  const labelBg = night ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.97)';
  const shadow = night ? '0 4px 14px rgba(0,0,0,0.65)' : '0 3px 10px rgba(0,0,0,0.32)';
  const borderCol = night ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  // Teardrop SVG pin
  const pinSvg = `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="${accent}"/>
    <circle cx="16" cy="15" r="8" fill="${night ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'}"/>
    <path d="M16 11c1.8 0 2.7-.9 2.7-2.7s-.9-2.7-2.7-2.7-2.7.9-2.7 2.7.9 2.7 2.7 2.7zm0 1.35c-1.8 0-5.4.9-5.4 2.7v1.35h10.8v-1.35c0-1.8-3.6-2.7-5.4-2.7z" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
        ${name ? `<div style="
          background:${labelBg};
          color:${textColor};
          font-size:10px;font-weight:700;
          font-family:Inter,system-ui,sans-serif;
          padding:2px 7px;border-radius:6px;white-space:nowrap;
          box-shadow:${shadow};
          border:1px solid ${borderCol};
          margin-bottom:3px;max-width:110px;
          overflow:hidden;text-overflow:ellipsis;
        ">${name}</div>` : ''}
        ${pinSvg}
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [32, name ? 72 : 40],
    iconAnchor: [16, name ? 72 : 40]
  });
};

const StudentIcon = createStudentPinIcon('', false);
const StudentIconAlt = createStudentPinIcon('', true);

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

export default function StudentMap() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastingLocation, setBroadcastingLocation] = useState(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTripType, setSelectedTripType] = useState('ida_volta');
  const [hasNotified, setHasNotified] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [hasSeenCheckInModal, setHasSeenCheckInModal] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isRouteBadgeOpen, setIsRouteBadgeOpen] = useState(false);
  const [routePath, setRoutePath] = useState([]);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const watchIdRef = useRef(null);
  const fallbackIntervalRef = useRef(null);
  const simulationInterval = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId, loading: tripLoading, error: tripError } = useCurrentTrip(student?.route?.trim());
  const { attendances: publicList, error: attendancesError } = useTripAttendances(tripId);

  // Transmissão ao vivo do veículo (seja pelo próprio aluno ou outro aluno a bordo)
  const isVehicleLiveBroadcasting = isBroadcasting || Boolean(
    trip?.locationProviderName &&
    trip?.locationProviderName !== 'Motorista' &&
    trip?.locationProviderName !== trip?.driverName
  );
  const busIcon = useMemo(() => createBusIcon(false, isDark, isVehicleLiveBroadcasting), [isDark, isVehicleLiveBroadcasting]);
  const busIconAlt = useMemo(() => createBusIcon(true, isDark, isVehicleLiveBroadcasting), [isDark, isVehicleLiveBroadcasting]);

  const loading = studentLoading || (Boolean(student?.route) && tripLoading);

  // Posição ativa da Van: se o aluno estiver transmitindo seu GPS, a van aparece na posição dele em tempo real
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

  // Listener do perfil do aluno (redireciona se motorista ou não cadastrado)
  useEffect(() => {
    if (!user) return;

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

  useEffect(() => {
    if (isAguardando && !hasSeenCheckInModal) {
      setShowCheckInModal(true);
      setHasSeenCheckInModal(true);
    }
  }, [isAguardando, hasSeenCheckInModal]);

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
              locationProviderId: user.uid
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

  const handleToggleBroadcasting = () => {
    const nextState = !isBroadcasting;
    setIsBroadcasting(nextState);

    if (nextState) {
      if (attendance?.lat && attendance?.lng) {
        setBroadcastingLocation({ lat: attendance.lat, lng: attendance.lng });
      } else if (trip?.busLocation?.lat && trip?.busLocation?.lng) {
        setBroadcastingLocation({ lat: trip.busLocation.lat, lng: trip.busLocation.lng });
      }
      setFocusTrigger(prev => prev + 1);
      showAlert("📍 Transmissão da Van ativada! O ícone da Van agora segue sua posição em tempo real.");
    } else {
      setBroadcastingLocation(null);
      showAlert("Transmissão da Van pausada.");
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
  // ETA é calculado pelo hook useOsrmEta acima.
  // A variável etaMinutes já está disponível no escopo do componente.

  if (loading) {
    return <Loader message="Carregando mapa..." />;
  }

  if (tripError || attendancesError) {
    return <ErrorState message="Não foi possível se conectar aos servidores do Rhyme. Verifique sua internet." />;
  }

  if (!student) {
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <Header userProfile={student} />

      {/* Mapa */}
      <div className="flex-1 relative z-0">
        {/* Badge de Rota (Ocultável) */}
        <div className="absolute top-4 right-4 z-[1000]">
          {isRouteBadgeOpen ? (
            <div className="bg-black/90 [html.light_&]:bg-white/95 backdrop-blur-md border border-white/10 [html.light_&]:border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xl [html.light_&]:shadow-md animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 [html.light_&]:border-slate-200 pb-1">
                <h4 className="text-white [html.light_&]:text-slate-900 text-[10px] font-bold uppercase tracking-wider opacity-80">Sua Rota</h4>
                <button 
                  onClick={() => setIsRouteBadgeOpen(false)}
                  className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 p-0.5 rounded hover:bg-white/10 [html.light_&]:hover:bg-slate-100 transition-colors"
                  title="Ocultar"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${student.route === 'Cromínia' ? 'bg-white [html.light_&]:bg-slate-800 text-white' : 'bg-orange-500 text-orange-500'}`}></div>
                <span className="text-zinc-300 [html.light_&]:text-slate-700 text-xs font-medium">{student.route}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsRouteBadgeOpen(true)}
              className="bg-black/80 [html.light_&]:bg-white/95 hover:bg-black/95 [html.light_&]:hover:bg-slate-100 backdrop-blur-md border border-white/10 [html.light_&]:border-slate-200 text-zinc-300 [html.light_&]:text-slate-700 hover:text-white [html.light_&]:hover:text-slate-900 rounded-xl px-2.5 py-1.5 shadow-xl [html.light_&]:shadow-md transition-all flex items-center gap-1.5 active:scale-95 text-xs font-medium"
              title="Ver sua rota"
            >
              <div className={`w-2 h-2 rounded-full ${student.route === 'Cromínia' ? 'bg-white [html.light_&]:bg-slate-800' : 'bg-orange-500'}`}></div>
              <span className="text-[10px] uppercase font-bold tracking-wider">{student.route}</span>
            </button>
          )}
        </div>

        {/* Banner: Transmitindo GPS como aluno embarcado */}
        {isBroadcasting && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw]">
            <div className="flex items-center gap-2 bg-black/85 [html.light_&]:bg-white/95 backdrop-blur-md border border-orange-500/40 text-orange-400 [html.light_&]:text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
              Transmitindo localização da Van em tempo real
            </div>
          </div>
        )}

        {/* Banner: aguardando GPS do motorista */}
        {!isBroadcasting && trip?.status === 'in_progress' && !busLocation && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001] w-max max-w-[90vw]">
            <div className="flex items-center gap-2 bg-black/80 [html.light_&]:bg-white/95 backdrop-blur-md border border-white/10 [html.light_&]:border-slate-200 text-zinc-300 [html.light_&]:text-slate-700 text-xs font-medium px-4 py-2 rounded-full shadow-xl animate-pulse">
              <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M3.5 8a9.5 9.5 0 0 1 17 0" />
                <path d="M6.5 11a6 6 0 0 1 11 0" />
                <path d="M10.5 14a2 2 0 0 1 3 0" />
                <line x1="12" y1="22" x2="12" y2="17" />
              </svg>
              Aguardando posição GPS do motorista...
            </div>
          </div>
        )}

        <MapContainer center={CENTER} zoom={13} className="w-full h-full" zoomControl={false} attributionControl={false} rotate={true} touchRotate={true}>
          <MapInteractions />
          <TileLayer
            url={isDark ? TILE_NIGHT : TILE_DAY}
            attribution={isDark ? TILE_ATTR_NIGHT : TILE_ATTR_DAY}
            key={isDark ? 'night' : 'day'}
          />
          {/* Marcador do próprio aluno (bolinha) — antes de liberar (bolinha cinza se for só ida) */}
          {attendance?.status !== 'liberado' && attendance?.status !== 'embarcado' && attendance?.lat != null && attendance?.lng != null && !isNaN(attendance.lat) && !isNaN(attendance.lng) && (() => {
            const isSoIda = attendance?.tripType === 'ida';
            const accent = isSoIda ? '#71717a' : (student.route === 'Cromínia' ? (isDark ? '#71717a' : '#475569') : '#f97316');
            const dotIcon = L.divIcon({
              html: `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:56px;height:56px;pointer-events:none;">
                  <div style="width:22px;height:22px;background:${accent};border-radius:50%;border:3px solid ${isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.35)'};box-shadow:0 3px 10px rgba(0,0,0,0.45);"></div>
                </div>
              `,
              className: 'bg-transparent border-none',
              iconSize: [56, 56],
              iconAnchor: [28, 28]
            });
            return (
              <Marker position={[attendance.lat, attendance.lng]} icon={dotIcon} zIndexOffset={900}>
                <Popup className="dark-popup">
                  <span className="font-bold text-white [html.light_&]:text-slate-900">Sua localização {isSoIda ? '(Só Ida)' : ''}</span>
                </Popup>
              </Marker>
            );
          })()}

          {/* Marcadores de Alunos — bolinha cinza para 'só ida', bolinha com sonar para liberados */}
          {publicList.filter(a => {
            if (a.studentId === user?.uid && attendance?.status !== 'liberado') return false;
            if (a.status === 'cancelado' || a.status === 'embarcado') return false;
            if (!a.lat || !a.lng || isNaN(a.lat) || isNaN(a.lng)) return false;
            return a.status === 'liberado' || a.tripType === 'ida';
          }).map(att => {
            const isMe = att.studentId === user?.uid;
            const isSoIda = att.tripType === 'ida';
            const accent = isSoIda ? '#71717a' : (student.route === 'Cromínia' ? (isDark ? '#71717a' : '#475569') : '#f97316');
            const studentIcon = L.divIcon({
              html: `
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:56px;height:56px;pointer-events:none;">
                  ${!isSoIda ? `
                    <style>
                      @keyframes sonar-ring {
                        0%   { transform: scale(0.6); opacity: 0.65; }
                        100% { transform: scale(2.8); opacity: 0; }
                      }
                    </style>
                    <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:${accent};opacity:0.2;animation:sonar-ring 3.5s ease-out infinite;"></div>
                    <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:${accent};opacity:0.15;animation:sonar-ring 3.5s ease-out 1.2s infinite;"></div>
                  ` : ''}
                  <div style="position:relative;width:22px;height:22px;background:${accent};border-radius:50%;border:3px solid ${isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.35)'};box-shadow:0 3px 10px rgba(0,0,0,0.45);z-index:1;"></div>
                </div>
              `,
              className: 'bg-transparent border-none',
              iconSize: [56, 56],
              iconAnchor: [28, 28]
            });
            return (
              <Marker key={att.id} position={[att.lat, att.lng]} icon={studentIcon} zIndexOffset={isSoIda ? 750 : 800}>
                <Popup className="dark-popup">
                  <span className="font-bold text-white [html.light_&]:text-slate-900">{isMe ? `Você (${att.studentName})` : att.studentName} {isSoIda ? '(Só Ida)' : ''}</span>
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
                <span className="font-bold text-orange-500 flex flex-col gap-1">
                  <span>{student.route === 'Cromínia' ? 'Ônibus' : 'Van'} ({trip?.route || student.route})</span>
                  <span className="text-[10px] text-zinc-400 [html.light_&]:text-slate-500 uppercase tracking-wider font-semibold">
                    📍 {isBroadcasting ? 'Transmitido por você (Você está a bordo)' : `Via: ${trip?.locationProviderName || trip?.driverName || 'Motorista'}`}
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
          
          {/* Pino temporário do ajuste de local */}
          {isEditingLocation && tempLocation?.lat != null && tempLocation?.lng != null && (
            <Marker position={[tempLocation.lat, tempLocation.lng]} icon={createStudentPinIcon('Novo Local', student.route === 'Cromínia', isDark)} zIndexOffset={900} />
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
            <div className="absolute top-4 left-4 right-4 z-[2000] bg-surface/90 [html.light_&]:bg-white/90 backdrop-blur-md border border-primary p-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-center text-primary font-bold text-sm">📍 Toque no mapa para mover seu pino</p>
            </div>
            
            <div className="absolute bottom-6 left-4 right-4 z-[2000] flex gap-3 animate-in slide-in-from-bottom-6">
              <button 
                onClick={() => { setIsEditingLocation(false); setTempLocation(null); }}
                className="flex-1 btn-secondary text-sm !px-4 !py-3 border border-white/10 [html.light_&]:border-slate-300"
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
        <div className={`absolute bottom-[72px] w-full electric-card bg-[#0A0A0A] [html.light_&]:bg-white border-t border-orange-500/20 [html.light_&]:border-slate-200 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(249,115,22,0.1)] [html.light_&]:shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-[2000] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelCollapsed ? 'translate-y-[calc(100%+72px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        {/* Espaçamento superior que substitui o drag handle */}
        <div className="w-full flex justify-center pt-6 pb-2"></div>

        <div className="px-6 pb-8">
          {!trip ? (
            <div className="text-center py-6">
              <p className="text-zinc-400 [html.light_&]:text-slate-500 font-medium">Nenhuma viagem ativa no radar 📡</p>
            </div>
          ) : trip.status === 'finished' ? (
            isLiberado ? (
              <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-2 tracking-tight">Viagem Encerrada</h2>
                <p className="text-zinc-400 [html.light_&]:text-slate-600 font-medium leading-relaxed mb-4 text-sm">O motorista finalizou a rota, mas você ainda estava aguardando. Você ficou para trás?</p>
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
                <p className="text-zinc-400 [html.light_&]:text-slate-600 font-medium leading-relaxed">Sua ocorrência foi registrada e a coordenação foi avisada do incidente.</p>
              </div>
            ) : (
              <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-green-500/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white [html.light_&]:text-slate-900 mb-2 tracking-tight">Viagem Finalizada</h2>
                <p className="text-zinc-400 [html.light_&]:text-slate-600 font-medium leading-relaxed">Todos os alunos foram entregues aos seus destinos.</p>
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
                  <h2 className="text-xl font-bold text-white [html.light_&]:text-slate-900 truncate">
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
                  <div className="text-right shrink-0 bg-white/5 [html.light_&]:bg-slate-100 border border-white/10 [html.light_&]:border-slate-200 rounded-2xl px-4 py-2">
                    <span className="text-[10px] text-zinc-400 [html.light_&]:text-slate-500 uppercase tracking-wider block font-bold">Chegada Estimada</span>
                    <span className="text-2xl font-black text-white [html.light_&]:text-slate-900 font-mono tracking-tight">
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
                      className="w-full py-2.5 rounded-full font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 [html.light_&]:border-slate-200 cursor-pointer"
                    >
                      <X size={15} />
                      Cancelar Embarque
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
        <div className="bg-[#050505] [html.light_&]:bg-white border-t border-white/5 [html.light_&]:border-slate-200 flex items-center justify-around gap-2 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-[3000] shrink-0 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] [html.light_&]:shadow-[0_-5px_20px_rgba(0,0,0,0.06)] w-full overflow-x-auto [&>button]:shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          <button 
            onClick={() => {
              const newState = !isPublicListOpen;
              setIsPublicListOpen(newState);
              if (newState) setIsPanelCollapsed(true);
            }}
            className="flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors relative"
          >
            <div className="relative p-2">
              <Users size={24} />
              <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
                {publicList.length}
              </span>
            </div>
            <span className="text-[11px] font-medium mt-0.5">Lista</span>
          </button>

          <button 
            onClick={() => {
              setIsPanelCollapsed(!isPanelCollapsed);
              setIsPublicListOpen(false);
            }}
            className={`flex flex-col items-center justify-center transition-colors ${
              !isPanelCollapsed
                ? 'text-orange-500'
                : isLiberado
                ? 'text-emerald-400'
                : 'text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500'
            }`}
          >
            <div className="p-2 relative">
              {isLiberado ? <Check size={24} className="text-emerald-400" strokeWidth={2.5} /> : <Navigation size={24} />}
            </div>
            <span className="text-[11px] font-medium mt-0.5">
              {isEmbarcado ? 'Embarcado' : isLiberado ? 'Liberado' : 'Embarque'}
            </span>
          </button>

          <div id="navbar-compass-slot" className="flex items-center justify-center empty:hidden"></div>
          <div id="navbar-recenter-slot" className="flex items-center justify-center empty:hidden"></div>

          {isLiberado && (
             <>
               <button 
                 onClick={() => {
                   setIsEditingLocation(true);
                   setTempLocation(attendance?.lat && attendance?.lng ? { lat: attendance.lat, lng: attendance.lng } : null);
                   setIsPanelCollapsed(true);
                   setIsPublicListOpen(false);
                 }}
                 className="flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors"
               >
                 <div className="p-2"><MapPin size={24} /></div>
                 <span className="text-[11px] font-medium mt-0.5">Ajustar</span>
               </button>

               <button 
                 onClick={() => setShowCheckInModal(true)}
                 className="flex flex-col items-center justify-center text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500 transition-colors"
               >
                 <div className="p-2"><Navigation size={24} /></div>
                 <span className="text-[11px] font-medium mt-0.5">Trajeto</span>
               </button>
             </>
          )}

          {isEmbarcado && (
            <button 
              onClick={handleToggleBroadcasting}
              className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
                isBroadcasting 
                  ? 'text-red-500 hover:text-red-400 font-bold scale-105' 
                  : 'text-zinc-300 [html.light_&]:text-slate-600 hover:text-orange-500'
              }`}
              title={isBroadcasting ? "Pausar transmissão de GPS da van" : "Transmitir GPS da van para os outros alunos"}
            >
              <div className="p-2 relative">
                <Radio size={24} className={isBroadcasting ? "animate-pulse" : ""} />
                {isBroadcasting && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-ping"></span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-0.5">{isBroadcasting ? 'GPS Ativo' : 'Enviar GPS'}</span>
            </button>
          )}

        </div>
      )}

{/* Modal de Check-in (Trajeto) */}
        {showCheckInModal && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCheckInModal(false)}></div>
            <div className="relative electric-card bg-[#0A0A0A] [html.light_&]:bg-white w-full max-w-sm rounded-3xl border border-white/10 [html.light_&]:border-slate-200 shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                <Navigation size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white [html.light_&]:text-slate-900 mb-2">Vai embarcar hoje?</h2>
              <p className="text-sm text-zinc-400 [html.light_&]:text-slate-500 mb-6">Selecione seu trajeto para confirmar sua presença na lista do motorista.</p>
              
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
                          : 'bg-white/5 [html.light_&]:bg-slate-100 hover:bg-white/10 [html.light_&]:hover:bg-slate-200 text-white [html.light_&]:text-slate-900 border border-white/10 [html.light_&]:border-slate-300'
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
                onClick={() => setShowCheckInModal(false)}
                className="mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Decidir mais tarde
              </button>
            </div>
          </div>
        )}

        {/* Modal da Lista Pública */}
        {isPublicListOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPublicListOpen(false)}></div>
            <div className="relative electric-card bg-[#0A0A0A]/95 [html.light_&]:bg-white/95 w-full max-w-md rounded-3xl border border-white/10 [html.light_&]:border-slate-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="p-6 border-b border-white/10 [html.light_&]:border-slate-200 bg-gradient-to-b from-orange-500/10 to-transparent z-10 flex justify-between items-center">
                <h2 className="text-xl font-display font-bold text-white [html.light_&]:text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-orange-500" />
                  Lista de Passageiros
                </h2>
                <button onClick={() => setIsPublicListOpen(false)} className="text-zinc-400 [html.light_&]:text-slate-500 hover:text-white [html.light_&]:hover:text-slate-900 p-2 rounded-full hover:bg-white/5 [html.light_&]:hover:bg-slate-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 z-10 space-y-3 custom-scrollbar">
                {publicList.length === 0 ? (
                  <p className="text-zinc-500 [html.light_&]:text-slate-400 text-center py-8">Ninguém na lista ainda.</p>
                ) : (
                  publicList
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
                      let avatarBg = 'bg-gradient-to-br from-orange-500 to-yellow-500 text-black';
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
                        <div key={att.id} className={`flex items-center justify-between border p-4 rounded-2xl transition-colors ${bgColor}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${avatarBg}`}>
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
                              <p className="text-xs text-zinc-400 [html.light_&]:text-slate-500 mt-1">{att.faculty || 'Outra'} • {att.status}</p>
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

            </div>
  );
}
