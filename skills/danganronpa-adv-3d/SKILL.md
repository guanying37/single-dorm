---
name: danganronpa-adv-3d
description: Use when planning, briefing, reviewing, or producing additional Danganronpa-style ADV 3D rooms, modular architecture kits, furniture and prop families, lighting recipes, scene briefs, fixed-camera and moving-camera designs, and Three.js integration for the game. This skill is a scene/asset production kit for new locations — not a one-off specification for the existing dining hall or dormitory. 触发词：弹丸论破、ADV 3D、新场景、房间建模、模块化套件、家具道具、场景简报、固定机位、移动机位、Three.js 场景。
---

# 弹丸论破风格 ADV 3D 场景生产线

## 目标

为这款 ADV 游戏**持续生产新的 3D 场景与资产**：新教室、走廊、体育馆、图书室、裁判场、浴室、庭院、宿舍变体，以及可复用的房间壳、家具族、道具族、材质与灯光预设。

当前餐厅/宿舍只是 reference case，放在 `references/examples/`；不要把它们的桌数、速度、验收数字当成所有新场景的硬规则。

## 已确定的制作方向

| 项 | 决定 |
|---|---|
| 首批 | **教室 → 走廊/玄关 → 体育馆** |
| 后续 | 图书室、裁判场、浴室/更衣室、庭院、宿舍变体 |
| 场景形态 | **固定机位与移动机位是两个独立 reference**；同一场景可同时支持，但分别设计与验收 |
| 资产粒度 | **模块化套件 + 家具/道具库优先**，再拼房间 |
| 运行时 | **Three.js 网页优先**；按米制/PBR/glTF 友好方式建，暂不做 Unity/Unreal 双管线 |
| 风格 | **自然写实骨架 + 弹丸论破式图形点缀** |
| 预算 | **移动机位** ≤45 万三角面 / ≤90 draw calls；**固定机位** ≤25 万 / ≤60 |
| 当前餐厅/宿舍 | 降级为 examples，不再作为 skill 中心 |

## 硬规则

1. **先有场景简报，再建模**。没有场地、剧情功能、镜头、交互和资产清单，不要直接拉几何。
2. **不做一次性房间**。新房间优先由现有 kit 拼装；缺少的模块补进 kit，不要复制整面墙。
3. **一间房只建一次**。固定机位和移动机位共用同一模型；两种机位是两套**设计与验收 reference**，不是两套几何。
4. **固定机位与移动机位分开设计、分开验收**。不能拿固定镜头的标准验收移动场景，也不能拿移动场景的标准要求固定镜头补全不可达空间。
5. **完全离线**：无 CDN、无外部字体、无网络请求；Three.js 与素材本地化。
6. **场景内无人物、无文字/字体贴图、无音频**。UI 文字不算场景贴图。
7. **不自行绘制新的二维画作**：画像/海报必须使用已提供参考图，或用程序化 3D 浅浮雕；不要生成文字标签。
8. **影子方向必须与主灯一致**。顶灯照明的室内，投影主光默认垂直向下 `(0,-1,0)`；窗光/日光只做非投影填充，不能另造侧向影子。
9. **本地必须通过 HTTP 打开**；`file://` 下显示明确提示，不能白屏。
10. **不能出现门后套门、漂浮叶片、整块桌位碰撞盒、明显穿模、黑洞和接缝**。
11. **单场景必须可独立验收**：资产清单、截图、碰撞、交互、性能数据缺一不可。

## 固定机位 vs 移动机位

这是两个不同的 reference，必须先判断当前场景属于哪一种；如果同时支持，则两份 spec/验收都要做。

| | 固定机位 `camera-fixed.md` | 移动机位 `camera-moving.md` |
|---|---|---|
| 谁控制镜头 | 作者/脚本 | 玩家 |
| 空间要求 | 只建镜头可见面，镜头外可省略 | 玩家可达区域必须完整 |
| 碰撞 | 不要求可行走 | 必须有碰撞 |
| 机位 | 3–5 个 shot（position/target/fov） | start + 第一人称相机 |
| 性能 | ≤25 万 / ≤60 | ≤45 万 / ≤90 |
| 验收 | 构图/穿帮/镜头切换 | 走遍全场景/碰撞/卡死 |
| 典型 | 裁判场、审讯、回忆、过场 | 教室、走廊、宿舍、庭院 |

