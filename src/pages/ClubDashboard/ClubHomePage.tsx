import React, { useState, useEffect } from 'react';
import { clubHomeApi } from '../../services/api';
import { LazyImage } from '../../components';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Users, Award, Shield,
  GraduationCap, ChevronRight, Star, Calendar, Trophy, Dumbbell,
  Newspaper, MessageCircle, CheckCircle2, PartyPopper, Clock, Pin,
  Activity, Sparkles, Target, RadioTower
} from 'lucide-react';

interface ClubHomePageProps {
  clubId: number;
  onBack?: () => void;
  previewData?: ClubHomeData;
}

type LooseRecord = Record<string, any>;

interface AchievementItem extends LooseRecord {
  id?: number | string;
  title?: string;
  count?: string | number;
  description?: string;
}

interface AboutSection extends LooseRecord {
  enabled?: boolean;
  title?: string;
  content?: string;
  image?: string;
  images?: string[];
  features?: Array<{ title?: string; description?: string }>;
}

interface TeamItem extends LooseRecord {
  id?: number | string;
  name?: string;
  ageGroup?: string;
  description?: string;
  isShown?: boolean;
  showPlayerCount?: boolean;
  playerCount?: number;
}

interface CoachItem extends LooseRecord {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  nickname?: string;
  role?: string;
  position?: string;
  avatar?: string;
  license_level?: string;
  isShown?: boolean;
}

interface PlayerItem extends LooseRecord {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  nickname?: string;
  age_group?: string;
  position?: string;
  avatar?: string;
  number?: string | number;
  recommendText?: string;
  isShown?: boolean;
}

interface FacilitySchedule extends LooseRecord {
  day?: string;
  time?: string;
  timeRange?: string;
  type?: string;
  group?: string;
}

interface FacilitySection extends LooseRecord {
  enabled?: boolean;
  title?: string;
  name?: string;
  address?: string;
  description?: string;
  images?: string[];
  schedule?: FacilitySchedule[];
}

interface NewsItem extends LooseRecord {
  id?: number | string;
  title?: string;
  summary?: string;
  content?: string;
  image?: string;
  isPinned?: boolean;
  publishDate?: string;
  link?: string;
  type?: string;
  name?: string;
  date?: string;
  createdAt?: string;
}

interface ActivityItem extends LooseRecord {
  id?: number | string;
  title?: string;
  type?: string;
  status?: string;
  isReview?: boolean;
  image?: string;
  coverImage?: string;
  date?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  regCount?: number;
  reviewContent?: string;
  reviewImages?: string[] | string;
}

interface ClubHomeData extends LooseRecord {
  modules?: { order?: string[]; visibility?: Record<string, boolean> };
  club?: { name?: string; description?: string; logo?: string };
  hero?: { title?: string; subtitle?: string; backgroundImage?: string; showStats?: boolean };
  about?: AboutSection;
  achievements?: AchievementItem[];
  teams?: TeamItem[];
  coaches?: CoachItem[];
  players?: PlayerItem[];
  facilities?: FacilitySection;
  news?: { manual?: NewsItem[]; auto?: NewsItem[]; matches?: NewsItem[]; tests?: NewsItem[]; manualItems?: NewsItem[] };
  activities?: ActivityItem[];
  recruitment?: LooseRecord;
  contact?: LooseRecord;
  socialLinks?: LooseRecord;
}

const SURFACE_CARD = 'bg-[#101827]/88 border border-white/12 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl';
const HOVER_CARD = 'transition-all duration-300 hover:-translate-y-1 hover:border-[#39FF14]/45 hover:shadow-[0_28px_90px_rgba(57,255,20,0.14)]';
const NEON_TEXT = 'bg-gradient-to-r from-white via-[#D9FFE0] to-[#00D4FF] bg-clip-text text-transparent';

const GlowOrb = ({ className }: { className: string }) => (
  <div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />
);

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  if (typeof value !== 'string' || value.length === 0) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch {
    // 兼容后端偶发返回单个图片 URL 字符串的情况
  }

  return [value];
};

const FieldLines = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
    <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#39FF14]/20" />
    <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00D4FF]/20" />
    <div className="absolute left-0 top-1/2 h-64 w-28 -translate-y-1/2 rounded-r-full border border-l-0 border-[#39FF14]/15" />
    <div className="absolute right-0 top-1/2 h-64 w-28 -translate-y-1/2 rounded-l-full border border-r-0 border-[#39FF14]/15" />
    <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#39FF14]/25 to-transparent" />
    <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />
  </div>
);

