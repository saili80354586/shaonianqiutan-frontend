import React, { useState, useEffect, useCallback } from "react";
import { teamApi } from "../../services/club";
import {
  ArrowLeft,
  Plus,
  Users,
  Trophy,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  ChevronRight,
  Shield,
  UserPlus,
  Copy,
  QrCode,
  MoreVertical,
  Search,
  AlertTriangle,
  X,
  Check,
  Loader2,
} from "lucide-react";

// 年龄组配置
export const AGE_GROUPS = [
  { code: "U6", minYear: 2020, maxYear: 2021, label: "U6", ageRange: "5-6岁" },
  { code: "U7", minYear: 2019, maxYear: 2019, label: "U7", ageRange: "6-7岁" },
  { code: "U8", minYear: 2018, maxYear: 2018, label: "U8", ageRange: "7-8岁" },
  { code: "U9", minYear: 2017, maxYear: 2017, label: "U9", ageRange: "8-9岁" },
  {
    code: "U10",
    minYear: 2016,
    maxYear: 2016,
    label: "U10",
    ageRange: "9-10岁",
  },
  {
    code: "U11",
    minYear: 2015,
    maxYear: 2015,
    label: "U11",
    ageRange: "10-11岁",
  },
  {
    code: "U12",
    minYear: 2014,
    maxYear: 2014,
    label: "U12",
    ageRange: "11-12岁",
  },
  {
    code: "U13",
    minYear: 2013,
    maxYear: 2013,
    label: "U13",
    ageRange: "12-13岁",
  },
  {
    code: "U14",
    minYear: 2012,
    maxYear: 2012,
    label: "U14",
    ageRange: "13-14岁",
  },
  {
    code: "U15",
    minYear: 2011,
    maxYear: 2011,
    label: "U15",
    ageRange: "14-15岁",
  },
  {
    code: "U16",
    minYear: 2010,
    maxYear: 2010,
    label: "U16",
    ageRange: "15-16岁",
  },
  {
    code: "U17",
    minYear: 2009,
    maxYear: 2009,
    label: "U17",
    ageRange: "16-17岁",
  },
  {
    code: "U18",
    minYear: 2008,
    maxYear: 2008,
    label: "U18",
    ageRange: "17-18岁",
  },
];

// 根据出生年份计算年龄组
export const getAgeGroup = (birthYear: number): string => {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // 找到最适合的年龄组
  for (const group of AGE_GROUPS) {
    if (birthYear >= group.minYear && birthYear <= group.maxYear) {
      return group.code;
    }
  }

  // 如果不在标准范围内，根据年龄推算
  if (age <= 6) return "U6";
  if (age >= 18) return "U18";

  return `U${age}`;
};

// 根据年龄组获取年份范围
export const getAgeGroupYears = (
  ageGroup: string,
): { start: number; end: number } => {
  const group = AGE_GROUPS.find((g) => g.code === ageGroup);
  if (group) {
    return { start: group.minYear, end: group.maxYear };
  }
  // 默认返回当前年份范围
  const age = parseInt(ageGroup.replace("U", ""));
  const currentYear = new Date().getFullYear();
  return { start: currentYear - age, end: currentYear - age + 1 };
};

// 获取年龄组信息
export const getAgeGroupInfo = (code: string) => {
  return AGE_GROUPS.find((g) => g.code === code) || AGE_GROUPS[0];
};

