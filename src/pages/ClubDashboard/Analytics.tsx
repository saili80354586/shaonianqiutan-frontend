import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Award, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from '../../components/charts/ReactECharts';
import { clubApi } from '../../services/api';

interface AnalyticsProps {
  onBack?: () => void;
  onDrillDown?: (filters: { ageGroup?: string; position?: string }) => void;
}

interface AgeGroupItem {
  ageGroup: string;
  count: number;
}

interface PositionItem {
  name: string;
  position?: string;
  count: number;
}

interface TopPerformer {
  name: string;
  ageGroup: string;
  metric: string;
  value: string | number;
}

interface AbilityRadar {
  labels: string[];
  teamAvg: number[];
  platformAvg: number[];
}

interface AnalyticsData {
  playerDistribution: {
    byAgeGroup: AgeGroupItem[];
    byPosition: PositionItem[];
  };
  abilityRadar: AbilityRadar;
  topPerformers: TopPerformer[];
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack, onDrillDown }) => {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate('/club/dashboard'));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await clubApi.getAnalytics?.({ ageGroup: ageGroupFilter !== 'all' ? ageGroupFilter : undefined });
        if (mounted && res?.data?.success && res?.data?.data) setData(res.data.data);
      } catch (error) {
        console.error('加载数据分析失败:', error);
        if (mounted) {
          setData({
            playerDistribution: {
              byAgeGroup: [],
              byPosition: [],
            },
            abilityRadar: {
              labels: ['速度', '力量', '耐力', '灵敏', '柔韧', '技术'],
              teamAvg: [],
              platformAvg: [],
            },
            topPerformers: [],
          });
        }
      }
      if (mounted) setLoading(false);
    };
    fetchData();
    return () => { mounted = false; };
  }, [ageGroupFilter]);

  const maxCount = data?.playerDistribution?.byAgeGroup?.reduce((max: number, g: AgeGroupItem) => Math.max(max, g.count), 0) || 100;

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">数据分析</h1>
              <p className="text-gray-400 mt-1">俱乐部整体数据分析</p>
            </div>
          </div>
          <select value={ageGroupFilter} onChange={e => setAgeGroupFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
            <option value="all">全部梯队</option>
            <option value="U8">U8</option>
            <option value="U10">U10</option>
            <option value="U12">U12</option>
            <option value="U14">U14</option>
            <option value="U16">U16</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 h-64 animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* 球员年龄分布 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Users className="w-5 h-5" />球员年龄分布</h3>
              <p className="text-xs text-gray-500 mb-4">点击年龄段可直接下钻到对应球员列表</p>
              <div className="space-y-4">
                {data?.playerDistribution?.byAgeGroup?.map((g: AgeGroupItem) => (
                  <div
                    key={g.ageGroup}
                    onClick={() => onDrillDown?.({ ageGroup: g.ageGroup })}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400 group-hover:text-emerald-400 transition-colors">{g.ageGroup}</span>
                      <span className="text-white font-medium">{g.count}人</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all group-hover:brightness-110" style={{ width: `${(g.count / maxCount) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 位置人才储备 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5" />位置人才储备</h3>
              <p className="text-xs text-gray-500 mb-4">点击位置条目可直接下钻到对应球员列表</p>
              <div className="space-y-3">
                {data?.playerDistribution?.byPosition?.map((p: PositionItem) => {
                  const depth = p.count > 40 ? '充足' : p.count > 20 ? '良好' : '不足';
                  const color = depth === '充足' ? 'text-green-400' : depth === '良好' ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <div
                      key={p.position}
                      onClick={() => onDrillDown?.({ position: p.name })}
                      className="flex items-center justify-between cursor-pointer group hover:bg-gray-800/30 rounded-lg px-2 py-1 -mx-2 transition-colors"
                    >
                      <span className="text-gray-400 group-hover:text-emerald-400 transition-colors">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full group-hover:brightness-110" style={{ width: `${Math.min(p.count * 2, 100)}%` }}></div>
                        </div>
                        <span className="text-white w-16 text-right">{p.count}人</span>
                        <span className={`text-xs ${color}`}>{depth}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 梯队能力雷达图 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5" />梯队能力雷达图</h3>
              <ReactECharts
                option={{
                  color: ['#10b981', '#3b82f6'],
                  radar: {
                    indicator: (data?.abilityRadar?.labels || []).map((label: string) => ({ name: label, max: 100 })),
                    radius: '65%',
                    splitNumber: 4,
                    axisName: { color: '#9ca3af' },
                    splitLine: { lineStyle: { color: '#374151' } },
                    splitArea: { areaStyle: { color: ['rgba(55,65,81,0.1)', 'rgba(55,65,81,0.2)'] } },
                    axisLine: { lineStyle: { color: '#374151' } },
                  },
                  legend: { data: ['梯队平均', '平台平均'], bottom: 0, textStyle: { color: '#9ca3af' } },
                  series: [{
                    type: 'radar',
                    data: [
                      { value: data?.abilityRadar?.teamAvg || [], name: '梯队平均', areaStyle: { color: 'rgba(16,185,129,0.2)' } },
                      { value: data?.abilityRadar?.platformAvg || [], name: '平台平均', areaStyle: { color: 'rgba(59,130,246,0.2)' } },
                    ],
                  }],
                }}
                style={{ height: 280 }}
              />
            </div>

            {/* TOP球员 */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Award className="w-5 h-5" />梯队TOP球员</h3>
              <div className="space-y-4">
                {data?.topPerformers?.map((player: TopPerformer, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{player.name}</div>
                      <div className="text-sm text-gray-400">{player.ageGroup} · {player.metric}</div>
                    </div>
                    <div className="text-emerald-400 font-semibold">{player.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
