import React, { useEffect, useState } from 'react';
import { clubApi } from '../../services/api';
import { ChevronLeft, Clock, User, Shield, FileText, Trash2, Download, Users, LogIn, Bell, Archive, type LucideIcon } from 'lucide-react';

interface AdminOperationLogsProps {
  onBack: () => void;
}

interface OperationLog {
  id: number;
  adminName: string;
  action: string;
  target: string;
  targetId: number;
  detail: string;
  ip: string;
  createdAt: string;
}

const actionIconMap: Record<string, LucideIcon> = {
  delete_team: Trash2,
  restore_team: Archive,
  export_players: Download,
  remove_coach: Users,
  remove_player: Users,
  create_announcement: Bell,
  update_announcement: Bell,
  delete_announcement: Trash2,
  create_order: FileText,
  create_match: Shield,
  create_weekly: FileText,
  remind_weekly: Bell,
  remind_match: Bell,
  remind_physical: Bell,
  login: LogIn,
  add_shortlist: Users,
  remove_shortlist: Users,
  create_season_archive: Archive,
  delete_season_archive: Trash2,
};

const actionColorMap: Record<string, string> = {
  delete_team: 'text-red-400 bg-red-500/10',
  restore_team: 'text-emerald-400 bg-emerald-500/10',
  export_players: 'text-blue-400 bg-blue-500/10',
  remove_coach: 'text-orange-400 bg-orange-500/10',
  remove_player: 'text-orange-400 bg-orange-500/10',
  create_announcement: 'text-amber-400 bg-amber-500/10',
  update_announcement: 'text-amber-400 bg-amber-500/10',
  delete_announcement: 'text-red-400 bg-red-500/10',
  create_order: 'text-purple-400 bg-purple-500/10',
  create_match: 'text-cyan-400 bg-cyan-500/10',
  create_weekly: 'text-indigo-400 bg-indigo-500/10',
  remind_weekly: 'text-pink-400 bg-pink-500/10',
  remind_match: 'text-pink-400 bg-pink-500/10',
  remind_physical: 'text-pink-400 bg-pink-500/10',
  login: 'text-gray-400 bg-gray-500/10',
  add_shortlist: 'text-emerald-400 bg-emerald-500/10',
  remove_shortlist: 'text-orange-400 bg-orange-500/10',
  create_season_archive: 'text-cyan-400 bg-cyan-500/10',
  delete_season_archive: 'text-red-400 bg-red-500/10',
};

const actionNameMap: Record<string, string> = {
  delete_team: '删除球队',
  restore_team: '恢复球队',
  export_players: '导出球员名单',
  remove_coach: '移除教练',
  remove_player: '移除球员',
  create_announcement: '发布公告',
  update_announcement: '编辑公告',
  delete_announcement: '删除公告',
  create_order: '创建订单',
  create_match: '创建比赛',
  create_weekly: '发起周报',
  remind_weekly: '催办周报',
  remind_match: '催办比赛自评',
  remind_physical: '催办体测录入',
  login: '登录后台',
  add_shortlist: '加入候选名单',
  remove_shortlist: '移出候选名单',
  create_season_archive: '创建赛季档案',
  delete_season_archive: '删除赛季档案',
};

const AdminOperationLogs: React.FC<AdminOperationLogsProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getAdminOperationLogs({ page, pageSize });
      if (res.data?.success && res.data.data) {
        setLogs(res.data.data.list || []);
        setTotal(res.data.data.total || 0);
      }
    } catch (err) {
      console.error('加载操作日志失败:', err);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">管理员操作日志</h1>
            <p className="text-sm text-gray-400">记录敏感操作，便于追溯与审计</p>
          </div>
        </div>

        {/* 列表 */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">操作</th>
                  <th className="px-4 py-3 font-medium">管理员</th>
                  <th className="px-4 py-3 font-medium">详情</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      加载中...
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      暂无操作日志
                    </td>
                  </tr>
                )}
                {logs.map((log) => {
                  const Icon = actionIconMap[log.action] || Shield;
                  const colorClass = actionColorMap[log.action] || 'text-gray-400 bg-gray-500/10';
                  const actionName = actionNameMap[log.action] || log.action;
                  return (
                    <tr key={log.id} className="hover:bg-gray-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-md ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="font-medium">{actionName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-gray-500" />
                          {log.adminName || `用户#${log.targetId}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={log.detail}>
                        {log.detail || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {log.createdAt}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-sm text-gray-400">
                共 {total} 条，第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOperationLogs;
