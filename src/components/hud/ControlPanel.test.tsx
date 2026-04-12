import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { ControlPanel } from './ControlPanel';
import { useSimulationStore } from '../../stores/simulationStore';
import { SurgicalPhase } from '../../types';

beforeEach(() => {
  useSimulationStore.getState().reset();
});

afterEach(() => {
  useSimulationStore.getState().reset();
});

describe('ControlPanel', () => {
  test('renders with VIEW mode prompt', () => {
    render(<ControlPanel />);
    expect(screen.getByText(/Free observation mode/i)).toBeTruthy();
  });

  test('Complete button is disabled when not in WITHDRAWING phase', () => {
    render(<ControlPanel />);
    const buttons = screen.getAllByText('Complete');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach(btn => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  test('Complete button is enabled when in WITHDRAWING phase', () => {
    useSimulationStore.getState().setPhase(SurgicalPhase.WITHDRAWING);
    render(<ControlPanel />);
    const buttons = screen.getAllByText('Complete');
    expect(buttons.some(btn => !(btn as HTMLButtonElement).disabled)).toBe(true);
  });

  test('Reset button resets the simulation', () => {
    useSimulationStore.getState().addRCMPoint([0, 0, 12], [0, 0, 1]);
    expect(useSimulationStore.getState().rcmPoint).not.toBeNull();

    render(<ControlPanel />);
    const resetButtons = screen.getAllByText('Reset');
    fireEvent.click(resetButtons[0]);

    expect(useSimulationStore.getState().rcmPoint).toBeNull();
    expect(useSimulationStore.getState().phase).toBe(SurgicalPhase.IDLE);
  });

  test('Clear Trails button exists', () => {
    render(<ControlPanel />);
    const buttons = screen.getAllByText('Clear Trails');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('Screenshot button exists', () => {
    render(<ControlPanel />);
    const buttons = screen.getAllByText('Screenshot');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('Settings button opens settings panel', () => {
    render(<ControlPanel />);
    const settingsButtons = screen.getAllByText('Settings');
    fireEvent.click(settingsButtons[0]);
    // After opening, there should be more than one "Settings" text
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(1);
  });
});
