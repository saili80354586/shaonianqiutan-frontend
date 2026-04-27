import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Award,
  CheckCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  User,
  Search,
} from 'lucide-react';

interface Analyst {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  experience: string;
  price: number;
  specialties: string[];
  description: string;
  responseTime: string;
  level: 'standard' | 'advanced' | 'expert';
}

interface Step2SelectAnalystProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

const mockAnalysts: Analyst[] = [
  {
    id: 'analyst_001',
    name: '王分析师',
    avatar: '',
    title: '亚足联A级教练员',
    rating: 4.9,
    reviewCount: 328,
    completedOrders: 512,
    experience: '15年',
    price: 299,
    specialties: ['标准级', '技术专长'],
    description: '前北京国安青训教练，专注青少年技术培养，擅长前锋和攻击性中场的技术动作分析与提升。',
    responseTime: '2小时内',
    level: 'standard',
  },
  {
    id: 'analyst_002',
    name: '李分析师',
    avatar: '',
    title: '俄罗斯职业联赛球员',
    rating: 5.0,
    reviewCount: 256,
    completedOrders: 428,
    experience: '12年',
    price: 599,
    specialties: ['高级', '战术分析'],
    description: '俄罗斯莫斯科斯巴达克青训出身，熟悉欧洲青训体系，擅长战术意识和比赛阅读能力分析。',
    responseTime: '4小时内',
    level: 'advanced',
  },
  {
    id: 'analyst_003',
    name: '张专家',
    avatar: '',
    title: '中超退役职业球员',
    rating: 4.9,
    reviewCount: 198,
    completedOrders: 356,
    experience: '10年',
    price: 999,
    specialties: ['专家级', '职业发展'],
    description: '前山东鲁能主力后卫，现专注青训和防守球员培养，擅长后卫和门将的技术分析。',
    responseTime: '6小时内',
    level: 'expert',
  },
];

const levelFilters = [
  { value: 'all', label: '全部' },
  { value: 'standard', label: '标准分析师' },
  { value: 'advanced', label: '高级分析师' },
  { value: 'expert', label: '专家分析师' },
];

const Step2SelectAnalyst: React.FC<Step2SelectAnalystProps> = ({
  onNext,
  onPrev,
  initialData,
}) => {
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(
    initialData?.analystId || null
  );
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAnalysts = useMemo(() => {
    return mockAnalysts.filter((analyst) => {
      const matchesLevel = filterLevel === 'all' || analyst.level === filterLevel;
      const matchesSearch =
        searchQuery === '' ||
        analyst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analyst.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesLevel && matchesSearch;
    });
  }, [filterLevel, searchQuery]);

  const handleSelectAnalyst = (analystId: string) => {
    setSelectedAnalyst(analystId === selectedAnalyst ? null : analystId);
  };

  const handleNext = () => {
    if (selectedAnalyst) {
      const analyst = mockAnalysts.find((a) => a.id === selectedAnalyst);
      onNext({
        analystId: selectedAnalyst,
        analystInfo: analyst,
      });
    }
  };

  const selectedAnalystData = mockAnalysts.find((a) => a.id === selectedAnalyst);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">选择分析师</h2>
        <p className="text-slate-400">根据您的需求选择合适的专业分析师</p>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Level Filters */}
          <div className="flex flex-wrap gap-2">
            {levelFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterLevel(filter.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterLevel === filter.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:border-slate-500'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 md:max-w-xs md:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索分析师或专长"
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {/* Analyst Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredAnalysts.map((analyst, index) => (
            <motion.div
              key={analyst.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectAnalyst(analyst.id)}
              className={`relative bg-slate-800/50 border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                selectedAnalyst === analyst.id
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Selected Badge */}
              {selectedAnalyst === analyst.id && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Price Tag */}
              <div className="absolute top-4 right-4 text-xl font-bold text-emerald-400">
                ¥{analyst.price}
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                  {analyst.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">{analyst.name}</h3>
                  <p className="text-slate-400 text-sm truncate">{analyst.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-medium">{analyst.rating}</span>
                    <span className="text-slate-500 text-sm">({analyst.reviewCount}条评价)</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {analyst.specialties.map((specialty, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>

              {/* Description */}
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {analyst.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">完成订单</span>
                  </div>
                  <p className="text-white font-semibold">{analyst.completedOrders}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">从业经验</span>
                  </div>
                  <p className="text-white font-semibold">{analyst.experience}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">响应时间</span>
                  </div>
                  <p className="text-white font-semibold">{analyst.responseTime}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAnalysts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            暂无符合条件的分析师
          </h3>
          <p className="text-slate-500">请调整筛选条件</p>
        </motion.div>
      )}

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between pt-6 border-t border-slate-700/50"
      >
        <button
          onClick={onPrev}
          className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          上一步
        </button>

        <button
          onClick={handleNext}
          disabled={!selectedAnalyst}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center gap-2"
        >
          下一步：确认订单
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Selected Analyst Summary (Mobile) */}
      <AnimatePresence>
        {selectedAnalystData && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 md:hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">已选择</p>
                <p className="text-white font-semibold">{selectedAnalystData.name}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold text-xl">¥{selectedAnalystData.price}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Step2SelectAnalyst;
