import React, { useState, useRef, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Zap, MoveRight, StretchHorizontal, Dumbbell, Timer, Activity, ArrowUp, User, Building2 } from 'lucide-react';
import { PhysicalTestTooltip } from '../../../components/ui/PhysicalTestTooltip';

type Theme = 'classic' | 'cyberpunk';

interface PhysicalTestData {
  height?: number;
  weight?: number;
  bmi?: number;
  sprint30m?: number;
  sprint50m?: number;
  sprint100m?: number;
  agilityLadder?: number;
  tTest?: number;
  shuttleRun?: number;
  standingLongJump?: number;
  verticalJump?: number;
  sitAndReach?: number;
  pushUp?: number;
  sitUp?: number;
  plank?: number;
  testDate?: string;
}

/** 后端返回的单条记录（含来源字段） */
export interface TestRecordWithSource {
  id: number;
  test_date: string;
  source: 'personal' | 'club';
  club_name?: string | null;
  activity_id?: number | null;
  recorder_role: 'player' | 'coach';
  // 体测指标
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  sprint_30m?: number | null;
  sprint_50m?: number | null;
  sprint_100m?: number | null;
  agility_ladder?: number | null;
  t_test?: number | null;
  shuttle_run?: number | null;
  standing_long_jump?: number | null;
  vertical_jump?: number | null;
  sit_and_reach?: number | null;
  push_up?: number | null;
  sit_up?: number | null;
  plank?: number | null;
  created_at?: string;
}

/** 将后端 snake_case 记录转换为组件使用的 camelCase 数据 */
function recordToData(record: TestRecordWithSource): PhysicalTestData {
  return {
    height: record.height ?? undefined,
    weight: record.weight ?? undefined,
    bmi: record.bmi ?? undefined,
    sprint30m: record.sprint_30m ?? undefined,
    sprint50m: record.sprint_50m ?? undefined,
    sprint100m: record.sprint_100m ?? undefined,
    agilityLadder: record.agility_ladder ?? undefined,
    tTest: record.t_test ?? undefined,
    shuttleRun: record.shuttle_run ?? undefined,
    standingLongJump: record.standing_long_jump ?? undefined,
    verticalJump: record.vertical_jump ?? undefined,
    sitAndReach: record.sit_and_reach ?? undefined,
    pushUp: record.push_up ?? undefined,
    sitUp: record.sit_up ?? undefined,
    plank: record.plank ?? undefined,
    testDate: record.test_date,
  };
}

interface PhysicalTestsProps {
  /** 兼容旧版：单组数据（直接展示） */
  data?: PhysicalTestData;
  age?: number;
  gender?: string;
  theme: Theme;

  // ===== 新增：双数据源模式 =====
  /** 全部体测记录（含 source 字段） */
  records?: TestRecordWithSource[];
}

// 同龄人均值参考数据
const peerAverages: Record<string, Record<string, { avg: number; good: number; excellent: number }>> = {
  'U12': {
    sprint30m: { avg: 5.5, good: 5.0, excellent: 4.6 },
    sprint50m: { avg: 8.5, good: 7.8, excellent: 7.2 },
    standingLongJump: { avg: 160, good: 185, excellent: 210 },
    verticalJump: { avg: 30, good: 38, excellent: 45 },
    sitAndReach: { avg: 12, good: 18, excellent: 25 },
    pushUp: { avg: 10, good: 20, excellent: 35 },
    sitUp: { avg: 25, good: 40, excellent: 55 },
    shuttleRun: { avg: 24, good: 21, excellent: 18 },
    agilityLadder: { avg: 12, good: 10, excellent: 8 },
    tTest: { avg: 10, good: 9, excellent: 8 },
  },
  'U14': {
    sprint30m: { avg: 5.2, good: 4.7, excellent: 4.3 },
    sprint50m: { avg: 8.0, good: 7.3, excellent: 6.8 },
    standingLongJump: { avg: 180, good: 210, excellent: 235 },
    verticalJump: { avg: 35, good: 43, excellent: 52 },
    sitAndReach: { avg: 10, good: 16, excellent: 22 },
    pushUp: { avg: 15, good: 30, excellent: 45 },
    sitUp: { avg: 30, good: 50, excellent: 70 },
    shuttleRun: { avg: 22, good: 19, excellent: 16 },
    agilityLadder: { avg: 11, good: 9, excellent: 7.5 },
    tTest: { avg: 9.5, good: 8.5, excellent: 7.5 },
  },
  'U16': {
    sprint30m: { avg: 4.9, good: 4.4, excellent: 4.0 },
    sprint50m: { avg: 7.5, good: 6.9, excellent: 6.4 },
    standingLongJump: { avg: 200, good: 230, excellent: 260 },
    verticalJump: { avg: 40, good: 48, excellent: 58 },
    sitAndReach: { avg: 8, good: 14, excellent: 20 },
    pushUp: { avg: 20, good: 40, excellent: 60 },
    sitUp: { avg: 35, good: 60, excellent: 80 },
    shuttleRun: { avg: 20, good: 17, excellent: 14 },
    agilityLadder: { avg: 10, good: 8.5, excellent: 7 },
    tTest: { avg: 9, good: 8, excellent: 7 },
  },
};

