import { useState } from 'react';
import { Heart } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';

interface LikeButtonProps {
  targetType: string;
  targetId: number;
  initialLiked?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onToggle?: (liked: boolean) => void;
}

export function LikeButton({
  targetType,
  targetId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  showCount = true,
  onToggle,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const sizeConfig = {
    sm: { icon: 16, text: 'text-sm' },
    md: { icon: 20, text: 'text-base' },
    lg: { icon: 24, text: 'text-lg' },
  };

  const { icon, text } = sizeConfig[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // 未登录时提示登录
      window.location.href = '/login';
      return;
    }

    if (loading) return;

    setLoading(true);
    // 乐观更新
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => (newLiked ? c + 1 : c - 1));

    // 触发动画
    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    try {
      await socialApi.toggleLike({ target_type: targetType, target_id: targetId });
      onToggle?.(newLiked);
    } catch (error) {
      // 回滚
      setLiked(!newLiked);
      setCount((c) => (!newLiked ? c + 1 : c - 1));
      console.error('点赞失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-1.5 transition-all duration-200
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}
        ${text}
      `}
    >
      <Heart
        size={icon}
        className={`
          transition-transform duration-300
          ${liked ? 'fill-current scale-110' : 'hover:scale-110'}
          ${animating ? 'animate-pulse scale-125' : ''}
        `}
      />
      {showCount && (
        <span className="font-medium tabular-nums">{count}</span>
      )}
    </button>
  );
}

interface LikeButtonWithAuthCheckProps extends LikeButtonProps {
  requireAuth?: boolean;
}

export function LikeButtonWithAuth({
  requireAuth = true,
  ...props
}: LikeButtonWithAuthCheckProps) {
  const { isAuthenticated } = useAuthStore();

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <LikeButton {...props} />;
}
