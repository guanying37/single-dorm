# danganronpa-adv-3d

用于**给这款 ADV 游戏持续生产新场景与资产**的 skill，不是当前餐厅/宿舍的一次性验收手册。

## 方向

- 输入：场景简报（地点、剧情、尺寸、固定/移动机位、交互、资产、灯光）。
- 输出：可复用的 Three.js 场景模块、模块化 kit、家具/道具规约、固定 shot / 移动 start、接入信息。
- 当前餐厅/宿舍只作为 `references/examples/`，不把它们的数字当通用规则。
- 当前阶段只准备 skill、简报、规格和交接模板；**不生成实际几何/建模提示词**。

## 已确定

| 项 | 决定 |
|---|---|
| 首批 | 教室 → 走廊/玄关 → 体育馆 |
| 后续 | 图书室、裁判场、浴室/更衣室、庭院、宿舍变体 |
| 形态 | **固定机位与移动机位是两个独立 reference**；同场景可共用模型，但分别设计/验收 |
| 粒度 | 模块化 kit + 家具/道具库优先 |
| 运行时 | Three.js 网页优先；米制/PBR/glTF 友好 |
| 风格 | 自然写实骨架 + 弹丸论破图形点缀 |

## 结构

```text
danganronpa-adv-3d/
├─ SKILL.md
├─ references/
│  ├─ production-plan.md
│  ├─ art-direction.md
│  ├─ scene-brief.md
│  ├─ camera-fixed.md
│  ├─ camera-moving.md
│  ├─ modular-kit.md
│  ├─ furniture-and-props.md
│  ├─ lighting-recipes.md
│  ├─ runtime-integration.md
│  ├─ performance.md
│  ├─ validation.md
│  └─ examples/
│     ├─ dining-hall.md
│     └─ dormitory.md
└─ templates/
   ├─ README.md
   ├─ scene-brief.md
   ├─ scene-spec.yaml
   ├─ asset-list.md
   ├─ prompt-handoff.md
   ├─ scene-adapter.js
   └─ validation-checklist.md
```

## 安装 / 自用

把整个目录放到 DSH skill 扫描根之一：

- 用户级：`~/.dsh/skills/danganronpa-adv-3d`
- 项目级：`<project>/.dsh/skills/danganronpa-adv-3d`
- 或配置 `customSkillDirs`

FS provider 直接扫描 `<root>/<name>/SKILL.md`；目录名与 frontmatter `name` 必须一致。

## 使用顺序

1. 读 `references/production-plan.md` 选批次/场景，先确定固定/移动/两者都要。
2. 用 `templates/scene-brief.md` 写简报。
3. 固定机位读 `references/camera-fixed.md`；移动机位读 `references/camera-moving.md`。
4. 用 `templates/scene-spec.yaml` 固化尺寸、`cameraModes.fixed`、`cameraModes.moving`、资产、灯光。
5. 用 `templates/asset-list.md` 列 reuse/new/oneoff。
6. 用 `references/modular-kit.md` 选 kit，缺的模块先补库。
7. 用 `references/furniture-and-props.md` 选家具/道具。
8. 用 `references/lighting-recipes.md` 配灯光。
9. 用 `references/runtime-integration.md` 定场景接口/注册。
10. 用 `references/performance.md` 控预算。
11. 用 `templates/prompt-handoff.md` 检查交接是否完整；实际建模提示词下一阶段再写。

## 当前不做

- 不生成教室/走廊/体育馆几何。
- 不写最终建模提示词。
- 不改现有餐厅/宿舍模型。
- 不新增贴图/参考画。
