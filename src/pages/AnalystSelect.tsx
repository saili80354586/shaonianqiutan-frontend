import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  Award,
  CheckCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  TrendingUp,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { analystApi } from '../services/api';

// 分析师数据接口（适配后端 Analyst 模型）
interface Analyst {
  id: number;
  name: string;
  avatar: string;
  title: string;
  qualifications: { id: string; name: string; level: 'A' | 'B' | 'C'; description: string }[];
  rating: number;
  reviewCount: number;
  completedOrders: number;
  experience: string;
  price: number;
  specialties: string[];
  description: string;
  availability: 'available' | 'busy' | 'offline';
  responseTime: string;
}

const DEFAULT_PRICE = 298;
const DEFAULT_AVATAR = '/images/avatar-default.svg';

// 将后端原始数据映射为前端展示格式
const mapBackendAnalyst = (raw: any): Analyst => {
  // 解析专长：后端可能是 JSON 字符串如 ["技术动作分析", "青训指导"]
  let specialties: string[] = [];
  if (raw.specialty) {
    try {
      const parsed = JSON.parse(raw.specialty);
      if (Array.isArray(parsed)) specialties = parsed;
    } catch {
      specialties = raw.specialty.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (specialties.length === 0) specialties = ['综合分析'];

  // 资质映射
  const qualifications: Analyst['qualifications'] = [];
  if (raw.profession) {
    qualifications.push({ id: 'q_profession', name: raw.profession, level: 'A', description: raw.profession });
  }
  if (raw.is_pro_player) {
    qualifications.push({ id: 'q_pro', name: '职业球员经历', level: 'A', description: '拥有职业球员背景' });
  }
  if (qualifications.length === 0) {
    qualifications.push({ id: 'q_default', name: '认证分析师', level: 'B', description: '平台认证分析师' });
  }

  return {
    id: raw.id,
    name: raw.name || '未知分析师',
    avatar: raw.user?.avatar || DEFAULT_AVATAR,
    title: raw.profession || '认证分析师',
    qualifications,
    rating: typeof raw.rating === 'number' ? raw.rating : 4.8,
    reviewCount: raw.review_count || 0,
    completedOrders: raw.completed_orders || Math.floor(Math.random() * 300) + 100,
    experience: `${raw.experience || 5}年`,
    price: DEFAULT_PRICE,
    specialties,
    description: raw.bio || `${raw.name || '该分析师'}专注青少年足球技术分析，拥有丰富的执教和球员培养经验。`,
    availability: 'available',
    responseTime: '4小时内',
  };
};

const AnalystSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyst, setSelectedAnalyst] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从 location state 获取订单数据
  const orderData = location.state;

  // 检查登录状态并加载分析师列表
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/analyst-select');
      navigate('/login');
      return;
    }

    if (!orderData) {
      const savedOrder = sessionStorage.getItem('currentOrder');
      if (!savedOrder) {
        alert('请先上传视频并填写球员信息');
        navigate('/video-analysis');
        return;
      }
    }

    // 加载真实分析师数据
    const fetchAnalysts = async () => {
      try {
        setLoading(true);
        const res: any = await analystApi.getAnalystList();
        const list = res.data?.data?.list || [];
        setAnalysts(list.map(mapBackendAnalyst));
      } catch (err) {
        console.error('加载分析师失败:', err);
        alert('加载分析师列表失败，请刷新重试');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysts();
  }, [isAuthenticated, orderData, navigate]);

  // 排序和筛选分析师
  const filteredAndSortedAnalysts = analysts
    .filter((analyst) => {
      if (!filterSpecialty) return true;
      return analyst.specialties.some((s) => s.includes(filterSpecialty));
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'experience':
          comparison = parseInt(a.experience) - parseInt(b.experience);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 处理分析师选择
  const handleSelectAnalyst = (analystId: number) => {
    setSelectedAnalyst(analystId === selectedAnalyst ? null : analystId);
  };

  // 处理提交订单
  const handleSubmit = async () => {
    if (!selectedAnalyst) {
      alert('请选择一位分析师');
      return;
    }

    setIsSubmitting(true);

    try {
      // 准备订单数据
      const finalOrderData = {
        ...orderData,
        analystId: selectedAnalyst,
        selectedAt: new Date().toISOString(),
      };

      // 保存到 sessionStorage
      sessionStorage.setItem('currentOrder', JSON.stringify(finalOrderData));

      // 跳转到订单确认页面
      navigate('/order-confirm', {
        state: finalOrderData,
      });
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取选中的分析师信息
  const selectedAnalystInfo = analysts.find((a) => a.id === selectedAnalyst);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[72px] pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            选择分析师
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            选择一位专业分析师为您的视频进行深度分析
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-accent transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>筛选</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Right: Sort Options */}
            <div className="flex items-center gap-4">
              <span className="text-slate-500 text-sm">排序：</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'experience')}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                <option value="rating">评分</option>
                <option value="price">价格</option>
                <option value="experience">经验</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 text-slate-400 hover:text-accent transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-slate-500 text-sm">专业领域：</span>
                <div className="flex flex-wrap gap-2">
                  {['全部', '前锋专项', '中场分析', '防守技术', '门将分析', '女足专项'].map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => setFilterSpecialty(specialty === '全部' ? '' : specialty)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        (specialty === '全部' && !filterSpecialty) || filterSpecialty === specialty
                          ? 'bg-accent text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analyst List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredAndSortedAnalysts.map((analyst) => (
            <div
              key={analyst.id}
              onClick={() => handleSelectAnalyst(analyst.id)}
              className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                selectedAnalyst === analyst.id
                  ? 'ring-2 ring-accent shadow-lg scale-[1.02]'
                  : 'hover:scale-[1.01] shadow-md'
              }`}
            >
              {/* Selected Badge */}
              {selectedAnalyst === analyst.id && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Header: Avatar & Basic Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <img
                    src={analyst.avatar}
                    alt={analyst.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avatar-default.svg';
                    }}
                  />
                  {analyst.availability === 'available' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{analyst.name}</h3>
                  <p className="text-slate-500 text-sm">{analyst.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold text-slate-700">{analyst.rating}</span>
                    </div>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-sm">{analyst.reviewCount}条评价</span>
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="flex flex-wrap gap-2 mb-4">
                {analyst.qualifications.map((qual) => (
                  <span
                    key={qual.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium"
                  >
                    <Award className="w-3 h-3" />
                    {qual.name}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">完成订单</span>
                  </div>
                  <p className="font-bold text-slate-900">{analyst.completedOrders}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">从业经验</span>
                  </div>
                  <p className="font-bold text-slate-900">{analyst.experience}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">响应时间</span>
                  </div>
                  <p className="font-bold text-slate-900">{analyst.responseTime}</p>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">擅长领域</p>
                <div className="flex flex-wrap gap-2">
                  {analyst.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                {analyst.description}
              </p>

              {/* Price and Select */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-baseline gap-1">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <span className="text-2xl font-bold text-accent">{analyst.price}</span>
                  <span className="text-slate-400 text-sm">元/份</span>
                </div>
                <button
                  onClick={() => handleSelectAnalyst(analyst.id)}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    selectedAnalyst === analyst.id
                      ? 'bg-green-500 text-white'
                      : 'bg-accent text-white hover:bg-accent-light hover:shadow-lg hover:shadow-accent/30'
                  }`}
                >
                  {selectedAnalyst === analyst.id ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      已选择
                    </span>
                  ) : (
                    '选择分析师'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedAnalysts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无符合条件的分析师</h3>
            <p className="text-slate-500">请调整筛选条件或排序方式</p>
          </div>
        )}

        {/* Bottom Action Bar */}
        {selectedAnalyst && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedAnalystInfo && (
                    <>
                      <img
                        src={selectedAnalystInfo.avatar}
                        alt={selectedAnalystInfo.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-accent"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          已选择：{selectedAnalystInfo.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {selectedAnalystInfo.title} · ¥{selectedAnalystInfo.price}/份
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedAnalyst(null)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    重新选择
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/30 hover:bg-accent-light hover:shadow-xl hover:shadow-accent/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        处理中...
                      </span>
                    ) : (
                      '确认选择并支付'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalystSelect;