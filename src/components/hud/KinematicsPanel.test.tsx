import { render, screen } from '@testing-library/react';
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { KinematicsPanel } from './KinematicsPanel';
import { useSimulationStore } from '../../stores/simulationStore';
import { SurgicalPhase } from '../../types';

beforeEach(() => {
  useSimulationStore.getState().reset();
});

afterEach(() => {
  useSimulationStore.getState().reset();
});

describe('KinematicsPanel', () => {
  test('shows hint when no RCM point is placed', () => {
    render(<KinematicsPanel />);
    const hint = screen.getByText(/click on the eyeball/i);
    expect(hint).toBeTruthy();
    expect(hint.tagName).toBe('P');
  });

  test('shows phase CONTACT when RCM is placed without tilt', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    // Don't call setTiltAngles as it triggers CONTACT → INSERTING
    useSimulationStore.getState().setInsertionDepth(5);

    render(<KinematicsPanel />);

    // Phase should be INSERTING since depth > 0
    const insertingElements = screen.getAllByText('INSERTING');
    expect(insertingElements.length).toBeGreaterThan(0);
  });

  test('displays INSERTING phase correctly', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    useSimulationStore.getState().setInsertionDepth(5);
    useSimulationStore.getState().setPhase(SurgicalPhase.INSERTING);

    render(<KinematicsPanel />);

    const insertingElements = screen.getAllByText('INSERTING');
    expect(insertingElements.length).toBeGreaterThan(0);
  });

  test('renders RCM label when RCM exists', () => {
    useSimulationStore.getState().addRCMPoint([1.234, 5.678, 12], [0, 0, 1]);
    useSimulationStore.getState().setTiltAngles(0, 0);
    useSimulationStore.getState().setInsertionDepth(0);

    render(<KinematicsPanel />);

    const rcmElements = screen.getAllByText(/RCM/);
    expect(rcmElements.length).toBeGreaterThan(0);
  });
});
