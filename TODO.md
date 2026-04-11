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

- [ ] **针具弯曲**：手术针实际是弧形（curved needle），使用 `TubeGeometry` + 曲线
- [ ] **针持 (Needle Holder)**：机器人夹持器的可视化
- [ ] **穿刺反馈**：针尖接触角膜/巩膜时的形变动画（使用 `@react-spring/three`）
- [ ] **碰撞检测**：针尖与眼球表面的碰撞高亮提示

### 3.3 交互增强

- [ ] **触控支持**：移动端触摸事件替代鼠标拖拽
- [ ] **双指缩放**：移动端滚轮替代操作
- [ ] **RCM 点拖拽移动**：允许用户拖动已有的 RCM 点到新位置
- [ ] **撤销/重做** (Ctrl+Z / Ctrl+Shift+Z)：历史记录栈
- [ ] **键盘自定义**：允许用户重新映射快捷键

### 3.4 可视化增强

- [x] **RCM 运动学约束线**：从 RCM 点到针尖的虚线连接 (RCMConstraintLine.tsx)
- [ ] **法线指示器**：RCM 点处的表面法线箭头
- [ ] **安全区域锥体**：可视化最大倾斜角约束范围
- [x] **深度标尺**：针杆上的刻度标记 (DepthRuler.tsx)
- [ ] **轨迹热力图**：轨迹线根据速度/时间渐变颜色
- [ ] **Bloom 后处理**：RCM 指示器、针尖的发光效果
- [ ] **环境光遮蔽 (SSAO)**：增加 3D 深度感
- [ ] **景深 (DOF)**：焦点跟随针尖，背景模糊

### 3.5 手术阶段完善

- [x] **WITHDRAWING 相位**：修复后实际使用 (P0 bug fix)
- [ ] **阶段自动转换**：基于插入深度/时间自动推进阶段
- [ ] **阶段过渡动画**：阶段切换时的视觉过渡效果
- [ ] **阶段声音提示**：使用 Web Audio API 播放阶段切换提示音

### 3.6 HUD / UI 增强

- [ ] **3D 标注**：使用 drei `Html` 组件在 3D 空间中标注关键点和距离
- [ ] **迷你地图 / 俯视图**：2D 俯视图显示针尖相对于眼球的投影位置
- [ ] **实时图表**：插入深度随时间变化的折线图
- [ ] **设置面板**：调整灯光强度、材质透明度、轨迹颜色等
- [ ] **暗色/亮色主题切换**
- [ ] **移动端响应式**：小屏幕下 HUD 自适应或可折叠

### 3.7 数据与导出

- [x] **轨迹导出 JSON/CSV**：保存录制的轨迹数据 (export.ts)
- [x] **轨迹导入**：加载外部轨迹文件进行回放 (export.ts + store.importTrailData)
- [x] **截图功能**：一键保存当前 Canvas 截图 (ControlPanel)
- [ ] **屏幕录制**：使用 `MediaRecorder` API 录制仿真过程
- [ ] **操作日志**：记录用户交互操作序列，便于调试

### 3.8 仿真增强

- [ ] **多 RCM 点**：支持多个手术入口点
- [ ] **组织弹性模型**：简化的弹簧-质量系统模拟组织形变
- [ ] **力反馈可视化**：针尖受力大小的颜色编码
- [ ] **液体模拟**：穿刺时的模拟出血效果
- [ ] **重力/惯性**：针具受重力影响的自然下垂

---

## 4. 测试

### 4.1 单元测试补充

- [ ] `sphereIntersect.ts` 直接测试（射线擦边、反向射线、零距离）
- [ ] Store actions 测试（状态转换逻辑、边界条件）
- [ ] `useTrajectory` hook 测试

### 4.2 组件测试

- [ ] `KinematicsPanel` 渲染测试（数值格式化、RCM 为空时的 hint）
- [ ] `ControlPanel` 交互测试（滑块值变更、按钮点击）
- [ ] `Needle` 渲染测试（pose 正确时矩阵变换）

### 4.3 集成 / E2E 测试

- [ ] Playwright 测试完整交互流程：点击眼球 → 拖拽倾斜 → 滚轮插入 → 轨迹录制 → 回放
- [ ] 响应式布局测试（不同视口尺寸）

### 4.4 覆盖率目标

- [ ] 配置 `@vitest/coverage-v8`，目标 80%+ 行覆盖率
- [ ] CI 中集成覆盖率检查

---

## 5. 代码质量

### 5.1 TypeScript

- [ ] 启用 `noUncheckedIndexedAccess`
- [ ] 启用 `strictNullChecks`（可能已启用，需验证）
- [ ] 升级 ESLint 为 `tseslint.configs.recommendedTypeChecked` 或 `strictTypeChecked`

### 5.2 格式化

- [ ] 安装配置 Prettier
- [ ] 配置 `prettier-plugin-tailwindcss`（如果引入 Tailwind）
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

- [ ] GitHub Actions：lint + typecheck + test 流水线
- [ ] Playwright E2E 测试集成
- [ ] 自动部署到 Vercel / Netlify / GitHub Pages

### 6.2 文档

- [ ] 更新 `README.md`：添加截图/GIF、运行说明、交互说明
- [ ] 添加 `CONTRIBUTING.md`
- [ ] 为 `lib/rcm.ts` 添加 JSDoc 文档注释

---

## 优先级建议

| 优先级 | 类别       | 项目                                    | 状态                                  |
| ------ | ---------- | --------------------------------------- | ------------------------------------- |
| P0     | Bug 修复   | 2.1-2.7 全部                            | ✅ 已完成                             |
| P0     | 代码质量   | TypeScript 严格模式、Prettier           | ✅ 已完成                             |
| P1     | 样式现代化 | TailwindCSS + shadcn/ui                 | ✅ Tailwind 已完成，shadcn 可按需引入 |
| P1     | 测试       | sphereIntersect 测试、Store 测试        | ✅ 34 tests 全部通过                  |
| P1     | 架构       | 提取 useMouseControl hook               | ✅ 已完成                             |
| P2     | 3D 增强    | RCM约束线、深度标尺、截图、轨迹导入导出 | ✅ 已完成                             |
| P2     | 文档       | lib/rcm.ts JSDoc 文档注释               | ✅ 已完成                             |
| P2     | 3D 增强    | 后处理 (Bloom/DOF)、法线指示器          | 待实现                                |
| P2     | 功能       | 触控、阶段完善                          | 待实现                                |
| P3     | 仿真       | 组织弹性、液体模拟等高级特性            | 待实现                                |
| P3     | 基础设施   | CI/CD、文档                             | 待实现                                |
