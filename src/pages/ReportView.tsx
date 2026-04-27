import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Report } from '../types';
import { reportApi, orderApi } from '../services/api';
import { useAuthStore } from '../store';
import { Loading } from '../components';
import { LikeButton, FavoriteButton, CommentSection } from '../components/social';

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadReport(id);
    }
  }, [id]);

  const loadReport = async (reportId: string) => {
    try {
      const response = await reportApi.getById(reportId);
      if (response.success && response.data) {
        setReport(response.data.data);
      }
    } catch (error) {
      console.error('加载报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!report) return;

    try {
      setPurchasing(true);
      const response = await orderApi.create({ reportId: report.id, amount: report.price });
      if (response.success && response.data) {
        navigate(`/order/${response.data.order.id}/confirm`);
      }
    } catch (error) {
      console.error('购买失败', error);
    } finally {
      setPurchasing(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">报告不存在</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        {report.cover_image && (
          <img
            src={report.cover_image}
            alt={report.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <h1 className="text-3xl font-bold mb-4 text-gray-900">{report.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-gray-600 text-sm">球员姓名</span>
            <p className="font-semibold">{report.player_name}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">出生日期</span>
            <p className="font-semibold">{report.player_birth_date || '未知'}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">位置</span>
            <p className="font-semibold">{report.player_position}</p>
          </div>
          <div>
            <span className="text-gray-600 text-sm">分析师</span>
            <p className="font-semibold">{report.analyst?.username || '未知'}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">报告内容</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {report.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </div>

        {/* 点赞和收藏 */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <LikeButton
            targetType="analyst_report"
            targetId={Number(id) || 0}
            initialCount={0}
            size="md"
          />
          <FavoriteButton
            targetType="analyst_report"
            targetId={Number(id) || 0}
            size="md"
          />
        </div>

        <div className="border-t pt-6 flex items-center justify-between">
          <div className="text-3xl font-bold text-primary">¥{report.price}</div>
          
          {isAuthenticated && (user?.role === 'admin' || user?.role === 'analyst' && user.id === report.analyst_id) ? (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              您是分析师/管理员，可免费查看
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="btn-primary text-lg px-8 py-3 bg-amber-600 hover:bg-amber-700"
            >
              {purchasing ? '处理中...' : `购买报告 ¥${report.price}`}
            </button>
          )}
        </div>

        {/* 评论区 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">评论</h3>
          <CommentSection
            targetType="analyst_report"
            targetId={Number(id) || 0}
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportView;
