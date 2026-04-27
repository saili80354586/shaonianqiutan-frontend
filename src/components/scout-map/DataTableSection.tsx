import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, ChevronRight, Search, ArrowUpDown, 
  Trophy, Star, MapPin, Calendar, Users, Sparkles,
  Filter
} from 'lucide-react';
import type { Player } from './types';
import { POSITIONS } from './types';

interface DataTableSectionProps {
  players: Player[];
  isLoading?: boolean;
}

type SortField = 'name' | 'age' | 'score' | 'position' | 'city';
type SortOrder = 'asc' | 'desc';

// 骨架屏组件
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center border-b border-slate-700/30">
          {/* 排名 - 移动端缩小 */}
          <div className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 flex items-center justify-center box-border overflow-hidden" style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}>
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-xl bg-slate-700/50" />
          </div>
          {/* 球员信息 - 移动端调整宽度 */}
          <div className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 flex items-center gap-2 lg:gap-3 box-border overflow-hidden" style={{ width: 'calc(100% - 48px - 60px - 80px - 80px)', minWidth: '140px', maxWidth: '240px' }}>
            <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-slate-700/50 flex-shrink-0" />
            <div className="space-y-1.5 lg:space-y-2 flex-1 min-w-0">
              <div className="w-20 lg:w-24 h-3.5 lg:h-4 rounded bg-slate-700/50" />
              <div className="w-12 lg:w-16 h-2.5 lg:h-3 rounded bg-slate-700/30 hidden sm:block" />
            </div>
          </div>
          {/* 年龄 - 移动端隐藏 */}
          <div className="hidden sm:table-cell px-2 lg:px-5 py-3 lg:py-4 box-border overflow-hidden" style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
            <div className="w-10 h-3.5 lg:h-4 rounded bg-slate-700/50" />
          </div>
          {/* 位置 */}
          <div className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 box-border overflow-hidden" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
            <div className="w-12 lg:w-16 h-5 lg:h-6 rounded-lg bg-slate-700/50" />
          </div>
          {/* 评分 */}
          <div className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 box-border overflow-hidden" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
            <div className="w-12 lg:w-16 h-5 lg:h-6 rounded-xl bg-slate-700/50" />
          </div>
          {/* 城市 - 移动端隐藏 */}
          <div className="hidden md:table-cell px-2 lg:px-5 py-3 lg:py-4 box-border overflow-hidden" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
            <div className="w-16 lg:w-20 h-3.5 lg:h-4 rounded bg-slate-700/50" />
          </div>
          {/* 技能标签 - 移动端隐藏 */}
          <div className="hidden lg:table-cell flex-1 px-5 py-4 box-border overflow-hidden" style={{ minWidth: '150px' }}>
            <div className="w-20 lg:w-24 h-3.5 lg:h-4 rounded bg-slate-700/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 表头排序按钮组件 - 使用标准 th 避免动画影响布局
