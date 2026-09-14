import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, School, Navigation, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { playSearchSound, playTapSound } from '../utils/audioEffects';

/**
 * Base de dados local instantânea de faculdades e pontos estratégicos em Goiânia
 */
export const LOCAL_POI_DATABASE = [
  { name: 'UFG - Campus Samambaia (Campus II)', category: 'Universidade', keywords: 'ufg samambaia campus 2 reitoria bc inf ru', coords: [-16.603568, -49.265574] },
  { name: 'UFG - Campus Colemar (Praça Universitária)', category: 'Universidade', keywords: 'ufg colemar natal silva praca universitaria direito odonto', coords: [-16.676109, -49.245160] },
  { name: 'PUC Goiás - Área 1 (Praça Universitária)', category: 'Universidade', keywords: 'puc goias area 1 praca universitaria', coords: [-16.674751, -49.242090] },
  { name: 'PUC Goiás - Área 2 (Engenharias / Arquitetura)', category: 'Universidade', keywords: 'puc goias area 2 engenharia arquitetura', coords: [-16.676500, -49.243500] },
  { name: 'PUC Goiás - Área 3 (Saúde / Medicina)', category: 'Universidade', keywords: 'puc goias area 3 saude medicina enfermagem', coords: [-16.672000, -49.241000] },
  { name: 'PUC Goiás - Área 4 (Direito / Relações Internacionais)', category: 'Universidade', keywords: 'puc goias area 4 direito ri', coords: [-16.673200, -49.245000] },
  { name: 'PUC Goiás - Área 5 (Jardim Goiás / Flamboyant)', category: 'Universidade', keywords: 'puc goias area 5 jardim goias flamboyant', coords: [-16.705000, -49.235000] },
  { name: 'IFG - Instituto Federal de Goiás (Centro)', category: 'Instituto', keywords: 'ifg centro rua 75 federal goiania', coords: [-16.665844, -49.254845] },
  { name: 'UNIP - Universidade Paulista (BR-153)', category: 'Universidade', keywords: 'unip br 153 alto da gloria', coords: [-16.719133, -49.237381] },
  { name: 'FASAM - Faculdade Sul-Americana (BR-153)', category: 'Faculdade', keywords: 'fasam br 153 jardim goias', coords: [-16.722386, -49.236576] },
  { name: 'Estácio Goiás (Centro / Goiás)', category: 'Faculdade', keywords: 'estacio centro rua 67 goias', coords: [-16.661400, -49.261822] },
  { name: 'Unicamps (Campinas)', category: 'Faculdade', keywords: 'unicamps campinas faculdade', coords: [-16.675166, -49.284300] },
  { name: 'Eseffego - UEG (Educação Física)', category: 'Faculdade', keywords: 'eseffego ueg educacao fisica leste universitario', coords: [-16.667398, -49.242543] },
  { name: 'Colégio Vitória (Centro)', category: 'Colégio', keywords: 'colegio vitoria centro', coords: [-16.672587, -49.252661] },
  { name: 'Terminal Praça da Bíblia', category: 'Transporte', keywords: 'terminal praca da biblia universitário eixo anhanguera', coords: [-16.672000, -49.238000] },
  { name: 'Praça Universitária', category: 'Ponto de Encontro', keywords: 'praca universitaria coreto palacio da cultura', coords: [-16.675707, -49.245475] },
  { name: 'Shopping Flamboyant', category: 'Shopping', keywords: 'shopping flamboyant jardim goias', coords: [-16.712000, -49.234000] }
];

