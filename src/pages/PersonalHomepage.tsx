import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Footprints,
  Heart,
  LineChart,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCcw,
  Ruler,
  Share2,
  ShieldCheck,
  Target,
  Trophy,
  UserPlus,
  Users,
  Weight,
} from 'lucide-react';
import { Loading } from '../components';
import { CommentSection, FavoriteButton, FollowButton, LikeButton, MessageModal } from '../components/social';
import { CreatePostModal } from './ScoutMap/SocialFeed';
import { TrialInviteModal } from './ScoutMap/TrialInviteModal';
import { authApi, playerApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type {
  PlayerHomepageData,
  PlayerHomepageMatch,
  PlayerHomepagePhysicalRecord,
  PlayerHomepagePost,
  PlayerHomepageReport,
  PlayerHomepageScoutReport,
  PlayerHomepageTimelineItem,
  PlayerHomepageWeeklyReport,
} from '../types/playerHomepage';

type ProofTab = 'physical' | 'matches' | 'weekly' | 'reports' | 'scoutReports' | 'posts';

const positionMap: Record<string, string> = {
  ST: '前锋',
  CF: '中锋',
  LW: '左边锋',
  RW: '右边锋',
  CAM: '前腰',
  AM: '前腰',
  CM: '中场',
  CDM: '后腰',
  DM: '后腰',
  LM: '左前卫',
  RM: '右前卫',
  LB: '左后卫',
  RB: '右后卫',
  CB: '中后卫',
  GK: '门将',
};

const footMap: Record<string, string> = {
  left: '左脚',
  right: '右脚',
  both: '双脚',
};

const tabConfig: Array<{ id: ProofTab; label: string; icon: React.ElementType }> = [
  { id: 'physical', label: '体测', icon: Activity },
  { id: 'matches', label: '比赛', icon: Trophy },
  { id: 'weekly', label: '周报', icon: CalendarDays },
  { id: 'reports', label: '报告', icon: FileText },
  { id: 'scoutReports', label: '球探', icon: Target },
  { id: 'posts', label: '动态', icon: MessageCircle },
];

const getPositionLabel = (value?: string) => (value ? positionMap[value] || value : '未填写');
const getFootLabel = (value?: string) => (value ? footMap[value] || value : '未填写');
const getPercent = (value?: number) => Math.max(0, Math.min(100, Math.round(value || 0)));
const formatRating = (value?: number) => (value && value > 0 ? value.toFixed(1) : '-');
const hasValue = (value: unknown) => value !== undefined && value !== null && value !== '' && value !== 0;
const getUserId = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const user = value as { id?: unknown; user_id?: unknown; userId?: unknown };
  const rawId = user.id ?? user.user_id ?? user.userId;
  if (typeof rawId === 'number' && Number.isFinite(rawId)) return String(rawId);
  if (typeof rawId === 'string' && rawId.trim() !== '') return rawId;
  return '';
};
const getRequestErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { error?: { message?: string }; message?: string } } }).response;
    return response?.data?.error?.message || response?.data?.message || fallback;
  }
  return fallback;
};

const resultLabel: Record<string, string> = {
  win: '胜',
  draw: '平',
  lose: '负',
  pending: '待定',
};

const reviewStatusLabel: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已退回',
};

const submitStatusLabel: Record<string, string> = {
  draft: '待填写',
  submitted: '已提交',
  overdue: '已逾期',
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  icon: Icon,
  children,
  action,
}) => (
  <section className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b111b]/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#39ff14]/70 to-transparent opacity-70" />
    <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-[#00d4ff]/10 blur-3xl transition group-hover:bg-[#39ff14]/10" />
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-lg font-semibold tracking-[-0.02em] text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#39ff14]/30 bg-[#39ff14]/10 text-[#39ff14] shadow-[0_0_24px_rgba(57,255,20,0.12)]">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState: React.FC<{ title: string; detail?: string }> = ({ title, detail }) => (
  <div className="rounded-[22px] border border-dashed border-white/10 bg-black/25 px-4 py-10 text-center shadow-inner shadow-black/20">
    <Lock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
    <div className="text-sm font-medium text-slate-300">{title}</div>
    {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
  </div>
);

const Metric: React.FC<{ icon: React.ElementType; label: string; value: string | number; tone?: string }> = ({
  icon: Icon,
  label,
  value,
  tone = '#39ff14',
}) => (
  <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]">
    <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: tone }} />
    <div className="relative mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
      <Icon className="h-4 w-4" style={{ color: tone }} />
      {label}
    </div>
    <div className="relative font-['Avenir_Next_Condensed','DIN_Alternate','Trebuchet_MS',sans-serif] text-3xl font-semibold tracking-tight text-white">{value}</div>
  </div>
);

const TagList: React.FC<{ items: string[]; empty?: string }> = ({ items, empty = '暂无标签' }) => {
  if (!items.length) {
    return <span className="text-sm text-slate-500">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-[#39ff14]/25 bg-[#39ff14]/10 px-3 py-1 text-sm text-[#b9ff9f] shadow-[0_0_20px_rgba(57,255,20,0.08)]">
          {item}
        </span>
      ))}
    </div>
  );
};

const PhysicalCard: React.FC<{ record: PlayerHomepagePhysicalRecord }> = ({ record }) => {
  const metrics = [
    { label: '30米跑', value: record.sprint30m, unit: '秒' },
    { label: '立定跳远', value: record.standingLongJump, unit: 'cm' },
    { label: '坐位体前屈', value: record.sitAndReach, unit: 'cm' },
    { label: '俯卧撑', value: record.pushUp, unit: '个' },
    { label: '仰卧起坐', value: record.sitUp, unit: '个' },
    { label: '折返跑', value: record.shuttleRun, unit: '秒' },
    { label: '50米跑', value: record.sprint50m, unit: '秒' },
    { label: '纵跳', value: record.verticalJump, unit: 'cm' },
  ];

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-white">{record.sourceLabel}</span>
            {record.source === 'club' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                官方
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-500">{record.activityName || record.clubName || '个人记录'}</div>
        </div>
        <div className="text-sm text-slate-400">{record.testDate}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/5 bg-white/[0.035] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{metric.label}</div>
            <div className="mt-1 text-lg font-semibold text-white">
              {hasValue(metric.value) ? metric.value : '-'}
              {hasValue(metric.value) && <span className="ml-1 text-xs font-normal text-slate-500">{metric.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MatchCard: React.FC<{ match: PlayerHomepageMatch }> = ({ match }) => (
  <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-semibold text-white">{match.matchName}</div>
        <div className="mt-1 text-sm text-slate-400">{match.teamName || '球队'} 对 {match.opponent || '对手'}</div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {match.result && <span className="rounded bg-[#39ff14]/10 px-2 py-1 text-[#39ff14]">{resultLabel[match.result] || match.result}</span>}
        {match.score && <span className="text-white">{match.score}</span>}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Metric icon={CalendarDays} label="比赛日期" value={match.matchDate || '-'} tone="#60a5fa" />
      <Metric icon={Target} label="进球/助攻" value={`${match.goals || 0}/${match.assists || 0}`} tone="#f59e0b" />
      <Metric icon={ShieldCheck} label="教练评分" value={formatRating(match.coachRating)} tone="#39ff14" />
      <Metric icon={Activity} label="表现" value={match.performance || '-'} tone="#a78bfa" />
    </div>
    {match.coachComment && <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">{match.coachComment}</p>}
  </div>
);

const WeeklyCard: React.FC<{ report: PlayerHomepageWeeklyReport }> = ({ report }) => (
  <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-semibold text-white">{report.weekLabel}</div>
        <div className="mt-1 text-sm text-slate-500">{report.weekStart} 至 {report.weekEnd}</div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-300">{submitStatusLabel[report.submitStatus] || report.submitStatus}</span>
        <span className="rounded-full bg-[#39ff14]/10 px-2 py-1 text-[#39ff14]">{reviewStatusLabel[report.reviewStatus] || report.reviewStatus}</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Metric icon={BarChart3} label="自评均分" value={formatRating(report.selfAverage)} tone="#60a5fa" />
      <Metric icon={ShieldCheck} label="教练均分" value={formatRating(report.coachAverage)} tone="#39ff14" />
      <Metric icon={Target} label="状态" value={reviewStatusLabel[report.reviewStatus] || report.reviewStatus} tone="#f59e0b" />
      <Metric icon={Clock3} label="周期" value={report.weekLabel.replace('年第', '-').replace('周', '')} tone="#a78bfa" />
    </div>
    {(report.reviewComment || report.suggestions || report.nextWeekFocus) && (
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {report.reviewComment && <p>{report.reviewComment}</p>}
        {report.suggestions && <p className="text-slate-400">建议：{report.suggestions}</p>}
        {report.nextWeekFocus && <p className="text-slate-400">下周重点：{report.nextWeekFocus}</p>}
      </div>
    )}
  </div>
);

const ReportCard: React.FC<{ report: PlayerHomepageReport }> = ({ report }) => (
  <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-semibold text-white">视频分析报告</div>
        <div className="mt-1 text-sm text-slate-500">{report.createdAt} · {report.playerPosition || '位置未填写'}</div>
      </div>
      <div className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
        {formatRating(report.overallRating)}
      </div>
    </div>
    {report.summary && <p className="mb-4 text-sm leading-6 text-slate-300">{report.summary}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-xs text-slate-500">优势</div>
        <TagList items={report.strengths} empty="暂无优势摘要" />
      </div>
      <div>
        <div className="mb-2 text-xs text-slate-500">待提升</div>
        <TagList items={report.weaknesses} empty="暂无待提升摘要" />
      </div>
    </div>
    {report.suggestions && <p className="mt-4 rounded-lg bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">{report.suggestions}</p>}
  </div>
);

const ScoutReportCard: React.FC<{ report: PlayerHomepageScoutReport }> = ({ report }) => (
  <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-semibold text-white">球探观察报告</div>
        <div className="mt-1 text-sm text-slate-500">
          {report.publishedAt || report.createdAt} · {report.scoutName || '球探'}{report.organization ? ` · ${report.organization}` : ''}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {report.potentialRating && (
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
            潜力 {report.potentialRating}
          </span>
        )}
        <span className="rounded-full bg-[#39ff14]/10 px-3 py-1 text-sm font-semibold text-[#39ff14]">
          {formatRating(report.overallRating)}
        </span>
      </div>
    </div>
    {report.summary && <p className="mb-4 text-sm leading-6 text-slate-300">{report.summary}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-xs text-slate-500">球探看到的优势</div>
        <TagList items={report.strengths} empty="暂无优势摘要" />
      </div>
      <div>
        <div className="mb-2 text-xs text-slate-500">球探建议提升</div>
        <TagList items={report.weaknesses} empty="暂无待提升摘要" />
      </div>
    </div>
    {(report.recommendation || report.targetClub) && (
      <div className="mt-4 rounded-lg bg-white/[0.03] p-3 text-sm leading-6 text-slate-300">
        {report.recommendation && <p>{report.recommendation}</p>}
        {report.targetClub && <p className="mt-1 text-slate-400">目标方向：{report.targetClub}</p>}
      </div>
    )}
  </div>
);

const PostCard: React.FC<{ post: PlayerHomepagePost }> = ({ post }) => (
  <div className="rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
      <span>{post.createdAt}</span>
      <span>{post.likesCount} 赞 · {post.commentsCount} 评论</span>
    </div>
    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p>
    {post.images.length > 0 && (
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        {post.images.slice(0, 6).map((image) => (
          <img key={image} src={image} alt="" className="aspect-video rounded-lg object-cover" />
        ))}
      </div>
    )}
  </div>
);

const Timeline: React.FC<{ items: PlayerHomepageTimelineItem[] }> = ({ items }) => {
  if (!items.length) {
    return <EmptyState title="暂无成长轨迹" detail="体测、周报、比赛、报告、球探观察和动态会沉淀到这里" />;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-[24px] border border-white/10 bg-[#070d15]/90 p-4">
          <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-[#39ff14] shadow-[0_0_18px_rgba(57,255,20,0.7)]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-white">{item.title}</div>
              <div className="text-xs text-slate-500">{item.date}</div>
            </div>
            <div className="mt-1 text-xs text-[#39ff14]/80">{item.sourceLabel}</div>
            {item.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.summary}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

const PersonalHomepage: React.FC = () => {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuthStore();
  const [data, setData] = useState<PlayerHomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProofTab>('physical');
  const [shareCopied, setShareCopied] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isTrialInviteOpen, setIsTrialInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState('');

  const currentId = urlId || getUserId(currentUser) || resolvedUserId;

  const loadHomepage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let playerId = currentId;
      if (!playerId && !urlId) {
        const meResponse = await authApi.getUserInfo();
        const meUser = meResponse.data?.data?.user;
        playerId = getUserId(meUser);
        if (playerId) {
          updateUser(meUser);
          setResolvedUserId(playerId);
        }
      }

      if (!playerId) {
        setError('缺少球员 ID，请重新登录后再查看主页');
        return;
      }

      const response = await playerApi.getHomepage(playerId);
      if (response.data?.success && response.data?.data) {
        setData(response.data.data as PlayerHomepageData);
      } else {
        setError(response.data?.error?.message || '主页数据加载失败');
      }
    } catch (err: unknown) {
      setError(getRequestErrorMessage(err, '主页数据加载失败'));
    } finally {
      setLoading(false);
    }
  }, [currentId, updateUser, urlId]);

  useEffect(() => {
    loadHomepage();
  }, [loadHomepage]);

  const proofCounts = useMemo(() => ({
    physical: data?.physicalTests?.records?.length || 0,
    matches: data?.matches?.total || 0,
    weekly: data?.weeklyReports?.total || 0,
    reports: data?.reports?.total || 0,
    scoutReports: data?.scoutReports?.total || 0,
    posts: data?.posts?.total || 0,
  }), [data]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1600);
  };

  const handleWriteScoutReport = () => {
    if (!data) return;

    const reportPlayer = {
      id: String(data.profile.id),
      name: data.profile.displayName,
      age: data.profile.age || 0,
      position: data.profile.position || '未知',
      team: data.profile.currentTeam || data.affiliation.teamName || data.affiliation.clubName || '',
      avatar: data.profile.avatar,
    };
    sessionStorage.setItem('scoutReportDraftPlayer', JSON.stringify(reportPlayer));
    navigate('/scout/dashboard?tab=editor', {
      state: {
        activeTab: 'editor',
        reportPlayer,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b12] pt-24">
        <div className="mx-auto max-w-[960px] px-4">
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#070b12] px-4 pt-24">
        <div className="mx-auto max-w-[720px] rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-red-300" />
          <h1 className="text-xl font-semibold text-white">{error || '主页不存在'}</h1>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
            <button onClick={loadHomepage} className="inline-flex items-center gap-2 rounded-lg bg-[#39ff14] px-4 py-2 text-sm font-semibold text-black">
              <RefreshCcw className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { profile, affiliation, stats, actions } = data;
  const physicalRecords = data.physicalTests?.records || [];
  const matchList = data.matches?.list || [];
  const weeklyList = data.weeklyReports?.list || [];
  const reportList = data.reports?.list || [];
  const scoutReportList = data.scoutReports?.list || [];
  const postList = data.posts?.list || [];
  const latestPhysical = data.physicalTests?.latest;

  return (
    <div className="min-h-screen overflow-hidden bg-[#03070b] font-['Avenir_Next','Space_Grotesk','Trebuchet_MS',sans-serif] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(57,255,20,0.16),transparent_28%),radial-gradient(circle_at_82%_2%,rgba(0,212,255,0.13),transparent_30%),linear-gradient(135deg,rgba(7,11,18,0.94),rgba(3,7,11,1)_62%,rgba(10,23,16,0.94))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(57,255,20,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.3)_1px,transparent_1px)] [background-size:54px_54px]" />
      <div className="pointer-events-none fixed left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-[#39ff14]/15" />
      <div className="relative mx-auto max-w-[1180px] px-4 pb-16 pt-20 sm:pt-24">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-xl hover:border-[#39ff14]/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="flex flex-wrap gap-2">
            {actions.canEdit && (
              <Link to="/user-dashboard" className="inline-flex items-center gap-2 rounded-full border border-[#39ff14]/30 bg-[#39ff14]/10 px-4 py-2 text-sm text-[#b8ff9e] shadow-[0_0_24px_rgba(57,255,20,0.08)] hover:bg-[#39ff14]/15">
                <Pencil className="h-4 w-4" />
                编辑资料
              </Link>
            )}
            <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 backdrop-blur-xl hover:text-white">
              <Share2 className="h-4 w-4" />
              {shareCopied ? '已复制' : '分享主页'}
            </button>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,25,36,0.96),rgba(6,14,21,0.96)_46%,rgba(8,31,22,0.96))] shadow-[0_36px_110px_rgba(0,0,0,0.42)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#39ff14] via-[#00d4ff] to-[#39ff14]" />
          <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-[#39ff14]/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#00d4ff]/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(115deg,transparent_0%,transparent_46%,rgba(57,255,20,0.45)_46.2%,transparent_47%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:100%_100%,100%_72px]" />
          <div className="relative grid gap-8 p-5 lg:grid-cols-[1fr_340px] lg:p-8">
            <div className="grid gap-6 md:grid-cols-[156px_1fr]">
              <div className="relative">
                <div className="absolute -left-3 -top-3 h-20 w-20 rounded-full border border-[#39ff14]/30" />
                <div className="relative h-36 w-36 overflow-hidden rounded-[30px] border border-[#39ff14]/45 bg-[#061018] shadow-[0_0_46px_rgba(57,255,20,0.16)]">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#39ff14]">
                      <Users className="h-14 w-14" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-4 left-5 rounded-2xl border border-white/10 bg-black/70 px-4 py-2 text-center backdrop-blur-xl">
                  <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">kit no.</div>
                  <div className="font-['Avenir_Next_Condensed','DIN_Alternate','Trebuchet_MS',sans-serif] text-3xl font-black leading-none text-white">
                    {affiliation.jerseyNumber || profile.jerseyNumber || '00'}
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#39ff14]/30 bg-[#39ff14]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b8ff9e]">
                    scouting dossier
                  </span>
                  {profile.realName && profile.realName !== profile.displayName && (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-400">{profile.realName}</span>
                  )}
                  {latestPhysical?.source === 'club' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#39ff14]/10 px-3 py-1 text-xs text-[#b8ff9e]">
                      <BadgeCheck className="h-3 w-3" />
                      官方体测
                    </span>
                  )}
                </div>
                <h1 className="max-w-3xl font-['Avenir_Next_Condensed','DIN_Alternate','Trebuchet_MS',sans-serif] text-5xl font-black uppercase leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                  {profile.displayName}
                </h1>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5"><Trophy className="h-4 w-4 text-[#39ff14]" />{getPositionLabel(affiliation.position || profile.position)}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5"><Users className="h-4 w-4 text-cyan-300" />{affiliation.teamName || profile.currentTeam || '未加入球队'}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1.5"><MapPin className="h-4 w-4 text-blue-300" />{[profile.province, profile.city].filter(Boolean).join(' ') || '未填写地区'}</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric icon={CalendarDays} label="年龄组" value={profile.ageGroup || '-'} tone="#39ff14" />
                  <Metric icon={Ruler} label="身高" value={profile.height ? `${profile.height}cm` : '-'} tone="#60a5fa" />
                  <Metric icon={Weight} label="体重" value={profile.weight ? `${profile.weight}kg` : '-'} tone="#f59e0b" />
                  <Metric icon={Footprints} label="惯用脚" value={getFootLabel(profile.dominantFoot)} tone="#a78bfa" />
                </div>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-16 top-6 h-36 w-36 rounded-full bg-[#39ff14]/10 blur-3xl" />
              <div className="relative">
                <div className="mb-4 text-xs uppercase tracking-[0.24em] text-slate-500">profile signal</div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">资料完整度</span>
                  <span className="font-semibold text-[#39ff14]">{getPercent(profile.profileCompleteness)}%</span>
                </div>
                <div className="mb-5 h-2 rounded-full bg-white/10 shadow-inner shadow-black/30">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#39ff14] to-[#00d4ff] shadow-[0_0_18px_rgba(57,255,20,0.45)]" style={{ width: `${getPercent(profile.profileCompleteness)}%` }} />
                </div>
                <div className="mb-5 grid grid-cols-2 gap-3 text-center">
                  <Link to={`/followers/${profile.id}`} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 hover:border-[#39ff14]/30">
                    <div className="font-['Avenir_Next_Condensed','DIN_Alternate','Trebuchet_MS',sans-serif] text-3xl font-semibold text-white">{stats.followersCount}</div>
                    <div className="text-xs text-slate-500">粉丝</div>
                  </Link>
                  <Link to={`/following/${profile.id}`} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 hover:border-[#39ff14]/30">
                    <div className="font-['Avenir_Next_Condensed','DIN_Alternate','Trebuchet_MS',sans-serif] text-3xl font-semibold text-white">{stats.followingCount}</div>
                    <div className="text-xs text-slate-500">关注</div>
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {actions.canFollow && (
                    <FollowButton userId={profile.id} size="md" showCount={false} onFollowChange={loadHomepage} />
                  )}
                  {actions.canMessage && (
                    <button onClick={() => setIsMessageOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-200 hover:border-[#39ff14]/30">
                      <Mail className="h-4 w-4" />
                      私信
                    </button>
                  )}
                  {actions.canInviteTrial && (
                    <button onClick={() => setIsTrialInviteOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm text-cyan-200 hover:border-cyan-300/40 hover:bg-cyan-400/15">
                      <UserPlus className="h-4 w-4" />
                      发送试训邀请
                    </button>
                  )}
                  {actions.canCreateScoutReport && (
                    <button onClick={handleWriteScoutReport} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#39ff14]/20 bg-[#39ff14]/10 px-4 py-2.5 text-sm text-[#b8ff9e] hover:border-[#39ff14]/40 hover:bg-[#39ff14]/15">
                      <FileText className="h-4 w-4" />
                      写球探报告
                    </button>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4 border-t border-white/10 pt-4">
                  <LikeButton targetType="player_homepage" targetId={profile.id} size="sm" />
                  <FavoriteButton targetType="player_homepage" targetId={profile.id} size="sm" />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
          <Metric icon={FileText} label="完成报告" value={stats.completedReportsCount} tone="#39ff14" />
          <Metric icon={Activity} label="体测记录" value={stats.physicalTestCount} tone="#60a5fa" />
          <Metric icon={CalendarDays} label="周报记录" value={stats.weeklyReportCount} tone="#f59e0b" />
          <Metric icon={Trophy} label="比赛点评" value={stats.matchCount} tone="#a78bfa" />
          <Metric icon={Target} label="球探报告" value={stats.scoutReportsCount || 0} tone="#22d3ee" />
          <Metric icon={BarChart3} label="报告均分" value={formatRating(stats.averageReportRating)} tone="#f43f5e" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Section title="球员档案" icon={ShieldCheck}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3"><span className="text-slate-500">俱乐部</span><span className="text-right text-white">{affiliation.clubName || '未加入俱乐部'}</span></div>
                  <div className="flex justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3"><span className="text-slate-500">球队</span><span className="text-right text-white">{affiliation.teamName || profile.currentTeam || '-'}</span></div>
                  <div className="flex justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3"><span className="text-slate-500">号码</span><span className="text-right text-white">{affiliation.jerseyNumber || profile.jerseyNumber || '-'}</span></div>
                  <div className="flex justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3"><span className="text-slate-500">球龄</span><span className="text-right text-white">{profile.startYear ? `${new Date().getFullYear() - profile.startYear}年` : '-'}</span></div>
                  <div className="flex justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.035] px-4 py-3"><span className="text-slate-500">足协注册</span><span className="text-right text-white">{profile.faRegistered ? '已注册' : '未注册'}</span></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm text-slate-500">技术特点</div>
                    <TagList items={profile.technicalTags} />
                  </div>
                  <div>
                    <div className="mb-2 text-sm text-slate-500">心智性格</div>
                    <TagList items={profile.mentalTags} />
                  </div>
                </div>
              </div>
            </Section>

            <Section title="数据证明" icon={LineChart}>
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-[#39ff14]/45 bg-[#39ff14]/12 text-[#b8ff9e] shadow-[0_0_24px_rgba(57,255,20,0.08)]'
                          : 'border-white/10 bg-white/[0.035] text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      <span className="rounded bg-black/25 px-1.5 py-0.5 text-xs">{proofCounts[tab.id]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {activeTab === 'physical' && (
                  physicalRecords.length > 0
                    ? physicalRecords.map((record) => <PhysicalCard key={record.id} record={record} />)
                    : <EmptyState title="暂无体测数据" detail="俱乐部官方体测和个人自测都会显示在这里" />
                )}
                {activeTab === 'matches' && (
                  matchList.length > 0
                    ? matchList.map((match) => <MatchCard key={`${match.id}-${match.matchDate}`} match={match} />)
                    : <EmptyState title="暂无比赛点评" detail="完成比赛自评和教练点评后会展示" />
                )}
                {activeTab === 'weekly' && (
                  weeklyList.length > 0
                    ? weeklyList.map((report) => <WeeklyCard key={report.id} report={report} />)
                    : <EmptyState title="暂无周报记录" detail="加入球队后可沉淀训练周报" />
                )}
                {activeTab === 'reports' && (
                  reportList.length > 0
                    ? reportList.map((report) => <ReportCard key={report.id} report={report} />)
                    : <EmptyState title="暂无公开视频分析报告" detail="完成订单并生成报告后会展示摘要" />
                )}
                {activeTab === 'scoutReports' && (
                  scoutReportList.length > 0
                    ? scoutReportList.map((report) => <ScoutReportCard key={report.id} report={report} />)
                    : <EmptyState title="暂无球探观察报告" detail="球探发布后会沉淀到这里" />
                )}
                {activeTab === 'posts' && (
                  postList.length > 0
                    ? postList.map((post) => <PostCard key={post.id} post={post} />)
                    : <EmptyState title="暂无动态" detail="训练日常和比赛心得会显示在这里" />
                )}
              </div>
            </Section>

            <Section title="成长轨迹" icon={Clock3}>
              <Timeline items={data.timeline || []} />
            </Section>

            <Section title="主页评论" icon={MessageCircle}>
              <CommentSection targetType="player_homepage" targetId={profile.id} maxLength={500} placeholder="写下你对这位球员的看法" />
            </Section>
          </div>

          <aside className="space-y-6">
            <Section
              title="最新体测"
              icon={Activity}
              action={latestPhysical && <span className="text-xs text-slate-500">{latestPhysical.testDate}</span>}
            >
              {latestPhysical ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#39ff14]/20 bg-[#39ff14]/10 p-3 text-sm text-[#b8ff9e]">
                    {latestPhysical.sourceLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric icon={Activity} label="30米跑" value={hasValue(latestPhysical.sprint30m) ? `${latestPhysical.sprint30m}秒` : '-'} tone="#39ff14" />
                    <Metric icon={Target} label="立定跳远" value={hasValue(latestPhysical.standingLongJump) ? `${latestPhysical.standingLongJump}cm` : '-'} tone="#60a5fa" />
                    <Metric icon={Ruler} label="身高" value={hasValue(latestPhysical.height) ? `${latestPhysical.height}cm` : '-'} tone="#f59e0b" />
                    <Metric icon={Weight} label="体重" value={hasValue(latestPhysical.weight) ? `${latestPhysical.weight}kg` : '-'} tone="#a78bfa" />
                  </div>
                </div>
              ) : (
                <EmptyState title="暂无体测" />
              )}
            </Section>

            <Section title="主页动态" icon={Heart} action={
              actions.canEdit ? (
                <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-1 text-sm text-[#39ff14]">
                  发布
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : undefined
            }>
              {postList.length > 0 ? (
                <div className="space-y-3">
                  {postList.slice(0, 3).map((post) => (
                    <div key={post.id} className="rounded-[22px] border border-white/10 bg-[#070d15]/90 p-3">
                      <p className="line-clamp-3 text-sm leading-6 text-slate-300">{post.content}</p>
                      <div className="mt-2 text-xs text-slate-500">{post.createdAt}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="暂无动态" />
              )}
            </Section>
          </aside>
        </div>
      </div>

      {isMessageOpen && (
        <MessageModal
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          userId={profile.id}
          userName={profile.displayName}
          userAvatar={profile.avatar}
        />
      )}

      {isTrialInviteOpen && (
        <TrialInviteModal
          playerId={profile.id}
          playerName={profile.displayName}
          onClose={() => setIsTrialInviteOpen(false)}
          onSuccess={loadHomepage}
        />
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          loadHomepage();
        }}
        defaultRoleTag="player"
      />
    </div>
  );
};

export default PersonalHomepage;
