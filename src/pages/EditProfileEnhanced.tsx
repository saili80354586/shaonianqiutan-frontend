import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuthStore } from '../store';
import { Loading } from '../components';
import type { Gender, Foot } from '../types';
import { 
  CheckCircle2, AlertCircle, User, Trophy, Activity, 
  Users, Phone, MapPin, Save, ChevronRight, ChevronDown 
} from 'lucide-react';

// 技术特点选项（与注册时一致）
const technicalTagOptions = [
  '速度快', '爆发力强', '盘带好', '传球准', '视野开阔', 
  '射门强', '头球好', '防守稳', '定位球专家', '一对一强', 
  '体能充沛', '反应快', '制空强', '出球快'
];

// 心智性格选项（与注册时一致）
const mentalTagOptions = [
  '领导力', '抗压能力', '团队协作', '战术理解', 
  '专注度高', '自信', '冷静', '果断', '学习快', '韧性强'
];

// 位置选项
const positionOptions = [
  { value: 'GK', label: '门将' },
  { value: 'CB', label: '中后卫' },
  { value: 'LB', label: '左后卫' },
  { value: 'RB', label: '右后卫' },
  { value: 'DM', label: '防守中场' },
  { value: 'CM', label: '中场' },
  { value: 'AM', label: '攻击中场' },
  { value: 'LW', label: '左边锋' },
  { value: 'RW', label: '右边锋' },
  { value: 'CF', label: '前锋' },
  { value: 'ST', label: '射手' },
];

// 表单 Tab 类型
type FormTab = 'basic' | 'football' | 'physical' | 'family';

const EditProfileEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  
  // 基础信息
  const [basicInfo, setBasicInfo] = useState({
    nickname: '',
    realName: '',
    birthDate: '',
    gender: '' as Gender | '',
    province: '',
    city: '',
    avatar: '',
  });
  
  // 足球档案
  const [footballInfo, setFootballInfo] = useState({
    position: '',
    secondPosition: '',
    dominantFoot: '' as Foot | '',
    height: '',
    weight: '',
    team: '',
    school: '',
    startYear: '',
    faRegistered: false,
    association: '',
    jerseyNumber: '',
    jerseyColor: '',
  });
  
  // 能力标签
  const [technicalTags, setTechnicalTags] = useState<string[]>([]);
  const [mentalTags, setMentalTags] = useState<string[]>([]);
  
  // 体测数据
  const [physicalTests, setPhysicalTests] = useState({
    sprint30m: '',
    longJump: '',
    flexibility: '',
    pullUps: '',
    pushUps: '',
    sitUps: '',
    fiveMeterShuttle: '',
    coordination: '',
  });
  
  // 家庭信息
  const [familyInfo, setFamilyInfo] = useState({
    fatherHeight: '',
    motherHeight: '',
    fatherOccupation: '',
    motherOccupation: '',
    fatherAthlete: false,
    motherAthlete: false,
  });
  
  // 联系信息
  const [contactInfo, setContactInfo] = useState({
    wechat: '',
    contactPhone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        const playerProfile = profile.roles?.find((r: any) => r.type === 'player')?.profile;
        
        // 设置基础信息
        setBasicInfo({
          nickname: profile.nickname || '',
          realName: playerProfile?.realName || profile.name || '',
          birthDate: playerProfile?.birthDate || profile.birth_date || '',
          gender: playerProfile?.gender || profile.gender || '',
          province: playerProfile?.province || profile.province || '',
          city: playerProfile?.city || profile.city || '',
          avatar: profile.avatar || '',
        });
        
        // 设置足球档案
        setFootballInfo({
          position: playerProfile?.position || profile.position || '',
          secondPosition: playerProfile?.secondPosition || '',
          dominantFoot: playerProfile?.dominantFoot || profile.foot || '',
          height: playerProfile?.height?.toString() || profile.height?.toString() || '',
          weight: playerProfile?.weight?.toString() || profile.weight?.toString() || '',
          team: playerProfile?.team || profile.club || '',
          school: playerProfile?.school || '',
          startYear: playerProfile?.startYear?.toString() || '',
          faRegistered: playerProfile?.faRegistered || false,
          association: playerProfile?.association || '',
          jerseyNumber: playerProfile?.jerseyNumber?.toString() || '',
          jerseyColor: playerProfile?.jerseyColor || '',
        });
        
        // 设置能力标签
        setTechnicalTags(playerProfile?.technicalTags || []);
        setMentalTags(playerProfile?.mentalTags || []);
        
        // 设置体测数据
        const pt = playerProfile?.physicalTests || {};
        setPhysicalTests({
          sprint30m: pt.sprint30m?.toString() || '',
          longJump: pt.longJump?.toString() || '',
          flexibility: pt.flexibility?.toString() || '',
          pullUps: pt.pullUps?.toString() || '',
          pushUps: pt.pushUps?.toString() || '',
          sitUps: pt.sitUps?.toString() || '',
          fiveMeterShuttle: pt.fiveMeterShuttle?.toString() || '',
          coordination: pt.coordination?.toString() || '',
        });
        
        // 设置家庭信息
        setFamilyInfo({
          fatherHeight: playerProfile?.fatherHeight?.toString() || '',
          motherHeight: playerProfile?.motherHeight?.toString() || '',
          fatherOccupation: playerProfile?.fatherOccupation || '',
          motherOccupation: playerProfile?.motherOccupation || '',
          fatherAthlete: playerProfile?.fatherAthlete || false,
          motherAthlete: playerProfile?.motherAthlete || false,
        });
        
        // 设置联系信息
        setContactInfo({
          wechat: playerProfile?.wechat || '',
          contactPhone: playerProfile?.contactPhone || '',
        });
      }
    } catch (error) {
      console.error('加载资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!basicInfo.nickname.trim()) {
      newErrors.nickname = '请输入昵称';
    }
    if (!basicInfo.realName.trim()) {
      newErrors.realName = '请输入真实姓名';
    }
    if (!basicInfo.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    if (!basicInfo.gender) {
      newErrors.gender = '请选择性别';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setActiveTab('basic');
      return;
    }
    
    setSaving(true);
    try {
      const profileData = {
        // 基础信息
        nickname: basicInfo.nickname,
        realName: basicInfo.realName,
        birthDate: basicInfo.birthDate,
        gender: basicInfo.gender,
        province: basicInfo.province,
        city: basicInfo.city,
        avatar: basicInfo.avatar,
        
        // 足球档案
        position: footballInfo.position,
        secondPosition: footballInfo.secondPosition,
        dominantFoot: footballInfo.dominantFoot,
        height: footballInfo.height ? parseFloat(footballInfo.height) : undefined,
        weight: footballInfo.weight ? parseFloat(footballInfo.weight) : undefined,
        team: footballInfo.team,
        school: footballInfo.school,
        startYear: footballInfo.startYear ? parseInt(footballInfo.startYear) : undefined,
        faRegistered: footballInfo.faRegistered,
        association: footballInfo.association,
        jerseyNumber: footballInfo.jerseyNumber ? parseInt(footballInfo.jerseyNumber) : undefined,
        jerseyColor: footballInfo.jerseyColor,
        
        // 能力标签
        technicalTags,
        mentalTags,
        
        // 体测数据
        physicalTests: {
          sprint30m: physicalTests.sprint30m ? parseFloat(physicalTests.sprint30m) : undefined,
          longJump: physicalTests.longJump ? parseFloat(physicalTests.longJump) : undefined,
          flexibility: physicalTests.flexibility ? parseFloat(physicalTests.flexibility) : undefined,
          pullUps: physicalTests.pullUps ? parseInt(physicalTests.pullUps) : undefined,
          pushUps: physicalTests.pushUps ? parseInt(physicalTests.pushUps) : undefined,
          sitUps: physicalTests.sitUps ? parseInt(physicalTests.sitUps) : undefined,
          fiveMeterShuttle: physicalTests.fiveMeterShuttle ? parseFloat(physicalTests.fiveMeterShuttle) : undefined,
          coordination: physicalTests.coordination ? parseInt(physicalTests.coordination) : undefined,
        },
        
        // 家庭信息
        fatherHeight: familyInfo.fatherHeight ? parseFloat(familyInfo.fatherHeight) : undefined,
        motherHeight: familyInfo.motherHeight ? parseFloat(familyInfo.motherHeight) : undefined,
        fatherOccupation: familyInfo.fatherOccupation,
        motherOccupation: familyInfo.motherOccupation,
        fatherAthlete: familyInfo.fatherAthlete,
        motherAthlete: familyInfo.motherAthlete,
        
        // 联系信息
        wechat: contactInfo.wechat,
        contactPhone: contactInfo.contactPhone,
      };
      
      const response = await userApi.updateProfile(profileData);
      if (response.success) {
        setSuccess(true);
        updateUser(response.data);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string, type: 'technical' | 'mental') => {
    if (type === 'technical') {
      setTechnicalTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : prev.length < 5 ? [...prev, tag] : prev
      );
    } else {
      setMentalTags(prev => 
        prev.includes(tag) 
          ? prev.filter(t => t !== tag)
          : prev.length < 4 ? [...prev, tag] : prev
      );
    }
  };

  const tabs: { id: FormTab; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: '基础信息', icon: <User className="w-4 h-4" /> },
    { id: 'football', label: '足球档案', icon: <Trophy className="w-4 h-4" /> },
    { id: 'physical', label: '体测数据', icon: <Activity className="w-4 h-4" /> },
    { id: 'family', label: '家庭信息', icon: <Users className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/user-dashboard" className="text-white/60 hover:text-white transition-colors">
              ← 返回
            </Link>
            <h1 className="text-2xl font-bold text-white">编辑个人资料</h1>
          </div>
          <p className="text-white/60">完善您的球员档案，让更多球探发现您</p>
        </div>

        {/* 成功提示 */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400">保存成功！</span>
          </div>
        )}

        {/* Tab 导航 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 表单内容 */}
        <div className="space-y-6">
          {/* Tab 内容渲染 */}
          {activeTab === 'basic' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">基础信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">昵称 *</label>
                  <input
                    type="text"
                    value={basicInfo.nickname}
                    onChange={e => setBasicInfo({ ...basicInfo, nickname: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="请输入昵称"
                  />
                  {errors.nickname && <p className="text-red-400 text-sm mt-1">{errors.nickname}</p>}
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">真实姓名 *</label>
                  <input
                    type="text"
                    value={basicInfo.realName}
                    onChange={e => setBasicInfo({ ...basicInfo, realName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="请输入真实姓名"
                  />
                  {errors.realName && <p className="text-red-400 text-sm mt-1">{errors.realName}</p>}
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">出生日期 *</label>
                  <input
                    type="date"
                    value={basicInfo.birthDate}
                    onChange={e => setBasicInfo({ ...basicInfo, birthDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">性别 *</label>
                  <select
                    value={basicInfo.gender}
                    onChange={e => setBasicInfo({ ...basicInfo, gender: e.target.value as Gender })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'football' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">足球档案</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">主打位置</label>
                  <select
                    value={footballInfo.position}
                    onChange={e => setFootballInfo({ ...footballInfo, position: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">请选择位置</option>
                    {positionOptions.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">身高 (cm)</label>
                  <input
                    type="number"
                    value={footballInfo.height}
                    onChange={e => setFootballInfo({ ...footballInfo, height: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="如：155"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">体重 (kg)</label>
                  <input
                    type="number"
                    value={footballInfo.weight}
                    onChange={e => setFootballInfo({ ...footballInfo, weight: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="如：42"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">当前球队</label>
                  <input
                    type="text"
                    value={footballInfo.team}
                    onChange={e => setFootballInfo({ ...footballInfo, team: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="如：恒大足校U13"
                  />
                </div>
              </div>
              
              {/* 能力标签 */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-white/70 mb-3">技术特点（最多5个）</h3>
                <div className="flex flex-wrap gap-2">
                  {technicalTagOptions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag, 'technical')}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        technicalTags.includes(tag)
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-white/70 mb-3">心智性格（最多4个）</h3>
                <div className="flex flex-wrap gap-2">
                  {mentalTagOptions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag, 'mental')}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        mentalTags.includes(tag)
                          ? 'bg-purple-500/20 border border-purple-500 text-purple-400'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'physical' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">体测数据</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'sprint30m', label: '30米跑', unit: '秒' },
                  { key: 'longJump', label: '立定跳远', unit: 'cm' },
                  { key: 'flexibility', label: '坐位体前屈', unit: 'cm' },
                  { key: 'pullUps', label: '引体向上', unit: '个' },
                  { key: 'pushUps', label: '俯卧撑', unit: '个' },
                  { key: 'sitUps', label: '仰卧起坐', unit: '个/分' },
                  { key: 'fiveMeterShuttle', label: '5×25米折返', unit: '秒' },
                  { key: 'coordination', label: '协调性测试', unit: '分' },
                ].map((item) => (
                  <div key={item.key} className="p-4 bg-white/5 rounded-xl">
                    <label className="block text-sm text-white/70 mb-2">{item.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={item.key === 'sprint30m' ? '0.1' : '1'}
                        value={physicalTests[item.key as keyof typeof physicalTests]}
                        onChange={e => setPhysicalTests({ ...physicalTests, [item.key]: e.target.value })}
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                        placeholder={`输入${item.label}`}
                      />
                      <span className="text-white/40 text-sm">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6">家庭信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">父亲身高 (cm)</label>
                  <input
                    type="number"
                    value={familyInfo.fatherHeight}
                    onChange={e => setFamilyInfo({ ...familyInfo, fatherHeight: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="如：178"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">母亲身高 (cm)</label>
                  <input
                    type="number"
                    value={familyInfo.motherHeight}
                    onChange={e => setFamilyInfo({ ...familyInfo, motherHeight: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="如：165"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <div className="mt-8 flex justify-end gap-4">
          <Link
            to="/user-dashboard"
            className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存修改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileEnhanced;
