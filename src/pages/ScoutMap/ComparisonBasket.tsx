import React, { useMemo } from 'react';
import { ChevronUp, ChevronDown, X, Download, BarChart3 } from 'lucide-react';
import ReactECharts from '../../components/charts/ReactECharts';
import { LazyImage } from '../../components';
import { useScoutMapStore } from './store';

const MAX_PLAYERS = 4;
const COLORS = ['#39ff14', '#00d4ff', '#f59e0b', '#ec4899'];

const ComparisonBasket: React.FC = () => {
  const { selectedPlayers, removePlayerFromCompare, clearCompareBasket, isBasketExpanded, toggleBasketExpanded } = useScoutMapStore();

  const radarOption = useMemo(() => {
    if (selectedPlayers.length < 2) return {};
    return {
      color: COLORS.slice(0, selectedPlayers.length),
      tooltip: {},
      legend: { data: selectedPlayers.map((p) => p.name), textStyle: { color: '#ccc' }, bottom: 0 },
      radar: {
        indicator: [{ name: '速度', max: 100 }, { name: '技术', max: 100 }, { name: '身体', max: 100 }, { name: '战术', max: 100 }, { name: '心理', max: 100 }, { name: '潜力', max: 100 }],
        axisName: { color: '#94a3b8' },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
        splitLine: { lineStyle: { color: '#2d3748' } },
        axisLine: { lineStyle: { color: '#2d3748' } },
      },
      series: [{
        type: 'radar',
        data: selectedPlayers.map((p, i) => ({
          value: [p.score ?? 70, p.score ?? 70, p.score ?? 70, p.score ?? 70, p.score ?? 70, p.score ?? 70],
          name: p.name,
          itemStyle: { color: COLORS[i] },
          areaStyle: { color: COLORS[i], opacity: 0.15 },
          lineStyle: { width: 2 },
        })),
      }],
    };
  }, [selectedPlayers]);

  const handleExport = () => {
    if (selectedPlayers.length === 0) return;
    const headers = ['姓名', '年龄', '位置', '城市', '综合评分', '潜力'];
    const rows = selectedPlayers.map((p) => [p.name, String(p.age), p.position, p.city, String(p.score ?? p.rating ?? ''), p.potential || 'B']);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `球员对比_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed left-0 right-0 z-30 bg-[#111827] border-t border-[#2d3748] shadow-2xl transition-all duration-300 ${isBasketExpanded ? 'bottom-0' : 'bottom-0 translate-y-[calc(100%-48px)]'}`}>
      {/* Collapsed Bar */}
      <button onClick={toggleBasketExpanded} className="w-full h-12 flex items-center justify-between px-4 hover:bg-[#1a2332] transition-colors">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-4 h-4 text-[#39ff14]" />
          <span className="text-sm font-medium text-[#f8fafc]">对比篮</span>
          <span className="text-xs px-2 py-0.5 bg-[#2d3748] text-[#94a3b8] rounded-full">{selectedPlayers.length}/{MAX_PLAYERS}</span>
        </div>
        <div className="flex items-center gap-2 text-[#94a3b8]">
          {isBasketExpanded ? <><span className="text-xs">收起</span><ChevronDown className="w-4 h-4" /></> : <><span className="text-xs">展开对比</span><ChevronUp className="w-4 h-4" /></>}
        </div>
      </button>

      {/* Expanded Content */}
      {isBasketExpanded && (
        <div className="px-4 pb-4 pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-[#94a3b8]">已选择 {selectedPlayers.length} 名球员</div>
            <div className="flex items-center gap-2">
              <button onClick={clearCompareBasket} className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-red-400 transition-colors">清空</button>
              <button onClick={handleExport} disabled={selectedPlayers.length === 0} className="flex items-center gap-1 px-3 py-1.5 bg-[#2d3748] hover:bg-[#3d4758] disabled:opacity-50 disabled:cursor-not-allowed text-[#f8fafc] text-xs rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />导出对比表
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
              const p = selectedPlayers[i];
              return (
                <div key={i} className={`relative p-3 rounded-xl border ${p ? 'bg-[#1a2332] border-[#2d3748]' : 'bg-[#0a0e17] border-dashed border-[#2d3748]'} min-h-[100px] flex flex-col justify-center`}>
                  {p ? (
                    <>
                      <button onClick={() => removePlayerFromCompare(p.id)} className="absolute top-2 right-2 p-1 rounded hover:bg-[#2d3748] text-[#94a3b8]"><X className="w-3.5 h-3.5" /></button>
                      <div className="flex items-center gap-2 mb-2">
                        {p.avatar ? <LazyImage src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover" containerClassName="w-8 h-8" /> : <div className="w-8 h-8 rounded-full bg-[#2d3748] flex items-center justify-center text-xs text-[#f8fafc]">{p.name.charAt(0)}</div>}
                        <div className="text-sm font-medium text-[#f8fafc] truncate pr-4">{p.name}</div>
                      </div>
                      <div className="text-xs text-[#94a3b8]">{p.position} · {p.age}岁</div>
                      <div className="text-xs text-[#94a3b8]">{p.city}</div>
                      <div className="mt-2 text-xs"><span className="text-[#39ff14] font-semibold">{p.score ?? p.rating ?? '—'}</span> <span className="text-[#64748b]">评分</span></div>
                    </>
                  ) : (
                    <div className="text-center text-xs text-[#64748b]">空位</div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPlayers.length >= 2 && (
            <div className="bg-[#1a2332] border border-[#2d3748] rounded-xl p-4">
              <div className="text-sm font-medium text-[#f8fafc] mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#39ff14]" />能力雷达对比</div>
              <div className="h-64"><ReactECharts option={radarOption} style={{ height: '100%' }} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonBasket;
