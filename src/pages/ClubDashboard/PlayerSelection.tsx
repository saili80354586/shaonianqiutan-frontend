import React, { useEffect, useMemo, useState } from 'react';
import { clubApi } from '../../services/api';
import { toast } from 'sonner';
import {
  ChevronLeft, Filter, Download, Users, Scale, Ruler,
  BarChart3, X, CheckSquare, Square, Zap, Trophy, Activity,
  Save, Bookmark, Trash2 as TrashIcon, Loader2
} from 'lucide-react';
import ReactECharts from '../../components/charts/ReactECharts';
import ExportComplianceModal from './components/ExportComplianceModal';
import type { ExportPurpose } from './components/ExportComplianceModal';

interface PlayerSelectionProps {
  onBack: () => void;
  clubName?: string;
}

interface SelectionPlayer {
  id: number;
  userId: number;
  name: string;
  avatar?: string;
  age: number;
  position: string;
  positionName: string;
  ageGroup: string;
  joinDate: string;
  tags: string[];
  physicalTest: {
    height: number;
    weight: number;
    sprint50m: number;
    standingLongJump: number;
    pushUp: number;
    sitUp: number;
  };
  weeklyAverage: {
    attitude: number;
    technique: number;
    tactics: number;
    knowledge: number;
    overall: number;
    count: number;
  };
  matchCount: number;
  status: string;
}

interface FilterPreset {
  id: number;
  name: string;
  filters: string | Record<string, unknown>;
}

interface ShortlistApiItem {
  playerId?: number;
  player_id?: number;
  note?: string;
  addedAt?: string;
  created_at?: string;
}

const ageGroupOptions = ['全部', 'U8', 'U10', 'U12', 'U14', 'U16'];
const positionOptions = [
  { value: '', label: '全部' },
  { value: 'forward', label: '前锋' },
  { value: 'midfielder', label: '中场' },
  { value: 'defender', label: '后卫' },
  { value: 'goalkeeper', label: '门将' },
];

const clampRadarScore = (value: number) => Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));

const scoreLowerIsBetter = (value: number | undefined, best: number, worst: number) => {
  if (!value || value <= 0) return null;
  return clampRadarScore(((worst - value) / (worst - best)) * 5);
};

const scoreHigherIsBetter = (value: number | undefined, baseline: number, target: number) => {
  if (!value || value <= 0) return null;
  return clampRadarScore(((value - baseline) / (target - baseline)) * 5);
};

