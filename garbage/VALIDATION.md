# 垃圾处理场 · 验收记录

> 日期：2026-11-21
> 场景：`garbage` · 垃圾处理场（4.32 × 5.40 × 2.90 m / 23.33 ㎡ / 4 : 5）
> 环境：Windows · Microsoft Edge 158（headless new）· ANGLE D3D11 · NVIDIA GeForce GTX 1060 3GB · 1600 × 900 · `?capture=1`
> 入口：独立页 `garbage/standalone.html`；同页 `/#garbage`（9 个 tab 合并页）。

## 结论

| Gate | 结果 |
| --- | --- |
| 加载 / 控制台 | **通过**：0 error / 0 warning |
| 同页注册 / 切换 | **通过**：第 6 个 tab「垃圾处理场」；`dining → garbage` 与 `garbage → dining` 均正常 |
| 交互 | **通过**：门锁定、灯开合、桶盖 0 ↔ -1.65 rad |
| 移动 / 碰撞 | **通过**：421 步巡场 + 4 次冲撞，最大穿透 **0** |
| 监控死角 | **通过**：镜头轴—货架夹角 **52.6°** > 半角 **34°** |
| 性能 | **通过**：hero 73 calls / 34,516 tris；最高 88 calls / 37,664 tris；空载 60 FPS |
| 视觉 / 截图 | **通过**：13 张 1600×900 预览；无黑洞、无漂浮面片、无门后套门、无明显穿模 |
| 约束 | **通过**：无人物、无文字贴图、无自绘二维画作、无音频、无 CDN、无网络请求、零侧倾、单投影主光 |

---

## 1. 加载与控制台

工具：`node tools/check.mjs 9335`（独立页）；`node tools/hub-check.mjs 9336`（合并页）。

```json
{
  "scene": "garbage",
  "ready": true,
  "errors": [],
  "warnings": [],
  "tabs": [
    "dorm","dining","kitchen","coldstore","storage","garbage","readingroom","lounge","infirmary"
  ],
  "hubSwitch": { "garbage_to_dining": "dining", "back_to_garbage": "garbage" }
}
```

- 独立页与合并页都能完成 boot；`window.__PREVIEW_READY__` / `window.__GARBAGE_READY__` 为 true。
- `StaticBuilder` 无 missing material 警告；所有材质槽均有定义。
- `garbage/index.html`：`file://` 下显示“需要通过本地服务器打开”；HTTP 下重定向 `../#garbage`。
- 合并页 9 个 tab 全部存在，「垃圾处理场」标题、eyebrow“Hope's Peak · Refuse Yard”、控制条均正确。

## 2. 交互

| id | 测试 | 结果 |
| --- | --- | --- |
| `door.garbage` | `toggleInteractive` | `locked: true`, `open: false`, `sceneId: "corridor"`；toast「垃圾处理场门 · 暂未开放（预留走廊切换）」 |
| `light.switch` | 关灯等待 0.9 s | `lightOn: false`, `lightLevel 0.01`, key 0.20, 主灯 0.02, 故障灯管 0.36（仍亮） |
| `light.switch` | 开灯等待 0.9 s | `lightOn: true`, `lightLevel 0.99`, key 0.91, 主灯 2.68 |
| `bin.b` | 开盖等待 1.6 s | `open: true`, lid `rotation.z = -1.65 rad`（向墙倾靠） |
| `bin.b` | 合盖等待 1.6 s | `open: false`, lid `rotation.z = 0` |

- 门扇、锁芯、开关、桶盖都有独立拾取根；门锁定不切场，桶盖与灯可反复开合。
- 动态桶盖不投阴影，静态阴影贴图不会因开盖而错位。

## 3. 移动与碰撞

```yaml
playerRadius: 0.30
eyeHeight: 1.80
walk: 2.4  run: 4.8
substep: 0.06
colliders: 11
```

- 巡场路线：门口 → 北端货架前 → 西墙液体 → 西南垃圾袋 → 中央 → 垃圾桶前 → 回门口；**421 个 1/60 s 步进**，全程 `worstPenetration = 0`。
- 冲撞测试（Shift 全速 180 步 / 3 s）：
  - 东向撞桶：停在 `x = 0.91`（桶前脸 1.20 − 半径 0.30 + 0.01），穿透 0。
  - 北向撞墙：停在 `z = -1.96`（货架前 2.26 − 0.30），穿透 0。
  - 西向撞垃圾袋：停在 `x = -0.80`（袋堆东缘 −1.10 + 0.30），穿透 0。
  - 南向撞门：停在 `z = 2.29`（门框 2.59 − 0.30），穿透 0。
