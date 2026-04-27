import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Send,
  Loader2,
  Mail,
  Sparkles,
  MoreVertical,
  Phone,
  User,
  Trash2,
  Ban,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { messageApi, socialApi } from '../../services/api';
import { useAuthStore } from '../../store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userAvatar?: string;
}

// 按日期分组消息
const groupMessagesByDate = (messages: Message[]) => {
  const groups: Record<string, Message[]> = {};
  messages.forEach((msg) => {
    const date = new Date(msg.created_at);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    let key: string;
    if (isToday) key = '今天';
    else if (isYesterday) key = '昨天';
    else key = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });
  return groups;
};

export function MessageModal({ isOpen, onClose, userId, userName, userAvatar }: MessageModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (pageNum: number = 1) => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const res = await messageApi.getMessages(userId, { page: pageNum, page_size: 20 });
        const data = res.data?.data;
        if (data) {
          const newMessages = data.list || [];
          if (pageNum === 1) {
            setMessages(newMessages);
          } else {
            setMessages((prev) => [...prev, ...newMessages]);
          }
          setHasMore(newMessages.length === 20);
        }
      } catch (error) {
        console.error('加载消息失败:', error);
      } finally {
        setLoading(false);
      }
    },
    [isOpen, userId]
  );

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      loadMessages(1);
      messageApi.markConversationAsRead(userId).catch(() => {});
      setTimeout(() => textareaRef.current?.focus(), 200);
      // 获取互相关注状态
      setFollowStatusLoading(true);
      socialApi.getFollowStatus(userId)
        .then(res => {
          if (res.data?.data) {
            setIsMutualFollow(!!res.data.data.is_mutual);
          }
        })
        .catch(() => {})
        .finally(() => setFollowStatusLoading(false));
    }
  }, [isOpen, userId, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // 乐观更新
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser?.id || 0,
      receiver_id: userId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser?.id || 0,
        nickname: currentUser?.nickname || '我',
        avatar: currentUser?.avatar,
      },
    };
    setMessages((prev) => [tempMessage, ...prev]);

    try {
      const res = await messageApi.sendMessage({ receiver_id: userId, content });
      const data = res.data?.data;
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data, sender: tempMessage.sender } : m))
        );
      }
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.message || '发送失败';
      if (status === 403) {
        toast.error(msg, { duration: 4000 });
      } else {
        toast.error(msg);
      }
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage);
  };

  const formatMessageTime = (time: string) => {
    return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="relative w-full max-w-lg bg-[#0f1419] border border-[#2d3748]/80 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-[85vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3748]/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#2d3748] hover:border-[#39ff14]/30 transition-colors">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0f1419]" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{userName}</h3>
              <p className="text-slate-500 text-[11px]">在线</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to={`/personal-homepage/${userId}`}
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-[#39ff14] transition-colors"
            >
              <User size={16} />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a2332] border border-[#2d3748]/80 rounded-xl shadow-xl py-1 z-10 animate-scale-in origin-top-right">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Phone size={13} />
                    语音通话
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <Ban size={13} />
                    屏蔽用户
                  </button>
                  <div className="h-px bg-[#2d3748]/60 my-1" />
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                    <Trash2 size={13} />
                    清空对话
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-4 py-4 min-h-[300px] max-h-[500px]"
        >
          {hasMore && (
            <div className="text-center py-2">
              <button
                onClick={loadMore}
                className="text-xs text-[#39ff14] hover:text-[#4dff2e] transition-colors px-4 py-1.5 rounded-full hover:bg-[#39ff14]/10"
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多消息'}
              </button>
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-5 h-5 text-[#39ff14] animate-spin" />
              <p className="text-xs text-slate-500">加载消息中...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center mb-3">
                <Sparkles size={24} className="text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400">还没有消息</p>
              <p className="text-xs mt-1 text-slate-600">发送第一条私信吧</p>
            </div>
          ) : (
            Object.entries(messageGroups)
              .reverse()
              .map(([dateLabel, groupMessages]) => (
                <div key={dateLabel} className="mb-3">
                  {/* 日期分隔线 */}
                  <div className="flex items-center justify-center gap-3 my-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2d3748]/60" />
                    <span className="text-[10px] text-slate-600 font-medium px-2">{dateLabel}</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2d3748]/60" />
                  </div>

                  <div className="space-y-2.5">
                    {[...groupMessages].reverse().map((msg) => {
                      const isMe = msg.sender_id === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[75%]">
                            <div
                              className={`
                                relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                                ${
                                  isMe
                                    ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20 rounded-tr-sm shadow-[0_2px_8px_rgba(57,255,20,0.08)]'
                                    : 'bg-[#1a2332] text-slate-200 border border-[#2d3748]/80 rounded-tl-sm'
                                }
                              `}
                            >
                              {msg.content}
                            </div>
                            <p
                              className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-[#39ff14]/40' : 'text-slate-600'}`}
                            >
                              {formatMessageTime(msg.created_at)}
                              {isMe && (
                                <span className="text-[9px]">{msg.is_read ? '已读' : '已发送'}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="px-4 py-3.5 border-t border-[#2d3748]/60 bg-[#0a0e14]/80 backdrop-blur-sm">
          {!followStatusLoading && !isMutualFollow && (
            <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertCircle size={13} className="text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-400/80 leading-relaxed">
                未互相关注，每天只能发送一条私信
                <Link
                  to={`/personal-homepage/${userId}`}
                  onClick={onClose}
                  className="ml-1 text-[#39ff14] hover:underline inline-flex items-center gap-0.5"
                >
                  <Heart size={10} />
                  去关注
                </Link>
              </p>
            </div>
          )}
          <div className="flex items-end gap-2.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="flex-1 bg-[#111820] border border-[#2d3748]/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-[#39ff14]/40 focus:shadow-[0_0_0_3px_rgba(57,255,20,0.08)] transition-all min-h-[44px] max-h-[120px]"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className={`
                flex-shrink-0 p-3 rounded-2xl transition-all duration-200
                ${
                  input.trim() && !sending
                    ? 'bg-[#39ff14] text-[#0a0e17] hover:bg-[#4dff2e] hover:shadow-[0_0_16px_rgba(57,255,20,0.3)] hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }
              `}
            >
              {sending ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
              ) : (
                <Send className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-700 mt-2 text-right">按 Enter 发送，Shift + Enter 换行</p>
        </div>
      </div>
    </div>
  );
}
