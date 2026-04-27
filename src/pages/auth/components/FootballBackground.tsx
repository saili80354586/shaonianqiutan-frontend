import React, { useEffect, useRef, useMemo } from 'react';
import type { UserRole } from '../../../types/auth';
import { roleThemes } from '../RegisterSteps/theme.config';

interface FootballBackgroundProps {
  role?: UserRole | null;
  step?: number;
}

// 足球场线元素
const FieldLines: React.FC<{ color: string }> = ({ color }) => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.08]"
    viewBox="0 0 100 60"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* 外边框 */}
    <rect x="2" y="2" width="96" height="56" fill="none" stroke={color} strokeWidth="0.3" />
    {/* 中线 */}
    <line x1="50" y1="2" x2="50" y2="58" stroke={color} strokeWidth="0.3" />
    {/* 中圈 */}
    <circle cx="50" cy="30" r="8" fill="none" stroke={color} strokeWidth="0.3" />
    {/* 左侧禁区 */}
    <rect x="2" y="18" width="12" height="24" fill="none" stroke={color} strokeWidth="0.3" />
    <rect x="2" y="24" width="4" height="12" fill="none" stroke={color} strokeWidth="0.3" />
    {/* 右侧禁区 */}
    <rect x="86" y="18" width="12" height="24" fill="none" stroke={color} strokeWidth="0.3" />
    <rect x="94" y="24" width="4" height="12" fill="none" stroke={color} strokeWidth="0.3" />
    {/* 角球区 */}
    <path d="M 2 4 Q 4 4 4 2" fill="none" stroke={color} strokeWidth="0.3" />
    <path d="M 96 4 Q 96 2 98 2" fill="none" stroke={color} strokeWidth="0.3" />
    <path d="M 2 56 Q 4 56 4 58" fill="none" stroke={color} strokeWidth="0.3" />
    <path d="M 96 58 Q 96 56 98 56" fill="none" stroke={color} strokeWidth="0.3" />
  </svg>
);

// 浮动足球粒子
const FloatingBall: React.FC<{
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
  color: string;
}> = ({ size, x, y, delay, duration, color }) => (
  <div
    className="absolute pointer-events-none animate-float-ball"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  >
    <svg viewBox="0 0 40 40" className="w-full h-full opacity-20">
      <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="1.5" />
      {/* 足球纹理 */}
      <path
        d="M20 2 L24 8 L20 14 L16 8 Z"
        fill={color}
        fillOpacity="0.3"
      />
      <path
        d="M20 14 L24 8 L32 10 L28 18 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M20 14 L16 8 L8 10 L12 18 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M12 18 L8 30 L20 26 L28 30 L32 18"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M8 30 L2 20 L8 10"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M32 30 L38 20 L32 10"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
    </svg>
  </div>
);

