# 场景运行时与接入

目标：新房间不是孤立 demo，而是能注册、能切换、能用于 ADV 机位的场景模块。

## 1. 场景适配器

每个场景导出一个工厂：

```js
// scene.classroom.js
export function createClassroomScene({ renderer, materials, kit }) {
  const scene = new THREE.Scene();
  // build room...
  return {
    id: 'scene.classroom',
    title: '教室',
    mode: 'hybrid',                 // walk | fixed | hybrid
    scene,
    cameraAnchors: [
      { id: 'teacher', position: [0, 1.65, -2.7], yaw: 0, pitch: -0.05, fov: 62 },
    ],
    interactiveMeshes: [],
    interactiveById: new Map(),
    collision: null,                // walk/hybrid 需要
    start: { x: 0, z: 5.2, yaw: 0, pitch: 0 },
    eyeHeight: 1.8,
    playerRadius: 0.3,
    update(dt, elapsed) {},
    toggleInteractive(id) {},
    getInteractiveState() {},
    dispose() {},
  };
}
```

要求：

- 不直接操作全局 renderer 状态（除传入的 renderer 资源）。
- 不创建第二个 renderer。
- 不把固定机位做成第二套模型。
- 不把场景内容写进 `hub.js`。

## 2. 模式

| 模式 | 需要 | 用途 |
|---|---|---|
| `walk` | collision、start、FirstPersonControls | 探索 |
| `fixed` | cameraAnchors | 纯 ADV/过场 |
| `hybrid` | 两者 | 日常可走 + 剧情机位 |

`hybrid` 是默认。纯剧情小房间可以 `fixed`。

## 3. 相机锚点

```yaml
cameraAnchors:
  - id: teacher
    position: [0, 1.65, -2.7]
    yaw: 0
    pitch: -0.05
    fov: 62
    use: 上课/俯视
```

规则：

- 3–5 个；每个有明确用途。
- 机位不穿墙/家具；y 在 1.4–1.8 m 之间。
- 构图有前景/中景/背景差异。
- ADV 切换时保留/恢复玩家视角；退出机位回到 walk 位置。
- 不在锚点位置生成角色模型。

## 4. 场景注册表

```js
// scenes/registry.js
export const SCENES = {
  'scene.dining-hall': {
    title: '学生餐厅',
    load: () => import('./scene.dining-hall.js'),
    mode: 'hybrid',
  },
  'scene.classroom': {
    title: '教室',
    load: () => import('./scene.classroom.js'),
    mode: 'hybrid',
  },
};
```

- `sceneId` 唯一、稳定。
- 懒加载：进入场景才 import，避免同时把所有场景加载进内存。
- 同页切换只渲染 active scene。
- 切换保存/恢复视角，清空按键，重置 frozen。

## 5. 场景外壳状态

```js
{
  activeId,
  mode,                 // walk/fixed/hybrid
  walkView,             // 玩家位置
  anchorId,             // 当前 ADV 机位
  frozen,
  hovered,
}
```

切换规则：

1. 保存当前 walk 视角；
2. 禁用旧控制器、清空按键；
3. 切换 active scene；
4. 恢复目标 walk 视角或相机锚点；
5. 重置 frozen；
6. 触发阴影重烘焙；
7. 刷新 hover/提示。

## 6. 资产加载

- 材质/纹理按场景或共享库加载。
- 共享材质只创建一次；场景 dispose 不销毁共享材质。
- 场景专用纹理随场景释放。
- 加载失败要有 visible fallback，不要白屏。
- 本地资源路径用相对路径；无外部 URL。

## 7. 本地预览

- `serve.py` / `start-preview.cmd` 放在项目根。
- 默认打开 `/#scene.classroom` 或 `/#dining`（按项目路由）。
- 端口占用时打开已有预览。
- `file://` 显示“需要通过本地服务器打开”。

## 8. 与 ADV 引擎的边界

- 场景模块只负责：几何、材质、灯光、碰撞、交互、相机锚点。
- 不负责：对话、角色、UI 剧情、存档。
- 对外 API 保持稳定，方便 ADV 引擎调用。
- 需要剧情状态时，用 `setState({ lightsOn, locked, ... })`，不要直接改内部 mesh。

## 9. 文件组织

```text
src/scenes/
├─ registry.js
├─ scene.classroom.js
├─ scene.corridor.js
├─ scene.gym.js
└─ shared/
   ├─ kit.js
   ├─ materials.js
   └─ props.js
```

## 10. 验收

- [ ] 场景可注册、可切换。
- [ ] 同一模型支持 walk + camera anchors。
- [ ] 切换不刷新、不丢视角、不残留按键。
- [ ] 只渲染 active scene。
- [ ] 场景模块不依赖全局状态。
- [ ] 本地服务器可启动；`file://` 有提示。
- [ ] 无 404、无 console error。
