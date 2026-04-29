import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as echarts from '../../lib/echarts';
import type { Level, ProvinceStats, Player, MapLayer, EntityLayer } from './data';
import { getLayerValue, LAYER_CONFIG, ENTITY_LAYER_CONFIG, ENTITY_LAYER_LABELS } from './data';

interface MapContainerProps {
  level: Level;
  province: string | null;
  city: string | null;
  stats: Record<string, ProvinceStats>;
  layer: MapLayer;
  entityLayer?: EntityLayer;
  onSelectProvince: (name: string) => void;
  onSelectCity: (name: string) => void;
  onSelectPlayer: (player: Player) => void;
  onBrushSelectPlayers?: (players: Player[]) => void;
  onHoverRegion?: (region: { name: string; level: Level } | null) => void;
}

const CHINA_MAP_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

// 省份名称反向映射（中文 -> 拼音用于DataV）
const PROVINCE_CODE_MAP: Record<string, string> = {
  '北京市': '110000', '天津市': '120000', '上海市': '310000', '重庆市': '500000',
  '河北省': '130000', '山西省': '140000', '辽宁省': '210000', '吉林省': '220000',
  '黑龙江省': '230000', '江苏省': '320000', '浙江省': '330000', '安徽省': '340000',
  '福建省': '350000', '江西省': '360000', '山东省': '370000', '河南省': '410000',
  '湖北省': '420000', '湖南省': '430000', '广东省': '440000', '海南省': '460000',
  '四川省': '510000', '贵州省': '520000', '云南省': '530000', '陕西省': '610000',
  '甘肃省': '620000', '青海省': '630000', '台湾省': '710000', '内蒙古自治区': '150000',
  '广西壮族自治区': '450000', '西藏自治区': '540000', '宁夏回族自治区': '640000',
  '新疆维吾尔自治区': '650000', '香港特别行政区': '810000', '澳门特别行政区': '820000'
};

interface EChartParams {
  name?: string;
  value?: number | string;
  data?: Record<string, unknown>;
  componentType?: string;
  color?: string;
  seriesName?: string;
}

interface EChartEventParams {
  componentType?: string;
  name?: string;
  data?: Record<string, unknown>;
}

const echartsLib = echarts as typeof echarts & {
  graphic: {
    LinearGradient: new (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      stops: { offset: number; color: string }[]
    ) => unknown;
  };
};

