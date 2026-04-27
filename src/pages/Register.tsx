import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Shield, Users, Award, Sparkles } from 'lucide-react';
import FootballBackground, { backgroundStyles } from '../components/FootballBackground';

type FormStep = 1 | 2 | 3 | 4 | 5; // 5 = success

interface RegisterFormData {
  // Step 1
  phone: string;
  code: string;
  // Step 2 - Player Info
  name: string;
  birthDate: string;
  age: number;
  gender?: 'male' | 'female';
  height: number;
  weight: number;
  foot?: 'right' | 'left' | 'both';
  position: string;
  secondPosition: string;
  startYear: number;
  country: string;
  province: string;
  city: string;
  club: string;
  jerseyColor: string;
  jerseyNumber: number;
  faRegistered?: 'yes' | 'no';
  association: string;
  // Step 3 - Family Info
  fatherHeight: number;
  fatherPhone: string;
  fatherEdu: string;
  fatherJob: string;
  fatherAthlete?: 'yes' | 'no';
  motherHeight: number;
  motherPhone: string;
  motherEdu: string;
  motherJob: string;
  motherAthlete?: 'yes' | 'no';
  // Step 4
  nickname: string;
  avatar: File | null;
}

const provinces = [
  { value: '', label: '请选择省份' },
  { value: 'beijing', label: '北京市' },
  { value: 'shanghai', label: '上海市' },
  { value: 'tianjin', label: '天津市' },
  { value: 'chongqing', label: '重庆市' },
  { value: 'hebei', label: '河北省' },
  { value: 'shanxi', label: '山西省' },
  { value: 'liaoning', label: '辽宁省' },
  { value: 'jilin', label: '吉林省' },
  { value: 'heilongjiang', label: '黑龙江省' },
  { value: 'jiangsu', label: '江苏省' },
  { value: 'zhejiang', label: '浙江省' },
  { value: 'anhui', label: '安徽省' },
  { value: 'fujian', label: '福建省' },
  { value: 'jiangxi', label: '江西省' },
  { value: 'shandong', label: '山东省' },
  { value: 'henan', label: '河南省' },
  { value: 'hubei', label: '湖北省' },
  { value: 'hunan', label: '湖南省' },
  { value: 'guangdong', label: '广东省' },
  { value: 'hainan', label: '海南省' },
  { value: 'sichuan', label: '四川省' },
  { value: 'guizhou', label: '贵州省' },
  { value: 'yunnan', label: '云南省' },
  { value: 'shaanxi', label: '陕西省' },
  { value: 'gansu', label: '甘肃省' },
  { value: 'qinghai', label: '青海省' },
  { value: 'taiwan', label: '台湾省' },
  { value: 'neimenggu', label: '内蒙古自治区' },
  { value: 'guangxi', label: '广西壮族自治区' },
  { value: 'xizang', label: '西藏自治区' },
  { value: 'ningxia', label: '宁夏回族自治区' },
  { value: 'xinjiang', label: '新疆维吾尔自治区' },
  { value: 'hongkong', label: '香港特别行政区' },
  { value: 'macau', label: '澳门特别行政区' },
];

const citiesByProvince: Record<string, string[]> = {
  beijing: ['北京市'],
  shanghai: ['上海市'],
  tianjin: ['天津市'],
  chongqing: ['重庆市'],
  hebei: ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  shandong: ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '滨州', '德州', '聊城', '临沂', '菏泽', '莱芜'],
  guangdong: ['广州', '深圳', '珠海', '汕头', '佛山', '韶关', '湛江', '肇庆', '江门', '茂名', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  jiangsu: ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  zhejiang: ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  // 可以继续添加，但保持基本即可
};

