import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { analystApi, reportApi } from '../../services/api';
import type { Order, Report } from '../../types';
import { toast } from 'sonner';
import { 
  Calendar,
  Video,
  FileText,
  User,
  Search,
  Filter,
  ChevronDown,
  RotateCcw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Download,
  Copy
} from 'lucide-react';

interface HistoryOrdersProps {
  onViewReport: (order: Order) => void;
}

interface FilterState {
  timeRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
  orderType: 'all' | 'text' | 'video';
  status: 'all' | 'completed' | 'cancelled';
}

const HistoryOrders: React.FC<HistoryOrdersProps> = ({ onViewReport }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    timeRange: 'all',
    orderType: 'all',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [copyingId, setCopyingId] = useState<number | null>(null);
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistoryOrders();
  }, [currentPage, filters]);

  const loadHistoryOrders = async () => {
    setLoading(true);
    try {
      // 计算时间范围
      let startDate = '', endDate = '';
      if (filters.timeRange !== 'all') {
        const now = new Date();
        const days = { week: 7, month: 30, quarter: 90, year: 365 }[filters.timeRange];
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        startDate = start.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      }

      const response = await analystApi.getHistoryOrders({
        page: currentPage,
        pageSize,
        status: filters.status === 'all' ? '' : filters.status,
        order_type: filters.orderType === 'all' ? '' : filters.orderType,
        startDate,
        endDate,
        keyword: searchQuery.trim()
      });
      if (response.data?.success && response.data?.data) {
        setOrders(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('加载历史订单失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 后端已完成筛选和分页
  const paginatedOrders = orders;
  const totalPages = Math.ceil(total / pageSize);

  const getOrderTypeBadge = (type: OrderType) => {
    if (type === 'video') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Video className="w-3 h-3 mr-1" />
          视频版
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <FileText className="w-3 h-3 mr-1" />
        文字版
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            已完成
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            已取消
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      timeRange: 'all',
      orderType: 'all',
      status: 'all'
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.timeRange !== 'all' || filters.orderType !== 'all' || filters.status !== 'all' || searchQuery.trim() !== '';

  const handleCopyAsNewReport = async (order: Order) => {
    setCopyingId(order.id);
    try {
      let report: Report | null = order.report || null;
      const reportId = order.report?.id || (order as any).report_id;
      if (!report && reportId) {
        const res = await reportApi.getReportDetail(reportId);
        if (res.data?.success && res.data?.data) {
          report = res.data.data.report || res.data.data || null;
        }
      }

      // 计算年龄
      let playerAge = order.player_age || 12;
      if (report?.player_birth_date) {
        const birth = new Date(report.player_birth_date);
        const now = new Date();
        playerAge = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
          playerAge--;
        }
      }

      const draft = {
        title: report?.title ? `${report.title}（副本）` : `${order.player_name || '未知球员'} - 分析报告`,
        playerName: report?.player_name || order.player_name || '',
        playerAge,
        position: report?.player_position || order.player_position || '',
        content: report?.content || '',
        rating: report?.rating || 0,
        price: report?.price || order.amount || 0,
        coverImage: report?.cover_image || '',
      };

      localStorage.setItem('report_new_draft', JSON.stringify(draft));
      toast.success('已复制报告框架，正在跳转...');
      navigate('/analyst/reports/new');
    } catch (err) {
      toast.error('复制报告失败，请重试');
    } finally {
      setCopyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">历史订单</h3>
          <p className="text-sm text-gray-500 mt-1">
            共 {total} 条记录
            {hasActiveFilters && <span className="text-blue-600 ml-1">（已筛选）</span>}
          </p>
        </div>
        <button
          onClick={loadHistoryOrders}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、球员姓名、比赛名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {[filters.timeRange, filters.orderType, filters.status].filter(f => f !== 'all').length + (searchQuery ? 1 : 0)}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* 筛选选项 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 时间范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
              <select
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部时间</option>
                <option value="week">最近7天</option>
                <option value="month">最近30天</option>
                <option value="quarter">最近90天</option>
                <option value="year">最近一年</option>
              </select>
            </div>
            
            {/* 订单类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">订单类型</label>
              <select
                value={filters.orderType}
                onChange={(e) => handleFilterChange('orderType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部类型</option>
                <option value="text">文字版</option>
                <option value="video">视频版</option>
              </select>
            </div>
            
            {/* 订单状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">订单状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        )}

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清除全部筛选
            </button>
          </div>
        )}
      </div>

      {/* 订单列表 */}
      {paginatedOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无历史订单</h3>
          <p className="text-gray-500">
            {hasActiveFilters ? '尝试调整筛选条件' : '完成的订单将显示在这里'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* 左侧信息 */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
                    {getOrderTypeBadge(order.order_type)}
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{order.player_name}</span>
                      <span className="text-sm text-gray-500">
                        ({order.player_age}岁 | {order.player_position})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.match_name} vs {order.opponent}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Video className="w-3 h-3" />
                      视频时长: {formatDuration(order.video_duration)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {order.status === 'completed' ? '完成时间' : '取消时间'}: 
                      {formatDate(order.completed_at || order.cancelled_at)}
                    </div>
                    {order.cancel_reason && (
                      <div className="text-red-500">
                        原因: {order.cancel_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* 右侧操作 */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">订单金额</p>
                    <p className="font-semibold text-gray-900">¥{order.amount}</p>
                  </div>
                  {order.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyAsNewReport(order)}
                        disabled={copyingId === order.id}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {copyingId === order.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        复制为新报告
                      </button>
                      <button
                        onClick={() => onViewReport(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        查看报告
                      </button>
                      <div className="relative group">
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                          <Download className="w-4 h-4" />
                          下载文档
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                          <button
                            onClick={() => window.open(analystApi.getDownloadUrl(order.id, 'rating'), '_blank')}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-green-600" />
                            评分报告.md
                          </button>
                          <button
                            onClick={() => window.open(analystApi.getDownloadUrl(order.id, 'player-info'), '_blank')}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-blue-600" />
                            球员基础信息.md
                          </button>
                        </div>
                      </div>
                      {/* AI 分析报告下载（自动生成或管理员上传） */}
                      {(order.report?.ai_report_url || order.report?.ai_video_url) && (
                        <div className="relative group">
                          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                            <Download className="w-4 h-4" />
                            AI 报告
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                            {order.report?.ai_report_url && (
                              <button
                                onClick={() => window.open(analystApi.getAIReportUrl(order.id, 'report'), '_blank')}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-orange-600" />
                                下载分析报告.docx
                              </button>
                            )}
                            {order.report?.ai_video_url && (
                              <button
                                onClick={() => window.open(analystApi.getAIReportUrl(order.id, 'video'), '_blank')}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
                              >
                                <Video className="w-4 h-4 text-purple-600" />
                                视频分析
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div className="px-4 py-2 text-red-600 bg-red-50 rounded-lg text-sm">
                      已取消
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm text-gray-500">
            显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryOrders;
