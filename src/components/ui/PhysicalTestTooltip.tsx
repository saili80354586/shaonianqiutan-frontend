/**
 * PhysicalTestTooltip - 体测项目标准说明 Tooltip
 *
 * tooltip 作为 wrapper 子元素渲染，通过 overflow:visible 突破父容器限制。
 * 支持 hover（带防抖）和 click 两种触发方式。
 */

import React, { useRef, useCallback, useEffect } from 'react';
import {
  Info, X, Target, ClipboardList, AlertTriangle, Lightbulb,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { getTestItem, CATEGORY_CONFIG } from '../../config/physical-test-items';

interface PhysicalTestTooltipProps {
  /** 体测项 key（如 sprint_30m） */
  itemKey: string;
  /** 触发方式 */
  trigger?: 'hover' | 'click';
  /** 精简模式（只显示核心信息） */
  compact?: boolean;
  /** 内联模式（直接在行内显示简短提示） */
  inline?: boolean;
  /** 自定义触发元素（不传则渲染默认的 ? 图标按钮） */
  children?: React.ReactNode;
  /** 额外 className（给 wrapper 的） */
  className?: string;
}

export const PhysicalTestTooltip: React.FC<PhysicalTestTooltipProps> = ({
  itemKey,
  compact = false,
  inline = false,
  children,
  className = '',
}) => {
  // ── inline 模式 ────────────────────────────────
  if (inline) {
    const item = getTestItem(itemKey);
    if (!item) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 ${className}`}
        title={item.standard.method[0] || item.label}
      >
        {children || <Info className="w-3.5 h-3.5 text-gray-500" />}
      </span>
    );
  }

  // ── 状态 ────────────────────────────────────────
  const [open, setOpen] = React.useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const item = getTestItem(itemKey);

  if (!item) return null;

  const catConfig = CATEGORY_CONFIG[item.category];
  const isLowerBetter = item.lowerIsBetter;

  // ── 防抖关闭 ───────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current !== null) return;
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      setOpen(false);
    }, 200);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  // ── 清理定时器 ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // 点击外部关闭（tooltip 作为子元素，在 wrapper 内）
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (tooltipRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── tooltip 内容 ───────────────────────────────
  const tooltip = (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="
        absolute left-0 top-full mt-2 z-[9999]
        w-[300px] sm:w-[340px]
        bg-[#1e293b] border border-slate-600/60
        rounded-xl shadow-2xl shadow-black/50
        pointer-events-auto
        animate-in fade-in zoom-in-95 duration-150
      "
      onMouseEnter={cancelHide}
      onMouseLeave={cancelHide}
    >
      {/* 关闭按钮 */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        className="absolute top-2.5 right-2.5 p-1 rounded-md hover:bg-slate-700 transition-colors z-10"
        title="关闭"
      >
        <X className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <div className="p-4">
        {/* 头部 */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${catConfig.color}20` }}
          >
            <Info className="w-4 h-4" style={{ color: catConfig.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{item.label}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color }}
              >
                {catConfig.categoryName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{item.unit}</span>
              <span className="inline-flex items-center gap-0.5">
                {isLowerBetter ? (
                  <><ArrowDown className="w-3 h-3 text-emerald-400" />越小越好</>
                ) : (
                  <><ArrowUp className="w-3 h-3 text-emerald-400" />越大更好</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 测试目的 */}
        {!compact && (
          <div className="mb-3 p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <p className="text-xs text-blue-300 leading-relaxed">{item.standard.purpose}</p>
          </div>
        )}

        {/* 标准做法 */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300">标准做法</span>
          </div>
          <ul className="space-y-1">
            {item.standard.method.slice(0, compact ? 2 : undefined).map((step, i) => (
              <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-1.5">
                <span className="text-slate-500 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 设备/场地 */}
        {!compact && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">设备/场地</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{item.standard.equipment}</p>
          </div>
        )}

        {/* 常见误区 */}
        <div className={`p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 ${compact ? '' : 'mb-3'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-300">常见误区</span>
          </div>
          <p className="text-xs text-red-200/80 leading-relaxed">{item.standard.commonMistake}</p>
        </div>

        {/* 提示 */}
        {!compact && item.standard.tips.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-300">提示</span>
            </div>
            <ul className="space-y-1">
              {item.standard.tips.map((tip, i) => (
                <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-1.5">
                  <span className="text-yellow-500/50 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    >
      {/* 触发元素 */}
      {children ? (
        <span
          ref={triggerRef as React.RefObject<HTMLSpanElement>}
          onClick={toggle}
          className="inline-flex"
        >
          {children}
        </span>
      ) : (
        <button
          type="button"
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          onClick={toggle}
          className="
            inline-flex items-center justify-center w-4 h-4 rounded-full
            text-[10px] font-medium cursor-help
            bg-slate-600/60 hover:bg-slate-500/60
            text-slate-300 hover:text-white
            transition-colors border border-slate-500/30
          "
          title={`${item.label} 测试标准`}
        >
          ?
        </button>
      )}

      {/* tooltip 作为子元素，在 wrapper 内绝对定位 */}
      {open && tooltip}
    </span>
  );
};

export default PhysicalTestTooltip;

/** 快捷导出：精简版 Tooltip */
export const TestInfoTooltip: React.FC<Omit<PhysicalTestTooltipProps, 'compact'>> = (props) => (
  <PhysicalTestTooltip {...props} compact />
);
