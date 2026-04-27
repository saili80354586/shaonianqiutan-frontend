import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Calendar, Loader2 } from 'lucide-react';
import ActivityMiniMap from './ActivityMiniMap';
import ActivityCardList from './ActivityCardList';
import ActivityDetailDrawer from './ActivityDetailDrawer';
import type { ClubActivity, ActivityMapPoint } from './types';
import { clubActivityApi } from '../../../services/api';

const RecentActivitiesSection: React.FC = () => {
  const [activities, setActivities] = useState<ClubActivity[]>([]);
  const [mapPoints, setMapPoints] = useState<ActivityMapPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ClubActivity | null>(null);
  const [highlightedActivityId, setHighlightedActivityId] = useState<number | null>(null);
  const [hoveredActivityId, setHoveredActivityId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) setLoading(true); });

    Promise.all([
      clubActivityApi.getPublicActivities({ page: 1, page_size: 100 }),
      clubActivityApi.getActivitiesMap(),
    ])
      .then(([activitiesRes, mapRes]) => {
        if (!mounted) return;
        if (activitiesRes.data?.success) {
          setActivities(activitiesRes.data.data || []);
        }
        if (mapRes.data?.success) {
          setMapPoints(mapRes.data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const handleSelectActivity = useCallback((activity: ClubActivity) => {
    setSelectedActivity(activity);
    setHighlightedActivityId(activity.id);
    setIsDrawerOpen(true);
  }, []);

  const handleSelectPoint = useCallback((point: ActivityMapPoint) => {
    if (point.activities.length > 0) {
      const first = point.activities[0];
      setActivities((prev) => {
        const fullActivity = prev.find((a) => a.id === first.id);
        if (fullActivity) {
          setSelectedActivity(fullActivity);
          setHighlightedActivityId(fullActivity.id);
          setIsDrawerOpen(true);
        }
        return prev;
      });
    }
  }, []);

  const handleRegister = useCallback((activity: ClubActivity) => {
    setSelectedActivity(activity);
    setHighlightedActivityId(activity.id);
    setIsDrawerOpen(true);
  }, []);

  const handleHoverActivity = useCallback((id: number | null) => {
    setHoveredActivityId(id);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] flex items-center gap-3 mb-2">
            <Calendar className="w-7 h-7 text-[#00d4ff]" />
            近期活动
          </h2>
          <p className="text-[#94a3b8]">发现全国各地的试训、集训营与交流赛机会</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#94a3b8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#39ff14]" />
            正常活动
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            3天内开始
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
            选中活动
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />
            悬停活动
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Mini Map */}
        <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-3 sm:p-4 h-[320px] md:h-[400px] lg:h-[520px]">
          {loading && mapPoints.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#64748b]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              加载活动地图...
            </div>
          ) : (
            <ActivityMiniMap
              points={mapPoints}
              onSelectPoint={handleSelectPoint}
              highlightedActivityId={highlightedActivityId}
              hoveredActivityId={hoveredActivityId}
            />
          )}
        </div>

        {/* Activity List */}
        <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-3 sm:p-4 h-[400px] md:h-[400px] lg:h-[520px] flex flex-col">
          <ActivityCardList
            activities={activities}
            loading={loading}
            onSelectActivity={handleSelectActivity}
            onRegister={handleRegister}
            selectedActivityId={highlightedActivityId}
            onHoverActivity={handleHoverActivity}
          />
        </div>
      </div>

      <ActivityDetailDrawer
        activity={selectedActivity}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRegisterSuccess={() => {
          // 刷新列表
          clubActivityApi.getPublicActivities({ page: 1, page_size: 100 }).then((res) => {
            if (res.data?.success) setActivities(res.data.data || []);
          });
        }}
      />
    </div>
  );
};

export default RecentActivitiesSection;
