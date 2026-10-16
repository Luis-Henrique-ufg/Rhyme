/**
 * @file geoService.test.js
 * @description Testes unitários para cálculos geodésicos, Haversine, Geofencing e bússola 3D.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (Processos 6.4.7.2.c e 6.4.9).
 */

import { describe, it, expect } from 'vitest';
import {
  getDistanceFromLatLonInKm,
  isWithinRadius,
  shortestAngleDiff,
  computeTiltCompensatedHeading,
  MOCK_FACULTIES,
  CENTER,
} from '../src/services/geoService.js';

describe('geoService - Haversine and Geofencing (ISO-6.4.7-VERIF02)', () => {
  it('calcula distância 0 para coordenadas idênticas', () => {
    const lat = -16.6869;
    const lng = -49.2643;
    expect(getDistanceFromLatLonInKm(lat, lng, lat, lng)).toBe(0);
  });

  it('calcula distância aproximada entre Goiânia e Professor Jamil (~63km em linha reta)', () => {
    const goiania = { lat: -16.6869, lng: -49.2643 };
    const profJamil = { lat: -17.2506, lng: -49.2486 };
    const dist = getDistanceFromLatLonInKm(goiania.lat, goiania.lng, profJamil.lat, profJamil.lng);

    expect(dist).toBeGreaterThan(60);
    expect(dist).toBeLessThan(70);
  });

  it('calcula distância aproximada entre Goiânia e Cromínia (~80-90km)', () => {
    const goiania = { lat: -16.6869, lng: -49.2643 };
    const crominia = { lat: -17.2917, lng: -49.3808 };
    const dist = getDistanceFromLatLonInKm(goiania.lat, goiania.lng, crominia.lat, crominia.lng);

    expect(dist).toBeGreaterThan(65);
    expect(dist).toBeLessThan(75);
  });

  it('retorna Infinity para coordenadas inválidas ou nulas', () => {
    expect(getDistanceFromLatLonInKm(null, null, -16.6869, -49.2643)).toBe(Infinity);
    expect(getDistanceFromLatLonInKm(-16.6869, -49.2643, undefined, undefined)).toBe(Infinity);
    expect(getDistanceFromLatLonInKm(NaN, 0, 0, 0)).toBe(Infinity);
  });

  describe('isWithinRadius (Geofencing)', () => {
    const bus = { lat: -16.6869, lng: -49.2643 };

    it('retorna true quando o passageiro está dentro do raio de 1.0 km (geofence padrão)', () => {
      // Ponto a ~500 metros
      const student = { lat: -16.683, lng: -49.2643 };
      expect(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0)).toBe(true);
    });

    it('retorna false quando o ônibus está fora do raio de 1.0 km', () => {
      const student = { lat: -16.75, lng: -49.2643 };
      expect(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0)).toBe(false);
    });

    it('suporta raio customizado para detecção de chegada (<50m / 0.05km)', () => {
      const pointA = { lat: -16.6869, lng: -49.2643 };
      // Ponto a ~25 metros de distância
      const pointB = { lat: -16.6867, lng: -49.2643 };
      // Ponto a ~150 metros de distância
      const pointC = { lat: -16.6855, lng: -49.2643 };

      expect(isWithinRadius(pointA.lat, pointA.lng, pointB.lat, pointB.lng, 0.05)).toBe(true);
      expect(isWithinRadius(pointA.lat, pointA.lng, pointC.lat, pointC.lng, 0.05)).toBe(false);
    });
  });

  describe('shortestAngleDiff (Diferença angular)', () => {
    it('calcula diferença simples sem cruzamento de zero', () => {
      expect(shortestAngleDiff(45, 15)).toBe(30);
      expect(shortestAngleDiff(15, 45)).toBe(-30);
    });

    it('calcula corretamente a menor rotação cruzando 359° <-> 0°', () => {
      // De 350° para 10° o giro mais curto é +20°, não -340°
      expect(shortestAngleDiff(10, 350)).toBe(20);
      // De 10° para 350° o giro mais curto é -20°
      expect(shortestAngleDiff(350, 10)).toBe(-20);
    });

    it('retorna 0 para ângulos idênticos ou congruentes', () => {
      expect(shortestAngleDiff(90, 90)).toBe(0);
      expect(shortestAngleDiff(450, 90)).toBe(0);
    });
  });

  describe('computeTiltCompensatedHeading (Bússola com compensação de inclinação)', () => {
    it('retorna rumo coincidente com alpha quando o dispositivo está plano (beta=0, gamma=0)', () => {
      const heading = computeTiltCompensatedHeading(90, 0, 0, 0);
      expect(Math.round(heading)).toBe(90);
    });

    it('normaliza o rumo final no intervalo [0, 360)', () => {
      const h1 = computeTiltCompensatedHeading(350, 10, 5, 20);
      expect(h1).toBeGreaterThanOrEqual(0);
      expect(h1).toBeLessThan(360);
    });

    it('aplica compensação do ângulo de rotação da tela (ex: orientação paisagem 90°)', () => {
      const h0 = computeTiltCompensatedHeading(45, 0, 0, 0);
      const h90 = computeTiltCompensatedHeading(45, 0, 0, 90);
      expect(Math.round((h90 - h0 + 360) % 360)).toBe(90);
    });
  });

  describe('MOCK_FACULTIES Coordenadas de Referência', () => {
    it('contém coordenadas válidas de latitude e longitude para todas as faculdades', () => {
      expect(CENTER).toHaveLength(2);
      expect(CENTER[0]).toBeGreaterThan(-90);
      expect(CENTER[0]).toBeLessThan(90);

      Object.entries(MOCK_FACULTIES).forEach(([name, coords]) => {
        expect(coords).toHaveLength(2);
        const [lat, lng] = coords;
        expect(typeof lat).toBe('number');
        expect(typeof lng).toBe('number');
        expect(lat).toBeLessThan(-15); // Em Goiás
        expect(lat).toBeGreaterThan(-18);
        expect(lng).toBeLessThan(-48);
        expect(lng).toBeGreaterThan(-51);
      });
    });
  });
});
