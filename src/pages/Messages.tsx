import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mail,
  Send,
  Loader2,
  ChevronLeft,
  Search,
  MoreVertical,
  Phone,
  User,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react';
import { messageApi } from '../services/api';
import { useAuthStore } from '../store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Conversation {
  user_id: number;
  nickname: string;
  avatar?: string;
  last_message?: string;
  last_time?: string;
  unread_count: number;
}

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

const Messages: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageApi.getConversations();
      const data = res.data?.data;
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch {
      toast.error('加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载消息
  const loadMessages = async (userId: number, pageNum: number = 1) => {
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
    } catch {
      toast.error('加载消息失败');
    }
  };

  // 选中会话
  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv.user_id);
    setPage(1);
    loadMessages(conv.user_id, 1);
    messageApi.markConversationAsRead(conv.user_id).catch(() => {});
    // 更新本地未读数
    setConversations((prev) =>
      prev.map((c) => (c.user_id === conv.user_id ? { ...c, unread_count: 0 } : c))
    );
    // 聚焦输入框
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || !activeConversation || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      sender_id: currentUser?.id || 0,
      receiver_id: activeConversation,
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
      const res = await messageApi.sendMessage({ receiver_id: activeConversation, content });
      const data = res.data?.data;
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data, sender: tempMessage.sender } : m))
        );
        // 更新会话列表最后消息
        setConversations((prev) =>
          prev.map((c) =>
            c.user_id === activeConversation
              ? { ...c, last_message: content, last_time: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '发送失败');
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

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (time: string) => {
    return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = searchKeyword
    ? conversations.filter((c) => c.nickname.includes(searchKeyword))
    : conversations;

  const activeConv = conversations.find((c) => c.user_id === activeConversation);

  // 消息按日期分组
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0e17]">
      {/* 左侧：会话列表 */}
      <div
        className={`
        w-full md:w-80 border-r border-[#2d3748]/60 flex flex-col
        transition-all duration-300
        ${activeConversation ? 'hidden md:flex' : 'flex'}
      `}
      >
        {/* 头部 */}
        <div className="px-5 py-4 border-b border-[#2d3748]/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
                <Mail size={16} className="text-[#39ff14]" />
              </div>
              <h2 className="text-white font-semibold text-base">私信</h2>
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <MessageSquarePlus size={18} />
            </button>
          </div>
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索会话..."
              className="w-full bg-[#111820] border border-[#2d3748]/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#39ff14]/40 focus:shadow-[0_0_0_3px_rgba(57,255,20,0.08)] transition-all"
            />
          </div>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-[#39ff14] animate-spin" />
              <p className="text-sm text-slate-500">加载中...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center mb-3">
                <Mail size={24} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-400 font-medium">
                {searchKeyword ? '未找到匹配会话' : '暂无会话'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {searchKeyword ? '尝试其他关键词' : '开始与球员、教练交流吧'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv, index) => {
              const isActive = activeConversation === conv.user_id;
              const isUnread = conv.unread_count > 0;
              return (
                <button
                  key={conv.user_id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 border-b border-[#2d3748]/30 relative
                    ${isActive ? 'bg-[#39ff14]/5' : 'hover:bg-white/[0.02]'}
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* 未读指示条 */}
                  {isUnread && !isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-[#39ff14] shadow-[0_0_6px_rgba(57,255,20,0.4)]" />
                  )}

                  {/* 选中指示 */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.4)]" />
                  )}

                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                      w-11 h-11 rounded-full overflow-hidden border transition-all duration-300
                      ${isActive ? 'border-[#39ff14]/40 shadow-[0_0_12px_rgba(57,255,20,0.15)]' : 'border-[#2d3748]'}
                      ${isUnread && !isActive ? 'border-[#39ff14]/20' : ''}
                    `}
                    >
                      <img
                        src={conv.avatar || '/images/avatar-default.svg'}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/avatar-default.svg';
                        }}
                      />
                    </div>
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm shadow-red-500/20 border-2 border-[#0a0e17]">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm truncate ${isUnread ? 'text-white font-semibold' : 'text-slate-300 font-medium'}`}
                      >
                        {conv.nickname}
                      </span>
                      {conv.last_time && (
                        <span className="text-slate-600 text-[10px] flex-shrink-0 ml-2">
                          {formatTime(conv.last_time)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p
                        className={`text-xs truncate mt-0.5 ${isUnread ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 右侧：消息窗口 */}
      <div
        className={`
        flex-1 flex flex-col bg-[#0a0e17]
        ${!activeConversation ? 'hidden md:flex' : 'flex'}
      `}
      >
        {activeConversation && activeConv ? (
          <>
            {/* 消息头部 */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3.5 border-b border-[#2d3748]/60 bg-[#0a0e17]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors md:hidden"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden border border-[#2d3748] hover:border-[#39ff14]/30 transition-colors cursor-pointer"
                >
                  <img
                    src={activeConv.avatar || '/images/avatar-default.svg'}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatar-default.svg';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{activeConv.nickname}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-slate-500 text-[11px]">在线</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <Phone size={16} />
                </button>
                <Link
                  to={`/personal-homepage/${activeConversation}`}
                  className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-[#39ff14] transition-colors"
                >
                  <User size={16} />
                </Link>
                <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* 消息列表 */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
              {hasMore && (
                <div className="text-center py-3">
                  <button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      loadMessages(activeConversation, nextPage);
                    }}
                    className="text-xs text-[#39ff14] hover:text-[#4dff2e] transition-colors px-4 py-1.5 rounded-full hover:bg-[#39ff14]/10"
                  >
                    加载更多消息
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center mb-4">
                    <Sparkles size={28} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">还没有消息</p>
                  <p className="text-xs mt-1 text-slate-600">发送第一条私信，开启对话吧</p>
                </div>
              ) : (
                Object.entries(messageGroups)
                  .reverse()
                  .map(([dateLabel, groupMessages]) => (
                    <div key={dateLabel} className="mb-4">
                      {/* 日期分隔线 */}
                      <div className="flex items-center justify-center gap-3 my-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2d3748]/60" />
                        <span className="text-[11px] text-slate-600 font-medium px-2">{dateLabel}</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2d3748]/60" />
                      </div>

                      {/* 该日期的消息 */}
                      <div className="space-y-3">
                        {[...groupMessages].reverse().map((msg) => {
                          const isMe = msg.sender_id === currentUser?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            >
                              {!isMe && msg.sender && (
                                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#2d3748]/60 mr-2 flex-shrink-0 mt-1">
                                  <img
                                    src={msg.sender.avatar || '/images/avatar-default.svg'}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/images/avatar-default.svg';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="max-w-[75%] md:max-w-[65%]">
                                <div
                                  className={`
                                    relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                                    transition-all duration-200
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
                                  className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'justify-end text-[#39ff14]/40' : 'text-slate-600'}`}
                                >
                                  {formatMessageTime(msg.created_at)}
                                  {isMe && (
                                    <span className="text-[9px]">
                                      {msg.is_read ? '已读' : '已发送'}
                                    </span>
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
            <div className="px-4 md:px-5 py-3.5 border-t border-[#2d3748]/60 bg-[#0a0e17]/90 backdrop-blur-sm">
              <div className="flex items-end gap-2.5">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    rows={1}
                    className="w-full bg-[#111820] border border-[#2d3748]/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-[#39ff14]/40 focus:shadow-[0_0_0_3px_rgba(57,255,20,0.08)] transition-all min-h-[44px] max-h-[120px]"
                    style={{ height: 'auto' }}
                  />
                </div>
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
              <p className="text-[10px] text-slate-700 mt-2 text-right">
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </>
        ) : (
          /* 未选中会话 */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500 px-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-9 h-9 text-slate-600" />
              </div>
              <p className="text-lg font-medium text-slate-400">选择会话开始聊天</p>
              <p className="text-sm mt-2 text-slate-600">从左侧选择一个会话查看消息</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
