import React, { useState, useRef, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';

export interface PlayerPosition {
  id: string;
  type: 'our' | 'opp'; // 我方 / 对方
  number: number;
  x: number; // 0-100 (百分比)
  y: number; // 0-100 (百分比)
  label?: string; // 自定义标签
}

/** 足球位置数据 */
export interface BallPosition {
  x: number; // 0-100 (百分比)
  y: number; // 0-100 (百分比)
}

interface DraggablePlayerProps {
  player: PlayerPosition;
  onUpdate: (player: PlayerPosition) => void;
  onDelete: (id: string) => void;
  onEditNumber?: (id: string) => void;
  disabled?: boolean;
}

// 球员圆形直径：36px（原48px的0.75倍）
const PLAYER_SIZE = 36;

export const DraggablePlayer: React.FC<DraggablePlayerProps> = ({
  player,
  onUpdate,
  onDelete,
  onEditNumber,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (disabled) return;
    e.preventDefault();

    const rect = playerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    dragOffset.current = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };

    setIsDragging(true);
  };

  // 拖拽移动
  useEffect(() => {
    if (!isDragging || disabled) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = playerRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        // 防止触屏滚动
        if (e.cancelable) e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      let x = ((clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
      let y = ((clientY - rect.top - dragOffset.current.y) / rect.height) * 100;

      x = Math.max(3, Math.min(97, x));
      y = Math.max(3, Math.min(97, y));

      onUpdate({ ...player, x, y });
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, player, onUpdate, disabled]);

  // 处理删除
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(player.id);
  };

  // 处理编辑编号
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditNumber?.(player.id);
  };

  // 我方/对方颜色
  const ourTeamColor = player.type === 'our' ? {
    bg: 'bg-[#39ff14]',
    text: 'text-black',
    border: 'border-[#39ff14]',
    shadow: 'shadow-[0_0_10px_rgba(57,255,20,0.4)]',
  } : {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-500',
    shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]',
  };

  const { bg, text, shadow } = ourTeamColor;

  return (
    <div
      ref={playerRef}
      data-player="true"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseEnter={() => !isDragging && !disabled && setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
      className={`
        absolute rounded-full flex items-center justify-center
        font-bold cursor-pointer select-none touch-none
        transition-all duration-150 ease-out
        ${bg} ${text}
        ${isDragging ? 'scale-110 z-50 ring-2 ring-white/50' : 'z-10'}
        ${isHovered && !isDragging ? `${shadow} scale-105` : ''}
        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
      `}
      style={{
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        left: `${player.x}%`,
        top: `${player.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: PLAYER_SIZE * 0.42,
      }}
    >
      <span className="drop-shadow-sm pointer-events-none">{player.number}</span>

      {/* 删除按钮 */}
      {isHovered && !isDragging && !disabled && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-white rounded-full
            flex items-center justify-center shadow-lg hover:bg-red-50
            border border-gray-200 transition-colors z-50"
          title="删除"
        >
          <X size={10} className="text-red-500" />
        </button>
      )}

      {/* 编辑编号按钮 */}
      {isHovered && !isDragging && !disabled && onEditNumber && (
        <button
          onClick={handleEdit}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute -bottom-1.5 -left-1.5 w-[18px] h-[18px] bg-white rounded-full
            flex items-center justify-center shadow-lg hover:bg-blue-50
            border border-gray-200 transition-colors z-50"
          title="编辑编号"
        >
          <Edit2 size={9} className="text-blue-500" />
        </button>
      )}
    </div>
  );
};

// ════════════════════════════════════════
// 足球组件（可拖拽）
// ════════════════════════════════════════

interface SoccerBallProps {
  ball: BallPosition;
  onUpdate: (ball: BallPosition) => void;
  disabled?: boolean;
}

export const SoccerBall: React.FC<SoccerBallProps> = ({ ball, onUpdate, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = ballRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    dragOffset.current = {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || disabled) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const container = ballRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        if (e.cancelable) e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = Math.max(2, Math.min(98, ((clientX - rect.left - dragOffset.current.x) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((clientY - rect.top - dragOffset.current.y) / rect.height) * 100));
      onUpdate({ x, y });
    };

    const handleUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, onUpdate, disabled]);

  // 足球大小：球员圆形的 0.75 倍（与球员缩放比例一致）
  const BALL_SIZE = Math.round(PLAYER_SIZE * 0.75);

  return (
    <div
      ref={ballRef}
      data-ball="true"
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        absolute rounded-full flex items-center justify-center
        cursor-grab active:cursor-grabbing select-none touch-none
        transition-all duration-150 ease-out
        bg-white shadow-lg
        ${isDragging ? 'scale-120 z-40' : 'z-5'}
        ${isHovered && !isDragging ? 'scale-110 shadow-xl' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      style={{
        width: BALL_SIZE,
        height: BALL_SIZE,
        left: `${ball.x}%`,
        top: `${ball.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      title="足球 · 拖拽移动"
    >
      {/* 足球 SVG 经典图案（白色底 + 黑色五边形） */}
      <svg width={BALL_SIZE * 0.7} height={BALL_SIZE * 0.7} viewBox="0 0 24 24" fill="none">
        {/* 外圈 */}
        <circle cx="12" cy="12" r="11" stroke="#1a1a1a" strokeWidth="1.5"/>
        {/* 中心五边形 */}
        <path d="M12 5 L15.5 8 L14 12.5 L10 12.5 L8.5 8 Z" fill="#1a1a1a"/>
        {/* 周围5个五边形 */}
        <path d="M15.5 8 L20 6.5 L21 11 L17 12.5 Z" fill="#1a1a1a"/>
        <path d="M14 12.5 L17 12.5 L16 18 L12 16.5 Z" fill="#1a1a1a"/>
        <path d="M10 12.5 L12 16.5 L8 18 L7 12.5 Z" fill="#1a1a1a"/>
        <path d="M8.5 8 L7 12.5 L3 11 L4 6.5 Z" fill="#1a1a1a"/>
        {/* 连接线：中心到周围 */}
        <line x1="12" y1="5" x2="4" y2="6.5" stroke="#1a1a1a" strokeWidth="1"/>
        <line x1="12" y1="5" x2="20" y2="6.5" stroke="#1a1a1a" strokeWidth="1"/>
        <line x1="15.5" y1="8" x2="20" y2="6.5" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="15.5" y1="8" x2="21" y2="11" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="14" y1="12.5" x2="17" y2="12.5" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="14" y1="12.5" x2="16" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="10" y1="12.5" x2="12" y2="16.5" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="10" y1="12.5" x2="8" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="8.5" y1="8" x2="7" y2="12.5" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="8.5" y1="8" x2="3" y2="11" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="4" y1="6.5" x2="3" y2="11" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="20" y1="6.5" x2="21" y2="11" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="17" y1="12.5" x2="16" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="7" y1="12.5" x2="8" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="12" y1="16.5" x2="16" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
        <line x1="12" y1="16.5" x2="8" y2="18" stroke="#1a1a1a" strokeWidth="0.8"/>
      </svg>
    </div>
  );
};

export default DraggablePlayer;
