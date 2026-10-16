/**
 * @file SettingsModal.jsx
 * @module components/SettingsModal
 * @description Modal completo de configurações do usuário: perfil, foto (ImgBB),
 * rota, faculdade, tema/som, histórico de viagens e logout.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  X,
  Camera,
  Sparkles,
  User,
  History,
  Shield,
  LogOut,
  Check,
  MapPin,
  Bus,
} from 'lucide-react';
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { normalizeRoute } from '../utils/tripManager';
import { migrateStudentAttendance } from '../utils/tripManager';
import { playSuccessSound, playPopSound } from '../utils/audioEffects';
import ThemeToggle from './ThemeToggle';
import SoundToggle from './SoundToggle';
import DropdownSelect from './DropdownSelect';

export default function SettingsModal({
  isOpen,
  onClose,
  userProfile,
  onOpenCalendar,
  onOpenFacultyPicker,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useCustomAlert();

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

  useEffect(() => {
    if (userProfile?.name) setNewName(userProfile.name);
    setNewFaculty(userProfile?.faculty || '');
    setNewRoute(userProfile?.route || 'Professor Jamil');
  }, [userProfile?.name, userProfile?.faculty, userProfile?.route]);

  useEffect(() => {
    if (!isOpen || !user || !userProfile) return;

    async function fetchHistory() {
      setLoadingHistory(true);
      try {
        if (userProfile.role === 'student') {
          const q = query(collection(db, 'attendance'), where('studentId', '==', user.uid));
          const snap = await getDocs(q);
          let history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          history.sort(
            (a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
          );
          setFullTripHistory(history);
          setTripHistory(history.slice(0, 5));
        } else if (userProfile.role === 'driver') {
          const q = query(collection(db, 'trips'), where('driverId', '==', user.uid));
          const snap = await getDocs(q);
          let history = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          history.sort(
            (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
          );
          setFullTripHistory(history);
          setTripHistory(history.slice(0, 5));
        }
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [isOpen, user, userProfile]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Falha ao deslogar', err);
    }
  };

  const handleUpdateProfile = async () => {
    const isNameChanged = newName.trim() !== userProfile?.name;
    const isRouteChanged = newRoute.trim() !== userProfile?.route;
    const isFacultyChanged =
      userProfile?.role === 'student' && newFaculty.trim() !== userProfile?.faculty;

    if (!isNameChanged && !isRouteChanged && !isFacultyChanged) return;
    if (!newName.trim()) {
      showAlert('Preencha o nome corretamente.');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = { name: newName.trim(), route: newRoute.trim() };
      if (userProfile?.role === 'student') {
        updateData.faculty = newFaculty.trim();
      }

      await updateDoc(doc(db, 'students', userProfile.uid), updateData);

      if (userProfile?.role === 'student') {
        if (isRouteChanged) {
          await migrateStudentAttendance(userProfile.uid, userProfile.route, newRoute.trim(), {
            name: newName.trim(),
            faculty: newFaculty.trim(),
            photoURL: userProfile.photoURL || null,
          });
        } else if (isNameChanged || isFacultyChanged) {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const dateString = `${yyyy}-${mm}-${dd}`;
          const currentTripId = `trip_${normalizeRoute(userProfile.route)}_${dateString}`;
          const attRef = doc(db, 'attendance', `${currentTripId}_${userProfile.uid}`);
          await setDoc(
            attRef,
            {
              studentName: newName.trim(),
              faculty: newFaculty.trim(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      setSaveSuccess(true);
      playSuccessSound();
      setTimeout(() => setSaveSuccess(false), 3000);
      showAlert('Perfil e rota atualizados com sucesso!');
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

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
        {
          method: 'POST',
          body: formData,
        }
      );
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
          onClose();
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
              onClose();
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
                <img
                  src={userProfile.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover shadow-inner border-4 border-card"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-4xl shadow-inner border-4 border-card">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                className={`absolute bottom-0 right-0 w-8 h-8 bg-subtle hover-bg-subtle border-2 border-card rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isUploadingPhoto ? 'text-caption cursor-not-allowed' : 'text-primary'
                }`}
              >
                {isUploadingPhoto ? (
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={14} />
                )}
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
                    disabled={
                      isSaving ||
                      (newName.trim() === userProfile?.name &&
                        newRoute.trim() === userProfile?.route &&
                        (userProfile?.role === 'driver' ||
                          newFaculty.trim() === userProfile?.faculty))
                    }
                    className="shrink-0 bg-primary hover:bg-primary-hover disabled:bg-subtle disabled:text-caption text-black px-4 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer"
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
                  options={['Professor Jamil', 'Cromínia', 'Hidrolândia'].map((f) => ({
                    label: f,
                    value: f,
                  }))}
                />
              </div>

              {userProfile?.role === 'student' && (
                <>
                  <div className="space-y-1.5 mt-4">
                    <label className="text-xs font-medium text-body ml-1">Faculdade</label>
                    <DropdownSelect
                      value={newFaculty}
                      onChange={(val) => setNewFaculty(val)}
                      options={[
                        'UFG',
                        'UFG - Campus Colemar',
                        'PUC',
                        'IFG',
                        'UNIP',
                        'FASAM',
                        'Estácio',
                        'Unicamps',
                        'Eseffego',
                        'Colégio Vitória',
                        'Outra',
                      ].map((f) => ({ label: f, value: f }))}
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onOpenFacultyPicker}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 bg-primary/5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <MapPin size={15} />
                      {userProfile?.facultyLocation
                        ? 'Ajustar localização da faculdade'
                        : 'Marcar localização da faculdade'}
                    </button>
                    {userProfile?.facultyLocation && (
                      <p className="text-[10px] text-caption flex items-center justify-center gap-1 text-center mt-1.5">
                        <Check size={12} className="text-emerald-500 stroke-[3]" /> Localização
                        personalizada ativa
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
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : tripHistory.length > 0 ? (
                <div className="space-y-3">
                  {tripHistory.map((item, idx) => {
                    const date = item.updatedAt
                      ? item.updatedAt.toDate()
                      : item.createdAt
                        ? item.createdAt.toDate()
                        : new Date();
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-subtle pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-heading">
                            {date.toLocaleDateString('pt-BR')}{' '}
                            {date.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-xs text-caption mt-0.5">
                            {userProfile?.role === 'student'
                              ? item.status === 'confirmado'
                                ? 'Embarcou'
                                : item.status === 'cancelado'
                                  ? 'Não foi'
                                  : 'Aguardando'
                              : `Status: ${item.status === 'finished' ? 'Finalizada' : 'Em andamento'}`}
                          </span>
                        </div>
                        {userProfile?.role === 'student' && item.status === 'confirmado' && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                            <Check size={12} className="stroke-[3]" /> Confirmado
                          </span>
                        )}
                        {userProfile?.role === 'student' && item.status === 'cancelado' && (
                          <span className="text-[10px] font-bold text-caption bg-subtle px-2 py-1 rounded flex items-center gap-1">
                            <X size={12} className="stroke-[3]" /> Cancelado
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <History size={32} className="text-caption mx-auto mb-3 opacity-50" />
                  <p className="text-caption text-sm font-medium">
                    Nenhuma viagem registrada ainda.
                  </p>
                </div>
              )}

              {fullTripHistory.length > 0 && (
                <button
                  onClick={() => onOpenCalendar(fullTripHistory)}
                  className="w-full mt-4 py-2 border border-primary/30 rounded-xl text-primary text-sm font-bold hover:bg-primary/10 transition-colors cursor-pointer"
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
                <span className="text-[10px] text-caption font-semibold uppercase tracking-wider">
                  Acesso Total
                </span>
              </div>
              <p className="text-xs text-body leading-relaxed">
                Você possui permissões de administrador. Pode inspecionar e operar qualquer rota,
                além de alternar livremente entre as telas.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/aluno/mapa');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    location.pathname.startsWith('/aluno')
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-subtle text-body hover:text-heading border border-subtle'
                  }`}
                >
                  <User size={13} /> Visão Aluno
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/motorista/dashboard');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    location.pathname.startsWith('/motorista')
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-subtle text-body hover:text-heading border border-subtle'
                  }`}
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
              className="w-full flex items-center justify-center gap-2 bg-danger-bg hover:brightness-110 text-danger border border-danger-border rounded-xl py-3.5 font-bold text-sm transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
