// @ts-nocheck
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { socialApi } from '../services/api';
import { Loading } from '../components';
import { ArrowLeft, UserPlus, UserCheck, Users } from 'lucide-react';
import { LazyImage } from '../components';
import { toast } from 'sonner';

interface FollowUser {
  id: number;
  nickname: string;
  avatar: string;
  role: string;
  followed_at: string;
}

type ListType = 'followers' | 'following';

const roleMap: Record<string, string> = {
  user: '球员',
  player: '球员',
  coach: '教练',
  analyst: '分析师',
  scout: '球探',
  club: '俱乐部',
  admin: '管理员',
};

const FollowListPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [listType, setListType] = useState<ListType>('followers');
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [followStatusMap, setFollowStatusMap] = useState<Record<number, boolean>>({});
  const pageSize = 20;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 从 URL query 读取 type
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type') as ListType;
    if (type === 'followers' || type === 'following') {
      setListType(type);
    }
  }, []);

  const fetchList = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!userId) return;
    const targetId = parseInt(userId, 10);
    if (isNaN(targetId)) return;

    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const api = listType === 'followers'
        ? socialApi.getFollowers
        : socialApi.getFollowing;

      const res = await api(targetId, { page: pageNum, page_size: pageSize });
      const data = res.data?.data || res.data;
      const list: FollowUser[] = data?.list || [];
      const t = data?.total || 0;

      setTotal(t);
      if (append) {
        setUsers(prev => [...prev, ...list]);
      } else {
        setUsers(list);
      }
      setHasMore(list.length === pageSize && (append ? users.length + list.length : list.length) < t);

      // 获取当前登录用户的关注状态
      const stored = localStorage.getItem('user');
      const currentUser = stored ? JSON.parse(stored) : null;
      if (currentUser?.id && list.length > 0) {
        const statusMap: Record<number, boolean> = {};
        await Promise.all(
          list.map(async (u) => {
            if (u.id === currentUser.id) return;
            try {
              const statusRes = await socialApi.getFollowStatus(u.id);
              const statusData = statusRes.data?.data || statusRes.data;
              statusMap[u.id] = statusData?.is_following || false;
            } catch {
              statusMap[u.id] = false;
            }
          })
        );
        setFollowStatusMap(prev => ({ ...prev, ...statusMap }));
      }
    } catch (err) {
      console.error('获取列表失败:', err);
      toast.error('获取列表失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, listType, users.length]);

  // 初始加载
  useEffect(() => {
    setPage(1);
    setUsers([]);
    setHasMore(true);
    fetchList(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listType, userId]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setPage(prev => {
          const next = prev + 1;
          fetchList(next, true);
          return next;
        });
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading, fetchList]);

  const handleToggleFollow = async (targetId: number) => {
    try {
      const res = await socialApi.toggleFollow(targetId);
      const data = res.data?.data || res.data;
      const isFollowing = data?.following || false;
      setFollowStatusMap(prev => ({ ...prev, [targetId]: isFollowing }));
      toast.success(isFollowing ? '关注成功' : '取消关注成功');
    } catch {
      toast.error('操作失败');
    }
  };

  const title = listType === 'followers' ? '粉丝' : '关注';
  const storedUser = localStorage.getItem('user');
  const currentUserId = storedUser ? JSON.parse(storedUser)?.id : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12]">
      <div className="max-w-[600px] mx-auto px-4 pt-6 pb-12">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <span className="text-sm text-gray-500">({total})</span>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              navigate(`/followers/${userId}`, { replace: true });
              setListType('followers');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              listType === 'followers'
                ? 'bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.3)] text-[#39ff14]'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/80'
            }`}
          >
            <Users size={16} />
            粉丝
          </button>
          <button
            onClick={() => {
              navigate(`/following/${userId}`, { replace: true });
              setListType('following');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              listType === 'following'
                ? 'bg-[rgba(57,255,20,0.1)] border border-[rgba(57,255,20,0.3)] text-[#39ff14]'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/80'
            }`}
          >
            <UserCheck size={16} />
            关注
          </button>
        </div>

        {/* 用户列表 */}
        {loading && users.length === 0 ? (
          <div className="py-20">
            <Loading />
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 text-sm">
              {listType === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={`${u.id}-${u.followed_at}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* 头像 */}
                <Link to={`/personal-homepage/${u.id}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    {u.avatar ? (
                      <LazyImage
                        src={u.avatar}
                        alt={u.nickname}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(57,255,20,0.15)] to-[rgba(0,212,255,0.15)]">
                        <span className="text-lg">⚽</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <Link to={`/personal-homepage/${u.id}`}>
                    <p className="text-white font-medium text-sm truncate hover:text-[#39ff14] transition-colors">
                      {u.nickname || '未知用户'}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/40">
                      {roleMap[u.role] || u.role}
                    </span>
                    <span className="text-xs text-white/20">
                      {new Date(u.followed_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>

                {/* 关注按钮 */}
                {currentUserId && u.id !== currentUserId && (
                  <button
                    onClick={() => handleToggleFollow(u.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      followStatusMap[u.id]
                        ? 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/15'
                        : 'bg-[rgba(57,255,20,0.1)] text-[#39ff14] border border-[rgba(57,255,20,0.3)] hover:bg-[rgba(57,255,20,0.2)]'
                    }`}
                  >
                    {followStatusMap[u.id] ? (
                      <>
                        <UserCheck size={13} />
                        已关注
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} />
                        关注
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}

            {/* 加载更多 */}
            <div ref={loadMoreRef} className="py-4 text-center">
              {loadingMore && <Loading />}
              {!hasMore && users.length > 0 && (
                <p className="text-white/20 text-xs">已经到底了</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowListPage;
