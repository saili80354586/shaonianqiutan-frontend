import React, { useEffect, useMemo, useState } from 'react';
import { clubApi, teamApi, ptApi } from '../../services/api';
import {
  ChevronLeft, Plus, Calendar, MapPin, Users, FileText,
  CheckCircle, Clock, X, ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon, ArrowRight, Link2,
  type LucideIcon
} from 'lucide-react';

interface TrainingPlansProps {
  onBack: () => void;
}

interface TrainingPlan {
  id: number;
  teamId: number;
  title: string;
  theme: string;
  location: string;
  startTime: string;
  endTime?: string;
  playerIds: number[];
  content: string;
  videoUrls: string[];
  summary: string;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  weeklyReportId?: number;
  physicalTestId?: number;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
}

interface WeeklyPeriod {
  id: number;
  weekStart: string;
  weekEnd: string;
  label?: string;
}

interface PhysicalTestItem {
  id: number;
  name: string;
  startDate: string;
}

const statusMap: Record<string, { label: string; class: string; icon: LucideIcon }> = {
  draft: { label: '草稿', class: 'bg-gray-500/20 text-gray-300', icon: FileText },
  published: { label: '已发布', class: 'bg-blue-500/20 text-blue-300', icon: Calendar },
  completed: { label: '已完成', class: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle },
  cancelled: { label: '已取消', class: 'bg-red-500/20 text-red-300', icon: X },
};

