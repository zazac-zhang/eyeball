import { Canvas } from '@react-three/fiber';
import { Scene } from './components/scene/Scene';
import { KinematicsPanel } from './components/hud/KinematicsPanel';
import { ControlPanel } from './components/hud/ControlPanel';
import { ModePanel } from './components/hud/ModePanel';
import { RCMPointList } from './components/hud/RCMPointList';
import { RealTimeChart } from './components/hud/RealTimeChart';
import { MiniMap } from './components/hud/MiniMap';
import { HUDLayout, HUDPanel } from './components/hud/ResponsiveHUD';
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
      <HUDLayout
        topLeft={
          <HUDPanel title="Kinematics">
            <KinematicsPanel />
          </HUDPanel>
        }
        topRight={<ModePanel />}
        bottomRight={
          <HUDPanel title="Controls" defaultOpen={true}>
            <ControlPanel />
          </HUDPanel>
        }
        bottomLeft={
          <HUDPanel title="Minimap" defaultOpen={true}>
            <MiniMap />
          </HUDPanel>
        }
      />
      <RCMPointList />
      <RealTimeChart />
    </div>
  );
}

export default App;