const MapContainer: React.FC<MapContainerProps> = ({
  level,
  province,
  city,
  stats,
  layer,
  entityLayer = 'players',
  onSelectProvince,
  onSelectCity,
  onSelectPlayer,
  onBrushSelectPlayers,
  onHoverRegion
}) => {
  const layerLabels = ENTITY_LAYER_LABELS[entityLayer];
  const layerColor = ENTITY_LAYER_CONFIG[entityLayer].color;
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const mapDataRef = useRef<unknown>(null);
  const [chartReady, setChartReady] = useState(0);

  // GeoJSON 缓存（懒加载优化）
  const geoJsonCacheRef = useRef<Record<string, unknown>>({});

  // 初始化地图（懒加载全国 GeoJSON）
  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;
    const chartEl = mapRef.current;
    const handleResize = () => chartRef.current?.resize();

    const initMap = async () => {
      try {
        // 仅在需要全国视图时加载全国 GeoJSON
        if (level === 'country' && !geoJsonCacheRef.current['china']) {
          const response = await fetch(CHINA_MAP_URL);
          if (!response.ok) throw new Error('地图数据加载失败');
          const chinaJson = await response.json();
          if (!mounted) return;
          echarts.registerMap('china', chinaJson);
          geoJsonCacheRef.current['china'] = chinaJson;
          mapDataRef.current = chinaJson;
        }

        if (!mounted) return;

        if (!chartRef.current) {
          chartRef.current = echarts.init(chartEl);
          window.addEventListener('resize', handleResize);
        }

        setChartReady((version) => version + 1);
      } catch (error) {
        console.error('地图加载失败:', error);
        if (mounted && mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;color:#64748b;padding:20px;text-align:center;">
              <div style="width:48px;height:48px;border-radius:50%;border:2px solid #f59e0b;color:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;margin-bottom:16px;">!</div>
              <div style="font-size:1.1rem;margin-bottom:8px;">地图数据加载失败</div>
              <div style="font-size:0.9rem;color:#94a3b8;">请检查网络连接后刷新页面重试</div>
            </div>
          `;
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [level]);

  // 渲染全国地图
  const renderCountryMap = useCallback(() => {
    if (!chartRef.current) return;

    const layerConfig = LAYER_CONFIG[layer];
    // 统一使用 GeoJSON feature name（带后缀）作为 mapData name，确保 ECharts 正确匹配
    const mapData = Object.keys(PROVINCE_CODE_MAP).map(geoName => {
      const stripped = geoName.replace(/市|省|自治区|特别行政区|壮族|回族|维吾尔$/g, '');
      const s = stats[geoName] || stats[stripped];
      if (s) {
        return {
          ...s,
          name: geoName,
          value: getLayerValue(s, layer),
          rawCount: s.count
        };
      }
      return {
        name: geoName,
        value: 0,
        rawCount: 0,
        count: 0,
        positions: { '前锋': 0, '中场': 0, '后卫': 0, '门将': 0 },
        cities: {}
      };
    });

    const values = mapData.map(d => d.value as number).filter(v => v > 0);
    const maxValue = values.length > 0 ? Math.max(...values) : 100;

    const isMobileView = window.innerWidth < 768;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 300,
      animationDurationUpdate: 400,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        borderColor: '#2d3748',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 12 : 14 },
        formatter: (params: unknown) => {
          const p = params as EChartParams;
          if (p.value === 0) {
            return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div><div style="color:#64748b;">暂无${layerLabels.entityName}数据</div>`;
          }
          const rawCount = (p.data?.rawCount as number | undefined) ?? p.value;
          const avgScore = (p.data?.avgScore as number | undefined) ?? 0;
          const newPlayerCount30d = (p.data?.newPlayerCount30d as number | undefined) ?? 0;
          const reportCoverageRate = (p.data?.reportCoverageRate as number | undefined) ?? 0;
          const clubCount = (p.data?.clubCount as number | undefined) ?? 0;
          const positions = (p.data?.positions as Record<string, number> | undefined) || {};
          const cityCount = Object.keys((p.data?.cities as Record<string, unknown> | undefined) || {}).length;
          const totalPos = Object.values(positions).reduce((a, b) => a + (b as number), 0);
          const posColors: Record<string, string> = { '前锋': '#ef4444', '中场': '#3b82f6', '后卫': '#10b981', '门将': '#f59e0b' };
          let posBars = '';
          if (totalPos > 0) {
            let offset = 0;
            posBars = Object.entries(positions).map(([pos, cnt]) => {
              const pct = ((cnt as number) / totalPos) * 100;
              const bar = `<div style="position:absolute;left:${offset}%;width:${pct}%;height:100%;background:${posColors[pos] || '#94a3b8'};"></div>`;
              offset += pct;
              return bar;
            }).join('');
          }
          let html = `<div style="min-width:200px;">` +
            `<div style="font-weight:600;margin-bottom:8px;font-size:1.05rem;">${p.name}</div>` +
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">` +
            `<span style="color:${layerConfig.colorEnd};font-weight:700;font-size:1.2rem;">${p.value}</span>` +
            `<span style="color:#94a3b8;">${layerConfig.label}</span></div>`;
          if (entityLayer === 'all') {
            const playerCount = (p.data?.playerCount as number | undefined) ?? 0;
            const coachCount = (p.data?.coachCount as number | undefined) ?? 0;
            const analystCount = (p.data?.analystCount as number | undefined) ?? 0;
            const scoutCount = (p.data?.scoutCount as number | undefined) ?? 0;
            html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.85rem;color:#94a3b8;margin-bottom:8px;">` +
              `<div>球员：<span style="color:#39ff14;font-weight:500;">${playerCount}</span></div>` +
              `<div>俱乐部：<span style="color:#00d4ff;font-weight:500;">${clubCount}</span></div>` +
              `<div>教练：<span style="color:#fbbf24;font-weight:500;">${coachCount}</span></div>` +
              `<div>分析师：<span style="color:#a78bfa;font-weight:500;">${analystCount}</span></div>` +
              `<div>球探：<span style="color:#f472b6;font-weight:500;">${scoutCount}</span></div>` +
              `<div>入驻城市：<span style="color:#f8fafc;font-weight:500;">${cityCount}</span></div>` +
              `</div>`;
          } else {
            html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.85rem;color:#94a3b8;margin-bottom:8px;">` +
              `<div>${layerLabels.countLabel}：<span style="color:#f8fafc;font-weight:500;">${rawCount}</span></div>` +
              `<div>入驻城市：<span style="color:#f8fafc;font-weight:500;">${cityCount}</span></div>` +
              `<div>入驻俱乐部：<span style="color:#f8fafc;font-weight:500;">${clubCount}</span></div>` +
              `<div>${layerLabels.avgScoreLabel}：<span style="color:#f8fafc;font-weight:500;">${avgScore ? avgScore.toFixed(1) : '—'}</span></div>` +
              `<div>月新增：<span style="color:#f8fafc;font-weight:500;">${newPlayerCount30d}</span></div>` +
              `<div>报告覆盖：<span style="color:#f8fafc;font-weight:500;">${reportCoverageRate ? reportCoverageRate + '%' : '—'}</span></div>` +
              `</div>`;
          }
          if (layerLabels.showPositions) {
            html += `<div style="margin-bottom:4px;font-size:0.8rem;color:#64748b;">位置分布</div>` +
              `<div style="position:relative;height:8px;border-radius:4px;overflow:hidden;background:#1a2332;">${posBars || '<div style="height:100%;background:#2d3748;"></div>'}</div>`;
          }
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #2d3748;font-size:0.85rem;color:#64748b;display:flex;align-items:center;gap:4px;">` +
            `<span style="color:${layerColor};">&#128161;</span> 点击下钻查看城市分布` +
            `</div>` +
            `</div>`;
          return html;
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        bottom: 'bottom',
        show: false,
        inRange: {
          color: [layerConfig.colorStart, layerConfig.colorEnd]
        }
      },
      series: [{
        name: `${layerLabels.entityName}分布`,
        type: 'map',
        map: 'china',
        roam: true,
        zoom: isMobileView ? 1.0 : 1.2,
        center: isMobileView ? [105, 34] : [105, 36],
        label: {
          show: !isMobileView,
          color: '#f8fafc',
          fontSize: isMobileView ? 9 : 10
        },
        emphasis: {
          label: { show: true, color: '#0a0e17', fontWeight: 'bold', fontSize: isMobileView ? 10 : 12 },
          itemStyle: {
            areaColor: layerConfig.colorEnd,
            shadowBlur: isMobileView ? 10 : 20,
            shadowColor: `${layerConfig.colorEnd}80`
          }
        },
        itemStyle: {
          areaColor: layerConfig.colorStart,
          borderColor: '#2d3748',
          borderWidth: isMobileView ? 0.5 : 1
        },
        select: {
          itemStyle: { areaColor: layerConfig.colorEnd },
          label: { color: '#0a0e17' }
        },
        data: mapData
      }]
    };

    chartRef.current.setOption(option, true);

    // 绑定点击事件：将 GeoJSON 省份名映射回 stats 中的 key
    chartRef.current.off('click');
    chartRef.current.on('click', (params: unknown) => {
      const p = params as EChartEventParams;
      if (p.componentType === 'series' && p.name) {
        const geoName = p.name as string;
        if (stats[geoName]) {
          onSelectProvince(geoName);
        } else {
          // GeoJSON 名称带后缀（如"上海市"），stats key 可能不带（如"上海"）
          const stripped = geoName.replace(/市|省|自治区|特别行政区|壮族|回族|维吾尔$/g, '');
          if (stats[stripped]) {
            onSelectProvince(stripped);
          }
        }
      }
    });
    // 绑定悬停事件：将 GeoJSON 省份名映射回 stats 中的 key
    chartRef.current.off('mouseover');
    chartRef.current.on('mouseover', (params: unknown) => {
      const p = params as EChartEventParams;
      if (p.componentType === 'series' && p.name) {
        const geoName = p.name as string;
        const stripped = geoName.replace(/市|省|自治区|特别行政区|壮族|回族|维吾尔$/g, '');
        const statsName = stats[geoName] ? geoName : (stats[stripped] ? stripped : geoName);
        onHoverRegion?.({ name: statsName, level: 'country' });
      }
    });
    chartRef.current.off('mouseout');
    chartRef.current.on('mouseout', () => {
      onHoverRegion?.(null);
    });
  }, [stats, layer, onSelectProvince, onHoverRegion]);

  // 渲染省份地图（带城市边界）
  const renderProvinceMap = useCallback((provinceName: string) => {
    if (!chartRef.current) return;

    const provinceData = stats[provinceName];
    if (!provinceData) return;

    const layerConfig = LAYER_CONFIG[layer];
    const cityEntries = Object.entries(provinceData.cities);

    // 构建地图数据：同时保留原名和加"市"后缀的变体，以匹配 GeoJSON feature name
    const mapData = cityEntries.flatMap(([cityName, cityStats]) => {
      const base = {
        ...cityStats,
        value: getLayerValue(cityStats, layer),
        rawCount: cityStats.count
      };
      const variants = [{ ...base, name: cityName }];
      if (!cityName.endsWith('市') && !cityName.endsWith('盟') && !cityName.endsWith('州')) {
        variants.push({ ...base, name: cityName + '市' });
      }
      return variants;
    });

    const values = mapData.map(d => d.value as number).filter(v => v > 0);
    const maxValue = values.length > 0 ? Math.max(...values) : 100;
    const isMobileView = window.innerWidth < 768;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 300,
      animationDurationUpdate: 400,
      title: {
        text: provinceName,
        subtext: entityLayer === 'all'
          ? `共 ${provinceData.count} 个实体 · 点击下钻到城市`
          : `共 ${provinceData.count} 名球员 · ${layerConfig.label} · 点击下钻到城市`,
        left: 'center',
        top: isMobileView ? 10 : 20,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 18 : 24, fontWeight: 'bold' },
        subtextStyle: { color: '#94a3b8', fontSize: isMobileView ? 12 : 14 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        borderColor: '#2d3748',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 12 : 14 },
        formatter: (params: unknown) => {
          const p = params as EChartParams;
          if (p.value === 0) {
            return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div><div style="color:#64748b;">暂无${layerLabels.entityName}数据</div>`;
          }
          const rawCount = (p.data?.rawCount as number | undefined) ?? p.value;
          const avgScore = (p.data?.avgScore as number | undefined) ?? 0;
          const newPlayerCount30d = (p.data?.newPlayerCount30d as number | undefined) ?? 0;
          const reportCoverageRate = (p.data?.reportCoverageRate as number | undefined) ?? 0;
          const clubCount = (p.data?.clubCount as number | undefined) ?? 0;
          const coachCount = (p.data?.coachCount as number | undefined) ?? 0;
          const analystCount = (p.data?.analystCount as number | undefined) ?? 0;
          const scoutCount = (p.data?.scoutCount as number | undefined) ?? 0;
          const playerCount = (p.data?.playerCount as number | undefined) ?? 0;
          const positions = (p.data?.positions as Record<string, number> | undefined) || {};
          const totalPos = Object.values(positions).reduce((a, b) => a + (b as number), 0);
          const posColors: Record<string, string> = { '前锋': '#ef4444', '中场': '#3b82f6', '后卫': '#10b981', '门将': '#f59e0b' };
          let posBars = '';
          if (totalPos > 0) {
            let offset = 0;
            posBars = Object.entries(positions).map(([pos, cnt]) => {
              const pct = ((cnt as number) / totalPos) * 100;
              const bar = `<div style="position:absolute;left:${offset}%;width:${pct}%;height:100%;background:${posColors[pos] || '#94a3b8'};"></div>`;
              offset += pct;
              return bar;
            }).join('');
          }
          let html = `<div style="min-width:200px;">` +
            `<div style="font-weight:600;margin-bottom:8px;font-size:1.05rem;">${p.name}</div>` +
            `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">` +
            `<span style="color:${layerConfig.colorEnd};font-weight:700;font-size:1.2rem;">${p.value}</span>` +
            `<span style="color:#94a3b8;">${layerConfig.label}</span></div>`;
          if (entityLayer === 'all') {
            html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.85rem;color:#94a3b8;margin-bottom:8px;">` +
              `<div>球员：<span style="color:#39ff14;font-weight:500;">${playerCount}</span></div>` +
              `<div>俱乐部：<span style="color:#00d4ff;font-weight:500;">${clubCount}</span></div>` +
              `<div>教练：<span style="color:#fbbf24;font-weight:500;">${coachCount}</span></div>` +
              `<div>分析师：<span style="color:#a78bfa;font-weight:500;">${analystCount}</span></div>` +
              `<div>球探：<span style="color:#f472b6;font-weight:500;">${scoutCount}</span></div>` +
              `</div>`;
          } else {
            html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.85rem;color:#94a3b8;margin-bottom:8px;">` +
              `<div>${layerLabels.countLabel}：<span style="color:#f8fafc;font-weight:500;">${rawCount}</span></div>` +
              `<div>入驻俱乐部：<span style="color:#f8fafc;font-weight:500;">${clubCount}</span></div>` +
              `<div>${layerLabels.avgScoreLabel}：<span style="color:#f8fafc;font-weight:500;">${avgScore ? avgScore.toFixed(1) : '—'}</span></div>` +
              `<div>月新增：<span style="color:#f8fafc;font-weight:500;">${newPlayerCount30d}</span></div>` +
              `<div>报告覆盖：<span style="color:#f8fafc;font-weight:500;">${reportCoverageRate ? reportCoverageRate + '%' : '—'}</span></div>` +
              `</div>`;
          }
          if (layerLabels.showPositions) {
            html += `<div style="margin-bottom:4px;font-size:0.8rem;color:#64748b;">位置分布</div>` +
              `<div style="position:relative;height:8px;border-radius:4px;overflow:hidden;background:#1a2332;">${posBars || '<div style="height:100%;background:#2d3748;"></div>'}</div>`;
          }
          html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #2d3748;font-size:0.85rem;color:#64748b;display:flex;align-items:center;gap:4px;">` +
            `<span style="color:${layerColor};">&#128161;</span> 点击下钻查看详情` +
            `</div>` +
            `</div>`;
          return html;
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        bottom: 'bottom',
        show: false,
        inRange: { color: [layerConfig.colorStart, layerConfig.colorEnd] }
      },
      series: [{
        name: `${layerLabels.entityName}分布`,
        type: 'map',
        map: provinceName,
        roam: true,
        zoom: isMobileView ? 0.8 : 1.0,
        label: {
          show: !isMobileView,
          color: '#f8fafc',
          fontSize: isMobileView ? 9 : 10
        },
        emphasis: {
          label: { show: true, color: '#0a0e17', fontWeight: 'bold', fontSize: isMobileView ? 10 : 12 },
          itemStyle: {
            areaColor: layerConfig.colorEnd,
            shadowBlur: isMobileView ? 10 : 20,
            shadowColor: `${layerConfig.colorEnd}80`
          }
        },
        itemStyle: {
          areaColor: layerConfig.colorStart,
          borderColor: '#2d3748',
          borderWidth: isMobileView ? 0.5 : 1
        },
        select: {
          itemStyle: { areaColor: layerConfig.colorEnd },
          label: { color: '#0a0e17' }
        },
        data: mapData
      }]
    };

    chartRef.current.setOption(option, true);

    // 绑定点击事件：将 GeoJSON 城市名映射回数据中的城市名
    chartRef.current.off('click');
    chartRef.current.on('click', (params: unknown) => {
      const p = params as EChartEventParams;
      if (p.componentType === 'series' && p.name) {
        const geoName = p.name as string;
        const cityName = Object.keys(provinceData.cities).find(c =>
          c === geoName || c + '市' === geoName || c === geoName + '市'
        );
        if (cityName) {
          onSelectCity(cityName);
        }
      }
    });
    // 绑定悬停事件
    chartRef.current.off('mouseover');
    chartRef.current.on('mouseover', (params: unknown) => {
      const p = params as EChartEventParams;
      if (p.componentType === 'series' && p.name) {
        onHoverRegion?.({ name: p.name as string, level: 'province' });
      }
    });
    chartRef.current.off('mouseout');
    chartRef.current.on('mouseout', () => {
      onHoverRegion?.(null);
    });
  }, [stats, layer, entityLayer, onSelectCity, onHoverRegion]);

  // 渲染省份柱状图（GeoJSON 加载失败时降级）
  const renderProvinceChart = useCallback((provinceName: string) => {
    if (!chartRef.current) return;

    const provinceData = stats[provinceName];
    if (!provinceData) return;

    const layerConfig = LAYER_CONFIG[layer];
    const cityList = Object.entries(provinceData.cities)
      .map(([cityName, cityStats]) => ({
        ...cityStats,
        name: cityName,
        value: getLayerValue(cityStats, layer),
        rawCount: cityStats.count
      }))
      .sort((a, b) => b.value - a.value);

    const isMobileView = window.innerWidth < 768;
    const isAllLayer = entityLayer === 'all';

    const stackSeries = isAllLayer ? [
      { key: 'playerCount', label: '球员', color: '#39ff14' },
      { key: 'clubCount', label: '俱乐部', color: '#00d4ff' },
      { key: 'coachCount', label: '教练', color: '#fbbf24' },
      { key: 'analystCount', label: '分析师', color: '#a78bfa' },
      { key: 'scoutCount', label: '球探', color: '#f472b6' },
    ] : [];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 300,
      animationDurationUpdate: 400,
      title: {
        text: provinceName,
        subtext: isAllLayer
          ? `共 ${provinceData.count} 个实体`
          : `共 ${provinceData.count} 名球员 · ${layerConfig.label}`,
        left: 'center',
        top: isMobileView ? 10 : 20,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 18 : 24, fontWeight: 'bold' },
        subtextStyle: { color: '#94a3b8', fontSize: isMobileView ? 12 : 14 }
      },
      tooltip: {
        trigger: isAllLayer ? 'axis' : 'item',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        borderColor: '#2d3748',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 12 : 14 },
        formatter: (params: unknown) => {
          if (isAllLayer && Array.isArray(params)) {
            const arr = params as EChartParams[];
            const name = arr[0]?.name || '';
            let html = `<div style="font-weight:600;margin-bottom:4px;">${name}</div>`;
            let total = 0;
            arr.forEach((p) => {
              const val = Number(p.value) || 0;
              if (val > 0) {
                total += val;
                html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">` +
                  `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color};"></span>` +
                  `<span style="color:#94a3b8;font-size:0.85rem;">${p.seriesName}：</span>` +
                  `<span style="color:#f8fafc;font-weight:500;">${val}</span>` +
                  `</div>`;
              }
            });
            html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #2d3748;font-size:0.85rem;color:#94a3b8;">总计：<span style="color:#f8fafc;font-weight:500;">${total}</span></div>`;
            return html;
          }
          const p = params as EChartParams;
          return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div>` +
            `<div style="color:${layerConfig.colorEnd};font-weight:700;">${p.value}</div>` +
            `<div style="color:#94a3b8;font-size:0.85rem;">${layerConfig.label}</div>` +
            `<div style="margin-top:4px;font-size:0.8rem;color:#64748b;">${layerLabels.countLabel}：${(p.data?.rawCount as number | undefined) || 0} ${layerLabels.unitLabel}</div>`;
        }
      },
      legend: isAllLayer ? {
        data: stackSeries.map(s => s.label),
        bottom: isMobileView ? 5 : 10,
        textStyle: { color: '#94a3b8', fontSize: isMobileView ? 10 : 12 },
        itemWidth: 12,
        itemHeight: 12,
      } : undefined,
      grid: {
        left: isMobileView ? '5%' : '10%',
        right: isMobileView ? '5%' : '10%',
        bottom: isAllLayer ? (isMobileView ? '18%' : '12%') : (isMobileView ? '20%' : '15%'),
        top: isMobileView ? '20%' : '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: cityList.map(c => c.name.replace(/市|盟|州|地区$/, '')),
        axisLabel: {
          color: '#94a3b8',
          rotate: isMobileView ? 60 : 45,
          interval: 0,
          fontSize: isMobileView ? 10 : 12
        },
        axisLine: { lineStyle: { color: '#2d3748' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: isMobileView ? 10 : 12 },
        axisLine: { lineStyle: { color: '#2d3748' } },
        splitLine: { lineStyle: { color: '#1a1f2e' } }
      },
      series: isAllLayer
        ? stackSeries.map((s) => ({
            name: s.label,
            type: 'bar',
            stack: 'total',
            data: cityList.map(c => {
              const count = (c as Record<string, unknown>)[s.key] as number | undefined;
              return { ...c, name: c.name, value: count ?? 0, rawCount: c.rawCount };
            }),
            itemStyle: { color: s.color },
            emphasis: {
              itemStyle: {
                shadowBlur: isMobileView ? 5 : 10,
                shadowColor: `${s.color}80`
              }
            },
            barWidth: isMobileView ? '50%' : '60%'
          }))
        : [{
            name: layerConfig.label,
            type: 'bar',
            data: cityList.map(c => ({ ...c, name: c.name, value: c.value, rawCount: c.rawCount })),
            itemStyle: {
              color: new echartsLib.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: layerConfig.colorEnd },
                { offset: 1, color: layerConfig.colorStart }
              ]),
              borderRadius: [isMobileView ? 4 : 8, isMobileView ? 4 : 8, 0, 0]
            },
            emphasis: {
              itemStyle: {
                color: layerConfig.colorEnd,
                shadowBlur: isMobileView ? 5 : 10,
                shadowColor: `${layerConfig.colorEnd}80`
              }
            },
            barWidth: isMobileView ? '50%' : '60%'
          }]
    };

    chartRef.current.setOption(option, true);

    // 绑定点击事件
    chartRef.current.off('click');
    chartRef.current.on('click', (params: unknown) => {
      const p = params as EChartEventParams;
      const dataName = (p.data?.name as string | undefined);
      if (p.componentType === 'series' && dataName) {
        onSelectCity(dataName);
      }
    });
    // 绑定悬停事件
    chartRef.current.off('mouseover');
    chartRef.current.on('mouseover', (params: unknown) => {
      const p = params as EChartEventParams;
      const dataName = (p.data?.name as string | undefined);
      if (p.componentType === 'series' && dataName) {
        onHoverRegion?.({ name: dataName, level: 'province' });
      }
    });
    chartRef.current.off('mouseout');
    chartRef.current.on('mouseout', () => {
      onHoverRegion?.(null);
    });
  }, [stats, layer, onSelectCity, onHoverRegion]);

  // 简单网格聚合：将点按网格分桶，返回聚合后数据
  const clusterScatterData = (players: Player[], gridSize: number) => {
    const buckets: Record<string, { x: number; y: number; count: number; players: Player[] }> = {};
    players.forEach((p) => {
      if (typeof p.normalizedX !== 'number' || typeof p.normalizedY !== 'number') return;
      const gx = Math.floor(p.normalizedX / gridSize);
      const gy = Math.floor(p.normalizedY / gridSize);
      const key = `${gx}-${gy}`;
      if (!buckets[key]) {
        buckets[key] = { x: 0, y: 0, count: 0, players: [] };
      }
      buckets[key].x += p.normalizedX;
      buckets[key].y += p.normalizedY;
      buckets[key].count += 1;
      buckets[key].players.push(p);
    });

    return Object.values(buckets).map((b) => ({
      name: b.count > 1 ? `${b.count} 人` : b.players[0]?.name || '',
      value: [b.x / b.count, b.y / b.count, b.players[0]?.score ?? 0],
      count: b.count,
      player: b.count === 1 ? b.players[0] : undefined,
      players: b.players,
      itemStyle: {
        color: b.count > 1 ? '#fbbf24' : (b.players[0]?.hasReport ? '#39ff14' : '#00d4ff'),
        shadowBlur: b.count > 1 ? 10 : 5,
        shadowColor: b.count > 1 ? '#fbbf2460' : (b.players[0]?.hasReport ? '#39ff1460' : '#00d4ff60'),
      },
    }));
  };

  // 渲染城市散点图
  const renderCityChart = useCallback((provinceName: string, cityName: string) => {
    if (!chartRef.current) return;

    const cityData = stats[provinceName]?.cities[cityName];
    if (!cityData) return;

    const isMobileView = window.innerWidth < 768;
    const isAllLayer = entityLayer === 'all';
    const players = cityData.players;
    const useCluster = !isAllLayer && players.length > 500;

    let scatterData: {
      name: string;
      value: (number | undefined)[];
      count?: number;
      player?: Player;
      players?: Player[];
      type?: string;
      itemStyle: { color: string; shadowBlur: number; shadowColor: string };
    }[];

    const entityColorMap: Record<string, string> = {
      player: '#39ff14',
      club: '#00d4ff',
      coach: '#fbbf24',
      analyst: '#a78bfa',
      scout: '#f472b6',
    };

    if (useCluster) {
      const gridSize = isMobileView ? 0.12 : 0.08;
      scatterData = clusterScatterData(players, gridSize);
    } else {
      scatterData = players
        .filter((p) => typeof p.normalizedX === 'number' && typeof p.normalizedY === 'number')
        .map((p) => {
          const etype = p.type || 'player';
          const color = isAllLayer ? (entityColorMap[etype] || '#39ff14') : layerColor;
          return {
            name: p.name,
            value: [p.normalizedX, p.normalizedY, p.score ?? p.rating ?? 0],
            itemStyle: {
              color,
              shadowBlur: 5,
              shadowColor: color + '60',
            },
            player: p,
            type: etype,
          };
        });
    }

    const entityTypeConfig = [
      { type: 'player', label: '球员', color: '#39ff14', symbol: 'circle' },
      { type: 'club', label: '俱乐部', color: '#00d4ff', symbol: 'rect' },
      { type: 'coach', label: '教练', color: '#fbbf24', symbol: 'triangle' },
      { type: 'analyst', label: '分析师', color: '#a78bfa', symbol: 'diamond' },
      { type: 'scout', label: '球探', color: '#f472b6', symbol: 'pin' },
    ] as const;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      animationDuration: 300,
      animationDurationUpdate: 400,
      title: {
        text: cityName,
        subtext: isAllLayer
          ? `共 ${cityData.count} 个实体 · 点击散点查看详情${onBrushSelectPlayers ? ' · Shift+拖拽框选' : ''}`
          : `共 ${cityData.count} 名球员${useCluster ? ' · 已启用聚合显示' : ''} · 点击散点查看详情${onBrushSelectPlayers ? ' · Shift+拖拽框选' : ''}`,
        left: 'center',
        top: isMobileView ? 10 : 20,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 16 : 22, fontWeight: 'bold' },
        subtextStyle: { color: '#94a3b8', fontSize: isMobileView ? 11 : 14 },
      },
      brush: onBrushSelectPlayers ? {
        toolbox: ['rect', 'clear'],
        brushMode: 'single',
        brushStyle: {
          borderWidth: 1,
          color: 'rgba(57,255,20,0.1)',
          borderColor: '#39ff14',
        },
        outOfBrush: {
          colorAlpha: 0.3,
        },
      } : undefined,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        borderColor: '#2d3748',
        borderWidth: 1,
        textStyle: { color: '#f8fafc', fontSize: isMobileView ? 12 : 14 },
        formatter: (params: unknown) => {
          const ep = params as EChartParams;
          const p = ep.data?.player as Player | undefined;
          const count = (ep.data?.count as number | undefined) ?? 1;
          if (count > 1) {
            return `<div style="font-weight:600;margin-bottom:4px;">该区域 ${count} ${layerLabels.unitLabel}${layerLabels.entityName}</div>` +
              `<div style="color:#94a3b8;font-size:0.85rem;">点击查看详情</div>`;
          }
          if (!p) return ep.name || '';
          const typeLabel = p.type === 'club' ? '俱乐部' : p.type === 'coach' ? '教练' : p.type === 'analyst' ? '分析师' : p.type === 'scout' ? '球探' : '球员';
          const extra = p.extra || {};
          let subtitle = '';
          let details = '';
          switch (p.type) {
            case 'club':
              subtitle = typeLabel;
              if (extra.address) details += `<div style="color:#94a3b8;font-size:0.85rem;">地址：${extra.address}</div>`;
              if (extra.clubSize) details += `<div style="color:#94a3b8;font-size:0.85rem;">规模：${extra.clubSize}</div>`;
              break;
            case 'coach':
              subtitle = typeLabel + (extra.licenseType ? ` · ${extra.licenseType}` : '');
              if (extra.coachingYears) details += `<div style="color:#94a3b8;font-size:0.85rem;">执教年限：${extra.coachingYears}年</div>`;
              if (extra.currentClub) details += `<div style="color:#94a3b8;font-size:0.85rem;">当前俱乐部：${extra.currentClub}</div>`;
              break;
            case 'analyst':
              subtitle = typeLabel + (extra.specialty ? ` · ${extra.specialty}` : '');
              if (extra.experience) details += `<div style="color:#94a3b8;font-size:0.85rem;">经验：${extra.experience}年</div>`;
              if (extra.rating) details += `<div style="color:#94a3b8;font-size:0.85rem;">评级：${extra.rating}</div>`;
              break;
            case 'scout':
              subtitle = typeLabel + (extra.currentOrganization ? ` · ${extra.currentOrganization}` : '');
              if (extra.scoutingExperience) details += `<div style="color:#94a3b8;font-size:0.85rem;">球探经验：${extra.scoutingExperience}年</div>`;
              if (extra.totalDiscovered) details += `<div style="color:#94a3b8;font-size:0.85rem;">发现球员：${extra.totalDiscovered}人</div>`;
              break;
            default:
              subtitle = `${typeLabel}${p.position && p.position !== '未知' ? ' · ' + p.position : ''}${p.age ? ' · ' + p.age + '岁' : ''}`;
              break;
          }
          return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div>` +
            `<div style="color:#94a3b8;font-size:0.85rem;">${subtitle}</div>` +
            details +
            `<div style="margin-top:4px;color:${layerColor};font-weight:700;">${layerLabels.avgScoreLabel}：${p.score ?? p.rating ?? '—'}</div>`;
        },
      },
      legend: isAllLayer ? {
        data: entityTypeConfig.map(s => s.label),
        bottom: isMobileView ? 5 : 10,
        textStyle: { color: '#94a3b8', fontSize: isMobileView ? 10 : 12 },
        itemWidth: 12,
        itemHeight: 12,
      } : undefined,
      grid: {
        left: '5%',
        right: '5%',
        bottom: isAllLayer ? (isMobileView ? '14%' : '10%') : '5%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        min: 0,
        max: 1,
        show: false,
        type: 'value',
      },
      yAxis: {
        min: 0,
        max: 1,
        show: false,
        type: 'value',
      },
      graphic: [
        {
          type: 'rect',
          left: 'center',
          top: 'middle',
          shape: { width: isMobileView ? 280 : 400, height: isMobileView ? 280 : 400, r: 8 },
          style: {
            fill: 'rgba(57, 255, 20, 0.03)',
            stroke: 'rgba(57, 255, 20, 0.15)',
            lineWidth: 1,
          },
        },
        {
          type: 'group',
          left: 'center',
          top: 'middle',
          children: [
            {
              type: 'line',
              shape: { x1: -140, y1: 0, x2: 140, y2: 0 },
              style: { stroke: 'rgba(57, 255, 20, 0.1)', lineWidth: 1 },
            },
            {
              type: 'line',
              shape: { x1: 0, y1: -140, x2: 0, y2: 140 },
              style: { stroke: 'rgba(57, 255, 20, 0.1)', lineWidth: 1 },
            },
          ],
        },
      ],
      series: isAllLayer
        ? entityTypeConfig.map(cfg => ({
            name: cfg.label,
            type: 'scatter' as const,
            symbol: cfg.symbol,
            symbolSize: isMobileView ? 10 : 14,
            data: scatterData.filter(d => d.type === cfg.type),
            itemStyle: { color: cfg.color },
            emphasis: {
              scale: 1.5,
              itemStyle: {
                borderColor: '#f8fafc',
                borderWidth: 2,
              },
            },
          }))
        : [{
            name: `${layerLabels.entityName}分布`,
            type: 'scatter',
            symbolSize: (_value: unknown, params: { data?: unknown }) => {
              const count = ((params?.data as { count?: number } | null)?.count) || 1;
              if (count > 1) {
                return Math.min(40, 14 + count * 2);
              }
              return isMobileView ? 10 : 14;
            },
            data: scatterData,
            emphasis: {
              scale: 1.5,
              itemStyle: {
                borderColor: '#f8fafc',
                borderWidth: 2,
              },
            },
          }],
    };

    chartRef.current.setOption(option, true);
    // 绑定悬停事件
    chartRef.current.off('mouseover');
    chartRef.current.on('mouseover', (params: unknown) => {
      const p = params as EChartEventParams;
      const pl = p.data?.player as Player | undefined;
      if (p.componentType === 'series') {
        onHoverRegion?.({ name: pl?.name || p.name || '', level: 'city' });
      }
    });
    chartRef.current.off('mouseout');
    chartRef.current.on('mouseout', () => {
      onHoverRegion?.(null);
    });
    chartRef.current.off('click');
    chartRef.current.on('click', (params: unknown) => {
      const p = params as EChartEventParams;
      const pl = p.data?.player as Player | undefined;
      const playersList = p.data?.players as Player[] | undefined;
      if (p.componentType === 'series') {
        if (pl) {
          onSelectPlayer(pl);
        } else if (playersList && playersList.length > 0) {
          // 聚合点：默认选中评分最高的球员
          const top = [...playersList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
          onSelectPlayer(top);
        }
      }
    });

    if (onBrushSelectPlayers) {
      chartRef.current.off('brushSelected');
      chartRef.current.on('brushSelected', (params: unknown) => {
        const batch = (params as { batch?: { selected?: { seriesIndex?: number; dataIndex?: number[] }[] }[] }).batch;
        const selectedIndices = batch?.[0]?.selected?.[0]?.dataIndex ?? [];
        if (selectedIndices.length > 0) {
          const selectedPlayers: Player[] = [];
          selectedIndices.forEach((idx) => {
            const item = scatterData[idx];
            if (item?.player) {
              selectedPlayers.push(item.player);
            } else if (item?.players) {
              selectedPlayers.push(...item.players);
            }
          });
          onBrushSelectPlayers(selectedPlayers);
        }
      });
    }
  }, [stats, onSelectPlayer, onBrushSelectPlayers, onHoverRegion]);

  // 根据级别渲染对应图表
  useEffect(() => {
    if (!chartRef.current || chartReady === 0) return;

    switch (level) {
      case 'country':
        renderCountryMap();
        break;
      case 'province':
        if (province) {
          const code = PROVINCE_CODE_MAP[province] || PROVINCE_CODE_MAP[province + '市'] || PROVINCE_CODE_MAP[province + '省'];
          if (code && !geoJsonCacheRef.current[province]) {
            let cancelled = false;
            fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`)
              .then((res) => {
                if (!res.ok) throw new Error('GeoJSON 加载失败');
                return res.json();
              })
              .then((json) => {
                if (cancelled || !chartRef.current) return;
                echarts.registerMap(province, json);
                geoJsonCacheRef.current[province] = json;
                renderProvinceMap(province);
              })
              .catch((err) => {
                if (cancelled || !chartRef.current) return;
                console.warn('省份 GeoJSON 加载失败，降级到柱状图:', err);
                renderProvinceChart(province);
              });
            return () => {
              cancelled = true;
            };
          } else if (code) {
            renderProvinceMap(province);
          } else {
            renderProvinceChart(province);
          }
        }
        break;
      case 'city':
        if (province && city) renderCityChart(province, city);
        break;
    }
  }, [chartReady, level, province, city, renderCountryMap, renderProvinceMap, renderProvinceChart, renderCityChart]);

  return (
    <div className="relative flex-1 h-full min-h-[500px] rounded-2xl bg-[#1a1f2e] border border-[#2d3748] overflow-hidden group map-glow-container">
      {/* HUD 扫描线效果 */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57,255,20,0.1) 2px, rgba(57,255,20,0.1) 4px)' }} />
      {/* 四角 HUD 装饰 */}
      <div className="pointer-events-none absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#39ff14]/40 rounded-tl-lg" />
      <div className="pointer-events-none absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#39ff14]/40 rounded-tr-lg" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#39ff14]/40 rounded-bl-lg" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#39ff14]/40 rounded-br-lg" />
      {/* 顶部状态条 */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0e17]/60 border border-[#2d3748]/60 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse" />
        <span className="text-[10px] text-[#39ff14]/70 font-mono tracking-wider uppercase">Live Map</span>
      </div>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default React.memo(MapContainer);
