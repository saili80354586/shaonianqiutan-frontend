import React, { useState, useEffect, useCallback } from 'react';
import { Ruler, Timer, Dumbbell, Activity, Save, X, Pencil, Trash2, Plus, ChevronDown, HelpCircle } from 'lucide-react';
import { playerApi } from '../../../../services/api';
import toast from 'react-hot-toast';
import { PhysicalTestTooltip } from '../../../../components/ui/PhysicalTestTooltip';

// ===== 类型定义 =====

interface PhysicalTestRecord {
  id: number;
  test_date: string;
  sprint_30m?: number;
  sprint_50m?: number;
  sprint_100m?: number;
  standing_long_jump?: number;
  push_up?: number;
  sit_and_reach?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  agility_ladder?: number;
  t_test?: number;
  shuttle_run?: number;
  vertical_jump?: number;
  sit_up?: number;
  plank?: number;
  created_at: string;
}

interface TestItemConfig {
  key: string;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  placeholder: string;
  step?: string;
}

const TEST_ITEMS: TestItemConfig[] = [
  { key: 'sprint30m', label: '30米冲刺', unit: '秒', icon: Timer, color: 'text-orange-400', bgColor: 'bg-orange-500/20', placeholder: '4.8', step: '0.1' },
  { key: 'sprint50m', label: '50米冲刺', unit: '秒', icon: Timer, color: 'text-orange-300', bgColor: 'bg-orange-500/10', placeholder: '7.5', step: '0.1' },
  { key: 'sprint100m', label: '100米冲刺', unit: '秒', icon: Timer, color: 'text-orange-200', bgColor: 'bg-orange-500/5', placeholder: '14.5', step: '0.1' },
  { key: 'agilityLadder', label: '敏捷梯', unit: '秒', icon: Timer, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', placeholder: '6.5', step: '0.1' },
  { key: 'tTest', label: 'T型跑', unit: '秒', icon: Timer, color: 'text-yellow-300', bgColor: 'bg-yellow-500/10', placeholder: '9.8', step: '0.1' },
  { key: 'shuttleRun', label: '折返跑', unit: '秒', icon: Timer, color: 'text-red-400', bgColor: 'bg-red-500/20', placeholder: '10.2', step: '0.1' },
  { key: 'standingLongJump', label: '立定跳远', unit: 'cm', icon: Dumbbell, color: 'text-blue-400', bgColor: 'bg-blue-500/20', placeholder: '198' },
  { key: 'verticalJump', label: '纵跳', unit: 'cm', icon: Dumbbell, color: 'text-blue-300', bgColor: 'bg-blue-500/10', placeholder: '45' },
  { key: 'sitAndReach', label: '坐位体前屈', unit: 'cm', icon: Activity, color: 'text-purple-400', bgColor: 'bg-purple-500/20', placeholder: '12', step: '0.1' },
  { key: 'pushUp', label: '俯卧撑', unit: '个', icon: Ruler, color: 'text-green-400', bgColor: 'bg-green-500/20', placeholder: '15' },
  { key: 'sitUp', label: '仰卧起坐', unit: '个/min', icon: Ruler, color: 'text-green-300', bgColor: 'bg-green-500/10', placeholder: '30' },
  { key: 'plank', label: '平板支撑', unit: '秒', icon: Ruler, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', placeholder: '60' },
];

// 卡片展示项（key 必须与 PhysicalTestRecord 接口字段名一致，即 snake_case）
const DISPLAY_ITEMS = [
  { key: 'sprint_30m', label: '30米跑', unit: '秒', icon: Timer, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { key: 'sprint_50m', label: '50米跑', unit: '秒', icon: Timer, color: 'text-orange-300', bgColor: 'bg-orange-500/10' },
  { key: 'sprint_100m', label: '100米跑', unit: '秒', icon: Timer, color: 'text-orange-200', bgColor: 'bg-orange-500/5' },
  { key: 'agility_ladder', label: '敏捷梯', unit: '秒', icon: Timer, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'standing_long_jump', label: '立定跳远', unit: 'cm', icon: Dumbbell, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'push_up', label: '俯卧撑', unit: '个', icon: Ruler, color: 'text-green-400', bgColor: 'bg-green-500/20' },
];

// 所有可展示字段（用于展开详情）
const ALL_DISPLAY_FIELDS = [
  { key: 'sprint_30m', label: '30米跑', unit: '秒' },
  { key: 'sprint_50m', label: '50米跑', unit: '秒' },
  { key: 'sprint_100m', label: '100米跑', unit: '秒' },
  { key: 'agility_ladder', label: '敏捷梯', unit: '秒' },
  { key: 't_test', label: 'T型跑', unit: '秒' },
  { key: 'shuttle_run', label: '折返跑', unit: '秒' },
  { key: 'standing_long_jump', label: '立定跳远', unit: 'cm' },
  { key: 'vertical_jump', label: '纵跳', unit: 'cm' },
  { key: 'sit_and_reach', label: '坐位体前屈', unit: 'cm' },
  { key: 'push_up', label: '俯卧撑', unit: '个' },
  { key: 'sit_up', label: '仰卧起坐', unit: '个/min' },
  { key: 'plank', label: '平板支撑', unit: '秒' },
];

// 表单初始值
const emptyForm = () => ({
  test_date: new Date().toISOString().split('T')[0],
  sprint30m: '',
  sprint50m: '',
  sprint100m: '',
  standingLongJump: '',
  pushUp: '',
  sitUp: '',
  sitAndReach: '',
  verticalJump: '',
  agilityLadder: '',
  tTest: '',
  shuttleRun: '',
  plank: '',
  height: '',
  weight: '',
});

/** 表单字段名 (camelCase) → 数据库字段名 (snake_case) 映射 */
function getFormKeyToApiKey(formKey: string): string {
  const map: Record<string, string> = {
    sprint30m: 'sprint_30m',
    sprint50m: 'sprint_50m',
    sprint100m: 'sprint_100m',
    standingLongJump: 'standing_long_jump',
    pushUp: 'push_up',
    sitUp: 'sit_up',
    sitAndReach: 'sit_and_reach',
    verticalJump: 'vertical_jump',
    agilityLadder: 'agility_ladder',
    tTest: 't_test',
    shuttleRun: 'shuttle_run',
    plank: 'plank',
    height: 'height',
    weight: 'weight',
  };
  return map[formKey] || formKey;
}

// ===== 组件 =====

interface PhysicalTestSectionProps {
  isEditing: boolean;
  latestTest?: any; // 兼容旧接口
  onUpdate?: () => void;
}

export const PhysicalTestSection: React.FC<PhysicalTestSectionProps> = ({ isEditing, latestTest, onUpdate }) => {
  // 状态
  const [records, setRecords] = useState<PhysicalTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [editId, setEditId] = useState<number | null>(null); // 编辑模式下的记录ID
  const [expandedId, setExpandedId] = useState<number | null>(null); // 展开详情的记录ID
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 加载体测记录
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await playerApi.getPhysicalTests();
      if (res.data?.success && res.data?.data) {
        setRecords(res.data.data.records || []);
      }
    } catch (error) {
      console.error('加载体测记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // 构建提交数据
  const buildSubmitData = (form: typeof formData) => {
    const data: Record<string, any> = { test_date: form.test_date };
    const fieldMap: Record<string, [string, (v: string) => any]> = {
      sprint30m: ['sprint_30m', v => parseFloat(v)],
      sprint50m: ['sprint_50m', v => parseFloat(v)],
      sprint100m: ['sprint_100m', v => parseFloat(v)],
      standingLongJump: ['standing_long_jump', v => parseFloat(v)],
      pushUp: ['push_up', v => parseInt(v)],
      sitUp: ['sit_up', v => parseInt(v)],
      sitAndReach: ['sit_and_reach', v => parseFloat(v)],
      verticalJump: ['vertical_jump', v => parseFloat(v)],
      agilityLadder: ['agility_ladder', v => parseFloat(v)],
      tTest: ['t_test', v => parseFloat(v)],
      shuttleRun: ['shuttle_run', v => parseFloat(v)],
      plank: ['plank', v => parseInt(v)],
      height: ['height', v => parseFloat(v)],
      weight: ['weight', v => parseFloat(v)],
    };
    for (const [field, [apiKey, parser]] of Object.entries(fieldMap)) {
      const formKey = field as keyof ReturnType<typeof emptyForm>;
      const value = form[formKey];
      if (value) data[apiKey] = parser(value);
    }
    return data;
  };

  // 创建或更新
  const handleSave = async () => {
    try {
      setSaving(true);
      const data = buildSubmitData(formData);

      if (editId !== null) {
        await playerApi.updatePhysicalTest(editId, data);
        toast.success('体测记录已更新');
      } else {
        await playerApi.createPhysicalTest(data);
        toast.success('体测数据已保存');
      }

      setShowForm(false);
      setEditId(null);
      setFormData(emptyForm());
      loadRecords();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 开始编辑
  const handleEdit = (record: PhysicalTestRecord) => {
    setFormData({
      test_date: record.test_date,
      sprint30m: record.sprint_30m?.toString() ?? '',
      sprint50m: record.sprint_50m?.toString() ?? '',
      sprint100m: record.sprint_100m?.toString() ?? '',
      standingLongJump: record.standing_long_jump?.toString() ?? '',
      pushUp: record.push_up?.toString() ?? '',
      sitUp: record.sit_up?.toString() ?? '',
      sitAndReach: record.sit_and_reach?.toString() ?? '',
      verticalJump: record.vertical_jump?.toString() ?? '',
      agilityLadder: record.agility_ladder?.toString() ?? '',
      tTest: record.t_test?.toString() ?? '',
      shuttleRun: record.shuttle_run?.toString() ?? '',
      plank: record.plank?.toString() ?? '',
      height: record.height?.toString() ?? '',
      weight: record.weight?.toString() ?? '',
    });
    setEditId(record.id);
    setShowForm(true);
  };

  // 删除
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await playerApi.deletePhysicalTest(deleteConfirmId);
      toast.success('已删除');
      setDeleteConfirmId(null);
      if (expandedId === deleteConfirmId) setExpandedId(null);
      loadRecords();
      onUpdate?.();
    } catch {
      toast.error('删除失败');
    }
  };

  // 取消表单
  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormData(emptyForm());
  };

  // 获取最新记录（用于顶部卡片）
  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      {/* 标题栏 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Ruler className="w-5 h-5 text-green-400" />
          体测数据
          {!loading && records.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({records.length}条记录)</span>
          )}
        </h3>
        {isEditing && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            记录体测
          </button>
        )}
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 录入/编辑表单 */}
      {showForm && (
        <div className="mb-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600">
          <h4 className="text-white font-medium mb-3">{editId ? '编辑体测数据' : '录入最新体测数据'}</h4>
          
          {/* 测试日期 */}
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">测试日期</label>
            <input
              type="date"
              value={formData.test_date}
              onChange={e => setFormData(p => ({ ...p, test_date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm max-w-[200px]"
            />
          </div>

          {/* 身高体重 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">身高(cm)</label>
              <input type="number" value={formData.height} onChange={e => setFormData(p => ({...p, height: e.target.value}))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" placeholder="155" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">体重(kg)</label>
              <input type="number" value={formData.weight} onChange={e => setFormData(p => ({...p, weight: e.target.value}))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" placeholder="45" />
            </div>
          </div>

          {/* 体测指标 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {TEST_ITEMS.map(item => (
              <div key={item.key}>
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
                  {item.label}({item.unit})
                  <PhysicalTestTooltip itemKey={getFormKeyToApiKey(item.key)} compact />
                </label>
                <input
                  type="number" step={item.step}
                  value={(formData as any)[item.key]}
                  onChange={e => setFormData(p => ({ ...p, [item.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? '更新' : '保存'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm flex items-center gap-2">
              <X className="w-4 h-4" />取消
            </button>
          </div>
        </div>
      )}

      {/* 最新记录概览卡片 */}
      {!loading && latestRecord && (
        <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-emerald-400 font-medium">📊 最新体测 · {latestRecord.test_date}</span>
            {isEditing && (
              <div className="flex gap-2">
                <button onClick={() => handleEdit(latestRecord)} className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors" title="编辑">
                  <Pencil className="w-4 h-4 text-blue-400" />
                </button>
                <button onClick={() => setDeleteConfirmId(latestRecord.id)} className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors" title="删除">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DISPLAY_ITEMS.map(item => {
              const Icon = item.icon;
              const val = (latestRecord as any)[item.key];
              const hasValue = val !== undefined && val !== null && val !== 0;
              return (
                <div key={item.key} className="p-3 bg-slate-700/20 rounded-lg text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className={`text-xl font-bold ${hasValue ? 'text-white' : 'text-slate-600'}`}>
                    {hasValue ? val : '-'}
                    {hasValue && <span className="text-xs text-slate-400 font-normal ml-0.5">{item.unit}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 历史记录列表 */}
      {!loading && records.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-400">历史记录</h4>
          </div>
          {records.slice(1).map((record) => {
            const expanded = expandedId === record.id;
            const hasAnyData = ALL_DISPLAY_FIELDS.some(item => {
              const val = (record as any)[item.key];
              return val !== undefined && val !== null && val !== 0;
            });
            
            return (
              <div key={record.id} className="bg-slate-700/20 rounded-xl border border-slate-700/30 overflow-hidden">
                {/* 记录头部 */}
                <div 
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/40 transition-colors ${expanded ? 'bg-slate-700/40' : ''}`}
                  onClick={() => setExpandedId(expanded ? null : record.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <span className="text-sm text-slate-300 font-medium">{record.test_date}</span>
                    {record.bmi && <span className="text-xs text-slate-500">BMI: {record.bmi.toFixed(1)}</span>}
                  </div>
                  
                  {isEditing && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(record)} className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors" title="编辑">
                        <Pencil className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(record.id)} className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors" title="删除">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 展开详情 */}
                {expanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-slate-700/30">
                    {hasAnyData ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pt-3">
                        {ALL_DISPLAY_FIELDS.map(item => {
                          const val = (record as any)[item.key];
                          const hasVal = val !== undefined && val !== null && val !== 0;
                          return (
                            <div key={item.key} className="text-center">
                              <p className="text-slate-500 text-xs">{item.label}</p>
                              <p className={`text-sm font-medium ${hasVal ? 'text-white' : 'text-slate-600'}`}>
                                {hasVal ? `${val}${item.unit}` : '-'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm pt-2">暂无详细数据</p>
                    )}
                    <p className="text-slate-600 text-xs mt-2">录入时间: {record.created_at}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!loading && records.length === 0 && !showForm && (
        <div className="py-8 text-center">
          <Ruler className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-slate-500 text-sm">暂无体测记录</p>
          {isEditing && (
            <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm">
              录入第一条体测数据
            </button>
          )}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">确认删除？</h3>
            <p className="text-slate-400 text-sm mb-4">删除后无法恢复此条体测记录。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm">取消</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-xl">
        <p className="text-xs text-slate-500">
          💡 体测数据独立存储，支持多次记录追踪成长轨迹。持续记录有助于科学训练和潜力评估。
        </p>
      </div>
    </div>
  );
};

export default PhysicalTestSection;
