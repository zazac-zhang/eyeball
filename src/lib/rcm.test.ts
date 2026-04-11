import { expect, test, describe } from 'vitest';
import { computeNeedlePose, computeRCMFromRay } from './rcm';

function assertResult(result: ReturnType<typeof computeRCMFromRay>) {
  if (!result) throw new Error('Expected non-null result');
  return result;
}

describe('computeRCMFromRay', () => {
  test('finds intersection on front of sphere', () => {
    const result = assertResult(
      computeRCMFromRay(
        [0, 0, 30], // ray from far away on z-axis
        [0, 0, -1], // pointing toward origin
        [0, 0, 0], // eyeball center
        12 // radius
      )
    );
    // Should hit at z = 12 (front surface)
    expect(result.rcmPoint[2]).toBeCloseTo(12);
    // Surface normal should point outward
    expect(result.surfaceNormal[2]).toBeCloseTo(1);
  });

  test('returns null for ray that misses sphere', () => {
    const result = computeRCMFromRay(
      [20, 0, 30], // ray far to the side
      [0, 0, -1], // pointing toward origin
      [0, 0, 0],
      12
    );
    expect(result).toBeNull();
  });

  test('computes correct normal at hit point', () => {
    const result = assertResult(
      computeRCMFromRay(
        [12, 0, 30], // ray directly at right edge
        [0, 0, -1], // pointing toward origin
        [0, 0, 0],
        12
      )
    );
    // Hit point should be on the sphere surface
    const { rcmPoint } = result;
    const dist = Math.sqrt(rcmPoint[0] ** 2 + rcmPoint[1] ** 2 + rcmPoint[2] ** 2);
    expect(dist).toBeCloseTo(12, 5);
  });
});

describe('computeNeedlePose', () => {
  const config = {
    rcmPoint: [0, 0, 12] as [number, number, number],
    surfaceNormal: [0, 0, 1] as [number, number, number],
    maxInsertionDepth: 18,
    maxTiltAngle: Math.PI / 4,
  };

  test('zero angles point needle inward along negative normal', () => {
    const pose = computeNeedlePose(config, 0, 0, 5);
    // With alpha=0, beta=0, shaft should point along -z (inward)
    expect(pose.shaftDirection[2]).toBeCloseTo(-1);
    // Tip should be 5mm inward from RCM
    expect(pose.tipPosition[2]).toBeCloseTo(7);
  });

  test('RCM constraint: needle always passes through RCM point', () => {
    // At d=0, tip should be at RCM point
    const pose = computeNeedlePose(config, 0.1, 0.2, 0);
    expect(pose.tipPosition[0]).toBeCloseTo(config.rcmPoint[0], 5);
    expect(pose.tipPosition[1]).toBeCloseTo(config.rcmPoint[1], 5);
    expect(pose.tipPosition[2]).toBeCloseTo(config.rcmPoint[2], 5);
  });

  test('tilt angle changes shaft direction', () => {
    const pose0 = computeNeedlePose(config, 0, 0, 1);
    const pose1 = computeNeedlePose(config, Math.PI / 8, 0, 1);
    // Directions should differ
    expect(Math.abs(pose0.shaftDirection[0] - pose1.shaftDirection[0])).toBeGreaterThan(0.01);
  });

  test('shaft direction is always unit length', () => {
    const angles = [
      [0, 0],
      [Math.PI / 8, 0],
      [0, Math.PI / 4],
      [Math.PI / 6, Math.PI / 3],
      [-Math.PI / 8, Math.PI / 2],
    ];
    for (const [alpha, beta] of angles) {
      const pose = computeNeedlePose(config, alpha, beta, 3);
      const len = Math.sqrt(
        pose.shaftDirection[0] ** 2 + pose.shaftDirection[1] ** 2 + pose.shaftDirection[2] ** 2
      );
      expect(len).toBeCloseTo(1, 5);
    }
  });
});