export default function MapSearchBar({
  onSelectPlace,
  userCoords
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Busca instantânea local (Zero Latência)
  const localResults = useMemo(() => {
    if (!query.trim()) return LOCAL_POI_DATABASE.slice(0, 6);
    const cleanQ = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return LOCAL_POI_DATABASE.filter(item => {
      const matchName = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(cleanQ);
      const matchKeywords = item.keywords.toLowerCase().includes(cleanQ);
      return matchName || matchKeywords;
    });
  }, [query]);

  // Busca online (Nominatim) com debounce quando digita 3+ letras
  useEffect(() => {
    if (query.trim().length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        // Bias na região metropolitana de Goiânia / Goiás
        const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Goiânia')}&limit=5&addressdetails=1`;
        const res = await fetch(endpoint, {
          headers: { 'Accept-Language': 'pt-BR,pt;q=0.9', 'User-Agent': 'RhymeApp/1.0' }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data || [])
            .map(item => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon ?? item.lng);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

              const nameParts = (item.display_name || '').split(',');
              const primaryName = nameParts[0]?.trim() || 'Local';
              const secondaryDesc = nameParts.slice(1, 3).map(p => p.trim()).filter(Boolean).join(', ');

              return {
                name: primaryName,
                category: secondaryDesc || item.type || item.class || 'Endereço',
                coords: [lat, lon],
                isOnline: true
              };
            })
            .filter(Boolean);

          setOnlineResults(mapped);
        }
      } catch (err) {
        console.warn('Erro na busca online Nominatim:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place) => {
    playTapSound();
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace?.(place);
  };

  const handleClear = () => {
    setQuery('');
    setOnlineResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-full sm:max-w-md z-[1600]">
      {/* Campo de Busca Principal */}
      <div 
        className="relative flex items-center w-full bg-surface-elevated/95 backdrop-blur-md border border-subtle focus-within:border-orange-500 rounded-full shadow-xl transition-all overflow-hidden"
        style={{ borderRadius: '9999px' }}
      >
        <div className="pl-4 pr-2 text-caption shrink-0">
          <Search size={18} className="text-orange-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => {
            playSearchSound();
            setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Buscar faculdade, bloco, local..."
          className="w-full min-w-0 py-3 pr-10 bg-transparent !bg-transparent !border-0 !shadow-none !outline-none text-xs sm:text-sm text-heading placeholder:text-caption font-medium"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            outline: 'none',
            boxShadow: 'none',
            borderRadius: '9999px'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-caption hover:text-heading hover:bg-subtle transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Dropdown de Sugestões e Resultados */}
      {isOpen && (
        <div className="mt-2 w-full bg-surface-elevated/98 backdrop-blur-xl border border-subtle rounded-3xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150 divide-y divide-subtle/40">
          {/* Resultados Locais Rápidos */}
          {localResults.length > 0 && (
            <div className="p-1.5">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-caption flex items-center gap-1.5">
                <Sparkles size={11} className="text-orange-500" />
                <span>Faculdades e Pontos Rhyme</span>
              </div>
              {localResults.map((place, idx) => (
                <button
                  key={`local-${idx}`}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3 py-2 rounded-xl hover-bg-subtle flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                      <School size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-heading truncate group-hover:text-orange-400 transition-colors">
                        {place.name}
                      </p>
                      <p className="text-[10px] text-caption">{place.category}</p>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-caption group-hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Resultados de Endereço / Online */}
          {query.trim().length >= 3 && (
            <div className="p-1.5">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-caption flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-sky-400" />
                  <span>Endereços e Lugares</span>
                </span>
                {isSearchingOnline && <Loader2 size={11} className="animate-spin text-orange-500" />}
              </div>
              {onlineResults.map((place, idx) => (
                <button
                  key={`online-${idx}`}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3 py-2 rounded-xl hover-bg-subtle flex items-center justify-between gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-heading truncate group-hover:text-sky-400 transition-colors">
                        {place.name}
                      </p>
                      <p className="text-[10px] text-caption">{place.category}</p>
                    </div>
                  </div>
                  <ArrowRight size={13} className="text-caption group-hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </button>
              ))}
              {!isSearchingOnline && onlineResults.length === 0 && localResults.length === 0 && (
                <div className="p-4 text-center text-xs text-caption">
                  Nenhum local encontrado para "{query}".
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
