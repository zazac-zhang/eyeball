import * as THREE from 'three';

/** Create a 4x4 column-major homogeneous transform from rotation and translation. */
export function makeTransform(
  rotation: THREE.Matrix3 | number[][],
  translation: [number, number, number]
): Float64Array {
  const m = new Float64Array(16);
  const r = Array.isArray(rotation) ? rotation.flat() : rotation.toArray();

  // Column-major rotation matrix
  m[0] = r[0]; m[1] = r[1]; m[2] = r[2]; m[3] = 0;
  m[4] = r[3]; m[5] = r[4]; m[6] = r[5]; m[7] = 0;
  m[8] = r[6]; m[9] = r[7]; m[10] = r[8]; m[11] = 0;
  m[12] = translation[0]; m[13] = translation[1]; m[14] = translation[2]; m[15] = 1;

  return m;
}

/** Apply homogeneous transform to a point. */
export function transformPoint(
  T: Float64Array,
  p: [number, number, number]
): [number, number, number] {
  const x = T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12];
  const y = T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13];
  const z = T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14];
  return [x, y, z];
}

/** Build a rotation matrix from orthonormal basis vectors (column-major). */
export function makeRotationFromBasis(
  xAxis: [number, number, number],
  yAxis: [number, number, number],
  zAxis: [number, number, number]
): Float64Array {
  const m = new Float64Array(16);
  m[0] = xAxis[0]; m[1] = xAxis[1]; m[2] = xAxis[2]; m[3] = 0;
  m[4] = yAxis[0]; m[5] = yAxis[1]; m[6] = yAxis[2]; m[7] = 0;
  m[8] = zAxis[0]; m[9] = zAxis[1]; m[10] = zAxis[2]; m[11] = 0;
  m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
  return m;
}

/** Multiply two 4x4 homogeneous transforms (column-major). */
export function multiplyTransforms(
  A: Float64Array,
  B: Float64Array
): Float64Array {
  const result = new Float64Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      result[col * 4 + row] =
        A[row] * B[col * 4] +
        A[4 + row] * B[col * 4 + 1] +
        A[8 + row] * B[col * 4 + 2] +
        A[12 + row] * B[col * 4 + 3];
    }
  }
  return result;
}
