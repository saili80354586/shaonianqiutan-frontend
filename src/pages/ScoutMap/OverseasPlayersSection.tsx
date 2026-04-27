import React, { useEffect, useState } from 'react';
import { Globe, MapPin, User, Star, ChevronRight } from 'lucide-react';
import { LazyImage } from '../../components';
import { scoutMapApi } from '../../services/api';
import type { Player } from './data';

interface OverseasPlayer {
  id: number;
  name: string;
  avatar: string;
  country: string;
  city: string;
  position: string;
  age: number;
  score: number;
  potential: string;
  tags: string[];
}

interface Props {
  onSelectPlayer: (player: Player) => void;
}

const OverseasPlayersSection: React.FC<Props> = ({ onSelectPlayer }) => {
  const [players, setPlayers] = useState<OverseasPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) setLoading(true); });
    scoutMapApi.getOverseasPlayers()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          setPlayers(res.data.data?.players || []);
        }
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const toPlayer = (p: OverseasPlayer): Player => ({
    id: String(p.id),
    userId: p.id,
    name: p.name,
    avatar: p.avatar,
    age: p.age,
    position: p.position,
    preferredFoot: '右脚',
    foot: '右脚',
    city: p.city,
    province: p.country,
    tags: p.tags,
    score: p.score,
    potential: p.potential,
    hasReport: false,
  });

  const displayPlayers = expanded ? players : players.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] flex items-center gap-3 mb-2">
            <Globe className="w-7 h-7 text-[#00d4ff]" />
            海外球员专区
          </h2>
          <p className="text-[#94a3b8]">探索全球青少年足球新星</p>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full text-sm">
          {players.length} 位球员
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#111827] rounded-xl border border-[#2d3748] animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 text-[#64748b] bg-[#111827]/50 rounded-2xl border border-[#2d3748]">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无海外球员数据</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {displayPlayers.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(toPlayer(p))}
                className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 flex gap-4 cursor-pointer hover:border-[#fbbf24] hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-[#1a2332] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {p.avatar ? (
                    <LazyImage src={p.avatar} alt={p.name} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                  ) : (
                    <User className="w-6 h-6 text-[#64748b]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#f8fafc] truncate">{p.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded">
                      {p.potential}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.country}</span>
                    <span>{p.position}</span>
                    <span>{p.age}岁</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-[#fbbf24]" />
                    <span className="text-sm font-medium text-[#f8fafc]">{p.score}</span>
                    <div className="flex gap-1 ml-2">
                      {p.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#1a2332] text-[#94a3b8] rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {players.length > 8 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] text-[#f8fafc] rounded-lg transition-colors"
              >
                <span>{expanded ? '收起' : '查看更多海外球员'}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OverseasPlayersSection;
