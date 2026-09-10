import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner — Persistent banner when offline and confirmation toast when reconnected.
 * Fully styled with Tailwind CSS and Design System semantic tokens.
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Back online: brief success toast
  if (wasOffline && isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative w-full z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium banner-online shadow-md animate-[slideDown_0.3s_ease-out]"
      >
        <Wifi size={16} className="shrink-0" />
        <span>Conexão restabelecida</span>
      </div>
    );
  }

  // Offline: persistent banner
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="relative w-full z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium banner-offline shadow-md animate-[slideDown_0.3s_ease-out]"
      >
        <WifiOff size={16} className="shrink-0" />
        <span>Sem conexão — dados em cache podem estar desatualizados</span>
      </div>
    );
  }

  return null;
}