const testItems = [
  { key: 'sprint30m', label: '30米跑', unit: '秒', icon: Zap, lowerIsBetter: true, apiKey: 'sprint_30m' as const },
  { key: 'standingLongJump', label: '立定跳远', unit: 'cm', icon: MoveRight, lowerIsBetter: false, apiKey: 'standing_long_jump' as const },
  { key: 'sitAndReach', label: '坐位体前屈', unit: 'cm', icon: StretchHorizontal, lowerIsBetter: false, apiKey: 'sit_and_reach' as const },
  { key: 'pushUp', label: '俯卧撑', unit: '个', icon: Dumbbell, lowerIsBetter: false, apiKey: 'push_up' as const },
  { key: 'sitUp', label: '仰卧起坐', unit: '个/分', icon: Activity, lowerIsBetter: false, apiKey: 'sit_up' as const },
  { key: 'shuttleRun', label: '折返跑', unit: '秒', icon: Timer, lowerIsBetter: true, apiKey: 'shuttle_run' as const },
  { key: 'sprint50m', label: '50米跑', unit: '秒', icon: Zap, lowerIsBetter: true, apiKey: 'sprint_50m' as const },
  { key: 'verticalJump', label: '纵跳', unit: 'cm', icon: ArrowUp, lowerIsBetter: false, apiKey: 'vertical_jump' as const },
];

const getAgeGroup = (age?: number): string => {
  if (!age) return 'U14';
  if (age <= 12) return 'U12';
  if (age <= 14) return 'U14';
  return 'U16';
};

const calculatePercentile = (
  value: number,
  averages: { avg: number; good: number; excellent: number },
  lowerIsBetter: boolean
): number => {
  if (lowerIsBetter) {
    if (value <= averages.excellent) return 90 + (averages.excellent - value) / averages.excellent * 10;
    if (value <= averages.good) return 70 + (averages.good - value) / (averages.good - averages.excellent) * 20;
    if (value <= averages.avg) return 50 + (averages.avg - value) / (averages.avg - averages.good) * 20;
    return Math.max(10, 50 - (value - averages.avg) / averages.avg * 40);
  } else {
    if (value >= averages.excellent) return 90 + (value - averages.excellent) / averages.excellent * 10;
    if (value >= averages.good) return 70 + (value - averages.good) / (averages.excellent - averages.good) * 20;
    if (value >= averages.avg) return 50 + (value - averages.avg) / (averages.good - averages.avg) * 20;
    return Math.max(10, 50 - (averages.avg - value) / averages.avg * 40);
  }
};

// ============ 雷达图组件 ============

