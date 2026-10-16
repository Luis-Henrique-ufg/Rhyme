import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from 'react-leaflet';
import {
  Users,
  Check,
  RefreshCcw,
  Navigation,
  Play,
  StopCircle,
  MapPin,
  MapPinOff,
  BarChart2,
  LocateFixed,
  ChevronUp,
  ChevronDown,
  X,
  BellRing,
  Clock,
  UserCheck,
  UserX,
  Timer,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ensureDailyTripExists, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useDriverAttendanceMap } from '../utils/useTripData';
import Header from '../components/Header';
import PublicListModal from '../components/PublicListModal';
import Loader from '../components/Loader';
import ErrorState from '../components/ErrorState';
import MapInteractions from '../components/MapInteractions';
import { playSuccessSound, playBoardingAlarmSound } from '../utils/audioEffects';
import { useCustomAlert } from '../contexts/AlertContext';
import { MOCK_FACULTIES, CENTER, getDistanceFromLatLonInKm } from '../services/geoService';
import { RecenterButton, ZoomTracker } from '../components/StudentMapControllers';
import {
  MAPBOX_TOKEN,
  TILE_DAY,
  TILE_NIGHT,
  TILE_ATTR_DAY,
  TILE_ATTR_NIGHT,
  createBusIcon,
  createFacultyIcon,
  createCustomIcon,
  createDriverStudentIcon,
  createStudentPinIcon,
  createHaloIcon,
  isNightTime,
} from '../utils/mapIcons';
import { useDriverTelemetry } from '../hooks/useDriverTelemetry';
import { usePassengerCounters } from '../hooks/usePassengerCounters';
import {
  subscribeToDriverProfile,
  subscribeToRouteStudents,
  updatePassengerStatus,
  startBoardingCall as startBoardingCallService,
  extendBoardingCall as extendBoardingCallService,
  closeBoardingCall as closeBoardingCallService,
  updateTripStatus as updateTripStatusService,
  saveDriverRoutePath,
  clearAllDriverRoutes,
  updateDriverRoutePreference,
} from '../services/driverService';