const TrainingPlans: React.FC<TrainingPlansProps> = ({ onBack }) => {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [teamFilter, setTeamFilter] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
  const [clubId, setClubId] = useState<number | null>(null);

  const [form, setForm] = useState({
    teamId: '',
    title: '',
    theme: '',
    location: '',
    startTime: '',
    endTime: '',
    content: '',
    playerIds: [] as number[],
    weeklyReportId: '',
    physicalTestId: '',
  });

  const [weeklyPeriods, setWeeklyPeriods] = useState<WeeklyPeriod[]>([]);
  const [physicalTests, setPhysicalTests] = useState<PhysicalTestItem[]>([]);

  useEffect(() => {
    loadClubAndTeams();
  }, []);

  useEffect(() => {
    if (clubId) loadPlans();
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

  const loadPlans = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { month: currentMonth };
      if (teamFilter) params.teamId = teamFilter;
      const res = await clubApi.getTrainingPlans(params);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('加载训练计划失败:', err);
    }
    setLoading(false);
  };

  const loadRelOptions = async (teamId: number) => {
    try {
      const [wpRes, ptRes] = await Promise.all([
        teamApi.getTeamWeeklyPeriods(teamId),
        ptApi.getPhysicalTests({ teamId, pageSize: 100 }),
      ]);
      if (wpRes.data?.success && Array.isArray(wpRes.data.data)) {
        setWeeklyPeriods(wpRes.data.data);
      }
      if (ptRes.data?.success && Array.isArray(ptRes.data.data?.list)) {
        setPhysicalTests(ptRes.data.data.list);
      }
    } catch (err) {
      console.error('加载关联数据失败:', err);
    }
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({
      teamId: '',
      title: '',
      theme: '',
      location: '',
      startTime: '',
      endTime: '',
      content: '',
      playerIds: [],
      weeklyReportId: '',
      physicalTestId: '',
    });
    setWeeklyPeriods([]);
    setPhysicalTests([]);
    setModalOpen(true);
  };

  const openEdit = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    setForm({
      teamId: String(plan.teamId),
      title: plan.title,
      theme: plan.theme || '',
      location: plan.location || '',
      startTime: plan.startTime ? new Date(plan.startTime).toISOString().slice(0, 16) : '',
      endTime: plan.endTime ? new Date(plan.endTime).toISOString().slice(0, 16) : '',
      content: plan.content || '',
      playerIds: plan.playerIds || [],
      weeklyReportId: plan.weeklyReportId ? String(plan.weeklyReportId) : '',
      physicalTestId: plan.physicalTestId ? String(plan.physicalTestId) : '',
    });
    setModalOpen(true);
    loadRelOptions(plan.teamId);
  };

  const handleSave = async () => {
    if (!form.teamId || !form.title || !form.startTime) return;
    const payload: Record<string, string | number | null | number[]> = {
      ...form,
      teamId: Number(form.teamId),
      startTime: new Date(form.startTime).toISOString(),
      endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
      weeklyReportId: form.weeklyReportId ? Number(form.weeklyReportId) : null,
      physicalTestId: form.physicalTestId ? Number(form.physicalTestId) : null,
    };
    try {
      if (editingPlan) {
        await clubApi.updateTrainingPlan(editingPlan.id, payload);
      } else {
        await clubApi.createTrainingPlan(payload);
      }
      setModalOpen(false);
      loadPlans();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该训练计划？')) return;
    try {
      await clubApi.deleteTrainingPlan(id);
      loadPlans();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleComplete = async (plan: TrainingPlan) => {
    const summary = prompt('请输入训练总结（可选）：', plan.summary || '');
    if (summary === null) return;
    try {
      await clubApi.updateTrainingPlan(plan.id, {
        status: 'completed',
        summary,
      });
      loadPlans();
    } catch (err) {
      console.error('标记完成失败:', err);
    }
  };

  const changeMonth = (delta: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const groupedPlans = useMemo(() => {
    const map: Record<string, TrainingPlan[]> = {};
    plans.forEach(plan => {
      const date = new Date(plan.startTime).toISOString().slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(plan);
    });
    return map;
  }, [plans]);

  const calendarDays = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startOffset = firstDay.getDay(); // 0=周日
    const days: { date: string; day: number; current: boolean }[] = [];
    // 上月补齐
    const prevLastDay = new Date(y, m - 1, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      days.push({ date: '', day: d, current: false });
    }
    // 当月
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, current: true });
    }
    // 下月补齐到42格
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
              <h1 className="text-2xl font-bold text-white">训练计划</h1>
              <p className="text-gray-400 mt-1">安排球队训练，跟踪执行情况</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 新建计划
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
          <div className="text-gray-400 text-sm">共 {plans.length} 个训练计划</div>
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
                  {(groupedPlans[cell.date] || []).map(plan => {
                    const s = statusMap[plan.status] || statusMap.draft;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => openEdit(plan)}
                        className={`text-xs px-2 py-1 rounded cursor-pointer truncate hover:opacity-80 ${s.class}`}
                        title={plan.title}
                      >
                        <div className="flex items-center gap-1">
                          {plan.weeklyReportId && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          {plan.physicalTestId && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                          <span className="truncate">{plan.title}</span>
                        </div>
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
            <h3 className="text-lg font-semibold text-white">即将开始</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : plans.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无待执行的训练计划</div>
            ) : (
              plans.filter(p => p.status !== 'completed' && p.status !== 'cancelled').map(plan => {
                const s = statusMap[plan.status] || statusMap.draft;
                return (
                  <div key={plan.id} className="p-4 flex items-center justify-between hover:bg-[#0f1419]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${s.class}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          {plan.title}
                          {plan.weeklyReportId && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">周报</span>}
                          {plan.physicalTestId && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">体测</span>}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(plan.startTime).toLocaleString('zh-CN')}</span>
                          {plan.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {plan.location}</span>}
                          <span className={`px-2 py-0.5 rounded text-xs ${s.class}`}>{s.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.status !== 'completed' && (
                        <button
                          onClick={() => handleComplete(plan)}
                          className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        >
                          标记完成
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(plan)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
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
              <h3 className="text-xl font-bold text-white">{editingPlan ? '编辑训练计划' : '新建训练计划'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">所属球队 *</label>
                <select
                  value={form.teamId}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, teamId: val, weeklyReportId: '', physicalTestId: '' }));
                    if (val) loadRelOptions(Number(val));
                    else {
                      setWeeklyPeriods([]);
                      setPhysicalTests([]);
                    }
                  }}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">请选择球队</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> 关联周报周期</label>
                  <select
                    value={form.weeklyReportId}
                    onChange={e => setForm(prev => ({ ...prev, weeklyReportId: e.target.value }))}
                    disabled={!form.teamId}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">不关联</option>
                    {weeklyPeriods.map(p => (
                      <option key={p.id} value={p.id}>{p.label || `${p.weekStart} ~ ${p.weekEnd}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> 关联体测活动</label>
                  <select
                    value={form.physicalTestId}
                    onChange={e => setForm(prev => ({ ...prev, physicalTestId: e.target.value }))}
                    disabled={!form.teamId}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">不关联</option>
                    {physicalTests.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">计划标题 *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="例如：U12 春季体能训练"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">训练主题</label>
                  <input
                    value={form.theme}
                    onChange={e => setForm(prev => ({ ...prev, theme: e.target.value }))}
                    placeholder="例如：速度耐力提升"
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">开始时间 *</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">结束时间</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">训练地点</label>
                <input
                  value={form.location}
                  onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="例如：俱乐部一号场"
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">训练内容</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="填写本次训练的目标、内容、注意事项等"
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              {editingPlan?.status === 'completed' && (
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="text-emerald-400 text-sm font-medium mb-1">训练总结</div>
                  <div className="text-gray-300 text-sm">{editingPlan.summary || '无总结'}</div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors">取消</button>
              <button
                onClick={handleSave}
                disabled={!form.teamId || !form.title || !form.startTime}
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

export default TrainingPlans;
