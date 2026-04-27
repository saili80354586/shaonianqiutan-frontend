import React, { useState } from 'react';
import { Building2, Users, Trophy, FileText, ArrowLeft, ArrowRight, CheckCircle2, Upload } from 'lucide-react';

interface Step4ClubSpecificProps {
  onSubmit: (data: ClubSpecificData) => void;
  onBack: () => void;
  defaultValues?: Partial<ClubSpecificData>;
}

export interface ClubSpecificData {
  clubFullName: string;
  establishedYear: string;
  clubType: 'professional' | 'youth' | 'school' | 'amateur' | 'other';
  address: string;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail?: string;
  clubSize: 'small' | 'medium' | 'large';
  teamCount: number;
  playerCount: number;
  coachCount: number;
  achievements?: string;
  businessLicense?: string;
}

const clubTypes = [
  { value: 'professional', label: '职业俱乐部' },
  { value: 'youth', label: '青训俱乐部' },
  { value: 'school', label: '学校足球队' },
  { value: 'amateur', label: '业余俱乐部' },
  { value: 'other', label: '其他' },
];

const clubSizes = [
  { value: 'small', label: '小型', desc: '50人以下' },
  { value: 'medium', label: '中型', desc: '50-200人' },
  { value: 'large', label: '大型', desc: '200人以上' },
];

