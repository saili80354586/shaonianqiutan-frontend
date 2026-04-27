import React, { useMemo } from 'react';

interface FootballBackgroundProps {
  step?: number;
  variant?: 'default' | 'role-select' | 'form';
}

// 科技感足球场线 - 带发光效果
const FieldLines: React.FC<{ color: string }> = ({ color }) => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.08]"
    viewBox="0 0 100 60"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* 外边框 - 带发光 */}
    <rect x="2" y="2" width="96" height="56" fill="none" stroke={color} strokeWidth="0.3" 
      style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
    {/* 中线 */}
    <line x1="50" y1="2" x2="50" y2="58" stroke={color} strokeWidth="0.3" opacity="0.6" />
    {/* 中圈 */}
    <circle cx="50" cy="30" r="8" fill="none" stroke={color} strokeWidth="0.3" opacity="0.5" />
    {/* 中点 - 发光 */}
    <circle cx="50" cy="30" r="0.8" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    {/* 左侧禁区 */}
    <rect x="2" y="18" width="12" height="24" fill="none" stroke={color} strokeWidth="0.25" opacity="0.4" />
    <rect x="2" y="24" width="4" height="12" fill="none" stroke={color} strokeWidth="0.25" opacity="0.4" />
    {/* 右侧禁区 */}
    <rect x="86" y="18" width="12" height="24" fill="none" stroke={color} strokeWidth="0.25" opacity="0.4" />
    <rect x="94" y="24" width="4" height="12" fill="none" stroke={color} strokeWidth="0.25" opacity="0.4" />
    {/* 角球区 */}
    <path d="M 2 4 Q 4 4 4 2" fill="none" stroke={color} strokeWidth="0.25" opacity="0.3" />
    <path d="M 96 4 Q 96 2 98 2" fill="none" stroke={color} strokeWidth="0.25" opacity="0.3" />
    <path d="M 2 56 Q 4 56 4 58" fill="none" stroke={color} strokeWidth="0.25" opacity="0.3" />
    <path d="M 96 58 Q 96 56 98 56" fill="none" stroke={color} strokeWidth="0.25" opacity="0.3" />
    {/* 科技感装饰线 - 数据流动感 */}
    <line x1="10" y1="30" x2="30" y2="30" stroke={color} strokeWidth="0.15" opacity="0.2" strokeDasharray="2 4">
      <animate attributeName="stroke-dashoffset" from="0" to="12" dur="3s" repeatCount="indefinite" />
    </line>
    <line x1="70" y1="30" x2="90" y2="30" stroke={color} strokeWidth="0.15" opacity="0.2" strokeDasharray="2 4">
      <animate attributeName="stroke-dashoffset" from="12" to="0" dur="3s" repeatCount="indefinite" />
    </line>
  </svg>
);

// 浮动足球粒子 - 科技感设计
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
    <svg viewBox="0 0 40 40" className="w-full h-full opacity-15">
      {/* 足球外圈 - 发光效果 */}
      <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="1.2" 
        style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
      {/* 足球纹理 - 五边形图案 */}
      <path d="M20 4 L23 9 L20 14 L17 9 Z" fill={color} fillOpacity="0.3" />
      <path d="M20 14 L23 9 L30 11 L27 17 Z" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M20 14 L17 9 L10 11 L13 17 Z" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M13 17 L10 28 L20 25 L27 28 L30 17" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M10 28 L4 20 L10 11" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M30 28 L36 20 L30 11" fill="none" stroke={color} strokeWidth="0.8" />
      {/* 科技感内圈 */}
      <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="0.5" opacity="0.5" 
        strokeDasharray="2 2" />
    </svg>
  </div>
);

