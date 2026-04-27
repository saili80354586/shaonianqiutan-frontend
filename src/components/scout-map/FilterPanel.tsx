import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RotateCcw, Filter } from 'lucide-react';
import type { FilterState } from './types';
import { POSITIONS } from './types';
import { AgeGroupFilter } from './AgeGroupFilter';

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
}

export function FilterPanel({ filters, setFilters, onApply }: FilterPanelProps) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);

  const handleReset = () => {
    setFilters({
      ageRange: [6, 18],
      gender: '',
      foot: '',
      playingYears: [0, 10],
      positions: [],
      heightRange: [100, 200],
      weightRange: [20, 100],
      faRegistered: null,
      club: '',
    });
    setSelectedAgeGroup(null);
  };

  return (
    <div className="space-y-5 p-1">
      {/* 年龄段梯队筛选 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">年龄段筛选</Label>
        <AgeGroupFilter
          selectedAgeGroup={selectedAgeGroup}
          onSelectAgeGroup={(group) => {
            setSelectedAgeGroup(group);
            // 同时更新原有的 ageRange
            if (group === null) {
              setFilters(prev => ({ ...prev, ageRange: [6, 18] }));
            } else if (group === '6-8') {
              setFilters(prev => ({ ...prev, ageRange: [6, 8] }));
            } else if (group === '9-12') {
              setFilters(prev => ({ ...prev, ageRange: [9, 12] }));
            } else if (group === '13-18') {
              setFilters(prev => ({ ...prev, ageRange: [13, 18] }));
            } else {
              // 单一年龄组
              const ageNum = parseInt(group.replace('U', ''));
              setFilters(prev => ({ ...prev, ageRange: [ageNum, ageNum + 1] }));
            }
          }}
          compact
        />
      </div>

      {/* 年龄范围（详细） */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">年龄范围</Label>
          <span className="text-xs text-gray-500">{filters.ageRange[0]} - {filters.ageRange[1]} 岁</span>
        </div>
        <Slider
          value={filters.ageRange}
          onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
          min={6}
          max={18}
          step={1}
          className="w-full"
        />
      </div>

      {/* 性别 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">性别</Label>
        <Select
          value={filters.gender}
          onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部性别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="男">男</SelectItem>
            <SelectItem value="女">女</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 惯用脚 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">惯用脚</Label>
        <Select
          value={filters.foot}
          onValueChange={(value) => setFilters(prev => ({ ...prev, foot: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="左脚">左脚</SelectItem>
            <SelectItem value="右脚">右脚</SelectItem>
            <SelectItem value="双脚">双脚</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 踢球年数 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">踢球年数</Label>
          <span className="text-xs text-gray-500">{filters.playingYears[0]} - {filters.playingYears[1]} 年</span>
        </div>
        <Slider
          value={filters.playingYears}
          onValueChange={(value) => setFilters(prev => ({ ...prev, playingYears: value as [number, number] }))}
          min={0}
          max={15}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* 场上位置 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">场上位置</Label>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.slice(0, 8).map((pos) => (
            <label
              key={pos.value}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={filters.positions.includes(pos.value)}
                onCheckedChange={(checked) => {
                  setFilters(prev => ({
                    ...prev,
                    positions: checked
                      ? [...prev.positions, pos.value]
                      : prev.positions.filter(p => p !== pos.value),
                  }));
                }}
              />
              <span className="text-xs text-gray-700">{pos.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 身高 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">身高范围 (cm)</Label>
          <span className="text-xs text-gray-500">{filters.heightRange[0]} - {filters.heightRange[1]}</span>
        </div>
        <Slider
          value={filters.heightRange}
          onValueChange={(value) => setFilters(prev => ({ ...prev, heightRange: value as [number, number] }))}
          min={100}
          max={200}
          step={1}
          className="w-full"
        />
      </div>

      {/* 体重 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">体重范围 (kg)</Label>
          <span className="text-xs text-gray-500">{filters.weightRange[0]} - {filters.weightRange[1]}</span>
        </div>
        <Slider
          value={filters.weightRange}
          onValueChange={(value) => setFilters(prev => ({ ...prev, weightRange: value as [number, number] }))}
          min={20}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      {/* 足协注册 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">足协注册</Label>
        <Select
          value={filters.faRegistered === null ? '' : filters.faRegistered ? 'yes' : 'no'}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            faRegistered: value === '' ? null : value === 'yes' 
          }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="yes">已注册</SelectItem>
            <SelectItem value="no">未注册</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 所属俱乐部 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">所属俱乐部</Label>
        <Input
          placeholder="输入俱乐部名称"
          value={filters.club}
          onChange={(e) => setFilters(prev => ({ ...prev, club: e.target.value }))}
          className="w-full"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          重置
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          onClick={onApply}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          应用筛选
        </Button>
      </div>
    </div>
  );
}
