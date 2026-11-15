# 后厨资产清单

命名遵循 `room.* / kit.* / prop.* / mat.*`。1 unit = 1 m；家具 pivot 在底部中心，门 pivot 在铰链，正面 +Z。

## 复用

| 资产 | 来源 | 用途 |
| --- | --- | --- |
| `StaticBuilder` / `mergeGeometries` / `trs` / `uvScaledPlane` | `dining/src/utils.js` | 按材质合并静态几何、米制 UV |
| `buildServiceDoor` | `dining/src/room.js` | 复用餐厅同款橡木服务门，镜像铰链 |
| `CollisionWorld` | `dining/src/collision.js` | 圆形玩家 vs AABB/OBB，3 pass 解算 |
| Three.js r180 本地副本 | `vendor/` | 渲染 |
| 同页 UI / 切换 / 输入 / 全屏 | `src/hub.js`、`styles.css` | 三场景集成与第一人称输入外壳 |
| 程序化纹理方式 | 餐厅 `textures.js` | CanvasTexture、无外部图片 |

## 新增 · 房间与天花

| ID | 尺寸 / 说明 | 材质 | 碰撞 |
| --- | --- | --- | --- |
| `room.kitchen.shell` | 12 × 22 × 3.25 m，墙厚 0.24；进深对齐餐厅 22 m | 白瓷砖 / 灰防滑砖 | 四面墙 AABB |
| `kit.wall.white-glazed-tile` | 300 mm 方砖，米制 UV | glazed tile + bump | 随墙 |
| `kit.floor.quarry-tile` | 300 mm 防滑地砖，带凸点/排水沟 | quarry tile | 地面 |
| `kit.ceiling.aluminium-lay-in` | 600 × 600 铝扣板 + T 型龙骨 | aluminium | — |
| `kit.ceiling.led-panel` | 600 × 600，冷白，15 盏；金属框 + 发光扩散板 + 柔光 | steel / LED | — |
| `kit.ceiling.exhaust-hood` | 3.7 × 1.55 m 罩体，底沿 2.13 m；双层滤网、罩底灯 | stainless / grease | — |
| `kit.ceiling.duct` | 0.8 × 0.6 m 立管 + 10.8 m 主风管、法兰、吊杆 | galvanised | — |
| `kit.ceiling.sprinkler` | 3 路 DN20 红管 + 9 个下垂型喷头 | red pipe / brass | — |
| `kit.ceiling.dome-camera` | 4 台吸顶半球机，黑线缆；出餐口/烹饪/清洗/回餐厅门 | plastic / rubber | — |
| `kit.wall.cove` | 不锈钢踢脚 0.13 m | stainless | 随墙 |
| `kit.wall.corner-guard` | 四处 2.4 m 不锈钢护角 | stainless | — |

## 新增 · 设备

