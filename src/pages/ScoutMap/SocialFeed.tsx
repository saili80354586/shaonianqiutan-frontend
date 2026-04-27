import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, Share2, Users, Sparkles, Edit3, X, Loader2, ImageIcon } from 'lucide-react';
import { socialApi } from '../../services/api';

type FeedTab = 'all' | 'player' | 'coach' | 'club' | 'scout';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'player', label: '球员' },
  { key: 'coach', label: '教练' },
  { key: 'club', label: '俱乐部' },
  { key: 'scout', label: '球探' },
];

const ROLE_BADGE: Record<string, { text: string; color: string }> = {
  player: { text: '球员', color: '#39ff14' },
  coach: { text: '教练', color: '#00d4ff' },
  club: { text: '俱乐部', color: '#fbbf24' },
  scout: { text: '球探', color: '#a855f7' },
  user: { text: '用户', color: '#94a3b8' },
  analyst: { text: '分析师', color: '#ec4899' },
  admin: { text: '管理员', color: '#ef4444' },
};

interface PostAuthor {
  name: string;
  avatar: string;
  role: string;
}

interface PostItem {
  id: number;
  user_id: number;
  content: string;
  images: string[];
  target_type: string;
  target_id: number;
  role_tag: string;
  likes_count: number;
  comments_count: number;
  is_top: boolean;
  is_liked: boolean;
  created_at: string;
  author: PostAuthor;
}

interface Props {
  onPostClick?: (postId: number) => void;
  userId?: number;
  hideCreate?: boolean;
  title?: string;
  maxPosts?: number;
}

interface CommentUser {
  name?: string;
  nickname?: string;
  avatar?: string;
}

interface CommentItem {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: CommentUser;
}

const getCommentUserName = (user?: CommentUser) => {
  return user?.nickname || user?.name || '未知用户';
};

const formatRelativeTime = (dateStr: string) => {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString();
};

