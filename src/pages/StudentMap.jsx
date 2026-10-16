import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import {
  Users,
  Check,
  RefreshCcw,
  MapPin,
  Navigation,
  LocateFixed,
  X,
  Radio,
  BellRing,
  Bus,
  Footprints,
  School,
  Volume2,
  Compass,
  Crosshair,
} from 'lucide-react';
import {
  subscribeToStudentProfile,
  subscribeToAttendance,
  respondToBoardingCall,
  toggleAttendanceStatus,
  updateAttendanceTripType,
  saveUserDefaultTripType,
  checkInAttendance,
  markStudentLiberado,
  updateStudentCustomLocation,
  cancelAttendance,
  reportEmergencyAndMarkForgotten,
  updateStudentDropOffLocation,
  updateStudentRoute,
  broadcastBusLocationByStudent,
  pauseBusBroadcastByStudent,
} from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { joinTrip, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useTripAttendances, useOsrmEta } from '../hooks/useTripData';
import { useBusBroadcaster } from '../hooks/useBusBroadcaster';
import { useStudentLocation } from '../hooks/useStudentLocation';
import { useNearbyStudents } from '../hooks/useNearbyStudents';
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
import { useWakeUpAlarm } from '../hooks/useWakeUpAlarm';
import BroadcastModal from '../components/BroadcastModal';
import CheckInModal from '../components/CheckInModal';
import StudentControls from '../components/StudentControls';
import {
  MAPBOX_TOKEN,
  TILE_DAY,
  TILE_NIGHT,
  TILE_ATTR_DAY,
  TILE_ATTR_NIGHT,
  createBusIcon,
  createFacultyIcon,
  createAdjustmentPinIcon,
  createStudentMapIcon,
  createPedestrianIcon,
  createCampusPoiIcon,
  createCustomDestinationIcon,
  createSearchedPlaceIcon,
} from '../utils/mapIcons';
import {
  MapBridge,
  RecenterButton,
  LocationPickerMode,
  MapInteractionListener,
  MapFlyTo,
  CampusLongPressHandler,
} from '../components/StudentMapControllers';
import { useCustomAlert } from '../contexts/AlertContext';
import {
  MOCK_FACULTIES,
  CENTER,
  getDistanceFromLatLonInKm,
  getFacultyCoords,
} from '../services/geoService';

