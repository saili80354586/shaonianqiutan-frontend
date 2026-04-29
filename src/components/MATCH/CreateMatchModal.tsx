import React, { useState, useEffect } from 'react';
import {
  X, Calendar, MapPin, Trophy, Users, Check,
  Loader2, ChevronDown, AlertCircle, Image as ImageIcon, UserPlus,
  Video, Trash2, Plus
} from 'lucide-react';
import { matchApi, type MatchFormat, type MatchLocation, type MatchVideoItem } from '@/services/matchApi';
import { coachApi } from '@/services/club';

// ============================================================
// 类型定义
// ============================================================

interface TeamOption {
  id: number;
  name: string;
  ageGroup?: string;
}

interface PlayerOption {
  id: number;
  name: string;
  number: number;
  position?: string;
}

// ============================================================
// Props
// ============================================================

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // 创建成功后回调（刷新列表）
}

// ============================================================
// 常量
// ============================================================

const MATCH_FORMATS: { value: MatchFormat; label: string; description: string }[] = [
  { value: '5人制', label: '5 人制', description: '室内/小场地' },
  { value: '8人制', label: '8 人制', description: '中型场地' },
  { value: '11人制', label: '11 人制', description: '标准足球场' },
];

const LOCATIONS: { value: MatchLocation; label: string; icon: string }[] = [
  { value: 'home', label: '主场比赛', icon: '\u2302' },
  { value: 'away', label: '客场比赛', icon: '\u2708' },
  { value: 'neutral', label: '中立场地', icon: '\u2690' },
];

const VIDEO_PLATFORMS: { value: MatchVideoItem['platform']; label: string }[] = [
  { value: 'baidu', label: '百度云盘' },
  { value: 'tencent', label: '腾讯微云' },
  { value: 'bilibili', label: 'Bilibili' },
  { value: 'other', label: '其他' },
];

