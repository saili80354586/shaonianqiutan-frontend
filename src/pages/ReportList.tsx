import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Report } from '../types';
import { reportApi } from '../services/api';
import { Loading } from '../components';

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportApi.getMyReports({ page: 1, pageSize: 50 });
      if (response.data?.success) {
        const result = response.data.data?.data || response.data.data || {};
        setReports(result.list || []);
      }
    } catch (error) {
      console.error('加载报告失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">球探报告列表</h1>
      
      {loading ? (
        <Loading />
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="card hover:shadow-lg transition-shadow">
              {report.cover_image && (
                <img
                  src={report.cover_image}
                  alt={report.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                {report.title || `${report.player_name || '球员'} - 球探报告`}
              </h3>
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <span>{report.player_name}</span>
                {report.player_birth_date && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date().getFullYear() - new Date(report.player_birth_date).getFullYear()}岁
                    </span>
                  </>
                )}
                {report.player_position && (
                  <>
                    <span>•</span>
                    <span>{report.player_position}</span>
                  </>
                )}
              </div>
              {report.rating !== undefined && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-yellow-500 ${i < Math.floor(report.rating as number) ? '★' : '☆'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-gray-600">{(report.rating as number).toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xl font-bold text-primary">¥{report.price || 0}</span>
                <Link to={`/reports/${report.id}`} className="btn-primary">
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">暂无发布的报告</p>
      )}
    </div>
  );
};

export default ReportList;
