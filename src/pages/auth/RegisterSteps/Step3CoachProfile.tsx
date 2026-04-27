import React, { useState, useRef } from 'react';
import { Upload, User, Award, Calendar, MapPin, Phone, Mail, FileText, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';

export interface CoachProfileData {
  name: string;
  avatar?: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  licenseType: 'a' | 'b' | 'c' | 'd' | 'pro' | 'other' | 'none';
  licenseNumber: string;
  licenseImage?: string;
  coachingYears: string;
  experience: CoachingExperience[];
  specialties: string[];
  introduction: string;
  coachingPhilosophy: string;
}

interface CoachingExperience {
  id: string;
  clubName: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface Step3CoachProfileProps {
  onComplete: (data: CoachProfileData) => void;
  onBack: () => void;
  loading?: boolean;
}

const provinces = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省','青海省','宁夏回族自治区','新疆维吾尔自治区','台湾省','香港特别行政区','澳门特别行政区'];

const licenseTypes = [
  { value: 'pro', label: '职业级教练证书', description: '亚足联/中国足协职业级' },
  { value: 'a', label: 'A级教练证书', description: '亚足联/中国足协A级' },
  { value: 'b', label: 'B级教练证书', description: '亚足联/中国足协B级' },
  { value: 'c', label: 'C级教练证书', description: '亚足联/中国足协C级' },
  { value: 'd', label: 'D级教练证书', description: '亚足联/中国足协D级' },
  { value: 'other', label: '其他证书', description: '其他机构认证的教练证书' },
  { value: 'none', label: '暂无证书', description: '正在考取或经验丰富暂无证书' },
];

const specialtyOptions = ['技术训练','战术指导','体能训练','守门员训练','青少年培养','进攻训练','防守训练','定位球训练','心理辅导','视频分析','比赛分析','团队管理'];

const coachingYearOptions = [
  { value: '0-1', label: '1年以下' },
  { value: '1-3', label: '1-3年' },
  { value: '3-5', label: '3-5年' },
  { value: '5-10', label: '5-10年' },
  { value: '10+', label: '10年以上' },
];

const Step3CoachProfile: React.FC<Step3CoachProfileProps> = ({ onComplete, onBack, loading = false }) => {
  const [formData, setFormData] = useState<CoachProfileData>({
    name: '', gender: 'male', birthDate: '', phone: '', email: '', province: '', city: '', address: '',
    licenseType: 'c', licenseNumber: '', coachingYears: '', experience: [], specialties: [],
    introduction: '', coachingPhilosophy: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState('');
  const [licensePreview, setLicensePreview] = useState('');
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [newExperience, setNewExperience] = useState<Partial<CoachingExperience>>({ isCurrent: false });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CoachProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setAvatarPreview(reader.result as string); setFormData(prev => ({ ...prev, avatar: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setLicensePreview(reader.result as string); setFormData(prev => ({ ...prev, licenseImage: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({ ...prev, specialties: prev.specialties.includes(specialty) ? prev.specialties.filter(s => s !== specialty) : [...prev.specialties, specialty] }));
  };

  const handleAddExperience = () => {
    if (!newExperience.clubName || !newExperience.position || !newExperience.startDate) return;
    const experience: CoachingExperience = { id: Date.now().toString(), clubName: newExperience.clubName || '', position: newExperience.position || '', startDate: newExperience.startDate || '', endDate: newExperience.endDate || '', isCurrent: newExperience.isCurrent || false, description: newExperience.description || '' };
    setFormData(prev => ({ ...prev, experience: [...prev.experience, experience] }));
    setNewExperience({ isCurrent: false }); setShowAddExperience(false);
  };

  const handleRemoveExperience = (id: string) => { setFormData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== id) })); };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入姓名';
    if (!formData.birthDate) newErrors.birthDate = '请选择出生日期';
    if (!formData.phone.trim()) newErrors.phone = '请输入联系电话'; else if (!/^1[3-9]\d{9}$/.test(formData.phone)) newErrors.phone = '请输入正确的手机号';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '请输入正确的邮箱地址';
    if (!formData.province) newErrors.province = '请选择省份';
    if (!formData.city.trim()) newErrors.city = '请输入城市';
    if (!formData.coachingYears) newErrors.coachingYears = '请选择执教年限';
    if (formData.licenseType !== 'none' && !formData.licenseNumber.trim()) newErrors.licenseNumber = '请输入证书编号';
    if (formData.specialties.length === 0) newErrors.specialties = '请至少选择一个擅长领域';
    setErrors(newErrors); return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validateForm()) onComplete(formData); };

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 认证提示 */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-700">
            <p className="font-semibold mb-1">教练员认证说明</p>
            <p>提交真实完整的执教资质有助于快速通过审核。审核通过后，您可以关注球员、查看分析报告并给出训练建议。</p>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><User className="w-5 h-5 text-[#4ade80]" />基本信息</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div onClick={() => avatarInputRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all bg-slate-50 overflow-hidden">
                {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-400">头像</span></>}
              </div>
              <div><p className="text-sm font-medium text-slate-700">上传个人照片</p><p className="text-xs text-slate-400 mt-1">建议使用证件照，支持 JPG、PNG</p></div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="请输入真实姓名" className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">性别 <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={(e) => handleChange('gender', e.target.value)} className="w-4 h-4 text-[#4ade80] focus:ring-[#4ade80]" /><span className="text-slate-700">男</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={(e) => handleChange('gender', e.target.value)} className="w-4 h-4 text-[#4ade80] focus:ring-[#4ade80]" /><span className="text-slate-700">女</span></label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">出生日期 <span className="text-red-500">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="date" value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.birthDate ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`} />
              </div>
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-[#4ade80]" />联系方式</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">手机号码 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="请输入手机号" className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`} />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">电子邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="请输入邮箱（选填）" className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`} />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">省份 <span className="text-red-500">*</span></label>
                <select value={formData.province} onChange={(e) => handleChange('province', e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${errors.province ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all bg-white`}>
                  <option value="">请选择省份</option>
                  {provinces.map(province => (<option key={province} value={province}>{province}</option>))}
                </select>
                {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">城市 <span className="text-red-500">*</span></label>
                <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="请输入城市" className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`} />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">详细地址</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="请输入详细地址（选填）" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* 执教资质 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-[#4ade80]" />执教资质</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">教练证书类型 <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {licenseTypes.map((type) => (
                  <label key={type.value} className={`relative cursor-pointer p-3 rounded-xl border-2 transition-all ${formData.licenseType === type.value ? 'border-[#4ade80] bg-[#4ade80]/5' : 'border-slate-200 hover:border-[#4ade80]/50'}`}>
                    <input type="radio" name="licenseType" value={type.value} checked={formData.licenseType === type.value} onChange={(e) => handleChange('licenseType', e.target.value)} className="sr-only" />
                    <p className="font-medium text-primary text-sm">{type.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{type.description}</p>
                    {formData.licenseType === type.value && <div className="absolute top-1 right-1"><CheckCircle className="w-4 h-4 text-[#4ade80]" /></div>}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">证书编号 {formData.licenseType !== 'none' && <span className="text-red-500">*</span>}</label>
                <input type="text" value={formData.licenseNumber} onChange={(e) => handleChange('licenseNumber', e.target.value)} placeholder={formData.licenseType === 'none' ? '暂无证书可不填' : '请输入证书编号'} disabled={formData.licenseType === 'none'} className={`w-full px-4 py-3 rounded-xl border ${errors.licenseNumber ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed`} />
                {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">执教年限 <span className="text-red-500">*</span></label>
                <select value={formData.coachingYears} onChange={(e) => handleChange('coachingYears', e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${errors.coachingYears ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all bg-white`}>
                  <option value="">请选择执教年限</option>
                  {coachingYearOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
                </select>
                {errors.coachingYears && <p className="text-red-500 text-sm mt-1">{errors.coachingYears}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">证书照片</label>
              <div onClick={() => licenseInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all bg-slate-50">
                {licensePreview ? (
                  <div className="flex items-center gap-4">
                    <img src={licensePreview} alt="License" className="w-32 h-20 object-cover rounded-lg" />
                    <div><p className="text-sm text-slate-600">证书照片已上传</p><p className="text-xs text-slate-400 mt-1">点击更换</p></div>
                  </div>
                ) : (
                  <div className="text-center"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-600">点击上传教练证书</p><p className="text-xs text-slate-400 mt-1">支持 JPG、PNG、PDF 格式</p></div>
                )}
                <input ref={licenseInputRef} type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* 执教经历 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4">执教经历</h3>
          <div className="space-y-4">
            {formData.experience.length > 0 && (
              <div className="space-y-3">
                {formData.experience.map((exp) => (
                  <div key={exp.id} className="bg-slate-50 rounded-xl p-4 relative">
                    <button type="button" onClick={() => handleRemoveExperience(exp.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-4 h-4" /></button>
                    <div className="pr-8">
                      <h4 className="font-semibold text-primary">{exp.clubName}</h4>
                      <p className="text-sm text-[#4ade80]">{exp.position}</p>
                      <p className="text-xs text-slate-400 mt-1">{exp.startDate} - {exp.isCurrent ? '至今' : exp.endDate}</p>
                      {exp.description && <p className="text-sm text-slate-500 mt-2">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showAddExperience ? (
              <button type="button" onClick={() => setShowAddExperience(true)} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-[#4ade80] hover:text-[#4ade80] transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" />添加执教经历</button>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <input type="text" placeholder="俱乐部/球队名称" value={newExperience.clubName || ''} onChange={(e) => setNewExperience(prev => ({ ...prev, clubName: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#4ade80] outline-none" />
                <input type="text" placeholder="担任职位（如：主教练、助理教练）" value={newExperience.position || ''} onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#4ade80] outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="month" placeholder="开始时间" value={newExperience.startDate || ''} onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#4ade80] outline-none" />
                  {!newExperience.isCurrent && <input type="month" placeholder="结束时间" value={newExperience.endDate || ''} onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#4ade80] outline-none" />}
                </div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newExperience.isCurrent || false} onChange={(e) => setNewExperience(prev => ({ ...prev, isCurrent: e.target.checked }))} className="w-4 h-4 text-[#4ade80] rounded" /><span className="text-sm text-slate-600">当前在职</span></label>
                <textarea placeholder="工作描述（选填）" value={newExperience.description || ''} onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-[#4ade80] outline-none resize-none" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAddExperience(false)} className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">取消</button>
                  <button type="button" onClick={handleAddExperience} className="flex-1 py-2 bg-[#4ade80] text-white rounded-lg hover:bg-[#22c55e] transition-colors">确认添加</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 擅长领域 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4">擅长领域</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">请选择您擅长的训练领域（可多选） <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {specialtyOptions.map((specialty) => (
                <button key={specialty} type="button" onClick={() => handleSpecialtyToggle(specialty)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.specialties.includes(specialty) ? 'bg-[#4ade80] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{specialty}</button>
              ))}
            </div>
            {errors.specialties && <p className="text-red-500 text-sm mt-2">{errors.specialties}</p>}
          </div>
        </div>

        {/* 个人介绍 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#4ade80]" />个人介绍</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">个人简介</label>
              <textarea value={formData.introduction} onChange={(e) => handleChange('introduction', e.target.value)} placeholder="请简要介绍您的执教经历、风格、特点等" rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">执教理念</label>
              <textarea value={formData.coachingPhilosophy} onChange={(e) => handleChange('coachingPhilosophy', e.target.value)} placeholder="请描述您的执教理念、训练方法等" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all resize-none" />
            </div>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onBack} disabled={loading} className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50">上一步</button>
          <button type="submit" disabled={loading} className="flex-1 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</> : <><>提交申请</><CheckCircle className="w-5 h-5" /></>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step3CoachProfile;
