# 垃圾处理场 · 资产清单

> 单位 1 unit = 1 m；网格 0.25 m；门高 2.12 m；眼高 1.80 m；玩家半径 0.30 m；墙厚 0.24 m；层高 2.90 m。
> 命名沿用 `room.* / kit.* / prop.* / mat.*`。pivot：家具在底部中心；门在铰链；墙在底部中心；+Z 为正面。
> 静态几何按材质合并为 **49 批 / 31,872 三角面**；下表只列“有名字的资产”，合批后的 draw call 不单独计数。

## 1. 房间壳与建筑构件

| 资产 | 尺寸（m） | 位置 / 说明 | 碰撞 |
| --- | --- | --- | --- |
| `room.garbage.shell` | 4.32 × 5.40 × 2.90 | 净空间；墙厚 0.24 | 4 面墙 AABB |
| `kit.wall.plaster.dirty-white` | 2.4 m 模块 | 程序化脏白涂料：辊痕、水痕、墙根污渍、掉漆、细裂 | 随墙 |
| `kit.floor.concrete.stained` | 4.32 × 5.40 | 单张不重复 512×640 水泥地贴图：油渍、拖痕、裂缝、鞋印、纸屑 | 地面 |
| `kit.ceiling.paint.water-stained` | 4.32 × 5.40 | 脏白顶：水渍、烟熏、细裂、掉漆 | — |
| `kit.trim.skirting-grime` | 0.035 高 | 四周墙根暗色污渍线 | — |
| `kit.door.timber.six-panel` | 1.02 × 2.12 × 0.062 | 黑棕木门；6 凹板 + 线脚；黄铜执手/锁芯/门镜/三只合页/铜踢脚；门下 1.2 cm 缝 | 门框 AABB（静态） |
| `kit.trim.door-reveal` | 0.24 深 | 门洞侧壁与顶板，无黑洞 | — |
| `kit.sign.no-smoking.torn` | 0.42 × 0.50 | 泛黄撕边图形牌；红圈斜杠 + 烟 + 烟缕；四颗锈螺丝 | — |
| `kit.vent.cast-iron` | 0.38 × 0.26 | 西墙低处锈蚀通风格栅 + 6 片斜叶 | — |
| `kit.drain.cast-iron` | 0.36 × 0.36 | 方形地漏 + 7 根格栅 + 铸铁边框 + 暗色淤泥 | — |
| `kit.pipe.rust.valve` | Ø0.064 × 3.8 | 北墙锈水管 + 4 个卡箍 + 红色手轮阀门 | — |
| `kit.conduit.exposed` | Ø0.03 | 南墙—顶棚—东墙明装线管、接线盒 ×4、卡箍 ×4 | — |
| `kit.sprinkler` | Ø0.036 | 吊顶喷淋头（不喷水） | — |

## 2. 家具与大型道具

| 资产 | 尺寸（m） | 位置 | 碰撞 | 说明 |
| --- | --- | --- | --- | --- |
| `prop.bin.industrial.660l` ×2 | 1.14（沿墙）× 0.88 × 1.19 总高 | 东墙 x=1.64，z=-1.62 / -0.10 | 0.94 × 1.20 AABB / 台 | 四轮、锥形开口桶身、桶沿、侧筋、U 形拉手、靠墙侧铰链盖、危险三角贴、锈铭牌；**无内桶/垃圾袋**，底部为螺栓钢封盖 + 提环 + 热缝 |
| `prop.bin.incinerator-seal` ×2 | 0.74 × 1.0，y=0.56 | 桶内底部 | 随桶 | 螺栓钢封盖、中央提环、橡胶密封框、4 组橙色热缝、危险三角贴；对应“桶下为焚烧炉”的设定 |
| `prop.rack.angle-iron.4tier` | 1.58 × 0.42 × 1.84 | 北墙 x=-0.78，z=-2.49 | 1.62 × 0.46 | 4 根角钢 + 8 块层板 + 前后横梁 + 挡边 + 后斜撑 + 锈脚 |
| `prop.broom` | 1.45 长，头 0.31 宽 | 东墙 x≈1.86→2.11，z≈1.62 | 与簸箕共用 0.28 × 0.84 | 木柄、32 根 bristles、木楔、捆扎布条、铁箍 |
| `prop.dustpan.tin` | 0.26 × 0.30，柄 0.85 | 东墙 x=1.90，z=1.96 | 同上 | 凹痕铁皮、卷边、长柄、锈边 |
| `prop.puddle.dark-liquid` | 1.45 × 1.02（贴片） | 西墙根 x=-1.48，z=0.52 | 无（可行走贴片） | MeshPhysicalMaterial，clearcoat 油膜、朝地漏拖尾、3 个液滴 |
| `prop.sign-board` | 0.42 × 0.50 | 南墙 x=1.68，y=1.62 | — | 与警示牌同体 |

