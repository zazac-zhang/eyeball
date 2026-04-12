import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Eyeball } from '../eyeball/Eyeball';
import { Needle } from '../needle/Needle';
import { DepthRuler } from '../needle/DepthRuler';
import { TrajectoryLines } from '../trajectory/TrajectoryLines';
import { RCMIndicator } from '../trajectory/RCMIndicator';
import { RCMConstraintLine } from '../trajectory/RCMConstraintLine';
import { NormalIndicator } from '../trajectory/NormalIndicator';
import { SafetyCone } from '../trajectory/SafetyCone';
import { ObjectLabels } from '../trajectory/ObjectLabels';
import { CollisionIndicator } from '../trajectory/CollisionIndicator';
import { Lighting } from './Lighting';
import { ScleraClickHandler } from './ScleraClickHandler';
import { useTrajectoryRecorder } from '../../hooks/useTrajectory';
import { useTouchPinch } from '../../hooks/useTouchPinch';
import { useSimulationStore } from '../../stores/simulationStore';

export function Scene() {
  useTrajectoryRecorder();
  useTouchPinch();
  const mode = useSimulationStore((s) => s.mode);

  return (
    <>
      <Lighting />
      <Eyeball />
      <Needle />
      <DepthRuler />
      <TrajectoryLines />
      <RCMConstraintLine />
      <RCMIndicator />
      <NormalIndicator />
      <SafetyCone />
      <ObjectLabels />
      <CollisionIndicator />
      <ScleraClickHandler />
      <OrbitControls
        enabled={mode !== 'EDIT'}
        enablePan={false}
        minDistance={15}
        maxDistance={60}
        target={[0, 0, 0]}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
          mipmapBlur
          intensity={1.5}
        />
      </EffectComposer>
    </>
  );
}
