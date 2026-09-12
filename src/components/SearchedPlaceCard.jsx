import { MapPin, Navigation, Footprints, BellRing, X } from 'lucide-react';

export default function SearchedPlaceCard({
  place,
  onClose,
  onStartCampusMode,
  onSetAsDropOff,
  onFlyTo
}) {
  if (!place) return null;

  const isFaculty = place.category?.toLowerCase().includes('universidade') ||
                    place.category?.toLowerCase().includes('faculdade') ||
                    place.category?.toLowerCase().includes('instituto') ||
                    place.category?.toLowerCase().includes('colégio');

  return (
    <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[1500] animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-surface-elevated/95 backdrop-blur-xl border border-subtle rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                {place.category || 'Local Selecionado'}
              </span>
              <h4 className="text-sm font-bold text-heading truncate">{place.name}</h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-caption hover:text-heading hover:bg-subtle transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-1">
          {isFaculty && (
            <button
              type="button"
              onClick={() => {
                onStartCampusMode?.(place);
                onClose?.();
              }}
              className="flex-1 py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Footprints size={14} strokeWidth={2.5} />
              Modo Campus
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSetAsDropOff?.(place);
              onClose?.();
            }}
            className="flex-1 py-2.5 px-3 bg-subtle hover-bg-subtle text-heading border border-subtle font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Usar como ponto para o alarme de descida"
          >
            <BellRing size={14} className="text-orange-400" />
            Parada na Volta
          </button>
        </div>
      </div>
    </div>
  );
}
