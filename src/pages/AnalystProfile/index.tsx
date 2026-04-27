import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Edit3, Shield, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { analystApi } from '../../services/api';

const AnalystProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 基本信息
  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analystApi.getMyProfile();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setAvatar(d.avatar || '');
        setName(d.name || d.nickname || '');
        setBio(d.bio || '');
        setCity(d.city || '');
        setSpecialty(d.specialty || '');
        setExperience(d.experience || '');
        setContactPhone(d.contact_phone || '');
        setContactEmail(d.contact_email || '');
        setVerified(d.verified || false);
        setRating(d.rating || 0);
        setReviewCount(d.review_count || 0);
      }
    } catch {
      toast.error('加载资料失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await analystApi.updateMyProfile({
        name, bio, city, specialty,
        experience, contact_phone: contactPhone,
        contact_email: contactEmail,
      });
      toast.success('保存成功');
      setIsEditing(false);
      loadProfile();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => history.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">个人资料</h1>
        {isEditing ? (
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> 编辑
          </button>
        )}
      </div>

      {/* 基本信息卡片 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name?.slice(0, 2) || '析'}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{name || '分析师'}</div>
            <div className="flex items-center gap-2 mt-1">
              {verified && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> 已认证
                </span>
              )}
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">{specialty || '未设置'}</span>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-300">{rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({reviewCount}条评价)</span>
              </div>
            )}
          </div>
        </div>
        {bio && <p className="text-gray-400 text-sm">{bio}</p>}
      </div>

      {/* 详细信息 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">详细信息</h3>
        <div className="space-y-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">专业方向</div>
            {isEditing ? (
              <input value={specialty} onChange={e => setSpecialty(e.target.value)}
                placeholder="如：战术分析、体能分析、技术分析"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{specialty || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">从业经验</div>
            {isEditing ? (
              <textarea value={experience} onChange={e => setExperience(e.target.value)}
                placeholder="简述您的分析经历"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none" />
            ) : (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{experience || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">所在城市</div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="如：上海"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />{city || '-'}
              </div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">联系电话</div>
            {isEditing ? (
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                placeholder="手机号"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{contactPhone || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">联系邮箱</div>
            {isEditing ? (
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{contactEmail || '-'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystProfile;