import { useState } from 'react';
import { Bell, BellRing, MapPin, Volume2, X, Check, Navigation, ShieldCheck } from 'lucide-react';
import { startWakeUpAlarmSound, stopWakeUpAlarmSound } from '../utils/audioEffects';

/**
 * WakeUpSettingsModal — Permite configurar o alarme de descida:
 * - Ativar/Desativar
 * - Raio de proximidade (500m, 1km, 2km)
 * - Ponto de parada no mapa
 * - Testar o som do alarme
 */
export default function WakeUpSettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onChangeStopLocation
}) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [distance, setDistance] = useState(settings?.distance ?? 1000);
  const [isTestingSound, setIsTestingSound] = useState(false);

  if (!isOpen) return null;

  const handleTestSound = () => {
    if (isTestingSound) {
      stopWakeUpAlarmSound();
      setIsTestingSound(false);
    } else {
      startWakeUpAlarmSound();
      setIsTestingSound(true);
      setTimeout(() => {
        stopWakeUpAlarmSound();
        setIsTestingSound(false);
      }, 3500);
    }
  };

  const handleSave = () => {
    stopWakeUpAlarmSound();
    onSaveSettings?.({
      enabled,
      distance
    });
    onClose?.();
  };

  const stopCoord = settings?.stopLocation;

  return (
    <div className="fixed inset-0 z-[4500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-card border border-subtle rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
              <BellRing size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading">Alerta de Descida</h3>
              <p className="text-xs text-caption">Não passe do ponto na volta para casa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopWakeUpAlarmSound();
              onClose?.();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-caption hover:text-heading hover-bg-subtle transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggle principal */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-subtle border border-subtle">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-subtle text-caption'}`}>
              <Bell size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-heading">Despertador Ativo</p>
              <p className="text-xs text-caption">Tocar alarme alto quando a van se aproximar</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>

        {/* Seletor de Distância */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-heading uppercase tracking-wider">
            Distância para disparar o alarme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 500, label: '500 metros', sub: '~1-2 min' },
              { val: 1000, label: '1 km', sub: '~3-4 min' },
              { val: 2000, label: '2 km', sub: '~6-8 min' }
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setDistance(item.val)}
                className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  distance === item.val
                    ? 'bg-orange-500/15 border-orange-500 text-orange-400 font-bold shadow-sm'
                    : 'bg-subtle border-subtle text-body hover:text-heading hover-bg-subtle'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-caption">{item.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Localização da Parada */}
        <div className="p-3.5 rounded-2xl bg-subtle border border-subtle flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-heading">
              <MapPin size={15} className="text-orange-500" />
              <span>Seu Ponto de Descida</span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopWakeUpAlarmSound();
                onChangeStopLocation?.();
              }}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Mudar no mapa
            </button>
          </div>
          <p className="text-xs text-caption">
            {stopCoord
              ? `Coordenadas: ${stopCoord.lat.toFixed(4)}, ${stopCoord.lng.toFixed(4)}`
              : 'Nenhum ponto marcado. Usando sua cidade/rota padrão.'}
          </p>
        </div>

        {/* Botão de teste de áudio */}
        <button
          type="button"
          onClick={handleTestSound}
          className="w-full py-2.5 px-4 bg-subtle hover-bg-subtle border border-subtle rounded-xl text-xs font-bold text-body hover:text-heading flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Volume2 size={16} className={isTestingSound ? 'text-orange-500 animate-pulse' : ''} />
          {isTestingSound ? 'Parar teste de som' : 'Testar som do despertador'}
        </button>

        {/* Ação de Salvar */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 px-5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-black font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={18} strokeWidth={3} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
