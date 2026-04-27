import { useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Activity, TrendingUp, Users, Award, Sparkles } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import type { Player } from './types';
import { POSITIONS } from './types';

interface DashboardChartsProps {
  players: Player[];
}

// 深色主题颜色配置 - 更鲜艳的渐变
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// 增强的 Tooltip 组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 shadow-2xl shadow-black/50"
      >
        <p className="text-slate-300 text-sm font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white font-semibold">
              {entry.value} {entry.name}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

// 图表卡片包装组件 - 带鼠标跟随光晕
function ChartCard({ 
  children, 
  title, 
  icon: Icon, 
  color, 
  delay = 0 
}: { 
  children: React.ReactNode; 
  title: string; 
  icon: any; 
  color: string;
  delay?: number;
}) {
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
    ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, ${color}20, transparent 60%)`
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      className="relative group"
    >
      {/* Mouse follow glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background }}
      />
      
      <Card className="relative p-5 border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay }}
          />
          <span>{title}</span>
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Icon className="w-4 h-4 text-slate-500 ml-auto" />
          </motion.div>
        </h4>
        <div className="h-48">
          {children}
        </div>
      </Card>
    </motion.div>
  );
}

// 年龄结构图表
function AgeDistributionChart({ players }: { players: Player[] }) {
  const data = useMemo(() => {
    const ageGroups: Record<string, number> = {};
    players.forEach(p => {
      if (p.age) {
        const group = `${Math.floor(p.age / 2) * 2}-${Math.floor(p.age / 2) * 2 + 1}岁`;
        ageGroups[group] = (ageGroups[group] || 0) + 1;
      }
    });
    return Object.entries(ageGroups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [players]);

  return (
    <ChartCard title="年龄结构分布" icon={Users} color="#10b981" delay={0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 位置分布饼图 - 带动态旋转
function PositionPieChart({ players }: { players: Player[] }) {
  const data = useMemo(() => {
    const positionCount: Record<string, number> = {};
    players.forEach(p => {
      if (p.position) {
        const label = POSITIONS.find(pos => pos.value === p.position)?.label || p.position;
        positionCount[label] = (positionCount[label] || 0) + 1;
      }
    });
    return Object.entries(positionCount).map(([name, value]) => ({ name, value }));
  }, [players]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ChartCard title="位置分布" icon={Award} color="#3b82f6" delay={0.1}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={activeIndex !== null ? 80 : 70}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            animationBegin={0}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                strokeWidth={activeIndex === index ? 2 : 0}
                stroke="#fff"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend fontSize={11} wrapperStyle={{ color: '#94a3b8' }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 评分分布雷达图
function ScoreRadarChart({ players }: { players: Player[] }) {
  const data = useMemo(() => {
    const ranges = [
      { name: '60-69分', min: 60, max: 69 },
      { name: '70-79分', min: 70, max: 79 },
      { name: '80-89分', min: 80, max: 89 },
      { name: '90-99分', min: 90, max: 99 },
    ];
    
    return ranges.map(range => ({
      name: range.name,
      count: players.filter(p => {
        const score = p.score || 0;
        return score >= range.min && score <= range.max;
      }).length,
    }));
  }, [players]);

  return (
    <ChartCard title="评分分布" icon={TrendingUp} color="#8b5cf6" delay={0.2}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
          <Radar
            name="球员数量"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="#8b5cf6"
            fillOpacity={0.4}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// TOP10 评分球员排行
function TopPlayersChart({ players }: { players: Player[] }) {
  const data = useMemo(() => {
    return [...players]
      .filter(p => p.score)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map((p, index) => ({
        name: p.nickname || `球员${index + 1}`,
        score: p.score || 0,
        position: p.position || '-',
      }));
  }, [players]);

  return (
    <ChartCard title="TOP10 评分排行" icon={Award} color="#f59e0b" delay={0.3}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={60} axisLine={{ stroke: '#334155' }} />
          <Tooltip 
            content={<CustomTooltip />}
            formatter={(value: number) => [`${value}分`, '评分']}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} fill="#f59e0b">
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index < 3 ? '#f59e0b' : '#d97706'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 技能标签词云
function SkillsChart({ players }: { players: Player[] }) {
  const data = useMemo(() => {
    const skillCount: Record<string, number> = {};
    players.forEach(p => {
      p.skillTags?.forEach(tag => {
        skillCount[tag] = (skillCount[tag] || 0) + 1;
      });
    });
    return Object.entries(skillCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [players]);

  return (
    <ChartCard title="热门技能标签" icon={Sparkles} color="#ec4899" delay={0.4}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} axisLine={{ stroke: '#334155' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#ec4899">
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// 统计摘要卡片 - 带数字动画
function SummaryCard({ players }: { players: Player[] }) {
  const [count, setCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="p-5 border border-slate-700/50 bg-gradient-to-br from-emerald-600/20 to-green-700/10 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center min-h-[240px] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Floating particles effect */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + i * 0.5,
              delay: i * 0.2,
            }}
          />
        ))}
        
        <div className="relative text-center">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20"
          >
            <motion.span 
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              {players.length}
            </motion.span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="text-white font-semibold text-lg"
          >
            当前数据覆盖球员
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="text-sm text-slate-400 mt-2"
          >
            点击查看详细报告
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            className="mt-5 px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-colors border border-emerald-500/30"
          >
            查看报告
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}

// 空状态组件
function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="col-span-full text-center py-20"
    >
      <motion.div 
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center"
        animate={{ 
          boxShadow: ['0 0 0 rgba(100, 116, 139, 0)', '0 0 30px rgba(100, 116, 139, 0.3)', '0 0 0 rgba(100, 116, 139, 0)']
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Activity className="w-10 h-10 text-slate-600" />
      </motion.div>
      <p className="text-xl font-medium text-slate-300">暂无数据</p>
      <p className="text-sm text-slate-500 mt-2">等待数据加载完成</p>
    </motion.div>
  );
}

export function DashboardCharts({ players }: DashboardChartsProps) {
  if (players.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <AgeDistributionChart players={players} />
      <PositionPieChart players={players} />
      <ScoreRadarChart players={players} />
      <TopPlayersChart players={players} />
      <SkillsChart players={players} />
      <SummaryCard players={players} />
    </div>
  );
}
