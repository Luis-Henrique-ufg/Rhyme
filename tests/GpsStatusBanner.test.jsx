/**
 * @file GpsStatusBanner.test.jsx
 * @description Testes de componente para o GpsStatusBanner.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processo 6.4.9 - Verificação).
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GpsStatusBanner from '../src/components/GpsStatusBanner';

describe('GpsStatusBanner (ISO-6.4.7-VERIF03)', () => {
  it('não renderiza nada quando os estados são normais e sem viagem', () => {
    const { container } = render(
      <GpsStatusBanner
        isBroadcasting={false}
        isTripInProgress={false}
        hasBusLocation={false}
        gpsState="live"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza indicador de transmissão quando o aluno está transmitindo a van', () => {
    render(<GpsStatusBanner isBroadcasting={true} isTripInProgress={true} hasBusLocation={true} />);
    expect(screen.getByText(/Transmitindo localização da Van em tempo real/i)).toBeInTheDocument();
  });

  it('renderiza mensagem de espera quando a viagem iniciou mas o GPS do motorista ainda não chegou', () => {
    render(
      <GpsStatusBanner isBroadcasting={false} isTripInProgress={true} hasBusLocation={false} />
    );
    expect(screen.getByText(/Aguardando posição GPS do motorista/i)).toBeInTheDocument();
  });

  it('renderiza aviso de sinal instável quando o estado do GPS é "stale"', () => {
    render(
      <GpsStatusBanner
        isBroadcasting={false}
        isTripInProgress={true}
        hasBusLocation={true}
        gpsState="stale"
        elapsedLabel="há 45s"
      />
    );
    expect(
      screen.getByText(/Última posição recebida há 45s · sinal instável/i)
    ).toBeInTheDocument();
  });

  it('renderiza aviso de GPS offline quando o sinal expirou', () => {
    render(
      <GpsStatusBanner
        isBroadcasting={false}
        isTripInProgress={true}
        hasBusLocation={true}
        gpsState="expired"
        elapsedLabel="há 3 min"
      />
    );
    expect(screen.getByText(/GPS offline · última posição: há 3 min/i)).toBeInTheDocument();
  });
});
