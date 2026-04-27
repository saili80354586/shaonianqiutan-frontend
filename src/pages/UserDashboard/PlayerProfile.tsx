import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit3 } from 'lucide-react';
import { playerApi, uploadApi } from '../../services/api';
import { type PlayerProfileResponse, type ExperienceItem } from '../../types/player';
import { ProfileHeaderCard } from './components/player/ProfileHeaderCard';
import { FootballProfileForm } from './components/player/FootballProfileForm';
import { ContactInfoForm } from './components/player/ContactInfoForm';
import { FamilyBackgroundForm } from './components/player/FamilyBackgroundForm';
import { AbilityTagsEditor } from './components/player/AbilityTagsEditor';
import { FootballExperienceTimeline } from './components/player/FootballExperienceTimeline';
import { PhysicalTestSection } from './components/player/PhysicalTestSection';
import toast from 'react-hot-toast';

const PlayerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表单数据
  const [formData, setFormData] = useState({
    nickname: '',
    realName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    position: '',
    secondPosition: '',
    foot: 'right' as 'left' | 'right' | 'both',
    height: 0,
    weight: 0,
    playingStyle: [] as string[],
    jerseyNumber: 0,
    jerseyColor: '',
    currentTeam: '',
    startYear: 0,
    province: '',
    city: '',
    wechat: '',
    school: '',
    fatherHeight: 0,
    fatherPhone: '',
    fatherJob: '',
    fatherAthlete: false,
    motherHeight: 0,
    motherPhone: '',
    motherJob: '',
    motherAthlete: false,
    faRegistered: false,
    association: '',
    technicalTags: [] as string[],
    mentalTags: [] as string[],
    experiences: [] as ExperienceItem[],
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await playerApi.getProfile();
      if (response.data?.success && response.data?.data?.profile) {
        const p = response.data.data.profile;
        setProfile(p);
        setFormData({
          nickname: p.nickname || '',
          realName: p.real_name || '',
          birthDate: p.birth_date || '',
          gender: p.gender || 'male',
          position: p.position || '',
          secondPosition: p.second_position || '',
          foot: p.dominant_foot || 'right',
          height: p.height || 0,
          weight: p.weight || 0,
          playingStyle: p.playing_style || [],
          jerseyNumber: p.jersey_number || 0,
          jerseyColor: p.jersey_color || '',
          currentTeam: p.current_team || '',
          startYear: p.start_year || 0,
          province: p.province || '',
          city: p.city || '',
          wechat: p.wechat || '',
          school: p.school || '',
          fatherHeight: p.father_height || 0,
          fatherPhone: p.father_phone || '',
          fatherJob: p.father_job || '',
          fatherAthlete: p.father_athlete || false,
          motherHeight: p.mother_height || 0,
          motherPhone: p.mother_phone || '',
          motherJob: p.mother_job || '',
          motherAthlete: p.mother_athlete || false,
          faRegistered: p.fa_registered || false,
          association: p.association || '',
          technicalTags: p.technical_tags || [],
          mentalTags: p.mental_tags || [],
          experiences: p.experiences || [],
        });
      }
    } catch (error) {
      toast.error('加载资料失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // 头像上传
  const handleAvatarChange = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const response = await uploadApi.uploadAvatar(file);
      if (response.data?.success) {
        toast.success('头像上传成功');
        await loadProfile();
      }
    } catch (error) {
      toast.error('头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '请填写昵称';
    }
    if (!formData.realName.trim()) {
      newErrors.realName = '请填写真实姓名';
    }
    if (!formData.province) {
      newErrors.province = '请选择省份';
    }
    if (!formData.city.trim()) {
      newErrors.city = '请填写城市';
    }
    if (!formData.position) {
      newErrors.position = '请选择位置';
    }
    if (formData.height > 0 && (formData.height < 100 || formData.height > 250)) {
      newErrors.height = '身高应在100-250cm之间';
    }
    if (formData.weight > 0 && (formData.weight < 20 || formData.weight > 150)) {
      newErrors.weight = '体重应在20-150kg之间';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请检查表单填写');
      return;
    }
    
    try {
      setSaving(true);
      await playerApi.updateProfile({
        nickname: formData.nickname,
        name: formData.realName,
        birth_date: formData.birthDate,
        gender: formData.gender,
        position: formData.position,
        second_position: formData.secondPosition,
        foot: formData.foot,
        height: formData.height,
        weight: formData.weight,
        playing_style: JSON.stringify(formData.playingStyle),
        jersey_number: formData.jerseyNumber,
        jersey_color: formData.jerseyColor,
        current_team: formData.currentTeam,
        start_year: formData.startYear,
        province: formData.province,
        city: formData.city,
        wechat: formData.wechat,
        school: formData.school,
        father_height: formData.fatherHeight,
        father_phone: formData.fatherPhone,
        father_job: formData.fatherJob,
        father_athlete: formData.fatherAthlete,
        mother_height: formData.motherHeight,
        mother_phone: formData.motherPhone,
        mother_job: formData.motherJob,
        mother_athlete: formData.motherAthlete,
        fa_registered: formData.faRegistered,
        association: formData.association,
        technical_tags: JSON.stringify(formData.technicalTags),
        mental_tags: JSON.stringify(formData.mentalTags),
        experiences: JSON.stringify(formData.experiences),
      });
      setIsEditing(false);
      toast.success('资料保存成功');
      await loadProfile();
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">我的资料</h1>
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={saving || uploadingAvatar}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEditing ? (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                编辑
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 基本信息卡片 */}
        <ProfileHeaderCard
          profile={profile!}
          isEditing={isEditing}
          completeness={profile?.profile_completeness || 0}
          onAvatarChange={handleAvatarChange}
        />

        {/* 足球档案 */}
        <FootballProfileForm
          isEditing={isEditing}
          formData={{
            position: formData.position,
            secondPosition: formData.secondPosition,
            foot: formData.foot,
            height: formData.height,
            weight: formData.weight,
            playingStyle: formData.playingStyle,
            jerseyNumber: formData.jerseyNumber,
            jerseyColor: formData.jerseyColor,
            currentTeam: formData.currentTeam,
            startYear: formData.startYear,
            faRegistered: formData.faRegistered,
            association: formData.association,
          }}
          onChange={handleChange}
        />

        {/* 联系信息 */}
        <ContactInfoForm
          isEditing={isEditing}
          phone={profile?.phone}
          formData={{
            province: formData.province,
            city: formData.city,
            wechat: formData.wechat,
            school: formData.school,
          }}
          onChange={handleChange}
        />

        {/* 家庭背景 */}
        <FamilyBackgroundForm
          isEditing={isEditing}
          formData={formData}
          onChange={handleChange}
        />

        {/* 能力标签 */}
        <AbilityTagsEditor
          isEditing={isEditing}
          formData={{
            technicalTags: formData.technicalTags,
            mentalTags: formData.mentalTags,
          }}
          onChange={handleChange}
        />

        {/* 足球经历 */}
        <FootballExperienceTimeline
          isEditing={isEditing}
          formData={{
            experiences: formData.experiences,
          }}
          onChange={handleChange}
        />

        {/* 体测数据 */}
        <PhysicalTestSection
          isEditing={isEditing}
          latestTest={profile?.latest_physical_test}
          onUpdate={loadProfile}
        />
      </div>
    </div>
  );
};

export default PlayerProfilePage;
