import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Calendar, Clock, FileText, TrendingUp, Heart,
  Save, Send, Loader2, AlertCircle, CheckCircle, Utensils,
  Moon, Activity, Lightbulb, Target, MessageSquare, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { weeklyReportApi } from '../../../services/api';
import MultiDimensionalRating, { SELF_RATING_DIMENSIONS } from '../../ClubDashboard/components/MultiDimensionalRating';

interface WeeklyReportFormProps {
  reportId?: number;
  teamId: number;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  deadline: string;
  initialData?: any;
  onBack: () => void;
  onSubmit: () => void;
}

interface FormData {
  // 训练出勤
  trainingCount: number;
  trainingDuration: number;
  absenceCount: number;
  absenceReason: string;

  // 训练内容
  knowledgeSummary: string;
  technicalContent: string;
  tacticalContent: string;
  physicalCondition: string;
  matchPerformance: string;

  // 自我评价
  selfAttitudeRating: number;
  selfTechniqueRating: number;
  selfTeamworkRating: number;
  improvementsDetail: string;
  weaknesses: string;

  // 身体状态
  fatigueLevel: number;
  injuries: string;
  sleepQuality: number;
  dietCondition: string;
  messageToCoach: string;
}

const WeeklyReportForm: React.FC<WeeklyReportFormProps> = ({
  reportId,
  teamId,
  weekLabel,
  weekStart,
  weekEnd,
  deadline,
  initialData,
  onBack,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>({
    trainingCount: 0,
    trainingDuration: 0,
    absenceCount: 0,
    absenceReason: '',
    knowledgeSummary: '',
    technicalContent: '',
    tacticalContent: '',
    physicalCondition: '',
    matchPerformance: '',
    selfAttitudeRating: 0,
    selfTechniqueRating: 0,
    selfTeamworkRating: 0,
    improvementsDetail: '',
    weaknesses: '',
    fatigueLevel: 3,
    injuries: '',
    sleepQuality: 3,
    dietCondition: '',
    messageToCoach: '',
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('attendance');

  // 从已有报告数据或 localStorage 加载草稿
  useEffect(() => {
    const draftKey = `weekly_report_draft_${reportId || 'new'}`;
    const draft = localStorage.getItem(draftKey);

    if (initialData) {
      // 优先回填服务端数据
      setFormData(prev => ({
        ...prev,
        trainingCount: initialData.trainingCount ?? prev.trainingCount,
        trainingDuration: initialData.trainingDuration ?? prev.trainingDuration,
        absenceCount: initialData.absenceCount ?? prev.absenceCount,
        absenceReason: initialData.absenceReason ?? prev.absenceReason,
        knowledgeSummary: initialData.knowledgeSummary ?? prev.knowledgeSummary,
        technicalContent: initialData.technicalContent ?? prev.technicalContent,
        tacticalContent: initialData.tacticalContent ?? prev.tacticalContent,
        physicalCondition: initialData.physicalCondition ?? prev.physicalCondition,
        matchPerformance: initialData.matchPerformance ?? prev.matchPerformance,
        selfAttitudeRating: initialData.selfAttitudeRating ?? prev.selfAttitudeRating,
        selfTechniqueRating: initialData.selfTechniqueRating ?? prev.selfTechniqueRating,
        selfTeamworkRating: initialData.selfTeamworkRating ?? prev.selfTeamworkRating,
        improvementsDetail: initialData.improvementsDetail ?? prev.improvementsDetail,
        weaknesses: initialData.weaknesses ?? prev.weaknesses,
        fatigueLevel: initialData.fatigueLevel ?? prev.fatigueLevel,
        injuries: initialData.injuries ?? prev.injuries,
        sleepQuality: initialData.sleepQuality ?? prev.sleepQuality,
        dietCondition: initialData.dietCondition ?? prev.dietCondition,
        messageToCoach: initialData.messageToCoach ?? prev.messageToCoach,
      }));
    } else if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('加载草稿失败:', e);
      }
    }
  }, [reportId, initialData]);

  // 自动保存草稿
  const saveDraft = () => {
    const draftKey = `weekly_report_draft_${reportId || 'new'}`;
    localStorage.setItem(draftKey, JSON.stringify(formData));
  };

  useEffect(() => {
    const timer = setTimeout(saveDraft, 3000);
    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.trainingCount === 0) {
      newErrors.trainingCount = '请填写训练次数';
    }
    if (!formData.knowledgeSummary.trim()) {
      newErrors.knowledgeSummary = '请填写知识点总结';
    } else if (formData.knowledgeSummary.trim().length < 10) {
      newErrors.knowledgeSummary = '知识点总结至少需要 10 个字';
    }
    if (formData.selfAttitudeRating === 0) {
      newErrors.selfAttitudeRating = '请完成训练态度自评';
    }
    if (formData.selfTechniqueRating === 0) {
      newErrors.selfTechniqueRating = '请完成技术表现自评';
    }
    if (formData.selfTeamworkRating === 0) {
      newErrors.selfTeamworkRating = '请完成团队协作自评';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // 滚动到第一个错误
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!reportId) {
      toast.error('周报ID缺失，无法提交');
      return;
    }

    setSubmitting(true);
    try {
      await weeklyReportApi.submitReport(reportId, {
        ...formData,
        teamId,
        weekStart,
      });

      // 清除草稿
      const draftKey = `weekly_report_draft_${reportId || 'new'}`;
      localStorage.removeItem(draftKey);

      toast.success('周报提交成功！');
      onSubmit();
    } catch (error: any) {
      console.error('提交失败:', error);
      toast.error(error.response?.data?.error || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    saveDraft();
    setTimeout(() => setSaving(false), 500);
  };

  // 计算剩余时间
  const getTimeRemaining = () => {
    const end = new Date(deadline).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return '已截止';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `剩余 ${days} 天 ${hours} 小时`;
  };

  const sections = [
    { id: 'attendance', label: '训练出勤', icon: Calendar },
    { id: 'content', label: '训练内容', icon: FileText },
    { id: 'self', label: '自我评价', icon: TrendingUp },
    { id: 'physical', label: '身体状态', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <div className="sticky top-0 z-40 bg-[#0f1419]/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">填写周报</h1>
              <p className="text-sm text-gray-400">{weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${getTimeRemaining().includes('已截止') ? 'text-red-400' : 'text-amber-400'}`}>
              {getTimeRemaining()}
            </span>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存草稿
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              提交
            </button>
          </div>
        </div>

        {/* 步骤导航 */}
        <div className="flex px-4 pb-4 gap-2 overflow-x-auto">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {index + 1}. {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
        {/* 训练出勤 */}
        {activeSection === 'attendance' && (
          <SectionCard title="训练出勤情况" icon={Calendar}>
            <div className="grid grid-cols-3 gap-4">
              <NumberInput
                label="本周训练次数"
                value={formData.trainingCount}
                onChange={v => updateField('trainingCount', v)}
                min={0}
                max={14}
                unit="次"
                error={errors.trainingCount}
              />
              <NumberInput
                label="总训练时长"
                value={formData.trainingDuration}
                onChange={v => updateField('trainingDuration', v)}
                min={0}
                max={1000}
                unit="分钟"
              />
              <NumberInput
                label="请假/缺勤次数"
                value={formData.absenceCount}
                onChange={v => updateField('absenceCount', v)}
                min={0}
                max={14}
                unit="次"
              />
            </div>
            {formData.absenceCount > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  请假原因
                </label>
                <textarea
                  value={formData.absenceReason}
                  onChange={e => updateField('absenceReason', e.target.value)}
                  placeholder="如有请假，请说明原因..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </SectionCard>
        )}

        {/* 训练内容 */}
        {activeSection === 'content' && (
          <SectionCard title="训练内容反馈" icon={FileText}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-400 mb-2">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  知识点总结 <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="knowledgeSummary"
                  value={formData.knowledgeSummary}
                  onChange={e => updateField('knowledgeSummary', e.target.value)}
                  placeholder="总结本周学习的核心知识点，例如：快速反击的跑位技巧、紧逼情况下的控球方法等..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500 ${
                    errors.knowledgeSummary ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.knowledgeSummary && (
                  <p className="text-red-400 text-sm mt-1">{errors.knowledgeSummary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  技术训练内容
                </label>
                <textarea
                  value={formData.technicalContent}
                  onChange={e => updateField('technicalContent', e.target.value)}
                  placeholder="如：射门训练、带球突破、短传配合等..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  战术训练内容
                </label>
                <textarea
                  value={formData.tacticalContent}
                  onChange={e => updateField('tacticalContent', e.target.value)}
                  placeholder="如：快速反击战术、边路配合等..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  体能训练情况
                </label>
                <textarea
                  value={formData.physicalCondition}
                  onChange={e => updateField('physicalCondition', e.target.value)}
                  placeholder="如：耐力跑、力量训练、速度训练等..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  比赛/对抗表现
                </label>
                <textarea
                  value={formData.matchPerformance}
                  onChange={e => updateField('matchPerformance', e.target.value)}
                  placeholder="描述在对抗赛中的表现..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* 自我评价 */}
        {activeSection === 'self' && (
          <SectionCard title="自我评价" icon={TrendingUp}>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4">多维度自评</h4>
                <MultiDimensionalRating
                  dimensions={SELF_RATING_DIMENSIONS}
                  values={{
                    selfAttitudeRating: formData.selfAttitudeRating,
                    selfTechniqueRating: formData.selfTechniqueRating,
                    selfTeamworkRating: formData.selfTeamworkRating,
                  }}
                  onChange={(key, value) => updateField(key as keyof FormData, value)}
                />
                {(errors.selfAttitudeRating || errors.selfTechniqueRating || errors.selfTeamworkRating) && (
                  <p className="text-red-400 text-sm mt-2">请完成所有维度的自评</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-800">
                <label className="block text-sm font-medium text-green-400 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  本周进步点
                </label>
                <textarea
                  value={formData.improvementsDetail}
                  onChange={e => updateField('improvementsDetail', e.target.value)}
                  placeholder="总结本周的进步和亮点..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-400 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  待改进方面
                </label>
                <textarea
                  value={formData.weaknesses}
                  onChange={e => updateField('weaknesses', e.target.value)}
                  placeholder="指出需要改进的地方..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* 身体状态 */}
        {activeSection === 'physical' && (
          <SectionCard title="身体状态反馈" icon={Heart}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Activity className="w-4 h-4 inline mr-1" />
                    疲劳程度 (1-5)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formData.fatigueLevel}
                      onChange={e => updateField('fatigueLevel', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="w-8 text-center text-white font-medium">{formData.fatigueLevel}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.fatigueLevel <= 2 ? '精力充沛' : formData.fatigueLevel <= 3 ? '轻微疲劳' : '较为疲劳'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Moon className="w-4 h-4 inline mr-1" />
                    睡眠质量 (1-5)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={formData.sleepQuality}
                      onChange={e => updateField('sleepQuality', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="w-8 text-center text-white font-medium">{formData.sleepQuality}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.sleepQuality >= 4 ? '睡眠良好' : formData.sleepQuality >= 3 ? '睡眠一般' : '睡眠不足'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  伤病情况
                </label>
                <textarea
                  value={formData.injuries}
                  onChange={e => updateField('injuries', e.target.value)}
                  placeholder="如有伤病请详细说明，无则留空..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <Utensils className="w-4 h-4 inline mr-1" />
                  饮食情况
                </label>
                <textarea
                  value={formData.dietCondition}
                  onChange={e => updateField('dietCondition', e.target.value)}
                  placeholder="简述本周饮食情况，是否注意营养补充..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  想对教练说的话
                </label>
                <textarea
                  value={formData.messageToCoach}
                  onChange={e => updateField('messageToCoach', e.target.value)}
                  placeholder="有什么想对教练说的..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* 底部导航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-gray-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection);
              if (currentIndex > 0) {
                setActiveSection(sections[currentIndex - 1].id);
              }
            }}
            disabled={activeSection === 'attendance'}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← 上一步
          </button>

          <div className="flex gap-1">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`w-2 h-2 rounded-full ${
                  section.id === activeSection ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === activeSection);
              if (currentIndex < sections.length - 1) {
                setActiveSection(sections[currentIndex + 1].id);
              }
            }}
            disabled={activeSection === 'physical'}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            下一步 →
          </button>
        </div>
      </div>
    </div>
  );
};

// 区块卡片组件
const SectionCard: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    {children}
  </div>
);

// 数字输入组件
const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  error?: string;
}> = ({ label, value, onChange, min, max, unit, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className={`flex-1 h-10 bg-[#0f1419] border rounded-lg text-center text-white focus:outline-none focus:border-emerald-500 ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
      >
        +
      </button>
      <span className="text-gray-400 text-sm w-8">{unit}</span>
    </div>
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

export default WeeklyReportForm;
