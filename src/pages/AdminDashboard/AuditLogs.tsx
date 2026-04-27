import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { ClipboardList, Loader2, Search, Filter, User, Shield, FileText, Settings } from 'lucide-react';

interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: string;
  ip: string;
  created_at: string;
}

const actionMap: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create: { label: '创建', icon: FileText, color: 'bg-emerald-500/20 text-emerald-400' },
  update: { label: '更新', icon: Settings, color: 'bg-blue-500/20 text-blue-400' },
  delete: { label: '删除', icon: Shield, color: 'bg-red-500/20 text-red-400' },
  review: { label: '审核', icon: ClipboardList, color: 'bg-amber-500/20 text-amber-400' },
  login: { label: '登录', icon: User, color: 'bg-purple-500/20 text-purple-400' },
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      // 使用现有的登录日志接口作为审计日志基础
      const res = await adminApi.getLoginLogs({ search, action: filterAction || undefined });
      if (res.data?.success) setLogs(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [filterAction]);

  const filteredLogs = logs.filter(l =>
    !search ||
    l.admin_name?.includes(search) ||
    l.action?.includes(search) ||
    l.detail?.includes(search)
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-400" /> 操作审计</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索操作人、动作..." className="pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 w-64" />
          </div>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50">
            <option value="">全部动作</option>
            <option value="create">创建</option>
            <option value="update">更新</option>
            <option value="delete">删除</option>
            <option value="review">审核</option>
            <option value="login">登录</option>
          </select>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3">时间</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">操作人</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">动作</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">对象</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">详情</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">暂无审计记录</td></tr>
            )}
            {filteredLogs.map((log) => {
              const actionConfig = actionMap[log.action] || { label: log.action, icon: Settings, color: 'bg-slate-500/20 text-slate-400' };
              const ActionIcon = actionConfig.icon;
              return (
                <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-white">{log.admin_name || '系统'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${actionConfig.color}`}>
                      <ActionIcon className="w-3 h-3" /> {actionConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{log.target_type || '-'}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{log.detail || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{log.ip || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
