import React, { useEffect, useRef, useState } from 'react';
import * as echarts from '../../lib/echarts';
import { Users, MapPin, Calendar, Star, TrendingUp, Globe, X, ChevronUp } from 'lucide-react';
import { scoutMapApi } from '../../services/api';

interface DashboardData {
  totalPlayers: number;
  totalProvinces: number;
  avgAge: number;
  avgScore: number;
  monthlyNew: number;
  regionDistribution: { name: string; value: number }[];
  ageDistribution: { name: string; value: number }[];
  positionDistribution: { name: string; value: number }[];
  scoreRanking: { name: string; value: number }[];
  growthTrend: { name: string; value: number }[];
}

const KPI_CONFIG = [
  { key: 'totalPlayers', label: '总入驻球员', icon: Users, color: '#39ff14' },
  { key: 'totalProvinces', label: '覆盖省份', icon: MapPin, color: '#00d4ff' },
  { key: 'avgAge', label: '平均年龄', icon: Calendar, color: '#ff6b35' },
  { key: 'avgScore', label: '平均综合评分', icon: Star, color: '#fbbf24' },
  { key: 'monthlyNew', label: '月度新增球员', icon: TrendingUp, color: '#a855f7' },
];

const formatValue = (key: string, value: number) => {
  if (key === 'avgAge' || key === 'avgScore') return value.toFixed(1);
  return value.toLocaleString();
};

const useEChart = (containerRef: React.RefObject<HTMLDivElement | null>, option: echarts.EChartsOption) => {
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
      const handleResize = () => chartRef.current?.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chartRef.current?.dispose();
        chartRef.current = null;
      };
    }
  }, [containerRef]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(option, true);
    }
  }, [option]);
};

const commonChartOptions: Partial<echarts.EChartsOption> = {
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    borderColor: '#2d3748',
    borderWidth: 1,
    textStyle: { color: '#f8fafc' },
  },
  grid: { left: '12%', right: '8%', bottom: '12%', top: '15%' },
};

const RegionChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const option: echarts.EChartsOption = {
    ...commonChartOptions,
    tooltip: { trigger: 'item', backgroundColor: 'rgba(10, 14, 23, 0.95)', borderColor: '#2d3748', textStyle: { color: '#f8fafc' } },
    grid: { left: '5%', right: '5%', bottom: '5%', top: '5%' },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name).reverse(),
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value).reverse(),
      itemStyle: {
        color: new (echarts as any).graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(57, 255, 20, 0.3)' },
          { offset: 1, color: '#39ff14' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      barWidth: 12,
      label: { show: true, position: 'right', color: '#f8fafc', fontSize: 11, formatter: '{c}' },
    }],
  };
  useEChart(ref, option);
  return <div ref={ref} className="h-full w-full" />;
};

const AgeChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const option: echarts.EChartsOption = {
    ...commonChartOptions,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10, 14, 23, 0.95)', borderColor: '#2d3748', textStyle: { color: '#f8fafc' } },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0 },
      axisLine: { lineStyle: { color: '#2d3748' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2332' } },
    },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value),
      itemStyle: {
        color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00d4ff' },
          { offset: 1, color: 'rgba(0, 212, 255, 0.2)' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: '60%',
    }],
  };
  useEChart(ref, option);
  return <div ref={ref} className="h-full w-full" />;
};

const PositionChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(10, 14, 23, 0.95)', borderColor: '#2d3748', textStyle: { color: '#f8fafc' } },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#0a0e17', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#f8fafc' } },
      data: data.map((d, i) => ({
        ...d,
        itemStyle: { color: ['#39ff14', '#00d4ff', '#ff6b35', '#fbbf24'][i % 4] },
      })),
    }],
  };
  useEChart(ref, option);
  return <div ref={ref} className="h-full w-full" />;
};

const ScoreChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const option: echarts.EChartsOption = {
    ...commonChartOptions,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10, 14, 23, 0.95)', borderColor: '#2d3748', textStyle: { color: '#f8fafc' } },
    grid: { left: '5%', right: '5%', bottom: '5%', top: '5%' },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name).reverse(),
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value).reverse(),
      itemStyle: {
        color: new (echarts as any).graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(251, 191, 36, 0.3)' },
          { offset: 1, color: '#fbbf24' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      barWidth: 16,
      label: { show: true, position: 'right', color: '#f8fafc', fontSize: 11, formatter: '{c}' },
    }],
  };
  useEChart(ref, option);
  return <div ref={ref} className="h-full w-full" />;
};

const GrowthChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);
  const option: echarts.EChartsOption = {
    ...commonChartOptions,
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10, 14, 23, 0.95)', borderColor: '#2d3748', textStyle: { color: '#f8fafc' } },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.name),
      axisLabel: { color: '#94a3b8', fontSize: 10, interval: 2 },
      axisLine: { lineStyle: { color: '#2d3748' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a2332' } },
    },
    series: [{
      type: 'line',
      data: data.map((d) => d.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#a855f7', width: 2 },
      itemStyle: { color: '#a855f7' },
      areaStyle: {
        color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(168, 85, 247, 0.4)' },
          { offset: 1, color: 'rgba(168, 85, 247, 0.05)' },
        ]),
      },
    }],
  };
  useEChart(ref, option);
  return <div ref={ref} className="h-full w-full" />;
};

interface DashboardSectionProps {
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ onClose, variant = 'modal' }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    scoutMapApi.getDashboardStats()
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          setData(res.data.data);
        }
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const content = (
    <>
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 space-y-3">
                <div className="h-8 bg-[#1a2332] rounded w-8 mx-auto animate-pulse" />
                <div className="h-6 bg-[#1a2332] rounded w-16 mx-auto animate-pulse" />
                <div className="h-3 bg-[#1a2332] rounded w-20 mx-auto animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 h-64 animate-pulse" />
            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 h-64 animate-pulse" />
          </div>
        </div>
      )}

      {!loading && !data && (
        <div className="text-center text-[#94a3b8]">暂无数据</div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 md:mb-10">
            {KPI_CONFIG.map((kpi) => {
              const Icon = kpi.icon;
              const value = (data as any)[kpi.key];
              return (
                <div
                  key={kpi.key}
                  className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 text-center transition-all hover:border-[#39ff14] hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(57,255,20,0.1)]"
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: kpi.color }} />
                  <div className="text-2xl font-bold mb-1" style={{ color: kpi.color }}>
                    {formatValue(kpi.key, value)}
                  </div>
                  <div className="text-xs text-[#94a3b8]">{kpi.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14] transition-all">
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#39ff14]" /> 地区分布分析
              </h3>
              <div className="h-48">
                <RegionChart data={data.regionDistribution} />
              </div>
            </div>

            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14] transition-all">
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00d4ff]" /> 年龄结构分析
              </h3>
              <div className="h-48">
                <AgeChart data={data.ageDistribution} />
              </div>
            </div>

            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14] transition-all">
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ff6b35]" /> 位置分布分析
              </h3>
              <div className="h-48">
                <PositionChart data={data.positionDistribution} />
              </div>
            </div>

            <div className="bg-[#111827] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14] transition-all">
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#fbbf24]" /> 评分排名分析
              </h3>
              <div className="h-48">
                <ScoreChart data={data.scoreRanking} />
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-2 bg-[#111827] border border-[#2d3748] rounded-xl p-4 hover:border-[#39ff14] transition-all">
              <h3 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#a855f7]" /> 成长趋势分析
              </h3>
              <div className="h-48">
                <GrowthChart data={data.growthTrend} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  if (variant === 'embedded') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] flex items-center gap-3 mb-2">
              <Globe className="w-7 h-7 text-[#39ff14]" />
              平台数据洞察
            </h2>
            <p className="text-[#94a3b8]">全方位分析青少年足球人才分布与发展趋势</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex items-center gap-1 px-3 py-2 bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] rounded-lg text-[#94a3b8] transition-colors">
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm">返回顶部</span>
            </button>
          )}
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e17]/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-10 md:py-14 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#f8fafc] flex items-center gap-3 mb-2">
                <Globe className="w-7 h-7 text-[#39ff14]" />
                数据看板
              </h2>
              <p className="text-[#94a3b8]">全方位分析青少年足球人才分布与发展趋势</p>
            </div>
            <button onClick={onClose} className="p-2 bg-[#1a2332] hover:bg-[#243042] border border-[#2d3748] rounded-lg transition-colors">
              <X className="w-6 h-6 text-[#94a3b8]" />
            </button>
          </div>
          {content}
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