同一场景同时支持两者时：

- 只建一份模型；
- 固定 shot 和移动 start 分开写；
- 固定 shot 只验收画面，移动模式只验收可达空间；
- 不要用固定镜头“看不见”来掩盖移动模式的漏洞。

## 读取顺序

| 任务 | 文件 |
|---|---|
| 看整体批次、里程碑与优先级 | `references/production-plan.md` |
| 定风格、色板、材质与造型语言 | `references/art-direction.md` |
| 写/审一份新场景简报 | `references/scene-brief.md` |
| 设计固定 ADV 机位、构图、镜头切换 | `references/camera-fixed.md` |
| 设计移动/第一人称机位、碰撞、动线 | `references/camera-moving.md` |
| 建房间壳、门窗、墙地顶模块 | `references/modular-kit.md` |
| 选/做家具与道具 | `references/furniture-and-props.md` |
| 给场景配灯光与阴影 | `references/lighting-recipes.md` |
| 接入场景类、固定 shot / 移动 start、注册表 | `references/runtime-integration.md` |
| 控预算、合批、LOD、纹理 | `references/performance.md` |
| 做资产/场景验收 | `references/validation.md` |
| 看当前餐厅/宿舍怎样当示例 | `references/examples/dining-hall.md` / `dormitory.md` |

不要一次加载全部。先读 `production-plan.md` 和 `scene-brief.md`，再按当前任务读专项。机位设计一定先分清固定还是移动。

## 新场景从 0 到接入

### 0. 读游戏资料

- 地点在剧情中的功能：日常、探索、审判前、回忆、过场。
- 已有资产：哪些墙/门窗/家具/灯具可以复用。
- 角色动线：从哪进、到哪停、镜头看哪里。
- 时间/天气/光线：白天、黄昏、夜晚、停电、雨天。
- 禁忌：不能出现的角色、文字、剧情信息。

### 1. 写场景简报

用 `templates/scene-brief.md`。至少写清：

- `sceneId`、中文名、地点类型；
- 剧情功能与出现章节；
- 尺寸、层高、门洞、连接房间；
- 固定机位 / 移动机位 / 两者都要；
- 固定机位：3–5 个 shot（position/target/fov/用途）；
- 移动机位：start、眼高、玩家半径、动线、碰撞；
- 交互物；
- 家具/道具清单；
- 复用 kit 模块与新增模块；
- 灯光配方；
- 性能预算（按固定/移动分别）；
- 参考图/色板。

简报不完整，不进入建模。

### 2. 空间程序与 blockout

- 先定房间尺寸、墙厚、门洞、窗、层高、动线。
- 用 1 unit = 1 m；网格 0.25 m。
- **只有移动机位**才用 0.30 m 玩家半径检查门洞与桌间通道；固定机位不要求可行走。
- 先做灰盒与相机，不做材质细节。
- 固定机位：确认每个 shot 的构图、前景/中景/背景。
- 移动机位：确认“从门口走进去”的动线、可达区域和遮挡。

### 3. 选 kit，不重复造墙

- 墙/地/顶/门窗/线脚/踢脚从 `modular-kit.md` 取。
- 缺少的模块按命名、pivot、UV、碰撞规则补进 kit。
- 所有模块的接缝、门洞、转角必须能拼。
- 新模块要能复用到至少两个场景，否则先标记为 one-off。

### 4. 家具与道具

- 先选家具族：桌、椅、柜、床、书架、讲台、器材。
- 再选道具族：书、纸、杯子、餐具、灯具、监控、扬声器。
- 每件资产有：真实尺寸、pivot、collider、材质槽、变体。
- 不做没有复用价值的“英雄道具”；剧情特写道具可以 one-off，但要单独标注。

### 5. 材质与灯光

