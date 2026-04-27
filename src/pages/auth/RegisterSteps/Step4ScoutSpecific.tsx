import React, { useState } from 'react';
import { Search, Award, Clock, Target, Plus, X, ArrowLeft, ArrowRight, CheckCircle2, MapPin, Users } from 'lucide-react';

interface Step4ScoutSpecificProps {
  onSubmit: (data: ScoutSpecificData) => void;
  onBack: () => void;
  defaultValues?: Partial<ScoutSpecificData>;
}

export interface ScoutSpecificData {
  scoutingExperience: string;  // 球探年限
  specialties: string[];  // 擅长发掘的位置
  preferredAgeGroups: string[];  // 偏好年龄段
  currentOrganization?: string;  // 所属机构
  bio?: string;  // 个人简介
  scoutingRegions: string[];  // 球探区域
}

// 位置选项
const positionOptions = [
  { value: 'forward', label: '前锋', icon: '⚡' },
  { value: 'attacking_midfielder', label: '前腰', icon: '🎯' },
  { value: 'midfielder', label: '中场', icon: '⚙️' },
  { value: 'defensive_midfielder', label: '后腰', icon: '🛡️' },
  { value: 'defender', label: '后卫', icon: '🔒' },
  { value: 'goalkeeper', label: '门将', icon: '🧤' },
  { value: 'winger', label: '边锋', icon: '💨' },
  { value: 'fullback', label: '边后卫', icon: '🏃' },
];

// 年龄段选项
const ageGroupOptions = [
  { value: 'U8', label: 'U8', desc: '8岁以下' },
  { value: 'U10', label: 'U10', desc: '10岁以下' },
  { value: 'U12', label: 'U12', desc: '12岁以下' },
  { value: 'U14', label: 'U14', desc: '14岁以下' },
  { value: 'U16', label: 'U16', desc: '16岁以下' },
  { value: 'U18', label: 'U18', desc: '18岁以下' },
  { value: 'adult', label: '成年', desc: '18岁以上' },
];

// 区域选项
const regionOptions = [
  { value: '华东', label: '华东地区' },
  { value: '华北', label: '华北地区' },
  { value: '华中', label: '华中地区' },
  { value: '华南', label: '华南地区' },
  { value: '西南', label: '西南地区' },
  { value: '西北', label: '西北地区' },
  { value: '东北', label: '东北地区' },
  { value: '海外', label: '海外' },
];

