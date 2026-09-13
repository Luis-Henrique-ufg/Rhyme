// Sistema de Som Sintético Completo (Web Audio API)
// Não precisa de arquivos .mp3 externos (0 KB de download, latência zero).
// Gera micro-interações táteis, beeps, chimes e alarmes matematicamente.

const SOUND_STORAGE_KEY = 'rhyme_sound_effects_enabled';

// Singleton do AudioContext para reaproveitamento e economia de recursos
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Se estiver suspenso pelas políticas do navegador, retoma no primeiro clique
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
};

/**
 * Consulta se os efeitos sonoros estão ativados pelo usuário
 */
export const isSoundEnabled = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
};

/**
 * Alterna e persiste a configuração de sons
 */
export const setSoundEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('rhyme-sound-toggle', { detail: enabled }));
};

/**
 * Dispara feedback háptico (microvibração) em dispositivos compatíveis (Mobile/PWA)
 */
export const triggerHaptic = (type = 'light') => {
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'light') navigator.vibrate(8);
    else if (type === 'medium') navigator.vibrate(18);
    else if (type === 'success') navigator.vibrate([10, 30, 15]);
    else if (type === 'error') navigator.vibrate([25, 40, 25]);
  } catch (e) {}
};

/**
 * Função básica para síntese de frequências puras
 */
const playTone = (frequency, type, duration, volume = 0.2) => {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope de fade out suave para não estalar na caixa de som
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {}
};

/**
 * Micro-som de Tap/Clique tátil sutil (25ms)
 * Ideal para botões secundários, chips de rota, abas
 */
export const playTapSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('light');

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.025);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch (e) {}
};

/**
 * Som de Toggle On/Off (interruptores)
 * Sobe o tom ao ligar, desce o tom ao desligar
 */
export const playToggleSound = (isOn = true) => {
  if (!isSoundEnabled()) return;
  triggerHaptic('light');

  if (isOn) {
    playTone(523.25, 'sine', 0.035, 0.14); // C5
    setTimeout(() => playTone(783.99, 'sine', 0.045, 0.14), 40); // G5
  } else {
    playTone(783.99, 'sine', 0.035, 0.14); // G5
    setTimeout(() => playTone(523.25, 'sine', 0.045, 0.14), 40); // C5
  }
};

/**
 * Som de Pop / Expansão suave
 * Ideal para abertura de bottom sheets, gavetas e modais
 */
export const playPopSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('light');

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {}
};

/**
 * Chime arejado ao focar na barra de pesquisa
 */
export const playSearchSound = () => {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    playTone(1046.5, 'triangle', 0.07, 0.08); // C6
    setTimeout(() => playTone(1318.51, 'sine', 0.09, 0.08), 35); // E6
  } catch (e) {}
};

/**
 * Som de Sucesso Rápido
 * Confirmação ao iniciar viagem, embarcar, salvar perfil ou publicar aviso
 */
export const playSuccessSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('success');

  playTone(440, 'sine', 0.09, 0.22); // A4
  setTimeout(() => playTone(880, 'sine', 0.22, 0.25), 90); // A5
};

/**
 * Som de Erro / Recusa tátil
 * Ideal para campos obrigatórios vazios ou recusa de ação
 */
export const playErrorSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('error');

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {}
};

/**
 * Som de Exclusão / Descarte suave
 * Ideal para remover avisos ou cancelar embarque
 */
export const playDeleteSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('medium');

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
};

/**
 * Som de Notificação / Alerta para o Aluno (Chegada de van)
 */
export const playNotificationSound = () => {
  if (!isSoundEnabled()) return;
  triggerHaptic('success');

  playTone(523.25, 'triangle', 0.15, 0.35); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.25, 0.35), 160); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.45, 0.35), 320); // G5
};

/**
 * Alarme de Chamada de Embarque — 4 pulsos de atenção urgentes
 */
export const playBoardingAlarmSound = () => {
  triggerHaptic('error');

  playTone(880, 'square', 0.12, 0.4);
  setTimeout(() => playTone(784, 'square', 0.12, 0.3), 180);
  setTimeout(() => playTone(880, 'square', 0.12, 0.4), 360);
  setTimeout(() => playTone(1047, 'square', 0.12, 0.5), 560);
  setTimeout(() => playTone(880, 'square', 0.08, 0.3), 900);
  setTimeout(() => playTone(1047, 'square', 0.08, 0.5), 1080);
};

let wakeUpInterval = null;

/**
 * Alarme contínuo para não passar do ponto
 */
export const startWakeUpAlarmSound = () => {
  if (wakeUpInterval) return;

  const playSequence = () => {
    triggerHaptic('error');
    playTone(987.77, 'square', 0.14, 0.55);
    setTimeout(() => playTone(1318.51, 'square', 0.14, 0.65), 150);
    setTimeout(() => playTone(987.77, 'square', 0.14, 0.55), 300);
    setTimeout(() => playTone(1318.51, 'square', 0.25, 0.75), 450);
  };

  playSequence();
  wakeUpInterval = setInterval(playSequence, 1200);
};

export const stopWakeUpAlarmSound = () => {
  if (wakeUpInterval) {
    clearInterval(wakeUpInterval);
    wakeUpInterval = null;
  }
};
