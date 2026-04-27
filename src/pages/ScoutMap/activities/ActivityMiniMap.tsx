import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { ActivityMapPoint, ActivityType } from './types';
import { ACTIVITY_TYPE_CONFIG } from './types';

const CHINA_MAP_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

interface Props {
  points: ActivityMapPoint[];
  onSelectPoint?: (point: ActivityMapPoint) => void;
  highlightedActivityId?: number | null;
  hoveredActivityId?: number | null;
}

// 常见城市经纬度映射（MVP 阶段使用）
const CITY_COORDS: Record<string, [number, number]> = {
  北京: [116.4074, 39.9042], 上海: [121.4737, 31.2304], 广州: [113.2644, 23.1291],
  深圳: [114.0579, 22.5431], 成都: [104.0668, 30.5728], 杭州: [120.1551, 30.2741],
  武汉: [114.3054, 30.5931], 西安: [108.9398, 34.3416], 南京: [118.7969, 32.0603],
  重庆: [106.5516, 29.563], 天津: [117.2009, 39.0842], 苏州: [120.5853, 31.2989],
  长沙: [112.9388, 28.2282], 郑州: [113.6253, 34.7466], 沈阳: [123.4315, 41.8057],
  青岛: [120.3826, 36.0671], 宁波: [121.5509, 29.875], 东莞: [113.7518, 23.0207],
  佛山: [113.1214, 23.0215], 合肥: [117.2272, 31.8206], 昆明: [102.8329, 24.8801],
  大连: [121.6147, 38.914], 厦门: [118.0894, 24.4798], 哈尔滨: [126.535, 45.8038],
  济南: [117.1205, 36.651], 长春: [125.3235, 43.8171], 南宁: [108.3665, 22.817],
  贵阳: [106.6302, 26.6477], 福州: [119.2965, 26.0745], 太原: [112.5489, 37.8706],
  石家庄: [114.5149, 38.0423], 南昌: [115.854, 28.683], 兰州: [103.8343, 36.0611],
  海口: [110.3492, 20.0174], 呼和浩特: [111.7492, 40.8426], 乌鲁木齐: [87.6168, 43.8256],
  银川: [106.2309, 38.4872], 西宁: [101.7782, 36.6171], 拉萨: [91.1409, 29.6456],
};

const getCityCoord = (city: string): [number, number] | null => {
  return CITY_COORDS[city] || null;
};

const getTypeColor = (type: ActivityType) => ACTIVITY_TYPE_CONFIG[type]?.color || '#39ff14';

const ActivityMiniMapInner: React.FC<Props> = ({ points, onSelectPoint, highlightedActivityId, hoveredActivityId }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;
    let mounted = true;

    const init = async () => {
      try {
        const response = await fetch(CHINA_MAP_URL);
        if (!response.ok) throw new Error('地图数据加载失败');
        const chinaJson = await response.json();
        if (!mounted) return;
        echarts.registerMap('china', chinaJson);
        chartInstanceRef.current = echarts.init(chartRef.current);
        setLoaded(true);
      } catch (e) {
        // 失败时静默处理，避免阻塞页面
      }
    };

    init();

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstanceRef.current || !loaded) return;

    const now = new Date().getTime();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    const seriesData = points
      .map((pt) => {
        // 优先使用后端返回的 lat/lng，fallback 到前端映射
        let coord: [number, number] | null = null;
        if (pt.lng && pt.lat) {
          coord = [pt.lng, pt.lat];
        } else {
          coord = getCityCoord(pt.city);
        }
        if (!coord) return null;
        const hasNear = pt.activities.some((a) => new Date(a.startTime).getTime() - now <= threeDays && new Date(a.startTime).getTime() >= now);
        return {
          name: pt.city,
          value: [...coord, pt.count, pt.city, pt.activities.map((a) => a.title).join('、'), hasNear, pt] as any,
        };
      })
      .filter(Boolean) as any[];

    // 高亮标记
    const selectedData = seriesData.filter((d) => {
      const pt = d.value[6] as ActivityMapPoint;
      return highlightedActivityId && pt.activities.some((a) => a.id === highlightedActivityId);
    });

    const hoverData = seriesData.filter((d) => {
      const pt = d.value[6] as ActivityMapPoint;
      return hoveredActivityId && !pt.activities.some((a) => a.id === highlightedActivityId) && pt.activities.some((a) => a.id === hoveredActivityId);
    });

    const baseData = seriesData.filter((d) => {
      const pt = d.value[6] as ActivityMapPoint;
      const isSelected = highlightedActivityId && pt.activities.some((a) => a.id === highlightedActivityId);
      const isHovered = hoveredActivityId && pt.activities.some((a) => a.id === hoveredActivityId);
      return !isSelected && !isHovered;
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [105, 36],
        itemStyle: {
          areaColor: 'rgba(26, 35, 50, 0.6)',
          borderColor: '#2d3748',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: { areaColor: 'rgba(57, 255, 20, 0.15)' },
          label: { show: false },
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        borderColor: '#2d3748',
        borderWidth: 1,
        textStyle: { color: '#f8fafc' },
        formatter: (params: any) => {
          const data = params.data.value;
          const city = data[3];
          const count = data[2];
          const titles = data[4];
          return `<div style="font-size:13px;font-weight:600;margin-bottom:4px;">${city}</div>
                  <div style="font-size:12px;color:#94a3b8;">近期活动 ${count} 场</div>
                  <div style="font-size:11px;color:#64748b;margin-top:4px;max-width:200px;white-space:normal;">${titles}</div>`;
        },
      },
      series: [
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: baseData,
          symbolSize: (val: any) => Math.min(24, 8 + (val[2] || 1) * 3),
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
            period: 4,
          },
          itemStyle: {
            color: (params: any) => {
              const isNear = params.data.value[5];
              return isNear ? '#ff4d4f' : '#39ff14';
            },
            shadowBlur: 10,
            shadowColor: 'rgba(57, 255, 20, 0.5)',
          },
          emphasis: {
            scale: true,
            itemStyle: { shadowBlur: 20, shadowColor: 'rgba(57, 255, 20, 0.8)' },
          },
          zlevel: 1,
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: hoverData,
          symbolSize: 26,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 3.5,
            period: 3,
          },
          itemStyle: {
            color: '#00d4ff',
            shadowBlur: 15,
            shadowColor: 'rgba(0, 212, 255, 0.6)',
          },
          zlevel: 2,
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: selectedData,
          symbolSize: 30,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 4,
            period: 2,
          },
          itemStyle: {
            color: '#fbbf24',
            shadowBlur: 20,
            shadowColor: 'rgba(251, 191, 36, 0.8)',
          },
          zlevel: 3,
        },
      ],
    };

    chartInstanceRef.current.setOption(option, true);

    const handleClick = (params: any) => {
      if (params?.componentType === 'series' && params?.data?.value?.[6]) {
        onSelectPoint?.(params.data.value[6] as ActivityMapPoint);
      }
    };
    chartInstanceRef.current.off('click');
    chartInstanceRef.current.on('click', handleClick);
  }, [points, loaded, highlightedActivityId, hoveredActivityId, onSelectPoint]);

  return <div ref={chartRef} className="w-full h-full min-h-[320px]" />;
};

const ActivityMiniMap = React.memo(ActivityMiniMapInner);
export default ActivityMiniMap;
