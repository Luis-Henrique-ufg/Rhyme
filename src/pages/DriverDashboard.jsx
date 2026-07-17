import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Users, Check, RefreshCcw, Navigation, Play, StopCircle, MapPinOff, BarChart2, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-rotate';
import { doc, collection, query, where, getDocs, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { ensureDailyTripExists } from '../utils/tripManager';
import { useCurrentTrip, useDriverAttendanceMap } from '../utils/useTripData';
import Header from '../components/Header';
import Loader from '../components/Loader';
import MapInteractions from '../components/MapInteractions';
import ReactDOM from 'react-dom';
import { playSuccessSound } from '../utils/audioEffects';
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
      className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
      title="Centralizar"
    >
      <div className="p-2"><LocateFixed size={24} /></div>
      <span className="text-[11px] font-medium mt-0.5">Focar</span>
    </button>
  );

  return portalTarget ? ReactDOM.createPortal(content, portalTarget) : null;
};

const createCustomIcon = (liberados, total) => {
  const isComplete = total === undefined ? false : (liberados === total && total > 0);
  const borderColor = total === undefined ? '#f97316' : (isComplete ? '#fcd34d' : '#ea580c');
  const baseStyle = `background-color: #050505; color: white; border: 3px solid ${borderColor}; border-radius: 50%; width: 40px; height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(249,115,22,0.2);`;
  return L.divIcon({
    html: `
      <div style="${baseStyle}">
        <span style="font-weight: 900; font-size: 14px; ${total !== undefined ? 'margin-bottom: -4px;' : ''}">${liberados}</span>
        ${total !== undefined ? `<span style="font-size: 10px; opacity: 0.8;">/${total}</span>` : ''}
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const FacultyIcon = L.divIcon({
  html: `
    <div style="
      width: 40px; 
      height: 40px; 
      background: #050505; 
      border-radius: 12px; 
      border: 2px solid #f97316; 
      box-shadow: 0 0 15px rgba(249, 115, 22, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fcd34d;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Ícone para pino exato de aluno
const StudentIcon = L.divIcon({
  html: `
    <div style="
      width: 32px; 
      height: 32px; 
      background: linear-gradient(135deg, #fcd34d, #f97316); 
      border-radius: 50%; 
      border: 3px solid #050505; 
      box-shadow: 0 0 20px rgba(249, 115, 22, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Ícone elegante para o motorista (Van)
const BusIcon = L.divIcon({
  html: `
    <div style="
      width: 44px; 
      height: 44px; 
      background: linear-gradient(135deg, #f97316, #f59e0b); 
      border-radius: 50%; 
      border: 4px solid #050505; 
      box-shadow: 0 0 25px rgba(249, 115, 22, 0.8), 0 0 10px rgba(249, 115, 22, 0.5) inset;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2"></path>
        <circle cx="9" cy="17" r="2" stroke="currentColor" fill="#fff" stroke-width="2"></circle>
        <path d="M11 17h4"></path>
        <circle cx="17" cy="17" r="2" stroke="currentColor" fill="#fff" stroke-width="2"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const BusIconAlt = L.divIcon({
  html: `
    <div style="
      width: 44px; 
      height: 44px; 
      background: #ffffff; 
      border-radius: 50%; 
      border: 4px solid #050505; 
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.8), 0 0 10px rgba(255, 255, 255, 0.5) inset;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h2"></path>
        <circle cx="9" cy="17" r="2" stroke="currentColor" fill="#000" stroke-width="2"></circle>
        <path d="M11 17h4"></path>
        <circle cx="17" cy="17" r="2" stroke="currentColor" fill="#000" stroke-width="2"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const FacultyIconAlt = L.divIcon({
  html: `
    <div style="
      width: 40px; 
      height: 40px; 
      background: #050505; 
      border-radius: 12px; 
      border: 2px solid #a1a1aa; 
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e4e4e7;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const StudentIconAlt = L.divIcon({
  html: `
    <div style="
      width: 32px; 
      height: 32px; 
      background: linear-gradient(135deg, #ffffff, #a1a1aa); 
      border-radius: 50%; 
      border: 3px solid #050505; 
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const [driver, setDriver] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const [activeLocalRoute, setActiveLocalRoute] = useState(null);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [pendingStudentsConfirm, setPendingStudentsConfirm] = useState(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId } = useCurrentTrip(driver?.route);
  const { attendanceMap } = useDriverAttendanceMap(tripId);

  // Listener do perfil do motorista (redireciona se aluno ou não cadastrado)
  useEffect(() => {
    if (!user) return;

    let unsubDriver = () => {};

    unsubDriver = onSnapshot(doc(db, 'students', user.uid), async (driverSnap) => {
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

      try {
        // Buscar alunos dessa rota para consolidação
        const studentsRef = collection(db, 'students');
        const qStudents = query(studentsRef, where('route', '==', driverData.route), where('role', '==', 'student'));
        const studentSnaps = await getDocs(qStudents);
        const studentsData = studentSnaps.docs.map(d => ({ uid: d.id, ...d.data() }));
        setStudents(studentsData);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dashboard do motorista:', err);
        setLoading(false);
      }
    });

    return () => unsubDriver();
  }, [user]);



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
  useEffect(() => {
    if (!trip || !trip.id || trip?.status === 'finished') return;

    if (!navigator.geolocation) {
      showAlert("Seu navegador não suporta geolocalização. O rastreamento não funcionará.");
      return;
    }

    // Usamos tanto watchPosition quanto um fallback de setInterval para garantir resiliência
    let watchId;
    let fallbackInterval;

    const sendLocation = async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        await updateDoc(doc(db, 'trips', trip.id), {
          busLocation: { lat: latitude, lng: longitude }
        });
      } catch (e) {
        console.error("Erro ao enviar coordenadas do GPS para o Firebase", e);
      }
    };

    const handleError = (error) => {
      console.error("Erro de GPS:", error.message);
      if (error.code === error.PERMISSION_DENIED) {
        showAlert("Permissão negada! Por favor, autorize o uso do GPS (Localização) no seu navegador para que os alunos possam acompanhar o ônibus.");
      }
    };

    watchId = navigator.geolocation.watchPosition(sendLocation, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0
      // Sem timeout para evitar que o browser desista do rastreamento em áreas de sombra
    });

    // Fallback: Tenta pegar a posição ativamente a cada 10s caso o watchPosition hiberne (comum em iOS)
    fallbackInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation, () => {}, {
        enableHighAccuracy: true,
        maximumAge: 0
      });
    }, 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(fallbackInterval);
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
      if ((att.status === 'liberado' || att.status === 'aguardando') && att.lat && att.lng) {
        // Usa os dados do próprio attendance, sem depender do fetch estático de users
        const student = { name: att.studentName || 'Aluno', faculty: att.faculty, status: att.status };

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

  const openNavigationTo = async (lat, lng) => {
    if (!trip?.busLocation) {
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
      
      const studentObj = students.find(s => s.uid === studentId);
      
      await setDoc(doc(db, 'attendance', attendanceId), { 
        status: newStatus,
        tripId: trip.id,
        studentId: studentId,
        studentName: studentObj?.name || 'Aluno',
        faculty: studentObj?.faculty || 'Outra',
        route: studentObj?.route || 'Professor Jamil',
        photoURL: studentObj?.photoURL || null
      }, { merge: true });
    } catch(e) {
      console.error(e);
      showAlert("Erro ao atualizar status do aluno");
    }
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
      setTrip(prev => ({ ...prev, status: newStatus }));
      
      if (newStatus === 'in_progress') {
        try { playSuccessSound(); } catch(e){}
        // O GPS real começará a atualizar o banco pelo useEffect
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
          <div className="absolute top-4 right-4 z-[1000] bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2 shadow-xl pointer-events-none">
            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Legenda de Rotas</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
              <span className="text-zinc-300 text-xs font-medium">Professor Jamil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"></div>
              <span className="text-zinc-300 text-xs font-medium">Cromínia</span>
            </div>
          </div>

          <MapContainer center={CENTER} zoom={12} className="w-full h-full" zoomControl={false} attributionControl={false} rotate={true} touchRotate={true}>
            <MapInteractions />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {/* Linha da Rota Geral OSRM */}
            {(trip?.driverRoutePath || trip?.routePath) && ((trip?.driverRoutePath?.length > 0) || (trip?.routePath?.length > 0)) && trip.status !== 'finished' && (
              <Polyline positions={trip.driverRoutePath || trip.routePath} color={driver?.route === 'Cromínia' ? "#ffffff" : "#f97316"} weight={5} opacity={0.8} />
            )}

            {/* Linha da Rota Local OSRM */}
            {activeLocalRoute && activeLocalRoute.length > 0 && trip.status !== 'finished' && (
              <Polyline positions={activeLocalRoute} color={driver?.route === 'Cromínia' ? "#ffffff" : "#f97316"} weight={6} opacity={0.9} dashArray="10, 10" />
            )}

            {/* Faculdades com passageiros ativos (Apenas da rota do motorista) */}
            {Object.entries(MOCK_FACULTIES)
              .filter(([facName]) => Object.values(attendanceMap).some(att => att.faculty === facName && att.status !== 'cancelado'))
              .map(([facName, coords]) => {
                const isCrominia = driver?.route === 'Cromínia';
                return (
                  <Marker key={facName} position={coords} icon={isCrominia ? FacultyIconAlt : FacultyIcon}>
                    <Popup className="dark-popup">
                      <span className="font-bold text-white">{facName}</span>
                    </Popup>
                  </Marker>
                );
            })}

            {/* Pinos Customizados ou Grupos Aleatórios */}
            {trip?.status !== 'finished' && customClusters.map(cluster => {
              if (cluster.students.length < 3) {
                const icon = cluster.students.some(s => s.status === 'liberado') 
                  ? (driver?.route === 'Cromínia' ? StudentIconAlt : StudentIcon) 
                  : (driver?.route === 'Cromínia' ? FacultyIconAlt : FacultyIcon);
                return (
                  <Marker key={cluster.id} position={[cluster.lat, cluster.lng]} icon={icon} zIndexOffset={600}>
                    <Popup className="dark-popup">
                      <div className="flex flex-col gap-2 mb-3">
                        {cluster.students.map(s => (
                          <div key={s.uid} className="flex items-center gap-3">
                            {s.photoURL && <img src={s.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0" />}
                            <span className="font-bold text-base text-white">{s.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => openNavigationTo(cluster.lat, cluster.lng)}
                        className="w-full btn-primary py-2 px-4 rounded-lg font-bold text-sm shadow-md transition-colors"
                      >
                        Ir até {cluster.students.length > 1 ? 'o grupo' : 'o aluno'}
                      </button>
                    </Popup>
                  </Marker>
                );
              } else {
                return (
                  <Marker key={cluster.id} position={[cluster.lat, cluster.lng]} icon={createCustomIcon(cluster.students.length, undefined)} zIndexOffset={600}>
                    <Popup className="dark-popup max-h-60 overflow-y-auto custom-scrollbar">
                      <span className="font-bold text-lg text-white block mb-3">Grupo de Alunos</span>
                      <div className="flex flex-col gap-2 mb-3">
                        {cluster.students.map(s => (
                          <div key={s.uid} className="flex items-center gap-2">
                            {s.photoURL && <img src={s.photoURL} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0" />}
                            <span className="text-zinc-300 font-medium text-sm">{s.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => openNavigationTo(cluster.lat, cluster.lng)}
                        className="w-full btn-primary py-2 px-4 rounded-lg font-bold text-sm shadow-md transition-colors sticky bottom-0"
                      >
                        Ir para o Grupo
                      </button>
                    </Popup>
                  </Marker>
                );
              }
            })}

            {/* Botão de Centralizar no GPS do Motorista */}
            {trip?.busLocation?.lat && trip?.busLocation?.lng && (
              <>
                <Marker position={[trip.busLocation.lat, trip.busLocation.lng]} icon={driver?.route === 'Cromínia' ? BusIconAlt : BusIcon} zIndexOffset={1000}>
                  <Popup className="dark-popup">
                    <span className="font-bold text-orange-500">Você (Motorista)</span>
                  </Popup>
                </Marker>
                <RecenterButton lat={trip.busLocation.lat} lng={trip.busLocation.lng} />
              </>
            )}
          </MapContainer>
        </div>

        {/* Tabela Consolidada (Painel Flutuante) */}
        <div className={`absolute md:relative z-10 w-full md:w-[400px] electric-card bg-[#0A0A0A] p-5 overflow-y-auto border-t md:border-t-0 md:border-r border-orange-500/20 shadow-[10px_0_40px_rgba(249,115,22,0.1)] flex flex-col mt-auto md:mt-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelOpen ? 'translate-y-0 md:translate-x-0 max-h-[55vh] md:max-h-full bottom-0' : 'translate-y-full md:translate-y-0 md:-translate-x-full max-h-[55vh] md:max-h-full bottom-0 md:left-0'} `}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bricolage font-light text-white tracking-tight">Resumo da Rota</h2>
            <button 
              onClick={() => setIsPanelOpen(false)} 
              className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors border border-white/10"
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
              <div key={fac.name} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg">{fac.name}</h3>
                  <p className="text-zinc-500 text-sm font-medium">Na lista de hoje</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-orange-500">
                    {fac.count} <span className="text-sm font-medium text-zinc-600">passageiros</span>
                  </div>
                </div>
              </div>
            ))}
            {facultySummary.length === 0 && (
              <p className="text-center text-zinc-500 py-6">Nenhum aluno aguardando na rota hoje.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal da Lista Pública (Checklist de Embarque) */}
      {isPublicListOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPublicListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#0A0A0A]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden electric-card flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-orange-500" />
                  Checklist de Embarque
                </h3>
                <button onClick={() => setIsPublicListOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {Object.values(attendanceMap).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>Nenhum aluno na lista de hoje.</p>
                </div>
              ) : (
                Object.values(attendanceMap)
                  .sort((a, b) => {
                    const statusOrder = { 'aguardando': 0, 'liberado': 0, 'embarcado': 1, 'cancelado': 2 };
                    const orderA = statusOrder[a.status] ?? 0;
                    const orderB = statusOrder[b.status] ?? 0;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.studentName.localeCompare(b.studentName);
                  })
                  .map(att => {
                    const isEmbarcado = att.status === 'embarcado';
                    const isCancelado = att.status === 'cancelado';
                    
                    let bgColor = 'bg-white/5 border-white/5 hover:bg-white/10';
                    let avatarBg = 'bg-gradient-to-br from-orange-500 to-yellow-500';
                    let nameColor = 'text-white';
                    
                    if (isEmbarcado) {
                      bgColor = 'bg-orange-500/10 border-orange-500/30';
                      avatarBg = 'bg-orange-500 text-black';
                      nameColor = 'text-orange-400 line-through opacity-70';
                    } else if (isCancelado) {
                      bgColor = 'bg-zinc-800/50 border-zinc-700/50';
                      avatarBg = 'bg-zinc-700 text-zinc-400';
                      nameColor = 'text-zinc-500 line-through opacity-70';
                    }
                    
                    return (
                      <div key={att.studentId} className={`flex items-center justify-between border p-4 rounded-2xl transition-colors ${bgColor}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-lg ${avatarBg}`}>
                            {att.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-bold leading-tight ${nameColor}`}>{att.studentName}</p>
                            <p className="text-xs text-zinc-400 mt-1">{att.faculty} • {att.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStudentStatus(att.studentId, att.status, 'cancelado')}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${isCancelado ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700' : 'bg-white/10 text-zinc-400 border-white/10 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}`}
                            title={isCancelado ? "Desfazer ausência" : "Marcar como não vai"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleStudentStatus(att.studentId, att.status, 'embarcado')}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${isEmbarcado ? 'bg-orange-500 text-black border-orange-500 hover:bg-orange-600' : 'bg-white/10 text-zinc-400 border-white/10 hover:bg-orange-500 hover:text-black hover:border-orange-500'}`}
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
        <div className="bg-[#050505] border-t border-white/5 flex items-center justify-around gap-2 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-50 shrink-0 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] w-full overflow-x-auto [&>button]:shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          <button 
            onClick={() => {
              const newState = !isPublicListOpen;
              setIsPublicListOpen(newState);
              if (newState) setIsPanelOpen(false);
            }}
            className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors relative"
          >
            <div className="relative p-2">
              <Users size={24} />
              <span className="absolute top-0 right-0 bg-orange-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black translate-x-1/2 -translate-y-1/4 shadow-sm border border-black">
                {Object.values(attendanceMap).filter(att => att.status === 'liberado' || att.status === 'aguardando').length}
              </span>
            </div>
            <span className="text-[11px] font-medium mt-0.5">Lista</span>
          </button>

          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`flex flex-col items-center justify-center transition-colors ${isPanelOpen ? 'text-orange-500' : 'text-zinc-400 hover:text-orange-500'}`}
          >
            <div className="p-2"><BarChart2 size={24} /></div>
            <span className="text-[11px] font-medium mt-0.5">Resumo</span>
          </button>

          <div id="navbar-compass-slot" className="flex items-center justify-center min-w-[44px] shrink-0"></div>
          <div id="navbar-recenter-slot" className="flex items-center justify-center min-w-[44px] shrink-0"></div>

          {trip.status === 'open' && (
            <button 
              onClick={() => updateTripStatus('in_progress')}
              disabled={isUpdatingTrip}
              className={`flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-2"><Play size={24} /></div>
              <span className="text-[11px] font-medium mt-0.5">{isUpdatingTrip ? 'Iniciando' : 'Iniciar'}</span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button 
              onClick={recalculateGlobalRoute}
              disabled={isUpdatingTrip}
              className={`flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors ${isUpdatingTrip ? 'opacity-50' : ''}`}
            >
              <div className="p-2"><RefreshCcw size={24} /></div>
              <span className="text-[11px] font-medium mt-0.5">{isUpdatingTrip ? 'Atz...' : 'Atualizar'}</span>
            </button>
          )}

          {trip.status === 'in_progress' && (
            <button 
              onClick={handleFinishClick}
              className="flex flex-col items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
            >
              <div className="p-2"><StopCircle size={24} /></div>
              <span className="text-[11px] font-medium mt-0.5">Finalizar</span>
            </button>
          )}

          {trip.status === 'finished' && (
            <button 
              onClick={() => updateTripStatus('open')}
              className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
            >
              <div className="p-2"><Play size={24} /></div>
              <span className="text-[11px] font-medium mt-0.5">Reabrir</span>
            </button>
          )}

          {activeLocalRoute && trip.status !== 'finished' && (
             <button 
               onClick={() => setActiveLocalRoute(null)}
               className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
             >
               <div className="p-2"><MapPinOff size={24} /></div>
               <span className="text-[11px] font-medium mt-0.5">Limpar</span>
             </button>
          )}

        </div>
      )}

      {/* Modal de Alunos Deixados para Trás */}
      {pendingStudentsConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-white mb-2 relative z-10">Finalizar Viagem?</h3>
            <p className="text-zinc-400 text-sm mb-4 relative z-10">
              Ainda há <strong className="text-white">{pendingStudentsConfirm.length}</strong> aluno(s) aguardando na lista:
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
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-2"
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
