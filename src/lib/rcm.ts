import type { Vec3, NeedlePose } from '../types';
import { makeRotationFromBasis } from './transforms';
import { raySphereIntersect } from './sphereIntersect';

export type { NeedlePose } from '../types';

/**
 * Configuration for computing a Remote Center of Motion (RCM) constrained needle pose.
 *
 * The RCM is a kinematic constraint used in surgical robotics: the needle pivots
 * around a fixed point on the tissue surface, ensuring the entry point is never
 * displaced laterally — only rotated and translated along the needle axis.
 */
export interface RCMConfig {
  /** The RCM point on the eyeball surface where the needle enters */
  rcmPoint: Vec3;
  /** Outward-pointing surface normal at the RCM point */
  surfaceNormal: Vec3;
  /** Maximum insertion depth in mm */
  maxInsertionDepth: number;
  /** Maximum tilt angle in radians */
  maxTiltAngle: number;
}

/**
 * Computes the full needle pose (tip position, shaft direction, and 4x4 transform matrix)
 * given an RCM configuration and two tilt angles.
 *
 * The needle pose satisfies the RCM constraint: the needle always passes through
 * the RCM point, regardless of tilt angles. The shaft direction is computed via
 * spherical parameterization in the local orthonormal basis at the RCM point.
 *
 * @param config - RCM configuration including entry point and surface normal
 * @param alpha - Tilt/elevation angle in radians (0 = straight along normal)
 * @param beta - Azimuth/rotation angle in radians (direction around the normal)
 * @param d - Insertion depth in mm (distance from RCM point along shaft direction)
 * @returns Full needle pose with tip position, shaft direction, and transform matrix
 */
export function computeNeedlePose(
  config: RCMConfig,
  alpha: number,
  beta: number,
  d: number
): NeedlePose {
  const { rcmPoint, surfaceNormal } = config;

  // Build orthonormal basis at RCM point
  // z-axis = inward surface normal (pointing into eyeball)
  const zAxis: Vec3 = [-surfaceNormal[0], -surfaceNormal[1], -surfaceNormal[2]];

  // x-axis = perpendicular to z-axis
  const worldUp: Vec3 = [0, 1, 0];
  let xAxis = cross(zAxis, worldUp);
  if (magnitude(xAxis) < 1e-6) {
    xAxis = cross(zAxis, [1, 0, 0]);
  }
  xAxis = normalize(xAxis);
  const yAxis = normalize(cross(zAxis, xAxis));

  const shaftDir = rotateDirection(zAxis, xAxis, yAxis, alpha, beta);

  // Tip position = RCM + depth * shaftDirection
  const tipPosition: Vec3 = [
    rcmPoint[0] + d * shaftDir[0],
    rcmPoint[1] + d * shaftDir[1],
    rcmPoint[2] + d * shaftDir[2],
  ];

  const needleT = buildNeedleTransform(rcmPoint, shaftDir, xAxis, yAxis);

  return {
    tipPosition,
    shaftDirection: shaftDir,
    insertionDepth: d,
    tiltAlpha: alpha,
    tiltBeta: beta,
    needleTransform: needleT,
  };
}

/**
 * Computes the RCM point by intersecting a click ray with the eyeball sphere.
 *
 * When the user clicks on the eyeball, this function finds the 3D hit point
 * on the sphere surface and computes the outward-pointing surface normal.
 * This defines the Remote Center of Motion for the surgical needle.
 *
 * @param rayOrigin - Origin of the ray (camera position)
 * @param rayDirection - Normalized direction of the ray
 * @param eyeballCenter - Center of the eyeball sphere
 * @param eyeballRadius - Radius of the eyeball sphere
 * @returns Object containing the RCM hit point and surface normal, or null if no intersection
 */
export function computeRCMFromRay(
  rayOrigin: Vec3,
  rayDirection: Vec3,
  eyeballCenter: Vec3,
  eyeballRadius: number
): { rcmPoint: Vec3; surfaceNormal: Vec3 } | null {
  const hit = raySphereIntersect(rayOrigin, rayDirection, eyeballCenter, eyeballRadius);
  if (!hit) return null;

  const surfaceNormal = normalize([
    hit[0] - eyeballCenter[0],
    hit[1] - eyeballCenter[1],
    hit[2] - eyeballCenter[2],
  ]);

  return { rcmPoint: hit, surfaceNormal };
}

// --- Vector math helpers ---

/** Cross product of two 3D vectors. */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Euclidean magnitude of a vector. */
function magnitude(v: Vec3): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** Normalize a vector to unit length. Returns zero vector if magnitude is negligible. */
function normalize(v: Vec3): Vec3 {
  const m = magnitude(v);
  if (m < 1e-10) return [0, 0, 0];
  return [v[0] / m, v[1] / m, v[2] / m];
}

/**
 * Rotate a direction vector in the local orthonormal basis.
 *
 * Spherical parameterization relative to the surface normal (zAxis):
 * ```
 *   shaftDir = sin(alpha) * cos(beta) * xAxis
 *            + sin(alpha) * sin(beta) * yAxis
 *            + cos(alpha) * zAxis
 * ```
 *
 * - `alpha = 0` => shaft points along zAxis (straight into the eyeball)
 * - `alpha > 0` => tilted away from normal, beta controls the azimuth direction
 */
function rotateDirection(zAxis: Vec3, xAxis: Vec3, yAxis: Vec3, alpha: number, beta: number): Vec3 {
  const cosAlpha = Math.cos(alpha);
  const sinAlpha = Math.sin(alpha);
  const cosBeta = Math.cos(beta);
  const sinBeta = Math.sin(beta);

  return [
    sinAlpha * cosBeta * xAxis[0] + sinAlpha * sinBeta * yAxis[0] + cosAlpha * zAxis[0],
    sinAlpha * cosBeta * xAxis[1] + sinAlpha * sinBeta * yAxis[1] + cosAlpha * zAxis[1],
    sinAlpha * cosBeta * xAxis[2] + sinAlpha * sinBeta * yAxis[2] + cosAlpha * zAxis[2],
  ];
}

/**
 * Build a 4x4 column-major transform matrix from the needle's local coordinate system.
 *
 * The Z axis is the shaft direction, X and Y are computed via Gram-Schmidt
 * orthogonalization to maintain an orthonormal basis.
 */
function buildNeedleTransform(
  rcmPoint: Vec3,
  shaftDir: Vec3,
  fallbackX: Vec3,
  fallbackY: Vec3
): Float64Array {
  const needleZ = normalize(shaftDir);

  let needleX = cross(needleZ, fallbackX);
  if (magnitude(needleX) < 1e-6) {
    needleX = cross(needleZ, fallbackY);
  }
  needleX = normalize(needleX);
  const needleY = normalize(cross(needleZ, needleX));

  const rot = makeRotationFromBasis(needleX, needleY, needleZ);

  const m = new Float64Array(16);
  for (let i = 0; i < 12; i++) m[i] = rot[i];
  m[12] = rcmPoint[0];
  m[13] = rcmPoint[1];
  m[14] = rcmPoint[2];
  m[15] = 1;

  return m;
}
