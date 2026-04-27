import React, { useEffect, useState } from 'react';
import { X, Globe, MapPin, User, Star } from 'lucide-react';
import { scoutMapApi } from '../../services/api';

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
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: OverseasPlayer) => void;
}

const OverseasPlayersModal: React.FC<Props> = ({ isOpen, onClose, onSelectPlayer }) => {
  const [players, setPlayers] = useState<OverseasPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#111827] border border-[#2d3748] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2d3748]">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#fbbf24]" />
            <h3 className="text-lg font-semibold text-[#f8fafc]">海外球员专区</h3>
            <span className="text-xs px-2 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded-full">
              {players.length} 人
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1a2332] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#94a3b8]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-[#64748b]">
              <div className="w-6 h-6 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin mr-3" />
              加载中...
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 text-[#64748b]">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无海外球员数据</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {players.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p)}
                  className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4 flex gap-4 cursor-pointer hover:border-[#fbbf24] transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-[#2d3748] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
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
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.country} · {p.city}</span>
                      <span>{p.position}</span>
                      <span>{p.age}岁</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-[#fbbf24]" />
                      <span className="text-sm font-medium text-[#f8fafc]">{p.score}</span>
                      <div className="flex gap-1 ml-2">
                        {p.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#2d3748] text-[#94a3b8] rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverseasPlayersModal;
