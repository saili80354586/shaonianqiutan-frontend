import React, { useState } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { weeklyReportApi } from '../../services/api';

interface CreateWeeklyReportProps {
  teamId: number;
  onBack: () => void;
  onSuccess?: () => void;
}

const PRESET_TRAINING = ['技术训练', '体能训练', '战术训练', '对抗赛', '休息'];

const CreateWeeklyReport: React.FC<CreateWeeklyReportProps> = ({ teamId, onBack, onSuccess }) => {
  const [form, setForm] = useState({
    weekStart: new Date().toISOString().split('T')[0],
    trainingItems: PRESET_TRAINING.slice(0, 3),
    physicalStatus: 3,
    mentalStatus: 3,
    focus: '',
    goals: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await weeklyReportApi.createReport({
        teamId,
        weekStart: form.weekStart,
        physicalStatus: form.physicalStatus,
        mentalStatus: form.mentalStatus,
        technicalPerformance: form.focus,
        improvements: form.trainingItems.join('、'),
        nextWeekGoals: form.goals,
      });
      onSuccess?.();
      onBack();
    } catch (error) {
      console.error('创建周报失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">发起周报</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">周开始日期</label>
              <input
                type="date"
                value={form.weekStart}
                onChange={e => setForm({ ...form, weekStart: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">训练内容（多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_TRAINING.map(item => (
                  <label key={item} className="flex items-center gap-2 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg cursor-pointer has-[:checked]:border-emerald-500">
                    <input
                      type="checkbox"
                      checked={form.trainingItems.includes(item)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, trainingItems: [...form.trainingItems, item] });
                        } else {
                          setForm({ ...form, trainingItems: form.trainingItems.filter(i => i !== item) });
                        }
                      }}
                      className="sr-only"
                    />
                    <span className={form.trainingItems.includes(item) ? 'text-emerald-400' : 'text-gray-400'}
                    >{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">身体状态 (1-5)</label>
                <input
                  type="range" min="1" max="5" value={form.physicalStatus}
                  onChange={e => setForm({ ...form, physicalStatus: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1</span>
                  <span className="text-emerald-400">{form.physicalStatus}</span>
                  <span>5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">心理状态 (1-5)</label>
                <input
                  type="range"
                  min="1" max="5"
                  value={form.mentalStatus}
                  onChange={e => setForm({ ...form, mentalStatus: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1</span>
                  <span className="text-emerald-400">{form.mentalStatus}</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">重点提升</label>
              <textarea
                value={form.focus}
                onChange={e => setForm({ ...form, focus: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-emerald-500"
                placeholder="技术要点、战术理解、身体调整..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">下周期望</label>
              <textarea
                value={form.goals}
                onChange={e => setForm({ ...form, goals: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white resize-none focus:outline-none focus:border-emerald-500"
                placeholder="具体目标..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {submitting ? '提交中...' : '发起周报'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateWeeklyReport;
