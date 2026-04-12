# TODO

> Eyeball Surgery Robot RCM Simulation — 开发优化与功能规划

---

## 1. 库推荐

### 1.1 TailwindCSS

**现状**：`src/index.css` 使用纯 CSS（BEM 命名），手动维护颜色、间距、圆角等样式。

**推荐**：引入 TailwindCSS v4（`@tailwindcss/vite` 插件）替代现有 CSS。

**收益**：

- HUD 面板的半透明背景、模糊、边框等可用 `bg-gray-900/85 backdrop-blur border border-blue-500/30 rounded-lg` 一行搞定
- 颜色系统统一管理，不再散落 `#4488ff`、`#c8d8f0` 等硬编码
- 响应式布局更容易（小屏幕 HUD 适配）
- `clsx`/`tailwind-merge` 支持条件样式组合

**成本**：低。将 `index.css` 改为 Tailwind 入口，逐步替换现有 class。

### 1.2 shadcn/ui

**现状**：ControlPanel 使用原生 `<button>`、`<input type="range">`、`<table>`。

**推荐**：选择性引入 shadcn/ui 组件（非全量安装）：

| 组件      | 用途                | 替代                   |
| --------- | ------------------- | ---------------------- |
| `Slider`  | 倾斜角/插入深度滑块 | `<input type="range">` |
| `Badge`   | 手术阶段指示        | `.phase-badge`         |
| `Button`  | 所有按钮            | `.hud-controls button` |
| `Tooltip` | 键盘快捷键提示      | `.instructions` 文本   |
| `Card`    | 面板容器            | `.hud-panel`           |
| `Table`   | 运动学参数表        | `.hud-panel table`     |

**注意**：shadcn/ui 依赖 TailwindCSS，需先配置 Tailwind。

### 1.3 动画

**推荐**：

| 库                              | 用途                                          |
| ------------------------------- | --------------------------------------------- |
| `@react-spring/three`           | 3D 场景中的平滑动画（针尖进出、RCM 标记脉冲） |
| `framer-motion`                 | HUD 面板的入场/过渡动画、按钮交互反馈         |
| `@react-three/drei` 已有 `Html` | HUD 中需要 3D 标注时可嵌入 HTML               |

### 1.4 开发体验

| 库                                         | 用途                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `@vitejs/plugin-react-swc`                 | 替换 `@vitejs/plugin-react`，SWC 编译更快       |
| `prettier` + `prettier-plugin-tailwindcss` | 代码格式化 + Tailwind class 自动排序            |
| `vitest` + `@testing-library/jest-dom`     | 已有 Vitest，补充 jest-dom 匹配器               |
| `@vitest/coverage-v8`                      | 测试覆盖率报告                                  |
| `playwright`                               | E2E 测试（浏览器内交互验证）                    |
| `lefthook`                                 | git hooks（commit 前 lint + type check + test） |

### 1.5 3D 增强

| 库                            | 用途                                            |
| ----------------------------- | ----------------------------------------------- |
| `three-stdlib`                | 补充 Three.js 扩展工具（已由 drei 间接提供）    |
| `lamina`                      | Three.js 层叠材质系统，更逼真的眼球材质         |
| `@react-three/postprocessing` | 后处理效果（Bloom 辉光、DOF 景深、SMAA 抗锯齿） |
| `@react-three/gltfjsx`        | 如果未来导入真实 3D 模型                        |

### 1.6 类型安全

| 库                         | 用途                            |
| -------------------------- | ------------------------------- |
| `@types/three`             | 已安装                          |
| `noUncheckedIndexedAccess` | tsconfig 启用，防止 `Vec3` 越界 |

---

## 2. Bug 修复

### 2.1 WITHDRAWING 相位不可达

**位置**：`src/stores/simulationStore.ts`

**问题**：`setInsertionDepth` 中插入深度归零时从 `INSERTING` 直接跳到 `COMPLETE`，跳过了 `WITHDRAWING`。

**修复**：

```
clamped === 0 && phase === INSERTING → WITHDRAWING
WITHDRAWING 下完成操作 → COMPLETE
```

**状态**：✅ 已修复

