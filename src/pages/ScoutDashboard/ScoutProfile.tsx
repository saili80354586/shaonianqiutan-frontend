import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Edit3, Search, Users, MapPin, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { scoutApi } from '../../services/api';

// 球探位置偏好选项
const positionOptions = [
  { value: '前锋', label: '前锋' },
  { value: '中场', label: '中场' },
  { value: '后卫', label: '后卫' },
  { value: '门将', label: '门将' },
];

// 年龄段选项
const ageGroupOptions = [
  { value: 'U8', label: 'U8 (8岁以下)' },
  { value: 'U10', label: 'U10 (10岁以下)' },
  { value: 'U12', label: 'U12 (12岁以下)' },
  { value: 'U14', label: 'U14 (14岁以下)' },
  { value: 'U16', label: 'U16 (16岁以下)' },
  { value: 'U18', label: 'U18 (18岁以下)' },
  { value: '成年', label: '成年' },
];

// 区域选项
const regionOptions = [
  { value: '华东', label: '华东' },
  { value: '华北', label: '华北' },
  { value: '华中', label: '华中' },
  { value: '华南', label: '华南' },
  { value: '西南', label: '西南' },
  { value: '西北', label: '西北' },
  { value: '东北', label: '东北' },
  { value: '海外', label: '海外' },
];

// 机构类型
const orgTypeOptions = [
  { value: '自由球探', label: '自由球探' },
  { value: '俱乐部球探', label: '俱乐部球探' },
  { value: '经纪人', label: '经纪人' },
  { value: '球探机构', label: '球探机构' },
];

interface ScoutProfileProps {
  onBack: () => void;
}

const ScoutProfile: React.FC<ScoutTableProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  // 球探专属字段
  const [scoutingExperience, setScoutingExperience] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [preferredAgeGroups, setPreferredAgeGroups] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [currentOrganization, setCurrentOrganization] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await scoutApi.getProfile();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setAvatar(d.avatar || '');
        setName(d.name || '');
        setGender(d.gender || '');
        setPhone(d.phone || '');
        setProvince(d.province || '');
        setCity(d.city || '');
        setScoutingExperience(d.scoutingExperience || '');
        setSpecialties(typeof d.specialties === 'string' ? JSON.parse(d.specialties || '[]') : (d.specialties || []));
        setPreferredAgeGroups(typeof d.preferredAgeGroups === 'string' ? JSON.parse(d.preferredAgeGroups || '[]') : (d.preferredAgeGroups || []));
        setBio(d.bio || '');
        setCurrentOrganization(d.currentOrganization || '');
        setVerified(d.verified || false);
      }
    } catch { toast.error('加载资料失败'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await scoutApi.updateProfile({
        scoutingExperience,
        specialties: JSON.stringify(specialties),
        preferredAgeGroups: JSON.stringify(preferredAgeGroups),
        bio,
        currentOrganization,
      });
      if (res.data?.success) {
        toast.success('保存成功');
        setIsEditing(false);
        await loadProfile();
      }
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  const toggleSpecialty = (spec: string) => {
    setSpecialties(prev => prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]);
  };

  const toggleAgeGroup = (ag: string) => {
    setPreferredAgeGroups(prev => prev.includes(ag) | prev.filter(a => a !== ag));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white">个人资料</h1>
        <div className="flex-1" />
        {isEditing ? (
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> 编辑
          </button>
        )}
      </div>

      {/* 基本信息卡 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name?.slice(0, 1) || '球'}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{name || '球探'}</div>
            <div className="flex items-center gap-2 mt-1">
              {verified && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1"><Shield className="w-3 h-3" /> 已认证</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            {province}{city && ` ${city}` || '未设置'}
          </div>
        </div>
      </div>

      {/* 球探专属信息 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">球探信息</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">个人简介</label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="简述您的球探经历和专业背景"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
              />
            ) : (
              <div className="text-gray-300 text-sm">{bio || '未填写'}</div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">所属机构</label>
            {isEditing ? (
              <input
                value={currentOrganization}
                onChange={e => setCurrentOrganization(e.target.value)}
                placeholder="如：XX俱乐部球探部"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            ) : (
              <div className="text-white">{currentOrganization || '-'}</div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">球探年限</label>
            {isEditing ? (
              <select
                value={scoutingExperience}
                onChange={e => setScoutingExperience(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">选择年限</option>
                <option value="1年以下">1年以下</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5-10年">5-10年</option>
                <option value="10年以上">10年以上</option>
              </select>
            ) : (
              <div className="text-white">{scoutingExperience || '-'}</div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">擅长发掘位置</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {positionOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSpecialty(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      specialties.includes(opt.value)
                        ? 'bg-violet-500/30 text-violet-400 border border-violet-500/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {specialties.length > 0 ? specialties.map(s => (
                  <span key={s} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-sm">{s}</span>
                )) : <span className="text-gray-500">未填写</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">偏好年龄段</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {ageGroupOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleAgeGroup(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      preferredAgeGroups.includes(opt.value)
                        ? 'bg-violet-500/30 text-violet-400 border border-violet-500/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferredAgeGroups.length > 0 ? preferredAgeGroups.map(a => {
                  const opt = ageGroupOptions.find(o => o.value === a);
                  return <span key={a} className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-sm">{opt?.label || a}</span>;
                }) : <span className="text-gray-500">未填写</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoutProfile;