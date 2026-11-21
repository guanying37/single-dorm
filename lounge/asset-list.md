# 生活区二层休息厅 · 资产清单

> 单位：m；尺寸为 **宽 × 高 × 深**（圆桌为直径 × 高）。pivot：家具在底部中心，门在铰链，墙在底部中心；正面 +Z。碰撞：`AABB` / `OBB` / `circle`。

## 1. 房间壳（kit）

| id | 类型 | 尺寸 | 材质槽 | 碰撞 | 复用场景 | 备注 |
|---|---|---|---|---|---|---|
| `kit.floor.carpet.wine` | 地面 | 31.7 × 10.0 | carpet | — | 宿舍大厅、走廊 | 紫红地毯，2 m 一道黄条纹 + 0.16 m 边线 |
| `kit.trim.carpet.border` | 地面收边 | 0.16 宽 | carpetBorder | — | 同上 | 内缩 0.35 m |
| `kit.wall.plaster.white` | 墙面 | 31.7 / 10.0 段 | wall | 墙 AABB | 全部室内 | 白色灰泥，米制 UV |
| `kit.wall.wainscot.1m` | 墙裙 | 高 1.0 | oak / oakDark / walnutDark | 随墙 | 餐厅、图书室 | 底板 + 竖壁板 + 压条 + 帽线 + 踢脚 |
| `kit.ceiling.flat.3.6m` | 平顶 | 31.7 × 10.0 | ceiling | — | 全部室内 | 周圈两级顶角线 |
| `kit.ceiling.tray.long` | 通长灯槽 | 30.8 × 5.8 × 0.14 | ceilingTray / ceilingFascia | — | 大厅、礼堂 | 5 盏吊灯与 4 道横梁的基准面 |
| `kit.ceiling.beam` | 灯槽横梁 | 0.24 × 0.14 × 5.8 | ceilingBeam | — | 大厅、走廊 | 4 道，位于吊灯跨中 |
| `kit.door.double.lobby` | 双开大门 | 2.8 × 2.6 | oakDark / oak / glassFrost / brass | 动态 OBB | 校门、礼堂门厅 | 两扇 1.4 m，内开 100° |
| `kit.door.single.supervisor` | 单开宿管门 | 1.0 × 2.2 | oakDark / oak / glassFrost / brass | 墙 AABB | 宿舍、办公室 | 带观察窗、执手、门外封板 |
| `kit.trim.doorcasing` | 门套 | 0.10 × 2.3 | oak | — | 全部门 | 贯穿墙厚的内衬 + 室内侧贴脸 |
| `kit.trim.baseboard` | 踢脚 | 0.12 × 0.032 | oakDark | — | 全部室内 | — |
| `kit.trim.crown` | 顶角线 | 0.07 × 0.07 | trim | — | 全部室内 | 两级退台 |

## 2. 家具（prop）

| id | 类型 | 尺寸 | 材质槽 | 碰撞 | 数量 | 备注 |
|---|---|---|---|---|---|---|
| `prop.table.round.5m` | 圆桌 | Ø5.0 × 0.75 | clothBlack / walnutDark / brassDark | circle r=2.5 | 1 | 黑桌布垂边 0.30 m，8 条车木腿 + 4 根横撑 |
| `prop.chair.highback.cover` | 高背沙发椅 | 0.55 × 1.04 × 0.56 | linen / linenSeam | OBB 0.58 | 14 | 座高 0.46，卷头高背，包脚椅套，环形 r=2.92 |
| `prop.sofa.3seat` | 三人沙发 | 2.3 × 0.98 × 0.92 | sofaFabric / sofaSeam / walnutDark | OBB | 17 | 南北各 8、东 1 |
| `prop.sofa.2seat` | 双人沙发 | 1.7 × 0.98 × 0.92 | 同上 | OBB | 2 | 西墙大门两侧 |
| `prop.console.carved` | 胡桃木条案 | 1.1 × 0.80 × 0.42 | walnut / walnutDark / brass | OBB | 16 | 沙发之间 14 + 东墙 2 |
| `prop.carving.bust` | 木雕胸像 | 0.26 × 0.42 × 0.24 | walnut / walnutDark | 无（在条案上） | 3 | 变体 0 |
| `prop.carving.horse` | 木雕马 | 0.48 × 0.42 × 0.22 | walnut / walnutDark | 无 | 4 | 变体 1 |
| `prop.carving.bird` | 木雕鸟 | 0.34 × 0.40 × 0.20 | walnut / walnutDark / brassDark | 无 | 3 | 变体 2 |
| `prop.carving.lion` | 木雕狮 | 0.44 × 0.36 × 0.22 | walnut / walnutDark | 无 | 3 | 变体 3 |
| `prop.carving.knot` | 抽象三环结 | 0.34 × 0.44 × 0.26 | walnut / walnutDark | 无 | 2 + 桌面 1 大件 | 变体 4；桌面中心放大到 0.7 m |
| `prop.relief.panel` | 木雕挂板 | 1.1 × 0.7 × 0.07 | walnut / walnutDark | 无 | 10 | 南北墙各 5，3 种浮雕变体 |
| `prop.relief.sunburst` | 门头日轮 | 2.62 × 0.5 × 0.07 | walnut / walnutDark / brassDark | 无 | 1 | 西墙大门上方 |

