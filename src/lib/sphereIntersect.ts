import type { Vec3 } from '../types';

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Ray-sphere intersection. Returns the hit point or null. */
export function raySphereIntersect(
  origin: Vec3,
  direction: Vec3,
  center: Vec3,
  radius: number
): Vec3 | null {
  const oc: Vec3 = [origin[0] - center[0], origin[1] - center[1], origin[2] - center[2]];
  const a = dot(direction, direction);
  const b = 2 * dot(oc, direction);
  const c = dot(oc, oc) - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);

  const t = t1 > 1e-6 ? t1 : t2 > 1e-6 ? t2 : null;
  if (t === null) return null;

  return [origin[0] + t * direction[0], origin[1] + t * direction[1], origin[2] + t * direction[2]];
}
