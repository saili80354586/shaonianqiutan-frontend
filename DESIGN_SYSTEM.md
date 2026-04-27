# 少年球探 - 设计系统规范

## 颜色系统

### 主色调
| 名称 | 值 | 用途 |
|------|-----|------|
| primary | `#0f1419` | 主背景色 |
| secondary | `#1a2332` | 次级背景 |
| tertiary | `#2d3748` | 第三层背景、边框 |

### 强调色 (运动绿)
| 名称 | 值 | 用途 |
|------|-----|------|
| accent | `#39ff14` | 主要强调色、按钮、高亮 |
| accent-hover | `#32e612` | 悬停状态 |
| accent-light | `#5cff3d` | 浅色强调 |
| accent-dark | `#2dd410` | 深色强调 |

### 功能色
| 名称 | 值 | 用途 |
|------|-----|------|
| success | `#34d399` | 成功状态 |
| warning | `#fbbf24` | 警告状态 |
| error | `#ef4444` | 错误状态 |
| info | `#4a90d9` | 信息提示 |

### 文字色
| 名称 | 值 | 用途 |
|------|-----|------|
| text-primary | `#f8fafc` | 主要文字 |
| text-secondary | `#94a3b8` | 次要文字 |
| text-tertiary | `#64748b` | 辅助文字 |
| text-muted | `#9aa0a6` | 禁用/提示文字 |

### 背景色
| 名称 | 值 | 用途 |
|------|-----|------|
| bg-primary | `#0f1419` | 主背景 |
| bg-secondary | `#1a2332` | 次级背景 |
| bg-tertiary | `#2d3748` | 第三层背景 |
| bg-card | `#1a2332` | 卡片背景 |
| bg-input | `#0a0e17` | 输入框背景 |

## 组件规范

### Button 按钮

#### 变体
- `default/primary`: 主按钮，绿色背景
- `secondary`: 次级按钮，深色背景带边框
- `ghost`: 幽灵按钮，无背景
- `outline`: 描边按钮
- `danger`: 危险按钮，红色

#### 尺寸
- `sm`: 32px 高度
- `default`: 40px 高度
- `lg`: 48px 高度
- `icon`: 40x40px 方形

#### 用法
```tsx
<Button variant="primary" size="lg">主要按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="ghost" size="sm">幽灵按钮</Button>
```

### Card 卡片

#### 基础样式
- 圆角: `rounded-xl` (12px)
- 背景: `bg-bg-card`
- 边框: `border border-border`
- 阴影: `shadow-sm`

#### 悬停效果
添加 `hover` 属性启用悬停动效：
```tsx
<Card hover>悬停有动效的卡片</Card>
```

### Input 输入框

#### 基础样式
- 圆角: `rounded-lg` (8px)
- 背景: `bg-bg-input`
- 边框: `border-2 border-border`
- 聚焦: `focus:border-accent focus:ring-2 focus:ring-accent/20`

#### 错误状态
```tsx
<Input error helperText="请输入正确的手机号" />
```

### Badge 标签

#### 变体
- `default`: 默认强调色
- `success`: 绿色
- `warning`: 黄色
- `error`: 红色
- `info`: 蓝色
- `outline`: 透明背景

#### 用法
```tsx
<Badge variant="success">已完成</Badge>
<Badge variant="warning" size="lg">待处理</Badge>
```

## CSS 工具类

### 按钮类
```css
.btn-primary    /* 主要按钮 */
.btn-secondary  /* 次要按钮 */
.btn-ghost      /* 幽灵按钮 */
```

### 卡片类
```css
.card           /* 基础卡片 */
.card-hover     /* 悬停动效卡片 */
.glass-card     /* 玻璃态卡片 */
```

### 表单类
```css
.input-field    /* 统一输入框样式 */
```

### 布局类
```css
.page-container /* 页面容器 */
.content-wrapper /* 内容包装器 */
```

### 文字类
```css
.heading-1      /* H1 标题 */
.heading-2      /* H2 标题 */
.heading-3      /* H3 标题 */
.text-gradient  /* 渐变文字 */
```

## 响应式断点

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 动画

### 预设动画
- `animate-fade-in`: 淡入
- `animate-slide-up`: 上滑进入
- `animate-shimmer`: 闪光效果

### 过渡
默认过渡: `transition-all duration-300`

## 图标

使用 **Lucide React** 图标库：

```tsx
import { Home, User, Settings } from 'lucide-react'
```

## 最佳实践

1. **颜色使用**: 优先使用设计系统颜色，避免硬编码颜色值
2. **组件使用**: 优先使用 UI 组件库中的组件
3. **间距**: 使用 Tailwind 的间距系统 (4px 基准)
4. **圆角**: 统一使用 `rounded-lg` (8px) 或 `rounded-xl` (12px)
5. **阴影**: 使用 `shadow-sm`、`shadow-lg` 等预设阴影

## 文件结构

```
src/
├── components/
│   └── ui/           # UI 组件库
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── badge.tsx
│       ├── toast.tsx
│       ├── loading.tsx
│       └── ...
├── lib/
│   └── utils.ts      # 工具函数 (cn)
├── index.css         # 全局样式
└── tailwind.config.js # Tailwind 配置
```
