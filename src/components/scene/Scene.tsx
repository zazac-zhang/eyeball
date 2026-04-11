import { OrbitControls } from '@react-three/drei';
import { Eyeball } from '../eyeball/Eyeball';
import { Needle } from '../needle/Needle';
import { TrajectoryLines } from '../trajectory/TrajectoryLines';
import { RCMIndicator } from '../trajectory/RCMIndicator';
import { Lighting } from './Lighting';
import { ScleraClickHandler } from './ScleraClickHandler';
import { useTrajectoryRecorder } from '../../hooks/useTrajectory';
import { useSimulationStore } from '../../stores/simulationStore';

export function Scene() {
  useTrajectoryRecorder();
  const isDraggingNeedle = useSimulationStore((s) => s.isDraggingNeedle);

  return (
    <>
      <Lighting />
      <Eyeball />
      <Needle />
      <TrajectoryLines />
      <RCMIndicator />
      <ScleraClickHandler />
      <OrbitControls
        enabled={!isDraggingNeedle}
        enablePan={false}
        minDistance={15}
        maxDistance={60}
        target={[0, 0, 0]}
      />
    </>
  );
}