// 动态光效轨道
const OrbitRing: React.FC<{
  size: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
  color: string;
}> = ({ size, x, y, duration, delay, color }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
    }}
  >
    <div
      className="w-full h-full rounded-full border animate-orbit-ring"
      style={{
        borderColor: `${color}15`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="absolute w-2 h-2 rounded-full animate-orbit-dot"
        style={{
          backgroundColor: color,
          top: '0',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`,
        }}
      />
    </div>
  </div>
);

// 六边形网格背景
const HexagonGrid: React.FC<{ color: string }> = ({ color }) => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.05]"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <defs>
      <pattern
        id="hexagons"
        width="10"
        height="17.32"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(2)"
      >
        <polygon
          points="5,0 10,2.89 10,8.66 5,11.55 0,8.66 0,2.89"
          fill="none"
          stroke={color}
          strokeWidth="0.3"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hexagons)" />
  </svg>
);

// 渐变光晕
const GradientGlow: React.FC<{
  role: UserRole | null;
}> = ({ role }) => {
  const theme = role ? roleThemes[role] : null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 主光晕 */}
      <div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse-slow"
        style={{
          background: theme
            ? `radial-gradient(circle, ${getComputedColor(theme.primary)}20 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse-slow"
        style={{
          background: theme
            ? `radial-gradient(circle, ${getComputedColor(theme.accent)}15 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          animationDelay: '2s',
        }}
      />
      {/* 角落装饰光晕 */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
    </div>
  );
};

// 辅助函数：获取计算后的颜色值
const getComputedColor = (colorClass: string): string => {
  const colorMap: Record<string, string> = {
    'emerald-500': '#10b981',
    'emerald-400': '#34d399',
    'orange-500': '#f97316',
    'indigo-500': '#6366f1',
    'cyan-500': '#06b6d4',
    'violet-500': '#8b5cf6',
    'rose-600': '#e11d48',
    'amber-500': '#f59e0b',
    'sky-500': '#0ea5e9',
    'teal-400': '#2dd4bf',
  };
  return colorMap[colorClass] || '#3b82f6';
};

export const FootballBackground: React.FC<FootballBackgroundProps> = ({
  role,
  step,
}) => {
  const theme = role ? roleThemes[role] : null;
  const primaryColor = theme ? getComputedColor(theme.primary) : '#3b82f6';
  const accentColor = theme ? getComputedColor(theme.accent) : '#8b5cf6';

  // 生成浮动足球粒子
  const floatingBalls = useMemo(() => {
    const balls = [];
    for (let i = 0; i < 8; i++) {
      balls.push({
        size: 30 + Math.random() * 40,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 15 + Math.random() * 10,
        color: Math.random() > 0.5 ? primaryColor : accentColor,
      });
    }
    return balls;
  }, [primaryColor, accentColor]);

  // 生成轨道环
  const orbitRings = useMemo(() => {
    return [
      { size: 200, x: '20%', y: '30%', duration: 20, delay: 0 },
      { size: 300, x: '80%', y: '70%', duration: 25, delay: 5 },
      { size: 150, x: '70%', y: '20%', duration: 18, delay: 3 },
    ];
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* 基础深色背景 */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      
      {/* 渐变光晕 */}
      <GradientGlow role={role} />
      
      {/* 六边形网格 */}
      <HexagonGrid color={primaryColor} />
      
      {/* 足球场线 */}
      <FieldLines color={primaryColor} />
      
      {/* 浮动足球粒子 */}
      {floatingBalls.map((ball, index) => (
        <FloatingBall key={index} {...ball} />
      ))}
      
      {/* 轨道环 */}
      {orbitRings.map((ring, index) => (
        <OrbitRing
          key={index}
          {...ring}
          color={index % 2 === 0 ? primaryColor : accentColor}
        />
      ))}
      
      {/* 步骤指示器光效 */}
      {step && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px animate-glow-line"
          style={{
            background: `linear-gradient(90deg, transparent, ${primaryColor}50, ${accentColor}50, transparent)`,
          }}
        />
      )}
      
      {/* 顶部光线 */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-32 opacity-30"
        style={{
          background: `linear-gradient(180deg, ${primaryColor}10 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

// 添加动画样式
export const backgroundStyles = `
  @keyframes float-ball {
    0%, 100% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 0.1;
    }
    25% {
      transform: translateY(-20px) rotate(90deg) scale(1.05);
      opacity: 0.15;
    }
    50% {
      transform: translateY(-10px) rotate(180deg) scale(1);
      opacity: 0.1;
    }
    75% {
      transform: translateY(-30px) rotate(270deg) scale(0.95);
      opacity: 0.12;
    }
  }
  
  @keyframes orbit-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  @keyframes orbit-dot {
    0% {
      transform: translate(-50%, -50%) rotate(0deg) translateX(50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg) translateX(50%) rotate(-360deg);
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }
  
  @keyframes glow-line {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  .animate-float-ball {
    animation: float-ball linear infinite;
  }
  
  .animate-orbit-ring {
    animation: orbit-ring linear infinite;
  }
  
  .animate-orbit-dot {
    animation: orbit-dot linear infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }
  
  .animate-glow-line {
    animation: glow-line 3s ease-in-out infinite;
  }
`;

export default FootballBackground;