import {
  playNotificationSound,
  playBoardingAlarmSound,
  playTapSound,
  playToggleSound,
  playPopSound,
  playSuccessSound,
  triggerHaptic,
} from '../services/audioService';
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
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function StudentMap() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const [focusTrigger, setFocusTrigger] = useState(0);
  const {
    userWalkingCoords,
    setUserWalkingCoords,
    startCampusWalkingWatch,
    stopCampusWalkingWatch,
  } = useStudentLocation();

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
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [routePath, setRoutePath] = useState([]);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const simulationInterval = useRef(null);

  // --- 1. Alerta de Descida / Acorda Aluno ---
  const {
    wakeUpSettings,
    setWakeUpSettings,
    isWakeUpSettingsOpen,
    setIsWakeUpSettingsOpen,
    isWakeUpAlarmModalOpen,
    setIsWakeUpAlarmModalOpen,
    setWakeUpAlarmTriggered,
    currentDistanceToStop,
    isSettingDropOffLocation,
    setIsSettingDropOffLocation,
    handleSaveWakeUpSettings,
    handleSetStopLocation,
  } = useWakeUpAlarm({
    student,
    attendance,
    trip,
    isBroadcasting,
    broadcastingLocation,
    user,
    showAlert,
  });

  // --- 2. Modo Campus Pedestre ---
  const [isCampusModeActive, setIsCampusModeActive] = useState(false);
  const [campusFacultyData, setCampusFacultyData] = useState(null);
  const [selectedCampusPoi, setSelectedCampusPoi] = useState(null);
  const [customCampusDestination, setCustomCampusDestination] = useState(null);

  // POIs do campus ativo
  const campusPois = useMemo(() => {
    const key = Object.keys(CAMPUS_POIS).find((k) =>
      (campusFacultyData?.name || student?.faculty || 'UFG').toUpperCase().includes(k)
    );
    return key && CAMPUS_POIS[key] ? CAMPUS_POIS[key] : [];
  }, [campusFacultyData, student]);

  // Checa se o usuário está realmente no campus ou próximo (<= 3km) para evitar traçados de longa distância
  const isUserNearCampus = useMemo(() => {
    if (!userWalkingCoords) return false;
    const campusCenter = campusFacultyData?.coords || getFacultyCoords(student);
    if (!campusCenter) return false;
    const distKm = getDistanceFromLatLonInKm(
      userWalkingCoords[0],
      userWalkingCoords[1],
      campusCenter[0],
      campusCenter[1]
    );
    return distKm <= 3.0; // Usuário no campus (até 3km)
  }, [userWalkingCoords, campusFacultyData, student]);

  // Origem da rota pedestre dentro do campus — sempre usa GPS real quando disponível
  const campusRouteOrigin = useMemo(() => {
    if (!isCampusModeActive) return null;
    // Prioridade: GPS em tempo real > coords base do campus (fallback)
    if (userWalkingCoords) return userWalkingCoords;
    return campusFacultyData?.coords || getFacultyCoords(student);
  }, [isCampusModeActive, userWalkingCoords, campusFacultyData, student]);

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
  }, [
    isCampusModeActive,
    customCampusDestination,
    selectedCampusPoi,
    isUserNearCampus,
    userWalkingCoords,
    campusFacultyData,
    student,
  ]);

  // Traçado Pedestre pelas calçadas e passarelas internas do campus (Mapbox Walking + OSM Routed-Foot fallback)
  const campusRouteCacheRef = useRef(new Map());
  const [campusWalkingRoute, setCampusWalkingRoute] = useState(null);
  const [campusRouteMetrics, setCampusRouteMetrics] = useState({
    distanceMeters: null,
    durationMinutes: null,
  });

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
      durationMinutes: Math.max(1, Math.round((straightDistKm * 1000) / 70)),
    });

    let isCancelled = false;

    const fetchPedestrianRoute = async () => {
      try {
        // 1ª Opção: Mapbox Directions API (Perfil Walking com busca pelo menor trajeto)
        if (MAPBOX_TOKEN) {
          const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${oLng},${oLat};${tLng},${tLat}?alternatives=true&overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
          const res = await fetch(mapboxUrl);
          if (res.ok) {
            const data = await res.json();
            const validRoutes = (data.routes || []).filter(
              (r) => r?.geometry?.coordinates?.length > 1
            );
            if (validRoutes.length > 0) {
              // Seleciona a rota com o menor trajeto possível entre as alternativas
              const shortestRoute = validRoutes.reduce(
                (prev, curr) => (curr.distance < prev.distance ? curr : prev),
                validRoutes[0]
              );
              const coords = shortestRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
              const fullRoute = [campusRouteOrigin, ...coords, campusRouteTarget];
              const dist = Math.round(shortestRoute.distance);
              const mins = Math.max(1, Math.round(shortestRoute.duration / 60));

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

        // 2ª Opção (Fallback): OpenStreetMap Routed Foot (Pedestre com alternativas)
        const osmFootUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${oLng},${oLat};${tLng},${tLat}?alternatives=true&overview=full&geometries=geojson`;
        const osmRes = await fetch(osmFootUrl);
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          const validRoutes = (osmData.routes || []).filter(
            (r) => r?.geometry?.coordinates?.length > 1
          );
          if (validRoutes.length > 0) {
            const shortestRoute = validRoutes.reduce(
              (prev, curr) => (curr.distance < prev.distance ? curr : prev),
              validRoutes[0]
            );
            const coords = shortestRoute.geometry.coordinates.map((c) => [c[1], c[0]]);
            const fullRoute = [campusRouteOrigin, ...coords, campusRouteTarget];
            const dist = Math.round(shortestRoute.distance);
            const duration = shortestRoute.duration || dist / 1.16;
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
      origin[0],
      origin[1],
      customCampusDestination.lat,
      customCampusDestination.lng
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
      name: 'Destino no Mapa',
    });
    setSelectedCampusPoi(null);
  }, []);

  // --- 3. Busca no Mapa ---
  const [searchedPlace, setSearchedPlace] = useState(null);
  const mapInstanceRef = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const {
    trip,
    tripId,
    loading: tripLoading,
    error: tripError,
  } = useCurrentTrip(student?.route?.trim());
  const { attendances: publicList, error: attendancesError } = useTripAttendances(tripId);

  const { isBroadcasting, broadcastingLocation, stopBroadcasting, startBroadcasting } =
    useBusBroadcaster({
      trip,
      tripId,
      user,
      student,
      attendance,
      gpsState,
      showAlert,
      setFocusTrigger,
    });

  const visibleOtherStudents = useNearbyStudents({ publicList, user, trip });

  // --- Relógio para reatualizar elapsed label a cada 30 s ---
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // --- Sistema de Frescor do GPS ---
  // Limiares: live < 45 s | stale 45 s – 3 min | expired > 3 min
  const GPS_LIVE_MS = 45_000;
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
      if (age < GPS_LIVE_MS) return 'live';
      if (age < GPS_STALE_MS) return 'stale';
      return 'expired';
    }
    // Sem timestamp (dados legados): assume live se há posição
    return 'live';
  }, [
    isBroadcasting,
    trip?.locationProviderStatus,
    trip?.busLocation,
    trip?.locationUpdatedAt,
    now,
  ]);

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
  const isDriverActive =
    trip?.locationProviderRole === 'driver' && (gpsState === 'live' || gpsState === 'stale');
  const isAnotherStudentActive =
    trip?.locationProviderRole === 'student' &&
    (gpsState === 'live' || gpsState === 'stale') &&
    trip?.locationProviderId !== user?.uid;

  const busIcon = useMemo(
    () => createBusIcon(false, isDark, gpsState, elapsedLabel),
    [isDark, gpsState, elapsedLabel]
  );
  const busIconAlt = useMemo(
    () => createBusIcon(true, isDark, gpsState, elapsedLabel),
    [isDark, gpsState, elapsedLabel]
  );

  const loading = studentLoading || (Boolean(student?.route) && tripLoading);

  // Posição ativa da Van:
  // Se o aluno transmite manualmente → posição local; caso contrário → última do Firestore (sempre visível)
  const activeBusLocation =
    isBroadcasting && broadcastingLocation
      ? broadcastingLocation
      : trip?.busLocation?.lat != null && trip?.busLocation?.lng != null
        ? trip.busLocation
        : null;
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
    try {
      playBoardingAlarmSound();
    } catch (e) {}
    // Notificação do sistema (toca mesmo com celular bloqueado se a permissão foi concedida)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Van na portaria!', {
          body: `A Van chegou em ${trip.boardingCall.faculty || 'sua faculdade'}. Você tem ${trip.boardingCall.durationMinutes} min para embarcar.`,
          icon: '/android-chrome-192x192.png',
          tag: 'boarding-call',
          requireInteraction: true,
        });
      } catch (e) {
        console.warn('Notificação de embarque bloqueada:', e);
      }
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
      await respondToBoardingCall(attendanceId, response);
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

    const unsub = subscribeToStudentProfile(
      user.uid,
      (snap) => {
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
      },
      (err) => {
        console.error('Erro ao carregar perfil do aluno:', err);
        setStudentError(err);
        setStudentLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Listener do attendance próprio do aluno + joinTrip explícito
  useEffect(() => {
    if (!trip || !user || !student) return;

    const attendanceId = `${trip.id}_${user.uid}`;

    // Ação explícita de mutação separada do hook de leitura
    const facCoords = getFacultyCoords(student);
    joinTrip(trip.id, { uid: user.uid, ...student }, { lat: facCoords[0], lng: facCoords[1] });

    const unsub = subscribeToAttendance(attendanceId, (docSnap) => {
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
      facCoords[0],
      facCoords[1],
      trip.busLocation.lat,
      trip.busLocation.lng
    );

    if (distKm <= 1.0) {
      setHasNotified(true);
      try {
        playNotificationSound();
      } catch (e) {
        console.error('Audio blocked', e);
      }
      showAlert('O ônibus está chegando na sua localização!');
    }
  }, [trip?.busLocation, student?.faculty, hasNotified, attendance?.status]);

  const prevPublicList = useRef([]);
  useEffect(() => {
    if (prevPublicList.current.length > publicList.length) {
      const removed = prevPublicList.current.filter(
        (p1) => !publicList.find((p2) => p2.id === p1.id)
      );
      removed.forEach((r) => {
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
      await toggleAttendanceStatus(attendanceId, currentStatus, targetStatus);
    } catch (e) {
      console.error(e);
      showAlert('Erro ao atualizar status do aluno');
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
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${studentLng},${studentLat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates;
        const path = coords.map((c) => [c[1], c[0]]);
        setRoutePath(path);
      }
    } catch (e) {
      console.error('Erro ao traçar rota', e);
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
  }, [
    isAguardando,
    attendance?.tripType,
    student?.defaultTripType,
    user?.uid,
    trip?.id,
    studentLoading,
    hasSeenCheckInModal,
  ]);

  // Se o aluno já possui uma preferência de trajeto no perfil, sincroniza automaticamente com o attendance diário sem reabrir modal
  useEffect(() => {
    if (
      !attendance?.tripType &&
      student?.defaultTripType &&
      trip?.id &&
      user?.uid &&
      isAguardando
    ) {
      updateAttendanceTripType(`${trip.id}_${user.uid}`, student.defaultTripType).catch((e) =>
        console.warn('Erro ao sincronizar defaultTripType com attendance:', e)
      );
    }
  }, [attendance?.tripType, student?.defaultTripType, trip?.id, user?.uid, isAguardando]);

  useEffect(() => {
    if (attendance?.tripType) {
      setSelectedTripType(attendance.tripType);
    }
  }, [attendance?.tripType]);

  // Garante que a rota seja traçada ao carregar a página (F5) caso já esteja liberado
  // Prioriza GPS em tempo real (userWalkingCoords) sobre coords estáticas do banco de dados
  useEffect(() => {
    if (isLiberado && routePath.length === 0) {
      const lat = userWalkingCoords?.[0] ?? attendance?.lat;
      const lng = userWalkingCoords?.[1] ?? attendance?.lng;
      if (lat && lng) drawRouteToBus(lat, lng);
    }
  }, [isLiberado, attendance?.lat, attendance?.lng, userWalkingCoords, trip?.busLocation]);

  const handleToggleBroadcasting = () => {
    if (isBroadcasting) {
      stopBroadcasting();
    } else {
      if (isDriverActive) {
        showAlert(
          'O motorista já está compartilhando a localização. Você não precisa ativar o GPS.'
        );
        return;
      }
      setShowBroadcastModal(true);
    }
  };

  const handleTripTypeChange = async (type) => {
    setSelectedTripType(type);
    if (attendance && attendance.status !== 'cancelado') {
      try {
        await updateAttendanceTripType(`${trip.id}_${user.uid}`, type);
      } catch (e) {
        console.error('Erro ao atualizar trajeto', e);
      }
    }
  };

  // Check-in: registra apenas o tipo de viagem (ida, volta, ida_volta) mantendo o status aguardando
  const handleCheckIn = async (type) => {
    if (!trip || !user) {
      console.warn('handleCheckIn abortado: trip ou user não carregados', { trip, user });
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
      await checkInAttendance(attendanceId, {
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
      });

      // Salva preferência para não solicitar novamente nas próximas visitas/viagens
      if (user?.uid) {
        localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
        localStorage.setItem('rhyme_default_trip_type', type);
        try {
          await saveUserDefaultTripType(user.uid, type);
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
      console.error('Erro ao salvar trajeto:', err);
      showAlert('Erro ao salvar trajeto. Tente novamente.');
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
      // Feedback visual e otimista imediato no estado local do aluno
      setAttendance((prev) => ({
        ...(prev || {}),
        tripId: trip.id,
        studentId: user.uid,
        studentName: student?.name || 'Aluno',
        faculty: student?.faculty || 'Outra',
        route: normalizeRoute(student?.route) || 'Professor Jamil',
        status: 'liberado',
        lat,
        lng,
      }));

      // Voo suave do mapa para centralizar e destacar a nova posição do aluno liberado
      if (mapInstanceRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
        mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      }

      try {
        await markStudentLiberado(
          attendanceId,
          {
            tripId: trip.id,
            studentId: user.uid,
            studentName: student?.name || 'Aluno',
            faculty: student?.faculty || 'Outra',
            route: normalizeRoute(student?.route) || 'Professor Jamil',
            photoURL: student?.photoURL || null,
          },
          lat,
          lng
        );

        if (attendance?.tripType !== 'ida' && selectedTripType !== 'ida') {
          drawRouteToBus(lat, lng);
        }
        showAlert('Você foi liberado! Sua localização foi atualizada para o motorista.');
      } catch (err) {
        console.error('Erro ao marcar liberação:', err);
        showAlert('Erro ao liberar. Tente novamente.');
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
          console.warn(
            'GPS não capturado com precisão, usando coordenadas base:',
            error?.message || error
          );
          const facCoords = getFacultyCoords(student);
          const fallbackLat =
            userWalkingCoords?.[0] ?? attendance?.lat ?? (facCoords ? facCoords[0] : CENTER[0]);
          const fallbackLng =
            userWalkingCoords?.[1] ?? attendance?.lng ?? (facCoords ? facCoords[1] : CENTER[1]);
          executeLiberacao(fallbackLat, fallbackLng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const facCoords = getFacultyCoords(student);
      const fallbackLat =
        userWalkingCoords?.[0] ?? attendance?.lat ?? (facCoords ? facCoords[0] : CENTER[0]);
      const fallbackLng =
        userWalkingCoords?.[1] ?? attendance?.lng ?? (facCoords ? facCoords[1] : CENTER[1]);
      executeLiberacao(fallbackLat, fallbackLng);
    }
  };

  const handleSaveLocation = async () => {
    if (!tempLocation || !trip || !user) return;
    setIsSubmitting(true);
    // Feedback otimista imediato
    setAttendance((prev) => ({
      ...(prev || {}),
      tripId: trip.id,
      studentId: user.uid,
      studentName: student?.name || 'Aluno',
      status: 'liberado',
      lat: tempLocation.lat,
      lng: tempLocation.lng,
    }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([tempLocation.lat, tempLocation.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }

    try {
      const attendanceId = `${trip.id}_${user.uid}`;
      await updateStudentCustomLocation(
        attendanceId,
        {
          tripId: trip.id,
          studentId: user.uid,
          studentName: student?.name || 'Aluno',
          faculty: student?.faculty || 'Outra',
          route: student?.route || 'Professor Jamil',
          photoURL: student?.photoURL || null,
        },
        tempLocation.lat,
        tempLocation.lng
      );
      drawRouteToBus(tempLocation.lat, tempLocation.lng);
      setIsEditingLocation(false);
      setTempLocation(null);
      showAlert('Seu local de embarque foi atualizado!');
    } catch (err) {
      console.error('Erro ao atualizar localização:', err);
      showAlert('Erro ao atualizar o local. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarEmbarque = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);
    try {
      const attendanceId = `${trip.id}_${user.uid}`;
      await cancelAttendance(attendanceId);
      clearRoute();
      showAlert('Embarque cancelado. O motorista não passará na sua localização.');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      showAlert('Erro ao cancelar embarque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencia = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);
    try {
      await reportEmergencyAndMarkForgotten({
        tripId: trip.id,
        studentId: user.uid,
        studentName: student?.name,
        route: student?.route,
        faculty: student?.faculty,
        lat: attendance?.lat || null,
        lng: attendance?.lng || null,
      });
      clearRoute();

      showAlert(
        'Alerta registrado! A coordenação da frota foi notificada da sua situação e localização.'
      );
    } catch (err) {
      console.error('Erro ao enviar alerta:', err);
      showAlert(
        'Falha ao registrar o alerta. Por favor, ligue diretamente para o motorista ou coordenação.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // --- 2. Handlers do Modo Campus Pedestre ---
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
    // Pré-aquecimento rápido e passivo do GPS se já autorizado
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
            setUserWalkingCoords([pos.coords.latitude, pos.coords.longitude]);
          }
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 4000 }
      );
    }
    return () => stopCampusWalkingWatch();
  }, [setUserWalkingCoords, stopCampusWalkingWatch]);

  // --- 3. Handlers da Busca no Mapa ---
  const handleSelectSearchedPlace = (place) => {
    if (
      !place?.coords ||
      !Array.isArray(place.coords) ||
      !Number.isFinite(place.coords[0]) ||
      !Number.isFinite(place.coords[1])
    ) {
      console.warn('Coordenadas inválidas para o local pesquisado:', place);
      return;
    }
    setSearchedPlace(place);
    if (mapInstanceRef.current) {
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
            <span className="text-xs font-semibold text-heading hidden sm:inline">
              Visualizando Rota:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {['Professor Jamil', 'Hidrolândia', 'Cromínia'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={async () => {
                  if (student.route !== r) {
                    await updateStudentRoute(user.uid, r);
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
            userCoords={
              userWalkingCoords ||
              (attendance?.lat && attendance?.lng ? [attendance.lat, attendance.lng] : null)
            }
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
        <MapContainer
          center={CENTER}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
          rotate={true}
          touchRotate={true}
        >
          <MapBridge
            onReady={(m) => {
              mapInstanceRef.current = m;
            }}
          />
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

          {/* Marcador pedestre no Modo Campus com localização em tempo real */}
          {isCampusModeActive &&
            (() => {
              const currentCoords =
                (isBroadcasting && broadcastingLocation
                  ? [broadcastingLocation.lat, broadcastingLocation.lng]
                  : null) ||
                userWalkingCoords ||
                (attendance?.lat && attendance?.lng
                  ? [attendance.lat, attendance.lng]
                  : campusFacultyData?.coords || getFacultyCoords(student));
              if (
                !currentCoords ||
                !Array.isArray(currentCoords) ||
                !Number.isFinite(currentCoords[0]) ||
                !Number.isFinite(currentCoords[1])
              )
                return null;
              return (
                <Marker
                  position={currentCoords}
                  icon={createPedestrianIcon(isDark, isLiberado)}
                  zIndexOffset={1200}
                >
                  <Popup className="dark-popup">
                    <div className="flex flex-col gap-0.5 p-0.5">
                      <span className="font-bold text-heading text-xs">
                        {isLiberado ? 'Você (Liberado)' : 'Você'}
                      </span>
                      <span className="text-[11px] text-caption">
                        {isBroadcasting
                          ? 'Transmitindo GPS da Van em tempo real'
                          : isLiberado
                            ? 'Liberado · Pronto para embarque'
                            : userWalkingCoords
                              ? 'Sua localização atual (GPS em tempo real)'
                              : 'Localização base no campus'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })()}

          {/* Marcador do Destino Personalizado (Clique e Segura no Modo Campus) */}
          {isCampusModeActive && customCampusDestination && (
            <Marker
              position={[customCampusDestination.lat, customCampusDestination.lng]}
              icon={createCustomDestinationIcon(
                customDestinationDistance,
                campusRouteMetrics?.durationMinutes,
                isDark
              )}
              zIndexOffset={1400}
            >
              <Popup className="dark-popup">
                <div className="flex flex-col gap-1 p-0.5">
                  <span className="font-bold text-heading text-xs">Destino Selecionado</span>
                  <span className="text-[11px] text-orange-400 font-semibold">
                    Distância a pé: {customDestinationDistance || 'Calculando...'}
                    {campusRouteMetrics?.durationMinutes
                      ? ` (~${campusRouteMetrics.durationMinutes} min)`
                      : ''}
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
                  lineJoin: 'round',
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
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {/* Marcadores dos Prédios/POIs do Campus */}
          {isCampusModeActive &&
            campusPois.map((poi) => {
              const isSelected = selectedCampusPoi?.id === poi.id;
              return (
                <Marker
                  key={poi.id}
                  position={poi.coords}
                  icon={createCampusPoiIcon(poi.name, poi.type, isSelected, isDark)}
                  zIndexOffset={isSelected ? 1300 : 950}
                  eventHandlers={{
                    click: () => handleSelectCampusPoi(poi),
                  }}
                >
                  {isSelected && (
                    <Popup className="dark-popup">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-heading text-xs">{poi.name}</span>
                        {campusRouteMetrics?.distanceMeters != null && (
                          <span className="text-[11px] text-orange-400 font-semibold">
                            A pé:{' '}
                            {campusRouteMetrics.distanceMeters < 1000
                              ? `${campusRouteMetrics.distanceMeters}m`
                              : `${(campusRouteMetrics.distanceMeters / 1000).toFixed(1)}km`}
                            {campusRouteMetrics.durationMinutes
                              ? ` (~${campusRouteMetrics.durationMinutes} min)`
                              : ''}
                          </span>
                        )}
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}

          {/* Marcador de local pesquisado */}
          {searchedPlace &&
            Array.isArray(searchedPlace.coords) &&
            Number.isFinite(searchedPlace.coords[0]) &&
            Number.isFinite(searchedPlace.coords[1]) && (
              <Marker
                position={searchedPlace.coords}
                icon={createSearchedPlaceIcon(searchedPlace.name)}
                zIndexOffset={1200}
              />
            )}
          {/* Marcador do próprio aluno enquanto transmite fora do Modo Campus */}
          {!isCampusModeActive &&
            isBroadcasting &&
            broadcastingLocation?.lat != null &&
            broadcastingLocation?.lng != null && (
              <Marker
                position={[broadcastingLocation.lat, broadcastingLocation.lng]}
                icon={createPedestrianIcon(isDark)}
                zIndexOffset={1200}
              >
                <Popup className="dark-popup">
                  <div className="flex flex-col gap-0.5 p-0.5">
                    <span className="font-bold text-heading text-xs">Você</span>
                    <span className="text-[11px] text-orange-400 font-semibold">
                      Transmitindo GPS da Van em tempo real
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

          {/* Marcador DEDICADO do próprio aluno (visível antes e após liberar; reflete imediatamente status liberado em verde com halo) */}
          {!isCampusModeActive &&
            !isBroadcasting &&
            attendance?.status !== 'embarcado' &&
            attendance?.status !== 'cancelado' &&
            (() => {
              const facCoords = getFacultyCoords(student);
              const myLat = attendance?.lat ?? (facCoords ? facCoords[0] : null);
              const myLng = attendance?.lng ?? (facCoords ? facCoords[1] : null);
              if (myLat == null || myLng == null || isNaN(myLat) || isNaN(myLng)) return null;

              const isSoIda = attendance?.tripType === 'ida';
              const icon = createStudentMapIcon('Você', true, isLiberado, isSoIda, isDark);
              return (
                <Marker
                  key={`my_loc_${attendance?.status || 'waiting'}_${myLat}_${myLng}`}
                  position={[myLat, myLng]}
                  icon={icon}
                  zIndexOffset={1100}
                >
                  <Popup className="dark-popup">
                    <div className="flex flex-col gap-0.5 p-0.5">
                      <span className="font-bold text-heading text-xs">
                        {isLiberado ? 'Você (Liberado)' : isSoIda ? 'Você (Só Ida)' : 'Você'}
                      </span>
                      <span className="text-[11px] text-caption">
                        {isLiberado
                          ? 'Liberado · Pronto para embarque (visível ao motorista)'
                          : isSoIda
                            ? 'Viagem de Só Ida'
                            : 'Sua localização (aguardando liberação)'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })()}

          {/* Marcadores dos DEMAIS Alunos — Apenas alunos liberados ou só ida (exclui o próprio usuário para evitar conflitos) */}
          {visibleOtherStudents.map((att) => {
            const isSoIda = att.tripType === 'ida';
            const displayName = att.studentName ? att.studentName.split(' ')[0] : 'Aluno';
            const icon = createStudentMapIcon(displayName, false, true, isSoIda, isDark);
            return (
              <Marker
                key={`${att.id}_${att.status}`}
                position={[att.lat, att.lng]}
                icon={icon}
                zIndexOffset={isSoIda ? 750 : 800}
              >
                <Popup className="dark-popup">
                  <span className="font-bold text-heading">
                    {att.studentName} {isSoIda ? '(Só Ida)' : ''}
                  </span>
                </Popup>
              </Marker>
            );
          })}

          {/* Marcador do Ônibus / Van em Tempo Real (oculto na tela de quem está transmitindo para exibir apenas o ícone de pessoa) */}
          {!isBroadcasting &&
            activeBusLocation?.lat != null &&
            activeBusLocation?.lng != null &&
            !isNaN(activeBusLocation.lat) &&
            !isNaN(activeBusLocation.lng) && (
              <Marker
                key={trip?.id ? `${trip.id}_bus` : 'active_bus'}
                position={[activeBusLocation.lat, activeBusLocation.lng]}
                icon={student.route === 'Cromínia' ? busIconAlt : busIcon}
                zIndexOffset={1000}
              >
                <Popup className="dark-popup">
                  <span
                    className="font-bold flex flex-col gap-1"
                    style={{
                      color:
                        gpsState === 'live'
                          ? '#f97316'
                          : gpsState === 'stale'
                            ? '#d97706'
                            : '#71717a',
                    }}
                  >
                    <span>
                      {student.route === 'Cromínia' ? 'Ônibus' : 'Van'} (
                      {trip?.route || student.route})
                    </span>
                    <span className="text-[10px] text-caption uppercase tracking-wider font-semibold">
                      {isBroadcasting
                        ? 'Transmitido por você (Você está a bordo)'
                        : gpsState === 'live'
                          ? `Ao vivo · ${trip?.locationProviderName || trip?.driverName || 'Motorista'}`
                          : gpsState === 'stale'
                            ? `Sinal instável · ${elapsedLabel} · ${trip?.locationProviderName || 'Motorista'}`
                            : `Offline · ${elapsedLabel} · última posição conhecida`}
                    </span>
                  </span>
                </Popup>
              </Marker>
            )}

          {/* Linha da Rota OSRM (Apenas para o ônibus do próprio aluno, se não for só ida) */}
          {attendance?.tripType !== 'ida' && routePath && routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color={student.route === 'Cromínia' ? (isDark ? '#ffffff' : '#334155') : '#f97316'}
              weight={5}
              opacity={0.8}
            />
          )}

          {/* Rota Global Dinâmica (Calculada pelo motorista) */}
          {trip?.globalRoute && trip.globalRoute.length > 0 && trip?.status !== 'finished' && (
            <Polyline
              positions={trip.globalRoute}
              color="#3b82f6"
              weight={6}
              opacity={0.9}
              dashArray="10, 10"
            />
          )}

          <LocationPickerMode isEditing={isEditingLocation} onLocationSelected={setTempLocation} />
          {!isEditingLocation && (
            <MapInteractionListener onInteract={() => setIsPanelCollapsed(true)} />
          )}

          {/* Pino temporário do ajuste de local (Circular moderno com pulso, sem gota) */}
          {isEditingLocation && tempLocation?.lat != null && tempLocation?.lng != null && (
            <Marker
              position={[tempLocation.lat, tempLocation.lng]}
              icon={createAdjustmentPinIcon('Novo Ponto', isDark)}
              zIndexOffset={900}
            />
          )}

          {/* Botão de Centralizar no GPS */}
          {!isEditingLocation &&
            (isCampusModeActive && userWalkingCoords ? (
              <RecenterButton
                lat={userWalkingCoords[0]}
                lng={userWalkingCoords[1]}
                isPanelCollapsed={isPanelCollapsed}
                isBroadcasting={isBroadcasting}
              />
            ) : isCampusModeActive && (campusFacultyData?.coords || getFacultyCoords(student)) ? (
              <RecenterButton
                lat={(campusFacultyData?.coords || getFacultyCoords(student))[0]}
                lng={(campusFacultyData?.coords || getFacultyCoords(student))[1]}
                isPanelCollapsed={isPanelCollapsed}
                isBroadcasting={isBroadcasting}
              />
            ) : (isBroadcasting || isEmbarcado) &&
              activeBusLocation?.lat != null &&
              activeBusLocation?.lng != null ? (
              <RecenterButton
                lat={activeBusLocation.lat}
                lng={activeBusLocation.lng}
                isPanelCollapsed={isPanelCollapsed}
                isBroadcasting={isBroadcasting}
              />
            ) : attendance?.lat != null &&
              attendance?.lng != null &&
              !isNaN(attendance.lat) &&
              !isNaN(attendance.lng) ? (
              <RecenterButton
                lat={attendance.lat}
                lng={attendance.lng}
                isPanelCollapsed={isPanelCollapsed}
                isBroadcasting={isBroadcasting}
              />
            ) : activeBusLocation?.lat != null && activeBusLocation?.lng != null ? (
              <RecenterButton
                lat={activeBusLocation.lat}
                lng={activeBusLocation.lng}
                isPanelCollapsed={isPanelCollapsed}
                isBroadcasting={isBroadcasting}
              />
            ) : null)}

          {/* Controlador de Voo Suave no Início da Transmissão */}
          <MapFlyTo target={activeBusLocation} trigger={focusTrigger} />
        </MapContainer>

        {/* UI do Modo de Edição de Local */}
        {isEditingLocation && (
          <>
            <div className="absolute top-4 left-4 right-4 z-[2000] bg-card/90 backdrop-blur-md border border-primary p-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-center text-primary font-bold text-sm">
                Toque no mapa para mover seu pino
              </p>
            </div>

            <div className="absolute bottom-6 left-4 right-4 z-[2000] flex gap-3 animate-in slide-in-from-bottom-6">
              <button
                onClick={() => {
                  setIsEditingLocation(false);
                  setTempLocation(null);
                }}
                className="flex-1 btn-secondary text-sm !px-4 !py-3 border border-subtle"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                disabled={isSubmitting || !tempLocation}
                className="flex-1 btn-primary text-sm !px-4 !py-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Local'}
              </button>
            </div>
          </>
        )}

        {/* Container Flutuante Inferior (Ações do Aluno) */}
        {!isEditingLocation && (
          <div
            className={`absolute bottom-0 left-0 right-0 w-full electric-card bg-card border-t border-subtle rounded-t-[2.5rem] rounded-b-none shadow-2xl z-[2000] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] max-h-[calc(100%-80px)] overflow-y-auto custom-scrollbar ${isPanelCollapsed ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}
          >
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
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        ></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2 tracking-tight">
                      Viagem Encerrada
                    </h2>
                    <p className="text-body font-medium leading-relaxed mb-4 text-sm">
                      O motorista finalizou a rota, mas você ainda estava aguardando. Você ficou
                      para trás?
                    </p>
                    <button
                      onClick={handleEmergencia}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'REGISTRANDO...' : 'FUI ESQUECIDO'}
                    </button>
                  </div>
                ) : attendance?.status === 'esquecido' ? (
                  <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-orange-500 mb-2 tracking-tight">
                      Alerta Ativo
                    </h2>
                    <p className="text-body font-medium leading-relaxed">
                      Sua ocorrência foi registrada e a coordenação foi avisada do incidente.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-16 h-16 bg-green-500/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-2 tracking-tight">
                      Viagem Finalizada
                    </h2>
                    <p className="text-body font-medium leading-relaxed">
                      Todos os alunos foram entregues aos seus destinos.
                    </p>
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
                        {isBroadcasting ? (
                          <span className="text-red-500 dark:text-red-400 flex items-center gap-2">
                            <Radio size={20} className="animate-pulse shrink-0" />
                            Transmitindo GPS da Van
                          </span>
                        ) : isEmbarcado ? (
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
                        <span className="text-[10px] text-caption uppercase tracking-wider block font-bold">
                          Chegada Estimada
                        </span>
                        <span className="text-2xl font-black text-heading font-mono tracking-tight">
                          {etaMinutes !== null
                            ? etaMinutes <= 1
                              ? '<1 min'
                              : `~${etaMinutes} min`
                            : 'Calculando...'}
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
                          LIBERADO{' '}
                          {attendance?.tripType === 'ida'
                            ? '(SÓ IDA)'
                            : attendance?.tripType === 'volta'
                              ? '(SÓ VOLTA)'
                              : '(IDA E VOLTA)'}
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
                        disabled={isSubmitting || (isEmbarcado && attendance?.tripType === 'ida')}
                        className={`w-full py-4 rounded-full font-display font-black text-base uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] cursor-pointer ${
                          isEmbarcado && attendance?.tripType === 'ida'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : isEmbarcado
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                              : 'btn-primary'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isEmbarcado && attendance?.tripType === 'ida' ? (
                            <>
                              <svg
                                className="w-6 h-6 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                              EMBARCADO (SÓ IDA)
                            </>
                          ) : isEmbarcado ? (
                            <>
                              <Check size={24} strokeWidth={2.5} />
                              LIBERAR PARA A VOLTA
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
      </div>

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
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              Lista
            </span>
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
              !isPanelCollapsed ? 'text-orange-500 font-bold' : 'text-body hover:text-primary'
            }`}
          >
            <div className="p-1.5 sm:p-2 relative">
              {isLiberado ? (
                <>
                  <Check
                    size={22}
                    className={!isPanelCollapsed ? 'text-orange-500' : 'text-heading'}
                    strokeWidth={2.5}
                  />
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

          <StudentControls
            isLiberado={isLiberado}
            isEmbarcado={isEmbarcado}
            isDriverActive={isDriverActive}
            isBroadcasting={isBroadcasting}
            wakeUpEnabled={wakeUpSettings.enabled}
            onOpenLocationAdjust={() => {
              setIsEditingLocation(true);
              setTempLocation(
                attendance?.lat && attendance?.lng
                  ? { lat: attendance.lat, lng: attendance.lng }
                  : null
              );
              setIsPanelCollapsed(true);
              setIsPublicListOpen(false);
            }}
            onOpenCheckIn={() => setShowCheckInModal(true)}
            onToggleBroadcasting={handleToggleBroadcasting}
            onOpenWakeUpSettings={() => setIsWakeUpSettingsOpen(true)}
          />
        </div>
      )}

      {/* Modal de Transmissão de GPS da Van pelo Aluno */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onConfirm={startBroadcasting}
        isAnotherStudentActive={isAnotherStudentActive}
        locationProviderName={trip?.locationProviderName}
      />

      {/* Modal de Check-in (Trajeto) */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          if (user?.uid) {
            localStorage.setItem(`rhyme_checkin_prompted_${user.uid}`, 'true');
          }
        }}
        currentTripType={attendance?.tripType || selectedTripType}
        onSelectTripType={(type) => {
          setSelectedTripType(type);
          setShowCheckInModal(false);
          handleCheckIn(type);
        }}
      />

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
        stopName={
          wakeUpSettings?.stopLocation
            ? 'Sua Parada Configurada'
            : student?.route
              ? `Parada em ${student.route}`
              : 'Seu Ponto de Descida'
        }
        onDismiss={() => {
          setIsWakeUpAlarmModalOpen(false);
          setWakeUpAlarmTriggered(true);
        }}
        onSnooze={() => {
          setIsWakeUpAlarmModalOpen(false);
          setWakeUpSettings((prev) => ({ ...prev, distance: Math.max(200, prev.distance - 300) }));
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
