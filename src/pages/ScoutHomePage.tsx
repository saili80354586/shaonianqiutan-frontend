import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scoutApi } from '../services/api';
import { Loading } from '../components/ui/loading';
import { LazyImage } from '../components';
import SocialFeed, { CreatePostModal } from './ScoutMap/SocialFeed';
import { FollowButton, MessageModal, FavoriteButton, LikeButton } from '../components/social';
import { useAuthStore } from '../store';
import {
  ArrowLeft,
  Search,
  FileText,
  Users,
  Award,
  MapPin,
  Calendar,
  Star,
  Share2,
  Copy,
  CheckCircle as CheckCircleIcon,
  TrendingUp,
  Eye,
  Heart,
  ChevronRight,
  Edit3,
  Mail,
} from 'lucide-react';

interface ScoutProfile {
  id: number;
  scouting_experience: string;
  specialties: string[];
  preferred_age_groups: string[];
  scouting_regions: string[];
  current_organization: string;
  bio: string;
  verified: boolean;
  total_discovered: number;
  total_reports: number;
  total_adopted: number;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
}

interface ScoutStats {
  total_discovered: number;
  total_reports: number;
  published_reports: number;
  followed_players: number;
}

interface ScoutPublicReport {
  id: number;
  player_name: string;
  overall_rating: number;
  potential_rating: string;
  title: string;
  created_at: string;
}

interface ScoutPublicProfile {
  scout: ScoutProfile;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
  stats: ScoutStats;
  sample_reports: ScoutPublicReport[];
}

const ScoutHomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ScoutPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.id && id && String(currentUser.id) === String(id);

  useEffect(() => {
    if (id) {
      loadProfile(parseInt(id));
    }
  }, [id]);

  const loadProfile = async (userIdOrScoutId: number) => {
    try {
      setLoading(true);
      setError(null);
      // 优先通过 user_id 查询（因为 RoleSwitcher 传入的是 user.id）
      let res = await scoutApi.getPublicProfile(userIdOrScoutId);
      // 如果失败，尝试通过 scout_id 查询
      if (!res.data?.success) {
        res = await scoutApi.getPublicProfileByID(userIdOrScoutId);
      }
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setError('获取球探信息失败');
      }
    } catch (err: any) {
      console.error('获取球探主页失败:', err);
      setError(err.message || '获取球探信息失败');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const getPotentialColor = (potential?: string) => {
    switch (potential) {
      case 'S': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'A': return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      case 'B': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'C': return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-24">
        <div className="max-w-[900px] mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-24">
        <div className="max-w-[900px] mx-auto px-4 text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <Search className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">球探不存在</h2>
          <p className="text-slate-400 mb-6">{error || '无法找到该球探'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { scout, user, stats, sample_reports } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12]">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(34,211,238,0.08)_0%,transparent_70%)] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-[900px] mx-auto">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
            <Link
              to="/"
              className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center">
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
                <span className="text-white text-xs sm:text-sm font-medium">返回</span>
              </div>
            </Link>

            <button
              onClick={copyLink}
              className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center">
                    {shareCopied ? (
                      <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                <span className="text-white text-xs sm:text-sm font-medium">{shareCopied ? '已复制' : '分享'}</span>
              </div>
            </button>
          </div>

          {/* 品牌展示区域 */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img
                src="/logo2.png"
                alt="少年球探"
                className="h-40 sm:h-48 mx-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-breathe"
              />
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              <span className="text-lg sm:text-xl font-bold tracking-[0.15em] text-cyan-400"
                style={{ textShadow: '0 0 10px rgba(6,182,212,0.8), 0 0 20px rgba(6,182,212,0.5)' }}>
                职业球探
              </span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-500 to-transparent" />
            </div>
          </div>

          {/* 球探资料卡 */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(6,30,40,0.95)] to-[rgba(4,24,35,0.98] border border-cyan-500/20">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* 头像 */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-full overflow-hidden border-3 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform duration-500">
                {user?.avatar ? (
                  <LazyImage src={user.avatar} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                    🔍
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {user?.nickname || scout.current_organization || '球探'}
                </h1>
                <p className="text-cyan-400/60 text-sm mb-4 flex items-center justify-center md:justify-start gap-1.5">
                  <span className="w-4 h-px bg-cyan-400/30" />
                  球探
                  <span className="w-4 h-px bg-cyan-400/30" />
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  {scout.verified && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      已认证
                    </span>
                  )}
                  {scout.scouting_experience && (
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                      从业 {scout.scouting_experience}
                    </span>
                  )}
                </div>

                {/* 简介 */}
                {scout.bio && (
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 max-w-xl">
                    {scout.bio}
                  </p>
                )}

                {/* 社交操作 */}
                {!isOwnProfile && user?.id && (
                  <div className="flex items-center gap-3 mb-4">
                    <FollowButton
                      userId={user.id}
                      size="md"
                      showCount={false}
                    />
                    <LikeButton
                      targetType="scout_homepage"
                      targetId={user.id}
                      size="md"
                      showCount={false}
                    />
                    <FavoriteButton
                      targetType="scout_homepage"
                      targetId={user.id}
                      size="md"
                      showText={false}
                    />
                    <button
                      onClick={() => setIsMessageOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a2332] hover:bg-[#2d3748] text-slate-300 text-sm font-medium rounded-xl border border-[#2d3748] hover:border-[#39ff14]/30 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      私信
                    </button>
                  </div>
                )}

                {/* 专长区域 */}
                {scout.specialties && scout.specialties.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {scout.specialties.map((specialty, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: '发掘球员',
                value: stats.total_discovered,
                icon: Search,
                color: 'cyan',
                gradient: 'from-cyan-500/20 to-blue-500/20',
                border: 'border-cyan-500/30',
                textColor: 'text-cyan-400',
              },
              {
                label: '球探报告',
                value: stats.total_reports,
                icon: FileText,
                color: 'blue',
                gradient: 'from-blue-500/20 to-indigo-500/20',
                border: 'border-blue-500/30',
                textColor: 'text-blue-400',
              },
              {
                label: '已发布',
                value: stats.published_reports,
                icon: Award,
                color: 'violet',
                gradient: 'from-violet-500/20 to-purple-500/20',
                border: 'border-violet-500/30',
                textColor: 'text-violet-400',
              },
              {
                label: '关注球员',
                value: stats.followed_players,
                icon: Heart,
                color: 'pink',
                gradient: 'from-pink-500/20 to-rose-500/20',
                border: 'border-pink-500/30',
                textColor: 'text-pink-400',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.border} backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 代表报告 */}
          {sample_reports && sample_reports.length > 0 && (
            <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(6,30,40,0.95)] to-[rgba(4,24,35,0.98] border border-white/10">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-cyan-400" />
                </span>
                代表球探报告
                <span className="text-sm font-normal text-slate-400 ml-2">({sample_reports.length}份)</span>
              </h3>

              <div className="space-y-4">
                {sample_reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl bg-[rgba(10,14,23,0.6)] border border-[rgba(6,182,212,0.1)] hover:border-cyan-500/30 hover:bg-[rgba(10,14,23,0.8)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-sm font-bold text-cyan-400">
                          {report.player_name?.slice(0, 1) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{report.player_name || '未知球员'}</p>
                          <p className="text-xs text-slate-400">{report.created_at}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.overall_rating > 0 && (
                          <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs font-medium text-yellow-400">
                            {report.overall_rating}分
                          </span>
                        )}
                        {report.potential_rating && (
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPotentialColor(report.potential_rating)}`}>
                            {report.potential_rating}级潜力
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400/70" />
                      {report.title || '暂无标题'}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 动态区域 */}
          <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(6,30,40,0.95)] to-[rgba(4,24,35,0.98)] border border-white/10">
            {isOwnProfile && (
              <div className="mb-4">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(57,255,20,0.08)] hover:bg-[rgba(57,255,20,0.15)] border border-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)] rounded-xl transition-all text-[#39ff14] text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>分享你的选材见闻、招募信息...</span>
                </button>
              </div>
            )}
            <SocialFeed
              userId={Number(id) || undefined}
              hideCreate
              title="TA的动态"
              maxPosts={6}
            />
          </div>

          {/* 品牌标识 */}
          <div className="rounded-2xl p-6 text-center backdrop-blur-xl bg-gradient-to-br from-[rgba(6,30,40,0.95)] to-[rgba(4,24,35,0.98)] border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg flex items-center justify-center">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">少年球探</h3>
                <p className="text-xs text-slate-400">Youth Scout</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-3">发现下一个足球之星</p>
            <div className="pt-3 border-t border-[rgba(6,182,212,0.1)]">
              <p className="text-xs text-slate-500">www.shaonianqiutan.com</p>
            </div>
          </div>

          {/* 页脚 */}
          <div className="text-center pt-8 mt-8 border-t border-[rgba(6,182,212,0.1)]">
            <p className="text-slate-500 text-sm">少年球探 Youth Scout - 发现下一个足球之星</p>
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(6,182,212,0.5)) drop-shadow(0 0 60px rgba(34,211,238,0.3));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 50px rgba(6,182,212,0.8)) drop-shadow(0 0 80px rgba(34,211,238,0.5));
          }
        }

        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="scout"
      />

      {isMessageOpen && user && (
        <MessageModal
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          userId={user.id}
          userName={user.nickname || '球探'}
          userAvatar={user.avatar}
        />
      )}
    </div>
  );
};

export default ScoutHomePage;
