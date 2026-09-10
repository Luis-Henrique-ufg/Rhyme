import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ 
  message = "Ocorreu um erro inesperado.", 
  onRetry,
  fullScreen = true
}) {
  const containerClasses = fullScreen
    ? "min-h-[60vh] w-full flex flex-col items-center justify-center p-6 text-center"
    : "w-full flex flex-col items-center justify-center p-6 text-center rounded-xl badge-danger";

  return (
    <div className={containerClasses}>
      <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(239,68,68,0.15)]">
        <AlertTriangle className="w-8 h-8 text-danger" />
      </div>
      
      <h3 className="text-xl font-semibold text-heading mb-2">Ops! Algo deu errado</h3>
      
      <p className="text-body max-w-sm mb-6 text-sm">
        {message}
      </p>

      {onRetry ? (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-danger hover:brightness-110 text-white font-medium rounded-full transition-all focus:ring-4 focus:ring-red-500/20 outline-none shadow-lg shadow-red-500/20"
        >
          <RefreshCw size={18} />
          Tentar novamente
        </button>
      ) : (
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-subtle hover-bg-subtle text-heading font-medium rounded-full transition-colors border border-subtle focus:ring-4 focus:ring-orange-500/20 outline-none"
        >
          <RefreshCw size={18} />
          Recarregar página
        </button>
      )}
    </div>
  );
}
