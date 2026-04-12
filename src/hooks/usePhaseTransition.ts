import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../stores/simulationStore';

/**
 * Hook that triggers a visual flash animation when the surgical phase changes.
 * Returns a boolean that is true for a short duration after a phase change.
 */
export function usePhaseTransitionFlash(duration = 500) {
  const [isFlashing, setIsFlashing] = useState(false);
  const phaseRef = useRef(useSimulationStore((s) => s.phase));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPhase = useSimulationStore.getState().phase;

    // Phase changed
    if (currentPhase !== phaseRef.current) {
      phaseRef.current = currentPhase;

      // Trigger flash using requestAnimationFrame to avoid setState in effect
      requestAnimationFrame(() => {
        setIsFlashing(true);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Reset after duration
        timeoutRef.current = setTimeout(() => {
          setIsFlashing(false);
        }, duration);
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  });

  return isFlashing;
}

/**
 * Hook that plays a sound when the surgical phase changes.
 */
export function usePhaseTransitionSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const phaseRef = useRef(useSimulationStore((s) => s.phase));

  useEffect(() => {
    const currentPhase = useSimulationStore.getState().phase;

    if (currentPhase !== phaseRef.current) {
      phaseRef.current = currentPhase;

      // Lazy load AudioContext on first user interaction
      if (!audioContextRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const AudioContextConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextConstructor();
      }

      // Play a simple beep sound
      const ctx = audioContextRef.current;
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      } catch {
        // Ignore audio errors (e.g., user hasn't interacted with page yet)
      }
    }
  });
}
