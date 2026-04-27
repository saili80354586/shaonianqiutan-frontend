/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ===== 颜色系统 ===== */
      colors: {
        // 主背景色
        'bg-primary': '#0a0e14',
        'bg-secondary': '#111820',
        'bg-tertiary': '#1a2332',
        'bg-elevated': '#232d3f',
        
        // 强调色 - 运动绿
        'accent': '#39ff14',
        'accent-hover': '#4dff2e',
        'accent-light': '#6fff4d',
        'accent-dark': '#2dd410',
        
        // 辅助色
        'info': '#4a90d9',
        'info-hover': '#5ba3f0',
        'success': '#34d399',
        'warning': '#fbbf24',
        'error': '#ef4444',
        
        // 中性色阶
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-tertiary': '#64748b',
        'text-muted': '#475569',
        'text-inverse': '#0a0e14',
        
        // 边框色
        'border': '#2d3748',
        'border-hover': '#4a5568',
      },
      
      /* ===== 字体系统 ===== */
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
        display: ['DM Sans', '-apple-system', 'sans-serif'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['2rem', { lineHeight: '1.25' }],
        '4xl': ['2.5rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
      },
      
      /* ===== 间距系统 (4px基准) ===== */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      
      /* ===== 圆角系统 ===== */
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      
      /* ===== 阴影系统 ===== */
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 20px rgba(57, 255, 20, 0.3)',
        'glow-lg': '0 0 40px rgba(57, 255, 20, 0.4)',
        'glow-blue': '0 0 20px rgba(74, 144, 217, 0.3)',
      },
      
      /* ===== 过渡动效 ===== */
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      
      /* ===== 动画 ===== */
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-out': 'fadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(57, 255, 20, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      /* ===== 背景图片 ===== */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(90deg, #39ff14 0%, #6fff4d 100%)',
        'gradient-blue': 'linear-gradient(90deg, #4a90d9 0%, #5ba3f0 100%)',
        'gradient-multi': 'linear-gradient(90deg, #4a90d9 0%, #39ff14 50%, #34d399 100%)',
      },
      
      /* ===== 模糊效果 ===== */
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [
    /* 自定义插件 - 添加设计系统工具类 */
    function({ addComponents, addUtilities, theme }) {
      addComponents({
        /* 按钮组件 */
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontWeight: '600',
          transitionProperty: 'all',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDuration: '200ms',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: 'none',
            boxShadow: '0 0 0 2px #0a0e14, 0 0 0 4px #39ff14',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: '#39ff14',
          color: '#0a0e14',
          borderRadius: '9999px',
          padding: '0.625rem 1.25rem',
          '&:hover:not(:disabled)': {
            backgroundColor: '#4dff2e',
            transform: 'translateY(-2px)',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
          },
          '&:active:not(:disabled)': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
        '.btn-secondary': {
          backgroundColor: 'transparent',
          color: '#f8fafc',
          border: '1px solid #2d3748',
          borderRadius: '9999px',
          padding: '0.625rem 1.25rem',
          '&:hover': {
            backgroundColor: 'rgba(57, 255, 20, 0.15)',
            borderColor: 'rgba(57, 255, 20, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: '#94a3b8',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          '&:hover': {
            backgroundColor: '#1a2332',
            color: '#f8fafc',
          },
        },
        
        /* 卡片组件 */
        '.card': {
          backgroundColor: '#1a2332',
          border: '1px solid #2d3748',
          borderRadius: '1rem',
          padding: '1.5rem',
          transitionProperty: 'all',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDuration: '300ms',
        },
        '.card-hover': {
          '&:hover': {
            borderColor: 'rgba(57, 255, 20, 0.3)',
            transform: 'translateY(-4px)',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
          },
        },
        
        /* 输入框组件 */
        '.input': {
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: '#111820',
          border: '2px solid #2d3748',
          borderRadius: '0.75rem',
          color: '#f8fafc',
          transitionProperty: 'all',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDuration: '200ms',
          '&::placeholder': {
            color: '#475569',
          },
          '&:hover': {
            borderColor: '#4a5568',
          },
          '&:focus': {
            outline: 'none',
            borderColor: '#39ff14',
            boxShadow: '0 0 0 3px rgba(57, 255, 20, 0.15)',
          },
        },
        
        /* 徽章组件 */
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.375rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          fontWeight: '500',
          transitionProperty: 'all',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDuration: '200ms',
        },
        '.badge-accent': {
          backgroundColor: 'rgba(57, 255, 20, 0.15)',
          border: '1px solid rgba(57, 255, 20, 0.3)',
          color: '#39ff14',
          '&:hover': {
            backgroundColor: 'rgba(57, 255, 20, 0.25)',
            borderColor: 'rgba(57, 255, 20, 0.5)',
            transform: 'translateY(-1px)',
          },
        },
        '.badge-info': {
          backgroundColor: 'rgba(74, 144, 217, 0.15)',
          border: '1px solid rgba(74, 144, 217, 0.3)',
          color: '#4a90d9',
        },
      });
      
      addUtilities({
        /* 文字工具 */
        '.text-gradient': {
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
          color: 'transparent',
          backgroundImage: 'linear-gradient(90deg, #39ff14 0%, #6fff4d 100%)',
        },
        '.text-gradient-blue': {
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
          color: 'transparent',
          backgroundImage: 'linear-gradient(90deg, #4a90d9 0%, #5ba3f0 100%)',
        },
        '.text-gradient-multi': {
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
          color: 'transparent',
          backgroundImage: 'linear-gradient(90deg, #4a90d9 0%, #39ff14 50%, #34d399 100%)',
        },
        
        /* 玻璃态效果 */
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        
        /* 隐藏滚动条但保留功能 */
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        /* 触摸目标最小尺寸 */
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
      });
    },
  ],
}
