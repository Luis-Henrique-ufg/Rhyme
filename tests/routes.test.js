import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute } from '../src/utils/routeUtils.js';

test('normalizeRoute normaliza variações de Professor Jamil', () => {
  assert.equal(normalizeRoute('professor_jamil'), 'Professor Jamil');
  assert.equal(normalizeRoute('jamil'), 'Professor Jamil');
  assert.equal(normalizeRoute('Professor Jamil'), 'Professor Jamil');
});

test('normalizeRoute normaliza variações de Cromínia', () => {
  assert.equal(normalizeRoute('crominia'), 'Cromínia');
  assert.equal(normalizeRoute('Crom'), 'Cromínia');
});

test('normalizeRoute normaliza variações de Hidrolândia', () => {
  assert.equal(normalizeRoute('hidrolandia'), 'Hidrolândia');
  assert.equal(normalizeRoute('Hidrol'), 'Hidrolândia');
});

test('normalizeRoute lida com entradas vazias ou indefinidas', () => {
  assert.equal(normalizeRoute(''), '');
  assert.equal(normalizeRoute(null), '');
  assert.equal(normalizeRoute(undefined), '');
});
