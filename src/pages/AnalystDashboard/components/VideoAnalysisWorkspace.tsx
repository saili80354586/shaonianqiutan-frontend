import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { videoAnalysisApi } from '../../../services/api';
import type { 
  Order, 
  VideoAnalysis, 
  VideoAnalysisScores, 
  AnalysisHighlight,
  CreateHighlightRequest,
  ExportHighlightClipsRequest,
  HighlightClipExportJob,
  HighlightMarkerType,
  HighlightMode,
  HighlightClipStatus,
  HighlightTagType,
  RatingDimension,
} from '../../../types';
import { toast } from 'sonner';
import {
  ChevronLeft, Play, Pause, Volume2, VolumeX, Save, Send, 
  Sparkles, CheckCircle, AlertTriangle, X, Plus, Star, Trophy,
  Zap, Shield, Target, Users, Activity, Eye, Footprints, Wind, Compass, 
  ArrowRight, Swords, TrendingUp, Crosshair, MessageSquare, 
  UserCheck, ShieldCheck, Timer, RefreshCw, Flame,
  Minimize2, Maximize2, Pencil, Download
} from 'lucide-react';

// ════════════════════════════════════════════════════════
// 评分维度配置
// ════════════════════════════════════════════════════════

const OVERALL_CONFIG = [
  { key: 'ball_control', label: '控球能力', icon: Footprints, desc: '带球时的触球感觉、护球能力、盘带稳定性' },
  { key: 'off_ball_movement', label: '无球跑动', icon: Wind, desc: '无球时的跑位意识、空位创造、摆脱防守' },
  { key: 'pressing_awareness', label: '逼抢意识', icon: Zap, desc: '压迫意识、反抢时机、前场防守贡献' },
  { key: 'positioning', label: '站位选择', icon: Compass, desc: '攻防站位合理性、空间感知能力' },
];

const OFFENSE_CONFIG = [
  { key: 'width_participation', label: '拉开宽度', icon: ArrowRight, desc: '拉开宽度参与进攻组织与终结' },
  { key: 'off_ball_support', label: '跑位支援', icon: Wind, desc: '灵活跑位支援，无球创造空间' },
  { key: 'one_v_one', label: '一对一突破', icon: Crosshair, desc: '擅长一对一突破，左右路均有输出' },
  { key: 'crossing_assist', label: '传中助攻', icon: TrendingUp, desc: '传中助攻出色，创造机会意识强' },
  { key: 'combat_ability', label: '对抗能力', icon: Swords, desc: '身体对抗中护球与争抢成功率' },
  { key: 'pace_rhythm', label: '速度节奏', icon: Activity, desc: '速度快，节奏变化丰富，爆发力好' },
  { key: 'pass_vision', label: '传球视野', icon: Eye, desc: '传球视野开阔，能执行威胁传球' },
  { key: 'body_posture', label: '身体姿态', icon: Target, desc: '姿态良好，接球准备充分，动作经济' },
];

const DEFENSE_CONFIG = [
  { key: 'defensive_commitment', label: '防守投入', icon: Shield, desc: '防守阶段投入积极，态度端正' },
  { key: 'loss_recovery', label: '失球反应', icon: RefreshCw, desc: '失球后迅速反应，第一时间压迫或回防' },
  { key: 'teammate_coordination', label: '队友配合', icon: Users, desc: '与队友协同防守默契度高' },
  { key: 'second_ball', label: '二点争夺', icon: Eye, desc: '注重第二落点，提前预判来球' },
  { key: 'aerial_duel', label: '空中对抗', icon: ShieldCheck, desc: '空中球争夺与头球争顶能力' },
  { key: 'defensive_shape', label: '中路收缩', icon: Compass, desc: '向中路收缩减少空档，时机精准' },
  { key: 'role_adjustment', label: '角色调整', icon: UserCheck, desc: '快速调整防守角色，适应不同战术' },
  { key: 'defensive_rhythm', label: '抢断节奏', icon: Timer, desc: '防守节奏把控佳，抢断成功率有保障' },
];

