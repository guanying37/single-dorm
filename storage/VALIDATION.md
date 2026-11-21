# 杂物间 · 验收记录

> `sceneId: storage` · 2026-11-20 · 移动机位场景（无固定机位）
> 验收机：Windows 11 · Edge 158 · NVIDIA GeForce GTX 1060 3GB（D3D11）· 1600 × 900
> 原始数据：[preview/motion-report.json](preview/motion-report.json)

## 1. 启动与注册

| 项 | 结果 |
| --- | --- |
| 同页第五个标签「杂物间」 | 通过；`#storage` 可直达 |
| 独立入口 `storage/` | 自动跳转 `../#storage`；`file://` 下有明确提示 |
| 启动错误 | 0；控制台无 error / warning |
| 五场景互相切换 | `dining → kitchen → coldstore → storage → dorm → storage` 全部正确，视角按场景保存/恢复 |
| 场景常驻 | 切换不重新加载；五个场景同页常驻 |
| 目标场景就绪标志 | `window.__STORAGE_READY__ === true` |

## 2. 空间与碰撞

玩家半径 0.30 m，子步进 0.06 m，3 pass；所有结果均为 0 穿透。

| 测试 | 结果 | 穿透 |
| --- | --- | --- |
| 起点 (0.3, 1.9)，眼高 1.80 | 站位于门内，无碰撞 | 0 |
| 步行 1 s | 1.883 m（由静止加速，目标 2.0 m/s） | 0 |
| 跑步 1 s | 3.485 m（目标 4.2 m/s，尚未全速） | 0 |
| 向西跑向五层货架 3 s | 停在 `x = -0.32`（货架前沿 -0.62 + 半径 0.30） | 0 |
| 向东跑向纸箱堆 3 s | 停在 `x = 0.38`（箱堆 - 半径） | 0 |
| 向南跑向关闭的门 3 s | 停在 `z = 1.99`（门面 2.29 - 半径） | 0 |
| 向北跑向尽头 3 s | 停在 `z = -2.09`（北墙 - 半径），被麻袋堆挤到 `x = 0.04` | 0 |
| 斜向跑向麻袋角 3 s | 停在 `x = 0.89, z = -1.23`（麻袋堆前沿 - 半径） | 0 |
| 斜向 `W+A` 撞货架/北角 | 沿墙滑动到 `x = -0.32, z = -2.09`，不卡死 | 0 |
| 碰撞体数量 | 10（4 墙 + 货架 + 门 + 麻袋 + 箱堆 + 拖把桶 + 扫把/拖把斜靠） | — |

- 起点不在任何家具/墙内；门口、货架前 1.84 m 主通道、箱堆前最窄约 1.2 m 均可通行。
- 门锁定，不可穿越；门外走廊是布景切片，不参与可行走空间。

## 3. 相机与操作

| 项 | 结果 |
| --- | --- |
| 眼高 | 1.800 m（仅步伐起伏） |
| 步行/跑步起伏 | 90 帧内 1.7880 → 1.8120 m，范围 0.0240 m；停止 150 帧后回到 1.800 m |
| 俯仰限制 | ±1.4486 rad（±83°） |
| 侧倾 | 0（移动、转头、回正全程） |
| 中键回正 | 0.6 s 缓动，回到初始 yaw/pitch |
| 鼠标环顾 | yaw −0.308，pitch +0.198（140, −90 输入） |
| 键盘隔离 | 只有 `StorageControls` 收到 W/Shift；餐厅/后厨/冷库控制器为空 |
| 全屏/指针锁定 | 沿用 hub 的全屏、右键固定、中键回正逻辑 |

## 4. 交互

| 交互 | 结果 |
| --- | --- |
| `door.storage` | 锁定；提示「杂物间门 · 暂未开放（预留走廊切换）」；`sceneId: corridor`；不切场 |
| `toolbox` | 开盖 1.62 rad；托盘 +0.075 m，8 件工具露出；再合盖回到 0 / 0 |
| `light.switch` | 关灯后 `lightOn=false`、`lightLevel=0`、裸灯 0、主光 0.18；开灯回到 1.0 |
| 关灯可读性 | 走廊/百叶光、门缝光、监控红点与半球光保留；货架、门、地面仍可辨认 |
| `E` / 单击 | 与 hub 的交互提示、Toast 一致；不误触其他场景 |
| 摄像机动态 | 云台慢速左右扫视；红色录制灯呼吸；不投影、不重烘焙 |

## 5. 百叶单向视线（特殊设定）

`StorageScene.probeVent()` 在 y = 1.42…1.84 m 之间每 0.02 m 发射水平探针，共 21 条：

| 方向 | 命中门平面之外/之内 | 结论 |
| --- | --- | --- |
| 从室内向走廊 | 16 / 21 条越过门平面（最近命中 `z = 4.10` 走廊墙） | 里面能看见外面 |
| 从走廊向室内 | 0 / 21 条进入室内 | 外面看不见里面 |

- 百叶 8 片，向室外下倾约 0.5 rad；从内侧略低头即可通过叶片间隙看到走廊墙面、红色灭火器箱与黄色防滑牌。
- 水平探针是保守检查；实际斜视/贴门角度会看到更多或更少光带，与真实百叶一致。
- 截图：[vent.jpg](preview/vent.jpg)（贴门窥视）、[door.jpg](preview/door.jpg)（门口整体）、[cleaning.jpg](preview/cleaning.jpg)（门、开关与清洁工具）。

