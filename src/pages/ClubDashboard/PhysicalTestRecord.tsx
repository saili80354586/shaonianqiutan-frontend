import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, SkipForward, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ptApi } from '../../services/api';
import { PhysicalTestTooltip } from '../../components/ui/PhysicalTestTooltip';

const ALL_ITEM_LABELS: Record<string, { name: string; unit: string; step?: string }> = {
  height: { name: '身高', unit: 'cm', step: '0.1' },
  weight: { name: '体重', unit: 'kg', step: '0.1' },
  bmi: { name: 'BMI', unit: '', step: '0.1' },
  sprint_30m: { name: '30米跑', unit: '秒', step: '0.01' },
  sprint_50m: { name: '50米跑', unit: '秒', step: '0.01' },
  sprint_100m: { name: '100米跑', unit: '秒', step: '0.01' },
  agility_ladder: { name: '敏捷梯', unit: '秒', step: '0.01' },
  t_test: { name: 'T型跑', unit: '秒', step: '0.01' },
  shuttle_run: { name: '折返跑', unit: '秒', step: '0.01' },
  standing_long_jump: { name: '立定跳远', unit: 'cm', step: '0.1' },
  vertical_jump: { name: '纵跳', unit: 'cm', step: '0.1' },
  sit_and_reach: { name: '坐位体前屈', unit: 'cm', step: '0.1' },
  push_up: { name: '俯卧撑', unit: '个', step: '1' },
  sit_up: { name: '仰卧起坐', unit: '个/分钟', step: '1' },
  plank: { name: '平板支撑', unit: '秒', step: '1' },
};

interface RecordItem {
  id: number;
  playerId: number;
  playerName: string;
  playerAvatar: string;
  testDate: string;
  status: string;
  data: Record<string, number>;
  recordProgress: { total: number; completed: number };
}

interface PhysicalTestRecordProps {
  testId?: number | null;
  onBack?: () => void;
}

const PhysicalTestRecord: React.FC<PhysicalTestRecordProps> = ({ testId, onBack }) => {
  const navigate = useNavigate();
  const params = useParams();
  const routeTestId = Number(params.id);
  const resolvedTestId = testId ?? (Number.isFinite(routeTestId) && routeTestId > 0 ? routeTestId : null);
  const handleBack = onBack || (() => navigate('/club/physical-tests'));
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [templateItems, setTemplateItems] = useState<string[]>([]);
  const [testName, setTestName] = useState('');

  useEffect(() => {
    if (resolvedTestId) {
      loadTestDetail();
      loadRecords();
    } else {
      setLoading(false);
    }
  }, [resolvedTestId]);

  const loadTestDetail = async () => {
    if (!resolvedTestId) return;
    try {
      const res = await ptApi.getPhysicalTestDetail(resolvedTestId);
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setTestName(data.name || '');
        setTemplateItems(data.templateItems || []);
      }
    } catch (error) {
      console.error('加载体测详情失败:', error);
    }
  };

  const loadRecords = async () => {
    if (!resolvedTestId) return;
    setLoading(true);
    try {
      const res = await ptApi.getPhysicalTestRecords(resolvedTestId);
      if (res.data?.success && res.data?.data) {
        setRecords(res.data.data.list || []);
      }
    } catch (error) {
      console.error('加载体测数据失败:', error);
      setRecords([]);
    }
    setLoading(false);
  };

  const currentRecord = records[currentIndex];
  const progress = currentRecord ? currentRecord.recordProgress : { total: templateItems.length || 1, completed: 0 };
  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const handleInputChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveAndNext = async () => {
    if (!currentRecord || !resolvedTestId) return;
    setSaving(true);
    try {
      const res = await ptApi.createPhysicalTestRecord(resolvedTestId, {
        playerId: currentRecord.playerId,
        data: formData,
      });
      if (res.data?.success) {
        // 更新本地状态
        setRecords(prev => prev.map((r, i) =>
          i === currentIndex ? { ...r, status: 'completed', data: formData } : r
        ));
        // 跳到下一个
        if (currentIndex < records.length - 1) {
          setCurrentIndex(i => i + 1);
          setFormData({});
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
    setSaving(false);
  };

  const handleSkip = () => {
    if (currentIndex < records.length - 1) {
      setCurrentIndex(i => i + 1);
      setFormData({});
    }
  };

  const itemLabels = templateItems.map(key => ({
    key,
    ...ALL_ITEM_LABELS[key],
  })).filter(item => item.name);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-8">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-5 h-5" /> 返回
        </button>
        <div className="text-center text-gray-400 py-12">暂无球员数据</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" /> 返回
            </button>
            {testName && <span className="text-white font-medium">{testName}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              进度: {currentIndex + 1} / {records.length}
            </span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${((currentIndex + 1) / records.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 球员列表 */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-3 pb-2">
            {records.map((record, index) => (
              <div
                key={record.id}
                onClick={() => { setCurrentIndex(index); setFormData(record.data || {}); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl cursor-pointer transition-colors ${
                  index === currentIndex
                    ? 'bg-emerald-500 text-white'
                    : record.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {record.status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">{record.playerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 当前球员录入 */}
        {currentRecord && (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {currentRecord.playerName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{currentRecord.playerName}</h2>
                  <p className="text-gray-400 text-sm">
                    {currentRecord.status === 'completed' ? '已完成录入' : '待录入'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl transition-colors"
              >
                跳过 <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* 录入进度 */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">录入进度</span>
                <span className="text-white">{progress.completed}/{progress.total} 项</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 数据录入表单 - 根据模板动态渲染 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {itemLabels.map(({ key, name, unit, step }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    {name} {unit && <span className="text-gray-500">({unit})</span>}
                    <PhysicalTestTooltip itemKey={key} compact />
                  </label>
                  <input
                    type="number"
                    step={step || '0.1'}
                    value={formData[key] ?? ''}
                    onChange={e => handleInputChange(key, e.target.value)}
                    placeholder={`输入${name}`}
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>

            {/* 保存按钮 */}
            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={handleSaveAndNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {saving ? '保存中...' : currentIndex < records.length - 1 ? '保存并下一个' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalTestRecord;
