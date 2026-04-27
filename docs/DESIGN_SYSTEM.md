# 少年球探 - UI设计系统

## 概述

本文档定义了少年球探平台的完整视觉设计系统，确保全站UI的一致性和专业性。

---

## 1. 设计原则

### 核心原则
- **清晰**: 信息层次分明，用户能快速找到所需内容
- **活力**: 运动主题的绿色强调色，传达年轻、活力的品牌形象
- **专业**: 深色背景配合精细的排版，体现专业球探平台的品质感
- **响应式**: 完美适配桌面端和移动端

### 设计反模式 (禁止)
- ❌ 使用纯黑 (#000000) 作为背景色
- ❌ 在彩色背景上使用灰色文字
- ❌ 使用 Arial/Inter 等过于通用的字体
- ❌ 动画时长超过 500ms
- ❌ 使用 bounce/elastic 缓动函数
- ❌ 随意的间距数值 (13px, 22px 等)

---

## 2. 色彩系统

### 主色调

| 名称 | 色值 | 用途 |
|------|------|------|
| `--bg-primary` | `#0a0e14` | 主背景色 (深海军蓝黑) |
| `--bg-secondary` | `#111820` | 次级背景色 |
| `--bg-tertiary` | `#1a2332` | 卡片背景色 |
| `--bg-elevated` | `#232d3f` | 悬浮元素背景 |

### 强调色

| 名称 | 色值 | 用途 |
|------|------|------|
| `--accent` | `#39ff14` | 主要强调色 (运动绿) |
| `--accent-hover` | `#4dff2e` | 悬停状态 |
| `--accent-light` | `#6fff4d` | 浅色变体 |
| `--accent-dark` | `#2dd410` | 深色变体 |
| `--accent-subtle` | `rgba(57,255,20,0.15)` | 微妙的强调背景 |

### 辅助色

| 名称 | 色值 | 用途 |
|------|------|------|
| `--info` | `#4a90d9` | 信息/链接 |
| `--info-hover` | `#5ba3f0` | 信息悬停 |
| `--success` | `#34d399` | 成功状态 |
| `--warning` | `#fbbf24` | 警告状态 |
| `--error` | `#ef4444` | 错误状态 |

### 中性色阶 (带冷色调)

| 名称 | 色值 | 用途 |
|------|------|------|
| `--text-primary` | `#f8fafc` | 主文字 |
| `--text-secondary` | `#94a3b8` | 次级文字 |
| `--text-tertiary` | `#64748b` | 辅助文字 |
| `--text-muted` | `#475569` | 弱化文字 |
| `--border` | `#2d3748` | 边框 |
| `--border-hover` | `#4a5568` | 悬停边框 |

---

## 3. 字体系统

### 字体家族

```css
/* 主字体 - 系统字体栈确保最佳性能 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;

/* 显示字体 - 用于大标题 */
--font-display: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;

/* 等宽字体 - 用于数据展示 */
--font-mono: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
```

### 字体比例 (Modular Scale 1.25)

| 级别 | 大小 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| H1 | `2.5rem` (40px) | `1.2` | 700 | 页面主标题 |
| H2 | `2rem` (32px) | `1.25` | 600 | 区块标题 |
| H3 | `1.5rem` (24px) | `1.3` | 600 | 卡片标题 |
| H4 | `1.25rem` (20px) | `1.4` | 500 | 小节标题 |
| Body | `1rem` (16px) | `1.6` | 400 | 正文 |
| Small | `0.875rem` (14px) | `1.5` | 400 | 辅助文字 |
| XS | `0.75rem` (12px) | `1.5` | 400 | 标签、时间 |

---

## 4. 间距系统

基于 4px 基准单位:

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | `4px` | 图标间距、紧凑内边距 |
| `--space-2` | `8px` | 小间隙、行内间距 |
| `--space-3` | `12px` | 按钮内边距、小卡片间距 |
| `--space-4` | `16px` | 标准间距、卡片内边距 |
| `--space-5` | `20px` | 中等间距 |
| `--space-6` | `24px` | 大间距、区块间隙 |
| `--space-8` | `32px` | 区块内边距 |
| `--space-10` | `40px` | 大区块间距 |
| `--space-12` | `48px` | 页面区块间距 |
| `--space-16` | `64px` | 大区块间距 |

---

## 5. 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | `4px` | 小标签、徽章 |
| `--radius-md` | `8px` | 输入框、小按钮 |
| `--radius-lg` | `12px` | 卡片、大按钮 |
| `--radius-xl` | `16px` | 大卡片、模态框 |
| `--radius-2xl` | `24px` | 特色卡片 |
| `--radius-full` | `9999px` | 胶囊按钮、头像 |

---

## 6. 阴影系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | 轻微阴影 |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.4)` | 卡片阴影 |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.5)` | 悬浮卡片 |
| `--shadow-glow` | `0 0 20px rgba(57,255,20,0.3)` | 强调光晕 |
| `--shadow-glow-lg` | `0 0 40px rgba(57,255,20,0.4)` | 强烈光晕 |

---

## 7. 动效系统

### 缓动函数

```css
/* 标准缓动 - 快速启动，缓慢停止 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);

/* 平滑缓动 - 用于微妙动画 */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* 弹性缓动 - 仅用于特殊效果 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 动画时长

| 类型 | 时长 | 用途 |
|------|------|------|
| 微交互 | `150ms` | 按钮悬停、颜色变化 |
| 快速 | `200ms` | 下拉菜单、提示 |
| 标准 | `300ms` | 卡片悬停、页面过渡 |
| 缓慢 | `500ms` | 复杂动画、滚动显示 |

### 动画预设

```css
/* 悬停上浮 */
--hover-lift: translateY(-2px);

/* 悬停缩放 */
--hover-scale: scale(1.02);

/* 焦点环 */
--focus-ring: 0 0 0 2px var(--accent-subtle), 0 0 0 4px var(--accent);
```

---

## 8. 组件规范

### 按钮 (Button)

**主按钮 (Primary)**
- 背景: `--accent`
- 文字: `--bg-primary` (深色文字)
- 圆角: `--radius-full` (胶囊形)
- 内边距: `12px 24px`
- 悬停: 背景变亮 + 轻微上浮 + 光晕阴影

**次要按钮 (Secondary)**
- 背景: 透明
- 边框: `1px solid --border`
- 文字: `--text-primary`
- 悬停: 边框变为 `--accent` + 背景 `--accent-subtle`

**幽灵按钮 (Ghost)**
- 背景: 透明
- 文字: `--text-secondary`
- 悬停: 背景 `--bg-tertiary` + 文字变白

### 卡片 (Card)

**标准卡片**
- 背景: `--bg-tertiary`
- 边框: `1px solid --border`
- 圆角: `--radius-xl` (16px)
- 阴影: `--shadow-md`
- 内边距: `--space-6` (24px)

**可悬停卡片**
- 悬停: 边框变为 `--accent` (30%透明度) + 上浮 + 光晕阴影

### 输入框 (Input)

**标准输入框**
- 背景: `--bg-secondary`
- 边框: `1px solid --border`
- 圆角: `--radius-lg` (12px)
- 内边距: `12px 16px`
- 焦点: 边框变为 `--accent` + 光晕环

### 徽章 (Badge)

**绿色徽章**
- 背景: `--accent-subtle`
- 边框: `1px solid rgba(57,255,20,0.3)`
- 文字: `--accent`
- 圆角: `--radius-full`

---

## 9. 响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| `sm` | `640px` | 小屏手机 |
| `md` | `768px` | 平板 |
| `lg` | `1024px` | 小桌面 |
| `xl` | `1280px` | 标准桌面 |
| `2xl` | `1536px` | 大桌面 |

---

## 10. 无障碍要求

- 所有交互元素最小触摸目标: `44x44px`
- 文字与背景对比度至少 4.5:1
- 焦点状态必须清晰可见
- 支持 `prefers-reduced-motion` 媒体查询
- 所有图片必须包含 alt 文本

---

## 11. 使用示例

### Tailwind CSS 用法

```jsx
// 主按钮
<button className="bg-accent text-primary px-6 py-3 rounded-full font-semibold 
                   hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-glow
                   transition-all duration-200 ease-out">
  立即体验
</button>

// 卡片
<div className="bg-bg-tertiary border border-border rounded-xl p-6 
                hover:border-accent/30 hover:-translate-y-1 hover:shadow-lg
                transition-all duration-300 ease-out">
  <h3 className="text-xl font-semibold text-text-primary">卡片标题</h3>
  <p className="text-text-secondary mt-2">卡片内容</p>
</div>
```

---

**版本**: v1.0  
**更新日期**: 2026-04-04  
**负责人**: UI Design Team
