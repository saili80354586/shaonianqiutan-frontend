export interface Player {
  id: string;
  userId: number;
  name: string;
  avatar: string;
  age: number;
  height?: number;
  weight?: number;
  position: string;
  preferredFoot?: string;
  foot: string;
  city: string;
  province: string;
  tags: string[];
  rating?: number;
  score?: number;
  potential: string;
  description?: string;
  phone?: string;
  normalizedX?: number;
  normalizedY?: number;
  hasReport?: boolean;
  type?: string;
  extra?: Record<string, unknown>;
}

export interface CityStats {
  name: string;
  count: number;
  positions: Record<string, number>;
  players: Player[];
  avgScore?: number;
  newPlayerCount30d?: number;
  reportCoverageRate?: number;
  heatLevel?: number;
  clubCount?: number;
  coachCount?: number;
  analystCount?: number;
  scoutCount?: number;
  playerCount?: number;
  // P2-14~P2-17 分布字段
  sizeDistribution?: Record<string, number>;
  licenseDistribution?: Record<string, number>;
  specialtyDistribution?: Record<string, number>;
  adoptionRate?: number;
}

export interface ProvinceStats {
  name: string;
  count: number;
  value: number;
  positions: Record<string, number>;
  cities: Record<string, CityStats>;
  players: Player[];
  avgScore?: number;
  newPlayerCount30d?: number;
  reportCoverageRate?: number;
  heatLevel?: number;
  clubCount?: number;
  coachCount?: number;
  analystCount?: number;
  scoutCount?: number;
  playerCount?: number;
  // P2-14~P2-17 分布字段
  sizeDistribution?: Record<string, number>;
  licenseDistribution?: Record<string, number>;
  specialtyDistribution?: Record<string, number>;
  adoptionRate?: number;
}

export type Level = 'country' | 'province' | 'city';
export type MapLayer = 'density' | 'potential' | 'freshness' | 'coverage';
export type EntityLayer = 'players' | 'clubs' | 'coaches' | 'analysts' | 'scouts' | 'all';
export type Position = '前锋' | '中场' | '后卫' | '门将';

export const POSITIONS: Position[] = ['前锋', '中场', '后卫', '门将'];
export const POSITION_ICONS: Record<Position, string> = {
  '前锋': '⚡',
  '中场': '🎯',
  '后卫': '🛡',
  '门将': '🧤',
};

export const LAYER_CONFIG: Record<MapLayer, { label: string; field: keyof ProvinceStats; colorStart: string; colorEnd: string }> = {
  density: { label: '球员密度', field: 'count', colorStart: 'rgba(57, 255, 20, 0.1)', colorEnd: '#39ff14' },
  potential: { label: '潜力评分', field: 'avgScore', colorStart: 'rgba(0, 212, 255, 0.1)', colorEnd: '#00d4ff' },
  freshness: { label: '新鲜度', field: 'newPlayerCount30d', colorStart: 'rgba(255, 107, 53, 0.1)', colorEnd: '#ff6b35' },
  coverage: { label: '报告覆盖', field: 'reportCoverageRate', colorStart: 'rgba(251, 191, 36, 0.1)', colorEnd: '#fbbf24' },
};

export const ENTITY_LAYER_CONFIG: Record<EntityLayer, { label: string; color: string; icon: string }> = {
  players: { label: '球员', color: '#39ff14', icon: 'Users' },
  clubs: { label: '俱乐部', color: '#00d4ff', icon: 'Building2' },
  coaches: { label: '教练', color: '#fbbf24', icon: 'UserCog' },
  analysts: { label: '分析师', color: '#a78bfa', icon: 'Microscope' },
  scouts: { label: '球探', color: '#f472b6', icon: 'Binoculars' },
  all: { label: '全部', color: '#94a3b8', icon: 'Layers' },
};

export const ENTITY_LAYER_LABELS: Record<EntityLayer, {
  entityName: string;
  countLabel: string;
  unitLabel: string;
  itemLabel: string;
  detailTitle: string;
  avgScoreLabel: string;
  showPositions: boolean;
  showAge: boolean;
}> = {
  players:   { entityName: '球员',   countLabel: '球员总数', unitLabel: '人', itemLabel: '球员', detailTitle: '球员详情', avgScoreLabel: '平均评分', showPositions: true,  showAge: true },
  clubs:     { entityName: '俱乐部', countLabel: '俱乐部数', unitLabel: '家', itemLabel: '俱乐部', detailTitle: '俱乐部详情', avgScoreLabel: '综合评分', showPositions: false, showAge: false },
  coaches:   { entityName: '教练',   countLabel: '教练总数', unitLabel: '人', itemLabel: '教练', detailTitle: '教练详情', avgScoreLabel: '平均资质', showPositions: false, showAge: false },
  analysts:  { entityName: '分析师', countLabel: '分析师数', unitLabel: '人', itemLabel: '分析师', detailTitle: '分析师详情', avgScoreLabel: '平均评分', showPositions: false, showAge: false },
  scouts:    { entityName: '球探',   countLabel: '球探总数', unitLabel: '人', itemLabel: '球探', detailTitle: '球探详情', avgScoreLabel: '平均评分', showPositions: false, showAge: false },
  all:       { entityName: '实体',   countLabel: '实体总数', unitLabel: '个', itemLabel: '实体', detailTitle: '实体详情', avgScoreLabel: '综合评分', showPositions: false, showAge: false },
};

