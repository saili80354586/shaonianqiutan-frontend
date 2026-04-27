import { Users, Building2 } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { ViewLevel } from './types';

interface StatsCardProps {
  viewLevel: ViewLevel;
  totalPlayers: number;
  totalCities: number;
}

// 数字滚动动画组件
function AnimatedNumber({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={className}>
      {value.toLocaleString()}
    </span>
  );
}

export function StatsCard({ viewLevel, totalPlayers, totalCities }: StatsCardProps) {
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
    ([x, y]) => `radial-gradient(200px circle at ${x}px ${y}px, rgba(16, 185, 129, 0.15), transparent 60%)`
  );

  const getPlayerLabel = () => {
    switch (viewLevel) {
      case 'national':
        return '全国球员';
      case 'province':
        return '省内球员';
      case 'city':
        return '城市球员';
      default:
        return '球员';
    }
  };

  const getCityLabel = () => {
    switch (viewLevel) {
      case 'national':
        return '覆盖城市';
      case 'province':
        return '省内城市';
      case 'city':
        return '当前城市';
      default:
        return '城市';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-5 group cursor-default shadow-2xl shadow-slate-900/50"
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
      
      <div className="relative flex items-center gap-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            <Users className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-slate-100">
              <AnimatedNumber value={totalPlayers} />
            </p>
            <p className="text-xs text-slate-400">{getPlayerLabel()}</p>
          </div>
        </div>

        <div className="w-px h-12 bg-slate-700" />

        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Building2 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-slate-100">
              <AnimatedNumber value={totalCities} />
            </p>
            <p className="text-xs text-slate-400">{getCityLabel()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
