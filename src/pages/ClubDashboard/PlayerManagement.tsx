import React, { useState, useEffect } from 'react';
import { clubApi } from '../../services/api';
import { teamApi } from '../../services/club';
import { InvitePlayerModal } from './components/InvitePlayerModal';
import { ArrowLeft, Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, FileText, UserPlus, Shield } from 'lucide-react';
import { TableSkeleton } from '../../components/ui/loading';

interface Player {
  id: string;
  name: string;
  age: number;
  ageGroup?: string;
  gender: 'male' | 'female';
  position: string;
  jerseyNumber: string;
  joinDate: string;
  reportCount: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'transferred';
  contactPhone?: string;
  parentName?: string;
}

interface TeamItem {
  id: number;
  name: string;
  ageGroup?: string;
}

interface PlayerManagementProps {
  onBack: () => void;
  onViewDetail?: (playerId: number) => void;
  isAdmin?: boolean;
  initialPositionFilter?: string;
  initialAgeGroupFilter?: string;
  clubId?: number;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ onBack, onViewDetail, isAdmin = true, initialPositionFilter, initialAgeGroupFilter, clubId }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState(initialPositionFilter || 'all');
  const [ageGroupFilter, setAgeGroupFilter] = useState(initialAgeGroupFilter || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  // 球队选择相关
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [showTeamSelect, setShowTeamSelect] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // 加载球队列表
  useEffect(() => {
    if (!clubId) return;
    const loadTeams = async () => {
      setTeamsLoading(true);
      try {
        const res = await teamApi.getTeams(clubId);
        if (res.data?.success && res.data?.data) {
          const list = (res.data.data.teams || res.data.data.list || res.data.data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            ageGroup: t.ageGroup,
          }));
          setTeams(list);
        }
      } catch (error) {
        console.error('加载球队列表失败:', error);
      }
      setTeamsLoading(false);
    };
    loadTeams();
  }, [clubId]);

  // 点击添加球员按钮
  const handleAddPlayerClick = () => {
    if (teams.length === 1) {
      // 只有一个球队，直接打开邀请模态框
      setSelectedTeamId(teams[0].id);
      setSelectedTeamName(teams[0].name);
      setShowAddModal(true);
    } else if (teams.length > 1) {
      // 多个球队，先选择
      setShowTeamSelect(true);
    } else {
      // 没有球队
      setShowTeamSelect(true);
    }
  };

  // 选择球队后确认
  const handleTeamSelected = (team: TeamItem) => {
    setSelectedTeamId(team.id);
    setSelectedTeamName(team.name);
    setShowTeamSelect(false);
    setShowAddModal(true);
  };

  useEffect(() => {
    const loadPlayers = async () => {
      setLoading(true);
      try {
        const res = await clubApi.getPlayers({
          page: pagination.page,
          pageSize: pagination.pageSize,
          keyword: searchQuery || undefined,
          position: positionFilter !== 'all' ? positionFilter : undefined,
          ageGroup: ageGroupFilter !== 'all' ? ageGroupFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : 'active',
        });

        if (res.data?.success && res.data?.data) {
          setPlayers(res.data.data.list.map((p: { id: number; name: string; age?: number; ageGroup?: string; position?: string; positionName?: string; joinDate?: string }) => ({
            id: String(p.id),
            name: p.name,
            age: p.age || 0,
            ageGroup: p.ageGroup || (p.age ? `U${Math.min(18, Math.max(6, Math.ceil(p.age / 2) * 2))}` : ''),
            gender: 'male' as const,
            position: p.position || p.positionName || '',
            jerseyNumber: '-',
            joinDate: p.joinDate || '',
            reportCount: p.totalReports || 0,
            status: (p.status === 'active' ? 'active' : 'inactive') as const,
          })));
          setPagination(prev => ({
            ...prev,
            total: res.data.data.pagination?.total || 0,
          }));
        }
      } catch (error) {
        console.error('加载球员列表失败:', error);
      }
      setLoading(false);
    };
    loadPlayers();
  }, [pagination.page, pagination.pageSize, searchQuery, positionFilter, ageGroupFilter, statusFilter]);

  const filteredPlayers = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.jerseyNumber.includes(searchQuery);
    const matchPosition = positionFilter === 'all' || p.position === positionFilter;
    const matchAgeGroup = ageGroupFilter === 'all' || p.ageGroup === ageGroupFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchPosition && matchAgeGroup && matchStatus;
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-500/20', text: 'text-green-400', label: '在训' },
      inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '暂停' },
      transferred: { bg: 'bg-red-500/20', text: 'text-red-400', label: '已转会' },
    };
    const s = map[status];
    return <span className={`px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">球员管理</h1>
              <p className="text-gray-400 mt-1">共 {players.length} 名在籍球员</p>
            </div>
          </div>
          <button onClick={handleAddPlayerClick} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            <UserPlus className="w-4 h-4" /> 添加球员
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球员姓名或球衣号..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
            <option value="all">所有位置</option>
            <option value="前锋">前锋</option>
            <option value="中场">中场</option>
            <option value="后卫">后卫</option>
            <option value="门将">门将</option>
          </select>
          <select value={ageGroupFilter} onChange={e => setAgeGroupFilter(e.target.value)} className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
            <option value="all">所有年龄段</option>
            <option value="U8">U8</option>
            <option value="U10">U10</option>
            <option value="U12">U12</option>
            <option value="U14">U14</option>
            <option value="U16">U16</option>
            <option value="U18">U18</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500">
            <option value="all">所有状态</option>
            <option value="active">在训</option>
            <option value="inactive">暂停</option>
            <option value="transferred">已转会</option>
          </select>
        </div>

        {/* 球员列表 */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">球员信息</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">位置/号码</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">入队时间</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">分析报告</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">状态</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPlayers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">暂无符合条件的球员</td></tr>
                ) : (
                  filteredPlayers.map(player => (
                    <tr key={player.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {player.name[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-sm text-gray-500">{player.age}岁 · {player.gender === 'male' ? '男' : '女'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${getPositionColor(player.position)}`}>{player.position}</span>
                        <span className="ml-2 text-gray-400">#{player.jerseyNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{player.joinDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-white">{player.reportCount}</span>
                          {player.lastOrderDate && <span className="text-xs text-gray-500">({player.lastOrderDate})</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(player.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onViewDetail?.(Number(player.id))} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                          {isAdmin && (
                            <>
                              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 球队选择模态框 */}
      {showTeamSelect && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">选择球队</h2>
              <button onClick={() => setShowTeamSelect(false)} className="text-gray-400 hover:text-white">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              {teamsLoading ? (
                <div className="text-center py-8 text-gray-400">加载中...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">暂无球队</p>
                  <p className="text-sm text-gray-500">请先创建球队后再添加球员</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm mb-3">选择要添加球员的球队：</p>
                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => handleTeamSelected(team)}
                      className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{team.name}</div>
                          {team.ageGroup && <div className="text-sm text-gray-400">{team.ageGroup}</div>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 邀请球员模态框 */}
      {showAddModal && selectedTeamId && (
        <InvitePlayerModal
          teamId={selectedTeamId}
          teamName={selectedTeamName}
          onClose={() => {
            setShowAddModal(false);
            setSelectedTeamId(null);
            setSelectedTeamName('');
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedTeamId(null);
            setSelectedTeamName('');
            // 刷新球员列表
            const loadPlayers = async () => {
              setLoading(true);
              try {
                const res = await clubApi.getPlayers({
                  page: pagination.page,
                  pageSize: pagination.pageSize,
                  keyword: searchQuery || undefined,
                  position: positionFilter !== 'all' ? positionFilter : undefined,
                  ageGroup: ageGroupFilter !== 'all' ? ageGroupFilter : undefined,
                  status: statusFilter !== 'all' ? statusFilter : 'active',
                });
                if (res.data?.success && res.data?.data) {
                  setPlayers(res.data.data.list.map((p: { id: number; name: string; age?: number; ageGroup?: string; position?: string; positionName?: string; joinDate?: string }) => ({
                    id: String(p.id),
                    name: p.name,
                    age: p.age || 0,
                    ageGroup: p.ageGroup || (p.age ? `U${Math.min(18, Math.max(6, Math.ceil(p.age / 2) * 2))}` : ''),
                    gender: 'male' as const,
                    position: p.position || p.positionName || '',
                    jerseyNumber: '-',
                    joinDate: p.joinDate || '',
                    reportCount: p.totalReports || 0,
                    status: (p.status === 'active' ? 'active' : 'inactive') as const,
                  })));
                  setPagination(prev => ({
                    ...prev,
                    total: res.data.data.pagination?.total || 0,
                  }));
                }
              } catch (error) {
                console.error('刷新球员列表失败:', error);
              }
              setLoading(false);
            };
            loadPlayers();
          }}
        />
      )}
    </div>
  );
};

export default PlayerManagement;
