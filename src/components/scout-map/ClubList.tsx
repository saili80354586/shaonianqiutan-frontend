import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Shield, ChevronLeft, Star, Phone, CheckCircle } from 'lucide-react';
import type { Club } from './types';

interface ClubListProps {
  clubs: Club[];
  viewLevel: 'national' | 'province' | 'city';
  currentProvince?: string;
  onClubClick?: (club: Club) => void;
}

export function ClubList({ clubs, viewLevel, currentProvince, onClubClick }: ClubListProps) {
  if (clubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-400 font-medium">暂无俱乐部数据</p>
        <p className="text-slate-500 text-sm mt-1">该区域暂无俱乐部入驻</p>
      </div>
    );
  }

  // 按球员数量降序排列
  const sortedClubs = [...clubs].sort((a, b) => b.playerCount - a.playerCount);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {sortedClubs.map((club, i) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onClubClick?.(club)}
            className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer"
          >
            {/* 排名/Logo */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden ${
              i < 3
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20'
                : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
            }`}>
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold">{club.name.slice(0, 2)}</span>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                  {club.name}
                </h3>
                {club.isVerified && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {club.city}
                </span>
                {club.foundedYear && (
                  <span>成立于{club.foundedYear}年</span>
                )}
              </div>
            </div>

            {/* 统计数据 */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-400">{club.playerCount}</p>
                  <p className="text-xs text-slate-500">球员</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{club.teamCount}</p>
                  <p className="text-xs text-slate-500">梯队</p>
                </div>
              </div>
            </div>

            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all shrink-0" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// 俱乐部详情弹窗
interface ClubDetailProps {
  club: Club;
  onClose: () => void;
}

export function ClubDetail({ club, onClose }: ClubDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500`}>
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{club.name.slice(0, 2)}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">{club.name}</h2>
              {club.isVerified && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 gap-1">
                  <CheckCircle className="w-3 h-3" /> 已认证
                </Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {club.province} · {club.city}
            </p>
          </div>
        </div>

        {/* 描述 */}
        {club.description && (
          <p className="text-slate-300 text-sm mb-6">{club.description}</p>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-700/50 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-100">{club.playerCount}</p>
            <p className="text-xs text-slate-400">球员</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-100">{club.teamCount}</p>
            <p className="text-xs text-slate-400">梯队</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3 text-center">
            <Shield className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-100">{club.coachCount}</p>
            <p className="text-xs text-slate-400">教练</p>
          </div>
        </div>

        {/* 关注/联系 */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20">
            关注俱乐部
          </button>
          <button className="w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded-xl hover:bg-slate-600/50 transition-colors">
            <Phone className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 俱乐部卡片（简洁版）
interface ClubCardProps {
  club: Club;
  rank?: number;
  onClick?: () => void;
}

export function ClubCard({ club, rank, onClick }: ClubCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all cursor-pointer"
    >
      {rank !== undefined && rank < 3 && (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
          rank === 0 ? 'bg-amber-400' : rank === 1 ? 'bg-slate-400' : 'bg-amber-700'
        }`}>
          {rank + 1}
        </div>
      )}
      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
        {club.logo ? (
          <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-400">{club.name.slice(0, 2)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate group-hover:text-amber-400 transition-colors">
          {club.name}
        </p>
        <p className="text-xs text-slate-500">
          {club.playerCount}球员 · {club.teamCount}梯队
        </p>
      </div>
    </motion.div>
  );
}
