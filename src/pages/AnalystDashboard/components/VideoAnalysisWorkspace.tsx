import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analystApi, videoAnalysisApi } from '../../../services/api';
import type { 
  Order, 
  VideoAnalysis, 
  VideoAnalysisScores, 
  AnalysisHighlight,
  UpdateScoresRequest,
  CreateHighlightRequest,
  AIReportResponse 
} from '../../types';
import { toast } from 'sonner';
import {
  ChevronLeft, Play, Pause, Volume2, VolumeX, Save, Send, 
  Sparkles, CheckCircle, AlertCircle, AlertTriangle, X, Plus, Star, Trophy,
  Zap, Shield, Target, Users, Activity, Eye, Footprints, Wind, Compass, 
  ArrowRight, Swords, TrendingUp, Crosshair, MessageSquare, 
  UserCheck, ShieldCheck, Timer, RefreshCw, Gauge, Flame, Crown,
  Minimize2, Maximize2
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

const HIGHLIGHT_TAGS = [
  { value: 'goal', label: '进球', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { value: 'assist', label: '助攻', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  { value: 'steal', label: '抢断', color: '#eab308', bg: 'rgba(234,179,8,0.10)' },
  { value: 'save', label: '扑救', color: '#a855f7', bg: 'rgba(168,85,247,0.10)' },
  { value: 'dribble', label: '过人', color: '#ec4899', bg: 'rgba(236,72,153,0.10)' },
  { value: 'pass', label: '关键传球', color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
  { value: 'defense', label: '防守关键', color: '#f97316', bg: 'rgba(249,115,22,0.10)' },
];

const TABS = [
  { key: 'overall' as const, label: '整体评价', icon: Star },
  { key: 'offense' as const, label: '进攻分析', icon: Swords },
  { key: 'defense' as const, label: '防守分析', icon: Shield },
  { key: 'summary' as const, label: '综合评语', icon: MessageSquare },
  { key: 'highlights' as const, label: '高光标记', icon: Trophy, badgeKey: true },
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
  const [aiReportStatus, setAiReportStatus] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'overall' | 'offense' | 'defense' | 'summary' | 'highlights' | 'ai-report'>('overall');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [videoMinimized, setVideoMinimized] = useState(false);

  // 视频播放
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // 高光标记弹窗
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightForm, setHighlightForm] = useState({
    timestamp: '',
    tagType: 'goal' as any,
    description: '',
    includeInReport: true,
  });

  const overallScore = calculateOverallScore(scores);
  const potentialGrade = getPotentialGrade(overallScore);

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
  }, [order.id]);

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

  // ─── 高光标记 ──────────────────────────────────────
  const handleAddHighlight = async () => {
    if (!analysis || !highlightForm.timestamp || !highlightForm.description) {
      toast.error('请填写完整信息');
      return;
    }
    try {
      const data: CreateHighlightRequest = {
        analysis_id: analysis.id,
        timestamp: highlightForm.timestamp,
        tag_type: highlightForm.tagType,
        description: highlightForm.description,
        include_in_report: highlightForm.includeInReport,
      };
      const res = await videoAnalysisApi.createHighlight(data);
      if (res.data?.data) {
        setHighlights(prev => [...prev, res.data.data]);
        setShowHighlightModal(false);
        setHighlightForm({ timestamp: '', tagType: 'goal', description: '', includeInReport: true });
        toast.success('高光标记成功');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleDeleteHighlight = async (id: number) => {
    try {
      await videoAnalysisApi.deleteHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
      toast.success('已删除');
    } catch (error) {
      toast.error('删除失败');
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
      toast.success('AI报告生成任务已提交，预计需要3-5分钟', {
        id: 'generate-ai',
        description: '生成完成后您可在此页面查看，也可前往球员端「我的分析报告」查看',
        duration: 6000,
      });
    } catch (error: any) {
      setAiReportStatus('');
      const msg = error?.response?.data?.message || 'AI生成提交失败，请重试';
      toast.error(msg, { id: 'generate-ai' });
    } finally {
      setGenerating(false);
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
      toast.success('报告提交成功', { id: 'submit-report' });
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
    setHighlightForm(prev => ({ ...prev, timestamp: time }));
    setShowHighlightModal(true);
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
              key="video-panel"
              initial={{ width: '42%', opacity: 0 }}
              animate={{ width: '42%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col border-r border-white/[0.06]"
            >
              {/* Video area */}
              <div className="flex-1 relative bg-black">
                <video 
                  ref={videoRef}
                  src={order.video_url || undefined}
                  className="w-full h-full object-contain"
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

                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-300 hover:text-white transition-colors">
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>

                  <span className="text-[11px] font-mono text-slate-400 tabular-nums min-w-[80px]">
                    {formatTime(currentTime)}<span className="mx-0.5">/</span>{formatTime(duration)}
                  </span>

                  <div className="flex-1" />

                  <button onClick={() => setIsMuted(!isMuted)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors flex items-center justify-center">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button onClick={markCurrentTime} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" />
                    标记高光
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
                <span><strong style={{ color: highlights.length > 0 ? '#f97316' : undefined }}>{highlights.length}</strong> 个高光</span>
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
                    {OVERALL_CONFIG.map((dim, i) => (
                      <ScoreRow key={dim.key} {...dim}
                        index={i}
                        value={scores.overall?.[dim.key]?.score ?? 7}
                        comment={scores.overall?.[dim.key]?.comment ?? ''}
                        onScoreChange={(v) => uOS(dim.key as any, v)}
                        onCommentChange={(c) => uOC(dim.key as any, c)}
                      />
                    ))}
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
                    {OFFENSE_CONFIG.map((dim, i) => (
                      <ScoreRow key={dim.key} {...dim}
                        index={i}
                        value={scores.offense?.[dim.key]?.score ?? 7}
                        comment={scores.offense?.[dim.key]?.comment ?? ''}
                        onScoreChange={(v) => uFS(dim.key as any, v)}
                        onCommentChange={(c) => uFC(dim.key as any, c)}
                      />
                    ))}
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
                    {DEFENSE_CONFIG.map((dim, i) => (
                      <ScoreRow key={dim.key} {...dim}
                        index={i}
                        value={scores.defense?.[dim.key]?.score ?? 7}
                        comment={scores.defense?.[dim.key]?.comment ?? ''}
                        onScoreChange={(v) => uDS(dim.key as any, v)}
                        onCommentChange={(c) => uDC(dim.key as any, c)}
                      />
                    ))}
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
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">高光时刻</span>
                      </div>
                      <button
                        onClick={() => setShowHighlightModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        添加高光
                      </button>
                    </div>

                    {highlights.length === 0 ? (
                      <div className="text-center py-14 rounded-xl border border-dashed border-white/[0.06]">
                        <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm text-slate-400">暂无高光标记</p>
                        <p className="text-xs text-slate-500 mt-1">点击「标记高光」按钮添加精彩瞬间</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {highlights.map((h, idx) => {
                          const tag = HIGHLIGHT_TAGS.find(t => t.value === h.tag_type);
                          return (
                            <motion.div
                              key={h.id}
                              layout
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.2 }}
                              className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.01] px-3.5 py-2.5 hover:bg-white/[0.03] hover:border-white/[0.09] transition-all"
                            >
                              <span className="w-5 h-5 rounded bg-white/[0.04] text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-mono font-medium text-blue-400 min-w-[52px] shrink-0">
                                {h.timestamp}
                              </span>
                              {tag && (
                                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ color: tag.color, backgroundColor: tag.bg }}>
                                  {tag.label}
                                </span>
                              )}
                              <span className="flex-1 text-[13px] text-slate-300 truncate">{h.description}</span>
                              {h.include_in_report && (
                                <span className="text-[10px] text-emerald-500/60 shrink-0">含报告</span>
                              )}
                              <button
                                onClick={() => handleDeleteHighlight(h.id)}
                                className="shrink-0 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
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
                      AI 将根据您的 20 项维度评分和评语，自动生成约 5000 字的专业分析报告。
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
                        <p className="text-xs text-slate-400 mt-1">预计需要 3-5 分钟，生成完成后可刷新查看</p>
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
                <span><strong className="text-slate-400">{highlights.length}</strong> 个高光</span>
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
            onClick={(e) => e.target === e.currentTarget && setShowHighlightModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 5 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#111114] shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  标记高光时刻
                </h3>
                <button onClick={() => setShowHighlightModal(false)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">时间点</label>
                  <input
                    type="text"
                    value={highlightForm.timestamp}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, timestamp: e.target.value }))}
                    placeholder="例如: 12:30"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-100 font-mono focus:border-white/[0.18] focus:outline-none transition-colors placeholder-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">标签类型</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HIGHLIGHT_TAGS.map(tag => (
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
                    placeholder="描述这个高光时刻的具体表现..."
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
                <button onClick={() => setShowHighlightModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/[0.08] hover:text-slate-100 hover:border-white/[0.15] rounded-lg transition-colors">
                  取消
                </button>
                <button onClick={handleAddHighlight} className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                  确认添加
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
