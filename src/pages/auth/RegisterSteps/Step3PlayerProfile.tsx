import React, { useState, useEffect } from 'react';
import { User, Calendar, MapPin, Trophy, ArrowLeft, ArrowRight, CheckCircle2, Upload } from 'lucide-react';
import type { UserRole } from '../../../types/auth';

interface Step3PlayerProfileProps {
  onSubmit: (data: PlayerProfileData) => void;
  onBack: () => void;
}

export interface PlayerProfileData {
  nickname: string;
  realName: string;
  birthDate: string;
  gender: 'male' | 'female';
  province: string;
  city: string;
  position: string;
  dominantFoot: 'left' | 'right' | 'both';
  avatar?: string;
}

const positions = [
  { value: 'GK', label: '门将 (GK)' },
  { value: 'CB', label: '中后卫 (CB)' },
  { value: 'LB', label: '左后卫 (LB)' },
  { value: 'RB', label: '右后卫 (RB)' },
  { value: 'DM', label: '防守型中场 (DM)' },
  { value: 'CM', label: '中场 (CM)' },
  { value: 'AM', label: '进攻型中场 (AM)' },
  { value: 'LW', label: '左边锋 (LW)' },
  { value: 'RW', label: '右边锋 (RW)' },
  { value: 'ST', label: '前锋 (ST)' },
];

const provinces = [
  '北京市', '上海市', '天津市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区'
];

const Step3PlayerProfile: React.FC<Step3PlayerProfileProps> = ({ onSubmit, onBack }) => {
  const [formData, setFormData] = useState<PlayerProfileData>({
    nickname: '',
    realName: '',
    birthDate: '',
    gender: 'male',
    province: '',
    city: '',
    position: '',
    dominantFoot: 'right',
  });
  const [error, setError] = useState('');

  const handleChange = (field: keyof PlayerProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'province') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  };

  const handleSubmit = () => {
    if (!formData.nickname || !formData.realName || !formData.birthDate || !formData.province || !formData.city || !formData.position) {
      setError('请填写所有必填项');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">完善球员资料</h2>
        <p className="text-blue-200/60">填写基本信息，开始您的足球之旅</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm">!</div>
          {error}
        </div>
      )}

      {/* 头像上传 */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-blue-400/50 transition-colors">
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* 昵称 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          昵称 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            placeholder="设置您的昵称"
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 真实姓名 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          真实姓名 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="text"
            value={formData.realName}
            onChange={(e) => handleChange('realName', e.target.value)}
            placeholder="请输入真实姓名"
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 出生日期 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          出生日期 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 性别 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">性别</label>
        <div className="flex gap-4">
          {[
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={formData.gender === option.value}
                onChange={(e) => handleChange('gender', e.target.value as 'male' | 'female')}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-white/80 group-hover:text-white transition-colors">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 地区 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-blue-200/80 font-medium mb-2 text-sm">
            省份 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <select
              value={formData.province}
              onChange={(e) => handleChange('province', e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all appearance-none"
            >
              <option value="" className="bg-[#1e293b]">请选择省份</option>
              {provinces.map((p) => (
                <option key={p} value={p} className="bg-[#1e293b]">{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-blue-200/80 font-medium mb-2 text-sm">
            城市 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="请输入城市"
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 位置 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          场上位置 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <select
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all appearance-none"
          >
            <option value="" className="bg-[#1e293b]">请选择位置</option>
            {positions.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#1e293b]">{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 惯用脚 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">惯用脚</label>
        <div className="flex gap-4">
          {[
            { value: 'left', label: '左脚' },
            { value: 'right', label: '右脚' },
            { value: 'both', label: '双脚' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="dominantFoot"
                value={option.value}
                checked={formData.dominantFoot === option.value}
                onChange={(e) => handleChange('dominantFoot', e.target.value as 'left' | 'right' | 'both')}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-white/80 group-hover:text-white transition-colors">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          完成注册
        </button>
      </div>
    </div>
  );
};

export default Step3PlayerProfile;
