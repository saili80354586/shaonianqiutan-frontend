import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Check, Plus, X, Trash2 } from 'lucide-react';
import { ptApi } from '../../services/api';

const ALL_TEST_ITEMS = [
  { key: 'height', name: '身高', unit: 'cm', category: '基础指标' },
  { key: 'weight', name: '体重', unit: 'kg', category: '基础指标' },
  { key: 'bmi', name: 'BMI', unit: '', category: '基础指标' },
  { key: 'sprint_30m', name: '30米跑', unit: '秒', category: '速度类' },
  { key: 'sprint_50m', name: '50米跑', unit: '秒', category: '速度类' },
  { key: 'sprint_100m', name: '100米跑', unit: '秒', category: '速度类' },
  { key: 'agility_ladder', name: '敏捷梯', unit: '秒', category: '灵敏类' },
  { key: 't_test', name: 'T型跑', unit: '秒', category: '灵敏类' },
  { key: 'shuttle_run', name: '折返跑', unit: '秒', category: '灵敏类' },
  { key: 'standing_long_jump', name: '立定跳远', unit: 'cm', category: '爆发类' },
  { key: 'vertical_jump', name: '纵跳', unit: 'cm', category: '爆发类' },
  { key: 'sit_and_reach', name: '坐位体前屈', unit: 'cm', category: '柔韧类' },
  { key: 'push_up', name: '俯卧撑', unit: '个', category: '力量类' },
  { key: 'sit_up', name: '仰卧起坐', unit: '个/分钟', category: '力量类' },
  { key: 'plank', name: '平板支撑', unit: '秒', category: '力量类' },
];

const BUILTIN_TEMPLATES = [
  {
    id: 'basic',
    name: '基础版',
    description: '适合快速筛查',
    items: ['身高', '体重', 'BMI', '30米跑'],
    itemKeys: ['height', 'weight', 'bmi', 'sprint_30m'],
    color: 'gray',
  },
  {
    id: 'advanced',
    name: '进阶版',
    description: '常规训练评估（推荐）',
    items: ['身高', '体重', 'BMI', '30米跑', '折返跑', '立定跳远', '坐位体前屈'],
    itemKeys: ['height', 'weight', 'bmi', 'sprint_30m', 'shuttle_run', 'standing_long_jump', 'sit_and_reach'],
    color: 'emerald',
  },
  {
    id: 'professional',
    name: '专业版',
    description: '全面能力评估',
    items: ['身高', '体重', 'BMI', '30米跑', '50米跑', '敏捷梯', 'T型跑', '折返跑', '立定跳远', '纵跳', '坐位体前屈', '俯卧撑', '仰卧起坐', '平板支撑'],
    itemKeys: ['height', 'weight', 'bmi', 'sprint_30m', 'sprint_50m', 'agility_ladder', 't_test', 'shuttle_run', 'standing_long_jump', 'vertical_jump', 'sit_and_reach', 'push_up', 'sit_up', 'plank'],
    color: 'blue',
  },
];

interface CustomTemplate {
  id: number;
  name: string;
  description?: string;
  items: string[];
  itemCount: number;
}

interface PhysicalTestPayload {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  template: string;
  playerScope: string;
  notifyParents: boolean;
  autoSendReport: boolean;
  customTemplateId?: number;
}