## 6. 性能

| 项 | 数值 |
| --- | --- |
| 静态合批 | 50 批 / 30,724 三角面 |
| 实际渲染（hero） | **74 draw calls / 32,212 三角面 / 27 个纹理对象** |
| 视角 draw calls 范围 | 34–74（随可见批次变化） |
| 程序化贴图 | 19 张（单张 ≤512 × 1024；地板为 512 × 1024），约 11 MB 含 mipmap |
| 阴影 | 1 张 1024²，单次烘焙；动态物体不投影 |
| 后处理 | 无 Bloom / SSAO |
| 帧率 | **1600 × 900 · GTX 1060 · 稳定 60 FPS**（可见 Edge 实测；`fpsValue=60`） |
| 自适应分辨率 | 沿用 hub；捕获模式固定 quality=1 |

GPU 信息：`ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 3GB (0x00001C02) Direct3D11 vs_5_0 ps_5_0, D3D11)`；原始数据：[preview/fps.json](preview/fps.json)。

## 7. 视觉与穿帮检查

- 门洞、百叶开洞、门框、门槛、门扇均为真实几何；没有假贴图百叶、门后套门或黑洞。
- 货架 5 层 / 4 跨 / 10 根立柱完整；层板、前挡边、加强筋、斜撑、锈脚可见。
- 货架前脸 x=-0.64，所有货物停在层板内；最前排喷壶/水桶不穿前挡边。
- 麻袋、纸箱、拖把桶、扫把/拖把均有独立碰撞；箱堆 + 木质垫板 + 工具箱不互相穿插。
- 挂墙衣物、绳圈、挂钩、水管、阀门、线管、接线盒都贴墙或留出合理间隙。
- 光源：唯一投影主光垂直向下；走廊灯、百叶光、裸灯、监控 LED 均为非投影补光；无侧向影子。
- 人物、文字、可读标签、自绘二维画作、音频、CDN、网络请求均为 0。
- 复核截图：[hero.jpg](preview/hero.jpg)、[shelf.jpg](preview/shelf.jpg)、[tools.jpg](preview/tools.jpg)、[sacks.jpg](preview/sacks.jpg)、[garments.jpg](preview/garments.jpg)、[ceiling.jpg](preview/ceiling.jpg)、[floor.jpg](preview/floor.jpg)、[light-off.jpg](preview/light-off.jpg)。

## 8. 预览截图（13 张）

| 文件 | 内容 |
| --- | --- |
| [hero.jpg](preview/hero.jpg) | 门内起点：五层货架、裸灯、箱堆/工具箱、挂衣、绳圈、监控 |
| [hero-ui.jpg](preview/hero-ui.jpg) | 合并页 UI：五个标签、FPS 60、操作条 |
| [shelf.jpg](preview/shelf.jpg) | 五层货架与清洁用品、罐子、麻袋、油漆罐 |
| [tools.jpg](preview/tools.jpg) | 开盖的修理工具箱：锤子、螺丝刀、扳手、卷尺 |
| [cleaning.jpg](preview/cleaning.jpg) | 拖把桶、扫把、拖把、顶灯开关与门 |
| [garments.jpg](preview/garments.jpg) | 旧外套、工作服、红围巾、绳圈 |
| [sacks.jpg](preview/sacks.jpg) | 北墙角麻袋堆与扎口 |
| [door.jpg](preview/door.jpg) | 门、百叶、执手、开关、线管 |
| [vent.jpg](preview/vent.jpg) | 贴门从百叶看走廊：红色灭火器箱、黄色防滑牌 |
| [camera.jpg](preview/camera.jpg) | 东北角监控、红点、锈水管与阀门 |
| [ceiling.jpg](preview/ceiling.jpg) | 裸灯、搪瓷罩、混凝土板缝、线管 |
| [floor.jpg](preview/floor.jpg) | 水泥地、地漏格栅、扫把、纸屑、工具箱 |
| [light-off.jpg](preview/light-off.jpg) | 关灯变体：只留百叶/走廊光与监控红点 |

## 9. 复现命令

```powershell
# 在 single-dorm 目录
python serve.py            # 或任意静态服务器，端口 8123
# 可见 Edge + 远程调试（截图/FPS）
msedge.exe --remote-debugging-port=9223 --user-data-dir=%TEMP%\edge-storage http://127.0.0.1:8123/#storage
node storage/tools/check.mjs
node storage/tools/motion-test.mjs
node storage/tools/capture.mjs final
node storage/tools/gpu-check.mjs 9223
```

- 无头 Edge 只能靠截图强制出帧，FPS 读数不可信；性能数据必须用可见 Edge（`gpu-check.mjs`）。
- 截图工具会把工具箱盖/托盘和灯光状态强制到目标值，避免无头低帧率导致过渡未完成。

## 10. 已知边界

- 门保持锁定，走廊不可进入；这是剧情设定，不是碰撞漏洞。
- 走廊只有 1.7 m 深，是门外窥视布景，不从其他方向检查。
- 百叶探针只测水平方向；实际斜向/贴门角度会随叶片遮挡变化，与真实百叶一致。
- 场景无固定机位；所有构图均为移动模式下的自然站位，不另做 fixed shot 验收。
- 麻袋为风格化圆角袋体 + 扎口，不是布料模拟；近看能辨认袋型与绳扎口，远看以轮廓和材质为主。
