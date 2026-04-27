import React, { useState, useRef } from 'react';
import { Upload, Building2, MapPin, Phone, Mail, User, FileText, AlertCircle, CheckCircle } from 'lucide-react';

// 俱乐部资料数据接口
export interface ClubProfileData {
  clubName: string;
  clubShortName: string;
  clubLogo?: string;
  establishedYear: string;
  clubType: 'professional' | 'youth' | 'school' | 'amateur' | 'other';
  province: string;
  city: string;
  address: string;
  contactName: string;
  contactPosition: string;
  contactPhone: string;
  contactEmail: string;
  clubSize: 'small' | 'medium' | 'large';
  teamCount: string;
  playerCount: string;
  coachCount: string;
  clubDescription: string;
  achievements: string;
  businessLicense?: string;
  coachCertificates?: string[];
}

interface Step3ClubProfileProps {
  onComplete: (data: ClubProfileData) => void;
  onBack: () => void;
  loading?: boolean;
}

// 省份列表
const provinces = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区',
  '辽宁省', '吉林省', '黑龙江省', '上海市', '江苏省',
  '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '海南省', '重庆市', '四川省', '贵州省', '云南省',
  '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区',
  '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'
];

// 俱乐部类型
const clubTypes = [
  { value: 'professional', label: '职业俱乐部', description: '职业联赛参赛俱乐部' },
  { value: 'youth', label: '青训机构', description: '专注青少年足球培训' },
  { value: 'school', label: '学校球队', description: '中小学校园足球队' },
  { value: 'amateur', label: '业余俱乐部', description: '社区/企业业余球队' },
  { value: 'other', label: '其他', description: '其他类型足球组织' },
];

// 俱乐部规模
const clubSizes = [
  { value: 'small', label: '小型', description: '50人以下', players: '10-30人' },
  { value: 'medium', label: '中型', description: '50-200人', players: '30-100人' },
  { value: 'large', label: '大型', description: '200人以上', players: '100人以上' },
];

