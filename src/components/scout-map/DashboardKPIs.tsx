import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, Users, MapPin, Award, Activity, Zap, Sparkles } from 'lucide-react';
import type { Player } from './types';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface DashboardKPIsProps {
  players: Player[];
  totalCities: number;
}

// 数字滚动动画组件
function AnimatedNumber({ value, duration = 2, className = '' }: { value: number; duration?: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(value * easeProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref} className={className}>{displayValue.toLocaleString()}</span>;
}

interface KPICardProps {
  title: string;
  value: number | string;
  isNumeric?: boolean;
  subValue?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  iconBg: string;
  glowColor: string;
  delay: number;
}

function KPICard({ title, value, isNumeric = true, subValue, icon: Icon, trend, trendUp, gradient, iconBg, glowColor, delay }: KPICardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(300px circle at ${x}px ${y}px, ${glowColor}, transparent 60%)`
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-2xl p-5 border border-slate-700/50 ${gradient} group cursor-default`}
    >
      {/* Mouse follow glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background }}
      />
      
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-slate-400 font-medium">{title}</p>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.3 }}
            >
              <Sparkles className="w-3 h-3 text-amber-400/50" />
            </motion.div>
          </div>
          
          <div className="text-3xl font-bold text-white tracking-tight">
            {isNumeric && typeof value === 'number' ? (
              <AnimatedNumber value={value} duration={1.5} />
            ) : (
              value
            )}
          </div>
          
          {subValue && (
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.2 }}
              className="text-xs text-slate-500 mt-1.5 font-medium"
            >
              {subValue}
            </motion.p>
          )}
          
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.3 }}
              className={`flex items-center gap-1.5 mt-3 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}
            >
              <motion.div 
                animate={trendUp ? { y: [0, -2, 0] } : { y: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`flex items-center justify-center w-5 h-5 rounded-full ${trendUp ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
              >
                <TrendingUp className={`w-3 h-3 ${!trendUp && 'rotate-180'}`} />
              </motion.div>
              <span>{trend}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div 
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ duration: 0.2 }}
          className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg relative overflow-hidden`}
        >
          {/* Icon glow */}
          <div className="absolute inset-0 bg-white/20 blur-md" />
          <Icon className="w-6 h-6 text-white relative z-10" />
        </motion.div>
      </div>
      
      {/* Decorative corner accent */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500" />
      
      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}

export function DashboardKPIs({ players, totalCities }: DashboardKPIsProps) {
  const totalPlayers = players.length;
  const avgScore = totalPlayers > 0 
    ? Math.round(players.reduce((sum, p) => sum + (p.score || 0), 0) / totalPlayers)
    : 0;
  const highScoreCount = players.filter(p => (p.score || 0) >= 80).length;
  const avgHeight = totalPlayers > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.height || 0), 0) / totalPlayers)
    : 0;
  const avgWeight = totalPlayers > 0
    ? Math.round(players.reduce((sum, p) => sum + (p.weight || 0), 0) / totalPlayers)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard
        title="球员总数"
        value={totalPlayers}
        isNumeric={true}
        subValue={`覆盖 ${totalCities} 个城市`}
        icon={Users}
        trend="+12.5%"
        trendUp={true}
        gradient="bg-gradient-to-br from-blue-600/20 to-blue-700/10"
        iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
        glowColor="rgba(59, 130, 246, 0.3)"
        delay={0}
      />
      <KPICard
        title="平均评分"
        value={avgScore}
        isNumeric={true}
        subValue="满分100分"
        icon={Award}
        trend="+5.2%"
        trendUp={true}
        gradient="bg-gradient-to-br from-amber-600/20 to-amber-700/10"
        iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
        glowColor="rgba(245, 158, 11, 0.3)"
        delay={0.1}
      />
      <KPICard
        title="高分球员"
        value={highScoreCount}
        isNumeric={true}
        subValue={totalPlayers > 0 ? `占比 ${Math.round((highScoreCount / totalPlayers) * 100)}%` : '-'}
        icon={Zap}
        trend="+8.1%"
        trendUp={true}
        gradient="bg-gradient-to-br from-emerald-600/20 to-emerald-700/10"
        iconBg="bg-gradient-to-br from-emerald-500 to-green-600"
        glowColor="rgba(16, 185, 129, 0.3)"
        delay={0.2}
      />
      <KPICard
        title="平均身高"
        value={`${avgHeight}cm`}
        isNumeric={false}
        subValue="青少年标准"
        icon={MapPin}
        gradient="bg-gradient-to-br from-purple-600/20 to-purple-700/10"
        iconBg="bg-gradient-to-br from-purple-500 to-violet-600"
        glowColor="rgba(139, 92, 246, 0.3)"
        delay={0.3}
      />
      <KPICard
        title="平均体重"
        value={`${avgWeight}kg`}
        isNumeric={false}
        subValue="健康范围"
        icon={Activity}
        gradient="bg-gradient-to-br from-pink-600/20 to-pink-700/10"
        iconBg="bg-gradient-to-br from-pink-500 to-rose-500"
        glowColor="rgba(236, 72, 153, 0.3)"
        delay={0.4}
      />
    </div>
  );
}
