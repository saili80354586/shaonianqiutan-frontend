import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Calendar, Phone, Award, FileText, TrendingUp, Edit2,
  ShoppingBag, BarChart3, Shield, CheckCircle, Clock, XCircle,
  Activity, User, Filter, ChevronDown, ChevronUp, Zap, MapPin,
  Video, Target, Star, Package
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { clubApi } from '../../services/api';

interface PlayerDetailProps {
  playerId: number;
  onBack: () => void;
}

// ===== 新 Tab 体系 =====
type TabKey = 'timeline' | 'physical' | 'matches' | 'archive';

// ===== 时间线节点类型 =====
type TimelineNodeType = 'physical' | 'match' | 'weekly' | 'scout' | 'order' | 'growth';

interface TimelineNode {
  id: string;
  type: TimelineNodeType;
  date: string;
  title: string;
  description?: string;
  data: any;
}

// ===== 原有接口保留 =====
interface PhysicalTestItem {
  id: number;
  testDate: string;
  data: Record<string, string | number>;
}

interface GrowthRecord {
  id: number;
  date: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  summary?: string;
}

interface WeeklyReportItem {
  id: number;
  weekStart: string;
  weekEnd: string;
  status: string;
  reviewStatus?: string;
  overallScore: number;
  coachName?: string;
  teamName?: string;
}

interface MatchSummaryItem {
  id: number;
  matchName: string;
  matchDate: string;
  status: string;
  ourScore: number;
  oppScore: number;
  opponent: string;
  teamName?: string;
  result?: 'win' | 'lose' | 'draw' | 'pending';
}

interface OrderItem {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  orderNo?: string;
  amount?: number;
  playerName?: string;
  matchName?: string;
}

interface ScoutReportItem {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  analystName: string;
  overallScore: number;
  overallRating?: number;
  summary?: string;
  potentialRating?: number;
  targetClub?: string;
}

interface PlayerProfile {
  id: number;
  name: string;
  ageGroup: string;
  tags: string[];
  positionName: string;
  age: number;
  phone: string;
  joinDate: string;
  statistics?: {
    totalOrders?: number;
    completedOrders?: number;
    totalReports?: number;
    avgScore?: number;
    totalMatches?: number;
    totalPhysicalTests?: number;
  };
  lastPhysicalTest?: PhysicalTestItem;
  growthRecords: GrowthRecord[];
  weeklyReports: WeeklyReportItem[];
  matchSummaries: MatchSummaryItem[];
  physicalTests: PhysicalTestItem[];
  orders: OrderItem[];
  scoutReports: ScoutReportItem[];
}

type IconComponent = React.ComponentType<{ className?: string }>;

