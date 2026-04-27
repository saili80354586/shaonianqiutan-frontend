import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { adminApi } from '../services/api';
import { Loading } from '../components';
import { Search, Filter, Eye, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.listUsers(currentPage, pageSize);
      if (response.success && response.data) {
        let filteredUsers = response.data.list;
        
        // 状态筛选
        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
        }
        
        // 搜索筛选
        if (searchQuery) {
          filteredUsers = filteredUsers.filter(u => 
            (u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            u.phone?.includes(searchQuery)
          );
        }
        
        setUsers(filteredUsers);
        setTotalUsers(response.data.total);
      }
    } catch (error) {
      console.error('加载用户列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? '启用' : '禁用';
    
    if (!window.confirm(`确定要${actionText}用户 "${user.nickname || user.phone}" 吗？`)) {
      return;
    }

    try {
      await adminApi.updateUserStatus(user.id.toString(), newStatus);
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      alert(`${actionText}成功`);
    } catch (error) {
      console.error(`${actionText}失败`, error);
      alert(`${actionText}失败`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`确定要删除用户 "${user.nickname || user.phone}" 吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await adminApi.deleteUser(user.id.toString());
      setUsers(users.filter(u => u.id !== user.id));
      alert('删除成功');
    } catch (error) {
      console.error('删除失败', error);
      alert('删除失败');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { text: string; className: string }> = {
      admin: { text: '管理员', className: 'bg-purple-100 text-purple-800' },
      analyst: { text: '分析师', className: 'bg-blue-100 text-blue-800' },
      user: { text: '用户', className: 'bg-gray-100 text-gray-800' },
    };
    const { text, className } = roleMap[role] || { text: role, className: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${className}`}>{text}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: '正常', className: 'bg-green-100 text-green-800' },
      inactive: { text: '禁用', className: 'bg-red-100 text-red-800' },
      pending: { text: '待验证', className: 'bg-yellow-100 text-yellow-800' },
    };
    const { text, className } = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${className}`}>{text}</span>;
  };

  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <div className="text-sm text-gray-500">
          共 {totalUsers} 位用户
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索昵称或手机号..."
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
              <option value="pending">待验证</option>
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

      {/* 用户列表 */}
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
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手机号</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              src={user.avatar || '/images/default-avatar.jpg'}
                              alt={user.nickname || '用户'}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{user.nickname || '未设置昵称'}</div>
                              <div className="text-sm text-gray-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.status === 'active' 
                                  ? 'text-red-600 hover:bg-red-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.status === 'active' ? '禁用' : '启用'}
                            >
                              {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
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
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        暂无用户数据
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

      {/* 用户详情弹窗 */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">用户详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center mb-6">
              <img
                src={selectedUser.avatar || '/images/default-avatar.jpg'}
                alt={selectedUser.nickname || '用户'}
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-semibold text-lg">{selectedUser.nickname || '未设置昵称'}</h4>
                <p className="text-gray-500">{selectedUser.phone}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">用户ID</span>
                <span className="font-medium">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">角色</span>
                {getRoleBadge(selectedUser.role)}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">状态</span>
                {getStatusBadge(selectedUser.status)}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">注册时间</span>
                <span>{new Date(selectedUser.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {selectedUser.name && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">真实姓名</span>
                  <span>{selectedUser.name}</span>
                </div>
              )}
              {selectedUser.position && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">位置</span>
                  <span>{selectedUser.position}</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  handleToggleStatus(selectedUser);
                  setShowDetailModal(false);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  selectedUser.status === 'active'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {selectedUser.status === 'active' ? '禁用用户' : '启用用户'}
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;