const Step3ClubProfile: React.FC<Step3ClubProfileProps> = ({
  onComplete,
  onBack,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ClubProfileData>({
    clubName: '',
    clubShortName: '',
    establishedYear: '',
    clubType: 'youth',
    province: '',
    city: '',
    address: '',
    contactName: '',
    contactPosition: '',
    contactPhone: '',
    contactEmail: '',
    clubSize: 'medium',
    teamCount: '',
    playerCount: '',
    coachCount: '',
    clubDescription: '',
    achievements: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [licensePreview, setLicensePreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // 处理输入变化
  const handleChange = (field: keyof ClubProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理 Logo 上传
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFormData(prev => ({ ...prev, clubLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理营业执照上传
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePreview(reader.result as string);
        setFormData(prev => ({ ...prev, businessLicense: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clubName.trim()) {
      newErrors.clubName = '请输入俱乐部全称';
    }

    if (!formData.clubShortName.trim()) {
      newErrors.clubShortName = '请输入俱乐部简称';
    }

    if (!formData.province) {
      newErrors.province = '请选择省份';
    }

    if (!formData.city.trim()) {
      newErrors.city = '请输入城市';
    }

    if (!formData.address.trim()) {
      newErrors.address = '请输入详细地址';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = '请输入联系人姓名';
    }

    if (!formData.contactPosition.trim()) {
      newErrors.contactPosition = '请输入联系人职位';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '请输入正确的手机号';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = '请输入正确的邮箱地址';
    }

    if (!formData.teamCount.trim()) {
      newErrors.teamCount = '请输入球队数量';
    }

    if (!formData.playerCount.trim()) {
      newErrors.playerCount = '请输入球员数量';
    }

    if (!formData.coachCount.trim()) {
      newErrors.coachCount = '请输入教练数量';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(formData);
    }
  };

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 认证提示 */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-700">
            <p className="font-semibold mb-1">俱乐部认证说明</p>
            <p>提交真实完整的俱乐部资料有助于快速通过审核。审核通过后，您可以管理旗下球员、批量下单分析服务。</p>
          </div>
        </div>

        {/* 俱乐部基本信息 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#4ade80]" />
            俱乐部基本信息
          </h3>
          
          <div className="space-y-4">
            {/* Logo 上传 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                俱乐部Logo
              </label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all bg-slate-50"
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-400">上传Logo</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-slate-500">
                  <p>建议尺寸：200x200px</p>
                  <p>支持 JPG、PNG 格式</p>
                  <p>文件大小不超过 2MB</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 俱乐部名称 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  俱乐部全称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.clubName}
                  onChange={(e) => handleChange('clubName', e.target.value)}
                  placeholder="请输入俱乐部全称"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.clubName ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.clubName && <p className="text-red-500 text-sm mt-1">{errors.clubName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  俱乐部简称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.clubShortName}
                  onChange={(e) => handleChange('clubShortName', e.target.value)}
                  placeholder="请输入简称"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.clubShortName ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.clubShortName && <p className="text-red-500 text-sm mt-1">{errors.clubShortName}</p>}
              </div>
            </div>

            {/* 成立年份和类型 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  成立年份
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.establishedYear}
                  onChange={(e) => handleChange('establishedYear', e.target.value)}
                  placeholder="如：2015"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  俱乐部类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.clubType}
                  onChange={(e) => handleChange('clubType', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all bg-white"
                >
                  {clubTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {clubTypes.find(t => t.value === formData.clubType)?.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 俱乐部地址 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#4ade80]" />
            俱乐部地址
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  省份 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.province ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all bg-white`}
                >
                  <option value="">请选择省份</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  城市 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="请输入城市"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                详细地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="请输入详细地址（街道、门牌号等）"
                className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* 联系人信息 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#4ade80]" />
            联系人信息
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  联系人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder="请输入联系人姓名"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.contactName ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  联系人职位 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactPosition}
                  onChange={(e) => handleChange('contactPosition', e.target.value)}
                  placeholder="如：青训总监、球队经理"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.contactPosition ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.contactPosition && <p className="text-red-500 text-sm mt-1">{errors.contactPosition}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="请输入手机号"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.contactPhone ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                  />
                </div>
                {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  联系邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="请输入邮箱（选填）"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${errors.contactEmail ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                  />
                </div>
                {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 俱乐部规模 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4">俱乐部规模</h3>
          
          <div className="space-y-4">
            {/* 规模选择 */}
            <div className="grid grid-cols-3 gap-3">
              {clubSizes.map((size) => (
                <label
                  key={size.value}
                  className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    formData.clubSize === size.value
                      ? 'border-[#4ade80] bg-[#4ade80]/5'
                      : 'border-slate-200 hover:border-[#4ade80]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clubSize"
                    value={size.value}
                    checked={formData.clubSize === size.value}
                    onChange={(e) => handleChange('clubSize', e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <p className="font-semibold text-primary">{size.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{size.description}</p>
                    <p className="text-xs text-[#4ade80] mt-1">{size.players}</p>
                  </div>
                  {formData.clubSize === size.value && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 text-[#4ade80]" />
                    </div>
                  )}
                </label>
              ))}
            </div>

            {/* 数量输入 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  球队数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.teamCount}
                  onChange={(e) => handleChange('teamCount', e.target.value)}
                  placeholder="支"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.teamCount ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.teamCount && <p className="text-red-500 text-sm mt-1">{errors.teamCount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  球员数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.playerCount}
                  onChange={(e) => handleChange('playerCount', e.target.value)}
                  placeholder="人"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.playerCount ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.playerCount && <p className="text-red-500 text-sm mt-1">{errors.playerCount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  教练数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.coachCount}
                  onChange={(e) => handleChange('coachCount', e.target.value)}
                  placeholder="人"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.coachCount ? 'border-red-500' : 'border-slate-200'} focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all`}
                />
                {errors.coachCount && <p className="text-red-500 text-sm mt-1">{errors.coachCount}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* 俱乐部简介 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4ade80]" />
            俱乐部简介
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                俱乐部介绍
              </label>
              <textarea
                value={formData.clubDescription}
                onChange={(e) => handleChange('clubDescription', e.target.value)}
                placeholder="请简要介绍俱乐部的历史、理念、特色等"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                主要荣誉/成绩
              </label>
              <textarea
                value={formData.achievements}
                onChange={(e) => handleChange('achievements', e.target.value)}
                placeholder="如：2023年市级青少年联赛冠军、培养出3名职业球员等"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* 资质证明 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-primary mb-4">资质证明</h3>
          
          <div className="space-y-4">
            {/* 营业执照上传 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                营业执照/组织机构代码证
              </label>
              <div 
                onClick={() => licenseInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-all bg-slate-50"
              >
                {licensePreview ? (
                  <div className="flex items-center gap-4">
                    <img src={licensePreview} alt="License" className="w-20 h-20 object-cover rounded-lg" />
                    <div>
                      <p className="text-sm text-slate-600">营业执照已上传</p>
                      <p className="text-xs text-slate-400 mt-1">点击更换</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">点击上传营业执照</p>
                    <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG、PDF 格式</p>
                  </div>
                )}
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleLicenseUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 按钮组 */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            上一步
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-light transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                提交申请
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step3ClubProfile;
