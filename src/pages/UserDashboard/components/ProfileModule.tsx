import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Link as LinkIcon, Calendar, Ruler, Weight, Footprints, MapPin, Building2, Save, X, Check, Loader2 } from 'lucide-react';
import { userApi } from '../../../services/api';

type Gender = 'male' | 'female';
type Foot = 'left' | 'right' | 'both';

interface PlayerInfo {
  name: string;
  gender: Gender;
  birthDate: string;
  age: number;
  startYear: string;
  height: number;
  weight: number;
  bmi: number;
  foot: Foot;
  position: string;
  secondPosition?: string;
  country: string;
  province: string;
  city: string;
  club?: string;
  jerseyNumber?: string;
  jerseyColor?: string;
  faRegistered: boolean;
  association?: string;
}

const defaultPlayerInfo: PlayerInfo = {
  name: '', gender: 'male', birthDate: '', age: 0, startYear: '',
  height: 0, weight: 0, bmi: 0, foot: 'right', position: '', secondPosition: '',
  country: '中国', province: '', city: '', club: '', jerseyNumber: '',
  jerseyColor: '', faRegistered: false, association: '',
};

const POSITIONS = ['前锋', '边锋', '前腰', '后腰', '中前卫', '中后卫', '边后卫', '门将'];
const PROVINCES = ['北京', '上海', '广东', '江苏', '山东', '浙江', '四川', '辽宁', '河南', '河北', '湖北', '湖南', '福建', '安徽', '陕西', '重庆', '天津'];

const mapApiUserToPlayerInfo = (user: any): PlayerInfo => ({
  name: user.name || '',
  gender: (user.gender === 'female' ? 'female' : 'male') as Gender,
  birthDate: user.birth_date || '',
  age: user.age || 0,
  startYear: user.start_year ? String(user.start_year) : '',
  height: user.height || 0,
  weight: user.weight || 0,
  bmi: user.weight && user.height ? parseFloat((user.weight / ((user.height / 100) ** 2)).toFixed(1)) : 0,
  foot: (user.foot === 'left' ? 'left' : user.foot === 'both' ? 'both' : 'right') as Foot,
  position: user.position || '',
  secondPosition: user.second_position || '',
  country: user.country || '中国',
  province: user.province || '',
  city: user.city || '',
  club: user.club || '',
  jerseyNumber: user.jersey_number ? String(user.jersey_number) : '',
  jerseyColor: user.jersey_color || '',
  faRegistered: user.fa_registered || false,
  association: user.association || '',
});

const mapPlayerInfoToApiRequest = (info: PlayerInfo): any => ({
  name: info.name, gender: info.gender, birth_date: info.birthDate,
  height: info.height, weight: info.weight, foot: info.foot,
  position: info.position, second_position: info.secondPosition,
  country: info.country, province: info.province, city: info.city,
  club: info.club, jersey_number: info.jerseyNumber ? parseInt(info.jerseyNumber) : undefined,
  jersey_color: info.jerseyColor, fa_registered: info.faRegistered,
  association: info.association, start_year: info.startYear ? parseInt(info.startYear) : undefined,
});