function SortHeader({ 
  label, 
  field, 
  sortField, 
  sortOrder, 
  onSort, 
  icon: Icon,
  width,
  className = ''
}: { 
  label: string; 
  field: SortField; 
  sortField: SortField; 
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  icon?: React.ElementType;
  width: number;
  className?: string;
}) {
  const isActive = sortField === field;
  
  return (
    <th 
      className={`px-2 sm:px-3 lg:px-5 py-3 lg:py-4 text-left font-semibold tracking-wider cursor-pointer select-none whitespace-nowrap hover:bg-slate-700/30 transition-colors box-border overflow-hidden text-xs lg:text-sm ${className}`}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 lg:gap-1.5 text-slate-400 hover:text-white transition-colors overflow-hidden">
        {Icon && <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />}
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
        <div className="flex-shrink-0">
          <ArrowUpDown 
            className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-all duration-200 ${isActive ? 'text-emerald-400 rotate-0' : ''} ${isActive && sortOrder === 'asc' ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
    </th>
  );
}

// 排名徽章组件
function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <span className="text-slate-500 font-medium w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center text-xs lg:text-sm">
        {rank}
      </span>
    );
  }

  const configs = [
    { gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-orange-500/30', icon: '👑' },
    { gradient: 'from-slate-300 to-slate-400', shadow: 'shadow-slate-400/30', icon: '🥈' },
    { gradient: 'from-amber-600 to-amber-700', shadow: 'shadow-amber-600/30', icon: '🥉' },
  ];
  const config = configs[rank - 1];

  return (
    <motion.div 
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1, rotate: 10 }}
      className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl flex items-center justify-center text-xs lg:text-sm font-bold shadow-lg ${config.shadow}
        bg-gradient-to-br ${config.gradient} text-white`}
    >
      {rank}
    </motion.div>
  );
}

// 球员头像组件
function PlayerAvatar({ 
  player, 
  rank 
}: { 
  player: Player; 
  rank: number;
}) {
  return (
    <div className="flex items-center gap-2 lg:gap-3 min-w-0">
      <motion.div 
        className="relative flex-shrink-0"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <img 
          src={player.avatar} 
          alt={player.nickname} 
          className="w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl object-cover border border-slate-700 lg:border-2"
        />
        {rank <= 3 && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center text-[8px] lg:text-[10px] font-bold
              ${rank === 1 ? 'bg-amber-500 text-white' : 
                rank === 2 ? 'bg-slate-400 text-slate-800' : 
                'bg-amber-600 text-white'}`}
          >
            {rank}
          </motion.div>
        )}
      </motion.div>
      <div className="min-w-0 flex-1">
        <motion.p 
          className="font-semibold text-white truncate text-sm lg:text-base"
          whileHover={{ color: '#10b981' }}
          transition={{ duration: 0.2 }}
        >
          {player.name || player.nickname}
        </motion.p>
        <p className="text-xs text-slate-500 truncate hidden sm:block">{player.club || '无俱乐部'}</p>
      </div>
    </div>
  );
}

