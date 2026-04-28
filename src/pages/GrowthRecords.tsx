import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi, unwrapApiResponse } from '../services/api';
import { Loading } from '../components';
import {
  Calendar, Trophy, Zap, BookOpen, Plus, Edit2, Trash2,
  ChevronDown, ChevronUp, Video, Star, MapPin
} from 'lucide-react';
import { LikeButton, FavoriteButton, CommentSection } from '../components/social';

// 成长记录类型
interface GrowthRecord {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'training' | 'match' | 'honor' | 'milestone';
  location?: string;
  opponent?: string;
  score?: string;
  videoUrl?: string;
  images?: string[];
  tags?: string[];
}

const typeConfig = {
  training: { label: '训练', icon: Zap, color: 'bg-blue-500', borderColor: 'border-blue-500' },
  match: { label: '比赛', icon: Trophy, color: 'bg-emerald-500', borderColor: 'border-emerald-500' },
  honor: { label: '荣誉', icon: Star, color: 'bg-yellow-500', borderColor: 'border-yellow-500' },
  milestone: { label: '里程碑', icon: BookOpen, color: 'bg-purple-500', borderColor: 'border-purple-500' },
};

const GrowthRecords: React.FC = () => {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<Partial<GrowthRecord>>({
    type: 'training',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    location: '',
    opponent: '',
    score: '',
    tags: [],
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await userApi.getGrowthRecords();
      const payload = unwrapApiResponse(response);
      if (payload.success && payload.data) {
        setRecords(payload.data.records || payload.data);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('加载成长记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date) return;

    try {
      if (editingRecord) {
        // 更新记录
        const response = await userApi.updateGrowthRecord(editingRecord.id, formData);
        const payload = unwrapApiResponse(response);
        if (payload.success) {
          setRecords(records.map(r => r.id === editingRecord.id ? { ...r, ...formData } as GrowthRecord : r));
        }
      } else {
        // 创建新记录
        const response = await userApi.createGrowthRecord(formData);
        const payload = unwrapApiResponse(response);
        if (payload.success && payload.data) {
          setRecords([payload.data, ...records]);
        }
      }
      resetForm();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await userApi.deleteGrowthRecord(id);
      const payload = unwrapApiResponse(response);
      if (payload.success) {
        setRecords(records.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleEdit = (record: GrowthRecord) => {
    setEditingRecord(record);
    setFormData(record);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'training',
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      location: '',
      opponent: '',
      score: '',
      tags: [],
    });
    setEditingRecord(null);
    setShowForm(false);
  };

  // 按年份分组
  const groupedRecords = records.reduce((groups, record) => {
    const year = record.date.split('-')[0];
    if (!groups[year]) groups[year] = [];
    groups[year].push(record);
    return groups;
  }, {} as Record<string, GrowthRecord[]>);

  const sortedYears = Object.keys(groupedRecords).sort((a, b) => parseInt(b) - parseInt(a));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/user-dashboard" className="text-white/60 hover:text-white transition-colors">
                ← 返回
              </Link>
              <h1 className="text-2xl font-bold text-white">成长记录</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加记录
            </button>
          </div>
          <p className="text-white/60">记录您的足球成长历程，见证每一步进步</p>
        </div>

        {/* 添加/编辑表单 */}
        {showForm && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">
              {editingRecord ? '编辑记录' : '添加新记录'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">记录类型</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as GrowthRecord['type'] })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="training">训练</option>
                  <option value="match">比赛</option>
                  <option value="honor">荣誉</option>
                  <option value="milestone">里程碑</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/70 mb-2">日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="如：入选校队主力阵容"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="记录这次经历的详细信息..."
                />
              </div>
              
              {formData.type === 'match' && (
                <>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">比赛地点</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="如：市体育中心"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">对手</label>
                    <input
                      type="text"
                      value={formData.opponent}
                      onChange={e => setFormData({ ...formData, opponent: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="如：实验小学"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">比分</label>
                    <input
                      type="text"
                      value={formData.score}
                      onChange={e => setFormData({ ...formData, score: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="如：2:1"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-400 hover:to-teal-400 transition-all"
              >
                {editingRecord ? '保存修改' : '添加记录'}
              </button>
            </div>
          </div>
        )}

        {/* 时间轴 */}
        <div className="space-y-8">
          {sortedYears.map(year => (
            <div key={year}>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl font-bold text-emerald-400">{year}</span>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-sm text-white/40">{groupedRecords[year].length} 条记录</span>
              </div>
              
              <div className="space-y-4">
                {groupedRecords[year].map(record => {
                  const config = typeConfig[record.type];
                  const Icon = config.icon;
                  const isExpanded = expandedRecord === record.id;
                  
                  return (
                    <div
                      key={record.id}
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
                    >
                      <div className="flex gap-4">
                        {/* 类型图标 */}
                        <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-white/40">{record.date}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${config.color} bg-opacity-20 text-white`}>
                                  {config.label}
                                </span>
                              </div>
                              <h3 className="font-bold text-white">{record.title}</h3>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 text-white/40 hover:text-emerald-400 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* 比赛信息 */}
                          {record.type === 'match' && (record.opponent || record.score) && (
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {record.opponent && (
                                <span className="text-white/60">vs {record.opponent}</span>
                              )}
                              {record.score && (
                                <span className="text-emerald-400 font-bold">{record.score}</span>
                              )}
                              {record.location && (
                                <span className="text-white/40 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {record.location}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* 描述 */}
                          <p className={`text-white/60 mt-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {record.description}
                          </p>
                          
                          {/* 展开/收起 */}
                          {record.description.length > 100 && (
                            <button
                              onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                              className="text-emerald-400 text-sm mt-2 hover:underline"
                            >
                              {isExpanded ? '收起' : '展开更多'}
                            </button>
                          )}
                          
                          {/* 标签 */}
                          {record.tags && record.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {record.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/60"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* 视频链接 */}
                          {record.videoUrl && (
                            <a
                              href={record.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-3 text-emerald-400 text-sm hover:underline"
                            >
                              <Video className="w-4 h-4" />
                              观看视频
                            </a>
                          )}

                          {/* 点赞和收藏 */}
                          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
                            <LikeButton
                              targetType="growth_record"
                              targetId={parseInt(record.id) || 0}
                              initialCount={0}
                              size="sm"
                            />
                            <FavoriteButton
                              targetType="growth_record"
                              targetId={parseInt(record.id) || 0}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {records.length === 0 && !showForm && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">还没有成长记录</h3>
            <p className="text-white/40 mb-6">开始记录您的足球成长历程吧</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-400 hover:to-teal-400 transition-all"
            >
              添加第一条记录
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthRecords;
