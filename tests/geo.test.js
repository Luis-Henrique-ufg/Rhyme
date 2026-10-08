import test from 'node:test';
import assert from 'node:assert/strict';
import { getDistanceFromLatLonInKm, isWithinRadius } from '../src/utils/geo.js';

test('getDistanceFromLatLonInKm calcula distância 0 para coordenadas idênticas', () => {
  const lat = -16.6869;
  const lng = -49.2643;
  const dist = getDistanceFromLatLonInKm(lat, lng, lat, lng);
  assert.equal(dist, 0);
});

test('getDistanceFromLatLonInKm calcula distância aproximada entre Goiânia e Professor Jamil (~70km)', () => {
  const goiania = { lat: -16.6869, lng: -49.2643 };
  const profJamil = { lat: -17.2506, lng: -49.2486 };
  const dist = getDistanceFromLatLonInKm(goiania.lat, goiania.lng, profJamil.lat, profJamil.lng);
  
  // Distância em linha reta fica em torno de 62-65km
  assert.ok(dist > 60 && dist < 70, `Distância calculada (${dist}km) fora do esperado`);
});

test('isWithinRadius retorna true quando a distância é menor que 1km (geofencing ativo)', () => {
  const bus = { lat: -16.6869, lng: -49.2643 };
  // Ponto a ~500 metros de distância
  const student = { lat: -16.6830, lng: -49.2643 };
  
  assert.equal(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0), true);
});

test('isWithinRadius retorna false quando o ônibus está longe (> 1km)', () => {
  const bus = { lat: -16.6869, lng: -49.2643 };
  const student = { lat: -16.7500, lng: -49.2643 };
  
  assert.equal(isWithinRadius(bus.lat, bus.lng, student.lat, student.lng, 1.0), false);
});

test('getDistanceFromLatLonInKm lida com valores nulos ou indefinidos retornando Infinity', () => {
  assert.equal(getDistanceFromLatLonInKm(null, null, -16.6869, -49.2643), Infinity);
});
