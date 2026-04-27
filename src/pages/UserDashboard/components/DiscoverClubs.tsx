import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Users, Building2, ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi } from '../../../services/api';
import { teamApi } from '../../../services/club';
import { TableSkeleton } from '../../../components/ui/loading';

interface ClubItem {
  id: number;
  name: string;
  logo: string;
  description: string;
  address: string;
  province: string;
  city: string;
  establishedYear: number;
  playerCount: number;
  coachCount: number;
  teamCount: number;
}

interface TeamItem {
  id: number;
  name: string;
  ageGroup: string;
  playerCount: number;
  coachCount: number;
}

interface ClubDetail extends ClubItem {
  teams: TeamItem[];
  contactName?: string;
  contactPhone?: string;
}

export const DiscoverClubs: React.FC = () => {
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [selectedClub, setSelectedClub] = useState<ClubDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 申请弹窗
  const [applyingTeam, setApplyingTeam] = useState<TeamItem | null>(null);
  const [appType, setAppType] = useState<'join' | 'trial'>('join');
  const [appReason, setAppReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clubApi.searchClubs({ keyword, city, page: 1, pageSize: 20 });
      if (res.data?.success) {
        setClubs(res.data.data?.list || []);
      } else {
        setClubs([]);
      }
    } catch (error) {
      console.error('搜索俱乐部失败:', error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, city]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const loadClubDetail = async (clubId: number) => {
    setDetailLoading(true);
    try {
      const res = await clubApi.getClubDetail(clubId);
      if (res.data?.success) {
        setSelectedClub(res.data.data);
      }
    } catch (error) {
      console.error('加载俱乐部详情失败:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applyingTeam) return;
    setSubmitting(true);
    try {
      await teamApi.createApplication(applyingTeam.id, {
        type: appType,
        reason: appReason,
      });
      toast.success('申请已提交，请等待俱乐部审核');
      setApplyingTeam(null);
      setAppReason('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || '申请提交失败';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 俱乐部详情页
  if (selectedClub) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedClub(null)}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white">{selectedClub.name}</h2>
        </div>

        {detailLoading ? (
          <TableSkeleton count={3} />
        ) : (
          <>
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center">
                  {selectedClub.logo ? (
                    <img src={selectedClub.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedClub.name}</h3>
                  <p className="text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedClub.province} {selectedClub.city} {selectedClub.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-emerald-400">{selectedClub.playerCount}</div>
                  <div className="text-xs text-gray-500">球员</div>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-400">{selectedClub.coachCount}</div>
                  <div className="text-xs text-gray-500">教练</div>
                </div>
                <div className="bg-[#0f1419] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-amber-400">{selectedClub.teamCount}</div>
                  <div className="text-xs text-gray-500">球队</div>
                </div>
              </div>

              {selectedClub.description && (
                <p className="text-sm text-gray-400">{selectedClub.description}</p>
              )}
            </div>

            {/* 旗下球队 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">旗下球队</h3>
              <div className="space-y-3">
                {selectedClub.teams?.map((team) => (
                  <div
                    key={team.id}
                    className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-white font-semibold">{team.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {team.ageGroup} · {team.playerCount}名球员 · {team.coachCount}名教练
                      </p>
                    </div>
                    <button
                      onClick={() => { setApplyingTeam(team); setAppType('join'); setAppReason(''); }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                    >
                      申请加入
                    </button>
                  </div>
                ))}
                {(!selectedClub.teams || selectedClub.teams.length === 0) && (
                  <p className="text-gray-500 text-center py-8">暂无球队信息</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* 申请弹窗 */}
        {applyingTeam && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">申请加入 {applyingTeam.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedClub.name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">申请类型</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAppType('join')}
                      className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                        appType === 'join'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      正式入队
                    </button>
                    <button
                      onClick={() => setAppType('trial')}
                      className={`flex-1 px-4 py-2 rounded-xl border transition-colors ${
                        appType === 'trial'
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      申请试训
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">申请理由（可选）</label>
                  <textarea
                    value={appReason}
                    onChange={e => setAppReason(e.target.value)}
                    placeholder="请输入申请理由..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
                <button
                  onClick={() => setApplyingTeam(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleApply}
                  disabled={submitting}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  提交申请
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 俱乐部列表页
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">发现俱乐部</h2>
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadClubs()}
            placeholder="搜索俱乐部名称"
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadClubs()}
          placeholder="城市"
          className="w-32 px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={loadClubs}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
        >
          搜索
        </button>
      </div>

      {/* 俱乐部列表 */}
      {loading ? (
        <TableSkeleton count={6} />
      ) : clubs.length === 0 ? (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">未找到匹配的俱乐部</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => loadClubDetail(club.id)}
              className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 text-left hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                  {club.logo ? (
                    <img src={club.logo} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">{club.name}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {club.province} {club.city}
                  </p>
                  {club.establishedYear > 0 && (
                    <p className="text-xs text-gray-500 mt-1">成立于 {club.establishedYear} 年</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {club.playerCount} 球员
                    </span>
                    <span className="text-xs text-gray-500">{club.teamCount} 球队</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};