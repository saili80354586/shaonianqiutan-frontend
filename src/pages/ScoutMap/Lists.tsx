import React, { useState } from 'react';
import type { ProvinceStats, CityStats, Player, EntityLayer } from './data';
import { ENTITY_LAYER_LABELS } from './data';
import { ProvinceItem, CityItem, PlayerItem, BackButton, ListHeader, EmptyState } from './ListItems';

// ==================== 全国视图列表 ====================
interface CountryListProps {
  stats: Record<string, ProvinceStats>;
  onSelectProvince: (name: string) => void;
  entityLayer?: EntityLayer;
}

export const CountryList: React.FC<CountryListProps> = ({ stats, onSelectProvince, entityLayer = 'players' }) => {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  const sortedProvinces = entries.slice(0, expanded ? undefined : 5);
  const labels = ENTITY_LAYER_LABELS[entityLayer];

  if (sortedProvinces.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <ListHeader title={expanded ? '省份排行' : '省份排行 TOP5'} count={`${entries.length} 个省份`} />
      <div className="flex flex-col gap-2.5">
        {sortedProvinces.map(([name, s], index) => (
          <div key={name} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
            <ProvinceItem
              name={name}
              stats={s}
              index={index}
              onClick={() => onSelectProvince(name)}
              entityLayer={entityLayer}
            />
          </div>
        ))}
      </div>
      {entries.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-3 w-full py-2 text-xs text-[#94a3b8] hover:text-[#f8fafc] bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] rounded-lg transition-colors">
          {expanded ? '收起' : `查看全部 ${entries.length} 个省份`}
        </button>
      )}
    </>
  );
};

// ==================== 省份视图列表 ====================
interface ProvinceListProps {
  provinceName: string;
  stats: ProvinceStats;
  onBack: () => void;
  onSelectCity: (name: string) => void;
  entityLayer?: EntityLayer;
}

export const ProvinceList: React.FC<ProvinceListProps> = ({
  provinceName,
  stats,
  onBack,
  onSelectCity,
  entityLayer = 'players'
}) => {
  const [expanded, setExpanded] = useState(false);
  const sortedCities = Object.entries(stats.cities).sort((a, b) => b[1].count - a[1].count);
  const displayCities = sortedCities.slice(0, expanded ? undefined : 5);

  if (sortedCities.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <ListHeader title={`${provinceName} 城市列表`} count={`${sortedCities.length} 个城市`} />
      <BackButton label="返回全国视图" onClick={onBack} />
      <div className="flex flex-col gap-2.5">
        {displayCities.map(([name, cityStats], index) => (
          <div key={name} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
            <CityItem
              name={name}
              count={cityStats.count}
              playerCount={cityStats.players.length}
              onClick={() => onSelectCity(name)}
              entityLayer={entityLayer}
            />
          </div>
        ))}
      </div>
      {sortedCities.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-3 w-full py-2 text-xs text-[#94a3b8] hover:text-[#f8fafc] bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] rounded-lg transition-colors">
          {expanded ? '收起' : `查看全部 ${sortedCities.length} 个城市`}
        </button>
      )}
    </>
  );
};

// ==================== 城市视图列表 ====================
interface CityListProps {
  provinceName: string;
  cityName: string;
  stats: CityStats;
  onBack: () => void;
  onSelectPlayer: (player: Player) => void;
  onAddPlayerToCompare?: (player: Player) => void;
  comparePlayerIds?: number[];
  entityLayer?: EntityLayer;
}

export const CityList: React.FC<CityListProps> = ({
  provinceName,
  cityName,
  stats,
  onBack,
  onSelectPlayer,
  onAddPlayerToCompare,
  comparePlayerIds,
  entityLayer = 'players'
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayPlayers = stats.players.slice(0, expanded ? undefined : 5);
  const labels = ENTITY_LAYER_LABELS[entityLayer];

  if (stats.players.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <ListHeader title={`${cityName} ${labels.entityName}列表`} count={`${stats.players.length} ${labels.unitLabel}`} />
      <BackButton label={`返回${provinceName}`} onClick={onBack} />
      <div className="flex flex-col gap-3">
        {displayPlayers.map((player, index) => (
          <div key={player.userId} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
            <PlayerItem
              player={player}
              onClick={() => onSelectPlayer(player)}
              onAddToCompare={onAddPlayerToCompare ? () => onAddPlayerToCompare(player) : undefined}
              isInCompare={comparePlayerIds?.includes(player.userId)}
              entityLayer={entityLayer}
            />
          </div>
        ))}
      </div>
      {stats.players.length > 5 && (
        <button onClick={() => setExpanded((v) => !v)} className="mt-3 w-full py-2 text-xs text-[#94a3b8] hover:text-[#f8fafc] bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] rounded-lg transition-colors">
          {expanded ? '收起' : `查看全部 ${stats.players.length} ${labels.unitLabel}${labels.entityName}`}
        </button>
      )}
    </>
  );
};
