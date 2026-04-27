import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, FileText, Video, ChevronRight, Star, TrendingUp, Target, Award,
  CheckCircle2, Shield, BarChart3, Users, Clock, ChevronDown, Sparkles,
  Eye, Zap, BookOpen, Trophy, Activity, ClipboardList, Lightbulb,
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const reportSections = [
  { icon: ClipboardList, title: '球员档案', desc: '基本信息、身体发育评估、BMI指数分析', color: 'from-blue-500 to-blue-600' },
  { icon: Activity, title: '比赛概况', desc: '赛事信息、战术体系、场上职责分析', color: 'from-purple-500 to-purple-600' },
  { icon: BarChart3, title: '综合评分', desc: '20项维度逐项评分，雷达图可视化呈现', color: 'from-emerald-500 to-emerald-600' },
  { icon: Zap, title: '技术特点', desc: '核心优势深度解析 + 待提升领域分析', color: 'from-amber-500 to-amber-600' },
  { icon: Eye, title: '关键事件', desc: '高光时刻详解 + 改进时刻剖析', color: 'from-rose-500 to-rose-600' },
  { icon: TrendingUp, title: '发展潜力', desc: '同龄对比、短中长期目标规划', color: 'from-cyan-500 to-cyan-600' },
  { icon: Lightbulb, title: '训练建议', desc: '优先提升项 + 保持优势项专项计划', color: 'from-orange-500 to-orange-600' },
];

const ratingDimensions = [
  { category: '整体维度', items: ['控球能力', '无球跑动', '逼抢意识', '站位选择'], count: 4, weight: '35%', color: 'bg-blue-500' },
  { category: '进攻分析', items: ['拉开宽度', '跑位支援', '一对一突破', '传中助攻', '对抗能力', '速度节奏', '传球视野', '身体姿态'], count: 8, weight: '40%', color: 'bg-emerald-500' },
  { category: '防守分析', items: ['防守投入', '失球反应', '队友配合', '二点争夺', '空中对抗', '中路收缩', '角色调整', '抢断节奏'], count: 8, weight: '25%', color: 'bg-amber-500' },
];

const pricingPlans = [
  {
    id: 'basic', name: '专业文字版', price: '¥299', period: '/场',
    description: '深度文字分析，全面了解孩子表现',
    highlight: '5000字详实报告',
    features: [
      { text: '5000字专业分析报告', highlight: true },
      { text: '20项维度逐项评分', highlight: false },
      { text: '球员基本信息与身体发育评估', highlight: false },
      { text: '比赛概况与战术体系分析', highlight: false },
      { text: '技术特点深度解析', highlight: true },
      { text: '比赛关键事件详细拆解', highlight: true },
      { text: '同龄对比与发展潜力评估', highlight: false },
      { text: '短中长期发展目标规划', highlight: false },
      { text: '个性化训练建议方案', highlight: true },
    ],
    deliverables: [
      { icon: FileText, text: 'PDF格式专业报告' },
      { icon: Clock, text: '3-5个工作日交付' },
    ],
    icon: FileText, color: 'from-blue-500 to-blue-600', popular: false,
  },
  {
    id: 'pro', name: '视频解析版', price: '¥799', period: '/场',
    description: '视频+文字双维度，最全面分析体验',
    highlight: '视频版 = 文字版全部内容 + 视频分析',
    features: [
      { text: '包含文字版全部内容', highlight: true, included: true },
      { text: '5-10分钟专业分析视频', highlight: true },
      { text: '画面标注与战术标线', highlight: false },
      { text: '高光时刻精选剪辑', highlight: true },
      { text: '关键镜头逐帧解析', highlight: true },
      { text: '专家画外音专业讲解', highlight: true },
      { text: '可视化数据图表展示', highlight: false },
      { text: '永久在线观看权限', highlight: false },
      { text: '支持下载保存', highlight: false },
    ],
    deliverables: [
      { icon: FileText, text: '5000字PDF报告' },
      { icon: Video, text: '5-10分钟分析视频' },
      { icon: Clock, text: '5-7个工作日交付' },
    ],
    icon: Video, color: 'from-emerald-500 to-emerald-600', popular: true,
  },
];

