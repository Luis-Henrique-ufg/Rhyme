import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Settings, User, History, LogOut, Camera, X, Check, Download } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCustomAlert } from '../contexts/AlertContext';
import { useRef } from 'react';
import TripCalendarModal from './TripCalendarModal';

export default function Header({ userProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOSAndNotInstalled, setIsIOSAndNotInstalled] = useState(false);
  const { showAlert } = useCustomAlert();

  useEffect(() => {
    if (user?.photoURL && userProfile && !userProfile.photoURL && userProfile.uid) {
      updateDoc(doc(db, 'students', userProfile.uid), { photoURL: user.photoURL }).catch(console.error);
    }
  }, [user, userProfile]);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

const DropdownSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || { label: value, value };
  
  return (
    <div className="relative group text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 transition-colors cursor-pointer flex items-center justify-between"
      >
        <span className="truncate">{selectedOption.label}</span>
        <div className={`absolute right-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <ul className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-3 cursor-pointer transition-colors text-sm ${value === opt.value ? 'bg-orange-500/20 text-orange-500 font-bold border-l-2 border-orange-500 pl-3' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white border-l-2 border-transparent'}`}
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
  const [newName, setNewName] = useState('');
  const [newFaculty, setNewFaculty] = useState('');
  const [newRoute, setNewRoute] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [fullTripHistory, setFullTripHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
  }, [userProfile]);

  useEffect(() => {
    // Escuta evento nativo de instalação do Chrome/Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detecta iOS para popup manual
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Verifica se já está rodando em modo standalone (PWA instalado)
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
    <div className="px-6 py-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center z-50 sticky top-0 shadow-sm shrink-0">
      <div className="flex flex-col">
        {userProfile ? (
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {userProfile.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.name} className="w-10 h-10 rounded-full object-cover shadow-inner border border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-lg shadow-inner">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">{userProfile.name}</span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                  {userProfile.role === 'driver' ? `Rota: ${userProfile.route}` : userProfile.faculty}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse"></div>
              <div className="h-2 w-16 bg-neutral-800 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Logo RHYME na direita */}
          <div className="flex items-center border-r border-white/10 pr-4 mr-1">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 tracking-[0.2em] drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] font-sans" style={{fontFamily: "'Inter', sans-serif"}}>RHYME</span>
          </div>
          
          {(deferredPrompt || isIOSAndNotInstalled) && (
            <button
              onClick={handleInstallClick}
              title="Instalar App"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all border border-orange-500/30 group shadow-sm"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          )}
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Configurações"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:bg-orange-500/10 hover:text-orange-500 transition-all border border-white/10 hover:border-orange-500/30 group"
          >
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
    </div>

    {/* Settings Modal */}
    {isSettingsOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
        
        <div className="relative w-full max-w-md electric-card bg-[#0A0A0A] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header do Modal */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-b from-orange-500/10 to-transparent flex justify-between items-center shrink-0">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Settings size={20} className="text-orange-500" />
              Configurações
            </h2>
            <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-inner border-4 border-[#0A0A0A]" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-4xl shadow-inner border-4 border-[#0A0A0A]">
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
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-zinc-800 border-2 border-[#0A0A0A] rounded-full flex items-center justify-center transition-colors ${isUploadingPhoto ? 'text-zinc-500 cursor-not-allowed' : 'text-orange-500 hover:bg-zinc-700'}`}
                >
                  {isUploadingPhoto ? <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> : <Camera size={14} />}
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-500">{userProfile?.email}</p>
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-orange-500" />
                Seu Perfil
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 ml-1">Nome de Exibição</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isSaving || (newName.trim() === userProfile?.name && newRoute.trim() === userProfile?.route && (userProfile?.role === 'driver' || newFaculty.trim() === userProfile?.faculty))}
                      className="shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black px-4 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      {isSaving ? '...' : saveSuccess ? <Check size={18} /> : 'Salvar'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <label className="text-xs font-medium text-zinc-400 ml-1">Rota</label>
                  <DropdownSelect
                    value={newRoute}
                    onChange={(val) => setNewRoute(val)}
                    options={['Professor Jamil', 'Cromínia'].map(f => ({ label: f, value: f }))}
                  />
                </div>

                {userProfile?.role === 'student' && (
                  <div className="space-y-1.5 mt-4">
                    <label className="text-xs font-medium text-zinc-400 ml-1">Faculdade</label>
                    <DropdownSelect
                      value={newFaculty}
                      onChange={(val) => setNewFaculty(val)}
                      options={['UFG', 'UFG - Campus Colemar', 'PUC', 'IFG', 'UNIP', 'FASAM', 'Estácio', 'Unicamps', 'Eseffego', 'Colégio Vitória', 'Outra'].map(f => ({ label: f, value: f }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-orange-500" />
                Últimas Viagens
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                {loadingHistory ? (
                  <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : tripHistory.length > 0 ? (
                  <div className="space-y-3">
                    {tripHistory.map((item, idx) => {
                      const date = item.updatedAt ? item.updatedAt.toDate() : (item.createdAt ? item.createdAt.toDate() : new Date());
                      return (
                        <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200">{date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-xs text-zinc-400 mt-0.5">
                              {userProfile.role === 'student' ? (
                                item.status === 'confirmado' ? 'Embarcou' :
                                item.status === 'cancelado' ? 'Não foi' : 'Aguardando'
                              ) : (
                                `Status: ${item.status === 'finished' ? 'Finalizada' : 'Em andamento'}`
                              )}
                            </span>
                          </div>
                          {userProfile.role === 'student' && item.status === 'confirmado' && (
                             <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">✔</span>
                          )}
                           {userProfile.role === 'student' && item.status === 'cancelado' && (
                             <span className="text-[10px] font-bold text-zinc-400 bg-zinc-400/10 px-2 py-1 rounded">✖</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <History size={32} className="text-zinc-600 mx-auto mb-3 opacity-50" />
                    <p className="text-zinc-400 text-sm font-medium">Nenhuma viagem registrada ainda.</p>
                  </div>
                )}
                
                {fullTripHistory.length > 5 && (
                  <button 
                    onClick={() => { setIsCalendarOpen(true); setIsSettingsOpen(false); }}
                    className="w-full mt-4 py-2 border border-orange-500/30 rounded-xl text-orange-500 text-sm font-bold hover:bg-orange-500/10 transition-colors"
                  >
                    Ver mais no Calendário
                  </button>
                )}
                {fullTripHistory.length <= 5 && fullTripHistory.length > 0 && (
                   <button 
                   onClick={() => { setIsCalendarOpen(true); setIsSettingsOpen(false); }}
                   className="w-full mt-4 py-2 border border-orange-500/30 rounded-xl text-orange-500 text-sm font-bold hover:bg-orange-500/10 transition-colors"
                 >
                   Ver Calendário
                 </button>
                )}
              </div>
            </div>

            {/* Zona de Perigo / Logout */}
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl py-3.5 font-bold text-sm transition-colors"
              >
                <LogOut size={18} />
                SAIR DA CONTA
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
    </>
  );
}
