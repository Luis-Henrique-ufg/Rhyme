import { describe, it, expect } from 'vitest';
import { normalizeRoute } from '../src/utils/routeUtils.js';

describe('routeUtils - normalizeRoute', () => {
  it('normaliza variações de Professor Jamil', () => {
    expect(normalizeRoute('professor_jamil')).toBe('Professor Jamil');
    expect(normalizeRoute('jamil')).toBe('Professor Jamil');
    expect(normalizeRoute('Professor Jamil')).toBe('Professor Jamil');
  });

  it('normaliza variações de Cromínia', () => {
    expect(normalizeRoute('crominia')).toBe('Cromínia');
    expect(normalizeRoute('Crom')).toBe('Cromínia');
  });

  it('normaliza variações de Hidrolândia', () => {
    expect(normalizeRoute('hidrolandia')).toBe('Hidrolândia');
    expect(normalizeRoute('Hidrol')).toBe('Hidrolândia');
  });

  it('lida com entradas vazias ou indefinidas', () => {
    expect(normalizeRoute('')).toBe('');
    expect(normalizeRoute(null)).toBe('');
    expect(normalizeRoute(undefined)).toBe('');
  });
});
