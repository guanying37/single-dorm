# 杂物间 · 资产清单

> `sceneId: storage` · 11.52 ㎡ · 2.4 × 4.8 × 2.7 m · 静态合批 50 批、30,724 三角面。
> 尺寸单位 m；pivot 在底部中心，门在铰链侧，正面 +Z；材质槽标注见括号。全部贴图在浏览器内程序化生成。

## 1. 复用（来自现有库）

| id | 来源 | 用途 | 备注 |
| --- | --- | --- | --- |
| `lib.static-builder` | `dining/src/utils.js` | 按材质合并静态几何 | 50 个批次 |
| `lib.merge-geometries` | 同上 | 合批底图 | — |
| `lib.uv-scaled-plane` | 同上 | 米制 UV 墙面/天花/走廊 | 墙 2.4 m、天花 2.0 m、走廊 1.2 m |
| `lib.trs` | 同上 | 平移/旋转/缩放矩阵 | 货架与全部小件 |
| `lib.collision-world` | `dining/src/collision.js` | 2D 圆-盒碰撞 | 10 个碰撞体，3 pass |
| `lib.rounded-box` | `kitchen/src/geometry.js` | 麻袋、工具箱盖、镜头外壳 | 麻袋的圆角袋身 |
| `ui.hub` | `single-dorm/src/hub.js` + `styles.css` | 第五个场景标签、hash、操作条、FPS | 同页五场景常驻 |
| `vendor.three` | `vendor/three.module.min.js` | 渲染 | 本地副本，无 CDN |

## 2. 新增 kit 模块

