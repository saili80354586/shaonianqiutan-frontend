# 浏览器兼容性支持

## 支持的浏览器

### 桌面端

| 浏览器 | 最低版本 | 状态 |
|--------|----------|------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |

### 移动端

| 浏览器/设备 | 最低版本 | 状态 |
|-------------|----------|------|
| Chrome Android | 90+ | ✅ 完全支持 |
| Safari iOS | 14+ | ✅ 完全支持 |
| Samsung Internet | 15+ | ✅ 完全支持 |

## 响应式断点

```css
/* 移动端 */
@media (max-width: 640px) { }

/* 平板 */
@media (min-width: 641px) and (max-width: 1024px) { }

/* 桌面 */
@media (min-width: 1025px) { }

/* 大屏 */
@media (min-width: 1440px) { }
```

## 已测试的设备

### Playwright 测试矩阵

配置在 `playwright.config.ts` 中：

- Desktop Chrome (Chromium)
- Desktop Firefox
- Desktop Safari (WebKit)
- Pixel 5 (Mobile Chrome)
- iPhone 12 (Mobile Safari)

## CSS 兼容性

### 使用的现代特性

- CSS Grid ✅ (所有支持浏览器)
- CSS Flexbox ✅ (所有支持浏览器)
- CSS Custom Properties ✅ (所有支持浏览器)
- CSS Transforms ✅ (所有支持浏览器)
- CSS Animations ✅ (所有支持浏览器)
- CSS Backdrop Filter ⚠️ (需要 Safari 15+)

### PostCSS 配置

自动添加浏览器前缀：

```js
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## JavaScript 兼容性

### 构建目标

```js
// vite.config.ts
export default {
  build: {
    target: 'es2020',
  },
}
```

### Polyfills

如需支持更低版本浏览器，可在 `index.html` 中添加：

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=default,es2015,es2016,es2017"></script>
```

## 已知问题

### iOS Safari

- 底部导航栏可能遮挡内容：使用 `env(safe-area-inset-bottom)`
- 固定定位问题：使用 `-webkit-transform: translateZ(0)`

### Android Chrome

- 100vh 问题：使用 `dvh` 单位或 JavaScript 计算

## 测试命令

```bash
# 运行所有浏览器测试
npm run test:e2e

# 特定浏览器
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
n
# 移动端
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```