## 3. 货架与地面杂物

| 资产 | 数量 | 尺寸 / 变体 | 说明 |
| --- | --- | --- | --- |
| `prop.bag.black` | 6 | half 0.19–0.30，h 0.50–0.86 | 3 个立放扎结（耳朵 + 颈圈），2 个倒伏瘫软，1 个敞口（不规则袋口 + 翻边 + 废纸/罐） |
| `prop.carton.kraft` | 5 | 0.32–0.52 | 4 个落地（1 个开盖含废纸、3 个闭合/受潮），1 个开盖在货架上；间距已重排，不互相嵌入 |
| `prop.paint-tin` | 4 | Ø0.14–0.20，h 0.15–0.24 | 红/蓝/锈三色桶身 + 白铁盖 + 提手 + 空白标签 |
| `prop.jar.screws` | 3 | Ø0.084，h 0.13 | 玻璃罐 + 铁盖 + 6 颗螺栓 + 空白标签 |
| `prop.bottle` | 2 | h 0.19 / 0.24 | 旧塑料瓶/暗瓶 + 瓶盖 |
| `prop.spray-bottle` | 1 | h 0.23 | 蓝灰喷壶 + 喷嘴 + 标签 |
| `prop.drill.dead` | 1 | 0.26 宽 | 黑绿手电钻、夹头、钻头、侧柄、扳机 |
| `prop.hammer` | 1 | 0.28 | 木柄 + 钢锤头 |
| `prop.wrench` | 1 | 0.26 | 开口扳手 |
| `prop.saw-blade` | 1 | Ø0.26 | 锈锯片 + 18 齿 + 轴孔 |
| `prop.screwdriver` | 2 | 0.18 / 0.20 | 红/黄柄 + 钢杆 |
| `prop.tarp.folded` | 1 | 0.42 × 0.30 | 3 层折叠防水布 + 绳圈 |
| `prop.rope.coil` | 2 | Ø0.24 / 0.30 | 麻绳盘绕（货架 + 架上） |
| `prop.bucket.steel` | 2 | Ø0.24 / 0.32 | 铁桶（其一倒扣） |
| `prop.rag` | 2 组 | 0.11–0.30 | 货架抹布、桶沿布条、架下平抹布 |
| `prop.mop-head` | 1 | 0.20 × 0.26 | 架下旧拖把头 |
| `prop.debris.paper` | 11 | 0.04–0.06 | 纸团/废纸（箱内、袋口、地面） |
| `prop.debris.dust` | 6 | 0.06–0.12 | 墙根灰团 |
| `prop.broom.sweepings` | 1 | 0.30 × 0.20 | 扫拢的灰与纸屑 |

## 4. 安防与显示

| 资产 | 尺寸 / 位置 | 说明 |
| --- | --- | --- |
| `kit.camera.corner.box` | 0.095 × 0.085 × 0.20，位于 (-1.94, 2.62, -2.44) | 枪机、遮阳罩、镜头、红色录像点 Sprite、绿色电源灯；支架 + 立管 + 万向节 |
| `kit.monitor.crt.quad` | 0.46 × 0.36 × 0.42，(-1.58, 2.24, -2.47) | 弧面 CRT + 米灰壳 + 控制条 + 旋钮 + 后凸 + 散热槽；四分屏程序化画面；抬到货架上方避免前梁遮挡 |
| `kit.monitor.small` | 0.28 × 0.22 × 0.05，(-1.12, 2.42, -2.56) | 小监视屏 + 支架，位于 CRT 右侧 |
| `kit.recorder` | 0.34 × 0.10 × 0.24，(-1.58, 1.99, -2.57) | 录像机、红/绿 LED、空白面板 |
| `kit.cable.loom` | 2 条 | 从录像机/墙盒落到 1.2 m 的线缆管 |

## 5. 灯光与天花装饰

| 资产 | 位置 | 说明 |
| --- | --- | --- |
| `kit.light.enamel-pendant` | (0.02, 2.52, -0.42) | 吊线 + 接线盒 + 绿搪瓷罩 + 白炽灯泡 |
| `kit.light.caged-bulb` | (0.95, 2.60, 1.62) | 裸灯泡 + 上下铁环 + 4 根弯护条 |
| `kit.light.batten.failing` | (-0.62, 2.83, -2.30)，1.18 m 长 | 冷白灯管 + 灯架 + 两根吊杆；三频闪烁 |
| `kit.light.batten.dead` | (1.60, 2.82, -0.12)，1.08 m 长 | 灯架 + 深色裂管 + 一段斜掉的管段 + 断吊线 |
| `kit.mesh.rusty-wire` ×3 | 西北 / 东南 / 东北天花角 | 锈铁丝网，带下垂弧度与垂丝 |
| `kit.web.cobweb` ×6 | 4 个天花角 + 监控角 + 门头 | 细管状蛛丝扇面 + 两道弧丝 |
| `kit.light.door-strip` | 门底 0.9 × 0.07 | 冷光贴片 + 地面冷光池（加法） |

