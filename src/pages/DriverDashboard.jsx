import { Navigation, MapPin, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ensureDailyTripExists, normalizeRoute } from '../utils/tripManager';
import { useCurrentTrip, useDriverAttendanceMap } from '../utils/useTripData';
import Header from '../components/Header';
import PublicListModal from '../components/PublicListModal';
import DriverCockpitHUD from '../components/DriverCockpitHUD';
import CampusSummaryCard from '../components/CampusSummaryCard';
import DriverBottomBar from '../components/DriverBottomBar';
import EmergencyRescueModal from '../components/EmergencyRescueModal';

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
          <DriverCockpitHUD
            trip={trip}
            nextStop={nextStop}
            isHudCollapsed={isHudCollapsed}
            setIsHudCollapsed={setIsHudCollapsed}
            openNavigationTo={openNavigationTo}
            boardingCall={boardingCall}
            showDurationPicker={showDurationPicker}
            setShowDurationPicker={setShowDurationPicker}
            handleStartBoardingCall={handleStartBoardingCall}
            handleExtendBoardingCall={handleExtendBoardingCall}
            handleCloseBoardingCall={handleCloseBoardingCall}
            boardingCallSecondsLeft={boardingCallSecondsLeft}
            boardingResponseMap={boardingResponseMap}
          />

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
        <CampusSummaryCard
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
          trip={trip}
          facultySummary={facultySummary}
        />
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
      <DriverBottomBar
        trip={trip}
        isPublicListOpen={isPublicListOpen}
        setIsPublicListOpen={setIsPublicListOpen}
        isPanelOpen={isPanelOpen}
        setIsPanelOpen={setIsPanelOpen}
        attendanceMap={attendanceMap}
        gpsStatus={gpsStatus}
        gpsAccuracy={gpsAccuracy}
        isUpdatingTrip={isUpdatingTrip}
        updateTripStatus={updateTripStatus}
        recalculateGlobalRoute={recalculateGlobalRoute}
        handleFinishClick={handleFinishClick}
        clearAllRoutes={clearAllRoutes}
        hasActiveRoutes={Boolean(
          (activeLocalRoute && activeLocalRoute.length > 0) ||
          (trip?.driverRoutePath && trip.driverRoutePath.length > 0) ||
          (trip?.routePath && trip.routePath.length > 0) ||
          (trip?.globalRoute && trip.globalRoute.length > 0)
        )}
      />

      {/* Modal de Alunos Deixados para Trás */}
      <EmergencyRescueModal
        pendingStudents={pendingStudentsConfirm}
        onConfirmBoarded={async () => {
          const toUpdate = pendingStudentsConfirm;
          setPendingStudentsConfirm(null);
          setIsUpdatingTrip(true);
          try {
            for (let student of toUpdate) {
              await handleStudentStatus(student.studentId, student.status, 'embarcado');
            }
            await updateTripStatus('finished');
          } catch (e) {
            console.error(e);
          } finally {
            setIsUpdatingTrip(false);
          }
        }}
        onConfirmAbandoned={() => {
          setPendingStudentsConfirm(null);
          updateTripStatus('finished');
        }}
        onCancel={() => setPendingStudentsConfirm(null)}
      />
    </div>
  );
}
