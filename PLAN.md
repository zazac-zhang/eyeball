# Eyeball Surgery Robot RCM Simulation

## Context

构建一个交互式 3D 仿真，展示眼球手术机器人在接触点执行 RCM（Remote Center of Motion）运动的过程。核心需求：多层次解剖眼球模型 + 简化针具 + RCM 运动学约束 + 鼠标交互控制 + 运动学参数面板 + 轨迹可视化 + 简单播放回放。

技术栈：**Vite + React + TypeScript + R3F (React Three Fiber) + Zustand**

## Architecture

```
src/
├── lib/
│   ├── rcm.ts              # RCM 运动学引擎核心（正运动学、RCM 点计算）
│   ├── transforms.ts       # SE(3) 齐次变换工具函数
│   └── sphereIntersect.ts  # 射线-球体相交计算
├── types/index.ts          # Vec3, SurgicalPhase, SimulationState 等类型
├── constants/index.ts      # 眼球半径、最大插入深度、颜色等常量
├── stores/
│   └── simulationStore.ts  # Zustand 全局状态（RCM 点、倾斜角、插入深度、相位、轨迹）
├── hooks/
│   ├── useMouseControl.ts  # 鼠标交互（点击放置 RCM、拖拽倾斜、滚轮插入）
│   └── useTrajectory.ts    # 轨迹录制钩子
├── components/
│   ├── scene/Scene.tsx     # Canvas 容器 + 灯光 + 相机
│   ├── eyeball/
│   │   ├── Eyeball.tsx     # 组合容器
│   │   ├── Sclera.tsx      # 巩膜（白色球体, r=12mm）
│   │   ├── Cornea.tsx      # 角膜（透明球冠, 前侧）
│   │   ├── Lens.tsx        # 晶状体（双凸透镜, LatheGeometry）
│   │   └── LimbusRing.tsx  # 角膜缘环（视觉标记）
│   ├── needle/
│   │   ├── Needle.tsx      # 针具总成（读取 pose，应用变换）
│   │   ├── NeedleShaft.tsx # 圆柱针杆
│   │   └── NeedleTip.tsx   # 锥形针尖
│   ├── trajectory/
│   │   ├── TrajectoryLines.tsx  # 红色轨迹线
│   │   └── RCMIndicator.tsx     # RCM 点发光标记
│   └── hud/
│       ├── KinematicsPanel.tsx  # 实时参数：坐标、角度、深度
│       └── ControlPanel.tsx     # 滑块、播放/暂停、重置、清除轨迹
├── App.tsx                 # Canvas + HUD overlay
├── main.tsx                # 入口
└── index.css               # HUD 样式
```

## RCM 运动学模型

**核心约束**：针杆始终穿过 RCM 点（针尖首次接触眼球表面的点）。

**参数化**：
- `alpha`：偏离表面法线的倾斜角（0 = 沿法线直插）
- `beta`：绕法线的方位角
- `d`：沿针轴方向的插入深度

**正运动学**：
```
z_axis = -surfaceNormal (指向眼球内部)
x_axis, y_axis = 构建正交基
shaft_direction = rotate(z_axis, alpha, beta)
tip_position = rcm_point + d * shaft_direction
```

针尖在 RCM 点时 `d=0`，改变 alpha/beta 时针尖绕 RCM 点旋转但针杆始终穿过 RCM 点。

## 交互设计

| 操作 | 效果 |
|------|------|
| 点击眼球 | 建立 RCM 点（射线-球体相交） |
| 拖拽鼠标 | 控制 alpha/beta 倾斜角 |
| 滚轮 | 控制插入深度 d |
| OrbitControls | 旋转/缩放视角 |

## 手术阶段状态机

`IDLE → CONTACT → INSERTING → WITHDRAWING → COMPLETE`

## 实现步骤

1. **脚手架**：Vite + React + TS，安装依赖（three, @react-three/fiber, @react-three/drei, zustand）
2. **眼球模型**：Sclera + Cornea + Lens + LimbusRing，设置灯光和 OrbitControls
3. **数学工具**：transforms.ts + sphereIntersect.ts，写单元测试
4. **RCM 引擎**：rcm.ts 实现 computeNeedlePose() 和 computeRCMFromRay()，单元测试验证约束
5. **状态管理**：simulationStore.ts 连接 RCM 引擎
6. **针具可视化**：Needle 组件绑定 store pose
7. **鼠标交互**：点击放置 + 拖拽倾斜 + 滚轮插入
8. **轨迹系统**：录制 + 红色轨迹线可视化 + RCM 发光标记
9. **回放**：遍历录制轨迹点作为简单动画
10. **打磨**：手术阶段指示、响应式 HUD、性能优化

## 依赖

- `@react-three/fiber` - R3F 核心
- `@react-three/drei` - OrbitControls, Line, Sphere 等辅助组件
- `three` - Three.js 直接依赖
- `zustand` - 轻量状态管理，3D 和 HUD 共享状态

## 验证方式

1. 启动 `npm run dev`，看到多层次眼球模型
2. 点击眼球表面出现针具，针杆穿过点击位置
3. 拖拽鼠标，针杆绕 RCM 点旋转，针尖沿球面内侧运动
4. 滚轮调节，针尖沿针轴方向进出
5. HUD 面板实时显示坐标、角度、深度数据
6. 移动针尖时出现红色轨迹线
7. 点击 Play 回放记录的轨迹
