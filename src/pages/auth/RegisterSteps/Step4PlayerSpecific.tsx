import React, { useState } from 'react';
import { Trophy, Ruler, Weight, Building2, Plus, X, ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Shirt, Zap, Dumbbell, Target, Brain, Sparkles, Shield, Layers, Footprints } from 'lucide-react';

interface Step4PlayerSpecificProps {
  onSubmit: (data: PlayerSpecificData) => void;
  onBack: () => void;
  defaultValues?: Partial<PlayerSpecificData>;
}

export interface PlayerSpecificData {
  position: string;
  secondaryPosition?: string;
  dominantFoot: 'left' | 'right' | 'both';
  height?: number;
  weight?: number;
  currentTeam?: string;
  jerseyNumber?: number;
  jerseyColor?: string;
  playingStyle: string[];
  experience: ExperienceItem[];
  // 新增字段
  startYear?: string;
  association?: string;
  faRegistered?: boolean;
}

interface ExperienceItem {
  id: string;
  period: string;
  team: string;
  position: string;
  achievement?: string;
}

const positions = [
  { value: 'GK', label: '门将 (GK)', category: '门将' },
  { value: 'CB', label: '中后卫 (CB)', category: '后卫' },
  { value: 'LB', label: '左后卫 (LB)', category: '后卫' },
  { value: 'RB', label: '右后卫 (RB)', category: '后卫' },
  { value: 'DM', label: '防守型中场 (DM)', category: '中场' },
  { value: 'CM', label: '中场 (CM)', category: '中场' },
  { value: 'AM', label: '进攻型中场 (AM)', category: '中场' },
  { value: 'LW', label: '左边锋 (LW)', category: '前锋' },
  { value: 'RW', label: '右边锋 (RW)', category: '前锋' },
  { value: 'ST', label: '前锋 (ST)', category: '前锋' },
];

const playingStyles = [
  { value: 'speed', label: '速度型', icon: Zap, desc: '爆发力强，冲刺快' },
  { value: 'power', label: '力量型', icon: Dumbbell, desc: '身体强壮，对抗好' },
  { value: 'tech', label: '技术型', icon: Target, desc: '脚下细腻，控球好' },
  { value: 'organize', label: '组织型', icon: Brain, desc: '视野开阔，传球准' },
  { value: 'break', label: '突破型', icon: Sparkles, desc: '盘带出色，突破强' },
  { value: 'defense', label: '防守型', icon: Shield, desc: '拦截精准，位置好' },
  { value: 'all', label: '全能型', icon: Layers, desc: '技术全面，适应强' },
];

const jerseyColors = [
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'yellow', label: '黄色', class: 'bg-yellow-500' },
  { value: 'white', label: '白色', class: 'bg-white' },
  { value: 'black', label: '黑色', class: 'bg-slate-800' },
  { value: 'orange', label: '橙色', class: 'bg-orange-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
];

// 球员主题（绿色系）
const theme = {
  primary: 'emerald-500',
  gradient: 'from-emerald-500 via-green-500 to-teal-500',
  bgCard: 'bg-emerald-500/10',
  border: 'border-emerald-500/20',
  textPrimary: 'text-white',
  textSecondary: 'text-emerald-200/80',
  textMuted: 'text-emerald-200/60',
  shadow: 'shadow-emerald-500/20',
};

