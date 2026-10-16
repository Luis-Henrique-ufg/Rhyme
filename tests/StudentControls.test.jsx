/**
 * @file StudentControls.test.jsx
 * @description Testes de componente para a barra de ações do aluno (StudentControls).
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processo 6.4.9 - Verificação).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentControls from '../src/components/StudentControls';

describe('StudentControls (ISO-6.4.7-VERIF03)', () => {
  it('exibe botões de Ajustar e Trajeto quando o aluno está liberado', () => {
    const onOpenLocationAdjust = vi.fn();
    const onOpenCheckIn = vi.fn();

    render(
      <StudentControls
        isLiberado={true}
        isEmbarcado={false}
        isDriverActive={true}
        isBroadcasting={false}
        wakeUpEnabled={false}
        onOpenLocationAdjust={onOpenLocationAdjust}
        onOpenCheckIn={onOpenCheckIn}
      />
    );

    const btnAjustar = screen.getByRole('button', { name: /ajustar/i });
    const btnTrajeto = screen.getByRole('button', { name: /trajeto/i });

    expect(btnAjustar).toBeInTheDocument();
    expect(btnTrajeto).toBeInTheDocument();

    fireEvent.click(btnAjustar);
    expect(onOpenLocationAdjust).toHaveBeenCalledTimes(1);

    fireEvent.click(btnTrajeto);
    expect(onOpenCheckIn).toHaveBeenCalledTimes(1);
  });

  it('permite transmissão de GPS quando o motorista está offline ou aluno embarcou', () => {
    const onToggleBroadcasting = vi.fn();

    render(
      <StudentControls
        isLiberado={false}
        isEmbarcado={true}
        isDriverActive={false}
        isBroadcasting={false}
        wakeUpEnabled={false}
        onToggleBroadcasting={onToggleBroadcasting}
      />
    );

    const btnGps = screen.getByRole('button', { name: /enviar gps/i });
    expect(btnGps).toBeInTheDocument();

    fireEvent.click(btnGps);
    expect(onToggleBroadcasting).toHaveBeenCalledTimes(1);
  });

  it('exibe estado ativo quando o aluno está transmitindo a van', () => {
    render(
      <StudentControls
        isLiberado={false}
        isEmbarcado={true}
        isDriverActive={false}
        isBroadcasting={true}
        wakeUpEnabled={false}
      />
    );

    expect(screen.getByRole('button', { name: /gps ativo/i })).toBeInTheDocument();
  });

  it('aciona as configurações de alarme de acordar ao clicar no botão de alarme', () => {
    const onOpenWakeUpSettings = vi.fn();

    render(
      <StudentControls
        isLiberado={false}
        isEmbarcado={false}
        isDriverActive={true}
        isBroadcasting={false}
        wakeUpEnabled={true}
        onOpenWakeUpSettings={onOpenWakeUpSettings}
      />
    );

    const btnAlarme = screen.getByRole('button', { name: /alarme on/i });
    expect(btnAlarme).toBeInTheDocument();

    fireEvent.click(btnAlarme);
    expect(onOpenWakeUpSettings).toHaveBeenCalledTimes(1);
  });
});