const Step4ScoutSpecific: React.FC<Step4ScoutSpecificProps> = ({ onSubmit, onBack, defaultValues }) => {
  const [formData, setFormData] = useState<ScoutSpecificData>({
    scoutingExperience: defaultValues?.scoutingExperience || '',
    specialties: defaultValues?.specialties || [],
    preferredAgeGroups: defaultValues?.preferredAgeGroups || [],
    currentOrganization: defaultValues?.currentOrganization || '',
    bio: defaultValues?.bio || '',
    scoutingRegions: defaultValues?.scoutingRegions || [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ScoutSpecificData, string>>>({});

  const handleChange = (field: keyof ScoutSpecificData, value: any) => {
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
        : [...prev.specialties, specialty],
    }));
  };

  const toggleAgeGroup = (ageGroup: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAgeGroups: prev.preferredAgeGroups.includes(ageGroup)
        ? prev.preferredAgeGroups.filter(a => a !== ageGroup)
        : [...prev.preferredAgeGroups, ageGroup],
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      scoutingRegions: prev.scoutingRegions.includes(region)
        ? prev.scoutingRegions.filter(r => r !== region)
        : [...prev.scoutingRegions, region],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ScoutSpecificData, string>> = {};

    if (!formData.scoutingExperience) {
      newErrors.scoutingExperience = '请选择球探年限';
    }
    if (formData.specialties.length === 0) {
      newErrors.specialties = '请至少选择一个擅长发掘的位置';
    }
    if (formData.preferredAgeGroups.length === 0) {
      newErrors.preferredAgeGroups = '请至少选择一个偏好年龄段';
    }
    if (formData.scoutingRegions.length === 0) {
      newErrors.scoutingRegions = '请至少选择一个球探区域';
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
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
          <Search className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">球探档案</h2>
        <p className="text-violet-200/60">完善您的球探资质和专业背景</p>
      </div>

      {/* 球探年限 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          球探经验 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
          <select
            value={formData.scoutingExperience}
            onChange={(e) => handleChange('scoutingExperience', e.target.value)}
            className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all appearance-none ${
              errors.scoutingExperience ? 'border-red-500/50' : 'border-white/10'
            }`}
          >
            <option value="" className="bg-slate-800">请选择球探年限</option>
            <option value="0-1" className="bg-slate-800">1年以下</option>
            <option value="1-3" className="bg-slate-800">1-3年</option>
            <option value="3-5" className="bg-slate-800">3-5年</option>
            <option value="5-10" className="bg-slate-800">5-10年</option>
            <option value="10+" className="bg-slate-800">10年以上</option>
          </select>
        </div>
        {errors.scoutingExperience && <p className="mt-1 text-red-400 text-xs">{errors.scoutingExperience}</p>}
      </div>

      {/* 擅长发掘位置 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          擅长发掘位置 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {positionOptions.map((pos) => (
            <button
              key={pos.value}
              type="button"
              onClick={() => toggleSpecialty(pos.value)}
              className={`py-3 px-2 rounded-xl border text-center transition-all ${
                formData.specialties.includes(pos.value)
                  ? 'border-violet-500 bg-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="text-2xl mb-1">{pos.icon}</div>
              <div className={`text-xs ${
                formData.specialties.includes(pos.value) ? 'text-white' : 'text-violet-200/60'
              }`}>
                {pos.label}
              </div>
            </button>
          ))}
        </div>
        {errors.specialties && <p className="mt-1 text-red-400 text-xs">{errors.specialties}</p>}
      </div>

      {/* 偏好年龄段 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          偏好年龄段 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ageGroupOptions.map((age) => (
            <button
              key={age.value}
              type="button"
              onClick={() => toggleAgeGroup(age.value)}
              className={`py-3 px-2 rounded-xl border text-center transition-all ${
                formData.preferredAgeGroups.includes(age.value)
                  ? 'border-violet-500 bg-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`text-sm font-medium ${
                formData.preferredAgeGroups.includes(age.value) ? 'text-white' : 'text-violet-200/80'
              }`}>
                {age.label}
              </div>
              <div className="text-[10px] text-violet-200/40">{age.desc}</div>
            </button>
          ))}
        </div>
        {errors.preferredAgeGroups && <p className="mt-1 text-red-400 text-xs">{errors.preferredAgeGroups}</p>}
      </div>

      {/* 球探区域 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          球探区域 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {regionOptions.map((region) => (
            <button
              key={region.value}
              type="button"
              onClick={() => toggleRegion(region.value)}
              className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                formData.scoutingRegions.includes(region.value)
                  ? 'border-violet-500 bg-violet-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`text-xs ${
                formData.scoutingRegions.includes(region.value) ? 'text-white' : 'text-violet-200/60'
              }`}>
                {region.label}
              </div>
            </button>
          ))}
        </div>
        {errors.scoutingRegions && <p className="mt-1 text-red-400 text-xs">{errors.scoutingRegions}</p>}
      </div>

      {/* 所属机构 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          所属机构 <span className="text-violet-400">（选填）</span>
        </label>
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
          <input
            type="text"
            value={formData.currentOrganization || ''}
            onChange={(e) => handleChange('currentOrganization', e.target.value)}
            placeholder="如：XX俱乐部球探部门、XX经纪人团队"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 个人简介 */}
      <div>
        <label className="block text-violet-200/80 font-medium mb-2 text-sm">
          个人简介 <span className="text-violet-400">（选填）</span>
        </label>
        <div className="relative">
          <Target className="absolute left-4 top-3 w-5 h-5 text-violet-400" />
          <textarea
            value={formData.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="简述您的球探经历、专业背景和发掘理念"
            rows={3}
            maxLength={200}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all resize-none"
          />
        </div>
        <p className="text-right text-violet-200/40 text-xs mt-1">
          {(formData.bio?.length || 0)}/200
        </p>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl">
        <p className="text-sm text-amber-200/80">
          <span className="font-medium">⚠️ 提示：</span>
          提交后您的球探资料将进入审核流程，审核通过后可使用发现球员、撰写球探报告等功能。
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
          className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          提交审核
        </button>
      </div>
    </div>
  );
};

export default Step4ScoutSpecific;