- 墙角、桶角、袋堆角均不卡死；0.06 m 子步进下 4.8 m/s 不穿透。
- 门扇关闭但门框有碰撞；门缝上方与两侧有门洞侧壁，从任何角度都看不到“门后套门”或黑洞。

## 4. 监控死角

```json
{
  "camera": { "x": -1.94, "y": 2.62, "z": -2.44 },
  "rack": { "x": -0.78, "y": 1.1, "z": -2.49 },
  "distance": 1.8,
  "angleDegrees": 52.6,
  "lensHalfAngleDegrees": 34,
  "blind": true
}
```

- 镜头带 ±0.12 rad 左右扫视与 ±0.014 rad 俯仰扰动；货架顶部与架面都落在半角 34° 之外。
- 货架、架下杂物、桶侧与垃圾袋堆均可被玩家看见，但不会被该镜头完整覆盖——对应设计意图“监控死角的地面放生锈置物架”。

## 5. 性能

| 指标 | 数值 |
| --- | --- |
| 静态合批 | **49 批 / 31,872 三角面** |
| hero 视角（1600×900） | **73 draw calls / 34,516 三角面** |
| 全场景最高 | **88 draw calls / 37,664 三角面**（灯 + 屏 + 粒子 + 交互体全开） |
| 纹理对象 | 21（20 张程序化 + 1 环境图）；单张 ≤512²，地板 512×640；约 5.4 MB |
| 几何对象 | 90 |
| 阴影 | 1 张 2048² 静态烘焙；动态物体不投影 |
| 后处理 | 无（无 Bloom / SSAO / TAA） |
| FPS | **空载 60.0**；本轮验收与同机其他场景并行时 **50.7 / 55.4 / 53.7**（主机负载所致），场景本身 73 calls / 3.45 万三角面 |
| GPU 帧时间 | **约 2 ms**（空载 `gl.finish()` × 12 帧均值，早前测量；本轮未复测） |
| 预算 | 移动机位 ≤45 万三角面 / ≤90 draw calls；实测远低于预算 |

复测：`node tools/perf.mjs 9335` → `preview/fps.json`。

> 本轮与同机其他场景的构建/截图并行，rAF 采样会受主机负载影响；场景复杂度（73 calls / 3.45 万三角面）远低于预算。

## 6. 截图

| 文件 | 内容 | draw calls / tris |
| --- | --- | --- |
| `preview/hero.jpg` | 全景：双桶、门、警示牌、扫把/簸箕、垃圾袋、纸箱 | 73 / 34,516 |
| `preview/hero-ui.jpg` | 带 HUD 的全景 | 73 / 34,516 |
| `preview/bins.jpg` | 两台带轮工业垃圾桶近景 | 40 / 29,312 |
| `preview/bin-open.jpg` | 近黑桶盖打开、向墙倾靠 | 48 / 30,514 |
| `preview/rack.jpg` | 四层锈货架与杂物 | 63 / 34,006 |
| `preview/camera.jpg` | 高位 CRT 四分屏 + 小屏 + 录像机 | 62 / 33,954 |
| `preview/door.jpg` | 黑棕木门、警示牌、扫把/簸箕 | 56 / 29,804 |
| `preview/sign.jpg` | “禁止吸烟”图形牌近景 | 33 / 25,442 |
| `preview/bags.jpg` | 黑色垃圾袋与废纸箱 | 35 / 28,228 |
| `preview/puddle.jpg` | 墙根暗色液体与地面 | 42 / 30,774 |
| `preview/floor.jpg` | 地漏与水泥地细节 | 48 / 30,582 |
| `preview/ceiling.jpg` | 白炽吊灯、故障灯管、铁丝网、水渍顶 | 47 / 30,020 |
| `preview/light-off.jpg` | 关灯变体：故障灯管 + 门缝冷光 + 监控绿光 | 73 / 34,516 |

截图工具：`node tools/capture.mjs 9335` → `preview/final/*.png` → Pillow 转 JPG（quality 84）。

## 7. 约束检查