// 评分徽章组件
function ScoreBadge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (score >= 80) return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  };

  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold border
        ${getScoreColor(score)}`}
    >
      <Star className="w-3 h-3 lg:w-3.5 lg:h-3.5 fill-current" />
      {score}
    </motion.div>
  );
}

// 技能标签组件
function SkillTags({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return <span className="text-slate-600">-</span>;

  return (
    <div className="flex flex-wrap gap-1 lg:gap-1.5">
      <AnimatePresence>
        {tags.slice(0, 3).map((tag, i) => (
          <motion.span 
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
            className="px-2 lg:px-2.5 py-0.5 lg:py-1 bg-slate-700/50 text-slate-400 rounded-md lg:rounded-lg text-[10px] lg:text-xs font-medium border border-slate-600/30 cursor-default"
          >
            {tag}
          </motion.span>
        ))}
      </AnimatePresence>
      {tags.length > 3 && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-2 lg:px-2.5 py-0.5 lg:py-1 text-slate-500 text-[10px] lg:text-xs font-medium"
        >
          +{tags.length - 3}
        </motion.span>
      )}
    </div>
  );
}

// 分页按钮组件
function PaginationButton({ 
  children, 
  isActive, 
  onClick, 
  disabled 
}: { 
  children: React.ReactNode; 
  isActive?: boolean; 
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div whileHover={!disabled ? { scale: 1.05 } : {}} whileTap={!disabled ? { scale: 0.95 } : {}}>
      <Button
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={isActive 
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-0 rounded-lg lg:rounded-xl h-8 w-8 lg:h-9 lg:w-9 p-0 font-semibold shadow-lg shadow-emerald-500/25 text-xs lg:text-sm' 
          : 'border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg lg:rounded-xl h-8 w-8 lg:h-9 lg:w-9 p-0 font-medium text-xs lg:text-sm'}
      >
        {children}
      </Button>
    </motion.div>
  );
}

export function DataTableSection({ players, isLoading = false }: DataTableSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // 过滤和排序数据
  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...players];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.nickname?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        POSITIONS.find(pos => pos.value === p.position)?.label.toLowerCase().includes(query)
      );
    }
    
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || a.nickname || '').localeCompare(b.name || b.nickname || '');
          break;
        case 'age':
          comparison = (a.age || 0) - (b.age || 0);
          break;
        case 'score':
          comparison = (a.score || 0) - (b.score || 0);
          break;
        case 'position':
          comparison = (a.position || '').localeCompare(b.position || '');
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [players, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedPlayers.length / pageSize);
  const paginatedPlayers = filteredAndSortedPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getPositionLabel = (value: string) => {
    return POSITIONS.find(p => p.value === value)?.label || value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-slate-800/50 border border-slate-700/50 overflow-hidden rounded-2xl backdrop-blur-sm">
        {/* 表格头部工具栏 */}
        <div className="p-3 lg:p-5 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3 lg:gap-4">
          <div className="relative group flex-1 min-w-0 max-w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <Input 
              placeholder="搜索球员、城市、位置..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-8 w-full bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 rounded-lg lg:rounded-xl text-sm
                focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                ×
              </motion.button>
            )}
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
            <motion.div 
              className="flex items-center gap-1.5 lg:gap-2 text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span className="hidden sm:inline">
                共 <span className="text-white font-medium">{filteredAndSortedPlayers.length}</span> 名球员
              </span>
              <span className="sm:hidden">
                <span className="text-white font-medium">{filteredAndSortedPlayers.length}</span> 人
              </span>
            </motion.div>
            
            <motion.select 
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-900/80 border border-slate-700 rounded-lg lg:rounded-xl px-2 lg:px-3 py-1.5 lg:py-2 text-white text-xs lg:text-sm 
                focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 cursor-pointer"
              whileHover={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </motion.select>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {/* 排名 - 移动端缩小 */}
              <col className="w-12 sm:w-12 lg:w-16" style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }} />
              {/* 球员信息 - 自适应宽度 */}
              <col style={{ width: 'auto', minWidth: '140px' }} />
              {/* 年龄 - 移动端隐藏 */}
              <col className="hidden sm:table-column" style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }} />
              {/* 位置 */}
              <col style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }} />
              {/* 评分 */}
              <col style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }} />
              {/* 城市 - 移动端隐藏 */}
              <col className="hidden md:table-column" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }} />
              {/* 技能标签 - 移动端隐藏 */}
              <col className="hidden lg:table-column" style={{ width: 'auto', minWidth: '150px' }} />
            </colgroup>
            <thead className="bg-slate-800/80 text-xs uppercase">
              <tr className="border-b border-slate-700/50">
                {/* 排名 */}
                <th className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 text-left font-semibold tracking-wider text-slate-400 whitespace-nowrap box-border overflow-hidden text-xs lg:text-sm" style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}>
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">排名</span>
                  </div>
                </th>
                {/* 球员信息 */}
                <SortHeader label="球员" field="name" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} width={180} className="lg:w-60" />
                {/* 年龄 - 移动端隐藏 */}
                <SortHeader label="年龄" field="age" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} icon={Calendar} width={60} className="hidden sm:table-cell" />
                {/* 位置 */}
                <SortHeader label="位置" field="position" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} width={80} />
                {/* 评分 */}
                <SortHeader label="评分" field="score" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} icon={Trophy} width={80} />
                {/* 城市 - 移动端隐藏 */}
                <SortHeader label="城市" field="city" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} icon={MapPin} width={100} className="hidden md:table-cell" />
                {/* 技能标签 - 移动端隐藏 */}
                <th className="hidden lg:table-cell px-5 py-4 text-left font-semibold tracking-wider text-slate-400 whitespace-nowrap box-border overflow-hidden text-xs lg:text-sm" style={{ width: 'auto', minWidth: '150px' }}>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">技能标签</span>
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody className="text-xs lg:text-sm">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.tr
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7}>
                      <TableSkeleton />
                    </td>
                  </motion.tr>
                ) : paginatedPlayers.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={7} className="px-5 py-12 lg:py-16 text-center">
                      <motion.div 
                        className="flex flex-col items-center gap-2 lg:gap-3"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                      >
                        <motion.div 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-slate-800 flex items-center justify-center"
                          animate={{ 
                            boxShadow: ['0 0 0 rgba(100, 116, 139, 0)', '0 0 20px rgba(100, 116, 139, 0.2)', '0 0 0 rgba(100, 116, 139, 0)']
                          }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-600" />
                        </motion.div>
                        <p className="text-slate-500 font-medium text-sm">暂无匹配数据</p>
                        <p className="text-xs text-slate-600">请尝试调整搜索条件</p>
                      </motion.div>
                    </td>
                  </motion.tr>
                ) : (
                  paginatedPlayers.map((player, index) => {
                    const rank = (currentPage - 1) * pageSize + index + 1;
                    const isHovered = hoveredRow === player.id;
                    
                    return (
                      <motion.tr
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        onMouseEnter={() => setHoveredRow(player.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className="border-b border-slate-700/30 cursor-pointer group relative"
                      >
                        {/* 排名 */}
                        <td className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 relative box-border overflow-hidden" style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}>
                          {/* Hover glow effect - moved inside first td */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-emerald-500/5 pointer-events-none -left-full -right-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ width: '200vw', left: '-50vw' }}
                          />
                          <RankBadge rank={rank} />
                        </td>

                        {/* 球员信息 */}
                        <td className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 relative box-border overflow-hidden">
                          <PlayerAvatar player={player} rank={rank} />
                        </td>

                        {/* 年龄 - 移动端隐藏 */}
                        <td className="hidden sm:table-cell px-2 lg:px-5 py-3 lg:py-4 text-slate-300 font-medium relative whitespace-nowrap box-border overflow-hidden" style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>
                          {player.age || '-'}<span className="text-slate-500 text-xs">岁</span>
                        </td>

                        {/* 位置 */}
                        <td className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 relative box-border overflow-hidden" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                          <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-md lg:rounded-lg px-1.5 lg:px-2.5 py-0.5 lg:py-1 text-xs font-medium hover:bg-slate-700 transition-colors whitespace-nowrap">
                            {getPositionLabel(player.position || '-').slice(0, 2)}
                          </Badge>
                        </td>

                        {/* 评分 */}
                        <td className="px-2 sm:px-3 lg:px-5 py-3 lg:py-4 relative box-border overflow-hidden" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                          <ScoreBadge score={player.score || 0} />
                        </td>

                        {/* 城市 - 移动端隐藏 */}
                        <td className="hidden md:table-cell px-2 lg:px-5 py-3 lg:py-4 text-slate-300 font-medium relative whitespace-nowrap box-border overflow-hidden" style={{ width: '100px', minWidth: '100px', maxWidth: '100px' }}>
                          {player.city}
                        </td>

                        {/* 技能标签 - 移动端隐藏 */}
                        <td className="hidden lg:table-cell px-5 py-3 lg:py-4 relative box-border overflow-hidden">
                          <SkillTags tags={player.skillTags} />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <AnimatePresence>
          {totalPages > 1 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 lg:p-5 border-t border-slate-700/50 flex items-center justify-between"
            >
              <div className="text-xs lg:text-sm text-slate-500">
                <span className="hidden sm:inline">第 </span>
                <span className="text-white font-medium">{currentPage}</span>
                <span className="hidden sm:inline"> / {totalPages} 页</span>
                <span className="sm:hidden">/{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-1 lg:gap-2">
                <PaginationButton
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </PaginationButton>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationButton
                      key={pageNum}
                      isActive={currentPage === pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationButton>
                  );
                })}
                
                <PaginationButton
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </PaginationButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
