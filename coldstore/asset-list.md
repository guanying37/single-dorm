# 冷库储藏室 · 资产清单

> `sceneId: coldstore` · 15.12 ㎡ · 2.7 × 5.6 × 2.45 m · 静态合批 40 批、48,670 三角面。
> 尺寸单位 m，pivot 均为底部中心（门为铰链侧），正面 +Z，材质槽标注见括号。

## 1. 复用（来自现有库）

| id | 来源 | 用途 | 备注 |
| --- | --- | --- | --- |
| `lib.static-builder` | `dining/src/utils.js` | 按材质合并静态几何 | 40 个批次 |
| `lib.merge-geometries` | 同上 | 合批底图 | — |
| `lib.uv-scaled-plane` | 同上 | 米制 UV 墙面/天花/地面 | 保温板 0.9 m、吊顶 1.2 m、地台 0.6 m |
| `lib.collision-world` | `dining/src/collision.js` | 2D 圆-盒碰撞 | 9 个碰撞体，3 pass |
| `lib.frustum` | `kitchen/src/geometry.js` | 防寒服锥台壳体 | — |
| `lib.crt-screen` | 同上 | CRT 弧面玻璃 | — |
| `lib.rounded-box` | 同上 | CRT/摄像机外壳 | — |
| `kit.door.insulated` | `kitchen/src/room.js`（冷库门本体） | 后厨侧门扇与门框 | 只新增不可见拾取体，不改几何 |
| `ui.hub` | `single-dorm/src/hub.js` + `styles.css` | 顶部五场景切换、全屏、Toast、黑屏切场 | — |
| `vendor.three` | `vendor/three.module.min.js` | 渲染 | 本地副本 |

## 2. 新增 kit 模块

| id | 尺寸（W × H × D） | 材质槽 | 碰撞 | 复用场景 |
| --- | --- | --- | --- | --- |
| `kit.wall.insulation-panel` | 0.9 × 2.45 模数 | 本白金属面板 + 拉丝 bump | 墙体 AABB | 冷库、后厨扩建 |
| `kit.trim.panel-seam` | 0.016 宽 × 2.33 高 | 硅胶条 + 深色缝 | 无 | 所有保温板房间 |
| `kit.trim.corner-post` | 0.045 × 2.43 | 抛光不锈钢 | 合并进墙 | 同上 |
| `kit.floor.aluminium-deck` | 2.38 × 5.28 | 花纹铝板 + 0.6 m 米制 UV | 地面（无高差） | 冷库、货梯厅 |
| `kit.floor.perimeter-drain` | 0.16 宽 × 0.055 深 | 暗色沟槽 + 不锈钢格栅 | 无 | 冷库、湿区 |
| `kit.ceiling.pu-panel` | 2.7 × 5.6 | 聚氨酯板 + 铝压条 | 无 | 冷库 |
| `kit.ceiling.led-cold` | 0.66 × 0.075 × 0.32 | 不锈钢外壳 + 发光面 + 透明罩 + 霜 | 无 | 冷库、后厨 |
| `kit.ceiling.evaporator` | 0.96 × 0.42 × 0.46 | 不锈钢 + 深色盘管腔 + 金属网罩 | 无（高于 1.8 m） | 冷库 |
| `kit.ceiling.camera-defog` | 0.13 × 0.13 × 0.24 | 白塑 + 除雾加热圈 | 无 | 冷库、后厨 |
| `kit.ceiling.temp-sensor` | 0.14 × 0.06 × 0.19 | 白塑 + 绿色 LED + 毛细管 | 无 | 冷库 |
| `kit.door.insulated-heavy` | 1.26 × 2.1 × 0.11 | 拉丝不锈钢 + 橡胶密封 + 加热丝 | AABB（门框/门扇） | 后厨冷库、冷库 |
| `prop.shelf.stainless-heavy` | 0.72 × 1.98 × 1.35/跨 | 拉丝不锈钢 + 加强筋 | 前后挡边含夹具外廓 | 冷库、干货库 |
| `prop.pan.stainless` | 0.34 × 0.1 × 0.38 | 不锈钢 + 食物 + 保鲜膜 | 无 | 冷库、后厨 |
| `prop.container.clear` | 0.3 × 0.22 × 0.32 | 半透明 PET + 空白标签 | 无 | 冷库、后厨 |
| `prop.carton.kraft` | 0.3 × 0.26 × 0.33 | 牛皮纸 + 封箱胶带 + 空白标签 | 无 | 冷库、仓库 |
| `prop.crt.wall` | 0.62 × 0.5 × 0.4 | 灰白塑料 + 弧面荧光屏 | 独立碰撞（含搁板） | 冷库、后厨 |
| `prop.hygrothermometer` | Ø0.23 × 0.03 | 黄铜 + 米白表面 + 红蓝表针 | 无 | 冷库 |
| `prop.rail.garment` | 1.24 × 0.02 | 不锈钢管 + 挂钩 | 下方挂衣区独立碰撞 | 冷库、更衣室 |
| `prop.cold-coat` | 0.44 × 1.02 × 0.28 | 深海军蓝厚料 + 反光条 + 袖口 | 无（挂衣区整体碰撞） | 冷库 |
| `prop.glove.insulated` | 0.11 × 0.34 | 黑色橡胶 + 反光腕带 | 无 | 冷库 |
| `prop.pipe.insulated-run` | Ø0.054 × 5.6 | 白色保温管 + 管卡 + 穿墙板 | 无 | 冷库 |

