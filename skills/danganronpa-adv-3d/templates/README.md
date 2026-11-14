# 模板

这些模板服务于「场景简报 → 资产清单 → 场景规格 → 建模提示词交接」。当前阶段不生成几何。

## 文件

| 文件 | 用途 |
|---|---|
| `scene-brief.md` | 人读的场景简报模板 |
| `scene-spec.yaml` | 机器可读的场景规格 |
| `asset-list.md` | 资产清单表 |
| `prompt-handoff.md` | 交给下一阶段建模提示词的交接清单（不是提示词本身） |
| `scene-adapter.js` | 运行时场景接口骨架（无几何） |
| `validation-checklist.md` | 场景/资产验收清单 |

## 使用顺序

1. 填 `scene-brief.md`；固定机位与移动机位分两节，两者都要时都填。
2. 用 `scene-spec.yaml` 固化尺寸、`cameraModes.fixed`、`cameraModes.moving`、资产、灯光。
3. 用 `asset-list.md` 列 reuse/new/oneoff。
4. 用 `prompt-handoff.md` 检查交接是否完整（固定 shot / 移动 start 分开）。
5. 建模提示词阶段再根据交接包生成实际提示词；当前不要写最终提示词。

## 不要

- 不要在模板里预填一个完整房间并当成最终模型。
- 不要把当前餐厅的数字复制到所有场景。
- 不要跳过简报直接写提示词。
- 不要把 `scene-adapter.js` 当完整场景；它只是接口。
