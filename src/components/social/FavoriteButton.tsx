import { useState } from 'react';
import { Star } from 'lucide-react';
import { socialApi } from '../../services/api';
import { useAuthStore } from '../../store';

interface FavoriteButtonProps {
  targetType: string;
  targetId: number;
  initialFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (favorited: boolean) => void;
}

export function FavoriteButton({
  targetType,
  targetId,
  initialFavorited = false,
  size = 'md',
  showText = false,
  onToggle,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
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
      window.location.href = '/login';
      return;
    }

    if (loading) return;

    setLoading(true);
    // 乐观更新
    const newFavorited = !favorited;
    setFavorited(newFavorited);

    if (newFavorited) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }

    try {
      await socialApi.toggleFavorite({ target_type: targetType, target_id: targetId });
      onToggle?.(newFavorited);
    } catch (error) {
      // 回滚
      setFavorited(!newFavorited);
      console.error('收藏失败:', error);
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
        ${favorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}
        ${text}
      `}
      title={favorited ? '取消收藏' : '收藏'}
    >
      <Star
        size={icon}
        className={`
          transition-all duration-300
          ${favorited ? 'fill-current' : ''}
          ${animating ? 'scale-125 rotate-12' : favorited ? 'scale-105' : 'hover:scale-110'}
        `}
      />
      {showText && (
        <span className="font-medium">
          {favorited ? '已收藏' : '收藏'}
        </span>
      )}
    </button>
  );
}