const statusMap: Record<string, { label: string; color: string; icon: IconComponent }> = {
  pending: { label: '待处理', color: 'text-yellow-400 bg-yellow-500/20', icon: Clock },
  paid: { label: '已支付', color: 'text-blue-400 bg-blue-500/20', icon: CheckCircle },
  assigned: { label: '已分配', color: 'text-purple-400 bg-purple-500/20', icon: User },
  processing: { label: '处理中', color: 'text-orange-400 bg-orange-500/20', icon: Activity },
  completed: { label: '已完成', color: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-gray-400 bg-gray-500/20', icon: XCircle },
  refunded: { label: '已退款', color: 'text-gray-400 bg-gray-500/20', icon: XCircle },
  approved: { label: '已通过', color: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'text-red-400 bg-red-500/20', icon: XCircle },
  player_submitted: { label: '待点评', color: 'text-blue-400 bg-blue-500/20', icon: Clock },
  draft: { label: '草稿', color: 'text-gray-400 bg-gray-500/20', icon: FileText },
  published: { label: '已发布', color: 'text-blue-400 bg-blue-500/20', icon: CheckCircle },
  adopted: { label: '已采纳', color: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle },
};

const getStatusBadge = (status: string) => {
  const config = statusMap[status] || { label: status, color: 'text-gray-400 bg-gray-500/20', icon: Clock };
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
      <Icon className="w-3 h-3" /> {config.label}
    </span>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-12 text-gray-500">
    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-600" />
    <p>{message}</p>
  </div>
);

// ===== 时间线类型配置 =====
const typeConfig: Record<TimelineNodeType, { label: string; color: string; bg: string; icon: IconComponent }> = {
  physical: { label: '体测', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Award },
  match: { label: '比赛', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Shield },
  weekly: { label: '周报', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: FileText },
  scout: { label: '球探报告', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: BarChart3 },
  order: { label: '订单', color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: ShoppingBag },
  growth: { label: '成长', color: 'text-pink-400', bg: 'bg-pink-500/10', icon: TrendingUp },
};

// ===== 构建时间线 =====
const buildTimeline = (player: PlayerProfile): TimelineNode[] => {
  const nodes: TimelineNode[] = [];

  player.physicalTests?.forEach((pt) => {
    nodes.push({
      id: `pt-${pt.id}`,
      type: 'physical',
      date: pt.testDate,
      title: '体能测试',
      description: `完成 ${Object.keys(pt.data || {}).length} 项指标测试`,
      data: pt,
    });
  });

  player.matchSummaries?.forEach((m) => {
    nodes.push({
      id: `match-${m.id}`,
      type: 'match',
      date: m.matchDate,
      title: m.matchName,
      description: `vs ${m.opponent} · ${m.result === 'win' ? '胜' : m.result === 'lose' ? '负' : m.result === 'draw' ? '平' : '待定'}`,
      data: m,
    });
  });

  player.weeklyReports?.forEach((r) => {
    nodes.push({
      id: `wr-${r.id}`,
      type: 'weekly',
      date: r.weekEnd || r.weekStart,
      title: `周报 ${r.weekStart} ~ ${r.weekEnd}`,
      description: `教练：${r.coachName || '-'} · 评分 ${r.overallScore || '-'}`,
      data: r,
    });
  });

  player.scoutReports?.forEach((r) => {
    nodes.push({
      id: `sr-${r.id}`,
      type: 'scout',
      date: r.createdAt,
      title: r.title || '球探报告',
      description: `分析师：${r.analystName || '-'} · 评分 ${r.overallRating || r.overallScore || '-'}`,
      data: r,
    });
  });

  player.orders?.forEach((o) => {
    nodes.push({
      id: `order-${o.id}`,
      type: 'order',
      date: o.createdAt,
      title: o.matchName || '技术分析订单',
      description: `订单号：${o.orderNo || '-'} · ¥${o.amount || o.totalAmount || 0}`,
      data: o,
    });
  });

  player.growthRecords?.forEach((gr) => {
    nodes.push({
      id: `gr-${gr.id}`,
      type: 'growth',
      date: gr.date,
      title: gr.title,
      description: gr.description,
      data: gr,
    });
  });

  return nodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ===== 体测趋势计算 =====
const getPhysicalTrend = (tests: PhysicalTestItem[], metric: string) => {
  const sorted = [...tests].sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  return sorted.map((t) => ({
    date: t.testDate,
    value: typeof t.data[metric] === 'number' ? t.data[metric] : parseFloat(t.data[metric] as string) || 0,
  }));
};

// ===== 统计卡片组件 =====
const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: IconComponent }> =
  ({ label, value, color, icon: Icon }) => (
    <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );

const PlayerDetail: React.FC<PlayerDetailProps> = ({ playerId, onBack }) => {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<TimelineNodeType | 'all'>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  useEffect(() => { loadPlayer(); }, [playerId]);

  const loadPlayer = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getPlayerDetail(playerId);
      if (res.data?.success && res.data?.data) {
        setPlayer(res.data.data);
      }
    } catch (error) {
      console.error('加载球员详情失败:', error);
    }
    setLoading(false);
  };

  const timeline = useMemo(() => player ? buildTimeline(player) : [], [player]);
  const filteredTimeline = useMemo(() =>
    timelineFilter === 'all' ? timeline : timeline.filter(n => n.type === timelineFilter),
    [timeline, timelineFilter]
  );

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-white animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />返回
        </button>
        <div className="text-center text-gray-400 mt-8">球员不存在或暂无数据</div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: IconComponent }[] = [
    { key: 'timeline', label: '成长档案', icon: TrendingUp },
    { key: 'physical', label: '体测与数据', icon: Award },
    { key: 'matches', label: '比赛与表现', icon: Shield },
    { key: 'archive', label: '综合档案', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />返回球员管理
        </button>

        {/* 球员资料卡 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
              {player.name?.[0] || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{player.name}</h1>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">{player.ageGroup}</span>
                {player.tags?.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><Award className="w-4 h-4" />{player.positionName}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{player.age}岁</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{player.phone}</span>
                <span className="flex items-center gap-1"><User className="w-4 h-4" />加入时间 {player.joinDate}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
              <Edit2 className="w-4 h-4" />编辑
            </button>
          </div>
        </div>

        {/* 统计卡片 - 6个 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="总订单" value={player.statistics?.totalOrders || 0} color="text-cyan-400" icon={ShoppingBag} />
          <StatCard label="已完成" value={player.statistics?.completedOrders || 0} color="text-emerald-400" icon={CheckCircle} />
          <StatCard label="球探报告" value={player.statistics?.totalReports || 0} color="text-amber-400" icon={BarChart3} />
          <StatCard label="平均评分" value={player.statistics?.avgScore || 0} color="text-yellow-400" icon={Star} />
          <StatCard label="比赛场次" value={player.statistics?.totalMatches || player.matchSummaries?.length || 0} color="text-blue-400" icon={Shield} />
          <StatCard label="体测次数" value={player.statistics?.totalPhysicalTests || player.physicalTests?.length || 0} color="text-purple-400" icon={Activity} />
        </div>

        {/* Tab 导航 */}
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800">
          <div className="flex border-b border-gray-800 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ====== 成长档案（时间线）====== */}
            {activeTab === 'timeline' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：时间线 */}
                <div className="lg:col-span-2">
                  {/* 筛选器 */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => setTimelineFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${timelineFilter === 'all' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                      全部
                    </button>
                    {(Object.keys(typeConfig) as TimelineNodeType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimelineFilter(t)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 ${timelineFilter === t ? `${typeConfig[t].bg} ${typeConfig[t].color}` : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>

                  {/* 时间线列表 */}
                  <div className="space-y-0">
                    {filteredTimeline.length > 0 ? (
                      filteredTimeline.map((node, i) => {
                        const cfg = typeConfig[node.type];
                        const Icon = cfg.icon;
                        const isExpanded = expandedNodes.has(node.id);
                        return (
                          <div key={node.id} className="flex gap-4 group">
                            {/* 时间轴 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                                <Icon className={`w-4 h-4 ${cfg.color}`} />
                              </div>
                              {i < filteredTimeline.length - 1 && <div className="w-px flex-1 bg-gray-800 group-hover:bg-gray-700 transition-colors" />}
                            </div>
                            {/* 内容 */}
                            <div className="flex-1 pb-6">
                              <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    <span className="text-sm text-gray-500">{node.date}</span>
                                  </div>
                                  <button onClick={() => toggleNode(node.id)} className="text-gray-500 hover:text-white">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                                <div className="font-medium text-white">{node.title}</div>
                                <div className="text-sm text-gray-400">{node.description}</div>

                                {/* 展开详情 */}
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-gray-800">
                                    {node.type === 'physical' && (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {Object.entries(node.data.data || {}).map(([k, v]: [string, any]) => (
                                          <div key={k} className="bg-[#1a1f2e] rounded-lg p-2">
                                            <div className="text-xs text-gray-500">{k}</div>
                                            <div className="text-white text-sm">{typeof v === 'number' ? v.toFixed(2) : v}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {node.type === 'match' && (
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>对手：{node.data.opponent || '-'}</div>
                                        <div>球队：{node.data.teamName || '-'}</div>
                                        <div>比分：{node.data.ourScore} - {node.data.oppScore}</div>
                                        {getStatusBadge(node.data.status)}
                                      </div>
                                    )}
                                    {node.type === 'weekly' && (
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>教练：{node.data.coachName || '-'}</div>
                                        <div>球队：{node.data.teamName || '-'}</div>
                                        <div>综合评分：{node.data.overallScore || '-'}</div>
                                        {getStatusBadge(node.data.reviewStatus || node.data.status)}
                                      </div>
                                    )}
                                    {node.type === 'scout' && (
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>分析师：{node.data.analystName || '-'}</div>
                                        <div>综合评分：{node.data.overallRating || node.data.overallScore || '-'}</div>
                                        {node.data.summary && <div>{node.data.summary}</div>}
                                        {getStatusBadge(node.data.status)}
                                      </div>
                                    )}
                                    {node.type === 'order' && (
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>订单号：{node.data.orderNo || '-'}</div>
                                        <div>金额：¥{node.data.amount || node.data.totalAmount || 0}</div>
                                        {getStatusBadge(node.data.status)}
                                      </div>
                                    )}
                                    {node.type === 'growth' && (
                                      <div className="text-sm text-gray-400">{node.data.description}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyState message={timelineFilter === 'all' ? '暂无成长记录' : `暂无${typeConfig[timelineFilter]?.label || ''}记录`} />
                    )}
                  </div>
                </div>

                {/* 右侧：概览卡片 */}
                <div className="space-y-4">
                  {/* 最近体测 */}
                  {player.lastPhysicalTest && (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-emerald-400" />最近体测
                      </h3>
                      <div className="text-sm text-gray-500 mb-2">{player.lastPhysicalTest.testDate}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(player.lastPhysicalTest.data || {}).slice(0, 4).map(([k, v]: [string, any]) => (
                          <div key={k} className="bg-[#1a1f2e] rounded-lg p-2">
                            <div className="text-xs text-gray-500">{k}</div>
                            <div className="text-white text-sm font-medium">{typeof v === 'number' ? v.toFixed(2) : v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 最近比赛 */}
                  {player.matchSummaries?.[0] && (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-blue-400" />最近比赛
                      </h3>
                      <div className="text-white font-medium">{player.matchSummaries[0].matchName}</div>
                      <div className="text-sm text-gray-400">vs {player.matchSummaries[0].opponent || '-'}</div>
                      <div className="text-sm text-gray-500 mt-1">{player.matchSummaries[0].matchDate}</div>
                      {player.matchSummaries[0].result && player.matchSummaries[0].result !== 'pending' && (
                        <div className={`text-sm mt-1 ${player.matchSummaries[0].result === 'win' ? 'text-emerald-400' : player.matchSummaries[0].result === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {player.matchSummaries[0].ourScore} - {player.matchSummaries[0].oppScore} ({player.matchSummaries[0].result === 'win' ? '胜' : player.matchSummaries[0].result === 'lose' ? '负' : '平'})
                        </div>
                      )}
                    </div>
                  )}

                  {/* 最近周报 */}
                  {player.weeklyReports?.[0] && (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-purple-400" />最近周报
                      </h3>
                      <div className="text-white font-medium">{player.weeklyReports[0].weekStart} ~ {player.weeklyReports[0].weekEnd}</div>
                      <div className="text-sm text-gray-400">教练：{player.weeklyReports[0].coachName || '-'}</div>
                      <div className="text-sm text-gray-500 mt-1">评分 {player.weeklyReports[0].overallScore || '-'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ====== 体测与数据 ====== */}
            {activeTab === 'physical' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-emerald-400" />历次体测记录
                  </h3>
                  {player.physicalTests?.length > 0 ? (
                    <div className="space-y-4">
                      {player.physicalTests.map((pt) => (
                        <div key={pt.id} className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-medium text-white">体测记录</div>
                            <span className="text-sm text-gray-400">{pt.testDate}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(pt.data || {}).map(([key, value]: [string, string | number]) => (
                              <div key={key} className="bg-[#1a1f2e] rounded-lg p-3">
                                <div className="text-xs text-gray-500 capitalize">{key}</div>
                                <div className="text-white font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="暂无体测数据" />
                  )}
                </div>
                {/* 指标趋势折线图 */}
                {player.physicalTests && player.physicalTests.length >= 2 && (
                  <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />指标变化趋势
                      </h3>
                      {/* 指标选择器 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">选择指标：</span>
                        <select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className="bg-[#1a1f2e] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="">自动选择</option>
                          {Array.from(new Set(player.physicalTests.flatMap(pt => Object.keys(pt.data || {})))).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(() => {
                      const sorted = [...player.physicalTests].sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
                      const allKeys = Array.from(new Set(sorted.flatMap(pt => Object.keys(pt.data || {}))));
                      const metric = selectedMetric || allKeys[0];
                      if (!metric) return <div className="text-sm text-gray-500">无可用的体测指标</div>;

                      const dates = sorted.map(pt => pt.testDate);
                      const values = sorted.map(pt => {
                        const v = pt.data[metric];
                        return typeof v === 'number' ? v : parseFloat(v as string) || 0;
                      });

                      const option = {
                        backgroundColor: 'transparent',
                        tooltip: {
                          trigger: 'axis',
                          backgroundColor: 'rgba(26,31,46,0.95)',
                          borderColor: '#374151',
                          textStyle: { color: '#fff' },
                        },
                        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
                        xAxis: {
                          type: 'category',
                          data: dates,
                          axisLine: { lineStyle: { color: '#374151' } },
                          axisLabel: { color: '#9ca3af', rotate: dates.length > 6 ? 30 : 0 },
                        },
                        yAxis: {
                          type: 'value',
                          axisLine: { lineStyle: { color: '#374151' } },
                          axisLabel: { color: '#9ca3af' },
                          splitLine: { lineStyle: { color: 'rgba(55,65,81,0.3)' } },
                        },
                        series: [{
                          name: metric,
                          type: 'line',
                          data: values,
                          smooth: true,
                          symbol: 'circle',
                          symbolSize: 8,
                          lineStyle: { color: '#39ff14', width: 3 },
                          itemStyle: { color: '#39ff14' },
                          areaStyle: {
                            color: {
                              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                              colorStops: [
                                { offset: 0, color: 'rgba(57,255,20,0.3)' },
                                { offset: 1, color: 'rgba(57,255,20,0.01)' },
                              ],
                            },
                          },
                        }],
                      };

                      return (
                        <div className="h-64">
                          <ReactECharts option={option} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 体能雷达图 */}
                {player.physicalTests && player.physicalTests.length > 0 && (() => {
                  const latest = [...player.physicalTests].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];
                  const data = latest.data || {};

                  // 指标名模糊匹配到5个维度
                  const findVal = (patterns: string[]) => {
                    for (const key of Object.keys(data)) {
                      const lower = key.toLowerCase();
                      for (const p of patterns) {
                        if (lower.includes(p.toLowerCase())) {
                          const v = data[key];
                          return typeof v === 'number' ? v : parseFloat(v as string) || 0;
                        }
                      }
                    }
                    return 0;
                  };

                  const dims = [
                    { name: '速度', keys: ['sprint', '30m', '50m', '100m', '跑'], max: 100 },
                    { name: '灵敏', keys: ['agility', 'ladder', 't_test', 'shuttle', '折返', '敏捷'], max: 100 },
                    { name: '爆发', keys: ['jump', 'long', 'vertical', '跳'], max: 100 },
                    { name: '柔韧', keys: ['reach', 'flex', '柔韧', '体前屈'], max: 100 },
                    { name: '力量', keys: ['push', 'sit_up', 'plank', '俯卧撑', '仰卧', '平板'], max: 100 },
                  ];

                  const scores = dims.map(d => {
                    const val = findVal(d.keys);
                    if (val === 0) return 0;
                    // 对于时间类指标（速度/灵敏），值越小越好，需要反转
                    const isInverse = d.name === '速度' || d.name === '灵敏';
                    const maxVal = isInverse ? (val * 2) : d.max;
                    const score = isInverse
                      ? Math.max(0, Math.min(100, Math.round((1 - val / maxVal) * 100)))
                      : Math.max(0, Math.min(100, Math.round((val / maxVal) * 100)));
                    return score;
                  });

                  const hasAny = scores.some(s => s > 0);
                  if (!hasAny) return null;

                  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

                  const radarOption = {
                    backgroundColor: 'transparent',
                    tooltip: {
                      backgroundColor: 'rgba(26,31,46,0.95)',
                      borderColor: '#374151',
                      textStyle: { color: '#fff' },
                    },
                    radar: {
                      indicator: dims.map(d => ({ name: d.name, max: 100 })),
                      axisName: { color: '#d1d5db', fontSize: 14, fontWeight: 'bold' },
                      splitArea: {
                        areaStyle: {
                          color: ['rgba(57,255,20,0.02)', 'rgba(57,255,20,0.05)', 'rgba(57,255,20,0.08)', 'rgba(57,255,20,0.11)'],
                        },
                      },
                      splitLine: { lineStyle: { color: 'rgba(57,255,20,0.15)' } },
                      axisLine: { lineStyle: { color: 'rgba(57,255,20,0.2)' } },
                    },
                    series: [{
                      type: 'radar',
                      data: [{
                        value: scores,
                        name: '能力评估',
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: { color: '#39ff14', width: 3 },
                        itemStyle: { color: '#39ff14', borderColor: '#0a0e17', borderWidth: 2 },
                        areaStyle: {
                          color: {
                            type: 'radial', x: 0.5, y: 0.5, r: 0.5,
                            colorStops: [
                              { offset: 0, color: 'rgba(57,255,20,0.4)' },
                              { offset: 1, color: 'rgba(57,255,20,0.05)' },
                            ],
                          },
                        },
                        label: { show: true, formatter: (params: any) => params.value, color: '#fff', fontSize: 12, fontWeight: 'bold' },
                      }],
                    }],
                    graphic: avg > 0 ? [
                      { type: 'text', left: 'center', top: 'center', style: { text: `${Math.round(avg)}`, fill: '#39ff14', fontSize: 32, fontWeight: 'bold', textAlign: 'center' } },
                      { type: 'text', left: 'center', top: 'center', style: { text: '综合评分', fill: '#9ca3af', fontSize: 12, textAlign: 'center' }, offset: [0, 24] },
                    ] : undefined,
                  };

                  return (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-emerald-400" />体能雷达图
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="h-64">
                          <ReactECharts option={radarOption} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />
                        </div>
                        <div className="space-y-2">
                          {dims.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-3">
                              <div className="w-24 text-sm text-gray-400">{d.name}</div>
                              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${scores[i]}%`,
                                    backgroundColor: scores[i] >= 80 ? '#39ff14' : scores[i] >= 60 ? '#00d4ff' : scores[i] >= 40 ? '#f59e0b' : '#ef4444',
                                  }}
                                />
                              </div>
                              <div className="w-10 text-right text-sm text-white font-medium">{scores[i]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ====== 比赛与表现 ====== */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-blue-400" />比赛记录
                  </h3>
                  {player.matchSummaries?.length > 0 ? (
                    <div className="space-y-3">
                      {player.matchSummaries.map((m) => {
                        // 深度关联：找到匹配的订单
                        const linkedOrders = player.orders?.filter((o: OrderItem) =>
                          o.matchName && (m.matchName.includes(o.matchName) || o.matchName.includes(m.matchName))
                        ) || [];
                        return (
                          <div key={m.id} className="bg-[#0f1419] rounded-xl p-4 border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-white">{m.matchName}</div>
                              {getStatusBadge(m.status)}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-4 flex-wrap">
                              <span>对手：{m.opponent || '-'}</span>
                              <span>日期：{m.matchDate}</span>
                              <span>球队：{m.teamName || '-'}</span>
                              {m.result && m.result !== 'pending' && (
                                <span className={`font-medium ${m.result === 'win' ? 'text-emerald-400' : m.result === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
                                  比分 {m.ourScore} - {m.oppScore} ({m.result === 'win' ? '胜' : m.result === 'lose' ? '负' : '平'})
                                </span>
                              )}
                            </div>
                            {/* 深度关联视频订单 */}
                            {linkedOrders.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-800 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-cyan-400 mb-1">
                                  <Video className="w-4 h-4" />
                                  <span>关联视频分析订单</span>
                                </div>
                                {linkedOrders.map((o: OrderItem) => (
                                  <div key={o.id} className="flex items-center justify-between bg-[#1a1f2e] rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-white">{o.orderNo || '订单'}</span>
                                      {getStatusBadge(o.status)}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span className="text-gray-400">¥{o.amount || o.totalAmount || 0}</span>
                                      <span className="text-gray-500">{o.createdAt}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState message="暂无比赛记录" />
                  )}
                </div>

                {/* 比赛结果趋势图 */}
                {player.matchSummaries && player.matchSummaries.length >= 2 && (() => {
                  const sorted = [...player.matchSummaries]
                    .filter(m => m.result && m.result !== 'pending')
                    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
                  if (sorted.length < 2) return null;

                  const dates = sorted.map(m => m.matchDate);
                  const resultScores = sorted.map(m => {
                    if (m.result === 'win') return 3;
                    if (m.result === 'draw') return 1;
                    return 0;
                  });
                  const goalDiffs = sorted.map(m => m.ourScore - m.oppScore);

                  const option = {
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'axis',
                      backgroundColor: 'rgba(26,31,46,0.95)',
                      borderColor: '#374151',
                      textStyle: { color: '#fff' },
                    },
                    legend: {
                      data: ['比赛积分', '净胜球'],
                      textStyle: { color: '#9ca3af' },
                      bottom: 0,
                    },
                    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: dates,
                      axisLine: { lineStyle: { color: '#374151' } },
                      axisLabel: { color: '#9ca3af', rotate: dates.length > 6 ? 30 : 0 },
                    },
                    yAxis: [
                      {
                        type: 'value',
                        name: '积分',
                        nameTextStyle: { color: '#9ca3af' },
                        axisLine: { lineStyle: { color: '#374151' } },
                        axisLabel: { color: '#9ca3af' },
                        splitLine: { lineStyle: { color: 'rgba(55,65,81,0.3)' } },
                        min: 0,
                        max: 4,
                      },
                      {
                        type: 'value',
                        name: '净胜球',
                        nameTextStyle: { color: '#9ca3af' },
                        axisLine: { lineStyle: { color: '#374151' } },
                        axisLabel: { color: '#9ca3af' },
                        splitLine: { show: false },
                      },
                    ],
                    series: [
                      {
                        name: '比赛积分',
                        type: 'bar',
                        data: resultScores,
                        barWidth: '40%',
                        itemStyle: {
                          color: (params: any) => {
                            const val = params.value;
                            if (val === 3) return '#39ff14';
                            if (val === 1) return '#f59e0b';
                            return '#ef4444';
                          },
                          borderRadius: [4, 4, 0, 0],
                        },
                      },
                      {
                        name: '净胜球',
                        type: 'line',
                        yAxisIndex: 1,
                        data: goalDiffs,
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 8,
                        lineStyle: { color: '#00d4ff', width: 3 },
                        itemStyle: { color: '#00d4ff' },
                      },
                    ],
                  };

                  // 统计卡片
                  const wins = sorted.filter(m => m.result === 'win').length;
                  const draws = sorted.filter(m => m.result === 'draw').length;
                  const losses = sorted.filter(m => m.result === 'lose').length;
                  const totalGoals = sorted.reduce((sum, m) => sum + m.ourScore, 0);
                  const totalConceded = sorted.reduce((sum, m) => sum + m.oppScore, 0);

                  return (
                    <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-400" />比赛表现趋势
                      </h3>
                      {/* 统计概览 */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-emerald-400">{wins}</div>
                          <div className="text-xs text-gray-500">胜</div>
                        </div>
                        <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-yellow-400">{draws}</div>
                          <div className="text-xs text-gray-500">平</div>
                        </div>
                        <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-red-400">{losses}</div>
                          <div className="text-xs text-gray-500">负</div>
                        </div>
                        <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{totalGoals}</div>
                          <div className="text-xs text-gray-500">进球</div>
                        </div>
                        <div className="bg-[#1a1f2e] rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-white">{totalConceded}</div>
                          <div className="text-xs text-gray-500">失球</div>
                        </div>
                      </div>
                      <div className="h-64">
                        <ReactECharts option={option} style={{ height: '100%' }} opts={{ renderer: 'svg' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ====== 综合档案 ====== */}
            {activeTab === 'archive' && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-4">
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-emerald-400" />基本信息
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><div className="text-gray-500">姓名</div><div className="text-white">{player.name}</div></div>
                    <div><div className="text-gray-500">年龄组</div><div className="text-white">{player.ageGroup}</div></div>
                    <div><div className="text-gray-500">位置</div><div className="text-white">{player.positionName}</div></div>
                    <div><div className="text-gray-500">年龄</div><div className="text-white">{player.age}岁</div></div>
                    <div><div className="text-gray-500">电话</div><div className="text-white">{player.phone}</div></div>
                    <div><div className="text-gray-500">加入时间</div><div className="text-white">{player.joinDate}</div></div>
                    <div className="col-span-2"><div className="text-gray-500">标签</div><div className="text-white">{player.tags?.join(', ') || '-'}</div></div>
                  </div>
                </div>

                {/* 订单历史 */}
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <ShoppingBag className="w-5 h-5 text-cyan-400" />订单历史
                  </h3>
                  {player.orders?.length > 0 ? (
                    <div className="space-y-3">
                      {player.orders.map((o: OrderItem) => (
                        <div key={o.id} className="bg-[#0f1419] rounded-xl p-4 border border-gray-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{o.orderNo}</span>
                              {getStatusBadge(o.status)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {o.playerName || o.matchName || '技术分析订单'} · ¥{o.amount}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">{o.createdAt}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="暂无订单历史" />
                  )}
                </div>

                {/* 球探报告 */}
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-amber-400" />球探报告
                  </h3>
                  {player.scoutReports?.length > 0 ? (
                    <div className="space-y-3">
                      {player.scoutReports.map((r: ScoutReportItem) => (
                        <div key={r.id} className="bg-[#0f1419] rounded-xl p-4 border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-white">{r.title || '球探报告'}</div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(r.status)}
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs">评分 {r.overallRating || r.overallScore || '-'}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">{r.summary}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-3">
                            {r.potentialRating && <span>潜力评级 {r.potentialRating}</span>}
                            {r.targetClub && <span>目标俱乐部 {r.targetClub}</span>}
                            <span>{r.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="暂无球探报告" />
                  )}
                </div>

                {/* 周报汇总 */}
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-purple-400" />周报汇总
                  </h3>
                  {player.weeklyReports?.length > 0 ? (
                    <div className="space-y-3">
                      {player.weeklyReports.map((r) => (
                        <div key={r.id} className="bg-[#0f1419] rounded-xl p-4 border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-white">{r.weekStart} ~ {r.weekEnd}</div>
                            {getStatusBadge(r.reviewStatus || r.status)}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-4">
                            <span>教练：{r.coachName || '-'}</span>
                            <span>球队：{r.teamName || '-'}</span>
                            {r.overallScore > 0 && <span className="text-emerald-400">综合评分 {r.overallScore}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="暂无周报记录" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
