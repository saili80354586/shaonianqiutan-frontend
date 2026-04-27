import React, { useRef, useState, useCallback } from 'react';
import { Download, Camera, Loader2, CheckCircle } from 'lucide-react';

interface PlayerPosition {
  id: string;
  x: number;
  y: number;
  number: number;
  team: 'home' | 'away';
}

interface DrawnLine {
  id: string;
  type: 'arrow' | 'line' | 'pen';
  points: { x: number; y: number }[];
  color: string;
  width?: 'thin' | 'medium' | 'thick';
}

interface TacticImageGeneratorProps {
  boardRef?: React.RefObject<HTMLDivElement | null>;
  players: PlayerPosition[];
  matchFormat: '5人制' | '8人制' | '11人制';
  scenarioTitle?: string;
  onImageGenerated?: (dataUrl: string) => void;
  /** 球员直径（px） */
  playerSize?: number;
  /** 足球位置 */
  ball?: { x: number; y: number };
  /** 绘制的线条 */
  lines?: DrawnLine[];
}

/**
 * 战术图导出组件
 * 使用纯 Canvas API 渲染，确保球员/背景比例精确
 * 
 * 输出尺寸：
 * - 5人制：800×500 (8:5)
 * - 8人制：840×540
 * - 11人制：960×600
 */
const CANVAS_SIZES: Record<string, { w: number; h: number }> = {
  '5人制': { w: 800, h: 500 },
  '8人制': { w: 840, h: 540 },
  '11人制': { w: 960, h: 600 },
};

