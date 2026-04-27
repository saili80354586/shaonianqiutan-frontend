# 少年球探 - UI 组件文档

## 快速开始

所有 UI 组件都位于 `src/components/ui/` 目录下。

```tsx
import { Button, Card, Input, Badge } from '../components/ui'
```

---

## Button 按钮

### 基础用法

```tsx
import { Button } from '../components/ui'

// 主按钮
<Button>立即体验</Button>

// 次要按钮
<Button variant="secondary">了解更多</Button>

// 轮廓按钮
<Button variant="outline">取消</Button>

// 幽灵按钮
<Button variant="ghost">返回</Button>

// 危险按钮
<Button variant="danger">删除</Button>
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'link'` | `'primary'` | 按钮变体 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'icon'` | `'md'` | 按钮尺寸 |
| `loading` | `boolean` | `false` | 加载状态 |
| `fullWidth` | `boolean` | `false` | 是否全宽 |
| `disabled` | `boolean` | `false` | 禁用状态 |

### 示例

```tsx
// 加载状态
<Button loading>提交中...</Button>

// 带图标
<Button>
  <Plus className="w-4 h-4" />
  新建订单
</Button>

// 全宽按钮
<Button fullWidth>确认支付</Button>
```

---

## Card 卡片

### 基础用法

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述文字</CardDescription>
  </CardHeader>
  <CardContent>
    <p>卡片内容区域</p>
  </CardContent>
  <CardFooter>
    <Button>操作按钮</Button>
  </CardFooter>
</Card>
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hover` | `boolean` | `false` | 是否启用悬停效果 |
| `glass` | `boolean` | `false` | 玻璃态效果 |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 内边距大小 |

### 示例

```tsx
// 可悬停卡片
<Card hover>
  <CardContent>悬停查看效果</CardContent>
</Card>

// 玻璃态卡片
<Card glass>
  <CardContent>玻璃态效果</CardContent>
</Card>

// 紧凑卡片
<Card padding="sm">
  <CardHeader compact>
    <CardTitle>紧凑标题</CardTitle>
  </CardHeader>
</Card>
```

---

## Input 输入框

### 基础用法

```tsx
import { Input } from '../components/ui'

<Input placeholder="请输入内容" />
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `error` | `boolean` | `false` | 错误状态 |
| `helperText` | `string` | - | 辅助文本 |
| `label` | `string` | - | 标签文本 |
| `icon` | `ReactNode` | - | 图标 |
| `iconPosition` | `'left' \| 'right'` | `'left'` | 图标位置 |

### 示例

```tsx
// 带标签
<Input label="用户名" placeholder="请输入用户名" />

// 带图标
<Input 
  icon={<Search className="w-5 h-5" />}
  placeholder="搜索..."
/>

// 错误状态
<Input 
  error
  helperText="用户名不能为空"
  placeholder="请输入用户名"
/>
```

---

## Badge 徽章

### 基础用法

```tsx
import { Badge } from '../components/ui'

<Badge>默认</Badge>
<Badge variant="accent">强调</Badge>
<Badge variant="info">信息</Badge>
<Badge variant="success">成功</Badge>
<Badge variant="warning">警告</Badge>
<Badge variant="error">错误</Badge>
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'accent' \| 'info' \| 'success' \| 'warning' \| 'error' \| 'purple' \| 'default'` | `'default'` | 徽章变体 |
| `size` | `'sm' \| 'md'` | `'md'` | 徽章尺寸 |
| `interactive` | `boolean` | `false` | 是否可交互 |

### 示例

```tsx
// 可交互徽章
<Badge variant="accent" interactive>
  点击我
</Badge>

// 小尺寸
<Badge size="sm">小徽章</Badge>
```

---

## 设计令牌 (Design Tokens)

### 颜色

```css
/* 强调色 */
--accent: #39ff14;
--accent-hover: #4dff2e;
--accent-light: #6fff4d;

/* 文字色 */
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--text-tertiary: #64748b;
--text-muted: #475569;

/* 边框色 */
--border: #2d3748;
--border-hover: #4a5568;
```

### 间距

使用 Tailwind 的 spacing scale，基于 4px:

```
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-6: 24px
space-8: 32px
```

### 圆角

```
rounded-sm: 4px
rounded-md: 8px
rounded-lg: 12px
rounded-xl: 16px
rounded-2xl: 24px
rounded-full: 9999px
```

### 阴影

```
shadow-sm: 小阴影
shadow-md: 中等阴影
shadow-lg: 大阴影
shadow-glow: 绿色光晕
shadow-glow-lg: 强烈光晕
shadow-glow-blue: 蓝色光晕
```

### 动画

```css
/* 缓动函数 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 时长 */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

---

## Tailwind 工具类

### 自定义工具类

```tsx
// 文字渐变
<span className="text-gradient">渐变文字</span>
<span className="text-gradient-blue">蓝色渐变</span>

// 玻璃态
<div className="glass">玻璃效果</div>

// 隐藏滚动条
<div className="scrollbar-hide">无滚动条</div>

// 触摸目标
<button className="touch-target">最小 44x44</button>
```

### 组件类

```tsx
// 按钮样式
<button className="btn btn-primary">主按钮</button>
<button className="btn btn-secondary">次要按钮</button>

// 卡片样式
<div className="card">标准卡片</div>
<div className="card card-hover">可悬停</div>
<div className="glass-card">玻璃卡片</div>

// 输入框样式
<input className="input" />

// 徽章样式
<span className="badge badge-green">绿色徽章</span>
```

---

## 最佳实践

### 1. 颜色使用

- 主要操作使用 `accent` (绿色)
- 链接和次要操作使用 `info` (蓝色)
- 成功状态使用 `success`
- 警告使用 `warning`
- 错误使用 `error`

### 2. 间距

- 使用 4px 的倍数
- 卡片内边距推荐使用 `p-6` (24px)
- 组件间距推荐使用 `gap-4` (16px)

### 3. 动画

- 微交互使用 `duration-200`
- 页面过渡使用 `duration-300`
- 使用 `ease-out` 缓动函数

### 4. 响应式

```tsx
// 移动端优先
<div className="p-4 md:p-6 lg:p-8">
// 小屏: 16px, 中屏: 24px, 大屏: 32px

// 响应式文字
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

### 5. 无障碍

- 所有交互元素最小 44x44px
- 使用 `focus-visible` 替代 `focus`
- 图片必须包含 `alt` 属性
- 支持 `prefers-reduced-motion`

---

## 更新日志

### v1.0 (2026-04-04)
- 初始版本
- 基于设计系统规范创建
- 包含 Button, Card, Input, Badge 组件
