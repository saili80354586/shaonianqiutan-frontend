import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, TrendingUp, TrendingDown, Calendar, Ruler, Weight,
  Timer, Dumbbell, Target, Zap, Plus, ArrowRight, FileText,
  TrendingUp as TrendIcon, BarChart3, X, Save, Pencil, Trash2,
  AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import ReactECharts from '../../../components/charts/ReactECharts';
import { ListItemSkeleton } from '../../../components/ui/loading';
import { playerApi } from '../../../services/api';
import { PhysicalTestTooltip } from '../../../components/ui/PhysicalTestTooltip';

// 新体测记录模型（对接 physical_test_records 独立表）
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
  created_at?: string;
}

interface PhysicalStats {
  latestHeight: number;
  latestWeight: number;
  heightChange: number;
  weightChange: number;
  recordCount: number;
}

// 内联表单模式
type FormMode = 'create' | 'edit';

const TEST_ITEMS = [
  { key: 'sprint_30m', label: '30米跑', unit: '秒', icon: Timer, category: 'speed' },
  { key: 'sprint_50m', label: '50米跑', unit: '秒', icon: Timer, category: 'speed' },
  { key: 'sprint_100m', label: '100米跑', unit: '秒', icon: Timer, category: 'speed' },
  { key: 'agility_ladder', label: '敏捷梯', unit: '秒', icon: Zap, category: 'agility' },
  { key: 't_test', label: 'T型跑', unit: '秒', icon: Zap, category: 'agility' },
  { key: 'shuttle_run', label: '折返跑', unit: '秒', icon: Zap, category: 'agility' },
  { key: 'standing_long_jump', label: '立定跳远', unit: 'cm', icon: TrendingUp, category: 'power' },
  { key: 'vertical_jump', label: '纵跳', unit: 'cm', icon: TrendingUp, category: 'power' },
  { key: 'sit_and_reach', label: '坐位体前屈', unit: 'cm', icon: Activity, category: 'flexibility' },
  { key: 'push_up', label: '俯卧撑', unit: '个', icon: Dumbbell, category: 'strength' },
  { key: 'sit_up', label: '仰卧起坐', unit: '个/分钟', icon: Dumbbell, category: 'strength' },
  { key: 'plank', label: '平板支撑', unit: '秒', icon: Dumbbell, category: 'strength' },
] as const;

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  speed: { label: '速度', color: '#3b82f6' },
  agility: { label: '灵敏', color: '#a855f7' },
  power: { label: '爆发', color: '#f59e0b' },
  flexibility: { label: '柔韧', color: '#10b981' },
  strength: { label: '力量', color: '#ef4444' },
};

