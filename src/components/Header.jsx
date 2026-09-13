import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Settings, User, History, LogOut, Camera, X, Check, Download, MapPin, Sparkles, Bus, Shield, Bell } from 'lucide-react';
import { doc, updateDoc, setDoc, serverTimestamp, collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCustomAlert } from '../contexts/AlertContext';
import { migrateStudentAttendance, normalizeRoute } from '../utils/tripManager';
import TripCalendarModal from './TripCalendarModal';
import AnnouncementsModal from './AnnouncementsModal';
import LocationPickerMap from './LocationPickerMap';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
import { playPopSound, playSuccessSound } from '../utils/audioEffects';

const DropdownSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || { label: value, value };
  
  return (
    <div className="relative group text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-subtle border border-subtle rounded-xl pl-4 pr-10 py-2.5 text-heading text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer flex items-center justify-between shadow-inner"
      >
        <span className="truncate">{selectedOption.label}</span>
        <div className={`absolute right-3 text-caption transition-transform ${isOpen ? 'rotate-180' : ''}`}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <ul className="absolute z-50 w-full mt-2 bg-card-elevated border border-subtle rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 cursor-pointer transition-colors text-sm ${value === opt.value ? 'bg-primary/15 text-primary font-bold border-l-2 border-primary pl-3' : 'text-body hover-bg-subtle hover:text-heading border-l-2 border-transparent'}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default function Header({ userProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOSAndNotInstalled, setIsIOSAndNotInstalled] = useState(false);
  const { showAlert } = useCustomAlert();

  useEffect(() => {
    if (user?.photoURL && userProfile && !userProfile.photoURL && userProfile.uid) {
      updateDoc(doc(db, 'students', userProfile.uid), { photoURL: user.photoURL }).catch(console.error);
    }
  }, [user, userProfile]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(userProfile?.name || '');
  const [newFaculty, setNewFaculty] = useState(userProfile?.faculty || '');
  const [newRoute, setNewRoute] = useState(userProfile?.route || 'Professor Jamil');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [fullTripHistory, setFullTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  // Listener de comunicados não lidos para o badge do sino
  useEffect(() => {
    const q = query(collection(db, 'announcements'), limit(25));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastRead = parseInt(localStorage.getItem('rhyme_last_read_announcement_time') || '0', 10);
      let count = 0;
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const isRelevant = userProfile?.role === 'admin' 
          || data.route === 'Todas' 
          || !data.route 
          || data.route === userProfile?.route;

        if (isRelevant) {
          const ts = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt?.seconds ? data.createdAt.seconds * 1000 : 0);
          if (ts > lastRead) {
            count += 1;
          }
        }
      });
      setUnreadAnnouncementsCount(count);
    }, (err) => {
      console.warn('Erro ao escutar comunicados:', err);
    });

    return () => unsubscribe();
  }, [userProfile?.role, userProfile?.route]);

  const handleOpenAnnouncements = () => {
    playPopSound();
    setIsAnnouncementsOpen(true);
    setUnreadAnnouncementsCount(0);
    localStorage.setItem('rhyme_last_read_announcement_time', Date.now().toString());
  };

  const FACULTY_COORDS = {
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
    'Outra': [-16.675707046574686, -49.24547515495722],
  };

  useEffect(() => {
    if (!isSettingsOpen || !user || !userProfile) return;
    
    async function fetchHistory() {
      setLoadingHistory(true);
      try {
        if (userProfile.role === 'student') {
          const q = query(
            collection(db, 'attendance'),
            where('studentId', '==', user.uid)
          );
          const snap = await getDocs(q);
          let history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          history.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
          setFullTripHistory(history);
          setTripHistory(history.slice(0, 5));
        } else if (userProfile.role === 'driver') {
          const q = query(
            collection(db, 'trips'),
            where('driverId', '==', user.uid)
          );
          const snap = await getDocs(q);
          let history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          history.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setFullTripHistory(history);
          setTripHistory(history.slice(0, 5));
        }
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    
    fetchHistory();
  }, [isSettingsOpen, user, userProfile]);

  useEffect(() => {
    if (userProfile?.name) setNewName(userProfile.name);
    setNewFaculty(userProfile?.faculty || '');
    setNewRoute(userProfile?.route || 'Professor Jamil');
  }, [userProfile?.name, userProfile?.faculty, userProfile?.route]);

  // Bloqueio rigoroso de scroll do documento quando qualquer modal estiver aberto
  useEffect(() => {
    if (isSettingsOpen || isAnnouncementsOpen || isCalendarOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, 0);
    };
  }, [isSettingsOpen, isAnnouncementsOpen, isCalendarOpen]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
      setIsIOSAndNotInstalled(!isStandaloneMode);
    };
    
    checkStandalone();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      showAlert("Para instalar no iPhone: Toque no ícone de Compartilhar (quadrado com seta para cima) no Safari, e depois escolha 'Adicionar à Tela de Início'.\n\nNo Android: Toque nos três pontinhos do navegador e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Falha ao deslogar', err);
    }
  };

  const handleUpdateProfile = async () => {
    const isNameChanged = newName.trim() !== userProfile.name;
    const isRouteChanged = newRoute.trim() !== userProfile.route;
    const isFacultyChanged = userProfile.role === 'student' && newFaculty.trim() !== userProfile.faculty;
    
    if (!isNameChanged && !isRouteChanged && !isFacultyChanged) return;
    if (!newName.trim()) {
      showAlert("Preencha o nome corretamente.");
      return;
    }
    
    setIsSaving(true);
    try {
      const collectionName = 'students';
      
      const updateData = { name: newName.trim(), route: newRoute.trim() };
      if (userProfile.role === 'student') {
        updateData.faculty = newFaculty.trim();
      }

      await updateDoc(doc(db, collectionName, userProfile.uid), updateData);

      if (userProfile.role === 'student') {
        if (isRouteChanged) {
          await migrateStudentAttendance(
            userProfile.uid,
            userProfile.route,
            newRoute.trim(),
            {
              name: newName.trim(),
              faculty: newFaculty.trim(),
              photoURL: userProfile.photoURL || null
            }
          );
        } else if (isNameChanged || isFacultyChanged) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const dateString = `${yyyy}-${mm}-${dd}`;
          const currentTripId = `trip_${normalizeRoute(userProfile.route)}_${dateString}`;
          const attRef = doc(db, 'attendance', `${currentTripId}_${userProfile.uid}`);
          await setDoc(attRef, {
            studentName: newName.trim(),
            faculty: newFaculty.trim(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      setSaveSuccess(true);
      playSuccessSound();
      setTimeout(() => setSaveSuccess(false), 3000);
      showAlert("Perfil e rota atualizados com sucesso!");
    } catch (err) {
      console.error(err);
      showAlert('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userProfile?.uid) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert('A foto deve ter no máximo 5MB.');
      return;
    }
    
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        const downloadURL = data.data.url;
        await updateDoc(doc(db, 'students', userProfile.uid), { photoURL: downloadURL });
        showAlert('Foto de perfil atualizada com sucesso!');
      } else {
        throw new Error(data.error?.message || 'Erro na API do ImgBB');
      }
    } catch (err) {
      console.error(err);
      showAlert('Erro ao enviar foto. Verifique sua API Key do ImgBB.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
    <div 
      className="px-4 sm:px-6 py-3.5 bg-surface/80 backdrop-blur-md border-b border-subtle flex justify-between items-center z-50 sticky top-0 shadow-sm shrink-0 transition-colors select-none touch-none overscroll-none"
      onWheel={(e) => e.preventDefault()}
    >
      <div className="flex flex-col">
        {userProfile ? (
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {userProfile.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.name} className="w-10 h-10 rounded-full object-cover shadow-inner border border-subtle" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-lg shadow-inner">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-heading tracking-wide">{userProfile.name}</span>
                  {userProfile.role === 'admin' && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 tracking-wider">
                      ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {userProfile.role === 'driver' || userProfile.role === 'admin' ? `Rota: ${userProfile.route}` : userProfile.faculty}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-subtle animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-subtle rounded animate-pulse"></div>
              <div className="h-2 w-16 bg-subtle rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {userProfile?.role === 'admin' && (
          <button
            onClick={() => {
              if (location.pathname.startsWith('/motorista')) {
                navigate('/aluno/mapa');
              } else {
                navigate('/motorista/dashboard');
              }
            }}
            title={location.pathname.startsWith('/motorista') ? "Mudar para Visão do Aluno" : "Mudar para Painel do Motorista"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30 group shadow-sm active:scale-95"
          >
            {location.pathname.startsWith('/motorista') ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visão Aluno</span>
              </>
            ) : (
              <>
                <Bus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Painel Motorista</span>
              </>
            )}
          </button>
        )}

        {(deferredPrompt || isIOSAndNotInstalled) && (
          <button
            onClick={handleInstallClick}
            title="Instalar App"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30 group shadow-sm"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}
        
        {/* Mural de Avisos / Comunicados */}
        <button
          onClick={handleOpenAnnouncements}
          title="Mural de Avisos"
          className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-subtle text-body hover:bg-primary/10 hover:text-primary transition-all border border-subtle hover:border-primary/30 group active:scale-95"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
          {unreadAnnouncementsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-card animate-pulse" />
          )}
        </button>

        <button
          onClick={() => {
            playPopSound();
            setIsSettingsOpen(true);
          }}
          title="Configurações"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-subtle text-body hover:bg-primary/10 hover:text-primary transition-all border border-subtle hover:border-primary/30 group"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </div>

    {/* Settings Modal */}
    {isSettingsOpen && (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overscroll-none select-none"
        onWheel={(e) => {
          if (!e.target.closest('.custom-scrollbar')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          if (!e.target.closest('.custom-scrollbar')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm touch-none overscroll-none" 
          onClick={() => {
            setIsSettingsOpen(false);
            window.scrollTo(0, 0);
          }}
        />
        
        <div className="relative w-full max-w-md electric-card bg-card rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header do Modal */}
          <div 
            className="p-6 border-b border-subtle bg-gradient-to-b from-primary/10 to-transparent flex justify-between items-center shrink-0 touch-none overscroll-none"
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <h2 className="text-xl font-display font-bold text-heading flex items-center gap-2">
              <Settings size={20} className="text-primary" />
              Configurações
            </h2>
            <button 
              onClick={() => {
                setIsSettingsOpen(false);
                window.scrollTo(0, 0);
              }} 
              className="text-caption hover:text-heading p-2 rounded-full hover-bg-subtle transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 overscroll-contain">
            
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-inner border-4 border-card" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-4xl shadow-inner border-4 border-card">
                    {userProfile?.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-subtle hover-bg-subtle border-2 border-card rounded-full flex items-center justify-center transition-colors ${isUploadingPhoto ? 'text-caption cursor-not-allowed' : 'text-primary'}`}
                >
                  {isUploadingPhoto ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Camera size={14} />}
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-caption">{userProfile?.email}</p>
              </div>
            </div>

            {/* Aparência & Preferências */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Aparência e Sons
              </h3>
              <div className="bg-subtle border border-subtle rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-heading block">Tema Visual</span>
                  <span className="text-xs text-caption">Alternar entre modo claro e escuro</span>
                </div>
                <ThemeToggle />
              </div>
              <div className="bg-subtle border border-subtle rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-heading block">Efeitos Sonoros</span>
                  <span className="text-xs text-caption">Feedback tátil e sons da interface</span>
                </div>
                <SoundToggle />
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-primary" />
                Seu Perfil
              </h3>
              <div className="bg-subtle border border-subtle rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-body ml-1">Nome de Exibição</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 min-w-0 bg-card border border-subtle rounded-xl px-4 py-2.5 text-heading text-sm focus:outline-none focus:border-primary transition-colors shadow-inner"
                    />
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isSaving || (newName.trim() === userProfile?.name && newRoute.trim() === userProfile?.route && (userProfile?.role === 'driver' || newFaculty.trim() === userProfile?.faculty))}
                      className="shrink-0 bg-primary hover:bg-primary-hover disabled:bg-subtle disabled:text-caption text-black px-4 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      {isSaving ? '...' : saveSuccess ? <Check size={18} /> : 'Salvar'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <label className="text-xs font-medium text-body ml-1">Rota</label>
                  <DropdownSelect
                    value={newRoute}
                    onChange={(val) => setNewRoute(val)}
                    options={['Professor Jamil', 'Cromínia', 'Hidrolândia'].map(f => ({ label: f, value: f }))}
                  />
                </div>

                {userProfile?.role === 'student' && (
                  <>
                  <div className="space-y-1.5 mt-4">
                    <label className="text-xs font-medium text-body ml-1">Faculdade</label>
                    <DropdownSelect
                      value={newFaculty}
                      onChange={(val) => setNewFaculty(val)}
                      options={['UFG', 'UFG - Campus Colemar', 'PUC', 'IFG', 'UNIP', 'FASAM', 'Estácio', 'Unicamps', 'Eseffego', 'Colégio Vitória', 'Outra'].map(f => ({ label: f, value: f }))}
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowFacultyPicker(true)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 bg-primary/5 py-2.5 rounded-xl transition-colors"
                    >
                      <MapPin size={15} />
                      {userProfile?.facultyLocation ? 'Ajustar localização da faculdade' : 'Marcar localização da faculdade'}
                    </button>
                    {userProfile?.facultyLocation && (
                      <p className="text-[10px] text-caption flex items-center justify-center gap-1 text-center mt-1.5">
                        <Check size={12} className="text-emerald-500 stroke-[3]" /> Localização personalizada ativa
                      </p>
                    )}
                  </div>
                  </>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-primary" />
                Últimas Viagens
              </h3>
              <div className="bg-subtle border border-subtle rounded-2xl p-4">
                {loadingHistory ? (
                  <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : tripHistory.length > 0 ? (
                  <div className="space-y-3">
                    {tripHistory.map((item, idx) => {
                      const date = item.updatedAt ? item.updatedAt.toDate() : (item.createdAt ? item.createdAt.toDate() : new Date());
                      return (
                        <div key={idx} className="flex items-center justify-between border-b border-subtle pb-3 last:border-0 last:pb-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-heading">{date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-xs text-caption mt-0.5">
                              {userProfile.role === 'student' ? (
                                item.status === 'confirmado' ? 'Embarcou' :
                                item.status === 'cancelado' ? 'Não foi' : 'Aguardando'
                              ) : (
                                `Status: ${item.status === 'finished' ? 'Finalizada' : 'Em andamento'}`
                              )}
                            </span>
                          </div>
                          {userProfile.role === 'student' && item.status === 'confirmado' && (
                             <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                               <Check size={12} className="stroke-[3]" /> Confirmado
                             </span>
                          )}
                          {userProfile.role === 'student' && item.status === 'cancelado' && (
                             <span className="text-[10px] font-bold text-caption bg-subtle px-2 py-1 rounded flex items-center gap-1">
                               <X size={12} className="stroke-[3]" /> Cancelado
                             </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <History size={32} className="text-caption mx-auto mb-3 opacity-50" />
                    <p className="text-caption text-sm font-medium">Nenhuma viagem registrada ainda.</p>
                  </div>
                )}
                
                {fullTripHistory.length > 5 && (
                  <button 
                    onClick={() => { setIsCalendarOpen(true); setIsSettingsOpen(false); }}
                    className="w-full mt-4 py-2 border border-primary/30 rounded-xl text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
                  >
                    Ver calendário completo
                  </button>
                )}
                {fullTripHistory.length <= 5 && fullTripHistory.length > 0 && (
                   <button 
                   onClick={() => { setIsCalendarOpen(true); setIsSettingsOpen(false); }}
                   className="w-full mt-4 py-2 border border-primary/30 rounded-xl text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
                 >
                   Ver calendário completo
                 </button>
                )}
              </div>
            </div>

            {/* Painel Administrativo */}
            {userProfile?.role === 'admin' && (
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <Shield size={14} /> Modo Administrador
                  </span>
                  <span className="text-[10px] text-caption font-semibold uppercase tracking-wider">Acesso Total</span>
                </div>
                <p className="text-xs text-body leading-relaxed">
                  Você possui permissões de administrador. Pode inspecionar e operar qualquer rota, além de alternar livremente entre as telas.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsSettingsOpen(false); navigate('/aluno/mapa'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${location.pathname.startsWith('/aluno') ? 'bg-primary text-white shadow-sm' : 'bg-subtle text-body hover:text-heading border border-subtle'}`}
                  >
                    <User size={13} /> Visão Aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSettingsOpen(false); navigate('/motorista/dashboard'); }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${location.pathname.startsWith('/motorista') ? 'bg-primary text-white shadow-sm' : 'bg-subtle text-body hover:text-heading border border-subtle'}`}
                  >
                    <Bus size={13} /> Painel Motorista
                  </button>
                </div>
              </div>
            )}

            {/* Zona de Perigo / Logout */}
            <div className="pt-4 border-t border-subtle">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-danger-bg hover:brightness-110 text-danger border border-danger-border rounded-xl py-3.5 font-bold text-sm transition-colors"
              >
                <LogOut size={18} />
                Sair da conta
              </button>
            </div>

          </div>
        </div>
      </div>
    )}

    {isCalendarOpen && (
      <TripCalendarModal 
        history={fullTripHistory} 
        onClose={() => setIsCalendarOpen(false)} 
        userProfile={userProfile}
      />
    )}

    {showFacultyPicker && userProfile?.role === 'student' && (
      <LocationPickerMap
        title="Localização da Faculdade"
        subtitle="Marque o ponto exato onde o ônibus deverá parar para te pegar."
        initialCenter={
          userProfile.facultyLocation
            ? [userProfile.facultyLocation.lat, userProfile.facultyLocation.lng]
            : (FACULTY_COORDS[userProfile.faculty] || FACULTY_COORDS['Outra'])
        }
        initialPin={userProfile.facultyLocation || null}
        onConfirm={async (loc) => {
          setShowFacultyPicker(false);
          if (!userProfile?.uid) return;
          try {
            await updateDoc(doc(db, 'students', userProfile.uid), { facultyLocation: loc });
            showAlert(loc ? 'Localização da faculdade atualizada!' : 'Localização restaurada para o padrão!');
          } catch (err) {
            console.error(err);
            showAlert('Erro ao salvar localização.');
          }
        }}
        onClose={() => setShowFacultyPicker(false)}
      />
    )}
      <AnnouncementsModal
        isOpen={isAnnouncementsOpen}
        onClose={() => setIsAnnouncementsOpen(false)}
        userProfile={userProfile}
        currentUserId={user?.uid}
      />
    </>
  );
}
