# 医务室 · 验收记录

日期：2026-11-21 · `sceneId: infirmary` · 5.0 × 8.0 × 3.0 m · 40.0 ㎡
测试机：Windows 10 · Edge 158（headless=new，SwiftShader）· 1600 × 900
服务器：`python serve.py` → http://127.0.0.1:8123
页面：`/infirmary/standalone.html` 与合并页 `/?scene=infirmary`

## 1. 加载与注册

| 项 | 结果 |
| --- | --- |
| 独立页加载 | ✅ 无异常、无 404 |
| 合并页加载（九场景常驻） | ✅ 无异常、无 console error |
| 合并页第 9 个 tab | ✅ 「医务室」，`aria-selected=true` |
| 直接 hash `/#infirmary` | ✅ 初始化后进入医务室 |
| `?scene=infirmary` | ✅ 进入医务室 |
| `window.__INFIRMARY_READY__` | ✅ `true` |
| 标题 / eyebrow | ✅「医务室」/「Hope's Peak · Infirmary」 |
| 控制条 | ✅ 只显示 `#infirmaryControls` |
| 其余场景 | ✅ dining / garbage / readingroom / lounge 切换后标题与视图正确 |
| 回到医务室 | ✅ 视图恢复为 `x=1.15, z=3.48, yaw=0, pitch=-0.02` |

截图：`preview/hero-ui.jpg`（合并页含 HUD）。

## 2. 性能

| 项 | standalone | 合并页（九场景） |
| --- | --- | --- |
| draw calls | **70**（hero）；23–70（各机位） | **70**（hero） |
| 三角面 | **116,734**（hero） | **116,734** |
| 静态批次 | **36** | 36 |
| 静态三角面 | **106,342** | 106,342 |
| 程序化贴图 | **14** | 全页 89（九场景合计） |
| FPS | **60**（1600 × 900，headless SwiftShader） | 48–55（切换后，headless；非硬件实测） |
| 阴影 | 1 张 2048² 静态阴影，只烘焙一次 | 同 |
| 后处理 | 无 Bloom / SSAO | 无 |

> headless SwiftShader 的 FPS 仅用于“能稳定跑动/无卡死”判断；真实硬件（GTX 1060 级）在同类场景通常更高。合并页九场景常驻且全部已编译，headless 帧率会低于单场景。

## 3. 移动、碰撞与相机

`tools/motion-test.mjs` 直接在合并页中驱动同一个 `InfirmaryControls`；结果写入 `preview/motion-report.json`。

| 测试 | 结果 |
| --- | --- |
| 起点 | `(1.15, 3.48)`，眼高 1.800 m，0 穿透 |
| 前进 1 s | 位移 2.041 m（2.2 m/s 加速模型） |
| Shift 前进 1 s | 位移 3.386 m（4.4 m/s 加速模型） |
| 向西撞病床 | 停在 `x=-0.21`（床尾 -0.51 + 0.30 半径） |
| 向东撞药柜 | 停在 `x=1.78`（柜前 2.09 - 0.30） |
| 向东撞洗手池 | 停在 `x=1.64`（台前 1.94 - 0.30） |
| 向北撞手术台 | 停在 `z=0.095`（台南 -0.225 + 0.30） |
| 向南撞门/墙 | 停在 `z=3.68`（墙 3.98 - 0.30） |
| 西北角斜向挤压 | `(-1.54, -0.84)`，0 穿透 |
| 对角滑行 | `(-1.54, 0.71)`，0 穿透 |
| 俯仰限制 | ±1.4486 rad = ±83° |
| 侧倾 | 全程 `camera.rotation.z = 0` |
| 步伐起伏 | 1.788–1.812 m，范围 0.024 m，停止后回到 1.800 |
| 碰撞体 | 22 个；0.30 m 半径；0.06 m 子步进 |
| 全测试穿透 | **0**（所有测试点位） |

## 4. 交互

| id | 测试 | 结果 |
| --- | --- | --- |
| `door.infirmary` | toggle | `locked=true`, `sceneId=corridor`，不切场 |
| `curtain.2` | 关闭 → 打开 | `scale.x 0.5 → 1.0`，x `-0.64 → -1.705`；再打开回 0.5 / -0.64 |
| `cabinet.glass` | 打开 | 西片 z 从 0.93 → **1.665**（滑 0.735 m） |
| `cabinet.drawer.1/2/3` | 打开 | x 从 2.098 → **1.798**（拉出 0.300 m），三抽屉均打开，包装可见 |
| `waste.bin` | 打开 | 盖 rotation.x = **-1.15 rad**，红袋露出 |
| 镜面 | 检查 | `mirrorMesh.material.envMap` 存在，`mirrorTarget` 存在（128 px cube map） |
| 点击 / `E` | 合并页 | 通过 `toggleInteractive` 路径；11 个交互体均可拾取，距离 3.9 m |

