import { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Heart,
  Star,
  MessageCircle,
  AtSign,
  Settings,
  Check,
  FileText,
  Trophy,
  UserPlus,
  Mail,
  Inbox,
  Sparkles,
  CheckCheck,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { notificationApi } from '../../services/club';
import { teamApi, clubInvitationApi } from '../../services/api';
import { useAuthStore } from '../../store';
import { wsService, type NotificationPayload } from '../../services/websocket';
import type { NotificationItem, NotificationType } from '../../types';

interface NotificationCenterProps {
  onUnreadChange?: (count: number) => void;
}

const TABS = [
  { key: 'all' as const, label: '全部', icon: Inbox },
  { key: '互动' as const, label: '互动', icon: Heart },
  { key: '私信' as const, label: '私信', icon: Mail },
  { key: '周报' as const, label: '周报', icon: FileText },
  { key: '比赛' as const, label: '比赛', icon: Trophy },
  { key: '系统' as const, label: '系统', icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function NotificationCenter({ onUnreadChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { isAuthenticated } = useAuthStore();

  // 加载通知
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications({ pageSize: 50 });
      const list = res.data?.data?.list || res.data?.data || [];
      // 后端返回驼峰字段，前端使用蛇形字段 —— 做字段映射
      const mapped = (Array.isArray(list) ? list : []).map((n: any) => ({
        ...n,
        is_read: n.isRead ?? n.is_read ?? false,
        created_at: n.createdAt ?? n.created_at ?? '',
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('加载通知失败:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取未读数
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // WebSocket 实时通知
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = wsService.subscribe((payload: NotificationPayload) => {
      const newNotification: NotificationItem = {
        id: payload.id,
        user_id: 0,
        type: payload.type as NotificationType,
        title: payload.title,
        content: payload.content,
        is_read: false,
        priority: 2,
        created_at: payload.created_at,
        data: payload.data,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      fetchUnreadCount();
    });

    wsService.connect();

    return unsubscribe;
  }, [isAuthenticated, onUnreadChange]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      const count = res.data?.data?.count ?? res.data?.count ?? 0;
      onUnreadChange?.(count);
    } catch (error) {
      console.error('获取未读数失败:', error);
    }
  };

  // 标记全部已读
  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onUnreadChange?.(0);
    } catch (error) {
      console.error('标记已读失败:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  // 标记单条已读
  const handleMarkOneRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    try {
      await notificationApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 获取后端错误消息（适配 {error:{message}} 和 {message} 两种格式）
  const getErrorMessage = (error: any, defaultMsg: string) => {
    return error?.response?.data?.error?.message || error?.response?.data?.message || defaultMsg;
  };

  // 检查错误是否表示邀请已被处理
  const isAlreadyHandledError = (message: string) => {
    const handledKeywords = ['邀请状态不允许', '邀请已过期', '邀请不存在', '您已在该球队中', '无权操作', '邀请已处理'];
    return handledKeywords.some((k) => message.includes(k));
  };

  // 接受邀请
  const handleAcceptInvite = async (notification: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteCode = notification.data?.invite_code;
    if (!inviteCode) {
      toast.error('邀请码无效');
      return;
    }
    setActionLoading(notification.id);
    try {
      // 根据 data 中的字段判断是俱乐部邀请还是球队邀请
      const isClubInvite = notification.data?.club_id !== undefined;
      if (isClubInvite) {
        await clubInvitationApi.acceptClubInvitation(inviteCode);
        toast.success('已成功加入俱乐部');
      } else {
        await teamApi.acceptInvitation(inviteCode);
        toast.success('已成功加入球队');
      }
      // 标记通知为已处理
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, data: { ...n.data, _handled: 'accepted', status: 'accepted' } }
            : n
        )
      );
      fetchUnreadCount();
    } catch (error: any) {
      const msg = getErrorMessage(error, '接受邀请失败');
      toast.error(msg);
      // 如果邀请已被处理（过期/已接受/已拒绝），自动隐藏按钮
      if (isAlreadyHandledError(msg)) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, data: { ...n.data, _handled: 'accepted', status: 'accepted' } }
              : n
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  // 拒绝邀请
  const handleRejectInvite = async (notification: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteCode = notification.data?.invite_code;
    if (!inviteCode) {
      toast.error('邀请码无效');
      return;
    }
    setActionLoading(notification.id);
    try {
      const isClubInvite = notification.data?.club_id !== undefined;
      if (isClubInvite) {
        await clubInvitationApi.rejectClubInvitation(inviteCode);
      } else {
        await teamApi.rejectInvitation(inviteCode);
      }
      toast.success('已拒绝邀请');
      // 标记通知为已处理
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, data: { ...n.data, _handled: 'rejected', status: 'rejected' } }
            : n
        )
      );
      fetchUnreadCount();
    } catch (error: any) {
      const msg = getErrorMessage(error, '拒绝邀请失败');
      toast.error(msg);
      // 如果邀请已被处理，自动隐藏按钮
      if (isAlreadyHandledError(msg)) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, data: { ...n.data, _handled: 'rejected', status: 'rejected' } }
              : n
          )
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  // 过滤通知
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === '互动')
      return ['like', 'favorite', 'comment', 'mention', 'follow'].includes(n.type);
    if (activeTab === '私信') return ['message'].includes(n.type);
    if (activeTab === '周报')
      return ['weekly_report_created', 'weekly_report_rejected', 'weekly_report_approved'].includes(
        n.type
      );
    if (activeTab === '比赛')
      return [
        'match_summary_created',
        'match_player_reminder',
        'match_coach_reminder',
        'match_summary_complete',
      ].includes(n.type);
    if (activeTab === '系统')
      return ['system', 'order', 'report', 'task', 'inquiry', 'invitation'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const tabUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TABS.forEach((tab) => {
      if (tab.key === 'all') {
        counts[tab.key] = unreadCount;
        return;
      }
      counts[tab.key] = notifications.filter((n) => {
        if (tab.key === '互动')
          return ['like', 'favorite', 'comment', 'mention', 'follow'].includes(n.type) && !n.is_read;
        if (tab.key === '私信') return n.type === 'message' && !n.is_read;
        if (tab.key === '周报')
          return ['weekly_report_created', 'weekly_report_rejected', 'weekly_report_approved'].includes(n.type) && !n.is_read;
        if (tab.key === '比赛')
          return ['match_summary_created', 'match_player_reminder', 'match_coach_reminder', 'match_summary_complete'].includes(n.type) && !n.is_read;
        if (tab.key === '系统')
          return ['system', 'order', 'report', 'task', 'inquiry', 'invitation', 'trial_invite', 'scout_report'].includes(n.type) && !n.is_read;
        return false;
      }).length;
    });
    return counts;
  }, [notifications, unreadCount]);

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart size={14} className="text-red-400" />;
      case 'favorite':
        return <Star size={14} className="text-amber-400" />;
      case 'comment':
        return <MessageCircle size={14} className="text-blue-400" />;
      case 'mention':
        return <AtSign size={14} className="text-purple-400" />;
      case 'follow':
        return <UserPlus size={14} className="text-emerald-400" />;
      case 'message':
        return <Mail size={14} className="text-cyan-400" />;
      case 'system':
        return <Settings size={14} className="text-slate-400" />;
      case 'weekly_report_created':
      case 'weekly_report_rejected':
      case 'weekly_report_approved':
        return <FileText size={14} className="text-emerald-400" />;
      case 'match_summary_created':
      case 'match_player_reminder':
      case 'match_coach_reminder':
      case 'match_summary_complete':
        return <Trophy size={14} className="text-amber-400" />;
      case 'invitation':
      case 'trial_invite':
        return <UserPlus size={14} className="text-emerald-400" />;
      case 'scout_report':
        return <FileText size={14} className="text-cyan-400" />;
      default:
        return <Bell size={14} className="text-slate-400" />;
    }
  };

  // 获取通知图标背景色
  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return 'bg-red-500/15 border-red-500/20';
      case 'favorite':
        return 'bg-amber-500/15 border-amber-500/20';
      case 'comment':
        return 'bg-blue-500/15 border-blue-500/20';
      case 'mention':
        return 'bg-purple-500/15 border-purple-500/20';
      case 'follow':
        return 'bg-emerald-500/15 border-emerald-500/20';
      case 'message':
        return 'bg-cyan-500/15 border-cyan-500/20';
      case 'weekly_report_created':
      case 'weekly_report_rejected':
      case 'weekly_report_approved':
        return 'bg-emerald-500/15 border-emerald-500/20';
      case 'match_summary_created':
      case 'match_player_reminder':
      case 'match_coach_reminder':
      case 'match_summary_complete':
        return 'bg-amber-500/15 border-amber-500/20';
      case 'invitation':
      case 'trial_invite':
        return 'bg-emerald-500/15 border-emerald-500/20';
      case 'scout_report':
        return 'bg-cyan-500/15 border-cyan-500/20';
      default:
        return 'bg-slate-500/15 border-slate-500/20';
    }
  };

  // 格式化时间
  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 时间分组
  const getTimeGroup = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days < 1) return '今天';
    if (days < 2) return '昨天';
    if (days < 7) return `${days}天前`;
    return '更早';
  };

  // 获取通知内容描述
  const getNotificationContent = (notification: NotificationItem) => {
    const { type, data } = notification;

    switch (type) {
      case 'like':
        return `${data?.trigger_user_name || '有人'} 点赞了你的内容`;
      case 'favorite':
        return `${data?.trigger_user_name || '有人'} 收藏了你的内容`;
      case 'comment':
        return `${data?.trigger_user_name || '有人'} 评论了你的内容`;
      case 'mention':
        return `${data?.trigger_user_name || '有人'} @了你`;
      case 'follow':
        return `${data?.trigger_user_name || '有人'} 关注了你`;
      case 'message':
        return `${data?.trigger_user_name || '有人'} 发来一条私信`;
      case 'system':
      case 'order':
      case 'report':
      case 'task':
        return notification.title;
      case 'inquiry':
        return notification.title || '收到新的咨询意向';
      case 'weekly_report_created':
        return notification.title || '教练发起了本周周报，请填写';
      case 'weekly_report_rejected':
        return notification.title || '周报被退回，请修改后重新提交';
      case 'weekly_report_approved':
        return notification.title || '周报已审核完成';
      case 'match_summary_created':
        return notification.title || '比赛即将开始，请做好准备';
      case 'match_player_reminder':
        return notification.title || '比赛已结束，请填写自评';
      case 'match_coach_reminder':
        return notification.title || '比赛已结束，请填写点评';
      case 'match_summary_complete':
        return notification.title || '比赛总结已完成';
      case 'invitation': {
        const displayName = notification.data?.team_name || notification.data?.club_name;
        if (displayName) {
          return `${notification.title || '收到邀请'}：${displayName}`;
        }
        return notification.title || '收到新的邀请';
      }
      default:
        return notification.content || notification.title;
    }
  };

  // 分组通知
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    filteredNotifications.forEach((n) => {
      const group = getTimeGroup(n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    // 按优先级排序：今天 > 昨天 > X天前 > 更早
    const order = ['今天', '昨天'];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIdx = order.indexOf(a);
      const bIdx = order.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      // X天前 按数字排序
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return 0;
    });
    return { groups, keys: sortedKeys };
  }, [filteredNotifications]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="glass-card overflow-hidden flex flex-col max-h-[80vh]">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d3748]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
            <Bell size={18} className="text-[#39ff14]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">通知中心</h3>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无新通知'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs text-[#39ff14] hover:text-[#4dff2e] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#39ff14]/10 disabled:opacity-50"
          >
            {markingAll ? (
              <CheckCheck size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            全部已读
          </button>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1.5 px-4 py-3 border-b border-[#2d3748]/60 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tabUnreadCounts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${
                  isActive
                    ? 'bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon size={13} />
              {tab.label}
              {count > 0 && (
                <span
                  className={`
                  min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full
                  ${isActive ? 'bg-[#39ff14] text-[#0a0e14]' : 'bg-red-500 text-white'}
                `}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">加载通知中...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
              <Inbox size={28} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 font-medium">暂无通知</p>
            <p className="text-xs text-slate-600 mt-1">当有新的消息时，你会在这里看到</p>
          </div>
        ) : (
          <div className="pb-3">
            {groupedNotifications.keys.map((groupKey) => (
              <div key={groupKey}>
                {/* 时间分组标题 */}
                <div className="sticky top-0 z-10 px-4 py-2 bg-[#0f1419]/95 backdrop-blur-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {groupKey}
                  </span>
                </div>
                {groupedNotifications.groups[groupKey].map((notification, index) => {
                  const isUnread = !notification.is_read;
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkOneRead(notification)}
                      className={`
                        group relative flex items-start gap-3.5 px-4 py-3.5 
                        transition-all duration-200 cursor-pointer
                        hover:bg-white/[0.03]
                        ${isUnread ? 'bg-white/[0.02]' : ''}
                      `}
                      style={{
                        animationDelay: `${index * 40}ms`,
                      }}
                    >
                      {/* 未读指示条 */}
                      {isUnread && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                      )}

                      {/* 头像 */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`
                          w-10 h-10 rounded-full overflow-hidden border
                          ${isUnread ? 'border-[#39ff14]/30 shadow-[0_0_8px_rgba(57,255,20,0.15)]' : 'border-[#2d3748]'}
                          transition-all duration-300
                        `}
                        >
                          <img
                            src={notification.data?.trigger_avatar || '/images/avatar-default.svg'}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/avatar-default.svg';
                            }}
                          />
                        </div>
                        {/* 类型图标角标 */}
                        <div
                          className={`
                          absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                          flex items-center justify-center border
                          ${getIconBg(notification.type)}
                          bg-[#0f1419]
                          transition-transform duration-200 group-hover:scale-110
                        `}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`
                            text-sm leading-snug
                            ${isUnread ? 'text-white font-medium' : 'text-slate-300'}
                          `}
                          >
                            {getNotificationContent(notification)}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 mt-1.5 rounded-full bg-[#39ff14] flex-shrink-0 shadow-[0_0_6px_rgba(57,255,20,0.6)] animate-pulse" />
                          )}
                        </div>

                        {/* 附加内容 */}
                        {notification.data?.comment_content && (
                          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 bg-white/[0.02] rounded-lg px-2.5 py-1.5 border border-white/5">
                            {notification.data.comment_content}
                          </p>
                        )}
                        {notification.data?.report_title && (
                          <p className="mt-1.5 text-xs text-slate-500 bg-white/[0.02] rounded-lg px-2.5 py-1.5 border border-white/5">
                            报告：{notification.data.report_title}
                          </p>
                        )}
                        {(notification.data as { message_preview?: string } | undefined)?.message_preview && (
                          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 bg-white/[0.02] rounded-lg px-2.5 py-1.5 border border-white/5">
                            {(notification.data as { message_preview?: string }).message_preview}
                          </p>
                        )}

                        {/* 邀请信息展示 */}
                        {notification.type === 'invitation' && (
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                            {(notification.data?.team_name || notification.data?.club_name) && (
                              <span className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-1">
                                <UserPlus size={11} className="text-emerald-400" />
                                {notification.data?.team_name || notification.data?.club_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Sparkles size={10} className="text-slate-600" />
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                        )}

                        {/* 邀请操作按钮 */}
                        {/* 邀请操作按钮 — 仅对未处理且未过期的邀请显示 */}
                        {notification.type === 'invitation' &&
                          !notification.data?._handled &&
                          notification.data?.status !== 'accepted' &&
                          notification.data?.status !== 'rejected' &&
                          notification.data?.status !== 'expired' && (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={(e) => handleRejectInvite(notification, e)}
                                disabled={actionLoading === notification.id}
                                className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                              >
                                {actionLoading === notification.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <X size={12} />
                                )}
                                拒绝
                              </button>
                              <button
                                onClick={(e) => handleAcceptInvite(notification, e)}
                                disabled={actionLoading === notification.id}
                                className="px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors flex items-center gap-1"
                              >
                                {actionLoading === notification.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                同意加入
                              </button>
                            </div>
                          )}
                        {/* 已处理状态 */}
                        {(notification.type === 'invitation' && (notification.data?._handled ||
                          notification.data?.status === 'accepted' ||
                          notification.data?.status === 'rejected')) && (
                          <div className="mt-2 text-xs text-slate-500">
                            {(notification.data?._handled === 'accepted' || notification.data?.status === 'accepted') ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check size={12} />
                                {notification.data?.club_id ? '已加入俱乐部' : '已加入球队'}
                              </span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1">
                                <X size={12} /> 已拒绝
                              </span>
                            )}
                          </div>
                        )}

                        <p className="mt-2 text-[11px] text-slate-600 flex items-center gap-1">
                          <Sparkles size={10} className="text-slate-700" />
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部 */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-[#2d3748]/60 text-center bg-[#0f1419]/50">
          <a
            href="/notifications"
            className="text-xs text-slate-500 hover:text-[#39ff14] transition-colors flex items-center justify-center gap-1.5"
          >
            <Bell size={12} />
            查看全部通知
          </a>
        </div>
      )}
    </div>
  );
}

// 红点提示组件（用于 Navbar）
export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();

      // WebSocket 实时更新
      const unsubscribe = wsService.subscribe((payload: NotificationPayload) => {
        setUnreadCount((prev) => prev + 1);

        // 浏览器通知（如果支持）
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.title, {
            body: payload.content,
            icon: '/favicon.ico',
          });
        }
      });

      wsService.connect();

      // 每 30 秒刷新一次（备用）
      const interval = setInterval(fetchUnreadCount, 30000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.data?.count ?? res.data?.count ?? 0);
    } catch (error) {
      console.error('获取未读数失败:', error);
    }
  };

  if (!isAuthenticated || unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-sm shadow-red-500/30 animate-pulse">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
