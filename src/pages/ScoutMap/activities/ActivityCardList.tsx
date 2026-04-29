import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MapPin, Calendar, Users, Star, ChevronRight, Filter, Loader2, Clock } from 'lucide-react';
import { LazyImage } from '../../../components';
import type { ClubActivity, ActivityType } from './types';
import { ACTIVITY_TYPE_CONFIG } from './types';

interface Props {
  activities: ClubActivity[];
  loading?: boolean;
  onSelectActivity: (activity: ClubActivity) => void;
  onRegister?: (activity: ClubActivity) => void;
  selectedActivityId?: number | null;
  onHoverActivity?: (id: number | null) => void;
}

type ActivityTab = 'all' | ActivityType;
type TimeFilter = 'all' | 'week' | 'month';
type FeeFilter = 'all' | 'free' | 'paid';

const TABS: { key: ActivityTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'trial', label: '试训' },
  { key: 'camp', label: '集训营' },
  { key: 'match', label: '邀请赛' },
  { key: 'exchange', label: '交流赛' },
];

const TIME_FILTERS = [
  { key: 'all' as TimeFilter, label: '全部' },
  { key: 'week' as TimeFilter, label: '本周' },
  { key: 'month' as TimeFilter, label: '本月' },
];

const FEE_FILTERS = [
  { key: 'all' as FeeFilter, label: '全部' },
  { key: 'free' as FeeFilter, label: '免费' },
  { key: 'paid' as FeeFilter, label: '收费' },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const formatDateRange = (start: string, end?: string) => {
  const s = formatDate(start);
  if (!end) return s;
  const e = formatDate(end);
  return `${s} - ${e}`;
};

const isUrgent = (startTime: string) => {
  const now = new Date().getTime();
  const start = new Date(startTime).getTime();
  const diff = start - now;
  return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
};

const ActivityCardList: React.FC<Props> = ({ activities, loading, onSelectActivity, onRegister, selectedActivityId, onHoverActivity }) => {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!selectedActivityId) return;
    const el = document.querySelector(`[data-activity-id="${selectedActivityId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedActivityId]);

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    // 类型筛选
    if (activeTab !== 'all') {
      result = result.filter((a) => a.type === activeTab);
    }

    // 时间筛选
    const now = new Date().getTime();
    if (timeFilter === 'week') {
      const weekLater = now + 7 * 24 * 60 * 60 * 1000;
      result = result.filter((a) => new Date(a.startTime).getTime() <= weekLater);
    } else if (timeFilter === 'month') {
      const monthLater = now + 30 * 24 * 60 * 60 * 1000;
      result = result.filter((a) => new Date(a.startTime).getTime() <= monthLater);
    }

    // 费用筛选
    if (feeFilter === 'free') {
      result = result.filter((a) => a.fee === 0 || a.feeType === 'free');
    } else if (feeFilter === 'paid') {
      result = result.filter((a) => a.fee > 0 || a.feeType === 'paid');
    }

    const cityKeyword = cityFilter.trim();
    if (cityKeyword) {
      result = result.filter((a) =>
        [a.province, a.city, a.address].some((value) => value?.includes(cityKeyword))
      );
    }

    // 按时间排序
    result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return result;
  }, [activities, activeTab, timeFilter, feeFilter, cityFilter]);

  const handleSelect = useCallback((activity: ClubActivity) => {
    onSelectActivity(activity);
  }, [onSelectActivity]);

  const handleRegisterClick = useCallback((e: React.MouseEvent, activity: ClubActivity) => {
    e.stopPropagation();
    onRegister?.(activity);
  }, [onRegister]);

  const handleMouseEnter = useCallback((id: number) => {
    onHoverActivity?.(id);
  }, [onHoverActivity]);

  const handleMouseLeave = useCallback(() => {
    onHoverActivity?.(null);
  }, [onHoverActivity]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab 导航 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#2d3748]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-[#39ff14] text-[#0a0e17]'
                : 'bg-[#1a2332] text-[#94a3b8] border border-[#2d3748] hover:border-[#39ff14]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
            showFilters ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
        </button>
      </div>

      {/* 高级筛选器 */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-3 bg-[#111827] rounded-xl border border-[#2d3748] mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">时间</span>
            <div className="flex gap-1">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTimeFilter(f.key)}
                  className={`px-2 py-1 rounded-md text-xs transition-all ${
                    timeFilter === f.key
                      ? 'bg-[#2d3748] text-[#f8fafc]'
                      : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">费用</span>
            <div className="flex gap-1">
              {FEE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFeeFilter(f.key)}
                  className={`px-2 py-1 rounded-md text-xs transition-all ${
                    feeFilter === f.key
                      ? 'bg-[#2d3748] text-[#f8fafc]'
                      : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[#64748b]">城市</span>
            <div className="relative">
              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
              <input
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="输入城市"
                className="h-8 w-28 rounded-lg bg-[#0a0e17] border border-[#2d3748] pl-7 pr-2 text-xs text-[#f8fafc] placeholder-[#64748b] outline-none focus:border-[#39ff14]/60"
              />
            </div>
          </label>
        </div>
      )}

      {/* 活动卡片流 */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-3 scrollbar-thin scrollbar-thumb-[#2d3748]">
        {loading && filteredActivities.length === 0 && (
          <div className="flex items-center justify-center h-40 text-[#64748b]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            加载活动中...
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a2332] mb-3">
              <Calendar className="w-5 h-5 text-[#64748b]" />
            </div>
            <p className="text-sm text-[#94a3b8]">暂无符合条件的活动</p>
          </div>
        )}

        {filteredActivities.map((activity) => {
          const typeConfig = ACTIVITY_TYPE_CONFIG[activity.type] || ACTIVITY_TYPE_CONFIG.trial;
          const urgent = isUrgent(activity.startTime);
          const progress = activity.maxParticipants > 0 ? (activity.currentParticipants / activity.maxParticipants) * 100 : 0;
          const isSelected = selectedActivityId === activity.id;

          return (
            <div
              key={activity.id}
              data-activity-id={activity.id}
              onClick={() => handleSelect(activity)}
              onMouseEnter={() => handleMouseEnter(activity.id)}
              onMouseLeave={handleMouseLeave}
              className={`group relative bg-[#111827] border rounded-xl p-3 sm:p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.15)]'
                  : 'border-[#2d3748] hover:border-[#39ff14]/50'
              }`}
            >
              {/* 紧急标签 */}
              {urgent && (
                <div className="absolute -top-1 -right-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  即将开始
                </div>
              )}

              <div className="flex gap-3 sm:gap-4">
                {/* 封面图 */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg bg-[#1a2332] flex-shrink-0 overflow-hidden">
                  {activity.coverImage ? (
                    <LazyImage src={activity.coverImage} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-[#2d3748]" />
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-[#f8fafc] truncate pr-2">{activity.title}</h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                      style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
                    >
                      {typeConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.province ? `${activity.province} · ${activity.city}` : activity.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateRange(activity.startTime, activity.endTime)}
                    </span>
                  </div>

                  {/* 报名进度 */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-[#64748b] mb-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        报名进度 {activity.currentParticipants}/{activity.maxParticipants}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1a2332] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#39ff14] to-[#00d4ff] rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {activity.clubLogo && (
                        <LazyImage src={activity.clubLogo} alt="" className="w-5 h-5 rounded-full object-cover" containerClassName="w-5 h-5" />
                      )}
                      <span className="text-xs text-[#94a3b8] truncate max-w-[72px] sm:max-w-[100px]">{activity.clubName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.fee > 0 ? (
                        <span className="text-sm font-bold text-[#fbbf24]">¥{activity.fee}</span>
                      ) : (
                        <span className="text-xs text-[#39ff14]">免费</span>
                      )}
                      <button
                        onClick={(e) => handleRegisterClick(e, activity)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#39ff14] text-[#0a0e17] rounded-lg text-xs font-medium hover:bg-[#32e612] transition-colors"
                      >
                        立即报名
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityCardList;
