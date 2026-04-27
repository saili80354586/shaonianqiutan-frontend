import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Star, 
  TrendingUp, 
  Clock,
  Eye,
  Save,
  Send,
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Award,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ScoutReportEditorProps {
  player?: {
    id: string;
    name: string;
    age: number;
    position: string;
    team?: string;
    avatar?: string;
  };
  onSave?: (data: ScoutReportData) => void;
  onPublish?: (data: ScoutReportData) => void;
  onBack?: () => void;
  initialData?: Partial<ScoutReportData>;
}

export interface ScoutReportData {
  playerId: string;
  overallRating: number;  // 综合评分 1-100
  potentialRating: 'S' | 'A' | 'B' | 'C' | 'D';  // 潜力评级
  strengths: string[];  // 优势
  weaknesses: string[];  // 劣势
  technicalSkills: {
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    mentality: number;
  };
  summary: string;  // 总评
  recommendation: string;  // 推荐建议
  targetClub?: string;  // 目标俱乐部
}

const potentialOptions = [
  { value: 'S', label: 'S级', desc: '百年一遇的天才', color: 'from-yellow-500 to-amber-500' },
  { value: 'A', label: 'A级', desc: '顶级潜力新星', color: 'from-violet-500 to-purple-500' },
  { value: 'B', label: 'B级', desc: '高潜力球员', color: 'from-blue-500 to-cyan-500' },
  { value: 'C', label: 'C级', desc: '良好潜力', color: 'from-emerald-500 to-teal-500' },
  { value: 'D', label: 'D级', desc: '待观察', color: 'from-gray-500 to-slate-500' },
];

const strengthOptions = [
  '速度优势', '身体强壮', '技术出色', '球感优秀', '意识超前',
  '传球精准', '射门果断', '防守稳健', '组织能力强', '门前嗅觉灵敏',
  '战术理解好', '比赛阅读能力', '对抗能力强', '耐力充沛', '心理素质好'
];

const weaknessOptions = [
  '速度偏慢', '身体单薄', '技术粗糙', '球感一般', '意识欠缺',
  '传球失误多', '射门犹豫', '防守松散', '组织能力弱', '把握机会能力差',
  '战术理解差', '比赛经验不足', '对抗能力弱', '体能不足', '心理素质差'
];

const skillLabels = [
  { key: 'shooting', label: '射门' },
  { key: 'passing', label: '传球' },
  { key: 'dribbling', label: '盘带' },
  { key: 'defending', label: '防守' },
  { key: 'physical', label: '身体' },
  { key: 'mentality', label: '心理' },
];