export const TacticImageGenerator: React.FC<TacticImageGeneratorProps> = ({
  boardRef,
  players = [],
  matchFormat = '11人制',
  scenarioTitle,
  onImageGenerated,
  playerSize = 36,
  ball,
  lines = [],
}) => {
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * 用 Canvas 从零渲染战术图
   * 比例完全由代码控制，不依赖 DOM 截图
   */
  const generateImage = useCallback(async () => {
    setGenerating(true);
    setSuccess(false);

    try {
      // 创建高分辨率 Canvas（2x Retina）
      const scale = 2;
      const size = CANVAS_SIZES[matchFormat] ?? CANVAS_SIZES['11人制'];
      const canvas = document.createElement('canvas');
      canvas.width = size.w * scale;
      canvas.height = size.h * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      const W = size.w;
      const H = size.h;

      // ═══ 1. 背景填充（深色主题）═══
      ctx.fillStyle = '#1a2332';
      ctx.fillRect(0, 0, W, H);

      // ═══ 2. 加载并绘制球场背景图 ═══
      await drawFieldBackground(ctx, W, H, matchFormat);

      // ═══ 3. 绘制标记线（在球员下方）═══
      if (lines && lines.length > 0) {
        lines.forEach(line => drawLine(ctx, line, W, H));
      }

      // ═══ 4. 绘制足球 ═══
      if (ball) {
        drawSoccerBall(ctx, ball.x / 100 * W, ball.y / 100 * H, Math.round(playerSize * 0.75));
      }

      // ═══ 5. 绘制球员 ═══
      players.forEach(p => {
        drawPlayer(
          ctx,
          p.x / 100 * W,
          p.y / 100 * H,
          p.number,
          p.team === 'home',
          playerSize,
        );
      });

      // ═══ 6. 品牌水印（右下角）═══
      ctx.save();

      // 半透明背景条
      const watermarkText = scenarioTitle
        ? `${scenarioTitle.slice(0, 18)}${scenarioTitle.length > 18 ? '...' : ''} · 少年球探`
        : '少年球探 · 青少年足球球探服务平台';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      const textW = ctx.measureText(watermarkText).width + 24;

      // 水印背景
      const barX = W - textW - 8;
      const barY = H - 28;
      const barH = 22;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(ctx, barX, barY, textW, barH, 4);
      ctx.fill();

      // 足球图标（⚽ 用小圆+五边形模拟）
      const iconCx = barX + 14;
      const iconCy = barY + barH / 2;
      ctx.beginPath();
      ctx.arc(iconCx, iconCy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      // 小五边形
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        const px = iconCx + Math.cos(a) * 3;
        const py = iconCy + Math.sin(a) * 3;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // 文字
      ctx.globalAlpha = 0.9;
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(watermarkText, barX + 24, barY + barH / 2);

      // 时间戳
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
      ctx.globalAlpha = 0.45;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(timestamp, W - 10, H - 5);

      ctx.restore();

      // 转为 DataURL 并下载
      const dataUrl = canvas.toDataURL('image/png');
      onImageGenerated?.(dataUrl);
      downloadImage(dataUrl);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('生成战术图失败:', error);
    } finally {
      setGenerating(false);
    }
  }, [boardRef, players, matchFormat, scenarioTitle, onImageGenerated, playerSize, ball, lines]);

  // ========== Canvas 绘图辅助函数 ==========

  /** 加载并绘制球场背景 */
  async function drawFieldBackground(
    ctx: CanvasRenderingContext2D,
    W: number, H: number, format: string
  ) {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const formatMap: Record<string, string> = {
        '5人制': '/assets/tactics/field-5side.svg',
        '8人制': '/assets/tactics/field-8side.svg',
        '11人制': '/assets/tactics/field-11side.svg',
      };

      img.onload = () => {
        // 保持比例覆盖整个画布
        const imgRatio = img.width / img.height;
        const canvasRatio = W / H;
        let dw: number, dh: number, dx: number, dy: number;

        if (imgRatio > canvasRatio) {
          dh = H;
          dw = H * imgRatio;
          dx = (W - dw) / 2;
          dy = 0;
        } else {
          dw = W;
          dh = W / imgRatio;
          dx = 0;
          dy = (H - dh) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
        resolve();
      };

      img.onerror = () => {
        // SVG 加载失败时绘制简化版球场
        drawFallbackField(ctx, W, H, format);
        resolve();
      };

      img.src = formatMap[format] || formatMap['11人制'];
    });
  }

  /** 备用球场绘制（SVG加载失败时） */
  function drawFallbackField(
    ctx: CanvasRenderingContext2D, W: number, H: number, _format: string
  ) {
    // 绿色草地
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, W, H);

    // 场地边线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.04, H * 0.03, W * 0.92, H * 0.94);

    // 中线
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.03);
    ctx.lineTo(W / 2, H * 0.97);
    ctx.stroke();

    // 中圆
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, H * 0.12, 0, Math.PI * 2);
    ctx.stroke();

    // 左禁区
    ctx.strokeRect(W * 0.02, H * 0.28, W * 0.16, H * 0.44);
    // 右禁区
    ctx.strokeRect(W * 0.82, H * 0.28, W * 0.16, H * 0.44);
  }

  /** 绘制单个球员圆形 */
  function drawPlayer(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    number: number, isHome: boolean,
    size: number,
  ) {
    const r = size / 2;

    // 阴影
    ctx.save();
    ctx.shadowColor = isHome ? 'rgba(57,255,20,0.35)' : 'rgba(239,68,68,0.35)';
    ctx.shadowBlur = 8;

    // 圆形底色
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isHome ? '#39ff14' : '#ef4444';
    ctx.fill();

    ctx.restore();

    // 编号文字
    ctx.fillStyle = isHome ? '#000000' : '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.42)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), cx, cy + 1);
  }

  /** 绘制足球 */
  function drawSoccerBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    const r = size / 2;

    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.25)';
    ctx.shadowBlur = 6;

    // 白色底圆
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();

    // 黑色外圈
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 内部五边形图案（简化版）
    ctx.fillStyle = '#111111';
    const innerR = r * 0.38;
    // 中心五边形近似
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const px = cx + Math.cos(angle) * innerR;
      const py = cy + Math.sin(angle) * innerR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 周围小五边形（仅画几个代表）
    const smallR = innerR * 0.55;
    const outerDist = innerR * 1.5;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const px = cx + Math.cos(angle) * outerDist;
      const py = cy + Math.sin(angle) * outerDist;
      ctx.beginPath();
      ctx.arc(px, py, smallR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** 绘制线条（箭头/直线/曲线） */
  function drawLine(
    ctx: CanvasRenderingContext2D,
    line: DrawnLine,
    W: number, H: number
  ) {
    if (line.points.length < 2) return;

    // 线条粗细映射
    const widthMap: Record<string, number> = { thin: 1.5, medium: 2.5, thick: 4 };
    const lineWidth = line.width ? (widthMap[line.width] ?? 2.5) : 2.5;

    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.fillStyle = line.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (line.type === 'pen') {
      // 自由画笔 — polyline
      ctx.beginPath();
      ctx.moveTo(line.points[0].x / 100 * W, line.points[0].y / 100 * H);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x / 100 * W, line.points[i].y / 100 * H);
      }
      ctx.stroke();

    } else if (line.type === 'line') {
      // 直线
      const sx = line.points[0].x / 100 * W;
      const sy = line.points[0].y / 100 * H;
      const ex = line.points[line.points.length - 1].x / 100 * W;
      const ey = line.points[line.points.length - 1].y / 100 * H;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

    } else if (line.type === 'arrow') {
      // 带箭头的直线
      const sx = line.points[0].x / 100 * W;
      const sy = line.points[0].y / 100 * H;
      const ex = line.points[line.points.length - 1].x / 100 * W;
      const ey = line.points[line.points.length - 1].y / 100 * H;

      // 线段
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // 箭头
      const angle = Math.atan2(ey - sy, ex - sx);
      const arrowLen = 10;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - arrowLen * Math.cos(angle - Math.PI / 7),
        ey - arrowLen * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        ex - arrowLen * Math.cos(angle + Math.PI / 7),
        ey - arrowLen * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  /** 圆角矩形辅助 */
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ========== 下载功能 ==========

  function downloadImage(dataUrl: string) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const title = scenarioTitle ? `_${scenarioTitle.slice(0, 10)}` : '';
    const filename = `tactic_${matchFormat}${title}_${timestamp}.png`;

    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={generateImage}
        disabled={generating || players.length === 0}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {generating ? (
          <><Loader2 size={15} className="animate-spin" />生成中...</>
        ) : success ? (
          <><CheckCircle size={15} />已生成</>
        ) : (
          <><Camera size={15} />生成战术图</>
        )}
      </button>

      {!players.length && <span className="text-gray-500 text-xs">先添加球员</span>}
    </div>
  );
};

/** 高阶包装器（保留兼容性） */
interface ScreenshotWrapperProps { children: React.ReactNode; className?: string; }

export const TacticScreenshotWrapper: React.FC<ScreenshotWrapperProps> & {
  generateImage?: (elementId?: string) => Promise<string | null>;
} = ({ children }) => <>{children}</>;

TacticScreenshotWrapper.generateImage = async () => null;

export default TacticImageGenerator;
