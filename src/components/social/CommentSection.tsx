import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';
import type { CommentItem, User } from '../../types';

interface CommentSectionProps {
  targetType: string;
  targetId: number;
  maxLength?: number;
  placeholder?: string;
}

export function CommentSection({
  targetType,
  targetId,
  maxLength = 500,
  placeholder = '发表你的看法...',
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const { user, isAuthenticated } = useAuthStore();

  // 加载评论
  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  const loadComments = async () => {
    try {
      const res = await socialApi.getComments({
        targetType,
        targetId,
        page: 1,
        pageSize: 50,
      });
      const list = res.data?.data || res.data || [];
      setComments(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await socialApi.createComment({
        target_type: targetType,
        target_id: targetId,
        parent_id: replyingTo?.id,
        content: content.trim(),
      });

      if (res.data) {
        if (replyingTo) {
          // 添加回复到对应评论
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), res.data] }
                : c
            )
          );
          setExpandedReplies((prev) => new Set([...prev, replyingTo.id]));
        } else {
          // 添加根评论
          setComments((prev) => [res.data, ...prev]);
        }
        setContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评论
  const handleDelete = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await socialApi.deleteComment(commentId);
      // 从列表中移除
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId),
          }))
      );
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 切换回复展开
  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
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
    return date.toLocaleDateString();
  };

  // 获取用户头像 URL
  const getAvatarUrl = (u?: User) => {
    if (!u) return '/images/avatar-default.svg';
    return u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;
  };

  // 获取用户名
  const getName = (u?: User) => {
    return u?.nickname || u?.name || '匿名用户';
  };

  // 渲染单个评论
  const renderComment = (comment: CommentItem, isReply = false) => (
    <div
      key={comment.id}
      className={`flex gap-3 ${isReply ? 'ml-8 mt-2' : ''}`}
    >
      <img
        src={getAvatarUrl(comment.user)}
        alt={getName(comment.user)}
        className="w-8 h-8 flex-shrink-0 rounded-full object-cover bg-gray-100"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{getName(comment.user)}</span>
          <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
        </div>

        <p className="text-sm mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex items-center gap-4 mt-1.5">
          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment)}
              className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1"
            >
              <MessageCircle size={12} />
              回复
            </button>
          )}

          {comment.user_id === user?.id && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 size={12} />
              删除
            </button>
          )}
        </div>

        {/* 回复列表 */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <>
            <button
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-600"
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp size={12} />
                  收起回复
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  查看{comment.replies.length}条回复
                </>
              )}
            </button>

            {expandedReplies.has(comment.id) && (
              <div className="mt-2">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </>
        )}

        {/* 回复输入框 */}
        {replyingTo?.id === comment.id && (
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="flex items-start gap-2">
              <img
                src={user?.avatar || '/images/avatar-default.svg'}
                alt="我的头像"
                className="w-6 h-6 flex-shrink-0 rounded-full object-cover bg-gray-100"
              />
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
                  placeholder={`回复 @${getName(replyingTo.user)}`}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    {content.length}/{maxLength}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setContent('');
                      }}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={!content.trim() || submitting}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
                    >
                      {submitting ? '发送中...' : '发送'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 评论输入框 */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <img
              src={user?.avatar || '/images/avatar-default.svg'}
              alt="我的头像"
              className="w-10 h-10 flex-shrink-0 rounded-full object-cover bg-gray-100"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
                placeholder={placeholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {content.length}/{maxLength}
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} />
                  {submitting ? '发送中...' : '发表评论'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-sm">
            <a href="/login" className="text-blue-500 hover:underline">登录</a>
            后才能发表评论
          </p>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            暂无评论，来发表第一条评论吧
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500">
              {comments.length} 条评论
            </div>
            <div className="space-y-4 divide-y divide-gray-100">
              {comments.map((comment) => renderComment(comment))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
