import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../services/api';
import type { User } from '../../types';
import { Loading } from '../../components';
import { Users as UsersIcon, User as UserIcon, Phone, CheckCircle, Edit3, Ban } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.listUsers();
      if (response.data?.success && response.data?.data) {
        setUsers(response.data.data.list || []);
      }
    } catch (error) {
      console.error('加载用户失败', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'analyst': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'club': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'coach': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'scout': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'analyst': return '分析师';
      case 'club': return '俱乐部';
      case 'coach': return '教练';
      case 'scout': return '球探';
      default: return '用户';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'inactive': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '正常';
      case 'inactive': return '禁用';
      default: return '待验证';
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      setUsers(users.map(item => item.id === user.id ? { ...item, status: nextStatus } : item));
      toast.success(nextStatus === 'active' ? '用户已启用' : '用户已禁用');
    } catch (error) {
      console.error('更新用户状态失败', error);
      toast.error('更新用户状态失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-blue-400" /> 用户管理
        </h2>
        <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-slate-400 rounded-full text-sm">
          共 {users.length} 人
        </span>
      </div>

      {users.length > 0 ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-slate-400">
                  <th className="pb-3 pt-4 px-6">ID</th>
                  <th className="pb-3 pt-4 px-6">昵称</th>
                  <th className="pb-3 pt-4 px-6">手机号</th>
                  <th className="pb-3 pt-4 px-6">角色</th>
                  <th className="pb-3 pt-4 px-6">状态</th>
                  <th className="pb-3 pt-4 px-6">注册时间</th>
                  <th className="pb-3 pt-4 px-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-mono text-sm text-slate-400">{user.id}</td>
                    <td className="py-4 px-6 text-white">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        {user.nickname || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusStyle(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toast.info(`用户 ${user.id} 编辑功能待接入`)}
                          className="flex items-center gap-1 px-3 py-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors text-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> 编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            user.status === 'active'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {user.status === 'active' ? '禁用' : '启用'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl p-12 border border-white/[0.06] text-center">
          <UsersIcon className="w-12 h-12 text-slate-500/30 mx-auto mb-4" />
          <p className="text-slate-400">暂无用户数据</p>
        </div>
      )}
    </div>
  );
};

export default Users;
