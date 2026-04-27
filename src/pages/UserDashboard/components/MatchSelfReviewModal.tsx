import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Target, Sparkles, TrendingUp, Layout, Plus, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { matchSummaryApi } from '../../../services/api';
import { TacticBoard } from '../../../components/tactics/TacticBoard';
import type { TacticScenario } from '@/components/tactics';
import type { BallPosition, DrawnLine } from '@/components/tactics';

const TACTIC_RESULT_KEY = 'tactic_edit_result';

// 表单状态持久化 key（防止跳转战术板后数据丢失）
const FORM_STATE_KEY_MODAL = 'self_review_form_state_modal';

interface MatchSelfReviewModalProps {
  matchSummaryId: number;
  matchName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MatchSelfReviewModal: React.FC<MatchSelfReviewModalProps> = ({
  matchSummaryId,
  matchName,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
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

  // 战术板状态
  const [tacticScenarios, setTacticScenarios] = useState<TacticScenario[]>([]);

  // ══════════════════════════════════
  // 表单数据持久化：跳转战术板前后自动保存/恢复
  // ══════════════════════════════════

  const saveFormState = () => {
    try { sessionStorage.setItem(FORM_STATE_KEY_MODAL, JSON.stringify({ formData, tacticScenarios })); } catch {}
  };

  const restoreFormState = () => {
    try {
      const raw = sessionStorage.getItem(FORM_STATE_KEY_MODAL);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.formData) setFormData(saved.formData);
        if (saved.tacticScenarios) setTacticScenarios(saved.tacticScenarios);
      }
    } catch {}
  };

  // 防止 React 18 Strict Mode 双重执行
  const initDoneRef = useRef(false);
  const resultHandledRef = useRef(false);

