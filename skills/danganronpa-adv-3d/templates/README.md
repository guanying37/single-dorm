# 模板使用说明

这些模板是可复制的起点，不是可直接发布的最终场景。保留接口/碰撞/输入契约，替换几何、材质、布局与文案。

## 目录

```text
templates/
├─ scaffold/
│  ├─ index.html          # HUD、import map、canvas
│  ├─ styles.css          # 预览 UI
│  └─ src/
│     ├─ hub.js           # 双场景切换、路由、输入、FPS
│     └─ scenes/
│        ├─ dorm.js       # 固定视点场景适配器（占位）
│        └─ dining.js     # 行走场景适配器（占位）
├─ runtime/
│  ├─ first-person.js     # 行走、晃动、回正
│  ├─ collision.js        # 圆 vs OBB/AABB
│  └─ static-builder.js   # 按材质静态批处理
├─ preview/
│  ├─ serve.py            # 本地服务器
│  └─ start-preview.cmd   # Windows 一键启动
└─ validation/
   ├─ capture.mjs         # CDP 截图/console 检查
   └─ checklist.md        # 验收清单
```

## 最小可用步骤

1. 新建项目目录。
2. 复制 `scaffold/` 到项目根目录。
3. 复制 `runtime/` 到 `runtime/`（与 scaffold 的 `src/hub.js` 相对路径保持一致）。
4. 把本地 `three.module.min.js` 与它依赖的 `three.core.min.js` 一起放到 `vendor/`。
5. 把 `preview/serve.py` 与 `start-preview.cmd` 放到项目根目录。
6. 启动服务器，替换 `scenes/dorm.js` / `scenes/dining.js` 的占位几何。

## 场景适配器契约

`src/hub.js` 只依赖以下接口：

```js
{
  title: string,
  eyebrow: string,
  scene: THREE.Scene,
  interactiveMeshes: THREE.Object3D[],
  interactiveById: Map<string, item>,
  update(dt, elapsed): void,
  toggleInteractive(id): item | null,
  setInteractive?(id, open): item | null,
  getInteractiveState(): item[],

  // 固定视点场景（dorm）：
  cameraHome: { position: Vector3, yaw, pitch, fov },

  // 行走场景（dining）：
  start: { x, z, yaw, pitch, fov },
  collision: CollisionWorld,
  eyeHeight?: number,
  playerRadius?: number,
}
```

`item`：

```js
{ id, label, target: 0|1, open: boolean, locked?: boolean, mesh?: Object3D }
```

## 不要做

- 不要直接从 `templates/` 运行；路径与 vendor 是占位。
- 不要把 `hub.js` 改成“两个独立页面”。
- 不要删除 `FirstPersonControls` 的碰撞/清键/视角保存逻辑。
- 不要把占位场景当成最终质量；必须替换为项目几何。
- 不要让模板里的侧向补光进入最终场景；所有投影主光垂直向下。

## 校验

```powershell
node --check templates/runtime/first-person.js
node --check templates/runtime/collision.js
node --check templates/runtime/static-builder.js
node --check templates/scaffold/src/hub.js
node --check templates/scaffold/src/scenes/dorm.js
node --check templates/scaffold/src/scenes/dining.js
python -m py_compile templates/preview/serve.py
node --check templates/validation/capture.mjs
```

语法检查通过不等于场景通过；还要按 `references/validation.md` 跑页面。
