import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userApi } from '../services/api';
import { useAuthStore } from '../store';
import { Loading } from '../components';
import type { Gender, Foot } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// 注册流程传递的数据类型
interface RegisterProfileData {
  nickname?: string;
  realName?: string;
  name?: string;
  birthDate?: string;
  birth_date?: string;
  gender?: Gender;
  position?: string;
  dominantFoot?: Foot;
  foot?: Foot;
  avatar?: string;
  province?: string;
  city?: string;
  height?: number | string;
  weight?: number | string;
  team?: string;
  club?: string;
  school?: string;
  bio?: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 标记哪些字段是注册时已填写的
  const [filledFromRegister, setFilledFromRegister] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    birth_date: '',
    gender: undefined as Gender | undefined,
    height: '',
    weight: '',
    position: '',
    foot: undefined as Foot | undefined,
    club: '',
    school: '',
    bio: '',
    contactWechat: '',
    contactPhone: '',
    province: '',
    city: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 检查是否有从注册流程传递过来的数据
      const registerData = location.state?.profileData as RegisterProfileData | undefined;
      const fromRegister = location.state?.fromRegister as boolean | undefined;
      
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        const filledFields = new Set<string>();
        
        // 合并注册数据和后端数据，优先使用注册数据（如果是从注册流程来的）
        const mergedData = {
          nickname: fromRegister && registerData?.nickname ? registerData.nickname : (profile.nickname || profile.username || ''),
          name: fromRegister && (registerData?.realName || registerData?.name) 
            ? (registerData.realName || registerData.name) 
            : (profile.name || ''),
          birth_date: fromRegister && (registerData?.birthDate || registerData?.birth_date)
            ? (registerData.birthDate || registerData.birth_date)
            : (profile.birth_date || ''),
          gender: fromRegister && registerData?.gender 
            ? registerData.gender 
            : profile.gender,
          height: fromRegister && registerData?.height 
            ? String(registerData.height) 
            : (profile.height?.toString() || ''),
          weight: fromRegister && registerData?.weight 
            ? String(registerData.weight) 
            : (profile.weight?.toString() || ''),
          position: fromRegister && registerData?.position 
            ? registerData.position 
            : (profile.position || ''),
          foot: fromRegister && (registerData?.dominantFoot || registerData?.foot)
            ? (registerData.dominantFoot || registerData.foot)
            : profile.foot,
          club: fromRegister && (registerData?.team || registerData?.club)
            ? (registerData.team || registerData.club)
            : (profile.club || ''),
          school: fromRegister && registerData?.school ? registerData.school : (profile.school || ''),
          bio: fromRegister && registerData?.bio ? registerData.bio : (profile.bio || ''),
          contactWechat: profile.contactWechat || '',
          contactPhone: profile.contactPhone || '',
          province: fromRegister && registerData?.province ? registerData.province : (profile.province || ''),
          city: fromRegister && registerData?.city ? registerData.city : (profile.city || ''),
        };
        
        // 标记从注册流程带来的已填写字段
        if (fromRegister && registerData) {
          if (registerData.nickname) filledFields.add('nickname');
          if (registerData.realName || registerData.name) filledFields.add('name');
          if (registerData.birthDate || registerData.birth_date) filledFields.add('birth_date');
          if (registerData.gender) filledFields.add('gender');
          if (registerData.position) filledFields.add('position');
          if (registerData.dominantFoot || registerData.foot) filledFields.add('foot');
          if (registerData.avatar) filledFields.add('avatar');
          if (registerData.province) filledFields.add('province');
          if (registerData.city) filledFields.add('city');
          if (registerData.height) filledFields.add('height');
          if (registerData.weight) filledFields.add('weight');
          if (registerData.team || registerData.club) filledFields.add('club');
        }
        
        setFormData(mergedData);
        setFilledFromRegister(filledFields);
        
