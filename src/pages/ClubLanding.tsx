import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Target, Trophy, TrendingUp, ShieldCheck, Sparkles,
  BarChart3, FileText, Lock, Smartphone, CheckCircle2,
  ChevronRight, ArrowRight, Menu, X, Phone, Zap, LineChart, LayoutTemplate,
  CalendarDays, ClipboardList, Video
} from 'lucide-react';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// FadeIn on scroll
function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.unobserve(el);
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Animated number counter
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setValue(Math.floor(start + (target - start) * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{value}{suffix}</span>;
}

const digitalPowers = [
  {
    icon: FileText,
    tag: '档案管理',
    title: '球员档案数字化',
    pain: '球员资料散落在微信群、Excel 和笔记本里，教练一换就断层。',
    solve: '体测数据、比赛评分、成长轨迹一站式归档，按球员维度永久留存。',
    result: '新老教练无缝交接，每位球员的发展路径清晰可见。',
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: Zap,
    tag: '训练闭环',
    title: '训练反馈数字化',
    pain: '口头反馈容易遗漏，家长反复追问孩子本周练得怎么样。',
    solve: '周报系统自动发起任务，教练在线点评，球员即时收到反馈。',
    result: '家长满意度提升，训练计划有据可依，教练不再重复解释。',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: BarChart3,
    tag: '选材决策',
    title: '选材决策数字化',
    pain: '凭印象和感觉选人，有潜力的球员常常被主观偏好埋没。',
    solve: '多维数据看板 + 能力雷达图，把“踢得好”拆解成可量化的指标。',
    result: '降低选材偏差，让真正优秀的苗子不被错过。',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: LayoutTemplate,
    tag: '品牌招生',
    title: '俱乐部品牌数字化',
    pain: '招生靠熟人介绍，家长在网上搜不到俱乐部的成绩和理念。',
    solve: '每个俱乐部拥有独立主页，展示荣誉、教练团队、培养体系。',
    result: '提升招生转化率，打造让家长第一眼就信任的专业形象。',
    color: 'from-sky-500 to-blue-500',
  },
];

const featureHighlights = [
  {
    icon: Users,
    title: '球队与球员管理',
    tag: ' roster 管理',
    summary: '一个后台管理多支球队，球员信息随时可查、可更新。',
    bullets: ['支持创建 U8/U10/U12 等多年龄段球队', '批量导入球员名单，快速搭建 roster', '按位置、年龄、状态灵活筛选球员'],
    color: 'from-violet-500 to-fuchsia-500',
  },
  {
    icon: FileText,
    title: '球员成长档案',
    tag: '档案中心',
    summary: '体测数据、比赛表现、成长轨迹一站式归档，永久留存不丢失。',
    bullets: ['自动记录历次体测数据与变化趋势', '比赛评分与视频片段关联归档', '生成球员专属成长时间线'],
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: BarChart3,
    title: '智能选材决策',
    tag: '数据看板',
    summary: '用多维数据和能力雷达图说话，降低主观偏好带来的选材偏差。',
    bullets: ['能力雷达图直观对比多名球员', '年龄分布、位置分布等多维看板', '支持保存常用筛选方案，快速定位'],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: '训练周报系统',
    tag: '训练闭环',
    summary: '自动发起周报任务，教练在线点评，让训练反馈形成完整闭环。',
    bullets: ['周五自动提醒球员提交训练感受', '教练在线点评，球员即时收到反馈', '周报数据自动归档，跟踪训练态度'],
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Trophy,
    title: '比赛管理与复盘',
    tag: '赛事中心',
    summary: '从赛程安排到战术复盘，完整覆盖比赛周期的每一个环节。',
    bullets: ['创建比赛、安排参赛球员名单', '球员自评 + 教练点评 + 虚拟战术板', '上传比赛视频，AI 生成分析报告'],
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: LayoutTemplate,
    title: '俱乐部品牌主页',
    tag: '品牌展示',
    summary: '每个俱乐部拥有独立展示页面，打造让家长第一眼就信任的专业形象。',
    bullets: ['自定义俱乐部介绍、荣誉墙、培养理念', '展示教练团队资历与执教风格', '球员成绩与俱乐部动态对外展示'],
    color: 'from-indigo-500 to-violet-500',
  },
];

const securityItems = [
  { icon: ShieldCheck, title: '分级权限控制', desc: '管理员、教练、球员各自可见范围严格隔离' },
  { icon: Lock, title: '加密存储与传输', desc: '球员敏感信息全程加密，防止泄露' },
  { icon: Smartphone, title: '操作日志可追溯', desc: '关键行为全记录，数据变动有据可查' },
];

const simpleItems = [
  { icon: CheckCircle2, title: '3 分钟创建球队', desc: '无需 IT 基础，填完信息即可邀请队员加入' },
  { icon: Users, title: '多端实时同步', desc: '手机、平板、电脑无缝切换，数据实时更新' },
  { icon: Phone, title: '7×12 人工客服', desc: '专属客户成功经理，入驻后全程陪跑' },
];

const steps = [
  { title: '提交入驻申请', desc: '填写俱乐部基本信息，我们将在 1 个工作日内完成资质审核。' },
  { title: '创建球队 roster', desc: '审核通过后，一键创建球队并邀请教练、球员加入，支持批量导入。' },
  { title: '开启数字化运营', desc: '解锁全部管理功能，用数据驱动训练、选材和品牌建设。' },
];

const faqs = [
  {
    q: '入驻平台需要付费吗？',
    a: '基础功能（球队管理、球员档案、周报系统）永久免费。高级功能如 AI 视频分析、定制球探报告按实际使用计费，无强制年费或隐藏收费。',
  },
  {
    q: '我们的球员数据安全吗？',
    a: '数据仅对俱乐部内部可见，平台采用严格的租户隔离机制。未经俱乐部书面授权，我们不会向任何第三方共享、出售或披露球员信息。',
  },
  {
    q: '一个账号可以管理多支球队吗？',
    a: '可以。俱乐部管理员账号支持创建和管理多支球队，每支球队拥有独立的教练组、球员名单和数据看板。',
  },
  {
    q: '教练和球员需要单独注册吗？',
    a: '不需要。管理员可通过手机号或邀请码直接邀请成员加入，受邀人补充资料即可激活，无需复杂的注册流程。',
  },
];

export default function ClubLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-100 overflow-x-hidden pt-[56px]">
      {/* Hero */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-violet-300 mb-6">
              <Sparkles className="w-4 h-4" />
              <span>面向青训俱乐部的数字化管理平台</span>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                让俱乐部管理更专业，
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
                选材决策更科学
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10">
              少年球探俱乐部版，专为青训机构打造。从球队管理、球员成长追踪到品牌展示，一站式解决俱乐部运营难题。
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register?role=club"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-xl shadow-violet-900/30 transition-all hover:-translate-y-0.5"
              >
                立即入驻 <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#digital"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                了解更多
              </a>
            </div>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={400}>
            <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { num: 500, suffix: '+', label: '入驻俱乐部' },
                { num: 3000, suffix: '+', label: '管理球队' },
                { num: 25000, suffix: '+', label: '注册球员' },
                { num: 98, suffix: '%', label: '数据安全评分' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="relative p-5 md:p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-1">
                    <CountUp target={s.num} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Digital Empowerment */}
      <section id="digital" className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 mb-4">
                <LineChart className="w-3.5 h-3.5" />
                <span>运营痛点 → 系统解决 →  measurable 效果</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">数字化赋能俱乐部运营</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                不是给教练增加工作量，而是把琐碎、重复、易出错的流程交给系统，让教练把 100% 的精力放回球场和球员身上。
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid md:grid-cols-2 gap-6">
            {digitalPowers.map((item, idx) => (
              <FadeIn key={idx} delay={idx * 100}>
                <div className="group relative h-full p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all">
                  <div className={cn('absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r opacity-80', item.color)} />
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg', item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="shrink-0 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">痛点</span>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.pain}</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="shrink-0 text-xs font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">解决</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.solve}</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="shrink-0 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">效果</span>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.result}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 mb-4">
                <Target className="w-3.5 h-3.5" />
                <span>俱乐部板块 · 核心功能</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">不只是工具，是完整的管理体系</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                从球员入队到成长跟踪，从日常训练到比赛复盘，从内部管理到对外招生，我们提供俱乐部运营所需的全套数字化能力。
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureHighlights.map((item, idx) => (
              <FadeIn key={idx} delay={idx * 80}>
                <div className="group h-full flex flex-col p-6 md:p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg', item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400 border border-white/10">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">{item.summary}</p>
                  <ul className="mt-auto space-y-2">
                    {item.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Security + Simple */}
      <section id="security" className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            <FadeIn>
              <div className="h-full relative rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/20 to-slate-900 p-8 md:p-10">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6">
                    <Lock className="w-7 h-7 text-violet-300" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">数据仅本俱乐部可见</h3>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    我们深知球员数据是俱乐部的核心资产。平台采用严格的租户隔离机制，未经授权，任何第三方都无法访问。
                  </p>
                  <div className="space-y-4">
                    {securityItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-5 h-5 text-violet-300" />
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium text-sm">{item.title}</p>
                          <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="h-full flex flex-col justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                  <Smartphone className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">安全与简单，从不矛盾</h3>
                <p className="text-slate-400 leading-relaxed mb-8">
                  复杂的系统往往让人望而却步。我们在保障安全的同时，极力简化操作流程。无论是资深教练还是刚接触智能手机的新手，都能快速上手。
                </p>
                <div className="space-y-4">
                  {simpleItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium text-sm">{item.title}</p>
                        <p className="text-slate-400 text-sm mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="steps" className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">三步开启数字化管理</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">无需部署服务器，无需购买硬件，注册审核通过后即可使用全部功能。</p>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connecting line on desktop */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {steps.map((s, idx) => (
              <FadeIn key={idx} delay={idx * 120}>
                <div className="relative p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.02] text-center">
                  <div className="mx-auto -mt-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 border-4 border-[#0a0e14] shadow-lg">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-4 mb-3">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">常见问题</h2>
              <p className="text-slate-400">关于入驻和使用的常见疑问，我们已为你整理好答案。</p>
            </div>
          </FadeIn>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FadeIn key={idx} delay={idx * 80}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-5 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-semibold text-slate-100">{faq.q}</span>
                    <ChevronRight className={cn('w-5 h-5 text-slate-400 transition-transform', openFaq === idx && 'rotate-90')} />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all',
                      openFaq === idx ? 'max-h-48' : 'max-h-0'
                    )}
                  >
                    <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/30" />
              <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
              <div className="relative px-6 py-14 md:px-16 md:py-20 text-center">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
                  准备好让俱乐部更进一步了吗？
                </h2>
                <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
                  立即申请入驻，享受专属 onboarding 服务。我们的客户成功团队将在 1 个工作日内与您联系，帮您完成球队搭建。
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/register?role=club"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-amber-900/30 transition-all hover:-translate-y-0.5"
                  >
                    立即入驻 <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="tel:4008000000"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Phone className="w-5 h-5" /> 申请试用
                  </a>
                </div>
                <p className="mt-6 text-slate-500 text-sm">入驻即享 14 天全功能免费体验，不满意随时退出</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo-official.png" alt="少年球探" className="h-8 w-auto opacity-80" />
            <span className="text-slate-500 text-sm">© 2026 少年球探. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/" className="hover:text-slate-300 transition-colors">官网首页</Link>
            <Link to="/become-analyst" className="hover:text-slate-300 transition-colors">分析师招募</Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">登录</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