const averageScores = (scores: Array<number | null>) => {
  const validScores = scores.filter((score): score is number => score !== null);
  if (validScores.length === 0) return 0;
  return clampRadarScore(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
};

const getPhysicalRadarScore = (physicalTest: SelectionPlayer['physicalTest']) => averageScores([
  scoreLowerIsBetter(physicalTest?.sprint50m, 6.8, 10.5),
  scoreHigherIsBetter(physicalTest?.standingLongJump, 120, 260),
]);

const getMatchRadarScore = (matchCount: number) => clampRadarScore(matchCount);

const PlayerSelection: React.FC<PlayerSelectionProps> = ({ onBack, clubName }) => {
  const [players, setPlayers] = useState<SelectionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ageGroup: '',
    position: '',
    minHeight: '',
    maxHeight: '',
    minWeight: '',
    maxWeight: '',
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [presets, setPresets] = useState<{ id: number; name: string; filters: string }[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [shortlist, setShortlist] = useState<{ playerId: number; note: string; addedAt: string }[]>([]);
  const [shortlistNoteDraft, setShortlistNoteDraft] = useState<Record<number, string>>({});
  const [shortlistLoading, setShortlistLoading] = useState(false);

  const loadShortlist = async () => {
    setShortlistLoading(true);
    try {
      const res = await clubApi.getShortlist();
      const data = (res.data?.data || res.data) as unknown as ShortlistApiItem[];
      if (Array.isArray(data)) {
        setShortlist(data
          .map(item => ({
            playerId: item.playerId ?? item.player_id,
            note: item.note ?? '',
            addedAt: item.addedAt ?? item.created_at ?? new Date().toISOString(),
          }))
          .filter((item): item is { playerId: number; note: string; addedAt: string } => typeof item.playerId === 'number'));
      }
    } catch (err) {
      console.error('加载候选名单失败:', err);
    }
    setShortlistLoading(false);
  };

  useEffect(() => {
    loadShortlist();
  }, []);

  const addToShortlist = async (playerId: number) => {
    if (shortlist.some(s => s.playerId === playerId)) return;
    try {
      await clubApi.addToShortlist({ playerIds: [playerId], note: '' });
      setShortlist(prev => [...prev, { playerId, note: '', addedAt: new Date().toISOString() }]);
    } catch (err) {
      console.error('加入候选失败:', err);
      toast.error('加入候选失败');
    }
  };

  const removeFromShortlist = async (playerId: number) => {
    try {
      await clubApi.removeFromShortlist(playerId);
      setShortlist(prev => prev.filter(s => s.playerId !== playerId));
    } catch (err) {
      console.error('移除候选失败:', err);
      toast.error('移除候选失败');
    }
  };

  const updateShortlistNote = async (playerId: number, note: string) => {
    setShortlist(prev => prev.map(s => s.playerId === playerId ? { ...s, note } : s));
    try {
      await clubApi.updateShortlistNote(playerId, note);
    } catch (err) {
      console.error('更新备注失败:', err);
      toast.error('更新备注失败');
    }
  };

  const exportShortlistCSV = (purpose: ExportPurpose, note: string) => {
    const rows: Record<string, string | number>[] = shortlistPlayers.map(p => ({
      '姓名': p.name,
      '年龄段': p.ageGroup,
      '位置': p.positionName,
      '年龄': p.age,
      '身高': p.physicalTest?.height || '-',
      '体重': p.physicalTest?.weight || '-',
      '50米跑': p.physicalTest?.sprint50m || '-',
      '立定跳远': p.physicalTest?.standingLongJump || '-',
      '俯卧撑': p.physicalTest?.pushUp || '-',
      '仰卧起坐': p.physicalTest?.sitUp || '-',
      '周报综合评分': p.weeklyAverage?.overall ? p.weeklyAverage.overall.toFixed(1) : '-',
      '比赛场次': p.matchCount,
      '候选备注': shortlist.find(s => s.playerId === p.id)?.note || '',
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const purposeMap: Record<ExportPurpose, string> = {
      internal_training: '内部训练分析',
      parent_communication: '家长沟通',
      other: '其他',
    };
    const watermark = `本文件由「${clubName || '本俱乐部'}」于 ${new Date().toLocaleString('zh-CN')} 导出，用途：${purposeMap[purpose]}${note ? `（${note}）` : ''}。包含未成年人个人信息，仅限内部使用，禁止向第三方泄露。`;
    const csv = [
      watermark,
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `候选名单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const shortlistPlayers = useMemo(() => {
    const ids = new Set(shortlist.map(s => s.playerId));
    return players.filter(p => ids.has(p.id));
  }, [players, shortlist]);

  useEffect(() => {
    loadPlayers();
    loadPresets();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getPlayers({
        status: 'active',
        pageSize: 500,
        sortBy,
        sortOrder,
      });
      if (res.data?.success && res.data.data?.list) {
        // 临时使用普通球员列表，真实数据需要通过 /club/players/selection 获取
        setPlayers(res.data.data.list);
      }
    } catch (err) {
      console.error('加载球员失败:', err);
    }
    setLoading(false);
  };

  // 真实聚合数据通过 selection API 获取
  useEffect(() => {
    loadSelectionData();
  }, [sortBy, sortOrder]);

  const loadSelectionData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sortBy, sortOrder };
      if (filters.ageGroup) params.ageGroup = filters.ageGroup;
      if (filters.position) params.position = filters.position;
      if (filters.minHeight) params.minHeight = filters.minHeight;
      if (filters.maxHeight) params.maxHeight = filters.maxHeight;
      if (filters.minWeight) params.minWeight = filters.minWeight;
      if (filters.maxWeight) params.maxWeight = filters.maxWeight;

      const res = await clubApi.getPlayerSelection(params);

      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch (err) {
      console.error('加载选材数据失败:', err);
      toast.error('加载选材数据失败');
    }
    setLoading(false);
  };

  const loadPresets = async () => {
    setPresetsLoading(true);
    try {
      const res = await clubApi.getPlayerFilterPresets();
      const presetsData = res.data?.data || res.data;
      if (res.data?.success && Array.isArray(presetsData)) {
        setPresets((presetsData as FilterPreset[]).map((p) => ({
          id: p.id,
          name: p.name,
          filters: typeof p.filters === 'string' ? p.filters : JSON.stringify(p.filters),
        })));
      }
    } catch (err) {
      console.error('加载筛选方案失败:', err);
    }
    setPresetsLoading(false);
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await clubApi.createPlayerFilterPreset({
        name: presetName.trim(),
        filters: JSON.stringify({
          ageGroup: filters.ageGroup,
          position: filters.position,
          minHeight: filters.minHeight,
          maxHeight: filters.maxHeight,
          minWeight: filters.minWeight,
          maxWeight: filters.maxWeight,
        }),
      });
      setPresetName('');
      setSaveModalOpen(false);
      await loadPresets();
    } catch (err) {
      console.error('保存筛选方案失败:', err);
      toast.error('保存失败，请重试');
    }
  };

  const applyPreset = (preset: { id: number; name: string; filters: string }) => {
    try {
      const f = JSON.parse(preset.filters);
      setFilters({
        ageGroup: f.ageGroup || '',
        position: f.position || '',
        minHeight: f.minHeight || '',
        maxHeight: f.maxHeight || '',
        minWeight: f.minWeight || '',
        maxWeight: f.maxWeight || '',
      });
    } catch {
      // ignore
    }
  };

  const deletePreset = async (id: number) => {
    if (!confirm('确定删除该筛选方案？')) return;
    try {
      await clubApi.deletePlayerFilterPreset(id);
      await loadPresets();
    } catch (err) {
      console.error('删除筛选方案失败:', err);
      toast.error('删除失败');
    }
  };

  const filteredPlayers = useMemo(() => {
    return players;
  }, [players]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPlayers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlayers.map(p => p.id));
    }
  };

  const selectedPlayers = players.filter(p => selectedIds.includes(p.id));

  const exportCSV = (purpose: ExportPurpose, note: string) => {
    const rows: Record<string, string | number>[] = filteredPlayers.map(p => ({
      '姓名': p.name,
      '年龄段': p.ageGroup,
      '位置': p.positionName,
      '年龄': p.age,
      '身高': p.physicalTest?.height || '-',
      '体重': p.physicalTest?.weight || '-',
      '50米跑': p.physicalTest?.sprint50m || '-',
      '立定跳远': p.physicalTest?.standingLongJump || '-',
      '俯卧撑': p.physicalTest?.pushUp || '-',
      '仰卧起坐': p.physicalTest?.sitUp || '-',
      '周报综合评分': p.weeklyAverage?.overall ? p.weeklyAverage.overall.toFixed(1) : '-',
      '比赛场次': p.matchCount,
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const purposeMap: Record<ExportPurpose, string> = {
      internal_training: '内部训练分析',
      parent_communication: '家长沟通',
      other: '其他',
    };
    const watermark = `本文件由「${clubName || '本俱乐部'}」于 ${new Date().toLocaleString('zh-CN')} 导出，用途：${purposeMap[purpose]}${note ? `（${note}）` : ''}。包含未成年人个人信息，仅限内部使用，禁止向第三方泄露。`;
    const csv = [
      watermark,
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `选材名单_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
    >
      {children}
      {sortBy === field && (
        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  // 对比雷达图配置
  const radarOption = useMemo(() => {
    if (selectedPlayers.length === 0) return {};
    return {
      color: ['#39ff14', '#00d4ff', '#f59e0b', '#ec4899'],
      tooltip: {},
      legend: { data: selectedPlayers.map(p => p.name), textStyle: { color: '#ccc' } },
      radar: {
        indicator: [
          { name: '态度', max: 5 },
          { name: '技术', max: 5 },
          { name: '战术', max: 5 },
          { name: '掌握度', max: 5 },
          { name: '体能', max: 5 },
          { name: '比赛', max: 5 },
        ],
        axisName: { color: '#aaa' },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
      },
      series: [{
        type: 'radar',
        data: selectedPlayers.map(p => ({
          value: [
            p.weeklyAverage?.attitude || 0,
            p.weeklyAverage?.technique || 0,
            p.weeklyAverage?.tactics || 0,
            p.weeklyAverage?.knowledge || 0,
            getPhysicalRadarScore(p.physicalTest),
            getMatchRadarScore(p.matchCount),
          ],
          name: p.name,
        })),
      }],
    };
  }, [selectedPlayers]);

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <div className="bg-[#1a1f2e] border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">选材决策台</h1>
              <p className="text-gray-400 mt-1">多维度筛选、对比，辅助梯队选拔决策</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length >= 2 && (
              <button
                onClick={() => setCompareModalOpen(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" /> 对比选中 ({selectedIds.length})
              </button>
            )}
            {selectedIds.length > 0 && (
              <button
                onClick={async () => {
                  const existingIds = new Set(shortlist.map(s => s.playerId));
                  const newIds = selectedIds.filter(id => !existingIds.has(id));
                  if (newIds.length === 0) return;
                  try {
                    await clubApi.addToShortlist({ playerIds: newIds, note: '' });
                    const newItems = newIds.map(id => ({ playerId: id, note: '', addedAt: new Date().toISOString() }));
                    setShortlist(prev => [...prev, ...newItems]);
                  } catch (err) {
                    console.error('批量加入候选失败:', err);
                    toast.error('批量加入候选失败');
                  }
                }}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4" /> 批量加入候选 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => setShortlistOpen(true)}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" /> 候选名单 ({shortlist.length})
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> 导出 CSV
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* 筛选面板 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Filter className="w-5 h-5 text-emerald-400" /> 筛选条件
            </div>
            <div className="flex items-center gap-2">
              {presetsLoading ? (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              ) : (
                <div className="relative group">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                    <Bookmark className="w-4 h-4" /> 加载方案
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1f2e] border border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    {presets.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">暂无保存的方案</div>
                    ) : (
                      presets.map(p => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-800 cursor-pointer">
                          <span className="text-sm text-gray-300 flex-1" onClick={() => applyPreset(p)}>{p.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} className="p-1 hover:text-red-400 text-gray-500">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSaveModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" /> 保存方案
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">年龄段</label>
              <select
                value={filters.ageGroup}
                onChange={e => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {ageGroupOptions.map(o => <option key={o} value={o === '全部' ? '' : o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">位置</label>
              <select
                value={filters.position}
                onChange={e => setFilters(prev => ({ ...prev, position: e.target.value }))}
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
              >
                {positionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">身高范围 (cm)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.minHeight}
                  onChange={e => setFilters(prev => ({ ...prev, minHeight: e.target.value }))}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.maxHeight}
                  onChange={e => setFilters(prev => ({ ...prev, maxHeight: e.target.value }))}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">体重范围 (kg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={filters.minWeight}
                  onChange={e => setFilters(prev => ({ ...prev, minWeight: e.target.value }))}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={filters.maxWeight}
                  onChange={e => setFilters(prev => ({ ...prev, maxWeight: e.target.value }))}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setFilters({ ageGroup: '', position: '', minHeight: '', maxHeight: '', minWeight: '', maxWeight: '' });
                setSortBy('name');
                setSortOrder('asc');
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              重置
            </button>
            <button
              onClick={loadSelectionData}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">{filteredPlayers.length}</div>
            <div className="text-sm text-gray-400">候选球员</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {filteredPlayers.filter(p => p.weeklyAverage?.overall >= 4).length}
            </div>
            <div className="text-sm text-gray-400">高评分球员</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">
              {filteredPlayers.filter(p => p.physicalTest?.height > 0).length}
            </div>
            <div className="text-sm text-gray-400">有体测数据</div>
          </div>
          <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
            <div className="text-2xl font-bold text-white">{selectedIds.length}</div>
            <div className="text-sm text-gray-400">已选中</div>
          </div>
        </div>

        {/* 球员表格 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#0f1419]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-4 py-4">
                    <button onClick={toggleSelectAll} className="hover:text-emerald-400 transition-colors">
                      {selectedIds.length === filteredPlayers.length && filteredPlayers.length > 0 ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-4"><SortHeader field="name">球员</SortHeader></th>
                  <th className="px-4 py-4"><SortHeader field="age">年龄</SortHeader></th>
                  <th className="px-4 py-4">位置</th>
                  <th className="px-4 py-4"><SortHeader field="height">身高</SortHeader></th>
                  <th className="px-4 py-4"><SortHeader field="weight">体重</SortHeader></th>
                  <th className="px-4 py-4"><SortHeader field="weeklyOverall">周报评分</SortHeader></th>
                  <th className="px-4 py-4"><SortHeader field="matchCount">比赛场次</SortHeader></th>
                  <th className="px-4 py-4">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      加载中...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      暂无符合条件的球员
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map(player => (
                    <tr key={player.id} className="border-t border-gray-800 hover:bg-[#0f1419]/50 transition-colors">
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(player.id)} className="hover:text-emerald-400 transition-colors">
                          {selectedIds.includes(player.id) ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-semibold">
                            {player.name?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-xs text-gray-500">{player.ageGroup}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-300">{player.age} 岁</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${getPositionClass(player.position)}`}>
                          {player.positionName}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {player.physicalTest?.height ? `${player.physicalTest.height} cm` : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {player.physicalTest?.weight ? `${player.physicalTest.weight} kg` : '-'}
                      </td>
                      <td className="px-4 py-4">
                        {player.weeklyAverage?.overall > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${getScoreColor(player.weeklyAverage.overall)}`}>
                              {player.weeklyAverage.overall.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">({player.weeklyAverage.count}周)</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-300">{player.matchCount || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {shortlist.some(s => s.playerId === player.id) ? (
                            <button
                              onClick={() => removeFromShortlist(player.id)}
                              className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
                            >
                              <Bookmark className="w-3.5 h-3.5 fill-current" /> 已加入
                            </button>
                          ) : (
                            <button
                              onClick={() => addToShortlist(player.id)}
                              className="text-gray-400 hover:text-amber-400 text-sm font-medium flex items-center gap-1"
                            >
                              <Bookmark className="w-3.5 h-3.5" /> 加入候选
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedIds([player.id]); setCompareModalOpen(true); }}
                            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                          >
                            查看详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 保存方案弹窗 */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">保存筛选方案</h3>
            <input
              type="text"
              placeholder="输入方案名称"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setSaveModalOpen(false); setPresetName(''); }} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                取消
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 对比弹窗 */}
      {compareModalOpen && selectedPlayers.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1a1f2e] rounded-3xl border border-gray-800 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1f2e]">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-400" /> 球员对比
              </h3>
              <button onClick={() => setCompareModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-8">
              {/* 雷达图 */}
              <div className="bg-[#0f1419] rounded-2xl p-4 border border-gray-800">
                <ReactECharts option={radarOption} style={{ height: 400 }} />
              </div>

              {/* 指标对比表 */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm">
                      <th className="px-4 py-3 text-left">指标</th>
                      {selectedPlayers.map(p => (
                        <th key={p.id} className="px-4 py-3 text-center text-white font-medium">
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {[
                      { label: '年龄', key: 'age', suffix: '岁' },
                      { label: '位置', key: 'positionName' },
                      { label: '身高', get: (p: SelectionPlayer) => p.physicalTest?.height ? `${p.physicalTest.height} cm` : '-' },
                      { label: '体重', get: (p: SelectionPlayer) => p.physicalTest?.weight ? `${p.physicalTest.weight} kg` : '-' },
                      { label: '50米跑', get: (p: SelectionPlayer) => p.physicalTest?.sprint50m ? `${p.physicalTest.sprint50m}s` : '-' },
                      { label: '立定跳远', get: (p: SelectionPlayer) => p.physicalTest?.standingLongJump ? `${p.physicalTest.standingLongJump} cm` : '-' },
                      { label: '俯卧撑', get: (p: SelectionPlayer) => p.physicalTest?.pushUp ? `${p.physicalTest.pushUp} 个` : '-' },
                      { label: '仰卧起坐', get: (p: SelectionPlayer) => p.physicalTest?.sitUp ? `${p.physicalTest.sitUp} 个` : '-' },
                      { label: '态度评分', get: (p: SelectionPlayer) => p.weeklyAverage?.attitude ? p.weeklyAverage.attitude.toFixed(1) : '-' },
                      { label: '技术评分', get: (p: SelectionPlayer) => p.weeklyAverage?.technique ? p.weeklyAverage.technique.toFixed(1) : '-' },
                      { label: '战术评分', get: (p: SelectionPlayer) => p.weeklyAverage?.tactics ? p.weeklyAverage.tactics.toFixed(1) : '-' },
                      { label: '掌握度评分', get: (p: SelectionPlayer) => p.weeklyAverage?.knowledge ? p.weeklyAverage.knowledge.toFixed(1) : '-' },
                      { label: '综合评分', get: (p: SelectionPlayer) => p.weeklyAverage?.overall ? p.weeklyAverage.overall.toFixed(1) : '-' },
                      { label: '比赛场次', get: (p: SelectionPlayer) => `${p.matchCount || 0} 场` },
                    ].map((row, idx) => (
                      <tr key={row.label} className={idx % 2 === 0 ? 'bg-[#0f1419]/30' : ''}>
                        <td className="px-4 py-3 text-gray-300 font-medium">{row.label}</td>
                        {selectedPlayers.map(p => (
                          <td key={p.id} className="px-4 py-3 text-center text-gray-300">
                            {row.get ? row.get(p) : (p as unknown as Record<string, string | number>)[row.key!]}{row.suffix || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 候选名单侧滑面板 */}
      {shortlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShortlistOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-[#1a1f2e] border-l border-gray-800 shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" /> 候选名单
              </h3>
              <button onClick={() => setShortlistOpen(false)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {shortlistPlayers.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无候选球员</p>
                  <p className="text-sm mt-1">在表格中点击「加入候选」即可添加</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shortlistPlayers.map(player => {
                    const item = shortlist.find(s => s.playerId === player.id);
                    return (
                      <div key={player.id} className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-semibold">
                              {player.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="text-white font-medium">{player.name}</div>
                              <div className="text-xs text-gray-500">{player.ageGroup} · {player.positionName}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromShortlist(player.id)}
                            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-gray-500 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          身高 {player.physicalTest?.height || '-'} cm · 体重 {player.physicalTest?.weight || '-'} kg · 评分 {player.weeklyAverage?.overall ? player.weeklyAverage.overall.toFixed(1) : '-'}
                        </div>
                        <input
                          type="text"
                          placeholder="添加备注..."
                          value={item?.note || ''}
                          onChange={e => updateShortlistNote(player.id, e.target.value)}
                          className="w-full bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {shortlistPlayers.length > 0 && (
              <div className="p-6 border-t border-gray-800 space-y-3">
                <button
                  onClick={() => {
                    setShortlistOpen(false);
                    setExportModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> 导出候选名单
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('确定清空候选名单？')) return;
                    const ids = shortlist.map(s => s.playerId);
                    setShortlist([]);
                    try {
                      await Promise.all(ids.map(id => clubApi.removeFromShortlist(id)));
                    } catch (err) {
                      console.error('清空候选名单失败:', err);
                      toast.error('部分球员移除失败，请刷新后重试');
                      loadShortlist();
                    }
                  }}
                  className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
                >
                  清空名单
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ExportComplianceModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onConfirm={(purpose, note) => {
          setExportModalOpen(false);
          if (shortlistPlayers.length > 0 && shortlistOpen) {
            exportShortlistCSV(purpose, note);
          } else {
            exportCSV(purpose, note);
          }
        }}
        clubName={clubName}
        title={shortlistPlayers.length > 0 && shortlistOpen ? "候选名单导出确认" : "选材名单导出确认"}
      />
    </div>
  );
};

function getPositionClass(pos: string) {
  const map: Record<string, string> = {
    forward: 'bg-red-500/20 text-red-300',
    midfielder: 'bg-blue-500/20 text-blue-300',
    defender: 'bg-green-500/20 text-green-300',
    goalkeeper: 'bg-yellow-500/20 text-yellow-300',
  };
  return map[pos] || 'bg-gray-500/20 text-gray-300';
}

function getScoreColor(score: number) {
  if (score >= 4.5) return 'text-emerald-400';
  if (score >= 4) return 'text-blue-400';
  if (score >= 3) return 'text-yellow-400';
  return 'text-gray-400';
}

export default PlayerSelection;
