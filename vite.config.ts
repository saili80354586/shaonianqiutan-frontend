import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 0,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    // 代码分割策略
    rollupOptions: {
      output: {
        // 手动分块 - 优化加载顺序
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React 核心 - 最早加载
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // UI 组件库
            if (id.includes('lucide') || id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-vendor'
            }
            // 图表库 - 大文件，懒加载
            if (id.includes('echarts') || id.includes('recharts') || id.includes('zrender')) {
              return 'chart-vendor'
            }
            // 工具库
            if (id.includes('axios') || id.includes('zustand')) {
              return 'utils-vendor'
            }
          }
          // 懒加载页面分割
          if (id.includes('/pages/')) {
            const page = id.split('/pages/')[1].split('/')[0]
            return `page-${page.toLowerCase()}`
          }
        },
        // 资源文件命名
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // 代码压缩
    minify: 'terser',
    // 构建目标
    target: 'es2020',
    // 生成 source map
    sourcemap: false,
    // chunk 大小警告阈值 - 降低到 400KB
    chunkSizeWarningLimit: 400,
    // 压缩选项
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
      },
    },
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'echarts',
      'axios',
      'clsx',
      'tailwind-merge',
      'zustand',
    ],
    // 懒加载预构建
    exclude: [],
  },
  // CSS 代码分割
  cssCodeSplit: true,
})
