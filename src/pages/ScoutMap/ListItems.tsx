import React from 'react';
import { MapPin, Building2, ArrowLeft, Plus, Check } from 'lucide-react';
import { LazyImage } from '../../components';
import type { Player, ProvinceStats, EntityLayer } from './data';
import { ENTITY_LAYER_LABELS, ENTITY_LAYER_CONFIG } from './data';

// ==================== 省份列表项 ====================
interface ProvinceItemProps {
  name: string;
  stats: ProvinceStats;
  index: number;
  onClick: () => void;
  entityLayer?: EntityLayer;
}

const RANK_COLORS = [
  'text-yellow-400',
  'text-slate-300',
  'text-amber-500',
];

const ProvinceItem: React.FC<ProvinceItemProps> = ({ name, stats, index, onClick, entityLayer = 'players' }) => {
  const isTop3 = index < 3;
  const labels = ENTITY_LAYER_LABELS[entityLayer];
  const layerColor = ENTITY_LAYER_CONFIG[entityLayer].color;

  return (
    <div
      data-testid="province-item"
      onClick={onClick}
      className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg lg:rounded-xl px-3 lg:px-5 py-3 lg:py-4 flex justify-between items-center cursor-pointer transition-all hover:border-[var(--hover-color)] hover:bg-[var(--hover-bg)] hover:translate-x-1 group"
      style={{ '--hover-color': layerColor, '--hover-bg': layerColor + '0D' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[var(--rank-from)] to-[var(--rank-to)] rounded-lg flex items-center justify-center text-base lg:text-xl flex-shrink-0"
          style={{ '--rank-from': layerColor + '33', '--rank-to': layerColor + '0D' } as React.CSSProperties}
        >
          {isTop3 ? (
            <span className={`text-base lg:text-lg font-bold ${RANK_COLORS[index]}`}>{index + 1}</span>
          ) : (
            <MapPin className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: layerColor }} />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[#f8fafc] text-sm lg:text-base truncate">{name}</div>
          <div className="text-[10px] lg:text-xs text-[#64748b]">{Object.keys(stats.cities).length} 个城市</div>
        </div>
      </div>
      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0 ml-2">
        <span className="text-lg lg:text-xl font-bold" style={{ color: layerColor }}>{stats.count}</span>
        <span className="text-[10px] lg:text-xs text-[#64748b]">{labels.unitLabel}</span>
        <span className="text-[#64748b] text-lg lg:text-xl group-hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': layerColor } as React.CSSProperties}>›</span>
      </div>
    </div>
  );
};

// ==================== 城市列表项 ====================
interface CityItemProps {
  name: string;
  count: number;
  playerCount: number;
  onClick: () => void;
  entityLayer?: EntityLayer;
}

const CityItem: React.FC<CityItemProps> = ({ name, count, playerCount, onClick, entityLayer = 'players' }) => {
  const labels = ENTITY_LAYER_LABELS[entityLayer];
  const layerColor = ENTITY_LAYER_CONFIG[entityLayer].color;

  return (
    <div
      data-testid="city-item"
      onClick={onClick}
      className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg lg:rounded-xl px-3 lg:px-5 py-3 lg:py-4 flex justify-between items-center cursor-pointer transition-all hover:border-[var(--hover-color)] hover:bg-[var(--hover-bg)] hover:translate-x-1 group"
      style={{ '--hover-color': layerColor, '--hover-bg': layerColor + '0D' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-[var(--rank-from)] to-[var(--rank-to)] rounded-lg flex items-center justify-center text-base lg:text-xl flex-shrink-0"
          style={{ '--rank-from': layerColor + '33', '--rank-to': layerColor + '0D' } as React.CSSProperties}
        >
          <Building2 className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: layerColor }} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[#f8fafc] text-sm lg:text-base truncate">{name}</div>
          <div className="text-[10px] lg:text-xs text-[#64748b]">{playerCount} 名{labels.entityName}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0 ml-2">
        <span className="text-lg lg:text-xl font-bold" style={{ color: layerColor }}>{count}</span>
        <span className="text-[10px] lg:text-xs text-[#64748b]">{labels.unitLabel}</span>
        <span className="text-[#64748b] text-lg lg:text-xl group-hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': layerColor } as React.CSSProperties}>›</span>
      </div>
    </div>
  );
};

// ==================== 球员列表项 ====================
interface PlayerItemProps {
  player: Player;
  onClick?: () => void;
  onAddToCompare?: () => void;
  isInCompare?: boolean;
  entityLayer?: EntityLayer;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ player, onClick, onAddToCompare, isInCompare, entityLayer = 'players' }) => {
  const initial = player.name ? player.name.charAt(0) : '?';
  const labels = ENTITY_LAYER_LABELS[entityLayer];
  const layerColor = ENTITY_LAYER_CONFIG[entityLayer].color;
  const extra = player.extra || {};

  // 构建实体专属副标题
  const buildEntitySubtitle = (): React.ReactNode => {
    if (entityLayer === 'players') {
      return (
        <>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> {player.city}</span>
          <span className="flex items-center gap-1"><span style={{ color: layerColor }}>足</span> {player.foot}</span>
        </>
      );
    }
    const items: React.ReactNode[] = [];
    switch (entityLayer) {
      case 'clubs':
        if (extra.address) items.push(<span key="addr">{String(extra.address)}</span>);
        if (extra.clubSize) items.push(<span key="size">规模：{String(extra.clubSize)}</span>);
        break;
      case 'coaches':
        if (extra.licenseType) items.push(<span key="lic">{String(extra.licenseType)}</span>);
        if (extra.coachingYears) items.push(<span key="yrs">执教{String(extra.coachingYears)}年</span>);
        if (extra.currentClub) items.push(<span key="club">{String(extra.currentClub)}</span>);
        break;
      case 'analysts':
        if (extra.specialty) items.push(<span key="spec">擅长：{String(extra.specialty)}</span>);
        if (extra.experience) items.push(<span key="exp">{String(extra.experience)}年经验</span>);
        break;
      case 'scouts':
        if (extra.currentOrganization) items.push(<span key="org">{String(extra.currentOrganization)}</span>);
        if (extra.scoutingExperience) items.push(<span key="exp">{String(extra.scoutingExperience)}年经验</span>);
        if (extra.totalDiscovered) items.push(<span key="disc">发现{String(extra.totalDiscovered)}人</span>);
        break;
    }
    if (items.length === 0) {
      return <span className="flex items-center gap-1"><MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> {player.city}</span>;
    }
    return <>{items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-[#475569]">·</span>}
        {item}
      </React.Fragment>
    ))}</>;
  };

  return (
    <div
      data-testid="player-item"
      onClick={onClick}
      className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg lg:rounded-xl p-3 lg:p-4 flex items-center gap-3 lg:gap-4 cursor-pointer transition-all hover:border-[var(--hover-color)] hover:bg-[var(--hover-bg)] hover:translate-x-1 group"
      style={{ '--hover-color': layerColor, '--hover-bg': layerColor + '0D' } as React.CSSProperties}
    >
      <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-[#252b3d] border-2 flex items-center justify-center text-lg lg:text-2xl shadow-[0_0_15px_var(--shadow-color)] flex-shrink-0 overflow-hidden"
        style={{ borderColor: layerColor, '--shadow-color': layerColor + '4D' } as React.CSSProperties}
      >
        {player.avatar ? (
          <LazyImage src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" containerClassName="w-full h-full" />
        ) : (
          <span className="text-[#f8fafc] font-semibold">{initial}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-[#f8fafc] text-sm lg:text-base">{player.name}</span>
          {labels.showAge && (
            <span className="text-[10px] lg:text-xs text-[#64748b] bg-[#252b3d] px-1.5 lg:px-2 py-0.5 rounded-full">{player.age}岁</span>
          )}
        </div>
        <div className="flex gap-2 lg:gap-3 text-xs lg:text-sm text-[#94a3b8] flex-wrap items-center">
          {buildEntitySubtitle()}
        </div>
      </div>

      <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
        <span className="px-2 lg:px-3 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-semibold"
          style={{ backgroundColor: layerColor + '1A', color: layerColor }}
        >
          {labels.showPositions ? player.position : labels.entityName}
        </span>
        {onAddToCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCompare();
            }}
            className={`p-1.5 rounded transition-all ${isInCompare ? 'text-[#0a0e17]' : 'bg-[#252b3d] text-[#94a3b8] opacity-0 group-hover:opacity-100'}`}
            style={isInCompare ? { backgroundColor: layerColor } : undefined}
            title={isInCompare ? '已在对比篮' : '加入对比'}
          >
            {isInCompare ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )}
        <span className="text-[#64748b] text-lg lg:text-xl group-hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': layerColor } as React.CSSProperties}>›</span>
      </div>
    </div>
  );
};

// ==================== 返回按钮 ====================
interface BackButtonProps {
  label: string;
  onClick: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({ label, onClick }) => {
  return (
    <button
      data-testid="back-button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-[#252b3d] border border-[#2d3748] rounded-lg text-[#94a3b8] transition-all hover:border-[#39ff14] hover:text-[#39ff14] mb-3 lg:mb-4 text-xs lg:text-sm"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </button>
  );
};

// ==================== 列表标题 ====================
interface ListHeaderProps {
  title: string;
  count: number | string;
}

const ListHeader: React.FC<ListHeaderProps> = ({ title, count }) => {
  return (
    <div className="flex justify-between items-center mb-3 lg:mb-4">
      <span className="text-sm lg:text-[0.95rem] text-[#94a3b8]">{title}</span>
      <span className="bg-[rgba(57,255,20,0.1)] text-[#39ff14] px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-semibold">
        {count}
      </span>
    </div>
  );
};

// ==================== 空状态 ====================
const EmptyState: React.FC = () => (
  <div className="text-center py-16 text-[#64748b]">
    <div className="mb-4 flex justify-center">
      <div className="w-12 h-12 rounded-full bg-[#1a2332] border border-[#2d3748] flex items-center justify-center">
        <span className="text-xl text-[#94a3b8]">—</span>
      </div>
    </div>
    <p>暂无数据</p>
  </div>
);

export { ProvinceItem, CityItem, PlayerItem, BackButton, ListHeader, EmptyState };
