import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, RotateCcw, Download, Circle, MousePointer2, Pencil, Minus, Trash2, Undo2, Redo2, LayoutTemplate } from 'lucide-react';
import { DraggablePlayer, SoccerBall } from './DraggablePlayer';
import type { PlayerPosition, BallPosition } from './DraggablePlayer';
import { TacticImageGenerator } from './TacticImageGenerator';

export type MatchFormat = '5人制' | '8人制' | '11人制';

/** 画线工具类型 */
type DrawTool = 'select' | 'arrow' | 'line' | 'pen';

/** 线条粗细选项 */
type LineWidth = 'thin' | 'medium' | 'thick';

const LINE_WIDTH_MAP: Record<LineWidth, number> = {
  thin: 1.5,
  medium: 2.5,
  thick: 4,
};

const LINE_WIDTH_LABELS: Record<LineWidth, string> = {
  thin: '细',
  medium: '中',
  thick: '粗',
};

/** 绘制的线条数据 */
interface DrawnLine {
  id: string;
  type: 'arrow' | 'line' | 'pen';
  points: { x: number; y: number }[]; // 百分比坐标
  color: string;
  width: LineWidth; // 线条粗细
}

// ════════════════════════════════════════
// 撤销/重做历史快照
// ════════════════════════════════════════

interface HistorySnapshot {
  players: PlayerPosition[];
  ball: BallPosition;
  lines: DrawnLine[];
}

// 最大历史记录数
const MAX_HISTORY = 40;

// ════════════════════════════════════════
// 阵型预设
// ════════════════════════════════════════

interface FormationPreset {
  name: string;        // 显示名称（如 "4-4-2"）
  label: string;       // 中文说明
  ourPlayers: Omit<PlayerPosition, 'id'>[];   // 我方球员预设位置
  oppPlayers: Omit<PlayerPosition, 'id'>[];   // 对方球员预设位置
}

/** 基于标准11人制球场的阵型坐标 (x,y 为0-100百分比) */
const FORMATION_PRESETS: FormationPreset[] = [
  {
    name: '4-4-2',
    label: '经典442',
    ourPlayers: [
      { type: 'our', number: 1, x: 7, y: 50 },    // GK
      { type: 'our', number: 2, x: 18, y: 15 },   // RB
      { type: 'our', number: 3, x: 20, y: 38 },   // CB
      { type: 'our', number: 4, x: 20, y: 62 },   // CB
      { type: 'our', number: 5, x: 18, y: 85 },   // LB
      { type: 'our', number: 6, x: 35, y: 12 },   // RM
      { type: 'our', number: 7, x: 38, y: 35 },   // CM
      { type: 'our', number: 8, x: 38, y: 65 },   // CM
      { type: 'our', number: 9, x: 35, y: 88 },   // LM
      { type: 'our', number: 10, x: 52, y: 30 },  // ST
      { type: 'our', number: 11, x: 52, y: 70 },  // ST
    ],
    oppPlayers: [],
  },
  {
    name: '4-3-3',
    label: '攻击433',
    ourPlayers: [
      { type: 'our', number: 1, x: 7, y: 50 },
      { type: 'our', number: 2, x: 17, y: 12 },
      { type: 'our', number: 3, x: 19, y: 36 },
      { type: 'our', number: 4, x: 19, y: 64 },
      { type: 'our', number: 5, x: 17, y: 88 },
      { type: 'our', number: 6, x: 34, y: 25 },
      { type: 'our', number: 7, x: 34, y: 50 },
      { type: 'our', number: 8, x: 34, y: 75 },
      { type: 'our', number: 9, x: 52, y: 15 },
      { type: 'our', number: 10, x: 54, y: 50 },
      { type: 'our', number: 11, x: 52, y: 85 },
    ],
    oppPlayers: [],
  },
  {
    name: '3-5-2',
    label: '中场控制352',
    ourPlayers: [
      { type: 'our', number: 1, x: 7, y: 50 },
      { type: 'our', number: 2, x: 19, y: 25 },
      { type: 'our', number: 3, x: 21, y: 50 },
      { type: 'our', number: 4, x: 19, y: 75 },
      { type: 'our', number: 5, x: 33, y: 10 },
      { type: 'our', number: 6, x: 36, y: 32 },
      { type: 'our', number: 7, x: 37, y: 50 },
      { type: 'our', number: 8, x: 36, y: 68 },
      { type: 'our', number: 9, x: 33, y: 90 },
      { type: 'our', number: 10, x: 53, y: 35 },
      { type: 'our', number: 11, x: 53, y: 65 },
    ],
    oppPlayers: [],
  },
  {
    name: '5-4-1',
    label: '防守反击541',
    ourPlayers: [
      { type: 'our', number: 1, x: 7, y: 50 },
      { type: 'our', number: 2, x: 16, y: 8 },
      { type: 'our', number: 3, x: 17, y: 28 },
      { type: 'our', number: 4, x: 17, y: 50 },
      { type: 'our', number: 5, x: 17, y: 72 },
      { type: 'our', number: 6, x: 16, y: 92 },
      { type: 'our', number: 7, x: 35, y: 22 },
      { type: 'our', number: 8, x: 36, y: 42 },
      { type: 'our', number: 9, x: 36, y: 58 },
      { type: 'our', number: 10, x: 35, y: 78 },
      { type: 'our', number: 11, x: 55, y: 50 },
    ],
    oppPlayers: [],
  },
];

