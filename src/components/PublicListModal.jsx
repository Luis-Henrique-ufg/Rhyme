import { Users, Check, X } from 'lucide-react';

/**
 * PublicListModal - Displays passenger checklist for a trip with attendance status and actions.
 */
export default function PublicListModal({
  isOpen,
  onClose,
  list = [],
  title = 'Lista de Passageiros',
  emptyMessage = 'Ninguém na lista ainda.',
  onStudentStatus
}) {
  if (!isOpen) return null;

  const items = Array.isArray(list) ? list : Object.values(list || {});

  const sortedList = [...items].sort((a, b) => {
    const statusOrder = { 'aguardando': 0, 'liberado': 0, 'embarcado': 1, 'cancelado': 2 };
    const orderA = statusOrder[a.status] ?? 0;
    const orderB = statusOrder[b.status] ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return (a.studentName || '').localeCompare(b.studentName || '');
  });

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative electric-card bg-card w-full max-w-md rounded-3xl border border-subtle shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-subtle bg-gradient-to-b from-primary/10 to-transparent z-10 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-display font-bold text-heading flex items-center gap-2">
            <Users size={20} className="text-primary" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-caption hover:text-heading p-2 rounded-full hover-bg-subtle transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Passenger List */}
        <div className="p-4 overflow-y-auto flex-1 z-10 space-y-3 custom-scrollbar">
          {sortedList.length === 0 ? (
            <p className="text-caption text-center py-8">{emptyMessage}</p>
          ) : (
            sortedList.map((att, idx) => {
              const isEmbarcado = att.status === 'embarcado';
              const isCancelado = att.status === 'cancelado';

              let bgColor = 'bg-subtle border border-subtle hover-bg-subtle';
              let avatarBg = 'bg-gradient-to-br from-orange-500 to-yellow-500 text-black';
              let nameColor = 'text-heading';

              if (isEmbarcado) {
                bgColor = 'bg-primary/10 border-primary/30';
                avatarBg = 'bg-primary text-black';
                nameColor = 'text-primary line-through opacity-70';
              } else if (isCancelado) {
                bgColor = 'bg-subtle border border-subtle';
                avatarBg = 'bg-subtle text-caption';
                nameColor = 'text-caption line-through opacity-70';
              }

              let tripTypeLabel = '';
              if (att.tripType === 'ida_volta') tripTypeLabel = 'Ida e Volta';
              else if (att.tripType === 'ida') tripTypeLabel = 'Só Ida';
              else if (att.tripType === 'volta') tripTypeLabel = 'Só Volta';

              return (
                <div key={att.studentId || att.id || idx} className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${bgColor}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {att.photoURL ? (
                      <img src={att.photoURL} alt={att.studentName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-subtle" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${avatarBg}`}>
                        {(att.studentName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate flex items-center gap-1.5 ${nameColor}`}>
                        <span className="truncate">{att.studentName || 'Aluno'}</span>
                        {tripTypeLabel && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-subtle border border-subtle uppercase tracking-wider font-bold">
                            {tripTypeLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-caption mt-1">{att.faculty || 'Outra'} · {att.status}</p>
                    </div>
                  </div>

                  {onStudentStatus && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onStudentStatus(att.studentId, att.status, 'cancelado')}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                          isCancelado ? 'bg-subtle text-caption border border-subtle' : 'bg-subtle text-body border border-subtle hover:text-heading'
                        }`}
                        title={isCancelado ? 'Desfazer ausência' : 'Marcar como não vai'}
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => onStudentStatus(att.studentId, att.status, 'embarcado')}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                          isEmbarcado ? 'bg-primary text-black border border-primary hover:bg-primary-hover' : 'bg-subtle text-body border border-subtle hover:bg-primary hover:text-black hover:border-primary'
                        }`}
                        title={isEmbarcado ? 'Desfazer embarque' : 'Marcar como embarcado'}
                      >
                        <Check size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
