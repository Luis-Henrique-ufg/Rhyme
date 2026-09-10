import { useState, useEffect } from 'react';
import { X, Bell, BellOff, Plus, Trash2, Shield, Bus, AlertCircle, AlertTriangle, Info, Send, Check } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCustomAlert } from '../contexts/AlertContext';

export default function AnnouncementsModal({ isOpen, onClose, userProfile, currentUserId }) {
  const { showAlert } = useCustomAlert();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const canPublish = userProfile?.role === 'admin' || userProfile?.role === 'driver';
  const defaultRoute = userProfile?.role === 'admin' ? 'Todas' : (userProfile?.route || 'Todas');
  const [targetRoute, setTargetRoute] = useState(defaultRoute);
  const [priority, setPriority] = useState('info'); // 'info' | 'warning' | 'urgent'
  const [message, setMessage] = useState('');

  // Sincronização em tempo real dos comunicados
  useEffect(() => {
    if (!isOpen) return;

    const q = query(collection(db, 'announcements'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Ordena por createdAt desc no cliente para evitar obrigatoriedade de índice composto no Firestore
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      setAnnouncements(docs);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar comunicados:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtragem de comunicados de acordo com o perfil do usuário
  const filteredAnnouncements = announcements.filter(item => {
    if (userProfile?.role === 'admin') return true; // Admin vê tudo
    if (item.route === 'Todas' || !item.route) return true;
    return item.route === userProfile?.route;
  });

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showAlert('Digite a mensagem do comunicado.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Regra de discrição: se for admin, publica SEMPRE como "Rhyme" (nunca nome pessoal)
      const authorDisplayName = userProfile?.role === 'admin' 
        ? 'Rhyme' 
        : (userProfile?.name || `Motorista ${userProfile?.route || ''}`);

      await addDoc(collection(db, 'announcements'), {
        message: message.trim(),
        priority,
        route: targetRoute,
        authorName: authorDisplayName,
        authorRole: userProfile?.role || 'driver',
        authorId: currentUserId,
        createdAt: serverTimestamp(),
        active: true
      });

      showAlert('Comunicado publicado com sucesso!');
      setMessage('');
      setPriority('info');
      setIsComposing(false);
    } catch (err) {
      console.error('Erro ao publicar comunicado:', err);
      showAlert('Não foi possível publicar o comunicado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este comunicado?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      showAlert('Comunicado removido.');
    } catch (err) {
      console.error('Erro ao excluir comunicado:', err);
      showAlert('Erro ao remover comunicado.');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'Agora mesmo';
    const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date());
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Hoje às ${timeStr}`;
    }
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${timeStr}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg electric-card bg-card rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-5 border-b border-subtle bg-surface/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-heading tracking-tight leading-tight">Mural de Avisos</h2>
              <p className="text-xs text-caption">Comunicados oficiais e avisos das rotas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-subtle hover-bg-subtle text-caption hover:text-heading flex items-center justify-center transition-colors border border-subtle"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-Header com Botão de Novo Comunicado para Admin / Motorista */}
        {canPublish && (
          <div className="px-5 py-3 border-b border-subtle bg-subtle/40 flex items-center justify-between shrink-0">
            <div className="text-xs text-body font-medium flex items-center gap-1.5">
              {userProfile?.role === 'admin' ? (
                <>
                  <Shield size={14} className="text-emerald-500" />
                  <span>Publicando como <strong className="text-heading">Rhyme (Oficial)</strong></span>
                </>
              ) : (
                <>
                  <Bus size={14} className="text-orange-500" />
                  <span>Publicando como <strong className="text-heading">Motorista</strong></span>
                </>
              )}
            </div>

            <button
              onClick={() => setIsComposing(!isComposing)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isComposing 
                  ? 'bg-subtle text-body hover:text-heading border border-subtle' 
                  : 'btn-primary'
              }`}
            >
              {isComposing ? (
                <>Cancelar</>
              ) : (
                <>
                  <Plus size={14} /> Novo Aviso
                </>
              )}
            </button>
          </div>
        )}

        {/* Formulário de Criação (Composer) */}
        {isComposing && canPublish && (
          <form onSubmit={handlePublish} className="p-5 border-b border-subtle bg-card-elevated space-y-3.5 shrink-0 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Seletor de Rota */}
              <div>
                <label className="block text-[11px] font-bold text-caption uppercase tracking-wider mb-1">
                  Destinatários
                </label>
                {userProfile?.role === 'admin' ? (
                  <select
                    value={targetRoute}
                    onChange={(e) => setTargetRoute(e.target.value)}
                    className="w-full bg-subtle border border-subtle rounded-xl px-3 py-2 text-heading text-xs focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="Todas">Todas as rotas (Geral)</option>
                    <option value="Professor Jamil">Rota: Professor Jamil</option>
                    <option value="Hidrolândia">Rota: Hidrolândia</option>
                    <option value="Cromínia">Rota: Cromínia</option>
                  </select>
                ) : (
                  <div className="w-full bg-subtle border border-subtle rounded-xl px-3 py-2 text-heading text-xs">
                    Sua Rota: <strong>{userProfile?.route || 'Geral'}</strong>
                  </div>
                )}
              </div>

              {/* Seletor de Prioridade */}
              <div>
                <label className="block text-[11px] font-bold text-caption uppercase tracking-wider mb-1">
                  Importância
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('info')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      priority === 'info'
                        ? 'bg-primary/15 text-primary border-primary'
                        : 'bg-subtle text-caption border-transparent hover:text-heading'
                    }`}
                  >
                    Aviso
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('warning')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      priority === 'warning'
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500'
                        : 'bg-subtle text-caption border-transparent hover:text-heading'
                    }`}
                  >
                    Atenção
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      priority === 'urgent'
                        ? 'bg-danger/15 text-danger border-danger'
                        : 'bg-subtle text-caption border-transparent hover:text-heading'
                    }`}
                  >
                    Urgente
                  </button>
                </div>
              </div>
            </div>

            {/* Texto da Mensagem */}
            <div>
              <label className="block text-[11px] font-bold text-caption uppercase tracking-wider mb-1">
                Mensagem do Comunicado
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={400}
                rows={3}
                placeholder="Ex: Cuidado ao fechar a porta da van, não aplique força desnecessária..."
                className="w-full bg-subtle border border-subtle rounded-xl p-3 text-heading text-sm placeholder:text-caption focus:outline-none focus:border-primary transition-colors resize-none"
                required
              />
              <div className="flex justify-between items-center text-[10px] text-caption mt-1">
                <span>Dica: Seja claro e direto.</span>
                <span>{message.length} / 400</span>
              </div>
            </div>

            {/* Botão de Enviar */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-caption hover:text-heading transition-colors"
              >
                Descartar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Publicando...</>
                ) : (
                  <>
                    <Send size={13} /> Publicar Comunicado
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Comunicados */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-caption gap-3">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Carregando comunicados...</span>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-subtle border border-subtle flex items-center justify-center text-caption mb-3 opacity-60">
                <BellOff size={26} />
              </div>
              <h3 className="text-sm font-bold text-heading mb-1">Nenhum aviso no momento</h3>
              <p className="text-xs text-caption max-w-xs leading-relaxed">
                Tudo tranquilo por aqui! Quando houver comunicados sobre o veículo ou trajetos, eles aparecerão neste mural.
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const isAdminAuthor = item.authorRole === 'admin';
              const canDelete = userProfile?.role === 'admin' || item.authorId === currentUserId;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    item.priority === 'urgent'
                      ? 'bg-danger/5 border-danger/30'
                      : item.priority === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-subtle/80 border-subtle'
                  }`}
                >
                  {/* Faixa lateral colorida de prioridade */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    item.priority === 'urgent'
                      ? 'bg-danger'
                      : item.priority === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  }`} />

                  {/* Topo do Card */}
                  <div className="flex items-center justify-between gap-2 mb-2 pl-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Autor Oficial */}
                      {isAdminAuthor ? (
                        <div className="flex items-center gap-1.5">
                          <img src="/Logo.webp" alt="Rhyme" className="w-4 h-4 object-contain" />
                          <span className="text-xs font-bold text-heading">Rhyme</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/20 tracking-wider">
                            OFICIAL
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Bus size={13} className="text-orange-500 shrink-0" />
                          <span className="text-xs font-bold text-heading">
                            {item.authorName || 'Motorista'}
                          </span>
                        </div>
                      )}

                      {/* Tag de Destino */}
                      <span className="text-[10px] font-semibold text-caption bg-card-elevated border border-subtle px-2 py-0.5 rounded-md">
                        {item.route === 'Todas' ? 'Todas as rotas' : `Rota ${item.route}`}
                      </span>

                      {/* Chip de Prioridade */}
                      {item.priority === 'urgent' && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-danger/15 text-danger border border-danger/30 tracking-wider flex items-center gap-1">
                          <AlertTriangle size={10} /> URGENTE
                        </span>
                      )}
                      {item.priority === 'warning' && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 tracking-wider flex items-center gap-1">
                          <AlertCircle size={10} /> ATENÇÃO
                        </span>
                      )}
                    </div>

                    {/* Botão de Exclusão (Admin ou Autor) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-caption hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors"
                        title="Excluir comunicado"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Mensagem */}
                  <p className="text-sm text-heading leading-relaxed pl-2 whitespace-pre-wrap font-normal">
                    {item.message}
                  </p>

                  {/* Data / Hora */}
                  <div className="mt-2.5 pl-2 flex items-center justify-between text-[10px] text-caption">
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
