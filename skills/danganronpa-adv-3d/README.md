# danganronpa-adv-3d

可复用的「弹丸论破风格 ADV 3D 场景」skill。当前以学生餐厅 + 单人宿舍为 reference case，规则可迁移到同类 Three.js 室内场景。

## 已确认的设计选择

| 项 | 选择 |
|---|---|
| 边界 | 1A：通用方法 + 当前项目 reference case |
| 结构 | 2A：一个 umbrella skill + references |
| 模板 | 3C：包含脚手架、第一人称、碰撞、本地服务器、验收脚本 |
| 宿舍 | 不展开建模细则；只要求同页接入、可打开、灯光/碰撞符合硬约束 |
| 影子 | 所有投影主光方向必须是 `(0, -1, 0)`，垂直向下 |
| 宿舍灯光 | 按文字：只有吊灯主光；删除 windowSpill 与侧向 fill |

## 结构

```text
danganronpa-adv-3d/
├─ SKILL.md
├─ references/
│  ├─ requirements.md
│  ├─ restaurant.md
│  ├─ first-person.md
│  ├─ lighting.md
│  ├─ integration-preview.md
│  └─ validation.md
└─ templates/
   ├─ README.md
   ├─ scaffold/
   ├─ runtime/
   ├─ preview/
   └─ validation/
```

## 安装 / 自用

把整个 `danganronpa-adv-3d/` 目录放到 DSH 的 skill 扫描根之一：

- 用户级：`<dshHome>/skills/`（通常是 `~/.dsh/skills/`）
- 项目级：`<project>/.dsh/skills/`
- 或配置 `customSkillDirs`

FS provider 会扫描 `<root>/<name>/SKILL.md`，不需要修改 profile 的 bundle 列表。目录名与 frontmatter `name` 必须都是 `danganronpa-adv-3d`。

## 模板自检

```powershell
node --check templates/runtime/first-person.js
node --check templates/runtime/collision.js
node --check templates/runtime/static-builder.js
node --check templates/scaffold/src/hub.js
node --check templates/scaffold/src/scenes/dorm.js
node --check templates/scaffold/src/scenes/dining.js
node --check templates/validation/capture.mjs
python -m py_compile templates/preview/serve.py
```

模板的最小运行方式见 `templates/README.md`。模板只用于复制，不直接在 `templates/` 内运行。

## 与当前项目的关系

- `single-dorm/` 内的实现是 reference case，不是 skill 的运行时依赖。
- `SKILL.md` 的默认值来自当前项目；若要复用到其他场景，改 `references/requirements.md` 的 P/T 层，不要改 H 层。
- 所有投影主光垂直向下、宿舍只有吊灯主光是当前硬约束。
