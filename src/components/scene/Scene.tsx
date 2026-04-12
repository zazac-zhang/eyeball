import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, DepthOfField } from '@react-three/postprocessing';
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
import { useChartDataCollector } from '../../hooks/useChartDataCollector';
import { useAutoPhaseTransition } from '../../hooks/useAutoPhaseTransition';
import { usePhaseTransitionSound } from '../../hooks/usePhaseTransition';
import { useSimulationStore } from '../../stores/simulationStore';

export function Scene() {
  useTrajectoryRecorder();
  useTouchPinch();
  useChartDataCollector();
  useAutoPhaseTransition();
  usePhaseTransitionSound();
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
        <SSAO
          samples={32}
          radius={0.1}
          intensity={0.5}
          bias={0.2}
        />
        <DepthOfField
          worldFocusDistance={15}
          worldFocusRange={5}
          bokehScale={3}
          height={480}
        />
      </EffectComposer>
    </>
  );
}
