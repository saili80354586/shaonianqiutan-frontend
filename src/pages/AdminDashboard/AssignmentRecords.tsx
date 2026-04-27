import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import type { OrderAssignment, AssignmentStatus } from '../../types';
import { 
  Clock, 
  User, 
  RotateCcw, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Filter,
  Search,
  Send,
  Ban
} from 'lucide-react';

const AssignmentRecords: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<OrderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadAssignments();
  }, [filterStatus, page]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAssignmentRecords({
        page,
        pageSize: 10,
        status: filterStatus === 'all' ? undefined : filterStatus
      });
      if (response.success && response.data) {
        setAssignments(response.data.list);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('加载派发记录失败', error);
      // 使用模拟数据
      setAssignments([
        {
          id: 1,
          order_id: 101,
          analyst_id: 1,
          assigned_by: 1,
          assigned_at: '2026-04-03T11:00:00Z',
          status: 'accepted',
          responded_at: '2026-04-03T11:15:00Z',
          order: {
            id: 101,
            order_no: 'ORD20250403001',
            user_id: 101,
            amount: 799,
            status: 'accepted',
            order_type: 'video',
            player_name: '陈浩然',
            player_position: '右边锋',
            created_at: '2026-04-03T10:30:00Z',
            updated_at: '2026-04-03T11:15:00Z'
          },
          analyst: { id: 1, phone: '138****1111', nickname: '张分析师', role: 'analyst', status: 'active', created_at: '', updated_at: '' }
        },
        {
          id: 2,
          order_id: 102,
          analyst_id: 2,
          assigned_by: 1,
          assigned_at: '2026-04-03T10:00:00Z',
          status: 'pending',
          order: {
            id: 102,
            order_no: 'ORD20250403002',
            user_id: 102,
            amount: 299,
            status: 'assigned',
            order_type: 'text',
            player_name: '王小明',
            player_position: '中场',
            created_at: '2026-04-03T09:15:00Z',
            updated_at: '2026-04-03T10:00:00Z'
          },
          analyst: { id: 2, phone: '139****2222', nickname: '李分析师', role: 'analyst', status: 'active', created_at: '', updated_at: '' }
        },
        {
          id: 3,
          order_id: 103,
          analyst_id: 3,
          assigned_by: 1,
          assigned_at: '2026-04-02T17:00:00Z',
          status: 'rejected',
          rejected_reason: '当前工作量已满，无法接单',
          responded_at: '2026-04-02T17:30:00Z',
          order: {
            id: 103,
            order_no: 'ORD20250402003',
            user_id: 103,
            amount: 799,
            status: 'paid',
            order_type: 'video',
            player_name: '李天翼',
            player_position: '守门员',
            created_at: '2026-04-02T16:45:00Z',
            updated_at: '2026-04-02T17:30:00Z'
          },
          analyst: { id: 3, phone: '137****3333', nickname: '王分析师', role: 'analyst', status: 'active', created_at: '', updated_at: '' }
        }
      ]);
      setTotal(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (assignment: OrderAssignment) => {
    if (!window.confirm('确定要重新派发此订单吗？')) return;
    
    try {
      // 先取消当前派发
      await adminApi.cancelAssignment(assignment.order_id.toString());
      // 重新加载列表
      loadAssignments();
      alert('订单已取消派发，请前往"待派发"页面重新指派分析师');
    } catch (error) {
      console.error('重新派发失败', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            待响应
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            已接单
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            已拒绝
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            已过期
          </span>
        );
      default:
        return null;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        assignment.order?.order_no.toLowerCase().includes(query) ||
        assignment.order?.player_name?.toLowerCase().includes(query) ||
        assignment.analyst?.nickname?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getResponseTime = (assignedAt: string, respondedAt?: string) => {
    if (!respondedAt) {
      const hours = (new Date().getTime() - new Date(assignedAt).getTime()) / (1000 * 60 * 60);
      if (hours > 24) return '超过24小时未响应';
      return `等待响应 ${Math.floor(hours)}小时`;
    }
    const diff = new Date(respondedAt).getTime() - new Date(assignedAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${minutes}分钟响应`;
    const hours = Math.floor(minutes / 60);
    return `${hours}小时${minutes % 60}分钟响应`;
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders/dispatch')}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            返回
          </button>
          <h2 className="text-xl font-bold text-white">派发记录</h2>
        </div>
        <button
          onClick={loadAssignments}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">总派发记录</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">待响应</p>
          <p className="text-2xl font-bold text-yellow-600">
            {assignments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">已接单</p>
          <p className="text-2xl font-bold text-green-600">
            {assignments.filter(a => a.status === 'accepted').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">已拒绝</p>
          <p className="text-2xl font-bold text-red-600">
            {assignments.filter(a => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">状态:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部</option>
              <option value="pending">待响应</option>
              <option value="accepted">已接单</option>
              <option value="rejected">已拒绝</option>
              <option value="expired">已过期</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索订单号、球员姓名或分析师..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无记录</h3>
            <p className="text-gray-500">没有找到符合条件的派发记录</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* 左侧信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-gray-500">
                        {assignment.order?.order_no}
                      </span>
                      {getStatusBadge(assignment.status)}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        assignment.order?.order_type === 'video' 
                          ? 'bg-purple-100 text-purple-700' 
                          : assignment.order?.order_type === 'pro'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.order?.order_type === 'video' ? '视频版' : assignment.order?.order_type === 'pro' ? '文字+视频版' : '文字版'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {assignment.order?.player_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({assignment.order?.player_position})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-700">
                          分析师: {assignment.analyst?.nickname}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>派发时间: {new Date(assignment.assigned_at).toLocaleString('zh-CN')}</span>
                      <span className={
                        assignment.status === 'pending' ? 'text-orange-600' : 'text-gray-500'
                      }>
                        {getResponseTime(assignment.assigned_at, assignment.responded_at)}
                      </span>
                    </div>

                    {assignment.rejected_reason && (
                      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <Ban className="w-4 h-4 mt-0.5" />
                        <span>拒绝原因: {assignment.rejected_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* 右侧操作 */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ¥{assignment.order?.amount}
                      </p>
                      <p className="text-xs text-gray-500">订单金额</p>
                    </div>
                    {assignment.status === 'rejected' && (
                      <button
                        onClick={() => handleReassign(assignment)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        重新派发
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && filteredAssignments.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {total} 条记录，第 {page} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={filteredAssignments.length < 10}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentRecords;