// 球队类型定义
interface Team {
  id: number;
  clubId: number;
  name: string;
  ageGroup: string;
  birthYearStart?: number;
  birthYearEnd?: number;
  description?: string;
  status: "active" | "inactive";
  playerCount: number;
  coachCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamManagementProps {
  onBack: () => void;
  onViewTeam?: (teamId: number) => void;
  clubId?: number;
  isAdmin?: boolean;
}

const TeamManagement: React.FC<TeamManagementProps> = ({
  onBack,
  onViewTeam,
  clubId = 1,
  isAdmin = true,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showArchived, setShowArchived] = useState(false);

  // 加载球队列表
  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teamApi.getTeams(clubId, {
        ageGroup: activeAgeGroup === "all" ? undefined : activeAgeGroup,
        status: showArchived ? undefined : "active",
        includeDeleted: showArchived,
      });
      if (res.data?.success && res.data?.data) {
        const normalizedTeams = res.data.data.map((team: Team & {
          club_id?: number;
          age_group?: string;
          birth_year_start?: number;
          birth_year_end?: number;
          created_at?: string;
          updated_at?: string;
        }) => ({
          ...team,
          clubId: team.clubId ?? team.club_id ?? clubId,
          ageGroup: team.ageGroup ?? team.age_group ?? "U12",
          birthYearStart: team.birthYearStart ?? team.birth_year_start,
          birthYearEnd: team.birthYearEnd ?? team.birth_year_end,
          createdAt: team.createdAt ?? team.created_at,
          updatedAt: team.updatedAt ?? team.updated_at,
        }));
        setTeams(normalizedTeams);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("加载球队列表失败:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, activeAgeGroup, showArchived]);

  // 恢复归档球队
  const handleRestoreTeam = async (team: Team) => {
    try {
      const res = await teamApi.restoreTeam(team.id);
      if (res.data?.success) {
        await loadTeams();
      }
    } catch (error) {
      console.error("恢复球队失败:", error);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // 删除球队
  const handleDeleteTeam = async (team: Team) => {
    setDeleting(true);
    try {
      const res = await teamApi.deleteTeam(team.id);
      if (res.data?.success) {
        await loadTeams();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("删除球队失败:", error);
    } finally {
      setDeleting(false);
    }
  };

  // 按年龄组分类
  const teamsByAgeGroup = teams.reduce(
    (acc, team) => {
      const group = team.ageGroup;
      if (!acc[group]) acc[group] = [];
      acc[group].push(team);
      return acc;
    },
    {} as Record<string, Team[]>,
  );

  // 获取年龄组排序
  const sortedAgeGroups = Object.keys(teamsByAgeGroup).sort((a, b) => {
    const ageA = parseInt(a.replace("U", ""));
    const ageB = parseInt(b.replace("U", ""));
    return ageA - ageB;
  });

  const totalPlayers = teams.reduce((sum, t) => sum + t.playerCount, 0);

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">球队管理</h1>
              <p className="text-gray-400 mt-1">
                共 {teams.length} 支球队，{totalPlayers} 名球员
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> 创建球队
          </button>
        </div>

        {/* 状态切换 + 年龄组快速筛选 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-[#1a1f2e] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !showArchived
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              在训球队
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showArchived
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              已归档
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveAgeGroup("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeAgeGroup === "all"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
              }`}
            >
              全部 ({teams.length})
            </button>
            {sortedAgeGroups.map((group) => {
              const info = getAgeGroupInfo(group);
              return (
                <button
                  key={group}
                  onClick={() => setActiveAgeGroup(group)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeAgeGroup === group
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {info.label} ({info.ageRange}) -{" "}
                  {teamsByAgeGroup[group].length}队
                </button>
              );
            })}
          </div>
        </div>

        {/* 球队列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 animate-pulse h-40"
                />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">暂无球队</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-emerald-400 hover:text-emerald-300"
              >
                创建第一支球队
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teams.map((team) => {
                const info = getAgeGroupInfo(team.ageGroup);
                return (
                  <div
                    key={team.id}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer group"
                    onClick={() => onViewTeam?.(team.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-xl flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-white">
                                {team.name}
                              </h3>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                {info.label}
                              </span>
                              {team.status === "active" ? (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                  在训
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs">
                                  停训
                                </span>
                              )}
                              {showArchived && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                  已归档
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                              {info.ageRange} · {team.description || "暂无描述"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {team.playerCount}
                            </div>
                            <div className="text-xs text-gray-500">球员</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </div>

                      {/* 底部信息 */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {team.coachCount} 教练
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{" "}
                            {team.createdAt
                              ? team.createdAt.split("T")[0]
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!showArchived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTeam(team);
                              }}
                              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="编辑球队"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && !showArchived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(team);
                              }}
                              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                              title="归档球队"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && showArchived && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreTeam(team);
                              }}
                              className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                            >
                              恢复
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 创建/编辑球队弹窗 */}
      {showCreateModal && (
        <CreateTeamModal
          clubId={clubId}
          team={null}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTeams();
          }}
        />
      )}

      {/* 编辑球队弹窗 */}
      {editingTeam && (
        <CreateTeamModal
          clubId={clubId}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSuccess={() => {
            setEditingTeam(null);
            loadTeams();
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <DeleteConfirmModal
          team={deleteConfirm}
          loading={deleting}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDeleteTeam(deleteConfirm)}
        />
      )}
    </div>
  );
};

