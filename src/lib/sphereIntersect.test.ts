import { expect, test, describe } from 'vitest';
import { raySphereIntersect } from './sphereIntersect';

function assertHit(result: ReturnType<typeof raySphereIntersect>) {
  if (!result) throw new Error('Expected non-null intersection');
  return result;
}

describe('raySphereIntersect', () => {
  test('hits front of sphere centered at origin', () => {
    const result = assertHit(raySphereIntersect([0, 0, 30], [0, 0, -1], [0, 0, 0], 12));
    expect(result[2]).toBeCloseTo(12);
  });

  test('hits back of sphere when ray originates inside', () => {
    const result = assertHit(raySphereIntersect([0, 0, 5], [0, 0, -1], [0, 0, 0], 12));
    expect(result[2]).toBeCloseTo(-12, 5);
  });

  test('returns null for ray that misses sphere', () => {
    const result = raySphereIntersect([20, 0, 30], [0, 0, -1], [0, 0, 0], 12);
    expect(result).toBeNull();
  });

  test('returns null for grazing ray just outside radius', () => {
    const result = raySphereIntersect([12.1, 0, 30], [0, 0, -1], [0, 0, 0], 12);
    expect(result).toBeNull();
  });

  test('hits sphere offset from origin', () => {
    const result = assertHit(raySphereIntersect([5, 0, 30], [0, 0, -1], [5, 0, 0], 10));
    expect(result[2]).toBeCloseTo(10);
    expect(result[0]).toBeCloseTo(5);
  });

  test('returns null for reverse direction (ray pointing away)', () => {
    const result = raySphereIntersect([0, 0, 30], [0, 0, 1], [0, 0, 0], 12);
    expect(result).toBeNull();
  });

  test('origin on sphere surface points inward', () => {
    const result = assertHit(raySphereIntersect([0, 0, 12], [0, 0, -1], [0, 0, 0], 12));
    expect(result[2]).toBeCloseTo(-12);
  });

  test('zero distance origin returns null', () => {
    const result = assertHit(raySphereIntersect([0, 0, 0], [0, 0, -1], [0, 0, 0], 12));
    expect(result[2]).toBeCloseTo(-12);
  });
});
