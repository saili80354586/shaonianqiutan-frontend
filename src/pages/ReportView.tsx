import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Clock3, Download, Tag, Video, Star } from 'lucide-react';
import { reportApi } from '../services/api';
import { Loading } from '../components';
import { LikeButton, FavoriteButton, CommentSection } from '../components/social';
import type { AnalysisHighlight, HighlightMarkerType, HighlightTagType } from '../types';

interface ReportDetail {
  id: number;
  order_id?: number;
  analyst_id?: number;
  player_name?: string;
  player_birth_date?: string;
  player_position?: string;
  content?: string;
  summary?: string;
  suggestions?: string;
  strengths?: string | string[];
  weaknesses?: string | string[];
  potential?: string;
  status?: string;
  title?: string;
  description?: string;
  price?: number;
  rating?: number;
  overall_rating?: number;
  offense_rating?: number;
  defense_rating?: number;
  pdf_url?: string;
  created_at?: string;
  video_analysis_id?: number;
  highlight_markers?: AnalysisHighlight[];
}

function extractReportPayload(response: any): ReportDetail | null {
  const payload = response?.data?.data?.data || response?.data?.data || null;
  if (payload?.report) {
    return {
      ...payload.report,
      video_analysis_id: payload.video_analysis_id,
      highlight_markers: payload.highlight_markers || [],
    };
  }
  return payload;
}

function parseTextList(value?: string | string[]) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const MARKER_TYPE_META: Record<HighlightMarkerType, { label: string; className: string }> = {
  highlight: { label: '精彩表现', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  issue: { label: '待改进问题', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  observation: { label: '战术观察', className: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const TAG_LABELS: Record<HighlightTagType, string> = {
  goal: '进球',
  assist: '助攻',
  steal: '抢断',
  save: '扑救',
  dribble: '过人',
  pass: '关键传球',
  defense: '防守关键',
  positioning_error: '站位问题',
  decision_error: '决策问题',
  turnover: '失误',
  recovery_slow: '回防不及时',
  tactical_note: '战术观察',
  off_ball_run: '跑位亮点',
};

const formatMarkerMs = (ms?: number | null) => {
  if (ms === undefined || ms === null) return '';
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getMarkerDisplayTime = (marker: AnalysisHighlight) => {
  if (marker.timestamp) return marker.timestamp;
  const start = formatMarkerMs(marker.start_time_ms);
  const end = formatMarkerMs(marker.end_time_ms);
  return end ? `${start}-${end}` : start;
};

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadReport(id);
  }, [id]);

  const loadReport = async (reportId: string) => {
    try {
      setLoading(true);
      const response = await reportApi.getReportDetail(Number(reportId));
      setReport(extractReportPayload(response));
    } catch (error) {
      console.error('加载报告失败', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const title = useMemo(() => {
    if (!report) return '球探报告';
    return report.title || `${report.player_name || '球员'} - 球探报告`;
  }, [report]);

  const strengths = parseTextList(report?.strengths);
  const weaknesses = parseTextList(report?.weaknesses);
  const rating = report?.rating || report?.overall_rating || 0;
  const highlightMarkers = report?.highlight_markers || [];

  const handleDownload = async () => {
    if (!id || !report?.pdf_url) return;
    try {
      setDownloading(true);
      await reportApi.downloadReportFile(Number(id), `${title}.pdf`);
    } catch (error) {
      console.error('下载报告失败', error);
      alert('下载失败，当前报告暂未生成 PDF 文件');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">报告不存在或无权限查看</h1>
        <Link to="/user-dashboard" className="btn-primary">返回用户中心</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-3 text-gray-900">{title}</h1>
            <p className="text-gray-500 text-sm">
              {report.created_at ? new Date(report.created_at).toLocaleString('zh-CN') : '生成时间未知'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
            {report.status === 'completed' ? '已完成' : report.status || '报告'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-gray-600 text-sm">球员姓名</span>
            <p className="font-semibold">{report.player_name || '未知'}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">位置</span>
            <p className="font-semibold">{report.player_position || '未知'}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">综合评分</span>
            <p className="font-semibold flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              {rating ? rating.toFixed(1) : '未评分'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">报告内容</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {(report.summary || report.content || '暂无报告正文').split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </div>

        {(strengths.length > 0 || weaknesses.length > 0 || report.suggestions) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-semibold text-green-800 mb-2">优势</h3>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                {(strengths.length ? strengths : ['暂无']).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <h3 className="font-semibold text-orange-800 mb-2">待提升</h3>
              <ul className="list-disc list-inside text-orange-700 space-y-1">
                {(weaknesses.length ? weaknesses : ['暂无']).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        )}

        {report.suggestions && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-2">训练建议</h3>
            <p className="text-blue-700">{report.suggestions}</p>
          </div>
        )}

        {highlightMarkers.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-semibold text-gray-900">关键片段时间轴</h2>
              <span className="text-sm text-gray-500">{highlightMarkers.length} 个证据点</span>
            </div>
            <div className="space-y-3">
              {highlightMarkers.map((marker, index) => {
                const markerType = marker.marker_type || 'highlight';
                const markerMeta = MARKER_TYPE_META[markerType];
                const tagLabel = TAG_LABELS[marker.tag_type] || '未分类';
                return (
                  <article key={marker.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex items-center gap-3 sm:w-36 shrink-0">
                        <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-mono text-blue-700">
                          <Clock3 className="w-4 h-4" />
                          {getMarkerDisplayTime(marker)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${markerMeta.className}`}>
                            {markerMeta.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
                            <Tag className="w-3 h-3" />
                            {tagLabel}
                          </span>
                          {marker.video_clip_url ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
                              <Video className="w-3 h-3" />
                              可播放
                            </span>
                          ) : marker.mode === 'range' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                              <AlertTriangle className="w-3 h-3" />
                              无片段
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700">{marker.description || '暂无片段说明'}</p>
                        {marker.video_clip_url && (
                          <video
                            className="mt-3 w-full max-h-64 rounded-lg border border-gray-200 bg-black"
                            src={marker.video_clip_url}
                            controls
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <LikeButton targetType="analyst_report" targetId={Number(id) || 0} initialCount={0} size="md" />
          <FavoriteButton targetType="analyst_report" targetId={Number(id) || 0} size="md" />
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Link to="/user-dashboard?tab=orders" className="btn-secondary text-center">
            返回订单
          </Link>
          <button
            onClick={handleDownload}
            disabled={!report.pdf_url || downloading}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {downloading ? '下载中...' : report.pdf_url ? '下载 PDF' : '暂无 PDF 文件'}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">评论</h3>
          <CommentSection targetType="analyst_report" targetId={Number(id) || 0} maxLength={500} />
        </div>
      </div>
    </div>
  );
};

export default ReportView;
