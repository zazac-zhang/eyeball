import { EYEBALL_RADIUS } from '../../constants';
import { useMouseControl } from '../../hooks/useMouseControl';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

/**
 * Invisible sphere that captures mouse/pointer interaction on the eyeball
 * and registers global keyboard shortcuts.
 */
export function ScleraClickHandler() {
  const { handleClick, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel } =
    useMouseControl();
  useKeyboardShortcuts();

  return (
    <mesh
      visible={false}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <sphereGeometry args={[EYEBALL_RADIUS, 32, 32]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
