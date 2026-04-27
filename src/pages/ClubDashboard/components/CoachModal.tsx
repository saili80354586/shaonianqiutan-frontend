import React, { useState, useEffect, useCallback } from 'react';
import {
  X as XIcon,
  Copy,
  Search,
  UserCheck,
  Link2,
  ArrowLeft,
  Loader2,
  Check,
  GraduationCap,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { teamApi, clubApi } from '../../../services/api';
import { userSearchApi } from '../../../services/api';

interface UserResult {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
}

interface CoachModalProps {
  teamId?: number;
  teamName?: string;
  clubId?: number;
  clubName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'select' | 'search' | 'invite' | 'link';

const COACH_ROLES = [
  { value: 'head_coach', label: '主教练' },
  { value: 'assistant', label: '助理教练' },
  { value: 'goalkeeper_coach', label: '守门员教练' },
  { value: 'fitness_coach', label: '体能教练' },
  { value: 'team_manager', label: '领队' },
];

const CoachModal: React.FC<CoachModalProps> = ({ teamId, teamName, clubId, clubName, onClose, onSuccess }) => {
  const isClubMode = !!clubId;
  const contextId = clubId || teamId || 0;
  const contextName = clubName || teamName || '球队';

  const [mode, setMode] = useState<Mode>('select');
  const [inviteCode, setInviteCode] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: 'assistant',
  });
  const [sending, setSending] = useState(false);

  // 搜索已注册用户
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState('assistant');

  useEffect(() => {
    const prefix = isClubMode ? 'CLUB' : 'SC';
    const code = `${prefix}${contextId}${Date.now().toString(36).toUpperCase()}`;
    setInviteCode(code);
  }, [contextId, isClubMode]);

  // 搜索用户
  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const res = await userSearchApi.searchUsers({ keyword: searchKeyword.trim(), type: 'coach' });
      if (res.data?.success) {
        const rawList = res.data.data?.list || res.data.data || [];
        const list = (rawList || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.nickname || '未知',
          phone: u.phone || '',
          avatar: u.avatar,
        }));
        setSearchResults(list);
      }
    } catch (error) {
      console.error('搜索教练失败:', error);
    } finally {
      setSearching(false);
    }
  }, [searchKeyword]);

  // 定向邀请已注册用户
  const handleInviteRegistered = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      let res;
      if (isClubMode) {
        res = await clubApi.createClubInvitation({
          type: 'coach',
          targetUserId: selectedUser.id,
          targetRole: selectedRole,
        });
      } else {
        res = await teamApi.createInvitation(teamId!, {
          type: 'coach',
          targetUserId: selectedUser.id,
          role: selectedRole,
        });
      }
      if (res.data?.success) {
        toast.success(`已向 ${selectedUser.name} 发送邀请`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || '邀请发送失败');
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || '邀请发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  // 邀请未注册用户
  const handleInviteUnregistered = async () => {
    setSending(true);
    try {
      let res;
      if (isClubMode) {
        res = await clubApi.createClubInvitation({
          type: 'coach',
          targetPhone: form.phone,
          targetRole: form.role,
        });
      } else {
        res = await teamApi.createInvitation(teamId!, {
          type: 'coach',
          targetPhone: form.phone,
          role: form.role,
        });
      }
      if (res.data?.success) {
        const backendCode = res.data?.data?.code || res.data?.data?.inviteCode || res.data?.code;
        if (backendCode) {
          setInviteCode(backendCode);
        }
        setMode('link');
        toast.success('邀请已生成，请复制链接发送给教练');
      } else {
        toast.error(res.data?.message || '邀请发送失败');
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || '邀请发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  // 生成通用邀请链接
  const generateGeneralLink = async () => {
    setSending(true);
    try {
      let res;
      if (isClubMode) {
        res = await clubApi.createClubInvitation({ type: 'coach' });
      } else {
        res = await teamApi.createInvitation(teamId!, { type: 'coach' });
      }
      if (res.data?.success && res.data?.data) {
        const backendCode = res.data.data.inviteCode || res.data.data.code;
        if (backendCode) {
          setInviteCode(backendCode);
        }
        setMode('link');
        toast.success('通用邀请链接已生成');
      } else {
        toast.error(res.data?.message || '生成邀请链接失败');
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || '生成邀请链接失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite_code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success('邀请链接已复制');
  };

  // 第一步：选择邀请方式
  const renderSelectMode = () => (
    <>
      <p className="text-gray-400 mb-6">选择邀请方式</p>
      <div className="space-y-3">
        <button
          onClick={() => { setMode('search'); setSearchResults([]); setSelectedUser(null); }}
          className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-white">邀请已注册教练</div>
              <div className="text-sm text-gray-400">搜索平台内已注册的教练用户并发送定向邀请</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => { setMode('invite'); setForm({ name: '', phone: '', role: 'assistant' }); }}
          className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-medium text-white">邀请未注册教练</div>
              <div className="text-sm text-gray-400">填写教练信息生成邀请链接，注册后自动加入</div>
            </div>
          </div>
        </button>
        <button
          onClick={generateGeneralLink}
          disabled={sending}
          className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-medium text-white">复制通用邀请链接</div>
              <div className="text-sm text-gray-400">生成通用邀请链接，任何人可通过链接注册加入</div>
            </div>
          </div>
        </button>
      </div>
    </>
  );

  // 第二步A：搜索已注册用户
  const renderSearchMode = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">邀请已注册教练</h3>
      </div>

      {/* 搜索框 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="输入教练姓名或手机号搜索"
          className="flex-1 px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !searchKeyword.trim()}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          搜索
        </button>
      </div>

      {/* 搜索结果 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchResults.length === 0 && !searching && searchKeyword && (
          <p className="text-gray-500 text-center py-4">未找到匹配的教练</p>
        )}
        {searchResults.map(user => (
          <button
            key={user.id}
            onClick={() => { setSelectedUser(user); setSelectedRole('assistant'); }}
            className={`w-full p-3 rounded-xl border text-left transition-colors ${
              selectedUser?.id === user.id
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-gray-700 bg-[#0f1419] hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <UserCheck className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-medium text-white">{user.name}</div>
                <div className="text-sm text-gray-400">{user.phone}</div>
              </div>
              {selectedUser?.id === user.id && (
                <Check className="w-5 h-5 text-emerald-400 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 角色选择 + 操作按钮 */}
      {selectedUser && (
        <div className="mt-4 p-4 bg-[#0f1419] border border-gray-700 rounded-xl">
          <label className="block text-sm text-gray-400 mb-2">分配角色</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm mb-3"
          >
            {COACH_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={() => setMode('select')} className="px-4 py-2 text-gray-400 hover:text-white">
          取消
        </button>
        <button
          onClick={handleInviteRegistered}
          disabled={sending || !selectedUser}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl flex items-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          发送邀请
        </button>
      </div>
    </>
  );

  // 第二步B：邀请未注册教练
  const renderInviteMode = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">邀请未注册教练</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">教练姓名</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="输入姓名"
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">手机号码 <span className="text-red-400">*</span></label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="输入手机号码"
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">预设角色</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            {COACH_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={() => setMode('select')} className="px-4 py-2 text-gray-400 hover:text-white">
          取消
        </button>
        <button
          onClick={handleInviteUnregistered}
          disabled={sending || !form.name || !form.phone}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-xl"
        >
          {sending ? '生成中...' : '生成邀请链接'}
        </button>
      </div>
    </>
  );

  // 第三步：复制邀请链接
  const renderLinkMode = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">邀请链接</h3>
      </div>

      <div className="bg-[#0f1419] rounded-xl p-6 border border-gray-700 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <Link2 className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-white font-medium mb-2">邀请链接已生成</p>
        <p className="text-sm text-gray-400 mb-4">复制下方链接发送给教练，注册后将自动加入{isClubMode ? '俱乐部' : '球队'}</p>

        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-700 mb-4">
          <div className="text-sm text-gray-400 mb-1">邀请码</div>
          <div className="font-mono text-xl text-white mb-3">{inviteCode}</div>
          <div className="text-xs text-gray-500 break-all">{window.location.origin}/register?invite_code={inviteCode}</div>
        </div>

        <button
          onClick={copyInviteLink}
          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2"
        >
          <Copy className="w-5 h-5" />
          复制邀请链接
        </button>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">
          完成
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg border border-gray-700">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">邀请教练加入 {contextName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {mode === 'select' && renderSelectMode()}
          {mode === 'search' && renderSearchMode()}
          {mode === 'invite' && renderInviteMode()}
          {mode === 'link' && renderLinkMode()}
        </div>
      </div>
    </div>
  );
};

export default CoachModal;