## 3. 新增 one-off

| id | 说明 | 理由 |
| --- | --- | --- |
| `oneoff.coldstore.door-release` | 门内侧红色应急拉杆 + 绿色荧光底条 + 压力平衡阀 | 冷库安全构造，只在此门使用 |
| `oneoff.coldstore.evaporator` | 双风扇网罩、盘管腔、滴水盘、冷凝水管 | 冷库独有设备 |
| `oneoff.coldstore.crt-pair` | 门边 CRT + 指针温湿度计组合 | 冷库监控母题，构图专属 |
| `oneoff.coldstore.coldmist` | 2 层 Points 冷雾（370 粒子） | 冷气效果，无音效 |
| `oneoff.coldstore.door-frost` | 门口地面结霜 + 门叶底部霜缘 | 冷库门特有的潮气/结霜 |

## 4. 家具与陈设统计（实测）

| 项 | 数量 |
| --- | --- |
| 货架 | 2 侧 × 3 跨 × 4 层 = 24 个层板 |
| 货架立柱 | 8 根（每侧 4 根，共 16 根含两侧） |
| 不锈钢食物盆 | 30（其中冷冻覆霜 1） |
| 透明食品储物盒 | 27 |
| 无标识纸箱 | 39 |
| 备用空盆 | 4（南东跨叠放） |
| 空白标签 | 66（盒/箱正面） |
| 防寒服 | 2 |
| 防寒手套 | 2 副（挂杆两端） |
| LED 冷库灯 | 2 |
| 监控摄像 | 1（除雾加热圈） |
| 温度传感器 | 1 |
| CRT | 1 |
| 指针温湿度计 | 1 |
| 冷雾粒子 | 370（230 出风口 + 140 通道） |
| 动态对象 | 门叶组、CRT 屏/扫描带、2 组风扇、2 层粒子 |

## 5. 材质表（20 个族）

| 材质 | 用途 | 关键参数 |
| --- | --- | --- |
| `insulation-panel-white` | 墙面保温板 | map/bump 程序化，rough 0.4，metal 0.34 |
| `silicone-seal-light` | 板缝硅胶 | 灰 #9aa5a4 |
| `panel-cut-edge` | 板缝阴影/门洞剖面 | 深灰 |
| `pu-ceiling-panel` | 吊顶 | 暖白、微凹凸 |
| `aluminium-anti-slip-deck` | 地面 | 花纹铝 bump 4.5 mm |
| `drain-channel` | 排水沟 | 暗色金属 |
| `brushed-stainless` / `stainless-shadow` / `polished-stainless` | 货架、门、管件 | 拉丝程序化贴图 |
| `stainless-food-pan` | 食物盆 | 双面不锈钢 |
| `door-gasket-rubber` | 门密封条 | 深黑 |
| `anti-condensation-heater` | 门框/摄像加热丝 | 自发光暖橙，强度 0.28 |
| `cold-led-lens` | 灯发光面 | 不受色调映射 |
| `lamp-dust-cover` / `condensation-frost` | 透明防尘罩 + 冷凝霜 | 透明 + 霜贴图 |
| `aged-crt-grey-plastic` / `crt-grey-shadow` | CRT 外壳 | 灰白 + 阴影灰 |
| `dial-brass` / `dial-cream-face` / `needle-red` / `needle-blue` / `dial-glass` | 指针温湿度计 | 黄铜 + 米白 + 红蓝针 |
| `raw-meat` / `produce` | 食物 | 程序化肉质/蔬菜贴图 |
| `cling-film` | 保鲜膜 | 皱纹 alphaMap，透明 |
| `clear-food-container` / `food-container-lid` | 储物盒 | 半透明 PET + 边框 |
| `kraft-carton` / `kraft-carton-shadow` | 纸箱 | 牛皮纸 + 胶带 |
| `blank-food-label` | 标签 | 抽象色块，无字 |
| `heavy-cold-coat` / `coat-shadow` / `coat-reflective-strip` / `insulated-glove` | 防寒服/手套 | 深蓝 + 反光条 |
| `pipe-insulation-foam` / `copper-line` | 保温管 | 白泡沫 |
| `emergency-release-red` / `glow-release-handle` | 应急拉杆 | 红 + 荧光绿 |
| `freezer-frost` | 结霜 | 半透霜贴图 |
| `evaporator-mesh` / `evaporator-fan` / `evaporator-coil-cavity` | 冷风机 | 网罩/扇叶/深腔 |

## 6. 纹理

| 贴图 | 尺寸 | 用途 |
| --- | --- | --- |
| `wallPanel` | 512² | 白色拉丝保温板 |
| `ceilingPanel` | 512² | 聚氨酯吊顶 |
| `floorPlate` | 512² | 铝防滑花纹 |
| `steel` | 512² | 拉丝不锈钢 |
| `cardboard` | 256² | 牛皮纸 |
| `meat` | 256² | 生肉 |
| `produce` | 256² | 蔬菜 |
| `film` | 256² | 保鲜膜皱纹（map + alphaMap） |
| `frost` | 256² | 冷凝霜 |
| `label` | 128² | 空白标签 |
| `cctv` | 512×384 | CRT 双画面 + 双表 |
| `scanBand` | 64×32 | 扫描带 |
| `contactShadow` / `glow` / `mist` | 128–256² | 接触阴影/灯光辉/冷雾 |
| `environment` | 512×256 | 冷库环境反射 |

全部在浏览器内程序化生成，无位图、无外链；纹理总计约 11 MB。