const Step4PlayerSpecific: React.FC<Step4PlayerSpecificProps> = ({ onSubmit, onBack, defaultValues }) => {
  const [formData, setFormData] = useState<PlayerSpecificData>({
    position: defaultValues?.position || '',
    secondaryPosition: defaultValues?.secondaryPosition || '',
    dominantFoot: defaultValues?.dominantFoot || 'right',
    height: defaultValues?.height || undefined,
    weight: defaultValues?.weight || undefined,
    currentTeam: defaultValues?.currentTeam || '',
    jerseyNumber: defaultValues?.jerseyNumber || undefined,
    jerseyColor: defaultValues?.jerseyColor || '',
    playingStyle: defaultValues?.playingStyle || [],
    experience: defaultValues?.experience || [],
    startYear: defaultValues?.startYear || '',
    association: defaultValues?.association || '',
    faRegistered: defaultValues?.faRegistered || false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerSpecificData, string>>>({});
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [newExperience, setNewExperience] = useState<Partial<ExperienceItem>>({});

  const handleChange = (field: keyof PlayerSpecificData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePlayingStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      playingStyle: prev.playingStyle.includes(style)
        ? prev.playingStyle.filter(s => s !== style)
        : [...prev.playingStyle, style].slice(0, 3),
    }));
  };

  const addExperience = () => {
    if (newExperience.period && newExperience.team) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, { ...newExperience, id: Date.now().toString() } as ExperienceItem],
      }));
      setNewExperience({});
      setShowExperienceForm(false);
    }
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter(e => e.id !== id),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PlayerSpecificData, string>> = {};

    if (!formData.position) {
      newErrors.position = '请选择场上位置';
    }
    if (formData.playingStyle.length === 0) {
      newErrors.playingStyle = '请至少选择一个踢球风格';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 标题 */}
      <div className="text-center mb-4 sm:mb-6">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-gradient-to-br ${theme.gradient} rounded-xl flex items-center justify-center shadow-lg ${theme.shadow}`}>
          <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1.5">足球档案</h2>
        <p className="text-emerald-200/60 text-sm">完善您的足球背景和技战术特点</p>
      </div>

      {/* 表单内容 - 使用两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* 主要位置 */}
        <div className="lg:col-span-2">
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            主要位置 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Trophy className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <select
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none ${
                errors.position ? 'border-red-500/50' : theme.border
              }`}
            >
              <option value="" className="bg-slate-800">请选择位置</option>
              {['门将', '后卫', '中场', '前锋'].map(category => (
                <optgroup key={category} label={category} className="bg-slate-800">
                  {positions.filter(p => p.category === category).map(p => (
                    <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          {errors.position && <p className="mt-1 text-red-400 text-xs">{errors.position}</p>}
        </div>

        {/* 次要位置 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            次要位置 <span className="text-white/40">（选填）</span>
          </label>
          <select
            value={formData.secondaryPosition || ''}
            onChange={(e) => handleChange('secondaryPosition', e.target.value || undefined)}
            className={`w-full px-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none`}
          >
            <option value="" className="bg-slate-800">请选择次要位置</option>
            {positions.filter(p => p.value !== formData.position).map(p => (
              <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
            ))}
          </select>
        </div>

        {/* 惯用脚 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            惯用脚 <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2 sm:gap-3">
            {[
              { value: 'left', label: '左脚', icon: Footprints, rotate: 0 },
              { value: 'right', label: '右脚', icon: Footprints, rotate: 180 },
              { value: 'both', label: '双脚', icon: Footprints, rotate: 0 },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('dominantFoot', option.value)}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                  formData.dominantFoot === option.value
                    ? `border-${theme.primary} ${theme.bgCard} text-white`
                    : `border-white/10 bg-white/5 text-emerald-200/60 hover:border-${theme.primary}/30`
                }`}
              >
                <option.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${option.rotate ? `rotate-${option.rotate}` : ''}`} />
                <span className="text-xs sm:text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 身高 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            身高 <span className="text-white/40">（选填）</span>
          </label>
          <div className="relative">
            <Ruler className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <input
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleChange('height', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="cm"
              min={100}
              max={250}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all`}
            />
          </div>
        </div>

        {/* 体重 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            体重 <span className="text-white/40">（选填）</span>
          </label>
          <div className="relative">
            <Weight className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <input
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleChange('weight', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="kg"
              min={20}
              max={150}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all`}
            />
          </div>
        </div>

        {/* 当前所属球队 */}
        <div className="lg:col-span-2">
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            当前所属球队/学校 <span className="text-white/40">（选填）</span>
          </label>
          <div className="relative">
            <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <input
              type="text"
              value={formData.currentTeam || ''}
              onChange={(e) => handleChange('currentTeam', e.target.value)}
              placeholder="例如：某某学校足球队、某某俱乐部"
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all`}
            />
          </div>
        </div>

        {/* 球衣号码 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            球衣号码 <span className="text-white/40">（选填）</span>
          </label>
          <div className="relative">
            <Shirt className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <input
              type="number"
              value={formData.jerseyNumber || ''}
              onChange={(e) => handleChange('jerseyNumber', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="1-99"
              min={1}
              max={99}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all`}
            />
          </div>
        </div>

        {/* 注册足协 */}
        <div>
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            注册足协 <span className="text-white/40">（选填）</span>
          </label>
          <input
            type="text"
            value={formData.association || ''}
            onChange={(e) => handleChange('association', e.target.value)}
            placeholder="如：中国足协"
            className={`w-full px-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all`}
          />
        </div>

        {/* 踢球风格 */}
        <div className="lg:col-span-2">
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            踢球风格 <span className="text-red-400">*</span> <span className="text-white/40">（最多选3个）</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {playingStyles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => togglePlayingStyle(style.value)}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-start gap-2 ${
                  formData.playingStyle.includes(style.value)
                    ? `border-${theme.primary} ${theme.bgCard}`
                    : `border-white/10 bg-white/5 hover:border-${theme.primary}/30`
                }`}
              >
                <style.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  formData.playingStyle.includes(style.value) ? 'text-white' : 'text-emerald-200/60'
                }`} />
                <div>
                  <div className={`font-medium text-xs sm:text-sm ${
                    formData.playingStyle.includes(style.value) ? 'text-white' : 'text-emerald-200/80'
                  }`}>
                    {style.label}
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-200/50 mt-0.5">{style.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {errors.playingStyle && <p className="mt-1 text-red-400 text-xs">{errors.playingStyle}</p>}
        </div>

        {/* 足球经历 */}
        <div className="lg:col-span-2">
          <label className="block text-emerald-200/80 font-medium mb-2 text-sm">
            足球经历 <span className="text-white/40">（选填）</span>
          </label>
          
          {/* 已添加的经历 */}
          {formData.experience.length > 0 && (
            <div className="space-y-2 mb-3">
              {formData.experience.map((exp) => (
                <div key={exp.id} className={`p-3 bg-white/5 border ${theme.border} rounded-xl flex items-start justify-between`}>
                  <div>
                    <div className="text-white text-sm font-medium">{exp.team}</div>
                    <div className="text-emerald-200/60 text-xs">{exp.period} · {exp.position}</div>
                    {exp.achievement && (
                      <div className="text-amber-400 text-xs mt-1">🏆 {exp.achievement}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 添加经历表单 */}
          {showExperienceForm ? (
            <div className={`p-4 bg-white/5 border ${theme.border} rounded-xl space-y-3`}>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="时间段"
                  value={newExperience.period || ''}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, period: e.target.value }))}
                  className={`w-full px-4 py-2 bg-white/5 border ${theme.border} rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 text-sm`}
                />
                <input
                  type="text"
                  placeholder="球队名称"
                  value={newExperience.team || ''}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, team: e.target.value }))}
                  className={`w-full px-4 py-2 bg-white/5 border ${theme.border} rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 text-sm`}
                />
              </div>
              <input
                type="text"
                placeholder="担任位置"
                value={newExperience.position || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                className={`w-full px-4 py-2 bg-white/5 border ${theme.border} rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 text-sm`}
              />
              <input
                type="text"
                placeholder="主要成绩（选填）"
                value={newExperience.achievement || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, achievement: e.target.value }))}
                className={`w-full px-4 py-2 bg-white/5 border ${theme.border} rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 text-sm`}
              />
              <div className="flex gap-2">
                <button
                  onClick={addExperience}
                  className={`flex-1 py-2 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors`}
                >
                  确认添加
                </button>
                <button
                  onClick={() => { setShowExperienceForm(false); setNewExperience({}); }}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowExperienceForm(true)}
              className="w-full py-3 border border-dashed border-white/20 rounded-xl text-emerald-200/60 hover:text-emerald-200 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加足球经历
            </button>
          )}
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 sm:py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`flex-1 py-3 sm:py-4 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base ${theme.shadow}`}
        >
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          完成注册
        </button>
      </div>
    </div>
  );
};

export default Step4PlayerSpecific;