| 约束 | 结果 |
| --- | --- |
| 无人物 | ✅ 场景内无人物模型 |
| 无文字 / 字体贴图 | ✅ 警示牌只使用禁止吸烟图形；桶面只有三角警示图与空白铭牌；CRT 只有抽象色块/扫描线，无可读字符 |
| 无自绘二维画作 | ✅ 所有“画/牌/屏幕”均为程序化 Canvas 图形，不含位图人物/海报 |
| 无音频 | ✅ 无 Audio / 无外部音频 |
| 无 CDN / 无网络请求 | ✅ Three.js 本地；所有贴图 Canvas 生成 |
| 零侧倾 | ✅ `camera.rotation.z = 0`；俯仰 ±83° |
| 单一投影主光 | ✅ 只有 1 盏 DirectionalLight 投影，方向 `(0,-1,0)` |
| 无门后套门 / 黑洞 | ✅ 门后有 0.24 m 洞口 + 深色封板；走廊不建模，只留门缝冷光 |
| 无漂浮装饰 | ✅ 铁丝网、蛛网、纸屑、尘埃均有厚度/贴地逻辑；无漂浮面片 |
| 单场景可独立验收 | ✅ 独立页 + `check.mjs` + 截图 + 性能数据 + 资产清单 |

## 8. 穿模与结构修复（2026-11-21）

| 问题 | 修复 |
| --- | --- |
| 悬空的压扁纸箱（南墙前 0.42 m 高、无支撑的倾斜薄板） | 删除该 one-off；纸箱只保留落地/货架上、有支撑的版本 |
| 货架底层板下塞了 0.28 m 水桶和 0.24 m 麻袋，穿出 0.12 m 层板 | 移除桶与麻袋；层板下只留 ≤5 cm 的平抹布、拖把头 |
| CRT 屏幕被货架前梁/立柱横穿 | 监控整套抬到货架上方：CRT `y=2.24`、小屏 `y=2.42`、录像机 `y=1.99`；镜头 `y=2.62`；屏幕与货架前梁脱开 |
| 桶盖边缘细杆状突出物（盖面压条/提手） | 删除盖面多余压条与提手，只保留铰链筒；盖面轮廓干净 |
| 桶盖开向通道、开启角度与墙冲突 | 铰链改到靠墙侧；开盖 `-1.65 rad`，自由边距东墙约 2–3 cm，向墙倾靠，不扫通道、不穿墙 |
| 内桶/黑色垃圾袋与桶盖、桶身穿插 | 移除内桶、黑袋和内散垃圾；桶体改为焚烧炉投放口，底部加 0.56 m 螺栓钢封盖 + 提环 + 热缝，内部无内桶 |
| 落地纸箱互相嵌入 | 4 个落地箱重新排距，另 1 个开盖箱在货架上；互不嵌入，且不穿墙/门框 |

## 9. 已知限制 / one-off

- **液体无碰撞**：暗色液体是贴地 alpha 贴片，可走近但不阻挡；符合“地面污渍”语义。
- **货架与杂物为静态合批**：不可单独拾取/翻找；后续若要“翻找垃圾”玩法，需把指定箱/袋拆成独立 group 并加交互。
- **故障灯管不可交互**：作为环境异常常亮闪烁（独立回路），不受顶灯开关控制。
- **门外走廊未建模**：门锁定，仅门下 1.2 cm 缝与冷光池；后续接 `corridor` 时替换 `sceneId` 并增加门外切片。
- **垃圾桶是焚烧炉投放口**：内部没有可取出的内桶，底部为螺栓钢封盖；桶盖为单一铰链动画，开盖向墙倾靠但不模拟与墙的软接触。
- **headless 截图 FPS 受主机负载影响**：同机并行其他场景构建时会降到 50–56 FPS；空载 60 FPS，见性能节。

## 10. 复现命令

```powershell
# single-dorm 目录
python -m http.server 8123 --bind 127.0.0.1

# Edge headless（示例）
msedge --headless=new --remote-debugging-port=9335 --user-data-dir=%TEMP%\edge-garbage `
  --enable-gpu --use-angle=d3d11 --ignore-gpu-blocklist `
  "http://127.0.0.1:8123/garbage/standalone.html?capture=1&hud=0"

# 在 garbage/ 目录
node tools/check.mjs 9335       # 加载/交互/碰撞/盲区/性能
node tools/capture.mjs 9335     # 13 张定帧截图
node tools/perf.mjs 9335        # 60 FPS / 帧时间
```
