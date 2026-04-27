import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Star, Heart, Eye, ChevronDown, Search, Flag } from 'lucide-react';
import type { Player, OverseasStats, CountryStats } from './types';
import { OVERSEAS_COUNTRIES } from './types';
import { POSITIONS } from './types';

interface OverseasPlayersProps {
  overseasPlayers: Player[];
  overseasStats: OverseasStats;
  onPlayerClick?: (player: Player) => void;
  membershipLevel?: 'free' | 'member' | 'vip';
}

export function OverseasPlayers({
  overseasPlayers,
  overseasStats,
  onPlayerClick,
  membershipLevel = 'free',
}: OverseasPlayersProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // 按国家分组
  const playersByCountry = useMemo(() => {
    const grouped: Record<string, Player[]> = {};
    overseasPlayers.forEach((player) => {
      if (player.location.type === 'overseas') {
        const country = (player.location as any).country;
        if (!grouped[country]) grouped[country] = [];
        grouped[country].push(player);
      }
    });
    return grouped;
  }, [overseasPlayers]);

  // 筛选后的球员
  const filteredPlayers = useMemo(() => {
    let result = overseasPlayers;
    if (selectedCountry) {
      result = result.filter(
        (p) => p.location.type === 'overseas' && (p.location as any).country === selectedCountry
      );
    }
    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.location as any).city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [overseasPlayers, selectedCountry, searchQuery]);

  // 获取国家信息
  const getCountryInfo = (countryName: string) => {
    return OVERSEAS_COUNTRIES.find((c) => c.name === countryName) || {
      name: countryName,
      code: '',
      flag: '🏳️',
    };
  };

  return (
    <div className="space-y-4">
      {/* 头部统计 */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100">海外球员</h3>
            <p className="text-sm text-slate-400">在海外踢球的中国小球员</p>
          </div>
          <Badge className="ml-auto bg-blue-500/20 text-blue-400 border-0 font-bold">
            {overseasStats.totalPlayers} 人
          </Badge>
        </div>

        {/* 国家快捷筛选 */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedCountry === null ? 'default' : 'outline'}
            className={`rounded-lg text-xs h-7 ${
              selectedCountry === null
                ? 'bg-blue-500 hover:bg-blue-600 text-white border-0'
                : 'border-slate-600 text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setSelectedCountry(null)}
          >
            全部
          </Button>
          {overseasStats.byCountry.slice(0, 8).map((stat) => {
            const info = getCountryInfo(stat.country);
            return (
              <Button
                key={stat.countryCode}
                size="sm"
                variant={selectedCountry === stat.country ? 'default' : 'outline'}
                className={`rounded-lg text-xs h-7 ${
                  selectedCountry === stat.country
                    ? 'bg-blue-500 hover:bg-blue-600 text-white border-0'
                    : 'border-slate-600 text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setSelectedCountry(stat.country)}
              >
                {info.flag} {stat.country} ({stat.playerCount})
              </Button>
            );
          })}
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索球员姓名或城市..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* 球员列表 */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {filteredPlayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">暂无海外球员</p>
              <p className="text-slate-500 text-sm mt-1">该国家/地区暂无注册球员</p>
            </motion.div>
          ) : (
            filteredPlayers.map((player, i) => {
              const location = player.location as any;
              const countryInfo = getCountryInfo(location.country);
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onPlayerClick?.(player)}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-blue-500/30 hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  {/* 头像 */}
                  <div className="relative">
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      className="w-11 h-11 rounded-xl object-cover border-2 border-slate-700 group-hover:border-blue-500/50 transition-colors"
                    />
                    <span className="absolute -top-1 -right-1 text-sm">
                      {countryInfo.flag}
                    </span>
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                        {player.nickname}
                      </h4>
                      {player.score && (
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 shrink-0">
                          <Star className="w-3 h-3 mr-0.5 fill-amber-400" />
                          {player.score}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location.city}
                      </span>
                      {player.position && (
                        <>
                          <span>·</span>
                          <span>
                            {POSITIONS.find((p) => p.value === player.position)?.label || player.position}
                          </span>
                        </>
                      )}
                      {player.age && (
                        <>
                          <span>·</span>
                          <span>{player.age}岁</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 热度 */}
                  {player.heatScore !== undefined && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {player.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {player.viewCount || 0}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* 底部提示 */}
      <p className="text-center text-xs text-slate-500 pt-2">
        登录后可查看更多海外球员详情
      </p>
    </div>
  );
}

// 国家选择器组件
interface CountrySelectorProps {
  stats: CountryStats[];
  selectedCountry: string | null;
  onSelect: (country: string | null) => void;
}

export function CountrySelector({ stats, selectedCountry, onSelect }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCountryInfo = (countryName: string) => {
    return OVERSEAS_COUNTRIES.find((c) => c.name === countryName) || {
      name: countryName,
      code: '',
      flag: '🏳️',
    };
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              {getCountryInfo(selectedCountry).flag}
              {selectedCountry}
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              选择国家
            </>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            <button
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2 ${
                selectedCountry === null ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
              }`}
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              <Globe className="w-4 h-4" />
              全部国家
            </button>
            {stats.map((stat) => {
              const info = getCountryInfo(stat.country);
              return (
                <button
                  key={stat.countryCode}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2 ${
                    selectedCountry === stat.country ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                  }`}
                  onClick={() => {
                    onSelect(stat.country);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-lg">{info.flag}</span>
                  <span className="flex-1">{stat.country}</span>
                  <span className="text-xs text-slate-500">{stat.playerCount}人</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