const analysisSteps = [
  { step: 1, title: '选择分析套餐', description: '基础版 ¥299 / 专业版 ¥799，按需选择', icon: FileText, detail: '文字版适合快速了解能力水平，视频版适合深度展示与申请材料' },
  { step: 2, title: '安全支付', description: '支持微信/支付宝，支付成功后锁定分析师档期', icon: Shield, detail: '订单由平台统一分配资深分析师，确保服务质量与交付时间' },
  { step: 3, title: '上传比赛视频', description: '上传60分钟以内比赛录像，填写球员信息', icon: Video, detail: '支持MP4、MOV格式，建议拍摄角度能清晰看到球员全场表现' },
  { step: 4, title: '等待分析报告', description: '平台分配分析师，3-7个工作日内交付报告', icon: Award, detail: '文字版3-5个工作日，视频版5-7个工作日内交付' },
];

const faqs = [
  { question: '视频分析适合什么年龄段的孩子？', answer: '主要面向8-15岁的青少年球员。这个年龄段是孩子技术定型和战术意识培养的关键时期，专业分析能够帮助发现潜力、弥补短板。' },
  { question: '5000字报告具体包含哪些内容？', answer: '报告采用专业球探报告标准结构：①球员基本信息与身体发育评估；②比赛概况与战术体系分析；③20项维度综合评分；④技术特点深度解析；⑤比赛关键事件分析；⑥同龄对比与发展潜力评估；⑦短中长期发展目标规划；⑧个性化训练建议方案。' },
  { question: '视频版和文字版有什么区别？', answer: '文字版提供5000字PDF格式详细分析报告；视频版在文字版基础上，增加5-10分钟专业视频解析，包含：画面标注与战术标线、高光时刻剪辑、关键镜头逐帧解析、专家画外音讲解。' },
  { question: '分析师的资质如何？', answer: '我们的分析师团队由具有职业足球背景的资深球探组成：①持有亚足联/中国足协B级及以上教练员证书；②部分成员曾任职于中超、中甲俱乐部青训体系；③平均从业经验8年以上。' },
  { question: '分析报告对孩子有什么实际帮助？', answer: '①发现真实水平：通过同龄对比，客观定位孩子在同年龄段中的位置；②找准发展方向：明确核心优势和待提升领域，避免盲目训练；③记录成长轨迹：建立专属档案，多次分析对比看进步；④升学选拔助力：权威报告可作为足球能力证明。' },
  { question: '多久可以拿到分析报告？', answer: '文字版报告在3-5个工作日内完成，视频版在5-7个工作日内完成。我们的分析师需要完整观看多遍比赛录像，逐帧分析每个评分维度，确保报告质量。' },
];

const valuePropositions = [
  { icon: Target, title: '发现真实水平', content: '通过与国际接轨的10分制评分体系，客观评估孩子的技术能力、战术意识在同年龄段中的位置。', stat: '同龄对比分析' },
  { icon: TrendingUp, title: '找准发展方向', content: '深度解析核心优势和待提升领域，明确指出具体改进点并给出训练方案。', stat: '20项维度评估' },
  { icon: BookOpen, title: '记录成长轨迹', content: '建立专属足球成长档案，通过多次分析对比，清晰看到孩子的进步曲线。', stat: '永久档案保存' },
  { icon: Trophy, title: '升学选拔助力', content: '权威的分析报告可作为孩子足球能力的有力证明，在申请校队、俱乐部梯队时增加竞争力。', stat: '权威专业背书' },
];

