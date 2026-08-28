import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Persistent banner that appears at the top of the screen when offline,
 * and shows a "back online" confirmation toast when reconnected.
 */
export default function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Back online: brief success toast
  if (wasOffline && isOnline) {
    return (
      <div
        role="status"
        style={{
          position: 'relative',
          width: '100%',
          zIndex: 9999,
          background: 'linear-gradient(90deg, #14532d, #15803d)',
          color: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          fontSize: '0.85rem',
          fontWeight: 500,
          animation: 'slideDown 0.3s ease',
        }}
      >
        <Wifi size={16} />
        Conexão restabelecida
      </div>
    );
  }

  // Offline: persistent banner
  if (!isOnline) {
    return (
      <div
        role="alert"
        style={{
          position: 'relative',
          width: '100%',
          zIndex: 9999,
          background: 'linear-gradient(90deg, #1c0606, #7f1d1d)',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          fontSize: '0.85rem',
          fontWeight: 500,
          animation: 'slideDown 0.3s ease',
        }}
      >
        <WifiOff size={16} />
        Sem conexão — dados em cache podem estar desatualizados
      </div>
    );
  }

  return null;
}
