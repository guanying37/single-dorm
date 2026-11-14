# 场景简报

一份合格的简报，必须让建模者不看聊天记录也能知道：**这是什么地方、为什么存在、镜头看哪里、用什么资产、性能到什么程度**。

没有简报，不建模。

## 1. 必填字段

```yaml
sceneId: scene.classroom
name: 教室
locationType: classroom
chapter: "第一章日常"
function: "日常对话、上课、放学后探索"
mood: "明亮、秩序、轻微不安"
timeOfDay: "下午"
weather: "晴"
mode: hybrid            # walk | fixed | hybrid
dimensions:
  width: 8.6
  depth: 7.2
  height: 3.2
connections:
  - id: corridor.1f
    door: south
    type: single
playerStart:
  x: 0
  z: 5.2
  yaw: 0
cameraAnchors:
  - id: teacher
    position: [0, 1.65, -2.7]
    yaw: 0
    fov: 62
  - id: back
    position: [0, 1.7, 5.4]
    yaw: 180
    fov: 60
  - id: window
    position: [2.8, 1.55, 0.5]
    yaw: -70
    fov: 55
interactables:
  - id: door.main
    label: 教室门
    type: door
  - id: locker.1
    label: 储物柜
    type: cabinet
assets:
  reuse:
    - kit.wall.straight
    - kit.wall.corner
    - kit.floor.wood
    - kit.ceiling.flat
    - kit.door.single
    - kit.window.classroom
    - prop.desk.student
    - prop.chair.student
    - prop.clock.wall
  new:
    - prop.chalkboard.blank
    - prop.lectern.teacher
    - prop.locker.tall
lighting:
  recipe: classroom.day
  keyShadow: vertical-down
  windowFill: non-shadow
  fixtures:
    - ceiling.fluorescent.row
    - window.daylight
budget:
  triangles: 350000
  drawCalls: 70
  texturesMB: 12
references:
  - "art-direction.md"
  - "examples/dining-hall.md"
```

## 2. 字段说明

### 剧情功能

- 这个场景承担什么：日常、探索、审判前、回忆、过场。
- 哪些剧情节点必须在这里发生。
- 哪些角色/物件必须可见（但不建模人物）。
- 哪些信息不能让玩家看到。

### 空间

- 为什么是这个尺寸？
- 门/窗/走廊连接哪里？
- 玩家从哪进、视线第一落点是什么？
- 有没有必须保留的遮挡/纵深/死角？

### 相机锚点

- 3–5 个；每个有 `id`、位置、yaw、pitch、fov、用途。
- 机位必须能站人、不穿墙、不穿家具。
- 机位之间要有构图差异，不要全在同一高度/角度。
- 可走场景也要给 ADV 机位；纯机位场景可以没有 playerStart。

### 交互

- 门、柜、抽屉、时钟、灯开关、可拾取物。
- 哪些只是提示（锁定门），哪些可改变状态。
- 保留 `sceneId` 钩子的区域。

### 资产

- `reuse`：从 kit/资产库取。
- `new`：需要新增，写清为什么不能复用。
- 每个新资产给尺寸、材质槽、collider、pivot。
- 不允许“先做再说”。

### 灯光

- 选一个配方，不要每盏灯自由发挥。
- 主光/阴影方向、窗光、灯具清单。
- 是否有停电/夜晚/红光等剧情变体。

### 预算

- 三角面、draw calls、纹理 MB。
- 可走/纯机位按 `performance.md` 的上限。
- 超出预算要写明取舍。

## 3. 教室简报示例（只做规划，不建模）

### 定位

- 1F 普通教室，日常对话与放学后探索。
- 24 套学生课桌，6 列 × 4 排；讲台在黑板前。
- 南墙单开门接走廊；东/西墙大窗；北墙黑板。
- 后墙储物柜与空白布告板。

### 机位

| id | 位置 | 看什么 | 用途 |
|---|---|---|---|
| `teacher` | 讲台后 | 学生席与窗 | 上课/俯视 |
| `back` | 后排 | 黑板与讲台 | 日常对话 |
| `door` | 门口 | 教室纵深 | 进入/离开 |
| `window` | 窗边 | 桌椅与光 | 特写/独白 |
| `desk` | 某张课桌旁 | 桌面道具 | 线索特写 |

### 资产

- 复用：墙/地/顶/门/窗/线脚/课桌/椅子/挂钟/顶灯。
- 新增：空白黑板、讲台、储物柜、布告板（无文字）、窗帘。
- 桌面道具：书、纸、笔、橡皮；不生成可读文字。

### 灯光

- 顶灯两排，主光垂直向下。
- 窗光为非投影填充；不产生侧向影子。
- 下午暖白，轻微窗边过曝。

### 预算

- 可走：≤35 万三角面，≤70 draw calls，纹理 ≤12 MB。
- 24 套桌椅必须合批；桌面道具按材质合并。

## 4. 简报审查

- [ ] 一句话能说清“这是哪、为什么存在”。
- [ ] 尺寸、层高、门洞、连接房间明确。
- [ ] 有 3–5 个可用机位。
- [ ] 交互物有 id、类型、行为。
- [ ] 资产分 reuse/new，新增有理由。
- [ ] 灯光配方明确，影子方向明确。
- [ ] 预算明确。
- [ ] 禁忌（角色/文字/剧情）明确。

## 5. 交接给建模提示词阶段

简报通过后，再写建模提示词。提示词至少引用：

- `sceneId` 与空间程序；
- kit 模块清单；
- 家具/道具清单与尺寸；
- 相机锚点；
- 材质族/灯光配方；
- 预算与验收；
- 参考图/色板。

不要在这个阶段直接生成几何；先让简报和资产清单稳定。
