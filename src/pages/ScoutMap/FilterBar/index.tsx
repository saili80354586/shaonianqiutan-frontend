import React, { useState, useCallback } from 'react';
import { MapPin, Users, Calendar } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  ageRange: [number, number];
  positions: string[];
  citySearch: string;
}

const POSITIONS = ['前锋', '中场', '后卫', '门将'];

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [6, 18],
    positions: [],
    citySearch: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  const togglePosition = useCallback((position: string) => {
    const newPositions = filters.positions.includes(position)
      ? filters.positions.filter(p => p !== position)
      : [...filters.positions, position];
    updateFilter('positions', newPositions);
  }, [filters.positions, updateFilter]);

  const handleAgeChange = useCallback((value: number, index: number) => {
    const newRange: [number, number] = [...filters.ageRange] as [number, number];
    newRange[index] = value;
    if (newRange[0] <= newRange[1]) {
      updateFilter('ageRange', newRange);
    }
  }, [filters.ageRange, updateFilter]);

  const hasActiveFilters = filters.positions.length > 0 || filters.citySearch || filters.ageRange[0] !== 6 || filters.ageRange[1] !== 18;

  return (
    <div className="bg-[#1a1f2e] border-b border-[#2d3748] p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* 年龄范围 */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-[#94a3b8]">年龄</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={6}
              max={18}
              value={filters.ageRange[0]}
              onChange={(e) => handleAgeChange(Number(e.target.value), 0)}
              className="w-20 h-1 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
            />
            <span className="text-sm text-[#f8fafc] w-8">{filters.ageRange[0]}-{filters.ageRange[1]}岁</span>
            <input
              type="range"
              min={6}
              max={18}
              value={filters.ageRange[1]}
              onChange={(e) => handleAgeChange(Number(e.target.value), 1)}
              className="w-20 h-1 bg-[#2d3748] rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
            />
          </div>
        </div>

        {/* 位置选择 */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-[#94a3b8]">位置</span>
          <div className="flex gap-1">
            {POSITIONS.map((position) => (
              <button
                key={position}
                onClick={() => togglePosition(position)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  filters.positions.includes(position)
                    ? 'bg-[#39ff14] text-[#0a0e17] font-medium'
                    : 'bg-[#2d3748] text-[#94a3b8] hover:bg-[#3d4758]'
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </div>

        {/* 城市搜索 */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm text-[#94a3b8]">城市</span>
          <input
            type="text"
            value={filters.citySearch}
            onChange={(e) => updateFilter('citySearch', e.target.value)}
            placeholder="输入城市名称"
            className="px-3 py-1 text-sm bg-[#0a0e17] border border-[#2d3748] rounded text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#39ff14] w-32"
          />
        </div>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilters({
                ageRange: [6, 18],
                positions: [],
                citySearch: ''
              });
              onFilterChange({
                ageRange: [6, 18],
                positions: [],
                citySearch: ''
              });
            }}
            className="px-3 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