export const positionNames: Record<string, string> = {
  '前锋': '前锋',
  ' midfield': '中场',
  '后卫': '后卫',
  '门将': '门将',
};

export function getLayerValue(stats: ProvinceStats | CityStats | undefined, layer: MapLayer): number {
  if (!stats) return 0;
  switch (layer) {
    case 'density':
      return stats.count || 0;
    case 'potential':
      return stats.avgScore || 0;
    case 'freshness':
      return stats.newPlayerCount30d || 0;
    case 'coverage':
      return stats.reportCoverageRate || 0;
    default:
      return stats.count || 0;
  }
}

export function calculateStatsByProvince(players: Player[]): Record<string, ProvinceStats> {
  const stats: Record<string, ProvinceStats> = {};

  players.forEach((player) => {
    if (!stats[player.province]) {
      stats[player.province] = {
        name: player.province,
        count: 0,
        value: 0,
        positions: {},
        cities: {},
        players: [],
      };
    }
    const ps = stats[player.province];
    ps.count += 1;
    ps.value += 1;
    ps.players.push(player);
    ps.positions[player.position] = (ps.positions[player.position] || 0) + 1;

    if (!ps.cities[player.city]) {
      ps.cities[player.city] = {
        name: player.city,
        count: 0,
        positions: {},
        players: [],
      };
    }
    const cs = ps.cities[player.city];
    cs.count += 1;
    cs.players.push(player);
    cs.positions[player.position] = (cs.positions[player.position] || 0) + 1;
  });

  return stats;
}

export function aggregatePositions(
  provinceStats: Record<string, ProvinceStats>,
  province?: string,
  city?: string
): { name: string; value: number }[] {
  const positions: Record<string, number> = {};
  if (province && city && provinceStats[province]?.cities[city]) {
    Object.entries(provinceStats[province].cities[city].positions).forEach(([pos, count]) => {
      positions[pos] = count;
    });
  } else if (province && provinceStats[province]) {
    Object.entries(provinceStats[province].positions).forEach(([pos, count]) => {
      positions[pos] = count;
    });
  } else {
    Object.values(provinceStats).forEach((p) => {
      Object.entries(p.positions).forEach(([pos, count]) => {
        positions[pos] = (positions[pos] || 0) + count;
      });
    });
  }
  return Object.entries(positions).map(([name, value]) => ({ name, value }));
}

export function getPanelStats(
  level: Level,
  provinceStats: Record<string, ProvinceStats>,
  province: string | null,
  city: string | null
): { totalPlayers: number; regions: number; avgAge: number; avgRating: number } {
  let totalPlayers = 0;
  let regions = 0;
  let totalAge = 0;
  let totalRating = 0;
  let playerCount = 0;

  if (level === 'country') {
    Object.values(provinceStats).forEach((p) => {
      totalPlayers += p.count;
      regions += 1;
      p.players.forEach((pl) => {
        totalAge += pl.age;
        totalRating += pl.rating ?? pl.score ?? 0;
        playerCount += 1;
      });
    });
  } else if (level === 'province' && province && provinceStats[province]) {
    const p = provinceStats[province];
    totalPlayers = p.count;
    regions = Object.keys(p.cities).length;
    p.players.forEach((pl) => {
      totalAge += pl.age;
      totalRating += pl.rating ?? pl.score ?? 0;
      playerCount += 1;
    });
  } else if (level === 'city' && province && city && provinceStats[province]?.cities[city]) {
    const c = provinceStats[province].cities[city];
    totalPlayers = c.count;
    regions = 1;
    c.players.forEach((pl) => {
      totalAge += pl.age;
      totalRating += pl.rating ?? pl.score ?? 0;
      playerCount += 1;
    });
  }

  return {
    totalPlayers,
    regions,
    avgAge: playerCount > 0 ? Math.round((totalAge / playerCount) * 10) / 10 : 0,
    avgRating: playerCount > 0 ? Math.round((totalRating / playerCount) * 10) / 10 : 0,
  };
}
