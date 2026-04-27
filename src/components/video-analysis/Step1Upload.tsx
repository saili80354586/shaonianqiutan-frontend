import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  Video,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileVideo,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import VideoSizeWarningModal from './VideoSizeWarningModal';
import UploadRules from './UploadRules';

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
  jerseyColor?: string;
  jerseyNumber?: string;
}

interface Step1UploadProps {
  onNext: (data: any) => void;
  initialData?: any;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const RECOMMENDED_MAX_SIZE = 100 * 1024 * 1024; // 100MB 推荐大小
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/mov', 'video/avi', 'video/x-msvideo'];
const FORM_STORAGE_KEY = 'videoAnalysisFormDraft';
const MAX_VIDEOS = 5; // 最多上传5个视频

const positions = [
  { value: 'GK', label: '门将 (GK)' },
  { value: 'LB', label: '左边后卫 (LB)' },
  { value: 'CB', label: '中后卫 (CB)' },
  { value: 'RB', label: '右边后卫 (RB)' },
  { value: 'CDM', label: '防守型中场 (CDM)' },
  { value: 'CM', label: '中场 (CM)' },
  { value: 'CAM', label: '攻击型中场 (CAM)' },
  { value: 'LM', label: '左边前卫 (LM)' },
  { value: 'RM', label: '右边前卫 (RM)' },
  { value: 'LW', label: '左边锋 (LW)' },
  { value: 'RW', label: '右边锋 (RW)' },
  { value: 'ST', label: '前锋 (ST/CF)' },
];

const Step1Upload: React.FC<Step1UploadProps> = ({ onNext, initialData }) => {
  const { isAuthenticated } = useAuthStore();
  const [videos, setVideos] = useState<VideoFile[]>(initialData?.videos || []);
  const [isDragging, setIsDragging] = useState(false);
  const [playerName, setPlayerName] = useState(initialData?.playerInfo?.playerName || '');
  const [matchName, setMatchName] = useState(initialData?.playerInfo?.matchName || '');
  const [matchDate, setMatchDate] = useState(initialData?.playerInfo?.matchDate || '');
  const [playerPosition, setPlayerPosition] = useState(initialData?.playerInfo?.playerPosition || '');
  const [jerseyColor, setJerseyColor] = useState(initialData?.playerInfo?.jerseyColor || '');
  const [jerseyNumber, setJerseyNumber] = useState(initialData?.playerInfo?.jerseyNumber || '');
  const [notes, setNotes] = useState(initialData?.playerInfo?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [oversizedFile, setOversizedFile] = useState<File | null>(null);

  // 组件挂载时，尝试从 localStorage 恢复表单数据
  useEffect(() => {
    if (!initialData) {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          if (parsed.playerName) setPlayerName(parsed.playerName);
          if (parsed.matchName) setMatchName(parsed.matchName);
          if (parsed.matchDate) setMatchDate(parsed.matchDate);
          if (parsed.playerPosition) setPlayerPosition(parsed.playerPosition);
          if (parsed.jerseyColor) setJerseyColor(parsed.jerseyColor);
          if (parsed.jerseyNumber) setJerseyNumber(parsed.jerseyNumber);
          if (parsed.notes) setNotes(parsed.notes);
        } catch (e) {
          console.error('Failed to restore form data:', e);
        }
      }
    }
  }, [initialData]);

