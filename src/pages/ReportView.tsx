import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Star } from 'lucide-react';
import { reportApi } from '../services/api';
import { Loading } from '../components';
import { LikeButton, FavoriteButton, CommentSection } from '../components/social';

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
}

function extractReportPayload(response: any): ReportDetail | null {
  return response?.data?.data?.data || response?.data?.data || null;
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
