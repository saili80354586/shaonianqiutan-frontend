import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, MapPin, Users, CheckCircle, Clock, FileText, ChevronRight, Play, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi, ptApi } from '../../services/api';
import { ListItemSkeleton } from '../../components/ui/loading';

interface PhysicalTest {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  template: string;
  templateName: string;
  playerCount: number;
  completedCount: number;
  status: string;
  statusName: string;
  createdAt: string;
}

interface PhysicalTestsProps {
  onBack: () => void;
}

const PhysicalTests: React.FC<PhysicalTestsProps> = ({ onBack }) => {
  const [tests, setTests] = useState<PhysicalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadTests();
  }, [statusFilter, pagination.page]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getPhysicalTests({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.data?.success && res.data?.data) {
        setTests(res.data.data.list || []);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('加载体测列表失败:', error);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      ongoing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      report_generated: 'bg-emerald-500/20 text-emerald-400',
    };
    return map[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getProgressPercent = (test: PhysicalTest) => {
    if (test.playerCount === 0) return 0;
    return Math.round((test.completedCount / test.playerCount) * 100);
  };

  const handleRemind = async (testId: number) => {
    try {
      const res = await ptApi.notifyPhysicalTest(testId, {});
      if (res.data?.success) {
        toast.success('催办通知已发送');
      } else {
        toast.error(res.data?.message || '催办失败');
      }
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '催办失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">体测活动管理</h1>
              <p className="text-gray-400 mt-1">共 {pagination.total} 个体测活动</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/club/physical-tests/create'} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> 创建体测
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">所有状态</option>
            <option value="pending">待开始</option>
            <option value="ongoing">进行中</option>
            <option value="completed">已完成</option>
            <option value="report_generated">报告已生成</option>
          </select>
        </div>

        {/* 体测活动列表 */}
        <div className="space-y-4">
          {loading ? (
            <ListItemSkeleton count={3} />
          ) : tests.length === 0 ? (
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">暂无体测活动</p>
              <button
                onClick={() => window.location.href = '/club/physical-tests/create'}
                className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
              >
                创建第一个体测活动
              </button>
            </div>
          ) : (
            tests.map(test => (
              <div key={test.id} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 hover:border-emerald-500/50 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${getStatusColor(test.status)}`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{test.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {test.startDate}
                            {test.endDate && test.endDate !== test.startDate && ` ~ ${test.endDate}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {test.location || '未设置地点'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {test.playerCount}人
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(test.status)}`}>
                        {test.statusName}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                        {test.templateName}
                      </span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">录入进度</span>
                      <span className="text-white">{test.completedCount}/{test.playerCount} ({getProgressPercent(test)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercent(test)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="text-sm text-gray-500">
                      创建于 {test.createdAt}
                    </div>
                    <div className="flex items-center gap-2">
                      {test.status === 'pending' && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                          <Play className="w-4 h-4" /> 开始体测
                        </button>
                      )}
                      {test.status === 'ongoing' && (
                        <button
                          onClick={() => window.location.href = `/club/physical-tests/${test.id}/record`}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" /> 录入数据
                        </button>
                      )}
                      {(test.status === 'completed' || test.status === 'ongoing') && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">
                          <FileText className="w-4 h-4" /> 查看报告
                        </button>
                      )}
                      {test.completedCount < test.playerCount && (
                        <button
                          onClick={() => handleRemind(test.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"
                        >
                          <Bell className="w-4 h-4" /> 一键催办
                        </button>
                      )}
                      <button className="p-2 hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              上一页
            </button>
            <span className="text-gray-400">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysicalTests;
