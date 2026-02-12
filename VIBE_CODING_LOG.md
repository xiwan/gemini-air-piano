# 🎹 Gemini Air Piano - Vibe Coding 全过程

> 本文档记录了使用 AI Studio (Gemini 3 Flash Preview) 从零 vibe code 出这个项目的完整交互过程。

---

## 📝 初始提示词（完整保留）

```
请扮演一位熟悉计算机视觉、手势识别和音频处理的资深工程师，为我设计并生成一个基于摄像头捕捉左右手动作的空气吉他 (Air Guitar) 应用程序的实现方案和核心代码框架。

目标与功能

项目名称： 实时摄像头空气吉他模拟器

核心目标： 通过单个标准网络摄像头（Webcam）实时捕捉用户左右手的动作，将其转换为吉他演奏指令，并实时播放对应的音频。

计算机视觉库： OpenCV 或 MediaPipe (推荐使用 MediaPipe Hands 或 MediaPipe Holistic，以获取高精度手部骨骼点数据。)

音频部分：Web Audio API来完成，或者你自己决定也行
```

AI 生成了初始框架：`metadata.json`、`index.html`、`index.tsx`、`types.ts`、`services/audioEngine.ts`、`services/geminiService.ts`、`components/AirGuitarCanvas.tsx`、`components/Controls.tsx`、`App.tsx`

---

## 🐛 调试过程总结

### 阶段一：MediaPipe 模块导入问题（4轮修复）

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `HAND_CONNECTIONS` 导出不存在 | ESM CDN 模块结构不同 | 移除导入，本地定义连接数组 |
| `drawConnectors` 导出不存在 | `@mediapipe/drawing_utils` ESM 问题 | 用本地函数替代 |
| `Hands` 导出不存在 | ESM 默认导出格式问题 | 改用 `import * as mpHands`，动态提取类 |
| 界面卡在 "initializing vision engine" | 模块加载失败 + 摄像头状态判断错误 | 重构加载逻辑，用 `requestAnimationFrame` 替代 `camera_utils` |

### 阶段二：MediaPipe WASM 资源加载问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `Module.dataFileDownloads is undefined` | CDN 版本不匹配 | 固定版本 `0.4.1646424915`，`index.html` 和 `locateFile` 保持一致 |
| 摄像头开了但画面黑屏 | Canvas 绘制依赖 `onResults`，但回调未触发 | 分离 Webcam 显示层（始终可见）和 Canvas 覆盖层（仅绘制 AR 元素） |

### 阶段三：功能迭代

| 需求 | 实现 |
|------|------|
| 从吉他改为尤克里里 | 修改音频频率为 G-C-E-A 定弦，和弦库改为 C/G/Am/F |
| 左手按和弦 + 右手扫弦/拨弦 | 左手区域选择和弦，右手速度检测区分扫弦和单音 |
| 改为钢琴 | 绘制 8 个白键（C4-C5），指尖进入区域触发音符 |
| 手指弯曲才算按键 | 计算 PIP-DIP-TIP 三点夹角，< 160° 判定为弯曲 |

### 阶段四：手指映射优化

| 需求 | 实现 |
|------|------|
| 自动绑定 8 个手指到琴键 | 左手 4 指 → C4-F4，右手 4 指 → G4-C5 |
| 左右手搞反了 | MediaPipe 镜像模式下标签与直觉相反，交换映射逻辑 |
| 去掉小指，加入大拇指 | 最终映射：左手（无名指 C4、中指 D4、食指 E4、拇指 F4）、右手（拇指 G4、食指 A4、中指 B4、无名指 C5） |

### 阶段五：UI 和自动演奏

| 需求 | 实现 |
|------|------|
| 界面优化 | 玻璃拟态设计，霓虹灯效果 |
| 名曲自动演奏 | `audioEngine.playSequence()` 序列播放器，内置《小星星》《欢乐颂》《致爱丽丝》 |
| 只能看到 5 个键 | `object-cover` 裁剪问题，改为 `object-fill` + 增加水平边距 |

### 阶段六：最终稳定性修复

| 问题 | 解决方案 |
|------|----------|
| `buffer` / `abort` 错误 | 确保 `video.readyState === 4` 且 `videoWidth > 0` 后再调用 `hands.send()`，增加 try-catch 容错 |

---

## 🎯 关键技术点

### 手指弯曲检测算法

```typescript
function calculateAngle(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x*v1.x + v1.y*v1.y + v1.z*v1.z);
  const mag2 = Math.sqrt(v2.x*v2.x + v2.y*v2.y + v2.z*v2.z);
  return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
}
// 角度 < 160° → 手指弯曲 → 触发音符
```

### MediaPipe 稳定加载模式

```typescript
// 1. 固定版本号
const VERSION = '0.4.1646424915';

// 2. 安全的类提取
const mpModule = mpHands as any;
const HandsClass = mpModule.Hands || mpModule.default?.Hands || mpModule.default;

// 3. 版本一致的 CDN 路径
locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${VERSION}/${file}`

// 4. 发送前检查视频状态
if (video.readyState === 4 && video.videoWidth > 0) {
  await hands.send({ image: video });
}
```

---

## 📊 迭代统计

- **总交互轮次**：~20 轮
- **主要错误类型**：ESM 模块导入（4次）、WASM 资源加载（2次）、CSS 布局（1次）
- **功能演进**：空气吉他 → 尤克里里 → 钢琴
- **最终形态**：手指绑定式空气钢琴 + 名曲自动演奏

---

## 💡 Vibe Coding 经验

1. **ESM CDN 坑很多** — `esm.sh` 的导出结构和本地 npm 不一致，需要多种方式尝试提取类
2. **版本锁定很重要** — MediaPipe 的 JS 和 WASM 资源必须版本一致
3. **分层显示更稳定** — Webcam 直接显示 + Canvas 透明覆盖，比纯 Canvas 绘制可靠
4. **用户反馈驱动** — "左右手搞反了"、"只能看到 5 个键"这类问题只有实际使用才能发现
5. **渐进式需求** — 从吉他到尤克里里到钢琴，每次迭代都在前一版基础上改进

---

*Generated from AI Studio vibe coding session, 2026-02-12*