export default function DriverDashboard() {
  const { user, loading: authLoading } = useAuth();
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
  const [driverError, setDriverError] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [mapZoom, setMapZoom] = useState(12);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const [activeLocalRoute, setActiveLocalRoute] = useState(null);
  const activeLocalRouteRef = useRef(null); // ref para acesso no GPS callback sem re-render
  const nextStopRef = useRef(null); // ref do nextStop para acesso no GPS callback
  const hasArrivedAlertRef = useRef(false); // evita alerta de chegada repetido
  const pressTimerRef = useRef(null);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [pendingStudentsConfirm, setPendingStudentsConfirm] = useState(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [arrivedAtStudent, setArrivedAtStudent] = useState(false); // toast de chegada ao aluno

  // GPS Telemetry & Screen Wake Lock via custom hook
  const { gpsStatus, gpsAccuracy, lastGpsUpdate } = useDriverTelemetry({
    trip,
    user,
    activeLocalRouteRef,
    setActiveLocalRoute,
    nextStopRef,
    hasArrivedAlertRef,
    setArrivedAtStudent,
    showAlert,
  });

  // --- Chamada de Embarque ---
  const [boardingCall, setBoardingCall] = useState(null); // objeto da chamada ativa
  const [boardingCallSecondsLeft, setBoardingCallSecondsLeft] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const boardingCallIntervalRef = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId, error: tripError } = useCurrentTrip(driver?.route?.trim());
  const { attendanceMap, error: attendanceError } = useDriverAttendanceMap(tripId);

  // Listener do perfil do motorista (redireciona se aluno ou não cadastrado)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setDriverError(null);

    let unsubDriver = () => {};

    unsubDriver = subscribeToDriverProfile(
      user.uid,
      (driverSnap) => {
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
      },
      (err) => {
        console.error('Erro ao carregar perfil do motorista:', err);
        setDriverError(err);
        setLoading(false);
      }
    );

    return () => unsubDriver();
  }, [user]);

  // Listener em tempo real dos alunos cadastrados na rota do motorista
  useEffect(() => {
    if (!driver?.route) return;

    const unsubStudents = subscribeToRouteStudents(
      driver.route,
      (studentsData) => {
        setStudents(studentsData);
      },
      (err) => {
        console.error('Erro ao escutar alunos da rota:', err);
      }
    );

    return () => unsubStudents();
  }, [driver?.route]);

  // Sincroniza boardingCall a partir do documento da viagem em tempo real
  useEffect(() => {
    if (trip?.boardingCall && trip.boardingCall.status === 'active') {
      setBoardingCall(trip.boardingCall);
    } else if (!trip?.boardingCall || trip?.boardingCall?.status === 'closed') {
      setBoardingCall(null);
    }
  }, [trip?.boardingCall]);

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
        setBoardingCall((prev) => (prev ? { ...prev, status: 'expired' } : null));
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
    boardingCall.targetStudentIds.forEach((uid) => {
      const att = attendanceMap[uid];
      if (att?.boardingResponse) {
        map[uid] = {
          response: att.boardingResponse,
          name: att.studentName || 'Aluno',
          respondedAt: att.boardingResponseAt,
        };
      }
    });
    return map;
  }, [boardingCall?.targetStudentIds, attendanceMap]);

  const { facultySummary, customClusters, nextStop } = usePassengerCounters({
    attendanceMap,
    busLocation: trip?.busLocation,
  });

  // Mantém o ref do nextStop sincronizado para acesso no callback do GPS (sem stale closure)
  useEffect(() => {
    nextStopRef.current = nextStop;
    // Quando o nextStop muda (aluno diferente), reseta o flag de chegada
    hasArrivedAlertRef.current = false;
  }, [nextStop?.id]);

  const openNavigationTo = async (lat, lng) => {
    if (!trip?.busLocation && gpsStatus !== 'active') {
      showAlert('Sua localização GPS não está disponível ainda.');
      return;
    }

    try {
      const origin = `${trip.busLocation.lng},${trip.busLocation.lat}`;
      const dest = `${lng},${lat}`;
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin};${dest}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates;
        const path = coords.map((c) => [c[1], c[0]]);
        activeLocalRouteRef.current = path;
        setActiveLocalRoute(path);
        try {
          playSuccessSound();
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
      showAlert('Falha ao traçar rota local. Verifique sua conexão.');
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
      const studentObj = students.find((s) => s.uid === studentId);
      const resolvedName = attData?.studentName || studentObj?.name || 'Aluno';
      const resolvedFaculty = attData?.faculty || studentObj?.faculty || 'Outra';
      const resolvedRoute =
        attData?.route || studentObj?.route || driver?.route || 'Professor Jamil';

      await updatePassengerStatus(trip.id, studentId, newStatus, {
        studentName: resolvedName,
        faculty: resolvedFaculty,
        route: resolvedRoute,
        photoURL: attData?.photoURL || studentObj?.photoURL || null,
      });
    } catch (e) {
      console.error(e);
      showAlert('Erro ao atualizar status do aluno');
    }
  };

  // --- Handlers da Chamada de Embarque ---
  const handleStartBoardingCall = async (durationMinutes) => {
    if (!nextStop || !trip?.id) return;
    setShowDurationPicker(false);

    // Extrai UIDs dos alunos pendentes nesta parada a partir do attendanceMap
    const targetStudents = Object.entries(attendanceMap)
      .filter(
        ([_, att]) =>
          att.status !== 'embarcado' &&
          att.status !== 'cancelado' &&
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
      targetStudentIds: targetStudents.map((s) => s.uid),
      targetStudentNames: targetStudents,
      startedAt: now,
      durationMinutes,
      expiresAt: now + durationMinutes * 60_000,
      status: 'active',
    };

    try {
      await startBoardingCallService(trip.id, callData);
      setBoardingCall(callData);
      setBoardingCallSecondsLeft(durationMinutes * 60);
      try {
        playSuccessSound();
      } catch (e) {}
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
      await extendBoardingCallService(trip.id, updated);
      setBoardingCall(updated);
    } catch (e) {
      console.error('Erro ao estender chamada:', e);
    }
  };

  const handleCloseBoardingCall = async () => {
    setBoardingCall(null);
    setBoardingCallSecondsLeft(0);
    if (boardingCallIntervalRef.current) {
      clearInterval(boardingCallIntervalRef.current);
      boardingCallIntervalRef.current = null;
    }
    if (!trip?.id) return;
    try {
      await closeBoardingCallService(trip.id);
    } catch (e) {
      console.error('Erro ao encerrar chamada:', e);
    }
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
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    currentLat = pos.coords.latitude;
                    currentLng = pos.coords.longitude;
                    resolve();
                  },
                  () => resolve(),
                  { timeout: 3000, maximumAge: 10000 }
                );
              }),
              new Promise((resolve) => setTimeout(resolve, 3500)),
            ]);
          }
        }

        const waypoints = customClusters.map((c) => `${c.lng},${c.lat}`);
        let routePath = [];

        if (waypoints.length > 0) {
          if (currentLat && currentLng) {
            waypoints.unshift(`${currentLng},${currentLat}`);
          }
          if (waypoints.length >= 2) {
            try {
              const coordsString = waypoints.slice(0, 25).join(';');
              const res = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
              );
              const data = await res.json();
              if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates;
                routePath = coords.map((c) => ({ lat: c[1], lng: c[0] }));
              }
            } catch (routeErr) {
              console.error('Erro ao traçar rota inicial OSRM', routeErr);
            }
          }
        }

        let updateData = { status: newStatus };
        if (routePath.length > 0) updateData.driverRoutePath = routePath;
        if (currentLat && currentLng) updateData.busLocation = { lat: currentLat, lng: currentLng };

        await updateTripStatusService(trip.id, newStatus, updateData);
      } else {
        await updateTripStatusService(trip.id, newStatus);
      }
      // Nota: não chamar setTrip aqui — o trip é gerenciado pelo hook useCurrentTrip
      // via onSnapshot, que atualizará o estado automaticamente.
      if (newStatus === 'in_progress') {
        try {
          playSuccessSound();
        } catch (e) {}
        // O GPS real começará a atualizar o banco pelo useEffect acima
      }
    } catch (err) {
      console.error('Erro ao atualizar status da viagem', err);
      showAlert('Erro ao atualizar status da viagem: ' + err.message);
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
      const waypoints = customClusters.map((c) => `${c.lng},${c.lat}`);
      let routePath = [];

      if (waypoints.length > 0) {
        if (currentLat && currentLng) {
          waypoints.unshift(`${currentLng},${currentLat}`);
        }
        if (waypoints.length >= 2) {
          const coordsString = waypoints.slice(0, 25).join(';');
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates;
            routePath = coords.map((c) => ({ lat: c[1], lng: c[0] }));
          }
        }
      }

      if (routePath.length > 0) {
        // Limpa a rota local (navegação até aluno único) ao recalcular a rota global
        // para evitar polylines duplicadas no mapa.
        activeLocalRouteRef.current = null;
        setActiveLocalRoute(null);
        await saveDriverRoutePath(trip.id, routePath);
        try {
          playSuccessSound();
        } catch (e) {}
      } else {
        showAlert('Não foi possível traçar rota global (poucos alunos com GPS).');
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro ao recalcular rota.');
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  const clearAllRoutes = async () => {
    activeLocalRouteRef.current = null;
    setActiveLocalRoute(null);
    if (trip?.id) {
      try {
        await clearAllDriverRoutes(trip.id);
        showAlert('Todas as rotas foram limpas do mapa.');
      } catch (e) {
        console.error('Erro ao limpar rotas:', e);
      }
    }
  };

  const handleFinishClick = () => {
    const pending = Object.values(attendanceMap).filter(
      (att) => att.status === 'aguardando' || att.status === 'liberado'
    );
    if (pending.length > 0) {
      setPendingStudentsConfirm(pending);
    } else {
      updateTripStatus('finished');
    }
  };

  const getStudentName = (uid) => {
    const s = students.find((s) => s.uid === uid);
    return s ? s.name : 'Aluno';
  };

  if (loading || authLoading) {
    return <Loader message="Carregando painel do motorista..." />;
  }

  if (driverError || tripError || attendanceError) {
    return (
      <ErrorState
        message="Não foi possível se conectar aos servidores do Rhyme. Verifique sua conexão com a internet."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!driver) {
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden select-none overscroll-none bg-background">
      <Header userProfile={driver} />

      {driver?.role === 'admin' && (
        <div
          className="bg-card-elevated border-b border-subtle px-4 py-2 flex items-center justify-between z-30 shrink-0 select-none touch-none overscroll-none"
          onWheel={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 tracking-wider">
              ADMIN
            </span>
            <span className="text-xs font-semibold text-heading hidden sm:inline">
              Monitorando Rota:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {['Professor Jamil', 'Hidrolândia', 'Cromínia'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={async () => {
                  if (driver.route !== r) {
                    await updateDriverRoutePreference(user.uid, r);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  driver.route === r
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

      {/* Main Content Layout (Map + Table Overlay) */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Mapa Leaflet (Fundo 100%) */}
        <div className="absolute inset-0 z-0">
          {/* Legenda de Rotas (Ocultável) */}
          <div className="absolute top-4 right-4 z-[1000]">
            {isLegendOpen ? (
              <div className="bg-card/95 backdrop-blur-md border border-subtle rounded-xl p-3 flex flex-col gap-2 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-center justify-between gap-3 border-b border-subtle pb-1">
                  <h4 className="text-heading text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Legenda de Rotas
                  </h4>
                  <button
                    onClick={() => setIsLegendOpen(false)}
                    className="text-caption hover:text-heading p-0.5 rounded hover-bg-subtle transition-colors"
                    title="Ocultar legenda"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                  <span className="text-body text-xs font-medium">Professor Jamil</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-heading shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                  <span className="text-body text-xs font-medium">Cromínia</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsLegendOpen(true)}
                className="bg-card/90 hover:bg-card backdrop-blur-md border border-subtle text-body hover:text-heading rounded-xl px-2.5 py-1.5 shadow-xl transition-all flex items-center gap-1.5 active:scale-95 text-xs font-medium"
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
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1005] flex items-center gap-3 bg-card backdrop-blur-xl border border-success/50 rounded-2xl px-4 py-3 shadow-2xl animate-[fadeIn_0.3s_ease-out] pointer-events-auto"
              style={{ maxWidth: 'calc(100vw - 2rem)' }}
            >
              <MapPin size={20} className="text-success shrink-0" />
              <div className="flex flex-col">
                <span className="text-heading text-sm font-bold">Ponto de embarque alcançado</span>
                <span className="text-success text-xs opacity-90">
                  Confirme o embarque na lista de alunos
                </span>
              </div>
              <button
                onClick={() => setArrivedAtStudent(false)}
                className="ml-2 text-caption hover:text-heading p-1 rounded-lg hover-bg-subtle transition-colors"
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
                  className="flex items-center gap-2.5 bg-card/90 backdrop-blur-xl border border-primary/40 hover:border-primary text-heading rounded-full px-3.5 py-2 shadow-2xl transition-all group active:scale-95"
                  title="Expandir detalhes da próxima parada"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                  </span>
                  <span className="text-xs font-bold text-heading truncate max-w-[120px] sm:max-w-[180px]">
                    {nextStop.title}
                  </span>
                  <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                    {nextStop.totalCount} {nextStop.totalCount === 1 ? 'aluno' : 'alunos'}
                  </span>
                  <span className="text-xs font-mono text-caption shrink-0 ml-0.5">
                    {nextStop.distKm < 1
                      ? `${Math.round(nextStop.distKm * 1000)}m`
                      : `${nextStop.distKm.toFixed(1)}km`}
                  </span>
                  <ChevronDown
                    size={14}
                    className="text-caption group-hover:text-heading shrink-0"
                  />
                </button>
              ) : (
                <div className="bg-card/95 backdrop-blur-2xl border border-primary/30 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col gap-2.5 transition-all animate-[fadeIn_0.2s_ease-out]">
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
                      className="text-caption hover:text-heading p-1 rounded-lg hover-bg-subtle transition-colors"
                      title="Minimizar painel"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>

                  {/* Content: Title, students & real-time distance */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-heading truncate leading-tight">
                        {nextStop.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-caption">
                          {nextStop.totalCount}{' '}
                          {nextStop.totalCount === 1 ? 'passageiro' : 'passageiros'}
                        </span>
                        {nextStop.liberadosCount > 0 && (
                          <span className="text-success font-semibold bg-success-bg px-1.5 py-0.5 rounded text-[10px] border border-success-border">
                            {nextStop.liberadosCount} liberado
                            {nextStop.liberadosCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 bg-subtle border border-subtle rounded-xl px-2.5 py-1.5">
                      <div className="text-base sm:text-lg font-black text-heading font-mono tracking-tight leading-none">
                        {nextStop.distKm < 1
                          ? `${Math.round(nextStop.distKm * 1000)}`
                          : nextStop.distKm.toFixed(1)}
                        <span className="text-[10px] text-caption font-normal ml-0.5">
                          {nextStop.distKm < 1 ? 'm' : 'km'}
                        </span>
                      </div>
                      <span className="text-[9px] text-caption font-medium block mt-0.5 uppercase tracking-wider">
                        distância
                      </span>
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
                          onClick={() => setShowDurationPicker((v) => !v)}
                          className="w-full flex items-center justify-center gap-2 bg-subtle hover:bg-success-bg border border-subtle hover:border-success/60 text-heading hover:text-success font-bold text-xs py-2 px-3 rounded-xl transition-all active:scale-[0.98]"
                        >
                          <BellRing size={13} className="shrink-0" />
                          Chamar Alunos
                        </button>
                        {/* Seletor de Duração */}
                        {showDurationPicker && (
                          <div className="absolute bottom-[110%] left-0 right-0 z-10 bg-card border border-subtle rounded-xl p-3 shadow-2xl flex flex-col gap-2 animate-[fadeIn_0.15s_ease-out]">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-caption flex items-center gap-1.5">
                              <Timer size={11} /> Tolerância de espera
                            </span>
                            <div className="flex gap-2">
                              {[2, 3, 5].map((min) => (
                                <button
                                  key={min}
                                  onClick={() => handleStartBoardingCall(min)}
                                  className="flex-1 py-2 rounded-xl badge-success font-black text-sm hover:brightness-110 transition-all active:scale-95"
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
                      <div className="rounded-xl border border-success/30 bg-success-bg p-3 flex flex-col gap-2">
                        {/* Header: countdown + encerrar */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-success">
                              Chamada Ativa
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleExtendBoardingCall(1);
                              }}
                              className="text-caption hover:text-heading text-xs font-bold px-2.5 py-1 rounded-lg border border-subtle transition-all active:scale-95 cursor-pointer bg-surface/80"
                              title="Adicionar 1 minuto"
                            >
                              +1 min
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleCloseBoardingCall();
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface/80 hover:bg-danger/15 text-caption hover:text-danger border border-subtle transition-all cursor-pointer shadow-sm active:scale-95"
                              title="Encerrar chamada"
                              aria-label="Encerrar chamada"
                            >
                              <X size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        {/* Cronômetro */}
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`font-black font-mono text-2xl leading-none ${
                              boardingCallSecondsLeft <= 30
                                ? 'text-danger animate-pulse'
                                : boardingCallSecondsLeft <= 60
                                  ? 'text-warning'
                                  : 'text-success'
                            }`}
                          >
                            {String(Math.floor(boardingCallSecondsLeft / 60)).padStart(2, '0')}:
                            {String(boardingCallSecondsLeft % 60).padStart(2, '0')}
                          </span>
                          {/* Barra de progresso */}
                          <div className="w-full h-1 bg-subtle rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${(boardingCallSecondsLeft / (boardingCall.durationMinutes * 60)) * 100}%`,
                                background:
                                  boardingCallSecondsLeft <= 30
                                    ? '#f87171'
                                    : boardingCallSecondsLeft <= 60
                                      ? '#fbbf24'
                                      : '#34d399',
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
                                <span className="text-xs text-body font-medium truncate max-w-[120px]">
                                  {name}
                                </span>
                                {!resp ? (
                                  <span className="flex items-center gap-1 text-[10px] text-caption">
                                    <Clock size={10} /> Aguardando
                                  </span>
                                ) : resp.response === 'coming' ? (
                                  <span className="flex items-center gap-1 text-[10px] text-success font-semibold">
                                    <UserCheck size={10} /> A caminho
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-caption line-through">
                                    <UserX size={10} /> Dispensado
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCloseBoardingCall();
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-subtle hover-bg-subtle text-body hover:text-heading font-bold text-xs py-2.5 px-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Check size={14} /> Partir / Encerrar chamada
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <MapContainer
            center={CENTER}
            zoom={12}
            className="w-full h-full"
            zoomControl={false}
            attributionControl={false}
            rotate={true}
            touchRotate={true}
          >
            <MapInteractions />
            <ZoomTracker onZoomChange={setMapZoom} />
            <TileLayer
              url={isDark ? TILE_NIGHT : TILE_DAY}
              attribution={isDark ? TILE_ATTR_NIGHT : TILE_ATTR_DAY}
              key={isDark ? 'night' : 'day'}
            />
            {/* Linha da Rota Geral OSRM (Original/Fixa) */}
            {(trip?.driverRoutePath || trip?.routePath) &&
              (trip?.driverRoutePath?.length > 0 || trip?.routePath?.length > 0) &&
              trip.status !== 'finished' && (
                <Polyline
                  positions={trip.driverRoutePath || trip.routePath}
                  color={
                    driver?.route === 'Cromínia' ? (isDark ? '#ffffff' : '#334155') : '#f97316'
                  }
                  weight={5}
                  opacity={0.8}
                />
              )}

            {/* Rota Global Dinâmica (Calculada pelo motorista) */}
            {trip?.globalRoute && trip.globalRoute.length > 0 && trip.status !== 'finished' && (
              <Polyline
                positions={trip.globalRoute}
                color="#3b82f6"
                weight={6}
                opacity={0.9}
                dashArray="10, 10"
              />
            )}

            {/* Linha da Rota Local OSRM */}
            {activeLocalRoute && activeLocalRoute.length > 0 && trip.status !== 'finished' && (
              <Polyline
                positions={activeLocalRoute}
                color={driver?.route === 'Cromínia' ? (isDark ? '#ffffff' : '#334155') : '#f97316'}
                weight={6}
                opacity={0.9}
                dashArray="10, 10"
              />
            )}

            {/* Faculdades com passageiros ativos (Apenas da rota do motorista) */}
            {Object.entries(MOCK_FACULTIES)
              .filter(([facName]) =>
                Object.values(attendanceMap).some(
                  (att) => att.faculty === facName && att.status !== 'cancelado'
                )
              )
              .map(([facName, coords]) => {
                const isCrominia = driver?.route === 'Cromínia';
                return (
                  <Marker
                    key={facName}
                    position={coords}
                    icon={createFacultyIcon(facName, isCrominia, isDark)}
                  >
                    <Popup className="dark-popup">
                      <span className="font-bold text-heading">{facName}</span>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Halo de Proximidade Dinâmico no Ponto Mais Próximo:
                Apenas para faculdades (fac_) sem cluster individual de alunos.
                Para alunos individuais, o próprio marcador já renderiza seu sonar exclusivo na cor correta de status, eliminando qualquer duplicação de sonares âmbar + esmeralda. */}
            {nextStop &&
              nextStop.distKm <= 2.5 &&
              trip?.status === 'in_progress' &&
              nextStop.id.startsWith('fac_') && (
                <Marker
                  key={`halo_${nextStop.id}_${nextStop.liberadosCount}`}
                  position={[nextStop.lat, nextStop.lng]}
                  icon={createHaloIcon(
                    driver?.route === 'Cromínia',
                    nextStop.liberadosCount > 0 && nextStop.liberadosCount === nextStop.totalCount
                      ? '#10b981'
                      : null
                  )}
                  zIndexOffset={100}
                />
              )}

            {/* Marcadores de Alunos e Grupos (Avatar de Aluno sem gota e sem duplicação de halo) */}
            {trip?.status !== 'finished' &&
              customClusters.map((cluster) => {
                const isCrominia = driver?.route === 'Cromínia';
                const totalStudents = cluster.students.length;
                // Se há apenas 1 aluno OU o zoom está próximo (>= 15), mostra o avatar do aluno
                const showIndividual = mapZoom >= 15 || totalStudents === 1;
                const isNextStop = Boolean(
                  nextStop && nextStop.distKm <= 2.5 && nextStop.id === cluster.id
                );

                if (showIndividual) {
                  const isSoIda = cluster.students.every((s) => s.tripType === 'ida');
                  const hasLiberado = cluster.students.some((s) => s.status === 'liberado');
                  const hasComing = cluster.students.some((s) => s.response === 'coming');
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
                        },
                      }}
                    >
                      <Popup className="dark-popup">
                        <div className="p-1 min-w-[140px] text-xs">
                          <div className="font-bold text-sm mb-1 text-heading border-b border-subtle pb-1 flex items-center justify-between">
                            <span>{totalStudents === 1 ? 'Aluno' : `${totalStudents} Alunos`}</span>
                            {cluster.students[0]?.faculty && (
                              <span className="text-[10px] font-normal text-orange-400">
                                {cluster.students[0].faculty}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 my-1.5 max-h-36 overflow-y-auto">
                            {cluster.students.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 py-0.5"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'liberado' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : s.tripType === 'ida' ? 'bg-zinc-400' : 'bg-amber-500'}`}
                                  ></span>
                                  <span className="text-heading font-medium truncate">
                                    {s.name}
                                  </span>
                                </div>
                                <div className="flex-shrink-0 text-[10px] flex items-center gap-1">
                                  {s.tripType === 'ida' ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-500/15 text-zinc-400 font-bold border border-zinc-500/30">
                                      Só ida
                                    </span>
                                  ) : s.tripType === 'volta' ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                                      Só volta
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30">
                                      Ida/Volta
                                    </span>
                                  )}
                                  {s.response === 'coming' ? (
                                    <span className="text-sky-400 font-bold bg-sky-500/10 px-1 py-0.5 rounded">
                                      A caminho
                                    </span>
                                  ) : s.status === 'liberado' ? (
                                    <span className="text-emerald-400 font-semibold">Liberado</span>
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
                  const liberados = cluster.students.filter((s) => s.status === 'liberado').length;
                  const total = totalStudents;
                  const icon = createCustomIcon(
                    liberados,
                    total,
                    primaryFaculty,
                    isCrominia,
                    isDark
                  );
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
                        },
                      }}
                    >
                      <Popup className="dark-popup">
                        <div className="p-1 min-w-[140px] text-xs">
                          <div className="font-bold text-sm mb-1 text-heading border-b border-subtle pb-1 flex items-center justify-between">
                            <span>{primaryFaculty || 'Grupo de Alunos'}</span>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              {liberados}/{total}
                            </span>
                          </div>
                          <div className="space-y-1 my-1.5 max-h-36 overflow-y-auto">
                            {cluster.students.map((s, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 py-0.5"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'liberado' ? 'bg-emerald-500' : s.tripType === 'ida' ? 'bg-zinc-400' : 'bg-amber-500'}`}
                                  ></span>
                                  <span className="text-heading font-medium truncate">
                                    {s.name}
                                  </span>
                                </div>
                                <div className="flex-shrink-0 text-[10px] flex items-center gap-1">
                                  {s.tripType === 'ida' ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-500/15 text-zinc-400 font-bold border border-zinc-500/30">
                                      Só ida
                                    </span>
                                  ) : s.tripType === 'volta' ? (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                                      Só volta
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30">
                                      Ida/Volta
                                    </span>
                                  )}
                                  {s.response === 'coming' ? (
                                    <span className="text-sky-400 font-bold bg-sky-500/10 px-1 py-0.5 rounded">
                                      A caminho
                                    </span>
                                  ) : s.status === 'liberado' ? (
                                    <span className="text-emerald-400 font-semibold">Liberado</span>
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
                <Marker
                  position={[trip.busLocation.lat, trip.busLocation.lng]}
                  icon={driver?.route === 'Cromínia' ? busIconAlt : busIcon}
                  zIndexOffset={1000}
                >
                  <Popup className="dark-popup">
                    <span className="font-bold text-orange-500">
                      Você ({driver?.route === 'Cromínia' ? 'Ônibus' : 'VAN'})
                    </span>
                  </Popup>
                </Marker>
                <RecenterButton lat={trip.busLocation.lat} lng={trip.busLocation.lng} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Tabela Consolidada (Painel Flutuante) */}
        <div
          className={`absolute md:relative z-10 w-full md:w-[400px] electric-card bg-card p-5 overflow-y-auto border-t md:border-t-0 md:border-r border-subtle shadow-2xl flex flex-col mt-auto md:mt-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelOpen ? 'translate-y-0 md:translate-x-0 max-h-[55vh] md:max-h-full bottom-0' : 'translate-y-full md:translate-y-0 md:-translate-x-full max-h-[55vh] md:max-h-full bottom-0 md:left-0'} `}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bricolage font-light text-heading tracking-tight">
              Resumo da Rota
            </h2>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="w-8 h-8 flex items-center justify-center bg-subtle hover-bg-subtle text-caption hover:text-heading rounded-full transition-colors border border-subtle"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {!trip && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-4 rounded-xl mb-4 text-sm font-medium">
              Nenhuma viagem aberta no momento. (Aguardando criação de rota).
            </div>
          )}

          <div className="flex-1 space-y-4 pr-2 custom-scrollbar">
            {facultySummary.map((fac) => (
              <div
                key={fac.name}
                className="bg-subtle border border-subtle p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-heading text-lg">{fac.name}</h3>
                  <p className="text-caption text-sm font-medium">Na lista de hoje</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-orange-500">
                    {fac.count}{' '}
                    <span className="text-sm font-medium text-caption">passageiros</span>
                  </div>
                </div>
              </div>
            ))}
            {facultySummary.length === 0 && (
              <p className="text-center text-caption py-6">Nenhum aluno aguardando na rota hoje.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal da Lista Pública (Checklist de Embarque) */}
      <PublicListModal
        isOpen={isPublicListOpen}
        onClose={() => setIsPublicListOpen(false)}
        list={Object.values(attendanceMap)}
        title="Checklist de Embarque"
        emptyMessage="Nenhum aluno na lista de hoje."
        onStudentStatus={handleStudentStatus}
      />

      {/* Bottom Navigation Bar (WhatsApp style) */}
      {trip && (
        <div
          className="bottom-nav bg-surface border-t border-subtle flex items-center justify-around gap-1 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-50 shrink-0 pb-safe shadow-lg w-full overflow-hidden select-none touch-none overscroll-none"
          onWheel={(e) => e.preventDefault()}
        >
          <button
            onClick={() => {
              const newState = !isPublicListOpen;
              setIsPublicListOpen(newState);
              if (newState) setIsPanelOpen(false);
            }}
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors relative"
          >
            <div className="relative p-1.5 sm:p-2">
              <Users size={22} />
              <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
                {
                  Object.values(attendanceMap).filter(
                    (att) => att.status === 'liberado' || att.status === 'aguardando'
                  ).length
                }
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              Lista
            </span>
          </button>

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center transition-colors ${isPanelOpen ? 'text-primary' : 'text-body hover:text-primary'}`}
          >
            <div className="p-1.5 sm:p-2">
              <BarChart2 size={22} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
              Resumo
            </span>
          </button>

          {/* Indicador GPS — visível apenas em in_progress, alinhado ao design system */}
          {trip.status === 'in_progress' && (
            <div
              title={gpsAccuracy != null ? `Precisão: ±${gpsAccuracy}m` : 'Aguardando GPS...'}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center shrink-0 select-none ${
                gpsStatus === 'active'
                  ? 'text-success'
                  : gpsStatus === 'error'
                    ? 'text-danger'
                    : 'text-caption'
              }`}
            >
              <div className="relative p-1.5 sm:p-2">
                {gpsStatus === 'active' && (
                  <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
                )}
                <LocateFixed size={22} className="relative" />
              </div>
              <span className="text-[10px] font-bold mt-0.5 leading-none truncate max-w-full">
                {gpsStatus === 'active'
                  ? gpsAccuracy != null
                    ? `±${gpsAccuracy}m`
                    : 'AO VIVO'
                  : gpsStatus === 'error'
                    ? 'Erro'
                    : 'GPS'}
              </span>
            </div>
          )}

          <div
            id="navbar-compass-slot"
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
          ></div>
          <div
            id="navbar-recenter-slot"
            className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex items-center justify-center empty:hidden"
          ></div>

          {trip.status === 'open' && (
            <button
              onClick={() => updateTripStatus('in_progress')}
              disabled={isUpdatingTrip}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-1.5 sm:p-2">
                <Play size={22} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
                {isUpdatingTrip ? 'Iniciando' : 'Iniciar'}
              </span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button
              onClick={recalculateGlobalRoute}
              disabled={isUpdatingTrip}
              className={`flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-1.5 sm:p-2">
                <RefreshCcw size={22} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
                {isUpdatingTrip ? 'Atz...' : 'Atualizar'}
              </span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button
              onClick={handleFinishClick}
              className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-danger transition-colors"
            >
              <div className="p-1.5 sm:p-2">
                <StopCircle size={22} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
                Finalizar
              </span>
            </button>
          )}

          {trip.status === 'finished' && (
            <button
              onClick={() => updateTripStatus('open')}
              className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
            >
              <div className="p-1.5 sm:p-2">
                <Play size={22} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
                Reabrir
              </span>
            </button>
          )}

          {Boolean(
            (activeLocalRoute && activeLocalRoute.length > 0) ||
            (trip?.driverRoutePath && trip.driverRoutePath.length > 0) ||
            (trip?.routePath && trip.routePath.length > 0) ||
            (trip?.globalRoute && trip.globalRoute.length > 0)
          ) &&
            trip.status !== 'finished' && (
              <button
                onClick={clearAllRoutes}
                className="flex-1 min-w-0 max-w-[80px] md:max-w-none md:flex-initial flex flex-col items-center justify-center text-body hover:text-primary transition-colors"
                title="Limpar todas as rotas do mapa"
              >
                <div className="p-1.5 sm:p-2">
                  <MapPinOff size={22} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full">
                  Limpar
                </span>
              </button>
            )}
        </div>
      )}

      {/* Modal de Alunos Deixados para Trás */}
      {pendingStudentsConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-card border border-subtle rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-heading mb-2 relative z-10">Finalizar viagem?</h3>
            <p className="text-body text-sm mb-4 relative z-10">
              Ainda há <strong className="text-heading">{pendingStudentsConfirm.length}</strong>{' '}
              aluno(s) aguardando na lista:
              <br />
              <span className="text-orange-400 font-medium italic mt-1 block">
                {pendingStudentsConfirm.map((s) => s.studentName).join(', ')}
              </span>
              <br />
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
                Eles embarcaram (marcar e finalizar)
              </button>
              <button
                onClick={() => {
                  setPendingStudentsConfirm(null);
                  updateTripStatus('finished');
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
              >
                Ficaram para trás (apenas finalizar)
              </button>
              <button
                onClick={() => setPendingStudentsConfirm(null)}
                className="w-full bg-subtle hover-bg-subtle text-heading font-bold py-3 px-4 rounded-xl transition-colors mt-2 border border-subtle"
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