const ScoutReportEditor: React.FC<ScoutReportEditorProps> = ({ 
  player,
  onSave,
  onPublish,
  onBack,
  initialData 
}) => {
  const [formData, setFormData] = useState<ScoutReportData>({
    playerId: player?.id || '',
    overallRating: initialData?.overallRating || 75,
    potentialRating: initialData?.potentialRating || 'B',
    strengths: initialData?.strengths || [],
    weaknesses: initialData?.weaknesses || [],
    technicalSkills: initialData?.technicalSkills || {
      shooting: 70,
      passing: 70,
      dribbling: 70,
      defending: 70,
      physical: 70,
      mentality: 70,
    },
    summary: initialData?.summary || '',
    recommendation: initialData?.recommendation || '',
    targetClub: initialData?.targetClub || '',
  });

  const [activeSection, setActiveSection] = useState<'rating' | 'skills' | 'analysis' | 'summary'>('rating');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const toggleStrength = (item: string) => {
    setFormData(prev => ({
      ...prev,
      strengths: prev.strengths.includes(item)
        ? prev.strengths.filter(s => s !== item)
        : [...prev.strengths, item].slice(0, 5)
    }));
  };

  const toggleWeakness = (item: string) => {
    setFormData(prev => ({
      ...prev,
      weaknesses: prev.weaknesses.includes(item)
        ? prev.weaknesses.filter(w => w !== item)
        : [...prev.weaknesses, item].slice(0, 5)
    }));
  };

  const handleSkillChange = (key: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      technicalSkills: { ...prev.technicalSkills, [key]: value }
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 800));
    onSave?.(formData);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handlePublish = () => {
    onPublish?.(formData);
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">撰写球探报告</h1>
                {player && (
                  <p className="text-xs text-violet-300/60">
                    球员：{player.name} · {player.age}岁 · {player.position}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all flex items-center gap-2"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    已保存
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存草稿
                  </>
                )}
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                发布报告
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 左侧球员信息 */}
        <aside className="w-72 border-r border-white/10 p-6 hidden lg:block">
          <div className="sticky top-24">
            {player ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-violet-300">
                    {player.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{player.name}</h3>
                    <p className="text-sm text-slate-400">{player.age}岁 · {player.position}</p>
                  </div>
                </div>
                {player.team && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    {player.team}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString('zh-CN')}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <User className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">选择球员后开始撰写报告</p>
              </div>
            )}

            {/* 快速导航 */}
            <nav className="mt-6 space-y-1">
              {[
                { key: 'rating', label: '评分与潜力', icon: Star },
                { key: 'skills', label: '技术能力', icon: TrendingUp },
                { key: 'analysis', label: '优劣势分析', icon: AlertCircle },
                { key: 'summary', label: '总评与建议', icon: FileText },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key as typeof activeSection)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === item.key
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* 评分与潜力 */}
            {activeSection === 'rating' && (
              <div className="space-y-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">综合评分</h2>
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="12"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#ratingGradient)"
                          strokeWidth="12"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${formData.overallRating * 3.52} 352`}
                        />
                        <defs>
                          <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#d946ef" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{formData.overallRating}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.overallRating}
                        onChange={(e) => setFormData(prev => ({ ...prev, overallRating: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>1</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">潜力评级</h2>
                  <div className="grid grid-cols-5 gap-3">
                    {potentialOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData(prev => ({ ...prev, potentialRating: opt.value as ScoutReportData['potentialRating'] }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.potentialRating === opt.value
                            ? `border-transparent bg-gradient-to-br ${opt.color} shadow-lg`
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`text-2xl font-bold mb-1 ${
                          formData.potentialRating === opt.value ? 'text-white' : 'text-slate-300'
                        }`}>
                          {opt.label}
                        </div>
                        <div className={`text-xs ${
                          formData.potentialRating === opt.value ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 技术能力 */}
            {activeSection === 'skills' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">技术能力雷达图</h2>
                <div className="grid grid-cols-2 gap-6">
                  {skillLabels.map((skill) => (
                    <div key={skill.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{skill.label}</span>
                        <span className="text-white font-bold">{formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills]}</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getSkillColor(formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills])}`}
                          style={{ width: `${formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills]}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills]}
                        onChange={(e) => handleSkillChange(skill.key, parseInt(e.target.value))}
                        className="w-full h-1 bg-transparent cursor-pointer accent-violet-500"
                      />
                    </div>
                  ))}
                </div>

                {/* 雷达图可视化 */}
                <div className="mt-8 flex justify-center">
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {/* 背景网格 */}
                      {[100, 75, 50, 25].map((size) => (
                        <polygon
                          key={size}
                          points={Array(6).fill(0).map((_, i) => {
                            const angle = (i * 60 - 90) * Math.PI / 180;
                            return `${100 + size * Math.cos(angle) * 0.8},${100 + size * Math.sin(angle) * 0.8}`;
                          }).join(' ')}
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="1"
                        />
                      ))}
                      {/* 轴线 */}
                      {Array(6).fill(0).map((_, i) => {
                        const angle = (i * 60 - 90) * Math.PI / 180;
                        return (
                          <line
                            key={i}
                            x1="100"
                            y1="100"
                            x2={100 + 80 * Math.cos(angle)}
                            y2={100 + 80 * Math.sin(angle)}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                          />
                        );
                      })}
                      {/* 数据区域 */}
                      <polygon
                        points={skillLabels.map((skill, i) => {
                          const value = formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills] / 100 * 80;
                          const angle = (i * 60 - 90) * Math.PI / 180;
                          return `${100 + value * Math.cos(angle)},${100 + value * Math.sin(angle)}`;
                        }).join(' ')}
                        fill="rgba(139, 92, 246, 0.3)"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                      />
                      {/* 数据点 */}
                      {skillLabels.map((skill, i) => {
                        const value = formData.technicalSkills[skill.key as keyof typeof formData.technicalSkills] / 100 * 80;
                        const angle = (i * 60 - 90) * Math.PI / 180;
                        return (
                          <circle
                            key={i}
                            cx={100 + value * Math.cos(angle)}
                            cy={100 + value * Math.sin(angle)}
                            r="4"
                            fill="#8b5cf6"
                          />
                        );
                      })}
                    </svg>
                    {/* 标签 */}
                    {skillLabels.map((skill, i) => {
                      const angle = (i * 60 - 90) * Math.PI / 180;
                      const labelRadius = 95;
                      return (
                        <text
                          key={i}
                          x={100 + labelRadius * Math.cos(angle)}
                          y={100 + labelRadius * Math.sin(angle)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.7)"
                          fontSize="11"
                        >
                          {skill.label}
                        </text>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 优劣势分析 */}
            {activeSection === 'analysis' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-2">优势特点</h2>
                  <p className="text-sm text-slate-400 mb-4">选择该球员的主要优势（最多5项）</p>
                  <div className="flex flex-wrap gap-2">
                    {strengthOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleStrength(item)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          formData.strengths.includes(item)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {formData.strengths.includes(item) && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-2">待提升项</h2>
                  <p className="text-sm text-slate-400 mb-4">选择该球员需要提升的方面（最多5项）</p>
                  <div className="flex flex-wrap gap-2">
                    {weaknessOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleWeakness(item)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          formData.weaknesses.includes(item)
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {formData.weaknesses.includes(item) && <AlertCircle className="w-4 h-4 inline mr-1" />}
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 总评与建议 */}
            {activeSection === 'summary' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">总评</h2>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="撰写对该球员的总体评价，包括比赛风格、技术特点、发展预期等..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all resize-none"
                  />
                  <p className="text-right text-slate-500 text-xs mt-2">
                    {formData.summary.length}/500
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">发展建议</h2>
                  <textarea
                    value={formData.recommendation}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                    placeholder="给出具体的发展建议，包括训练重点、成长路径、适合的战术体系等..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all resize-none"
                  />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">目标俱乐部 <span className="text-slate-400 text-sm font-normal">（选填）</span></h2>
                  <input
                    type="text"
                    value={formData.targetClub || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetClub: e.target.value }))}
                    placeholder="推荐该球员加盟的俱乐部类型或具体俱乐部"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ScoutReportEditor;
