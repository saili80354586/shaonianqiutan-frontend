import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Users, MapPin, Shield, Loader2, Check, Search } from 'lucide-react';
import { matchSummaryApi, teamApi } from '../../services/api';

interface CreateMatchSummaryProps {
  teamId: number;
  onBack: () => void;
  onSuccess?: () => void;
}

interface TeamPlayer {
  userId: number;
  name: string;
  avatar?: string;
  jerseyNumber?: number;
  position?: string;
}

const MATCH_FORMATS = [
  { value: '5人制', label: '5人制', desc: '五人制足球' },
  { value: '8人制', label: '8人制', desc: '八人制足球' },
  { value: '11人制', label: '11人制', desc: '十一人制标准' },
];

const LOCATIONS = [
  { value: 'home', label: '主场' },
  { value: 'away', label: '客场' },
  { value: 'neutral', label: '中立场' },
];

const CreateMatchSummary: React.FC<CreateMatchSummaryProps> = ({ teamId, onBack, onSuccess }) => {
  const [step, setStep] = useState<'info' | 'players'>('info');
  const [form, setForm] = useState({
    matchName: '',
    matchDate: new Date().toISOString().split('T')[0],
    opponent: '',
    location: 'home',
    matchFormat: '11人制',
    ourScore: 0,
    oppScore: 0,
    playerIds: [] as number[],
  });
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载球队球员
  useEffect(() => {
    if (step === 'players') {
      loadPlayers();
    }
  }, [step]);

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await teamApi.getTeamPlayers(teamId);
      if (res.data?.success) {
        const list = res.data.data?.list || res.data.data || [];
        setPlayers(list);
        // 默认全选
        setForm(prev => ({
          ...prev,
          playerIds: list.map((p: TeamPlayer) => p.userId),
        }));
      }
    } catch (err) {
      console.error('获取球员列表失败:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.matchName.trim()) newErrors.matchName = '请输入赛事名称';
    if (!form.opponent.trim()) newErrors.opponent = '请输入对手球队';
    if (!form.matchDate) newErrors.matchDate = '请选择比赛日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep('players');
  };

  const handleTogglePlayer = (userId: number) => {
    setForm(prev => ({
      ...prev,
      playerIds: prev.playerIds.includes(userId)
        ? prev.playerIds.filter(id => id !== userId)
        : [...prev.playerIds, userId],
    }));
  };

  const handleSelectAll = () => {
    const filtered = filteredPlayers.map(p => p.userId);
    const allSelected = filtered.every(id => form.playerIds.includes(id));
    if (allSelected) {
      setForm(prev => ({ ...prev, playerIds: prev.playerIds.filter(id => !filtered.includes(id)) }));
    } else {
      setForm(prev => ({ ...prev, playerIds: [...new Set([...prev.playerIds, ...filtered])] }));
    }
  };

  const handleSubmit = async () => {
    if (form.playerIds.length === 0) {
      alert('请至少选择1名参赛球员');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        teamId,
        matchName: form.matchName,
        matchDate: form.matchDate,
        opponent: form.opponent,
        location: form.location,
        matchFormat: form.matchFormat,
        ourScore: form.ourScore,
        oppScore: form.oppScore,
        playerIds: form.playerIds,
      };
      const res = await matchSummaryApi.createSummary(payload);
      if (res.data?.success) {
        onSuccess?.();
        onBack();
      } else {
        alert(res.data?.error || '创建失败');
      }
    } catch (error: any) {
      console.error('创建比赛总结失败:', error);
      alert(error?.response?.data?.error || '创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlayers = players.filter(p =>
    !searchKeyword || p.name?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const getResultBadge = () => {
    if (form.ourScore > form.oppScore) return { text: '胜', color: 'text-emerald-400 bg-emerald-500/10' };
    if (form.ourScore < form.oppScore) return { text: '负', color: 'text-red-400 bg-red-500/10' };
    return { text: '平', color: 'text-amber-400 bg-amber-500/10' };
  };

  const result = getResultBadge();

  return (
    <div className="min-h-screen bg-[#0f1419] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* 顶栏 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={step === 'info' ? onBack : () => setStep('info')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {step === 'info' ? '返回' : '上一步'}
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === 'info' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {step === 'info' ? '1' : <Check className="w-4 h-4" />}
            </div>
            <div className="h-0.5 flex-1 bg-gray-700">
              <div className={`h-full transition-all duration-300 ${step === 'players' ? 'bg-amber-500 w-full' : 'w-0'}`} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === 'players' ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          {/* 标题 */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {step === 'info' ? '创建比赛总结' : '选择参赛球员'}
                </h2>
                <p className="text-sm text-gray-400">
                  {step === 'info' ? '填写比赛基本信息' : `已选 ${form.playerIds.length} 人`}
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: 比赛信息 */}
          {step === 'info' && (
            <div className="p-6 space-y-5">
              {/* 赛事名称 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">赛事名称 <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.matchName}
                  onChange={e => setForm({ ...form, matchName: e.target.value })}
                  placeholder="如：2026年市青少杯小组赛 第3轮"
                  className={`w-full px-4 py-2.5 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    errors.matchName ? 'border-red-500' : 'border-gray-700 focus:border-amber-500'
                  }`}
                />
                {errors.matchName && <p className="text-xs text-red-400 mt-1">{errors.matchName}</p>}
              </div>

              {/* 比赛日期 + 赛制 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">比赛日期 <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={form.matchDate}
                    onChange={e => setForm({ ...form, matchDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">赛制</label>
                  <select
                    value={form.matchFormat}
                    onChange={e => setForm({ ...form, matchFormat: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-amber-500 appearance-none"
                  >
                    {MATCH_FORMATS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 主客场 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  比赛地点
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {LOCATIONS.map(loc => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => setForm({ ...form, location: loc.value })}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        form.location === loc.value
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-[#0f1419] border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 对手球队 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  对手球队 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.opponent}
                  onChange={e => setForm({ ...form, opponent: e.target.value })}
                  placeholder="如：实验小学"
                  className={`w-full px-4 py-2.5 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    errors.opponent ? 'border-red-500' : 'border-gray-700 focus:border-amber-500'
                  }`}
                />
                {errors.opponent && <p className="text-xs text-red-400 mt-1">{errors.opponent}</p>}
              </div>

              {/* 比分 */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">比赛比分（可选，赛后填写）</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-2">我方进球</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, ourScore: Math.max(0, form.ourScore - 1) })}
                        className="w-8 h-8 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >-</button>
                      <span className="text-3xl font-bold text-white w-12 text-center">{form.ourScore}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, ourScore: form.ourScore + 1 })}
                        className="w-8 h-8 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-gray-500">:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.color}`}>
                      {result.text}
                    </span>
                  </div>

                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-2">对方进球</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, oppScore: Math.max(0, form.oppScore - 1) })}
                        className="w-8 h-8 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >-</button>
                      <span className="text-3xl font-bold text-white w-12 text-center">{form.oppScore}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, oppScore: form.oppScore + 1 })}
                        className="w-8 h-8 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all"
              >
                下一步：选择参赛球员
              </button>
            </div>
          )}

          {/* Step 2: 球员选择 */}
          {step === 'players' && (
            <div className="p-6">
              {/* 搜索 + 全选 */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    placeholder="搜索球员..."
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-colors text-sm whitespace-nowrap"
                >
                  {filteredPlayers.every(p => form.playerIds.includes(p.userId)) ? '取消全选' : '全选'}
                </button>
              </div>

              {loadingPlayers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>{players.length === 0 ? '该球队暂无球员' : '没有匹配的球员'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredPlayers.map(player => {
                    const selected = form.playerIds.includes(player.userId);
                    return (
                      <button
                        key={player.userId}
                        type="button"
                        onClick={() => handleTogglePlayer(player.userId)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? 'bg-amber-500/10 border-amber-500/50 text-white'
                            : 'bg-[#0f1419] border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selected ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {selected ? <Check className="w-4 h-4" /> : (player.jerseyNumber || player.name?.[0])}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{player.name}</p>
                          {player.position && (
                            <p className="text-xs text-gray-500">{player.position}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 p-3 bg-[#0f1419] rounded-xl border border-gray-700">
                <p className="text-sm text-gray-400">
                  已选 <span className="text-amber-400 font-bold">{form.playerIds.length}</span> 名球员参与本场比赛自评
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || form.playerIds.length === 0}
                className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> 创建中...</>
                ) : (
                  <><Trophy className="w-4 h-4" /> 创建比赛总结</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMatchSummary;
