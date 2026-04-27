import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Calendar,
  XCircle,
  Video,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { ListItemSkeleton } from '../../../components/ui/loading';
import api from '../../../services/api';

// 内联类型定义
type ReportStatus = 'processing' | 'completed';
type ReportType = 'scout' | 'video_analysis';

interface Report {
  id: string;
  orderId: string;
  title: string;
  status: ReportStatus;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
  reportType: ReportType;
  // 视频分析特有字段
  playerName?: string;
  playerAge?: number;
  playerPosition?: string;
  matchName?: string;
  opponent?: string;
  overallScore?: number;
  potentialLevel?: string;
  aiReport?: string;
}

// 后端报告数据类型
interface BackendReport {
  id: number;
  report_no: string;
  title: string;
  status: ReportStatus;
  created_at: string;
  completed_at?: string;
  pdf_url?: string;
  order_id?: number;
}

// 后端视频分析数据类型
interface BackendVideoAnalysis {
  id: number;
  order_id: number;
  player_name: string;
  player_age: number;
  player_position: string;
  match_name: string;
  opponent: string;
  overall_score: number;
  potential_level: string;
  status: ReportStatus;
  ai_report_status?: string;
  ai_report?: string;
  created_at: string;
  updated_at: string;
}

// 报告状态映射
const statusMap = {
  processing: {
    label: '分析中',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    icon: <Clock size={14} />,
  },
  completed: {
    label: '已完成',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: <CheckCircle size={14} />,
  },
};