// ============================================================
// 主组件
// ============================================================

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // ---- 状态 ----
  const [step, setStep] = useState<1 | 2>(1); // Step 1: 基本信息, Step 2: 选择球员

  // 表单数据
  const [formData, setFormData] = useState({
    teamId: 0,
    matchName: '',
    matchDate: '',
    opponent: '',
    location: 'home' as MatchLocation,
    matchFormat: '11人制' as MatchFormat,
    coverImage: '',
  });

  // 球队和球员
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  // 关联视频
  const [videos, setVideos] = useState<Array<{
    id: string;
    platform: MatchVideoItem['platform'];
    name: string;
    url: string;
    code: string;
    note: string;
  }>>([]);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---- 加载球队列表 ----
  useEffect(() => {
    if (isOpen && teams.length === 0) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    setLoadingTeams(true);
    try {
      const response = await coachApi.getMyTeams();
      if (response.data.success) {
        const data = (response.data.data as any[]) || [];
        setTeams(data.map((t: any) => ({
          id: t.id || t.teamId,
          name: t.name || t.teamName,
          ageGroup: t.ageGroup,
        })));
      }
    } catch (err) {
      console.error('加载球队列表失败:', err);
      setError('加载球队列表失败，请刷新重试');
    } finally {
      setLoadingTeams(false);
    }
  };

  // ---- 选择球队时加载球员 ----
  const handleTeamChange = async (teamId: number) => {
    setFormData({ ...formData, teamId });
    setSelectedPlayerIds([]);
    setPlayers([]);

    if (!teamId) return;

    setLoadingPlayers(true);
    try {
      const response = await coachApi.getTeamPlayers(teamId);
      if (response.data.success) {
        const data = (response.data.data as any[]) || [];
        setPlayers(data.map((p: any) => ({
          id: p.id,
          name: p.name || p.playerName,
          number: p.number || 0,
          position: p.position,
        })));
      }
    } catch (err) {
      console.error('加载球员列表失败:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  // ---- 视频管理 ----
  const addVideoField = () => {
    setVideos(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      platform: 'baidu',
      name: '',
      url: '',
      code: '',
      note: '',
    }]);
  };

  const updateVideoField = (id: string, field: keyof typeof videos[0], value: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVideoField = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  // ---- 球员选择 ----
  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllPlayers = () => {
    setSelectedPlayerIds(players.map(p => p.id));
  };

  const deselectAllPlayers = () => {
    setSelectedPlayerIds([]);
  };

  // ---- 表单验证 ----
  const validateForm = (): boolean => {
    if (!formData.teamId) {
      setError('请选择球队');
      return false;
    }
    if (!formData.matchName.trim()) {
      setError('请输入比赛名称');
      return false;
    }
    if (!formData.matchDate) {
      setError('请选择比赛日期');
      return false;
    }
    if (!formData.opponent.trim()) {
      setError('请输入对手名称');
      return false;
    }

    if (step === 2 && selectedPlayerIds.length === 0) {
      setError('至少选择一名参赛球员');
      return false;
    }

    setError('');
    return true;
  };

  // ---- 提交 ----
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // 如果在第一步，进入第二步
    if (step === 1) {
      setStep(2);
      return;
    }

    // 第二步：提交表单
    setSubmitting(true);
    setError('');

    try {
      const createRes = await matchApi.createMatch({
        teamId: formData.teamId,
        matchName: formData.matchName.trim(),
        matchDate: formData.matchDate,
        opponent: formData.opponent.trim(),
        location: formData.location,
        matchFormat: formData.matchFormat,
        playerIds: selectedPlayerIds,
        coverImage: formData.coverImage || undefined,
      });

      const matchId = createRes.data.data.id;

      // 批量添加关联视频
      const validVideos = videos.filter(v => v.name.trim() && v.url.trim());
      if (validVideos.length > 0 && matchId) {
        await Promise.all(
          validVideos.map((v, idx) =>
            matchApi.addVideo(matchId, {
              platform: v.platform,
              name: v.name.trim(),
              url: v.url.trim(),
              code: v.code.trim() || undefined,
              note: v.note.trim() || undefined,
            })
          )
        );
      }

      onSuccess(); // 触发父组件刷新
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '创建失败，请稍后重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- 关闭 & 重置 ----
  const handleClose = () => {
    setTimeout(() => {
      setStep(1);
      setFormData({
        teamId: 0,
        matchName: '',
        matchDate: '',
        opponent: '',
        location: 'home',
        matchFormat: '11人制',
        coverImage: '',
      });
      setSelectedPlayerIds([]);
      setPlayers([]);
      setVideos([]);
      setError('');
    }, 200);
    onClose();
  };

  // ---- 渲染 ----
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗主体 */}
      <div className="relative bg-[#12171f] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-[#12171f]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">创建新比赛</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                步骤 {step}/2 — {step === 1 ? '填写基本信息' : '选择参赛球员'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1f2e] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 进度条 */}
          <div className="flex gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-[#39ff14]' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* 内容区 */}
        <div className="px-6 py-5">
          {/* ====== Step 1: 基本信息 ====== */}
          {step === 1 && (
            <div className="space-y-5">
              {/* 球队选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  选择球队 <span className="text-[#39ff14]">*</span>
                </label>
                {loadingTeams ? (
                  <div className="flex items-center gap-2 py-3 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    加载球队...
                  </div>
                ) : teams.length === 0 ? (
                  <p className="text-yellow-400 text-sm py-2">暂无可用球队</p>
                ) : (
                  <select
                    value={formData.teamId}
                    onChange={(e) => handleTeamChange(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-[#39ff14] focus:outline-none transition-colors appearance-none"
                  >
                    <option value={0}>请选择球队</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.ageGroup ? `(${t.ageGroup})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 比赛名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  比赛名称 <span className="text-[#39ff14]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.matchName}
                  onChange={(e) => setFormData({ ...formData, matchName: e.target.value })}
                  placeholder="例如：U12联赛第3轮 vs 青岛黄海"
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                />
              </div>

              {/* 比赛日期 + 对手（同一行） */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    比赛日期 <span className="text-[#39ff14]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.matchDate}
                    onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-[#39ff14] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    对手球队 <span className="text-[#39ff14]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    placeholder="对手名称"
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 场地位置 + 赛制（同一行） */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin size={14} className="inline mr-1" /> 场地位置
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-[#39ff14] focus:outline-none transition-colors appearance-none"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc.value} value={loc.value}>{loc.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Trophy size={14} className="inline mr-1" /> 比赛赛制
                  </label>
                  <select
                    value={formData.matchFormat}
                    onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value as any })}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:border-[#39ff14] focus:outline-none transition-colors appearance-none"
                  >
                    {MATCH_FORMATS.map(fmt => (
                      <option key={fmt.value} value={fmt.value}>{fmt.label} - {fmt.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 封面图 URL（可选） */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon size={14} className="inline mr-1" /> 封面图链接
                  <span className="text-gray-500 font-normal ml-2">(可选)</span>
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="输入封面图 URL 或留空使用默认图"
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                />
              </div>

              {/* 关联视频 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-300">
                    <Video size={14} className="inline mr-1" /> 关联视频
                    <span className="text-gray-500 font-normal ml-2">(可选)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addVideoField}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#39ff14] hover:bg-[#39ff14]/10 rounded-md transition-colors"
                  >
                    <Plus size={14} /> 添加视频
                  </button>
                </div>

                <div className="space-y-3">
                  {videos.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-gray-700 rounded-lg text-gray-500 text-sm">
                      暂无关联视频，点击上方按钮添加
                    </div>
                  )}

                  {videos.map((v) => (
                    <div
                      key={v.id}
                      className="relative bg-[#1a1f2e] border border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => removeVideoField(v.id)}
                        className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="grid grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">视频平台</label>
                          <select
                            value={v.platform}
                            onChange={(e) => updateVideoField(v.id, 'platform', e.target.value)}
                            className="w-full px-3 py-2 bg-[#12171f] border border-gray-700 rounded-md text-sm text-white focus:border-[#39ff14] focus:outline-none transition-colors appearance-none"
                          >
                            {VIDEO_PLATFORMS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">视频名称</label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVideoField(v.id, 'name', e.target.value)}
                            placeholder="例如：全场录像"
                            className="w-full px-3 py-2 bg-[#12171f] border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">视频链接</label>
                        <input
                          type="url"
                          value={v.url}
                          onChange={(e) => updateVideoField(v.id, 'url', e.target.value)}
                          placeholder="输入视频分享链接"
                          className="w-full px-3 py-2 bg-[#12171f] border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {v.platform === 'baidu' && (
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">提取码</label>
                            <input
                              type="text"
                              value={v.code}
                              onChange={(e) => updateVideoField(v.id, 'code', e.target.value)}
                              placeholder="如：a1b2"
                              maxLength={10}
                              className="w-full px-3 py-2 bg-[#12171f] border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                        <div className={v.platform === 'baidu' ? '' : 'col-span-2'}>
                          <label className="block text-xs text-gray-400 mb-1">备注</label>
                          <input
                            type="text"
                            value={v.note}
                            onChange={(e) => updateVideoField(v.id, 'note', e.target.value)}
                            placeholder="可选备注"
                            className="w-full px-3 py-2 bg-[#12171f] border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== Step 2: 选择参赛球员 ====== */}
          {step === 2 && (
            <div className="space-y-5">
              {/* 已选球队信息 */}
              <div className="bg-[#1a1f2e] rounded-lg p-4 flex items-center gap-3">
                <Trophy size={20} className="text-[#39ff14]" />
                <div>
                  <p className="text-white font-medium">{teams.find(t => t.id === formData.teamId)?.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {formData.matchName} · {formData.matchDate}
                  </p>
                </div>
              </div>

              {/* 批量操作 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-300">
                    参赛球员
                    <span className="ml-2 px-2 py-0.5 bg-[#39ff14]/20 text-[#39ff14] text-xs font-medium rounded-full">
                      已选 {selectedPlayerIds.length}/{players.length}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPlayers}
                    disabled={selectedPlayerIds.length === players.length}
                    className="px-3 py-1.5 text-xs text-gray-300 hover:text-[#39ff14] hover:bg-[#1a2332] rounded-md transition-colors disabled:opacity-30"
                  >
                    全选
                  </button>
                  <button
                    onClick={deselectAllPlayers}
                    disabled={selectedPlayerIds.length === 0}
                    className="px-3 py-1.5 text-xs text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 球员列表 */}
              {loadingPlayers ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 size={24} className="animate-spin mr-2" />
                  加载球员名单...
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto text-gray-600 mb-3" size={32} />
                  <p className="text-gray-500">该球队暂无球员</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {players.map(player => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#39ff14]/40 bg-[#39ff14]/8'
                            : 'border-gray-800 bg-[#1a1f2e] hover:bg-[#1a1f2e]/70 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* 选中标记 */}
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#39ff14] bg-[#39ff14]'
                              : 'border-gray-600'
                          }`}>
                            {isSelected && <Check size={12} className="text-black" />}
                          </div>
                          {/* 号码 */}
                          <span className={`font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-[#39ff14]/15 text-[#39ff14]' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {player.number || '-'}
                          </span>
                          {/* 姓名 + 位置 */}
                          <div className="text-left">
                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {player.name}
                            </p>
                            {player.position && (
                              <p className="text-xs text-gray-500">{player.position}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 选中的球员预览 */}
              {selectedPlayerIds.length > 0 && (
                <div className="bg-[#1a2332] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">已选球员:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlayerIds.map(pid => {
                      const p = players.find(pl => pl.id === pid);
                      return p ? (
                        <span key={pid} className="inline-flex items-center gap-1 px-2 py-1 bg-[#39ff14]/10 text-[#39ff14] text-xs rounded-full">
                          #{p.number} {p.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====== 底部按钮 ====== */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-800">
            <div className="flex gap-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-gray-300 hover:text-white border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                >
                  上一步
                </button>
              )}
              <button
                onClick={handleClose}
                className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#39ff14] text-black font-semibold rounded-lg hover:bg-[#22c55e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  创建中...
                </>
              ) : step === 1 ? (
                <>下一步：选择球员 <ChevronDown size={18} /></>
              ) : (
                <>
                  <Check size={18} />
                  创建比赛
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMatchModal;