const MARKER_TYPES: Array<{ value: HighlightMarkerType; label: string; color: string; bg: string }> = [
  { value: 'highlight', label: '精彩表现', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { value: 'issue', label: '待改进问题', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  { value: 'observation', label: '战术观察', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
];

const HIGHLIGHT_TAGS: Array<{ value: HighlightTagType; label: string; markerType: HighlightMarkerType; color: string; bg: string }> = [
  { value: 'goal', label: '进球', markerType: 'highlight', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { value: 'assist', label: '助攻', markerType: 'highlight', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  { value: 'steal', label: '抢断', markerType: 'highlight', color: '#eab308', bg: 'rgba(234,179,8,0.10)' },
  { value: 'save', label: '扑救', markerType: 'highlight', color: '#a855f7', bg: 'rgba(168,85,247,0.10)' },
  { value: 'dribble', label: '过人', markerType: 'highlight', color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
  { value: 'pass', label: '关键传球', markerType: 'highlight', color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
  { value: 'defense', label: '防守关键', markerType: 'highlight', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  { value: 'off_ball_run', label: '跑位亮点', markerType: 'highlight', color: '#14b8a6', bg: 'rgba(20,184,166,0.10)' },
  { value: 'turnover', label: '失误', markerType: 'issue', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  { value: 'positioning_error', label: '站位问题', markerType: 'issue', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
  { value: 'decision_error', label: '决策问题', markerType: 'issue', color: '#fb7185', bg: 'rgba(251,113,133,0.10)' },
  { value: 'recovery_slow', label: '回防不及时', markerType: 'issue', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)' },
  { value: 'tactical_note', label: '战术观察', markerType: 'observation', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
];

const CLIP_STATUS_META: Record<HighlightClipStatus, { label: string; color: string; bg: string }> = {
  none: { label: '未剪辑', color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  queued: { label: '排队中', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  processing: { label: '剪辑中', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
  ready: { label: '已生成', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  failed: { label: '失败', color: '#fb7185', bg: 'rgba(251,113,133,0.10)' },
};

const CLIP_EXPORT_STATUS_META: Record<HighlightClipExportJob['status'], { label: string; color: string; bg: string }> = {
  queued: { label: '排队中', color: '#60a5fa', bg: 'rgba(96,165,250,0.10)' },
  processing: { label: '打包中', color: '#38bdf8', bg: 'rgba(56,189,248,0.10)' },
  ready: { label: '已生成', color: '#34d399', bg: 'rgba(52,211,153,0.10)' },
  failed: { label: '失败', color: '#fb7185', bg: 'rgba(251,113,133,0.10)' },
};

const TABS = [
  { key: 'overall' as const, label: '整体评价', icon: Star },
  { key: 'offense' as const, label: '进攻分析', icon: Swords },
  { key: 'defense' as const, label: '防守分析', icon: Shield },
  { key: 'summary' as const, label: '综合评语', icon: MessageSquare },
  { key: 'highlights' as const, label: '关键标记', icon: Trophy, badgeKey: true },
  { key: 'ai-report' as const, label: 'AI 报告', icon: Sparkles },
];

// ════════════════════════════════════════════════════════
// 数据工具函数
// ════════════════════════════════════════════════════════

const createDefaultScores = (): VideoAnalysisScores => ({
  overall: {
    ball_control: { score: 7, comment: '' },
    off_ball_movement: { score: 7, comment: '' },
    pressing_awareness: { score: 7, comment: '' },
    positioning: { score: 7, comment: '' },
  },
  offense: {
    width_participation: { score: 7, comment: '' },
    off_ball_support: { score: 7, comment: '' },
    one_v_one: { score: 7, comment: '' },
    crossing_assist: { score: 7, comment: '' },
    combat_ability: { score: 7, comment: '' },
    pace_rhythm: { score: 7, comment: '' },
    pass_vision: { score: 7, comment: '' },
    body_posture: { score: 7, comment: '' },
  },
  defense: {
    defensive_commitment: { score: 7, comment: '' },
    loss_recovery: { score: 7, comment: '' },
    teammate_coordination: { score: 7, comment: '' },
    second_ball: { score: 7, comment: '' },
    aerial_duel: { score: 7, comment: '' },
    defensive_shape: { score: 7, comment: '' },
    role_adjustment: { score: 7, comment: '' },
    defensive_rhythm: { score: 7, comment: '' },
  },
});

// 将嵌套 scores 扁平化为后端期望的格式
const flattenScores = (scores: VideoAnalysisScores): Record<string, RatingDimension> => ({
  ball_control: scores.overall.ball_control,
  off_ball_movement: scores.overall.off_ball_movement,
  pressing_awareness: scores.overall.pressing_awareness,
  positioning: scores.overall.positioning,
  width_participation: scores.offense.width_participation,
  off_ball_support: scores.offense.off_ball_support,
  one_v_one: scores.offense.one_v_one,
  crossing_assist: scores.offense.crossing_assist,
  combat_ability: scores.offense.combat_ability,
  pace_rhythm: scores.offense.pace_rhythm,
  pass_vision: scores.offense.pass_vision,
  body_posture: scores.offense.body_posture,
  defensive_commitment: scores.defense.defensive_commitment,
  loss_recovery: scores.defense.loss_recovery,
  teammate_coordination: scores.defense.teammate_coordination,
  second_ball: scores.defense.second_ball,
  aerial_duel: scores.defense.aerial_duel,
  defensive_shape: scores.defense.defensive_shape,
  role_adjustment: scores.defense.role_adjustment,
  defensive_rhythm: scores.defense.defensive_rhythm,
});

// 将后端返回的扁平 scores 还原为前端嵌套结构
const nestScores = (flat: any): VideoAnalysisScores => {
  const dim = (k: string): RatingDimension => flat?.[k] || { score: 7, comment: '' };
  return {
    overall: {
      ball_control: dim('ball_control'),
      off_ball_movement: dim('off_ball_movement'),
      pressing_awareness: dim('pressing_awareness'),
      positioning: dim('positioning'),
    },
    offense: {
      width_participation: dim('width_participation'),
      off_ball_support: dim('off_ball_support'),
      one_v_one: dim('one_v_one'),
      crossing_assist: dim('crossing_assist'),
      combat_ability: dim('combat_ability'),
      pace_rhythm: dim('pace_rhythm'),
      pass_vision: dim('pass_vision'),
      body_posture: dim('body_posture'),
    },
    defense: {
      defensive_commitment: dim('defensive_commitment'),
      loss_recovery: dim('loss_recovery'),
      teammate_coordination: dim('teammate_coordination'),
      second_ball: dim('second_ball'),
      aerial_duel: dim('aerial_duel'),
      defensive_shape: dim('defensive_shape'),
      role_adjustment: dim('role_adjustment'),
      defensive_rhythm: dim('defensive_rhythm'),
    },
  };
};

const calculateOverallScore = (scores: VideoAnalysisScores): number => {
  if (!scores?.overall || !scores?.offense || !scores?.defense) return 7.0;
  let total = 0; let count = 0;
  Object.values(scores.overall).forEach(d => { total += d.score; count++; });
  Object.values(scores.offense).forEach(d => { total += d.score; count++; });
  Object.values(scores.defense).forEach(d => { total += d.score; count++; });
  return count > 0 ? Math.round((total / count) * 10) / 10 : 7.0;
};

const RATING_LEVELS = [
  { min: 9.0, max: 10, label: '世界级', color: '#10b981', textColor: 'text-emerald-400', bg: 'bg-emerald-500/10', ringColor: '#10b981' },
  { min: 8.0, max: 8.99, label: '优秀', color: '#3b82f6', textColor: 'text-blue-400', bg: 'bg-blue-500/10', ringColor: '#3b82f6' },
  { min: 7.0, max: 7.99, label: '良好', color: '#06b6d4', textColor: 'text-cyan-400', bg: 'bg-cyan-500/10', ringColor: '#06b6d4' },
  { min: 6.0, max: 6.99, label: '合格', color: '#eab308', textColor: 'text-yellow-400', bg: 'bg-yellow-500/10', ringColor: '#eab308' },
  { min: 5.0, max: 5.99, label: '待提高', color: '#f97316', textColor: 'text-orange-400', bg: 'bg-orange-500/10', ringColor: '#f97316' },
  { min: 1, max: 4.99, label: '薄弱', color: '#ef4444', textColor: 'text-red-400', bg: 'bg-red-500/10', ringColor: '#ef4444' },
];

const getScoreLevel = (score: number) =>
  RATING_LEVELS.find(l => score >= l.min && score <= l.max) || RATING_LEVELS[5];

const getPotentialGrade = (score: number): { grade: string; color: string } => {
  if (score >= 9.0) return { grade: 'S', color: '#10b981' };
  if (score >= 8.0) return { grade: 'A', color: '#3b82f6' };
  if (score >= 7.0) return { grade: 'B', color: '#06b6d4' };
  if (score >= 6.0) return { grade: 'C', color: '#eab308' };
  return { grade: 'D', color: '#ef4444' };
};

const parseTimeToMs = (value: string): number => {
  const parts = value.trim().split(':').map(part => Number(part));
  if (parts.some(part => Number.isNaN(part) || part < 0)) return 0;
  if (parts.length === 2) return ((parts[0] * 60) + parts[1]) * 1000;
  if (parts.length === 3) return (((parts[0] * 60) + parts[1]) * 60 + parts[2]) * 1000;
  return 0;
};

const formatMsToTime = (ms?: number | null): string => {
  if (ms === undefined || ms === null) return '';
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [hours, minutes, seconds].map(part => part.toString().padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map(part => part.toString().padStart(2, '0')).join(':');
};

type HighlightFormState = {
  mode: HighlightMode;
  markerType: HighlightMarkerType;
  timestamp: string;
  startTime: string;
  endTime: string;
  tagType: HighlightTagType;
  description: string;
  includeInReport: boolean;
};

const createDefaultHighlightForm = (): HighlightFormState => ({
  mode: 'point',
  markerType: 'highlight',
  timestamp: '',
  startTime: '',
  endTime: '',
  tagType: 'goal',
  description: '',
  includeInReport: true,
});

const getClipStatus = (highlight: AnalysisHighlight): HighlightClipStatus =>
  highlight.clip_status || 'none';

const isClipPending = (highlight: AnalysisHighlight) => {
  const status = getClipStatus(highlight);
  return status === 'queued' || status === 'processing';
};

const getDownloadErrorMessage = async (error: any, fallback: string): Promise<string> => {
  const directMessage = error?.response?.data?.error?.message;
  if (directMessage) return directMessage;

  const responseData = error?.response?.data;
  if (typeof Blob !== 'undefined' && responseData instanceof Blob) {
    try {
      const text = await responseData.text();
      const parsed = JSON.parse(text);
      return parsed?.error?.message || parsed?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

// ════════════════════════════════════════════════════════
// ScoreRow 组件
// ════════════════════════════════════════════════════════

interface ScoreRowProps {
  label: string;
  desc: string;
  icon: React.ElementType;
  value: number;
  comment: string;
  index: number;
  onScoreChange: (v: number) => void;
  onCommentChange: (c: string) => void;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ label, desc, icon: Icon, value, comment, index, onScoreChange, onCommentChange }) => {
  const level = getScoreLevel(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-200"
    >
      <div className="p-4 space-y-3">
        {/* Header: icon + label + score */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-white/[0.07] transition-colors">
            <Icon className="w-4 h-4 text-slate-300 group-hover:text-slate-200 transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium text-slate-100">{label}</span>
            <p className="text-xs text-slate-400 leading-snug mt-0.5 truncate">{desc}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <AnimatePresence mode="wait">
              <motion.span
                key={level.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${level.textColor} ${level.bg}`}
              >
                {level.label}
              </motion.span>
            </AnimatePresence>
            <span className={`text-lg font-semibold tabular-nums tracking-tight ${level.textColor}`} style={{ minWidth: 32, textAlign: 'right' }}>
              {value.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="pt-1">
          <div className="relative h-1.5 bg-white/[0.05] rounded-full">
            {/* Fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${((value - 1) / 9) * 100}%`, backgroundColor: level.color }}
              transition={{ duration: 0.15 }}
            />
            <input
              type="range"
              min={1} max={10} step={0.5}
              value={value}
              onChange={(e) => onScoreChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
          {/* Scale labels */}
          <div className="flex justify-between px-0.5 mt-1.5">
            {[1, 5, 10].map(n => (
              <span key={n} className="text-[10px] tabular-nums text-slate-500">{n}</span>
            ))}
          </div>
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder={`描述该球员在「${label}」方面的具体表现...`}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-white/[0.02] border border-white/[0.06] rounded-lg focus:border-white/[0.15] focus:outline-none resize-none placeholder-slate-700 text-slate-200 text-[13px] leading-relaxed transition-colors"
        />
      </div>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════

interface Props {
  order: Order;
  onComplete: () => void;
  onCancel: () => void;
}

type AIReportPayload = {
  report?: string;
  status?: unknown;
  version?: number;
};

type AIReportStatusValue = NonNullable<VideoAnalysis['ai_report_status']>;

const AI_REPORT_STATUSES: AIReportStatusValue[] = ['generating', 'draft', 'regenerating', 'confirmed', 'failed'];

const toAIReportStatus = (value: unknown): AIReportStatusValue | '' => {
  return typeof value === 'string' && AI_REPORT_STATUSES.includes(value as AIReportStatusValue)
    ? value as AIReportStatusValue
    : '';
};

const VideoAnalysisWorkspace: React.FC<Props> = ({ order, onComplete, onCancel }) => {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [scores, setScores] = useState<VideoAnalysisScores>(createDefaultScores());
  const [highlights, setHighlights] = useState<AnalysisHighlight[]>([]);
  const [overallComment, setOverallComment] = useState('');
  const [strengthsComment, setStrengthsComment] = useState('');
  const [weaknessesComment, setWeaknessesComment] = useState('');
  const [trainingAdvice, setTrainingAdvice] = useState('');
  const [analystNotes, setAnalystNotes] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [aiReportStatus, setAiReportStatus] = useState<AIReportStatusValue | ''>('');
  
  const [activeTab, setActiveTab] = useState<'overall' | 'offense' | 'defense' | 'summary' | 'highlights' | 'ai-report'>('overall');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [videoMinimized, setVideoMinimized] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  // 视频播放
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoPanelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const aiReportPollTimerRef = useRef<number | null>(null);
  const downloadedExportJobIdsRef = useRef<Set<string>>(new Set());

  // 关键片段标记弹窗
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [editingHighlightId, setEditingHighlightId] = useState<number | null>(null);
  const [highlightForm, setHighlightForm] = useState<HighlightFormState>(createDefaultHighlightForm);
  const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);
  const [exportingClips, setExportingClips] = useState(false);
  const [clipExportJob, setClipExportJob] = useState<HighlightClipExportJob | null>(null);
  const [clipExportJobs, setClipExportJobs] = useState<HighlightClipExportJob[]>([]);

  const overallScore = calculateOverallScore(scores);
  const potentialGrade = getPotentialGrade(overallScore);
  const pendingClipKey = highlights
    .filter(h => (h.mode || 'point') === 'range' && isClipPending(h))
    .map(h => `${h.id}:${getClipStatus(h)}`)
    .join('|');
  const readyClipHighlights = highlights.filter(h => (h.mode || 'point') === 'range' && getClipStatus(h) === 'ready' && !!h.video_clip_url);
  const readyClipIds = new Set(readyClipHighlights.map(h => h.id));
  const selectedReadyClipIds = selectedClipIds.filter(id => readyClipIds.has(id));
  const pendingClipCount = highlights.filter(h => (h.mode || 'point') === 'range' && isClipPending(h)).length;
  const failedClipCount = highlights.filter(h => (h.mode || 'point') === 'range' && getClipStatus(h) === 'failed').length;
  const clipExportInProgress = clipExportJob?.status === 'queued' || clipExportJob?.status === 'processing';
  const clipExportMeta = clipExportJob ? CLIP_EXPORT_STATUS_META[clipExportJob.status] : null;

  const clearAIReportPolling = useCallback(() => {
    if (aiReportPollTimerRef.current !== null) {
      window.clearTimeout(aiReportPollTimerRef.current);
      aiReportPollTimerRef.current = null;
    }
  }, []);

  const upsertClipExportJob = useCallback((job: HighlightClipExportJob) => {
    setClipExportJobs(prev => [job, ...prev.filter(item => item.id !== job.id)].slice(0, 10));
  }, []);

  const pollAIReport = useCallback(async (analysisId: number, attempt = 0) => {
    if (attempt >= 60) {
      setGenerating(false);
      toast.error('AI报告仍在生成，请稍后刷新查看', { id: 'generate-ai' });
      return;
    }

    try {
      const res = await videoAnalysisApi.getAIReport(analysisId);
      const payload = (res.data?.data || {}) as AIReportPayload;
      const status = toAIReportStatus(payload.status);
      const report = payload.report || '';

      if (status) setAiReportStatus(status);
      if (report) {
        setAiReport(report);
        setAnalysis(prev => prev ? {
          ...prev,
          ai_report: report,
          ai_report_status: status || prev.ai_report_status,
          ai_report_version: payload.version ?? prev.ai_report_version,
        } : prev);
      }

      if (status === 'draft' && report) {
        clearAIReportPolling();
        setGenerating(false);
        toast.success('AI报告已生成，可继续编辑后提交审核', { id: 'generate-ai' });
        return;
      }

      if (status === 'failed') {
        clearAIReportPolling();
        setGenerating(false);
        toast.error('AI报告生成失败，请重试', { id: 'generate-ai' });
        return;
      }
    } catch (error) {
      console.error('轮询AI报告失败', error);
    }

    clearAIReportPolling();
    aiReportPollTimerRef.current = window.setTimeout(() => {
      void pollAIReport(analysisId, attempt + 1);
    }, 5000);
  }, [clearAIReportPolling]);

  // ─── 初始化 ────────────────────────────────────────
  useEffect(() => {
    const initAnalysis = async () => {
      try {
        const res = await videoAnalysisApi.getByOrder(order.id);
        if (res.data?.data?.analysis) {
          const existingAnalysis = res.data.data.analysis;
          setAnalysis(existingAnalysis);
          // 后端返回的 scores 可能是扁平对象（res.data.data.scores）或 JSON 字符串（analysis.scores）
          const flatScores = res.data.data.scores || existingAnalysis.scores;
          if (flatScores) {
            try {
              const parsed = typeof flatScores === 'string' ? JSON.parse(flatScores) : flatScores;
              setScores(nestScores(parsed));
            } catch (e) {
              console.error('解析评分失败', e);
              setScores(createDefaultScores());
            }
          }
          if (existingAnalysis.summary) setOverallComment(existingAnalysis.summary);
          if (existingAnalysis.improvements) setTrainingAdvice(existingAnalysis.improvements);
          if (existingAnalysis.analyst_notes) setAnalystNotes(existingAnalysis.analyst_notes);
          if (existingAnalysis.ai_report) setAiReport(existingAnalysis.ai_report);
          if (existingAnalysis.ai_report_status) setAiReportStatus(existingAnalysis.ai_report_status);
          if (existingAnalysis.ai_report_status === 'generating' || existingAnalysis.ai_report_status === 'regenerating') {
            setGenerating(true);
            void pollAIReport(existingAnalysis.id);
          }
          setHighlights(res.data.data.highlights || []);
        } else {
          const createRes = await videoAnalysisApi.createFromOrder(order.id);
          if (createRes.data?.data) {
            setAnalysis(createRes.data.data);
          }
        }
      } catch (error) {
        toast.error('初始化分析失败');
      }
    };
    initAnalysis();
  }, [order.id, pollAIReport]);

  useEffect(() => {
    return () => clearAIReportPolling();
  }, [clearAIReportPolling]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsVideoFullscreen(document.fullscreenElement === videoPanelRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const pendingHighlights = highlights.filter(h => (h.mode || 'point') === 'range' && isClipPending(h));
    if (pendingHighlights.length === 0) return;

    const refreshClipStatuses = async () => {
      const results = await Promise.allSettled(
        pendingHighlights.map(h => videoAnalysisApi.getHighlightClip(h.id))
      );
      setHighlights(prev => prev.map(item => {
        const matched = results.find(result => (
          result.status === 'fulfilled' && result.value.data?.data?.id === item.id
        ));
        return matched && matched.status === 'fulfilled' ? matched.value.data.data : item;
      }));
    };

    void refreshClipStatuses();
    const timer = window.setInterval(refreshClipStatuses, 3000);
    return () => window.clearInterval(timer);
  }, [pendingClipKey]);

  useEffect(() => {
    setSelectedClipIds(prev => {
      const next = prev.filter(id => readyClipIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [readyClipIds]);

  useEffect(() => {
    if (!analysis) return;

    const loadClipExportJobs = async () => {
      try {
        const res = await videoAnalysisApi.listHighlightClipExportJobs(analysis.id);
        const jobs: HighlightClipExportJob[] = res.data?.data?.list || [];
        setClipExportJobs(jobs);
        const activeJob = jobs.find(job => job.status === 'queued' || job.status === 'processing');
        if (activeJob) {
          setClipExportJob(activeJob);
          setExportingClips(true);
        } else if (jobs.length > 0) {
          setClipExportJob(jobs[0]);
        }
      } catch {
        setClipExportJobs([]);
      }
    };

    void loadClipExportJobs();
  }, [analysis?.id]);

  useEffect(() => {
    if (!analysis || !clipExportJob || !clipExportInProgress) return;

    const refreshClipExportJob = async () => {
      try {
        const res = await videoAnalysisApi.getHighlightClipExportJob(analysis.id, clipExportJob.id);
        const job: HighlightClipExportJob | undefined = res.data?.data;
        if (!job) return;
        setClipExportJob(job);
        upsertClipExportJob(job);

        if (job.status === 'ready') {
          setExportingClips(false);
          if (!downloadedExportJobIdsRef.current.has(job.id)) {
            downloadedExportJobIdsRef.current.add(job.id);
            await videoAnalysisApi.downloadHighlightClipExportJob(analysis.id, job.id, job.filename);
            toast.success('下载包已生成', { id: 'export-clips' });
          }
        } else if (job.status === 'failed') {
          setExportingClips(false);
          toast.error(job.error || '生成下载包失败', { id: 'export-clips' });
        }
      } catch (error: any) {
        setExportingClips(false);
        toast.error(await getDownloadErrorMessage(error, '查询导出任务失败'), { id: 'export-clips' });
      }
    };

    void refreshClipExportJob();
    const timer = window.setInterval(refreshClipExportJob, 2000);
    return () => window.clearInterval(timer);
  }, [analysis, clipExportJob?.id, clipExportInProgress, upsertClipExportJob]);

  // 3秒防抖自动保存
  useEffect(() => {
    if (!analysis) return;
    const timer = setTimeout(() => {
      videoAnalysisApi.updateScores(analysis.id, { scores: flattenScores(scores), summary: overallComment, improvements: trainingAdvice, analyst_notes: analystNotes })
        .then(() => setLastSaved(new Date()))
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [analysis, scores, overallComment, strengthsComment, weaknessesComment, trainingAdvice, analystNotes]);

  // 30秒兜底自动保存
  useEffect(() => {
    if (!analysis) return;
    const timer = setInterval(() => {
      videoAnalysisApi.updateScores(analysis.id, { scores: flattenScores(scores), summary: overallComment, improvements: trainingAdvice, analyst_notes: analystNotes })
        .then(() => setLastSaved(new Date()))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [analysis, scores, overallComment, strengthsComment, weaknessesComment, trainingAdvice, analystNotes]);

  // 页面关闭前提示未保存
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const saveDraft = async (): Promise<boolean> => {
    if (!analysis) return false;
    try {
      const data = { scores: flattenScores(scores), summary: overallComment, improvements: trainingAdvice, analyst_notes: analystNotes };
      await videoAnalysisApi.updateScores(analysis.id, data);
      setLastSaved(new Date());
      return true;
    } catch (error) {
      console.error('保存失败', error);
      return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveDraft();
    if (ok) toast.success('已保存');
    else toast.error('保存失败');
    setSaving(false);
  };

  // 评分更新 helpers
  const uOS = (k: 'ball_control' | 'off_ball_movement' | 'pressing_awareness' | 'positioning', s: number) => setScores(p => ({ ...p, overall: { ...p.overall, [k]: { ...p.overall[k as keyof typeof p.overall], score: s } } }));
  const uOC = (k: 'ball_control' | 'off_ball_movement' | 'pressing_awareness' | 'positioning', c: string) => setScores(p => ({ ...p, overall: { ...p.overall, [k]: { ...p.overall[k as keyof typeof p.overall], comment: c } } }));
  const uFS = (k: 'width_participation' | 'off_ball_support' | 'one_v_one' | 'crossing_assist' | 'combat_ability' | 'pace_rhythm' | 'pass_vision' | 'body_posture', s: number) => setScores(p => ({ ...p, offense: { ...p.offense, [k]: { ...p.offense[k as keyof typeof p.offense], score: s } } }));
  const uFC = (k: 'width_participation' | 'off_ball_support' | 'one_v_one' | 'crossing_assist' | 'combat_ability' | 'pace_rhythm' | 'pass_vision' | 'body_posture', c: string) => setScores(p => ({ ...p, offense: { ...p.offense, [k]: { ...p.offense[k as keyof typeof p.offense], comment: c } } }));
  const uDS = (k: 'defensive_commitment' | 'loss_recovery' | 'teammate_coordination' | 'second_ball' | 'aerial_duel' | 'defensive_shape' | 'role_adjustment' | 'defensive_rhythm', s: number) => setScores(p => ({ ...p, defense: { ...p.defense, [k]: { ...p.defense[k as keyof typeof p.defense], score: s } } }));
  const uDC = (k: 'defensive_commitment' | 'loss_recovery' | 'teammate_coordination' | 'second_ball' | 'aerial_duel' | 'defensive_shape' | 'role_adjustment' | 'defensive_rhythm', c: string) => setScores(p => ({ ...p, defense: { ...p.defense, [k]: { ...p.defense[k as keyof typeof p.defense], comment: c } } }));

  // ─── 关键片段标记 ──────────────────────────────────
  const closeHighlightModal = () => {
    setShowHighlightModal(false);
    setEditingHighlightId(null);
    setHighlightForm(createDefaultHighlightForm());
  };

  const openNewHighlightModal = () => {
    setEditingHighlightId(null);
    setHighlightForm(createDefaultHighlightForm());
    setShowHighlightModal(true);
  };

  const openEditHighlightModal = (highlight: AnalysisHighlight) => {
    const mode = highlight.mode || (highlight.end_time_ms ? 'range' : 'point');
    const startTime = formatMsToTime(highlight.start_time_ms) || highlight.timestamp.split('-')[0] || '';
    const endTime = mode === 'range'
      ? formatMsToTime(highlight.end_time_ms) || highlight.timestamp.split('-')[1] || ''
      : '';

    setEditingHighlightId(highlight.id);
    setHighlightForm({
      mode,
      markerType: highlight.marker_type || 'highlight',
      timestamp: mode === 'point' ? startTime || highlight.timestamp : startTime,
      startTime,
      endTime,
      tagType: highlight.tag_type,
      description: highlight.description,
      includeInReport: highlight.include_in_report,
    });
    setShowHighlightModal(true);
  };

  const handleSaveHighlight = async () => {
    const isRange = highlightForm.mode === 'range';
    const startTime = isRange ? highlightForm.startTime : highlightForm.timestamp;
    const endTime = isRange ? highlightForm.endTime : '';
    const startTimeMs = parseTimeToMs(startTime);
    const endTimeMs = isRange ? parseTimeToMs(endTime) : null;

    if (!analysis || !startTime || (isRange && !endTime) || !highlightForm.description) {
      toast.error('请填写完整信息');
      return;
    }
    if (isRange && (endTimeMs === null || endTimeMs <= startTimeMs)) {
      toast.error('结束时间必须晚于开始时间');
      return;
    }
    try {
      const data: CreateHighlightRequest = {
        analysis_id: analysis.id,
        timestamp: isRange ? `${startTime}-${endTime}` : startTime,
        marker_type: highlightForm.markerType,
        mode: highlightForm.mode,
        start_time_ms: startTimeMs,
        end_time_ms: endTimeMs,
        tag_type: highlightForm.tagType,
        description: highlightForm.description,
        include_in_report: highlightForm.includeInReport,
      };
      const res = editingHighlightId
        ? await videoAnalysisApi.updateHighlight(editingHighlightId, data)
        : await videoAnalysisApi.createHighlight(data);
      if (res.data?.data) {
        setHighlights(prev => {
          if (editingHighlightId) {
            return prev.map(item => item.id === editingHighlightId ? res.data.data : item);
          }
          return [...prev, res.data.data];
        });
        closeHighlightModal();
        toast.success(editingHighlightId ? '关键标记已更新' : '关键标记已保存');
      }
    } catch (error) {
      toast.error(editingHighlightId ? '更新失败' : '添加失败');
    }
  };

  const handleDeleteHighlight = async (id: number) => {
    try {
      await videoAnalysisApi.deleteHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
      setSelectedClipIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleRetryClip = async (highlightId: number) => {
    try {
      const res = await videoAnalysisApi.retryHighlightClip(highlightId);
      if (res.data?.data) {
        setHighlights(prev => prev.map(h => h.id === highlightId ? res.data.data : h));
      }
      toast.success('剪辑任务已提交');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || '提交剪辑失败');
    }
  };

  const handleDownloadClip = async (highlightId: number) => {
    try {
      await videoAnalysisApi.downloadHighlightClip(highlightId);
    } catch (error: any) {
      toast.error(await getDownloadErrorMessage(error, '下载失败'));
    }
  };

  const toggleClipSelection = (highlightId: number) => {
    setSelectedClipIds(prev => (
      prev.includes(highlightId)
        ? prev.filter(id => id !== highlightId)
        : [...prev, highlightId]
    ));
  };

  const toggleAllReadyClips = () => {
    if (readyClipHighlights.length === 0) return;
    setSelectedClipIds(prev => {
      const allSelected = readyClipHighlights.every(h => prev.includes(h.id));
      if (allSelected) {
        return prev.filter(id => !readyClipIds.has(id));
      }
      return Array.from(new Set([...prev, ...readyClipHighlights.map(h => h.id)]));
    });
  };

  const handleExportClips = async (scope: 'all' | 'highlight' | 'issue' | 'selected') => {
    if (!analysis) return;
    if (readyClipHighlights.length === 0) {
      toast.error('暂无已生成片段可下载');
      return;
    }

    const payload: ExportHighlightClipsRequest = {};
    if (scope === 'selected') {
      if (selectedReadyClipIds.length === 0) {
        toast.error('请先勾选已生成片段');
        return;
      }
      payload.marker_ids = selectedReadyClipIds;
    }
    if (scope === 'highlight') payload.marker_type = 'highlight';
    if (scope === 'issue') payload.marker_type = 'issue';

    setExportingClips(true);
    toast.loading('已创建导出任务，正在后台打包...', { id: 'export-clips' });
    try {
      const res = await videoAnalysisApi.createHighlightClipExportJob(analysis.id, payload);
      const job: HighlightClipExportJob | undefined = res.data?.data;
      if (!job?.id) {
        throw new Error('导出任务创建失败');
      }
      setClipExportJob(job);
      upsertClipExportJob(job);
    } catch (error: any) {
      toast.error(await getDownloadErrorMessage(error, '生成下载包失败'), { id: 'export-clips' });
      setExportingClips(false);
    }
  };

  const handleRetryExportClips = async (jobToRetry?: HighlightClipExportJob) => {
    const targetJob = jobToRetry || clipExportJob;
    if (!analysis || !targetJob || targetJob.status !== 'failed') return;

    setExportingClips(true);
    toast.loading('正在重试导出任务...', { id: 'export-clips' });
    try {
      const res = await videoAnalysisApi.retryHighlightClipExportJob(analysis.id, targetJob.id);
      const job: HighlightClipExportJob | undefined = res.data?.data;
      if (!job?.id) {
        throw new Error('导出任务重试失败');
      }
      downloadedExportJobIdsRef.current.delete(job.id);
      setClipExportJob(job);
      upsertClipExportJob(job);
    } catch (error: any) {
      toast.error(await getDownloadErrorMessage(error, '重试导出任务失败'), { id: 'export-clips' });
      setExportingClips(false);
    }
  };

  const handleDownloadExportJob = async (jobToDownload?: HighlightClipExportJob) => {
    const targetJob = jobToDownload || clipExportJob;
    if (!analysis || !targetJob || targetJob.status !== 'ready') return;

    try {
      await videoAnalysisApi.downloadHighlightClipExportJob(analysis.id, targetJob.id, targetJob.filename);
    } catch (error: any) {
      toast.error(await getDownloadErrorMessage(error, '下载失败'));
    }
  };

  // ─── AI 报告 ────────────────────────────────────────
  const handleGenerateAIReport = async () => {
    if (!analysis) return;
    // 先生成评分再调用AI
    toast.loading('正在保存评分...', { id: 'generate-ai' });
    const saved = await saveDraft();
    if (!saved) {
      toast.error('保存失败，请重试', { id: 'generate-ai' });
      return;
    }
    setGenerating(true);
    setAiReportStatus('generating');
    try {
      await videoAnalysisApi.generateAIReport(analysis.id);
      toast.loading('AI报告生成任务已提交，正在等待结果...', {
        id: 'generate-ai',
        description: '生成完成后会自动显示在当前页面',
      });
      void pollAIReport(analysis.id);
    } catch (error: any) {
      setAiReportStatus('');
      setGenerating(false);
      const msg = error?.response?.data?.message || 'AI生成提交失败，请重试';
      toast.error(msg, { id: 'generate-ai' });
    }
  };

  const handleUpdateAIReport = async () => {
    if (!analysis) return;
    try {
      await videoAnalysisApi.updateAIReport(analysis.id, aiReport);
      toast.success('报告已保存');
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleConfirmAndSubmit = async () => {
    if (!analysis) return;
    if (!overallComment || overallComment.length < 50) {
      toast.error('综合评语至少50字');
      setActiveTab('summary');
      return;
    }
    // 校验：必须先生成AI报告才能提交
    if (!aiReport) {
      toast.error('请先生成AI智能报告再提交');
      setActiveTab('ai-report');
      return;
    }
    // 强制先保存评分
    toast.loading('正在保存...', { id: 'submit-report' });
    const saved = await saveDraft();
    if (!saved) {
      toast.error('保存失败，请检查网络后重试', { id: 'submit-report' });
      return;
    }
    setSubmitting(true);
    toast.loading('正在提交报告...', { id: 'submit-report' });
    try {
      await videoAnalysisApi.confirmAIReport(analysis.id);
      toast.success('报告已提交审核', { id: 'submit-report' });
      onComplete();
    } catch (error: any) {
      const msg = error?.response?.data?.message || '提交失败';
      toast.error(msg, { id: 'submit-report' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 视频控制 ───────────────────────────────────────
  const togglePlay = () => {
    if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const markCurrentTime = () => {
    const time = formatTime(currentTime);
    setEditingHighlightId(null);
    setHighlightForm(prev => ({ ...prev, mode: 'point', timestamp: time, startTime: time, endTime: '' }));
    setShowHighlightModal(true);
  };

  const markRangeStart = () => {
    const time = formatTime(currentTime);
    setEditingHighlightId(null);
    setHighlightForm(prev => ({ ...prev, mode: 'range', startTime: time, timestamp: time }));
    setShowHighlightModal(true);
  };

  const markRangeEnd = () => {
    const time = formatTime(currentTime);
    setEditingHighlightId(null);
    setHighlightForm(prev => ({
      ...prev,
      mode: 'range',
      startTime: prev.startTime || prev.timestamp || formatTime(Math.max(currentTime - 10, 0)),
      endTime: time,
    }));
    setShowHighlightModal(true);
  };

  const updateMarkerType = (markerType: HighlightMarkerType) => {
    const nextTag = HIGHLIGHT_TAGS.find(tag => tag.markerType === markerType)?.value || highlightForm.tagType;
    setHighlightForm(prev => ({ ...prev, markerType, tagType: nextTag }));
  };

  const toggleBrowserFullscreen = async () => {
    if (!videoPanelRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await videoPanelRef.current.requestFullscreen();
      }
    } catch (error) {
      setVideoExpanded(true);
      toast.info('当前浏览器不支持全屏，已切换为放大模式');
    }
  };

  const seekToPosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09090b]"
    >
      {/* ═══ HEADER ═══ */}
      <header className="flex-shrink-0 h-14 border-b border-white/[0.06] bg-white/[0.01] backdrop-blur-xl">
        <div className="h-full flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="h-4 w-px bg-white/[0.08]" />
            
            <div>
              <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                {order.player_name}
                <span className="text-xs font-normal text-slate-400">{order.player_position}</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">{order.order_no}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <AnimatePresence mode="wait">
              {lastSaved && (
                <motion.span
                  key={lastSaved.getTime()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[11px] text-slate-400"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  已保存 {lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </motion.span>
              )}
            </AnimatePresence>

            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              保存
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ═══ VIDEO PANEL ═══ */}
        <AnimatePresence mode="wait">
          {!videoMinimized ? (
            <motion.div
              ref={videoPanelRef}
              key="video-panel"
              initial={{ width: '42%', opacity: 0 }}
              animate={{ width: videoExpanded ? '70%' : '42%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col border-r border-white/[0.06] bg-black"
            >
              {/* Video area */}
              <div className="flex-1 relative bg-black">
                <video 
                  ref={videoRef}
                  src={order.video_url || undefined}
                  className="w-full h-full object-contain"
                  muted={isMuted}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onEnded={() => setIsPlaying(false)}
                />

                {!order.video_url && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0c]">
                    <Eye className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">暂无视频文件</p>
                    <p className="text-xs text-slate-500 mt-1">等待用户上传比赛录像</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="shrink-0 px-4 py-3 bg-[#0c0c0e] border-t border-white/[0.04]">
                {/* Progress */}
                <div 
                  ref={progressBarRef}
                  onClick={seekToPosition}
                  className="group/progress relative h-1 bg-white/[0.08] rounded-full cursor-pointer mb-2.5 hover:h-1.5 transition-all"
                >
                  <div 
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md"
                    style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 5px)` }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={togglePlay} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  <span className="text-[11px] font-mono text-slate-400 tabular-nums min-w-[80px]">
                    {formatTime(currentTime)}<span className="mx-0.5">/</span>{formatTime(duration)}
                  </span>

                  <div className="flex-1" />

                  <button onClick={() => setIsMuted(!isMuted)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center justify-center" title={isMuted ? '取消静音' : '静音'}>
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button onClick={markCurrentTime} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" />
                    单点
                  </button>

                  <button onClick={markRangeStart} className="px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                    开始
                  </button>

                  <button onClick={markRangeEnd} className="px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                    结束
                  </button>

                  <button onClick={() => setVideoExpanded(prev => !prev)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center" title={videoExpanded ? '退出放大' : '放大视频'}>
                    {videoExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  <button onClick={toggleBrowserFullscreen} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center" title={isVideoFullscreen ? '退出全屏' : '全屏'}>
                    {isVideoFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>

                  <button onClick={() => setVideoMinimized(true)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/[0.04] transition-colors flex items-center justify-center" title="最小化视频">
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="video-min-btn"
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              exit={{ width: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center py-4 px-1 border-r border-white/[0.06] cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setVideoMinimized(false)}
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 mb-1" />
              <span className="text-[9px] text-slate-500 writing-vertical-rl rotate-180">视频</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Score Summary Bar */}
          <div className="shrink-0 px-5 pt-4 pb-3">
            <div className="flex items-center gap-5">
              {/* Overall score */}
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={overallScore}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-bold tracking-tight tabular-nums"
                  style={{ color: potentialGrade.color }}
                >
                  {overallScore.toFixed(1)}
                </motion.span>
                <span className="text-sm text-slate-400 font-medium">/ 10</span>
              </div>

              {/* Grade badge */}
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-base font-bold"
                style={{ backgroundColor: `${potentialGrade.color}10`, color: potentialGrade.color }}
              >
                {potentialGrade.grade}
              </span>

              {/* Divider */}
              <div className="w-px h-8 bg-white/[0.06]" />

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span><strong className="text-slate-300">20</strong> 项维度</span>
                <span><strong style={{ color: highlights.length > 0 ? '#f97316' : undefined }}>{highlights.length}</strong> 个标记</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="shrink-0 px-5 border-b border-white/[0.06]">
            <nav className="flex gap-0.5 -mb-px overflow-x-auto no-scrollbar">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'text-slate-100' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-workspace"
                        className="absolute bottom-0 left-0 right-0 h-px bg-slate-300"
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badgeKey && highlights.length > 0 && (
                      <span className="ml-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-medium text-white bg-red-500 rounded-full px-1">
                        {highlights.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-5">
              <AnimatePresence mode="wait">
                
                {/* OVERALL */}
                {activeTab === 'overall' && (
                  <motion.div
                    key="overall"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2.5 max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">整体维度</span>
                      <span className="text-[11px] text-slate-500">4 项</span>
                    </div>
                    {OVERALL_CONFIG.map((dim, i) => {
                      const scoreKey = dim.key as keyof VideoAnalysisScores['overall'];
                      return (
                        <ScoreRow
                          key={dim.key}
                          label={dim.label}
                          desc={dim.desc}
                          icon={dim.icon}
                          index={i}
                          value={scores.overall?.[scoreKey]?.score ?? 7}
                          comment={scores.overall?.[scoreKey]?.comment ?? ''}
                          onScoreChange={(v) => uOS(scoreKey, v)}
                          onCommentChange={(c) => uOC(scoreKey, c)}
                        />
                      );
                    })}
                  </motion.div>
                )}

                {/* OFFENSE */}
                {activeTab === 'offense' && (
                  <motion.div
                    key="offense"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2.5 max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Swords className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">进攻分析</span>
                      <span className="text-[11px] text-slate-500">8 项</span>
                    </div>
                    {OFFENSE_CONFIG.map((dim, i) => {
                      const scoreKey = dim.key as keyof VideoAnalysisScores['offense'];
                      return (
                        <ScoreRow
                          key={dim.key}
                          label={dim.label}
                          desc={dim.desc}
                          icon={dim.icon}
                          index={i}
                          value={scores.offense?.[scoreKey]?.score ?? 7}
                          comment={scores.offense?.[scoreKey]?.comment ?? ''}
                          onScoreChange={(v) => uFS(scoreKey, v)}
                          onCommentChange={(c) => uFC(scoreKey, c)}
                        />
                      );
                    })}
                  </motion.div>
                )}

                {/* DEFENSE */}
                {activeTab === 'defense' && (
                  <motion.div
                    key="defense"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2.5 max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">防守分析</span>
                      <span className="text-[11px] text-slate-500">8 项</span>
                    </div>
                    {DEFENSE_CONFIG.map((dim, i) => {
                      const scoreKey = dim.key as keyof VideoAnalysisScores['defense'];
                      return (
                        <ScoreRow
                          key={dim.key}
                          label={dim.label}
                          desc={dim.desc}
                          icon={dim.icon}
                          index={i}
                          value={scores.defense?.[scoreKey]?.score ?? 7}
                          comment={scores.defense?.[scoreKey]?.comment ?? ''}
                          onScoreChange={(v) => uDS(scoreKey, v)}
                          onCommentChange={(c) => uDC(scoreKey, c)}
                        />
                      );
                    })}
                  </motion.div>
                )}

                {/* SUMMARY */}
                {activeTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 max-w-2xl"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">综合评语与建议</span>
                    </div>

                    {/* Main comment */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[13px] font-medium text-slate-200">
                          综合评语 <span className="text-red-400">*</span>
                          <span className="ml-1.5 text-xs font-normal text-slate-400">(至少50字)</span>
                        </label>
                        <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${overallComment.length >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'}`}>
                          {overallComment.length}/50
                        </span>
                      </div>
                      <textarea
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        placeholder="请对该球员在本场比赛中的整体表现进行综合评价..."
                        rows={4}
                        className="w-full px-3 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg focus:border-white/[0.12] focus:outline-none resize-none text-sm text-slate-100 placeholder-slate-700 leading-relaxed transition-colors"
                      />
                    </div>

                    {/* Two columns */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2.5">
                        <label className="text-[13px] font-medium text-emerald-400/80 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          优势表现
                        </label>
                        <textarea
                          value={strengthsComment}
                          onChange={(e) => setStrengthsComment(e.target.value)}
                          placeholder="该球员的亮点和优势..."
                          rows={4}
                          className="w-full px-3 py-2 bg-transparent border border-white/[0.06] rounded-lg focus:border-white/[0.12] focus:outline-none resize-none text-sm text-slate-200 placeholder-slate-700 transition-colors"
                        />
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2.5">
                        <label className="text-[13px] font-medium text-amber-400/80 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          待加强点
                        </label>
                        <textarea
                          value={weaknessesComment}
                          onChange={(e) => setWeaknessesComment(e.target.value)}
                          placeholder="需要改进和加强的地方..."
                          rows={4}
                          className="w-full px-3 py-2 bg-transparent border border-white/[0.06] rounded-lg focus:border-white/[0.12] focus:outline-none resize-none text-sm text-slate-200 placeholder-slate-700 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Training advice */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2.5">
                      <label className="text-[13px] font-medium text-cyan-400/80 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        训练建议
                      </label>
                      <textarea
                        value={trainingAdvice}
                        onChange={(e) => setTrainingAdvice(e.target.value)}
                        placeholder="根据本场表现，建议重点训练的方向..."
                        rows={3}
                        className="w-full px-3 py-2 bg-transparent border border-white/[0.06] rounded-lg focus:border-white/[0.12] focus:outline-none resize-none text-sm text-slate-200 placeholder-slate-700 transition-colors"
                      />
                    </div>

                    {/* Analyst notes */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2.5">
                      <label className="text-[13px] font-medium text-slate-400">
                        补充说明 <span className="font-normal text-slate-400">(可选)</span>
                      </label>
                      <textarea
                        value={analystNotes}
                        onChange={(e) => setAnalystNotes(e.target.value)}
                        placeholder="其他想补充的内容..."
                        rows={2}
                        className="w-full px-3 py-2 bg-transparent border border-white/[0.06] rounded-lg focus:border-white/[0.12] focus:outline-none resize-none text-sm text-slate-200 placeholder-slate-700 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}

                {/* HIGHLIGHTS */}
                {activeTab === 'highlights' && (
                  <motion.div
                    key="highlights"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 max-w-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">关键片段标记</span>
                      </div>
                      <button
                        onClick={openNewHighlightModal}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加标记
                      </button>
                    </div>

                    {highlights.length > 0 && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-medium text-slate-300">片段下载</span>
                            <span>已生成 {readyClipHighlights.length}</span>
                            <span>处理中 {pendingClipCount}</span>
                            <span>失败 {failedClipCount}</span>
                            <span>已选 {selectedReadyClipIds.length}</span>
                          </div>
                          <button
                            onClick={toggleAllReadyClips}
                            disabled={readyClipHighlights.length === 0}
                            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 disabled:text-slate-600 disabled:hover:text-slate-600 transition-colors"
                          >
                            {readyClipHighlights.length > 0 && selectedReadyClipIds.length === readyClipHighlights.length ? '取消全选' : '全选可下载'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleExportClips('all')}
                            disabled={exportingClips || clipExportInProgress || readyClipHighlights.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-40 disabled:hover:bg-emerald-500/10 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            全部
                          </button>
                          <button
                            onClick={() => handleExportClips('highlight')}
                            disabled={exportingClips || clipExportInProgress || readyClipHighlights.every(h => (h.marker_type || 'highlight') !== 'highlight')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/15 disabled:opacity-40 disabled:hover:bg-amber-500/10 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            精彩
                          </button>
                          <button
                            onClick={() => handleExportClips('issue')}
                            disabled={exportingClips || clipExportInProgress || readyClipHighlights.every(h => h.marker_type !== 'issue')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/15 disabled:opacity-40 disabled:hover:bg-rose-500/10 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            问题
                          </button>
                          <button
                            onClick={() => handleExportClips('selected')}
                            disabled={exportingClips || clipExportInProgress || selectedReadyClipIds.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500/10 text-xs font-medium text-sky-300 hover:bg-sky-500/15 disabled:opacity-40 disabled:hover:bg-sky-500/10 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            已选
                          </button>
                        </div>
                        {clipExportJob && clipExportMeta && (
                          <div className="space-y-2 rounded-md border border-white/[0.05] bg-black/10 p-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <span
                                  className="rounded px-1.5 py-0.5 font-medium"
                                  style={{ color: clipExportMeta.color, backgroundColor: clipExportMeta.bg }}
                                >
                                  {clipExportMeta.label}
                                </span>
                                <span>{clipExportJob.processed}/{clipExportJob.total}</span>
                                {clipExportJob.error && <span className="text-rose-300">{clipExportJob.error}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                {clipExportJob.status === 'ready' && (
                                  <button
                                    onClick={() => handleDownloadExportJob()}
                                    className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    重新下载
                                  </button>
                                )}
                                {clipExportJob.status === 'failed' && (
                                  <button
                                    onClick={() => handleRetryExportClips()}
                                    disabled={exportingClips}
                                    className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 disabled:text-slate-600 transition-colors"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    重试
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(Math.max(clipExportJob.progress || 0, 0), 100)}%`, backgroundColor: clipExportMeta.color }}
                              />
                            </div>
                          </div>
                        )}
                        {clipExportJobs.length > 0 && (
                          <div className="space-y-1.5 border-t border-white/[0.05] pt-2">
                            <div className="text-[11px] font-medium text-slate-400">最近导出</div>
                            {clipExportJobs.slice(0, 3).map(job => {
                              const meta = CLIP_EXPORT_STATUS_META[job.status];
                              return (
                                <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/10 px-2 py-1.5 text-[11px] text-slate-400">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span
                                      className="shrink-0 rounded px-1.5 py-0.5 font-medium"
                                      style={{ color: meta.color, backgroundColor: meta.bg }}
                                    >
                                      {meta.label}
                                    </span>
                                    <span className="shrink-0 tabular-nums">{job.progress}%</span>
                                    <span className="min-w-0 truncate">{job.filename || `导出任务 ${job.id}`}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {job.status === 'ready' && (
                                      <button
                                        onClick={() => handleDownloadExportJob(job)}
                                        className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
                                        下载
                                      </button>
                                    )}
                                    {job.status === 'failed' && (
                                      <button
                                        onClick={() => handleRetryExportClips(job)}
                                        disabled={exportingClips}
                                        className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 disabled:text-slate-600 transition-colors"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        重试
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {highlights.length === 0 ? (
                      <div className="text-center py-14 rounded-xl border border-dashed border-white/[0.06]">
                        <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm text-slate-400">暂无关键标记</p>
                        <p className="text-xs text-slate-500 mt-1">可标记精彩表现、待改进问题或战术观察</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {highlights.map((h, idx) => {
                          const tag = HIGHLIGHT_TAGS.find(t => t.value === h.tag_type);
                          const marker = MARKER_TYPES.find(t => t.value === (h.marker_type || 'highlight'));
                          const clipStatus = getClipStatus(h);
                          const clipMeta = CLIP_STATUS_META[clipStatus];
                          const isRange = (h.mode || 'point') === 'range';
                          const isReadyClip = isRange && clipStatus === 'ready' && !!h.video_clip_url;
                          const selectedForExport = selectedReadyClipIds.includes(h.id);
                          return (
                            <motion.div
                              key={h.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.2 }}
                              className="group rounded-lg border border-white/[0.06] bg-white/[0.01] px-3.5 py-2.5 hover:bg-white/[0.03] hover:border-white/[0.09] transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded bg-white/[0.04] text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                  {idx + 1}
                                </span>
                                {isReadyClip ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedForExport}
                                    onChange={() => toggleClipSelection(h.id)}
                                    aria-label="选择片段"
                                    className="w-3.5 h-3.5 shrink-0 rounded border-white/[0.16] bg-transparent accent-emerald-400"
                                  />
                                ) : (
                                  <span className="w-3.5 shrink-0" />
                                )}
                                <span className="text-xs font-mono font-medium text-blue-400 min-w-[52px] shrink-0">
                                  {h.timestamp}
                                </span>
                                {marker && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ color: marker.color, backgroundColor: marker.bg }}>
                                    {marker.label}
                                  </span>
                                )}
                                {tag && (
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ color: tag.color, backgroundColor: tag.bg }}>
                                    {tag.label}
                                  </span>
                                )}
                                {isRange && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ color: clipMeta.color, backgroundColor: clipMeta.bg }}>
                                    {clipMeta.label}
                                  </span>
                                )}
                                <span className="flex-1 text-[13px] text-slate-300 truncate">{h.description}</span>
                                {h.include_in_report && (
                                  <span className="text-[10px] text-emerald-500/60 shrink-0">含报告</span>
                                )}
                                {isReadyClip && (
                                  <button
                                    onClick={() => handleDownloadClip(h.id)}
                                    className="shrink-0 p-1 rounded text-slate-500 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="下载片段"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isRange && clipStatus === 'failed' && (
                                  <button
                                    onClick={() => handleRetryClip(h.id)}
                                    className="shrink-0 p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    aria-label="重试剪辑"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openEditHighlightModal(h)}
                                  className="shrink-0 p-1 rounded text-slate-500 hover:text-blue-300 hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  aria-label="编辑标记"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteHighlight(h.id)}
                                  className="shrink-0 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  aria-label="删除标记"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {isReadyClip && (
                                <video
                                  src={h.video_clip_url}
                                  controls
                                  className="mt-2 w-full max-h-40 rounded-lg border border-white/[0.06] bg-black"
                                />
                              )}
                              {isRange && clipStatus === 'failed' && h.clip_error && (
                                <p className="mt-2 text-[11px] leading-relaxed text-red-300/80">
                                  {h.clip_error}
                                </p>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* AI REPORT */}
                {activeTab === 'ai-report' && (
                  <motion.div
                    key="ai-report"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 max-w-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">AI 智能报告</span>
                      </div>
                      <button
                        onClick={handleGenerateAIReport}
                        disabled={generating || overallScore === 0}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:opacity-40 rounded-lg transition-colors"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin h-3 w-3 border-1.5 border-white/30 border-t-white rounded-full" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            生成报告
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      AI 将根据您的 20 项维度评分、评语和关键片段标记，自动生成约 5000 字的专业分析报告。
                    </p>

                    {/* Generating */}
                    {aiReportStatus === 'generating' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-purple-500/10 bg-purple-500/[0.02] p-12 text-center"
                      >
                        <div className="relative inline-flex items-center justify-center mb-4">
                          <div className="animate-spin h-10 w-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full" />
                          <Sparkles className="absolute w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-sm text-slate-200 font-medium">AI 正在深度分析中...</p>
                        <p className="text-xs text-slate-400 mt-1">预计需要 3-5 分钟，生成完成后会自动显示</p>
                        <div className="flex justify-center gap-1.5 mt-4">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              className="w-1.5 h-1.5 rounded-full bg-purple-500/40"
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Report editor */}
                    {aiReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-400">
                              v{analysis?.ai_report_version || 1}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">可编辑</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={handleUpdateAIReport} className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-slate-100 rounded hover:bg-white/[0.04] transition-colors">
                              保存
                            </button>
                            <button onClick={handleGenerateAIReport} className="px-2.5 py-1 text-[11px] text-purple-400 hover:text-white rounded hover:bg-purple-500/10 transition-colors">
                              重新生成
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={aiReport}
                          onChange={(e) => setAiReport(e.target.value)}
                          rows={24}
                          className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:ring-0 font-mono text-[12.5px] text-slate-200 leading-relaxed"
                          spellCheck={false}
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="shrink-0 border-t border-white/[0.06] px-5 py-3 bg-[#09090b]/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span><strong className="text-slate-400">20</strong> 项维度</span>
                <span>·</span>
                <span><strong className="text-slate-400">{highlights.length}</strong> 个标记</span>
                <span>·</span>
                <span>
                  综合 <strong className="tabular-nums" style={{ color: potentialGrade.color }}>{overallScore.toFixed(1)}</strong> 分
                </span>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={async () => { await saveDraft(); onCancel(); }}
                  className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/[0.08] hover:text-slate-100 hover:border-white/[0.15] rounded-lg transition-colors"
                >
                  暂不提交
                </button>
                <button
                  onClick={handleConfirmAndSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 rounded-lg transition-colors"
                >
                  {submitting ? (
                    <div className="animate-spin h-4 w-4 border-1.5 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  确认并提交
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ HIGHLIGHT MODAL ═══ */}
      <AnimatePresence>
        {showHighlightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && closeHighlightModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 5 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#111114] shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  {editingHighlightId ? '编辑关键片段' : '标记关键片段'}
                </h3>
                <button onClick={closeHighlightModal} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">标记类型</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MARKER_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => updateMarkerType(type.value)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          color: highlightForm.markerType === type.value ? type.color : '#94a3b8',
                          backgroundColor: highlightForm.markerType === type.value ? type.bg : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${highlightForm.markerType === type.value ? type.color + '33' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">时间方式</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: 'point' as HighlightMode, label: '单一时间点' },
                      { value: 'range' as HighlightMode, label: '开始-结束时间段' },
                    ].map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => setHighlightForm(prev => ({ ...prev, mode: mode.value }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          highlightForm.mode === mode.value
                            ? 'text-blue-300 bg-blue-500/10 border-blue-400/25'
                            : 'text-slate-400 bg-white/[0.02] border-white/[0.06] hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  {highlightForm.mode === 'point' ? (
                    <>
                      <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">时间点</label>
                      <input
                        type="text"
                        value={highlightForm.timestamp}
                        onChange={(e) => setHighlightForm(prev => ({ ...prev, timestamp: e.target.value, startTime: e.target.value }))}
                        placeholder="例如: 12:30"
                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-100 font-mono focus:border-white/[0.18] focus:outline-none transition-colors placeholder-slate-700"
                      />
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">开始时间</label>
                        <input
                          type="text"
                          value={highlightForm.startTime}
                          onChange={(e) => setHighlightForm(prev => ({ ...prev, startTime: e.target.value }))}
                          placeholder="例如: 12:30"
                          className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-100 font-mono focus:border-white/[0.18] focus:outline-none transition-colors placeholder-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">结束时间</label>
                        <input
                          type="text"
                          value={highlightForm.endTime}
                          onChange={(e) => setHighlightForm(prev => ({ ...prev, endTime: e.target.value }))}
                          placeholder="例如: 12:45"
                          className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-100 font-mono focus:border-white/[0.18] focus:outline-none transition-colors placeholder-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">标签类型</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HIGHLIGHT_TAGS.filter(tag => tag.markerType === highlightForm.markerType).map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => setHighlightForm(prev => ({ ...prev, tagType: tag.value }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          color: highlightForm.tagType === tag.value ? tag.color : '#64748b',
                          backgroundColor: highlightForm.tagType === tag.value ? tag.bg : 'transparent',
                          border: `1px solid ${highlightForm.tagType === tag.value ? tag.color + '25' : 'transparent'}`,
                        }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">描述详情</label>
                  <textarea
                    value={highlightForm.description}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述这段表现、问题或战术观察..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-100 focus:border-white/[0.18] focus:outline-none resize-none transition-colors placeholder-slate-700"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    highlightForm.includeInReport ? 'bg-amber-500' : 'border border-slate-700 group-hover:border-slate-500'
                  }`} onClick={() => setHighlightForm(prev => ({ ...prev, includeInReport: !prev.includeInReport }))}>
                    {highlightForm.includeInReport && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[13px] text-slate-300 group-hover:text-slate-200 transition-colors">
                    包含在 AI 报告中
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={closeHighlightModal} className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/[0.08] hover:text-slate-100 hover:border-white/[0.15] rounded-lg transition-colors">
                  取消
                </button>
                <button onClick={handleSaveHighlight} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                  {editingHighlightId ? '更新标记' : '保存标记'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoAnalysisWorkspace;
