import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, BarChart3, TrendingUp, Award, Target, Loader2, Users, CheckCircle } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ptApi, reportApi } from '../../services/api';
import { exportPhysicalTestReportPDF } from '../../utils/pdf';

interface PhysicalTestActivity {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusName?: string;
  playerCount?: number;
  completedCount?: number;
  reportsGenerated?: number;
  templateItems?: string[];
}

interface PhysicalTestRecordItem {
  id: number;
  playerId: number;
  playerName: string;
  status: string;
  testDate: string;
  data: Record<string, number | string | null | undefined>;
  recordProgress?: {
    completed: number;
    total: number;
  };
}

interface TestItemData {
  value: number;
  unit: string;
  percentile: number;
  rating: string;
}

interface PlayerPhysicalReport {
  id: number;
  playerId: number;
  playerName: string;
  activityId: number;
  activityName: string;
  testDate: string;
  overallRating: string;
  percentile: number;
  pdfUrl?: string;
  reportData: {
    player_name?: string;
    player_age?: number;
    player_age_group?: string;
    position?: string;
    test_date?: string;
    overall_rating?: string;
    percentile?: number;
    test_data?: Record<string, TestItemData>;
    strengths?: string[];
    improvements?: string[];
    training_suggestions?: string[];
    nutrition_suggestions?: string[];
    rest_suggestions?: string[];
    next_test_suggestion?: string;
  };
}

interface MetricDef {
  key: string;
  label: string;
  unit: string;
  lowerBetter?: boolean;
}

interface MetricSummary extends MetricDef {
  average: number;
  best: number;
  count: number;
}

interface PhysicalTestReportProps {
  testId?: number | null;
  onBack?: () => void;
}

const METRICS: MetricDef[] = [
  { key: 'height', label: '身高', unit: 'cm' },
  { key: 'weight', label: '体重', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'sprint_30m', label: '30米跑', unit: 's', lowerBetter: true },
  { key: 'standing_long_jump', label: '立定跳远', unit: 'cm' },
  { key: 'sit_and_reach', label: '坐位体前屈', unit: 'cm' },
  { key: 'push_up', label: '俯卧撑', unit: '个' },
  { key: 'sit_up', label: '仰卧起坐', unit: '个' },
];

const REPORT_ITEM_LABELS: Record<string, string> = {
  height: '身高',
  weight: '体重',
  bmi: 'BMI',
  sprint_30m: '30米跑',
  sprint_50m: '50米跑',
  sprint_100m: '100米跑',
  standing_long_jump: '立定跳远',
  vertical_jump: '纵跳',
  sit_and_reach: '坐位体前屈',
  push_up: '俯卧撑',
  sit_up: '仰卧起坐',
  plank: '平板支撑',
};

const toNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatMetric = (value: number | null | undefined, unit: string) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return unit ? `${formatted}${unit}` : formatted;
};