const PostImages: React.FC<{ images: string[] }> = ({ images }) => {
  if (!images || images.length === 0) return null;
  const visible = images.slice(0, 4);
  const gridClass = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3';
  return (
    <div className={`grid ${gridClass} gap-2 mt-3 mb-4`}>
      {visible.map((img, idx) => (
        <div key={idx} className={`relative rounded-lg overflow-hidden border border-[#2d3748] bg-[#0a0e17] ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
};

// 图片压缩：最大宽度 1200px，JPEG 质量 0.8
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas context error')); return; }
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const CreatePostModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; defaultRoleTag?: string }> = ({ isOpen, onClose, onSuccess, defaultRoleTag }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 9 - images.length;
    if (remaining <= 0) { alert('最多上传 9 张图片'); return; }
    const toProcess = Array.from(files).slice(0, remaining);
    setCompressing(true);
    try {
      const compressed = await Promise.all(toProcess.map((f) => compressImage(f)));
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      alert('图片处理失败，请重试');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const hasContent = content.trim().length > 0;
    if (!hasContent && images.length === 0) return;
    setSubmitting(true);
    try {
      const res = await socialApi.createPost({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        role_tag: defaultRoleTag || 'all'
      });
      if (res.data?.success) {
        setContent('');
        setImages([]);
        onClose();
        onSuccess();
      } else {
        alert(res.data?.error?.message || '发布失败');
      }
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || '发布失败，请检查网络');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = (content.trim().length > 0 || images.length > 0) && !submitting && !compressing;

  // 预览网格列数：1张1列，2张2列，3-9张3列
  const previewGridClass = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-2xl p-5 w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#f8fafc]">发布动态</h3>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#f8fafc]"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你的训练日常、选材见闻或招募信息..."
            className="w-full h-32 bg-[#0a0e17] border border-[#2d3748] rounded-xl p-3 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14] resize-none"
            maxLength={2000}
          />

          {images.length > 0 && (
            <div className={`grid ${previewGridClass} gap-2 mt-3`}>
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-[#2d3748] bg-[#0a0e17] group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2d3748]">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 9 || compressing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#94a3b8] hover:text-[#39ff14] hover:bg-[#39ff14]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              图片 {images.length > 0 ? `(${images.length}/9)` : ''}
            </button>
            <span className="text-xs text-[#64748b]">{content.length}/2000</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#39ff14] text-[#0a0e17] rounded-lg font-medium hover:bg-[#32e612] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            发布
          </button>
        </div>
      </div>
    </div>
  );
};

// 评论弹窗
const CommentModal: React.FC<{
  isOpen: boolean;
  postId: number;
  onClose: () => void;
  onCommented: () => void;
}> = ({ isOpen, postId, onClose, onCommented }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await socialApi.getComments({
        target_type: 'post',
        target_id: postId,
        page: 1,
        pageSize: 50,
      });
      if (res.data?.success) {
        setComments(res.data.data?.list || []);
      }
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId, fetchComments]);

  const handleSubmit = async () => {
    const text = content.trim();
    if (!text || !postId) return;
    setSubmitting(true);
    try {
      const res = await socialApi.createComment({
        target_type: 'post',
        target_id: postId,
        content: text,
      });
      if (res.data?.success) {
        setContent('');
        onCommented();
        fetchComments();
      } else {
        alert(res.data?.error?.message || '评论失败');
      }
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || '评论失败，请检查网络');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1a1f2e] border-t border-[#2d3748] rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2d3748]">
          <h3 className="text-base font-semibold text-[#f8fafc]">
            评论 {comments.length > 0 ? `(${comments.length})` : ''}
          </h3>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#f8fafc]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 评论列表 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && comments.length === 0 && (
            <div className="flex items-center justify-center h-20 text-[#64748b]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              加载中...
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-8 text-[#64748b] text-sm">
              暂无评论，来说两句吧～
            </div>
          )}
          {comments.map((c) => {
            const userName = getCommentUserName(c.user);
            return (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a2332] flex items-center justify-center text-xs font-bold text-[#f8fafc] overflow-hidden shrink-0">
                  {c.user?.avatar ? (
                    <img src={c.user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    userName.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#94a3b8] mb-0.5">{userName}</div>
                  <div className="text-sm text-[#cbd5e1] whitespace-pre-wrap break-words">{c.content}</div>
                  <div className="text-[11px] text-[#64748b] mt-1">{formatRelativeTime(c.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部输入 */}
        <div className="px-4 py-3 border-t border-[#2d3748] bg-[#1a1f2e]">
          <div className="flex items-center gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="写评论..."
              maxLength={500}
              className="flex-1 bg-[#0a0e17] border border-[#2d3748] rounded-xl px-3 py-2 text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14]"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="px-4 py-2 bg-[#39ff14] text-[#0a0e17] rounded-xl text-sm font-medium hover:bg-[#32e612] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialFeed: React.FC<Props> = ({ onPostClick, userId, hideCreate, title, maxPosts = 20 }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);

  const fetchFeed = async (tab: FeedTab) => {
    setLoading(true);
    try {
      const params: any = { page: 1, page_size: maxPosts };
      if (userId) {
        params.user_id = userId;
      } else {
        params.role_tag = tab;
      }
      const res = await socialApi.getFeed(params);
      if (res.data?.success) {
        setPosts(res.data.data?.list || []);
      }
    } catch {
      // 静默失败，保持当前列表或空状态
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) setLoading(true); });
    const params: any = { page: 1, page_size: maxPosts };
    if (userId) {
      params.user_id = userId;
    } else {
      params.role_tag = activeTab;
    }
    socialApi.getFeed(params)
      .then((res) => { if (mounted && res.data?.success) setPosts(res.data.data?.list || []); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [activeTab, userId, maxPosts]);

  const handleLike = async (e: React.MouseEvent, post: PostItem) => {
    e.stopPropagation();
    try {
      const res = await socialApi.togglePostLike(post.id);
      if (res.data?.success) {
        const liked = res.data.data?.liked;
        setPosts((prev) => prev.map((p) =>
          p.id === post.id
            ? { ...p, is_liked: liked, likes_count: Math.max(0, p.likes_count + (liked ? 1 : -1)) }
            : p
        ));
      }
    } catch {
      // 静默失败
    }
  };

  const handleOpenComments = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    setCommentPostId(postId);
  };

  const handleCommented = (postId: number) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
    ));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-[#39ff14]" />
            {title || '社区动态'}
          </h2>
          {!userId && <p className="text-[#94a3b8]">发现训练日常、选材见闻与招募信息</p>}
        </div>
        {!hideCreate && (
          <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#39ff14] text-[#0a0e17] rounded-lg font-medium hover:bg-[#32e612] transition-colors">
            <Edit3 className="w-4 h-4" />
            发布动态
          </button>
        )}
      </div>

      {!userId && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-[#2d3748]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-[#39ff14] text-[#0a0e17]'
                  : 'bg-[#1a2332] text-[#94a3b8] border border-[#2d3748] hover:border-[#39ff14]/50 hover:text-[#f8fafc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading && posts.length === 0 && (
        <div className="flex items-center justify-center h-40 text-[#64748b]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          加载中...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[#2d3748] rounded-2xl bg-[rgba(255,255,255,0.02)]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1a2332] mb-3">
            <Sparkles className="w-5 h-5 text-[#94a3b8]" />
          </div>
          <p className="text-[#94a3b8]">{userId ? '暂无动态' : '暂无动态，来发布第一条吧'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {posts.map((post) => {
          const badge = ROLE_BADGE[post.author?.role] || ROLE_BADGE.user;
          return (
            <div
              key={post.id}
              onClick={() => onPostClick?.(post.id)}
              className="bg-[rgba(255,255,255,0.03)] border border-[#2d3748] rounded-2xl p-5 hover:border-[#39ff14]/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full bg-[#1a2332] flex items-center justify-center text-sm font-bold text-[#f8fafc] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#39ff14]/40 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    const role = post.author?.role;
                    const uid = post.user_id;
                    if (!uid) return;
                    if (role === 'player' || role === 'user') navigate(`/personal-homepage/${uid}`);
                    else if (role === 'coach') navigate(`/coach/${uid}`);
                    else if (role === 'scout') navigate(`/scout/${uid}`);
                    else if (role === 'analyst') navigate(`/analyst/${uid}`);
                    else if (role === 'club') navigate(`/club/${uid}`);
                    else navigate(`/personal-homepage/${uid}`);
                  }}
                >
                  {post.author?.avatar ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" /> : post.author?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div
                    className="text-sm font-medium text-[#f8fafc] cursor-pointer hover:text-[#39ff14] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const role = post.author?.role;
                      const uid = post.user_id;
                      if (!uid) return;
                      if (role === 'player' || role === 'user') navigate(`/personal-homepage/${uid}`);
                      else if (role === 'coach') navigate(`/coach/${uid}`);
                      else if (role === 'scout') navigate(`/scout/${uid}`);
                      else if (role === 'analyst') navigate(`/analyst/${uid}`);
                      else if (role === 'club') navigate(`/club/${uid}`);
                      else navigate(`/personal-homepage/${uid}`);
                    }}
                  >
                    {post.author?.name || '未知用户'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
                    >
                      {badge.text}
                    </span>
                    <span className="text-xs text-[#64748b]">{formatRelativeTime(post.created_at)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#cbd5e1] mb-2 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
              <PostImages images={post.images || []} />
              <div className="flex items-center gap-5 text-xs text-[#94a3b8]">
                <button
                  onClick={(e) => handleLike(e, post)}
                  className={`flex items-center gap-1.5 transition-colors ${post.is_liked ? 'text-red-400' : 'hover:text-[#39ff14]'}`}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} /> {post.likes_count || 0}
                </button>
                <button
                  onClick={(e) => handleOpenComments(e, post.id)}
                  className="flex items-center gap-1.5 hover:text-[#00d4ff] transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> {post.comments_count || 0}
                </button>
                <button className="flex items-center gap-1.5 hover:text-[#fbbf24] transition-colors">
                  <Share2 className="w-4 h-4" /> 分享
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && posts.length > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2332] border border-[#2d3748] rounded-lg text-sm text-[#94a3b8]">
            <Sparkles className="w-4 h-4" />
            已展示最新动态
          </div>
        </div>
      )}

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => fetchFeed(activeTab)} defaultRoleTag={activeTab === 'all' ? undefined : activeTab} />
      <CommentModal
        isOpen={commentPostId !== null}
        postId={commentPostId || 0}
        onClose={() => setCommentPostId(null)}
        onCommented={() => {
          if (commentPostId) handleCommented(commentPostId);
        }}
      />
    </div>
  );
};

export default SocialFeed;