// 动态光效轨道 - 科技感增强
const OrbitRing: React.FC<{
  size: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
  color: string;
  direction?: 'clockwise' | 'counter-clockwise';
}> = ({ size, x, y, duration, delay, color, direction = 'clockwise' }) => (
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
        borderColor: `${color}12`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationDirection: direction,
      }}
    >
      {/* 轨道上的发光点 */}
      <div
        className="absolute w-2 h-2 rounded-full animate-orbit-dot"
        style={{
          backgroundColor: color,
          top: '0',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationDirection: direction,
          boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`,
        }}
      />
    </div>
    {/* 内圈装饰 */}
    <div 
      className="absolute inset-4 rounded-full border border-dashed opacity-20"
      style={{ borderColor: color }}
    />
  </div>
);

// 科技感网格线 - 替代六边形
const TechGrid: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
    {/* 垂直线 */}
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={`v-${i}`}
        className="absolute top-0 bottom-0 w-px"
        style={{
          left: `${(i + 1) * 8}%`,
          background: `linear-gradient(180deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
        }}
      />
    ))}
    {/* 水平线 */}
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={`h-${i}`}
        className="absolute left-0 right-0 h-px"
        style={{
          top: `${(i + 1) * 12}%`,
          background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
        }}
      />
    ))}
    {/* 交叉点发光 */}
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={`dot-${i}`}
        className="absolute w-1 h-1 rounded-full animate-pulse"
        style={{
          left: `${20 + i * 15}%`,
          top: `${25 + (i % 3) * 25}%`,
          backgroundColor: color,
          opacity: 0.3,
          animationDelay: `${i * 0.5}s`,
        }}
      />
    ))}
  </div>
);

// 动态粒子效果
const ParticleField: React.FC<{ count: number; color: string }> = ({ count, color }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: 0.4,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }}
        />
      ))}
    </div>
  );
};

// 渐变光晕 - 科技感色调
const GradientGlow: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 主光晕 */}
      <div
        className="absolute top-1/3 left-1/4 w-[700px] h-[700px] rounded-full blur-[180px] animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] animate-pulse-slow"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          animationDelay: '2s',
        }}
      />
      {/* 科技感蓝光 */}
      <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px]" />
    </div>
  );
};

// 扫描线效果 - 科技感
const ScanLine: React.FC<{ color: string }> = ({ color }) => (
  <div 
    className="absolute inset-0 pointer-events-none overflow-hidden opacity-10"
    style={{
      background: `linear-gradient(180deg, transparent 50%, ${color}08 50%)`,
      backgroundSize: '100% 4px',
    }}
  >
    <div 
      className="absolute left-0 right-0 h-24 animate-scan"
      style={{
        background: `linear-gradient(180deg, transparent, ${color}15, transparent)`,
      }}
    />
  </div>
);

// 动态光线
const LightRays: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[35%] animate-ray"
      style={{
        background: `linear-gradient(180deg, ${color}20 0%, transparent 100%)`,
      }}
    />
    <div
      className="absolute top-0 left-1/3 w-[1px] h-[25%] animate-ray"
      style={{
        background: `linear-gradient(180deg, ${color}10 0%, transparent 100%)`,
        animationDelay: '0.5s',
      }}
    />
    <div
      className="absolute top-0 left-2/3 w-[1px] h-[30%] animate-ray"
      style={{
        background: `linear-gradient(180deg, ${color}10 0%, transparent 100%)`,
        animationDelay: '1s',
      }}
    />
  </div>
);

