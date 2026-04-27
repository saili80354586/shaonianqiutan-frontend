import React, { useState, useEffect } from 'react';
import { teamApi, userSearchApi } from '../../../services/api';
import { X, Copy, QrCode, Search, Loader2, Check, AlertCircle, UserPlus, Mail, Link2 } from 'lucide-react';

interface InviteModalProps {
  teamId: number;
  teamName: string;
  type: 'player' | 'coach';
  onClose: () => void;
  onSuccess?: () => void;
}

type InviteMode = 'link' | 'search';

const InviteModal: React.FC<InviteModalProps> = ({ teamId, teamName, type, onClose, onSuccess }) => {
  const [mode, setMode] = useState<InviteMode>('link');
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<{ inviteCode: string; inviteUrl: string; qrCode: string; expiresAt: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; avatar?: string; phone?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成邀请链接
  useEffect(() => {
    if (mode === 'link' && !inviteData) {
      generateInviteLink();
    }
  }, [mode]);

  const generateInviteLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teamApi.createInvitation(teamId, { type });
      if (res.data?.success) {
        setInviteData(res.data.data);
      }
    } catch (err) {
      setError((err as Error).message || '生成邀请链接失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await userSearchApi.search({ keyword: searchQuery, type });
      if (res.data?.success) {
        setSearchResults(res.data.data || []);
      }
    } catch (err) {
      setError((err as Error).message || '搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const handleInviteUser = async (userId: number) => {
    setInvitingUserId(userId);
    setError(null);
    try {
      await teamApi.inviteUser(teamId, { type, userId });
      // 从搜索结果中移除已邀请的用户
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message || '邀请失败');
    } finally {
      setInvitingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">邀请{type === 'player' ? '球员' : '教练'}</h2>
            <p className="text-gray-400 text-sm mt-1">加入 {teamName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-1 px-6 pt-4 flex-shrink-0 border-b border-gray-800">
          <button
            onClick={() => setMode('link')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'link' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4" /> 生成邀请链接
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'search' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" /> 搜索用户邀请
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'link' ? (
            <LinkInviteContent
              loading={loading}
              inviteData={inviteData}
              onCopy={copyToClipboard}
              onRegenerate={generateInviteLink}
              copied={copied}
            />
          ) : (
            <SearchInviteContent
              type={type}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchResults={searchResults}
              searching={searching}
              invitingUserId={invitingUserId}
              onSearch={handleSearch}
              onInvite={handleInviteUser}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// 生成邀请链接内容
interface LinkInviteContentProps {
  loading: boolean;
  inviteData: { inviteCode: string; inviteUrl: string; qrCode: string; expiresAt: string } | null;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
  copied: boolean;
}

const LinkInviteContent: React.FC<LinkInviteContentProps> = ({ loading, inviteData, onCopy, onRegenerate, copied }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
        <p className="text-gray-400">正在生成邀请链接...</p>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">无法生成邀请链接</p>
        <button onClick={onRegenerate} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 邀请链接 */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">邀请链接</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white truncate">
            {inviteData.inviteUrl}
          </div>
          <button
            onClick={() => onCopy(inviteData.inviteUrl)}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      {/* 邀请码 */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">邀请码</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white font-mono">
            {inviteData.inviteCode}
          </div>
          <button
            onClick={() => onCopy(inviteData.inviteCode)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            复制
          </button>
        </div>
      </div>

      {/* 二维码 */}
      {inviteData.qrCode && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">二维码</label>
          <div className="bg-white p-4 rounded-xl inline-block">
            <img src={inviteData.qrCode} alt="邀请二维码" className="w-48 h-48" />
          </div>
        </div>
      )}

      {/* 有效期 */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-200 font-medium">链接有效期</p>
            <p className="text-blue-300/70 text-sm mt-1">
              此邀请链接将于 {new Date(inviteData.expiresAt).toLocaleDateString('zh-CN')} 过期，请尽快发送给被邀请人。
            </p>
          </div>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <button
          onClick={onRegenerate}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          <Link2 className="w-4 h-4" /> 重新生成链接
        </button>
        <button
          onClick={() => onCopy(inviteData.inviteUrl)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
        >
          <Copy className="w-4 h-4" /> 复制链接
        </button>
      </div>
    </div>
  );
};

// 搜索用户邀请内容
interface SearchInviteContentProps {
  type: 'player' | 'coach';
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  searchResults: { id: number; name: string; avatar?: string; phone?: string }[];
  searching: boolean;
  invitingUserId: number | null;
  onSearch: () => void;
  onInvite: (userId: number) => void;
}

const SearchInviteContent: React.FC<SearchInviteContentProps> = ({
  type, searchQuery, onSearchQueryChange, searchResults, searching, invitingUserId, onSearch, onInvite
}) => {
  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            placeholder={`输入手机号或昵称搜索${type === 'player' ? '球员' : '教练'}...`}
            className="w-full pl-10 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={onSearch}
          disabled={searching || !searchQuery.trim()}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          搜索
        </button>
      </div>

      {/* 搜索结果 */}
      {searchResults.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">找到 {searchResults.length} 个用户</p>
          {searchResults.map(user => (
            <div
              key={user.id}
              className="bg-[#0f1419] border border-gray-700 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full flex items-center justify-center text-lg font-semibold text-white">
                  {user.name?.[0] || user.nickname?.[0] || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{user.name || user.nickname}</span>
                    {user.teamName && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                        已在队
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.phone} · {user.role === 'player' ? '球员' : '教练'}
                    {user.teamName && <span className="text-amber-400"> · {user.teamName}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onInvite(user.id)}
                disabled={invitingUserId === user.id || !!user.teamName}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  user.teamName
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {invitingUserId === user.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> 邀请
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : searchQuery && !searching ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">未找到相关用户</p>
          <p className="text-gray-500 text-sm mt-1">请尝试其他搜索词</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">输入手机号或昵称搜索</p>
          <p className="text-gray-500 text-sm mt-1">搜索已注册的用户并直接发送邀请</p>
        </div>
      )}
    </div>
  );
};

export default InviteModal;
