import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const pageChunkName = (id: string) => {
  const pagePath = id.split('/pages/')[1]?.replace(/\.[tj]sx?$/, '')
  if (!pagePath) return undefined

  const parts = pagePath.split('/')
  if (parts[0] === 'AdminDashboard') {
    return `page-admin-${(parts[1] || 'layout').toLowerCase()}`
  }
  if (parts[0] === 'ClubDashboard') {
    return `page-club-${(parts[1] || 'dashboard').toLowerCase()}`
  }
  if (parts[0] === 'ScoutMap') {
    return `page-scoutmap-${(parts[1] || 'index').toLowerCase()}`
  }
  if (parts[0] === 'UserDashboard') {
    return `page-userdashboard-${(parts[1] || 'index').toLowerCase()}`
  }

  return `page-${parts[0].toLowerCase()}`
}

const echartsChartChunkName = (id: string) => {
  if (id.includes('/echarts/charts')) {
    return 'echarts-chart-entry-vendor'
  }

  const chartPath = id.split('/echarts/lib/chart/')[1]
  if (!chartPath) return undefined

  const chartName = chartPath.split('/')[0]
  if (['bar', 'effectScatter', 'gauge', 'line', 'map', 'pie', 'radar', 'scatter'].includes(chartName)) {
    return `echarts-chart-${chartName.toLowerCase()}-vendor`
  }

  return 'echarts-chart-shared-vendor'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_DEV_API_TARGET || 'http://localhost:8080'
  const devPort = Number(env.VITE_DEV_SERVER_PORT || 5173)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: devPort,
      strictPort: false,
      host: true,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: backendTarget,
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
            const normalizedId = id.replace(/\\/g, '/')
            if (id.includes('node_modules')) {
              // React 核心 - 最早加载
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor'
              }
              // UI 组件库
              if (id.includes('lucide') || id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'ui-vendor'
              }
              // 图表库体积大，按引擎拆分，避免只用 Recharts 的页面拉取 ECharts。
              if (id.includes('echarts-for-react')) {
                return 'echarts-react-vendor'
              }
              if (id.includes('/zrender/') || id.includes('\\zrender\\')) {
                return 'zrender-vendor'
              }
              const echartsChartChunk = echartsChartChunkName(normalizedId)
              if (echartsChartChunk) return echartsChartChunk
              if (
                id.includes('/echarts/components') ||
                id.includes('\\echarts\\components') ||
                id.includes('/echarts/lib/component/') ||
                id.includes('\\echarts\\lib\\component\\')
              ) {
                return 'echarts-components-vendor'
              }
              if (
                id.includes('/echarts/renderers') ||
                id.includes('\\echarts\\renderers') ||
                id.includes('/echarts/lib/renderer/') ||
                id.includes('\\echarts\\lib\\renderer\\')
              ) {
                return 'echarts-renderers-vendor'
              }
              if (
                id.includes('/echarts/features') ||
                id.includes('\\echarts\\features') ||
                id.includes('/echarts/lib/label/') ||
                id.includes('\\echarts\\lib\\label\\')
              ) {
                return 'echarts-features-vendor'
              }
              if (id.includes('/echarts/') || id.includes('\\echarts\\')) {
                return 'echarts-core-vendor'
              }
              if (
                id.includes('recharts') ||
                id.includes('d3-') ||
                id.includes('react-smooth')
              ) {
                return 'recharts-vendor'
              }
              // 工具库
              if (id.includes('axios') || id.includes('zustand')) {
                return 'utils-vendor'
              }
            }
            if (id.includes('/pages/')) {
              return pageChunkName(id)
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
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'echarts/features',
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
  }
})
