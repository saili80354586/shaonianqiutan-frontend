import React from 'react';
import { Star, MapPin, Calendar, User } from 'lucide-react';
import { LazyImage } from '../../../components';
import type { Player } from '../data';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-[#1a2332] rounded-xl p-4 cursor-pointer hover:bg-[#252d3d] transition-all border border-[#2d3748] hover:border-[#39ff14]/30"
    >
      <div className="flex items-start gap-4">
        {/* 头像 */}
        <div className="relative">
          <LazyImage
            src={player.avatar}
            alt={player.nickname}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#39ff14]"
            containerClassName="w-16 h-16"
            onError={() => {
              // fallback handled by LazyImage component
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-[#39ff14] text-[#0a0e17] text-xs font-bold px-1.5 py-0.5 rounded-full">
            {player.position}
          </div>
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[#f8fafc] font-semibold truncate">
              {player.nickname}
            </h4>
            {player.potential === 'A' && (
              <Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {player.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {player.age}岁
            </span>
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {player.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-[#39ff14]/10 text-[#39ff14] text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
