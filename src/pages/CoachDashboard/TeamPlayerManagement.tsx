import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Users, UserPlus, Loader2 } from 'lucide-react';
import { coachApi } from '../../services/club';
import { TableSkeleton } from '../../components/ui/loading';

interface Player {
  id: number;
  userId?: number;
  name: string;
  nickname?: string;
  avatar?: string;
  position: string;
  jerseyNumber?: string;
  status: string;
  joinedAt?: string;
  phone?: string;
}

interface TeamPlayerManagementProps {
  teamId: number;
  teamName: string;
  onBack: () => void;
}

const positionOptions = ['前锋', '中场', '后卫', '门将', '未知'];
const statusOptions = ['active', 'inactive', 'transferred'];

const TeamPlayerManagement: React.FC<TeamPlayerManagementProps> = ({ teamId, teamName, onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // 添加球员表单
  const [addForm, setAddForm] = useState({
    phone: '',
    name: '',
    position: '前锋',
    jerseyNumber: '',
    age: '',
    gender: 'male',
  });

  // 编辑球员表单
  const [editForm, setEditForm] = useState({
    name: '',
    position: '',
    jerseyNumber: '',
    status: 'active',
  });

  useEffect(() => {
    loadPlayers();
  }, [teamId]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await coachApi.getTeamPlayers(teamId);
      if (res.data?.success && res.data?.data) {
        setPlayers(res.data.data);
      }
    } catch (error) {
      console.error('获取球员列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!addForm.phone || !addForm.name) {
      alert('请填写手机号和姓名');
      return;
    }
    setSubmitting(true);
    try {
      const res = await coachApi.addPlayer(teamId, {
        phone: addForm.phone,
        name: addForm.name,
        position: addForm.position,
        jerseyNumber: addForm.jerseyNumber,
        gender: addForm.gender,
      });
      if (res.data?.success) {
        setShowAddModal(false);
        setAddForm({ phone: '', name: '', position: '前锋', jerseyNumber: '', age: '', gender: 'male' });
        await loadPlayers();
      } else {
        alert(res.data?.message || '添加失败');
      }
    } catch (error: any) {
      alert(error.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;
    setSubmitting(true);
    try {
      const res = await coachApi.updatePlayer(teamId, editingPlayer.id, {
        name: editForm.name,
        position: editForm.position,
        jerseyNumber: editForm.jerseyNumber,
        status: editForm.status,
      });
      if (res.data?.success) {
        setShowEditModal(false);
        setEditingPlayer(null);
        await loadPlayers();
      } else {
        alert(res.data?.message || '更新失败');
      }
    } catch (error: any) {
      alert(error.message || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    if (!confirm(`确定要从球队移除球员 ${player.name} 吗？`)) return;
    try {
      const res = await coachApi.removePlayer(teamId, player.id);
      if (res.data?.success) {
        await loadPlayers();
      } else {
        alert(res.data?.message || '移除失败');
      }
    } catch (error: any) {
      alert(error.message || '移除失败');
    }
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      position: player.position,
      jerseyNumber: player.jerseyNumber || '',
      status: player.status,
    });
    setShowEditModal(true);
  };

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPosition = positionFilter === 'all' || p.position === positionFilter;
    return matchSearch && matchPosition;
  });

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = {
      '前锋': 'bg-red-500/20 text-red-300',
      '中场': 'bg-blue-500/20 text-blue-300',
      '后卫': 'bg-green-500/20 text-green-300',
      '门将': 'bg-yellow-500/20 text-yellow-300',
    };
    return map[pos] || 'bg-gray-500/20 text-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'active': '在队',
      'inactive': '离队',
      'transferred': '已转会',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'active': 'bg-green-500/20 text-green-400',
      'inactive': 'bg-gray-500/20 text-gray-400',
      'transferred': 'bg-orange-500/20 text-orange-400',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{teamName} - 球员管理</h1>
            <p className="text-gray-400 text-sm mt-1">共 {players.length} 名球员</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" /> 添加球员
        </button>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索球员姓名..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">全部位置</option>
          {positionOptions.filter(p => p !== '未知').map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>

      {/* 球员列表 */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">暂无球员</h3>
          <p className="text-gray-500">点击上方按钮添加球员</p>
        </div>
      ) : (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">球员</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">位置</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">球衣号</th>
                <th className="text-left px-6 py-4 text-gray-400 text-sm font-medium">状态</th>
                <th className="text-right px-6 py-4 text-gray-400 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {player.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.nickname || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{player.jerseyNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(player.status)}`}>
                      {getStatusLabel(player.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(player)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemovePlayer(player)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加球员弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">添加球员</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">手机号 *</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="家长手机号"
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">姓名 *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="球员姓名"
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">位置</label>
                  <select
                    value={addForm.position}
                    onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    {positionOptions.filter(p => p !== '未知').map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">球衣号</label>
                  <input
                    type="text"
                    value={addForm.jerseyNumber}
                    onChange={(e) => setAddForm({ ...addForm, jerseyNumber: e.target.value })}
                    placeholder="如 10"
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">性别</label>
                <select
                  value={addForm.gender}
                  onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={submitting}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑球员弹窗 */}
      {showEditModal && editingPlayer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">编辑球员</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">姓名</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">位置</label>
                  <select
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    {positionOptions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">球衣号</label>
                  <input
                    type="text"
                    value={editForm.jerseyNumber}
                    onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">状态</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdatePlayer}
                disabled={submitting}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPlayerManagement;
