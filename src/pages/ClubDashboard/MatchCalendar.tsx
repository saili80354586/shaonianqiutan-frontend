import React, { useEffect, useMemo, useState } from 'react';
import { clubApi, teamApi, matchSummaryApi } from '../../services/api';
import {
  ChevronLeft, Plus, Calendar, MapPin, Trophy,
  X, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, FileText
} from 'lucide-react';

interface MatchCalendarProps {
  onBack: () => void;
}

interface MatchSchedule {
  id: number;
  teamId: number;
  name: string;
  matchType: string;
  opponent: string;
  matchTime: string;
  location: string;
  homeScore?: number;
  awayScore?: number;
  remark: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  matchSummaryId?: number;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
}

const typeMap: Record<string, string> = {
  league: '联赛',
  cup: '杯赛',
  friendly: '友谊赛',
  training_match: '训练赛',
};

const statusMap: Record<string, { label: string; class: string }> = {
  upcoming: { label: '未开始', class: 'bg-blue-500/20 text-blue-300' },
  ongoing: { label: '进行中', class: 'bg-amber-500/20 text-amber-300' },
  completed: { label: '已结束', class: 'bg-emerald-500/20 text-emerald-300' },
  cancelled: { label: '已取消', class: 'bg-red-500/20 text-red-300' },
};

