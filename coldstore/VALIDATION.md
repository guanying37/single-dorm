# 冷库储藏室 · 验收记录

> 日期：2026-11-15 · `sceneId: coldstore` · 机位：**移动（第一人称）**，无固定机位。
> 环境：Windows + Microsoft Edge（Chromium），1600 × 900，本地 `python -m http.server 8123`，CDP 自动测试脚本在 `tools/`。
> 结论：**通过**。无 console error / 无 404 / 无外部请求 / 无人物 / 无文字 / 无音频。

## 1. 自动化测试

| 脚本 | 内容 | 结果 |
| --- | --- | --- |
| `tools/check.mjs` | 加载、console/异常、场景统计、碰撞数、三/四场景 ready 标记 | 通过，`EVENTS []` |
| `tools/motion-test.mjs` | 键盘/Shift、走路/跑步、货架/门/挂衣区/CRT 碰撞、斜向滑动、俯仰、步伐、鼠标视角、双向门重定向、四场景切换 | 通过（数据见下） |
| `tools/portal-test.mjs` | 真实鼠标点击冷库门 → 后厨；后厨冷库门 → 冷库 | 通过 |
| `tools/capture.mjs` | 13 张确定性截图 + 切场黑屏 + 带 HUD 全景 | 通过 |

## 2. 移动与碰撞（实测）

```text
start                x=0.26  z=2.30  eye=1.800  roll=0   penetration=0
walk 1.0 s           distance=1.796 m      （walk 1.9 m/s，含加速段）
run  1.0 s           distance=3.687 m      （run 3.9 m/s）
东货架（冲撞 3 s）    x=+0.31  z=0.00      penetration=0
西货架（冲撞 3 s）    x=-0.31  z=0.00      penetration=0
冷库门（冲撞 3 s）    x=+0.30  z=+2.39     penetration=0   ← 门框/门叶夹具
CRT 角（冲撞 3 s）    x=-1.04  z=+2.06     penetration=0   ← 显示器搁板碰撞
挂衣区（冲撞 3 s）    x=0.00   z=-2.12     penetration=0   ← 衣物前 0.38 m 停下
斜向跑（W+D）        x=+0.31  z=-2.12     penetration=0   ← 沿货架滑动，不卡死
pitch 上限            +1.4486 rad (83°)    camera.rotation.z = 0
pitch 下限            -1.4486 rad (-83°)   camera.rotation.z = 0
步伐起伏              1.7890 – 1.8110 m（0.022 m 峰峰）  roll = 0
停止后归位            y=1.800000           roll = 0
鼠标视角              yaw −0.308 rad / pitch +0.198 rad   roll = 0
碰撞体                9（4 墙 + 2 货架 + 挂衣区 + CRT + 门）
```

- 通道净宽 1.26 m（两侧 0.72 m 深货架），玩家半径 0.30 m，可通过并可原地转身。
- 货架前后挡边、门框与门叶凸出部分、CRT 搁板均单独给碰撞体，**不穿模**。
- 无侧倾：所有测试中 `camera.rotation.z === 0`，俯仰严格 ±83°，不会倒置。
- 键盘事件只进入当前场景控制器：冷库激活时 `coldStoreControls.keys = [KeyW, Shift]`，`kitchenControls.keys = []`。

## 3. 双向传送（真实点击）

| 起点 | 提示 | 黑屏标题 | 落点 |
| --- | --- | --- | --- |
| 冷库门内侧 `(0.30, 1.45, yaw π)` | 进入餐厅后厨 | 餐厅后厨 | 后厨 `(4.60, -10.15)`，yaw π，pitch 0 |
| 后厨冷库门外 `(4.60, -9.55, yaw 0)` | 进入冷库 | 冷库储藏室 | 冷库 `(0.26, 2.30)`，yaw 0，pitch −0.02 |

- 后厨冷库门拾取体为不可见 `colorWrite:false` 盒（1 draw call），**不改变后厨原有模型与视觉**；未点击时无任何渲染差异。
- 切场期间输入锁定，落点均在门内 0.4–0.6 m，视角水平朝向房间内部。
- 餐厅 ↔ 后厨原有传送未受影响（`kitchen` 交互列表仍为 `door.dining`、`door.coldstore`）。

## 4. 四场景切换

`dorm → dining → kitchen → coldstore → kitchen → coldstore` 往返 6 次：每次 `getScene()` 与目标一致，视角保存/恢复，无报错，只渲染当前场景。

## 5. 光影 gate

- [x] 只有 1 盏投影主光（定向光，方向 `(0,-1,0)`），阴影烘焙一次（1024²）。
- [x] 吊顶不投影，主光可进入房间；货架投影落在正下方。
- [x] LED 冷库灯、蒸发器冷光、CRT 荧光、加热丝只做非投影补光，不产生侧向影子。
- [x] 无 Bloom / SSAO；无纯黑死角（门口、通道末端、货架下层均有补光）。
- [x] 动态对象（CRT 屏、扫描带、风扇、冷雾）不投影。

## 6. 性能 gate

| 指标 | 上限 | 实测 |
| --- | --- | --- |
| 三角面 | ≤450,000 | 48,670（静态合批）+ 动态 ≈ 53,360（渲染） |
| draw calls | ≤90 | 43–70（随机位/可见批次变化；全景 53） |
| 纹理 | ≤16 MB / 单张 ≤1024² | 16 张程序化贴图，单张 ≤512²，约 11 MB |
| 合批 | 静态合并 | 40 批 |
| FPS | 1080p 约 60 | 1600×900 实测 59–60 FPS（FPS 读数 60） |
| console | 无 error / 无 404 / 无外链 | 通过（`EVENTS []`） |

## 7. 截图

`preview/hero.jpg` 入口、`aisle.jpg` 通道、`door.jpg` 冷库门与监控角、`monitor.jpg` CRT + 指针温湿度计、`shelf-west/east.jpg` 两侧货架与货物、`evaporator.jpg` 冷风机、`ceiling.jpg` 吊顶/冷库灯/传感器、`coats.jpg` 防寒服与手套、`floor.jpg` 铝地台与排水沟、`camera.jpg` 除霜摄像、`transition.jpg` 切场黑屏、`hero-ui.jpg` 四场景 UI。

## 8. 未完成 / 已知取舍

- **无固定机位**：冷库为移动/探索空间，按移动机位验收；不做固定 shot。
- **门不可开关**：重门作为传送门始终关闭（与后厨冷库门一致），门叶可点击拾取；不实现开合动画。
- **冷雾为屏幕空间点精灵**：370 粒子、加法混合，不参与光照与碰撞，不产生音效。
- **CRT 画面为抽象程序化影像**：库内/门外双画面 + 两枚无刻度指针表，不含任何文字或角色。
- **贴图为程序化生成**：无位图、无自绘二维插画；标签只有抽象色块。
