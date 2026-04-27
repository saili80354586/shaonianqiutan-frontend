import React, { useState } from 'react';
import { Search, Filter, Eye, Download, Edit2, Trash2, FileText, Star, MoreVertical } from 'lucide-react';

interface Report {
  id: string;
  playerName: string;
  position: string;
  age: number;
  status: 'draft' | 'published' | 'archived';
  rating: number;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

const mockReports: Report[] = [
  {
    id: 'RPT-20240327001',
    playerName: '张明远',
    position: '前锋',
    age: 14,
    status: 'published',
    rating: 4.8,
    views: 156,
    downloads: 42,
    createdAt: '2024-03-27 10:30',
    updatedAt: '2024-03-28 14:20',
  },
  {
    id: 'RPT-20240326002',
    playerName: '李华',
    position: '中场',
    age: 13,
    status: 'draft',
    rating: 0,
    views: 0,
    downloads: 0,
    createdAt: '2024-03-26 14:20',
    updatedAt: '2024-03-26 14:20',
  },
  {
    id: 'RPT-20240325003',
    playerName: '王强',
    position: '后卫',
    age: 15,
    status: 'published',
    rating: 4.5,
    views: 89,
    downloads: 23,
    createdAt: '2024-03-25 09:15',
    updatedAt: '2024-03-26 16:30',
  },
  {
    id: 'RPT-20240324004',
    playerName: '赵敏',
    position: '门将',
    age: 14,
    status: 'archived',
    rating: 4.2,
    views: 234,
    downloads: 67,
    createdAt: '2024-03-24 16:45',
    updatedAt: '2024-03-25 10:00',
  },
];

export const ReportsModule: React.FC = () => {
  const [reports] = useState<Report[]>(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      draft: { text: '草稿', color: 'bg-gray-500/20 text-gray-400' },
      published: { text: '已发布', color: 'bg-green-500/20 text-green-400' },
      archived: { text: '已归档', color: 'bg-blue-500/20 text-blue-400' },
    };
    return map[status] || { text: status, color: 'bg-gray-500/20 text-gray-400' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">我的报告</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="搜索球员或报告编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14] w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">草稿</span>
            <FileText className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'draft').length}</p>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">已发布</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'published').length}</p>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">总浏览</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{reports.reduce((acc, r) => acc + r.views, 0)}</p>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">下载数</span>
            <Download className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-white">{reports.reduce((acc, r) => acc + r.downloads, 0)}</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const status = getStatusBadge(report.status);
          return (
            <div
              key={report.id}
              className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden hover:border-gray-600 transition-all group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </div>

                <h3 className="text-white font-semibold text-lg mb-1">{report.playerName}</h3>
                <p className="text-gray-400 text-sm mb-4">{report.position} · {report.age}岁</p>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye size={14} /> {report.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={14} /> {report.downloads}
                  </span>
                  {report.rating > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star size={14} /> {report.rating}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  更新于 {report.updatedAt}
                </div>
              </div>

              <div className="border-t border-gray-800 p-4 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-[#39ff14]/10 text-[#39ff14] rounded-lg text-sm font-medium hover:bg-[#39ff14]/20 transition-colors">
                  查看
                </button>
                {report.status !== 'published' && (
                  <button className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
                    编辑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-gray-400 mb-2">暂无符合条件的报告</p>
          <p className="text-gray-500 text-sm">尝试调整搜索条件或筛选器</p>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;