const SectionTitle = ({ icon: Icon, kicker, title, description, tone = 'emerald' }: {
  icon: React.ElementType;
  kicker?: string;
  title: string;
  description?: string;
  tone?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'pink' | 'blue';
}) => {
  const toneClass = {
    emerald: 'from-[#39FF14]/25 to-emerald-500/10 text-[#39FF14] border-[#39FF14]/20',
    cyan: 'from-[#00D4FF]/25 to-cyan-500/10 text-[#00D4FF] border-[#00D4FF]/20',
    purple: 'from-violet-500/25 to-purple-500/10 text-violet-300 border-violet-400/20',
    amber: 'from-amber-500/25 to-orange-500/10 text-amber-300 border-amber-400/20',
    pink: 'from-pink-500/25 to-rose-500/10 text-pink-300 border-pink-400/20',
    blue: 'from-blue-500/25 to-cyan-500/10 text-blue-300 border-blue-400/20',
  }[tone];

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#39FF14]/80">{kicker}</p>}
        <h2 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-white">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${toneClass}`}>
            <Icon className="h-5 w-5" />
          </span>
          {title}
        </h2>
      </div>
      {description && <p className="max-w-xl text-sm leading-6 text-slate-400 md:text-right">{description}</p>}
    </div>
  );
};

