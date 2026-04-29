import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Edit3, Shield, Clock, MapPin, Award, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { coachApi } from '../../services/club';

// 教练位置选项
const positionOptions = [
  { value: '守门员教练', label: '守门员教练' },
  { value: '后卫教练', label: '后卫教练' },
  { value: '中场教练', label: '中场教练' },
  { value: '前锋教练', label: '前锋教练' },
  { value: '体能教练', label: '体能教练' },
  { value: '战术教练', label: '战术教练' },
  { value: '技术教练', label: '技术教练' },
  { value: '青训教练', label: '青训教练' },
  { value: '主教练', label: '主教练' },
  { value: '助理教练', label: '助理教练' },
];

// 执照等级选项
const licenseTypeOptions = [
  { value: 'pro', label: '职业级' },
  { value: 'a', label: 'A级' },
  { value: 'b', label: 'B级' },
  { value: 'c', label: 'C级' },
  { value: 'd', label: 'D级' },
  { value: 'other', label: '其他' },
  { value: 'none', label: '暂无' },
];

// 专长选项
const specialtyOptions = [
  { value: 'gk', label: '门将训练' },
  { value: 'defense', label: '防守训练' },
  { value: 'midfield', label: '中场组织' },
  { value: 'attack', label: '进攻训练' },
  { value: 'fitness', label: '体能训练' },
  { value: 'tactical', label: '战术分析' },
  { value: 'youth', label: '青训培养' },
  { value: 'psychology', label: '心理辅导' },
];

interface CoachProfileProps {
  onBack?: () => void;
}

const CoachProfile: React.FC<CoachProfileProps> = ({ onBack = () => window.history.back() }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 基本信息
  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  // 执照信息
  const [licenseType, setLicenseType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [coachingYears, setCoachingYears] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [currentClub, setCurrentClub] = useState('');
  const [verified, setVerified] = useState(false);

  // 加载教练资料
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coachApi.getProfile();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setAvatar(d.User?.avatar || '');
        setName(d.User?.name || '');
        setPosition(d.User?.position || d.licenseType || '');
        setProvince(d.User?.province || '');
        setCity(d.User?.city || '');
        setLicenseType(d.licenseType || '');
        setLicenseNumber(d.licenseNumber || '');
        // coachingYears 处理
        if (d.coachingYears) {
          const years = Number(d.coachingYears);
          if (years >= 10) setCoachingYears('10+');
          else if (years >= 5) setCoachingYears('5-10');
          else if (years >= 2) setCoachingYears('2-5');
          else setCoachingYears('0-2');
        }
        setSpecialties(typeof d.specialties === 'string' ? JSON.parse(d.specialties || '[]') : (d.specialties || []));
        setBio(d.bio || '');
        setCurrentClub(d.currentClub || '');
        setVerified(d.verified || false);
      }
    } catch {
      toast.error('加载资料失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // 保存资料
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await coachApi.updateProfile({
        position,
        licenseType,
        licenseNumber,
        coachingYears: Number(coachingYears) || 0,
        specialties,
        bio,
        city,
        currentClub,
      });
      if (res.data?.success) {
        toast.success('资料保存成功');
        setIsEditing(false);
        await loadProfile();
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 切换专长
  const toggleSpecialty = (spec: string) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(s => s !== spec));
    } else if (specialties.length < 4) {
      setSpecialties([...specialties, spec]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white">个人资料</h1>
        <div className="flex-1" />
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            编辑
          </button>
        )}
      </div>

      {/* 头像卡片 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              name?.slice(0, 1) || '教'
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{name || '教练'}</div>
            <div className="flex items-center gap-2 mt-1">
              {verified && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> 已认证
                </span>
              )}
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                {position || '未设置位置'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">基本信息</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">执教位置</label>
              {isEditing ? (
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">选择位置</option>
                  {positionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <div className="text-white flex items-center gap-1">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  {position || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">所在城市</label>
              {isEditing ? (
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="如：上海"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              ) : (
                <div className="text-white flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {city || '-'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 执照信息 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">执照信息</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">执照等级</label>
              {isEditing ? (
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">选择等级</option>
                  {licenseTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <div className="text-white flex items-center gap-1">
                  <Award className="w-4 h-4 text-gray-400" />
                  {licenseType || '-'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">执照编号</label>
              {isEditing ? (
                <input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="如：AFC-B-2023-001"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              ) : (
                <div className="text-white">{licenseNumber || '-'}</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">专长领域（最多选4个）</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSpecialty(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      specialties.includes(opt.value)
                        ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {specialties.length > 0 ? specialties.map(spec => {
                  const opt = specialtyOptions.find(s => s.value === spec);
                  return (
                    <span key={spec} className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                      {opt?.label || spec}
                    </span>
                  );
                }) : <span className="text-gray-500">-</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 个人简介 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">个人简介</h3>
        {isEditing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="简述您的执教风格和理念"
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
          />
        ) : (
          <div className="text-gray-300 text-sm leading-relaxed">{bio || '-'}</div>
        )}
      </div>

      {/* 当前俱乐部 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">当前俱乐部</h3>
        {isEditing ? (
          <input
            value={currentClub}
            onChange={(e) => setCurrentClub(e.target.value)}
            placeholder="如：上海绿地俱乐部"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
        ) : (
          <div className="text-white">{currentClub || '-'}</div>
        )}
      </div>
    </div>
  );
};

export default CoachProfile;