const MatchCalendar: React.FC<MatchCalendarProps> = ({ onBack }) => {
  const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [teamFilter, setTeamFilter] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MatchSchedule | null>(null);
  const [clubId, setClubId] = useState<number | null>(null);

  const [form, setForm] = useState({
    teamId: '',
    name: '',
    matchType: 'friendly',
    opponent: '',
    matchTime: '',
    location: '',
    remark: '',
  });

  useEffect(() => {
    loadClubAndTeams();
  }, []);

  useEffect(() => {
    if (clubId) loadSchedules();
  }, [currentMonth, teamFilter, clubId]);

  const loadClubAndTeams = async () => {
    try {
      const profileRes = await clubApi.getProfile();
      if (profileRes.data?.success && profileRes.data.data) {
        const cid = profileRes.data.data.id;
        setClubId(cid);
        const teamRes = await teamApi.getTeams(cid);
        if (teamRes.data?.success && teamRes.data.data) {
          setTeams(teamRes.data.data);
        }
      }
    } catch (err) {
      console.error('加载俱乐部信息失败:', err);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params: { month: string; teamId?: number } = { month: currentMonth };
      if (teamFilter) params.teamId = teamFilter;
      const res = await clubApi.getMatchSchedules(params);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSchedules(res.data.data);
      }
    } catch (err) {
      console.error('加载赛程失败:', err);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditingSchedule(null);
    setForm({
      teamId: '',
      name: '',
      matchType: 'friendly',
      opponent: '',
      matchTime: '',
      location: '',
      remark: '',
    });
    setModalOpen(true);
  };

  const openEdit = (s: MatchSchedule) => {
    setEditingSchedule(s);
    setForm({
      teamId: String(s.teamId),
      name: s.name,
      matchType: s.matchType,
      opponent: s.opponent || '',
      matchTime: s.matchTime ? new Date(s.matchTime).toISOString().slice(0, 16) : '',
      location: s.location || '',
      remark: s.remark || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.teamId || !form.name || !form.matchTime) return;
    const payload = {
      ...form,
      teamId: String(form.teamId),
      matchTime: new Date(form.matchTime).toISOString(),
    };
    try {
      if (editingSchedule) {
        await clubApi.updateMatchSchedule(editingSchedule.id, payload);
      } else {
        await clubApi.createMatchSchedule(payload);
      }
      setModalOpen(false);
      loadSchedules();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该赛程？')) return;
    try {
      await clubApi.deleteMatchSchedule(id);
      loadSchedules();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleCreateSummary = async (schedule: MatchSchedule) => {
    try {
      const res = await matchSummaryApi.createSummary({
        teamId: schedule.teamId,
        matchName: schedule.name,
        opponent: schedule.opponent,
        matchDate: schedule.matchTime.slice(0, 10),
        location: schedule.location,
        scheduleId: schedule.id,
      });
      if (res.data?.success && res.data.data?.id) {
        alert('比赛总结创建成功，正在跳转...');
        // 这里可以触发路由跳转，当前页面暂用 alert
      }
    } catch (err) {
      console.error('创建比赛总结失败:', err);
    }
  };

  const changeMonth = (delta: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const groupedSchedules = useMemo(() => {
    const map: Record<string, MatchSchedule[]> = {};
    schedules.forEach(s => {
      const date = new Date(s.matchTime).toISOString().slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(s);
    });
    return map;
  }, [schedules]);

  const calendarDays = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startOffset = firstDay.getDay();
    const days: { date: string; day: number; current: boolean }[] = [];
    const prevLastDay = new Date(y, m - 1, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: '', day: prevLastDay - i, current: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, current: true });
    }
    const remain = 42 - days.length;
    for (let d = 1; d <= remain; d++) {
      days.push({ date: '', day: d, current: false });
    }
    return days;
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <div className="bg-[#1a1f2e] border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">赛程日历</h1>
              <p className="text-gray-400 mt-1">统筹俱乐部所有赛事安排</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 新增赛事
          </button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* 筛选栏 */}
        <div className="flex items-center justify-between bg-[#1a1f2e] rounded-2xl border border-gray-800 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0f1419] rounded-xl px-3 py-2 border border-gray-700">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:text-emerald-400 text-gray-400">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-white font-medium w-24 text-center">{currentMonth}</span>
              <button onClick={() => changeMonth(1)} className="p-1 hover:text-emerald-400 text-gray-400">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value ? Number(e.target.value) : '')}
              className="bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">全部球队</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="text-gray-400 text-sm">共 {schedules.length} 场赛事</div>
        </div>

        {/* 日历视图 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-800">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="px-2 py-3 text-center text-sm text-gray-400 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[120px] border-b border-r border-gray-800 p-2 ${cell.current ? 'bg-[#1a1f2e]' : 'bg-[#0f1419]/50'}`}
              >
                <div className={`text-sm mb-1 ${cell.current ? 'text-white' : 'text-gray-600'}`}>{cell.day}</div>
                <div className="space-y-1">
                  {(groupedSchedules[cell.date] || []).map(s => {
                    const st = statusMap[s.status] || statusMap.upcoming;
                    return (
                      <div
                        key={s.id}
                        onClick={() => openEdit(s)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer truncate hover:opacity-80 ${st.class}`}
                        title={s.name}
                      >
                        {s.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 列表视图 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">本月赛事</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : schedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无赛事安排</div>
            ) : (
              schedules.map(s => {
                const st = statusMap[s.status] || statusMap.upcoming;
                return (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-[#0f1419]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${st.class}`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {s.name}
                          <span className={`px-2 py-0.5 rounded text-xs ${st.class}`}>{st.label}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{typeMap[s.matchType] || s.matchType}</span>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(s.matchTime).toLocaleString('zh-CN')}</span>
                          {s.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {s.location}</span>}
                          {s.opponent && <span className="text-gray-500">vs {s.opponent}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === 'completed' && !s.matchSummaryId && (
                        <button
                          onClick={() => handleCreateSummary(s)}
                          className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> 创建总结
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(s)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 创建/编辑弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1a1f2e] rounded-3xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1f2e]">
              <h3 className="text-xl font-bold text-white">{editingSchedule ? '编辑赛事' : '新增赛事'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">所属球队 *</label>
                <select
                  value={form.teamId}
                  onChange={e => setForm(prev => ({ ...prev, teamId: e.target.value }))}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">请选择球队</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">赛事名称 *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：U12 春季联赛第三轮"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">赛事类型 *</label>
                  <select
                    value={form.matchType}
                    onChange={e => setForm(prev => ({ ...prev, matchType: e.target.value }))}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(typeMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">比赛时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.matchTime}
                    onChange={e => setForm(prev => ({ ...prev, matchTime: e.target.value }))}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">比赛地点</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="例如：主场"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">对手</label>
                <input
                  value={form.opponent}
                  onChange={e => setForm(prev => ({ ...prev, opponent: e.target.value }))}
                  placeholder="例如：实验小学"
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">备注</label>
                <textarea
                  value={form.remark}
                  onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))}
                  rows={3}
                  placeholder="填写其他需要说明的信息"
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors">取消</button>
              <button
                onClick={handleSave}
                disabled={!form.teamId || !form.name || !form.matchTime}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCalendar;
