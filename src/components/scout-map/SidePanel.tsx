import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin, Users, ChevronLeft, Target, Crown, Lock, Download,
  Trophy, Flame, TrendingUp, Globe, Building2, X, Heart
} from 'lucide-react';
import type {
  ViewLevel, Player, ProvinceStats, CityStats, NationalStats,
  MembershipLevel, PositionStats, Club, DataType, RankingType
} from './types';
import { MEMBERSHIP_CONFIG, POSITIONS } from './types';
import { PositionStatsCards } from './PositionStatsCards';
import { PlayerCard } from './PlayerCard';
import { ClubCard, ClubList } from './ClubList';
import { ClubDetail } from './ClubList';
import { OverseasPlayers } from './OverseasPlayers';
import { RankingList, RankingTabs } from './RankingList';
import { HeatScoreBadge } from './HeatScoreBadge';
import { LikeButton } from './LikeButton';
import { MOCK_OVERSEAS_PLAYERS, MOCK_CLUBS } from './mockData';

interface SidePanelProps {
  viewLevel: ViewLevel;
  currentProvince: ProvinceStats | null;
  currentCity: CityStats | null;
  nationalStats: NationalStats | null;
  membershipLevel: MembershipLevel;
  cityPlayers: Player[];
  selectedPosition: keyof PositionStats | null;
  onSelectPosition: (position: keyof PositionStats | null) => void;
  onPlayerClick: (player: Player) => void;
  favorites: Set<string>;
  onFavoriteToggle: (playerId: string) => void;
  showMemberPrompt: boolean;
  onShowMemberPrompt: (show: boolean) => void;
  showUpgradePrompt: boolean;
  onShowUpgradePrompt: (show: boolean) => void;
  onExportData: () => void;
}

