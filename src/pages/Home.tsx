// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { 
  Search, Target, LineChart, Star, Scale, Rocket,
  Upload, User, CreditCard, Video, FileText,
  Check, Play, TrendingUp, Shield, Users, Sparkles,
  ChevronRight, ArrowRight, Zap, Award, Trophy,
  Clock, RefreshCw
} from 'lucide-react';

// ============ 高级动效组件 ============

// 粒子背景组件
const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number; size: number; alpha: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((particle, i) => {
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          particle.vx -= (dx / dist) * force * 0.5;
          particle.vy -= (dy / dist) * force * 0.5;
        }
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${particle.alpha})`;
        ctx.fill();

        particlesRef.current.slice(i + 1).forEach((other) => {
          const d = Math.sqrt(Math.pow(particle.x - other.x, 2) + Math.pow(particle.y - other.y, 2));
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.1 * (1 - d / 120)})`;
            ctx.stroke();
          }
        });
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" style={{ zIndex: 1 }} />;
};

// 数字滚动动画
const AnimatedCounter: React.FC<{ end: number | string; suffix?: string; duration?: number }> = ({ 
  end, suffix = '', duration = 2000 
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) setIsVisible(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const numericEnd = typeof end === 'string' ? parseInt(end) || 0 : end;
    if (isNaN(numericEnd)) { setCount(end as any); return; }
    const startTime = Date.now();
    const update = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(numericEnd * easeOut));
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [isVisible, end, duration]);

  const displayValue = typeof end === 'string' && isNaN(parseInt(end)) ? end : count;
  return <span ref={ref}>{displayValue}{suffix}</span>;
};