| id | 尺寸（W × H × D） | 材质槽 | 碰撞 | 可复用场景 |
| --- | --- | --- | --- | --- |
| `kit.room.storage` | 2.4 × 2.7 × 4.8 | 混凝土 / 钢 / 木 | 4 面墙 AABB | 储藏室、后厨附房 |
| `kit.wall.concrete.board-formed` | 2.4 × 2.7 模数 | 毛坯混凝土 + 0.6 m 模板缝 + 对拉螺栓孔 | 墙体 AABB | 毛坯房、地下层 |
| `kit.floor.concrete.stained` | 2.4 × 4.8 | 污渍混凝土、裂缝、扫痕 | 地面（无高差） | 杂物间、车库 |
| `kit.ceiling.concrete.soffit` | 2.4 × 4.8 | 板缝、水渍、露骨料 | 无 | 毛坯房、管井 |
| `kit.door.steel.louvred` | 0.9 × 2.06 × 0.055 | 旧漆钢 + 8 片百叶 + 踢脚板 | AABB（门框/门扇） | 储藏室、配电间 |
| `kit.trim.conduit` | Ø0.016–0.032 × 2.7 | 镀锌线管 + 管卡 + 接线盒 | 无 | 所有后勤空间 |
| `kit.pipe.rust.valve` | Ø0.06 × 2.4 | 锈铁管 + 红色手轮 | 无 | 地下层、设备间 |
| `kit.light.bare-bulb` | Ø0.30 × 0.4 | 搪瓷罩 + 裸灯泡 + 吊线 | 无 | 储藏室、楼梯间 |
| `kit.camera.wall.box` | 0.105 × 0.09 × 0.215 | 旧灰塑料 + 镜头 + 红/绿 LED | 无（高于 2.3 m） | 走廊、仓库 |
| `kit.corridor.slice` | 2.8 × 2.7 × 1.7 | 奶油墙 + 墨绿墙裙 + 塑胶地 | 不可达 | 门外过场、窥视背景 |
| `kit.door.vent.louvre` | 0.5 × 0.44 | 深色叶片 + 钢框 | 与门同体 | 储藏室、观察窗 |
| `prop.shelf.angle-iron.5tier` | 0.56 × 2.02 × 3.70 | 旧镀锌角钢 + 5 × 4 层板 | AABB | 杂物间、干货库 |
| `prop.bucket.plastic` | Ø0.24–0.26 × 0.18–0.24 | 蓝/灰塑料 + 钢提手 | 独立小件可无碰撞 | 清洁间、后厨 |
| `prop.mop-bucket.wringer` | Ø0.52 × 0.62 | 黄塑料桶 + 灰压水器 + 脚轮 | AABB | 清洁间、走廊 |
| `prop.broom` | 0.30 × 1.54 | 木柄 + 深色刷头 + 草茎 | AABB（斜靠） | 清洁间、走廊 |
| `prop.mop` | 0.28 × 1.52 | 木柄 + 金属箍 + 灰纱线 | 同上 | 清洁间、走廊 |
| `prop.dustpan` | 0.22 × 0.13 × 0.26 | 蓝塑料 + 橡胶唇边 | 无 | 清洁间 |
| `prop.squeegee` | 0.34 × 0.04 | 木柄 + 橡胶刮条 | 无 | 清洁间 |
| `prop.spray-bottle` | Ø0.07 × 0.25 | 塑料瓶 + 喷头 + 空白标签 | 无 | 清洁间、后厨 |
| `prop.detergent-jug` | 0.16 × 0.32 | 白塑料 + 提手 + 空白标签 | 无 | 清洁间、洗衣房 |
| `prop.toolbox.repair.cantilever` | 0.24 × 0.20 × 0.44 | 红漆钢 + 钢托盘 + 8 件工具 | 位于箱堆碰撞内 | 修理间、仓库 |
| `prop.jar.screws` | Ø0.09 × 0.13 | 玻璃罐 + 黑盖 + 螺丝/钉子 | 无 | 杂物间、工房 |
| `prop.paint-tin` | Ø0.14 × 0.17 | 钢罐 + 红/蓝/黄标签带 | 无 | 储物间、工房 |
| `prop.carton.kraft.blank` | 0.30–0.40 | 牛皮纸 + 胶带 + 抽象印章 | 箱堆 AABB | 所有仓库 |
| `prop.sack.burlap` | 0.34–0.40 × 0.64 | 黄麻布 + 绳扎口 + 折口 | 麻袋堆 AABB | 仓库、庭院 |
| `prop.rope.coil` | Ø0.24 × 0.06 | 黄麻绳 + 5 圈盘绕 | 无 | 杂物间、器材室 |
| `prop.clothes.folded` | 0.25 × 0.20 × 0.34 | 旧布 + 围巾 | 无 | 更衣室、储物间 |
| `prop.jacket.hanging` | 0.17 × 0.62 × 0.44 | 深绿旧外套 + 铜扣 + 衣架 | 无（挂墙） | 更衣室、储物间 |
| `prop.work-coat.hanging` | 0.16 × 0.78 × 0.40 | 米色工作服 + 红围巾 + 腰带 | 无（挂墙） | 更衣室、清洁间 |
| `prop.newspaper.bundle` | 0.27 × 0.06 × 0.23 | 旧报纸 + 捆绳 | 无 | 储物间、办公室 |
| `prop.wet-floor.sign` | 0.28 × 0.62 | 黄塑料 A 字牌 + 钢条 | 不可达 | 走廊 |
| `prop.extinguisher.cabinet` | 0.40 × 0.60 × 0.14 | 红钢柜 + 深色玻璃 + 铬把手 | 不可达 | 走廊、门厅 |

## 3. 新增 one-off

| id | 说明 | 理由 |
| --- | --- | --- |
| `oneoff.storage.louvred-door` | 0.9 × 2.06 m 旧漆钢门 + 真实开洞的 0.5 × 0.44 m 百叶 + 门框/合页/执手锁/踢脚板 | 本场景的剧情核心：里看外、外看不进 |
| `oneoff.storage.corridor-slice` | 门外的 2.8 × 1.7 m 走廊切片、顶灯、笼式壁灯、灭火器箱、空白告示板、黄色防滑牌 | 为百叶提供一个可信的外部世界；不可达 |
| `oneoff.storage.cantilever-toolbox` | 开盖时托盘随盖抬升 0.075 m 的修理工具箱 | 让玩家在正常站姿下看见工具；只在本场景使用 |
| `oneoff.storage.dust-motes` | 120 个暖色点精灵，集中在裸灯下的光池 | 空气感；无音效、无动态阴影 |

## 4. 家具与陈设统计（实测）

