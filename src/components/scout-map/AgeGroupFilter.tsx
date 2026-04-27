import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface AgeGroupFilterProps {
  selectedAgeGroup: string | null;
  onSelectAgeGroup: (ageGroup: string | null) => void;
  compact?: boolean;
}

export function AgeGroupFilter({
  selectedAgeGroup,
  onSelectAgeGroup,
  compact = false,
}: AgeGroupFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // U系列年龄段定义（当前年份2026）
  const ageGroups = [
    { label: 'U6', minAge: 5, maxAge: 6, birthYears: [2019, 2020] },
    { label: 'U7', minAge: 6, maxAge: 7, birthYears: [2018, 2019] },
    { label: 'U8', minAge: 7, maxAge: 8, birthYears: [2017, 2018] },
    { label: 'U9', minAge: 8, maxAge: 9, birthYears: [2016, 2017] },
    { label: 'U10', minAge: 9, maxAge: 10, birthYears: [2015, 2016] },
    { label: 'U11', minAge: 10, maxAge: 11, birthYears: [2014, 2015] },
    { label: 'U12', minAge: 11, maxAge: 12, birthYears: [2013, 2014] },
    { label: 'U13', minAge: 12, maxAge: 13, birthYears: [2012, 2013] },
    { label: 'U14', minAge: 13, maxAge: 14, birthYears: [2011, 2012] },
    { label: 'U15', minAge: 14, maxAge: 15, birthYears: [2010, 2011] },
    { label: 'U16', minAge: 15, maxAge: 16, birthYears: [2009, 2010] },
    { label: 'U17', minAge: 16, maxAge: 17, birthYears: [2008, 2009] },
    { label: 'U18', minAge: 17, maxAge: 18, birthYears: [2007, 2008] },
  ];

  // 常用组合
  const quickFilters = [
    { label: '全部', value: null },
    { label: 'U6-U8', value: '6-8' },
    { label: 'U9-U12', value: '9-12' },
    { label: 'U13-U18', value: '13-18' },
  ];

  // 紧凑模式显示
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {ageGroups.slice(0, 6).map((group) => (
          <button
            key={group.label}
            onClick={() => onSelectAgeGroup(selectedAgeGroup === group.label ? null : group.label)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedAgeGroup === group.label
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200'
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 快捷筛选 */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => {
              if (filter.value === null) {
                onSelectAgeGroup(null);
              } else {
                // 处理范围选择
                onSelectAgeGroup(filter.value);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedAgeGroup === filter.value
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 展开/收起 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            收起年龄段
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            更多年龄段
          </>
        )}
      </button>

      {/* 完整年龄段列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
              {ageGroups.map((group) => (
                <button
                  key={group.label}
                  onClick={() => onSelectAgeGroup(selectedAgeGroup === group.label ? null : group.label)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    selectedAgeGroup === group.label
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold">{group.label}</span>
                  <span className="text-xs opacity-75">{group.minAge}-{group.maxAge}岁</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 年龄组选择器组件
interface AgeGroupSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function AgeGroupSelector({ value, onChange }: AgeGroupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ageGroups = [
    { label: 'U6', minAge: 5, maxAge: 6 },
    { label: 'U7', minAge: 6, maxAge: 7 },
    { label: 'U8', minAge: 7, maxAge: 8 },
    { label: 'U9', minAge: 8, maxAge: 9 },
    { label: 'U10', minAge: 9, maxAge: 10 },
    { label: 'U11', minAge: 10, maxAge: 11 },
    { label: 'U12', minAge: 11, maxAge: 12 },
    { label: 'U13', minAge: 12, maxAge: 13 },
    { label: 'U14', minAge: 13, maxAge: 14 },
    { label: 'U15', minAge: 14, maxAge: 15 },
    { label: 'U16', minAge: 15, maxAge: 16 },
    { label: 'U17', minAge: 16, maxAge: 17 },
    { label: 'U18', minAge: 17, maxAge: 18 },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:border-slate-600/50 transition-colors w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          {value ? `年龄段: ${value}` : '选择年龄段'}
        </span>
        {value && (
          <Badge
            variant="outline"
            className="ml-2 border-emerald-500/50 text-emerald-400 cursor-pointer hover:bg-emerald-500/10"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            清除
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              <button
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50"
              >
                <Users className="w-4 h-4" />
                全部年龄段
                {value === null && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
              </button>
              {ageGroups.map((group) => (
                <button
                  key={group.label}
                  onClick={() => {
                    onChange(group.label);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50"
                >
                  <span>
                    <span className="font-medium">{group.label}</span>
                    <span className="text-slate-500 ml-2">({group.minAge}-{group.maxAge}岁)</span>
                  </span>
                  {value === group.label && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 计算球员所属年龄组的辅助函数
export function getPlayerAgeGroup(birthYear: number): string {
  const currentYear = 2026;
  const age = currentYear - birthYear;

  if (age >= 5 && age <= 6) return 'U6';
  if (age >= 6 && age <= 7) return 'U7';
  if (age >= 7 && age <= 8) return 'U8';
  if (age >= 8 && age <= 9) return 'U9';
  if (age >= 9 && age <= 10) return 'U10';
  if (age >= 10 && age <= 11) return 'U11';
  if (age >= 11 && age <= 12) return 'U12';
  if (age >= 12 && age <= 13) return 'U13';
  if (age >= 13 && age <= 14) return 'U14';
  if (age >= 14 && age <= 15) return 'U15';
  if (age >= 15 && age <= 16) return 'U16';
  if (age >= 16 && age <= 17) return 'U17';
  if (age >= 17 && age <= 18) return 'U18';
  return '成人';
}

// 辅助函数：根据年龄组筛选球员
export function filterByAgeGroup<T extends { age?: number }>(
  players: T[],
  ageGroup: string | null
): T[] {
  if (!ageGroup) return players;

  const currentYear = 2026;
  const ageGroupMap: Record<string, [number, number]> = {
    'U6': [5, 6],
    'U7': [6, 7],
    'U8': [7, 8],
    'U9': [8, 9],
    'U10': [9, 10],
    'U11': [10, 11],
    'U12': [11, 12],
    'U13': [12, 13],
    'U14': [13, 14],
    'U15': [14, 15],
    'U16': [15, 16],
    'U17': [16, 17],
    'U18': [17, 18],
  };

  // 处理范围选择
  if (ageGroup.includes('-')) {
    const [start, end] = ageGroup.split('-').map(Number);
    return players.filter((p) => {
      if (!p.age) return false;
      return p.age >= start && p.age <= end;
    });
  }

  const range = ageGroupMap[ageGroup];
  if (!range) return players;

  return players.filter((p) => {
    if (!p.age) return false;
    return p.age >= range[0] && p.age <= range[1];
  });
}
