import React, { useEffect, useState } from 'react';
import type { User, AnalystApplication } from '../types';
import { adminApi, analystApplicationApi, unwrapApiResponse } from '../services/api';
import { Loading } from '../components';
import { Search, Filter, Eye, CheckCircle, XCircle, Ban, Trash2, ChevronLeft, ChevronRight, Star, Briefcase } from 'lucide-react';

const AnalystManagement: React.FC = () => {
  const [analysts, setAnalysts] = useState<User[]>([]);
  const [applications, setApplications] = useState<AnalystApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysts' | 'applications'>('analysts');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAnalysts, setTotalAnalysts] = useState(0);
  const [selectedItem, setSelectedItem] = useState<User | AnalystApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [auditRemark, setAuditRemark] = useState('');
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'analysts') {
      loadAnalysts();
    } else {
      loadApplications();
    }
  }, [currentPage, statusFilter, activeTab]);

  const loadAnalysts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.listAnalysts(currentPage, pageSize, statusFilter === 'all' ? '' : statusFilter);
      const body = unwrapApiResponse(response);
      if (body.success && body.data) {
        let filteredAnalysts: User[] = body.data.list || [];
        
        if (searchQuery) {
          filteredAnalysts = filteredAnalysts.filter((a: User) =>
            (a.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            a.phone?.includes(searchQuery) ||
            (a.analyst?.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
          );
        }
        
        setAnalysts(filteredAnalysts);
        setTotalAnalysts(body.data.total);
      }
    } catch (error) {
      console.error('加载分析师列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await analystApplicationApi.listApplications(currentPage, pageSize, 'pending');
      const body = unwrapApiResponse(response);
      if (body.success && body.data) {
        setApplications(body.data.list);
      }
    } catch (error) {
      console.error('加载申请列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (activeTab === 'analysts') {
      loadAnalysts();
    }
  };

  const handleViewDetail = (item: User | AnalystApplication) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setAuditRemark('');
  };

  const handleToggleStatus = async (analyst: User) => {
    const newStatus = analyst.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '禁用';
    
    if (!window.confirm(`确定要${actionText}分析师 "${analyst.nickname || analyst.name || analyst.phone}" 吗？`)) {
      return;
    }

    try {
      await adminApi.updateAnalystStatus(analyst.id, newStatus);
      setAnalysts(analysts.map(a => a.id === analyst.id ? { ...a, status: newStatus } : a));
      alert(`${actionText}成功`);
    } catch (error) {
      console.error(`${actionText}失败`, error);
      alert(`${actionText}失败`);
    }
  };

  const handleAuditApplication = async (application: AnalystApplication, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !auditRemark.trim()) {
      alert('请输入拒绝原因');
      return;
    }
    
    const actionText = status === 'approved' ? '通过' : '拒绝';
    if (!window.confirm(`确定要${actionText}该分析师申请吗？`)) {
      return;
    }

    try {
      await analystApplicationApi.reviewApplication(application.id.toString(), status, auditRemark);
      setApplications(applications.filter(a => a.id !== application.id));
      alert(`已${actionText}该申请`);
      setShowDetailModal(false);
    } catch (error) {
      console.error('审核失败', error);
      alert('审核失败');
    }
  };

  const handleDeleteAnalyst = async (analyst: User) => {
    if (!window.confirm(`确定要删除分析师 "${analyst.nickname || analyst.name || analyst.phone}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await adminApi.deleteUser(analyst.id);
      setAnalysts(analysts.filter(a => a.id !== analyst.id));
      alert('删除成功');
    } catch (error) {
      console.error('删除失败', error);
      alert('删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: '正常', className: 'bg-green-100 text-green-800' },
      inactive: { text: '禁用', className: 'bg-red-100 text-red-800' },
      pending: { text: '待审核', className: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '已通过', className: 'bg-blue-100 text-blue-800' },
      rejected: { text: '已拒绝', className: 'bg-gray-100 text-gray-800' },
    };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${className}`}>{text}</span>;
  };

  const isAnalystUser = (item: User | AnalystApplication): item is User => 'role' in item;

  const totalPages = Math.ceil(totalAnalysts / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分析师管理</h1>
        <div className="flex gap-4">
          <button
            onClick={() => { setActiveTab('analysts'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'analysts'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            分析师列表
          </button>
          <button
            onClick={() => { setActiveTab('applications'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            入驻申请
            {applications.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {applications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'analysts' && (
        <>
          {/* 搜索和筛选 */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索姓名或专业领域..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </div>

          {/* 分析师列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8">
                <Loading />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分析师</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">专业领域</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接单量</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analysts.length > 0 ? (
                        analysts.map((analyst) => (
                          <tr key={analyst.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <img
                                  src={analyst.avatar || '/images/default-avatar.jpg'}
                                  alt={analyst.nickname || analyst.name || '分析师'}
                                  className="w-10 h-10 rounded-full object-cover mr-3"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{analyst.nickname || analyst.name || '未命名'}</div>
                                  <div className="text-sm text-gray-500">{analyst.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {analyst.analyst?.specialty || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="font-medium">{analyst.analyst?.rating?.toFixed(1) || '0.0'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {analyst.analyst?.order_count || 0}
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(analyst.status)}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(analyst.created_at).toLocaleDateString('zh-CN')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewDetail(analyst)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="查看详情"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(analyst)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    analyst.status === 'active' 
                                      ? 'text-red-600 hover:bg-red-50' 
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={analyst.status === 'active' ? '禁用' : '启用'}
                                >
                                  {analyst.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteAnalyst(analyst)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            暂无分析师数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      第 {currentPage} 页，共 {totalPages} 页
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8">
              <Loading />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
                          <span className="ml-3 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            待审核
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="text-gray-400">手机号：</span>
                            {app.phone}
                          </div>
                          <div>
                            <span className="text-gray-400">邮箱：</span>
                            {app.email}
                          </div>
                          <div>
                            <span className="text-gray-400">申请时间：</span>
                            {new Date(app.created_at).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">经验说明：</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{app.experience}</p>
                        </div>
                        {app.resume && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">简历附件：</p>
                            <a 
                              href={app.resume} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              查看简历
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-6">
                        <button
                          onClick={() => handleViewDetail(app)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => handleAuditApplication(app, 'approved')}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleViewDetail(app)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500">
                  暂无待审核申请
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 详情弹窗 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {isAnalystUser(selectedItem) ? '分析师详情' : '申请详情'}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {isAnalystUser(selectedItem) ? (
              // 分析师详情
              <>
                <div className="flex items-center mb-6">
                  <img
                    src={selectedItem.avatar || '/images/default-avatar.jpg'}
                    alt={selectedItem.nickname || selectedItem.name || '分析师'}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-lg">{selectedItem.nickname || selectedItem.name || '未命名'}</h4>
                    <p className="text-gray-500">{selectedItem.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">专业领域</span>
                    <span>{selectedItem.analyst?.specialty || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">评分</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{selectedItem.analyst?.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">接单量</span>
                    <span>{selectedItem.analyst?.order_count || 0}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">状态</span>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">注册时间</span>
                    <span>{new Date(selectedItem.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      handleToggleStatus(selectedItem as User);
                      setShowDetailModal(false);
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      selectedItem.status === 'active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedItem.status === 'active' ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </>
            ) : (
              // 申请详情
              <>
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-2">{selectedItem.name}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="text-gray-400">手机号：</span>{selectedItem.phone}</p>
                    <p><span className="text-gray-400">邮箱：</span>{selectedItem.email}</p>
                    <p><span className="text-gray-400">申请时间：</span>{new Date(selectedItem.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">经验说明：</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedItem.experience}</p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    审核备注（拒绝时必填）
                  </label>
                  <textarea
                    value={auditRemark}
                    onChange={(e) => setAuditRemark(e.target.value)}
                    placeholder="请输入审核备注或拒绝原因..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAuditApplication(selectedItem as AnalystApplication, 'approved')}
                    className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                  >
                    通过申请
                  </button>
                  <button
                    onClick={() => handleAuditApplication(selectedItem as AnalystApplication, 'rejected')}
                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    拒绝申请
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystManagement;
