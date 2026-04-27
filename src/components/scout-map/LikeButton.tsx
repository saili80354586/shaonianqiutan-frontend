import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check } from 'lucide-react';

interface LikeButtonProps {
  liked: boolean;
  likeCount: number;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isMember?: boolean;
  onMemberRequired?: () => void;
}

export function LikeButton({
  liked,
  likeCount,
  onToggle,
  size = 'md',
  disabled = false,
  isMember = false,
  onMemberRequired,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [localLiked, setLocalLiked] = useState(liked);
  const [localCount, setLocalCount] = useState(likeCount);

  const handleClick = useCallback(() => {
    if (disabled && !isMember) {
      onMemberRequired?.();
      return;
    }

    // 动画效果
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // 更新本地状态
    setLocalLiked(!localLiked);
    setLocalCount(localLiked ? localCount - 1 : localCount + 1);

    // 调用外部处理
    onToggle();
  }, [disabled, isMember, localLiked, localCount, onToggle, onMemberRequired]);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
          localLiked
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200'
        } ${disabled && !isMember ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <motion.div
          animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {localLiked ? (
            <Heart className={`${iconSizes[size]} fill-current`} />
          ) : (
            <Heart className={iconSizes[size]} />
          )}
        </motion.div>
      </motion.button>

      <span className={`${textSizes[size]} font-medium text-slate-300`}>
        {localCount}
      </span>
    </div>
  );
}

// 点赞列表组件（显示最近点赞用户）
interface LikeUsersProps {
  users: { id: string; nickname: string; avatar: string }[];
  maxDisplay?: number;
}

export function LikeUsers({ users, maxDisplay = 5 }: LikeUsersProps) {
  const displayUsers = users.slice(0, maxDisplay);
  const remaining = users.length - maxDisplay;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <motion.img
            key={user.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            src={user.avatar}
            alt={user.nickname}
            className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-700"
            title={user.nickname}
          />
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center">
            <span className="text-xs text-slate-400">+{remaining}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 点赞动画效果组件
interface LikeAnimationProps {
  show: boolean;
  onComplete: () => void;
}

export function LikeAnimation({ show, onComplete }: LikeAnimationProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: [0.5, 1.2, 1], y: [0, -20, 0] }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <Heart className="w-16 h-16 fill-red-500 text-red-500" />
    </motion.div>
  );
}