const educationOptions = [
  { value: '', label: '请选择' },
  { value: '初中及以下', label: '初中及以下' },
  { value: '高中/中专', label: '高中/中专' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' },
];

const Register: React.FC = () => {
  const [step, setStep] = useState<FormStep>(1);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState<RegisterFormData>({
    phone: '',
    code: '',
    name: '',
    birthDate: '',
    age: 0,
    gender: undefined,
    height: 0,
    weight: 0,
    foot: undefined,
    position: '',
    secondPosition: '',
    startYear: 0,
    country: 'china',
    province: '',
    city: '',
    club: '',
    jerseyColor: '',
    jerseyNumber: 0,
    faRegistered: undefined,
    association: '',
    fatherHeight: 0,
    fatherPhone: '',
    fatherEdu: '',
    fatherJob: '',
    fatherAthlete: undefined,
    motherHeight: 0,
    motherPhone: '',
    motherEdu: '',
    motherJob: '',
    motherAthlete: undefined,
    nickname: '',
    avatar: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate age when birthDate changes
  useEffect(() => {
    if (formData.birthDate) {
      const birth = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.birthDate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleInputChange = (field: keyof RegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendCode = async () => {
    if (!formData.phone || formData.phone.length !== 11) {
      setErrors({ phone: '请输入正确的11位手机号' });
      return;
    }

    try {
      setSendingCode(true);
      setError('');
      await authApi.sendCode(formData.phone, 'register');
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone || formData.phone.length !== 11) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    if (!formData.code || formData.code.length !== 6) {
      newErrors.code = '请输入6位验证码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    if (!formData.gender) {
      newErrors.gender = '请选择性别';
    }
    const heightNum = Number(formData.height);
    if (!formData.height || heightNum < 80 || heightNum > 250) {
      newErrors.height = '请输入正确的身高';
    }
    const weightNum = Number(formData.weight);
    if (!formData.weight || weightNum < 15 || weightNum > 150) {
      newErrors.weight = '请输入正确的体重';
    }
    if (!formData.foot) {
      newErrors.foot = '请选择惯用脚';
    }
    if (!formData.position) {
      newErrors.position = '请选择场上位置';
    }
    const startYearNum = Number(formData.startYear);
    if (!formData.startYear || startYearNum < 2000 || startYearNum > 2026) {
      newErrors.startYear = '请输入正确的开始踢球年份';
    }
    if (!formData.country) {
      newErrors.country = '请选择国家';
    }
    if (formData.country === 'china' && !formData.province) {
      newErrors.province = '请选择省份';
    }
    if (!formData.city) {
      newErrors.city = '请输入城市';
    }
    if (!formData.jerseyColor.trim()) {
      newErrors.jerseyColor = '请填写球衣颜色';
    }
    const jerseyNum = Number(formData.jerseyNumber);
    if (!formData.jerseyNumber || jerseyNum < 1 || jerseyNum > 99) {
      newErrors.jerseyNumber = '请输入正确的球衣号码';
    }
    if (!formData.faRegistered) {
      newErrors.faRegistered = '请选择足协注册状态';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const goToPrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  const skipStep2 = () => {
    setStep(3);
  };

  const handleComplete = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nickname.trim()) {
      newErrors.nickname = '请设置昵称';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      setError('');

      const response = await authApi.register({
        phone: formData.phone,
        code: formData.code,
        password: 'temp123456', // 原HTML中初始密码默认设置，后续可修改
        name: formData.name,
        nickname: formData.nickname,
        birth_date: formData.birthDate,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        foot: formData.foot,
        position: formData.position,
        second_position: formData.secondPosition,
        start_year: formData.startYear,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        club: formData.club,
        jersey_color: formData.jerseyColor,
        jersey_number: formData.jerseyNumber,
        fa_registered: formData.faRegistered,
        association: formData.association,
        father_height: formData.fatherHeight,
        father_phone: formData.fatherPhone,
        father_edu: formData.fatherEdu,
        father_job: formData.fatherJob,
        father_athlete: formData.fatherAthlete,
        mother_height: formData.motherHeight,
        mother_phone: formData.motherPhone,
        mother_edu: formData.motherEdu,
        mother_job: formData.motherJob,
        mother_athlete: formData.motherAthlete,
      });

      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setAuth(user, token);
        setStep(5); // 5 = success
      } else {
        setError(response.error || response.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const availableCities = formData.country === 'china' && formData.province
    ? citiesByProvince[formData.province] || []
    : [];

  // 左侧品牌栏内容
  const renderLeftPanel = () => {
    const features = [
      { icon: Shield, text: '专业级数据安全保障' },
      { icon: Users, text: '连接俱乐部与青训球员' },
      { icon: Award, text: '权威球探分析报告' },
      { icon: Sparkles, text: 'AI 驱动的成长追踪' },
    ];

    const stepTitles: Record<number, { title: string; subtitle: string }> = {
      1: { title: '开启你的足球梦想之旅', subtitle: '加入少年球探平台，获取专业球探分析，记录成长轨迹，获得更多被发掘的机会。' },
      2: { title: '完善球员信息', subtitle: '详细的信息有助于我们为你提供更精准的服务和匹配。' },
      3: { title: '填写家庭信息', subtitle: '家庭信息有助于了解你的成长背景，可选填。' },
      4: { title: '设置个人资料', subtitle: '设置你的昵称和头像，展示你的个性。' },
      5: { title: '注册成功', subtitle: '欢迎加入少年球探，让我们一起发现你的足球天赋。' },
    };

    const currentTitle = stepTitles[step] || stepTitles[1];

    return (
      <div className="hidden lg:flex lg:w-5/12 xl:w-[45%] flex-col justify-between py-8 px-8 xl:py-10 xl:px-12 relative overflow-hidden">
        {/* Logo区域 */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">少年球探</span>
              <p className="text-sm text-emerald-200/70">球员注册</p>
            </div>
          </Link>
        </div>

        {/* 中间内容 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-6">
          <div className="space-y-5">
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              {step === 5 ? (
                <>
                  欢迎加入
                  <span className="block mt-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    少年球探
                  </span>
                </>
              ) : (
                <>
                  {currentTitle.title.split('，')[0]}
                  <span className="block mt-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {currentTitle.title.split('，')[1] || '开启足球梦想'}
                  </span>
                </>
              )}
            </h1>
            <p className="text-base text-white/60 max-w-sm">
              {currentTitle.subtitle}
            </p>
          </div>

          {/* 特性列表 */}
          {step < 5 && (
            <div className="mt-8 space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-white/70">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    <feature.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        {step < 5 && (
          <div className="relative z-10 flex gap-6">
            <div>
              <div className="text-xl font-bold text-white">10,000+</div>
              <div className="text-xs text-white/50">注册球员</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">500+</div>
              <div className="text-xs text-white/50">认证分析师</div>
            </div>
            <div>
              <div className="text-xl font-bold text-white">100+</div>
              <div className="text-xs text-white/50">合作俱乐部</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 足球主题动态背景 */}
      <FootballBackground step={step} />
      
      {/* 动画样式 */}
      <style>{backgroundStyles}</style>

      {/* 主内容区 - 左右分栏布局 */}
      <div className="relative z-10 min-h-screen flex">
        {/* 左侧品牌栏（PC端） */}
        {renderLeftPanel()}

        {/* 右侧表单区 */}
        <div className="w-full lg:w-7/12 xl:w-[55%] flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:px-12">
          <div className="w-full max-w-xl">
            {/* 移动端Logo */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                  <span className="text-2xl">⚽</span>
                </div>
                <span className="text-2xl font-bold text-white">少年球探</span>
              </Link>
            </div>

            {/* 表单卡片 */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
              {/* 卡片头部 */}
              <div className="text-center mb-6">
                <h1 className="text-slate-900 text-xl font-bold mb-2">
                  {step === 1 && '创建账户'}
                  {step === 2 && '填写球员信息'}
                  {step === 3 && '填写家庭信息'}
                  {step === 4 && '设置个人资料'}
                  {step === 5 && '注册成功'}
                </h1>
                <p className="text-slate-500 text-sm">
                  {step === 1 && '加入少年球探，开启足球梦想之旅'}
                  {step === 2 && '详细的信息有助于我们为你提供更精准的服务'}
                  {step === 3 && '家庭信息有助于了解你的成长背景（选填）'}
                  {step === 4 && '设置你的昵称和头像，展示你的个性'}
                  {step === 5 && '欢迎加入少年球探大家庭'}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-center items-center gap-2 mb-8">
                {[1, 2, 3, 4].map((s, index) => (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step >= s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step > s ? '✓' : s}
                      </div>
                      <span className={`text-[10px] ${step >= s ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {s === 1 && '手机'}
                        {s === 2 && '球员'}
                        {s === 3 && '家庭'}
                        {s === 4 && '资料'}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className={`w-6 h-[2px] mb-4 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: Phone Verification */}
          {step === 1 && (
            <div className="block">
              <h2 className="text-primary text-xl font-medium mb-6 text-center">手机号注册</h2>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  手机号 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="请输入11位手机号"
                    maxLength={11}
                    className={`flex-1 px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                      errors.phone ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sendingCode || countdown > 0}
                    className="px-5 py-3.5 bg-accent text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all whitespace-nowrap hover:bg-accent-light disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `${countdown}s后重发` : sendingCode ? '发送中...' : '获取验证码'}
                  </button>
                </div>
                {errors.phone && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.phone}</div>
                )}
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  验证码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.code ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.code && (
                  <div className="text-red-500 text-sm mt-1.5 block">{errors.code}</div>
                )}
                {import.meta.env.DEV && (
                  <div className="flex items-center gap-1.5 mt-2 p-2.5 bg-green-100 rounded-lg text-green-800 text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    验证码已发送：123456
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 px-6 py-3.5 bg-accent text-white rounded-xl text-lg font-semibold cursor-pointer transition-all hover:bg-accent-light"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Player Info */}
          {step === 2 && (
            <div className="block">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-primary text-xl font-medium m-0 text-left">填写球员信息</h2>
                <button
                  type="button"
                  onClick={skipStep2}
                  className="px-3 py-2 bg-transparent text-slate-500 border border-slate-300 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-slate-100 hover:text-primary hover:border-slate-400"
                >
                  跳过此步
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入真实姓名"
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.name ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.name && <div className="text-red-500 text-sm mt-1.5 block">{errors.name}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    出生日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                      errors.birthDate ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.birthDate && <div className="text-red-500 text-sm mt-1.5 block">{errors.birthDate}</div>}
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    年龄 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.age || ''}
                      readOnly
                      placeholder="自动计算"
                      min={5}
                      max={25}
                      className="w-full px-4 py-3.5 pr-12 border-2 border-slate-200 rounded-xl text-base bg-slate-50"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">岁</span>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  性别 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="gender-male"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => handleInputChange('gender', e.target.value as 'male')}
                      className="w-5 h-5 accent-accent"
                    />
                    <label htmlFor="gender-male" className="mb-0 font-medium cursor-pointer">男</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="gender-female"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => handleInputChange('gender', e.target.value as 'female')}
                      className="w-5 h-5 accent-accent"
                    />
                    <label htmlFor="gender-female" className="mb-0 font-medium cursor-pointer">女</label>
                  </div>
                </div>
                {errors.gender && <div className="text-red-500 text-sm mt-1.5 block">{errors.gender}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    身高 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.height === 0 ? '' : formData.height}
                      onChange={(e) => handleInputChange('height', Number(e.target.value))}
                      placeholder="请输入身高"
                      min={80}
                      max={250}
                      className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                        errors.height ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                  </div>
                  {errors.height && <div className="text-red-500 text-sm mt-1.5 block">{errors.height}</div>}
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    体重 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.weight === 0 ? '' : formData.weight}
                      onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                      placeholder="请输入体重"
                      min={15}
                      max={150}
                      className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                        errors.weight ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kg</span>
                  </div>
                  {errors.weight && <div className="text-red-500 text-sm mt-1.5 block">{errors.weight}</div>}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  惯用脚 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.foot}
                  onChange={(e) => handleInputChange('foot', e.target.value)}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white ${
                    errors.foot ? 'border-red-500' : 'border-slate-200'
                  }`}
                >
                  <option value="">请选择惯用脚</option>
                  <option value="right">右脚</option>
                  <option value="left">左脚</option>
                  <option value="both">双脚</option>
                </select>
                {errors.foot && <div className="text-red-500 text-sm mt-1.5 block">{errors.foot}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    场上位置 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white ${
                      errors.position ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">请选择场上位置</option>
                    <optgroup label="前锋">
                      <option value="ST">前锋（ST/CF）</option>
                      <option value="LW">左边锋（LW）</option>
                      <option value="RW">右边锋（RW）</option>
                      <option value="LF">左前锋（LF）</option>
                      <option value="RF">右前锋（RF）</option>
                    </optgroup>
                    <optgroup label="中场">
                      <option value="CAM">攻击型中场（CAM）</option>
                      <option value="CM">中场（CM）</option>
                      <option value="CDM">防守型中场（CDM）</option>
                      <option value="LM">左边前卫（LM）</option>
                      <option value="RM">右边前卫（RM）</option>
                    </optgroup>
                    <optgroup label="后卫">
                      <option value="LB">左边后卫（LB）</option>
                      <option value="RB">右边后卫（RB）</option>
                      <option value="LWB">左边翼卫（LWB）</option>
                      <option value="RWB">右边翼卫（RWB）</option>
                      <option value="CB">中后卫（CB）</option>
                    </optgroup>
                    <optgroup label="门将">
                      <option value="GK">门将（GK）</option>
                    </optgroup>
                  </select>
                  {errors.position && <div className="text-red-500 text-sm mt-1.5 block">{errors.position}</div>}
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">第二位置（选填）</label>
                  <select
                    value={formData.secondPosition}
                    onChange={(e) => handleInputChange('secondPosition', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white"
                  >
                    <option value="">请选择第二位置</option>
                    <optgroup label="前锋">
                      <option value="ST">前锋（ST/CF）</option>
                      <option value="LW">左边锋（LW）</option>
                      <option value="RW">右边锋（RW）</option>
                      <option value="LF">左前锋（LF）</option>
                      <option value="RF">右前锋（RF）</option>
                    </optgroup>
                    <optgroup label="中场">
                      <option value="CAM">攻击型中场（CAM）</option>
                      <option value="CM">中场（CM）</option>
                      <option value="CDM">防守型中场（CDM）</option>
                      <option value="LM">左边前卫（LM）</option>
                      <option value="RM">右边前卫（RM）</option>
                    </optgroup>
                    <optgroup label="后卫">
                      <option value="LB">左边后卫（LB）</option>
                      <option value="RB">右边后卫（RB）</option>
                      <option value="LWB">左边翼卫（LWB）</option>
                      <option value="RWB">右边翼卫（RWB）</option>
                      <option value="CB">中后卫（CB）</option>
                    </optgroup>
                    <optgroup label="门将">
                      <option value="GK">门将（GK）</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  开始踢球年份 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.startYear === 0 ? '' : formData.startYear}
                  onChange={(e) => handleInputChange('startYear', Number(e.target.value))}
                  placeholder="例如：2018"
                  min={2000}
                  max={2026}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.startYear ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.startYear && <div className="text-red-500 text-sm mt-1.5 block">{errors.startYear}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    国家/地区 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white"
                  >
                    <option value="">请选择国家</option>
                    <option value="china">中国</option>
                    <option value="australia">澳大利亚</option>
                    <option value="brazil">巴西</option>
                    <option value="canada">加拿大</option>
                    <option value="france">法国</option>
                    <option value="germany">德国</option>
                    <option value="italy">意大利</option>
                    <option value="japan">日本</option>
                    <option value="korea">韩国</option>
                    <option value="netherlands">荷兰</option>
                    <option value="portugal">葡萄牙</option>
                    <option value="spain">西班牙</option>
                    <option value="uk">英国</option>
                    <option value="usa">美国</option>
                    <option value="other">其他国家/地区</option>
                  </select>
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    城市 <span className="text-red-500">*</span>
                  </label>
                  {formData.country === 'china' ? (
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white ${
                        errors.city ? 'border-red-500' : 'border-slate-200'
                      }`}
                    >
                      <option value="">请先选择省份</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="请输入城市名称"
                      className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                        errors.city ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                  )}
                  {errors.city && <div className="text-red-500 text-sm mt-1.5 block">{errors.city}</div>}
                </div>
              </div>

              {formData.country === 'china' && (
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    省份 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white ${
                      errors.province ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    {provinces.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  {errors.province && <div className="text-red-500 text-sm mt-1.5 block">{errors.province}</div>}
                </div>
              )}

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">所属俱乐部（选填）</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => handleInputChange('club', e.target.value)}
                  placeholder="请输入所在俱乐部（如有）"
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    球衣颜色 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jerseyColor}
                    onChange={(e) => handleInputChange('jerseyColor', e.target.value)}
                    placeholder="请填写主客场球衣颜色，例如：主场红色、客场蓝色"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                      errors.jerseyColor ? 'border-red-500' : 'border-slate-200'
                    }`}
                  />
                  {errors.jerseyColor && <div className="text-red-500 text-sm mt-1.5 block">{errors.jerseyColor}</div>}
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    球衣号码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.jerseyNumber === 0 ? '' : formData.jerseyNumber}
                      onChange={(e) => handleInputChange('jerseyNumber', Number(e.target.value))}
                      placeholder="请输入1-99的正整数"
                      min={1}
                      max={99}
                      className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                        errors.jerseyNumber ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">号</span>
                  </div>
                  {errors.jerseyNumber && <div className="text-red-500 text-sm mt-1.5 block">{errors.jerseyNumber}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">
                    足协注册状态 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.faRegistered}
                    onChange={(e) => handleInputChange('faRegistered', e.target.value as 'yes' | 'no')}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white ${
                      errors.faRegistered ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">请选择</option>
                    <option value="yes">已注册</option>
                    <option value="no">未注册</option>
                  </select>
                  {errors.faRegistered && <div className="text-red-500 text-sm mt-1.5 block">{errors.faRegistered}</div>}
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">所属协会/重点城市（选填）</label>
                  <input
                    type="text"
                    value={formData.association}
                    onChange={(e) => handleInputChange('association', e.target.value)}
                    placeholder="例如：中国足协、深圳市"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-primary border-2 border-slate-200 rounded-xl text-base font-semibold cursor-pointer transition-all hover:border-accent hover:text-accent"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 px-6 py-3.5 bg-accent text-white rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-accent-light"
                >
                  下一步
                </button>
              </div>

              <div className="text-center mt-5 pt-5 border-t border-dashed border-slate-200">
                <button
                  type="button"
                  onClick={skipStep2}
                  className="px-6 py-3 bg-transparent text-slate-500 border border-dashed border-slate-300 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-slate-50 hover:text-primary hover:border-accent hover:border-solid"
                >
                  跳过此步，稍后填写
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Family Info */}
          {step === 3 && (
            <div className="block">
              <h2 className="text-primary text-xl font-medium mb-6 text-left">填写家庭信息（选填）</h2>

              <h3 className="text-primary text-base mb-4 pb-2 border-b border-slate-200">父亲信息</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">父亲身高</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.fatherHeight === 0 ? '' : formData.fatherHeight}
                      onChange={(e) => handleInputChange('fatherHeight', Number(e.target.value))}
                      placeholder="请输入父亲身高"
                      min={140}
                      max={220}
                      className="w-full px-4 py-3.5 pr-12 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">父亲手机号</label>
                  <input
                    type="tel"
                    value={formData.fatherPhone}
                    onChange={(e) => handleInputChange('fatherPhone', e.target.value)}
                    placeholder="请输入父亲手机号"
                    maxLength={11}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">父亲学历</label>
                  <select
                    value={formData.fatherEdu}
                    onChange={(e) => handleInputChange('fatherEdu', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white"
                  >
                    {educationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">父亲职业</label>
                  <input
                    type="text"
                    value={formData.fatherJob}
                    onChange={(e) => handleInputChange('fatherJob', e.target.value)}
                    placeholder="请输入父亲职业"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">父亲是否曾是专业运动员</label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="father-athlete-yes"
                        name="fatherAthlete"
                        value="yes"
                        checked={formData.fatherAthlete === 'yes'}
                        onChange={(e) => handleInputChange('fatherAthlete', e.target.value as 'yes')}
                        className="w-5 h-5 accent-accent"
                      />
                      <label htmlFor="father-athlete-yes" className="mb-0 font-medium cursor-pointer">是</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="father-athlete-no"
                        name="fatherAthlete"
                        value="no"
                        checked={formData.fatherAthlete === 'no'}
                        onChange={(e) => handleInputChange('fatherAthlete', e.target.value as 'no')}
                        className="w-5 h-5 accent-accent"
                      />
                      <label htmlFor="father-athlete-no" className="mb-0 font-medium cursor-pointer">否</label>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-primary text-base my-6 mb-4 pb-2 border-b border-slate-200">母亲信息</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">母亲身高</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.motherHeight === 0 ? '' : formData.motherHeight}
                      onChange={(e) => handleInputChange('motherHeight', Number(e.target.value))}
                      placeholder="请输入母亲身高"
                      min={140}
                      max={200}
                      className="w-full px-4 py-3.5 pr-12 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">cm</span>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">母亲手机号</label>
                  <input
                    type="tel"
                    value={formData.motherPhone}
                    onChange={(e) => handleInputChange('motherPhone', e.target.value)}
                    placeholder="请输入母亲手机号"
                    maxLength={11}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">母亲学历</label>
                  <select
                    value={formData.motherEdu}
                    onChange={(e) => handleInputChange('motherEdu', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors bg-white"
                  >
                    {educationOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">母亲职业</label>
                  <input
                    type="text"
                    value={formData.motherJob}
                    onChange={(e) => handleInputChange('motherJob', e.target.value)}
                    placeholder="请输入母亲职业"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-primary font-semibold mb-2 text-sm">母亲是否曾是专业运动员</label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="mother-athlete-yes"
                        name="motherAthlete"
                        value="yes"
                        checked={formData.motherAthlete === 'yes'}
                        onChange={(e) => handleInputChange('motherAthlete', e.target.value as 'yes')}
                        className="w-5 h-5 accent-accent"
                      />
                      <label htmlFor="mother-athlete-yes" className="mb-0 font-medium cursor-pointer">是</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="mother-athlete-no"
                        name="motherAthlete"
                        value="no"
                        checked={formData.motherAthlete === 'no'}
                        onChange={(e) => handleInputChange('motherAthlete', e.target.value as 'no')}
                        className="w-5 h-5 accent-accent"
                      />
                      <label htmlFor="mother-athlete-no" className="mb-0 font-medium cursor-pointer">否</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-primary border-2 border-slate-200 rounded-xl text-base font-semibold cursor-pointer transition-all hover:border-accent hover:text-accent"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 px-6 py-3.5 bg-accent text-white rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-accent-light"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Nickname & Avatar */}
          {step === 4 && (
            <div className="block">
              <h2 className="text-primary text-xl font-medium mb-6 text-center">设置昵称和头像</h2>

              <div className="mb-5 text-center">
                <label className="block text-primary font-semibold mb-2 text-sm text-left">头像</label>
                <div className="avatar-upload">
                  <div 
                    className={`w-[120px] h-[120px] rounded-full mx-auto mb-3 relative overflow-hidden cursor-pointer bg-slate-100 border-3 border-dashed transition-colors ${
                      avatarPreview ? 'border-slate-300' : 'border-slate-300 hover:border-accent'
                    }`}
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 mb-2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="text-sm">点击上传</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm opacity-0 transition-opacity hover:opacity-100">
                      <span>更换头像</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    id="avatar-input"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-slate-400 text-xs">支持 JPG、PNG 格式，最大 5MB</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  昵称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  placeholder="设置你的昵称"
                  className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:border-accent transition-colors ${
                    errors.nickname ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.nickname && <div className="text-red-500 text-sm mt-1.5 block">{errors.nickname}</div>}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-primary border-2 border-slate-200 rounded-xl text-base font-semibold cursor-pointer transition-all hover:border-accent hover:text-accent"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-accent text-white rounded-xl text-base font-semibold cursor-pointer transition-all hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '注册中...' : '完成注册'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 5 && (
            <div className="block text-center py-6">
              <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-emerald-600">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-slate-900 text-2xl font-bold mb-3">注册成功！</h2>
              <p className="text-slate-500 mb-8">欢迎加入少年球探，让我们一起发现你的足球天赋</p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/"
                  className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl text-base font-semibold no-underline hover:bg-emerald-600 transition-all"
                >
                  进入首页
                </Link>
                <Link
                  to="/video-analysis"
                  className="px-8 py-3.5 bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-xl text-base font-semibold no-underline hover:border-emerald-500 hover:text-emerald-600 transition-all"
                >
                  上传视频
                </Link>
              </div>
            </div>
          )}

          {/* 底部登录链接 */}
          <div className="text-center mt-6 pt-4 border-t border-slate-200">
            <p className="text-slate-500 text-sm">
              已有账户？<Link to="/login" className="text-emerald-600 font-semibold hover:underline">立即登录</Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Register;
