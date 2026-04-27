import React, { useState } from 'react';
import { GraduationCap, Award, Clock, Target, Plus, X, ArrowLeft, ArrowRight, CheckCircle2, FileText } from 'lucide-react';

interface Step4CoachSpecificProps {
  onSubmit: (data: CoachSpecificData) => void;
  onBack: () => void;
  defaultValues?: Partial<CoachSpecificData>;
}

export interface CoachSpecificData {
  licenseType: 'a' | 'b' | 'c' | 'd' | 'pro' | 'other' | 'none';
  licenseNumber?: string;
  licenseImage?: string;
  coachingYears: string;
  specialties: string[];
  coachingPhilosophy?: string;
  experience: CoachingExperience[];
}

interface CoachingExperience {
  id: string;
  period: string;
  team: string;
  role: string;
  achievement?: string;
}

const licenseTypes = [
  { value: 'pro', label: '职业级', desc: '亚足联职业级教练证' },
  { value: 'a', label: 'A级', desc: '亚足联A级教练证' },
  { value: 'b', label: 'B级', desc: '亚足联B级教练证' },
  { value: 'c', label: 'C级', desc: '亚足联C级教练证' },
  { value: 'd', label: 'D级', desc: '中国足协D级教练证' },
  { value: 'other', label: '其他', desc: '其他认证' },
  { value: 'none', label: '暂无', desc: '暂无证书' },
];

const specialtyOptions = [
  { value: 'gk', label: '门将训练', icon: '🧤' },
  { value: 'defense', label: '防守训练', icon: '🛡️' },
  { value: 'midfield', label: '中场组织', icon: '⚙️' },
  { value: 'attack', label: '进攻训练', icon: '⚡' },
  { value: 'fitness', label: '体能训练', icon: '💪' },
  { value: 'tactical', label: '战术分析', icon: '📊' },
  { value: 'youth', label: '青训培养', icon: '🌱' },
  { value: 'psychology', label: '心理辅导', icon: '🧠' },
];