const ClubHomePage: React.FC<ClubHomePageProps> = ({ clubId, onBack, previewData }) => {
  const [loading, setLoading] = useState(!previewData);
  const [data, setData] = useState<ClubHomeData | null>(previewData || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      setLoading(false);
      return;
    }
    loadClubHome();
  }, [clubId, previewData]);

  const loadClubHome = async () => {
    if (!clubId) {
      setError('俱乐部ID无效');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await clubHomeApi.getClubHome(clubId);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError('俱乐部主页数据为空');
      }
    } catch (error) {
      console.error('加载俱乐部主页失败:', error);
      setError('加载俱乐部主页失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <p className="text-gray-400">{error || '暂无数据'}</p>
      </div>
    );
  }

  const modules = data.modules || {};
  const visibility = modules.visibility || {};
  const order = modules.order || [];

  const renderHero = () => {
    const hero = data.hero || {};
    const club = data.club || {};
    const achievements = data.achievements || [];
    const heroStats = achievements.slice(0, 4);

    return (
      <section className="relative min-h-[760px] overflow-hidden bg-[#050816]">
        {hero.backgroundImage && (
          <LazyImage src={hero.backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 saturate-150 contrast-125" containerClassName="absolute inset-0 w-full h-full" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(5,8,22,0.92),rgba(9,18,34,0.72)_42%,rgba(5,8,22,0.98)),radial-gradient(circle_at_18%_18%,rgba(57,255,20,0.34),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(0,212,255,0.30),transparent_30%),radial-gradient(circle_at_70%_78%,rgba(139,92,246,0.26),transparent_32%),radial-gradient(circle_at_30%_88%,rgba(255,176,32,0.18),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(57,255,20,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.045)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
        <GlowOrb className="left-[-120px] top-24 h-80 w-80 bg-[#39FF14]/22" />
        <GlowOrb className="right-[-90px] top-10 h-96 w-96 bg-[#00D4FF]/22" />
        <GlowOrb className="bottom-[-140px] left-1/2 h-96 w-96 -translate-x-1/2 bg-[#8B5CF6]/20" />
        <FieldLines />
        <div className="absolute right-[-120px] top-20 h-[520px] w-[520px] rounded-full border border-[#00D4FF]/25 opacity-80 shadow-[0_0_90px_rgba(0,212,255,0.14)]">
          <div className="absolute inset-10 rounded-full border border-[#39FF14]/20" />
          <div className="absolute inset-24 rounded-full border border-[#8B5CF6]/20" />
          <div className="absolute left-1/2 top-0 h-full w-px origin-bottom rotate-45 bg-gradient-to-b from-[#00D4FF]/70 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl flex-col px-6 py-8 md:px-10">
          {onBack && (
            <button onClick={onBack} className="mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/75 backdrop-blur transition-colors hover:border-[#39FF14]/40 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> 返回后台
            </button>
          )}

          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#39FF14]/35 bg-[#39FF14]/15 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-[#39FF14] shadow-[0_0_28px_rgba(57,255,20,0.18)]">
                  <RadioTower className="h-4 w-4" /> Future Scout Lab
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/15 px-4 py-2 text-xs font-bold text-cyan-100 shadow-[0_0_26px_rgba(0,212,255,0.14)]">
                  <Sparkles className="h-4 w-4" /> 青训数据主页
                </span>
              </div>

              <h1 className={`max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] md:text-7xl lg:text-8xl ${NEON_TEXT}`}>
                {hero.title || club.name}
              </h1>
              <div className="mt-5 h-1.5 w-48 rounded-full bg-gradient-to-r from-[#39FF14] via-[#00D4FF] to-[#8B5CF6] shadow-[0_0_30px_rgba(57,255,20,0.42)]" />
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
                {hero.subtitle || club.description || '用训练、比赛和成长数据，呈现一支青训俱乐部的专业体系。'}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#teams" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#39FF14] to-[#A3FF12] px-6 py-3 text-sm font-black text-[#06120A] shadow-[0_0_42px_rgba(57,255,20,0.34)] transition-transform hover:-translate-y-0.5">
                  查看球队矩阵 <ChevronRight className="h-4 w-4" />
                </a>
                <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/35 bg-[#00D4FF]/10 px-6 py-3 text-sm font-bold text-cyan-100 backdrop-blur transition-colors hover:border-[#00D4FF]/70 hover:bg-[#00D4FF]/18">
                  预约试训 <Target className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#39FF14]/16 via-[#00D4FF]/10 to-[#8B5CF6]/16 blur-2xl" />
              <div className="relative grid gap-4 sm:grid-cols-2">
                {(hero.showStats && heroStats.length > 0 ? heroStats : [
                  { id: 'teams', count: data.teams?.length || 0, title: '梯队矩阵' },
                  { id: 'coaches', count: data.coaches?.length || 0, title: '教练团队' },
                  { id: 'players', count: data.players?.length || 0, title: '展示球员' },
                  { id: 'reports', count: 'AI', title: '球探数据' },
                ]).map((item: AchievementItem, index: number) => (
                  <div key={item.id} className={`${SURFACE_CARD} group relative overflow-hidden rounded-[2rem] p-5 ${index === 0 ? 'sm:col-span-2 bg-gradient-to-br from-[#39FF14]/18 via-[#101827]/88 to-[#00D4FF]/12' : ''}`}>
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#39FF14]/80 to-transparent" />
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#00D4FF]/18 blur-2xl transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10 mb-4 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Metric 0{index + 1}</span>
                      <Activity className="h-4 w-4 text-[#00D4FF]" />
                    </div>
                    <div className="relative z-10 text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">{item.count || '0'}</div>
                    <div className="relative z-10 mt-2 text-sm font-semibold text-slate-300">{item.title}</div>
                    <div className="relative z-10 mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#39FF14] via-[#00D4FF] to-[#8B5CF6] shadow-[0_0_18px_rgba(57,255,20,0.5)]" style={{ width: `${Math.min(92, 44 + index * 14)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderAbout = () => {
    const about = data.about || {};
    if (!about.enabled) return null;
    return (
      <section className="scroll-mt-20" id="about">
        <SectionTitle
          icon={Award}
          kicker="Academy System"
          title={about.title || '关于我们'}
          description="把训练体系、比赛经验与球员成长记录连接起来，形成可持续追踪的青训能力档案。"
        />
        <div className={`${SURFACE_CARD} relative overflow-hidden rounded-[2rem] p-6 md:p-8`}>
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[#39FF14]/10 blur-3xl" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative z-10">
              <p className="text-lg leading-9 text-slate-300">{about.content || data.club?.description}</p>
              {about.features && about.features.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {about.features.map((f: { title?: string; description?: string }, i: number) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-[#070B12]/60 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[#39FF14]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">{f.title}</span>
                      </div>
                      <div className="text-sm leading-6 text-slate-400">{f.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {about.images && about.images.length > 0 ? (
              <div className="relative z-10 grid grid-cols-2 gap-3">
                {about.images.slice(0, 4).map((img: string, i: number) => (
                  <LazyImage key={i} src={img} alt="" className={`h-full w-full object-cover ${i === 0 ? 'rounded-[1.5rem] sm:row-span-2' : 'rounded-2xl'}`} containerClassName={`${i === 0 ? 'row-span-2 h-72' : 'h-32'} overflow-hidden`} />
                ))}
              </div>
            ) : (
              <div className="relative z-10 rounded-[1.75rem] border border-[#00D4FF]/15 bg-[#00D4FF]/5 p-6">
                <FieldLines />
                <div className="relative z-10">
                  <Shield className="mb-6 h-12 w-12 text-[#00D4FF]" />
                  <div className="text-2xl font-black text-white">青训能力系统</div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">球队、教练、球员、比赛和体测数据统一沉淀，构建俱乐部自己的成长数据库。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderAchievements = () => {
    const achievements = data.achievements || [];
    if (achievements.length === 0) return null;
    return (
      <section className="scroll-mt-20" id="achievements">
        <SectionTitle
          icon={Trophy}
          kicker="Honor Wall"
          title="荣誉成就"
          description="用奖杯、排名与阶段成果，呈现俱乐部长期训练体系沉淀出的竞争力。"
          tone="amber"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {achievements.map((item: AchievementItem, index: number) => (
            <div key={item.id} className={`${SURFACE_CARD} ${HOVER_CARD} group relative overflow-hidden rounded-[2rem] p-6 text-center`}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-400/12 blur-2xl" />
              <div className="relative z-10 mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="relative z-10 text-4xl font-black tracking-[-0.04em] text-white">{item.count || ''}</div>
              <div className="relative z-10 mt-2 font-bold text-white">{item.title}</div>
              <div className="relative z-10 mt-2 text-sm leading-6 text-slate-400">{item.description}</div>
              <div className="relative z-10 mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-[#39FF14] to-[#00D4FF]" style={{ width: `${Math.min(96, 52 + index * 12)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderTeams = () => {
    const teams = data.teams || [];
    const shownTeams = teams.filter((t: TeamItem) => t.isShown !== false);
    if (shownTeams.length === 0) return null;
    return (
      <section className="scroll-mt-20" id="teams">
        <SectionTitle
          icon={Users}
          kicker="Team Matrix"
          title="球队矩阵"
          description="按年龄段组织梯队，让不同阶段的球员都能在合适的训练强度和比赛环境中成长。"
          tone="cyan"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {shownTeams.map((team: TeamItem, index: number) => (
            <div key={team.id} className={`${SURFACE_CARD} ${HOVER_CARD} group relative overflow-hidden rounded-[2rem] p-6 ${index === 0 ? 'md:col-span-2' : ''}`}>
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#00D4FF]/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/10">
                  <Shield className="h-7 w-7 text-[#00D4FF]" />
                </div>
                <span className="rounded-full border border-[#39FF14]/20 bg-[#39FF14]/10 px-3 py-1 text-sm font-bold text-[#39FF14]">{team.ageGroup}</span>
              </div>
              <div className="relative z-10 mt-7">
                <h3 className="text-2xl font-black text-white">{team.name}</h3>
                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-400">{team.description || '以系统训练、比赛反馈和成长追踪为核心的青训梯队。'}</p>
              </div>
              <div className="relative z-10 mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                {team.showPlayerCount !== false ? (
                  <div>
                    <div className="text-3xl font-black text-white">{team.playerCount || 0}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Players</div>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">{team.description || ''}</span>
                )}
                <ChevronRight className="h-6 w-6 text-slate-600 transition-colors group-hover:text-[#39FF14]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCoaches = () => {
    const coaches = data.coaches || [];
    const shownCoaches = coaches.filter((c: CoachItem) => c.isShown !== false);
    if (shownCoaches.length === 0) return null;
    const roleMap: Record<string, string> = {
      head_coach: '主教练', assistant: '助理教练', goalkeeper_coach: '守门员教练',
      fitness_coach: '体能教练', team_manager: '球队经理'
    };
    return (
      <section className="scroll-mt-20" id="coaches">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-purple-400" />
          教练团队
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shownCoaches.map((coach: CoachItem) => (
            <div key={coach.id || coach.user_id} className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-600/20 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                  {coach.avatar ? (
                    <LazyImage src={coach.avatar} alt={coach.name || ''} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                  ) : (
                    coach.name?.[0] || '教'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{coach.name || coach.nickname}</h3>
                  <p className="text-purple-400 text-sm">{coach.role ? roleMap[coach.role] || coach.role : ''}</p>
                  {coach.license_level && <p className="text-gray-500 text-xs mt-0.5">{coach.license_level}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderPlayers = () => {
    const players = data.players || [];
    const shownPlayers = players.filter((p: PlayerItem) => p.isShown !== false);
    if (shownPlayers.length === 0) return null;
    return (
      <section className="scroll-mt-20" id="players">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-400" />
          球员风采
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {shownPlayers.map((player: PlayerItem) => (
            <div key={player.id || player.user_id} className="bg-[#1a1f2e] rounded-2xl p-4 border border-gray-800 text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 overflow-hidden">
                {player.avatar ? (
                  <LazyImage src={player.avatar} alt={player.name || ''} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                ) : (
                  player.name?.[0] || '球'
                )}
              </div>
              <h3 className="text-white font-medium">{player.name || player.nickname}</h3>
              <p className="text-sm text-gray-400">{player.age_group} · {player.position}</p>
              {player.recommendText && <p className="text-xs text-emerald-400 mt-2">{player.recommendText}</p>}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderFacilities = () => {
    const facilities = data.facilities || {};
    if (!facilities.enabled) return null;
    return (
      <section className="scroll-mt-20" id="facilities">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-orange-400" />
          {facilities.title || '训练环境'}
        </h2>
        <div className="bg-[#1a1f2e] rounded-3xl p-6 md:p-8 border border-gray-800">
          {facilities.images && facilities.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {facilities.images.map((img: string, i: number) => (
                <LazyImage key={i} src={img} alt="" className="w-full h-48 object-cover rounded-xl" containerClassName="w-full h-48" />
              ))}
            </div>
          )}
          <p className="text-gray-300">{facilities.description}</p>
          {facilities.schedule && facilities.schedule.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {facilities.schedule.map((s: FacilitySchedule, i: number) => (
                <div key={i} className="bg-[#0f1419] rounded-xl p-4 border border-gray-800">
                  <div className="text-white font-medium">{s.day}</div>
                  <div className="text-sm text-gray-400">{s.timeRange}</div>
                  <div className="text-xs text-emerald-400 mt-1">{s.group}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderNews = () => {
    const matches = data.news?.matches || [];
    const tests = data.news?.tests || [];
    const manualItems = data.news?.manualItems || [];
    const autoNews = [...matches, ...tests];
    if (autoNews.length === 0 && manualItems.length === 0) return null;
    return (
      <section className="scroll-mt-20" id="news">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Newspaper className="w-6 h-6 text-cyan-400" />
          最新动态
        </h2>
        <div className="space-y-4">
          {manualItems.map((item: NewsItem) => (
            <div key={item.id} className="bg-gradient-to-r from-emerald-900/30 to-[#1a1f2e] rounded-2xl p-5 border border-emerald-500/20 flex items-start gap-4">
              {item.image ? (
                <LazyImage src={item.image} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" containerClassName="w-16 h-16 flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <Pin className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  {item.isPinned && <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><Pin className="w-3 h-3"/>置顶</span>}
                </div>
                {item.content && <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>}
                {item.publishDate && <p className="text-xs text-gray-500 mt-1">{item.publishDate}</p>}
                {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 hover:underline mt-1 inline-block">查看详情 →</a>}
              </div>
            </div>
          ))}
          {autoNews.map((item: NewsItem) => (
            <div key={item.id} className="bg-[#1a1f2e] rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.type === 'match' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {item.type === 'match' ? <Trophy className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.title || item.name}</h3>
                <p className="text-sm text-gray-400">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderActivities = () => {
    const activities = data.activities || [];
    if (activities.length === 0) return null;

    const ongoing = activities.filter((a: ActivityItem) => a.status !== 'ended');
    const reviews = activities.filter((a: ActivityItem) => a.status === 'ended' && a.isReview);

    if (ongoing.length === 0 && reviews.length === 0) return null;

    return (
      <section className="scroll-mt-20" id="activities">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <PartyPopper className="w-6 h-6 text-pink-400" />
          活动专区
        </h2>

        {ongoing.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              活动报名
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoing.map((act: ActivityItem) => (
                <div key={act.id} className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-800 hover:border-pink-500/30 transition-all group">
                  {act.coverImage && (
                    <div className="h-40 overflow-hidden">
                      <LazyImage src={act.coverImage} alt={act.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" containerClassName="w-full h-full" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${act.type === 'external' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {act.type === 'external' ? '公开活动' : '内部活动'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${act.status === 'upcoming' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {act.status === 'upcoming' ? '即将开始' : '进行中'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{act.title}</h4>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{act.description}</p>
                    <div className="space-y-1 text-sm text-gray-500">
                      {act.startTime && <div><Calendar className="w-4 h-4 inline mr-1" />{act.startTime}{act.endTime ? ` ~ ${act.endTime}` : ''}</div>}
                      {act.location && <div><MapPin className="w-4 h-4 inline mr-1" />{act.location}</div>}
                    </div>
                    {(act.maxParticipants || 0) > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        已报名 {act.regCount || 0} / {act.maxParticipants} 人
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              活动回顾
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((act: ActivityItem) => (
                <div key={act.id} className="bg-[#1a1f2e] rounded-2xl overflow-hidden border border-gray-800">
                  {act.coverImage && (
                    <div className="h-40 overflow-hidden">
                      <LazyImage src={act.coverImage} alt={act.title || ''} className="w-full h-full object-cover" containerClassName="w-full h-full" />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-white mb-2">{act.title}</h4>
                    {act.reviewContent && <p className="text-sm text-gray-400 line-clamp-3 mb-3">{act.reviewContent}</p>}
                    {toStringArray(act.reviewImages).length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {toStringArray(act.reviewImages).map((img: string, i: number) => (
                          <LazyImage key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" containerClassName="w-20 h-20 flex-shrink-0" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  const renderRecruitment = () => {
    const recruitment = data.recruitment || {};
    if (!recruitment.enabled) return null;
    return (
      <section className="scroll-mt-20" id="recruitment">
        <div className="bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 rounded-3xl p-6 md:p-8 border border-emerald-500/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
            {recruitment.title || '招生信息'}
          </h2>
          <p className="text-gray-300 mb-4">{recruitment.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recruitment.trialDate && (
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>试训时间：{recruitment.trialDate}</span>
              </div>
            )}
            {recruitment.contactPhone && (
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-emerald-400" />
                <span>电话：{recruitment.contactPhone}</span>
              </div>
            )}
            {recruitment.contactWechat && (
              <div className="flex items-center gap-3 text-gray-300">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>微信：{recruitment.contactWechat}</span>
              </div>
            )}
          </div>
          {recruitment.qrCode && (
            <div className="mt-4">
              <img src={recruitment.qrCode} alt="报名二维码" className="w-32 h-32 rounded-xl" />
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderContact = () => {
    const contact = data.contact || {};
    if (!contact.enabled) return null;
    const social = data.socialLinks || {};
    const hasSocial = social.weibo || social.wechat || social.douyin || social.xiaohongshu || social.website;
    return (
      <section className="scroll-mt-20" id="contact">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Phone className="w-6 h-6 text-emerald-400" />
          联系我们
        </h2>
        <div className="bg-[#1a1f2e] rounded-3xl p-6 md:p-8 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contact.address && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">地址</div>
                  <div className="text-white">{contact.address}</div>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">电话</div>
                  <div className="text-white">{contact.phone}</div>
                </div>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">邮箱</div>
                  <div className="text-white">{contact.email}</div>
                </div>
              </div>
            )}
            {contact.wechat && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">微信</div>
                  <div className="text-white">{contact.wechat}</div>
                </div>
              </div>
            )}
          </div>
          {hasSocial && (
            <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4">
              {social.website && <a href={social.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400"><Globe className="w-5 h-5" /> 官网</a>}
              {social.weibo && <a href={social.weibo} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-emerald-400"><CheckCircle2 className="w-5 h-5" /> 微博</a>}
              {social.douyin && <span className="flex items-center gap-2 text-gray-300"><MessageCircle className="w-5 h-5" /> 抖音</span>}
              {social.xiaohongshu && <span className="flex items-center gap-2 text-gray-300"><Star className="w-5 h-5" /> 小红书</span>}
            </div>
          )}
        </div>
      </section>
    );
  };

  const MODULE_RENDERERS: Record<string, () => React.ReactNode> = {
    hero: renderHero,
    about: renderAbout,
    achievements: renderAchievements,
    teams: renderTeams,
    coaches: renderCoaches,
    players: renderPlayers,
    facilities: renderFacilities,
    news: renderNews,
    activities: renderActivities,
    recruitment: renderRecruitment,
    contact: renderContact,
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {order.map((moduleId: string) => {
        if (!visibility[moduleId]) return null;
        const renderFn = MODULE_RENDERERS[moduleId];
        if (!renderFn) return null;
        return <div key={moduleId}>{renderFn()}</div>;
      })}
      <div className="max-w-6xl mx-auto px-8">
        <footer className="text-center text-gray-500 py-8 border-t border-gray-800">
          <p>{data.club?.name || '俱乐部'} · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

export default ClubHomePage;
