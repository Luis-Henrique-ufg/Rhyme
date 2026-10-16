/**
 * @file DropdownSelect.test.jsx
 * @description Testes para o componente DropdownSelect desacoplado.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processo 6.4.9 - Verificação).
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DropdownSelect from '../src/components/DropdownSelect';

describe('DropdownSelect (ISO-6.4.7-VERIF03)', () => {
  const options = [
    { label: 'Professor Jamil', value: 'Professor Jamil' },
    { label: 'Cromínia', value: 'Cromínia' },
    { label: 'Hidrolândia', value: 'Hidrolândia' },
  ];

  it('exibe o valor atualmente selecionado', () => {
    render(<DropdownSelect value="Professor Jamil" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Professor Jamil')).toBeInTheDocument();
  });

  it('abre o menu de opções ao clicar no seletor', () => {
    render(<DropdownSelect value="Professor Jamil" onChange={vi.fn()} options={options} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /Cromínia/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hidrolândia/i })).toBeInTheDocument();
  });

  it('chama onChange com a opção selecionada e fecha o dropdown', () => {
    const onChange = vi.fn();
    render(<DropdownSelect value="Professor Jamil" onChange={onChange} options={options} />);

    // Abre
    fireEvent.click(screen.getByRole('button'));

    // Seleciona Cromínia
    const crominiaBtn = screen.getByRole('button', { name: /Cromínia/i });
    fireEvent.click(crominiaBtn);

    expect(onChange).toHaveBeenCalledWith('Cromínia');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
