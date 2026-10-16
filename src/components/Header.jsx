/**
 * @file Header.jsx
 * @module components/Header
 * @description Barra de navegação superior (Navbar) desacoplada, contendo perfil do usuário,
 * alternador de visão de administrador, atalho PWA, mural de avisos e acionador de configurações.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, Download, User, Bus } from 'lucide-react';
import { doc, updateDoc, collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../contexts/AlertContext';
import { playPopSound } from '../utils/audioEffects';
import { MOCK_FACULTIES } from '../services/geoService';
import LocationPickerMap from './LocationPickerMap';
import AnnouncementsModal from './AnnouncementsModal';
import TripCalendarModal from './TripCalendarModal';
import SettingsModal from './SettingsModal';

export default function Header({ userProfile }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useCustomAlert();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOSAndNotInstalled, setIsIOSAndNotInstalled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarHistory, setCalendarHistory] = useState([]);
  const [showFacultyPicker, setShowFacultyPicker] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  useEffect(() => {
    if (user?.photoURL && userProfile && !userProfile.photoURL && userProfile.uid) {
      updateDoc(doc(db, 'students', userProfile.uid), { photoURL: user.photoURL }).catch(
        console.error
      );
    }
  }, [user, userProfile]);

  // Listener de comunicados não lidos para o badge do sino
  useEffect(() => {
    const q = query(collection(db, 'announcements'), limit(25));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lastRead = parseInt(
          localStorage.getItem('rhyme_last_read_announcement_time') || '0',
          10
        );
        let count = 0;
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const isRelevant =
            userProfile?.role === 'admin' ||
            data.route === 'Todas' ||
            !data.route ||
            data.route === userProfile?.route;

          if (isRelevant) {
            const ts = data.createdAt?.toMillis
              ? data.createdAt.toMillis()
              : data.createdAt?.seconds
                ? data.createdAt.seconds * 1000
                : 0;
            if (ts > lastRead) {
              count += 1;
            }
          }
        });
        setUnreadAnnouncementsCount(count);
      },
      (err) => {
        console.warn('Erro ao escutar comunicados:', err);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.role, userProfile?.route]);

  const handleOpenAnnouncements = () => {
    playPopSound();
    setIsAnnouncementsOpen(true);
    setUnreadAnnouncementsCount(0);
    localStorage.setItem('rhyme_last_read_announcement_time', Date.now().toString());
  };

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
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
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
      showAlert(
        "Para instalar no iPhone: Toque no ícone de Compartilhar (quadrado com seta para cima) no Safari, e depois escolha 'Adicionar à Tela de Início'.\n\nNo Android: Toque nos três pontinhos do navegador e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'."
      );
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
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-full object-cover shadow-inner border border-subtle"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 text-black flex items-center justify-center font-bold text-lg shadow-inner">
                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-heading tracking-wide">
                      {userProfile.name}
                    </span>
                    {userProfile.role === 'admin' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 tracking-wider">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {userProfile.role === 'driver' || userProfile.role === 'admin'
                      ? `Rota: ${userProfile.route}`
                      : userProfile.faculty}
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
              title={
                location.pathname.startsWith('/motorista')
                  ? 'Mudar para Visão do Aluno'
                  : 'Mudar para Painel do Motorista'
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30 group shadow-sm active:scale-95 cursor-pointer"
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
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30 group shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          )}

          {/* Mural de Avisos / Comunicados */}
          <button
            onClick={handleOpenAnnouncements}
            title="Mural de Avisos"
            className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-subtle text-body hover:bg-primary/10 hover:text-primary transition-all border border-subtle hover:border-primary/30 group active:scale-95 cursor-pointer"
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
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-subtle text-body hover:bg-primary/10 hover:text-primary transition-all border border-subtle hover:border-primary/30 group cursor-pointer"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onOpenCalendar={(history) => {
          setCalendarHistory(history);
          setIsCalendarOpen(true);
          setIsSettingsOpen(false);
        }}
        onOpenFacultyPicker={() => {
          setShowFacultyPicker(true);
          setIsSettingsOpen(false);
        }}
      />

      {isCalendarOpen && (
        <TripCalendarModal
          history={calendarHistory}
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
              : MOCK_FACULTIES[userProfile.faculty] || MOCK_FACULTIES['Outra']
          }
          initialPin={userProfile.facultyLocation || null}
          onConfirm={async (loc) => {
            setShowFacultyPicker(false);
            if (!userProfile?.uid) return;
            try {
              await updateDoc(doc(db, 'students', userProfile.uid), { facultyLocation: loc });
              showAlert(
                loc
                  ? 'Localização da faculdade atualizada!'
                  : 'Localização restaurada para o padrão!'
              );
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
