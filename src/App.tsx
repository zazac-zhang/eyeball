import { Canvas } from '@react-three/fiber';
import { Scene } from './components/scene/Scene';
import { KinematicsPanel } from './components/hud/KinematicsPanel';
import { ControlPanel } from './components/hud/ControlPanel';
import './index.css';

function App() {
  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 10, 30], fov: 45 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#0a0a1a']} />
          <Scene />
        </Canvas>
      </div>
      <div className="hud-overlay">
        <div className="hud-top">
          <KinematicsPanel />
        </div>
        <div className="hud-bottom">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