## 6. 材质槽

| 槽 | 材质 | 用途 |
| --- | --- | --- |
| 墙 | `mat.plaster.dirty-white` | 墙面、门洞、修补面 |
| 地 | `mat.concrete.stained` | 地面、门槛、地漏基座 |
| 顶 | `mat.ceiling.water-stained` | 天花板 |
| 木 | `mat.timber.black-brown`, `mat.timber.dark` | 门、木柄、纸箱压条 |
| 金属 | `mat.steel.galvanised`, `mat.steel.dark`, `mat.steel.polished`, `mat.chrome`, `mat.brass`, `mat.rust` | 桶、货架、管线、五金、锈件 |
| 塑料 | `mat.bin.green`, `mat.bin.black`, `mat.bin.trim`, `mat.bag.black`, `mat.plastic.*` | 桶身、内衬、垃圾袋、瓶、喷壶 |
| 纸/布 | `mat.cardboard`, `mat.cardboard.damp`, `mat.paper.old`, `mat.paper.blank`, `mat.label.blank`, `mat.cloth.*`, `mat.rope` | 纸箱、废纸、标签、抹布、绳 |
| 玻璃/液体 | `mat.crt.lens`, `mat.dead-tube`, `mat.puddle`, `mat.dirty-water` | CRT 面、坏灯管、液体 |
| 发光 | `mat.crt.feed`, `mat.crt.feed.small`, `mat.bulb.glass`, `mat.tube.lens`, `mat.led.red`, `mat.led.green` | 屏幕、灯泡、灯管、LED |
| 图形 | `mat.sign.no-smoking`, `mat.bin.hazard` | 警示牌、桶面三角贴 |

## 7. 程序化贴图（21 张生成 + 环境图）

| 贴图 | 尺寸 | 内容 |
| --- | --- | --- |
| `wallPaint` | 512² | 脏白涂料、辊痕、水痕、掉漆、细裂、墙根污渍 |
| `ceilingPaint` | 512² | 脏白顶、水渍、熏黑、掉漆 |
| `floorConcrete` | 512 × 640 | 水泥地、油渍、拖痕、裂缝、鞋印、纸屑（整间不重复） |
| `warningSign` | 256 × 312 | 泛黄撕边“禁止吸烟”图形牌（透明切边） |
| `hazardSticker` | 128² | 黄底黑三角警示贴（透明切边） |
| `crtFeed` | 512 × 384 | 四格监控画面：走道透视线、桶/货架/门块面、扫描线、噪点、红点 |
| `puddle` | 256 × 192 | 暗色液体 + 油膜反光 + 拖尾 + 气泡（颜色 + alpha） |
| `bagPlastic` | 256² | 黑色塑料袋褶皱、拉伸纹、高光 |
| `steel` | 256² | 旧镀锌钢 |
| `rust` | 256² | 锈斑 |
| `wood` | 256² | 旧木纹 |
| `cardboard` | 256² | 瓦楞纸 |
| `burlap` | 256² | 麻袋布（保留材质，当前场景未使用） |
| `cloth` | 256² | 旧布 |
| `rope` | 128² | 麻绳 |
| `paper` | 256² | 泛黄纸 |
| `label` | 128² | 空白标签（抽象色块，无字） |
| `contactShadow` | 128² | 径向接触阴影 |
| `glow` | 256² | 柔光晕 |
| `dust` | 64² | 尘埃点 |
| `environment` | 512 × 256 | 室内反射环境（暖灯 + 绿屏 + 门缝冷光） |

## 8. 复用与 one-off

### 复用

- `dining/src/utils.js`：`StaticBuilder / mergeGeometries / uvScaledPlane / trs / mulberry32 / disposeObject`。
- `dining/src/collision.js`：`CollisionWorld`。
- `kitchen/src/geometry.js`：`roundedBoxGeometry / crtScreenGeometry / frustumGeometry / bowlGeometry`。
- `storage/src/geometry.js`：`sackGeometry / slumpedSackGeometry / ropeCoilGeometry / bucketGeometry / conduitGeometry`。
- 同页 hub、`styles.css`、本地 Three.js、`serve.py` / `start-preview.cmd`。

### one-off

- 门下 1.2 cm 冷光缝 + 冷光地池（走廊不建模）。
- `probeBlindSpot()` 几何探针：镜头轴—货架夹角 vs 34° 半角。
- 三频故障灯管闪烁（确定性函数，不用随机数）。
- 靠通道侧铰链、避开东墙的桶盖开启方式。
- 敞口垃圾袋的不规则袋口 + 翻边 + 框内废纸/罐。