### 2.2 `rcmTrailPoints` 类型未使用

**位置**：`src/types/index.ts`

**问题**：`SimulationState` 定义了 `rcmTrailPoints: Vec3[]`，但 store 使用的是 `trailPoints`。

**修复**：删除 `rcmTrailPoints` 字段。
**状态**：✅ 已修复

### 2.3 `CORNEA_RADIUS` / `RETINA_RADIUS` 常量未使用

**位置**：`src/constants/index.ts`

**问题**：`CORNEA_RADIUS = 12` 未使用（Cornea 组件使用局部常量 8），`RETINA_RADIUS = 11.5` 完全未使用。

**修复**：删除未使用常量。
**状态**：✅ 已修复

### 2.4 `App.css` 死代码

**位置**：`src/App.css`

**问题**：Vite 模板默认 CSS，未被任何组件导入。

**修复**：删除文件。
**状态**：✅ 已修复

### 2.5 无用资源文件

**位置**：`src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`

**问题**：Vite 模板脚手架产物，应用中未引用。

**修复**：删除文件。
**状态**：✅ 已修复

### 2.6 回放时 alpha/beta 角度不更新

**位置**：`src/hooks/useTrajectory.ts`

**问题**：`advancePlayback` 中 `tiltAlpha` 和 `tiltBeta` 保持当前值不变，回放时 KinematicsPanel 显示的角度是过期的。

**修复**：新增 `TrailPoint` 类型记录 `{ tipPosition, tiltAlpha, tiltBeta, insertionDepth }`，回放时还原完整状态。
**状态**：✅ 已修复

### 2.7 `setIsDraggingNeedle` 未在类型中声明

**位置**：`src/stores/simulationStore.ts`

**问题**：接口 `SimulationState` 缺少 `setIsDraggingNeedle` 声明，但实现中存在。

**修复**：补充到 store 接口和 types/index.ts 中。
**状态**：✅ 已修复

---

## 3. 功能补充

### 3.1 眼球模型增强

- [ ] **虹膜 (Iris)**：角膜后方的彩色环状结构，可随光线变化模拟瞳孔缩放
- [ ] **瞳孔 (Pupil)**：虹膜中心的黑色开口，可动态调节大小
- [ ] **视网膜 (Retina)**：眼球内壁的半透明层，使用 `RETINA_RADIUS` 常量
- [ ] **血管纹理**：巩膜表面的细微血管网络（`meshStandardMaterial` + 自定义纹理贴图）
- [ ] **真实眼球模型导入**：使用 `.gltf` 格式的解剖学精度模型替代几何球体

### 3.2 针具增强

- [x] **针具弯曲**：CurvedNeedleTip.tsx 使用 TubeGeometry + QuadraticBezierCurve3
- [x] **针持 (Needle Holder)**：NeedleHolder.tsx 机器人夹持器可视化
- [x] **穿刺反馈**：TissueDeformation.tsx 巩膜穿刺点凹陷动画
- [x] **碰撞检测**：useCollisionDetection.ts + CollisionIndicator.tsx 高亮提示

### 3.3 交互增强

- [x] **触控支持**：useTouchPinch.ts pinch-to-zoom，Cornea/CollisionIndicator 触摸事件
- [x] **双指缩放**：移动端滚轮替代操作
- [x] **RCM 点拖拽移动**：useMouseControl.ts PLACE 模式拖拽已有 RCM 点，history 自动保存
- [x] **撤销/重做**：Ctrl+Z / Ctrl+Shift+Z 历史记录栈（最多 50 步）
- [ ] **键盘自定义**：允许用户重新映射快捷键

### 3.4 可视化增强

- [x] **RCM 运动学约束线**：RCMConstraintLine.tsx 虚线连接
- [x] **法线指示器**：NormalIndicator.tsx RCM 点处表面法线箭头
- [x] **安全区域锥体**：SafetyCone.tsx 可视化最大倾斜角约束范围
- [x] **深度标尺**：DepthRuler.tsx 针杆刻度标记
- [x] **轨迹热力图**：TrajectoryLines.tsx 时间渐变着色（蓝→青→绿→黄→红）
- [x] **Bloom 后处理**：Scene.tsx EffectComposer + Bloom 辉光
- [x] **环境光遮蔽 (SSAO)**：Scene.tsx SSAO 增加深度感
- [x] **景深 (DOF)**：Scene.tsx DepthOfField 焦点跟随针尖

