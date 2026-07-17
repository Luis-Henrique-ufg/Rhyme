import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

export default function TripCalendarModal({ history, onClose, userProfile }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const isStudent = userProfile.role === 'student';

  const historyMap = useMemo(() => {
    const map = {};
    history.forEach(item => {
      const date = item.updatedAt ? item.updatedAt.toDate() : (item.createdAt ? item.createdAt.toDate() : new Date());
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;
      if (!map[dateString]) {
        map[dateString] = item.status;
      }
    });
    return map;
  }, [history]);

  const streak = useMemo(() => {
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    let foundFirst = false;

    for (let i = 0; i < 365; i++) {
      const dayOfWeek = checkDate.getDay(); 
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;
      
      const status = historyMap[dateString];
      const isSuccess = isStudent ? status === 'confirmado' : (status === 'finished' || status === 'in_progress');

      if (isSuccess) {
        currentStreak++;
        foundFirst = true;
      } else if (!isWeekend) {
        if (i === 0 && !status) {
          // ignore today if no status yet
        } else {
          if (foundFirst) break; 
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return currentStreak;
  }, [historyMap, isStudent]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/40">
          <h2 className="text-white font-bold tracking-wide">Calendário de Viagens</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-full p-1.5">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-center justify-center gap-3 mb-6 bg-orange-500/10 border border-orange-500/20 py-3 rounded-xl">
            <Flame className={`w-6 h-6 ${streak > 2 ? 'text-orange-500' : 'text-zinc-500'}`} fill={streak > 2 ? "#f97316" : "none"} />
            <div>
              <p className="text-sm text-zinc-400 leading-tight">Sua Ofensiva</p>
              <p className="text-lg font-black text-white leading-tight">{streak} Dias <span className="text-xs text-orange-500 font-bold ml-1 uppercase">{streak > 5 ? '🔥 On Fire!' : ''}</span></p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={prevMonth} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-white font-bold tracking-wider uppercase text-sm">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-[10px] font-bold text-zinc-500 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-10"></div>;

              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = historyMap[dateString];
              const isToday = isCurrentMonth && day === today.getDate();

              let bgColor = 'bg-white/5';
              let borderColor = 'border-transparent';
              let textColor = 'text-zinc-300';

              if (status === 'confirmado' || status === 'finished' || status === 'in_progress') {
                bgColor = 'bg-orange-500/20';
                borderColor = 'border-orange-500/40';
                textColor = 'text-orange-500 font-bold';
              } else if (status === 'cancelado') {
                bgColor = 'bg-zinc-800/50';
                borderColor = 'border-zinc-700/50';
                textColor = 'text-zinc-500 line-through';
              } else if (isToday) {
                borderColor = 'border-orange-500/50';
                textColor = 'text-white font-bold';
              }

              return (
                <div 
                  key={day} 
                  className={`h-10 flex items-center justify-center rounded-lg border ${bgColor} ${borderColor} ${textColor} text-sm transition-all`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center gap-4 text-xs font-medium text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/40"></div>
              <span>Presente</span>
            </div>
            {isStudent && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-zinc-800/50 border border-zinc-700/50"></div>
                <span>Faltou</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