  // 挂载时恢复（覆盖硬跳转后的内存丢失）
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    restoreFormState();
  }, []);

  // 状态变化时持久化
  useEffect(() => {
    if (formData.performance || formData.highlights || tacticScenarios.length > 0) saveFormState();
  }, [formData, tacticScenarios]);

  // 监听从战术编辑页返回的结果（双保险：立即检查 + visibilitychange）
  useEffect(() => {
    const handleTacticResult = () => {
      try {
        const raw = sessionStorage.getItem(TACTIC_RESULT_KEY);
        if (!raw) return;
        // 防重复处理
        if (resultHandledRef.current) {
          sessionStorage.removeItem(TACTIC_RESULT_KEY);
          return;
        }
        resultHandledRef.current = true;
        sessionStorage.removeItem(TACTIC_RESULT_KEY);

        const result = JSON.parse(raw) as TacticScenario & { _meta?: { isNew?: boolean; scenarioIndex?: number } };
        const { _meta, ...pureScenario } = result;

        if (_meta?.isNew === false && _meta.scenarioIndex !== undefined) {
          const updated = [...tacticScenarios];
          updated[_meta.scenarioIndex] = pureScenario;
          setTacticScenarios(updated);
        } else {
          setTacticScenarios(prev => [...prev, pureScenario]);
        }
      } catch { /* ignore */ }
    };

    // 立即检查（硬跳转模式）
    handleTacticResult();

    // 监听 visibilitychange（SPA navigate 模式）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleTacticResult();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tacticScenarios]);

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.performance.trim()) {
      newErrors.performance = '请填写本场表现';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 添加新战术情景 → 跳转到独立编辑页
  const handleAddTacticScenario = () => {
    // 先保存当前表单状态
    saveFormState();
    
    const data = JSON.stringify({
      isNew: true,
      scenarioIndex: tacticScenarios.length,
      scenario: buildDefaultScenario(tacticScenarios.length + 1),
    });
    sessionStorage.setItem('tactic_edit_data', data);
    navigate('/tactic-edit');
  };

  // 编辑已有情景 → 跳转到独立编辑页
  const handleEditTacticScenario = (index: number) => {
    // 先保存当前表单状态
    saveFormState();
    
    const data = JSON.stringify({
      isNew: false,
      scenarioIndex: index,
      scenario: tacticScenarios[index],
    });
    sessionStorage.setItem('tactic_edit_data', data);
    navigate('/tactic-edit');
  };

  // 构建默认情景（TacticEditor 需要的格式）
  const buildDefaultScenario = (index: number): TacticScenario => ({
    index,
    title: '',
    description: '',
    question: '',
    format: '11人制',
    positions: [],
  });

  // 删除战术情景
  const handleDeleteTacticScenario = (index: number) => {
    if (confirm('确定删除这个战术情景吗？')) {
      setTacticScenarios(tacticScenarios.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await matchSummaryApi.submitPlayerSummary(matchSummaryId, {
        performance: formData.performance,
        goals: formData.goals,
        assists: formData.assists,
        saves: formData.saves,
        highlights: formData.highlights,
        improvements: formData.improvements,
        nextGoals: formData.nextGoals,
        // 包含战术数据
        tactics: tacticScenarios.map(s => ({
          title: s.title,
          description: s.description,
          question: s.question,
          format: s.format,
          positions: s.positions,
          imageUrl: s.imageUrl,
        })),
      });
      if (res.data?.success) {
        onSuccess();
      } else {
        setErrors({ submit: res.data?.message || '提交失败' });
      }
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || '提交失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">填写比赛自评</h3>
            <p className="text-sm text-gray-400">{matchName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* 本场表现 */}
          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              本场表现 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.performance}
              onChange={e => updateField('performance', e.target.value)}
              placeholder="总结本场比赛的整体表现，包括位置感、攻防贡献、体能状态等..."
              rows={3}
              className={`w-full px-4 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 ${
                errors.performance ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.performance && <p className="text-red-400 text-xs mt-1">{errors.performance}</p>}
          </div>

          {/* 数据：进球/助攻/扑救 */}
          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="进球"
              value={formData.goals}
              onChange={v => updateField('goals', v)}
              icon={Target}
            />
            <NumberInput
              label="助攻"
              value={formData.assists}
              onChange={v => updateField('assists', v)}
              icon={Sparkles}
            />
            <NumberInput
              label="扑救"
              value={formData.saves}
              onChange={v => updateField('saves', v)}
              icon={Target}
            />
          </div>

          {/* 高光时刻 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1" />
              高光时刻
            </label>
            <textarea
              value={formData.highlights}
              onChange={e => updateField('highlights', e.target.value)}
              placeholder="描述本场比赛中的精彩瞬间或关键表现..."
              rows={2}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 不足与改进 */}
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              不足与改进
            </label>
            <textarea
              value={formData.improvements}
              onChange={e => updateField('improvements', e.target.value)}
              placeholder="分析本场比赛中的不足之处，以及接下来的改进方向..."
              rows={2}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 下场期待 */}
          <div>
            <label className="block text-sm font-medium text-blue-400 mb-2">
              <Target className="w-4 h-4 inline mr-1" />
              下场期待
            </label>
            <textarea
              value={formData.nextGoals}
              onChange={e => updateField('nextGoals', e.target.value)}
              placeholder="为下一场比赛设定目标或期待..."
              rows={2}
              className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* ═══ 虚拟战术板 ═══ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Layout className="w-4 h-4 text-[#39ff14]" />
                虚拟战术板
              </label>
              <button
                type="button"
                onClick={handleAddTacticScenario}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#39ff14] text-black text-sm font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
              >
                <Plus size={14} />
                添加战术图
              </button>
            </div>

            {/* 已有战术情景列表 */}
            {tacticScenarios.length > 0 ? (
              <div className="space-y-3">
                {tacticScenarios.map((scenario, index) => (
                  <TacticPreviewCard
                    key={index}
                    scenario={scenario}
                    index={index}
                    onEdit={() => handleEditTacticScenario(index)}
                    onDelete={() => handleDeleteTacticScenario(index)}
                  />
                ))}
              </div>
            ) : (
              <div
                onClick={handleAddTacticScenario}
                className="bg-[#0f1419] border-2 border-dashed border-gray-800 rounded-lg p-5 text-center cursor-pointer hover:border-[#39ff14]/30 transition-colors"
              >
                <Layout className="mx-auto text-gray-600 mb-2" size={28} />
                <p className="text-gray-400 text-sm mb-0.5">添加战术示意图</p>
                <p className="text-gray-600 text-xs">用拖拽球员展示关键战术站位和跑位</p>
              </div>
            )}

            {/* 战术统计提示 */}
            {tacticScenarios.length > 0 && (
              <p className="text-xs text-gray-600 mt-2 text-center">
                已添加 {tacticScenarios.length} 个战术图 · 教练可查看并回复你的疑问
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            提交自评
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
    <div className="bg-[#0f1419] border border-gray-800 rounded-lg overflow-hidden hover:border-[#39ff14]/30 transition-colors">
      {/* 卡片头部 - 始终显示 */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm truncate">
              {scenario.title || `战术情景 ${index + 1}`}
            </h4>
            {scenario.description && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{scenario.description}</p>
            )}
            <div className="flex gap-2 text-xs text-gray-500 mt-2">
              <span>我方: {scenario.positions?.filter(p => p.type === 'our').length || 0} 人</span>
              <span className="text-gray-700">|</span>
              <span>对方: {scenario.positions?.filter(p => p.type === 'opp').length || 0} 人</span>
              {scenario.lines && scenario.lines.length > 0 && (
                <>
                  <span className="text-gray-700">|</span>
                  <span>标记线: {scenario.lines.length}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
              title="编辑战术图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
              title="删除战术图"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        {/* 球员疑问（如果有） */}
        {scenario.question && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <p className="text-xs text-amber-400/80"><span className="font-medium">疑问:</span> {scenario.question}</p>
          </div>
        )}

        {/* 展开/收起预览按钮 */}
        {hasTacticData && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#39ff14]/70 hover:text-[#39ff14] hover:bg-[#39ff14]/5 rounded transition-colors"
          >
            <Eye size={13} />
            {expanded ? '收起预览' : '展开预览'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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

/** 数字输入器 */
const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ElementType;
}> = ({ label, value, onChange, icon: Icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">
      <Icon className="w-4 h-4 inline mr-1" />
      {label}
    </label>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors text-sm"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={99}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="flex-1 h-9 bg-[#0f1419] border border-gray-700 rounded-lg text-center text-white text-sm focus:outline-none focus:border-emerald-500"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="w-9 h-9 bg-[#39ff14] hover:bg-[#22c55e] text-black rounded-lg transition-colors text-sm font-medium"
      >
        +
      </button>
    </div>
  </div>
);

export default MatchSelfReviewModal;
