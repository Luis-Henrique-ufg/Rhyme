/**
 * @file OfflineBanner.test.jsx
 * @description Testes de componente para o OfflineBanner.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processo 6.4.9 - Verificação).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Variável de controle do mock
let mockNetworkStatus = { isOnline: true, wasOffline: false };

vi.mock('../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockNetworkStatus,
}));

import OfflineBanner from '../src/components/OfflineBanner';

describe('OfflineBanner (ISO-6.4.7-VERIF03)', () => {
  it('não renderiza nada quando está online e não esteve offline', () => {
    mockNetworkStatus = { isOnline: true, wasOffline: false };
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza banner de alerta offline quando desconectado', () => {
    mockNetworkStatus = { isOnline: false, wasOffline: false };
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Sem conexão — dados em cache podem estar desatualizados/i)
    ).toBeInTheDocument();
  });

  it('renderiza mensagem de reconexão quando a conexão foi restabelecida', () => {
    mockNetworkStatus = { isOnline: true, wasOffline: true };
    render(<OfflineBanner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Conexão restabelecida/i)).toBeInTheDocument();
  });
});
