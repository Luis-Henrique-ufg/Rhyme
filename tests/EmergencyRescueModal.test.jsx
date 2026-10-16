/**
 * @file EmergencyRescueModal.test.jsx
 * @description Testes para o modal de segurança de passageiros pendentes ao finalizar viagem.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processo 6.4.9 - Verificação).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmergencyRescueModal from '../src/components/EmergencyRescueModal';

describe('EmergencyRescueModal (ISO-6.4.7-VERIF03)', () => {
  it('não renderiza nada se não houver alunos pendentes', () => {
    const { container } = render(
      <EmergencyRescueModal
        pendingStudents={[]}
        onConfirmBoarded={vi.fn()}
        onConfirmAbandoned={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('exibe nomes dos alunos pendentes e as opções de resolução', () => {
    const pendingStudents = [
      { studentId: 's1', studentName: 'João Silva' },
      { studentId: 's2', studentName: 'Mariana Costa' },
    ];
    const onConfirmBoarded = vi.fn();
    const onConfirmAbandoned = vi.fn();
    const onCancel = vi.fn();

    render(
      <EmergencyRescueModal
        pendingStudents={pendingStudents}
        onConfirmBoarded={onConfirmBoarded}
        onConfirmAbandoned={onConfirmAbandoned}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Finalizar viagem\?/i)).toBeInTheDocument();
    expect(screen.getByText(/João Silva, Mariana Costa/i)).toBeInTheDocument();

    const btnBoarded = screen.getByRole('button', { name: /Eles embarcaram/i });
    const btnAbandoned = screen.getByRole('button', { name: /Ficaram para trás/i });
    const btnCancel = screen.getByRole('button', { name: /Cancelar/i });

    fireEvent.click(btnBoarded);
    expect(onConfirmBoarded).toHaveBeenCalledTimes(1);

    fireEvent.click(btnAbandoned);
    expect(onConfirmAbandoned).toHaveBeenCalledTimes(1);

    fireEvent.click(btnCancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
