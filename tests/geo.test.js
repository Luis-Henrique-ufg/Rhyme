import { describe, it, expect } from 'vitest';
import { getDistanceFromLatLonInKm, isWithinRadius } from '../src/utils/geo.js';

describe('geo calculations & geofencing', () => {
  it('calcula distância 0 para coordenadas idênticas', () => {
    const lat = -16.6869;
    const lng = -49.2643;
    const dist = getDistanceFromLatLonInKm(lat, lng, lat, lng);
    expect(dist).toBe(0);
  });

  it('calcula distância aproximada entre Goiânia e Professor Jamil (~70km)', () => {
    const goiania = { lat: -16.6869, lng: -49.2643 };
    const profJamil = { lat: -17.2506, lng: -49.2486 };
    const dist = getDistanceFromLatLonInKm(goiania.lat, goiania.lng, profJamil.lat, profJamil.lng);

    // Distância em linha reta fica em torno de 62-65km
    expect(dist).toBeGreaterThan(60);
    expect(dist).toBeLessThan(70);
  });

  it('retorna true quando a distância é menor que 1km (geofencing ativo)', () => {
    const bus = { lat: -16.6869, lng: -49.2643 };
    // Ponto a ~500 metros de distância
    const student = { lat: -16.683, lng: -49.2643 };

    expect(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0)).toBe(true);
  });

  it('retorna false quando o ônibus está longe (> 1km)', () => {
    const bus = { lat: -16.6869, lng: -49.2643 };
    const student = { lat: -16.75, lng: -49.2643 };

    expect(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0)).toBe(false);
  });

  it('lida com valores nulos ou indefinidos retornando Infinity', () => {
    expect(getDistanceFromLatLonInKm(null, null, -16.6869, -49.2643)).toBe(Infinity);
  });
});
