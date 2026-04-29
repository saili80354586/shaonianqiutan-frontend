import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Target, Sparkles, TrendingUp, Layout, Plus, CheckCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { matchSummaryApi } from '../../../services/api';
import { TacticBoard } from '../../../components/tactics/TacticBoard';
import type { TacticScenario } from '@/components/tactics';

const STORAGE_KEY = 'match_self_review_data';
const RESULT_KEY = 'match_self_review_result';

// 表单状态持久化 key（防止跳转战术板后数据丢失）
const FORM_STATE_KEY = 'self_review_form_state';

interface ReviewData {
  matchSummaryId: number;
  matchName: string;
}

export const MatchSelfReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const reviewData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as ReviewData;

  const [formData, setFormData] = useState({
    performance: '',
    goals: 0,
    assists: 0,
    saves: 0,
    highlights: '',
    improvements: '',
    nextGoals: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // 战术板状态
  const [tacticScenarios, setTacticScenarios] = useState<TacticScenario[]>([]);
  const [tacticEditorOpen, setTacticEditorOpen] = useState(false);
  const [editingScenarioIndex, setEditingScenarioIndex] = useState<number | null>(null);

  // ══════════════════════════════════
  // 表单数据持久化：跳转战术板前后自动保存/恢复
  // ══════════════════════════════════

  /** 将当前表单状态存入 sessionStorage */
  const saveFormState = () => {
    try {
      sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify({ formData, tacticScenarios }));
    } catch { /* ignore quota */ }
  };

  /** 从 sessionStorage 恢复表单状态（如果有） */
  const restoreFormState = () => {
    try {
      const raw = sessionStorage.getItem(FORM_STATE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.formData) setFormData(saved.formData);
        if (saved.tacticScenarios) setTacticScenarios(saved.tacticScenarios);
      }
    } catch { /* ignore */ }
  };

  // 防止 React 18 Strict Mode 双重执行导致战术板数据被旧数据覆盖
  const initDone = useRef(false);

  // 统一初始化 useEffect：先消费战术板返回结果，再恢复表单持久化数据
  // 关键：必须在一个 effect 中按顺序执行，避免两个独立 effect 的竞态条件
  useEffect(() => {
    // 防止 Strict Mode 双重调用（开发模式 mount → unmount → remount）
    if (initDone.current) return;
    initDone.current = true;

    // Step 1: 优先消费战术编辑页的返回结果
    const tacticRaw = sessionStorage.getItem('tactic_edit_result');
    if (tacticRaw) {
      try {
        const data = JSON.parse(tacticRaw);
        if (data.action === 'save' && data.scenario) {
          if (data.scenarioIndex !== undefined && data.scenarioIndex !== null) {
            // 编辑已有情景 —— 先恢复旧数据再替换指定项
            const formRaw = sessionStorage.getItem(FORM_STATE_KEY);
            const saved = formRaw ? JSON.parse(formRaw) : {};
            const existing = saved.tacticScenarios || [];
            existing[data.scenarioIndex] = data.scenario;
            setTacticScenarios([...existing]);
          } else {
            // 新建情景 —— 先恢复旧数据再追加
            const formRaw = sessionStorage.getItem(FORM_STATE_KEY);
            const saved = formRaw ? JSON.parse(formRaw) : {};
            const existing = saved.tacticScenarios || [];
            setTacticScenarios([...existing, data.scenario]);
          }
        }
      } catch {}
      sessionStorage.removeItem('tactic_edit_result');
    }

    // Step 2: 恢复表单持久化数据（不覆盖 Step 1 中已设置的 tacticScenarios）
    if (!tacticRaw) {
      restoreFormState();
    } else {
      try {
        const raw = sessionStorage.getItem(FORM_STATE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.formData) setFormData(saved.formData);
        }
      } catch {}
    }
  }, []);

  // formData 或 tacticScenarios 变化时自动持久化（防丢失）
  useEffect(() => {
    if (formData.performance || formData.highlights || tacticScenarios.length > 0) {
      saveFormState();
    }
  }, [formData, tacticScenarios]);

  // 提交成功后清除持久化缓存
  const clearFormState = () => {
    try { sessionStorage.removeItem(FORM_STATE_KEY); } catch { /* ignore */ }
  };

  // 数据校验：没有数据则返回
  if (!reviewData.matchSummaryId) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="mb-4">缺少比赛信息</p>
          <button onClick={() => { window.location.href = '/user-dashboard'; }} className="text-[#39ff14] hover:underline">返回上一页</button>
        </div>
      </div>
    );
  }

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.performance.trim()) newErrors.performance = '请填写本场表现';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 战术板操作
  const handleAddTactic = () => {
    setEditingScenarioIndex(null);
    // 先保存当前表单状态到 sessionStorage
    saveFormState();

    // 写入初始数据到 sessionStorage（编辑时需要已有数据）
    sessionStorage.setItem('tactic_edit_data', JSON.stringify({
      mode: 'create',
      scenario: buildDefaultScenario(tacticScenarios.length + 1),
    }));

    // 用 URL params + 硬跳转
    window.location.href = '/tactic-edit?mode=create';
  };

  const handleEditTactic = (index: number) => {
    setEditingScenarioIndex(index);
    // 先保存当前表单状态
    saveFormState();
    
    sessionStorage.setItem('tactic_edit_data', JSON.stringify({
      mode: 'edit',
      scenarioIndex: index,
      scenario: tacticScenarios[index],
    }));
    window.location.href = `/tactic-edit?mode=edit&index=${index}`;
  };

  const buildDefaultScenario = (index: number): TacticScenario => ({
    index,
    title: '', description: '', question: '',
    format: '11人制' as const, positions: [],
  });

  const handleDeleteTactic = (index: number) => {
    if (confirm('确定删除这个战术情景吗？')) {
      setTacticScenarios(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await matchSummaryApi.submitPlayerSummary(reviewData.matchSummaryId, {
        performance: formData.performance,
        goals: formData.goals,
        assists: formData.assists,
        saves: formData.saves,
        highlights: formData.highlights,
        improvements: formData.improvements,
        nextGoals: formData.nextGoals,
        tactics: tacticScenarios.map(s => ({
          title: s.title, description: s.description,
          question: s.question, format: s.format,
          positions: s.positions, imageUrl: s.imageUrl,
        })),
      });
      if (res.data?.success) {
        setSubmitted(true);
        clearFormState();
        sessionStorage.setItem(RESULT_KEY, JSON.stringify({ success: true }));
        setTimeout(() => { window.location.href = '/user-dashboard?tab=match_reports'; }, 1500);
      } else {
        setErrors({ submit: res.data?.message || '提交失败' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || '提交失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  // 提交成功状态
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center p-6">
        <CheckCircle size={64} className="text-[#39ff14] mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">自评提交成功！</h2>
        <p className="text-gray-400 mb-6">正在返回...</p>
        <Loader2 size={20} className="text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-sm border-b border-gray-800/50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => { window.location.href = '/user-dashboard'; }} className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="返回">
            <ArrowLeft size={22} className="text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-white truncate">填写自评 — {reviewData.matchName}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-5 pb-24">
        {/* 错误提示 */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-7">

          {/* 本场表现 */}
          <section>
            <label className="block text-sm font-medium text-emerald-400 mb-2.5">
              <TrendingUp size={16} className="inline mr-1 -mt-0.5" />
              本场表现 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.performance}
              onChange={e => updateField('performance', e.target.value)}
              placeholder="总结本场比赛的整体表现，包括位置感、攻防贡献、体能状态等..."
              rows={4}
              className={`w-full px-4 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 transition-colors ${
                errors.performance ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.performance && <p className="text-red-400 text-xs mt-1.5">{errors.performance}</p>}
          </section>

          {/* 数据统计 */}
          <section>
            <label className="block text-sm font-medium text-gray-400 mb-2.5">
              比赛数据
            </label>
            <div className="grid grid-cols-3 gap-4">
              <StatField label="进球" value={formData.goals} onChange={v => updateField('goals', v)} icon={Target} />
              <StatField label="助攻" value={formData.assists} onChange={v => updateField('assists', v)} icon={Sparkles} />
              <StatField label="扑救" value={formData.saves} onChange={v => updateField('saves', v)} icon={Target} />
            </div>
          </section>

          {/* 高光时刻 */}
          <section>
            <label className="block text-sm font-medium text-blue-400 mb-2.5">
              <Sparkles size={16} className="inline mr-1 -mt-0.5" />
              高光时刻
            </label>
            <textarea
              value={formData.highlights}
              onChange={e => updateField('highlights', e.target.value)}
              placeholder="描述本场比赛中的精彩瞬间或关键表现..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </section>

          {/* 不足与改进 */}
          <section>
            <label className="block text-sm font-medium text-amber-400 mb-2.5">
              <TrendingUp size={16} className="inline mr-1 -mt-0.5" />
              不足与改进
            </label>
            <textarea
              value={formData.improvements}
              onChange={e => updateField('improvements', e.target.value)}
              placeholder="分析本场比赛中的不足之处，以及接下来的改进方向..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </section>

          {/* 下场期待 */}
          <section>
            <label className="block text-sm font-medium text-purple-400 mb-2.5">
              <Target size={16} className="inline mr-1 -mt-0.5" />
              下场期待
            </label>
            <textarea
              value={formData.nextGoals}
              onChange={e => updateField('nextGoals', e.target.value)}
              placeholder="为下一场比赛设定目标或期待..."
              rows={3}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </section>

          {/* ═══ 虚拟战术板 ═══ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Layout size={18} className="text-[#39ff14]" />
                虚拟战术板
              </label>
              <button
                type="button"
                onClick={handleAddTactic}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#39ff14] text-black text-sm font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
              >
                <Plus size={15} />
                添加战术图
              </button>
            </div>

            {tacticScenarios.length > 0 ? (
              <div className="space-y-3">
                {tacticScenarios.map((scenario, index) => (
                  <TacticPreviewCard
                    key={index}
                    scenario={scenario}
                    index={index}
                    onEdit={() => handleEditTactic(index)}
                    onDelete={() => handleDeleteTactic(index)}
                  />
                ))}
                <p className="text-xs text-gray-600 text-center pt-1">
                  已添加 {tacticScenarios.length} 个战术图 · 教练可查看并回复你的疑问
                </p>
              </div>
            ) : (
              <div onClick={handleAddTactic} className="bg-[#0f1419] border-2 border-dashed border-gray-800 rounded-xl p-7 text-center cursor-pointer hover:border-[#39ff14]/40 transition-colors group">
                <Layout className="mx-auto text-gray-600 group-hover:text-[#39ff14]/50 transition-colors mb-2.5" size={32} />
                <p className="text-gray-400 text-sm font-medium mb-1">添加战术示意图</p>
                <p className="text-gray-600 text-xs">用拖拽球员展示关键战术站位和跑位</p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0e17]/95 backdrop-blur-sm border-t border-gray-800/50 p-4 safe-area-bottom z-50">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={() => { window.location.href = '/user-dashboard'; }} className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-[2] py-3.5 bg-[#39ff14] hover:bg-[#22c55e] disabled:bg-gray-700 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={18} className="animate-spin" /> 提交中...</> : <>✓ 提交自评</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/** 战术图预览卡片（可展开查看战术板） */
const TacticPreviewCard: React.FC<{
  scenario: TacticScenario;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ scenario, index, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const hasTacticData = (scenario.positions && scenario.positions.length > 0) ||
    (scenario.lines && scenario.lines.length > 0);

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-xl overflow-hidden hover:border-[#39ff14]/30 transition-colors">
      {/* 卡片头部 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{scenario.title || `战术情景 ${index + 1}`}</h4>
            {scenario.description && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{scenario.description}</p>
            )}
            <div className="flex gap-3 text-xs text-gray-500 mt-2.5">
              <span>我方: {scenario.positions?.filter(p => p.type === 'our').length || 0} 人</span>
              <span>对方: {scenario.positions?.filter(p => p.type === 'opp').length || 0} 人</span>
              {scenario.lines && scenario.lines.length > 0 && (
                <>
                  <span className="text-gray-600">|</span>
                  <span>标记线: {scenario.lines.length}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <button type="button" onClick={onEdit} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="编辑">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button type="button" onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors" title="删除">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        {scenario.question && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-800/60">
            <p className="text-xs text-amber-400/80"><span className="font-medium">疑问:</span> {scenario.question}</p>
          </div>
        )}

        {/* 展开/收起预览按钮 */}
        {hasTacticData && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm text-[#39ff14]/70 hover:text-[#39ff14] hover:bg-[#39ff14]/5 rounded-lg transition-colors"
          >
            <Eye size={14} />
            {expanded ? '收起预览' : '展开查看战术图'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* 可展开的战术板预览 */}
      {expanded && hasTacticData && (
        <div className="border-t border-gray-800/60">
          <TacticBoard
            format={scenario.format || '11人制'}
            players={scenario.positions || []}
            onPlayersChange={() => {}}
            readOnly
            showControls={false}
            ball={scenario.ball}
            lines={scenario.lines}
          />
        </div>
      )}
    </div>
  );
};

/** 数字统计字段 */
const StatField: React.FC<{
  label: string; value: number; onChange: (v: number) => void; icon: React.ElementType;
}> = ({ label, value, onChange, icon: Icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2"><Icon size={14} className="inline mr-1 -mt-0.5" />{label}</label>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors text-base font-medium">−</button>
      <input type="number" min={0} max={99} value={value} onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="flex-1 h-10 bg-[#0f1419] border border-gray-700 rounded-lg text-center text-white font-medium text-base focus:outline-none focus:border-emerald-500" />
      <button type="button" onClick={() => onChange(Math.min(99, value + 1))} className="w-10 h-10 bg-[#39ff14] hover:bg-[#22c55e] text-black rounded-lg transition-colors text-base font-bold">+</button>
    </div>
  </div>
);

export default MatchSelfReviewPage;
