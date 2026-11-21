# 住宿区 2F · 验收记录

日期：2026-11-21

## 结论

通过。原「生活区二层走廊」场景已删除：顶部不再有「二层走廊」tab，`single-dorm/corridor/` 文件夹已移除，原先共享的贴图 / 材质 / 合批 / 碰撞代码抽到 `single-dorm/shared/`，住宿区 2F 继续使用。住宿区现在是唯一的二层走廊场景。

本轮范围：走廊、门、门禁、**真实楼梯间**。宿舍 / 淋浴 / 厕所 / N 储物 / 电梯井不建内部；M 大厅不重建，一樘门切到现有休息室大门外的楼梯厅。

## 检查项

| 检查 | 结果 |
| --- | --- |
| 顶部 tab | 10 个：单人宿舍、学生餐厅、餐厅后厨、冷库储藏室、杂物间、垃圾处理场、阅览室、二层休息厅、住宿区 2F、医务室；无「二层走廊」 |
| 旧场景删除 | `single-dorm/corridor/` 不存在；`#corridor` 自动映射到 `#residence`；旧 `/corridor/` 不再提供页面 |
| 共享 kit | `single-dorm/shared/{utils,textures,materials,collision}.js`；住宿区所有导入均指向 shared |
| 独立页加载 | `READY true`，无 console error / network 404 |
| 同页 hub | `READY true`，标题「住宿区 2F」，10 个 tab 单行 |
| 宿舍门 | 10 男 + 8 女 = 18 扇，锁定提示 |
| 湿区门 | 4 扇：男淋浴 / 男厕所朝北走廊，女淋浴 / 女厕所朝南走廊；「预留空间」 |
| N 杂物间门 | 1 扇，北走廊北墙 x = 54，锁定 |
| 楼梯间 | x 51.9–56.1，z 24.5–30.1；8 级踏步、上层平台、铁链、扶手、下层防火门；防火门可开合，初始开启 |
| 电梯 | 东走廊东墙 z = 18.65 双扇门 + 呼叫面板；不建井道 |
| 休息室入口 | **1 樘**，北走廊 z = 8.3，x = 10.2；切到休息室后落点 `x=-17.2, z=0`，即休息室 2.8 m 大门外的楼梯厅 |
| 铁栅栏门 | 平板解锁时 E 开 / 关；锁定时提示「需刷学生平板」 |
| 平板 | 默认已解锁；HUD「平板 · 已解锁」；`tablet.lock()` 后「平板 · 未解锁」 |
| 场景切换 | residence ↔ lounge、residence ↔ corridor（旧 hash 映射 residence）正常；hash 正确 |
| 门后空间 | 未建门后为黑背板；楼梯间是唯一可见内部 |
| 碰撞 | 楼梯间门洞 / 梯口铁链 / 铁栅栏门动态碰撞正常 |
| 性能 | 独立页 38 calls / 14,052 tris / 27 batches / 27 interactives / 8 textures / 60 FPS；hub 40 textures，1600×900 预热后约 48–60 FPS |
| 截图 | `preview/final/` 16 张，包含楼梯间与单樘休息室门 |

## 复现

```powershell
# 独立页
node residence/tools/check.mjs `
  "http://127.0.0.1:8123/residence/standalone.html?capture=1&hud=0" `
  "residence/preview/final/_check.png"

# 同页
node residence/tools/check.mjs `
  "http://127.0.0.1:8123/?scene=residence&capture=1" `
  "residence/preview/final/hub.png"

# 交互（通用 eval）
node single-dorm/tools/eval.mjs `
  "(() => { const p = __PREVIEW__; return { scene: p.getScene(), tablet: p.tablet.unlocked, stair: p.residence.interactiveById.get('door.stair')?.open, portal: p.toggle('portal.lounge') }; })()"

# 截图
$env:VIEWS="hero,stair,lounge-portal"; node residence/tools/capture.mjs final 9222
```

## 已验证的交互

- `door.stair`：初始 `open: true`，value 1；E 关闭后梯段被门挡住，再开恢复。
- 梯口铁链：玩家能进入上层平台，但不能下梯。
- `portal.lounge`：`{ sceneId: 'lounge' }`；切场后 `getScene() === 'lounge'`，相机 `x=-17.2, z=0`，面向休息室真正的大门。
- `gate.iron`：解锁时 `open: true/false`；锁定时 `{ locked: true, tablet: true }`。
- `setScene('residence')` / `setScene('lounge')` / 旧 `setScene('corridor')`：场景与 hash 正确；旧 corridor 映射 residence。
- `getStats()`：`interactives: 27`，`batches: 27`，`triangles: 14052`。

## 性能

| 指标 | 独立页 | 同页 hub（十个场景） |
| --- | --- | --- |
| draw calls（hero） | 38 | 38 |
| triangles | 14,052 | 13,478–14,052 |
| batches | 27 | 27 |
| interactives | 27 | 27 |
| textures | 8 | 40 |
| FPS 1600×900 | 60 | 约 48–60（共享 GPU / 窗口焦点） |

## 已知边界

- 宿舍 / 湿区 / N 储物 / 电梯井内部未建；电梯只有门和呼叫面板。
- 楼梯间已建上层平台与 8 级踏步，下层空间未建；铁链封住，不能下梯。
- 休息室入口是单向切场；从休息室回住宿区暂用顶部 tab（未在休息室加返回门）。
- 原「生活区二层走廊」已删除，旧 `#corridor` 地址会落到住宿区 2F。
