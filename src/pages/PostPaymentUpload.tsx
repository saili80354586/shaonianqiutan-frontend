import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Upload, X, Video, AlertCircle, CheckCircle2, Loader2,
  ArrowLeft, FileText, ChevronRight, Save, ShieldCheck, Check,
} from 'lucide-react';
import { orderApi, uploadApi } from '../services/api';

interface VideoFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  duration: number; // 视频时长（秒）
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

interface FormErrors {
  videos?: string;
  playerName?: string;
  playerPosition?: string;
  jerseyNumber?: string;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/mov'];

const packageNames: Record<string, string> = {
  basic: '专业文字版',
  pro: '视频解析版',
  text: '文字咨询',
  video: '视频分析',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function FadeInUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `opacity 0.45s ease-out, transform 0.45s ease-out`,
    }}>
      {children}
    </div>
  );
}

function VideoItem({ video, onRemove }: { video: VideoFile; onRemove: (id: string) => void }) {
  return (
    <div
      className="flex items-center gap-4 bg-[#0f1419] rounded-xl p-4 border border-gray-800 animate-[slideIn_0.3s_ease-out]"
    >
      <div className="relative w-24 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
        <video src={video.preview} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Video className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{video.name}</p>
        <p className="text-sm text-gray-500">{formatFileSize(video.size)}</p>
      </div>
      <div className="flex items-center gap-2">
        {video.status === 'completed' && (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        )}
        {video.status === 'error' && (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
        {video.status === 'uploading' && (
          <div className="w-8 h-8 rounded-full bg-[#39ff14]/20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#39ff14] animate-spin" />
          </div>
        )}
        <button
          onClick={() => onRemove(video.id)}
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

const PostPaymentUpload: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [matchName, setMatchName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [jerseyColor, setJerseyColor] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragPulseRef = useRef<HTMLDivElement>(null);
  const draftKey = `orderUploadDraft_${orderId}`;

  useEffect(() => {
    if (!orderId) { navigate('/'); return; }
    loadOrder();
  }, [orderId]);

  // Restore draft
  useEffect(() => {
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.playerName) setPlayerName(parsed.playerName);
        if (parsed.matchName) setMatchName(parsed.matchName);
        if (parsed.playerPosition) setPlayerPosition(parsed.playerPosition);
        if (parsed.jerseyColor) setJerseyColor(parsed.jerseyColor);
        if (parsed.jerseyNumber) setJerseyNumber(parsed.jerseyNumber);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) { /* ignore */ }
    }
  }, [draftKey]);

  // Auto-save draft
  useEffect(() => {
    const draft = { playerName, matchName, playerPosition, jerseyColor, jerseyNumber, notes, savedAt: new Date().toISOString() };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [playerName, matchName, playerPosition, jerseyColor, jerseyNumber, notes, draftKey]);

  const loadOrder = async () => {
    try {
      const res = await orderApi.getOrderDetail(Number(orderId));
      const data = res.data?.data || res.data;
      if (data) {
        setOrder(data);
        if (data.player_name) setPlayerName(data.player_name);
        if (data.match_name) setMatchName(data.match_name);
        if (data.player_position) setPlayerPosition(data.player_position);
        if (data.jersey_color) setJerseyColor(data.jersey_color);
        if (data.jersey_number) setJerseyNumber(String(data.jersey_number));
        if (data.remark) setNotes(data.remark);
        if (data.video_url && data.status !== 'pending') setSubmitSuccess(true);
      } else {
        setOrder({ id: orderId, status: 'paid', order_type: 'basic', amount: 299 });
      }
    } catch {
      setOrder({ id: orderId, status: 'paid', order_type: 'basic', amount: 299 });
    } finally {
      setLoadingOrder(false);
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return '仅支持 MP4、MOV 格式';
    if (file.size > MAX_FILE_SIZE) return `文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}`;
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (videos.length === 0 && !order?.video_url) newErrors.videos = '请至少上传一个视频';
    if (!playerName.trim()) newErrors.playerName = '请输入球员姓名';
    if (!playerPosition) newErrors.playerPosition = '请选择球员位置';
    if (!jerseyNumber.trim()) newErrors.jerseyNumber = '请输入球衣号码';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVideo = (file: File) => {
    if (videos.length >= 5) { alert('最多5个视频'); return; }
    const err = validateFile(file);
    if (err) { alert(err); return; }
    const preview = URL.createObjectURL(file);
    // 提取视频时长
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      const duration = Math.round(tempVideo.duration) || 0;
      const video: VideoFile = {
        id: generateId(), file,
        preview,
        name: file.name, size: file.size, duration, status: 'pending',
      };
      setVideos(prev => [...prev, video]);
      if (errors.videos) setErrors(prev => ({ ...prev, videos: undefined }));
    };
    tempVideo.onerror = () => {
      URL.revokeObjectURL(tempVideo.src);
      const video: VideoFile = {
        id: generateId(), file,
        preview,
        name: file.name, size: file.size, duration: 0, status: 'pending',
      };
      setVideos(prev => [...prev, video]);
      if (errors.videos) setErrors(prev => ({ ...prev, videos: undefined }));
    };
    tempVideo.src = preview;
  };

  const removeVideo = (id: string) => {
    setVideos(prev => {
      const v = prev.find(x => x.id === id);
      if (v) URL.revokeObjectURL(v.preview);
      return prev.filter(x => x.id !== id);
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
    Array.from(e.dataTransfer.files).forEach(f => { if (f.type.startsWith('video/')) addVideo(f); });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(f => addVideo(f));
    e.target.value = '';
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setTimeout(() => setIsSavingDraft(false), 600);
  };

  const handleSubmit = async () => {
    setTouched({ videos: true, playerName: true, playerPosition: true, jerseyNumber: true });
    if (!validateForm()) {
      document.querySelector('.error-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const video of videos) {
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: 'uploading', progress: 0 } : v));
        const res: any = await uploadApi.uploadFile(video.file, 'videos');
        const url = res.data?.data?.url || res.data?.url;
        uploadedUrls.push(url);
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: 'completed', progress: 100, url } : v));
      }
      const finalVideoUrl = order?.video_url || uploadedUrls[0] || '';
      const finalVideoFilename = videos[0]?.name || order?.video_filename || '';
      const finalVideoDuration = videos[0]?.duration || order?.video_duration || 0;
      await orderApi.supplementOrder(Number(orderId), {
        video_url: finalVideoUrl,
        video_filename: finalVideoFilename,
        video_duration: finalVideoDuration,
        player_name: playerName.trim(),
        player_position: playerPosition,
        jersey_color: jerseyColor.trim(),
        jersey_number: jerseyNumber.trim(),
        match_name: matchName.trim(),
        remark: notes.trim(),
      });
      localStorage.removeItem(draftKey);
      setSubmitSuccess(true);
    } catch (error: any) {
      alert(error?.response?.data?.message || '提交失败');
      setVideos(prev => prev.map(v => v.status === 'uploading' ? { ...v, status: 'error', error: '上传失败' } : v));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Animated success */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            {[0, 400, 800].map(delay => (
              <div key={delay} className="absolute inset-0 rounded-full border-2 border-emerald-400/30" style={{ animation: `pulse-out 2s ease-out ${delay}ms infinite` }} />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">资料提交成功</h1>
          <p className="text-gray-400 mb-8">分析师将在收到视频后尽快开始分析</p>
          <div className="space-y-3">
            <Link
              to={`/order/${orderId}`}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
            >
              查看订单详情 <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/user-dashboard"
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all"
            >
              进入用户中心
            </Link>
          </div>
        </div>
        <style>{`@keyframes pulse-out { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
      </div>
    );
  }

  const alreadyHasVideo = !!order?.video_url;

  return (
    <div className="min-h-screen bg-[#0f1419] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <FadeInUp delay={0}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>返回</span>
            </button>
            <div className="text-sm text-gray-500 font-mono">#{orderId}</div>
          </div>
        </FadeInUp>

        {/* Order banner */}
        <FadeInUp delay={80}>
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold mb-1">订单已支付，请补充比赛视频和球员信息</h2>
                <p className="text-gray-400 text-sm">
                  您购买了 <span className="text-emerald-400 font-medium">{packageNames[order?.order_type] || '专业分析服务'}</span>
                  <span className="mx-2">·</span>
                  分析师将在收到资料后尽快开始工作
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold text-white">¥{order?.amount}</div>
                <div className="text-xs text-gray-500">{order?.order_type === 'pro' ? '5-7个工作日交付' : '3-5个工作日交付'}</div>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* Upload card */}
        <FadeInUp delay={160}>
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden mb-6">
            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Upload className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">上传比赛视频</h3>
            </div>

            <div className="p-6 sm:p-8">
              {/* Video upload area */}
              <div className="mb-8">
                <label className="block text-gray-300 font-medium mb-3">
                  比赛录像 <span className="text-red-400">*</span>
                  <span className="text-gray-500 text-sm font-normal ml-2">（最多5个，单个不超过500MB）</span>
                </label>

                {/* Tips box */}
                <div className="mb-5 p-4 sm:p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-amber-300 font-semibold mb-2">高质量视频 = 更精准的分析 + 更快的交付</h4>
                      <ul className="space-y-1.5 text-sm text-gray-300">
                        {[
                          '最多上传5个视频，同一比赛连续片段最佳',
                          '总时长不超过60分钟',
                          '高位视角拍摄；推荐摄像机或运动云台',
                          '拒绝手持、低角度、竖屏拍摄',
                        ].map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">·</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Drop zone */}
                {!alreadyHasVideo && (
                  <div
                    ref={dragPulseRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]'
                        : 'border-gray-700 hover:border-gray-500 bg-[#0f1419]/50'
                    }`}
                  >
                    {/* Animated dashed border on drag */}
                    {isDragging && (
                      <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-xl animate-pulse" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/mov"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="pointer-events-none">
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        isDragging ? 'bg-emerald-500/20' : 'bg-gray-800'
                      }`}>
                        <Upload className={`w-6 h-6 ${isDragging ? 'text-emerald-400' : 'text-gray-500'}`} />
                      </div>
                      <p className="text-gray-300 font-medium mb-1">点击或拖拽视频到此处</p>
                      <p className="text-gray-500 text-sm">MP4 / MOV，最大 500MB</p>
                    </div>
                  </div>
                )}

                {/* Already uploaded */}
                {alreadyHasVideo && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
                    <div className="relative w-24 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      <video src={order.video_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{order.video_filename || '已上传视频'}</p>
                      <p className="text-sm text-emerald-400">视频已上传</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                )}

                {/* Video list */}
                {videos.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {videos.map(video => (
                      <VideoItem key={video.id} video={video} onRemove={removeVideo} />
                    ))}
                  </div>
                )}

                {errors.videos && touched.videos && (
                  <p className="mt-3 text-sm text-red-400 flex items-center gap-1 error-field">
                    <AlertCircle className="w-4 h-4" />
                    {errors.videos}
                  </p>
                )}
              </div>

              {/* Player form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Player name */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    球员姓名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => { setPlayerName(e.target.value); if (errors.playerName) setErrors(p => ({ ...p, playerName: undefined })); }}
                    onBlur={() => setTouched(p => ({ ...p, playerName: true }))}
                    placeholder="请输入球员真实姓名"
                    className={`w-full px-4 py-3 bg-[#0f1419] rounded-xl text-white placeholder-gray-600 transition-all duration-300 focus:outline-none ${
                      errors.playerName && touched.playerName
                        ? 'border border-red-500 focus:border-red-500'
                        : 'border border-gray-700 focus:border-emerald-500'
                    }`}
                  />
                  {errors.playerName && touched.playerName && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1 error-field">
                      <AlertCircle className="w-4 h-4" />{errors.playerName}
                    </p>
                  )}
                </div>

                {/* Match name */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">比赛名称</label>
                  <input
                    type="text"
                    value={matchName}
                    onChange={e => setMatchName(e.target.value)}
                    placeholder="例如：2024年U15全国青少年联赛"
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors duration-300"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    球员位置 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={playerPosition}
                    onChange={e => { setPlayerPosition(e.target.value); if (errors.playerPosition) setErrors(p => ({ ...p, playerPosition: undefined })); }}
                    onBlur={() => setTouched(p => ({ ...p, playerPosition: true }))}
                    className={`w-full px-4 py-3 bg-[#0f1419] rounded-xl text-white focus:outline-none transition-all duration-300 ${
                      errors.playerPosition && touched.playerPosition
                        ? 'border border-red-500 focus:border-red-500'
                        : 'border border-gray-700 focus:border-emerald-500'
                    }`}
                  >
                    <option value="" className="bg-[#0f1419]">请选择位置</option>
                    <optgroup label="前锋" className="bg-[#0f1419]">
                      <option value="ST">前锋（ST/CF）</option><option value="LW">左边锋（LW）</option><option value="RW">右边锋（RW）</option>
                    </optgroup>
                    <optgroup label="中场" className="bg-[#0f1419]">
                      <option value="CAM">攻击型中场（CAM）</option><option value="CM">中场（CM）</option><option value="CDM">防守型中场（CDM）</option><option value="LM">左边前卫（LM）</option><option value="RM">右边前卫（RM）</option>
                    </optgroup>
                    <optgroup label="后卫" className="bg-[#0f1419]">
                      <option value="LB">左边后卫（LB）</option><option value="RB">右边后卫（RB）</option><option value="CB">中后卫（CB）</option>
                    </optgroup>
                    <optgroup label="门将" className="bg-[#0f1419]">
                      <option value="GK">门将（GK）</option>
                    </optgroup>
                  </select>
                  {errors.playerPosition && touched.playerPosition && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1 error-field">
                      <AlertCircle className="w-4 h-4" />{errors.playerPosition}
                    </p>
                  )}
                </div>

                {/* Jersey color */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">球衣颜色</label>
                  <input
                    type="text"
                    value={jerseyColor}
                    onChange={e => setJerseyColor(e.target.value)}
                    placeholder="例如：红色 / 蓝白条纹"
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors duration-300"
                  />
                </div>

                {/* Jersey number */}
                <div>
                  <label className="block text-gray-300 font-medium mb-2">
                    球衣号码 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={jerseyNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                      setJerseyNumber(val);
                      if (errors.jerseyNumber) setErrors(p => ({ ...p, jerseyNumber: undefined }));
                    }}
                    onBlur={() => setTouched(p => ({ ...p, jerseyNumber: true }))}
                    placeholder="例如：10"
                    className={`w-full px-4 py-3 bg-[#0f1419] rounded-xl text-white placeholder-gray-600 focus:outline-none transition-all duration-300 ${
                      errors.jerseyNumber && touched.jerseyNumber
                        ? 'border border-red-500 focus:border-red-500'
                        : 'border border-gray-700 focus:border-emerald-500'
                    }`}
                  />
                  {errors.jerseyNumber && touched.jerseyNumber && (
                    <p className="mt-1 text-sm text-red-400 flex items-center gap-1 error-field">
                      <AlertCircle className="w-4 h-4" />{errors.jerseyNumber}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-medium mb-2">备注说明</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="请描述您希望分析师重点关注的方面"
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors duration-300 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <div className="text-gray-500 text-sm">
                  {videos.length > 0 && (
                    <span>已选 {videos.length} 个视频，共 {formatFileSize(videos.reduce((a, v) => a + v.size, 0))}</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    保存草稿
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (videos.length === 0 && !alreadyHasVideo)}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      isSubmitting || (videos.length === 0 && !alreadyHasVideo)
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />提交中...</>
                    ) : (
                      <><FileText className="w-5 h-5" />提交资料</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeInUp>
      </div>
    </div>
  );
};

export default PostPaymentUpload;