  // 表单数据变化时，自动保存到 localStorage
  useEffect(() => {
    const formData = {
      playerName,
      matchName,
      matchDate,
      playerPosition,
      jerseyColor,
      jerseyNumber,
      notes,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [playerName, matchName, matchDate, playerPosition, jerseyColor, jerseyNumber, notes]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 MP4、MOV、AVI 格式的视频文件';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

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

    if (!jerseyColor.trim()) {
      newErrors.jerseyColor = '请输入球衣颜色';
    }

    if (!jerseyNumber) {
      newErrors.jerseyNumber = '请输入球衣号码';
    } else if (parseInt(jerseyNumber) < 1 || parseInt(jerseyNumber) > 99) {
      newErrors.jerseyNumber = '球衣号码必须在1-99之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVideo = (file: File) => {
    // 检查是否已达到最大数量限制
    if (videos.length >= MAX_VIDEOS) {
      alert(`最多只能上传 ${MAX_VIDEOS} 个视频`);
      return;
    }

    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    // 检查文件大小是否超过推荐值
    if (file.size > RECOMMENDED_MAX_SIZE) {
      setOversizedFile(file);
      setShowSizeWarning(true);
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

    if (errors.videos) {
      setErrors((prev) => ({ ...prev, videos: undefined }));
    }
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => {
      const video = prev.find((v) => v.id === id);
      if (video) {
        URL.revokeObjectURL(video.preview);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => addVideo(file));
    e.target.value = '';
  };

  const handleContinueWithOversized = () => {
    if (oversizedFile) {
      const video: VideoFile = {
        id: generateId(),
        file: oversizedFile,
        preview: URL.createObjectURL(oversizedFile),
        name: oversizedFile.name,
        size: oversizedFile.size,
        progress: 0,
        status: 'pending',
      };
      setVideos((prev) => [...prev, video]);
      setOversizedFile(null);
    }
    setShowSizeWarning(false);
  };

  const handleSubmit = async () => {
    setTouched({
      videos: true,
      playerName: true,
      playerPosition: true,
      jerseyColor: true,
      jerseyNumber: true,
    });

    if (!validateForm()) {
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    // 模拟上传
    for (const video of videos) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, status: 'uploading', progress: 0 } : v
        )
      );

      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, progress } : v
          )
        );
      }

      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, status: 'completed', progress: 100 } : v
        )
      );
    }

    const orderData = {
      videos: videos.map((v) => ({
        id: v.id,
        name: v.name,
        size: v.size,
        preview: v.preview,
      })),
      playerInfo: {
        playerName: playerName.trim(),
        matchName: matchName.trim(),
        matchDate,
        playerPosition,
        jerseyColor: jerseyColor.trim(),
        jerseyNumber: parseInt(jerseyNumber),
        notes: notes.trim(),
      },
      timestamp: new Date().toISOString(),
    };

    setIsSubmitting(false);
    onNext(orderData);
  };

  return (
    <div className="space-y-6">
      {/* Video Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-emerald-400" />
            上传视频
          </h3>
          {/* 视频数量指示器 */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              videos.length >= MAX_VIDEOS ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {videos.length}/{MAX_VIDEOS}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: MAX_VIDEOS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < videos.length ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Upload Zone - 达到上限时禁用 */}
        {videos.length < MAX_VIDEOS ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50'
            } ${errors.videos && touched.videos ? 'border-red-500 bg-red-500/5' : ''}`}
          >
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/mov,video/avi"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="pointer-events-none">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <p className="text-white font-medium mb-1">
                点击或拖拽添加第 {videos.length + 1} 个视频
              </p>
              <p className="text-slate-400 text-sm">
                支持 MP4、MOV、AVI 格式，单个不超过 500MB
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400 border border-slate-600">
                  MP4
                </span>
                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400 border border-slate-600">
                  MOV
                </span>
                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400 border border-slate-600">
                  AVI
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 达到上限时的提示 */
          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-900/30">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-white font-medium mb-1">
              已达到最大上传数量
            </p>
            <p className="text-slate-400 text-sm">
              如需更换视频，请先删除已上传的视频
            </p>
          </div>
        )}

        {errors.videos && touched.videos && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.videos}
          </p>
        )}

        {/* Video List */}
        <AnimatePresence>
          {videos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-4 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="relative w-20 h-14 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    <video
                      src={video.preview}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {video.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(video.size)}
                    </p>
                    {video.status === 'uploading' && (
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${video.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {video.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {video.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button
                      onClick={() => removeVideo(video.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Upload Rules */}
      <UploadRules />

      {/* Video Info Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">📝</span>
          视频信息
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              比赛名称
            </label>
            <input
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder="例如：2025年青少年足球联赛"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              比赛日期
            </label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {/* Player Info Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 ${
          (errors.playerName && touched.playerName) ||
          (errors.playerPosition && touched.playerPosition) ||
          (errors.jerseyColor && touched.jerseyColor) ||
          (errors.jerseyNumber && touched.jerseyNumber)
            ? 'error-field'
            : ''
        }`}
      >
        <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <span className="text-xl">👤</span>
          球员信息确认
          <span className="text-red-400">*</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              球员姓名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (errors.playerName) {
                  setErrors((prev) => ({ ...prev, playerName: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, playerName: true }))}
              placeholder="请输入球员姓名"
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                errors.playerName && touched.playerName
                  ? 'border-red-500'
                  : 'border-slate-700'
              }`}
            />
            {errors.playerName && touched.playerName && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.playerName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              场上位置 <span className="text-red-400">*</span>
            </label>
            <select
              value={playerPosition}
              onChange={(e) => {
                setPlayerPosition(e.target.value);
                if (errors.playerPosition) {
                  setErrors((prev) => ({ ...prev, playerPosition: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, playerPosition: true }))}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors ${
                errors.playerPosition && touched.playerPosition
                  ? 'border-red-500'
                  : 'border-slate-700'
              }`}
            >
              <option value="">请选择位置</option>
              {positions.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
            {errors.playerPosition && touched.playerPosition && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.playerPosition}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              球衣颜色 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={jerseyColor}
              onChange={(e) => {
                setJerseyColor(e.target.value);
                if (errors.jerseyColor) {
                  setErrors((prev) => ({ ...prev, jerseyColor: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, jerseyColor: true }))}
              placeholder="例如：主场红色、客场蓝色"
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                errors.jerseyColor && touched.jerseyColor
                  ? 'border-red-500'
                  : 'border-slate-700'
              }`}
            />
            {errors.jerseyColor && touched.jerseyColor && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.jerseyColor}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              球衣号码 <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={jerseyNumber}
              onChange={(e) => {
                setJerseyNumber(e.target.value);
                if (errors.jerseyNumber) {
                  setErrors((prev) => ({ ...prev, jerseyNumber: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, jerseyNumber: true }))}
              placeholder="请输入1-99的正整数"
              min="1"
              max="99"
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors ${
                errors.jerseyNumber && touched.jerseyNumber
                  ? 'border-red-500'
                  : 'border-slate-700'
              }`}
            />
            {errors.jerseyNumber && touched.jerseyNumber && (
              <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.jerseyNumber}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-300 font-medium mb-2">
              备注说明
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="请描述您希望分析师重点关注的方面，例如：想要提升的技术、比赛中的具体问题等"
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between pt-4"
      >
        <div className="text-slate-400 text-sm">
          {videos.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span>
                已上传 {videos.length}/{MAX_VIDEOS} 个视频，共 {formatFileSize(videos.reduce((acc, v) => acc + v.size, 0))}
              </span>
              {videos.length < MAX_VIDEOS && (
                <span className="text-emerald-400 text-xs">
                  还可上传 {MAX_VIDEOS - videos.length} 个视频
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500">请至少上传 1 个视频</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || videos.length === 0}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              下一步：选择分析师
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>

      {/* Video Size Warning Modal */}
      <VideoSizeWarningModal
        isOpen={showSizeWarning}
        fileSize={oversizedFile?.size || 0}
        onClose={() => {
          setShowSizeWarning(false);
          setOversizedFile(null);
        }}
        onContinue={handleContinueWithOversized}
      />
    </div>
  );
};

export default Step1Upload;