// 足球数据节点 - 科技感元素
const DataNodes: React.FC<{ color: string }> = ({ color }) => {
  const nodes = useMemo(() => [
    { x: '15%', y: '20%', size: 40 },
    { x: '85%', y: '30%', size: 32 },
    { x: '75%', y: '70%', size: 36 },
    { x: '25%', y: '75%', size: 28 },
    { x: '50%', y: '50%', size: 24 },
  ], []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {nodes.map((node, i) => (
        <div
          key={i}
          className="absolute animate-pulse-slow"
          style={{
            left: node.x,
            top: node.y,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 0.8}s`,
          }}
        >
          {/* 外圈 */}
          <div 
            className="rounded-full border opacity-20"
            style={{
              width: node.size,
              height: node.size,
              borderColor: color,
            }}
          />
          {/* 内点 */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: node.size * 0.25,
              height: node.size * 0.25,
              backgroundColor: color,
              opacity: 0.4,
              boxShadow: `0 0 ${node.size * 0.3}px ${color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const FootballBackground: React.FC<FootballBackgroundProps> = ({ step, variant = 'default' }) => {
  const primaryColor = '#10b981'; // emerald-500
  const accentColor = '#3b82f6'; // blue-500

  // 生成浮动足球粒子
  const floatingBalls = useMemo(() => {
    const balls = [];
    for (let i = 0; i < 5; i++) {
      balls.push({
        size: 28 + Math.random() * 24,
        x: `${10 + Math.random() * 80}%`,
        y: `${10 + Math.random() * 80}%`,
        delay: Math.random() * 5,
        duration: 20 + Math.random() * 15,
        color: Math.random() > 0.5 ? primaryColor : accentColor,
      });
    }
    return balls;
  }, []);

  // 生成轨道环
  const orbitRings = useMemo(() => {
    return [
      { size: 200, x: '20%', y: '30%', duration: 28, delay: 0, direction: 'clockwise' as const },
      { size: 300, x: '80%', y: '70%', duration: 35, delay: 3, direction: 'counter-clockwise' as const },
      { size: 140, x: '70%', y: '20%', duration: 22, delay: 1.5, direction: 'clockwise' as const },
      { size: 220, x: '30%', y: '75%', duration: 25, delay: 5, direction: 'counter-clockwise' as const },
    ];
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* 基础深色背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* 渐变光晕 */}
      <GradientGlow />
      
      {/* 科技感网格线 - 替代六边形 */}
      <TechGrid color={primaryColor} />
      
      {/* 足球场线 */}
      <FieldLines color={primaryColor} />
      
      {/* 扫描线效果 */}
      <ScanLine color={primaryColor} />
      
      {/* 动态光线 */}
      <LightRays color={primaryColor} />
      
      {/* 数据节点 */}
      <DataNodes color={accentColor} />
      
      {/* 粒子效果 */}
      <ParticleField count={15} color={primaryColor} />
      
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
            background: `linear-gradient(90deg, transparent, ${primaryColor}40, ${accentColor}40, transparent)`,
          }}
        />
      )}
      
      {/* 顶部光线 */}
      <div
        className="absolute top-0 left-1/4 right-1/4 h-20 opacity-15"
        style={{
          background: `linear-gradient(180deg, ${primaryColor}08 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

// 动画样式
export const backgroundStyles = `
  @keyframes float-ball {
    0%, 100% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 0.1;
    }
    25% {
      transform: translateY(-12px) rotate(90deg) scale(1.02);
      opacity: 0.15;
    }
    50% {
      transform: translateY(-6px) rotate(180deg) scale(1);
      opacity: 0.1;
    }
    75% {
      transform: translateY(-18px) rotate(270deg) scale(0.98);
      opacity: 0.12;
    }
  }
  
  @keyframes orbit-ring {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes orbit-dot {
    0% { transform: translate(-50%, -50%) rotate(0deg) translateX(50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg) translateX(50%) rotate(-360deg); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }
  
  @keyframes glow-line {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
  }
  
  @keyframes particle {
    0%, 100% { 
      opacity: 0.2; 
      transform: translateY(0) scale(1); 
    }
    50% { 
      opacity: 0.5; 
      transform: translateY(-15px) scale(1.3); 
    }
  }
  
  @keyframes ray {
    0%, 100% { 
      opacity: 0.2; 
      transform: scaleY(1); 
    }
    50% { 
      opacity: 0.5; 
      transform: scaleY(1.15); 
    }
  }

  @keyframes scan {
    0% { top: -100px; }
    100% { top: 100%; }
  }
  
  .animate-float-ball { animation: float-ball linear infinite; }
  .animate-orbit-ring { animation: orbit-ring linear infinite; }
  .animate-orbit-dot { animation: orbit-dot linear infinite; }
  .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
  .animate-glow-line { animation: glow-line 3s ease-in-out infinite; }
  .animate-particle { animation: particle ease-in-out infinite; }
  .animate-ray { animation: ray 4s ease-in-out infinite; }
  .animate-scan { animation: scan 8s linear infinite; }
`;

export default FootballBackground;
