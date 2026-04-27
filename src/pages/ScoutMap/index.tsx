import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, Filter, Map, Layers, BarChart3, Globe, Trophy, Crosshair, GitCommit, Shield, Hand, AlertTriangle, Sparkles } from 'lucide-react';
import MapContainer from './MapContainer';
import Breadcrumb from './Breadcrumb';
import { CountryList, ProvinceList, CityList } from './Lists';
import type { Player, ProvinceStats, Level, MapLayer, EntityLayer } from './data';
import { getPanelStats, LAYER_CONFIG, ENTITY_LAYER_CONFIG, ENTITY_LAYER_LABELS } from './data';
import { scoutMapApi } from '../../services/api';
import PlayerDetailDrawer from './PlayerDetailDrawer';
import ComparisonBasket from './ComparisonBasket';
import { useScoutMapStore } from './store';
import DashboardSection from './DashboardSection';
import PlayerRankView from './PlayerRankView';
import RecommendationSection from './RecommendationSection';
import { useAuthStore } from '../../store/useAuthStore';
import SocialFeed from './SocialFeed';
import RisingStarSection from './RisingStarSection';
import OverseasPlayersSection from './OverseasPlayersSection';
import RecentActivitiesSection from './activities/RecentActivitiesSection';

interface RawProvince {
  provinceName?: string; name?: string; playerCount?: number; count?: number;
  avgScore?: number; newPlayerCount30d?: number; reportCoverageRate?: number; heatLevel?: number; clubCount?: number;
  coachCount?: number; analystCount?: number; scoutCount?: number;
  // P2-14~P2-17
  sizeDistribution?: Record<string, number>;
  licenseDistribution?: Record<string, number>;
  specialtyDistribution?: Record<string, number>;
  adoptionRate?: number;
}
interface RawCity {
  cityName?: string; name?: string; playerCount?: number; count?: number;
  avgScore?: number; newPlayerCount30d?: number; reportCoverageRate?: number; heatLevel?: number; clubCount?: number;
  coachCount?: number; analystCount?: number; scoutCount?: number;
  // P2-14~P2-17
  sizeDistribution?: Record<string, number>;
  licenseDistribution?: Record<string, number>;
  specialtyDistribution?: Record<string, number>;
  adoptionRate?: number;
}
interface RawEntity {
  id?: number; ID?: number; name?: string; Name?: string; avatar?: string; Avatar?: string;
  age?: number; Age?: number; position?: string; Position?: string; preferredFoot?: string; foot?: string; Foot?: string;
  tags?: string[]; Tags?: string[]; score?: number; Score?: number; potential?: string; Potential?: string;
  normalizedX?: number; NormalizedX?: number; normalizedY?: number; NormalizedY?: number;
  hasReport?: boolean; HasReport?: boolean;
  type?: string; Type?: string;
  extra?: Record<string, unknown>; Extra?: Record<string, unknown>;
}

const buildNationalStats = (provinces: RawProvince[]): Record<string, ProvinceStats> => {
  const stats: Record<string, ProvinceStats> = {};
  provinces.forEach((p) => {
    const name = p.provinceName || p.name || '';
    const count = Number(p.count ?? p.playerCount ?? 0);
    stats[name] = {
      name, count, value: count, positions: {}, cities: {}, players: [],
      avgScore: p.avgScore, newPlayerCount30d: p.newPlayerCount30d,
      reportCoverageRate: p.reportCoverageRate, heatLevel: p.heatLevel,
      clubCount: p.clubCount, coachCount: p.coachCount,
      analystCount: p.analystCount, scoutCount: p.scoutCount,
      playerCount: p.playerCount,
      sizeDistribution: p.sizeDistribution,
      licenseDistribution: p.licenseDistribution,
      specialtyDistribution: p.specialtyDistribution,
      adoptionRate: p.adoptionRate,
    };
  });
  return stats;
};

const mergeProvincialStats = (
  prev: Record<string, ProvinceStats>, provinceName: string, cities: RawCity[]
): Record<string, ProvinceStats> => {
  const citiesMap: Record<string, { name: string; count: number; positions: Record<string, number>; players: Player[]; avgScore?: number; newPlayerCount30d?: number; reportCoverageRate?: number; heatLevel?: number; clubCount?: number; coachCount?: number; analystCount?: number; scoutCount?: number; playerCount?: number; sizeDistribution?: Record<string, number>; licenseDistribution?: Record<string, number>; specialtyDistribution?: Record<string, number>; adoptionRate?: number; }> = {};
  cities.forEach((c) => {
    const name = c.cityName || c.name || '';
    const count = Number(c.count ?? c.playerCount ?? 0);
    citiesMap[name] = { name, count, positions: {}, players: [], avgScore: c.avgScore, newPlayerCount30d: c.newPlayerCount30d, reportCoverageRate: c.reportCoverageRate, heatLevel: c.heatLevel, clubCount: c.clubCount, coachCount: c.coachCount, analystCount: c.analystCount, scoutCount: c.scoutCount, playerCount: c.playerCount, sizeDistribution: c.sizeDistribution, licenseDistribution: c.licenseDistribution, specialtyDistribution: c.specialtyDistribution, adoptionRate: c.adoptionRate };
  });
  const prevProv = prev[provinceName] || { name: provinceName, count: 0, value: 0, positions: {}, cities: {}, players: [] };
  const totalCount = Object.values(citiesMap).reduce((sum, c) => sum + c.count, 0);
  return { ...prev, [provinceName]: { ...prevProv, count: prevProv.count || totalCount, value: prevProv.value || totalCount, cities: citiesMap } };
};

