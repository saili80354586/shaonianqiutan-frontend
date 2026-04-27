import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, BarChart3, DollarSign, Video, FileText, CheckCircle2, TrendingUp,
  Award, Users, ChevronRight, Star, Briefcase, Target, Zap, Shield,
  Sparkles, MonitorPlay, PieChart, Wallet, ArrowRight, BookOpen
} from 'lucide-react';

const BecomeAnalystGreen: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'rating' | 'income'>('video');
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: entry.isIntersecting }));
        });
      },
      { threshold: 0.1 }
    );
    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const faqs = [
    { id: 'faq1', question: '我没有教练证，可以申请吗？', answer: '可以。职业退役球员、在役球员凭相关证明也可申请。我们会综合评估您的足球背景和专业知识。' },
    { id: 'faq2', question: '需要自备视频剪辑软件吗？', answer: '不需要。我们会为认证分析师免费提供专业足球视频分析软件的培训。' },
    { id: 'faq3', question: '收入如何结算？', answer: '按月结算，每月15日发放上月收入。文字版¥209，视频版¥559起。' },
    { id: 'faq4', question: '订单量稳定吗？', answer: '平台订单量持续增长，分析师可灵活接单，多劳多得。' },
    { id: 'faq5', question: '分析报告有标准模板吗？', answer: '是的。提供标准化10分制评分系统，包含19项专业指标。' },
  ];

  const toggleFaq = (id: string) => setActiveFaq(activeFaq === id ? null : id);

  const workbenchFeatures = {
    video: { icon: <MonitorPlay className="w-6 h-6" />, title: '视频分析工具', description: '专业级视频播放器，支持多维度标注', highlights: ['逐帧播放控制', '关键事件标记', '视频片段截取'], color: 'from-emerald-600 to-green-700', bgColor: 'bg-emerald-500/10' },
    rating: { icon: <PieChart className="w-6 h-6" />, title: '10分制评分系统', description: '科学的球员评估体系，全面分析技术特点', highlights: ['19项专业指标', '实时综合评分', '自动保存草稿'], color: 'from-lime-500 to-green-600', bgColor: 'bg-lime-500/10' },
    income: { icon: <Wallet className="w-6 h-6" />, title: '收益统计中心', description: '实时查看收益，支持报表导出', highlights: ['实时收益统计', '趋势图表分析', '报表导出'], color: 'from-teal-500 to-emerald-600', bgColor: 'bg-teal-500/10' },
  };

  return (
    <div className="min-h-screen bg-[#0d3b1e] overflow-x-hidden">
      {/* 足球场背景 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d3b1e] via-[#1a5c2e] to-[#0d3b1e]" />
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" />
          <circle cx="50%" cy="50%" r="80" stroke="white" strokeWidth="2" fill="none" />
          <circle cx="50%" cy="50%" r="4" fill="white" />
          <rect x="0" y="35%" width="12%" height="30%" stroke="white" strokeWidth="2" fill="none" />
          <rect x="88%" y="35%" width="12%" height="30%" stroke="white" strokeWidth="2" fill="none" />
        </svg>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)` }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-400/10 rounded-full blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center py-20" data-animate id="hero">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible['hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full mb-8">
                <Shield className="w-4 h-4 text-emerald-300" />
                <span className="text-sm text-emerald-200 font-medium">平台签约分析师招募中</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                成为少年球探<span className="block mt-2 bg-gradient-to-r from-emerald-300 via-lime-300 to-teal-300 bg-clip-text text-transparent">认证分析师</span>
              </h1>
              <p className="text-xl text-emerald-100/80 mb-8 leading-relaxed max-w-xl">用你的足球专业知识，帮助中国青少年球员成长。灵活接单、专业工具、稳定收入。</p>
              <div className="grid grid-cols-3 gap-6 mb-10">
                {[{ value: '70%', label: '订单分成' }, { value: '500+', label: '签约分析师' }, { value: '¥8K+', label: '月均收入' }].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                    <div className="text-sm text-emerald-300/70">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/analyst/register" className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-emerald-500/30">
                  申请成为分析师<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#workbench" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-lg rounded-xl backdrop-blur-sm">了解工作台</a>
              </div>
            </div>

            <div className={`transition-all duration-1000 delay-300 ${isVisible['hero'] ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">球</div>
                    <div><div className="text-white font-semibold">分析师工作台</div><div className="text-emerald-300/60 text-sm">专业版 v2.0</div></div>
                  </div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" /><span className="text-emerald-300 text-sm">在线</span></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-400/20">
                    <div className="flex items-center justify-between mb-3"><span className="text-emerald-200 text-sm font-medium">待处理订单</span><span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded-lg">2 个</span></div>
                    <div className="space-y-2">{['李明浩 - 前锋评估', '王小雨 - 能力分析'].map((n,i)=>(<div key={i} className="flex items-center gap-2 text-sm text-emerald-100/70"><div className="w-2 h-2 bg-emerald-400 rounded-full" />{n}</div>))}</div>
                  </div>
                  <div className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 rounded-xl p-4 border border-lime-400/20">
                    <div className="text-lime-200 text-sm mb-2">本月预估收益</div>
                    <div className="text-3xl font-bold text-white">¥1,327.90</div>
                    <div className="flex items-center gap-1 text-lime-300 text-sm mt-1"><TrendingUp className="w-4 h-4" /><span>↑ 8.7% 较上月</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[{icon:<Video className="w-5 h-5"/>,label:'视频分析'},{icon:<BarChart3 className="w-5 h-5"/>,label:'评分系统'},{icon:<DollarSign className="w-5 h-5"/>,label:'收益明细'}].map((item,i)=>(<div key={i} className="bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors"><div className="text-emerald-300 mx-auto mb-1">{item.icon}</div><div className="text-emerald-100/70 text-xs">{item.label}</div></div>))}
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce">限时奖励 ¥500</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workbench */}
      <section className="py-24 relative" id="workbench" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d3b1e] via-[#143d24] to-[#0d3b1e]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full mb-6"><MonitorPlay className="w-4 h-4 text-emerald-300" /><span className="text-sm text-emerald-200 font-medium">专业工作台</span></span>
            <h2 className="text-4xl font-bold text-white mb-4">强大的分析工具</h2>
            <p className="text-xl text-emerald-200/60">专为足球分析师打造的专业工作台</p>
          </div>
          <div className="flex justify-center gap-4 mb-12">
            {(Object.keys(workbenchFeatures) as Array<keyof typeof workbenchFeatures>).map((key) => {
              const f = workbenchFeatures[key];
              return (<button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all ${activeTab===key?`bg-gradient-to-r ${f.color} text-white shadow-lg`:'bg-white/10 text-emerald-100 hover:bg-white/20 border border-white/10'}`}>{f.icon}<span className="font-medium">{f.title}</span></button>);
            })}
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg mb-4 ${workbenchFeatures[activeTab].bgColor}`}>{workbenchFeatures[activeTab].icon}<span className={`text-sm font-medium bg-gradient-to-r ${workbenchFeatures[activeTab].color} bg-clip-text text-transparent`}>{workbenchFeatures[activeTab].title}</span></div>
                  <h3 className="text-3xl font-bold text-white mb-4">{workbenchFeatures[activeTab].description}</h3>
                  <div className="space-y-3">{workbenchFeatures[activeTab].highlights.map((item,i)=>(<div key={i} className="flex items-center gap-3 text-emerald-100/80"><div className={`w-6 h-6 rounded-full bg-gradient-to-br ${workbenchFeatures[activeTab].color} flex items-center justify-center`}><CheckCircle2 className="w-4 h-4 text-white" /></div><span>{item}</span></div>))}</div>
                </div>
                <div className="relative">
                  <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-2xl p-4 border border-white/10">
                    {activeTab==='video'&&(<div className="space-y-3"><div className="aspect-video bg-gradient-to-br from-emerald-900/50 to-green-900/50 rounded-lg flex items-center justify-center relative overflow-hidden"><div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80')] bg-cover bg-center" /><Play className="w-16 h-16 text-white/80 relative z-10" /><div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><div className="h-full w-1/3 bg-emerald-500" /></div></div><div className="flex gap-2">{['传球','射门','拦截','跑位'].map((t,i)=><span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded-lg">{t}</span>)}</div></div>)}
                    {activeTab==='rating'&&(<div className="space-y-4">{[{l:'控球能力',v:85},{l:'射门技术',v:78},{l:'传球视野',v:82},{l:'防守意识',v:75}].map((item,i)=>(<div key={i}><div className="flex justify-between text-sm text-emerald-200 mb-2"><span>{item.l}</span><span>{item.v}/100</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all" style={{width:`${item.v}%`}} /></div></div>))}</div>)}
                    {activeTab==='income'&&(<div className="space-y-4"><div className="h-32 flex items-end gap-2">{[40,65,45,80,55,70,90].map((h,i)=><div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-400/20 rounded-t" style={{height:`${h}%`}} />)}</div><div className="flex justify-between text-sm text-emerald-300/60">{['周一','周二','周三','周四','周五','周六','周日'].map((d,i)=><span key={i}>{d}</span>)}</div><div className="text-center pt-4 border-t border-white/10"><div className="text-sm text-emerald-300/60">本周收益</div><div className="text-2xl font-bold text-white">¥768.50</div></div></div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-24 relative" id="requirements" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d3b1e] via-[#1a5c2e] to-[#0d3b1e]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/20 border border-lime-400/40 rounded-full mb-6"><Shield className="w-4 h-4 text-lime-300" /><span className="text-sm text-lime-200 font-medium">入驻条件</span></span>
            <h2 className="text-4xl font-bold text-white mb-4">我们需要这样的你</h2>
            <p className="text-xl text-emerald-200/60">只要符合以下条件之一，即可申请入驻</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[{icon:<Award className="w-8 h-8"/>,title:'职业退役球员',desc:'拥有职业足球经历，对比赛有深刻理解',color:'from-amber-500 to-orange-500'},{icon:<Users className="w-8 h-8"/>,title:'在役足球运动员',desc:'现役职业或半职业球员，熟悉现代足球技战术',color:'from-emerald-500 to-green-600'},{icon:<Briefcase className="w-8 h-8"/>,title:'足球青训教练',desc:'从事青少年足球培训，具备球员评估经验',color:'from-teal-500 to-emerald-500'}].map((item,i)=>(<div key={i} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all hover:-translate-y-2"><div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>{item.icon}</div><h3 className="text-xl font-bold text-white mb-3">{item.title}</h3><p className="text-emerald-200/60 leading-relaxed">{item.desc}</p></div>))}
          </div>
          <div className="mt-12 text-center"><div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-400/40 rounded-full"><Star className="w-5 h-5 text-emerald-400" /><span className="text-emerald-200">加分项：具备视频剪辑能力（我们提供专业培训）</span></div></div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 relative" id="process" data-animate>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 border border-teal-400/40 rounded-full mb-6"><Target className="w-4 h-4 text-teal-300" /><span className="text-sm text-teal-200 font-medium">入驻流程</span></span>
            <h2 className="text-4xl font-bold text-white mb-4">三步成为认证分析师</h2>
            <p className="text-xl text-emerald-200/60">简单快捷，最快3天完成审核</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-500/30 via-lime-500/30 to-teal-500/30" />
              {[{step:'01',title:'提交申请',desc:'填写基本信息，上传相关资质证明',icon:<FileText className="w-6 h-6"/>,color:'emerald'},{step:'02',title:'平台审核',desc:'我们对您的资质进行审核，安排线上沟通',icon:<Shield className="w-6 h-6"/>,color:'lime'},{step:'03',title:'培训上岗',desc:'通过审核后，接受平台培训，获得认证',icon:<Zap className="w-6 h-6"/>,color:'teal'}].map((item,i)=>(<div key={i} className="relative text-center group"><div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${item.color==='emerald'?'from-emerald-500 to-emerald-600':item.color==='lime'?'from-lime-500 to-lime-600':'from-teal-500 to-teal-600'} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform relative z-10`}>{item.icon}</div><div className="text-sm text-emerald-500/60 mb-2">STEP {item.step}</div><h3 className="text-xl font-bold text-white mb-3">{item.title}</h3><p className="text-emerald-200/60 text-sm">{item.desc}</p></div>))}
            </div>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-24 relative" id="support" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d3b1e] to-[#1a5c2e]" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/40 rounded-full mb-6"><Sparkles className="w-4 h-4 text-amber-300" /><span className="text-sm text-amber-200 font-medium">平台支持</span></span>
            <h2 className="text-4xl font-bold text-white mb-4">我们为你提供</h2>
            <p className="text-xl text-emerald-200/60">全方位支持，让你专注于分析工作</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[{icon:<Video className="w-6 h-6"/>,title:'专业软件',desc:'免费视频分析剪辑工具'},{icon:<BookOpen className="w-6 h-6"/>,title:'系统培训',desc:'标准化分析流程培训'},{icon:<FileText className="w-6 h-6"/>,title:'数据模板',desc:'专业报告模板系统'},{icon:<TrendingUp className="w-6 h-6"/>,title:'订单保障',desc:'稳定订单来源'}].map((item,i)=>(<div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all group"><div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">{item.icon}</div><h4 className="text-white font-semibold mb-2">{item.title}</h4><p className="text-emerald-200/60 text-sm">{item.desc}</p></div>))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 relative" id="faq" data-animate>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full mb-6"><span className="text-sm text-emerald-200 font-medium">常见问题</span></span>
            <h2 className="text-4xl font-bold text-white mb-4">你可能想知道</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq)=>(<div key={faq.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"><button onClick={()=>toggleFaq(faq.id)} className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"><span className="text-white font-medium">{faq.question}</span><ChevronRight className={`w-5 h-5 text-emerald-400 transition-transform ${activeFaq===faq.id?'rotate-90':''}`} /></button>{activeFaq===faq.id&&(<div className="px-6 pb-5"><p className="text-emerald-200/60 leading-relaxed">{faq.answer}</p></div>)}</div>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-green-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" /><circle cx="50%" cy="50%" r="60" stroke="white" strokeWidth="2" fill="none" /></svg>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">准备好开启分析师之旅了吗？</h2>
          <p className="text-xl text-emerald-200/60 mb-10 max-w-2xl mx-auto">加入500+分析师团队，用你的专业知识帮助更多青少年球员</p>
          <Link to="/analyst/register" className="group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-emerald-500/30">
            立即申请入驻<ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BecomeAnalystGreen;