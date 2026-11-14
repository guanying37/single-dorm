# 光影、材质与阴影方向

本文件把“影子必须垂直向下”落实为可执行的光照契约。场景陈设见 `restaurant.md`；控制器见 `first-person.md`。

## 1. 总契约

- **所有投影主光方向 = 世界坐标 `(0, -1, 0)`。**
- 只允许一盏灯 `castShadow = true`。
- 其他灯只做光池、洗墙、环境补光，一律 `castShadow = false`。
- 不使用侧向 key/fill 来“补立体感”；立体感来自材质、AO/接触阴影、环境光和灯具本身的明暗。
- 不使用 Bloom/SSAO/后处理链。
- 阴影只烘焙一次；动态门/抽屉不投影。

## 2. 餐厅

### 2.1 主阴影

```js
const key = new THREE.DirectionalLight(0xfff6ea, 0.72);
key.position.set(0, 22, 0);          // 光源在正上方
key.target.position.set(0, 0, 0);    // 方向 (0,-1,0)
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -22;
key.shadow.camera.right = 22;
key.shadow.camera.top = 16;
key.shadow.camera.bottom = -16;
key.shadow.camera.near = 1;
key.shadow.camera.far = 48;
key.shadow.camera.up.set(0, 0, 1);   // 避免垂直 lookAt 退化
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.03;
```

要求：

- 灯位在房间正上方，x/z 为 0。
- 不要给 x/z 加侧向偏移。
- `shadow.camera.up` 必须设置；否则垂直向下的 lookAt 可能出现退化/翻转。
- 阴影相机覆盖整个 36×22 m 区域。

### 2.2 其他灯

- 3 盏聚光灯：只做桌面光池，`castShadow = false`。
- 4 盏洗墙灯：只做墙面明暗，`castShadow = false`。
- Hemisphere + Ambient：低强度环境补光。
- 走廊点光：只照亮端景，`castShadow = false`。
- 不要添加第二盏 directional/spot 投影。

### 2.3 为什么不要侧向 fill

侧向 fill 会让物体一侧变亮，但地面阴影仍然垂直向下；玩家会看到“影子从侧面来”的矛盾。需要侧面明暗时，用：

- 材质 roughness/环境反射；
- 局部非投影灯；
- 接触阴影；
- 墙面洗墙灯。

## 3. 宿舍

### 3.1 唯一主光

宿舍只有吊灯主光：

- 可见吊灯：吸顶/吊杆 + 灯罩 + 发光体。
- 非投影点光/聚光：模拟灯罩下的暖光溢出。
- **删除**侧向 `fill`、`windowSpill` 以及任何第二主光。
- 承载阴影的垂直定向光视为“吊灯的投影代理”，不新增可见灯具。

### 3.2 主阴影

```js
const key = new THREE.DirectionalLight(0xffd2a0, 1.15);
key.position.set(0, 2.6, 0);         // 略低于天花，避开天花遮挡
key.target.position.set(0, 0, 0);    // 方向 (0,-1,0)
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -4;
key.shadow.camera.right = 4;
key.shadow.camera.top = 4;
key.shadow.camera.bottom = -4;
key.shadow.camera.near = 0.05;
key.shadow.camera.far = 4.8;
key.shadow.camera.up.set(0, 0, 1);
key.shadow.bias = -0.00022;
key.shadow.normalBias = 0.018;
```

- 位置低于天花，避免天花遮住整个阴影相机。
- 若房间高度变化，light y 取“天花下方 0.1–0.2 m”。
- 强度按场景调整，但方向不能改。
- 可见吊灯点光 `castShadow = false`，只负责暖色填充。

### 3.3 环境光

- HemisphereLight 可保留，强度约 0.5–0.65。
- AmbientLight 可选，强度很低。
- 不保留窗边冷色点光（windowSpill）；如果确实需要窗光，只能做非投影、非主光的材质/环境效果，且不能破坏“只有吊灯”的文字要求。当前项目按文字要求删除。

## 4. 接触阴影

- 接触阴影/软阴影贴片可以保留，用来补桌脚、床脚、柜脚的接地感。
- 它们不是方向光，不能产生明显的侧向投影。
- 贴片应贴合地面，不能穿地/悬空。
- 透明度低，避免像第二套影子。

## 5. 材质与色调

| 部位 | 建议 |
|---|---|
| 墙面 | 暖白/象牙白，轻微 bump；餐厅无壁纸 |
| 地面 | 暖灰石材，低光泽；宿舍木地板 |
| 木作 | 浅橡木/胡桃木，粗糙度中等 |
| 金属 | 黄铜/钢，避免镜面 |
| 布料 | 亚麻/棉，粗糙度高 |
| 植物 | 低饱和绿，叶片双面 |
| 发光体 | 暖白，emissive 不要过曝 |

- PBR：`MeshStandardMaterial` 为主。
- 环境贴图用程序化 equirect + PMREM。
- 单张纹理 ≤ 1024²；总纹理 ≤ 16 MB。
- 不要用纯黑材质；阴影要有层次。

## 6. 阴影性能

- 阴影贴图只烘焙一次：`renderer.shadowMap.autoUpdate = false`。
- 初次渲染、切场景、动画物体改变时设置 `needsUpdate = true`。
- 动态门/抽屉 `castShadow = false`，避免每次动画重烘焙。
- 餐厅 2048²；宿舍 1024² 足够。
- 不要给每盏灯都开 shadow。

## 7. 验收

### 7.1 方向测试

1. 在空地上放一个高 1.5 m 的细柱或植物。
2. 从斜上方观察地面。
3. 影子应落在柱脚正下方/附近，不能明显向左/右/前/后偏。
4. 换一个位置重复；方向应保持一致。

### 7.2 宿舍唯一主光

- 检查场景灯光列表：只应有一盏 `castShadow = true`。
- 不应存在 `windowSpill`、侧向 fill、第二盏主光。
- 吊灯可见，点光/定向光都逻辑上属于吊灯。

### 7.3 视觉

- [ ] 天花板灯具与影子方向一致。
- [ ] 没有侧向影子。
- [ ] 没有第二套矛盾阴影。
- [ ] 没有过曝白墙、纯黑阴影。
- [ ] 门/抽屉动画不触发阴影重烘焙。
- [ ] 宿舍只有吊灯主光。
- [ ] 餐厅/宿舍均无 Bloom/SSAO。

## 8. 常见错误

- 用 `DirectionalLight` 但忘记设 `shadow.camera.up`，垂直光导致阴影矩阵退化。
- 灯在 (10,14,9)，却声称“顶光”。
- 主光垂直，但保留一盏侧向 fill，造成表面明暗与影子矛盾。
- 宿舍保留 windowSpill，违反“只有吊灯”。
- 动态门参与 castShadow，开门时重新烘焙卡顿。
- 接触阴影贴片偏移，看起来像第二套方向影子。
- 用纯黑环境光/材质，导致阴影死黑。
