import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../../types/auth';
import { 
  Step1Account, 
  Step2RoleSelect, 
  Step3BaseInfo,
  Step4PlayerSpecific,
  Step4AnalystSpecific,
  Step4ClubSpecific,
  Step4CoachSpecific,
  Step4ScoutSpecific,
  Step5PlayerSupplement,
} from './RegisterSteps';
import type {
  BaseInfoData,
  PlayerSpecificData,
  AnalystSpecificData,
  ClubSpecificData,
  CoachSpecificData,
  ScoutSpecificData,
  PlayerSupplementData,
} from './RegisterSteps';
import { authApi } from '../../services/api';
import { testAccounts } from './RegisterSteps/testAccounts';
import type { TestAccountRole } from './RegisterSteps/testAccounts';
import { Beaker, Sparkles, Shield, Users, Award, Brain, Building2, GraduationCap, Eye, Orbit } from 'lucide-react';
import { roleThemes, getStepTheme } from './RegisterSteps/theme.config';

// 角色图标映射 - 用于测试面板和 Logo
const roleIcons: Record<UserRole, React.ElementType> = {
  player: Users,
  analyst: Brain,
  club: Building2,
  coach: GraduationCap,
  scout: Eye,
};

// 通用 Logo 图标
const LogoIcon = Orbit;
import FootballBackground, { backgroundStyles } from '../../components/FootballBackground';

// 注册步骤 - 球员有5步（包含补充资料），其他角色4步
type RegisterStep = 1 | 2 | 3 | 4 | 5;

// 注册数据
interface RegisterData {
  phone: string;
  password: string;
  code?: string;
  role?: UserRole;
  baseInfo?: BaseInfoData;
  specificInfo?: PlayerSpecificData | AnalystSpecificData | ClubSpecificData | CoachSpecificData;
  supplementInfo?: PlayerSupplementData; // 球员补充资料
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [registerData, setRegisterData] = useState<RegisterData>({
    phone: '',
    password: '',
  });
  const registerDataRef = useRef(registerData);
  const updateRegisterData = (updater: (prev: RegisterData) => RegisterData) => {
    setRegisterData(prev => {
      const next = updater(prev);
      registerDataRef.current = next;
      return next;
    });
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTestAccount, setSelectedTestAccount] = useState<TestAccountRole | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(true); // 测试面板显示状态
  const [fillTrigger, setFillTrigger] = useState(0); // 触发重新渲染的计数器

  // 获取当前主题
  const theme = useMemo(() => {
    return registerData.role ? roleThemes[registerData.role] : null;
  }, [registerData.role]);

  // 获取步骤主题
  const stepTheme = useMemo(() => {
    return getStepTheme(registerData.role || null);
  }, [registerData.role]);

  // 填充测试账号数据
  const fillTestData = async (role: TestAccountRole) => {
    const account = testAccounts[role];
    setSelectedTestAccount(role);
    
    // 填充账号信息
    updateRegisterData(prev => ({
      ...prev,
      phone: account.account.phone,
      password: account.account.password,
      role: role as UserRole,
    }));
    
    // 自动调用 send-code，确保后端数据库有验证码记录（开发模式固定返回 123456）
    try {
      await authApi.sendCode(account.account.phone, 'register');
    } catch (_) {
      // 手机号已注册时 send-code 会报错，忽略即可（注册时会提示手机号已存在）
    }
    
    // 触发重新渲染，让 defaultValues 生效
    setFillTrigger(prev => prev + 1);
  };

