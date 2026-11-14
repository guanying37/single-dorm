# 场景运行时与接入

目标：新房间不是孤立 demo，而是能注册、能切换、能用于 ADV 机位的场景模块。

## 1. 场景适配器

每个场景导出一个工厂。固定机位与移动机位是两套配置，不要混成一个 `mode` 布尔：

```js
// scene.classroom.js
export function createClassroomScene({ renderer, materials, kit }) {
  const scene = new THREE.Scene();

  return {
    id: 'scene.classroom',
    title: '教室',
    scene,
    cameraModes: {
      fixed: {
        enabled: true,
        anchors: [
          { id: 'teacher', position: [0, 1.65, -2.7], target: [0, 1.0, 2.0], fov: 62 },
        ],
      },
      moving: {
        enabled: true,
        start: { x: 0, z: 5.2, yaw: 0, pitch: 0 },
        collision: null, // CollisionWorld
        eyeHeight: 1.8,
        playerRadius: 0.3,
      },
    },
    interactiveMeshes: [],
    interactiveById: new Map(),
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
- `fixed.enabled` 与 `moving.enabled` 独立；只做一种时，另一种可以为空。

## 2. 机位模式

| 模式 | 需要 | 用途 | 验收 reference |
|---|---|---|---|
| 固定 `fixed` | `cameraModes.fixed.anchors` | 纯 ADV/过场/回忆 | `camera-fixed.md` |
| 移动 `moving` | `start`、`collision`、第一人称控制器 | 探索/走廊/日常 | `camera-moving.md` |
| 两者 `both` | 两套配置 | 可走 + 剧情机位 | 两份都要 |

默认按场景需求选择；不要默认所有场景都 `both`。

## 3. 固定机位

```yaml
fixed:
  enabled: true
  anchors:
    - id: teacher
      position: [0, 1.65, -2.7]
      target: [0, 1.0, 2.0]
      fov: 62
      use: 上课/俯视
```

规则：

- 3–5 个；每个有明确用途。
- 机位不穿墙/家具；y 在 1.4–1.8 m 之间。
- 构图有前景/中景/背景差异。
- 只验收镜头内画面；不要求可行走。
- 不在锚点位置生成角色模型。

## 3.1 移动机位

```yaml
moving:
  enabled: true
  start: { x: 0, z: 5.2, yaw: 0, pitch: 0 }
  eyeHeight: 1.8
  playerRadius: 0.30
  collision: CollisionWorld
```

规则：

- 所有可达区域完整、有碰撞。
- 门洞/主通道可过；不能出现黑洞。
- 第一人称相机；不把固定 shot 当玩家视角。
- 与固定机位共用模型；切换时保存/恢复 walk 视角。

## 4. 场景注册表

```js
// scenes/registry.js
export const SCENES = {
  'scene.dining-hall': {
    title: '学生餐厅',
    load: () => import('./scene.dining-hall.js'),
    modes: ['fixed', 'moving'],
  },
  'scene.classroom': {
    title: '教室',
    load: () => import('./scene.classroom.js'),
    modes: ['fixed', 'moving'],
  },
  'scene.trial': {
    title: '裁判场',
    load: () => import('./scene.trial.js'),
    modes: ['fixed'],
  },
};
```

- `sceneId` 唯一、稳定。
- 懒加载：进入场景才 import。
- 同页切换只渲染 active scene。
- 切换保存/恢复视角，清空按键，重置 frozen。
- `modes` 表明这个场景支持哪些机位；纯固定场景不要假装支持移动。

## 5. 场景外壳状态

```js
{
  activeId,
  cameraMode: 'fixed' | 'moving',
  fixed: {
    active: Boolean,
    anchorId: String | null,
  },
  moving: {
    walkView: { x, z, yaw, pitch } | null,
  },
  frozen,
  hovered,
}
```

切换规则：

1. 保存当前 `walkView`（如果移动模式）；
2. 禁用旧控制器、清空按键；
3. 切换 active scene；
4. 固定模式：应用 `cameraModes.fixed.anchors` 的 anchor；
5. 移动模式：恢复 `walkView` 或 `start`；
6. 重置 frozen；
7. 触发阴影重烘焙；
8. 刷新 hover/提示。

不要用一个 `mode` 字段同时承担“场景类型”和“相机状态”；固定/移动分开记录。

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
- [ ] `cameraModes.fixed` 与 `moving` 独立配置。
- [ ] 固定机位只验收镜头；移动机位只验收可达空间。
- [ ] 同场景两者都要时，共用模型、分开 spec/验收。
- [ ] 切换不刷新、不丢视角、不残留按键。
- [ ] 只渲染 active scene。
- [ ] 场景模块不依赖全局状态。
- [ ] 本地服务器可启动；`file://` 有提示。
- [ ] 无 404、无 console error。
