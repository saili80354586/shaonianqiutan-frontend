import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi, unwrapApiResponse } from '../services/api';
import { useAuthStore } from '../store';
import { Loading } from '../components';
import type { GrowthRecord } from '../types';
import * as echarts from 'echarts';

const EditGrowth: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 新增记录表单状态
  const [newRecord, setNewRecord] = useState<GrowthRecord>({
    id: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    weight: undefined,
    height: undefined,
    matchName: '',
    opponent: '',
    result: '',
    goals: 0,
    assists: 0,
    playTime: 0,
    feeling: '',
    photos: [],
    videos: []
  });

  useEffect(() => {
    loadGrowthRecords();
  }, []);

  useEffect(() => {
    if (!loading && records.length > 0) {
      initChart();
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [loading, records]);

  const loadGrowthRecords = async () => {
    try {
      const response = await userApi.getGrowthRecords();
      const payload = unwrapApiResponse(response);
      const data = payload.data?.records || payload.data;
      if (payload.success && Array.isArray(data)) {
        setRecords(data.sort((a: GrowthRecord, b: GrowthRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('加载成长记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const initChart = () => {
    if (!chartRef.current || chartInstance.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    // 准备图表数据
    const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sortedRecords.map(r => r.date);
    const heights = sortedRecords.map(r => r.height || null);
    const weights = sortedRecords.map(r => r.weight || null);

    const option = {
      title: {
        text: '成长曲线',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['身高(cm)', '体重(kg)'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '60',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '身高(cm)',
          position: 'left',
          axisLine: {
            lineStyle: {
              color: '#5470c6'
            }
          }
        },
        {
          type: 'value',
          name: '体重(kg)',
          position: 'right',
          axisLine: {
            lineStyle: {
              color: '#91cc75'
            }
          }
        }
      ],
      series: [
        {
          name: '身高(cm)',
          type: 'line',
          smooth: true,
          data: heights,
          yAxisIndex: 0,
          itemStyle: {
            color: '#5470c6'
          },
          lineStyle: {
            width: 3
          }
        },
        {
          name: '体重(kg)',
          type: 'line',
          smooth: true,
          data: weights,
          yAxisIndex: 1,
          itemStyle: {
            color: '#91cc75'
          },
          lineStyle: {
            width: 3
          }
        }
      ]
    };

    chart.setOption(option);
  };

  const handleAddRecord = () => {
    if (!newRecord.title.trim()) {
      alert('请输入标题');
      return;
    }

    const recordToAdd: GrowthRecord = {
      ...newRecord,
      id: `temp-${Date.now()}`
    };

    setRecords([recordToAdd, ...records]);
    setNewRecord({
      id: '',
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      weight: undefined,
      height: undefined,
      matchName: '',
      opponent: '',
      result: '',
      goals: 0,
      assists: 0,
      playTime: 0,
      feeling: '',
      photos: [],
      videos: []
    });
    setShowAddModal(false);
  };

  const handleUpdateRecord = (index: number) => {
    const updatedRecords = [...records];
    updatedRecords[index] = newRecord;
    setRecords(updatedRecords);
    setEditingIndex(null);
    setNewRecord({
      id: '',
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      weight: undefined,
      height: undefined,
      matchName: '',
      opponent: '',
      result: '',
      goals: 0,
      assists: 0,
      playTime: 0,
      feeling: '',
      photos: [],
      videos: []
    });
  };

  const handleDelete = (index: number) => {
    if (confirm('确定要删除这条记录吗?')) {
      const newRecords = [...records];
      newRecords.splice(index, 1);
      setRecords(newRecords);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // 过滤掉空标题的记录
      const validRecords = records.filter(r => r.title.trim());
      const response = await userApi.saveGrowthRecords(validRecords);
      const payload = unwrapApiResponse(response);
      if (payload.success) {
        navigate(`/profile/${user?.id}`);
      }
    } catch (error) {
      console.error('保存失败', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewRecord({ ...records[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setShowAddModal(false);
    setNewRecord({
      id: '',
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      weight: undefined,
      height: undefined,
      matchName: '',
      opponent: '',
      result: '',
      goals: 0,
      assists: 0,
      playTime: 0,
      feeling: '',
      photos: [],
      videos: []
    });
  };

  // 计算统计数据
  const calculateStats = () => {
    if (records.length === 0) {
      return { totalRecords: 0, totalGoals: 0, totalAssists: 0, totalPlayTime: 0, avgGoals: 0, avgAssists: 0 };
    }

    const totalGoals = records.reduce((sum, r) => sum + (r.goals || 0), 0);
    const totalAssists = records.reduce((sum, r) => sum + (r.assists || 0), 0);
    const totalPlayTime = records.reduce((sum, r) => sum + (r.playTime || 0), 0);

    return {
      totalRecords: records.length,
      totalGoals,
      totalAssists,
      totalPlayTime,
      avgGoals: (totalGoals / records.length).toFixed(1),
      avgAssists: (totalAssists / records.length).toFixed(1)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${user?.id}`} className="btn-secondary inline-flex items-center gap-2">
            <span>←</span> 返回个人主页
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">📈 成长档案管理</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary"
          >
            ➕ 添加记录
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? '保存中...' : '💾 保存全部'}
          </button>
        </div>
      </div>

      {/* 统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold">{stats.totalRecords}</div>
          <div className="text-sm opacity-90">总记录数</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">⚽</div>
          <div className="text-3xl font-bold">{stats.totalGoals}</div>
          <div className="text-sm opacity-90">总进球</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-3xl font-bold">{stats.totalAssists}</div>
          <div className="text-sm opacity-90">总助攻</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-3xl font-bold">{Math.floor(stats.totalPlayTime / 60)}h</div>
          <div className="text-sm opacity-90">总出场时间</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-3xl font-bold">{stats.avgGoals}</div>
          <div className="text-sm opacity-90">场均进球</div>
        </div>
      </div>

      {/* 成长曲线图 */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
          <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
        </div>
      )}

      {/* 成长时间轴 */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📅 成长时间轴</h2>

        {records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无成长记录</h3>
            <p className="text-gray-500 mb-6">点击"添加记录"开始记录你的成长历程</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              添加第一条记录
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* 时间轴线 */}
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {records.map((record, index) => (
              <div key={record.id || index} className="relative pl-12 md:pl-20 pb-8 last:pb-0">
                {/* 时间点 */}
                <div className="absolute left-2 md:left-6 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow"></div>

                {/* 记录卡片 */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-green-600 font-semibold mb-1">
                        {record.date}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{record.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(index)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 比赛信息 */}
                  {(record.matchName || record.opponent || record.result) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      {record.matchName && (
                        <div>
                          <span className="text-gray-500">比赛:</span>
                          <span className="ml-2 font-semibold">{record.matchName}</span>
                        </div>
                      )}
                      {record.opponent && (
                        <div>
                          <span className="text-gray-500">对手:</span>
                          <span className="ml-2 font-semibold">{record.opponent}</span>
                        </div>
                      )}
                      {record.result && (
                        <div>
                          <span className="text-gray-500">结果:</span>
                          <span className={`ml-2 font-semibold ${
                            record.result === '胜' ? 'text-green-600' :
                            record.result === '负' ? 'text-red-600' : 'text-gray-600'
                          }`}>{record.result}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 表现数据 */}
                  {(record.goals || record.assists || record.playTime) && (
                    <div className="flex flex-wrap gap-4 mb-4">
                      {record.goals !== undefined && record.goals > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ⚽ {record.goals} 球
                        </span>
                      )}
                      {record.assists !== undefined && record.assists > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          🎯 {record.assists} 助攻
                        </span>
                      )}
                      {record.playTime !== undefined && record.playTime > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          ⏱️ {record.playTime} 分钟
                        </span>
                      )}
                    </div>
                  )}

                  {/* 身体数据 */}
                  {(record.weight || record.height) && (
                    <div className="flex flex-wrap gap-4 mb-4">
                      {record.weight && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          ⚖️ {record.weight} kg
                        </span>
                      )}
                      {record.height && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          📏 {record.height} cm
                        </span>
                      )}
                    </div>
                  )}

                  {/* 内容描述 */}
                  {record.content && (
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{record.content}</p>
                  )}

                  {/* 个人感受 */}
                  {record.feeling && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="text-sm text-yellow-800 font-semibold mb-1">💭 个人感受</div>
                      <p className="text-sm text-yellow-700">{record.feeling}</p>
                    </div>
                  )}

                  {/* 照片/视频 */}
                  {(record.photos?.length || record.videos?.length) && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      {record.photos && record.photos.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-500 mb-2">📷 照片</div>
                          <div className="flex flex-wrap gap-2">
                            {record.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {record.videos && record.videos.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-500 mb-2">🎬 视频</div>
                          <div className="flex flex-wrap gap-2">
                            {record.videos.map((video, idx) => (
                              <video
                                key={idx}
                                src={video}
                                controls
                                className="w-40 h-24 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑记录弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">➕ 添加成长记录</h2>
              <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例如: 市联赛决赛"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  />
                </div>
              </div>

              {/* 比赛信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比赛名称</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例如: 市联赛"
                    value={newRecord.matchName}
                    onChange={(e) => setNewRecord({ ...newRecord, matchName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">对手</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例如: 皇马青训"
                    value={newRecord.opponent}
                    onChange={(e) => setNewRecord({ ...newRecord, opponent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结果</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.result}
                    onChange={(e) => setNewRecord({ ...newRecord, result: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="胜">胜</option>
                    <option value="负">负</option>
                    <option value="平">平</option>
                  </select>
                </div>
              </div>

              {/* 表现数据 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">进球数</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.goals}
                    onChange={(e) => setNewRecord({ ...newRecord, goals: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">助攻数</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.assists}
                    onChange={(e) => setNewRecord({ ...newRecord, assists: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出场时间(分钟)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.playTime}
                    onChange={(e) => setNewRecord({ ...newRecord, playTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* 身体数据 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例如: 65.5"
                    value={newRecord.weight || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="例如: 175"
                    value={newRecord.height || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, height: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              {/* 内容描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容描述</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                  placeholder="记录这段时间的训练内容、比赛表现、收获与感想..."
                  value={newRecord.content}
                  onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                />
              </div>

              {/* 个人感受 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人感受</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[80px]"
                  placeholder="记录你的感受和心得..."
                  value={newRecord.feeling || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, feeling: e.target.value })}
                />
              </div>

              {/* 照片/视频上传 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">照片 (URL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="输入照片URL,用逗号分隔多个"
                    value={newRecord.photos?.join(',') || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, photos: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">视频 (URL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="输入视频URL,用逗号分隔多个"
                    value={newRecord.videos?.join(',') || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, videos: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button onClick={cancelEditing} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddRecord} className="btn-primary">
                ✅ 添加记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑记录弹窗 */}
      {editingIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">✏️ 编辑成长记录</h2>
              <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  />
                </div>
              </div>

              {/* 其他表单字段与添加弹窗相同 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">比赛名称</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.matchName || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, matchName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">对手</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.opponent || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, opponent: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结果</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.result || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, result: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="胜">胜</option>
                    <option value="负">负</option>
                    <option value="平">平</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">进球数</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.goals || 0}
                    onChange={(e) => setNewRecord({ ...newRecord, goals: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">助攻数</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.assists || 0}
                    onChange={(e) => setNewRecord({ ...newRecord, assists: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出场时间(分钟)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.playTime || 0}
                    onChange={(e) => setNewRecord({ ...newRecord, playTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.weight || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.height || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, height: e.target.value ? parseInt(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容描述</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                  value={newRecord.content || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, content: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人感受</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[80px]"
                  value={newRecord.feeling || ''}
                  onChange={(e) => setNewRecord({ ...newRecord, feeling: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">照片 (URL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.photos?.join(',') || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, photos: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">视频 (URL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newRecord.videos?.join(',') || ''}
                    onChange={(e) => setNewRecord({ ...newRecord, videos: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button onClick={cancelEditing} className="btn-secondary">
                取消
              </button>
              <button onClick={() => handleUpdateRecord(editingIndex)} className="btn-primary">
                ✅ 保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditGrowth;
