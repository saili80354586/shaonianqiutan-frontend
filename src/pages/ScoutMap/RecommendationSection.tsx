import React, { useEffect, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import { LazyImage } from '../../components';
import { scoutMapApi } from '../../services/api';
import type { Player } from './data';

interface RecommendPlayer {
  id: number;
  name: string;
  avatar: string;
  position: string;
  age: number;
  city: string;
  province: string;
  score: number;
  potential: string;
  tags: string[];
  reason: string;
}

interface Props {
  onSelectPlayer: (player: Player) => void;
}

const RecommendationSection: React.FC<Props> = ({ onSelectPlayer }) => {
  const [players, setPlayers] = useState<RecommendPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = () => {
    setLoading(true);
    scoutMapApi
      .getRecommendations()
      .then((res) => {
        if (res.data?.success) {
          setPlayers(res.data.data?.players || []);
        }
      })
      .catch(() => {
        // 静默失败，不展示错误
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    queueMicrotask(fetchRecommendations);
  }, []);

  if (players.length === 0 && !loading) return null;

  const toPlayer = (p: RecommendPlayer): Player => ({
    id: String(p.id),
    userId: p.id,
    name: p.name,
    avatar: p.avatar,
    age: p.age,
    position: p.position,
    preferredFoot: '右脚',
    foot: '右脚',
    city: p.city,
    province: p.province,
    tags: p.tags,
    score: p.score,
    potential: p.potential,
    hasReport: false,
  });

  return (
    <div data-testid="recommendation-section" className="mt-6 pt-6 border-t border-[#2d3748]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#fbbf24]" />
          <h4 className="text-sm font-semibold text-[#f8fafc]">猜你感兴趣</h4>
        </div>
        {!loading && (
          <button
            onClick={fetchRecommendations}
            className="text-xs text-[#94a3b8] hover:text-[#39ff14] transition-colors"
          >
            换一批
          </button>
        )}
      </div>

      {loading && players.length === 0 ? (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[140px] h-[88px] bg-[#1a2332] rounded-xl border border-[#2d3748] animate-pulse" />
          ))}
        </div>
      ) : (
        <div data-testid="recommendation-cards" className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:-mx-0 lg:px-0 scrollbar-thin scrollbar-thumb-[#2d3748]">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPlayer(toPlayer(p))}
              className="min-w-[160px] max-w-[180px] flex-shrink-0 text-left bg-[#1a2332] border border-[#2d3748] rounded-xl p-3 hover:border-[#39ff14]/40 hover:bg-[#1f2937] transition-all group"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#2d3748] overflow-hidden flex-shrink-0">
                  {p.avatar ? (
                    <LazyImage src={p.avatar} alt={p.name} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#64748b]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#f8fafc] truncate">{p.name}</p>
                  <p className="text-xs text-[#94a3b8]">{p.position} · {p.age}岁</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#39ff14]">{p.score.toFixed(1)}分</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#39ff14]/10 text-[#39ff14] rounded-full truncate max-w-[80px]">
                  {p.reason}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
