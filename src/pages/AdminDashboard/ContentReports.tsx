import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Flag, CheckCircle, XCircle, Loader2, Eye, AlertTriangle } from 'lucide-react';

interface ContentReport {
  id: number;
  reporter_name: string;
  target_type: string;
  reason: string;
  detail: string;
  status: string;
  handler_name: string;
  handle_result: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-500/20 text-amber-400' },
  processing: { label: '处理中', color: 'bg-blue-500/20 text-blue-400' },
  resolved: { label: '已处理', color: 'bg-emerald-500/20 text-emerald-400' },
  rejected: { label: '已驳回', color: 'bg-red-500/20 text-red-400' },
};

const typeMap: Record<string, string> = {
  post: '动态',
  comment: '评论',
  user: '用户',
  message: '私信',
};

const ContentReports: React.FC = () => {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [handleResult, setHandleResult] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await adminApi.getContentReports({ status: filter || undefined });
      if (res.data?.success) setReports(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleReport = async (id: number, status: string) => {
    setProcessing(true);
    try {
      await adminApi.handleContentReport(id, { status, result: handleResult });
      setSelectedReport(null);
      setHandleResult('');
      fetchReports();
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Flag className="w-5 h-5 text-emerald-400" /> 举报处理</h2>
        <div className="flex gap-2">
          {['', 'pending', 'resolved', 'rejected'].map((s) => (
            <button key={s || 'all'} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === s ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/[0.04]'}`}>
              {s === '' ? '全部' : statusMap[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3">举报人</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">类型</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">原因</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">状态</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">时间</th>
              <th className="text-right text-slate-400 font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">暂无举报数据</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white">{r.reporter_name || `用户${r.id}`}</td>
                <td className="px-4 py-3 text-slate-300">{typeMap[r.target_type] || r.target_type}</td>
                <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{r.reason}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusMap[r.status]?.color || 'bg-slate-500/20 text-slate-400'}`}>{statusMap[r.status]?.label || r.status}</span></td>
                <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === 'pending' && (
                    <button onClick={() => setSelectedReport(r)} className="text-emerald-400 hover:text-emerald-300 text-sm">处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1419] border border-white/[0.08] rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">处理举报 #{selectedReport.id}</h3>
            </div>
            <div className="space-y-3 mb-4 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">举报人：</span>{selectedReport.reporter_name}</p>
              <p className="text-slate-300"><span className="text-slate-500">类型：</span>{typeMap[selectedReport.target_type]}</p>
              <p className="text-slate-300"><span className="text-slate-500">原因：</span>{selectedReport.reason}</p>
              {selectedReport.detail && <p className="text-slate-300"><span className="text-slate-500">详情：</span>{selectedReport.detail}</p>}
            </div>
            <textarea
              value={handleResult}
              onChange={(e) => setHandleResult(e.target.value)}
              placeholder="处理结果说明..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-white/[0.04] text-sm">取消</button>
              <button onClick={() => handleReport(selectedReport.id, 'rejected')} disabled={processing} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" /> 驳回
              </button>
              <button onClick={() => handleReport(selectedReport.id, 'resolved')} disabled={processing} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> 确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentReports;
