import { Card } from '@/components/ui/card';
import { Target, Shield, Crosshair, CircleDot } from 'lucide-react';
import type { PositionStats } from './types';

interface PositionStatsCardsProps {
  stats: PositionStats;
  selectedPosition: keyof PositionStats | null;
  onSelectPosition: (position: keyof PositionStats | null) => void;
}

const POSITION_CONFIG = {
  forward: {
    label: '前锋',
    icon: Target,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    shadowColor: 'shadow-red-500/20',
  },
  midfielder: {
    label: '中场',
    icon: Crosshair,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    shadowColor: 'shadow-blue-500/20',
  },
  defender: {
    label: '后卫',
    icon: Shield,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    shadowColor: 'shadow-emerald-500/20',
  },
  goalkeeper: {
    label: '门将',
    icon: CircleDot,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    shadowColor: 'shadow-amber-500/20',
  },
};

export function PositionStatsCards({ stats, selectedPosition, onSelectPosition }: PositionStatsCardsProps) {
  const positions = Object.entries(stats) as [keyof PositionStats, number][];
  const total = positions.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      {positions.map(([key, count]) => {
        const config = POSITION_CONFIG[key];
        const Icon = config.icon;
        const isSelected = selectedPosition === key;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <Card
            key={key}
            onClick={() => onSelectPosition(isSelected ? null : key)}
            className={`p-3 cursor-pointer transition-all duration-300 border-2 ${
              isSelected
                ? `${config.borderColor} ${config.bgColor} shadow-lg ${config.shadowColor}`
                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-700/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${config.shadowColor}`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isSelected ? config.textColor : 'text-slate-200'}`}>{config.label}</span>
                  <span className={`text-xs font-medium ${config.textColor}`}>{percentage}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${isSelected ? config.textColor : 'text-slate-100'}`}>{count}</span>
                  <span className="text-xs text-slate-500">人</span>
                </div>
              </div>
            </div>
            {/* 进度条 */}
            <div className="mt-2 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