const mergeCityStats = (
  prev: Record<string, ProvinceStats>, provinceName: string, cityName: string, rawItems: RawEntity[]
): Record<string, ProvinceStats> => {
  const players: Player[] = rawItems.map((p) => ({
    id: String(p.id ?? p.ID), userId: Number(p.id ?? p.ID), name: p.name ?? p.Name ?? '', avatar: p.avatar ?? p.Avatar ?? '',
    age: Number(p.age ?? p.Age ?? 0), position: p.position ?? p.Position ?? '未知',
    preferredFoot: p.preferredFoot ?? p.foot ?? p.Foot ?? '右脚', foot: p.preferredFoot ?? p.foot ?? p.Foot ?? '右脚',
    city: cityName, province: provinceName, tags: p.tags ?? p.Tags ?? [],
    score: p.score ?? p.Score ?? 0, potential: p.potential ?? p.Potential ?? 'B',
    normalizedX: p.normalizedX ?? p.NormalizedX, normalizedY: p.normalizedY ?? p.NormalizedY,
    hasReport: p.hasReport ?? p.HasReport ?? false,
    type: p.type ?? p.Type ?? 'player',
    extra: p.extra ?? p.Extra,
  }));
  const positions: Record<string, number> = {};
  players.forEach((pl) => { positions[pl.position] = (positions[pl.position] || 0) + 1; });
  const prevProv = prev[provinceName] || { name: provinceName, count: 0, value: 0, positions: {}, cities: {}, players: [] };
  const prevCity = prevProv.cities[cityName] || { name: cityName, count: 0, positions: {}, players: [] };
  return { ...prev, [provinceName]: { ...prevProv, cities: { ...prevProv.cities, [cityName]: { ...prevCity, count: players.length, positions, players } } } };
};

interface FilterState {
  ageRange: [number, number];
  positions: string[];
  citySearch: string;
}
interface FilterBarProps {
  layer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  onFilterChange: (filters: FilterState) => void;
  compact?: boolean;
}
interface EntityLayerTabsProps {
  layer: EntityLayer;
  onChange: (layer: EntityLayer) => void;
}
const entityLayers: EntityLayer[] = ['players', 'clubs', 'coaches', 'analysts', 'scouts', 'all'];

