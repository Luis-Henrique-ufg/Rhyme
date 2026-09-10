// Sistema de Som Sintético (Web Audio API)
// Não precisa de arquivos .mp3. Gera beeps e chimes cristalinos matematicamente.

const playTone = (frequency, type, duration, volume = 0.5) => {
  // Verifica se o navegador suporta
  if (!window.AudioContext && !window.webkitAudioContext) return;
  
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  // Envelope de Som (Fade out suave para não estalar)
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

export const playSuccessSound = () => {
  // Som de Sucesso Rápido (Driver clicando em Iniciar)
  // Duas notas subindo
  playTone(440, 'sine', 0.1, 0.3); // A4
  setTimeout(() => playTone(880, 'sine', 0.3, 0.3), 100); // A5
};

export const playNotificationSound = () => {
  // Som de Chamada/Chegada (Alerta sonoro para o Aluno)
  // Notas de Sino/Atenção
  playTone(523.25, 'triangle', 0.2, 0.5); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.4, 0.5), 200); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.6, 0.5), 400); // G5
};

export const playBoardingAlarmSound = () => {
  // Alarme de Chamada de Embarque — 4 pulsos de atenção urgentes
  // Mais intenso e insistente que playNotificationSound para não ser ignorado
  playTone(880,  'square', 0.12, 0.45);  // A5 — início
  setTimeout(() => playTone(784,  'square', 0.12, 0.3), 180);   // G5
  setTimeout(() => playTone(880,  'square', 0.12, 0.45), 360);  // A5 — repetição
  setTimeout(() => playTone(1047, 'square', 0.12, 0.55), 560);  // C6 — pico
  // Segunda sequência após pausa
  setTimeout(() => playTone(880,  'square', 0.08, 0.35), 900);
  setTimeout(() => playTone(1047, 'square', 0.08, 0.55), 1080);
};

