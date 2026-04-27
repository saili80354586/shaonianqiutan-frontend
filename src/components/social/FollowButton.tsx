import { useState, useCallback } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';

interface FollowButtonProps {
  userId: number;
  initialFollowing?: boolean;
  initialFollowerCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline';
  showCount?: boolean;
  onFollowChange?: (following: boolean, followerCount: number) => void;
}

export function FollowButton({
  userId,
  initialFollowing = false,
  initialFollowerCount = 0,
  size = 'md',
  variant = 'primary',
  showCount = false,
  onFollowChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const sizeConfig = {
    sm: { height: 'h-7', px: 'px-3', icon: 14, text: 'text-xs', gap: 'gap-1' },
    md: { height: 'h-9', px: 'px-4', icon: 16, text: 'text-sm', gap: 'gap-1.5' },
    lg: { height: 'h-11', px: 'px-5', icon: 18, text: 'text-base', gap: 'gap-2' },
  };

  const { height, px, icon, text, gap } = sizeConfig[size];

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (loading) return;

    setLoading(true);
    const newFollowing = !following;

    // 乐观更新
    setFollowing(newFollowing);
    const newCount = newFollowing ? followerCount + 1 : Math.max(0, followerCount - 1);
    setFollowerCount(newCount);

    try {
      const res = await socialApi.toggleFollow(userId);
      const data = res.data?.data;
      if (data) {
        setFollowing(data.following);
        setFollowerCount(data.follower_count ?? newCount);
        onFollowChange?.(data.following, data.follower_count ?? newCount);
      } else {
        onFollowChange?.(newFollowing, newCount);
      }
    } catch (error) {
      // 回滚
      setFollowing(!newFollowing);
      setFollowerCount(followerCount);
      console.error('关注操作失败:', error);
    } finally {
      setLoading(false);
    }
  }, [following, followerCount, loading, isAuthenticated, userId, onFollowChange]);

  const getButtonContent = () => {
    if (following) {
      const label = hovered ? '取消关注' : '已关注';
      return (
        <>
          <UserCheck size={icon} />
          <span>{label}</span>
        </>
      );
    }
    return (
      <>
        <UserPlus size={icon} />
        <span>关注</span>
      </>
    );
  };

  const baseClasses = `
    inline-flex items-center justify-center ${gap} ${height} ${px} ${text}
    rounded-lg font-medium transition-all duration-200 select-none
    ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const variantClasses = following
    ? 'bg-[#1a2332] text-gray-300 border border-[#2d3748] hover:border-red-500/50 hover:text-red-400'
    : variant === 'primary'
      ? 'bg-[#39ff14] text-[#0a0e17] hover:bg-[#32e612] hover:shadow-[0_0_12px_rgba(57,255,20,0.3)]'
      : 'bg-transparent text-[#39ff14] border border-[#39ff14] hover:bg-[#39ff14]/10';

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${baseClasses} ${variantClasses}`}
      disabled={loading}
    >
      {getButtonContent()}
      {showCount && (
        <span className="tabular-nums opacity-80">{followerCount}</span>
      )}
    </button>
  );
}