export const ReportsModule: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 5;

  // 从后端获取报告列表（合并旧球探报告 + 视频分析报告）
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scoutRes, videoRes] = await Promise.allSettled([
          api.get('/reports/my?page=1&pageSize=100'),
          api.get('/video-analysis/my?page=1&pageSize=100'),
        ]);

        const allReports: Report[] = [];

        // 处理旧球探报告
        if (scoutRes.status === 'fulfilled' && scoutRes.value.data.success) {
          const result = scoutRes.value.data.data?.data || scoutRes.value.data.data || {};
          const backendReports: BackendReport[] = result.list || [];
          allReports.push(
            ...backendReports.map((report) => ({
              id: report.report_no || String(report.id),
              orderId: report.order_id ? String(report.order_id) : '-',
              title: report.title || `报告 #${report.report_no || report.id}`,
              status: report.status,
              createdAt: report.created_at,
              completedAt: report.completed_at,
              downloadUrl: report.pdf_url,
              previewUrl: report.pdf_url,
              reportType: 'scout' as ReportType,
            }))
          );
        }

        // 处理视频分析报告
        if (videoRes.status === 'fulfilled' && videoRes.value.data.success) {
          const result = videoRes.value.data.data || {};
          const videoAnalyses: BackendVideoAnalysis[] = result.list || [];
          allReports.push(
            ...videoAnalyses.map((va) => ({
              id: `VA-${va.id}`,
              orderId: String(va.order_id),
              title: `${va.player_name || '未知球员'} - ${va.match_name || '比赛视频分析'}`,
              status: (va.status === 'completed' || va.ai_report_status === 'confirmed') ? 'completed' : ('processing' as ReportStatus),
              createdAt: va.created_at,
              completedAt: va.updated_at,
              reportType: 'video_analysis' as ReportType,
              playerName: va.player_name,
              playerAge: va.player_age,
              playerPosition: va.player_position,
              matchName: va.match_name,
              opponent: va.opponent,
              overallScore: va.overall_score,
              potentialLevel: va.potential_level,
              aiReport: va.ai_report,
            }))
          );
        }

        // 按创建时间倒序排列
        allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReports(allReports);
      } catch (err: any) {
        setError(err.response?.data?.error || '获取报告列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 时间筛选函数
  const filterByTime = (report: Report, timeFilter: string) => {
    if (timeFilter === 'all') return true;

    const now = new Date();
    const reportDate = new Date(report.createdAt);

    switch (timeFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reportDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return reportDate >= monthAgo;
      case 'threemonths':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return reportDate >= threeMonthsAgo;
      default:
        return true;
    }
  };

  // 过滤和搜索报告
  const filteredReports = reports.filter((report) => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesTime = filterByTime(report, filterTime);
    const matchesType = filterType === 'all' || report.reportType === filterType;
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.playerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.matchName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesTime && matchesType && matchesSearch;
  });

  // 分页
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 下载报告
  const handleDownload = (report: Report) => {
    if (report.reportType === 'video_analysis' && report.aiReport) {
      const blob = new Blob([report.aiReport], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }
    if (report.downloadUrl) {
      const link = document.createElement('a');
      link.href = report.downloadUrl;
      link.download = `${report.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 预览报告
  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setIsPreviewModalOpen(true);
  };

  // 关闭预览弹窗
  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setSelectedReport(null);
  };

  // 删除报告
  const handleDeleteReport = (reportId: string) => {
    if (confirm('确定要删除这份报告吗？此操作不可恢复。')) {
      setReports((prev) => prev.filter((report) => report.id !== reportId));
    }
  };

  // 将 Markdown 简单转换为 HTML（用于视频分析报告预览）
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return '';
    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
      .replace(/^\*\*(.*)\*\*(.*$)/gim, '<strong>$1</strong>$2')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">全部报告</p>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">分析中</p>
              <p className="text-2xl font-bold text-purple-400">
                {reports.filter((r) => r.status === 'processing').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Clock className="text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">已完成</p>
              <p className="text-2xl font-bold text-green-400">
                {reports.filter((r) => r.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部状态</option>
            <option value="processing">分析中</option>
            <option value="completed">已完成</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部类型</option>
            <option value="video_analysis">视频分析</option>
            <option value="scout">球探报告</option>
          </select>
          <Calendar className="text-gray-400" size={20} />
          <select
            value={filterTime}
            onChange={(e) => {
              setFilterTime(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39ff14]"
          >
            <option value="all">全部时间</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="threemonths">三个月</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索报告标题、球员姓名或比赛名称..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#111827] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#39ff14]"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <ListItemSkeleton count={4} />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-[#1a1f2e] rounded-xl border border-red-800/50 p-6 text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* Reports List */}
      {!loading && !error && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
          {paginatedReports.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {paginatedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 hover:bg-[#252b3d] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">
                          {report.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            statusMap[report.status].color
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {statusMap[report.status].icon}
                            {statusMap[report.status].label}
                          </span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            report.reportType === 'video_analysis'
                              ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                              : 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                          }`}
                        >
                          {report.reportType === 'video_analysis' ? '视频分析' : '球探报告'}
                        </span>
                      </div>

                      {report.reportType === 'video_analysis' && (
                        <div className="flex items-center gap-3 mb-2 flex-wrap text-sm">
                          {report.overallScore !== undefined && (
                            <span className="px-2 py-1 rounded bg-gray-800 text-white">
                              综合评分: <span className="text-[#39ff14] font-bold">{report.overallScore}</span>
                            </span>
                          )}
                          {report.potentialLevel && (
                            <span className="px-2 py-1 rounded bg-gray-800 text-white">
                              潜力: <span className="text-[#00d4ff] font-bold">{report.potentialLevel}</span>
                            </span>
                          )}
                          {report.playerAge && (
                            <span className="text-gray-400">{report.playerAge}岁</span>
                          )}
                          {report.playerPosition && (
                            <span className="text-gray-400">{report.playerPosition}</span>
                          )}
                          {report.opponent && (
                            <span className="text-gray-400">vs {report.opponent}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span>报告号: {report.id}</span>
                        <span>•</span>
                        <span>订单号: {report.orderId}</span>
                        <span>•</span>
                        <span>
                          创建时间:{' '}
                          {new Date(report.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {report.completedAt && (
                          <>
                            <span>•</span>
                            <span>
                              完成时间:{' '}
                              {new Date(report.completedAt).toLocaleString('zh-CN')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {report.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handlePreview(report)}
                            className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-all flex items-center gap-2"
                          >
                            <Eye size={16} />
                            预览
                          </button>
                          {report.reportType === 'video_analysis' ? (
                            <button
                              onClick={() => handleDownload(report)}
                              className="px-3 py-2 bg-gradient-to-r from-[#00d4ff] to-[#3b82f6] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#00d4ff]/30 transition-all flex items-center gap-2"
                            >
                              <Download size={16} />
                              下载
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDownload(report)}
                              className="px-3 py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2"
                            >
                              <Download size={16} />
                              下载PDF
                            </button>
                          )}
                        </>
                      )}
                      {report.status === 'processing' && (
                        <div className="flex items-center gap-2 text-purple-400">
                          <Clock size={16} className="animate-pulse" />
                          <span className="text-sm">分析中...</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="px-3 py-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="删除报告"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? '没有找到匹配的报告'
                  : '暂无报告'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? '请尝试调整搜索条件或筛选条件'
                  : '完成视频分析后，报告将显示在这里'}
              </p>
              {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
                <button className="px-6 py-3 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2 mx-auto">
                  <FileText size={20} />
                  去上传视频
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#1a1f2e] rounded-xl border border-gray-800 p-4">
          <p className="text-gray-500 text-sm">
            显示第 {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredReports.length)} 条，共{' '}
            {filteredReports.length} 条
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              上一页
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{selectedReport.title}</h2>
                <p className="text-gray-500 text-sm mt-1">报告号: {selectedReport.id}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownload(selectedReport)}
                  className="px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  {selectedReport.reportType === 'video_analysis' ? '下载报告' : '下载PDF'}
                </button>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedReport.reportType === 'video_analysis' && selectedReport.aiReport ? (
                <div className="bg-white rounded-lg p-8 min-h-[600px]">
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(renderMarkdown(selectedReport.aiReport)),
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 min-h-[600px]">
                  {/* Report Header */}
                  <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      青少年足球技术分析报告
                    </h1>
                    <p className="text-gray-600">{selectedReport.title}</p>
                    <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
                      <span>报告号: {selectedReport.id}</span>
                      <span>|</span>
                      <span>订单号: {selectedReport.orderId}</span>
                    </div>
                  </div>

                  {/* Report Content Placeholder */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">报告摘要</h3>
                      <p className="text-gray-600 leading-relaxed">
                        本报告基于对球员比赛视频的深度分析，从技术能力、战术理解、
                        身体素质等多个维度进行全面评估。通过AI智能分析系统，
                        为球员提供个性化的技术指导和发展建议。
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">分析维度</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {['技术能力', '战术理解', '身体素质', '心理素质'].map((item) => (
                          <div key={item} className="bg-white rounded-lg p-3 border border-gray-200">
                            <span className="text-gray-700 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">技术统计</h3>
                      <p className="text-gray-500 text-center py-8">
                        [详细的技术统计数据和图表将在完整PDF报告中展示]
                      </p>
                    </div>
                  </div>

                  {/* Report Footer */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-500">
                    <p>少年球探 - 青少年足球技术分析平台</p>
                    <p className="mt-1">
                      报告生成时间: {new Date().toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
