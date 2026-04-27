import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Video, FileVideo, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { uploadApi } from '../services/api';

interface VideoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FormErrors {
  videos?: string;
  playerName?: string;
  playerPosition?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/mov'];

// 表单自动保存的key
const FORM_STORAGE_KEY = 'videoAnalysisFormDraft';

const VideoUploader: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [matchName, setMatchName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 组件挂载时，尝试从 localStorage 恢复表单数据
  useEffect(() => {
    const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        // 只恢复表单字段，不恢复视频文件（因为File对象无法序列化）
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.matchName) setMatchName(parsed.matchName);
        if (parsed.playerPosition) setPlayerPosition(parsed.playerPosition);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) {
        console.error('Failed to restore form data:', e);
      }
    }
  }, []);

  // 表单数据变化时，自动保存到 localStorage
  useEffect(() => {
    const formData = {
      playerName,
      matchName,
      playerPosition,
      notes,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [playerName, matchName, playerPosition, notes]);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 MP4、MOV 格式的视频文件';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (videos.length === 0) {
      newErrors.videos = '请至少上传一个视频文件';
    }

    if (!playerName.trim()) {
      newErrors.playerName = '请输入球员姓名';
    }


    if (!playerPosition) {
      newErrors.playerPosition = '请选择球员位置';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // 添加视频文件
  const addVideo = (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    const video: VideoFile = {
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
    };

    setVideos((prev) => [...prev, video]);
    
    // 清除视频错误
    if (errors.videos) {
      setErrors(prev => ({ ...prev, videos: undefined }));
    }
  };

  // 移除视频
  const removeVideo = (id: string) => {
    setVideos((prev) => {
      const video = prev.find((v) => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.preview);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  // 拖放处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith('video/')) {
        addVideo(file);
      }
    });
  }, []);

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => addVideo(file));
    e.target.value = '';
  };

  // 提交订单
  const handleSubmit = async () => {
    // 触发表单字段的 touched 状态
    setTouched({
      videos: true,
      playerName: true,
      playerPosition: true,
    });

    // 验证表单
    if (!validateForm()) {
      // 滚动到第一个错误字段
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!isAuthenticated) {
      // 保存当前表单数据到 sessionStorage
      const formData = {
        videos: videos.map((v) => ({ id: v.id, name: v.name })),
        playerName,
        matchName,
        playerPosition,
        notes,
      };
      sessionStorage.setItem('videoAnalysisForm', JSON.stringify(formData));
      sessionStorage.setItem('redirectAfterLogin', '/video-analysis');

      if (confirm('请先登录后再提交视频分析订单\n\n点击确定前往登录页面')) {
        navigate('/login');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // 真正上传视频到后端本地存储
      const uploadedVideos = [];
      for (const video of videos) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, status: 'uploading', progress: 0 } : v
          )
        );

        const res: any = await uploadApi.uploadFile(video.file, 'videos');
        const url = res.data?.data?.url;

        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, status: 'completed', progress: 100 } : v
          )
        );

        uploadedVideos.push({
          id: video.id,
          name: video.name,
          size: video.size,
          preview: url || video.preview,
          url: url || video.preview,
        });
      }

      // 保存订单数据到 state，跳转到分析师选择页面
      const orderData = {
        videos: uploadedVideos,
        playerInfo: {
          playerName: playerName.trim(),
          matchName: matchName.trim(),
          playerPosition,
          notes: notes.trim(),
        },
        timestamp: new Date().toISOString(),
      };

      // 保存到 sessionStorage，防止刷新丢失
      sessionStorage.setItem('currentOrder', JSON.stringify(orderData));

      // 跳转到分析师选择页面
      navigate('/analyst-select', {
        state: orderData,
      });
    } catch (error) {
      console.error('Submit error:', error);
      alert('提交失败，请检查网络连接后重试');

      // 重置上传状态
      setVideos((prev) =>
        prev.map((v) =>
          v.status === 'uploading' ? { ...v, status: 'error', error: '上传失败' } : v
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-primary pt-[100px] pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent to-accent-light px-8 py-6">
            <h1 className="text-2xl font-bold text-white">上传比赛视频</h1>
            <p className="text-white/80 mt-1">专业分析师将为您提供详细的球探报告</p>
          </div>

          <div className="p-8">
            {/* Video Upload Area */}
            <div className="mb-8">
              <label className="block text-primary font-semibold mb-3">
                上传视频 <span className="text-red-500">*</span>
                <span className="text-slate-400 text-sm font-normal ml-2">（最多3个，单个不超过500MB）</span>
              </label>

              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-accent bg-accent/5'
                    : 'border-slate-300 hover:border-accent hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/mov"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    点击或拖拽视频文件到此处上传
                  </p>
                  <p className="text-slate-400 text-sm">
                    支持 MP4、MOV 格式，单个文件最大 500MB
                  </p>
                </div>
              </div>

              {/* Video List */}
              {videos.length > 0 && (
                <div className="mt-6 space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                        <video
                          src={video.preview}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {video.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(video.size)}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {video.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {video.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <button
                          onClick={() => removeVideo(video.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Player Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-primary font-semibold mb-2">
                  球员姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    if (errors.playerName) {
                      setErrors(prev => ({ ...prev, playerName: undefined }));
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, playerName: true }))}
                  placeholder="请输入球员真实姓名"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-accent transition-colors ${
                    errors.playerName && touched.playerName
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200'
                  }`}
                />
                {errors.playerName && touched.playerName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.playerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-primary font-semibold mb-2">
                  比赛名称
                </label>
                <input
                  type="text"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="例如：2024年U15全国青少年联赛"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-primary font-semibold mb-2">
                  球员位置 <span className="text-red-500">*</span>
                </label>
                <select
                  value={playerPosition}
                  onChange={(e) => {
                    setPlayerPosition(e.target.value);
                    if (errors.playerPosition) {
                      setErrors(prev => ({ ...prev, playerPosition: undefined }));
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, playerPosition: true }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-accent transition-colors bg-white ${
                    errors.playerPosition && touched.playerPosition
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200'
                  }`}
                >
                  <option value="">请选择位置</option>
                  <optgroup label="前锋">
                    <option value="ST">前锋（ST/CF）</option>
                    <option value="LW">左边锋（LW）</option>
                    <option value="RW">右边锋（RW）</option>
                  </optgroup>
                  <optgroup label="中场">
                    <option value="CAM">攻击型中场（CAM）</option>
                    <option value="CM">中场（CM）</option>
                    <option value="CDM">防守型中场（CDM）</option>
                    <option value="LM">左边前卫（LM）</option>
                    <option value="RM">右边前卫（RM）</option>
                  </optgroup>
                  <optgroup label="后卫">
                    <option value="LB">左边后卫（LB）</option>
                    <option value="RB">右边后卫（RB）</option>
                    <option value="CB">中后卫（CB）</option>
                  </optgroup>
                  <optgroup label="门将">
                    <option value="GK">门将（GK）</option>
                  </optgroup>
                </select>
                {errors.playerPosition && touched.playerPosition && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.playerPosition}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-primary font-semibold mb-2">
                  备注说明
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="请描述您希望分析师重点关注的方面，例如：想要提升的技术、比赛中的具体问题等"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <div className="text-slate-500 text-sm">
                {videos.length > 0 && (
                  <span>
                    已选择 {videos.length} 个视频，共 {formatFileSize(videos.reduce((acc, v) => acc + v.size, 0))}
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || videos.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-accent to-accent-light text-white rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    提交中...
                  </span>
                ) : (
                  '下一步：选择分析师'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;