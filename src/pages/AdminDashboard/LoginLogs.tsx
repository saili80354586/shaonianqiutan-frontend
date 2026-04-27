import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogIn, Loader2, Search, MapPin, Monitor, Globe, CheckCircle, XCircle } from 'lucide-react';

interface LoginLog {
  id: number;
  user_name: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  status: string;
  fail_reason: string;
  created_at: string;
}

interface LoginStats {
  date: string;
  success: number;
  failed: number;
}

const LoginLogs: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [stats, setStats] = useState<LoginStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<'7' | '30'>('7');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminApi.getLoginLogs({ search }),
        adminApi.getLoginLogStats(Number(range)),
      ]);
      if (logsRes.data?.success) setLogs(logsRes.data.data?.list || []);
      if (statsRes.data?.success) setStats(statsRes.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range]);

  const filteredLogs = logs.filter(l =>
    !search ||
    l.user_name?.includes(search) ||
    l.ip?.includes(search) ||
    l.location?.includes(search)
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><LogIn className="w-5 h-5 text-emerald-400" /> 登录日志</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户、IP..." className="pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 w-48" />
          </div>
          {(['7', '30'] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-2 rounded-lg text-sm transition-colors ${range === r ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/[0.04]'}`}>
              {r === '7' ? '近7天' : '近30天'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">登录趋势</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Tooltip contentStyle={{ backgroundColor: '#0f1419', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff' }} />
            <Line type="monotone" dataKey="success" name="成功" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="failed" name="失败" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3">时间</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">用户</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">IP</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">设备</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">位置</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">暂无登录记录</td></tr>
            )}
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-white">{log.user_name || '-'}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{log.ip}</td>
                <td className="px-4 py-3 text-slate-300 text-xs">
                  <div className="flex items-center gap-1"><Monitor className="w-3 h-3 text-slate-500" /> {log.browser}</div>
                  <div className="flex items-center gap-1 text-slate-500"><Globe className="w-3 h-3" /> {log.os}</div>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {log.location || '-'}</span></td>
                <td className="px-4 py-3">
                  {log.status === 'success' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" /> 成功</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-400 text-xs" title={log.fail_reason}><XCircle className="w-3 h-3" /> 失败</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoginLogs;