const PhysicalTestReport: React.FC<PhysicalTestReportProps> = ({ testId, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isPlayerReportMode = location.pathname.startsWith('/club/physical-reports/');
  const routeId = Number(params.id);
  const resolvedId = testId ?? (Number.isFinite(routeId) && routeId > 0 ? routeId : null);

  const [activity, setActivity] = useState<PhysicalTestActivity | null>(null);
  const [records, setRecords] = useState<PhysicalTestRecordItem[]>([]);
  const [playerReport, setPlayerReport] = useState<PlayerPhysicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const handleBack = onBack || (() => {
    if (isPlayerReportMode && playerReport?.playerId) {
      navigate(`/club/players/${playerReport.playerId}`);
      return;
    }
    navigate('/club/physical-tests');
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!resolvedId) {
        setError(isPlayerReportMode ? '无效的体测报告ID' : '无效的体测活动ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        if (isPlayerReportMode) {
          const reportRes = await reportApi.getPhysicalReportDetail(resolvedId);
          if (!reportRes.data?.success) {
            throw new Error(reportRes.data?.error?.message || '体测报告不存在');
          }
          setPlayerReport(reportRes.data.data);
          setActivity(null);
          setRecords([]);
          return;
        }

        const [detailRes, recordsRes] = await Promise.all([
          ptApi.getPhysicalTestDetail(resolvedId),
          ptApi.getPhysicalTestRecords(resolvedId, { pageSize: 500 }),
        ]);

        if (!detailRes.data?.success) {
          throw new Error(detailRes.data?.error?.message || '体测活动不存在');
        }

        setActivity(detailRes.data.data);
        setPlayerReport(null);
        const list = recordsRes.data?.data?.list || [];
        setRecords(Array.isArray(list) ? list : []);
      } catch (err) {
        setError((err as Error).message || '加载体测报告失败');
        setRecords([]);
        setPlayerReport(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [resolvedId, isPlayerReportMode]);

  const completedRecords = records.filter((record) => record.status === 'completed');

  const metricSummaries = useMemo<MetricSummary[]>(() => {
    return METRICS.map((metric) => {
      const values = records
        .map((record) => toNumber(record.data?.[metric.key]))
        .filter((value): value is number => value !== null);

      if (values.length === 0) return null;

      const total = values.reduce((sum, value) => sum + value, 0);
      const sorted = [...values].sort((a, b) => metric.lowerBetter ? a - b : b - a);
      return {
        ...metric,
        average: total / values.length,
        best: sorted[0],
        count: values.length,
      };
    }).filter((item): item is MetricSummary => item !== null);
  }, [records]);

  const strongestMetric = metricSummaries.find((metric) => !metric.lowerBetter && metric.count > 0) || metricSummaries[0];
  const speedMetric = metricSummaries.find((metric) => metric.key === 'sprint_30m');

  const handleExportCsv = () => {
    const headers = ['球员', '日期', ...METRICS.map((metric) => metric.label), '完成项'];
    const rows = records.map((record) => [
      record.playerName,
      record.testDate,
      ...METRICS.map((metric) => formatMetric(toNumber(record.data?.[metric.key]), metric.unit)),
      `${record.recordProgress?.completed ?? 0}/${record.recordProgress?.total ?? 0}`,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activity?.name || '体测报告'}-数据.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPlayerReport = async () => {
    if (!playerReport) return;
    try {
      await reportApi.downloadPhysicalReport(
        playerReport.id,
        `${playerReport.playerName || '球员'}_${playerReport.activityName || '体测报告'}.html`
      );
    } catch (err) {
      console.error('下载体测报告失败:', err);
      alert('下载体测报告失败，请稍后重试');
    }
  };

  const handlePrintPlayerReport = async () => {
    if (!playerReport) return;
    const reportData = playerReport.reportData || {};
    try {
      await exportPhysicalTestReportPDF({
        playerName: reportData.player_name || playerReport.playerName,
        age: reportData.player_age,
        position: reportData.position || '-',
        testDate: reportData.test_date || playerReport.testDate,
        testData: Object.entries(reportData.test_data || {}).map(([key, item]) => ({
          name: REPORT_ITEM_LABELS[key] || key,
          value: item.value,
          unit: item.unit,
          percentile: item.percentile,
          rating: item.rating,
        })),
        strengths: reportData.strengths || [],
        suggestions: reportData.training_suggestions || [],
      });
    } catch (err) {
      console.error('导出PDF失败:', err);
      alert('导出PDF失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center px-6">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">体测报告加载失败</h2>
          <p className="text-gray-400">{error}</p>
          <button onClick={handleBack} className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (isPlayerReportMode && playerReport) {
    const reportData = playerReport.reportData || {};
    const testDataEntries = Object.entries(reportData.test_data || {});
    const strengths = reportData.strengths || [];
    const improvements = reportData.improvements || [];
    const suggestions = reportData.training_suggestions || [];

    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />返回球员详情
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPlayerReport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />打印/导出PDF
              </button>
              <button
                onClick={handleDownloadPlayerReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />下载报告文件
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 p-6 lg:p-8 text-white">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm mb-4">
                    <Award className="w-4 h-4" />球员体测报告
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">{reportData.player_name || playerReport.playerName || '球员'}</h1>
                  <p className="text-white/80">{playerReport.activityName || '体测活动'} · {reportData.test_date || playerReport.testDate || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 min-w-[300px]">
                  <HeaderStat label="综合评级" value={reportData.overall_rating || playerReport.overallRating || '-'} />
                  <HeaderStat label="百分位" value={reportData.percentile ?? playerReport.percentile ?? '-'} />
                  <HeaderStat label="年龄组" value={reportData.player_age_group || '-'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 lg:p-6">
              <ReportStat icon={Users} label="年龄" value={reportData.player_age ? `${reportData.player_age}岁` : '-'} subtext="球员年龄" color="blue" />
              <ReportStat icon={Target} label="位置" value={reportData.position || '-'} subtext="登记位置" color="emerald" />
              <ReportStat icon={TrendingUp} label="下次建议" value={reportData.next_test_suggestion || '-'} subtext="复测安排" color="amber" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
            <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />单项数据
              </h2>
              {testDataEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testDataEntries.map(([key, item]) => (
                    <div key={key} className="rounded-xl bg-[#0f1419] border border-gray-800 p-4">
                      <div className="text-sm text-gray-400">{REPORT_ITEM_LABELS[key] || key}</div>
                      <div className="text-2xl font-bold text-white mt-2">{formatMetric(item.value, item.unit)}</div>
                      <div className="text-xs text-emerald-400 mt-2">百分位 {item.percentile} · {item.rating}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-[#0f1419] border border-gray-800 p-8 text-center text-gray-400">暂无单项数据</div>
              )}
            </div>

            <div className="space-y-4">
              <SuggestionPanel title="优势项目" items={strengths} color="emerald" />
              <SuggestionPanel title="待提升方向" items={improvements} color="amber" />
              <SuggestionPanel title="训练建议" items={suggestions} color="blue" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />返回体测管理
          </button>
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />导出数据
          </button>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 lg:p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />{activity?.statusName || '体测报告'}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">{activity?.name || '体测报告'}</h1>
                <p className="text-white/80 max-w-2xl">{activity?.description || '俱乐部体测数据汇总与项目表现分析'}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 min-w-[300px]">
                <HeaderStat label="参与球员" value={activity?.playerCount ?? records.length} />
                <HeaderStat label="已完成" value={activity?.completedCount ?? completedRecords.length} />
                <HeaderStat label="已生成" value={activity?.reportsGenerated ?? completedRecords.length} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 lg:p-6">
            <ReportStat icon={Users} label="记录数" value={records.length} subtext="本次体测记录" color="blue" />
            <ReportStat icon={CheckCircle} label="完成率" value={`${records.length ? Math.round(completedRecords.length * 100 / records.length) : 0}%`} subtext={`${completedRecords.length}/${records.length} 已完成`} color="emerald" />
            <ReportStat icon={TrendingUp} label="平均30米" value={formatMetric(speedMetric?.average, speedMetric?.unit || 's')} subtext="速度基线" color="amber" />
            <ReportStat icon={Award} label="优势项目" value={strongestMetric?.label || '-'} subtext={strongestMetric ? `最佳 ${formatMetric(strongestMetric.best, strongestMetric.unit)}` : '暂无数据'} color="violet" />
          </div>
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] p-12 text-center">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">暂无体测记录</h2>
            <p className="text-gray-400">录入球员体测数据后，这里会生成汇总报告。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
            <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />项目汇总
              </h2>
              <div className="space-y-3">
                {metricSummaries.map((metric) => (
                  <div key={metric.key} className="rounded-xl bg-[#0f1419] border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{metric.label}</span>
                      <span className="text-xs text-gray-500">{metric.count} 条</span>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <div className="text-2xl font-bold text-white">{formatMetric(metric.average, metric.unit)}</div>
                        <div className="text-xs text-gray-500 mt-1">平均值</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-400">{formatMetric(metric.best, metric.unit)}</div>
                        <div className="text-xs text-gray-500 mt-1">{metric.lowerBetter ? '最快' : '最佳'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">球员明细</h2>
                <p className="text-sm text-gray-500 mt-1">用于核对本次体测报告的原始记录。</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">球员</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">30米跑</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">立定跳远</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">坐位体前屈</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">俯卧撑</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">仰卧起坐</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400">完成项</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{record.playerName}</div>
                          <div className="text-xs text-gray-500">{record.testDate}</div>
                        </td>
                        <MetricCell value={record.data?.sprint_30m} unit="s" />
                        <MetricCell value={record.data?.standing_long_jump} unit="cm" />
                        <MetricCell value={record.data?.sit_and_reach} unit="cm" />
                        <MetricCell value={record.data?.push_up} unit="个" />
                        <MetricCell value={record.data?.sit_up} unit="个" />
                        <td className="px-5 py-4 text-sm text-gray-300">
                          {record.recordProgress?.completed ?? 0}/{record.recordProgress?.total ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface HeaderStatProps {
  label: string;
  value: number | string;
}

const HeaderStat = ({ label, value }: HeaderStatProps) => (
  <div className="rounded-xl bg-white/15 border border-white/20 p-3 text-center">
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-white/75 mt-1">{label}</div>
  </div>
);

interface ReportStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subtext: string;
  color: 'blue' | 'emerald' | 'amber' | 'violet';
}

const ReportStat = ({ icon: Icon, label, value, subtext, color }: ReportStatProps) => {
  const colorClass = {
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  }[color];

  return (
    <div className="rounded-xl bg-[#0f1419] border border-gray-800 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{subtext}</div>
    </div>
  );
};

interface SuggestionPanelProps {
  title: string;
  items: string[];
  color: 'blue' | 'emerald' | 'amber';
}

const SuggestionPanel = ({ title, items, color }: SuggestionPanelProps) => {
  const titleClass = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }[color];

  return (
    <div className="rounded-2xl border border-gray-800 bg-[#1a1f2e] p-5">
      <h2 className={`text-base font-semibold mb-3 ${titleClass}`}>{title}</h2>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="text-sm text-gray-300 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">暂无</div>
      )}
    </div>
  );
};

const MetricCell = ({ value, unit }: { value: unknown; unit: string }) => (
  <td className="px-5 py-4 text-sm text-gray-300">
    {formatMetric(toNumber(value), unit)}
  </td>
);

export default PhysicalTestReport;
