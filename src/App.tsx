import { Canvas } from '@react-three/fiber';
import { Scene } from './components/scene/Scene';
import { KinematicsPanel } from './components/hud/KinematicsPanel';
import { ControlPanel } from './components/hud/ControlPanel';
import './index.css';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 10, 30], fov: 45 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0a1a']} />
          <Scene />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex justify-start">
          <KinematicsPanel />
        </div>
        <div className="flex justify-end">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
