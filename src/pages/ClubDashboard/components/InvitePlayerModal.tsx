import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Copy, X as XIcon, Search, UserCheck, Link2, ArrowLeft, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { teamApi } from '../../../services/club';
import { userSearchApi } from '../../../services/api';

interface UserResult {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  position?: string;
  age?: number;
}

interface InvitePlayerModalProps {
  teamId: number;
  teamName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'select' | 'search' | 'invite' | 'link';

export const InvitePlayerModal: React.FC<InvitePlayerModalProps> = ({ teamId, teamName, onClose, onSuccess }) => {
  const [mode, setMode] = useState<Mode>('select');
  const [inviteCode, setInviteCode] = useState('');
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    parentName: '',
    parentPhone: '',
    position: '前锋',
  });
  const [sending, setSending] = useState(false);

  // 搜索已注册用户
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  useEffect(() => {
    const code = `SQ${teamId}${Date.now().toString(36).toUpperCase()}`;
    setInviteCode(code);
  }, [teamId]);

  // 搜索用户
  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const res = await userSearchApi.searchUsers({ keyword: searchKeyword.trim(), type: 'player' });
      if (res.data?.success) {
        const rawList = res.data.data?.list || res.data.data || [];
        const list = (rawList || []).map((u: any) => ({
          id: u.id,
          name: u.name || u.nickname || '未知',
          phone: u.phone || '',
          avatar: u.avatar,
          position: u.position,
          age: u.age,
        }));
        setSearchResults(list);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setSearching(false);
    }
  }, [searchKeyword]);

  // 定向邀请已注册用户
  const handleInviteRegistered = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      const res = await teamApi.createInvitation(teamId, {
        type: 'player',
        targetUserId: selectedUser.id,
      });
      if (res.data?.success) {
        toast.success(`已向 ${selectedUser.name} 发送邀请，对方登录后将收到通知`);
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
      const res = await teamApi.createInvitation(teamId, {
        type: 'player',
        targetPhone: form.parentPhone,
      });
      if (res.data?.success) {
        const backendCode = res.data?.data?.code || res.data?.code;
        if (backendCode) {
          setInviteCode(backendCode);
        }
        setMode('link');
        toast.success('邀请已生成，请复制链接发送给球员');
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

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=${inviteCode}`;
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
              <div className="font-medium text-white">邀请已注册球员</div>
              <div className="text-sm text-gray-400">搜索平台内已注册的球员用户并发送定向邀请</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => { setMode('invite'); setForm({ name: '', birthDate: '', gender: 'male', parentName: '', parentPhone: '', position: '前锋' }); }}
          className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-medium text-white">邀请未注册球员</div>
              <div className="text-sm text-gray-400">填写球员信息生成邀请链接，球员注册后自动加入</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setMode('link')}
          className="w-full p-4 bg-[#0f1419] border border-gray-700 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
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
        <h3 className="text-lg font-semibold text-white">邀请已注册球员</h3>
      </div>

      {/* 搜索框 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="输入球员姓名或手机号搜索"
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
          <p className="text-gray-500 text-center py-4">未找到匹配的球员</p>
        )}
        {searchResults.map(user => (
          <button
            key={user.id}
            onClick={() => setSelectedUser(user)}
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
                <div className="text-sm text-gray-400">
                  {user.phone} {user.position && `· ${user.position}`} {user.age && `· ${user.age}岁`}
                </div>
              </div>
              {selectedUser?.id === user.id && (
                <Check className="w-5 h-5 text-emerald-400 ml-auto" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 操作按钮 */}
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

  // 第二步B：邀请未注册球员
  const renderInviteMode = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setMode('select')} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">邀请未注册球员</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">球员姓名</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="输入姓名"
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">出生日期</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={e => setForm({ ...form, birthDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">监护人姓名</label>
          <input
            type="text"
            value={form.parentName}
            onChange={e => setForm({ ...form, parentName: e.target.value })}
            placeholder="输入监护人姓名"
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">监护人手机 <span className="text-red-400">*</span></label>
          <input
            type="tel"
            value={form.parentPhone}
            onChange={e => setForm({ ...form, parentPhone: e.target.value })}
            placeholder="输入手机号码"
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">擅长位置</label>
          <select
            value={form.position}
            onChange={e => setForm({ ...form, position: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="前锋">前锋</option>
            <option value="中场">中场</option>
            <option value="后卫">后卫</option>
            <option value="门将">门将</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={() => setMode('select')} className="px-4 py-2 text-gray-400 hover:text-white">
          取消
        </button>
        <button
          onClick={handleInviteUnregistered}
          disabled={sending || !form.name || !form.parentPhone}
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
        <p className="text-sm text-gray-400 mb-4">复制下方链接发送给球员，注册后将自动加入球队</p>

        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-700 mb-4">
          <div className="text-sm text-gray-400 mb-1">邀请码</div>
          <div className="font-mono text-xl text-white mb-3">{inviteCode}</div>
          <div className="text-xs text-gray-500 break-all">{window.location.origin}/register?invite={inviteCode}</div>
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
          <h2 className="text-xl font-bold text-white">邀请球员加入 {teamName}</h2>
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
