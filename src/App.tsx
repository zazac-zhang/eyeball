import { Canvas } from '@react-three/fiber';
import { Scene } from './components/scene/Scene';
import { KinematicsPanel } from './components/hud/KinematicsPanel';
import { ControlPanel } from './components/hud/ControlPanel';
import { ModePanel } from './components/hud/ModePanel';
import { RCMPointList } from './components/hud/RCMPointList';
import { RealTimeChart } from './components/hud/RealTimeChart';
import { useThemeStore } from './stores/themeStore';
import './index.css';

function App() {
  const theme = useThemeStore((s) => s.theme);

  const bgColor = theme === 'dark' ? '#0a0a1a' : '#f5f5f0';

  return (
    <div className={`relative h-screen w-screen overflow-hidden ${theme === 'dark' ? '' : 'bg-gray-100'}`}>
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 2, 30], fov: 45 }} dpr={[1, 2]}>
          <color attach="background" args={[bgColor]} />
          <Scene />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <KinematicsPanel />
          <ModePanel />
        </div>
        <div className="flex justify-end">
          <ControlPanel />
        </div>
      </div>
      <RCMPointList />
      <RealTimeChart />
    </div>
  );
}

export default App;
