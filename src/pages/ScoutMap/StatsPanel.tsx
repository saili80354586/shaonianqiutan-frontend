import React from 'react';
import { POSITIONS, POSITION_ICONS } from './data';
import type { Position } from './data';

interface StatsPanelProps {
  title: string;
  players: number;
  regions: number | string;
  regionLabel: string;
  positions: Record<Position, number>;
  children?: React.ReactNode;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  title, 
  players, 
  regions, 
  regionLabel, 
  positions,
  children
}) => {
  return (
    <div className="w-full lg:w-[380px] bg-[#111827] lg:border-l border-[#2d3748] flex flex-col h-full">
      {/* 头部统计 */}
      <div className="p-4 lg:p-6 border-b border-[#2d3748] bg-gradient-to-r from-[rgba(57,255,20,0.05)] to-transparent">
        <h2 className="text-base lg:text-lg font-semibold text-[#f8fafc] mb-3 lg:mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>{title}</span>
        </h2>
        <div className="flex gap-6 lg:gap-8">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-[#39ff14] font-mono">{players}</div>
            <div className="text-xs text-[#64748b] mt-1">注册球员</div>
          </div>
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-[#39ff14] font-mono">{regions}</div>
            <div className="text-xs text-[#64748b] mt-1">{regionLabel}</div>
          </div>
        </div>
      </div>

      {/* 位置统计卡片 */}
      <div className="p-3 lg:p-5 border-b border-[#2d3748]">
        <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 lg:gap-3">
          {POSITIONS.map((pos) => (
            <div 
              key={pos}
              className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg lg:rounded-xl p-2 lg:p-4 text-center transition-all hover:border-[#39ff14] hover:-translate-y-0.5"
            >
              <div className="text-lg lg:text-2xl mb-0.5 lg:mb-1">{POSITION_ICONS[pos]}</div>
              <div className="text-base lg:text-xl font-bold text-[#39ff14] font-mono">{positions[pos]}</div>
              <div className="text-[10px] lg:text-xs text-[#64748b] mt-0.5 lg:mt-1">{pos}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 列表区域 - 由父组件填充 */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-5">
        {children}
      </div>
    </div>
  );
};

export default React.memo(StatsPanel);