const Step4CoachSpecific: React.FC<Step4CoachSpecificProps> = ({ onSubmit, onBack, defaultValues }) => {
  // 映射教练等级
  const mapCoachLevel = (level?: string): CoachSpecificData['licenseType'] => {
    if (!level) return 'c';
    if (level.includes('PRO') || level.includes('Pro')) return 'pro';
    if (level.includes('A')) return 'a';
    if (level.includes('B')) return 'b';
    if (level.includes('C')) return 'c';
    if (level.includes('D')) return 'd';
    return 'other';
  };

  const [formData, setFormData] = useState<CoachSpecificData>({
    licenseType: mapCoachLevel((defaultValues as any)?.coachLevel),
    licenseNumber: defaultValues?.licenseNumber || '',
    licenseImage: defaultValues?.licenseImage || (defaultValues as any)?.certificates?.[0]?.image || '',
    coachingYears: (defaultValues as any)?.teachingExperience || defaultValues?.coachingYears || '',
    specialties: (defaultValues as any)?.specialty ? [(defaultValues as any).specialty] : defaultValues?.specialties || [],
    coachingPhilosophy: defaultValues?.coachingPhilosophy || (defaultValues as any)?.careerHighlight || '',
    experience: defaultValues?.experience || [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CoachSpecificData, string>>>({});
  const [showExpForm, setShowExpForm] = useState(false);
  const [newExp, setNewExp] = useState<Partial<CoachingExperience>>({});

  const handleChange = (field: keyof CoachSpecificData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty].slice(0, 4),
    }));
  };

  const addExperience = () => {
    if (newExp.period && newExp.team && newExp.role) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, { ...newExp, id: Date.now().toString() } as CoachingExperience],
      }));
      setNewExp({});
      setShowExpForm(false);
    }
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter(e => e.id !== id),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CoachSpecificData, string>> = {};

    if (!formData.coachingYears) {
      newErrors.coachingYears = '请填写执教年限';
    }
    if (formData.specialties.length === 0) {
      newErrors.specialties = '请至少选择一个擅长领域';
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
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">执教履历</h2>
        <p className="text-blue-200/60">完善您的教练资质和执教经历</p>
      </div>

      {/* 教练证书 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          教练证书等级
        </label>
        <div className="grid grid-cols-2 gap-2">
          {licenseTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('licenseType', type.value)}
              className={`py-3 px-3 rounded-xl border text-left transition-all ${
                formData.licenseType === type.value
                  ? 'border-rose-500 bg-rose-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`font-medium text-sm ${
                formData.licenseType === type.value ? 'text-white' : 'text-blue-200/80'
              }`}>
                {type.label}
              </div>
              <div className="text-xs text-blue-200/50">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 证书编号 */}
      {formData.licenseType !== 'none' && (
        <div>
          <label className="block text-blue-200/80 font-medium mb-2 text-sm">
            证书编号 <span className="text-blue-400">（选填）</span>
          </label>
          <div className="relative">
            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              type="text"
              value={formData.licenseNumber || ''}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              placeholder="请输入教练证书编号"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>
      )}

      {/* 执教年限 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          执教年限 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <select
            value={formData.coachingYears}
            onChange={(e) => handleChange('coachingYears', e.target.value)}
            className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all appearance-none ${
              errors.coachingYears ? 'border-red-500/50' : 'border-white/10'
            }`}
          >
            <option value="" className="bg-slate-800">请选择执教年限</option>
            <option value="0-2" className="bg-slate-800">2年以下</option>
            <option value="2-5" className="bg-slate-800">2-5年</option>
            <option value="5-10" className="bg-slate-800">5-10年</option>
            <option value="10+" className="bg-slate-800">10年以上</option>
          </select>
        </div>
        {errors.coachingYears && <p className="mt-1 text-red-400 text-xs">{errors.coachingYears}</p>}
      </div>

      {/* 擅长领域 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          擅长领域 <span className="text-red-400">*</span> <span className="text-blue-400">（最多选4个）</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {specialtyOptions.map((spec) => (
            <button
              key={spec.value}
              type="button"
              onClick={() => toggleSpecialty(spec.value)}
              className={`py-3 px-2 rounded-xl border text-center transition-all ${
                formData.specialties.includes(spec.value)
                  ? 'border-rose-500 bg-rose-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-2xl mb-1">{spec.icon}</div>
              <div className={`text-xs ${
                formData.specialties.includes(spec.value) ? 'text-white' : 'text-blue-200/60'
              }`}>
                {spec.label}
              </div>
            </button>
          ))}
        </div>
        {errors.specialties && <p className="mt-1 text-red-400 text-xs">{errors.specialties}</p>}
      </div>

      {/* 执教理念 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          执教理念 <span className="text-blue-400">（选填）</span>
        </label>
        <div className="relative">
          <Target className="absolute left-4 top-3 w-5 h-5 text-blue-400" />
          <textarea
            value={formData.coachingPhilosophy || ''}
            onChange={(e) => handleChange('coachingPhilosophy', e.target.value)}
            placeholder="简述您的执教风格和理念，让球员和家长更好地了解您"
            rows={3}
            maxLength={200}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none"
          />
        </div>
        <p className="text-right text-blue-200/40 text-xs mt-1">
          {(formData.coachingPhilosophy?.length || 0)}/200
        </p>
      </div>

      {/* 执教经历 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          执教经历 <span className="text-blue-400">（选填）</span>
        </label>
        
        {formData.experience.length > 0 && (
          <div className="space-y-2 mb-3">
            {formData.experience.map((exp) => (
              <div key={exp.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start justify-between">
                <div>
                  <div className="text-white text-sm font-medium">{exp.team}</div>
                  <div className="text-blue-200/60 text-xs">{exp.period} · {exp.role}</div>
                  {exp.achievement && (
                    <div className="text-emerald-400 text-xs mt-1">🏆 {exp.achievement}</div>
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

        {showExpForm ? (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <input
              type="text"
              placeholder="时间段，如：2020-2023"
              value={newExp.period || ''}
              onChange={(e) => setNewExp(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <input
              type="text"
              placeholder="球队/俱乐部名称"
              value={newExp.team || ''}
              onChange={(e) => setNewExp(prev => ({ ...prev, team: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <input
              type="text"
              placeholder="担任职务，如：主教练、助理教练"
              value={newExp.role || ''}
              onChange={(e) => setNewExp(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <input
              type="text"
              placeholder="主要成绩（选填）"
              value={newExp.achievement || ''}
              onChange={(e) => setNewExp(prev => ({ ...prev, achievement: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={addExperience}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认添加
              </button>
              <button
                onClick={() => { setShowExpForm(false); setNewExp({}); }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowExpForm(true)}
            className="w-full py-3 border border-dashed border-white/20 rounded-xl text-blue-200/60 hover:text-blue-200 hover:border-white/40 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加执教经历
          </button>
        )}
      </div>

      {/* 提示 */}
      <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl">
        <p className="text-sm text-amber-200/80">
          <span className="font-medium">⚠️ 提示：</span>
          提交后您的教练资料将进入审核流程，审核通过后可使用关注球员、训练计划等功能。
        </p>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          提交审核
        </button>
      </div>
    </div>
  );
};

export default Step4CoachSpecific;
