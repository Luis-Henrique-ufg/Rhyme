export default function Loader({ message = "Carregando..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        {/* Radar Animado (Ping expansivo) */}
        <div className="absolute inset-0 border-[3px] border-primary/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        
        {/* Anel do meio pulsante */}
        <div className="absolute w-16 h-16 border-4 border-primary/60 rounded-full animate-pulse"></div>
        
        {/* Centro brilhante (Posição/Pino) */}
        <div className="w-8 h-8 bg-primary rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>
      <p className="text-body font-medium tracking-wide animate-pulse text-lg">{message}</p>
    </div>
  );
}
