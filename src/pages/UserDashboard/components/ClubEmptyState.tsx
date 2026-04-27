import React, { useState, useEffect } from 'react';
import {
  Building2, ArrowRight, MapPin, Users, Star,
  Trophy, Shield, Zap, ChevronRight
} from 'lucide-react';
import { clubActivityApi } from '../../../services/api';

interface ClubEmptyStateProps {
  feature: 'weekly' | 'match' | 'physical';
}

interface RecommendedClub {
  id: number;
  name: string;
  city: string;
  logo?: string;
  tags: string[];
  playerCount: number;
  coachCount: number;
  description: string;
}

const featureConfig = {
  weekly: {
    title: '周报功能',
    icon: <Shield className="w-8 h-8 text-yellow-400" />,
    description: '加入俱乐部后，教练会定期发布周报任务。你可以记录训练出勤、技术反馈、身体状态等，并获得教练的专业点评。',
    benefits: ['训练出勤记录', '技术/战术反馈', '教练专业点评', '成长轨迹追踪'],
  },
  match: {
    title: '比赛功能',
    icon: <Trophy className="w-8 h-8 text-red-400" />,
    description: '加入俱乐部后，可以参与球队比赛管理。查看比赛安排、提交自评、获取教练点评，全面提升比赛表现。',
    benefits: ['比赛安排查看', '球员自评提交', '教练战术点评', '比赛数据分析'],
  },
  physical: {
    title: '体测功能',
    icon: <Zap className="w-8 h-8 text-emerald-400" />,
    description: '加入俱乐部后，可以参与球队组织的体测活动。记录身高体重、速度、力量等数据，跟踪身体发育情况。',
    benefits: ['体测数据记录', '身体素质追踪', '成长曲线分析', '训练建议获取'],
  },
};

// 默认推荐俱乐部（当 API 不可用时）
const defaultClubs: RecommendedClub[] = [
  {
    id: 1,
    name: '绿茵少年足球俱乐部',
    city: '北京',
    tags: ['U12', 'U14', 'U16'],
    playerCount: 128,
    coachCount: 8,
    description: '专注青少年足球培养，拥有专业教练团队和完善的训练体系。',
  },
  {
    id: 2,
    name: '星火足球青训营',
    city: '上海',
    tags: ['U10', 'U12'],
    playerCount: 86,
    coachCount: 6,
    description: '以技术训练见长，注重球员个人能力和团队配合的培养。',
  },
  {
    id: 3,
    name: '飞扬足球学院',
    city: '广州',
    tags: ['U8', 'U10', 'U12', 'U14'],
    playerCount: 200,
    coachCount: 12,
    description: '南方地区知名青训机构，多次获得省级青少年比赛冠军。',
  },
];

export const ClubEmptyState: React.FC<ClubEmptyStateProps> = ({ feature }) => {
  const config = featureConfig[feature];
  const [clubs, setClubs] = useState<RecommendedClub[]>(defaultClubs);
  const [loadingClubs, setLoadingClubs] = useState(false);

  // 从公开 API 获取俱乐部列表
  useEffect(() => {
    const fetchClubs = async () => {
      setLoadingClubs(true);
      try {
        const res = await clubActivityApi.getPublicClubs({ page: 1, page_size: 6 });
        if (res.data?.success && res.data.data?.list?.length > 0) {
          const list = res.data.data.list;
          const mapped = list.slice(0, 3).map((c: any) => ({
            id: c.id,
            name: c.name,
            city: c.address ? c.address.split(/[省市]/)[0] : '未知城市',
            tags: c.established_year ? [`${new Date().getFullYear() - c.established_year}年历史`] : ['青训'],
            playerCount: c.player_count || 0,
            coachCount: c.coach_count || 0,
            description: c.description?.substring(0, 60) + (c.description?.length > 60 ? '...' : '') || '专业青少年足球俱乐部',
          }));
          setClubs(mapped);
        }
      } catch {
        // 使用默认数据
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchClubs();
  }, []);

  return (
    <div className="space-y-8">
      {/* 主引导区 */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#252b3d] rounded-2xl border border-gray-800 p-5 sm:p-8 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#39ff14]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            {/* 图标 */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl flex items-center justify-center flex-shrink-0">
              {config.icon}
            </div>

            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{config.title}需要加入俱乐部</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                {config.description}
              </p>

              {/* 功能亮点 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {config.benefits.map(benefit => (
                  <span
                    key={benefit}
                    className="px-3 py-1 bg-[#39ff14]/10 text-[#39ff14] rounded-full text-xs font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button
              onClick={() => window.open('/clubs', '_blank')}
              className="px-6 py-2.5 bg-[#39ff14] text-[#0a0e17] rounded-xl text-sm font-semibold hover:bg-[#4dff2e] transition-colors inline-flex items-center gap-2"
            >
              浏览俱乐部 <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-gray-500 text-sm">或等待教练邀请加入</span>
          </div>
        </div>
      </div>

      {/* 推荐俱乐部 */}
      <div>
        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#39ff14]" />
          推荐俱乐部
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {loadingClubs ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-full" />
              </div>
            ))
          ) : (
            clubs.map(club => (
              <div
                key={club.id}
                className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 sm:p-5 hover:border-[#39ff14]/30 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#39ff14]/20 to-[#39ff14]/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#39ff14]" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#39ff14] transition-colors" />
                </div>

                <h5 className="text-white font-semibold mb-1 group-hover:text-[#39ff14] transition-colors">
                  {club.name}
                </h5>

                <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
                  <MapPin className="w-3 h-3" />
                  {club.city}
                </div>

                <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                  {club.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {club.playerCount} 球员
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {club.coachCount} 教练
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {club.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          没有找到合适的俱乐部？
          <button
            onClick={() => window.open('/clubs', '_blank')}
            className="text-[#39ff14] hover:underline ml-1"
          >
            查看全部俱乐部 →
          </button>
        </p>
      </div>
    </div>
  );
};

export default ClubEmptyState;