        if (fromRegister && registerData?.avatar) {
          setAvatarPreview(registerData.avatar);
        } else if (profile.avatar) {
          setAvatarPreview(profile.avatar);
        }
      } else if (fromRegister && registerData) {
        // 后端没有数据，但注册时有数据（新用户首次编辑）
        const filledFields = new Set<string>();
        
        setFormData({
          nickname: registerData.nickname || '',
          name: registerData.realName || registerData.name || '',
          birth_date: registerData.birthDate || registerData.birth_date || '',
          gender: registerData.gender,
          height: registerData.height ? String(registerData.height) : '',
          weight: registerData.weight ? String(registerData.weight) : '',
          position: registerData.position || '',
          foot: registerData.dominantFoot || registerData.foot,
          club: registerData.team || registerData.club || '',
          school: registerData.school || '',
          bio: registerData.bio || '',
          contactWechat: '',
          contactPhone: '',
          province: registerData.province || '',
          city: registerData.city || '',
        });
        
        if (registerData.nickname) filledFields.add('nickname');
        if (registerData.realName || registerData.name) filledFields.add('name');
        if (registerData.birthDate || registerData.birth_date) filledFields.add('birth_date');
        if (registerData.gender) filledFields.add('gender');
        if (registerData.position) filledFields.add('position');
        if (registerData.dominantFoot || registerData.foot) filledFields.add('foot');
        if (registerData.avatar) filledFields.add('avatar');
        if (registerData.province) filledFields.add('province');
        if (registerData.city) filledFields.add('city');
        if (registerData.height) filledFields.add('height');
        if (registerData.weight) filledFields.add('weight');
        if (registerData.team || registerData.club) filledFields.add('club');
        
        setFilledFromRegister(filledFields);
        
        if (registerData.avatar) {
          setAvatarPreview(registerData.avatar);
        }
      }
    } catch (error) {
      console.error('加载资料失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 检查字段是否已填写
  const isFieldFilled = (fieldName: string) => {
    const value = formData[fieldName as keyof typeof formData];
    return value !== undefined && value !== '' && value !== null;
  };

  // 获取字段填写状态
  const getFieldStatus = (fieldName: string) => {
    const filled = isFieldFilled(fieldName);
    const fromRegister = filledFromRegister.has(fieldName);
    
    if (filled && fromRegister) {
      return { status: 'filled-from-register', label: '注册已填', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', icon: CheckCircle2 };
    } else if (filled) {
      return { status: 'filled', label: '已填写', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: CheckCircle2 };
    } else {
      return { status: 'empty', label: '待补充', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', icon: AlertCircle };
    }
  };

  // 字段状态标签组件
  const FieldStatusBadge: React.FC<{ fieldName: string }> = ({ fieldName }) => {
    const status = getFieldStatus(fieldName);
    const Icon = status.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.bgColor} ${status.color} ${status.borderColor} border ml-2`}>
        <Icon className="w-3 h-3" />
        {status.label}
      </span>
    );
  };

  const handleSubmit = async () => {
    // 表单验证
    const newErrors: Record<string, string> = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = '昵称不能为空';
    }

    if (!formData.name.trim()) {
      newErrors.name = '球员姓名不能为空';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = '出生日期不能为空';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 5 || age > 25) {
        newErrors.birth_date = '年龄必须在5-25岁之间';
      }
    }

    if (formData.height && (parseInt(formData.height) < 120 || parseInt(formData.height) > 210)) {
      newErrors.height = '身高必须在120-210cm之间';
    }

    if (formData.weight && (parseInt(formData.weight) < 30 || parseInt(formData.weight) > 150)) {
      newErrors.weight = '体重必须在30-150kg之间';
    }

    if (formData.contactPhone && !/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '请输入正确的手机号码';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const data = {
        ...formData,
        avatar: avatarPreview,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        // 保持字段名一致性
        birth_date: formData.birth_date,
        realName: formData.name,
        dominantFoot: formData.foot,
        team: formData.club,
      };
      const response = await userApi.updateProfile(data);
      if (response.success && response.data) {
        updateUser(response.data);
        // 清除注册标记
        setFilledFromRegister(new Set());
        navigate(-1);
      }
    } catch (error) {
      console.error('保存失败', error);
      alert('保存失败,请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to=".." className="btn-secondary inline-flex items-center gap-2">
            <span>←</span> 返回
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">✏️ 编辑资料</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
            disabled={saving}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存修改'}
          </button>
        </div>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center p-8 bg-gradient-to-br from-green-50 via-gray-50 to-orange-50 rounded-xl border border-gray-200 mb-7">
        <div className="mb-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="头像"
              className="w-36 h-36 rounded-full object-cover border-4 border-green-500 shadow-lg hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center text-6xl">
              👤
            </div>
          )}
        </div>
        <input
          type="file"
          id="avatarInput"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <button
          className="px-6 py-3 bg-transparent border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium flex items-center gap-2"
          onClick={() => document.getElementById('avatarInput')?.click()}
        >
          📷 更换头像
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-7 overflow-hidden">
        <div className="px-7 py-5 bg-gradient-to-r from-green-50 to-transparent border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <span className="text-xl">👤</span> 基本信息
          </h2>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label flex items-center">
                昵称 <span className="text-red-500">*</span>
                <FieldStatusBadge fieldName="nickname" />
              </label>
              <input
                type="text"
                className={`input-field ${errors.nickname ? 'border-red-500' : ''} ${filledFromRegister.has('nickname') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="请输入昵称"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData({ ...formData, nickname: e.target.value });
                  setErrors({ ...errors, nickname: '' });
                }}
              />
              {errors.nickname && (
                <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                球员姓名 <span className="text-red-500">*</span>
                <FieldStatusBadge fieldName="name" />
              </label>
              <input
                type="text"
                className={`input-field ${errors.name ? 'border-red-500' : ''} ${filledFromRegister.has('name') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="请输入真实姓名"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: '' });
                }}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                出生日期 <span className="text-red-500">*</span>
                <FieldStatusBadge fieldName="birth_date" />
              </label>
              <input
                type="date"
                className={`input-field ${errors.birth_date ? 'border-red-500' : ''} ${filledFromRegister.has('birth_date') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                value={formData.birth_date}
                onChange={(e) => {
                  setFormData({ ...formData, birth_date: e.target.value });
                  setErrors({ ...errors, birth_date: '' });
                }}
              />
              {errors.birth_date && (
                <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                性别
                <FieldStatusBadge fieldName="gender" />
              </label>
              <select
                className={`input-field ${filledFromRegister.has('gender') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                value={formData.gender || ''}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              >
                <option value="">请选择</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                身高 (cm)
                <FieldStatusBadge fieldName="height" />
              </label>
              <input
                type="number"
                className={`input-field ${errors.height ? 'border-red-500' : ''} ${filledFromRegister.has('height') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="例如: 175"
                value={formData.height}
                onChange={(e) => {
                  setFormData({ ...formData, height: e.target.value });
                  setErrors({ ...errors, height: '' });
                }}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1">{errors.height}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                体重 (kg)
                <FieldStatusBadge fieldName="weight" />
              </label>
              <input
                type="number"
                className={`input-field ${errors.weight ? 'border-red-500' : ''} ${filledFromRegister.has('weight') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="例如: 65"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value });
                  setErrors({ ...errors, weight: '' });
                }}
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                场上位置
                <FieldStatusBadge fieldName="position" />
              </label>
              <select
                className={`input-field ${filledFromRegister.has('position') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                <option value="">请选择位置</option>
                <option value="门将">门将</option>
                <option value="后卫">后卫</option>
                <option value="中后卫">中后卫</option>
                <option value="左后卫">左后卫</option>
                <option value="右后卫">右后卫</option>
                <option value="边后卫">边后卫</option>
                <option value="中场">中场</option>
                <option value="后腰">后腰</option>
                <option value="前腰">前腰</option>
                <option value="中前卫">中前卫</option>
                <option value="左前卫">左前卫</option>
                <option value="右前卫">右前卫</option>
                <option value="前锋">前锋</option>
                <option value="中锋">中锋</option>
                <option value="左边锋">左边锋</option>
                <option value="右边锋">右边锋</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                惯用脚
                <FieldStatusBadge fieldName="foot" />
              </label>
              <select
                className={`input-field ${filledFromRegister.has('foot') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                value={formData.foot || ''}
                onChange={(e) => setFormData({ ...formData, foot: e.target.value as Foot })}
              >
                <option value="">请选择</option>
                <option value="left">左脚</option>
                <option value="right">右脚</option>
                <option value="both">双脚</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                所在俱乐部
                <FieldStatusBadge fieldName="club" />
              </label>
              <input
                type="text"
                className={`input-field ${filledFromRegister.has('club') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="请输入俱乐部名称"
                value={formData.club}
                onChange={(e) => setFormData({ ...formData, club: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center">
                所在学校
                <FieldStatusBadge fieldName="school" />
              </label>
              <input
                type="text"
                className={`input-field ${filledFromRegister.has('school') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="请输入学校名称"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
            </div>
            <div className="form-group md:col-span-2">
              <label className="form-label flex items-center">
                个人简介
                <FieldStatusBadge fieldName="bio" />
              </label>
              <textarea
                className={`input-field min-h-[100px] ${filledFromRegister.has('bio') ? 'border-blue-300 bg-blue-50/30' : ''}`}
                placeholder="介绍一下自己吧..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-7 overflow-hidden">
        <div className="px-7 py-5 bg-gradient-to-r from-blue-50 to-transparent border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <span className="text-xl">📱</span> 联系方式
          </h2>
        </div>
        <div className="p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">微信号</label>
              <input
                type="text"
                className="input-field"
                placeholder="请输入微信号"
                value={formData.contactWechat}
                onChange={(e) => setFormData({ ...formData, contactWechat: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">手机号码</label>
              <input
                type="tel"
                className={`input-field ${errors.contactPhone ? 'border-red-500' : ''}`}
                placeholder="请输入手机号码"
                value={formData.contactPhone}
                onChange={(e) => {
                  setFormData({ ...formData, contactPhone: e.target.value });
                  setErrors({ ...errors, contactPhone: '' });
                }}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