| 项 | 数量 |
| --- | --- |
| 五层货架 | 1 组 × 4 跨 × 5 层 = 20 块层板 |
| 货架立柱 | 10 根 |
| 麻袋 | 5（1 立放 + 2 斜躺 + 1 层板横躺 + 1 顶层横躺） |
| 纸箱 | 6 |
| 油漆罐 | 5 |
| 喷壶 | 3 |
| 水桶/拖把桶 | 5（含 1 只带压水器拖把桶） |
| 衣物 | 6（外套、工作服、3 件折叠衣物、围巾） |
| 绳圈 | 3 |
| 工具 | 8（4 螺丝刀、扳手、锤子、钳子、卷尺） |
| 玻璃罐 | 3 |
| 报纸捆 | 1 |
| 扫把 / 拖把 | 各 1 |
| 监控摄像 | 1（红色录制灯 + 慢速扫视） |
| 门 | 1（锁定，`sceneId: corridor`） |
| 动态对象 | 工具箱盖 + 工具箱托盘、开关拨片、摄像云台、红 LED、尘埃粒子 |
| 光源 | 1 个投影主光 + 8 个非投影点光 + 半球/环境光 |

## 5. 材质表（62 个槽，按族）

| 族 | 关键材质 | 用途 |
| --- | --- | --- |
| 混凝土 | `raw-concrete-wall` / `concrete-reveal` / `concrete-soffit` / `stained-concrete-floor` | 毛坯墙、门洞剖面、天花、水泥地 |
| 旧钢 | `old-galvanised-shelf` / `dark-steel` / `worn-chrome` / `rusted-iron` | 货架、线管、管件、合页、执手 |
| 旧漆 | `faded-door-paint` / `door-frame-steel` / `louvre-vane` | 门扇、门框、百叶 |
| 木 | `worn-wood` / `dark-wood` | 扫把/拖把柄、木箱、箱堆垫板 |
| 纸/纤维 | `kraft-carton` / `kraft-carton-shadow` / `jute-sack` / `jute-rope` / `mop-yarn` / `broom-bristle` | 纸箱、麻袋、绳、拖把、扫把 |
| 布 | `faded-olive-cloth` / `faded-brown-cloth` / `faded-cream-cloth` / `faded-red-scarf` / `discarded-jacket` | 衣物、抹布、围巾 |
| 塑料 | `blue-plastic` / `grey-plastic` / `yellow-plastic` / `white-plastic` / `rubber` | 水桶、喷壶、防滑牌、脚垫 |
| 玻璃/液体 | `jar-glass` / `dirty-water` | 螺丝罐、桶内积水 |
| 金属小品 | `tool-steel` / `brass` / `paint-tin-red` / `paint-tin-blue` | 工具、扣子、油漆罐 |
| 发光 | `bulb-glass` / `corridor-lens` / `recording-led` / `power-led` | 裸灯、走廊灯管、监控 LED |
| 走廊 | `corridor-plaster` / `corridor-dado` / `corridor-vinyl` / `corridor-ceiling` | 门外背景 |
| 特效 | `louvre-light-comb` / `vent-glow` / `blank-label` | 地面光带、门缝光、空白标签 |

## 6. 纹理（19 张程序化生成）

| 贴图 | 尺寸 | 用途 |
| --- | --- | --- |
| `wallConcrete` | 512² | 毛坯混凝土墙/门洞 |
| `ceilingConcrete` | 512² | 板缝、水渍天花 |
| `floorConcrete` | 512 × 1024 | 整间水泥地（不重复） |
| `floorConcreteTile` | 512 × 1024 | 走廊地台的可平铺副本 |
| `steel` | 256² | 旧镀锌、划痕、锈斑 |
| `rust` | 128² | 水管、阀体 |
| `wood` | 256² | 木柄、木箱、垫板 |
| `cardboard` | 256² | 纸箱、瓦楞、胶带 |
| `burlap` | 256² | 麻袋织纹、污渍 |
| `cloth` | 256² | 衣物/抹布织纹 |
| `rope` | 128² | 绳股、绳圈 |
| `paper` | 256² | 旧报纸、纸屑 |
| `doorPaint` | 256² | 旧漆、锈边、掉漆 |
| `label` | 128² | 清洁剂/油漆罐空白标签 |
| `louverLight` | 128 × 256 | 百叶投在地面的光带 |
| `contactShadow` | 128² | 接地阴影 |
| `glow` | 256² | 灯泡光晕、监控红点 |
| `dust` | 64² | 尘埃点精灵 |
| `environment` | 512 × 256 | PMREM 环境反射 |

全部在浏览器内绘制，无位图、无外链；纹理总量约 11 MB（含 mipmap）。
