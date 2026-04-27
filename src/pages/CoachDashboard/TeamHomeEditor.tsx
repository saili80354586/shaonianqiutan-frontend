import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Eye, Plus, Trash2, Loader2,
  Trophy, Users, Settings, FileText, Image, Check, X, Calendar
} from 'lucide-react';
import { coachApi } from '../../services/club';

interface TeamHomeEditorProps {
  teamId: number;
  teamName: string;
  onBack: () => void;
}

interface TeamHomeHero {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  logo?: string;
  ageGroup?: string;
  foundedYear?: string;
  showStats?: boolean;
}

interface TeamHomeAbout {
  enabled?: boolean;
  title?: string;
  content?: string;
  images?: string[];
}

interface TeamHonor {
  id?: number;
  title: string;
  description?: string;
  icon?: string;
  year?: string;
  count?: string;
  sort?: number;
}

interface TeamDynamic {
  id?: number;
  title: string;
  content: string;
  type: string;
  images?: string[];
  createdAt?: string;
}

interface TeamHomeContact {
  enabled?: boolean;
  phone?: string;
  wechat?: string;
  address?: string;
}

interface CoachTeamHomeResponse {
  teamId: number;
  teamName: string;
  ageGroup: string;
  hero: TeamHomeHero;
  about: TeamHomeAbout;
  honors: TeamHonor[];
  dynamics?: TeamDynamic[];
  contact: TeamHomeContact;
  playerCount: number;
  coachCount: number;
}

const dynamicTypeOptions = [
  { value: 'training', label: '训练' },
  { value: 'match', label: '比赛' },
  { value: 'activity', label: '活动' },
  { value: 'announcement', label: '公告' },
];