### 3.5 手术阶段完善

- [x] **WITHDRAWING 相位**：Bug 已修复
- [x] **阶段自动转换**：useAutoPhaseTransition.ts 基于深度自动推进阶段
- [x] **阶段过渡动画**：usePhaseTransition.ts flash 动画
- [x] **阶段声音提示**：usePhaseTransitionSound Web Audio API 提示音

### 3.6 HUD / UI 增强

- [ ] **3D 标注**：使用 drei `Html` 组件在 3D 空间中标注关键点和距离
- [x] **迷你地图 / 俯视图**：MiniMap.tsx 2D 俯视图显示针尖投影
- [x] **实时图表**：RealTimeChart.tsx 插入深度随时间变化折线图（Recharts）
- [x] **设置面板**：SettingsPanel.tsx 调整灯光/材质/轨迹颜色等
- [x] **暗色/亮色主题切换**：themeStore.ts + ControlPanel 切换按钮
- [x] **移动端响应式**：ResponsiveHUD.tsx 小屏幕 HUD 可折叠自适应

### 3.7 数据与导出

- [x] **轨迹导出 JSON/CSV**：export.ts + ControlPanel 导出按钮
- [x] **轨迹导入**：ControlPanel 加载外部轨迹文件回放
- [x] **截图功能**：ControlPanel 一键保存 Canvas 截图
- [x] **屏幕录制**：ControlPanel MediaRecorder API 录制 .webm
- [ ] **操作日志**：记录用户交互操作序列，便于调试

### 3.8 仿真增强

- [x] **多 RCM 点**：rcmPoints[] 支持多个手术入口点，UI 可切换/删除
- [x] **组织弹性模型**：TissueDeformation.tsx 简化形变模拟
- [ ] **力反馈可视化**：针尖受力大小的颜色编码
- [x] **液体模拟**：BloodSimulation.tsx 穿刺时出血效果
- [ ] **重力/惯性**：针具受重力影响的自然下垂

---

## 4. 测试

### 4.1 单元测试补充

- [x] `sphereIntersect.ts` 直接测试（射线擦边、反向射线、零距离）
- [x] Store actions 测试（状态转换逻辑、边界条件）
- [ ] `useTrajectory` hook 测试

### 4.2 组件测试

- [x] `KinematicsPanel` 渲染测试（数值格式化、RCM 为空时的 hint）
- [x] `ControlPanel` 交互测试（滑块值变更、按钮点击）
- [ ] `Needle` 渲染测试（pose 正确时矩阵变换）

### 4.3 集成 / E2E 测试

- [x] Playwright 测试完整交互流程（tests/e2e/simulator.spec.ts）
- [ ] 响应式布局测试（不同视口尺寸）

### 4.4 覆盖率目标

- [x] 配置 `@vitest/coverage-v8`，68 tests 全部通过
- [ ] CI 中集成覆盖率检查（已有 GitHub Actions workflow）

---

## 5. 代码质量

### 5.1 TypeScript

- [x] 启用 `noUncheckedIndexedAccess`
- [x] 启用 `strictNullChecks`
- [ ] 升级 ESLint 为 `tseslint.configs.recommendedTypeChecked` 或 `strictTypeChecked`

### 5.2 格式化

- [x] 安装配置 Prettier + `prettier-plugin-tailwindcss`
- [ ] 配置 git hook（pre-commit）自动格式化

### 5.3 架构

- [x] 提取 `useMouseControl` hook（PLAN.md 中原计划，目前逻辑散落在 `ScleraClickHandler`）
- [x] 轨迹数据结构改为 `{ alpha, beta, depth, tipPosition }` 替代纯 `Vec3[]` (TrailPoint 类型)
- [x] 分离 `ScleraClickHandler` 为 `useMouseControl` + `useKeyboardShortcuts` hooks