截图：`preview/curtain-closed.jpg`、`cabinet-open.jpg`、`cabinet-low.jpg`、`waste.jpg`、`mirror.jpg`。

## 5. 视觉与穿帮检查

| 项 | 结果 |
| --- | --- |
| 5 : 8 比例 | 5.0 × 8.0 m，40.0 ㎡ |
| 五张病床 / 五道隔帘 / 五个床边小推车 | ✅ |
| 药柜 2.0 × 1.5 m；上层三层玻璃 + 横拉门；下层三层木抽屉 + 长方体包装 | ✅ |
| 洗手池单个凹槽、钢柜、洗手液、无边框镜、感应皂液器 | ✅ |
| 手术台 + 无影灯 + 不锈钢器械托盘架 + 12 件器械 | ✅ |
| 医疗废弃物桶（黄/红 + 生物危害标识）、医生圆凳 | ✅ |
| 1 m 浅蓝防撞扶手、墙角绿萝、四周石膏线 | ✅ |
| 白木门（图示位置） | ✅ 南墙 x=1.15，绿色十字门牌 |
| 空调 + 监控 + 显示屏 | ✅ 北墙高处成组 |
| 人物 / 文字 / 自绘二维画作 / 音频 | ✅ 均无 |
| CDN / 网络请求 / 外部字体 | ✅ 均无 |
| 门后套门 / 漂浮叶片 / 漂浮纸张 | ✅ 无；绿萝叶片都从藤节点生长 |
| 明显穿模 | ✅ 未发现（床间 0.63 m 净距、主过道 2.6 m） |
| 黑洞 / 接缝 | ✅ 房间封闭，墙地顶连续；阴影方向向下 |

## 6. 场景切换

| 步骤 | 结果 |
| --- | --- |
| dining → garbage → readingroom → lounge → infirmary | ✅ 全部切换成功，标题正确 |
| 切换后控制启用 | ✅ 只启用当前场景控制器 |
| 切换后视角恢复 | ✅ 回到医务室起点 |
| console error | **0** |

> 注：`LoungeControls` 的 keydown 监听不检查 `enabled`，会在后台累积按键（其 `setScene` 会清空，因此不影响移动）。这是既有场景的问题，本场景不依赖它；`InfirmaryControls` 的监听在未启用时直接返回。

## 7. 截图清单

| 文件 | 内容 |
| --- | --- |
| `hero.jpg` | 门口全景：床列、隔帘、手术台、药柜 |
| `hero-ui.jpg` | 合并页 HUD / tab |
| `beds.jpg` | 五床与床头蓝嵌板 |
| `cart.jpg` | 床边小推车与个人物品 |
| `curtain.jpg` | 打开状态的双片隔帘 |
| `curtain-closed.jpg` | 关闭状态隔帘 |
| `cabinet.jpg` | 药柜上层玻璃与白瓶 |
| `cabinet-open.jpg` | 玻璃门横拉 + 抽屉打开 |
| `cabinet-low.jpg` | 三层木抽屉拉出，包装可见 |
| `sink.jpg` | 洗手池、钢柜、镜子、皂液器 |
| `mirror.jpg` | 无边框镜的 cube map 反射 |
| `op.jpg` | 手术台与无影灯 |
| `tray.jpg` | 器械托盘与 12 件器械 |
| `lamp.jpg` | 无影灯细节 |
| `waste.jpg` | 打开盖的医疗废弃物桶 |
| `plant.jpg` | 西南角绿萝 |
| `door.jpg` | 白色木门与绿色十字 |
| `ceiling.jpg` | 6 盏 LED + 石膏线 |
| `floor.jpg` | 白瓷砖地面与家具投影 |

## 8. 未完成 / 可继续项

- 门保持锁定，门外走廊未建；后续接走廊时替换 `sceneId` 即可。
- 隔帘为软帘，不设碰撞体，允许玩家穿过帘面；这是为了避免把玩家夹在床与帘之间。若后续需要硬遮挡，可加动态碰撞并做“帘内有人时禁止关帘”判断。
- 镜面为一次性 128 px cube map，静态反射；不随窗帘开合实时更新。
- 医疗废弃物桶没有桶内垃圾细节，只有红色袋口。
- 真实硬件 FPS 尚未在本机 GTX 1060 上复测；当前数据为 headless SwiftShader 下的 60 FPS（单场景）/ 48–55 FPS（九场景合并页）。

## 9. 结论

**通过。** 加载 0 报错、0 穿透、11 个交互可用、九场景切换正常、单场景 60 FPS、hero 70 draw calls / 116k 三角面，满足移动机位 ≤90 draw calls / ≤450k 三角面的预算。
