# 同页集成与本地预览

本文件解决“两个场景必须在一个网页里，且本地能打开”的问题。第一人称细节见 `first-person.md`；验收见 `validation.md`。

## 1. 目标

- 一个页面，一个 renderer，两个 scene 实例。
- 顶部「单人宿舍 / 学生餐厅」切换；不刷新页面。
- `/` 默认宿舍；`/#dining` 直接餐厅；`/dining/` 自动跳转。
- 两个场景共用 UI 语言，但各自保留相机和交互方式。
- 宿舍必须能打开，不能出现“另一个场景打不开”。

## 2. 架构

```text
index.html
  ├─ canvas
  ├─ HUD（标题、场景切换、FPS、全屏）
  └─ src/hub.js
       ├─ renderer / camera
       ├─ dormScene   （固定视点 / 环顾）
       ├─ diningScene （第一人称行走）
       ├─ FirstPersonControls
       └─ scene switch / routing / input
```

### 场景适配器

每个场景至少暴露：

```js
{
  scene,                 // THREE.Scene
  cameraHome,            // 固定视点场景使用
  collision,             // 行走场景使用
  interactiveMeshes,     // 可交互 mesh 数组
  interactiveById,       // Map<id, item>
  update(dt, elapsed),
  toggleInteractive(id),
  getInteractiveState(),
  setInteractive(id, open),
}
```

`hub.js` 不关心餐厅/宿舍内部；只负责：

- 创建场景；
- 切换 active；
- 相机/控制器；
- 输入与射线；
- HUD、FPS、全屏；
- 路由。

## 3. 场景切换顺序

```js
function setScene(next) {
  if (active === next) return;

  // 1. 保存旧场景视角
  if (active === 'dining') diningView = controls.getView();

  // 2. 禁用旧控制器、清键
  controls.enabled = false;
  controls.keys.clear();

  // 3. 切换 active
  active = next;

  // 4. 恢复目标相机
  if (next === 'dining') {
    camera.near = 0.05;
    camera.far = 90;
    camera.fov = 68;
    controls.enabled = true;
    controls.keys.clear();
    controls.setView(diningView || START);
  } else {
    camera.near = 0.035;
    camera.far = 45;
    camera.fov = dormHome.fov;
    camera.position.copy(dormHome.position);
    camera.rotation.set(dormPitch, dormYaw, 0, 'YXZ');
  }

  // 5. 重置状态
  setFrozen(false);
  clearHover();
  updateHUD();
  renderer.shadowMap.needsUpdate = true;

  // 6. 路由
  history.replaceState(null, '', next === 'dining' ? '#dining' : '#dorm');
}
```

关键点：

- **清空按键**：否则在宿舍按 W，切到餐厅会自己走。
- **保存视角**：切回来不能回到默认位置。
- **重置 frozen**：避免切场景后鼠标固定。
- **阴影重烘焙**：两个场景各有自己的阴影贴图。
- **只渲染 active scene**。

## 4. 路由

| URL | 行为 |
|---|---|
| `/` | 宿舍 |
| `/#dining` | 餐厅 |
| `/#dorm` | 宿舍 |
| `/dining/` | 重定向 `/#dining` |
| `/dorm.html` | 宿舍独立页（可选 fallback） |
| `/dining/standalone.html` | 餐厅独立页（可选 fallback） |

- 默认按 hash 初始化；没有 hash 时用宿舍。
- 切换时用 `history.replaceState` 更新 hash，不刷新。
- `hashchange` 时同步场景（支持手动改 URL）。
- `/dining/` 用 meta refresh + `location.replace('../#dining')`，并给无 JS 的 fallback 链接。

## 5. HUD

- 顶部左侧：项目标题、场景名、FPS。
- 顶部中间：场景切换。
- 顶部右侧：全屏按钮。
- 底部：当前场景操作提示。
- 全屏时隐藏装饰性 HUD/FPS，保留准星、交互提示、必要 Toast。
- 场景切换按钮不能遮挡标题/全屏；移动端下移或缩小。

## 6. 本地服务器

### 6.1 `serve.py`

要求：

- 以项目根目录为 document root。
- 默认端口 8123。
- 启动后自动打开 `http://127.0.0.1:8123/#dining`。
- 端口被占用时：打印提示并打开已有预览，不抛异常退出。
- `ThreadingTCPServer` + `allow_reuse_address`。
- 按 Ctrl+C 正常退出。

### 6.2 `start-preview.cmd`

- 切换到脚本目录。
- 优先 `py -3 serve.py`，再 `python serve.py`。
- 失败时 `pause`，不要窗口一闪而过。
- 文件用 CRLF，避免 cmd 解析问题。

### 6.3 `file://` 提示

在 HTML 加载模块前检测：

```html
<script>
  if (location.protocol === 'file:') {
    // 把 loader 内容替换为：
    // 需要通过本地服务器打开
    // 双击 start-preview.cmd
    // 或 python -m http.server 8123
  }
</script>
```

要求：

- 提示必须可见，不能只在 console。
- 不显示白屏。
- 不尝试用 `file://` 加载 Three.js 模块。

## 7. 全屏与 FPS

- 页面按钮调用 Fullscreen API。
- 非全屏显示 FPS；全屏隐藏。
- 进入全屏后请求指针锁定；失败保留拖动 fallback。
- 退出全屏恢复 HUD/FPS 和鼠标状态。
- `F11` 若走浏览器原生全屏，页面状态可能不触发 `fullscreenchange`；需要额外处理或在验收中明确。
- FPS 统计用 500 ms 窗口平滑；低帧率时自适应降 pixelRatio。

## 8. 常见失败

- 两个独立页面，互相链接 404。
- 场景切换不保存视角，切回来位置重置。
- 切换后旧场景按键仍生效。
- 两个场景都渲染，GPU 占用翻倍。
- 切换后阴影不更新，出现黑/错位阴影。
- `/dining/` 直接 404，没有重定向。
- `file://` 白屏，没有提示。
- 端口占用时 `serve.py` 直接报错退出。
- 全屏后 HUD 不消失，或退出后不恢复。

## 9. 验收

- [ ] `/` 打开宿舍，顶部可切到餐厅。
- [ ] `/#dining` 直接餐厅。
- [ ] `/dining/` 自动跳转。
- [ ] 切换不刷新页面，视角保持。
- [ ] 两个场景都能正常行走/环顾/交互。
- [ ] 只有一个 renderer，只渲染 active scene。
- [ ] 切换后按键不残留，frozen 重置。
- [ ] 本地服务器自动打开 `/#dining`。
- [ ] 端口占用时打开已有预览。
- [ ] `file://` 显示明确提示。
- [ ] 非全屏 FPS 可见，全屏隐藏。
- [ ] 无 404、无 console 报错。