  // 步骤1完成：账号信息
  const handleStep1Complete = (data: { phone: string; password: string; code: string }) => {
    updateRegisterData(prev => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  // 步骤2完成：角色选择
  const handleStep2Complete = (role: UserRole) => {
    updateRegisterData(prev => ({ ...prev, role }));
    setCurrentStep(3);
  };

  // 步骤3完成：基础信息
  const handleStep3Complete = (baseInfo: BaseInfoData) => {
    updateRegisterData(prev => ({ ...prev, baseInfo }));
    setCurrentStep(4);
  };

  // 步骤4完成：角色专属信息
  const handleStep4Complete = (specificInfo: any) => {
    if (!registerData.role || !registerData.baseInfo) return;

    // 保存专属信息
    updateRegisterData(prev => ({ ...prev, specificInfo }));

    // 球员进入补充资料步骤，其他角色直接提交
    if (registerData.role === 'player') {
      setCurrentStep(5);
    } else {
      // 其他角色直接完成注册
      submitRegistration(specificInfo);
    }
  };

  // 步骤5完成：球员补充资料
  const handleStep5Complete = (supplementInfo: PlayerSupplementData) => {
    // 保存补充资料到状态
    updateRegisterData(prev => ({ ...prev, supplementInfo }));
    // 立即使用当前状态中的 specificInfo 进行注册（此时 specificInfo 已在 Step4 设置好）
    submitRegistration(registerData.specificInfo, supplementInfo);
  };

  // 跳过补充资料，直接注册并登录
  const handleSkipSupplement = () => {
    handleSkipAndLogin();
  };

  // 提交注册
  const submitRegistration = async (
    specificInfo: any, 
    supplementInfo?: PlayerSupplementData
  ) => {
    if (!registerData.role || !registerData.baseInfo) return;

    setLoading(true);
    setError('');

    try {
      // 合并所有信息，转换为后端期望的扁平格式
      const baseInfo = registerData.baseInfo as any;
      const specific = specificInfo as any;
      const supplement = supplementInfo as any;

      // 构建后端期望的请求格式（扁平化字段）
      const request: any = {
        phone: registerData.phone,
        code: registerData.code || '123456',
        password: registerData.password,
        role: registerData.role,
        // 基础信息
        name: baseInfo?.realName || baseInfo?.name,
        nickname: baseInfo?.nickname,
        birth_date: baseInfo?.birthDate,
        gender: baseInfo?.gender,
        province: baseInfo?.province,
        city: baseInfo?.city,
        country: baseInfo?.country || 'CN',
        avatar: baseInfo?.avatar,
        bio: baseInfo?.bio,
      };

      // 根据角色添加专属字段
      if (registerData.role === 'player') {
        // 球员专属信息
        Object.assign(request, {
          position: specific?.position,
          second_position: specific?.secondPosition,
          foot: specific?.dominantFoot || specific?.foot,
          height: specific?.height ? parseFloat(specific.height) : undefined,
          weight: specific?.weight ? parseFloat(specific.weight) : undefined,
          club: specific?.team || specific?.club,
          start_year: specific?.startYear ? parseInt(specific.startYear) : undefined,
          fa_registered: specific?.faRegistered,
          association: specific?.association,
          jersey_color: specific?.jerseyColor,
          jersey_number: specific?.jerseyNumber ? parseInt(specific.jerseyNumber) : undefined,
          // 补充资料 - 家庭信息
          father_height: supplement?.family?.fatherHeight ? parseFloat(supplement.family.fatherHeight) : undefined,
          father_job: supplement?.family?.fatherOccupation,
          father_athlete: supplement?.family?.fatherAthlete ? 'yes' : 'no',
          mother_height: supplement?.family?.motherHeight ? parseFloat(supplement.family.motherHeight) : undefined,
          mother_job: supplement?.family?.motherOccupation,
          mother_athlete: supplement?.family?.motherAthlete ? 'yes' : 'no',
          // 补充资料 - 联系信息
          father_phone: supplement?.contact?.phone,
          // Step4 扩展字段
          current_team: specific?.currentTeam,
          playing_style: specific?.playingStyle ? JSON.stringify(specific.playingStyle) : undefined,
          experiences: specific?.experience ? JSON.stringify(specific.experience) : undefined,
          // Step5 补充字段
          school: supplement?.contact?.school,
          wechat: supplement?.contact?.wechat,
          technical_tags: supplement?.technicalTags ? JSON.stringify(supplement.technicalTags) : undefined,
          mental_tags: supplement?.mentalTags ? JSON.stringify(supplement.mentalTags) : undefined,
          // Step5 体测数据（存到 users 表字段）
          sprint_30m: supplement?.physicalTests?.sprint30m || undefined,
          standing_long_jump: supplement?.physicalTests?.longJump || undefined,
          push_up: supplement?.physicalTests?.pushUps || undefined,
          sit_and_reach: supplement?.physicalTests?.flexibility || undefined,
        });
      } else if (registerData.role === 'analyst') {
        // 分析师专属信息
        Object.assign(request, {
          profession: specific?.profession,
          experience: specific?.experience,
          is_pro_player: specific?.isProPlayer,
          has_case: specific?.hasCase,
          case_detail: specific?.caseDetail,
          certificates: specific?.certificates ? JSON.stringify(specific.certificates) : undefined,
          club_contact_phone: specific?.contactPhone,
          contact_email: specific?.contactEmail,
        });
      } else if (registerData.role === 'club') {
        // 俱乐部专属信息
        Object.assign(request, {
          club_name: specific?.clubFullName || specific?.clubName,
          club_type: specific?.clubType,
          founded_year: specific?.establishedYear ? parseInt(specific.establishedYear) : undefined,
          club_scale: specific?.clubSize,
          club_address: specific?.address,
          club_website: specific?.clubWebsite,
          contact_name: specific?.contactName,
          contact_position: specific?.contactPosition,
          club_contact_phone: specific?.contactPhone,
        });
      } else if (registerData.role === 'coach') {
        // 教练专属信息
        Object.assign(request, {
          coach_type: specific?.licenseType,
          license_level: specific?.licenseType,
          license_number: specific?.licenseNumber,
          coach_experience: specific?.coachingYears,
          coach_specialty: specific?.specialties ? JSON.stringify(specific.specialties) : undefined,
          experience: specific?.experience ? JSON.stringify(specific.experience) : undefined,
          current_club: specific?.experience?.find((e: any) => e.isCurrent)?.clubName,
          coach_achievements: specific?.coachingPhilosophy,
        });
      } else if (registerData.role === 'scout') {
        // 球探专属信息
        Object.assign(request, {
          scouting_experience: specific?.scoutingExperience,
          scouting_specialty: specific?.specialties ? JSON.stringify(specific.specialties) : undefined,
          preferred_age_groups: specific?.preferredAgeGroups ? JSON.stringify(specific.preferredAgeGroups) : undefined,
          scouting_regions: specific?.scoutingRegions ? JSON.stringify(specific.scoutingRegions) : undefined,
          current_organization: specific?.currentOrganization,
          bio: specific?.bio,
        });
      }

      // 调用注册API
      const response = await authApi.register(request);
      const resData = response.data;

      // 注册成功后，保存token并自动登录
      // 后端返回 { success, data: { token, user }, message }，axios 把 body 放在 response.data 里
      if (resData?.success && resData?.data) {
        const { token, user } = resData.data;

        // 保存登录状态
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 根据角色决定跳转
        const baseNickname = registerData.baseInfo.nickname || registerData.baseInfo.realName || '新用户';

        if (registerData.role === 'player') {
          // 球员注册成功，跳转到首页（已完善所有资料，已自动登录）
          navigate('/', {
            state: {
              fromRegister: true,
              welcomeMessage: `欢迎加入少年球探，${baseNickname}！`,
            },
          });
        } else {
          // 其他角色需要审核
          navigate('/register/pending', {
            state: {
              role: registerData.role,
              nickname: baseNickname,
              applicationId: 'SA' + Date.now().toString().slice(-8),
            },
          });
        }
      } else {
        throw new Error(resData?.error?.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 跳过注册直接登录（用于"暂不填写"场景）
  const handleSkipAndLogin = async () => {
    if (!registerData.role || !registerData.baseInfo) return;

    setLoading(true);
    setError('');

    try {
      // 只提交基础信息，转换为后端期望的扁平格式
      const baseInfo = registerData.baseInfo as any;
      const specific = registerData.specificInfo as any;

      const request: any = {
        phone: registerData.phone,
        code: registerData.code || '123456',
        password: registerData.password,
        role: registerData.role,
        // 基础信息
        name: baseInfo?.realName || baseInfo?.name,
        nickname: baseInfo?.nickname,
        birth_date: baseInfo?.birthDate,
        gender: baseInfo?.gender,
        province: baseInfo?.province,
        city: baseInfo?.city,
        country: baseInfo?.country || 'CN',
        avatar: baseInfo?.avatar,
        bio: baseInfo?.bio,
      };

      // 根据角色添加专属字段（如果有）
      if (registerData.role === 'player' && specific) {
        Object.assign(request, {
          position: specific?.position,
          second_position: specific?.secondPosition,
          foot: specific?.dominantFoot || specific?.foot,
          height: specific?.height ? parseFloat(specific.height) : undefined,
          weight: specific?.weight ? parseFloat(specific.weight) : undefined,
          club: specific?.team || specific?.club,
          start_year: specific?.startYear ? parseInt(specific.startYear) : undefined,
          fa_registered: specific?.faRegistered,
          association: specific?.association,
          jersey_color: specific?.jerseyColor,
          jersey_number: specific?.jerseyNumber ? parseInt(specific.jerseyNumber) : undefined,
          // Step4 扩展字段
          current_team: specific?.currentTeam,
          playing_style: specific?.playingStyle ? JSON.stringify(specific.playingStyle) : undefined,
          experiences: specific?.experience ? JSON.stringify(specific.experience) : undefined,
        });
      } else if (registerData.role === 'analyst' && specific) {
        Object.assign(request, {
          profession: specific?.profession,
          experience: specific?.experience,
          is_pro_player: specific?.isProPlayer,
          has_case: specific?.hasCase,
          case_detail: specific?.caseDetail,
          certificates: specific?.certificates ? JSON.stringify(specific.certificates) : undefined,
          club_contact_phone: specific?.contactPhone,
          contact_email: specific?.contactEmail,
        });
      } else if (registerData.role === 'club' && specific) {
        Object.assign(request, {
          club_name: specific?.clubFullName || specific?.clubName,
          club_type: specific?.clubType,
          founded_year: specific?.establishedYear ? parseInt(specific.establishedYear) : undefined,
          club_scale: specific?.clubSize,
          club_address: specific?.address,
          club_website: specific?.clubWebsite,
          contact_name: specific?.contactName,
          contact_position: specific?.contactPosition,
          club_contact_phone: specific?.contactPhone,
        });
      } else if (registerData.role === 'coach' && specific) {
        Object.assign(request, {
          coach_type: specific?.licenseType,
          license_level: specific?.licenseType,
          license_number: specific?.licenseNumber,
          coach_experience: specific?.coachingYears,
          coach_specialty: specific?.specialties ? JSON.stringify(specific.specialties) : undefined,
          experience: specific?.experience ? JSON.stringify(specific.experience) : undefined,
          current_club: specific?.experience?.find((e: any) => e.isCurrent)?.clubName,
          coach_achievements: specific?.coachingPhilosophy,
        });
      } else if (registerData.role === 'scout' && specific) {
        Object.assign(request, {
          scouting_experience: specific?.scoutingExperience,
          scouting_specialty: specific?.specialties ? JSON.stringify(specific.specialties) : undefined,
          preferred_age_groups: specific?.preferredAgeGroups ? JSON.stringify(specific.preferredAgeGroups) : undefined,
          scouting_regions: specific?.scoutingRegions ? JSON.stringify(specific.scoutingRegions) : undefined,
          current_organization: specific?.currentOrganization,
          bio: specific?.bio,
        });
      }

      const response = await authApi.register(request);
      const resData = response.data;

      if (resData?.success && resData?.data) {
        const { token, user } = resData.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const baseNickname = registerData.baseInfo.nickname || registerData.baseInfo.realName || '新用户';
        navigate('/', {
          state: {
            fromRegister: true,
            welcomeMessage: `欢迎加入少年球探，${baseNickname}！`,
          },
        });
      } else {
        throw new Error(resData?.error?.message || '注册失败');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = (currentStep - 1) as RegisterStep;
      setCurrentStep(prevStep);
      
      // 从第5步返回时，清除补充资料数据
      if (currentStep === 5) {
        updateRegisterData(prev => ({ ...prev, supplementInfo: undefined }));
      }
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    // 球员有5步，其他角色4步
    const isPlayer = registerData.role === 'player';
    const steps = isPlayer
      ? [
          { num: 1, label: '账号信息' },
          { num: 2, label: '选择角色' },
          { num: 3, label: '基础信息' },
          { num: 4, label: '足球档案' },
          { num: 5, label: '完善资料' },
        ]
      : [
          { num: 1, label: '账号信息' },
          { num: 2, label: '选择角色' },
          { num: 3, label: '基础信息' },
          { num: 4, label: '专属信息' },
        ];

    return (
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto py-2">
        <div className="flex items-center min-w-fit">
          {steps.map((step, index) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                    currentStep > step.num
                      ? stepTheme.completed
                      : currentStep >= step.num
                      ? stepTheme.active
                      : stepTheme.pending
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 transition-colors whitespace-nowrap ${
                    currentStep >= step.num 
                      ? theme ? theme.textSecondary : 'text-blue-200' 
                      : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-1 transition-colors ${
                    currentStep > step.num ? stepTheme.lineActive : stepTheme.linePending
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // 渲染左侧品牌栏（PC端显示）- 优化版
  const renderLeftPanel = () => {
    const features = [
      { icon: Shield, text: '专业级数据安全保障', desc: '银行级加密存储' },
      { icon: Users, text: '连接俱乐部与青训球员', desc: '全国青训网络' },
      { icon: Award, text: '权威球探分析报告', desc: '专业分析师团队' },
      { icon: Sparkles, text: 'AI 驱动的成长追踪', desc: '智能数据分析' },
    ];

    // 步骤特定的内容
    const stepContent: Record<number, { title: string; highlight: string; subtitle: string; desc: string }> = {
      1: {
        title: '开启你的',
        highlight: '足球梦想之旅',
        subtitle: '专业足球青训平台',
        desc: '加入少年球探，获取专业球探分析，记录成长轨迹，获得更多被发掘的机会。',
      },
      2: {
        title: '选择你的',
        highlight: '专属身份',
        subtitle: '球员 / 分析师 / 俱乐部 / 教练',
        desc: '不同角色拥有专属功能和权限，选择最适合的身份开启足球之旅。',
      },
      3: {
        title: '完善基础',
        highlight: '个人信息',
        subtitle: '构建您的数字档案',
        desc: '详细的信息有助于我们为您提供更精准的服务和个性化推荐。',
      },
      4: {
        title: '补充专属',
        highlight: '角色信息',
        subtitle: '展现您的专业特色',
        desc: '根据您的角色类型，完善专业资料，让更多人了解您的实力。',
      },
      5: {
        title: '完善个人',
        highlight: '补充资料',
        subtitle: '打造完整档案',
        desc: '补充更多信息，获得更全面的球探分析和成长建议。',
      },
    };

    const content = stepContent[currentStep] || stepContent[1];

    return (
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-between py-10 px-10 xl:py-12 xl:px-14 relative overflow-hidden">
        {/* Logo区域 - 更紧凑 */}
        <div className="relative z-10">
          <a href="/" className="inline-flex items-center gap-3 group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
              theme 
                ? `bg-gradient-to-br ${theme.gradient} ${theme.shadow}` 
                : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20'
            }`}>
              <LogoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">少年球探</span>
              <p className={`text-xs ${theme ? theme.textSecondary : 'text-emerald-200/60'}`}>
                {theme ? theme.name : '青少年'}足球平台
              </p>
            </div>
          </a>
        </div>

        {/* 中间内容 - 更丰富的信息 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center my-8">
          {/* 角色标签 */}
          {currentStep >= 2 && theme && registerData.role && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${theme.bgCard} border ${theme.border} mb-5 w-fit`}>
              {(() => {
                const Icon = roleIcons[registerData.role!];
                return <Icon className={`w-5 h-5 ${theme.textSecondary}`} />;
              })()}
              <span className={`text-sm font-medium ${theme.textPrimary}`}>{theme.name}</span>
            </div>
          )}

          {/* 主标题 */}
          <div className="space-y-2 mb-5">
            <p className="text-sm text-white/40 font-medium tracking-wider uppercase">
              {content.subtitle}
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-[1.15]">
              {content.title}
              <span className={`block mt-1 bg-gradient-to-r ${theme?.gradient || 'from-emerald-400 via-teal-400 to-cyan-400'} bg-clip-text text-transparent`}>
                {content.highlight}
              </span>
            </h1>
          </div>

          {/* 描述文本 */}
          <p className="text-base text-white/50 leading-relaxed max-w-sm mb-8">
            {content.desc}
          </p>

          {/* 特性列表 - 更精致的设计 */}
          <div className="space-y-2.5">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                  currentStep === 1 ? 'bg-white/[0.02] hover:bg-white/[0.04]' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  theme 
                    ? `${theme.bgCard} border ${theme.border}` 
                    : 'bg-white/5 border border-white/10'
                }`}>
                  <feature.icon className={`w-4 h-4 ${theme ? `text-${theme.primary}` : 'text-emerald-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium">{feature.text}</p>
                  <p className="text-xs text-white/40">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部统计 - 更紧凑 */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: '10,000+', label: '注册球员' },
            { value: '500+', label: '认证分析师' },
            { value: '100+', label: '合作俱乐部' },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-lg font-bold text-white">{stat.value}</span>
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    const testData = selectedTestAccount ? testAccounts[selectedTestAccount] : null;

    switch (currentStep) {
      case 1:
        return (
          <Step1Account 
            key={`step1-${fillTrigger}`}
            onNext={handleStep1Complete} 
            defaultValues={testData ? {
              phone: testData.account.phone,
              password: testData.account.password,
              confirmPassword: testData.account.password,
              verifyCode: testData.account.verifyCode,
            } : undefined}
          />
        );
      case 2:
        return (
          <Step2RoleSelect 
            key={`step2-${fillTrigger}`}
            onNext={handleStep2Complete} 
            onBack={handleBack}
            defaultRole={selectedTestAccount as UserRole}
          />
        );
      case 3:
        if (registerData.role) {
          return (
            <Step3BaseInfo
              key={`step3-${fillTrigger}`}
              role={registerData.role}
              onNext={handleStep3Complete}
              onBack={handleBack}
              defaultValues={testData?.baseInfo}
            />
          );
        }
        return null;
      case 4:
        if (registerData.role === 'player') {
          return (
            <Step4PlayerSpecific
              key={`step4-${fillTrigger}`}
              onSubmit={handleStep4Complete}
              onBack={handleBack}
              defaultValues={testData?.specificInfo as unknown as PlayerSpecificData}
            />
          );
        } else if (registerData.role === 'analyst') {
          return (
            <Step4AnalystSpecific
              key={`step4-${fillTrigger}`}
              onSubmit={handleStep4Complete}
              onBack={handleBack}
              defaultValues={testData?.specificInfo as unknown as AnalystSpecificData}
            />
          );
        } else if (registerData.role === 'club') {
          return (
            <Step4ClubSpecific
              key={`step4-${fillTrigger}`}
              onSubmit={handleStep4Complete}
              onBack={handleBack}
              defaultValues={testData?.specificInfo as unknown as ClubSpecificData}
            />
          );
        } else if (registerData.role === 'coach') {
          return (
            <Step4CoachSpecific
              key={`step4-${fillTrigger}`}
              onSubmit={handleStep4Complete}
              onBack={handleBack}
              defaultValues={testData?.specificInfo as unknown as CoachSpecificData}
            />
          );
        } else if (registerData.role === 'scout') {
          return (
            <Step4ScoutSpecific
              key={`step4-${fillTrigger}`}
              onSubmit={handleStep4Complete}
              onBack={handleBack}
              defaultValues={testData?.specificInfo as unknown as ScoutSpecificData}
            />
          );
        }
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🚧</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">功能开发中</h3>
            <p className="text-blue-200/60 mb-6">该角色注册功能即将上线</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              返回选择其他角色
            </button>
          </div>
        );
      case 5:
        // 第5步：球员补充资料
        if (registerData.role === 'player') {
          return (
            <Step5PlayerSupplement
              key={`step5-${fillTrigger}`}
              onSubmit={handleStep5Complete}
              onSkip={handleSkipSupplement}
              onBack={handleBack}
              defaultValues={(testData as any)?.supplementInfo as PlayerSupplementData | undefined}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 足球主题动态背景 */}
      <FootballBackground step={currentStep} />
      
      {/* 动画样式 */}
      <style>{backgroundStyles}</style>

      {/* 主内容区 - 添加顶部内边距避免被 Navbar 遮挡 */}
      <div className="relative z-10 min-h-screen flex">
        {/* 左侧品牌栏（PC端） */}
        {renderLeftPanel()}

        {/* 右侧表单区 - 宽度优化，添加顶部内边距避免被 Navbar 遮挡 */}
        <div className="w-full lg:w-[58%] xl:w-[60%] flex items-center justify-center p-4 sm:p-6 lg:pt-[72px] lg:pb-8 xl:px-10">
          <div className="w-full max-w-xl">
            {/* 移动端Logo */}
            <div className="lg:hidden text-center mb-6">
              <a href="/" className="inline-flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  theme 
                    ? `bg-gradient-to-br ${theme.gradient} ${theme.shadow}` 
                    : 'bg-gradient-to-br from-blue-500 to-purple-500'
                }`}>
                  <LogoIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">少年球探</span>
              </a>
              {theme && registerData.role && (
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${theme.bgCard} border ${theme.border}`}>
                  {(() => {
                    const Icon = roleIcons[registerData.role];
                    return <Icon className={`w-4 h-4 ${theme.textSecondary}`} />;
                  })()}
                  <span className={theme.textSecondary}>{theme.name}注册</span>
                </div>
              )}
            </div>

            {/* 步骤指示器 */}
            {renderStepIndicator()}

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm sm:text-base">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm flex-shrink-0">!</div>
                <span className="break-all">{error}</span>
              </div>
            )}

            {/* 步骤内容卡片 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
              {loading ? (
                <div className="text-center py-12">
                  <div className={`w-12 h-12 mx-auto mb-4 border-4 border-t-transparent rounded-full animate-spin ${
                    theme 
                      ? `border-${theme.primary}` 
                      : 'border-blue-500'
                  }`} />
                  <p className={theme ? theme.textMuted : 'text-blue-200/60'}>注册中...</p>
                </div>
              ) : (
                renderStepContent()
              )}
            </div>

            {/* 测试账号选择器 */}
            {showTestPanel && (
              <div className="mt-4 sm:mt-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 text-xs sm:text-sm font-medium">快速测试（自动填充数据）</span>
                  </div>
                  <button
                    onClick={() => setShowTestPanel(false)}
                    className="text-amber-400/60 hover:text-amber-400 text-xs"
                  >
                    隐藏
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['player', 'analyst', 'club', 'coach', 'scout'] as TestAccountRole[]).map((role) => {
                    const roleTheme = roleThemes[role as UserRole];
                    const RoleIcon = roleIcons[role as UserRole];
                    return (
                      <button
                        key={role}
                        onClick={() => fillTestData(role)}
                        className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                          selectedTestAccount === role
                            ? `${roleTheme.bgCard} border ${roleTheme.border} ${roleTheme.textPrimary}`
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <RoleIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{roleTheme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 底部链接 */}
            <div className="text-center mt-6 sm:mt-8 text-white/50 text-xs sm:text-sm">
              注册即表示同意
              <a href="/terms" className={`hover:transition-colors mx-1 ${
                theme ? `text-${theme.primaryLight} hover:text-${theme.primary}` : 'text-blue-400 hover:text-blue-300'
              }`}>
                用户协议
              </a>
              和
              <a href="/privacy" className={`hover:transition-colors mx-1 ${
                theme ? `text-${theme.primaryLight} hover:text-${theme.primary}` : 'text-blue-400 hover:text-blue-300'
              }`}>
                隐私政策
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