| ID | 尺寸（m） | 组成 | 碰撞 |
| --- | --- | --- | --- |
| `prop.island.double-stainless` | 3.0 × 1.0 × 0.92 | 双层台面、下柜门、层板、调平脚 | 3.16 × 1.16 |
| `prop.range.dual-wok` | 2.6 × 0.98 × 0.88 | 双空 WOK 锅圈（锅具已删）、旋钮、鼓风机格栅、双摆龙头、脚踏杆 | 2.72 × 1.12 |
| `prop.steamer.three-door` | 0.9 × 0.82 × 1.72 | 三门、玻璃观察口、压力表、侧控面板、排汽口 | 1.02 × 0.94 |
| `prop.oven.double-door` | 1.15 × 0.9 × 1.5 | 双门、观察窗、控制面板、烤盘 | 1.26 × 1.02 |
| `prop.sink.triple` | 3.2 × 0.78 × 0.9 | 三盆、双沥水、三口龙头、高压花洒、垃圾处理器、P 弯 | 3.32 × 0.9 |
| `prop.dish-table` | 1.8 × 0.66 × 0.9 | 沥水架、盘堆、托盘 | 1.9 × 0.78 |
| `prop.prep-counter.heat-display` | 3.6 × 0.82 × 0.9 | 保温售饭台、四格餐盆、玻璃挡板、3 灯、4 勺 | 3.72 × 0.94 |
| `prop.north-prep` | 1.8 × 0.7 × 0.9 | 备餐台、下柜、层板、墙面挂架、烤盘、料桶 | 1.9 × 0.82 |
| `prop.west-prep` | 2.2 × 0.66 × 0.9 | 工作台、层板、案板、汤锅、碗 | 0.8 × 2.3 |
| `prop.west-prep.south` | 2.2 × 0.66 × 0.9 | 长进深南半段的第二张备餐桌、案板、料桶 | 0.8 × 2.3 |
| `prop.shelving.four-tier` | 1.75 × 0.56 × 1.92 | 四层架、锅、烤盘、料桶 | 0.72 × 1.84 |
| `prop.wall-rail.utensils` | 2.8 m 挂杆 | S 钩、2 炒锅、平底锅、漏勺、汤勺 | — |
| `prop.hand-sink.wall` | 0.56 × 0.48 × 0.94 | 盆、龙头、皂液、纸巾、毛巾 | 0.68 × 0.6 |
| `prop.cold-door` | 1.3 × 2.2 | 厚门、密封条、铰链、压紧把手、加热丝、温度表 | 随北墙 |
| `prop.freight-elevator` | 1.7 × 2.2 | 双扇门、门套、召唤面板、箭头灯、警示踢脚 | 随西墙 |
| `prop.door.dining.return` | 1.0 × 2.2 | 复用餐厅橡木门、磨砂玻璃、黄铜把手、镜像铰链；东墙 z=-7，点击切场 | 随东墙 |
| `prop.pass.double-impact-door` | 2.4 × 2.2 洞口，z=+5.5 | 双开门、观察窗、推杆、防撞条、传菜台、暖光交接廊 | 传菜台 0.86 × 2.72 |
| `prop.crt.wall` | 0.6 × 0.47 × 0.4 | 老化米白壳、弧面 CRT、支架、录像机、黑线缆 | — |
| `prop.crt.floor` | 0.64 × 0.53 × 0.5 + 1.1 m 支架 | 米黄壳、分屏 CRT、散热格栅、旋钮、金属落地架 | 0.84 × 0.8 |

## 新增 · 台面/小道具

- 红/绿/白分色案板（0.43 × 0.34、0.40 × 0.31、0.52 × 0.39）。
- 不锈钢刀架 + 4 把刀（黑柄、钢刃）。
- 6 个开口不锈钢料盒，内含盐/糖/辣椒/褐香料/香草，带小勺；无文字标签。
- 白瓷盘堆、汤锅、混合碗、烤盘、料桶、酱料瓶、纸巾、抹布。
- 防疲劳地垫 3 块（灶前、水槽前、售饭台前）；安全锥、灭火器、灭火毯、手洗池。
- 墙面电箱（6 路开关、红色指示灯）。

## one-off 说明

| 资产 | 原因 |
| --- | --- |
| 墙面 CRT + 落地 CRT | 场景特有的老式监控母题；两件共享屏幕材质和动画逻辑 |
| 冷库门加热丝 + 无数字温度表 | 冷库门的可识别特征，复用价值低于场景专用 |
| 货梯召唤面板/箭头灯 | 货梯门的专用控件，不具备跨场景复用条件 |

## 无碰撞 / 装饰件

刀、勺、料盒、盘堆、瓶子、纸张、抹布、烤盘、喷淋头、烟感、摄像头、灯具、线缆、地垫、安全锥均无独立碰撞；玩家由墙体/设备主碰撞体阻挡，避免小物件产生“隐形凸起”。灶台上的锅具已删除，只保留空炉圈与炉架。

全场景共 **19 个碰撞体**（4 面墙 + 13 个设备/家具 + 2 个附加小件）；木门本身由墙体阻挡，交互使用独立射线拾取。
