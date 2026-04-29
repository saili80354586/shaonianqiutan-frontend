import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Edit3, MapPin, Trophy, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../services/club';

const ClubProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [logo, setLogo] = useState('');
  const [clubName, setClubName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const contactPosition = '';
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [clubSize, setClubSize] = useState('');
  const [achievements, setAchievements] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [coachCount, setCoachCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clubApi.getProfile();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setLogo(d.logo || '');
        setClubName(d.name || d.club_name || '');
        setDescription(d.description || '');
        setAddress(d.address || '');
        setContactName(d.contactName || d.contact_name || '');
        setContactPhone(d.contactPhone || d.contact_phone || '');
        setProvince(d.province || '');
        setCity(d.city || '');
        setEstablishedYear(String(d.establishedYear ?? d.established_year ?? ''));
        setClubSize(d.clubSize || d.club_size || '');
        setAchievements(d.achievements || '');
        setTeamCount(d.teamCount ?? d.team_count ?? 0);
        setPlayerCount(d.playerCount ?? d.player_count ?? 0);
        setCoachCount(d.coachCount ?? d.coach_count ?? 0);
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
      await clubApi.updateProfile({
        name: clubName,
        description,
        address,
        province,
        city,
        contactName,
        contactPhone,
        establishedYear: establishedYear ? Number(establishedYear) : 0,
        clubSize,
        achievements,
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
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sizeLabel = clubSize === 'large' ? '大型' : clubSize === 'medium' ? '中型' : clubSize === 'small' ? '小型' : '-';

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => history.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">俱乐部资料</h1>
        {isEditing ? (
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> 编辑
          </button>
        )}
      </div>

      {/* Logo + 俱乐部名 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
            {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : clubName?.slice(0, 2) || '俱'}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{clubName || '俱乐部名称'}</div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              {establishedYear && (
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />{establishedYear}年
                </span>
              )}
              {sizeLabel && sizeLabel !== '-' && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />{sizeLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>

      {/* 规模统计 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{teamCount}</div>
          <div className="text-xs text-gray-400 mt-1">球队</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{playerCount}</div>
          <div className="text-xs text-gray-400 mt-1">球员</div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 text-center">
          <div className="text-2xl font-bold text-white">{coachCount}</div>
          <div className="text-xs text-gray-400 mt-1">教练</div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-4">
        <h3 className="text-white font-semibold mb-4">基本信息</h3>
        <div className="space-y-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">俱乐部名称</div>
            {isEditing ? (
              <input value={clubName} onChange={e => setClubName(e.target.value)}
                placeholder="俱乐部全称"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{clubName || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">简介</div>
            {isEditing ? (
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={3} placeholder="俱乐部简介"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none" />
            ) : (
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{description || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">所在城市</div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <input value={`${province} ${city}`} onChange={e => {
                  const parts = e.target.value.split(' ');
                  setProvince(parts[0] || '');
                  setCity(parts[1] || '');
                }}
                  placeholder="省 市"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />{province} {city || '-'}
              </div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">地址</div>
            {isEditing ? (
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="详细地址"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{address || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">成立年份</div>
            {isEditing ? (
              <input value={establishedYear} onChange={e => setEstablishedYear(e.target.value)}
                placeholder="如：2020"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
            ) : (
              <div className="text-white">{establishedYear || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">俱乐部规模</div>
            {isEditing ? (
              <select value={clubSize} onChange={e => setClubSize(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                <option value="">请选择</option>
                <option value="small">小型</option>
                <option value="medium">中型</option>
                <option value="large">大型</option>
              </select>
            ) : (
              <div className="text-white">{sizeLabel || '-'}</div>
            )}
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">主要成就</div>
            {isEditing ? (
              <textarea value={achievements} onChange={e => setAchievements(e.target.value)}
                rows={2} placeholder="俱乐部荣誉和成就"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none" />
            ) : (
              <div className="text-gray-300 text-sm">{achievements || '-'}</div>
            )}
          </div>
        </div>
      </div>

      {/* 联系人 */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold mb-4">联系人信息</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-sm">联系人</span>
            {isEditing ? (
              <input value={contactName} onChange={e => setContactName(e.target.value)}
                placeholder="联系人姓名"
                className="max-w-xs flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-right" />
            ) : (
              <span className="text-white">{contactName || '-'}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-sm">职位</span>
            <span className="text-white">{contactPosition || '-'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 text-sm">联系电话</span>
            {isEditing ? (
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                placeholder="联系电话"
                className="max-w-xs flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-right" />
            ) : (
              <span className="text-white">{contactPhone || '-'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubProfile;
