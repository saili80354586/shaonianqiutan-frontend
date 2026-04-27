import React from 'react';
import { Zap, Brain } from 'lucide-react';

type Theme = 'classic' | 'cyberpunk';

interface AbilityTagsProps {
  technicalTags?: string[];
  mentalTags?: string[];
  theme: Theme;
}

// 技术标签颜色映射
const technicalTagColors: Record<string, { bg: string; border: string; text: string }> = {
  '速度快': { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  '爆发力强': { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
  '盘带好': { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#eab308' },
  '传球准': { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
  '视野开阔': { bg: 'rgba(57,255,20,0.1)', border: 'rgba(57,255,20,0.3)', text: '#39ff14' },
  '射门强': { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', text: '#06b6d4' },
  '头球好': { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
  '防守稳': { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6' },
  '定位球专家': { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
  '一对一强': { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.3)', text: '#ec4899' },
  '体能充沛': { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
  '反应快': { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.3)', text: '#14b8a6' },
  '制空强': { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#6366f1' },
  '出球快': { bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.3)', text: '#0ea5e9' },
};

// 心智标签颜色映射
const mentalTagColors: Record<string, { bg: string; border: string; text: string }> = {
  '领导力': { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  '抗压能力': { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', text: '#34d399' },
  '团队协作': { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  '战术理解': { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa' },
  '专注度高': { bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.3)', text: '#2dd4bf' },
  '自信': { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', text: '#fb923c' },
  '冷静': { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', text: '#94a3b8' },
  '果断': { bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.3)', text: '#f472b6' },
  '学习快': { bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.3)', text: '#facc15' },
  '韧性强': { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
};

const AbilityTags: React.FC<AbilityTagsProps> = ({ technicalTags = [], mentalTags = [], theme }) => {
  const isCyberpunk = theme === 'cyberpunk';

  if (technicalTags.length === 0 && mentalTags.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
      isCyberpunk
        ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
        : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
    }`}>
      <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-accent" />
        </span>
        能力标签
      </h3>

      {/* 技术特点 */}
      {technicalTags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            技术特点
          </h4>
          <div className="flex flex-wrap gap-2">
            {technicalTags.map((tag, i) => {
              const colors = technicalTagColors[tag] || { 
                bg: 'rgba(57,255,20,0.08)', 
                border: 'rgba(57,255,20,0.25)', 
                text: '#39ff14' 
              };
              return (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 cursor-default"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    boxShadow: isCyberpunk ? `0 0 10px ${colors.border}` : 'none',
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 心智性格 */}
      {mentalTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            心智性格
          </h4>
          <div className="flex flex-wrap gap-2">
            {mentalTags.map((tag, i) => {
              const colors = mentalTagColors[tag] || { 
                bg: 'rgba(168,85,247,0.08)', 
                border: 'rgba(168,85,247,0.25)', 
                text: '#a855f7' 
              };
              return (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 cursor-default"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    boxShadow: isCyberpunk ? `0 0 10px ${colors.border}` : 'none',
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AbilityTags;