const EntityLayerTabs: React.FC<EntityLayerTabsProps> = ({ layer, onChange }) => {
  return (
    <div data-testid="entity-layer-tabs" className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {entityLayers.map((l) => {
        const config = ENTITY_LAYER_CONFIG[l];
        const isActive = layer === l;
        return (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-all font-medium border whitespace-nowrap ${
              isActive
                ? 'bg-[#1a2332] text-[#f8fafc] border-[#2d3748] shadow-sm'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc] hover:bg-[#1a2332]/50'
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

const FilterBar: React.FC<FilterBarProps> = ({ layer, onLayerChange, onFilterChange, compact }) => {
  const [filters, setFilters] = useState<FilterState>({ ageRange: [6, 18], positions: [], citySearch: '' });
  const positions = ['前锋', '中场', '后卫', '门将'];
  const layers: MapLayer[] = ['density', 'potential', 'freshness', 'coverage'];
  const posIcons: Record<string, React.ReactNode> = {
    '前锋': <Crosshair className="w-3.5 h-3.5" />,
    '中场': <GitCommit className="w-3.5 h-3.5" />,
    '后卫': <Shield className="w-3.5 h-3.5" />,
    '门将': <Hand className="w-3.5 h-3.5" />,
  };
  const posColors: Record<string, string> = {
    '前锋': '#ef4444',
    '中场': '#3b82f6',
    '后卫': '#10b981',
    '门将': '#f59e0b',
  };
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  const hasActiveFilters = filters.positions.length > 0 || filters.citySearch || filters.ageRange[0] !== 6;
  return (
    <div className={`bg-[#1a1f2e] border-b border-[#2d3748] ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`flex flex-wrap items-center gap-3 ${compact ? '' : 'lg:gap-4'}`}>
        {/* 图层切换 — 胶囊 Tab */}
        <div className="flex items-center gap-1.5 bg-[#0a0e17] p-1 rounded-full border border-[#2d3748]">
          {layers.map((l) => (
            <button
              key={l}
              onClick={() => onLayerChange(l)}
              className={`px-3 py-1 text-xs rounded-full transition-all font-medium ${
                layer === l
                  ? 'bg-[#2d3748] text-[#f8fafc] shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
              title={LAYER_CONFIG[l].label}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: LAYER_CONFIG[l].colorEnd }} />
              {LAYER_CONFIG[l].label}
            </button>
          ))}
        </div>

        {/* 年龄 — 单滑块（最小年龄，最大固定18） */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            type="range"
            min={6}
            max={18}
            value={filters.ageRange[0]}
            onChange={(e) => updateFilter('ageRange', [Number(e.target.value), 18])}
            className="w-20 h-1 bg-[#2d3748] rounded-lg accent-[#39ff14]"
          />
          <span className="text-xs text-[#f8fafc] w-14">≥ {filters.ageRange[0]}岁</span>
        </div>

        {/* 位置 — 圆形图标按钮 */}
        <div className="flex items-center gap-1.5">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => {
                const np = filters.positions.includes(pos)
                  ? filters.positions.filter((p) => p !== pos)
                  : [...filters.positions, pos];
                updateFilter('positions', np);
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                filters.positions.includes(pos)
                  ? 'text-[#0a0e17] font-bold'
                  : 'bg-[#0a0e17] text-[#64748b] border border-[#2d3748] hover:text-[#94a3b8]'
              }`}
              style={filters.positions.includes(pos) ? { backgroundColor: posColors[pos] } : undefined}
              title={pos}
            >
              {posIcons[pos]}
            </button>
          ))}
        </div>

        {/* 城市搜索 + 快速清除 */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" />
          <div className="relative">
            <input
              type="text"
              value={filters.citySearch}
              onChange={(e) => updateFilter('citySearch', e.target.value)}
              placeholder="城市"
              className="px-2.5 py-1 pr-6 text-xs bg-[#0a0e17] border border-[#2d3748] rounded-lg text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14] w-20"
            />
            {filters.citySearch && (
              <button
                onClick={() => updateFilter('citySearch', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-[#64748b] hover:text-[#f8fafc] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              const d = { ageRange: [6, 18] as [number, number], positions: [] as string[], citySearch: '' };
              setFilters(d);
              onFilterChange(d);
            }}
            className="px-2 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
};

const HoverDetailCard: React.FC<{
  hoverRegion: { name: string; level: Level } | null;
  stats: Record<string, ProvinceStats>;
  province: string | null;
  city: string | null;
  panelStats: { totalPlayers: number; regions: number; avgAge: number; avgRating: number };
  entityLayer?: EntityLayer;
}> = ({ hoverRegion, stats, province, city, panelStats, entityLayer = 'players' }) => {
  const labels = ENTITY_LAYER_LABELS[entityLayer];
  const layerColor = ENTITY_LAYER_CONFIG[entityLayer].color;
  // 推断当前层级
  const currentLevel: Level = !province && !city ? 'country' : province && !city ? 'province' : 'city';
  const currentName = currentLevel === 'country' ? '全国' : currentLevel === 'province' ? (province || '') : (city || '');

  if (!hoverRegion) {
    // 默认状态：显示当前层级概览 + 位置分布（仅球员层）
    const allPlayers: Player[] = [];
    if (currentLevel === 'country') {
      Object.values(stats).forEach((p) => allPlayers.push(...p.players));
    } else if (currentLevel === 'province' && province && stats[province]) {
      allPlayers.push(...stats[province].players);
    } else if (currentLevel === 'city' && province && city && stats[province]?.cities[city]) {
      allPlayers.push(...stats[province].cities[city].players);
    }

    const positions: Record<string, number> = {};
    allPlayers.forEach((pl) => { positions[pl.position] = (positions[pl.position] || 0) + 1; });
    const totalPos = Object.values(positions).reduce((a, b) => a + b, 0);
    const posColors: Record<string, string> = { '前锋': '#ef4444', '中场': '#3b82f6', '后卫': '#10b981', '门将': '#f59e0b' };

    return (
      <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748] transition-opacity duration-300">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#f8fafc]">{currentName}概览</p>
          <span className="text-[10px] text-[#64748b]">悬停地图查看详情</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="text-[#94a3b8]">{labels.countLabel}：<span className="text-[#f8fafc] font-medium">{panelStats.totalPlayers}</span></div>
          <div className="text-[#94a3b8]">
            {currentLevel === 'country' ? '覆盖省份' : currentLevel === 'province' ? '覆盖城市' : '当前城市'}：
            <span className="text-[#f8fafc] font-medium">{panelStats.regions}</span>
          </div>
          <div className="text-[#94a3b8]">{labels.avgScoreLabel}：<span className="text-[#f8fafc] font-medium">{panelStats.avgRating > 0 ? panelStats.avgRating.toFixed(1) : '—'}</span></div>
          {labels.showAge && (
            <div className="text-[#94a3b8]">平均年龄：<span className="text-[#f8fafc] font-medium">{panelStats.avgAge > 0 ? panelStats.avgAge.toFixed(1) : '—'}</span></div>
          )}
        </div>
        {labels.showPositions && totalPos > 0 && (
          <div>
            <p className="text-[10px] text-[#64748b] mb-1">位置分布</p>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[#0a0e17]">
              {Object.entries(positions).map(([pos, cnt]) => (
                <div key={pos} style={{ width: `${(cnt / totalPos) * 100}%`, backgroundColor: posColors[pos] || '#94a3b8' }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {Object.entries(positions).map(([pos, cnt]) => (
                <span key={pos} className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: posColors[pos] || '#94a3b8' }} />
                  {pos} {cnt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hoverRegion.level === 'country') {
    const prov = stats[hoverRegion.name];
    if (!prov) {
      return (
        <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
          <p className="text-sm font-semibold text-[#f8fafc]">{hoverRegion.name}</p>
          <p className="text-xs text-[#64748b]">暂无数据</p>
        </div>
      );
    }
    const cityCount = Object.keys(prov.cities || {}).length;
    const positions = prov.positions || {};
    const totalPos = Object.values(positions).reduce((a, b) => a + b, 0);
    const posColors: Record<string, string> = { '前锋': '#ef4444', '中场': '#3b82f6', '后卫': '#10b981', '门将': '#f59e0b' };
    return (
      <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#f8fafc]">{prov.name}</p>
          <span className="text-xs px-2 py-0.5 bg-[#39ff14]/10 text-[#39ff14] rounded-full">省份</span>
        </div>
        {entityLayer === 'all' ? (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="text-[#94a3b8]">球员：<span className="text-[#39ff14] font-medium">{prov.playerCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">俱乐部：<span className="text-[#00d4ff] font-medium">{prov.clubCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">教练：<span className="text-[#fbbf24] font-medium">{prov.coachCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">分析师：<span className="text-[#a78bfa] font-medium">{prov.analystCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">球探：<span className="text-[#f472b6] font-medium">{prov.scoutCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">覆盖城市：<span className="text-[#f8fafc] font-medium">{cityCount}</span></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="text-[#94a3b8]">{labels.countLabel}：<span className="text-[#f8fafc] font-medium">{prov.count}</span></div>
            <div className="text-[#94a3b8]">覆盖城市：<span className="text-[#f8fafc] font-medium">{cityCount}</span></div>
            <div className="text-[#94a3b8]">入驻俱乐部：<span className="text-[#f8fafc] font-medium">{prov.clubCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">{labels.avgScoreLabel}：<span className="text-[#f8fafc] font-medium">{prov.avgScore ? prov.avgScore.toFixed(1) : '—'}</span></div>
            <div className="text-[#94a3b8]">月新增：<span className="text-[#f8fafc] font-medium">{prov.newPlayerCount30d ?? 0}</span></div>
          </div>
        )}
        {labels.showPositions && totalPos > 0 && (
          <div>
            <p className="text-xs text-[#64748b] mb-1">位置分布</p>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[#0a0e17]">
              {Object.entries(positions).map(([pos, cnt]) => (
                <div key={pos} style={{ width: `${(cnt / totalPos) * 100}%`, backgroundColor: posColors[pos] || '#94a3b8' }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(positions).map(([pos, cnt]) => (
                <span key={pos} className="text-[10px] text-[#94a3b8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: posColors[pos] || '#94a3b8' }} />
                  {pos} {cnt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (hoverRegion.level === 'province' && province) {
    const cityStats = stats[province]?.cities?.[hoverRegion.name];
    if (!cityStats) {
      return (
        <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
          <p className="text-sm font-semibold text-[#f8fafc]">{hoverRegion.name}</p>
          <p className="text-xs text-[#64748b]">暂无数据</p>
        </div>
      );
    }
    return (
      <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#f8fafc]">{cityStats.name}</p>
          <span className="text-xs px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] rounded-full">城市</span>
        </div>
        {entityLayer === 'all' ? (
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="text-[#94a3b8]">球员：<span className="text-[#39ff14] font-medium">{cityStats.playerCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">俱乐部：<span className="text-[#00d4ff] font-medium">{cityStats.clubCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">教练：<span className="text-[#fbbf24] font-medium">{cityStats.coachCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">分析师：<span className="text-[#a78bfa] font-medium">{cityStats.analystCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">球探：<span className="text-[#f472b6] font-medium">{cityStats.scoutCount ?? 0}</span></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="text-[#94a3b8]">{labels.countLabel}：<span className="text-[#f8fafc] font-medium">{cityStats.count}</span></div>
            <div className="text-[#94a3b8]">入驻俱乐部：<span className="text-[#f8fafc] font-medium">{cityStats.clubCount ?? 0}</span></div>
            <div className="text-[#94a3b8]">{labels.avgScoreLabel}：<span className="text-[#f8fafc] font-medium">{cityStats.avgScore ? cityStats.avgScore.toFixed(1) : '—'}</span></div>
            <div className="text-[#94a3b8]">月新增：<span className="text-[#f8fafc] font-medium">{cityStats.newPlayerCount30d ?? 0}</span></div>
            <div className="text-[#94a3b8]">报告覆盖：<span className="text-[#f8fafc] font-medium">{cityStats.reportCoverageRate ? cityStats.reportCoverageRate + '%' : '—'}</span></div>
          </div>
        )}
      </div>
    );
  }

  if (hoverRegion.level === 'city' && province && city) {
    const player = stats[province]?.cities?.[city]?.players.find((p) => p.name === hoverRegion.name);
    if (!player) {
      return (
        <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
          <p className="text-sm font-semibold text-[#f8fafc]">{hoverRegion.name || '聚合点'}</p>
          <p className="text-xs text-[#64748b]">{hoverRegion.name ? labels.entityName + '信息' : '多名' + labels.entityName + '聚集区域'}</p>
        </div>
      );
    }
    const extra = player.extra || {};
    const extraRows: { label: string; value: string }[] = [];
    switch (player.type) {
      case 'club':
        if (extra.address) extraRows.push({ label: '地址', value: String(extra.address) });
        if (extra.clubSize) extraRows.push({ label: '规模', value: String(extra.clubSize) });
        break;
      case 'coach':
        if (extra.licenseType) extraRows.push({ label: '执照', value: String(extra.licenseType) });
        if (extra.coachingYears) extraRows.push({ label: '执教年限', value: String(extra.coachingYears) + '年' });
        if (extra.currentClub) extraRows.push({ label: '当前俱乐部', value: String(extra.currentClub) });
        break;
      case 'analyst':
        if (extra.specialty) extraRows.push({ label: '擅长领域', value: String(extra.specialty) });
        if (extra.experience) extraRows.push({ label: '经验', value: String(extra.experience) + '年' });
        if (extra.rating) extraRows.push({ label: '评级', value: String(extra.rating) });
        break;
      case 'scout':
        if (extra.scoutingExperience) extraRows.push({ label: '球探经验', value: String(extra.scoutingExperience) + '年' });
        if (extra.currentOrganization) extraRows.push({ label: '所属机构', value: String(extra.currentOrganization) });
        if (extra.totalDiscovered) extraRows.push({ label: '发现球员', value: String(extra.totalDiscovered) + '人' });
        break;
    }
    return (
      <div className="mb-4 p-3 bg-[#1a2332] rounded-xl border border-[#2d3748]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#2d3748] flex items-center justify-center text-sm font-bold text-[#f8fafc]">
            {player.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f8fafc]">{player.name}</p>
            <p className="text-xs text-[#94a3b8]">
              {labels.showAge ? `${player.position} · ${player.age}岁 · ${player.foot}` : labels.entityName}
            </p>
          </div>
        </div>
        {extraRows.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 text-xs mb-2">
            {extraRows.map((r) => (
              <div key={r.label} className="text-[#94a3b8]">{r.label}：<span className="text-[#f8fafc]">{r.value}</span></div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94a3b8]">{labels.avgScoreLabel}</span>
          <span className="font-bold" style={{ color: layerColor }}>{player.score ?? player.rating ?? '—'}</span>
        </div>
      </div>
    );
  }

  return null;
};

const ScoutMap: React.FC = () => {
  const [level, setLevel] = useState<Level>('country');
  const [province, setProvince] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [provinceStats, setProvinceStats] = useState<Record<string, ProvinceStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMyRankOpen, setIsMyRankOpen] = useState(false);
  const [hoverRegion, setHoverRegion] = useState<{ name: string; level: Level } | null>(null);
  const [screen2Tab, setScreen2Tab] = useState<'insights' | 'activities'>('insights');
  const [truncatedInfo, setTruncatedInfo] = useState<{ truncated: boolean; totalCities: number } | null>(null);

  const currentRole = useAuthStore((s) => s.currentRole);
  const selectedLayer = useScoutMapStore((s) => s.selectedLayer);
  const setSelectedLayer = useScoutMapStore((s) => s.setSelectedLayer);
  const selectedEntityLayer = useScoutMapStore((s) => s.selectedEntityLayer);
  const setSelectedEntityLayer = useScoutMapStore((s) => s.setSelectedEntityLayer);
  const addPlayerToCompare = useScoutMapStore((s) => s.addPlayerToCompare);
  const setMapLevel = useScoutMapStore((s) => s.setMapLevel);
  const setCurrentProvince = useScoutMapStore((s) => s.setCurrentProvince);
  const setCurrentCity = useScoutMapStore((s) => s.setCurrentCity);
  const selectedPlayers = useScoutMapStore((s) => s.selectedPlayers);

  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentTranslateRef = useRef(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const updateTransform = () => {
      if (window.innerWidth < 1024) {
        const closedY = el.offsetHeight - 60;
        el.style.transform = isPanelOpen ? 'translateY(0px)' : `translateY(${closedY}px)`;
      } else {
        el.style.transform = '';
      }
    };
    updateTransform();
    window.addEventListener('resize', updateTransform);
    return () => window.removeEventListener('resize', updateTransform);
  }, [isPanelOpen]);

  const onPanelTouchStart = useCallback((e: React.TouchEvent) => {
    const el = panelRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    const closedY = el.offsetHeight - 60;
    currentTranslateRef.current = isPanelOpen ? 0 : closedY;
    el.style.transition = 'none';
  }, [isPanelOpen]);

  const onPanelTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const el = panelRef.current;
    if (!el) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    const closedY = el.offsetHeight - 60;
    let nextTranslate = currentTranslateRef.current + deltaY;
    nextTranslate = Math.max(0, Math.min(nextTranslate, closedY));
    el.style.transform = `translateY(${nextTranslate}px)`;
  }, []);

  const onPanelTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = panelRef.current;
    if (!el) return;
    el.style.transition = 'transform 300ms ease-out';
    const closedY = el.offsetHeight - 60;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = duration > 0 ? Math.abs(deltaY) / duration : 0;
    if (velocity > 0.4 || Math.abs(deltaY) > 40) {
      if (deltaY > 0) { setIsPanelOpen(false); el.style.transform = `translateY(${closedY}px)`; }
      else { setIsPanelOpen(true); el.style.transform = 'translateY(0px)'; }
    } else {
      if (isPanelOpen) { el.style.transform = 'translateY(0px)'; }
      else { el.style.transform = `translateY(${closedY}px)`; }
    }
  }, [isPanelOpen]);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) setLoading(true); });
    scoutMapApi.getNationalMapData({ layer: selectedEntityLayer })
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) setProvinceStats(buildNationalStats(res.data.data?.provinces || []));
        else setError(res.data?.error?.message || '加载失败');
      })
      .catch((e) => { if (mounted) setError(e?.message || '网络错误'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [selectedEntityLayer]);

  useEffect(() => {
    if (level === 'province' && province) {
      if (!provinceStats[province] || Object.keys(provinceStats[province].cities).length === 0) {
        queueMicrotask(() => setLoading(true));
        scoutMapApi.getProvincialMapData({ province, layer: selectedEntityLayer })
          .then((res) => {
            if (res.data?.success) {
              setProvinceStats((prev) => mergeProvincialStats(prev, province, res.data.data?.cities || []));
              setTruncatedInfo({
                truncated: res.data.data?.truncated ?? false,
                totalCities: res.data.data?.totalCities ?? 0,
              });
            }
          })
          .catch((e) => setError(e?.message || '网络错误'))
          .finally(() => setLoading(false));
      }
    } else if (level === 'city' && province && city) {
      if (!provinceStats[province]?.cities[city] || provinceStats[province].cities[city].players.length === 0) {
        queueMicrotask(() => setLoading(true));
        scoutMapApi.getCityMapData({ province, city, layer: selectedEntityLayer })
          .then((res) => {
            if (res.data?.success) {
              const items = res.data.data?.entities || res.data.data?.players || [];
              setProvinceStats((prev) => mergeCityStats(prev, province, city, items));
            }
          })
          .catch((e) => setError(e?.message || '网络错误'))
          .finally(() => setLoading(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, province, city, selectedEntityLayer]);

  const handleNavigate = useCallback((newLevel: Level, newProvince?: string, newCity?: string) => {
    setLevel(newLevel);
    setMapLevel(newLevel);
    if (newProvince !== undefined) setProvince(newProvince);
    if (newCity !== undefined) setCity(newCity);
    if (newLevel === 'country') { setProvince(null); setCity(null); setCurrentProvince(null); setCurrentCity(null); }
    else if (newLevel === 'province') { setCity(null); setCurrentProvince(newProvince || null); setCurrentCity(null); }
    else if (newLevel === 'city') { setCurrentProvince(newProvince || null); setCurrentCity(newCity || null); }
  }, [setMapLevel, setCurrentProvince, setCurrentCity]);

  const handleSelectProvince = useCallback((name: string) => { handleNavigate('province', name); }, [handleNavigate]);
  const handleSelectCity = useCallback((name: string) => { handleNavigate('city', province || undefined, name); }, [handleNavigate, province]);
  const handleSelectPlayer = useCallback((p: Player) => { setSelectedPlayer(p); setIsDrawerOpen(true); }, []);
  const handleAddPlayerToCompare = useCallback((p: Player) => { if (!addPlayerToCompare(p)) alert('对比篮最多只能添加 4 名球员'); }, [addPlayerToCompare]);
  const handleBrushSelectPlayers = useCallback((players: Player[]) => {
    let added = 0;
    players.forEach((p) => { if (addPlayerToCompare(p)) added++; });
    if (players.length > added) alert(`对比篮最多只能添加 4 名球员，已添加 ${added} 名`);
  }, [addPlayerToCompare]);

  const comparePlayerIds = useMemo(() => selectedPlayers.map((p) => p.userId), [selectedPlayers]);

  // 从 URL query 初始化筛选状态
  const getInitialFiltersFromURL = useCallback((): FilterState => {
    const params = new URLSearchParams(window.location.search);
    const minAge = parseInt(params.get('minAge') || '6', 10);
    const positions = params.get('positions')?.split(',').filter(Boolean) || [];
    const citySearch = params.get('city') || '';
    const layerParam = params.get('layer') as MapLayer | null;
    if (layerParam && ['density', 'potential', 'freshness', 'coverage'].includes(layerParam)) {
      setSelectedLayer(layerParam);
    }
    return {
      ageRange: [Math.max(6, Math.min(18, minAge)), 18],
      positions,
      citySearch,
    };
  }, [setSelectedLayer]);

  const [activeFilters, setActiveFilters] = useState<FilterState>(getInitialFiltersFromURL);

  // 筛选变化时同步到 URL（replaceState，不刷新页面）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // 图层
    if (selectedLayer !== 'density') {
      params.set('layer', selectedLayer);
    } else {
      params.delete('layer');
    }
    // 最小年龄
    if (activeFilters.ageRange[0] !== 6) {
      params.set('minAge', String(activeFilters.ageRange[0]));
    } else {
      params.delete('minAge');
    }
    // 位置
    if (activeFilters.positions.length > 0) {
      params.set('positions', activeFilters.positions.join(','));
    } else {
      params.delete('positions');
    }
    // 城市
    if (activeFilters.citySearch) {
      params.set('city', activeFilters.citySearch);
    } else {
      params.delete('city');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedLayer, activeFilters]);

  const filteredStats = useMemo(() => {
    const result: Record<string, ProvinceStats> = {};
    Object.entries(provinceStats).forEach(([provName, prov]) => {
      const filteredCities: Record<string, typeof prov.cities[string]> = {};
      Object.entries(prov.cities).forEach(([cityName, cityStats]) => {
        if (activeFilters.citySearch && !cityName.includes(activeFilters.citySearch)) return;
        const filteredPlayers = cityStats.players.filter((pl) => {
          const ageOk = pl.age >= activeFilters.ageRange[0] && pl.age <= activeFilters.ageRange[1];
          const posOk = activeFilters.positions.length === 0 || activeFilters.positions.includes(pl.position);
          return ageOk && posOk;
        });
        if (filteredPlayers.length > 0 || level !== 'city') {
          filteredCities[cityName] = { ...cityStats, players: filteredPlayers, count: filteredPlayers.length || cityStats.count };
        }
      });
      const provPlayers = Object.values(filteredCities).flatMap((c) => c.players);
      // 省级 API 返回的城市聚合数据 players 数组为空，此时用 count 字段求和
      const provCount = Object.values(filteredCities).reduce(
        (sum, c) => sum + (c.players.length > 0 ? c.players.length : (c.count || 0)),
        0
      );
      if (provCount > 0 || (level !== 'city' && Object.keys(filteredCities).length > 0) || (level === 'country' && prov.count > 0)) {
        const positions: Record<string, number> = {};
        provPlayers.forEach((pl) => { positions[pl.position] = (positions[pl.position] || 0) + 1; });
        // 国家层面 city 数据尚未加载，保留 provinceStats 的原始 count
        const effectiveCount = level === 'country' ? prov.count : provCount;
        result[provName] = { ...prov, cities: filteredCities, players: provPlayers, count: effectiveCount, positions };
      }
    });
    return result;
  }, [provinceStats, activeFilters, level]);

  const displayStats = useMemo(() => ({ map: provinceStats, list: filteredStats }), [provinceStats, filteredStats]);
  const panelStats = useMemo(() => getPanelStats(level, displayStats.list, province, city), [level, displayStats.list, province, city]);
  const panelTitle = useMemo(() => {
    const prefix = ENTITY_LAYER_LABELS[selectedEntityLayer].entityName;
    switch (level) { case 'country': return `全国${prefix}分布`; case 'province': return `${province || ''}${prefix}分布`; case 'city': return `${city || ''}${prefix}分布`; default: return '统计'; }
  }, [level, province, city, selectedEntityLayer]);
  const regionLabel = useMemo(() => {
    switch (level) { case 'country': return '覆盖省份'; case 'province': return '覆盖城市'; case 'city': return '当前城市'; default: return ''; }
  }, [level]);

  const renderListContent = () => {
    if (loading && Object.keys(provinceStats).length === 0) {
      return (
        <div className="space-y-3 p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#1a2332] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#1a2332] rounded w-32 animate-pulse" />
                  <div className="h-3 bg-[#1a2332] rounded w-24 animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-full bg-[#1a2332] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    switch (level) {
      case 'country': return <CountryList stats={displayStats.list} onSelectProvince={handleSelectProvince} entityLayer={selectedEntityLayer} />;
      case 'province':
        if (!province || !displayStats.list[province]) return null;
        return <ProvinceList provinceName={province} stats={displayStats.list[province]} onBack={() => handleNavigate('country')} onSelectCity={handleSelectCity} entityLayer={selectedEntityLayer} />;
      case 'city':
        if (!province || !city || !displayStats.list[province]?.cities[city]) return null;
        return <CityList provinceName={province} cityName={city} stats={displayStats.list[province].cities[city]} onBack={() => handleNavigate('province', province)} onSelectPlayer={handleSelectPlayer} onAddPlayerToCompare={handleAddPlayerToCompare} comparePlayerIds={comparePlayerIds} entityLayer={selectedEntityLayer} />;
      default: return null;
    }
  };

  return (
    <div className="bg-[#0a0e17] pt-[56px]">
      <section id="screen-map" className="relative h-[calc(100dvh-56px)] lg:h-[calc(100vh-56px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* 左侧地图区 */}
          <div className="flex-1 relative order-1 h-full flex flex-col">
            {/* 移动端：筛选器切换 */}
            <div className="md:hidden flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
              <button onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="flex items-center gap-2 text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                <Filter className="w-4 h-4" /><span className="text-sm">筛选</span>
              </button>
              <span className="text-xs text-[#64748b]">{LAYER_CONFIG[selectedLayer].label}</span>
            </div>
            <div className={`${isFilterExpanded ? 'block' : 'hidden'} md:block lg:hidden flex-shrink-0 px-4 pb-2 space-y-3`}>
              <EntityLayerTabs layer={selectedEntityLayer} onChange={setSelectedEntityLayer} />
              <FilterBar layer={selectedLayer} onLayerChange={setSelectedLayer} onFilterChange={setActiveFilters} compact />
            </div>
            {/* 面包屑 - 移动端/平板（在地图区域浮层） */}
            <div className="lg:hidden">
              <Breadcrumb level={level} province={province} city={city} onNavigate={handleNavigate} />
            </div>
            {/* 地图 */}
            <div className="flex-1 min-h-0 p-4 lg:p-6">
              <MapContainer
                level={level} province={province} city={city} stats={displayStats.map} layer={selectedLayer} entityLayer={selectedEntityLayer}
                onSelectProvince={handleSelectProvince} onSelectCity={handleSelectCity}
                onSelectPlayer={handleSelectPlayer} onBrushSelectPlayers={handleBrushSelectPlayers}
                onHoverRegion={setHoverRegion}
              />
            </div>
          </div>

          {/* 右侧面板 */}
          <div
            ref={panelRef}
            onTouchStart={onPanelTouchStart}
            onTouchMove={onPanelTouchMove}
            onTouchEnd={onPanelTouchEnd}
            className={`fixed inset-x-0 bottom-0 z-30 bg-[#111827] border-t border-[#2d3748] rounded-t-2xl transition-transform duration-300 ease-out lg:static lg:w-[420px] lg:border-l lg:border-t-0 lg:rounded-none lg:transform-none lg:!h-full lg:!max-h-full panel-glow`}
            style={{ maxHeight: '70vh', height: 'auto' }}
          >
            {/* 拖拽手柄 */}
            <div data-testid="mobile-panel-handle" className="lg:hidden flex items-center justify-center py-3 cursor-pointer select-none" onClick={() => setIsPanelOpen(!isPanelOpen)}>
              <div className="w-12 h-1 bg-[#2d3748] rounded-full" />
            </div>

            {/* 面板内容 */}
            <div className="overflow-y-auto lg:!h-full lg:!max-h-full lg:flex lg:flex-col" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              <div className="p-4 lg:p-5 lg:flex lg:flex-col lg:h-full">
                {/* 面包屑 - 桌面端 */}
                <div className="hidden lg:block mb-3 flex-shrink-0">
                  <Breadcrumb level={level} province={province} city={city} onNavigate={handleNavigate} className="relative w-fit" />
                </div>

                {/* 实体图层切换 - 桌面端 */}
                <div className="hidden lg:block mb-3 flex-shrink-0">
                  <EntityLayerTabs layer={selectedEntityLayer} onChange={setSelectedEntityLayer} />
                </div>

                {/* 筛选器 - 桌面端 */}
                <div className="hidden lg:block mb-4 flex-shrink-0">
                  <FilterBar layer={selectedLayer} onLayerChange={setSelectedLayer} onFilterChange={setActiveFilters} compact />
                </div>

                {/* 截断提示 */}
                {truncatedInfo?.truncated && (
                  <div className="mb-3 p-2.5 rounded-lg bg-[#1a2332]/80 border border-[#fbbf24]/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#fbbf24]/90 leading-relaxed">
                      该省份数据较多，仅展示前 50 个城市（共 {truncatedInfo.totalCities} 个）。切换单层可查看全部。
                    </div>
                  </div>
                )}

                {/* 概览卡 */}
                <div className="flex-shrink-0">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-gradient-to-b from-[#39ff14] to-[#00d4ff] rounded-full" />
                    {panelTitle}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="data-card p-3 rounded-xl border border-[#2d3748] cursor-pointer">
                      <p className="text-xs text-[#94a3b8] mb-1">{ENTITY_LAYER_LABELS[selectedEntityLayer].countLabel}</p>
                      <p className="text-xl font-bold stat-number" style={{ color: ENTITY_LAYER_CONFIG[selectedEntityLayer].color, fontFamily: 'var(--font-mono)' }}>{panelStats.totalPlayers}</p>
                    </div>
                    <div className="data-card p-3 rounded-xl border border-[#2d3748] cursor-pointer">
                      <p className="text-xs text-[#94a3b8] mb-1">{regionLabel}</p>
                      <p className="text-xl font-bold text-[#39ff14] stat-number" style={{ fontFamily: 'var(--font-mono)' }}>{panelStats.regions}</p>
                    </div>
                    <div className="data-card p-3 rounded-xl border border-[#2d3748] cursor-pointer">
                      <p className="text-xs text-[#94a3b8] mb-1">{ENTITY_LAYER_LABELS[selectedEntityLayer].avgScoreLabel}</p>
                      <p className="text-xl font-bold text-[#00d4ff] stat-number" style={{ fontFamily: 'var(--font-mono)' }}>{panelStats.avgRating > 0 ? panelStats.avgRating.toFixed(1) : '—'}</p>
                    </div>
                    {ENTITY_LAYER_LABELS[selectedEntityLayer].showAge && (
                      <div className="data-card p-3 rounded-xl border border-[#2d3748] cursor-pointer">
                        <p className="text-xs text-[#94a3b8] mb-1">平均年龄</p>
                        <p className="text-xl font-bold text-[#fbbf24] stat-number" style={{ fontFamily: 'var(--font-mono)' }}>{panelStats.avgAge > 0 ? panelStats.avgAge.toFixed(1) : '—'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 可滚动内容 */}
                <div className="lg:flex-1 lg:overflow-y-auto min-h-0">
                  <HoverDetailCard hoverRegion={hoverRegion} stats={displayStats.map} province={province} city={city} panelStats={panelStats} entityLayer={selectedEntityLayer} />
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                      {error}<button onClick={() => setError(null)} className="ml-2 underline">重试</button>
                    </div>
                  )}
                  {renderListContent()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 滚动指示器 */}
        <div className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 z-20 pointer-events-none">
          <span className="text-xs text-[#64748b]">向下滚动发现更多</span>
          <div className="w-5 h-8 border-2 border-[#64748b] rounded-full flex justify-center pt-1">
            <div className="w-1 h-2 bg-[#39ff14] rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      <section id="screen-data" className="min-h-screen bg-[#0a0e17] border-t border-[#2d3748]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center gap-2 mb-8 md:mb-10">
            <button
              onClick={() => setScreen2Tab('insights')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                screen2Tab === 'insights'
                  ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]'
                  : 'bg-[#1a2332] border-[#2d3748] text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              数据洞察
            </button>
            <button
              onClick={() => setScreen2Tab('activities')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                screen2Tab === 'activities'
                  ? 'bg-[#00d4ff]/10 border-[#00d4ff] text-[#00d4ff]'
                  : 'bg-[#1a2332] border-[#2d3748] text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              近期活动
            </button>
          </div>
          {screen2Tab === 'insights' && <DashboardSection variant="embedded" />}
          {screen2Tab === 'activities' && <RecentActivitiesSection />}
        </div>
      </section>

      <section id="screen-social" className="min-h-screen bg-[#0a0e17] border-t border-[#2d3748]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#f8fafc] flex items-center gap-3">
              <span className="w-1.5 h-8 bg-[#39ff14] rounded-full" />
              社交动态
            </h2>
            <p className="text-sm text-[#94a3b8] mt-1">发现球员、教练、俱乐部和球探的最新动态</p>
          </div>
          <SocialFeed />
        </div>
      </section>

      <section id="screen-rising-stars" className="min-h-screen bg-[#0a0e17] border-t border-[#2d3748] relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#fbbf24]/3 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f59e0b]/2 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 relative z-10">
          <RisingStarSection onSelectPlayer={handleSelectPlayer} />
        </div>
      </section>

      <section id="screen-discover" className="min-h-screen bg-[#0a0e17] border-t border-[#2d3748]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#f8fafc] flex items-center gap-3">
              <span className="w-1.5 h-8 bg-[#00d4ff] rounded-full" />
              发现更多
            </h2>
            <p className="text-sm text-[#94a3b8] mt-1">海外球员、个性化推荐与排名</p>
          </div>
          <OverseasPlayersSection />
          <div className="mt-10">
            <RecommendationSection onSelectPlayer={handleSelectPlayer} />
          </div>
          {currentRole === 'user' && (
            <div className="mt-10">
              <PlayerRankView variant="embedded" />
            </div>
          )}
        </div>
      </section>

      <PlayerDetailDrawer player={selectedPlayer} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <ComparisonBasket />
      {isDashboardOpen && <DashboardSection onClose={() => setIsDashboardOpen(false)} />}
      {isMyRankOpen && <PlayerRankView isVisible onClose={() => setIsMyRankOpen(false)} />}
    </div>
  );
};

export default ScoutMap;
