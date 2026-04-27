import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Trophy, Target, Activity, Award, Plus, Loader2, ArrowRight } from 'lucide-react';
import { playerApi } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { PhysicalTestTooltip } from '../../../components/ui/PhysicalTestTooltip';

interface PhysicalTestRecord {
  id: number;
  test_date: string;
  height?: number;
  weight?: number;
  bmi?: number;
  sprint_30m?: number;
  sprint_50m?: number;
  sprint_100m?: number;
  agility_ladder?: number;
  t_test?: number;
  shuttle_run?: number;
  standing_long_jump?: number;
  vertical_jump?: number;
  sit_and_reach?: number;
  push_up?: number;
  sit_up?: number;
  plank?: number;
  extra_data?: string;
}

export const GrowthModule: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PhysicalTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerApi.getPhysicalTests();
      if (response.data?.success && response.data.data?.records) {
        const list: PhysicalTestRecord[] = response.data.data.records;
        list.sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
        setRecords(list);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '加载成长记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 基于客观指标计算综合评分
  const getOverallScore = () => {
    if (records.length === 0) return 0;
    const latest = records[0];
    const score = (val: number | undefined, max: number, inverse = false) => {
      if (val == null || val <= 0) return 0;
      if (inverse) return Math.max(0, Math.min(100, Math.round((1 - val / max) * 100)));
      return Math.max(0, Math.min(100, Math.round((val / max) * 100)));
    };
    const scores = [
      score(latest.sprint_30m, 6, true) || score(latest.sprint_50m, 9, true) || score(latest.sprint_100m, 18, true),
      score(latest.agility_ladder, 12, true) || score(latest.t_test, 12, true) || score(latest.shuttle_run, 15, true),
      score(latest.standing_long_jump, 250) || score(latest.vertical_jump, 60),
      score(latest.sit_and_reach, 25),
      score(latest.push_up, 50) || score(latest.sit_up, 60) || score(latest.plank, 180),
    ];
    const validScores = scores.filter((s) => s > 0);
    return validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  };

  const overallScore = getOverallScore();

  const RadarChart: React.FC = () => {
    const latest = records[0];
    if (!latest) return null;
    const score = (val: number | undefined, max: number, inverse = false) => {
      if (val == null || val <= 0) return 0;
      if (inverse) return Math.max(0, Math.min(100, Math.round((1 - val / max) * 100)));
      return Math.max(0, Math.min(100, Math.round((val / max) * 100)));
    };
    const abilityData = [
      { label: '速度', value: score(latest.sprint_30m, 6, true) || score(latest.sprint_50m, 9, true) || score(latest.sprint_100m, 18, true) },
      { label: '灵敏', value: score(latest.agility_ladder, 12, true) || score(latest.t_test, 12, true) || score(latest.shuttle_run, 15, true) },
      { label: '爆发', value: score(latest.standing_long_jump, 250) || score(latest.vertical_jump, 60) },
      { label: '柔韧', value: score(latest.sit_and_reach, 25) },
      { label: '力量', value: score(latest.push_up, 50) || score(latest.sit_up, 60) || score(latest.plank, 180) },
      { label: '综合', value: overallScore },
    ];

    // 计算每个维度的标签位置（基于50%中心点，半径约46%处，避免超出视图）
    const labelRadius = 46;
    const labelPositions = abilityData.map((_, index) => {
      const angle = (index * 60 - 90) * (Math.PI / 180);
      const x = 50 + labelRadius * Math.cos(angle);
      const y = 50 + labelRadius * Math.sin(angle);
      // 根据象限调整对齐方式
      let textAnchor = 'middle';
      let dx = 0;
      let dy = 0;
      if (Math.abs(Math.cos(angle)) < 0.001) {
        // 12点钟和6点钟位置
        dy = Math.cos(angle) > 0 ? -6 : 10;
      } else {
        dx = Math.cos(angle) > 0 ? 6 : -6;
        textAnchor = Math.cos(angle) > 0 ? 'start' : 'end';
      }
      return { x, y, dx, dy, textAnchor };
    });

    return (
      <div className="relative w-64 h-64 mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="absolute border border-gray-700/30" style={{ width: `${i * 20}%`, height: `${i * 20}%`, left: `${50 - i * 10}%`, top: `${50 - i * 10}%` }} />
        ))}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* 绘制轴线 */}
          {abilityData.map((_, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180);
            const x = 50 + 45 * Math.cos(angle);
            const y = 50 + 45 * Math.sin(angle);
            return <line key={index} x1="50" y1="50" x2={x} y2={y} stroke="rgba(107,114,128,0.3)" strokeWidth="0.3" />;
          })}
          {/* 绘制数据多边形 */}
          <polygon points={abilityData.map((item, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180);
            const r = (item.value / 100) * 45;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')} fill="rgba(57, 255, 20, 0.2)" stroke="#39ff14" strokeWidth="0.8" />
          {/* 绘制数据点 */}
          {abilityData.map((item, index) => {
            const angle = (index * 60 - 90) * (Math.PI / 180);
            const r = (item.value / 100) * 45;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            return <circle key={index} cx={x} cy={y} r="2" fill="#39ff14" />;
          })}
          {/* 绘制标签 */}
          {abilityData.map((item, index) => {
            const pos = labelPositions[index];
            return (
              <text
                key={index}
                x={pos.x}
                y={pos.y}
                dx={pos.dx}
                dy={pos.dy}
                textAnchor={pos.textAnchor}
                fill="#9ca3af"
                fontSize="10"
                fontFamily="sans-serif"
              >
                {item.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#39ff14]" />
            <span className="text-gray-400 text-sm">记录次数</span>
          </div>
          <div className="text-2xl font-bold text-white">{records.length}</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-400 text-sm">综合评分</span>
          </div>
          <div className="text-2xl font-bold text-white">{overallScore}</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-gray-400 text-sm">最新身高</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {records.length > 0 && records[0].height ? `${records[0].height}cm` : '未记录'}
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-gray-400 text-sm">最新体重</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {records.length > 0 && records[0].weight ? `${records[0].weight}kg` : '未记录'}
          </div>
        </div>
      </div>

      {/* 能力雷达图 */}
      {records.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#39ff14]" /> 综合能力雷达
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-3 h-3 rounded-full bg-[#39ff14]"></span>
              <span>当前水平</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <RadarChart />
            <div className="flex-1 grid grid-cols-2 gap-4">
              {(() => {
                const latest = records[0];
                const score = (val: number | undefined, max: number, inverse = false) => {
                  if (val == null || val <= 0) return 0;
                  if (inverse) return Math.max(0, Math.min(100, Math.round((1 - val / max) * 100)));
                  return Math.max(0, Math.min(100, Math.round((val / max) * 100)));
                };
                const items = [
                  { label: '速度', value: score(latest.sprint_30m, 6, true) || score(latest.sprint_50m, 9, true) || score(latest.sprint_100m, 18, true), color: '#3b82f6' },
                  { label: '灵敏', value: score(latest.agility_ladder, 12, true) || score(latest.t_test, 12, true) || score(latest.shuttle_run, 15, true), color: '#a855f7' },
                  { label: '爆发', value: score(latest.standing_long_jump, 250) || score(latest.vertical_jump, 60), color: '#f59e0b' },
                  { label: '柔韧', value: score(latest.sit_and_reach, 25), color: '#10b981' },
                  { label: '力量', value: score(latest.push_up, 50) || score(latest.sit_up, 60) || score(latest.plank, 180), color: '#ef4444' },
                  { label: '综合', value: overallScore, color: '#39ff14' },
                ];
                return items.map((item, index) => (
                  <div key={index} className="bg-[#111827] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 最近记录 + 快捷入口 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#39ff14]" /> 最近记录
          </h3>
          <button
            onClick={() => navigate('/user-dashboard?tab=physical_tests')}
            className="px-4 py-2 bg-[#39ff14]/10 text-[#39ff14] rounded-lg text-sm font-medium hover:bg-[#39ff14]/20 transition-all flex items-center gap-2"
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无成长记录</p>
            <p className="text-sm text-gray-600 mt-2">前往「我的体测」记录你的第一次体测数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 3).map((record, index) => (
              <div key={record.id} className="p-4 rounded-lg bg-[#111827] border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="text-white font-medium">{record.test_date}</span>
                    {index === 0 && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">最新</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {record.height != null && <span className="text-gray-400 inline-flex items-center gap-0.5">身高: <span className="text-white">{record.height}cm</span><PhysicalTestTooltip itemKey="height" compact /></span>}
                  {record.weight != null && <span className="text-gray-400 inline-flex items-center gap-0.5">体重: <span className="text-white">{record.weight}kg</span><PhysicalTestTooltip itemKey="weight" compact /></span>}
                  {record.sprint_30m != null && <span className="text-gray-400 inline-flex items-center gap-0.5">30米跑: <span className="text-white">{record.sprint_30m}秒</span><PhysicalTestTooltip itemKey="sprint_30m" compact /></span>}
                  {record.sprint_50m != null && <span className="text-gray-400 inline-flex items-center gap-0.5">50米跑: <span className="text-white">{record.sprint_50m}秒</span><PhysicalTestTooltip itemKey="sprint_50m" compact /></span>}
                  {record.sprint_100m != null && <span className="text-gray-400 inline-flex items-center gap-0.5">100米跑: <span className="text-white">{record.sprint_100m}秒</span><PhysicalTestTooltip itemKey="sprint_100m" compact /></span>}
                  {record.agility_ladder != null && <span className="text-gray-400 inline-flex items-center gap-0.5">敏捷梯: <span className="text-white">{record.agility_ladder}秒</span><PhysicalTestTooltip itemKey="agility_ladder" compact /></span>}
                  {record.standing_long_jump != null && <span className="text-gray-400 inline-flex items-center gap-0.5">立定跳远: <span className="text-white">{record.standing_long_jump}cm</span><PhysicalTestTooltip itemKey="standing_long_jump" compact /></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthModule;