const PhysicalRadarChart: React.FC<{ data: PhysicalTestData; ageGroup: string; theme: Theme }> = ({ data, ageGroup, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isCyberpunk = theme === 'cyberpunk';

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = 90;

    ctx.clearRect(0, 0, size, size);

    const values = testItems.map(item => {
      const value = data[item.key as keyof PhysicalTestData];
      if (value === undefined || value === null) return 50;
      const averages = peerAverages[ageGroup]?.[item.key];
      if (!averages) return 50;
      return calculatePercentile(value, averages, item.lowerIsBetter);
    });

    const itemCount = testItems.length;
    const angleStep = (Math.PI * 2) / itemCount;

    // 网格
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      ctx.strokeStyle = isCyberpunk ? 'rgba(57,255,20,0.15)' : 'rgba(100,116,139,0.2)';
      ctx.lineWidth = 1;
      for (let j = 0; j < itemCount; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 轴线 + 标签
    ctx.fillStyle = isCyberpunk ? '#94a3b8' : '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    testItems.forEach((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.strokeStyle = isCyberpunk ? 'rgba(57,255,20,0.25)' : 'rgba(100,116,139,0.3)';
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();

      const labelX = center + (radius + 22) * Math.cos(angle);
      const labelY = center + (radius + 22) * Math.sin(angle);
      ctx.fillText(item.label, labelX, labelY);
    });

    // 数据多边形
    ctx.beginPath();
    values.forEach((value, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = isCyberpunk ? 'rgba(57,255,20,0.25)' : 'rgba(57,255,20,0.2)';
    ctx.fill();
    ctx.strokeStyle = isCyberpunk ? '#39ff14' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    values.forEach((value, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isCyberpunk ? '#39ff14' : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = isCyberpunk ? '#05070c' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [data, ageGroup, isCyberpunk]);

  return <canvas ref={canvasRef} className="w-full max-w-[280px] h-auto mx-auto" />;
};

// ============ 主组件 ============

type DataSourceTab = 'personal' | 'club';

const PhysicalTests: React.FC<PhysicalTestsProps> = ({ data, age, gender, theme, records }) => {
  const isCyberpunk = theme === 'cyberpunk';
  const ageGroup = getAgeGroup(age);
  const averages = peerAverages[ageGroup];

  // ========== 双数据源分离逻辑 ==========
  const [activeTab, setActiveTab] = useState<DataSourceTab>('personal');

  const personalRecords = React.useMemo(
    () => (records || []).filter(r => r.source === 'personal'),
    [records]
  );
  const clubRecords = React.useMemo(
    () => (records || []).filter(r => r.source === 'club'),
    [records]
  );

  // 是否有新数据源模式的记录
  const hasDualData = (records && records.length > 0);

  // 默认选中的数据：优先最新的那一套
  React.useEffect(() => {
    if (!hasDualData) return;
    // 如果有俱乐部数据且最新，默认选中俱乐部；否则选中个人
    if (clubRecords.length > 0 && personalRecords.length > 0) {
      const latestClubDate = clubRecords[0]?.test_date || '';
      const latestPersonalDate = personalRecords[0]?.test_date || '';
      setActiveTab(latestClubDate >= latestPersonalDate ? 'club' : 'personal');
    } else if (clubRecords.length > 0) {
      setActiveTab('club');
    } else if (personalRecords.length > 0) {
      setActiveTab('personal');
    }
  }, [hasDualData, personalRecords, clubRecords]);

  // 当前显示的数据（取该来源下最新的那条记录）
  let displayRecord: TestRecordWithSource | undefined;
  let displayData: PhysicalTestData;

  if (hasDualData) {
    displayRecord = activeTab === 'club'
      ? clubRecords[0]  // 最新的一条
      : personalRecords[0];
    displayData = displayRecord ? recordToData(displayRecord) : {};
  } else {
    // 兼容旧模式：直接使用 props.data
    displayData = data || {};
  }

  // ========== 评分计算 ==========
  let totalScore = 0;
  let count = 0;
  testItems.forEach(item => {
    const value = displayData[item.key as keyof PhysicalTestData];
    if (value !== undefined && value !== null && averages?.[item.key]) {
      totalScore += calculatePercentile(value, averages[item.key], item.lowerIsBetter);
      count++;
    }
  });
  const overallScore = count > 0 ? Math.round(totalScore / count) : 0;

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: '优秀', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 60) return { label: '良好', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 40) return { label: '一般', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: '待提升', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const level = getScoreLevel(overallScore);

  // 空状态判断
  const hasNoData = !hasDualData && Object.keys(data || {}).filter(k =>
    typeof (data as any)[k] === 'number'
  ).length === 0;
  const hasEmptyDualData = hasDualData && activeTab === 'personal' ? personalRecords.length === 0 :
    hasDualData && activeTab === 'club' ? clubRecords.length === 0 : false;

  return (
    <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
      isCyberpunk
        ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
        : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
    }`}>
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
          <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-accent" />
          </span>
          体测数据中心
        </h3>

        {/* 双数据源 Tab 切换 */}
        {hasDualData && (
          <div className="flex items-center gap-1.5 bg-black/20 rounded-lg p-1">
            {/* 个人体测 Tab */}
            <button
              onClick={() => setActiveTab('personal')}
              disabled={personalRecords.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === 'personal' && personalRecords.length > 0
                  ? 'bg-blue-500/20 text-blue-400 shadow-sm'
                  : personalRecords.length === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-blue-300 hover:bg-blue-500/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              个人自测
              {personalRecords.length > 0 && (
                <span className="text-[10px] opacity-60">{personalRecords.length}</span>
              )}
            </button>

            {/* 俱乐部体测 Tab */}
            <button
              onClick={() => setActiveTab('club')}
              disabled={clubRecords.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                activeTab === 'club' && clubRecords.length > 0
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                  : clubRecords.length === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              俱乐部体测
              {clubRecords.length > 0 && (
                <span className="text-[10px] opacity-60">{clubRecords.length}</span>
              )}
            </button>
          </div>
        )}

        {/* 单数据源时仍显示评分 */}
        {!hasDualData && overallScore > 0 && (
          <div className={`px-3 py-1 rounded-full ${level.bg} border border-white/10`}>
            <span className={`text-sm font-bold ${level.color}`}>{level.label} · {overallScore}分</span>
          </div>
        )}

        {/* 双数据源时在右侧也显示评分 */}
        {hasDualData && overallScore > 0 && (
          <div className={`px-3 py-1 rounded-full ${level.bg} border border-white/10`}>
            <span className={`text-sm font-bold ${level.color}`}>{level.label} · {overallScore}分</span>
          </div>
        )}
      </div>

      {/* 来源信息条（双数据源模式下显示） */}
      {hasDualData && displayRecord && (
        <div className={`mb-4 px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
          activeTab === 'club'
            ? 'bg-emerald-500/8 border border-emerald-500/15 text-emerald-300/80'
            : 'bg-blue-500/8 border border-blue-500/15 text-blue-300/80'
        }`}>
          <div className="flex items-center gap-2">
            {activeTab === 'club' ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {displayRecord.club_name ? `${displayRecord.club_name} · 官方测试` : '俱乐部官方测试'}
                  {displayRecord.recorder_role === 'coach' && <span className="ml-1 opacity-70">· 教练录入</span>}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>球员/家长自行记录</span>
              </>
            )}
          </div>
          <span className="opacity-60">{displayRecord.test_date}</span>
        </div>
      )}

      {/* 空状态 */}
      {(hasNoData || hasEmptyDualData) ? (
        <div className="py-16 text-center">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-text-muted text-sm">暂无{hasDualData ? (activeTab === 'club' ? '俱乐部' : '个人') : ''}体测数据</p>
          {hasDualData && ((activeTab === 'personal' && clubRecords.length > 0) || (activeTab === 'club' && personalRecords.length > 0)) && (
            <button
              onClick={() => setActiveTab(activeTab === 'personal' ? 'club' : 'personal')}
              className="mt-3 text-accent text-xs underline decoration-dotted underline-offset-4 hover:text-accent/80 transition-colors"
            >
              查看{activeTab === 'personal' ? '俱乐部' : '个人'}体测数据 →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 雷达图 */}
          <div className="mb-6">
            <PhysicalRadarChart data={displayData} ageGroup={ageGroup} theme={theme} />
          </div>

          {/* 详细数据卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {testItems.map(item => {
              const value = displayData[item.key as keyof PhysicalTestData];
              const avg = averages?.[item.key];
              const Icon = item.icon;

              if (value === undefined || value === null) {
                return (
                  <div key={item.key} className={`p-3 rounded-xl text-center group relative ${
                    isCyberpunk
                      ? 'bg-[rgba(10,14,23,0.5)] border border-white/5'
                      : 'bg-[rgba(10,14,23,0.3)] border border-white/5'
                  }`}>
                    <div className="mb-1 flex justify-center"><Icon className="w-5 h-5 text-gray-500" /></div>
                    <div className="text-xs text-text-muted flex items-center justify-center gap-1">
                      {item.label}
                      <PhysicalTestTooltip itemKey={item.apiKey} compact />
                    </div>
                    <div className="text-sm text-text-secondary">--</div>
                  </div>
                );
              }

              let comparison = null;
              if (avg) {
                const percentile = calculatePercentile(value, avg, item.lowerIsBetter);
                if (percentile >= 70) {
                  comparison = <TrendingUp className="w-3 h-3 text-emerald-400" />;
                } else if (percentile >= 50) {
                  comparison = <Minus className="w-3 h-3 text-yellow-400" />;
                } else {
                  comparison = <TrendingDown className="w-3 h-3 text-red-400" />;
                }
              }

              return (
                <div key={item.key} className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 group relative ${
                  isCyberpunk
                    ? 'bg-[rgba(10,14,23,0.7)] border border-[rgba(57,255,20,0.15)] hover:border-[rgba(57,255,20,0.4)]'
                    : 'bg-[rgba(10,14,23,0.5)] border border-white/5 hover:border-accent/30'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="w-5 h-5 text-accent" />
                    <div className="flex items-center gap-0.5">
                      {comparison}
                      <PhysicalTestTooltip itemKey={item.apiKey} compact />
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {value}<span className="text-xs font-normal text-text-muted ml-0.5">{item.unit}</span>
                  </div>
                  <div className="text-xs text-text-muted">{item.label}</div>
                </div>
              );
            })}
          </div>

          {/* 说明文字 */}
          <div className="mt-4 text-xs text-text-muted text-center">
            数据对比同龄球员（{ageGroup}组别），
            <TrendingUp className="w-3 h-3 inline text-emerald-400 mx-0.5" />高于平均
            <Minus className="w-3 h-3 inline text-yellow-400 mx-0.5" />平均水平
            <TrendingDown className="w-3 h-3 inline text-red-400 mx-0.5" />低于平均
            {hasDualData && activeTab === 'club' && (
              <span className="ml-2 text-emerald-400/60">· 官方测试数据</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PhysicalTests;
