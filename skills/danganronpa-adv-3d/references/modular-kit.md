# 模块化房间套件（Kit）

目标：新房间优先拼装，不重复建墙、门窗、线脚和天花。kit 是生产线的基础资产。

## 1. 基本尺度

| 项 | 标准 |
|---|---|
| 单位 | 1 unit = 1 m |
| 网格 | 0.25 m |
| 墙厚 | 0.18 / 0.22 / 0.26 m 三档 |
| 门高 | 2.2 m |
| 门宽 | 0.9 / 1.0 / 1.4 / 2.8 m |
| 窗台高 | 0.9 m |
| 窗顶 | 2.1–2.4 m |
| 层高 | 2.7 / 3.0 / 3.2 / 4.2 m |
| 踢脚 | 高 0.10–0.15 m，厚 0.015 m |
| 椅线 | 高 0.95–1.05 m |

## 2. 模块分类

### 2.1 墙体

| id | 说明 |
|---|---|
| `kit.wall.straight` | 直墙，标准长度 1/2/4 m |
| `kit.wall.corner` | 内/外转角 |
| `kit.wall.end` | 墙端收口 |
| `kit.wall.doorway` | 门洞墙段 |
| `kit.wall.window` | 窗洞墙段 |
| `kit.wall.pilaster` | 壁柱/线脚 |
| `kit.wall.half` | 半墙/矮墙 |

规则：

- 墙段以底部中心为 pivot。
- 门洞、窗洞左右留 0.07 m 门套/窗套位。
- 转角模块不能重叠；接缝处用同材质压条或对齐 UV。
- 墙段正反面都可用；背面不能漏光/漏面。

### 2.2 地面/天花

| id | 说明 |
|---|---|
| `kit.floor.tile` | 石材/瓷砖地面，900/600/300 模数 |
| `kit.floor.wood` | 木地板，板宽 0.12–0.2 m |
| `kit.floor.concrete` | 水泥/室外 |
| `kit.ceiling.flat` | 平顶 |
| `kit.ceiling.tray` | 跌级顶 |
| `kit.ceiling.beam` | 横梁 |
| `kit.ceiling.coffer` | 格栅/井字顶 |

规则：

- 以房间中心或 0.25 m 网格对齐。
- UV 按米制，纹理不拉伸。
- 地面边界要与墙厚匹配，不能留缝。
- 天花灯具开孔与灯具模块对齐。

### 2.3 门

| id | 说明 |
|---|---|
| `kit.door.single` | 单开，0.9/1.0 m |
| `kit.door.double` | 双开，1.4/2.8 m |
| `kit.door.sliding` | 推拉门 |
| `kit.door.gate` | 铁栅/防盗门 |
| `kit.door.frame` | 门套 |
| `kit.door.handle` | 把手/执手 |

规则：

- pivot 在铰链。
- 门扇厚度 0.04–0.06 m。
- 开门方向/角度写进资产清单。
- 门洞净宽必须 ≥ 玩家直径 + 0.1 m。
- 锁定门保留 `sceneId` 钩子或交互提示。

### 2.4 窗

| id | 说明 |
|---|---|
| `kit.window.classroom` | 大窗，2–3 联 |
| `kit.window.corridor` | 高窗/长窗 |
| `kit.window.high` | 高窗/气窗 |
| `kit.window.frosted` | 磨砂窗 |
| `kit.window.curtain` | 窗帘/百叶 |

规则：

- 窗框、玻璃、窗台分层。
- 日光只做非投影填充；不产生侧向影子。
- 窗外不能是黑洞；用天空/雾/遮挡板。
- 玻璃不要全透明；保留反射/色偏。

### 2.5 线脚/收口

- `kit.trim.baseboard`：踢脚。
- `kit.trim.chairrail`：椅线。
- `kit.trim.crown`：顶角线。
- `kit.trim.doorcasing`：门套。
- `kit.trim.windowcasing`：窗套。
- `kit.trim.corner`：阳角/阴角收口。

## 3. 命名

```text
kit.<类别>.<类型>.<变体>
kit.wall.straight.4m
kit.wall.doorway.1m
kit.door.single.0.9m
kit.window.classroom.3m
kit.floor.wood.oak
kit.ceiling.flat.3.2m
```

规则：

- 全小写、点分隔。
- 尺寸放最后，避免同一模块多个尺寸混用。
- 变体只在与基础版有明确差异时增加。
- one-off 模块用 `oneoff.<scene>.<name>`。

## 4. Pivot / 朝向 / UV

- 墙/门/窗/家具：pivot 在底部中心。
- 门：pivot 在铰链。
- 抽屉：pivot 在滑轨中心（或定义拉出轴）。
- 正面统一 +Z。
- UV 以米为单位；同一材质族的密度一致。
- 家具底部贴地，不靠“视觉下沉”。

## 5. 碰撞

| 类型 | 碰撞 |
|---|---|
| 墙 | AABB/OBB，厚度与墙一致 |
| 门洞 | 左右墙段 + 门扇碰撞 |
| 家具 | OBB，按外轮廓 |
| 小道具 | 默认无碰撞 |
| 地面高差 | 用台阶/坡道，不用隐形墙 |

- 门/抽屉碰撞随动画更新。
- 墙段接缝不能产生“隐形凸起”卡玩家。
- 玩家半径 0.30 m；门洞净宽至少 0.70 m。

## 6. 组装规则

1. 先放墙段，确认门洞/窗洞。
2. 再放地面/天花，检查边界。
3. 放门/窗/线脚，检查接缝。
4. 最后放家具，检查通道。
5. 每个接缝从两个机位检查：正面 + 斜侧。
6. 不能出现双墙、重叠面、漏光缝。

## 7. 新模块准入

新增 kit 模块必须满足至少一条：

- 能在 ≥2 个场景复用；
- 是当前场景不可替代的结构件；
- 是剧情特写道具（标记 one-off）。

新增时写：

- id、尺寸、pivot、材质槽；
- 碰撞类型；
- 可拼接的相邻模块；
- 预览截图；
- 复用场景清单。

## 8. 首批 kit 缺口

做教室/走廊/体育馆时，优先补：

- `kit.wall.doorway`（教室门/走廊门）
- `kit.wall.window.classroom`（大窗）
- `kit.window.curtain`
- `kit.floor.wood`
- `kit.ceiling.flat/beam`
- `kit.door.single/double`
- `kit.trim.baseboard/chairrail`
- `kit.ceiling.fluorescent`
- `kit.stair` / `kit.railing`（体育馆/走廊）

## 9. 自检

- [ ] 墙段能拼成完整房间，无缝隙。
- [ ] 门洞/窗洞尺寸正确。
- [ ] 门/窗/线脚接缝自然。
- [ ] 地面/天花无漏面。
- [ ] UV 不拉伸。
- [ ] 碰撞与几何一致。
- [ ] 新模块有复用场景。