export const MyPhysicalTests: React.FC = () => {
  const [records, setRecords] = useState<PhysicalTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PhysicalTestRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const emptyForm = {
    test_date: new Date().toISOString().split('T')[0],
    height: '', weight: '',
    sprint_30m: '', sprint_50m: '', sprint_100m: '',
    agility_ladder: '', t_test: '', shuttle_run: '',
    standing_long_jump: '', vertical_jump: '',
    sit_and_reach: '',
    push_up: '', sit_up: '', plank: '',
    extra_data: '',
  };
  const [form, setForm] = useState(emptyForm);

  const openCreateForm = () => {
    setForm(emptyForm);
    setFormMode('create');
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
    // 滚动到表单
    setTimeout(() => {
      const el = document.getElementById('physical-test-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openEditForm = (record: PhysicalTestRecord) => {
    setForm({
      test_date: record.test_date || '',
      height: record.height != null ? String(record.height) : '',
      weight: record.weight != null ? String(record.weight) : '',
      sprint_30m: record.sprint_30m != null ? String(record.sprint_30m) : '',
      sprint_50m: record.sprint_50m != null ? String(record.sprint_50m) : '',
      sprint_100m: record.sprint_100m != null ? String(record.sprint_100m) : '',
      agility_ladder: record.agility_ladder != null ? String(record.agility_ladder) : '',
      t_test: record.t_test != null ? String(record.t_test) : '',
      shuttle_run: record.shuttle_run != null ? String(record.shuttle_run) : '',
      standing_long_jump: record.standing_long_jump != null ? String(record.standing_long_jump) : '',
      vertical_jump: record.vertical_jump != null ? String(record.vertical_jump) : '',
      sit_and_reach: record.sit_and_reach != null ? String(record.sit_and_reach) : '',
      push_up: record.push_up != null ? String(record.push_up) : '',
      sit_up: record.sit_up != null ? String(record.sit_up) : '',
      plank: record.plank != null ? String(record.plank) : '',
      extra_data: record.extra_data || '',
    });
    setFormMode('edit');
    setEditingId(record.id);
    setFormError(null);
    setShowForm(true);
    setTimeout(() => {
      const el = document.getElementById('physical-test-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const buildPayload = () => {
    const toFloat = (v: string) => (v === '' ? undefined : parseFloat(v));
    const toInt = (v: string) => (v === '' ? undefined : parseInt(v, 10));
    return {
      test_date: form.test_date,
      height: toFloat(form.height),
      weight: toFloat(form.weight),
      sprint_30m: toFloat(form.sprint_30m),
      sprint_50m: toFloat(form.sprint_50m),
      sprint_100m: toFloat(form.sprint_100m),
      agility_ladder: toFloat(form.agility_ladder),
      t_test: toFloat(form.t_test),
      shuttle_run: toFloat(form.shuttle_run),
      standing_long_jump: toFloat(form.standing_long_jump),
      vertical_jump: toFloat(form.vertical_jump),
      sit_and_reach: toFloat(form.sit_and_reach),
      push_up: toInt(form.push_up),
      sit_up: toInt(form.sit_up),
      plank: toInt(form.plank),
      extra_data: form.extra_data || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.test_date) {
      setFormError('请填写测试日期');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = buildPayload();
      let res;
      if (formMode === 'edit' && editingId) {
        res = await playerApi.updatePhysicalTest(editingId, payload);
      } else {
        res = await playerApi.createPhysicalTest(payload);
      }
      if (res.data?.success) {
        closeForm();
        loadRecords();
      } else {
        setFormError(res.data?.message || '保存失败');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await playerApi.deletePhysicalTest(id);
      if (res.data?.success) {
        setShowDeleteConfirm(null);
        setSelectedRecord(null);
        loadRecords();
      } else {
        setFormError(res.data?.message || '删除失败');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || '删除失败，请重试');
    }
  };

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
      setError(err.response?.data?.message || err.message || '加载体测数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const stats: PhysicalStats = useMemo(() => {
    if (records.length === 0) {
      return {
        latestHeight: 0,
        latestWeight: 0,
        heightChange: 0,
        weightChange: 0,
        recordCount: 0,
      };
    }
    const latest = records[0];
    const prev = records[1];
    return {
      latestHeight: latest.height || 0,
      latestWeight: latest.weight || 0,
      heightChange: prev && prev.height ? (latest.height || 0) - prev.height : 0,
      weightChange: prev && prev.weight ? (latest.weight || 0) - prev.weight : 0,
      recordCount: records.length,
    };
  }, [records]);

  // 计算 BMI
  const bmi = useMemo(() => {
    if (!stats.latestHeight || !stats.latestWeight) return 0;
    const h = stats.latestHeight / 100;
    return Number((stats.latestWeight / (h * h)).toFixed(1));
  }, [stats]);

  // 图表数据：按时间正序（最早在前）
  const chartData = useMemo(() => [...records].reverse(), [records]);

  // 身高/体重/BMI 趋势图配置
  const trendOption = useMemo(() => {
    if (chartData.length === 0) return {};
    const dates = chartData.map(r => r.test_date);
    const heights = chartData.map(r => r.height || 0);
    const weights = chartData.map(r => r.weight || 0);
    const bmis = chartData.map(r => {
      if (!r.height || !r.weight) return 0;
      const h = r.height / 100;
      return Number((r.weight / (h * h)).toFixed(1));
    });
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26,31,46,0.95)',
        borderColor: '#374151',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
      },
      legend: {
        data: ['身高(cm)', '体重(kg)', 'BMI'],
        textStyle: { color: '#9ca3af' },
        bottom: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9ca3af', rotate: chartData.length > 6 ? 30 : 0 },
      },
      yAxis: [
        {
          type: 'value',
          name: '身高/体重',
          nameTextStyle: { color: '#9ca3af' },
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9ca3af' },
          splitLine: { lineStyle: { color: 'rgba(55,65,81,0.3)' } },
        },
        {
          type: 'value',
          name: 'BMI',
          nameTextStyle: { color: '#9ca3af' },
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9ca3af' },
          splitLine: { show: false },
          min: 10,
          max: 30,
        },
      ],
      series: [
        {
          name: '身高(cm)',
          type: 'line',
          data: heights,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#39ff14', width: 3 },
          itemStyle: { color: '#39ff14' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(57,255,20,0.3)' },
                { offset: 1, color: 'rgba(57,255,20,0.01)' },
              ],
            },
          },
        },
        {
          name: '体重(kg)',
          type: 'line',
          data: weights,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#00d4ff', width: 3 },
          itemStyle: { color: '#00d4ff' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0,212,255,0.3)' },
                { offset: 1, color: 'rgba(0,212,255,0.01)' },
              ],
            },
          },
        },
        {
          name: 'BMI',
          type: 'line',
          yAxisIndex: 1,
          data: bmis,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 8,
          lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
        },
      ],
    };
  }, [chartData]);

  // 能力雷达图配置（基于客观指标映射到 0-100 分）
  const radarOption = useMemo(() => {
    const latest = records[0];
    if (!latest) return {};

    const score = (val: number | undefined, max: number, inverse = false) => {
      if (val == null || val <= 0) return 0;
      if (inverse) return Math.max(0, Math.min(100, Math.round((1 - val / max) * 100)));
      return Math.max(0, Math.min(100, Math.round((val / max) * 100)));
    };

    const scores = {
      速度: score(latest.sprint_30m, 6, true) || score(latest.sprint_50m, 9, true) || score(latest.sprint_100m, 18, true),
      灵敏: score(latest.agility_ladder, 12, true) || score(latest.t_test, 12, true) || score(latest.shuttle_run, 15, true),
      爆发: score(latest.standing_long_jump, 250) || score(latest.vertical_jump, 60),
      柔韧: score(latest.sit_and_reach, 25),
      力量: score(latest.push_up, 50) || score(latest.sit_up, 60) || score(latest.plank, 180),
    };

    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(26,31,46,0.95)',
        borderColor: '#374151',
        textStyle: { color: '#fff' },
      },
      radar: {
        indicator: Object.keys(scores).map((k) => ({ name: k, max: 100 })),
        axisName: { color: '#d1d5db', fontSize: 14, fontWeight: 'bold' },
        splitArea: {
          areaStyle: {
            color: ['rgba(57,255,20,0.02)', 'rgba(57,255,20,0.05)', 'rgba(57,255,20,0.08)', 'rgba(57,255,20,0.11)'],
          },
        },
        splitLine: { lineStyle: { color: 'rgba(57,255,20,0.15)' } },
        axisLine: { lineStyle: { color: 'rgba(57,255,20,0.2)' } },
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '能力评估',
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#39ff14', width: 3 },
          itemStyle: { color: '#39ff14', borderColor: '#0a0e17', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'radial', x: 0.5, y: 0.5, r: 0.5,
              colorStops: [
                { offset: 0, color: 'rgba(57,255,20,0.4)' },
                { offset: 1, color: 'rgba(57,255,20,0.05)' },
              ],
            },
          },
          label: { show: true, formatter: (params: any) => params.value, color: '#fff', fontSize: 12, fontWeight: 'bold' },
        }],
      }],
      graphic: avg > 0 ? [
        { type: 'text', left: 'center', top: 'center', style: { text: `${Math.round(avg)}`, fill: '#39ff14', fontSize: 32, fontWeight: 'bold', textAlign: 'center' } },
        { type: 'text', left: 'center', top: 'center', style: { text: '综合评分', fill: '#9ca3af', fontSize: 12, textAlign: 'center' }, offset: [0, 24] },
      ] : undefined,
    };
  }, [records]);

  const getBmiLabel = (bmi: number) => {
    if (bmi === 0) return '-';
    if (bmi < 18.5) return '偏瘦';
    if (bmi < 24) return '正常';
    if (bmi < 28) return '偏胖';
    return '肥胖';
  };

  const getBmiColor = (bmi: number) => {
    if (bmi === 0) return 'text-gray-400';
    if (bmi < 18.5) return 'text-yellow-400';
    if (bmi < 24) return 'text-green-400';
    if (bmi < 28) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-bold text-white mb-6">我的体测</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
              <ListItemSkeleton count={1} />
            </div>
          ))}
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          <ListItemSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">我的体测</h2>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={loadRecords}
            className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 underline"
          >
            点击重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">我的体测</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-[#39ff14]/10 text-[#39ff14] rounded-lg text-sm font-medium hover:bg-[#39ff14]/20 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 记录新数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-[#39ff14]" />
            <span className="text-gray-400 text-sm">身高</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.latestHeight ? `${stats.latestHeight}cm` : '-'}
          </div>
          {stats.heightChange !== 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${stats.heightChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.heightChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(stats.heightChange).toFixed(1)}cm
            </div>
          )}
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Weight className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">体重</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.latestWeight ? `${stats.latestWeight}kg` : '-'}
          </div>
          {stats.weightChange !== 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${stats.weightChange < 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {stats.weightChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {Math.abs(stats.weightChange).toFixed(1)}kg
            </div>
          )}
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400 text-sm">BMI</span>
          </div>
          <div className={`text-2xl font-bold ${getBmiColor(bmi)}`}>
            {bmi || '-'}
          </div>
          <div className="text-xs text-gray-500 mt-1">{getBmiLabel(bmi)}</div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">记录次数</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.recordCount}</div>
          <div className="text-xs text-gray-500 mt-1">体测数据记录</div>
        </div>
      </div>

      {/* 数据趋势图 */}
      {records.length > 1 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendIcon className="w-5 h-5 text-[#39ff14]" /> 成长趋势
          </h3>
          <div className="h-64 sm:h-80">
            <ReactECharts option={trendOption} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />
          </div>
        </div>
      )}

      {/* 能力雷达图 */}
      {records.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#39ff14]" /> 能力评估
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div className="h-64 sm:h-72">
              <ReactECharts option={radarOption} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />
            </div>
            <div className="space-y-3">
              {Object.entries(CATEGORY_LABELS).map(([key, { label, color }]) => {
                const items = TEST_ITEMS.filter((t) => t.category === key);
                const latest = records[0];
                const hasAny = items.some((t) => latest[t.key as keyof PhysicalTestRecord] != null);
                return (
                  <div key={key} className="flex items-center gap-3 bg-[#111827] rounded-lg p-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                      <Activity className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{label}</span>
                        <span className="text-xs text-gray-500">{hasAny ? '已记录' : '未记录'}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {items.map((item) => {
                          const val = latest[item.key as keyof PhysicalTestRecord];
                          if (val == null) return null;
                          return (
                            <span key={item.key} className="text-xs text-gray-400">
                              {item.label}: <span className="text-white font-medium">{val}{item.unit}</span>
                            </span>
                          );
                        })}
                        {!hasAny && <span className="text-xs text-gray-600">暂无数据</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#39ff14]" /> 历史记录
        </h3>

        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无体测记录</p>
            <p className="text-sm text-gray-600 mt-2">记录你的第一次体测数据，追踪成长变化</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => {
              const prevRecord = records[index + 1];
              const isSelected = selectedRecord?.id === record.id;
              return (
                <div
                  key={record.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-[#39ff14]/10 border-[#39ff14]/50'
                      : 'bg-[#111827] border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* 头部：日期 + 操作按钮 */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => setSelectedRecord(isSelected ? null : record)}
                    >
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-white font-medium">{record.test_date}</span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">最新</span>
                      )}
                      <ArrowRight className={`w-4 h-4 text-gray-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditForm(record); }}
                        className="p-1.5 text-gray-400 hover:text-[#39ff14] hover:bg-[#39ff14]/10 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(record.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 核心指标 */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
                    <div className="text-center">
                      <div className="text-sm sm:text-lg font-bold text-white">{record.height ? <span>{record.height}<span className="text-xs font-normal text-gray-500 ml-0.5">cm</span></span> : '-'}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">身高</div>
                      {prevRecord && record.height && prevRecord.height && (
                        <div className={`text-[10px] sm:text-xs mt-0.5 ${record.height >= prevRecord.height ? 'text-green-400' : 'text-red-400'}`}>
                          {record.height >= prevRecord.height ? '↑' : '↓'} {Math.abs(record.height - prevRecord.height).toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm sm:text-lg font-bold text-white">{record.weight ? <span>{record.weight}<span className="text-xs font-normal text-gray-500 ml-0.5">kg</span></span> : '-'}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">体重</div>
                      {prevRecord && record.weight && prevRecord.weight && (
                        <div className={`text-[10px] sm:text-xs mt-0.5 ${record.weight <= prevRecord.weight ? 'text-green-400' : 'text-orange-400'}`}>
                          {record.weight <= prevRecord.weight ? '↓' : '↑'} {Math.abs(record.weight - prevRecord.weight).toFixed(1)}
                        </div>
                      )}
                    </div>
                    {TEST_ITEMS.slice(0, 4).map((item) => {
                      const val = record[item.key as keyof PhysicalTestRecord];
                      return (
                        <div key={item.key} className="text-center">
                          <div className="text-sm sm:text-lg font-bold text-white">{val != null ? val : '-'}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 展开详情：全部指标 */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {TEST_ITEMS.map((item) => {
                          const val = record[item.key as keyof PhysicalTestRecord];
                          if (val == null) return null;
                          return (
                            <div key={item.key} className="bg-[#0a0e17] rounded-lg px-3 py-2">
                              <div className="text-[10px] text-gray-500">{item.label}</div>
                              <div className="text-sm font-bold text-white">{val} <span className="text-[10px] font-normal text-gray-500">{item.unit}</span></div>
                            </div>
                          );
                        })}
                      </div>
                      {record.extra_data && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">备注</div>
                          <div className="text-sm text-gray-300">{record.extra_data}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700 w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">确认删除</h3>
                <p className="text-sm text-gray-400">删除后无法恢复，是否继续？</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 内联表单区域 */}
      <div id="physical-test-form" className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
        {/* 表单头部（可折叠） */}
        <button
          onClick={() => showForm ? closeForm() : openCreateForm()}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {formMode === 'edit' ? (
              <>
                <Pencil className="w-5 h-5 text-[#39ff14]" /> 编辑体测数据
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 text-[#39ff14]" /> 记录体测数据
              </>
            )}
          </h3>
          {showForm ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {/* 表单内容 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-5">
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}
            {/* 日期 + 身高体重 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">测试日期 <span className="text-red-400">*</span></label>
                <input
                  type="date" required
                  value={form.test_date}
                  onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">身高 (cm)</label>
                <input type="number" step="0.1" placeholder="175.5"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">体重 (kg)</label>
                <input type="number" step="0.1" placeholder="65.0"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                />
              </div>
            </div>

            {/* 速度类 */}
            <fieldset className="border border-gray-700/50 rounded-lg p-4 space-y-3">
              <legend className="flex items-center gap-1.5 px-2 text-sm font-medium text-blue-400">
                <Timer className="w-4 h-4" /> 速度类
                <span className="text-xs text-gray-500 font-normal">(秒，越小越好)</span>
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'sprint_30m', label: '30米跑', placeholder: '5.2' },
                  { key: 'sprint_50m', label: '50米跑', placeholder: '8.5' },
                  { key: 'sprint_100m', label: '100米跑', placeholder: '15.0' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1 block">
                      {item.label}
                      <PhysicalTestTooltip itemKey={item.key} compact />
                    </label>
                    <input
                      type="number" step="0.01" placeholder={item.placeholder}
                      value={(form as any)[item.key]}
                      onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                      className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* 灵敏类 */}
            <fieldset className="border border-gray-700/50 rounded-lg p-4 space-y-3">
              <legend className="flex items-center gap-1.5 px-2 text-sm font-medium text-purple-400">
                <Zap className="w-4 h-4" /> 灵敏类
                <span className="text-xs text-gray-500 font-normal">(秒)</span>
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'agility_ladder', label: '敏捷梯', placeholder: '10.5' },
                  { key: 't_test', label: 'T型跑', placeholder: '10.0' },
                  { key: 'shuttle_run', label: '折返跑', placeholder: '12.0' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1 block">
                      {item.label}
                      <PhysicalTestTooltip itemKey={item.key} compact />
                    </label>
                    <input
                      type="number" step="0.01" placeholder={item.placeholder}
                      value={(form as any)[item.key]}
                      onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                      className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* 爆发类 */}
            <fieldset className="border border-gray-700/50 rounded-lg p-4 space-y-3">
              <legend className="flex items-center gap-1.5 px-2 text-sm font-medium text-yellow-400">
                <TrendingUp className="w-4 h-4" /> 爆发类
                <span className="text-xs text-gray-500 font-normal">(cm)</span>
              </legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'standing_long_jump', label: '立定跳远', placeholder: '200' },
                  { key: 'vertical_jump', label: '纵跳', placeholder: '45' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1 block">
                      {item.label}
                      <PhysicalTestTooltip itemKey={item.key} compact />
                    </label>
                    <input
                      type="number" step="0.1" placeholder={item.placeholder}
                      value={(form as any)[item.key]}
                      onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                      className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* 柔韧 + 力量类 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <fieldset className="border border-gray-700/50 rounded-lg p-4 space-y-3">
                <legend className="flex items-center gap-1.5 px-2 text-sm font-medium text-emerald-400">
                  <Activity className="w-4 h-4" /> 柔韧类
                </legend>
                <div>
                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1 block">坐位体前屈 (cm)
                    <PhysicalTestTooltip itemKey="sit_and_reach" compact />
                  </label>
                  <input
                    type="number" step="0.1" placeholder="15.0"
                    value={form.sit_and_reach}
                    onChange={(e) => setForm({ ...form, sit_and_reach: e.target.value })}
                    className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                  />
                </div>
              </fieldset>

              <fieldset className="border border-gray-700/50 rounded-lg p-4 space-y-3">
                <legend className="flex items-center gap-1.5 px-2 text-sm font-medium text-red-400">
                  <Dumbbell className="w-4 h-4" /> 力量类
                </legend>
                <div className="space-y-2">
                  {[
                    { key: 'push_up', label: '俯卧撑', unit: '个', placeholder: '30' },
                    { key: 'sit_up', label: '仰卧起坐', unit: '个/分', placeholder: '40' },
                    { key: 'plank', label: '平板支撑', unit: '秒', placeholder: '60' },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1 block">{item.label} ({item.unit})
                        <PhysicalTestTooltip itemKey={item.key} compact />
                      </label>
                      <input
                        type="number" step="1" placeholder={item.placeholder}
                        value={(form as any)[item.key]}
                        onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                        className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#39ff14] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">备注</label>
              <textarea rows={2}
                placeholder="可选：填写本次体测的额外说明"
                value={form.extra_data}
                onChange={(e) => setForm({ ...form, extra_data: e.target.value })}
                className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#39ff14] focus:outline-none resize-none"
              />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeForm}
                className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >取消</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#39ff14] text-[#0a0e17] rounded-xl text-sm font-semibold hover:bg-[#4dff2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-[#0a0e17]/30 border-t-[#0a0e17] rounded-full animate-spin" />保存中...</>
                ) : (
                  <><Save className="w-4 h-4" />{formMode === 'edit' ? '保存修改' : '保存记录'}</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MyPhysicalTests;