// 3D倾斜卡片
const TiltCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{ transform, transition: 'transform 0.15s ease-out' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)` }}
      />
    </div>
  );
};

// 光晕按钮
const GlowButton: React.FC<{
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ children, to, href, onClick, variant = 'primary', className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  };

  const baseClasses = `relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold rounded-full px-10 py-4 text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1419] cursor-pointer select-none`;
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-[#4a90d9] to-[#60a5fa] text-white shadow-lg hover:shadow-xl focus:ring-[#4a90d9]'
    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:ring-white/50';

  const Component = to ? Link : 'a';
  const props = to ? { to } : { href };

  return (
    <Component
      {...props}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{ boxShadow: isHovered && variant === 'primary' ? '0 0 40px rgba(74, 144, 217, 0.5), 0 10px 30px rgba(74, 144, 217, 0.3)' : undefined }}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{ left: ripple.x, top: ripple.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }}
        />
      ))}
    </Component>
  );
};

// 视差背景
const ParallaxBackground: React.FC<{ src: string; alt: string; speed?: number; opacity?: number; className?: string }> = ({ 
  src, alt, speed = 0.5, opacity = 1, className = '' 
}) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      if (scrolled > 0 && rect.bottom > 0) setOffset(scrolled * speed);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-[120%] object-cover" style={{ transform: `translateY(${offset * 0.1}px)`, opacity }} />
    </div>
  );
};

// 滚动进度指示器
const ScrollProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((window.scrollY / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[100]">
      <div className="h-full bg-gradient-to-r from-[#4a90d9] via-[#34d399] to-[#22c55e] transition-all duration-150" style={{ width: `${progress}%` }} />
    </div>
  );
};

// 动画Section
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' }> = ({ 
  children, className = '', delay = 0, direction = 'up'
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const getTransform = () => {
    switch (direction) {
      case 'up': return isVisible ? 'translateY(0)' : 'translateY(3rem)';
      case 'down': return isVisible ? 'translateY(0)' : 'translateY(-3rem)';
      case 'left': return isVisible ? 'translateX(0)' : 'translateX(3rem)';
      case 'right': return isVisible ? 'translateX(0)' : 'translateX(-3rem)';
      default: return 'translateY(0)';
    }
  };

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{ 
        transition: 'transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 800ms ease-out',
        transitionDelay: `${delay}ms`, transform: getTransform(), opacity: isVisible ? 1 : 0
      }}
    >
      {children}
    </div>
  );
};

// ============ 主页面 ============

const Home: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleCTAClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen pt-[56px]">
      <ScrollProgress />
      
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-56px)] flex items-center justify-center overflow-hidden bg-[#0a0e14]">
        <ParallaxBackground src="/photos/IMG_4140.jpg" alt="足球训练" speed={0.3} className="z-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,20,25,0.85)] to-[rgba(15,20,25,0.6)] z-[1]"></div>
        <ParticleBackground />

        <div className="relative z-10 text-center max-w-4xl px-6">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8 animate-fadeInDown">
            <Sparkles className="w-4 h-4 text-[#34d399]" />
            <span className="text-white/80 text-sm">专业青少年足球球探平台</span>
          </div>

          <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold text-white mb-5 leading-tight animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            让足球天赋
            <span className="bg-gradient-to-r from-[#4a90d9] to-[#60a5fa] bg-clip-text text-transparent block mt-2">
              被专业看见
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-10 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            中国青少年足球球探系统 · 专业视频分析 · 人才发掘平台
          </p>

          {/* 数据统计 */}
          <div className="flex justify-center gap-10 mb-10 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            {[
              { value: 500, suffix: '+', label: '认证分析师' },
              { value: 10, suffix: '万+', label: '分析视频' },
              { value: 98, suffix: '%', label: '好评率' }
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="text-[clamp(2rem,4vw,2.5rem)] font-bold text-[#4a90d9] group-hover:scale-110 transition-transform duration-300">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center flex-wrap animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
            <GlowButton to="/video-analysis" onClick={handleCTAClick} variant="primary">
              <Play className="w-5 h-5" />
              立即体验
            </GlowButton>
            <GlowButton href="#benefits" variant="secondary">
              了解更多
              <ChevronRight className="w-5 h-5" />
            </GlowButton>
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce-slow">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-scrollDown" />
          </div>
        </div>
      </section>

      {/* 使命 Section */}
      <AnimatedSection direction="up" className="bg-[#0a0e14]">
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0e14]">
          <ParallaxBackground src="/photos/match-6.jpg" alt="足球少年" speed={0.2} opacity={0.7} className="z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,20,25,0.85)] via-[rgba(26,35,50,0.75)] to-[rgba(15,20,25,0.8)] z-[1]"></div>

          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center max-w-[900px] mx-auto">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34d399] to-[#10b981] text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg shadow-[#34d399]/30">
                  <Zap className="w-4 h-4" />
                  我们的使命
                </span>
              </div>

              <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] font-bold text-white mb-6 leading-tight">
                发现下一个
                <span className="bg-gradient-to-r from-[#34d399] to-[#10b981] bg-clip-text text-transparent block mt-2">
                  足球明星
                </span>
              </h2>

              <p className="text-xl text-white/80 leading-relaxed mb-12 max-w-2xl mx-auto">
                中国有数百万热爱足球的青少年,他们中的许多人拥有成为职业球员的潜质,
                却因为缺乏被发现的机会而埋没。我们要做的,就是让每一份天赋都被看见。
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                {[
                  { value: 500, suffix: '万+', label: '青少年足球人口' },
                  { value: 1, suffix: '%', label: '被发现的机会', prefix: '<' },
                  { value: '∞', suffix: '', label: '无限可能' },
                  { value: 100, suffix: '%', label: '值得被看见' }
                ].map((stat, i) => (
                  <div key={i} className="text-center group">
                    <div className="text-[clamp(2rem,4vw,3rem)] font-bold text-[#34d399] mb-2 group-hover:scale-110 transition-transform duration-300">
                      {stat.prefix && <span className="text-[#34d399]/60">{stat.prefix}</span>}
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-white/70 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>

              <TiltCard className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 mb-10 max-w-2xl mx-auto hover:border-white/30 transition-all duration-300">
                <p className="text-lg text-white/90 leading-relaxed italic">
                  "我们相信,中国不缺少足球天才,缺少的是发现天才的眼睛。
                  少年球探,要做那双眼,连接每一份天赋与每一个机会。"
                </p>
              </TiltCard>

              <GlowButton to="/video-analysis" onClick={handleCTAClick} variant="primary" className="!from-[#34d399] !to-[#10b981] !shadow-[#34d399]/40 !focus:ring-[#34d399]">
                展示你的天赋
                <Rocket className="w-5 h-5" />
              </GlowButton>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* 球员价值 */}
      <AnimatedSection delay={100} direction="up" className="bg-[#0a0e14]">
        <section id="benefits" className="relative min-h-screen flex items-center overflow-hidden py-20 bg-[#0a0e14]">
          <ParallaxBackground src="/photos/match-2.jpg" alt="足球比赛" speed={0.15} className="z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,20,25,0.92)] to-[rgba(26,35,50,0.88)] z-[1]"></div>

          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 bg-[rgba(52,211,153,0.2)] text-[#34d399] px-5 py-2 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                球员价值
              </span>
              <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-bold text-white mb-4">
                为中国青少年球员创造的价值
              </h2>
              <p className="text-white/70 text-lg">打破地域限制,让每一份天赋都被专业看见</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search, title: '专业技术诊断', desc: '告别主观评价,职业分析师深度解析,15+项技术指标量化评分', color: '#34d399' },
                { icon: Target, title: '个性化成长路径', desc: '基于分析报告制定针对性提升计划,明确优先级', color: '#60a5fa' },
                { icon: LineChart, title: '成长数据档案', desc: '建立专属技术档案,生成可视化成长曲线', color: '#a78bfa' },
                { icon: Star, title: '俱乐部曝光通道', desc: '优秀球员将获得推荐至职业俱乐部、青训营的机会', color: '#fbbf24' },
                { icon: Scale, title: '科学选材依据', desc: '为教练和球探提供标准化评估体系', color: '#f472b6' },
                { icon: Rocket, title: '职业发展规划', desc: '专业分析师评估发展潜力,给出理性发展建议', color: '#22d3ee' },
              ].map((item, index) => (
                <TiltCard key={index}>
                  <div className="glass-card group cursor-pointer h-full" tabIndex={0} role="button" aria-label={item.title}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-white text-xl mb-3 font-medium group-hover:text-[#34d399] transition-colors">{item.title}</h3>
                    <p className="text-white/70 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* 专业报告 */}
      <AnimatedSection delay={150} direction="left" className="bg-[#0a0e14]">
        <section className="relative min-h-screen flex items-center overflow-hidden py-20 bg-[#0a0e14]">
          <ParallaxBackground src="/photos/match-3.jpg" alt="教练指导" speed={0.2} opacity={0.6} className="z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,20,25,0.88)] via-[rgba(26,35,50,0.78)] to-[rgba(15,20,25,0.85)] z-[1]"></div>

          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 bg-[rgba(52,211,153,0.2)] text-[#34d399] px-5 py-2 rounded-full text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                专业报告
              </span>
              <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-bold text-white mb-4">职业级球探分析报告</h2>
              <p className="text-white/70 text-lg">每一份报告都由专业分析师深度解析,涵盖技术、战术、心理等多维度评估</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: Play, title: '技术动作分析', desc: '传球、射门、盘带、控球等核心技术动作拆解评估' },
                  { icon: Target, title: '战术意识评估', desc: '跑位选择、空间感知、团队配合等战术素养分析' },
                  { icon: TrendingUp, title: '身体素质测评', desc: '速度、爆发力、协调性、耐力等身体条件评估' },
                  { icon: LineChart, title: '发展潜力预测', desc: '基于年龄和当前水平,预测未来发展空间' },
                ].map((item, index) => (
                  <TiltCard key={index}>
                    <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:border-white/30 hover:shadow-2xl hover:shadow-[#34d399]/10 transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#34d399]/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-6 h-6 text-[#34d399]" />
                      </div>
                      <h4 className="mb-2 text-white font-medium group-hover:text-[#34d399] transition-colors">{item.title}</h4>
                      <p className="text-white/70 text-sm">{item.desc}</p>
                    </div>
                  </TiltCard>
                ))}
              </div>

              <div className="px-5 lg:px-10">
                <h3 className="text-3xl mb-6 text-[#34d399] font-semibold">报告核心价值</h3>
                <ul className="list-none p-0 space-y-5">
                  {[
                    { title: '客观数据支撑', desc: '告别主观印象,用数据说话,精准定位技术短板' },
                    { title: '专业改进建议', desc: '分析师提供针对性训练方案,提升效率事半功倍' },
                    { title: '成长轨迹追踪', desc: '多次分析对比,清晰看到进步曲线和成长轨迹' },
                    { title: '权威背书认证', desc: '专业分析师签名认证,为升学选秀提供有力证明' },
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-4 group cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#34d399]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#34d399]/30 transition-colors">
                        <Check className="w-5 h-5 text-[#34d399]" />
                      </div>
                      <div>
                        <strong className="block mb-1 text-white group-hover:text-[#34d399] transition-colors">{item.title}</strong>
                        <span className="text-white/70">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* 服务流程 - 全新设计 */}
      <AnimatedSection delay={200} direction="up" className="bg-[#0a0e14]">
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0a0e14]">
          {/* 动态背景 */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(74, 144, 217, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)`
            }}></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#34d399]/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4a90d9]/50 to-transparent"></div>
          </div>

          <div className="container mx-auto relative z-10 max-w-[1400px] px-4 py-20">
            {/* 标题区 */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#4a90d9]/20 to-[#34d399]/20 backdrop-blur-sm border border-[#34d399]/30 rounded-full px-5 py-2.5 mb-6">
                <Rocket className="w-4 h-4 text-[#34d399]" />
                <span className="text-[#34d399] text-sm font-semibold tracking-wider">服务流程</span>
              </div>
              <h2 className="text-white text-[clamp(2rem,4vw,3rem)] font-bold mb-4">
                5步开启你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a90d9] to-[#34d399]">专业分析之旅</span>
              </h2>
              <p className="text-white/50 text-lg max-w-[600px] mx-auto">
                从上传视频到获取报告，全程仅需几分钟，让专业分析师为你的足球之路保驾护航
              </p>
            </div>

            {/* 流程步骤 - 水平时间线布局 */}
            <div className="relative mb-16">
              {/* 连接线 - 桌面端 */}
              <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-[#4a90d9]/30 via-[#34d399]/30 to-[#4a90d9]/30 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4a90d9] via-[#34d399] to-[#4a90d9] animate-flowLine"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
                {[
                  { 
                    step: '01', 
                    icon: Upload, 
                    title: '上传视频', 
                    desc: '上传比赛或训练视频',
                    detail: '支持MP4、MOV等主流格式',
                    color: '#4a90d9',
                    gradient: 'from-[#4a90d9] to-[#60a5fa]',
                    bgGlow: 'rgba(74, 144, 217, 0.15)'
                  },
                  { 
                    step: '02', 
                    icon: Search, 
                    title: '选择分析师', 
                    desc: '浏览认证分析师档案',
                    detail: '查看评分、案例和专长领域',
                    color: '#34d399',
                    gradient: 'from-[#34d399] to-[#10b981]',
                    bgGlow: 'rgba(52, 211, 153, 0.15)'
                  },
                  { 
                    step: '03', 
                    icon: CreditCard, 
                    title: '安全支付', 
                    desc: '确认订单并完成付款',
                    detail: '支持微信、支付宝等多种方式',
                    color: '#f59e0b',
                    gradient: 'from-[#f59e0b] to-[#d97706]',
                    bgGlow: 'rgba(245, 158, 11, 0.15)'
                  },
                  { 
                    step: '04', 
                    icon: Video, 
                    title: '专业分析', 
                    desc: '分析师深度解析视频',
                    detail: '24-48小时内完成评估',
                    color: '#a78bfa',
                    gradient: 'from-[#a78bfa] to-[#8b5cf6]',
                    bgGlow: 'rgba(167, 139, 250, 0.15)'
                  },
                  { 
                    step: '05', 
                    icon: FileText, 
                    title: '获取报告', 
                    desc: '下载专业球探报告',
                    detail: 'PDF格式，永久保存查看',
                    color: '#22d3ee',
                    gradient: 'from-[#22d3ee] to-[#06b6d4]',
                    bgGlow: 'rgba(34, 211, 238, 0.15)'
                  },
                ].map((item, index) => (
                  <div key={index} className="relative group">
                    {/* 步骤卡片 */}
                    <div 
                      className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-2 h-full cursor-pointer overflow-hidden"
                      style={{
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 8px 40px ${item.bgGlow}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {/* 步骤编号徽章 */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <div 
                          className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-110`}
                          style={{ boxShadow: `0 4px 20px ${item.color}40` }}
                        >
                          {item.step}
                        </div>
                      </div>

                      {/* 图标容器 */}
                      <div className="mt-5 mb-5 flex justify-center">
                        <div 
                          className="w-[72px] h-[72px] rounded-2xl p-[2px] transition-all duration-300 group-hover:scale-105"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.color}80, ${item.color})`,
                            boxShadow: `0 8px 30px ${item.color}30`
                          }}
                        >
                          <div className="w-full h-full rounded-2xl bg-[#0a0e14] flex items-center justify-center">
                            <item.icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" style={{ color: item.color }} />
                          </div>
                        </div>
                      </div>

                      {/* 内容 */}
                      <div className="text-center">
                        <h3 
                          className="text-white text-lg font-semibold mb-2 transition-colors duration-300"
                          style={{ color: item.color }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-white/70 text-sm mb-3 leading-relaxed">{item.desc}</p>
                        <p className="text-white/40 text-xs leading-relaxed">{item.detail}</p>
                      </div>

                      {/* 悬停光效 */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 0%, ${item.color}15, transparent 60%)`
                        }}
                      />

                      {/* 边框发光效果 */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${item.color}20, transparent 50%)`,
                          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          maskComposite: 'xor',
                          WebkitMaskComposite: 'xor',
                          padding: '1px'
                        }}
                      />
                    </div>

                    {/* 桌面端步骤箭头 */}
                    {index < 4 && (
                      <div className="hidden lg:flex absolute top-[60px] -right-3 w-6 h-6 items-center justify-center z-10">
                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <ChevronRight className="w-3 h-3 text-white/30" />
                        </div>
                      </div>
                    )}

                    {/* 移动端连接线 */}
                    {index < 4 && (
                      <div className="sm:hidden flex justify-center my-4">
                        <div className="w-px h-8 bg-gradient-to-b from-[#34d399]/50 to-transparent"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 特色功能展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
              {[
                { icon: Clock, title: '快速响应', desc: '分析师承诺48小时内完成分析', color: '#4a90d9', gradient: 'from-[#4a90d9]/20 to-[#60a5fa]/5' },
                { icon: Shield, title: '隐私保护', desc: '视频加密存储，仅分析师可见', color: '#34d399', gradient: 'from-[#34d399]/20 to-[#10b981]/5' },
                { icon: RefreshCw, title: '满意保障', desc: '不满意可申请修改或退款', color: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-[#d97706]/5' },
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 bg-gradient-to-br from-white/[0.06] to-transparent backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 hover:border-white/20 transition-all duration-300 group cursor-pointer"
                  style={{
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 32px ${feature.color}15`;
                    e.currentTarget.style.borderColor = `${feature.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                    style={{ 
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                      boxShadow: `0 4px 20px ${feature.color}15`
                    }}
                  >
                    <feature.icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1 group-hover:text-white/90 transition-colors">{feature.title}</h4>
                    <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA区域 - 优化设计 */}
            <div className="text-center">
              <div 
                className="inline-flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-r from-[#4a90d9]/10 via-[#34d399]/10 to-[#4a90d9]/10 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:px-10 sm:py-7"
                style={{
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.2), rgba(52, 211, 153, 0.1))',
                      boxShadow: '0 4px 20px rgba(74, 144, 217, 0.2)'
                    }}
                  >
                    <Sparkles className="w-7 h-7 text-[#34d399]" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-lg mb-0.5">准备好开始了吗？</p>
                    <p className="text-white/50 text-sm">新用户首单立减 <span className="text-[#34d399] font-semibold">20元</span></p>
                  </div>
                </div>
                <GlowButton to="/video-analysis" onClick={handleCTAClick} variant="primary" className="!px-8 !py-3.5 whitespace-nowrap">
                  <ArrowRight className="w-5 h-5" />
                </GlowButton>
              </div>
            </div>
          </div>

          {/* CSS动画 */}
          <style>{`
            @keyframes flowLine {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-flowLine {
              animation: flowLine 3s linear infinite;
            }
          `}</style>
        </section>
      </AnimatedSection>

      {/* 成功案例 */}
      <AnimatedSection delay={250} direction="up" className="bg-[#0a0e14]">
        <section className="relative min-h-screen flex items-center overflow-hidden py-20 bg-[#0a0e14]">
          <ParallaxBackground src="/photos/match-5.jpg" alt="比赛瞬间" speed={0.2} opacity={0.65} className="z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(15,20,25,0.9)] via-[rgba(26,35,50,0.8)] to-[rgba(15,20,25,0.88)] z-[1]"></div>

          <div className="container mx-auto relative z-10 px-4">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 bg-[rgba(52,211,153,0.2)] text-[#34d399] px-5 py-2 rounded-full text-sm font-medium mb-4">
                <Trophy className="w-4 h-4" />
                成功案例
              </span>
              <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-bold text-white mb-4">他们已经在进步</h2>
              <p className="text-white/70 text-lg">来自全国各地的球员,通过专业分析实现技术突破</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: '张小明', age: '12岁', location: '广东广州', avatar: '张',
                  quote: '通过分析报告,我发现自己的传球成功率只有65%,经过针对性训练,现在提升到85%,成功入选市青训队!',
                  stats: [{ value: '+20%', label: '传球成功率' }, { value: '入选', label: '市青训队' }]
                },
                {
                  name: '李小强', age: '14岁', location: '浙江杭州', avatar: '李',
                  quote: '分析师指出我的防守站位问题,经过3个月训练,抢断成功率提升30%,被球探关注!',
                  stats: [{ value: '+30%', label: '抢断成功率' }, { value: '被关注', label: '职业球探' }]
                },
                {
                  name: '王小红', age: '11岁', location: '江苏南京', avatar: '王',
                  quote: '第一次获得如此详细的分析报告,让我清楚知道自己的优势和不足,训练更有方向了!',
                  stats: [{ value: '15项', label: '技术指标' }, { value: '明确', label: '训练方向' }]
                },
              ].map((item, index) => (
                <TiltCard key={index}>
                  <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/30 hover:shadow-2xl hover:shadow-[#34d399]/10 transition-all duration-300 hover:-translate-y-1 group cursor-pointer h-full">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#34d399] to-[#10b981] flex items-center justify-center font-semibold text-white text-lg group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#34d399]/30">
                        {item.avatar}
                      </div>
                      <div>
                        <h4 className="text-white mb-1 font-medium group-hover:text-[#34d399] transition-colors">{item.name}</h4>
                        <span className="text-white/60 text-sm">{item.age} · {item.location}</span>
                      </div>
                    </div>
                    <p className="text-white/85 leading-relaxed mb-6 italic">"{item.quote}"</p>
                    <div className="flex gap-5 pt-5 border-t border-white/10">
                      {item.stats.map((stat, idx) => (
                        <div key={idx} className="text-center flex-1">
                          <div className="text-2xl font-bold text-[#34d399] group-hover:scale-110 transition-transform">{stat.value}</div>
                          <div className="text-white/60 text-sm">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Footer */}
      <footer className="bg-[#0a0e14] border-t border-[#2d3748] py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* 居中大Logo */}
          <div className="flex flex-col items-center mb-10">
            {/* Brand - 带动态效果的Logo */}
            <div className="relative group mb-8" style={{ perspective: '1000px' }}>
              {/* 光晕背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#4a90d9]/30 via-[#34d399]/30 to-[#4a90d9]/30 rounded-full blur-2xl opacity-60 animate-pulse-glow"></div>
              {/* Logo - 扩大2倍 */}
              <img 
                src="/images/logo-footer.png" 
                alt="少年球探" 
                className="relative h-56 w-auto object-contain animate-logo-3d drop-shadow-[0_0_40px_rgba(74,144,217,0.7)]"
              />
            </div>

            {/* Links - Logo下方 */}
            <nav className="flex gap-8 mb-6" aria-label="Footer navigation">
              <Link to="/" className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors cursor-pointer">首页</Link>
              <Link to="/video-analysis" className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors cursor-pointer">视频分析</Link>
              <Link to="/become-analyst" className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors cursor-pointer">分析师招募</Link>
            </nav>
          </div>

          {/* Bottom - 版权信息 */}
          <div className="text-center pt-8 border-t border-[#2d3748]">
            <p className="text-[#9aa0a6] text-sm">&copy; 2025 少年球探 Youth Scout. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* CSS 动画定义 */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        .animate-fadeInDown { animation: fadeInDown 0.8s ease-out both; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out both; }
        .animate-scrollDown { animation: scrollDown 1.5s infinite; }
        .animate-ripple { animation: ripple 0.6s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 2s infinite; }
        
        /* Footer Logo 动画 - 3D旋转+浮动+呼吸效果，5秒一个周期 */
        @keyframes logo-3d {
          0% { transform: translateY(0) scale(1) rotateY(0deg); }
          40% { transform: translateY(-12px) scale(1.02) rotateY(0deg); }
          50% { transform: translateY(-12px) scale(1.02) rotateY(360deg); }
          60% { transform: translateY(-12px) scale(1.02) rotateY(360deg); }
          100% { transform: translateY(0) scale(1) rotateY(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-logo-3d { 
          animation: logo-3d 5s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .animate-pulse-glow { animation: pulse-glow 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Home;