// 创建/编辑球队弹窗组件
interface CreateTeamModalProps {
  clubId: number;
  team: Team | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  clubId,
  team,
  onClose,
  onSuccess,
}) => {
  const ageGroupYears = team
    ? getAgeGroupYears(team.ageGroup)
    : getAgeGroupYears("U12");

  const [form, setForm] = useState({
    name: team?.name || "",
    ageGroup: team?.ageGroup || "U12",
    birthYearStart: team?.birthYearStart || ageGroupYears.start,
    birthYearEnd: team?.birthYearEnd || ageGroupYears.end,
    description: team?.description || "",
    status: team?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 年龄组变化时自动更新年份
  const handleAgeGroupChange = (newAgeGroup: string) => {
    const years = getAgeGroupYears(newAgeGroup);
    setForm((prev) => ({
      ...prev,
      ageGroup: newAgeGroup,
      birthYearStart: years.start,
      birthYearEnd: years.end,
    }));
  };

  // 表单验证
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = "请输入球队名称";
    }
    if (
      form.birthYearStart &&
      form.birthYearEnd &&
      form.birthYearStart > form.birthYearEnd
    ) {
      newErrors.birthYearEnd = "结束年份不能早于开始年份";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (team) {
        // 更新球队
        const res = await teamApi.updateTeam(team.id, {
          name: form.name,
          ageGroup: form.ageGroup,
          description: form.description,
        });
        if (!res.data?.success) {
          setErrors({ submit: res.data?.error?.message || "更新失败" });
          return;
        }
      } else {
        // 创建球队
        const res = await teamApi.createTeam(clubId, {
          name: form.name,
          ageGroup: form.ageGroup,
          description: form.description,
          birthYearStart: form.birthYearStart,
          birthYearEnd: form.birthYearEnd,
        });
        if (!res.data?.success) {
          setErrors({ submit: res.data?.error?.message || "创建失败" });
          return;
        }
      }
      onSuccess();
    } catch (error) {
      console.error("保存球队失败:", error);
      setErrors({ submit: "保存失败，请重试" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a1f2e]">
          <h2 className="text-xl font-bold text-white">
            {team ? "编辑球队" : "创建球队"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 球队名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              球队名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：U12一队、U12二队"
              className={`w-full px-4 py-2.5 bg-[#0f1419] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 ${
                errors.name ? "border-red-500" : "border-gray-700"
              }`}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* 年龄组 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              年龄组
            </label>
            <select
              value={form.ageGroup}
              onChange={(e) => handleAgeGroupChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              {AGE_GROUPS.map((group) => (
                <option key={group.code} value={group.code}>
                  {group.label} ({group.ageRange})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              系统将根据年龄组自动计算球员出生年份范围
            </p>
          </div>

          {/* 出生年份范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                出生年份（开始）
              </label>
              <input
                type="number"
                value={form.birthYearStart}
                onChange={(e) =>
                  setForm({
                    ...form,
                    birthYearStart: parseInt(e.target.value) || 0,
                  })
                }
                min={2000}
                max={2030}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                出生年份（结束）
              </label>
              <input
                type="number"
                value={form.birthYearEnd}
                onChange={(e) =>
                  setForm({
                    ...form,
                    birthYearEnd: parseInt(e.target.value) || 0,
                  })
                }
                min={2000}
                max={2030}
                className={`w-full px-4 py-2.5 bg-[#0f1419] border rounded-xl text-white focus:outline-none focus:border-emerald-500 ${
                  errors.birthYearEnd ? "border-red-500" : "border-gray-700"
                }`}
              />
              {errors.birthYearEnd && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.birthYearEnd}
                </p>
              )}
            </div>
          </div>

          {/* 球队描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              球队描述
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="简要描述球队情况"
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* 状态（编辑时显示） */}
          {team && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                状态
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="active">在训</option>
                <option value="inactive">停训</option>
              </select>
            </div>
          )}

          {/* 提交错误 */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {errors.submit}
            </div>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "保存中..." : team ? "保存修改" : "创建球队"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 删除确认弹窗
interface DeleteConfirmModalProps {
  team: Team;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  team,
  loading,
  onClose,
  onConfirm,
}) => {
  const hasPlayers = team.playerCount > 0;
  const hasCoaches = team.coachCount > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">归档球队</h2>
              <p className="text-gray-400 text-sm">
                归档后球队数据保留，但不再出现在日常管理中
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-white mb-4">
            确定要归档球队{" "}
            <span className="font-semibold text-emerald-400">{team.name}</span>{" "}
            吗？
          </p>

          {(hasPlayers || hasCoaches) && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
              <p className="text-amber-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  该球队目前有 {hasPlayers && `${team.playerCount} 名球员`}
                  {hasPlayers && hasCoaches && "和"}
                  {hasCoaches && `${team.coachCount} 名教练`}，
                  归档前建议先移除所有成员。
                </span>
              </p>
            </div>
          )}

          <p className="text-gray-400 text-sm">
            归档后，该球队的所有历史数据将被保留，但不再显示在日常管理列表中。你随时可以前往"已归档"标签恢复球队。
          </p>
        </div>

        <div className="p-6 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                归档中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                确认归档
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
