import React, { useState, useEffect } from 'react';
import { Save, Star, Trophy, Shield, AlertCircle, FileText, Target, CheckCircle, Layout } from 'lucide-react';
import type { PlayerReviewResponse } from '@/services/matchApi';
import { matchApi } from '@/services/matchApi';
import { TacticEditor } from '@/components/tactics';
import type { TacticScenario } from '@/components/tactics';

interface PlayerReviewFormProps {
  matchId: number;
  existingReview?: PlayerReviewResponse;
  onSubmit?: (review: PlayerReviewResponse) => void;
  onCancel?: () => void;
}

const PERFORMANCE_LEVELS = [
  { value: '优秀', label: '优秀', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { value: '良好', label: '良好', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { value: '一般', label: '一般', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { value: '需改进', label: '需改进', color: 'text-red-400', bgColor: 'bg-red-500/10' },
] as const;

export const PlayerReviewForm: React.FC<PlayerReviewFormProps> = ({
  matchId,
  existingReview,
  onSubmit,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    performance: existingReview?.performance || '',
    goals: existingReview?.goals || 0,
    assists: existingReview?.assists || 0,
    saves: existingReview?.saves || 0,
    highlights: existingReview?.highlights || '',
    improvements: existingReview?.improvements || '',
    nextGoals: existingReview?.nextGoals || '',
  });

  // 战术情景数据
  const [tacticScenarios, setTacticScenarios] = useState<TacticScenario[]>(
    (existingReview as any)?.tactics || []
  );
  const [tacticEditorOpen, setTacticEditorOpen] = useState(false);
  const [editingScenarioIndex, setEditingScenarioIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.performance) {
      alert('请选择表现评级');
      return;
    }

    setLoading(true);
    try {
      // 将战术数据也包含在提交中
      const submitData = {
        ...formData,
        tactics: tacticScenarios,
      };
      const response = await matchApi.submitPlayerReview(matchId, submitData);
      if (response.data.success) {
        setSuccess(true);
        onSubmit?.(response.data.data);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('提交自评失败:', error);
      alert('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const increment = (field: 'goals' | 'assists' | 'saves') => {
    setFormData({ ...formData, [field]: formData[field] + 1 });
  };

  const decrement = (field: 'goals' | 'assists' | 'saves') => {
    if (formData[field] > 0) {
      setFormData({ ...formData, [field]: formData[field] - 1 });
    }
  };

  // 添加新的战术情景
  const handleAddTacticScenario = () => {
    setEditingScenarioIndex(null);
    setTacticEditorOpen(true);
  };

  // 编辑已有情景
  const handleEditTacticScenario = (index: number) => {
    setEditingScenarioIndex(index);
    setTacticEditorOpen(true);
  };

  // 保存战术情景
  const handleSaveTacticScenario = (scenario: TacticScenario) => {
    if (editingScenarioIndex !== null) {
      // 更新现有情景
      const updated = [...tacticScenarios];
      updated[editingScenarioIndex] = scenario;
      setTacticScenarios(updated);
    } else {
      // 添加新情景
      setTacticScenarios([...tacticScenarios, scenario]);
    }
    setTacticEditorOpen(false);
    setEditingScenarioIndex(null);
  };

  // 删除战术情景
  const handleDeleteTacticScenario = (index: number) => {
    if (confirm('确定删除这个战术情景吗？')) {
      setTacticScenarios(tacticScenarios.filter((_, i) => i !== index));
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle className="text-green-400" size={64} />
        <h3 className="text-xl font-bold text-white">提交成功</h3>
        <p className="text-gray-400">您的自评已提交给教练</p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 表现评级 */}
      <div>
        <label className="block text-white font-medium mb-3 flex items-center gap-2">
          <Star className="text-[#39ff14]" size={20} />
          本场表现
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PERFORMANCE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData({ ...formData, performance: level.value })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.performance === level.value
                  ? `border-[${level.color}] ${level.bgColor} ${level.color}`
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <p className={`font-medium mb-1 ${formData.performance === level.value ? level.color : 'text-gray-400'}`}>
                  {level.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 基础数据 */}
      <div>
        <label className="block text-white font-medium mb-3 flex items-center gap-2">
          <Trophy className="text-[#39ff14]" size={20} />
          本场数据
        </label>
        <div className="grid grid-cols-3 gap-4">
          {/* 进球 */}
          <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">进球</span>
              <Trophy className="text-yellow-400" size={20} />
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => decrement('goals')}
                className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">{formData.goals}</span>
              <button
                type="button"
                onClick={() => increment('goals')}
                className="w-8 h-8 rounded-lg bg-[#39ff14] text-black hover:bg-[#22c55e] transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* 助攻 */}
          <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">助攻</span>
              <Shield className="text-blue-400" size={20} />
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => decrement('assists')}
                className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">{formData.assists}</span>
              <button
                type="button"
                onClick={() => increment('assists')}
                className="w-8 h-8 rounded-lg bg-[#39ff14] text-black hover:bg-[#22c55e] transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* 扑救（门将） */}
          <div className="bg-[#0f1419] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">扑救</span>
              <Shield className="text-green-400" size={20} />
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => decrement('saves')}
                className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">{formData.saves}</span>
              <button
                type="button"
                onClick={() => increment('saves')}
                className="w-8 h-8 rounded-lg bg-[#39ff14] text-black hover:bg-[#22c55e] transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 高光时刻 */}
      <div>
        <label className="block text-white font-medium mb-3 flex items-center gap-2">
          <FileText className="text-[#39ff14]" size={20} />
          高光时刻
        </label>
        <textarea
          value={formData.highlights}
          onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
          placeholder="描述你本场比赛中的精彩表现..."
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
        />
      </div>

      {/* 需改进方面 */}
      <div>
        <label className="block text-white font-medium mb-3 flex items-center gap-2">
          <AlertCircle className="text-[#39ff14]" size={20} />
          需改进方面
        </label>
        <textarea
          value={formData.improvements}
          onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
          placeholder="总结需要改进的地方..."
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
        />
      </div>

      {/* 下场目标 */}
      <div>
        <label className="block text-white font-medium mb-3 flex items-center gap-2">
          <Target className="text-[#39ff14]" size={20} />
          下场目标
        </label>
        <textarea
          value={formData.nextGoals}
          onChange={(e) => setFormData({ ...formData, nextGoals: e.target.value })}
          placeholder="设定下场比赛的明确目标..."
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1419] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
        />
      </div>

      {/* 虚拟战术板 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-white font-medium flex items-center gap-2">
            <Layout className="text-[#39ff14]" size={20} />
            虚拟战术板
          </label>
          <button
            type="button"
            onClick={handleAddTacticScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#39ff14] text-black
              text-sm font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
          >
            + 添加战术图
          </button>
        </div>

        {/* 已有战术情景列表 */}
        {tacticScenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tacticScenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-[#0f1419] border border-gray-800 rounded-lg p-3 hover:border-[#39ff14]/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium text-sm truncate flex-1">
                    {scenario.title || `战术情景 ${index + 1}`}
                  </h4>
                  <div className="flex gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleEditTacticScenario(index)}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTacticScenario(index)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {/* 球员数量统计 */}
                <div className="flex gap-2 text-xs text-gray-500">
                  <span>我方: {scenario.players?.filter(p => p.type === 'our').length || 0} 人</span>
                  <span>|</span>
                  <span>对方: {scenario.players?.filter(p => p.type === 'opp').length || 0} 人</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0f1419] border-2 border-dashed border-gray-800 rounded-lg p-6 text-center cursor-pointer hover:border-[#39ff14]/30 transition-colors" onClick={handleAddTacticScenario}>
            <Layout className="mx-auto text-gray-600 mb-3" size={40} />
            <p className="text-gray-400 mb-1">添加战术示意图</p>
            <p className="text-gray-600 text-xs">点击或使用上方按钮添加</p>
          </div>
        )}
      </div>

      {/* 战术板编辑器弹窗 */}
      {tacticEditorOpen && (
        <TacticEditor
          isOpen={tacticEditorOpen}
          onClose={() => {
            setTacticEditorOpen(false);
            setEditingScenarioIndex(null);
          }}
          onSave={handleSaveTacticScenario}
          initialData={
            editingScenarioIndex !== null ? tacticScenarios[editingScenarioIndex] : undefined
          }
        />
      )}

      {/* 按钮 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-[#39ff14] hover:bg-[#22c55e] text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>提交中...</>
          ) : (
            <>
              <Save size={20} />
              提交自评
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};

export default PlayerReviewForm;