interface CreatePhysicalTestProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const CreatePhysicalTest: React.FC<CreatePhysicalTestProps> = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    template: 'advanced',
    customTemplateId: 0,
    notifyParents: true,
    autoSendReport: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'builtin' | 'custom'>('all');

  // 新建自定义模板弹窗
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', description: '' });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => {
    loadCustomTemplates();
  }, []);

  const loadCustomTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await ptApi.getCustomTemplates();
      if (res.data?.success && res.data?.data) {
        setCustomTemplates(res.data.data.list || []);
      }
    } catch (err) {
      console.error('加载自定义模板失败:', err);
    }
    setTemplatesLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('请输入活动名称');
      return;
    }
    if (!form.startDate) {
      setError('请选择体测时间');
      return;
    }
    if (form.template === 'custom' && form.customTemplateId === 0) {
      setError('请选择自定义模板');
      return;
    }

    setLoading(true);
    try {
      const payload: PhysicalTestPayload = {
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        location: form.location || undefined,
        template: form.template,
        playerScope: 'all',
        notifyParents: form.notifyParents,
        autoSendReport: form.autoSendReport,
      };
      if (form.template === 'custom' && form.customTemplateId > 0) {
        payload.customTemplateId = form.customTemplateId;
      }

      const res = await ptApi.createPhysicalTest(payload);

      if (res.data?.success) {
        onSuccess?.();
        window.location.href = '/club/physical-tests';
      } else {
        setError(res.data?.error?.message || '创建失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试');
    }
    setLoading(false);
  };

  const handleCreateCustomTemplate = async () => {
    if (!customForm.name.trim()) {
      setError('请输入模板名称');
      return;
    }
    if (selectedItems.length === 0) {
      setError('请至少选择一个测试项目');
      return;
    }
    setCustomSaving(true);
    setError('');
    try {
      const res = await ptApi.createCustomTemplate({
        name: customForm.name,
        description: customForm.description,
        items: selectedItems,
      });
      if (res.data?.success) {
        await loadCustomTemplates();
        setShowCustomModal(false);
        setCustomForm({ name: '', description: '' });
        setSelectedItems([]);
      } else {
        setError(res.data?.error?.message || '保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
    setCustomSaving(false);
  };

  const handleDeleteCustomTemplate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('确定删除该自定义模板吗？')) return;
    try {
      await ptApi.deleteCustomTemplate(id);
      await loadCustomTemplates();
      if (form.customTemplateId === id) {
        setForm(f => ({ ...f, template: 'advanced', customTemplateId: 0 }));
      }
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const toggleItem = (key: string) => {
    setSelectedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getSelectedTemplateItems = () => {
    if (form.template === 'custom' && form.customTemplateId > 0) {
      const tmpl = customTemplates.find(t => t.id === form.customTemplateId);
      if (tmpl) {
        return tmpl.items.map(key => ALL_TEST_ITEMS.find(i => i.key === key)?.name || key);
      }
    }
    const builtin = BUILTIN_TEMPLATES.find(t => t.id === form.template);
    return builtin ? builtin.items : [];
  };

  const displayedTemplates = [
    ...(templateFilter !== 'custom' ? BUILTIN_TEMPLATES : []),
    ...(templateFilter !== 'builtin' ? customTemplates.map(t => ({
      id: `custom-${t.id}`,
      name: t.name,
      description: t.description || '自定义模板',
      items: t.items.map(key => ALL_TEST_ITEMS.find(i => i.key === key)?.name || key),
      itemKeys: t.items,
      color: 'purple',
      isCustom: true,
      customId: t.id,
    })) : []),
  ];

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="max-w-3xl mx-auto p-8">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">创建体测活动</h1>
            <p className="text-gray-400 mt-1">为俱乐部球员创建体测活动</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* 基本信息 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">基本信息</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  活动名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="如：春季体能测试、季度评估"
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">活动描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="简要描述本次体测的目的..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    开始日期 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">结束日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">体测地点</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="如：俱乐部训练场"
                    className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 体测模板 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">体测模板</h2>
              <div className="flex items-center gap-2 bg-[#0f1419] rounded-lg p-1">
                {[
                  { key: 'all', label: '全部' },
                  { key: 'builtin', label: '系统模板' },
                  { key: 'custom', label: '我的模板' },
                ].map((f: { key: 'all' | 'builtin' | 'custom'; label: string }) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setTemplateFilter(f.key)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      templateFilter === f.key
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayedTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    if (template.isCustom) {
                      setForm(f => ({ ...f, template: 'custom', customTemplateId: template.customId }));
                    } else {
                      setForm(f => ({ ...f, template: template.id, customTemplateId: 0 }));
                    }
                  }}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    (template.isCustom && form.template === 'custom' && form.customTemplateId === template.customId) ||
                    (!template.isCustom && form.template === template.id)
                      ? `border-${template.color}-500 bg-${template.color}-500/10`
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {template.isCustom && (
                    <button
                      type="button"
                      onClick={e => handleDeleteCustomTemplate(e, template.customId)}
                      className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center justify-between mb-2 pr-6">
                    <span className="font-medium text-white">{template.name}</span>
                    {(template.isCustom && form.template === 'custom' && form.customTemplateId === template.customId) ||
                    (!template.isCustom && form.template === template.id) ? (
                      <Check className={`w-5 h-5 text-${template.color}-400`} />
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.items.slice(0, 3).map((item: string) => (
                      <span key={item} className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                        {item}
                      </span>
                    ))}
                    {template.items.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-gray-400">+{template.items.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* 新建自定义模板卡片 */}
              {templateFilter !== 'builtin' && (
                <div
                  onClick={() => setShowCustomModal(true)}
                  className="p-4 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-400 cursor-pointer transition-all flex flex-col items-center justify-center text-gray-400 hover:text-white min-h-[120px]"
                >
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">新建自定义模板</span>
                </div>
              )}
            </div>

            {/* 选中模板的完整项目 */}
            <div className="mt-4 p-4 bg-[#0f1419] rounded-xl">
              <p className="text-sm text-gray-400 mb-2">
                {form.template === 'custom'
                  ? customTemplates.find(t => t.id === form.customTemplateId)?.name || '自定义'
                  : BUILTIN_TEMPLATES.find(t => t.id === form.template)?.name || '进阶版'}
                包含项目：
              </p>
              <div className="flex flex-wrap gap-2">
                {getSelectedTemplateItems().map((item: string) => (
                  <span key={item} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 通知设置 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">通知设置</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyParents}
                  onChange={e => setForm(f => ({ ...f, notifyParents: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white">自动发送体测通知给家长</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoSendReport}
                  onChange={e => setForm(f => ({ ...f, autoSendReport: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white">体测完成后自动生成报告并推送</span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建活动'}
            </button>
          </div>
        </form>
      </div>

      {/* 新建自定义模板弹窗 */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">新建自定义模板</h3>
              <button
                type="button"
                onClick={() => { setShowCustomModal(false); setError(''); }}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">模板名称 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={customForm.name}
                    onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="如：U10速度专项"
                    className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">模板描述</label>
                  <input
                    type="text"
                    value={customForm.description}
                    onChange={e => setCustomForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="简要描述该模板的用途..."
                    className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    选择测试项目 <span className="text-red-400">*</span>
                    <span className="text-gray-500 font-normal ml-2">（已选 {selectedItems.length} 项）</span>
                  </label>
                  <div className="space-y-3">
                    {['基础指标', '速度类', '灵敏类', '爆发类', '柔韧类', '力量类'].map(category => {
                      const categoryItems = ALL_TEST_ITEMS.filter(i => i.category === category);
                      if (categoryItems.length === 0) return null;
                      return (
                        <div key={category}>
                          <div className="text-xs text-gray-500 mb-1">{category}</div>
                          <div className="flex flex-wrap gap-2">
                            {categoryItems.map(item => {
                              const selected = selectedItems.includes(item.key);
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => toggleItem(item.key)}
                                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                    selected
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                      : 'bg-[#0f1419] border-gray-700 text-gray-300 hover:border-gray-500'
                                  }`}
                                >
                                  {item.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="p-3 bg-[#0f1419] rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">已选项目预览</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(key => {
                        const item = ALL_TEST_ITEMS.find(i => i.key === key);
                        return (
                          <span key={key} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">
                            {item?.name || key}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => { setShowCustomModal(false); setError(''); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateCustomTemplate}
                disabled={customSaving}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {customSaving ? '保存中...' : '保存模板'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePhysicalTest;