const Step4ClubSpecific: React.FC<Step4ClubSpecificProps> = ({ onSubmit, onBack, defaultValues }) => {
  const [formData, setFormData] = useState<ClubSpecificData>({
    clubFullName: defaultValues?.clubFullName || (defaultValues as any)?.clubName || '',
    establishedYear: defaultValues?.establishedYear || '',
    clubType: defaultValues?.clubType || 'youth',
    address: defaultValues?.address || (defaultValues as any)?.clubAddress || '',
    contactName: defaultValues?.contactName || '',
    contactPosition: defaultValues?.contactPosition || '',
    contactPhone: defaultValues?.contactPhone || '',
    contactEmail: defaultValues?.contactEmail || '',
    clubSize: (defaultValues as any)?.clubScale || 'medium',
    teamCount: defaultValues?.teamCount || 1,
    playerCount: defaultValues?.playerCount || 20,
    coachCount: defaultValues?.coachCount || 2,
    achievements: defaultValues?.achievements || (defaultValues as any)?.clubIntro || '',
    businessLicense: defaultValues?.businessLicense || (defaultValues as any)?.licenseImage || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClubSpecificData, string>>>({});

  const handleChange = (field: keyof ClubSpecificData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClubSpecificData, string>> = {};

    if (!formData.clubFullName.trim()) {
      newErrors.clubFullName = '请填写俱乐部全称';
    }
    if (!formData.address.trim()) {
      newErrors.address = '请填写详细地址';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = '请填写联系人姓名';
    }
    if (!formData.contactPosition.trim()) {
      newErrors.contactPosition = '请填写联系人职位';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '请填写联系电话';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">俱乐部详情</h2>
        <p className="text-blue-200/60">完善俱乐部信息，便于球员和平台了解</p>
      </div>

      {/* 俱乐部全称 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          俱乐部全称 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.clubFullName}
          onChange={(e) => handleChange('clubFullName', e.target.value)}
          placeholder="例如：上海某某足球俱乐部"
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all ${
            errors.clubFullName ? 'border-red-500/50' : 'border-white/10'
          }`}
        />
        {errors.clubFullName && <p className="mt-1 text-red-400 text-xs">{errors.clubFullName}</p>}
      </div>

      {/* 成立年份 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          成立年份 <span className="text-blue-400">（选填）</span>
        </label>
        <select
          value={formData.establishedYear}
          onChange={(e) => handleChange('establishedYear', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all appearance-none"
        >
          <option value="" className="bg-slate-800">请选择成立年份</option>
          {years.map(year => (
            <option key={year} value={year} className="bg-slate-800">{year}年</option>
          ))}
        </select>
      </div>

      {/* 俱乐部类型 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          俱乐部类型
        </label>
        <div className="grid grid-cols-2 gap-2">
          {clubTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleChange('clubType', type.value)}
              className={`py-3 px-4 rounded-xl border text-sm transition-all ${
                formData.clubType === type.value
                  ? 'border-amber-500 bg-amber-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 俱乐部规模 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          俱乐部规模
        </label>
        <div className="flex gap-3">
          {clubSizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => handleChange('clubSize', size.value)}
              className={`flex-1 py-3 px-2 rounded-xl border text-sm transition-all ${
                formData.clubSize === size.value
                  ? 'border-amber-500 bg-amber-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20'
              }`}
            >
              <div className="font-medium">{size.label}</div>
              <div className="text-xs opacity-70">{size.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 人员配置 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          人员配置
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-blue-200/50 mb-1">球队数量</div>
            <input
              type="number"
              value={formData.teamCount}
              onChange={(e) => handleChange('teamCount', parseInt(e.target.value) || 0)}
              min={1}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <div className="text-xs text-blue-200/50 mb-1">球员数量</div>
            <input
              type="number"
              value={formData.playerCount}
              onChange={(e) => handleChange('playerCount', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <div className="text-xs text-blue-200/50 mb-1">教练数量</div>
            <input
              type="number"
              value={formData.coachCount}
              onChange={(e) => handleChange('coachCount', parseInt(e.target.value) || 0)}
              min={0}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* 详细地址 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          详细地址 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="请填写俱乐部的详细地址，包括省市区和街道"
          rows={2}
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none ${
            errors.address ? 'border-red-500/50' : 'border-white/10'
          }`}
        />
        {errors.address && <p className="mt-1 text-red-400 text-xs">{errors.address}</p>}
      </div>

      {/* 联系人信息 */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-medium">
          <Users className="w-5 h-5 text-blue-400" />
          联系人信息
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-blue-200/60 text-xs mb-1">姓名 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="联系人姓名"
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm ${
                errors.contactName ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.contactName && <p className="mt-1 text-red-400 text-xs">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-blue-200/60 text-xs mb-1">职位 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={formData.contactPosition}
              onChange={(e) => handleChange('contactPosition', e.target.value)}
              placeholder="如：青训总监"
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm ${
                errors.contactPosition ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.contactPosition && <p className="mt-1 text-red-400 text-xs">{errors.contactPosition}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-blue-200/60 text-xs mb-1">电话 <span className="text-red-400">*</span></label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="联系电话"
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm ${
                errors.contactPhone ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.contactPhone && <p className="mt-1 text-red-400 text-xs">{errors.contactPhone}</p>}
          </div>
          <div>
            <label className="block text-blue-200/60 text-xs mb-1">邮箱 <span className="text-blue-400">（选填）</span></label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="联系邮箱"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 主要成绩 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          主要成绩/荣誉 <span className="text-blue-400">（选填）</span>
        </label>
        <div className="relative">
          <Trophy className="absolute left-4 top-3 w-5 h-5 text-blue-400" />
          <textarea
            value={formData.achievements || ''}
            onChange={(e) => handleChange('achievements', e.target.value)}
            placeholder="请简述俱乐部的主要成绩和荣誉，如：2023年市青少年联赛冠军"
            rows={3}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none"
          />
        </div>
      </div>

      {/* 营业执照 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          营业执照/资质证明 <span className="text-blue-400">（选填）</span>
        </label>
        <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors">
          <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">点击上传营业执照或相关资质证明</p>
          <p className="text-white/30 text-xs mt-1">支持 JPG、PNG、PDF 格式</p>
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl">
        <p className="text-sm text-amber-200/80">
          <span className="font-medium">⚠️ 提示：</span>
          提交后俱乐部资料将进入审核流程，审核通过后可使用球队管理、批量订单等功能。
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
          className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          提交审核
        </button>
      </div>
    </div>
  );
};

export default Step4ClubSpecific;
