import React, { useEffect, useState } from 'react';
import { Trophy, MapPin, Target, TrendingUp, X, ChevronRight } from 'lucide-react';
import { scoutMapApi } from '../../services/api';
import { Link } from 'react-router-dom';

interface MyRankData {
  player: {
    id: number;
    name: string;
    province: string;
    city: string;
    position: string;
    age: number;
    score: number;
  };
  ranks: {
    provinceRank: number;
    cityRank: number;
    positionRank: number;
  };
}

interface Props {
  isVisible?: boolean;
  onClose?: () => void;
  variant?: 'floating' | 'embedded';
}

const RankCard: React.FC<{ icon: React.ElementType; label: string; rank: number; totalLabel: string; color: string }> = ({
  icon: Icon,
  label,
  rank,
  totalLabel,
  color,
}) => (
  <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 flex items-center gap-4 hover:border-[#39ff14]/30 transition-all">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
      <Icon className="w-6 h-6" style={{ color }} />
    </div>
    <div className="flex-1">
      <div className="text-xs text-[#94a3b8] mb-0.5">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color }}>第 {rank} 名</span>
        <span className="text-xs text-[#64748b]">{totalLabel}</span>
      </div>
    </div>
  </div>
);

const PlayerRankView: React.FC<Props> = ({ isVisible = true, onClose, variant = 'floating' }) => {
  const [data, setData] = useState<MyRankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (variant === 'floating' && !isVisible) return;
    let mounted = true;
    queueMicrotask(() => { if (mounted) { setLoading(true); setError(null); } });
    scoutMapApi.getMyRank()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.error?.message || '获取排名失败');
        }
      })
      .catch((e) => { if (mounted) setError(e?.message || '网络错误'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [isVisible, variant]);

  const content = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-24 text-[#64748b]">
          <div className="w-5 h-5 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin mr-2" />
          加载中...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mb-4 p-3 bg-gradient-to-r from-[#39ff14]/10 to-transparent border border-[#39ff14]/20 rounded-lg">
            <div className="text-sm text-[#94a3b8] mb-1">综合评分</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#39ff14]" />
              <span className="text-3xl font-bold text-[#39ff14]">{data.player.score}</span>
              <span className="text-xs text-[#94a3b8]">潜力等级同龄对比</span>
            </div>
          </div>

          <div className="space-y-3">
            <RankCard icon={MapPin} label={`${data.player.province || '全省'}同龄排名`} rank={data.ranks.provinceRank || 1} totalLabel="按综合评分" color="#39ff14" />
            <RankCard icon={Target} label={`${data.player.city || '全市'}同龄排名`} rank={data.ranks.cityRank || 1} totalLabel="按综合评分" color="#00d4ff" />
            <RankCard icon={Trophy} label={`全国${data.player.position || ''}同龄排名`} rank={data.ranks.positionRank || 1} totalLabel="同位置对比" color="#fbbf24" />
          </div>

          {variant === 'embedded' && (
            <div className="mt-4">
              <Link to="/user-dashboard" className="inline-flex items-center gap-1 text-sm text-[#39ff14] hover:underline">
                查看完整成长档案 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {variant === 'floating' && (
            <div className="mt-4 pt-4 border-t border-[#2d3748]">
              <p className="text-xs text-[#64748b] leading-relaxed">
                * 排名基于平台当前活跃球员的综合评分数据，每日更新。继续训练，提升你的排名！
              </p>
            </div>
          )}
        </>
      )}
    </>
  );

  if (variant === 'embedded') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-[#fbbf24]" />
          <h3 className="text-xl font-bold text-[#f8fafc]">我的排名</h3>
        </div>
        {content}
      </div>
    );
  }

  if (!isVisible) return null;
  return (
    <div className="fixed top-20 right-4 z-40 w-80 bg-[#111827]/95 backdrop-blur-md border border-[#2d3748] rounded-2xl shadow-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#fbbf24]" />
          <h4 className="font-semibold text-[#f8fafc]">我的排名</h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-[#1a2332] rounded-lg transition-colors">
            <X className="w-4 h-4 text-[#94a3b8]" />
          </button>
        )}
      </div>
      {content}
    </div>
  );
};

export default PlayerRankView;