export const ProfileModule: React.FC = () => {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>(defaultPlayerInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PlayerInfo>(defaultPlayerInfo);
  const [activeTab, setActiveTab] = useState<'basic' | 'physical' | 'club'>('basic');
  const [savedMessage, setSavedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // 尝试从 localStorage 获取用户信息
      const localUser = localStorage.getItem('user');
      if (localUser) {
        try {
          const userData = JSON.parse(localUser);
          const mappedInfo = mapApiUserToPlayerInfo(userData);
          setPlayerInfo(mappedInfo);
          setNickname(userData.nickname || '');
          setLoading(false);
          return;
        } catch (e) {
          console.error('解析本地用户数据失败', e);
        }
      }

      // 如果没有本地数据，尝试 API（后端暂时不可用）
      const response = await userApi.getProfile();
      if (response.data?.success && response.data.data?.user) {
        const mappedInfo = mapApiUserToPlayerInfo(response.data.data.user);
        setPlayerInfo(mappedInfo);
        setNickname(response.data.data.user.nickname || '');
      }
    } catch (err: any) {
      console.error('加载个人资料失败:', err.message);
      setError(err.response?.data?.message || err.message || '加载个人资料失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = (gender: string) => ({ male: '男', female: '女' }[gender] || gender);
  const getFootText = (foot: string) => ({ left: '左脚', right: '右脚', both: '双脚' }[foot] || foot);
  const calculateBMI = (height: number, weight: number) => {
    if (!height || !weight) return '0.0';
    return (weight / ((height / 100) ** 2)).toFixed(1);
  };

  const handleEdit = () => { setEditData({ ...playerInfo }); setIsEditing(true); };
  
  const handleSave = async () => {
    try {
      const bmi = parseFloat(calculateBMI(editData.height, editData.weight));
      const updatedData = { ...editData, bmi };
      const apiData = mapPlayerInfoToApiRequest(updatedData);
      const response = await userApi.updateProfile(apiData);
      
      if (response.data?.success) {
        setPlayerInfo(updatedData);
        setIsEditing(false);
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 2000);
      } else {
        setError(response.data?.error || response.data?.message || '保存失败');
      }
    } catch (err: any) {
      setError(err.message || '保存失败');
    }
  };

  const handleCancel = () => { setEditData(playerInfo); setIsEditing(false); setError(null); };
  const handleChange = (field: keyof PlayerInfo, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">编辑个人资料</h2>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">完善您的球员档案，帮助球探更好地了解您</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={handleCancel} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
              <X className="w-4 h-4" /> <span className="sm:inline">取消</span>
            </button>
            <button onClick={handleSave} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
              <Save className="w-4 h-4" /> <span className="sm:inline">保存</span>
            </button>
          </div>
        </div>

        {savedMessage && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" /> 资料保存成功！
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-2 text-red-400">
            <X className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="flex gap-1 bg-[#1a1f2e] p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {[{ id: 'basic', label: '基本信息', icon: User }, { id: 'physical', label: '身体数据', icon: Ruler }, { id: 'club', label: '俱乐部信息', icon: Building2 }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-2 rounded-md flex items-center gap-1.5 sm:gap-2 transition-all text-sm sm:text-base min-h-[44px] touch-manipulation ${activeTab === tab.id ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'text-gray-400 hover:text-white'}`}>
              <tab.icon className="w-4 h-4" /> <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">基本信息</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">姓名 *</label>
                  <input type="text" value={editData.name} onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="请输入姓名" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">性别 *</label>
                    <select value={editData.gender} onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]">
                      <option value="male">男</option>
                      <option value="female">女</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">出生日期</label>
                    <input type="date" value={editData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">开始踢球年份</label>
                  <input type="number" value={editData.startYear} onChange={(e) => handleChange('startYear', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：2018" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">位置信息</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">惯用脚 *</label>
                  <div className="flex gap-2 sm:gap-3">
                    {['left', 'right', 'both'].map(foot => (
                      <button key={foot} onClick={() => handleChange('foot', foot)}
                        className={`flex-1 py-2.5 sm:py-2 rounded-lg border transition-all text-sm sm:text-base min-h-[44px] touch-manipulation ${editData.foot === foot ? 'border-[#39ff14] bg-[#39ff14]/20 text-[#39ff14]' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                        {getFootText(foot)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">场上位置 *</label>
                  <select value={editData.position} onChange={(e) => handleChange('position', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]">
                    <option value="">请选择位置</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">第二位置（选填）</label>
                  <select value={editData.secondPosition || ''} onChange={(e) => handleChange('secondPosition', e.target.value || undefined)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]">
                    <option value="">请选择</option>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'physical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">身体数据</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">身高 (cm) *</label>
                    <input type="number" value={editData.height || ''} onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">体重 (kg) *</label>
                    <input type="number" value={editData.weight || ''} onChange={(e) => handleChange('weight', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" />
                  </div>
                </div>
                <div className="bg-[#0a0e17] rounded-lg p-3 sm:p-4 border border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm sm:text-base">BMI 指数</span>
                    <span className="text-xl sm:text-2xl font-bold text-[#39ff14]">{calculateBMI(editData.height, editData.weight)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">根据身高体重自动计算，用于评估身体状况</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">BMI 参考</h3>
              <div className="space-y-2 sm:space-y-3">
                {[{ range: '< 18.5', label: '偏瘦', color: 'text-yellow-400' }, { range: '18.5 - 23.9', label: '正常', color: 'text-green-400' }, { range: '24 - 27.9', label: '偏胖', color: 'text-orange-400' }, { range: '≥ 28', label: '肥胖', color: 'text-red-400' }].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm sm:text-base">{item.range}</span>
                    <span className={`${item.color} text-sm sm:text-base font-medium`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'club' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">所属地区</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">国家/地区 *</label>
                  <input type="text" value={editData.country} onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">省份 *</label>
                  <select value={editData.province} onChange={(e) => handleChange('province', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]">
                    <option value="">请选择省份</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">城市 *</label>
                  <input type="text" value={editData.city} onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：北京" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">俱乐部信息</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">所属俱乐部</label>
                  <input type="text" value={editData.club || ''} onChange={(e) => handleChange('club', e.target.value || undefined)}
                    className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：北京国安青训" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">球衣号码</label>
                    <input type="text" value={editData.jerseyNumber || ''} onChange={(e) => handleChange('jerseyNumber', e.target.value || undefined)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：10" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">球衣颜色</label>
                    <input type="text" value={editData.jerseyColor || ''} onChange={(e) => handleChange('jerseyColor', e.target.value || undefined)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：绿色" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer py-2 touch-manipulation">
                    <input type="checkbox" checked={editData.faRegistered} onChange={(e) => handleChange('faRegistered', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-[#0a0e17] text-[#39ff14] focus:ring-[#39ff14] min-w-[20px]" />
                    <span className="text-gray-300 text-sm sm:text-base">已在中国足协注册</span>
                  </label>
                </div>
                {editData.faRegistered && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5 sm:mb-2">注册协会</label>
                    <input type="text" value={editData.association || ''} onChange={(e) => handleChange('association', e.target.value || undefined)}
                      className="w-full bg-[#0a0e17] border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 text-white focus:border-[#39ff14] focus:outline-none transition-colors text-base min-h-[44px]" placeholder="如：北京市足球协会" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* 头像 */}
          <div className="relative flex-shrink-0 self-center sm:self-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <div className="absolute bottom-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-[#1a1f2e]"></div>
          </div>
          
          {/* 信息区域 */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{playerInfo.name || nickname || '未设置姓名'}</h2>
            <p className="text-gray-500 mb-3 text-sm sm:text-base">@{playerInfo.club || '未设置俱乐部'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {playerInfo.position && (
                <span className="px-2.5 sm:px-3 py-1 bg-gray-700/50 rounded-full text-xs sm:text-sm text-gray-300 flex items-center gap-1">
                  <Footprints className="w-3 h-3" /> {playerInfo.position}
                </span>
              )}
              {playerInfo.club && (
                <span className="px-2.5 sm:px-3 py-1 bg-orange-500/20 rounded-full text-xs sm:text-sm text-orange-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {playerInfo.club}
                </span>
              )}
              {playerInfo.city && (
                <span className="px-2.5 sm:px-3 py-1 bg-blue-500/20 rounded-full text-xs sm:text-sm text-blue-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {playerInfo.city}
                </span>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex sm:flex-col gap-2 sm:gap-2 mt-2 sm:mt-0">
            <button onClick={handleEdit} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
              <Edit2 className="w-4 h-4" /> <span className="sm:hidden">编辑</span><span className="hidden sm:inline">编辑资料</span>
            </button>
            <button
              onClick={() => navigate('/player/profile')}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
            >
              <LinkIcon className="w-4 h-4" /> <span className="sm:hidden">主页</span><span className="hidden sm:inline">查看个人主页</span>
            </button>
          </div>
        </div>
      </div>

      {/* 信息卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 个人信息 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#39ff14]" /> 个人信息
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[{ label: '姓名', value: playerInfo.name || '未设置' }, { label: '性别', value: getGenderText(playerInfo.gender) }, { label: '出生日期', value: playerInfo.birthDate || '未设置' }, { label: '年龄', value: playerInfo.age ? `${playerInfo.age} 岁` : '未设置' }, { label: '开始踢球年份', value: playerInfo.startYear ? `${playerInfo.startYear} 年` : '未设置' }].map((item, idx, arr) => (
              <div key={item.label} className={`flex justify-between py-2 sm:py-2.5 ${idx < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <span className="text-gray-500 text-sm sm:text-base">{item.label}</span>
                <span className="text-white text-sm sm:text-base font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 身体信息 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Ruler className="w-4 h-4 sm:w-5 sm:h-5 text-[#39ff14]" /> 身体信息
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[{ label: '身高', value: playerInfo.height ? `${playerInfo.height} cm` : '未设置' }, { label: '体重', value: playerInfo.weight ? `${playerInfo.weight} kg` : '未设置' }, { label: 'BMI', value: playerInfo.bmi || '未设置', highlight: true }, { label: '惯用脚', value: getFootText(playerInfo.foot) }, { label: '场上位置', value: `${playerInfo.position || '未设置'} ${playerInfo.secondPosition ? `/ ${playerInfo.secondPosition}` : ''}` }].map((item, idx, arr) => (
              <div key={item.label} className={`flex justify-between py-2 sm:py-2.5 ${idx < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <span className="text-gray-500 text-sm sm:text-base">{item.label}</span>
                <span className={`text-sm sm:text-base font-medium ${item.highlight ? 'text-[#39ff14]' : 'text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 地区信息 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#39ff14]" /> 地区信息
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[{ label: '国家/地区', value: playerInfo.country || '未设置' }, { label: '省份', value: playerInfo.province || '未设置' }, { label: '城市', value: playerInfo.city || '未设置' }].map((item, idx, arr) => (
              <div key={item.label} className={`flex justify-between py-2 sm:py-2.5 ${idx < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <span className="text-gray-500 text-sm sm:text-base">{item.label}</span>
                <span className="text-white text-sm sm:text-base font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 俱乐部信息 */}
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#39ff14]" /> 俱乐部信息
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[{ label: '所属俱乐部', value: playerInfo.club || '未设置' }, { label: '球衣号码', value: playerInfo.jerseyNumber || '未设置' }, { label: '球衣颜色', value: playerInfo.jerseyColor || '未设置' }, { label: '足协注册', value: playerInfo.faRegistered ? '已注册' : '未注册', color: playerInfo.faRegistered ? 'text-green-400' : 'text-gray-500' }].map((item, idx, arr) => (
              <div key={item.label} className={`flex justify-between py-2 sm:py-2.5 ${idx < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <span className="text-gray-500 text-sm sm:text-base">{item.label}</span>
                <span className={`text-sm sm:text-base font-medium ${item.color || 'text-white'}`}>{item.value}</span>
              </div>
            ))}
            {playerInfo.faRegistered && playerInfo.association && (
              <div className="flex justify-between py-2 sm:py-2.5 border-t border-gray-800">
                <span className="text-gray-500 text-sm sm:text-base">注册协会</span>
                <span className="text-white text-sm sm:text-base font-medium">{playerInfo.association}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* 移动端触摸优化样式 */
const touchStyles = `
  .touch-manipulation {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* 隐藏滚动条但保留滚动功能 */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* 移动端输入框优化 */
  @media (max-width: 640px) {
    input, select, textarea {
      font-size: 16px; /* 防止iOS缩放 */
    }
  }
`;

// 将样式注入到文档中
if (typeof document !== 'undefined') {
  const styleId = 'profile-mobile-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = touchStyles;
    document.head.appendChild(style);
  }
}

export default ProfileModule;