- 从 `art-direction.md` 选材质族，不每件资产新建材质。
- 从 `lighting-recipes.md` 选灯光配方。
- 顶灯室内：主光垂直向下；窗光/日光作非投影填充。
- 阴影只烘焙一次；动态门/抽屉不投影。
- 不使用 Bloom/SSAO。

### 6. 场景类与机位

- 用 `templates/scene-adapter.js` 的接口。
- 固定机位：`cameraModes.fixed.anchors`；每个 shot 有 position/target/fov/用途；不要求 collision。
- 移动机位：`cameraModes.moving.start/collision/eyeHeight/playerRadius`；第一人称相机。
- 同一场景两者都要：两套配置分开写、分开验收；不复制模型。
- ADV 模式切到 `cameraModes.fixed.anchors`；walk 模式回到 `cameraModes.moving.start`；切换不重置场景。

### 7. 优化

- 按材质合并静态几何；场景稳定后不再新增 geometry。
- 纹理 ≤16 MB，单图 ≤1024²。
- **移动机位** ≤45 万三角面 / ≤90 draw calls；**固定机位** ≤25 万 / ≤60。
- 需要时做 LOD / 贴图图集；不牺牲碰撞（移动）和镜头构图（固定）。

### 8. 注册与接入

- 在场景注册表添加 `sceneId`、标题、加载器、模式、入口。
- 同页切换时只渲染当前场景；保存/恢复视角，清空按键。
- 独立预览页可用，但不能作为唯一入口。
- 更新场景清单、资产清单、预览图。

### 9. 验收与交接

- 按 `validation.md` 分别跑固定机位 gate 与移动机位 gate。
- 输出：场景截图、资产清单、性能数据、未完成项。
- 交接给“建模提示词”阶段时，给完整 brief + spec + 两份机位参考（按适用），不要让下一阶段猜。

## 资产标准

| 项 | 标准 |
|---|---|
| 单位 | 1 unit = 1 m |
| 网格 | 0.25 m |
| 门高 | 2.2 m |
| 眼高 | 1.8 m |
| 玩家半径 | 0.30 m |
| 墙厚 | 0.18–0.26 m |
| 层高 | 2.7–4.2 m（按场景） |
| 命名 | `room.classroom` / `kit.wall.straight` / `prop.desk.student` / `mat.floor.wood` |
| pivot | 家具在底部中心；门在铰链；墙在底部中心 |
| forward | +Z 为正面；统一朝向约定 |
| 材质槽 | 木、金属、布、玻璃、纸、塑料、发光体 |
| 碰撞 | 墙 AABB/OBB；家具 OBB；小道具可无碰撞 |

## 交付物

每个新场景至少交付：

- `scene.<id>.js` 或等价场景模块；
- `scene-spec.yaml`（见 `templates/scene-spec.yaml`）；
- `asset-list.md`（见 `templates/asset-list.md`）；
- 固定机位：shot list（position/target/fov/用途）+ 每个 shot 的截图；
- 移动机位：start/动线/碰撞测试记录 + 可达区域截图；
- 两者都要：以上两份都要，不能只交一份；
- 性能数据（FPS / draw calls / 三角面 / 纹理）；
- 场景注册表条目；
- 未完成项与 one-off 资产说明。

## 绝对不要做

- 把当前餐厅的 10 桌、6.2 m/s 当成所有场景的规则。
- 每间房从零建墙、从零建桌椅。
- 先做模型，再补场景简报。
- 把固定机位和移动机位当成同一个 reference；它们要分开设计、分开验收。
- 用固定机位的“看不见”掩盖移动机位的黑洞/碰撞问题。
- 用移动机位的完整空间要求去强迫纯过场场景补全不可达区域。
- 用侧向光制造“立体感”，导致影子方向与主灯矛盾。
- 用自绘二维图当画像/海报。
- 用漂浮面片当树叶、纸张或装饰。
- 只改代码不跑页面，凭代码判断“应该没问题”。

## 下一步

先按 `production-plan.md` 做 **教室纵向样板** 的简报与资产清单；建模提示词和实际几何在下一阶段再生成。当前不要直接开始建教室。教室要同时写固定机位与移动机位两套 spec。
