# 灯光配方

目标：新场景不用每次重新“调灯”。从配方选，少量变量调整。

## 1. 阴影契约

- 室内顶灯照明：**唯一投影主光垂直向下** `(0, -1, 0)`。
- 窗光/日光：只做非投影填充，不能产生侧向影子。
- 聚光灯/洗墙灯：只做光池，`castShadow = false`。
- 一个场景只允许一盏灯 `castShadow = true`。
- 动态门/抽屉 `castShadow = false`；阴影只烘焙一次。
- 定向光垂直向下时设置 `shadow.camera.up = (0,0,1)`，避免矩阵退化。

> 为什么窗光不投影：窗户在侧墙，如果窗光投影，影子方向会与顶灯矛盾。保持“顶灯负责影子、窗光负责亮度”。

## 2. 通用参数

| 项 | 默认 |
|---|---|
| 色调映射 | ACESFilmic，曝光 1.0–1.1 |
| 阴影贴图 | 2048²（大场景）/1024²（小房间） |
| 阴影类型 | PCFSoft |
| 环境光 | Hemisphere + 低强度 Ambient |
| 后处理 | 无 Bloom/SSAO |
| 发光体 | emissive 暖白/冷白，不过曝 |

## 3. 配方

### 3.1 教室 · 下午

```yaml
recipe: classroom.afternoon
key:
  type: directional
  direction: down
  intensity: 1.0
  color: "#fff4e2"
window:
  type: area/emissive + non-shadow fill
  color: "#dfe9ec"
  intensity: 0.35
fixtures:
  - ceiling.fluorescent.row ×2
ambient:
  hemisphere: 0.55
  ambient: 0.15
mood: 明亮、略暖、窗边轻微过曝
```

- 主光垂直向下，窗光不投影。
- 桌面/椅子影子在正下方。
- 窗边亮，但不形成侧向影子。

### 3.2 走廊 · 线性灯

```yaml
recipe: corridor.linear
key:
  type: directional
  direction: down
  intensity: 0.65
  color: "#fff1da"
fixtures:
  - ceiling.linear ×N
  - endWall.sconce (warm)
ambient:
  hemisphere: 0.4
  ambient: 0.12
mood: 纵深、端景暖光、轻微冷暗
```

- 走廊尽头可加暖光，但不投影。
- 线性灯沿走廊排布，间距一致。

### 3.3 体育馆 · 高棚

```yaml
recipe: gym.highbay
key:
  type: directional
  direction: down
  intensity: 1.1
  color: "#fff6ea"
fixtures:
  - highbay ×6–8
  - skylight (non-shadow)
ambient:
  hemisphere: 0.6
  ambient: 0.1
mood: 顶部亮、地面亮、看台略暗
```

- 高棚灯只做光池，不投影。
- 天窗只做填充。
- 大空间阴影 2048²；必要时提高主光强度。

### 3.4 图书室 · 安静

```yaml
recipe: library.quiet
key:
  type: directional
  direction: down
  intensity: 0.55
  color: "#ffe9c8"
fixtures:
  - deskLamp.warm ×N
  - ceiling.soft
ambient:
  hemisphere: 0.35
  ambient: 0.12
mood: 低照度、暖、安静
```

### 3.5 裁判场 · 聚光

```yaml
recipe: trial.spotlight
key:
  type: directional
  direction: down
  intensity: 0.9
  color: "#f4f6ff"
fixtures:
  - overhead.spot ×N (non-shadow)
ambient:
  hemisphere: 0.12
  ambient: 0.05
mood: 高对比、暗环境、中心亮
```

- 聚光灯不投影；垂直主光负责影子。
- 不要侧向彩色 key。

### 3.6 浴室 · 湿区

```yaml
recipe: bath.cool
key:
  type: directional
  direction: down
  intensity: 0.8
  color: "#eef4f2"
fixtures:
  - ceiling.panel ×N
  - mirror.light
ambient:
  hemisphere: 0.45
  ambient: 0.15
mood: 冷白、干净、轻微反射
```

### 3.7 庭院 · 日光

```yaml
recipe: courtyard.day
key:
  type: directional
  direction: down
  intensity: 1.4
  color: "#fff7e8"
fixtures:
  - sky.hemisphere
ambient:
  hemisphere: 0.8
  ambient: 0.1
mood: 日光、清晰阴影、室外
```

- 室外场景仍保持主光垂直向下，避免侧向影子与建筑/树影矛盾。
- 可以用天空色/雾做环境，但不做侧向 key。

## 4. 时间/剧情变体

- 白天/黄昏/夜晚：换灯光配方和窗色，不换模型。
- 停电：只保留应急灯/月光，主光强度降低；阴影方向不变。
- 红光警报：主光颜色变红，强度降低；不要新增侧向红色 key。
- 雨天：窗光更冷、更低；地面反射略增。

## 5. 灯光清单

每个场景输出：

```yaml
lights:
  - id: key
    type: directional
    castShadow: true
    direction: down
  - id: window.fill
    type: non-shadow
  - id: fixture.1
    type: spot
    castShadow: false
```

## 6. 验收

- [ ] 只有一个投影主光。
- [ ] 顶灯室内主光垂直向下。
- [ ] 窗光/日光不投影。
- [ ] 高物体影子在脚下，不侧偏。
- [ ] 动态门/抽屉不触发阴影重烘焙。
- [ ] 无过曝白墙、纯黑阴影。
- [ ] 无 Bloom/SSAO。
- [ ] 夜晚/停电变体不引入侧向 key。

## 7. 常见错误

- 为了“立体感”加侧向 fill，导致影子方向矛盾。
- 窗光投影，和顶灯影子打架。
- 每盏聚光灯都开 shadow，性能崩溃。
- 垂直定向光忘记 `shadow.camera.up`，阴影矩阵退化。
- 动态门参与 castShadow，开门卡顿。
- 环境光过高，影子消失；环境光过低，阴影死黑。