export function SidePanel({
  viewLevel,
  currentProvince,
  currentCity,
  nationalStats,
  membershipLevel,
  cityPlayers,
  selectedPosition,
  onSelectPosition,
  onPlayerClick,
  favorites,
  onFavoriteToggle,
  showMemberPrompt,
  onShowMemberPrompt,
  showUpgradePrompt,
  onShowUpgradePrompt,
  onExportData,
}: SidePanelProps) {
  const [dataType, setDataType] = useState<DataType>('all');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [rankingType, setRankingType] = useState<RankingType>('heat');
  const [likedPlayers, setLikedPlayers] = useState<Set<string>>(new Set());

  // 计算位置统计
  const positionStats = {
    forward: 0,
    midfielder: 0,
    defender: 0,
    goalkeeper: 0,
  };

  cityPlayers.forEach((player) => {
    const pos = player.position;
    if (!pos) return;
    if (['CF', 'ST', 'LW', 'RW'].includes(pos)) positionStats.forward++;
    else if (['CM', 'AM', 'DM'].includes(pos)) positionStats.midfielder++;
    else if (['CB', 'LB', 'RB'].includes(pos)) positionStats.defender++;
    else if (pos === 'GK') positionStats.goalkeeper++;
  });

  // 根据会员等级过滤可见球员
  const config = MEMBERSHIP_CONFIG[membershipLevel];
  const visiblePlayers = cityPlayers.slice(0, Math.max(1, Math.floor(cityPlayers.length * config.playerVisiblePercent)));

  // 按位置筛选
  const filteredByPosition = selectedPosition
    ? visiblePlayers.filter((p) => {
        const pos = p.position;
        if (!pos) return false;
        const positionMap: Record<string, string[]> = {
          forward: ['CF', 'ST', 'LW', 'RW'],
          midfielder: ['CM', 'AM', 'DM'],
          defender: ['CB', 'LB', 'RB'],
          goalkeeper: ['GK'],
        };
        return positionMap[selectedPosition]?.includes(pos);
      })
    : visiblePlayers;

  // 获取俱乐部列表
  const getClubs = (): Club[] => {
    if (viewLevel === 'city' && currentCity) {
      return currentCity.clubs.map((c) =>
        MOCK_CLUBS.find((club) => club.id === c.id)
      ).filter(Boolean) as Club[];
    }
    if (viewLevel === 'province' && currentProvince) {
      return currentProvince.clubs.map((c) =>
        MOCK_CLUBS.find((club) => club.id === c.id)
      ).filter(Boolean) as Club[];
    }
    return MOCK_CLUBS.slice(0, 10);
  };

  // Tab 配置
  const tabs: { key: DataType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: '全部', icon: <Users className="w-4 h-4" /> },
    { key: 'players', label: '球员', icon: <Trophy className="w-4 h-4" />, count: viewLevel === 'city' ? cityPlayers.length : viewLevel === 'province' ? currentProvince?.playerCount : nationalStats?.totalPlayers },
    { key: 'clubs', label: '俱乐部', icon: <Building2 className="w-4 h-4" />, count: viewLevel === 'city' ? currentCity?.clubCount : viewLevel === 'province' ? currentProvince?.clubCount : nationalStats?.totalClubs },
    { key: 'overseas', label: '海外', icon: <Globe className="w-4 h-4" />, count: nationalStats?.totalOverseasPlayers },
  ];

  // 点赞处理
  const handleLike = (playerId: string) => {
    if (membershipLevel === 'free') {
      return;
    }
    setLikedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  return (
    <>
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="lg:w-96 bg-slate-800/70 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-slate-700/50 flex flex-col shrink-0 shadow-2xl shadow-slate-900/50 h-[45vh] lg:h-auto"
      >
        {/* Tab 切换 */}
        <div className="p-3 border-b border-slate-700/50">
          <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDataType(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                  dataType === tab.key
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge
                    variant={dataType === tab.key ? 'secondary' : 'outline'}
                    className={`ml-1 text-xs ${dataType === tab.key ? 'bg-emerald-400/20 text-emerald-200 border-0' : 'border-slate-600 text-slate-500'}`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 面板标题 */}
        <div className="p-5 pb-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-100 text-lg tracking-tight">
                {dataType === 'all' && (viewLevel === 'national' ? '热门地区' : viewLevel === 'province' ? '城市排行' : '优秀球员')}
                {dataType === 'players' && (viewLevel === 'city' ? '球员列表' : '球员排行')}
                {dataType === 'clubs' && (viewLevel === 'city' ? '俱乐部' : '俱乐部排行')}
                {dataType === 'overseas' && '海外球员'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {viewLevel === 'national' && dataType === 'all' && '球员分布最多的省份'}
                {viewLevel === 'province' && dataType === 'all' && `${currentProvince?.name}内球员分布`}
                {viewLevel === 'city' && dataType === 'all' && `${currentCity?.name}的优秀小球员`}
                {dataType === 'players' && viewLevel === 'city' && `${currentCity?.name}的球员`}
                {dataType === 'clubs' && viewLevel === 'city' && `${currentCity?.name}的俱乐部`}
                {dataType === 'overseas' && '在海外踢球的中国球员'}
              </p>
            </div>
            {dataType === 'players' && viewLevel === 'city' && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0 font-medium px-3 py-1">
                TOP 3
              </Badge>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {/* 全部视图 */}
            {dataType === 'all' && viewLevel === 'national' && nationalStats && (
              <motion.div
                key="national-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {nationalStats.provinces
                  .sort((a, b) => b.playerCount - a.playerCount)
                  .slice(0, 10)
                  .map((p, i) => (
                    <motion.div
                      key={p.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                        i < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20' : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">{p.name}</h3>
                        <p className="text-sm text-slate-400 font-medium">{p.cityCount} 个城市</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">{p.playerCount}</p>
                        <p className="text-xs text-slate-500">名球员</p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {dataType === 'all' && viewLevel === 'province' && currentProvince && (
              <motion.div
                key="province-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {currentProvince.cities
                  .sort((a, b) => b.playerCount - a.playerCount)
                  .map((c, i) => (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                        i < 3 ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/20' : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">{c.name}</h3>
                        <p className="text-sm text-slate-400 font-medium">{currentProvince.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">{c.playerCount}</p>
                        <p className="text-xs text-slate-500">名球员</p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {dataType === 'all' && viewLevel === 'city' && currentCity && (
              <motion.div
                key="city-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* 位置统计卡片 */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-lg">
                  <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    位置分布
                    {selectedPosition && (
                      <Badge
                        variant="outline"
                        className="ml-auto cursor-pointer hover:bg-slate-700/50 rounded-lg border-slate-600 text-slate-300"
                        onClick={() => onSelectPosition(null)}
                      >
                        清除筛选 <X className="w-3 h-3 ml-1" />
                      </Badge>
                    )}
                  </h3>
                  <PositionStatsCards
                    stats={positionStats}
                    selectedPosition={selectedPosition}
                    onSelectPosition={onSelectPosition}
                  />
                </div>

                {/* 球员列表 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-semibold text-slate-100">
                      球员列表
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({filteredByPosition.length}/{cityPlayers.length})
                      </span>
                    </h3>
                    {membershipLevel === 'vip' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                        onClick={onExportData}
                      >
                        <Download className="w-4 h-4" />
                        导出
                      </Button>
                    )}
                  </div>

                  {filteredByPosition.map((p, i) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      index={i}
                      isMember={membershipLevel !== 'free'}
                      isFavorite={favorites.has(p.id)}
                      onFavoriteToggle={onFavoriteToggle}
                      onClick={onPlayerClick}
                    />
                  ))}

                  {/* 会员升级提示 */}
                  {membershipLevel !== 'vip' && cityPlayers.length > visiblePlayers.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/30 shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-100">
                            还有 {cityPlayers.length - visiblePlayers.length} 名球员
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            升级会员查看全部球员
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 border-0"
                          onClick={() => onShowUpgradePrompt(true)}
                        >
                          升级
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 球员视图 */}
            {dataType === 'players' && viewLevel !== 'city' && (
              <motion.div
                key="players"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* 排行榜 Tab 切换 */}
                <RankingTabs activeTab={rankingType} onTabChange={setRankingType} />

                {/* 排行榜列表 */}
                <RankingList
                  players={cityPlayers}
                  rankingType={rankingType}
                  maxDisplay={10}
                  onPlayerClick={onPlayerClick}
                />

                {/* 点赞提示 */}
                {membershipLevel === 'free' && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-slate-400 flex-1">
                        登录后可点赞喜欢的球员
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        onClick={() => {}}
                      >
                        登录
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {dataType === 'players' && viewLevel === 'city' && (
              <motion.div
                key="players-city"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* 位置统计 */}
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  <h3 className="font-semibold text-slate-100 text-sm mb-3">位置分布</h3>
                  <PositionStatsCards
                    stats={positionStats}
                    selectedPosition={selectedPosition}
                    onSelectPosition={onSelectPosition}
                  />
                </div>

                {/* 球员列表 */}
                <div className="space-y-3">
                  {filteredByPosition.map((p, i) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      index={i}
                      isMember={membershipLevel !== 'free'}
                      isFavorite={favorites.has(p.id)}
                      onFavoriteToggle={onFavoriteToggle}
                      onClick={onPlayerClick}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* 俱乐部视图 */}
            {dataType === 'clubs' && (
              <motion.div
                key="clubs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <ClubList
                  clubs={getClubs()}
                  viewLevel={viewLevel}
                  currentProvince={currentProvince?.name}
                  onClubClick={setSelectedClub}
                />
              </motion.div>
            )}

            {/* 海外球员视图 */}
            {dataType === 'overseas' && nationalStats && (
              <motion.div
                key="overseas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <OverseasPlayers
                  overseasPlayers={MOCK_OVERSEAS_PLAYERS}
                  overseasStats={nationalStats.overseasStats}
                  onPlayerClick={onPlayerClick}
                  membershipLevel={membershipLevel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 俱乐部详情弹窗 */}
      {selectedClub && (
        <ClubDetail club={selectedClub} onClose={() => setSelectedClub(null)} />
      )}
    </>
  );
}