interface TacticBoardProps {
  format: MatchFormat;
  players: PlayerPosition[];
  onPlayersChange: (players: PlayerPosition[]) => void;
  readOnly?: boolean;
  showControls?: boolean;
  /** 足球位置 */
  ball?: BallPosition;
  /** 足球位置变更 */
  onBallChange?: (ball: BallPosition) => void;
  /** 已绘制的线条 */
  lines?: DrawnLine[];
  /** 线条变更 */
  onLinesChange?: (lines: DrawnLine[]) => void;
}

// 默认足球初始位置
const DEFAULT_BALL: BallPosition = { x: 50, y: 50 };

// 画笔颜色选项
const LINE_COLORS = [
  { name: '白色', value: '#ffffff' },
  { name: '荧光绿', value: '#39ff14' },
  { name: '黄色', value: '#fbbf24' },
  { name: '红色', value: '#ef4444' },
  { name: '蓝色', value: '#3b82f6' },
];

export const TacticBoard: React.FC<TacticBoardProps> = ({
  format,
  players,
  onPlayersChange,
  readOnly = false,
  showControls = true,
  ball: propBall,
  onBallChange,
  lines: propLines,
  onLinesChange,
}) => {
  const [editingNumber, setEditingNumber] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 足球状态（内部管理或受控）
  const [internalBall, setInternalBall] = useState<BallPosition>(DEFAULT_BALL);
  const currentBall = propBall ?? internalBall;

  // 画线状态
  const [drawTool, setDrawTool] = useState<DrawTool>('select');
  const [activeColor, setActiveColor] = useState('#39ff14');
  const [lineWidth, setLineWidth] = useState<LineWidth>('medium');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  // 内部线条状态（非受控模式）
  const [internalLines, setInternalLines] = useState<DrawnLine[]>([]);
  const currentLines = propLines ?? internalLines;

  // 选中的线条（用于删除）
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // ════════════════════════════════════════
  // 撤销/重做系统
  // ════════════════════════════════════════
  const historyRef = useRef<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /** 推入历史快照 */
  const pushHistory = useCallback(() => {
    const snapshot: HistorySnapshot = {
      players: JSON.parse(JSON.stringify(players)),
      ball: { ...currentBall },
      lines: JSON.parse(JSON.stringify(currentLines)),
    };

    // 如果当前不在最新位置，截断后续历史
    if (historyIndex < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndex + 1);
    }

    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    setHistoryIndex(historyRef.current.length - 1);
  }, [players, currentBall, currentLines, historyIndex]);

  /** 初始化时保存第一笔快照 */
  useEffect(() => {
    if (!readOnly && historyRef.current.length === 0) {
      historyRef.current = [{
        players: JSON.parse(JSON.stringify(players)),
        ball: { ...currentBall },
        lines: [],
      }];
      setHistoryIndex(0);
    }
    // 只在首次挂载时运行，后续由 pushHistory 管理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 撤销 */
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snap = historyRef.current[newIndex];
    if (snap) {
      onPlayersChange(snap.players);
      if (onBallChange) onBallChange(snap.ball); else setInternalBall(snap.ball);
      if (onLinesChange) onLinesChange(snap.lines); else setInternalLines(snap.lines);
      setHistoryIndex(newIndex);
    }
  }, [historyIndex, onPlayersChange, onBallChange, onLinesChange]);

  /** 重做 */
  const handleRedo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;
    const newIndex = historyIndex + 1;
    const snap = historyRef.current[newIndex];
    if (snap) {
      onPlayersChange(snap.players);
      if (onBallChange) onBallChange(snap.ball); else setInternalBall(snap.ball);
      if (onLinesChange) onLinesChange(snap.lines); else setInternalLines(snap.lines);
      setHistoryIndex(newIndex);
    }
  }, [historyIndex, onPlayersChange, onBallChange, onLinesChange]);

  // 键盘快捷键：Ctrl+Z / Ctrl+Y
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 在输入框内不响应快捷键
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, readOnly]);

  // ========== 工具方法 ==========

  /** 将鼠标/触摸事件转换为百分比坐标 */
  const getRelativePos = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches[0]) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  /** 更新足球 */
  const handleBallUpdate = useCallback((b: BallPosition) => {
    pushHistory();
    if (onBallChange) onBallChange(b);
    else setInternalBall(b);
  }, [onBallChange, pushHistory]);

  /** 更新线条 */
  const updateLines = useCallback((lines: DrawnLine[]) => {
    if (onLinesChange) onLinesChange(lines);
    else setInternalLines(lines);
  }, [onLinesChange]);

  // ========== 球场背景 ==========
  const getFieldImage = () => {
    const formatMap: Record<MatchFormat, string> = {
      '5人制': '/assets/tactics/field-5side.svg',
      '8人制': '/assets/tactics/field-8side.svg',
      '11人制': '/assets/tactics/field-11side.svg',
    };
    return formatMap[format];
  };

  // ========== 添加球员（推入撤销栈） ==========
  const handleAddOurPlayer = () => {
    if (readOnly) return;
    pushHistory();
    const ourCount = players.filter(p => p.type === 'our').length;
    onPlayersChange([...players, {
      id: `our-${Date.now()}`,
      type: 'our',
      number: ourCount + 1,
      x: 20, y: 30 + ourCount * 10,
    }]);
  };

  const handleAddOpponentPlayer = () => {
    if (readOnly) return;
    pushHistory();
    const oppCount = players.filter(p => p.type === 'opp').length;
    onPlayersChange([...players, {
      id: `opp-${Date.now()}`,
      type: 'opp',
      number: oppCount + 1,
      x: 80, y: 30 + oppCount * 10,
    }]);
  };

  // ========== 应用阵型预设 ==========
  const applyFormation = (preset: FormationPreset) => {
    if (readOnly) return;
    pushHistory();

    const now = Date.now();
    const newPlayers: PlayerPosition[] = [
      ...preset.ourPlayers.map((p, i) => ({ ...p, id: `our-${now}-${i}` })),
      ...preset.oppPlayers.map((p, i) => ({ ...p, id: `opp-${now}-${i}` })),
    ];
    onPlayersChange(newPlayers);
    // 足球归位中圈
    if (onBallChange) onBallChange(DEFAULT_BALL);
    else setInternalBall({ ...DEFAULT_BALL });
  };

  // ========== 球员操作（推入撤销栈） ==========
  const handlePlayerUpdate = (updatedPlayer: PlayerPosition) => {
    // 球员拖拽移动时不频繁推入历史（在 mouseUp 时统一处理）
    // 但为简单起见这里每次更新都触发父组件
    onPlayersChange(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  };

  const handlePlayerDragEnd = () => {
    // 拖拽结束时才推入历史
    pushHistory();
  };

  const handlePlayerDelete = (id: string) => {
    pushHistory();
    onPlayersChange(players.filter(p => p.id !== id));
  };

  const handleEditNumber = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player) {
      setEditingNumber(id);
      setNewNumber(player.number.toString());
    }
  };

  const handleSaveNumber = () => {
    if (editingNumber && newNumber) {
      const num = parseInt(newNumber);
      if (!isNaN(num) && num > 0) {
        pushHistory();
        onPlayersChange(players.map(p => p.id === editingNumber ? { ...p, number: num } : p));
      }
    }
    setEditingNumber(null);
    setNewNumber('');
  };

  // ========== 画线功能 ==========

  /** 统一的事件处理器（鼠标+触屏） */
  const getEventPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    return getRelativePos(e);
  };

  /** 画布事件处理 */
  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;

    const targetEl = e.target as HTMLElement;

    // 点击了球员或足球区域 → 不处理绘图
    if (targetEl.closest('[data-player], [data-ball]')) return;

    // 选择模式：点击线条可选中
    if (drawTool === 'select') {
      const lineEl = targetEl.closest('[data-line-id]');
      if (lineEl) {
        const id = lineEl.getAttribute('data-line-id');
        setSelectedLineId(id === selectedLineId ? null : id);
        e.stopPropagation();
      } else {
        setSelectedLineId(null);
      }
      return;
    }

    // 绘图模式
    e.preventDefault();
    e.stopPropagation();

    const pos = getRelativePos(e);
    setIsDrawing(true);
    setCurrentPoints([pos]);
    setSelectedLineId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    if (drawTool === 'pen') {
      setCurrentPoints([...currentPoints, getRelativePos(e)]);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);

    const endPos = getRelativePos(e);
    const allPoints = [...currentPoints, endPos];

    // 至少有2个点才创建线条
    if (allPoints.length >= 2) {
      pushHistory(); // 画线前推入历史

      const newLine: DrawnLine = {
        id: `line-${Date.now()}`,
        type: drawTool === 'pen' ? 'pen' : drawTool === 'arrow' ? 'arrow' : 'line',
        points: drawTool === 'pen' ? allPoints : [allPoints[0], allPoints[allPoints.length - 1]],
        color: activeColor,
        width: lineWidth,
      };
      updateLines([...currentLines, newLine]);
    }

    setCurrentPoints([]);
  };

  /** 清除所有线条 */
  const clearLines = () => {
    if (confirm('确定清除所有标记线？')) {
      pushHistory();
      updateLines([]);
    }
  };

  /** 删除单条线 */
  const deleteLine = (id: string) => {
    pushHistory();
    updateLines(currentLines.filter(l => l.id !== id));
    setSelectedLineId(null);
  };

  // ========== 清空 & 导出 ==========
  const handleClear = () => {
    if (readOnly) return;
    if (confirm('确定要清空所有球员吗？')) {
      pushHistory();
      onPlayersChange([]);
      updateLines([]);
      if (!propBall) setInternalBall(DEFAULT_BALL);
    }
  };

  // ========== SVG 渲染辅助 ==========
  /** 获取线条的实际像素宽度 */
  const getStrokeWidth = (line?: DrawnLine): number => {
    if (line && line.type !== 'pen') {
      return LINE_WIDTH_MAP[line.width ?? 'medium'];
    }
    // pen 类型用固定值（太细不好看）
    return line ? LINE_WIDTH_MAP[line.width ?? 'medium'] : LINE_WIDTH_MAP[lineWidth];
  };

  /** 将线条渲染为 SVG overlay */
  const renderLinesSVG = () => {
    // 关键修复：SVG 覆盖层始终 pointer-events:none
    // 只有线条 <g> 元素单独设置 pointer-events 才能点击选中线条
    // 这样不会阻挡下方足球⚽的拖拽和画布的绘图操作
    return (
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 3, pointerEvents: 'none' }}>
        {/* 已保存的线条 */}
        {currentLines.map(line => {
          const isSelected = selectedLineId === line.id;
          const sw = getStrokeWidth(line);
          return (
            <g key={line.id} data-line-id={line.id}
              className={`transition-all duration-150 ${isSelected ? 'opacity-100' : 'hover:opacity-80'}`}
              onClick={(e) => { e.stopPropagation(); setSelectedLineId(isSelected ? null : line.id); }}
              // 只在单个线条组上启用指针事件，不影响其他区域
              style={{ cursor: drawTool === 'select' ? 'pointer' : undefined, pointerEvents: 'auto' }}
            >
              {/* 选中时的光晕 */}
              {isSelected && (
                <>
                  {line.type !== 'pen' && (
                    <line x1={`${line.points[0].x}%`} y1={`${line.points[0].y}%`}
                      x2={`${line.points[line.points.length-1].x}%`} y2={`${line.points[line.points.length-1].y}%`}
                      stroke="#ffffff" strokeWidth={sw + 4} strokeLinecap="round" opacity="0.3"/>
                  )}
                  {line.type === 'pen' && (
                    <path
                      d={'M' + line.points[0].x + '% ' + line.points[0].y + '%' +
                        line.points.slice(1).map(p => ' L' + p.x + '% ' + p.y + '%').join('')}
                      fill="none" stroke="#ffffff" strokeWidth={sw + 4} strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                  )}
                </>
              )}

              {/* 箭头 */}
              {line.type === 'arrow' && line.points.length >= 2 ? (
                <defs>
                  <marker id={`arrowhead-${line.id}`} markerWidth="8" markerHeight="6"
                    refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill={line.color} />
                  </marker>
                </defs>
              ) : null}

              {line.type === 'arrow' ? (
                <line x1={`${line.points[0].x}%`} y1={`${line.points[0].y}%`}
                  x2={`${line.points[1].x}%`} y2={`${line.points[1].y}%`}
                  stroke={line.color} strokeWidth={isSelected ? sw + 1 : sw}
                  markerEnd={`url(#arrowhead-${line.id})`} strokeLinecap="round"/>
              ) : line.type === 'line' && line.points.length >= 2 ? (
                <line x1={`${line.points[0].x}%`} y1={`${line.points[0].y}%`}
                  x2={`${line.points[1].x}%`} y2={`${line.points[1].y}%`}
                  stroke={line.color} strokeWidth={isSelected ? sw + 1 : sw} strokeLinecap="round"/>
              ) : line.type === 'pen' && line.points.length > 1 ? (
                <path
                  d={'M' + line.points[0].x + '% ' + line.points[0].y + '%' +
                    line.points.slice(1).map(p => ' L' + p.x + '% ' + p.y + '%').join('')}
                  fill="none" stroke={line.color}
                  strokeWidth={isSelected ? sw + 1 : sw}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              ) : null}

              {/* 选中时显示删除按钮 */}
              {isSelected && !readOnly && (() => {
                let bx: number, by: number;
                if (line.type === 'pen') {
                  const midIdx = Math.floor(line.points.length / 2);
                  bx = line.points[midIdx].x;
                  by = line.points[midIdx].y;
                } else {
                  bx = (line.points[0].x + line.points[line.points.length - 1].x) / 2;
                  by = (line.points[0].y + line.points[line.points.length - 1].y) / 2;
                }
                return (
                  <g transform={`translate(${bx}, ${by})`}>
                    <foreignObject x="-14" y="-14" width="28" height="28">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteLine(line.id); }}
                        className="w-7 h-7 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                        title="删除此线"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </foreignObject>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* 正在画的线 */}
        {isDrawing && currentPoints.length > 0 && (
          <g opacity="0.8" style={{ pointerEvents: 'none' }}>
            {(drawTool === 'arrow' || drawTool === 'line') && currentPoints.length >= 2 ? (
              <line x1={`${currentPoints[0].x}%`} y1={`${currentPoints[0].y}%`}
                x2={`${currentPoints[currentPoints.length - 1].x}%`}
                y2={`${currentPoints[currentPoints.length - 1].y}%`}
                stroke={activeColor} strokeWidth={getStrokeWidth()} strokeDasharray="6,4" strokeLinecap="round"/>
            ) : drawTool === 'pen' && currentPoints.length > 1 ? (
              <path
                d={'M' + currentPoints[0].x + '% ' + currentPoints[0].y + '%' +
                  currentPoints.slice(1).map(p => ' L' + p.x + '% ' + p.y + '%').join('')}
                fill="none" stroke={activeColor} strokeWidth={getStrokeWidth()}
                strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round"
              />
            ) : null}
          </g>
        )}
      </svg>
    );
  };

  // 是否可以撤销/重做
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  return (
    <div className="bg-[#1a1f2e] rounded-lg border border-gray-800 overflow-hidden">
      {/* ═══ 控制栏 ═══ */}
      {showControls && !readOnly && (
        <div className="px-4 py-3 space-y-3">
          {/* 第一行：添加按钮 + 工具 + 阵型 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleAddOurPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#39ff14] text-black text-sm font-medium rounded-lg hover:bg-[#22c55e] transition-colors"
              >
                <Plus size={14} /> 添加我方
              </button>
              <button onClick={handleAddOpponentPlayer}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus size={14} /> 添加对方
              </button>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-gray-700 mx-1" />

              {/* 阵型预设下拉 */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/80 text-white text-sm font-medium rounded-lg hover:bg-purple-500 transition-colors"
                  title="一键布阵"
                >
                  <LayoutTemplate size={14} /> 阵型 ▾
                </button>

                {/* 下拉菜单 */}
                <div className="absolute top-full left-0 mt-1 bg-[#111827] border border-gray-700 rounded-xl shadow-2xl z-50 min-w-[180px] py-2 hidden group-hover:block group-focus-within:block">
                  <p className="px-3 py-1 text-xs text-gray-500 font-medium">选择预设阵型</p>
                  {FORMATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyFormation(preset)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700/60 transition-colors text-left"
                    >
                      <span className="text-white font-mono font-bold">{preset.name}</span>
                      <span className="text-gray-400 text-xs">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 分隔线 */}
              <div className="w-px h-6 bg-gray-700 mx-1" />

              {/* 撤销/重做 */}
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`flex items-center gap-1 p-1.5 rounded-md transition-colors ${
                  canUndo
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                title="撤销 (Ctrl+Z)"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`flex items-center gap-1 p-1.5 rounded-md transition-colors ${
                  canRedo
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 cursor-not-allowed'
                }`}
                title="重做 (Ctrl+Y)"
              >
                <Redo2 size={15} />
              </button>

              <div className="w-px h-6 bg-gray-700 mx-1" />

              {/* 画线工具 */}
              <div className="flex gap-1 bg-[#0f1419] rounded-lg p-0.5">
                {[
                  { tool: 'select' as DrawTool, icon: MousePointer2, label: '选择' },
                  { tool: 'arrow' as DrawTool, icon: Minus, label: '箭头' },
                  { tool: 'line' as DrawTool, icon: Minus, label: '直线' },
                  { tool: 'pen' as DrawTool, icon: Pencil, label: '画笔' },
                ].map(({ tool, icon: Icon, label }) => (
                  <button key={tool} onClick={() => setDrawTool(tool)}
                    title={label}
                    className={`p-1.5 rounded-md transition-all ${
                      drawTool === tool
                        ? 'bg-[#39ff14] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                ))}

                {/* 颜色选择 */}
                {drawTool !== 'select' && (
                  <div className="flex gap-1 ml-1 items-center pl-1 border-l border-gray-700">
                    {LINE_COLORS.map(c => (
                      <button key={c.value} onClick={() => setActiveColor(c.value)}
                        title={c.name}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          activeColor === c.value ? 'scale-125 border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                )}

                {/* 线条粗细选择 */}
                {drawTool !== 'select' && (
                  <div className="flex gap-0.5 ml-1 items-center pl-1 border-l border-gray-700">
                    {(Object.keys(LINE_WIDTH_MAP) as LineWidth[]).map((lw) => (
                      <button key={lw} onClick={() => setLineWidth(lw)}
                        title={`${LINE_WIDTH_LABELS[lw]}线 (${LINE_WIDTH_MAP[lw]}px)`}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium transition-all ${
                          lineWidth === lw
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {LINE_WIDTH_LABELS[lw]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {currentLines.length > 0 && (
                <button onClick={clearLines}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-lg hover:bg-yellow-500/30 transition-colors"
                >
                  <Trash2 size={14} /> 清除划线({currentLines.length})
                </button>
              )}
              <button onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCcw size={14} /> 清空全部
              </button>
              <TacticImageGenerator
                boardRef={containerRef}
                players={players.map(p => ({
                  id: p.id, x: p.x, y: p.y, number: p.number,
                  team: p.type === 'our' ? 'home' as const : 'away' as const,
                }))}
                matchFormat={format}
                ball={currentBall}
                lines={currentLines}
              />
            </div>
          </div>

          {/* 当前工具提示 */}
          {drawTool !== 'select' ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#39ff14]/10 text-[#39ff14] font-medium">
                {drawTool === 'arrow' ? '🖱️ 点击拖动画箭头' : drawTool === 'line' ? '🖱️ 点击拖动画直线' : '✏️ 按住拖动画曲线'}
              </span>
              <span>· 颜色：<span style={{ color: activeColor }} className="font-bold">●</span></span>
              <span>· 粗细：<strong className="text-cyan-400">{LINE_WIDTH_LABELS[lineWidth]}</strong></span>
              <span className="ml-auto text-gray-600">Ctrl+Z 撤销 · Ctrl+Y 重做</span>
            </div>
          ) : currentLines.length > 0 ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                👆 点击标记线选中后可删除
              </span>
              <span className="ml-auto text-gray-600">Ctrl+Z 撤销 · Ctrl+Y 重做</span>
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-right">
              Ctrl+Z 撤销 · Ctrl+Y 重做
            </div>
          )}
        </div>
      )}

      {/* ═══ 战术板画布（支持触屏） ═══ */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onTouchStart={handleCanvasMouseDown}
        onTouchMove={handleCanvasMouseMove}
        onTouchEnd={handleCanvasMouseUp}
        onMouseLeave={() => isDrawing && setIsDrawing(false)}
        className={`relative w-full aspect-[8/5] bg-[#1a2332] overflow-hidden ${
          drawTool !== 'select' ? 'cursor-crosshair' : ''
        }`}
        style={{ touchAction: drawTool !== 'select' ? 'none' : 'auto' }}
      >
        {/* 球场背景图 */}
        <img src={getFieldImage()} alt={`${format}球场`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* SVG 线条层 */}
        {!readOnly && renderLinesSVG()}
        {readOnly && currentLines.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
            {currentLines.map(line => (
              <g key={line.id}>
                {line.type === 'arrow' && line.points.length >= 2 ? (
                  <>
                    <defs><marker id={`ar-${line.id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill={line.color}/></marker></defs>
                    <line x1={`${line.points[0].x}%`} y1={`${line.points[0].y}%`} x2={`${line.points[1].x}%`} y2={`${line.points[1].y}%`} stroke={line.color} strokeWidth={getStrokeWidth(line)} markerEnd={`url(#ar-${line.id})`} strokeLinecap="round"/>
                  </>
                ) : line.type === 'line' && line.points.length >= 2 ? (
                  <line x1={`${line.points[0].x}%`} y1={`${line.points[0].y}%`} x2={`${line.points[1].x}%`} y2={`${line.points[1].y}%`} stroke={line.color} strokeWidth={getStrokeWidth(line)} strokeLinecap="round"/>
                ) : line.type === 'pen' && line.points.length > 1 ? (
                  <path
                    d={'M' + line.points[0].x + '% ' + line.points[0].y + '%' +
                      line.points.slice(1).map(p => ' L' + p.x + '% ' + p.y + '%').join('')}
                    fill="none" stroke={line.color} strokeWidth={getStrokeWidth(line)} strokeLinecap="round" strokeLinejoin="round"/>
                ) : null}
              </g>
            ))}
          </svg>
        )}

        {/* 球员列表 */}
        {players.map(player => (
          <DraggablePlayer key={player.id} player={player}
            onUpdate={(updated) => { handlePlayerUpdate(updated); }}
            onDelete={handlePlayerDelete}
            onEditNumber={readOnly ? undefined : handleEditNumber}
            disabled={readOnly}
          />
        ))}

        {/* 足球 */}
        <SoccerBall ball={currentBall} onUpdate={handleBallUpdate}
          disabled={readOnly}
        />

        {/* 编辑编号弹窗 */}
        {editingNumber && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
            <div className="bg-[#1a1f2e] border border-gray-700 rounded-xl p-6 shadow-2xl w-64 space-y-4">
              <h3 className="text-white font-semibold text-base">编辑球员编号</h3>
              <input type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-center text-xl focus:border-[#39ff14] focus:outline-none"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNumber(); if (e.key === 'Escape') setEditingNumber(null); }}
              />
              <div className="flex gap-2">
                <button onClick={() => { setEditingNumber(null); setNewNumber(''); }}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >取消</button>
                <button onClick={handleSaveNumber}
                  className="flex-1 px-3 py-2 bg-[#39ff14] text-black text-sm font-semibold rounded-lg hover:bg-[#22c55e] transition-colors"
                >保存</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 底部统计栏 ═══ */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827]/80 text-xs text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#39ff14]" /> 我方: <strong className="text-white">{players.filter(p => p.type === 'our').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 对方: <strong className="text-white">{players.filter(p => p.type === 'opp').length}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Circle size={12} className="text-white" /> ⚽
          </span>
          <span className="flex items-center gap-1.5">
            <Pencil size={12} /> 标记线: <strong className="text-white">{currentLines.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TacticBoard;
