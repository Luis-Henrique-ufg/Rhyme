import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ 
  message = "Ocorreu um erro inesperado.", 
  onRetry,
  fullScreen = true
}) {
  const containerClasses = fullScreen
    ? "min-h-[60vh] w-full flex flex-col items-center justify-center p-6 text-center"
    : "w-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-zinc-900/50 [html.light_&]:bg-red-50/80 border border-red-500/10";

  return (
    <div className={containerClasses}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 [html.light_&]:bg-red-100 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(239,68,68,0.15)]">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-zinc-100 [html.light_&]:text-stone-900 mb-2">Ops! Algo deu errado</h3>
      
      <p className="text-zinc-400 [html.light_&]:text-stone-600 max-w-sm mb-6 text-sm">
        {message}
      </p>

      {onRetry ? (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full transition-colors focus:ring-4 focus:ring-red-500/20 outline-none shadow-lg shadow-red-500/20"
        >
          <RefreshCw size={18} />
          Tentar Novamente
        </button>
      ) : (
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-800 [html.light_&]:bg-stone-800 hover:bg-zinc-700 [html.light_&]:hover:bg-stone-700 text-white font-medium rounded-full transition-colors focus:ring-4 focus:ring-zinc-500/20 outline-none"
        >
          <RefreshCw size={18} />
          Recarregar Página
        </button>
      )}
    </div>
  );
}