## 3. 桌面棋牌（game / prop）

| id | 类型 | 尺寸 | 材质槽 | 碰撞 | 备注 |
|---|---|---|---|---|---|
| `game.chess` | 国际象棋 | 盘 0.58 | walnut / walnutDark / boardLight / boardInlay / chessIvory / chessEbony | 无 | 2 副，18–19 枚/副，进行中局面 |
| `game.checkers` | 跳棋 | 盘 0.50 | 同上 + checkerRed / checkerBlack | 无 | 1 副，红黑各 12 枚，含叠子 |
| `game.go` | 围棋 | 盘 0.54，19 路 | walnut / boardLight / matBlack / chessIvory / chessEbony | 无 | 1 副，34 枚黑白子 |
| `game.cards` | 纸牌与筹码 | 牌 0.063 × 0.088 | cardFace / cardRed / chessEbony / chipIvory / chipRed | 无 | 9 张扇形牌、3 摞筹码、木牌盒 |

## 4. 灯与设备

| id | 类型 | 尺寸 | 材质槽 | 数量 | 备注 |
|---|---|---|---|---|---|
| `prop.chandelier.crystal` | 水晶吊灯 | Ø1.2 × 0.95 | brass / brassDark / crystal / bulbWarmWhite / acWhite | 5 | 两层 6 臂，24 白灯泡 + 水晶垂饰；非投影聚光 |
| `prop.fan.ceiling.warm` | 老式吊扇 | Ø1.3 × 0.8 | fanBrass / fanBlade / bulbFanWarm | 2 | 5 片木叶，转子动态，暖黄玻璃灯罩 |
| `prop.camera.dome` | 半球监控 | Ø0.18 | cameraShell / dome / matBlack / ledRed | 4 | 2 台与吊扇同座，2 台在端部天花；红灯呼吸 |
| `prop.airconditioner.cassette` | 嵌入式中央空调 | 0.95 × 0.95 | acWhite / acGrille / matBlack | 4 | 四向出风 + 回风格栅 |
| `prop.clock.wall.12` | 圆形挂钟 | Ø1.10 × 0.09 | walnutDark / brass / clockFace / clockInk / cardRed | 1 | 12 等分刻度，时/分/秒三针，时间可调 |
| `prop.reader.card` | 宿管检测机 | 0.17 × 0.26 × 0.05 | readerShell / readerFace / screenGlow / ledRed / ledGreen / brassDark | 2 | 卡槽、屏幕、镜头、红/绿指示灯 |
| `prop.landing.console` | 楼梯厅边柜 | 2.1 × 0.84 × 0.42 | walnut / walnutDark / brassDark | 1 | 门外预留段 |
| `prop.landing.sconce` | 壁灯 | 0.3 出挑 | brass / brassDark / bulbWarmWhite | 2 | 暖光，非投影 |

## 5. 统计

| 项 | 数量 |
|---|---|
| 静态合批（材质组） | **37** |
| 三角面（全场景） | **约 23.5 万** |
| 动态小组 | 门扇 ×2、宿管门 ×2、检测机 ×2、吊扇转子 ×2、钟针 ×3 |
| 家具件数 | 圆桌 1、椅 14、沙发 19、条案 16 |
| 木雕件数 | 条案 15 + 桌面 3 + 挂板 10 + 门头 1 |
| 灯具 | 吊灯 5、吊扇 2、壁灯 2（门外）、吸顶灯 1（门外） |
| 设备 | 空调 4、监控 4、检测机 2、挂钟 1 |
| 纹理 | 12 张程序化贴图（独立页 14 个纹理对象） |

### 复用 / 新增 / one-off

- **复用**：灰泥、橡木、胡桃木、黄铜、亚麻、沙发布、石材、双开门、踢脚、顶角线；灯具/监控/空调的几何语言沿用餐厅与后厨。
- **新增（可复用）**：1 m 木墙裙、通长灯槽、灯槽横梁、Ø5 m 圆桌、高背椅套、三人/双人沙发、木雕条案、5 种木雕变体、木雕挂板、水晶吊灯、黄光吊扇、12 等分挂钟、刷卡检测机。
- **one-off**：门头日轮（仅此一处）、三环结大雕件（桌面中心，单件放大）。
