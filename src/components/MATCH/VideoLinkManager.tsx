import React, { useState, useEffect } from 'react';
import { Link, Plus, X, ExternalLink, Cloud, FileVideo, Copy, Check } from 'lucide-react';
import type { MatchVideoItem } from '@/services/matchApi';
import { matchApi } from '@/services/matchApi';

interface VideoLinkManagerProps {
  matchId: number;
  videos: MatchVideoItem[];
  onVideosChange?: (videos: MatchVideoItem[]) => void;
  readonly?: boolean;
}

const PLATFORMS = [
  { value: 'baidu', label: '百度网盘', icon: Cloud },
  { value: 'tencent', label: '腾讯微云', icon: Cloud },
  { value: 'bilibili', label: '哔哩哔哩', icon: FileVideo },
  { value: 'other', label: '其他平台', icon: Link },
] as const;

export const VideoLinkManager: React.FC<VideoLinkManagerProps> = ({
  matchId,
  videos,
  onVideosChange,
  readonly = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    platform: 'baidu' as const,
    url: '',
    code: '',
    name: '',
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) return;

    setLoading(true);
    try {
      const response = await matchApi.addVideo(matchId, {
        platform: formData.platform,
        url: formData.url,
        code: formData.code || undefined,
        name: formData.name || `${PLATFORMS.find(p => p.value === formData.platform)?.label} 视频`,
        note: formData.note || undefined,
      });

      if (response.data.success) {
        const newVideo = response.data.data;
        onVideosChange?.([...videos, newVideo]);

        // 重置表单
        setFormData({
          platform: 'baidu',
          url: '',
          code: '',
          name: '',
          note: '',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('添加视频链接失败:', error);
      alert('添加失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    if (!confirm('确定要删除这个视频链接吗？')) return;

    setLoading(true);
    try {
      const response = await matchApi.deleteVideo(matchId, videoId);
      if (response.data.success) {
        onVideosChange?.(videos.filter(v => v.id !== videoId));
      }
    } catch (error) {
      console.error('删除视频链接失败:', error);
      alert('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const getPlatformIcon = (platform: string) => {
    const platformConfig = PLATFORMS.find(p => p.value === platform);
    return platformConfig?.icon || Link;
  };

  const getPlatformLabel = (platform: string) => {
    const platformConfig = PLATFORMS.find(p => p.value === platform);
    return platformConfig?.label || platform;
  };

  return (
    <div className="space-y-4">
      {/* 视频列表 */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video, index) => {
            const Icon = getPlatformIcon(video.platform);
            return (
              <div
                key={video.id || index}
                className="bg-[#0f1419] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* 平台图标 */}
                  <div className="w-10 h-10 rounded-lg bg-[#39ff14]/10 flex items-center justify-center shrink-0">
                    <Icon className="text-[#39ff14]" size={20} />
                  </div>

                  {/* 视频信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium truncate">{video.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                        {getPlatformLabel(video.platform)}
                      </span>
                    </div>

                    {/* URL */}
                    <div className="flex items-center gap-2 mb-2">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 text-sm hover:text-[#39ff14] transition-colors truncate flex items-center gap-1"
                      >
                        {video.url}
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    {/* 提取码和备注 */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {video.code && (
                        <div className="flex items-center gap-1">
                          <span>提取码:</span>
                          <button
                            onClick={() => handleCopy(video.code!, index)}
                            className="text-[#39ff14] hover:text-[#22c55e] transition-colors font-mono"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check size={14} /> 已复制
                              </>
                            ) : (
                              <>
                                <span>{video.code}</span>
                                <Copy size={14} />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {video.note && <span>•</span>}
                      {video.note && <span>{video.note}</span>}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  {!readonly && (
                    <button
                      onClick={() => video.id && handleDelete(video.id)}
                      disabled={loading}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                      title="删除视频链接"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
          <FileVideo className="mx-auto text-gray-600 mb-2" size={40} />
          <p className="text-gray-500 text-sm">暂无视频链接</p>
        </div>
      )}

      {/* 添加按钮 */}
      {!readonly && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-[#39ff14] hover:text-[#39ff14] transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          添加视频链接
        </button>
      )}

      {/* 添加表单 */}
      {!readonly && showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#0f1419] border border-gray-800 rounded-lg p-4 space-y-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Plus size={18} />
            添加视频链接
          </h4>

          {/* 平台选择 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">视频平台</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, platform: platform.value as any })}
                  className={`py-2 px-3 rounded-lg border transition-all ${
                    formData.platform === platform.value
                      ? 'border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14]'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <platform.icon size={20} />
                    <span className="text-xs">{platform.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">视频链接 *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="请输入视频链接"
              required
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none"
            />
          </div>

          {/* 提取码（可选） */}
          {formData.platform === 'baidu' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">提取码（可选）</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="请输入提取码"
                maxLength={4}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none"
              />
            </div>
          )}

          {/* 名称 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">视频名称（可选）</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="为视频添加一个名称"
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">备注（可选）</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="添加备注信息"
              rows={2}
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !formData.url.trim()}
              className="flex-1 py-2 bg-[#39ff14] hover:bg-[#22c55e] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '添加中...' : '添加'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VideoLinkManager;
