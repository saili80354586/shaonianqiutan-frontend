import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analystApi } from '../services/api';
import { Loading } from '../components/ui/loading';
import { LazyImage } from '../components';
import SocialFeed, { CreatePostModal } from './ScoutMap/SocialFeed';
import { FollowButton, MessageModal, FavoriteButton, LikeButton } from '../components/social';
import { useAuthStore } from '../store';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Star,
  FileText,
  Award,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  BarChart3,
  MessageCircle,
  Share2,
  Copy,
  CheckCircle as CheckCircleIcon,
  ChevronRight,
  Sparkles,
  X,
  Send,
  Edit3,
  Mail,
} from 'lucide-react';

interface AnalystProfile {
  id: number;
  name: string;
  bio: string;
  specialty: string;
  experience: number;
  rating: number;
  review_count: number;
  status: string;
  user?: {
    id: number;
    nickname: string;
    avatar?: string;
  };
}

interface PublicStats {
  total_reports: number;
  completed_reports: number;
  average_rating: number;
  review_count: number;
}

interface PublicReport {
  id: number;
  player_name: string;
  player_position: string;
  title: string;
  summary: string;
  overall_rating: number;
  potential_rating: string;
  created_at: string;
}

interface AnalystPublicProfile {
  analyst: AnalystProfile;
  stats: PublicStats;
  sample_reports: PublicReport[];
}

const AnalystHomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<AnalystPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', contact: '', content: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.id && id && String(currentUser.id) === String(id);

  useEffect(() => {
    if (id) {
      loadProfile(parseInt(id));
    }
  }, [id]);

  const loadProfile = async (userIdOrAnalystId: number) => {
    try {
      setLoading(true);
      setError(null);
      // 优先通过 user_id 查询（因为 RoleSwitcher 传入的是 user.id）
      let res = await analystApi.getPublicProfileByUser(userIdOrAnalystId);
      // 如果失败，尝试通过 analyst_id 查询
      if (!res.data?.success) {
        res = await analystApi.getPublicProfile(userIdOrAnalystId);
      }
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
      } else {
        setError('获取分析师信息失败');
      }
    } catch (err: any) {
      console.error('获取分析师主页失败:', err);
      setError(err.message || '获取分析师信息失败');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!inquiryForm.name.trim() || !inquiryForm.contact.trim() || !inquiryForm.content.trim()) {
      toast.error('请填写完整的咨询信息');
      return;
    }
    setInquirySubmitting(true);
    try {
      const res = await analystApi.createInquiry(parseInt(id), {
        name: inquiryForm.name.trim(),
        contact: inquiryForm.contact.trim(),
        content: inquiryForm.content.trim(),
      });
      if (res.data?.success || res.success) {
        toast.success('咨询意向已提交，分析师将尽快与您联系');
        setInquiryOpen(false);
        setInquiryForm({ name: '', contact: '', content: '' });
      } else {
        toast.error(res.data?.message || '提交失败，请重试');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || '提交失败，请重试');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-1 text-sm text-yellow-400 font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const positionMap: Record<string, string> = {
    'ST': '前锋', 'LW': '左边锋', 'RW': '右边锋',
    'CAM': '攻击型中场', 'CM': '中场', 'CDM': '防守型中场',
    'LM': '左边前卫', 'RM': '右边前卫', 'LB': '左边后卫',
    'RB': '右边后卫', 'CB': '中后卫', 'GK': '门将'
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-4xl">🔍</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">分析师不存在</h2>
          <p className="text-slate-400 mb-6">{error || '无法找到该分析师'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { analyst, stats, sample_reports } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12]">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-[900px] mx-auto">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
            <Link
              to="/"
              className="group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 hover:border-white/30 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
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
                className="h-40 sm:h-48 mx-auto drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-breathe"
              />
            </div>
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
              <span className="text-lg sm:text-xl font-bold tracking-[0.15em] text-emerald-400"
                style={{ textShadow: '0 0 10px rgba(16,185,129,0.8), 0 0 20px rgba(16,185,129,0.5)' }}>
                专业分析师
              </span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent via-emerald-500 to-transparent" />
            </div>
          </div>

          {/* 分析师资料卡 */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(16,30,40,0.95)] to-[rgba(14,24,35,0.98)] border border-emerald-500/20">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* 头像 */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-full overflow-hidden border-3 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform duration-500">
                {analyst.user?.avatar ? (
                  <LazyImage src={analyst.user.avatar} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    👤
                  </div>
                )}
              </div>

              {/* 基本信息 */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  {analyst.name}
                </h1>
                <p className="text-emerald-400/60 text-sm mb-4 flex items-center justify-center md:justify-start gap-1.5">
                  <span className="w-4 h-px bg-emerald-400/30" />
                  @{analyst.user?.nickname || analyst.name}
                  <span className="w-4 h-px bg-emerald-400/30" />
                </p>

                {/* 标签 */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  {analyst.specialty && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      {analyst.specialty}
                    </span>
                  )}
                  {analyst.experience > 0 && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
                      从业 {analyst.experience} 年
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-medium">
                    专业认证
                  </span>
                </div>

                {/* 简介 */}
                {analyst.bio && (
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {analyst.bio}
                  </p>
                )}

                {/* 评分 */}
                {stats.average_rating > 0 && getRatingStars(stats.average_rating)}

                {/* 社交操作 */}
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={() => setInquiryOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    向 TA 咨询
                  </button>
                  {!isOwnProfile && analyst.user?.id && (
                    <>
                      <FollowButton
                        userId={analyst.user.id}
                        size="md"
                        showCount={false}
                      />
                      <LikeButton
                        targetType="analyst_homepage"
                        targetId={analyst.user.id}
                        size="md"
                        showCount={false}
                      />
                      <FavoriteButton
                        targetType="analyst_homepage"
                        targetId={analyst.user.id}
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: '总报告数',
                value: stats.total_reports,
                icon: FileText,
                color: 'emerald',
                gradient: 'from-emerald-500/20 to-teal-500/20',
                border: 'border-emerald-500/30',
                textColor: 'text-emerald-400',
              },
              {
                label: '已完成',
                value: stats.completed_reports,
                icon: CheckCircle,
                color: 'blue',
                gradient: 'from-blue-500/20 to-cyan-500/20',
                border: 'border-blue-500/30',
                textColor: 'text-blue-400',
              },
              {
                label: '平均评分',
                value: stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '-',
                icon: Star,
                color: 'yellow',
                gradient: 'from-yellow-500/20 to-orange-500/20',
                border: 'border-yellow-500/30',
                textColor: 'text-yellow-400',
              },
              {
                label: '用户评价',
                value: stats.review_count,
                icon: MessageCircle,
                color: 'violet',
                gradient: 'from-violet-500/20 to-purple-500/20',
                border: 'border-violet-500/30',
                textColor: 'text-violet-400',
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
            <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(16,30,40,0.95)] to-[rgba(14,24,35,0.98)] border border-white/10">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-400" />
                </span>
                代表报告
                <span className="text-sm font-normal text-slate-400 ml-2">({sample_reports.length}份)</span>
              </h3>

              <div className="space-y-4">
                {sample_reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl bg-[rgba(10,14,23,0.6)] border border-[rgba(57,255,20,0.1)] hover:border-emerald-500/30 hover:bg-[rgba(10,14,23,0.8)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                          {report.player_name?.slice(0, 1) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{report.player_name || '未知球员'}</p>
                          <p className="text-xs text-slate-400">
                            {positionMap[report.player_position] || report.player_position} · {report.created_at}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.overall_rating > 0 && (
                          <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs font-medium text-yellow-400">
                            {report.overall_rating}分
                          </span>
                        )}
                        {report.potential_rating && (
                          <span className="px-2 py-1 bg-violet-500/10 border border-violet-500/30 rounded text-xs font-medium text-violet-400">
                            {report.potential_rating}级潜力
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400/70" />
                      {report.title}
                    </h4>

                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {report.summary || '暂无评语'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 动态区域 */}
          <div className="rounded-2xl p-6 mb-8 backdrop-blur-xl shadow-2xl bg-gradient-to-br from-[rgba(16,30,40,0.95)] to-[rgba(14,24,35,0.98)] border border-white/10">
            {isOwnProfile && (
              <div className="mb-4">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(57,255,20,0.08)] hover:bg-[rgba(57,255,20,0.15)] border border-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)] rounded-xl transition-all text-[#39ff14] text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>分享你的分析见解、行业观察...</span>
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
          <div className="rounded-2xl p-6 text-center backdrop-blur-xl bg-gradient-to-br from-[rgba(16,30,40,0.95)] to-[rgba(14,24,35,0.98)] border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg flex items-center justify-center">
                <span className="text-2xl">⚽</span>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">少年球探</h3>
                <p className="text-xs text-slate-400">Youth Scout</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-3">发现下一个足球之星</p>
            <div className="pt-3 border-t border-[rgba(57,255,20,0.1)]">
              <p className="text-xs text-slate-500">www.shaonianqiutan.com</p>
            </div>
          </div>

          {/* 页脚 */}
          <div className="text-center pt-8 mt-8 border-t border-[rgba(16,185,129,0.1)]">
            <p className="text-slate-500 text-sm">少年球探 Youth Scout - 发现下一个足球之星</p>
          </div>
        </div>
      </div>

      {/* 咨询弹窗 */}
      {inquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                向 {analyst.name} 咨询
              </h3>
              <button
                onClick={() => setInquiryOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInquirySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">您的姓名</label>
                <input
                  type="text"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="请输入姓名"
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">联系方式（手机/微信）</label>
                <input
                  type="text"
                  value={inquiryForm.contact}
                  onChange={(e) => setInquiryForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="方便分析师与您联系"
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">咨询内容</label>
                <textarea
                  value={inquiryForm.content}
                  onChange={(e) => setInquiryForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="请描述您的需求，例如球员评估、训练建议等"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inquirySubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  提交咨询
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
        defaultRoleTag="analyst"
      />

      {isMessageOpen && analyst.user && (
        <MessageModal
          isOpen={isMessageOpen}
          onClose={() => setIsMessageOpen(false)}
          userId={analyst.user.id}
          userName={analyst.user.nickname || analyst.name}
          userAvatar={analyst.user.avatar}
        />
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(16,185,129,0.5)) drop-shadow(0 0 60px rgba(0,212,255,0.3));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 50px rgba(16,185,129,0.8)) drop-shadow(0 0 80px rgba(0,212,255,0.5));
          }
        }

        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnalystHomePage;
