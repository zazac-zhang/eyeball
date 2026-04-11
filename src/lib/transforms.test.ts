import { expect, test } from 'vitest';
import * as THREE from 'three';
import {
  makeTransform,
  transformPoint,
  makeRotationFromBasis,
  multiplyTransforms,
} from './transforms';

test('transformPoint applies translation correctly', () => {
  const rot = new THREE.Matrix3().identity();
  const T = makeTransform(rot, [1, 2, 3]);
  const result = transformPoint(T, [0, 0, 0]);
  expect(result).toEqual([1, 2, 3]);
});

test('transformPoint applies rotation correctly', () => {
  const rot = new THREE.Matrix3();
  // 90 degree rotation around Z
  rot.set(0, -1, 0, 1, 0, 0, 0, 0, 1);
  const T = makeTransform(rot, [0, 0, 0]);
  const result = transformPoint(T, [1, 0, 0]);
  expect(result[0]).toBeCloseTo(0);
  expect(result[1]).toBeCloseTo(1);
  expect(result[2]).toBeCloseTo(0);
});

test('makeRotationFromBasis creates valid rotation matrix', () => {
  const xAxis: [number, number, number] = [1, 0, 0];
  const yAxis: [number, number, number] = [0, 1, 0];
  const zAxis: [number, number, number] = [0, 0, 1];
  const m = makeRotationFromBasis(xAxis, yAxis, zAxis);
  // Should be identity for the rotation part
  expect(m[0]).toBe(1);
  expect(m[1]).toBe(0);
  expect(m[2]).toBe(0);
  expect(m[4]).toBe(0);
  expect(m[5]).toBe(1);
  expect(m[6]).toBe(0);
  expect(m[8]).toBe(0);
  expect(m[9]).toBe(0);
  expect(m[10]).toBe(1);
  expect(m[12]).toBe(0);
  expect(m[13]).toBe(0);
  expect(m[14]).toBe(0);
  expect(m[15]).toBe(1);
});

test('multiplyTransforms composes transforms correctly', () => {
  const T1 = makeTransform(new THREE.Matrix3().identity(), [1, 0, 0]);
  const T2 = makeTransform(new THREE.Matrix3().identity(), [0, 1, 0]);
  const result = multiplyTransforms(T1, T2);
  const p = transformPoint(result, [0, 0, 0]);
  // T1 * T2 * [0,0,0] = T1 * [0,1,0] = [1,1,0]
  expect(p).toEqual([1, 1, 0]);
});
