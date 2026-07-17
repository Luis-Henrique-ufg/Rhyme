import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Users, Check, RefreshCcw, MapPin, Navigation, LocateFixed } from 'lucide-react';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { joinTrip } from '../utils/tripManager';
import { useCurrentTrip, useTripAttendances, useAllActiveTrips, useAllTripAttendances } from '../utils/useTripData';
import Header from '../components/Header';
import Loader from '../components/Loader';
import MapInteractions from '../components/MapInteractions';
import ReactDOM from 'react-dom';
import { useCustomAlert } from '../contexts/AlertContext';
import { playNotificationSound } from '../utils/audioEffects';
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

// Ícones Premium Estilo Uber
const BusIcon = L.divIcon({
  html: `
    <div style="
      width: 48px; 
      height: 48px; 
      background: linear-gradient(135deg, #f97316, #f59e0b); 
      border-radius: 12px; 
      border: 3px solid #050505; 
      box-shadow: 0 0 20px rgba(249, 115, 22, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="11" rx="2" ry="2"></rect>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <circle cx="6.5" cy="18" r="1.5"></circle>
        <circle cx="17.5" cy="18" r="1.5"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

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

const BusIconAlt = L.divIcon({
  html: `
    <div style="
      width: 48px; 
      height: 48px; 
      background: linear-gradient(135deg, #e4e4e7, #71717a); 
      border-radius: 12px; 
      border: 3px solid #050505; 
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #050505;
    ">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="11" rx="2" ry="2"></rect>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <circle cx="6.5" cy="18" r="1.5"></circle>
        <circle cx="17.5" cy="18" r="1.5"></circle>
      </svg>
    </div>
  `,
  className: 'bg-transparent border-none',
  iconSize: [48, 48],
  iconAnchor: [24, 24]
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
      className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
      title="Centralizar"
    >
      <div className="p-2"><LocateFixed size={24} /></div>
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

export default function StudentMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useCustomAlert();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [routePath, setRoutePath] = useState([]);
  const [isPublicListOpen, setIsPublicListOpen] = useState(false);
  const simulationInterval = useRef(null);

  // --- Data Adapter hooks (deep modules) ---
  const { trip, tripId, loading: tripLoading } = useCurrentTrip(student?.route);
  const { attendances: publicList } = useTripAttendances(tripId);
  const { allTrips } = useAllActiveTrips(['Professor Jamil', 'Cromínia']);
  const { allAttendances } = useAllTripAttendances(
    Object.keys(allTrips).length > 0 ? Object.keys(allTrips) : []
  );

  const loading = studentLoading || tripLoading;

  // Solicitar permissão de notificação nativa ao abrir o mapa
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
    const facCoords = student.faculty
      ? (MOCK_FACULTIES[student.faculty] || MOCK_FACULTIES['Outra'])
      : MOCK_FACULTIES['Outra'];
    joinTrip(trip.id, { uid: user.uid, ...student }, { lat: facCoords[0], lng: facCoords[1] });

    const unsub = onSnapshot(doc(db, 'attendance', attendanceId), (docSnap) => {
      if (docSnap.exists()) {
        setAttendance(docSnap.data());
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

    const facCoords = MOCK_FACULTIES[student.faculty];
    if (!facCoords) return;

    const distKm = getDistanceFromLatLonInKm(
      facCoords[0], facCoords[1],
      trip.busLocation.lat, trip.busLocation.lng
    );

    if (distKm <= 1.0) {
      setHasNotified(true);
      try { playNotificationSound(); } catch (e) { console.error('Audio blocked', e); }

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('O Ônibus está chegando!', {
          body: `Ele está a apenas ${(distKm * 1000).toFixed(0)} metros de você. Prepare-se para embarcar!`,
          icon: '/pwa-192x192.png'
        });
      } else {
        showAlert('O ônibus está chegando na sua localização!');
      }
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

  // Garante que a rota seja traçada ao carregar a página (F5) caso já esteja liberado
  useEffect(() => {
    if (isLiberado && attendance?.lat && attendance?.lng && routePath.length === 0) {
      drawRouteToBus(attendance.lat, attendance.lng);
    }
  }, [isLiberado, attendance?.lat, attendance?.lng, trip?.busLocation]);


  const handleLiberado = async () => {
    if (!trip || !user) return;
    setIsSubmitting(true);
    
    // Pede a localização atual do aluno
    if (!navigator.geolocation) {
      showAlert("Seu navegador não suporta GPS. Não é possível marcar presença.");
      setIsSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
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
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            updatedAt: serverTimestamp()
          });
          drawRouteToBus(position.coords.latitude, position.coords.longitude);
        } catch (err) {
          console.error("Erro ao marcar liberação:", err);
          showAlert("Erro ao salvar presença. Tente novamente.");
        } finally {
          setIsSubmitting(false);
        }
      },
      (error) => {
        console.error("Erro GPS Aluno:", error);
        showAlert("Não conseguimos acessar seu GPS automaticamente. Por favor, toque no mapa para definir onde você está esperando.");
        setIsEditingLocation(true);
        const facCoords = student?.faculty ? MOCK_FACULTIES[student.faculty] : null;
        setTempLocation(facCoords ? { lat: facCoords[0], lng: facCoords[1] } : { lat: CENTER[0], lng: CENTER[1] });
        setIsSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      await deleteDoc(doc(db, 'attendance', attendanceId));
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
  // ETA Calculation
  let etaMinutes = null;
  if (isLiberado && trip?.status === 'in_progress' && trip.busLocation && attendance?.lat && attendance?.lng) {
    const distKm = getDistanceFromLatLonInKm(
      attendance.lat, 
      attendance.lng, 
      trip.busLocation.lat, 
      trip.busLocation.lng
    );
    etaMinutes = Math.max(1, Math.round(distKm * 2));
  }

  if (loading) {
    return <Loader message="Carregando mapa..." />;
  }

  if (!student) {
    return <Navigate to="/cadastro" replace />;
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      <Header userProfile={student} />

      {/* Mapa */}
      <div className="flex-1 relative z-0">
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

        <MapContainer center={CENTER} zoom={13} className="w-full h-full" zoomControl={false} attributionControl={false} rotate={true} touchRotate={true}>
          <MapInteractions />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {/* Faculdades com alunos ativos e a do próprio aluno */}
          {Object.entries(MOCK_FACULTIES)
            .filter(([facName]) => {
              const hasLiberated = allAttendances.some(p => p.faculty === facName && p.status === 'liberado');
              if (hasLiberated) return false;
              
              return facName === student.faculty || allAttendances.some(p => p.faculty === facName && p.status !== 'cancelado');
            })
            .map(([facName, coords]) => {
              const facAttendances = allAttendances.filter(p => p.faculty === facName && p.status !== 'cancelado');
              const isCrominia = facAttendances.some(p => p.route === 'Cromínia') || (student.faculty === facName && student.route === 'Cromínia');
              return (
                <Marker key={facName} position={coords} icon={isCrominia ? FacultyIconAlt : FacultyIcon}>
                  <Popup className="dark-popup">
                    <span className="font-bold text-white">{facName}</span>
                  </Popup>
                </Marker>
              );
            })}

          {/* Marcadores de Todos os Alunos Liberados */}
          {allAttendances.filter(a => a.status === 'liberado').map(att => {
            const isMe = att.studentId === user?.uid;
            const currentRoute = isMe ? student.route : att.route;
            const currentPhoto = isMe ? student.photoURL : att.photoURL;
            return (
            <Marker key={att.id} position={[att.lat, att.lng]} icon={currentRoute === 'Cromínia' ? StudentIconAlt : StudentIcon} zIndexOffset={800}>
              <Popup className="dark-popup">
                <div className="flex items-center gap-3">
                  {currentPhoto && <img src={currentPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />}
                  <span className="font-bold text-white text-base">{isMe ? `Você (${att.studentName})` : att.studentName}</span>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* Marcadores de Todos os Ônibus em Tempo Real */}
          {Object.values(allTrips).map(t => t.busLocation && (
            <Marker key={t.id} position={[t.busLocation.lat, t.busLocation.lng]} icon={t.route === 'Cromínia' ? BusIconAlt : BusIcon} zIndexOffset={1000}>
              <Popup className="dark-popup">
                <span className="font-bold text-orange-500">Ônibus ({t.driverName || 'Motorista'} - {t.route})</span>
              </Popup>
            </Marker>
          ))}

          {/* Linha da Rota OSRM (Apenas para o ônibus do próprio aluno) */}
          {routePath && routePath.length > 0 && (
            <Polyline positions={routePath} color={student.route === 'Cromínia' ? "#ffffff" : "#f97316"} weight={5} opacity={0.8} />
          )}

          <LocationPickerMode isEditing={isEditingLocation} onLocationSelected={setTempLocation} />
          {!isEditingLocation && <MapInteractionListener onInteract={() => setIsPanelCollapsed(true)} />}
          
          {/* Pino temporário do ajuste de local */}
          {isEditingLocation && tempLocation && (
            <Marker position={[tempLocation.lat, tempLocation.lng]} icon={StudentIcon} zIndexOffset={900} />
          )}

          {/* Botão de Centralizar no GPS do Aluno */}
          {attendance?.lat && attendance?.lng && !isEditingLocation && (
            <RecenterButton lat={attendance.lat} lng={attendance.lng} isPanelCollapsed={isPanelCollapsed} />
          )}
        </MapContainer>

        {/* Modal da Lista Pública */}
        {isPublicListOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPublicListOpen(false)}></div>
            <div className="relative electric-card bg-[#0A0A0A]/95 w-full max-w-md rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="p-6 border-b border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent z-10 flex justify-between items-center">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Users size={20} className="text-orange-500" />
                  Lista de Passageiros
                </h2>
                <button onClick={() => setIsPublicListOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 z-10 space-y-3 custom-scrollbar">
                {publicList.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">Ninguém na lista ainda.</p>
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
                        <div key={att.id} className={`flex items-center justify-between border p-4 rounded-2xl transition-colors ${bgColor}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${avatarBg}`}>
                              {(att.studentName || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold leading-tight ${nameColor}`}>{att.studentName || 'Aluno'}</p>
                              <p className="text-xs text-zinc-400 mt-1">{att.faculty || 'Outra'} • {att.status}</p>
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

        {/* UI do Modo de Edição de Local */}
        {isEditingLocation && (
          <>
            <div className="absolute top-4 left-4 right-4 z-[2000] bg-surface/90 backdrop-blur-md border border-primary p-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4">
              <p className="text-center text-primary font-bold text-sm">📍 Toque no mapa para mover seu pino</p>
            </div>
            
            <div className="absolute bottom-6 left-4 right-4 z-[2000] flex gap-3 animate-in slide-in-from-bottom-6">
              <button 
                onClick={() => { setIsEditingLocation(false); setTempLocation(null); }}
                className="flex-1 btn-secondary text-sm !px-4 !py-3 border border-white/10"
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
        <div className={`absolute bottom-[72px] w-full electric-card bg-[#0A0A0A] border-t border-orange-500/20 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(249,115,22,0.1)] z-[2000] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelCollapsed ? 'translate-y-[calc(100%+72px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        {/* Espaçamento superior que substitui o drag handle */}
        <div className="w-full flex justify-center pt-6 pb-2"></div>

        <div className="px-6 pb-8">
          {!trip ? (
            <div className="text-center py-6">
              <p className="text-zinc-400 font-medium">Nenhuma viagem ativa no radar 📡</p>
            </div>
          ) : trip.status === 'finished' ? (
            isLiberado ? (
              <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-red-500 mb-2 tracking-tight">Viagem Encerrada</h2>
                <p className="text-zinc-400 font-medium leading-relaxed mb-4 text-sm">O motorista finalizou a rota, mas você ainda estava aguardando. Você ficou para trás?</p>
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
                <p className="text-zinc-400 font-medium leading-relaxed">Sua ocorrência foi registrada e a coordenação foi avisada do incidente.</p>
              </div>
            ) : (
              <div className="text-center py-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="w-16 h-16 bg-green-500/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">Viagem Finalizada</h2>
                <p className="text-zinc-400 font-medium leading-relaxed">O motorista já encerrou a rota de hoje.<br/>Bom descanso!</p>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="inline-block bg-white/5 text-neutral-400 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full mb-3 border border-white/10">
                  Status do Embarque
                </div>
                
                <h2 className={`text-3xl font-bricolage font-light tracking-tight transition-all duration-500 text-transparent bg-clip-text bg-gradient-to-br ${isLiberado ? "from-orange-400 via-amber-500 to-yellow-300" : "from-white to-zinc-500"}`}>
                  {isLiberado ? "Confirmado! Aguarde na portaria." : "Você ainda não confirmou"}
                </h2>
                
                {etaMinutes && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-[pulse_3s_ease-in-out_infinite]">
                      A van chega em aprox. {etaMinutes} min
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                {/* Efeito de brilho pulsante atrás do botão se NÃO estiver liberado */}
                {!isLiberado && !isSubmitting && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                )}
                
                <button
                  onClick={handleLiberado}
                  disabled={isLiberado || isSubmitting}
                  className={`relative w-full py-4 rounded-2xl font-bold text-lg tracking-wide transition-all duration-300 overflow-hidden group flex items-center justify-center gap-2
                    ${isLiberado 
                      ? 'bg-white/5 text-neutral-500 border border-white/10 cursor-not-allowed shadow-none' 
                      : 'btn-primary !rounded-2xl !py-4'
                    }`}
                >
                  {/* Efeito de brilho passando no botão (sweep) */}
                  {!isLiberado && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  )}

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        SALVANDO...
                      </>
                    ) : (
                      isLiberado ? (
                        <>
                          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          LIBERADO (GPS OK)
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          LIBERADO
                        </>
                      )
                    )}
                  </span>
                </button>
                
                {isLiberado && (
                  <button 
                    onClick={handleCancelarEmbarque}
                    disabled={isSubmitting}
                    className="w-full mt-4 py-3 text-red-400 hover:text-red-300 font-medium text-sm transition-colors hover:bg-red-500/10 rounded-xl"
                  >
                    Cancelar Embarque
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
      )}

      {/* Bottom Navigation Bar (WhatsApp style) */}
      {!isEditingLocation && (
        <div className="bg-[#050505] border-t border-white/5 flex items-center justify-around gap-2 py-2 px-2 md:justify-center md:gap-8 md:px-6 z-[3000] shrink-0 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)] w-full overflow-x-auto [&>button]:shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          <button 
            onClick={() => {
              const newState = !isPublicListOpen;
              setIsPublicListOpen(newState);
              if (newState) setIsPanelCollapsed(true);
            }}
            className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors relative"
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
            className={`flex flex-col items-center justify-center transition-colors ${!isPanelCollapsed ? 'text-orange-500' : 'text-zinc-400 hover:text-orange-500'}`}
          >
            <div className="p-2"><Navigation size={24} /></div>
            <span className="text-[11px] font-medium mt-0.5">Embarque</span>
          </button>

          <div id="navbar-compass-slot" className="flex items-center justify-center min-w-[44px] shrink-0"></div>
          <div id="navbar-recenter-slot" className="flex items-center justify-center min-w-[44px] shrink-0"></div>

          {isLiberado && (
             <button 
               onClick={() => {
                 setIsEditingLocation(true);
                 setTempLocation(attendance?.lat && attendance?.lng ? { lat: attendance.lat, lng: attendance.lng } : null);
                 setIsPanelCollapsed(true);
                 setIsPublicListOpen(false);
               }}
               className="flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 transition-colors"
             >
               <div className="p-2"><MapPin size={24} /></div>
               <span className="text-[11px] font-medium mt-0.5">Ajustar</span>
             </button>
          )}

        </div>
      )}
    </div>
  );
}