export default function VideoAnalysisLanding() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeReportTab, setActiveReportTab] = useState(0);
  const heroRef = useScrollAnimation({ threshold: 0.1 });
  const valueRef = useScrollAnimation({ threshold: 0.1 });
  const reportRef = useScrollAnimation({ threshold: 0.1 });
  const ratingRef = useScrollAnimation({ threshold: 0.1 });
  const pricingRef = useScrollAnimation({ threshold: 0.1 });
  const processRef = useScrollAnimation({ threshold: 0.1 });

  const handleStartAnalysis = () => navigate('/package-select');
  const handleSelectPackage = (pkg: 'basic' | 'pro') => navigate(`/order-confirm?package=${pkg}`);
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-slate-950 to-slate-950" />
          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.12, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            {/* Enhanced Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6 backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: 'rgba(52, 211, 153, 0.5)' }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </motion.div>
              <span className="text-emerald-400 text-sm font-medium">职业球探团队 · 5000字深度分析 · 20项专业评估</span>
            </motion.div>

            {/* Enhanced Title with staggered animation */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <motion.span 
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                让孩子的足球天赋
              </motion.span>
              <motion.span 
                className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                被专业看见
              </motion.span>
            </h1>

            <motion.p 
              className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              资深球探团队深度解析比赛视频，出具<span className="text-emerald-400 font-semibold">5000字专业分析报告</span>。20项维度逐项评分，科学定位孩子的真实水平，为成长提供可靠依据。
            </motion.p>

            {/* Enhanced Tags */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {['5000字详实报告', '20项维度评估', '同龄对比分析', '发展路径规划'].map((tag, i) => (
                <motion.span 
                  key={i} 
                  className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full text-slate-300 text-sm backdrop-blur-sm cursor-default"
                  whileHover={{ scale: 1.05, borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                  transition={{ duration: 0.2 }}
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-400" />{tag}
                </motion.span>
              ))}
            </motion.div>

            {/* Enhanced CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <motion.button 
                onClick={handleStartAnalysis} 
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 relative overflow-hidden"
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Play className="w-5 h-5" />
                <span>立即开始分析</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button 
                onClick={() => scrollToSection('pricing')} 
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-semibold text-lg transition-all backdrop-blur-sm relative overflow-hidden"
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(100, 116, 139, 0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                查看价格方案
              </motion.button>
            </motion.div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto">
              {[{ value: '5000+', label: '分析场次', sub: '积累丰富' }, { value: '21', label: '评估维度', sub: '全面细致' }, { value: '50+', label: '专业分析师', sub: '职业背景' }, { value: '98%', label: '家长满意度', sub: '口碑见证' }].map((stat, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group text-center p-4 bg-slate-900/30 border border-slate-800 rounded-2xl backdrop-blur-sm cursor-default transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-800/50"
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-emerald-500 mt-1">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 2 }} 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
          onClick={() => scrollToSection('value')}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-slate-500 hover:text-emerald-400 transition-colors" />
          </motion.div>
        </motion.div>
      </section>

      {/* Value Proposition Section */}
      <section id="value" className="py-24 sm:py-32 relative overflow-hidden" ref={valueRef.ref}>
        {/* Background accent */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={valueRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={valueRef.isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">科学评估 · 客观分析</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">为什么需要专业视频分析？</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">不是简单的"踢得好不好"，而是科学解读孩子的每一次触球、每一次跑位</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valuePropositions.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                animate={valueRef.isVisible ? { opacity: 1, y: 0, scale: 1 } : {}} 
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }} 
                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-emerald-500/5 cursor-default"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500" />
                
                <div className="relative flex items-start gap-4">
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:from-emerald-500/30 group-hover:to-emerald-600/30 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <item.icon className="w-7 h-7 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-emerald-100 transition-colors">{item.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">{item.stat}</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{item.content}</p>
                  </div>
                </div>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/30 transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Preview Section */}
      <section id="report" className="py-24 sm:py-32 bg-slate-900/30 relative" ref={reportRef.ref}>
        {/* Section divider */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={reportRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={reportRef.isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">5000字专业报告</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">一份报告，全面解读</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">不是几页纸的敷衍，而是5000字的深度剖析，7大章节系统呈现</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Panel - Section List */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              animate={reportRef.isVisible ? { opacity: 1, x: 0 } : {}} 
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                报告目录结构
              </h3>
              <div className="space-y-2">
                {reportSections.map((section, index) => (
                  <motion.div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${activeReportTab === index ? 'bg-slate-800 border border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'hover:bg-slate-800/50 border border-transparent'}`} 
                    onClick={() => setActiveReportTab(index)}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div 
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      animate={activeReportTab === index ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </motion.div>
                    <div className="flex-1">
                      <div className={`font-medium text-sm transition-colors ${activeReportTab === index ? 'text-white' : 'text-slate-300'}`}>{section.title}</div>
                      <div className="text-slate-500 text-xs">{section.desc}</div>
                    </div>
                    {activeReportTab === index && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Panel - Content Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              animate={reportRef.isVisible ? { opacity: 1, x: 0 } : {}} 
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} 
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm"
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeReportTab} 
                  initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: -20, scale: 0.98 }} 
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${reportSections[activeReportTab].color} flex items-center justify-center shadow-lg`}
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.4, type: "spring" }}
                    >
                      {React.createElement(reportSections[activeReportTab].icon, { className: 'w-6 h-6 text-white' })}
                    </motion.div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{reportSections[activeReportTab].title}</h4>
                      <p className="text-emerald-400 text-sm">{reportSections[activeReportTab].desc}</p>
                    </div>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    {activeReportTab === 0 && (
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                      >
                        {[{ label: '姓名', value: '陈浩然' }, { label: '年龄/身高', value: '11岁 / 145cm' }, { label: 'BMI指数', value: '18.1（标准）', highlight: true }, { label: '场上位置', value: '右边锋/攻击型中场' }].map((item, i) => (
                          <motion.div 
                            key={i} 
                            className="flex justify-between items-center text-sm py-1 border-b border-slate-800/50 last:border-0"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <span className="text-slate-500">{item.label}</span>
                            <span className={item.highlight ? 'text-emerald-400 font-medium' : 'text-white'}>{item.value}</span>
                          </motion.div>
                        ))}
                        <motion.div 
                          className="mt-3 p-3 bg-slate-900 rounded-lg text-xs text-slate-400 leading-relaxed"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          身体发育评估：身高处于P50-P75百分位，体重处于P25-P50百分位...
                        </motion.div>
                      </motion.div>
                    )}
                    {activeReportTab === 2 && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">综合评分</span>
                          <motion.span 
                            className="text-4xl font-bold text-emerald-400"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            7.8
                          </motion.span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: '78%' }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {[{ score: '8.0', label: '控球', color: 'text-blue-400' }, { score: '8.4', label: '进攻', color: 'text-emerald-400' }, { score: '7.1', label: '防守', color: 'text-amber-400' }].map((item, i) => (
                            <motion.div 
                              key={i} 
                              className="text-center p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + i * 0.1 }}
                            >
                              <div className={`text-xl font-bold ${item.color}`}>{item.score}</div>
                              <div className="text-xs text-slate-500">{item.label}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {activeReportTab === 3 && (
                      <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            核心优势
                          </div>
                          <ul className="text-sm text-slate-300 space-y-2">
                            {['传球视野与创造力（9.0分）', '边路进攻意识（9.0分）', '控球与护球能力（8.0分）'].map((item, i) => (
                              <motion.li 
                                key={i}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                              >
                                <span className="text-emerald-500">+</span>
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="text-amber-400 text-sm font-medium mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            待提升领域
                          </div>
                          <ul className="text-sm text-slate-300 space-y-2">
                            {['身体对抗能力（需加强核心力量）', '一脚出球稳定性（高压下易变形）'].map((item, i) => (
                              <motion.li 
                                key={i}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                              >
                                <span className="text-amber-500">↑</span>
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      </motion.div>
                    )}
                    {activeReportTab === 4 && (
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div 
                          className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <div className="text-emerald-400 text-xs font-medium mb-1 flex items-center gap-2">
                            <Star className="w-3 h-3" />
                            高光时刻 · 比赛第28分钟
                          </div>
                          <div className="text-slate-300 text-xs leading-relaxed">右路外脚背弧线球助攻，精准越过两名防守球员...</div>
                        </motion.div>
                        <motion.div 
                          className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="text-amber-400 text-xs font-medium mb-1 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" />
                            改进时刻 · 比赛第35分钟
                          </div>
                          <div className="text-slate-300 text-xs leading-relaxed">前场丢球后回防速度偏慢，未能及时回到防守位置...</div>
                        </motion.div>
                      </motion.div>
                    )}
                    {(activeReportTab === 1 || activeReportTab === 5 || activeReportTab === 6) && (
                      <motion.div 
                        className="text-center py-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                          {React.createElement(reportSections[activeReportTab].icon, { className: 'w-8 h-8 text-slate-600' })}
                        </div>
                        <div className="text-slate-400 text-sm">报告内容预览</div>
                        <div className="text-slate-500 text-xs mt-2">包含详细{reportSections[activeReportTab].title}分析</div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={reportRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} 
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[{ label: '报告字数', value: '5000+', unit: '字' }, { label: '分析维度', value: '21', unit: '项' }, { label: '评分精度', value: '0.5', unit: '分' }, { label: '交付格式', value: 'PDF', unit: '' }].map((item, index) => (
              <motion.div 
                key={index} 
                className="group text-center p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-emerald-500/20 hover:bg-slate-800/30 transition-all duration-300 cursor-default"
                whileHover={{ scale: 1.02, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={reportRef.isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{item.value}<span className="text-sm text-slate-500 ml-1">{item.unit}</span></div>
                <div className="text-sm text-slate-400">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Rating System Section */}
      <section id="rating" className="py-24 sm:py-32 relative" ref={ratingRef.ref}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={ratingRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={ratingRef.isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">10分制国际标准</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">国际接轨的评分体系</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">采用10分制专业评分标准，20项维度全面评估球员表现</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {ratingDimensions.map((dimension, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                animate={ratingRef.isVisible ? { opacity: 1, y: 0, scale: 1 } : {}} 
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }} 
                className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors">{dimension.category}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full font-medium">{dimension.weight}</span>
                    <span className={`px-2 py-1 ${dimension.color}/10 ${dimension.color.replace('bg-', 'text-')} text-xs rounded-full font-medium`}>{dimension.count}项</span>
                  </div>
                </div>
                
                {/* Progress bar for weight */}
                <div className="h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                  <motion.div 
                    className={`h-full ${dimension.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={ratingRef.isVisible ? { width: dimension.weight } : {}}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {dimension.items.map((item, i) => (
                    <motion.span 
                      key={i} 
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-lg border border-transparent hover:border-slate-600 hover:bg-slate-700 transition-all cursor-default"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={ratingRef.isVisible ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + index * 0.1 + i * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Grading Scale */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={ratingRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} 
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-6 text-center">评分等级标准</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[{ range: '9.0-10.0', level: '世界级', color: 'bg-emerald-500', textColor: 'text-emerald-400' }, { range: '8.0-8.9', level: '优秀', color: 'bg-blue-500', textColor: 'text-blue-400' }, { range: '7.0-7.9', level: '良好', color: 'bg-cyan-500', textColor: 'text-cyan-400' }, { range: '6.0-6.9', level: '合格', color: 'bg-yellow-500', textColor: 'text-yellow-400' }, { range: '5.0-5.9', level: '待提高', color: 'bg-orange-500', textColor: 'text-orange-400' }, { range: '1.0-4.9', level: '薄弱', color: 'bg-red-500', textColor: 'text-red-400' }].map((grade, index) => (
                <motion.div 
                  key={index} 
                  className="group text-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all duration-300 cursor-default"
                  initial={{ opacity: 0, y: 20 }}
                  animate={ratingRef.isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <div className={`w-full h-2 ${grade.color} rounded-full mb-3 shadow-lg shadow-${grade.color}/20 group-hover:shadow-${grade.color}/40 transition-shadow`} />
                  <div className="text-white font-bold text-sm">{grade.range}</div>
                  <div className={`${grade.textColor} text-xs font-medium mt-1`}>{grade.level}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Analysis Feature Section */}
      <section className="py-24 sm:py-32 bg-slate-900/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Video className="w-4 h-4 text-purple-400" />
              </motion.div>
              <span className="text-purple-400 text-sm font-medium">5-10分钟分析视频</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">视频解析，让分析更直观</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">不只是文字，更是生动的画面解析，让孩子和家长都能看懂的专业分析</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ icon: Eye, title: '画面标注', desc: '关键动作实时标注，战术标线清晰展示', gradient: 'from-purple-500 to-purple-600' }, { icon: Zap, title: '高光剪辑', desc: '精彩瞬间精选，孩子的闪光点一目了然', gradient: 'from-amber-500 to-orange-500' }, { icon: BarChart3, title: '逐帧解析', desc: '关键时刻慢动作回放，细节无处遁形', gradient: 'from-blue-500 to-cyan-500' }, { icon: Users, title: '专家讲解', desc: '资深分析师画外音，专业又通俗', gradient: 'from-emerald-500 to-teal-500' }].map((feature, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                whileInView={{ opacity: 1, y: 0, scale: 1 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }} 
                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 cursor-default"
                whileHover={{ y: -5 }}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-transparent transition-all duration-500" />
                
                <motion.div 
                  className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="relative text-lg font-semibold text-white mb-2 group-hover:text-purple-100 transition-colors">{feature.title}</h3>
                <p className="relative text-slate-400 text-sm group-hover:text-slate-300 transition-colors">{feature.desc}</p>
                
                {/* Bottom accent */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-1/2 transition-all duration-300 rounded-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 relative" ref={pricingRef.ref}>
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={pricingRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={pricingRef.isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">透明定价 · 物有所值</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">选择适合的分析方案</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">两档价格，满足不同需求，让专业分析触手可及</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={plan.id} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                animate={pricingRef.isVisible ? { opacity: 1, y: 0, scale: 1 } : {}} 
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }} 
                className={`relative rounded-2xl overflow-hidden ${plan.popular ? 'md:scale-105 z-10' : ''}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-2.5 text-sm font-bold z-20"
                    initial={{ y: -40 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      最受欢迎
                    </span>
                  </motion.div>
                )}
                
                {/* Card glow effect for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-transparent to-emerald-500/5 rounded-2xl pointer-events-none" />
                )}
                
                <div className={`relative bg-slate-900/80 backdrop-blur-sm border ${plan.popular ? 'border-emerald-500/40 shadow-2xl shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'} rounded-2xl p-6 ${plan.popular ? 'pt-16' : ''} transition-all duration-300`}>
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <plan.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-slate-400 text-sm">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <motion.span 
                      className="text-5xl font-bold text-white"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={pricingRef.isVisible ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  
                  {/* Highlight */}
                  <div className={`p-3 rounded-lg mb-6 ${plan.popular ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50'}`}>
                    <p className={`text-sm font-medium ${plan.popular ? 'text-emerald-400' : 'text-slate-400'}`}>{plan.highlight}</p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={pricingRef.isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                      >
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className={`text-sm ${feature.highlight ? 'text-white font-medium' : 'text-slate-400'}`}>{feature.text}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Deliverables */}
                  <div className="flex flex-wrap items-center gap-3 mb-6 pt-4 border-t border-slate-800">
                    {plan.deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">
                        <d.icon className="w-3.5 h-3.5" />
                        {d.text}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <motion.button 
                    onClick={() => handleSelectPackage(plan.id as 'basic' | 'pro')} 
                    className={`group w-full py-3.5 rounded-xl font-semibold transition-all relative overflow-hidden ${plan.popular ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.popular && (
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      选择此方案
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={pricingRef.isVisible ? { opacity: 1 } : {}} 
            transition={{ duration: 0.5, delay: 0.6 }} 
            className="text-center mt-10"
          >
            <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              每场比赛60分钟以内，针对一名特定球员进行分析
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 sm:py-32 bg-slate-900/30 relative" ref={processRef.ref}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={processRef.isVisible ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={processRef.isVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">3-5个工作日交付</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">简单四步，获取专业报告</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">全程线上操作，3-5个工作日即可收到详细分析报告</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {analysisSteps.map((step, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                animate={processRef.isVisible ? { opacity: 1, y: 0, scale: 1 } : {}} 
                transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }} 
                className="relative group"
              >
                <motion.div 
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  {/* Step number background */}
                  <div className="absolute -top-4 -right-4 text-8xl font-bold text-slate-800/50 select-none">
                    {step.step}
                  </div>
                  
                  <motion.div 
                    className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/20 transition-shadow"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <step.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <div className="relative">
                    <div className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-2">
                      步骤 {step.step}
                      <motion.div 
                        className="h-px bg-emerald-500/30 flex-1"
                        initial={{ scaleX: 0 }}
                        animate={processRef.isVisible ? { scaleX: 1 } : {}}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        style={{ originX: 0 }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-100 transition-colors">{step.title}</h3>
                    <p className="text-slate-400 text-sm mb-3">{step.description}</p>
                    <p className="text-slate-600 text-xs">{step.detail}</p>
                  </div>
                </motion.div>
                
                {/* Arrow connector (desktop only) */}
                {index < analysisSteps.length - 1 && (
                  <motion.div 
                    className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={processRef.isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.6 + index * 0.15 }}
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <ChevronRight className="w-6 h-6 text-emerald-500/50" />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 sm:py-32 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="text-center mb-16"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <span className="text-slate-400 text-sm font-medium">常见问题</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">有疑问？我们来解答</h2>
            <p className="text-lg text-slate-400">关于视频分析，您可能想了解的一切</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.5, delay: index * 0.08 }} 
                className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all duration-300 ${activeFaq === index ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                <button 
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)} 
                  className="w-full px-6 py-4 flex items-center justify-between text-left group"
                >
                  <span className={`font-medium pr-4 transition-colors ${activeFaq === index ? 'text-emerald-100' : 'text-white group-hover:text-emerald-100'}`}>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: activeFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-colors ${activeFaq === index ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }} 
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} 
                      className="overflow-hidden"
                    >
                      <motion.div 
                        className="px-6 pb-4 text-slate-400 text-sm leading-relaxed"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {faq.answer}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }} 
            whileInView={{ opacity: 1, y: 0, scale: 1 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
            className="relative bg-gradient-to-br from-emerald-600/20 via-slate-900/50 to-blue-600/20 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center overflow-hidden backdrop-blur-sm"
          >
            {/* Animated gradient background */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10"
              animate={{ 
                background: [
                  'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-20 h-20 border border-emerald-500/20 rounded-full" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border border-blue-500/20 rounded-full" />
            <div className="absolute top-1/2 right-8 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="absolute bottom-1/3 left-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">开启专业分析之旅</span>
              </motion.div>
              
              <motion.h2 
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                准备好了解孩子的真实水平了吗？
              </motion.h2>
              
              <motion.p 
                className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                立即上传比赛视频，让我们的专业分析师为孩子出具权威评估报告，科学规划未来的足球发展之路。
              </motion.p>
              
              <motion.button 
                onClick={handleStartAnalysis} 
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Play className="w-5 h-5 relative" />
                <span className="relative">立即开始分析</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
              </motion.button>
              
              {/* Trust badges */}
              <motion.div 
                className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-slate-500"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  安全支付
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  3-5天交付
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  满意保障
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
