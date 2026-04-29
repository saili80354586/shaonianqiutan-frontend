import React, { useState, useEffect, useCallback } from 'react';
import { analystApi } from '../../services/api';
import type { Order, RatingWithComments, RatingItemDetail } from '../../types';
import { toast } from 'sonner';
import {
  ChevronLeft, Play, Pause, Volume2, VolumeX, Maximize,
  Save, Send, AlertCircle, CheckCircle, Video, Upload, X
} from 'lucide-react';

interface RatingWorkspaceProps {
  order: Order;
  onComplete: () => void;
  onCancel: () => void;
}

const RATING_LEVELS = [
  { min: 9.0, max: 10.0, label: '世界级', color: 'text-green-600', bgColor: 'bg-green-100' },
  { min: 8.0, max: 8.9, label: '优秀', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { min: 7.0, max: 7.9, label: '良好', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { min: 6.0, max: 6.9, label: '合格', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { min: 5.0, max: 5.9, label: '待提高', color: 'text-red-600', bgColor: 'bg-red-100' },
  { min: 0, max: 4.9, label: '薄弱', color: 'text-red-800', bgColor: 'bg-red-200' }
];

const getRatingLevel = (score: number) =>
  RATING_LEVELS.find(level => score >= level.min && score <= level.max) || RATING_LEVELS[5];

const createInitialRating = (): RatingWithComments => ({
  overall: {
    ballControl: { score: 7.0, level: '良好', comment: '' },
    pressing: { score: 7.0, level: '良好', comment: '' },
    positioning: { score: 7.0, level: '良好', comment: '' }
  },
  offense: {
    widthAndAttack: { score: 7.0, level: '良好', comment: '' },
    offTheBallMovement: { score: 7.0, level: '良好', comment: '' },
    duelVariety: { score: 7.0, level: '良好', comment: '' },
    oneOnOne: { score: 7.0, level: '良好', comment: '' },
    crossing: { score: 7.0, level: '良好', comment: '' },
    speed: { score: 7.0, level: '良好', comment: '' },
    passingRisk: { score: 7.0, level: '良好', comment: '' },
    firstTouch: { score: 7.0, level: '良好', comment: '' }
  },
  defense: {
    defensiveEffort: { score: 7.0, level: '良好', comment: '' },
    reactionSpeed: { score: 7.0, level: '良好', comment: '' },
    teamCoordination: { score: 7.0, level: '良好', comment: '' },
    secondBall: { score: 7.0, level: '良好', comment: '' },
    aerialDuel: { score: 7.0, level: '良好', comment: '' },
    positioning: { score: 7.0, level: '良好', comment: '' },
    roleAdaptation: { score: 7.0, level: '良好', comment: '' },
    tackling: { score: 7.0, level: '良好', comment: '' }
  },
  summary: '', strengths: [], weaknesses: [], suggestions: '', potential: 'medium'
});

const RATING_ITEMS = {
  overall: [
    { key: 'ballControl', label: '控球能力', desc: '脚下技术、球感、护球能力' },
    { key: 'pressing', label: '逼抢能力', desc: '压迫意识、反抢时机' },
    { key: 'positioning', label: '站位意识', desc: '位置感、空间意识' }
  ],
  offense: [
    { key: 'widthAndAttack', label: '拉开宽度并参与进攻组织', desc: '边路活动范围' },
    { key: 'offTheBallMovement', label: '跑位支援灵活', desc: '无球跑动质量' },
    { key: 'duelVariety', label: '对抗中表现多变', desc: '1v1变化能力' },
    { key: 'oneOnOne', label: '擅长一对一突破', desc: '突破成功率' },
    { key: 'crossing', label: '传中与助攻能力', desc: '传中精度' },
    { key: 'speed', label: '速度与节奏变化', desc: '爆发力' },
    { key: 'passingRisk', label: '传球风险判断', desc: '传球选择合理性' },
    { key: 'firstTouch', label: '身体姿态与一脚传球', desc: '技术稳定性' }
  ],
  defense: [
    { key: 'defensiveEffort', label: '防守阶段投入', desc: '防守意愿' },
    { key: 'reactionSpeed', label: '失球后反应迅速', desc: '回追速度' },
    { key: 'teamCoordination', label: '与队友配合默契', desc: '协防配合' },
    { key: 'secondBall', label: '注重第二落点争夺', desc: '球权预判' },
    { key: 'aerialDuel', label: '空中球争夺', desc: '争顶能力' },
    { key: 'positioning', label: '向中路收缩', desc: '位置感' },
    { key: 'roleAdaptation', label: '快速调整防守角色', desc: '角色转换' },
    { key: 'tackling', label: '防守节奏把控', desc: '抢断技术' }
  ]
};

const RatingWorkspace: React.FC<RatingWorkspaceProps> = ({ order, onComplete, onCancel }) => {
  const [ratings, setRatings] = useState<RatingWithComments>(createInitialRating());
  const [activeTab, setActiveTab] = useState<'overall' | 'offense' | 'defense' | 'summary' | 'video'>('overall');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [clipVideo, setClipVideo] = useState<File | null>(null);
  const [clipVideoUrl, setClipVideoUrl] = useState<string>('');

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const calculateScore = useCallback(() => {
    const o = ratings.overall, of = ratings.offense, d = ratings.defense;
    const overallScore = o.ballControl.score * 0.20 + o.pressing.score * 0.15 + o.positioning.score * 0.20;
    const offenseScores = Object.values(of).map(i => i.score);
    const defenseScores = Object.values(d).map(i => i.score);
    const offenseAvg = offenseScores.reduce((a, b) => a + b, 0) / offenseScores.length;
    const defenseAvg = defenseScores.reduce((a, b) => a + b, 0) / defenseScores.length;
    return {
      total: Number((overallScore + offenseAvg * 0.25 + defenseAvg * 0.20).toFixed(1)),
      offenseAvg: Number(offenseAvg.toFixed(1)),
      defenseAvg: Number(defenseAvg.toFixed(1))
    };
  }, [ratings]);

  // 本地草稿自动保存
  const draftKey = `rating_draft_${order.id}`;

  useEffect(() => {
    // 进入时检测本地草稿
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedAt = new Date(parsed.savedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          if (window.confirm('检测到未提交的草稿，是否恢复？')) {
            setRatings(parsed.ratings);
            setLastSaved(savedAt);
          }
        }
      }
    } catch {}

    const timer = setInterval(() => saveDraft(), 10000);
    return () => clearInterval(timer);
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ratings, savedAt: new Date().toISOString() }));
      setLastSaved(new Date());
    } catch (e) { console.error('保存草稿失败', e); }
  };

  const handleScoreChange = (cat: 'overall' | 'offense' | 'defense', key: string, val: number) => {
    setRatings(prev => {
      const categoryRatings = prev[cat] as Record<string, RatingItemDetail>;
      return {
        ...prev,
        [cat]: {
          ...categoryRatings,
          [key]: { ...categoryRatings[key], score: val, level: getRatingLevel(val).label },
        },
      };
    });
  };

  const handleClipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('请上传视频文件'); return; }
    if (file.size > 500 * 1024 * 1024) { toast.error('视频不能超过500MB'); return; }
    setClipVideo(file);
    setClipVideoUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    for (const cat of ['overall', 'offense', 'defense'] as const) {
      for (const item of RATING_ITEMS[cat]) {
        const r = ratings[cat][item.key as keyof typeof ratings[typeof cat]] as RatingItemDetail;
        if (!r.comment || r.comment.length < 10) {
          toast.error('请为每项评分填写至少10字的评语');
          setActiveTab(cat); return;
        }
      }
    }
    if (ratings.summary.length < 50) { toast.error('综合评价至少50字'); setActiveTab('summary'); return; }
    if ((order.order_type === 'video' || order.order_type === 'pro') && !clipVideo) { toast.error('请上传剪辑视频'); setActiveTab('video'); return; }

    setSubmitting(true);
    try {
      const clipUrl = clipVideoUrl || '';
      await analystApi.submitReport(order.id.toString(), { ratings, summary: ratings.summary, suggestions: ratings.suggestions, potential: ratings.potential, strengths: ratings.strengths, weaknesses: ratings.weaknesses, clip_video_url: clipUrl });
      localStorage.removeItem(draftKey);
      toast.success('报告提交成功！'); onComplete();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || '提交失败';
      toast.error('提交失败: ' + msg);
      console.error('提交报告失败:', e);
    }
    finally { setSubmitting(false); }
  };

  const togglePlay = () => {
    if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const scores = calculateScore();
  const level = getRatingLevel(scores.total);

  const renderRatingSection = (cat: 'overall' | 'offense' | 'defense') => (
    <div className="space-y-6">
      {RATING_ITEMS[cat].map((item, idx) => {
        const r = ratings[cat][item.key as keyof typeof ratings[typeof cat]] as RatingItemDetail;
        const lvl = getRatingLevel(r.score);
        return (
          <div key={item.key} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm text-gray-500 mr-2">{String(idx + 1).padStart(2, '0')}.</span>
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-500 ml-2">{item.desc}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-2 py-1 rounded ${lvl.bgColor} ${lvl.color}`}>{lvl.label}</span>
                <span className="text-2xl font-bold w-16 text-right">{r.score.toFixed(1)}</span>
              </div>
            </div>
            <input
              type="range" min="1" max="10" step="0.5" value={r.score}
              onChange={(e) => handleScoreChange(cat, item.key, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
            <textarea
              value={r.comment}
              onChange={(e) => setRatings(prev => {
                const categoryRatings = prev[cat] as Record<string, RatingItemDetail>;
                return {
                  ...prev,
                  [cat]: {
                    ...categoryRatings,
                    [item.key]: { ...categoryRatings[item.key], comment: e.target.value },
                  },
                };
              })}
              placeholder={`请描述该球员在"${item.label}"方面的表现...`}
              rows={2}
              className="w-full mt-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-900"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-lg font-semibold">{order.player_name} - {order.player_position}分析</h2>
            <p className="text-sm text-gray-500">{order.order_no} | {order.order_type === 'video' || order.order_type === 'pro' ? '视频解析版' : '文字版'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && <span className="text-sm text-gray-500">已保存 {lastSaved.toLocaleTimeString('zh-CN')}</span>}
          <button onClick={() => { setSaving(true); saveDraft(); setSaving(false); toast.success('已保存'); }} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Save className="w-4 h-4" />{saving ? '保存中...' : '保存'}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300">
            {submitting ? <div className="animate-spin h-4 w-4 border-b-2 border-white" /> : <Send className="w-4 h-4" />}提交
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video */}
        <div className="w-1/2 bg-black flex flex-col">
          <div className="flex-1 relative">
            <video ref={videoRef} src={order.video_url || ''} className="w-full h-full object-contain"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)} />
          </div>
          <div className="bg-gray-900 px-4 py-3 flex items-center gap-4 text-white">
            <button onClick={togglePlay}>{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
            <span className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className="flex-1 h-1 bg-gray-700 rounded"><div className="h-full bg-blue-500 rounded" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} /></div>
            <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
          </div>
        </div>

        {/* Rating Form */}
        <div className="w-1/2 bg-white flex flex-col">
          {/* Score Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div><p className="text-blue-100 text-sm">综合评分</p><p className="text-4xl font-bold">{scores.total}</p></div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${level.bgColor} ${level.color}`}>{level.label}</span>
                <div className="mt-2 text-sm text-blue-100">进攻 {scores.offenseAvg} | 防守 {scores.defenseAvg}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex">
              {(['overall', 'offense', 'defense', 'summary'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
                  {t === 'overall' ? '整体维度' : t === 'offense' ? '进攻分析' : t === 'defense' ? '防守分析' : '综合评价'}
                </button>
              ))}
              {(order.order_type === 'video' || order.order_type === 'pro') && (
                <button onClick={() => setActiveTab('video')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'video' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'}`}>视频剪辑</button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'video' ? (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2"><Video className="w-5 h-5" />比赛剪辑视频上传</h4>
                  <p className="text-sm text-purple-700 mt-1">请上传3-5分钟的球员比赛剪辑视频</p>
                </div>
                {!clipVideo ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">点击上传视频文件</p>
                    <p className="text-sm text-gray-400">MP4/MOV, 最大500MB, 建议3-5分钟</p>
                    <input type="file" accept="video/*" onChange={handleClipUpload} className="hidden" id="clip-upload" />
                    <label htmlFor="clip-upload" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer">选择视频</label>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-medium">{clipVideo.name}</p>
                          <p className="text-sm text-gray-500">{(clipVideo.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => { setClipVideo(null); setClipVideoUrl(''); }} className="p-2 text-red-600"><X className="w-5 h-5" /></button>
                    </div>
                    {clipVideoUrl && <video src={clipVideoUrl} controls className="w-full mt-4 rounded-lg" />}
                  </div>
                )}
              </div>
            ) : activeTab === 'summary' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">综合评价 *</label>
                  <textarea value={ratings.summary} onChange={(e) => setRatings(p => ({ ...p, summary: e.target.value }))} placeholder="请对该球员进行综合评价..." rows={5} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
                  <p className="text-xs text-gray-500 mt-1">{ratings.summary.length} / 最少50字</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">核心优势</label>
                  {ratings.strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <input type="text" value={s} onChange={(e) => { const ns = [...ratings.strengths]; ns[i] = e.target.value; setRatings(p => ({ ...p, strengths: ns })); }} className="flex-1 px-3 py-2 border rounded-lg" />
                      <button onClick={() => setRatings(p => ({ ...p, strengths: p.strengths.filter((_, j) => j !== i) }))} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setRatings(p => ({ ...p, strengths: [...p.strengths, ''] }))} className="text-sm text-blue-600">+ 添加优势</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">待提升领域</label>
                  {ratings.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <input type="text" value={w} onChange={(e) => { const nw = [...ratings.weaknesses]; nw[i] = e.target.value; setRatings(p => ({ ...p, weaknesses: nw })); }} className="flex-1 px-3 py-2 border rounded-lg" />
                      <button onClick={() => setRatings(p => ({ ...p, weaknesses: p.weaknesses.filter((_, j) => j !== i) }))} className="text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setRatings(p => ({ ...p, weaknesses: [...p.weaknesses, ''] }))} className="text-sm text-blue-600">+ 添加待提升点</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">发展建议 *</label>
                  <textarea value={ratings.suggestions} onChange={(e) => setRatings(p => ({ ...p, suggestions: e.target.value }))} placeholder="请给出针对性的训练建议..." rows={3} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">潜力评估</label>
                  <div className="flex gap-2">
                    {(['top', 'high', 'medium', 'low'] as const).map(l => (
                      <button key={l} onClick={() => setRatings(p => ({ ...p, potential: l }))} className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm ${ratings.potential === l ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        {l === 'top' ? '顶级' : l === 'high' ? '优秀' : l === 'medium' ? '良好' : '一般'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : renderRatingSection(activeTab)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingWorkspace;