### 5.4 性能

- [ ] 轨迹点数组使用 `Float32Array` 替代普通数组（减少 GC 压力）
- [ ] `ScleraClickHandler` 中的 `useFrame` 回调使用 `useRef` 缓存最新值，避免闭包捕获旧状态
- [ ] 考虑 `drei` 的 `Instances` 替代大量独立网格

---

## 6. 基础设施

### 6.1 CI/CD

- [x] GitHub Actions：lint + typecheck + test + e2e + build + deploy 流水线（.github/workflows/ci.yml）
- [x] Playwright E2E 测试集成
- [x] 自动部署到 GitHub Pages

### 6.2 文档

- [x] `README.md`：功能截图、交互说明、架构、CI/CD
- [ ] 添加 `CONTRIBUTING.md`
- [ ] 为 `lib/rcm.ts` 补充 JSDoc 文档注释（已有基础注释）

---

## 优先级建议

| 优先级 | 类别       | 项目                                              | 状态                                        |
| ------ | ---------- | ------------------------------------------------- | ------------------------------------------- |
| P0     | Bug 修复   | 2.1-2.7 全部                                      | ✅ 已完成                                   |
| P0     | 代码质量   | TypeScript 严格模式、Prettier                     | ✅ 已完成                                   |
| P1     | 样式现代化 | TailwindCSS + shadcn/ui                           | ✅ shadcn/ui (Slider/Badge/Button/Tooltip)  |
| P1     | 3D 标注    | drei Html 3D 标注 RCM/深度/法线                   | ✅ Annotations3D.tsx                        |
| P1     | 可视化     | 力反馈着色（银→粉→橙→红）                         | ✅ CurvedNeedleTip 已更新                   |
| P1     | 调试       | 操作日志 console + JSON 导出                      | ✅ useActionLogger.ts                       |
| P1     | 测试       | 68 tests 全通过，E2E 已配置                        | ✅ 核心完成                                 |
| P2     | 3D 增强    | 后处理/法线/安全锥/约束线/标尺/血液/形变/碰撞      | ✅ 全部完成                                 |
| P2     | HUD/UI     | 小地图/图表/设置/主题/响应式                       | ✅ 全部完成                                 |
| P2     | 交互       | 多RCM/拖拽/触控/撤销重做/屏幕录制                  | ✅ 全部完成                                 |
| P2     | 基础设施   | GitHub Actions CI/CD + GitHub Pages deploy         | ✅ 完成                                     |
| P3     | 仿真       | 重力/惯性模拟                                     | 待实现                                      |
| P3     | 测试       | 响应式 E2E 多视口覆盖                             | 待实现                                      |
| P3     | 模型       | 真实 GLTF 解剖学精度眼球模型                       | 待实现                                      |

---

## 下一步任务（Next Steps）

### 短期（Low Effort, High Impact）

- [x] **Pre-commit Hook**：配置 lefthook 或 husky，commit 前自动 lint + format + typecheck
- [x] **ESLint Type-Checked**：升级为 `strictTypeChecked` 类型感知规则
- [x] **补充剩余测试**：`useTrajectory` hook 测试 + `Needle` 组件渲染测试
- [x] **CONTRIBUTING.md**：简单贡献指南，降低协作门槛

### 中期（Feature Enhancements）

- [x] **shadcn/ui 替换原生控件**：Slider/Badge/Button/Tooltip 替换 ControlPanel 原生元素
- [x] **3D 标注 (drei Html)**：Annotations3D.tsx 标注 RCM 坐标、针尖深度、表面法线
- [x] **力反馈可视化**：CurvedNeedleTip 根据插入深度/角度着色（银→粉→橙→红），模拟受力提示
- [x] **操作日志**：useActionLogger.ts 记录交互序列，console 输出 + JSON 导出

### 长期（Advanced Simulation）

- [ ] **重力/惯性模拟**：针具受自然下垂影响，增加仿真真实感
- [ ] **响应式 E2E 测试**：Playwright 多视口测试覆盖移动端
- [ ] **真实 GLTF 模型导入**：替换几何球体为解剖学精度眼球模型