const TeamHomeEditor: React.FC<TeamHomeEditorProps> = ({ teamId, teamName, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'about' | 'honors' | 'dynamics' | 'contact'>('hero');
  const [homeData, setHomeData] = useState<CoachTeamHomeResponse | null>(null);

  // Hero 编辑状态
  const [hero, setHero] = useState<TeamHomeHero>({
    title: '',
    subtitle: '',
    backgroundImage: '',
    logo: '',
    ageGroup: '',
    foundedYear: '',
    showStats: true,
  });

  // About 编辑状态
  const [about, setAbout] = useState<TeamHomeAbout>({
    enabled: true,
    title: '关于我们',
    content: '',
    images: [],
  });

  // 荣誉列表
  const [honors, setHonors] = useState<TeamHonor[]>([]);

  // 动态列表
  const [dynamics, setDynamics] = useState<TeamDynamic[]>([]);

  // 联系信息
  const [contact, setContact] = useState<TeamHomeContact>({
    enabled: true,
    phone: '',
    wechat: '',
    address: '',
  });

  // 新增动态表单
  const [newDynamic, setNewDynamic] = useState<TeamDynamic>({
    title: '',
    content: '',
    type: 'training',
    images: [],
  });

  // 新增荣誉
  const [newHonor, setNewHonor] = useState<TeamHonor>({
    title: '',
    description: '',
    icon: 'trophy',
    year: '',
    count: '1',
  });

  useEffect(() => {
    loadTeamHome();
  }, [teamId]);

  const loadTeamHome = async () => {
    setLoading(true);
    try {
      const res = await coachApi.getTeamHome(teamId);
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setHomeData(data);
        setHero(data.hero || hero);
        setAbout(data.about || about);
        setHonors(data.honors || []);
        setDynamics(data.dynamics || []);
        setContact(data.contact || contact);
      }
    } catch (error) {
      console.error('加载球队主页失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await coachApi.saveTeamHome(teamId, {
        hero,
        about,
        honors,
        contact,
      });
      if (res.data?.success) {
        alert('保存成功！');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addHonor = async () => {
    if (!newHonor.title) {
      alert('请输入荣誉名称');
      return;
    }
    try {
      const res = await coachApi.addTeamHonor(teamId, newHonor);
      if (res.data?.success && res.data?.data) {
        setHonors([...honors, res.data.data]);
        setNewHonor({ title: '', description: '', icon: 'trophy', year: '', count: '1' });
      }
    } catch (error) {
      console.error('添加荣誉失败:', error);
    }
  };

  const deleteHonor = async (honorId: number) => {
    if (!confirm('确定删除该荣誉？')) return;
    try {
      const res = await coachApi.deleteTeamHonor(teamId, honorId);
      if (res.data?.success) {
        setHonors(honors.filter(h => h.id !== honorId));
      }
    } catch (error) {
      console.error('删除荣誉失败:', error);
    }
  };

  const addDynamic = async () => {
    if (!newDynamic.title || !newDynamic.content) {
      alert('请填写动态标题和内容');
      return;
    }
    try {
      const res = await coachApi.addTeamDynamic(teamId, newDynamic);
      if (res.data?.success && res.data?.data) {
        setDynamics([...dynamics, res.data.data]);
        setNewDynamic({ title: '', content: '', type: 'training', images: [] });
      }
    } catch (error) {
      console.error('添加动态失败:', error);
    }
  };

  const deleteDynamic = async (dynamicId: number) => {
    if (!confirm('确定删除该动态？')) return;
    try {
      const res = await coachApi.deleteTeamDynamic(teamId, dynamicId);
      if (res.data?.success) {
        setDynamics(dynamics.filter(d => d.id !== dynamicId));
      }
    } catch (error) {
      console.error('删除动态失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0f1219] min-h-screen">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">{teamName} - 主页编辑</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 overflow-x-auto">
        {[
          { key: 'hero', label: '基本信息', icon: Settings },
          { key: 'about', label: '简介', icon: FileText },
          { key: 'honors', label: '荣誉墙', icon: Trophy },
          { key: 'dynamics', label: '动态发布', icon: Calendar },
          { key: 'contact', label: '联系方式', icon: Users },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
        {/* Hero 基本信息 */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">球队名称</label>
              <input
                type="text"
                value={hero.title || ''}
                onChange={e => setHero({ ...hero, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入球队名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">副标题</label>
              <input
                type="text"
                value={hero.subtitle || ''}
                onChange={e => setHero({ ...hero, subtitle: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入副标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">年龄组</label>
                <input
                  type="text"
                  value={hero.ageGroup || ''}
                  onChange={e => setHero({ ...hero, ageGroup: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如 U12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">成立年份</label>
                <input
                  type="text"
                  value={hero.foundedYear || ''}
                  onChange={e => setHero({ ...hero, foundedYear: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                  placeholder="如 2020"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">球队 Logo URL</label>
              <input
                type="text"
                value={hero.logo || ''}
                onChange={e => setHero({ ...hero, logo: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入 Logo 图片地址"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">背景图 URL</label>
              <input
                type="text"
                value={hero.backgroundImage || ''}
                onChange={e => setHero({ ...hero, backgroundImage: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入背景图片地址"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showStats"
                checked={hero.showStats || false}
                onChange={e => setHero({ ...hero, showStats: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-[#0f1219] text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="showStats" className="text-gray-400">显示球员/教练统计</label>
            </div>
          </div>
        )}

        {/* About 简介 */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="aboutEnabled"
                checked={about.enabled !== false}
                onChange={e => setAbout({ ...about, enabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-[#0f1219] text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="aboutEnabled" className="text-gray-400">启用简介模块</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">标题</label>
              <input
                type="text"
                value={about.title || ''}
                onChange={e => setAbout({ ...about, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="如 关于我们"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">简介内容</label>
              <textarea
                value={about.content || ''}
                onChange={e => setAbout({ ...about, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none resize-none"
                placeholder="输入球队简介内容..."
              />
            </div>
          </div>
        )}

        {/* Honors 荣誉墙 */}
        {activeTab === 'honors' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">荣誉列表</h3>

            {/* 添加新荣誉 */}
            <div className="bg-[#0f1219] rounded-xl p-4 border border-gray-800">
              <h4 className="text-sm font-medium text-gray-400 mb-4">添加新荣誉</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={newHonor.title}
                  onChange={e => setNewHonor({ ...newHonor, title: e.target.value })}
                  className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="荣誉名称 *"
                />
                <input
                  type="text"
                  value={newHonor.year}
                  onChange={e => setNewHonor({ ...newHonor, year: e.target.value })}
                  className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="获奖年份"
                />
                <input
                  type="text"
                  value={newHonor.description}
                  onChange={e => setNewHonor({ ...newHonor, description: e.target.value })}
                  className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="描述"
                />
                <input
                  type="text"
                  value={newHonor.count}
                  onChange={e => setNewHonor({ ...newHonor, count: e.target.value })}
                  className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="数量"
                />
              </div>
              <button
                onClick={addHonor}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加荣誉
              </button>
            </div>

            {/* 荣誉列表 */}
            {honors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无荣誉，添加第一个荣誉吧！
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {honors.map((honor, index) => (
                  <div key={honor.id || index} className="bg-[#0f1219] rounded-xl p-4 border border-gray-800 relative group">
                    <button
                      onClick={() => deleteHonor(honor.id!)}
                      className="absolute top-2 right-2 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
                    <h4 className="font-medium text-white">{honor.title}</h4>
                    {honor.year && <p className="text-sm text-gray-400">{honor.year}</p>}
                    {honor.description && <p className="text-sm text-gray-500 mt-1">{honor.description}</p>}
                    {honor.count && <p className="text-xs text-gray-600 mt-1">x{honor.count}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamics 动态发布 */}
        {activeTab === 'dynamics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">发布动态</h3>

            {/* 添加新动态 */}
            <div className="bg-[#0f1219] rounded-xl p-4 border border-gray-800">
              <h4 className="text-sm font-medium text-gray-400 mb-4">发布新动态</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">动态类型</label>
                  <select
                    value={newDynamic.type}
                    onChange={e => setNewDynamic({ ...newDynamic, type: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    {dynamicTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">动态标题 *</label>
                  <input
                    type="text"
                    value={newDynamic.title}
                    onChange={e => setNewDynamic({ ...newDynamic, title: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="输入动态标题"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">动态内容 *</label>
                  <textarea
                    value={newDynamic.content}
                    onChange={e => setNewDynamic({ ...newDynamic, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="输入动态内容..."
                  />
                </div>
                <button
                  onClick={addDynamic}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  发布动态
                </button>
              </div>
            </div>

            {/* 动态列表 */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">历史动态</h4>
              {dynamics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无动态，发布第一条动态吧！
                </div>
              ) : (
                <div className="space-y-4">
                  {dynamics.map((dynamic, index) => (
                    <div key={dynamic.id || index} className="bg-[#0f1219] rounded-xl p-4 border border-gray-800 relative group">
                      <button
                        onClick={() => deleteDynamic(dynamic.id!)}
                        className="absolute top-2 right-2 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          dynamic.type === 'match' ? 'bg-amber-500/20 text-amber-400' :
                          dynamic.type === 'training' ? 'bg-blue-500/20 text-blue-400' :
                          dynamic.type === 'activity' ? 'bg-green-500/20 text-green-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {dynamicTypeOptions.find(o => o.value === dynamic.type)?.label || dynamic.type}
                        </span>
                        <span className="text-xs text-gray-500">{dynamic.createdAt || ''}</span>
                      </div>
                      <h4 className="font-medium text-white mb-1">{dynamic.title}</h4>
                      <p className="text-sm text-gray-400">{dynamic.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact 联系方式 */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="contactEnabled"
                checked={contact.enabled !== false}
                onChange={e => setContact({ ...contact, enabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-[#0f1219] text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="contactEnabled" className="text-gray-400">启用联系方式模块</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">联系电话</label>
              <input
                type="text"
                value={contact.phone || ''}
                onChange={e => setContact({ ...contact, phone: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入联系电话"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">微信</label>
              <input
                type="text"
                value={contact.wechat || ''}
                onChange={e => setContact({ ...contact, wechat: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入微信号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">地址</label>
              <input
                type="text"
                value={contact.address || ''}
                onChange={e => setContact({ ...contact, address: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f1219] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                placeholder="输入训练地址"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamHomeEditor;
