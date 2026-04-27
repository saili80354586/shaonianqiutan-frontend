// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi, reportApi, playerApi, socialApi } from '../services/api';
import { Loading } from '../components';
import { 
  Share2, Copy, CheckCircle, ArrowLeft,
  MapPin, Ruler, Weight, Calendar, Trophy, MessageCircle, Zap,
  Palette, Download, Sparkles, FileText, Star, UserCheck, Award,
  Mail,
} from 'lucide-react';
import { LikeButton, FavoriteButton, FollowButton, CommentSection, MessageModal } from '../components/social';
import { LazyImage } from '../components';
import type { User, PlayerProfile, Report } from '../types';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { AbilityTags, PhysicalTests, FootballProfile } from './PersonalHomepage/modules';
import SocialFeed, { CreatePostModal } from './ScoutMap/SocialFeed';
import { useAuthStore } from '../store/useAuthStore';
import { Edit3 } from 'lucide-react';

// 主题类型
type Theme = 'classic' | 'cyberpunk';

// 位置名称映射
const positionMap: Record<string, string> = {
  'ST': '前锋', 'LW': '左边锋', 'RW': '右边锋',
  'CAM': '攻击型中场', 'CM': '中场', 'CDM': '防守型中场',
  'LM': '左边前卫', 'RM': '右边前卫', 'LB': '左边后卫',
  'RB': '右边后卫', 'CB': '中后卫', 'GK': '门将'
};

// 计算年龄
const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || 
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 赛博朋克粒子背景组件
const CyberParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];
    
    const colors = ['#39FF14', '#00D4FF', '#A855F7', '#FF6B35'];
    
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2
      });
    }
    
    let animationId: number;
    let frameCount = 0;
    
    const animate = () => {
      frameCount++;
      if (frameCount % 2 === 0) {
        ctx.fillStyle = 'rgba(5, 7, 12, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
          
          if (i % 3 === 0) {
            particles.slice(i + 1).forEach((p2) => {
              const dx = p.x - p2.x;
              const dy = p.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 80) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = 0.1 * (1 - dist / 80);
                ctx.stroke();
                ctx.globalAlpha = 1;
              }
            });
          }
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" style={{ width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

// 默认样例数据
const sampleData = {
  name: '王小明',
  nickname: '小明',
  age: 12,
  height: 155,
  weight: 42,
  foot: 'right',
  club: '广州恒大足校U12',
  city: '广东 广州',
  position: 'CAM',
  skillsTags: ['传球精准', '视野开阔', '远射能力强', '定位球专家'],
  // 技术特点标签（14选5）
  technicalTags: ['速度快', '传球准', '视野开阔', '射门强', '盘带好'],
  // 心智性格标签（10选4）
  mentalTags: ['领导力', '团队协作', '抗压能力', '专注度高'],
  run30m: '4.5',
  longJump: '195',
  pullUp: '12',
  sitReach: '18',
  startYear: 2019,
  birthDate: '2014-05-15',
  gender: 'male',
  province: '广东',
  school: '广州市天河区实验小学',
  // 家庭背景
  family: {
    fatherHeight: 175,
    motherHeight: 162,
    fatherAthlete: true,
    motherAthlete: false,
  },
  // 体测数据（与后端真实字段对齐）
  physicalTests: {
    sprint30m: 4.5,
    standingLongJump: 195,
    sitAndReach: 18,
    pushUp: 25,
    sitUp: 45,
    shuttleRun: 21.5,
    sprint50m: 7.8,
    verticalJump: 42,
  },
  growthExperiences: [
    { year: '2021', title: '入选校队', description: '凭借出色表现入选学校足球队' },
    { year: '2023', title: '获得市级冠军', description: '带领球队获得市青少年足球联赛冠军' }
  ]
};

// 示例球探报告数据
const sampleReports: Report[] = [
  {
    id: 1,
    order_id: 101,
    user_id: 1,
    analyst_id: 5,
    player_name: '王小明',
    player_position: 'CAM',
    title: '技术能力全面评估报告',
    description: '该球员在中场组织方面展现出了超越同龄人的成熟度，传球视野开阔，能够精准找到空位队友。建议在射门力量训练上继续加强，同时保持现有的比赛阅读能力。',
    content: '<p><strong>综合评价：</strong>该球员在中场组织方面展现出了超越同龄人的成熟度。</p><p><strong>技术特点：</strong></p><ul><li>传球视野开阔，能够精准找到空位队友</li><li>控球稳定，在压力下保持冷静</li><li>定位球技术出色，任意球有威胁</li></ul><p><strong>改进建议：</strong>建议在射门力量训练上继续加强，同时保持现有的比赛阅读能力。整体发展潜力评级为A级，建议重点关注。</p>',
    price: 299,
    rating: 4.8,
    status: 'completed',
    created_at: '2026-03-15T10:30:00Z',
    updated_at: '2026-03-15T14:20:00Z',
    analyst: {
      id: 5,
      name: '李教练',
      phone: '138****8888',
      role: 'analyst',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: 2,
    order_id: 102,
    user_id: 1,
    analyst_id: 8,
    player_name: '王小明',
    player_position: 'CAM',
    title: '身体素质专项分析',
    description: '球员身体素质优秀，30米跑成绩在同年龄段处于前10%水平。爆发力突出，垂直起跳能力良好。建议增加核心力量训练，提升身体对抗能力。',
    content: '<p><strong>体测数据分析：</strong></p><ul><li>30米跑：4.5秒（优秀）</li><li>立定跳远：195cm（良好）</li><li>引体向上：12个（优秀）</li><li>坐位体前屈：18cm（良好）</li></ul><p><strong>发展潜力：</strong>身体发育良好，预计成年后可达到175-180cm身高。建议继续保持系统性训练。</p>',
    price: 199,
    rating: 4.5,
    status: 'completed',
    created_at: '2026-02-20T09:00:00Z',
    updated_at: '2026-02-20T11:30:00Z',
    analyst: {
      id: 8,
      name: '张分析师',
      phone: '139****6666',
      role: 'analyst',
      status: 'active',
      created_at: '2024-03-01T00:00:00Z',
      updated_at: '2024-03-01T00:00:00Z'
    }
  }
];

// 雷达图组件
const RadarChart: React.FC<{ data: any }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 350;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = 110;

    ctx.clearRect(0, 0, size, size);

    const speed = data.run30m ? Math.min(100, Math.max(0, (6 - parseFloat(data.run30m)) / 2 * 100)) : 60;
    const explosive = data.longJump ? Math.min(100, Math.max(0, parseFloat(data.longJump) / 250 * 100)) : 55;
    const strength = data.pullUp ? Math.min(100, Math.max(0, parseFloat(data.pullUp) / 20 * 100)) : 50;
    const flexibility = data.sitReach ? Math.min(100, Math.max(0, parseFloat(data.sitReach) / 25 * 100)) : 65;
    const agility = 70;
    const endurance = 75;

    const values = [speed, explosive, strength, flexibility, agility, endurance];
    const labels = ['速度', '爆发力', '力量', '柔韧性', '敏捷', '耐力'];
    const angleStep = (Math.PI * 2) / 6;

    // 绘制网格
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.15)';
      ctx.lineWidth = 1;
      for (let j = 0; j < 6; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制轴线和标签
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.25)';
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();

      const labelX = center + (radius + 28) * Math.cos(angle);
      const labelY = center + (radius + 28) * Math.sin(angle);
      ctx.fillText(labels[i], labelX, labelY);
    }

    // 绘制数据多边形
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = values[i] / 100;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制数据点
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = values[i] / 100;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#39ff14';
      ctx.fill();
      ctx.strokeStyle = '#0a0e14';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data]);

  return <canvas ref={canvasRef} className="w-full max-w-[350px] h-auto mx-auto" />;
};

const PersonalHomepage: React.FC = () => {
  const { id: urlId } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [reports, setReports] = useState<Report[]>(sampleReports);
  // 体测记录（含来源区分字段，用于主页 Tab 切换）
  const [physicalTestRecords, setPhysicalTestRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [dacallCount, setDacallCount] = useState(128);
  const [showDacallForm, setShowDacallForm] = useState(false);
  const [dacallName, setDacallName] = useState('');
  const [dacallMsg, setDacallMsg] = useState('');
  const [comments, setComments] = useState([
    { name: '李教练', msg: '进步很大，继续保持！', time: '2天前' },
    { name: '张爸爸', msg: '儿子加油！', time: '5天前' }
  ]);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { user: currentUser } = useAuthStore();

  // 获取当前用户ID（优先使用URL参数，否则从localStorage获取）
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);

  // 判断是否为自己的主页
  const isOwnProfile = currentUser?.id && currentId && String(currentUser.id) === String(currentId);

  // 主题状态管理
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('personal-homepage-theme') as Theme) || 'classic';
    }
    return 'classic';
  });

  // 海报生成状态
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const posterRef = useRef<HTMLDivElement>(null);

  // 初始化：从 localStorage 获取当前用户ID
  useEffect(() => {
    if (!urlId) {
      // 没有URL参数，尝试从localStorage获取当前登录用户ID
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const userData = JSON.parse(stored);
          if (userData?.id) {
            setCurrentId(String(userData.id));
            return;
          }
        }
        // 尝试从 currentUser 获取
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          if (currentUser?.userId) {
            setCurrentId(String(currentUser.userId));
            return;
          }
        }
      } catch (e) {
        console.error('获取用户ID失败:', e);
      }
    }
    setCurrentId(urlId);
  }, [urlId]);

  // 保存主题偏好
  useEffect(() => {
    localStorage.setItem('personal-homepage-theme', theme);
  }, [theme]);
  
  // 生成二维码 - 使用theme而不是isCyberpunk，避免在条件return之后调用Hook
  useEffect(() => {
    const generateQR = async () => {
      try {
        const currentUrl = window.location.href;
        const dataUrl = await QRCode.toDataURL(currentUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: theme === 'cyberpunk' ? '#39FF14' : '#0a0e14',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('二维码生成失败:', err);
      }
    };
    generateQR();
  }, [theme]);
  
  // 切换主题
  const handleToggleTheme = () => {
    setTheme(prev => prev === 'classic' ? 'cyberpunk' : 'classic');
  };
  
  // 生成海报
  const handleGeneratePoster = async () => {
    if (!posterRef.current || isGeneratingPoster) return;
    
    setIsGeneratingPoster(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: theme === 'cyberpunk' ? '#05070c' : '#0a0e14',
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${displayData.name}_个人主页海报.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('海报生成失败:', error);
      alert('海报生成失败，请重试');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // 合并显示数据 - 整合注册资料 + 完善资料
const displayData = profile ? { 
  ...sampleData, 
  ...profile, 
  name: profile.nickname || profile.name || sampleData.nickname,
  realName: profile.name || '',
  showRealName: Boolean(profile.name),
  nickname: profile.nickname || sampleData.nickname,
  age: profile.birthDate ? calculateAge(profile.birthDate) : sampleData.age,
  height: profile.height || sampleData.height,
  weight: profile.weight || sampleData.weight,
  foot: profile.dominantFoot || profile.foot || sampleData.foot,
  club: profile.team || profile.club || sampleData.club,
  city: profile.province && profile.city ? `${profile.province} ${profile.city}` : sampleData.city,
  position: profile.position || sampleData.position,
  skillsTags: profile.technicalTags || sampleData.skillsTags,
  // 体测数据映射（与后端真实字段对齐）
  run30m: profile.physicalTests?.sprint30m?.toString() || sampleData.physicalTests.sprint30m,
  longJump: profile.physicalTests?.standingLongJump?.toString() || sampleData.physicalTests.standingLongJump,
  pullUp: profile.physicalTests?.pushUp?.toString() || sampleData.physicalTests.pushUp,
  sitReach: profile.physicalTests?.sitAndReach?.toString() || sampleData.physicalTests.sitAndReach,
  // 补充资料
  school: profile.school,
  wechat: profile.wechat,
  contactPhone: profile.contactPhone,
  secondPosition: profile.secondPosition,
  startYear: profile.startYear,
  faRegistered: profile.faRegistered,
  association: profile.association,
  jerseyNumber: profile.jerseyNumber,
  jerseyColor: profile.jerseyColor,
  // 家庭信息
  family: {
    fatherHeight: profile.fatherHeight,
    motherHeight: profile.motherHeight,
    fatherOccupation: profile.fatherOccupation,
    motherOccupation: profile.motherOccupation,
    fatherAthlete: profile.fatherAthlete,
    motherAthlete: profile.motherAthlete,
  },
  // 能力标签
  technicalTags: profile.technicalTags,
  mentalTags: profile.mentalTags,
  physicalTests: profile.physicalTests,
} : sampleData;

  useEffect(() => {
    if (currentId) loadProfile(currentId);
    else setLoading(false);
  }, [currentId]);

  const loadProfile = async (userId: string) => {
    try {
      const [uRes, pRes, rRes, ptRes, fsRes] = await Promise.all([
        userApi.getPublicProfile(userId),
        userApi.getPlayerProfile(userId),
        userApi.getPublicReports(userId),
        // 公开体测接口（含 source/club_name 字段）
        playerApi.getPublicPhysicalTests(userId).catch(() => ({ data: { success: false, records: [] } })),
        // 粉丝/关注统计
        socialApi.getFollowStatus(Number(userId)).catch(() => ({ data: { data: { followers_count: 0, following_count: 0 } } })),
      ]);
      if (uRes.data?.success) setUser(uRes.data.data || uRes.data);
      if (pRes.data?.success) {
        const playerData = pRes.data.data?.player || pRes.data.data || pRes.data;
        setProfile(playerData);
      }
      // 使用API返回的报告数据，如果没有则使用示例数据展示效果
      if (rRes.success && rRes.data && rRes.data.length > 0) {
        setReports(rRes.data);
      } else {
        // 演示模式：使用示例报告数据
        setReports(sampleReports);
      }

      // 体测记录（含来源区分）
      if (ptRes.data?.success) {
        setPhysicalTestRecords(ptRes.data.records || []);
      }

      // 粉丝/关注统计
      const fsData = fsRes.data?.data || fsRes.data;
      if (fsData) {
        setFollowersCount(fsData.followers_count ?? 0);
        setFollowingCount(fsData.following_count ?? 0);
      }
    } catch (e) {
      console.error(e);
      // 错误时使用示例数据
      setReports(sampleReports);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const submitDacall = () => {
    if (!dacallName.trim()) return;
    setDacallCount(c => c + 1);
    if (dacallMsg.trim()) {
      setComments(prev => [{ name: dacallName, msg: dacallMsg, time: '刚刚' }, ...prev]);
    }
    setShowDacallForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12] pt-24">
        <div className="max-w-[900px] mx-auto px-4"><Loading /></div>
      </div>
    );
  }

  // 赛博朋克主题样式
  const isCyberpunk = theme === 'cyberpunk';
  
  return (
    <div className={`min-h-screen relative overflow-hidden transition-all duration-700 ease-in-out ${
      isCyberpunk 
        ? 'bg-[#05070c]' 
        : 'bg-gradient-to-br from-[#05070c] via-[#0a0e14] to-[#080b12]'
    }`}>
      {/* 粒子背景 - 仅在赛博朋克主题显示 */}
      {isCyberpunk && <CyberParticles />}
      
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        {isCyberpunk ? (
          <>
            {/* 赛博朋克背景 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(57,255,20,0.15)_0%,transparent_50%)]" />
            <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-[radial-gradient(ellipse_at_bottom,rgba(0,212,255,0.1)_0%,transparent_60%)]" />
            {/* 网格线效果 */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(57,255,20,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </>
        ) : (
          <>
            {/* 经典主题背景 */}
            <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(57,255,20,0.1)_0%,transparent_70%)] rounded-full blur-3xl" />
            <div className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)] rounded-full blur-3xl" />
          </>
        )}
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-[900px] mx-auto">
          {/* 顶部工具栏 - 统一风格 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
            {[
              {
                to: '/',
                icon: ArrowLeft,
                label: '返回',
                color: '#4a90d9',
                gradient: 'from-[#4a90d9] to-[#60a5fa]'
              },
              {
                onClick: handleToggleTheme,
                icon: Palette,
                label: theme === 'classic' ? '赛博' : '经典',
                color: '#34d399',
                gradient: 'from-[#34d399] to-[#10b981]'
              },
              {
                type: 'dropdown',
                icon: Share2,
                label: '分享',
                color: '#f59e0b',
                gradient: 'from-[#f59e0b] to-[#d97706]'
              }
            ].map((item, index) => {
              const isDropdown = item.type === 'dropdown';
              const ButtonWrapper = item.to ? Link : isDropdown ? 'div' : 'button';
              const buttonProps = item.to ? { to: item.to } : item.onClick ? { onClick: item.onClick } : {};
              
              return (
                <ButtonWrapper
                  key={index}
                  {...buttonProps}
                  className={`group relative ${isDropdown ? 'group/share' : ''}`}
                >
                  {/* 统一卡片样式 */}
                  <div className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 min-w-[80px] sm:min-w-[100px] transition-all duration-500 group-hover:border-white/30 group-hover:shadow-2xl group-hover:-translate-y-1">
                    {/* 顶部渐变装饰条 */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${item.gradient} opacity-60 group-hover:opacity-100 transition-opacity rounded-t-xl`} />
                    
                    {/* 图标+文字 */}
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${item.gradient} p-[2px] shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <div className="w-full h-full rounded-lg bg-[#0f172a] flex items-center justify-center">
                          <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: item.color }} />
                        </div>
                      </div>
                      <span className="text-white text-xs sm:text-sm font-medium">{item.label}</span>
                      {isDropdown && (
                        <svg className="w-3 h-3 text-white/50 transition-transform group-hover/share:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                    
                    {/* 悬停光效 */}
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${item.color}15, transparent 70%)` }}
                    />
                  </div>
                  
                  {/* 下拉菜单 */}
                  {isDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 opacity-0 invisible group-hover/share:opacity-100 group-hover/share:visible transition-all duration-300 transform origin-top scale-95 group-hover/share:scale-100 z-50">
                      <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[140px]">
                        <button onClick={copyLink} className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left">
                          {shareCopied ? <CheckCircle className="w-4 h-4 text-[#34d399]" /> : <Copy className="w-4 h-4 text-[#f59e0b]" />}
                          <span className="text-sm">{shareCopied ? '已复制' : '复制链接'}</span>
                        </button>
                        <button 
                          onClick={handleGeneratePoster}
                          disabled={isGeneratingPoster}
                          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                        >
                          {isGeneratingPoster ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-[#a78bfa]" />
                          )}
                          <span className="text-sm">{isGeneratingPoster ? '生成中...' : '生成海报'}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left">
                          <MessageCircle className="w-4 h-4 text-[#22d3ee]" />
                          <span className="text-sm">微信分享</span>
                        </button>
                      </div>
                    </div>
                  )}
                </ButtonWrapper>
              );
            })}
          </div>

          {/* 品牌展示区域 */}
          <div className="text-center mb-6">
            {/* Logo - 调整为原来的3/5 + 呼吸动画 */}
            <div className="mb-4">
              <img 
                src="/logo2.png" 
                alt="少年球探" 
                className="h-40 sm:h-48 mx-auto drop-shadow-[0_0_20px_rgba(57,255,20,0.5)] animate-breathe"
              />
            </div>
            
            {/* 第一行：少年球探 USCOUT.CN 并排 */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-3">
                <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#39ff14] to-[#00d4ff]" />
                <span className="text-lg sm:text-xl font-bold tracking-[0.15em] text-[#39ff14]"
                  style={{ textShadow: '0 0 10px rgba(57,255,20,0.8), 0 0 20px rgba(57,255,20,0.5)' }}>
                  少年球探
                </span>
                <span className="text-lg sm:text-xl font-bold tracking-[0.2em] font-[Orbitron]"
                  style={{
                    background: 'linear-gradient(90deg, #00d4ff, #ff00ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 15px rgba(0,212,255,0.5)'
                  }}>
                  USCOUT.CN
                </span>
                <span className="h-px w-16 bg-gradient-to-l from-transparent via-[#39ff14] to-[#00d4ff]" />
              </div>
            </div>
            
            {/* 第二行：发现下一个足球明星 - 设计感 */}
            <div className="inline-flex items-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#39ff14]/50" />
              <span className="text-base sm:text-lg font-medium tracking-[0.25em]"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.9), #39ff14, rgba(255,255,255,0.9))',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 20px rgba(57,255,20,0.3)',
                  animation: 'shimmer 3s ease-in-out infinite'
                }}>
                发现下一个足球明星
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#39ff14]/50" />
            </div>
          </div>

          {/* 个人资料卡 - 主模块（合并足球档案信息） */}
          <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 md:p-10 mb-8 backdrop-blur-xl shadow-2xl transition-all duration-500 ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.4)] border border-[rgba(57,255,20,0.3)] shadow-[0_0_40px_rgba(57,255,20,0.1)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.98)] border border-white/10'
          }`}>
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${
              isCyberpunk
                ? 'bg-gradient-to-r from-transparent via-[#39ff14] to-transparent shadow-[0_0_10px_#39ff14]'
                : 'bg-gradient-to-r from-transparent via-accent/60 to-transparent'
            }`} />

            {/* 顶部：头像 + 基本信息 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
              {/* 头像 */}
              <div className={`group relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-full overflow-hidden transition-all duration-500 ${
                isCyberpunk
                  ? 'border-[3px] border-[#39ff14] shadow-[0_0_50px_rgba(57,255,20,0.4)] hover:shadow-[0_0_70px_rgba(57,255,20,0.6)]'
                  : 'border-[3px] border-accent shadow-[0_0_30px_rgba(57,255,20,0.25)] hover:shadow-[0_0_50px_rgba(57,255,20,0.4)]'
              } hover:scale-105`}>
                {displayData.avatar ? (
                  <LazyImage src={displayData.avatar} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" containerClassName="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[rgba(57,255,20,0.15)] to-[rgba(0,212,255,0.15)] group-hover:from-[rgba(57,255,20,0.25)] group-hover:to-[rgba(0,212,255,0.25)] transition-all">
                    ⚽
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* 姓名和主要信息 */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-accent to-blue-400 bg-clip-text text-transparent mb-1">
                  {displayData.name}
                </h1>
                <p className="text-accent/60 text-sm mb-3 flex items-center justify-center md:justify-start gap-1.5">
                  <span className="w-4 h-px bg-accent/30" />
                  {displayData.showRealName && displayData.realName && displayData.realName !== displayData.name && (
                    <span className="text-white/50 text-sm">真实姓名：{displayData.realName}</span>
                  )}
                  @{displayData.nickname}
                  <span className="w-4 h-px bg-accent/30" />
                </p>

                {/* 主要标签 */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <span className="badge badge-green text-xs px-2.5 py-1">
                    ⚽ {positionMap[displayData.position] || displayData.position}
                  </span>
                  {displayData.secondPosition && (
                    <span className="badge badge-green/50 text-xs px-2.5 py-1">
                      {positionMap[displayData.secondPosition] || displayData.secondPosition}
                    </span>
                  )}
                  <span className="badge badge-orange text-xs px-2.5 py-1">
                    🏟️ {displayData.club}
                  </span>
                  <span className="badge badge-blue text-xs px-2.5 py-1">
                    <MapPin className="w-3 h-3 inline mr-0.5" /> {displayData.city}
                  </span>
                </div>

                {/* 粉丝/关注统计 */}
                {currentId && (
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <Link
                      to={`/followers/${currentId}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="text-white font-medium">{followersCount}</span> 粉丝
                    </Link>
                    <Link
                      to={`/following/${currentId}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="text-white font-medium">{followingCount}</span> 关注
                    </Link>
                  </div>
                )}

                {/* 社交互动按钮 */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {!isOwnProfile && currentId && (
                    <>
                      <FollowButton
                        userId={Number(currentId)}
                        size="md"
                        showCount={false}
                      />
                      <button
                        onClick={() => setIsMessageOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a2332] hover:bg-[#2d3748] text-slate-300 text-sm font-medium rounded-xl border border-[#2d3748] hover:border-[#39ff14]/30 transition-all"
                      >
                        <Mail className="w-4 h-4" />
                        私信
                      </button>
                    </>
                  )}
                  <LikeButton
                    targetType="player_homepage"
                    targetId={Number(currentId) || 0}
                    initialCount={displayData.likes || 0}
                    size="md"
                  />
                  <FavoriteButton
                    targetType="player_homepage"
                    targetId={Number(currentId) || 0}
                    size="md"
                  />
                </div>

                {/* 关键数据 - 水平排列 */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">年龄</span>
                    <span className="text-white font-medium">{displayData.age}岁</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">身高</span>
                    <span className="text-white font-medium">{displayData.height}cm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">体重</span>
                    <span className="text-white font-medium">{displayData.weight}kg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500">惯用脚</span>
                    <span className="text-white font-medium">{displayData.foot === 'left' ? '左脚' : displayData.foot === 'both' ? '双脚' : '右脚'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

            <FootballProfile
              embedded
              name={displayData.name}
              nickname={displayData.nickname}
              birthDate={profile?.birthDate}
              gender={profile?.gender as 'male' | 'female'}
              height={displayData.height}
              weight={displayData.weight}
              dominantFoot={displayData.foot as 'left' | 'right' | 'both'}
              position={displayData.position}
              secondPosition={displayData.secondPosition}
              startYear={displayData.startYear}
              team={displayData.club}
              school={displayData.school}
              province={profile?.province}
              city={profile?.city}
              faRegistered={displayData.faRegistered}
              association={displayData.association}
              jerseyNumber={displayData.jerseyNumber}
              jerseyColor={displayData.jerseyColor}
              family={displayData.family}
              theme={theme}
            />
          </div>

          {/* 能力标签云 - 技术特点 + 心智性格 */}
          <AbilityTags
            technicalTags={displayData.technicalTags}
            mentalTags={displayData.mentalTags}
            theme={theme}
          />

          {/* 体测数据中心 - 增强模块（含来源区分 Tab） */}
          <PhysicalTests
            data={profile?.physicalTests}
            age={displayData.age}
            gender={profile?.gender}
            theme={theme}
            records={physicalTestRecords.length > 0 ? physicalTestRecords : undefined}
          />

          {/* 技术特点 - 原有模块 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </span>
              技术特点
            </h3>
            <div className="flex flex-wrap gap-2">
              {displayData.skillsTags?.map((tag: string, i: number) => (
                <span 
                  key={i} 
                  className="px-4 py-2 rounded-full bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.25)] text-accent/90 text-sm 
                           hover:-translate-y-0.5 hover:bg-[rgba(57,255,20,0.15)] hover:border-[rgba(57,255,20,0.4)] hover:shadow-[0_4px_12px_rgba(57,255,20,0.15)]
                           active:translate-y-0 active:scale-95
                           transition-all duration-300 cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 体测数据亮点 - 保留原有 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-accent" />
              </span>
              体测数据亮点
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group p-4 rounded-xl bg-[rgba(10,14,23,0.7)] border border-[rgba(57,255,20,0.1)] text-center hover:border-accent/40 hover:bg-[rgba(57,255,20,0.05)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(57,255,20,0.1)] active:translate-y-0 active:scale-95 transition-all duration-300 cursor-default">
                <div className="text-2xl font-bold text-accent mb-1 group-hover:scale-105 transition-transform">{displayData.run30m || '--'}</div>
                <div className="text-xs text-text-muted">30米跑(秒)</div>
              </div>
              <div className="group p-4 rounded-xl bg-[rgba(10,14,23,0.7)] border border-[rgba(255,107,53,0.1)] text-center hover:border-orange-400/40 hover:bg-[rgba(255,107,53,0.05)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,107,53,0.1)] active:translate-y-0 active:scale-95 transition-all duration-300 cursor-default">
                <div className="text-2xl font-bold text-orange-400 mb-1 group-hover:scale-105 transition-transform">{displayData.longJump || '--'}</div>
                <div className="text-xs text-text-muted">立定跳远(cm)</div>
              </div>
              <div className="group p-4 rounded-xl bg-[rgba(10,14,23,0.7)] border border-[rgba(0,212,255,0.1)] text-center hover:border-blue-400/40 hover:bg-[rgba(0,212,255,0.05)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,212,255,0.1)] active:translate-y-0 active:scale-95 transition-all duration-300 cursor-default">
                <div className="text-2xl font-bold text-blue-400 mb-1 group-hover:scale-105 transition-transform">{displayData.pullUp || '--'}</div>
                <div className="text-xs text-text-muted">俯卧撑(个)</div>
              </div>
              <div className="group p-4 rounded-xl bg-[rgba(10,14,23,0.7)] border border-[rgba(168,85,247,0.1)] text-center hover:border-purple-400/40 hover:bg-[rgba(168,85,247,0.05)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(168,85,247,0.1)] active:translate-y-0 active:scale-95 transition-all duration-300 cursor-default">
                <div className="text-2xl font-bold text-purple-400 mb-1 group-hover:scale-105 transition-transform">{displayData.sitReach || '--'}</div>
                <div className="text-xs text-text-muted">坐位体前屈(cm)</div>
              </div>
            </div>
          </div>

          {/* 雷达图 - 次模块 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </span>
              技能雷达图
            </h3>
            <div className="flex justify-center">
              <RadarChart data={displayData} />
            </div>
          </div>

          {/* 球探报告评语 - 次模块 */}
          {reports.length > 0 && (
            <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
              isCyberpunk
                ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
                : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
            }`}>
              <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Award className="w-4 h-4 text-accent" />
                </span>
                球探报告评语
                <span className="text-sm font-normal text-text-muted ml-2">({reports.length}份)</span>
              </h3>
              
              <div className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <div 
                    key={report.id}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      isCyberpunk
                        ? 'bg-[rgba(10,14,23,0.6)] border border-[rgba(57,255,20,0.15)] hover:border-[rgba(57,255,20,0.35)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.1)]'
                        : 'bg-[rgba(10,14,23,0.5)] border border-white/5 hover:border-accent/30 hover:bg-[rgba(10,14,23,0.7)]'
                    }`}
                  >
                    {/* 报告头部信息 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* 分析师头像 */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCyberpunk 
                            ? 'bg-gradient-to-br from-accent/20 to-blue-500/20 border border-accent/30'
                            : 'bg-accent/10'
                        }`}>
                          {report.analyst?.avatar ? (
                            <LazyImage src={report.analyst.avatar} alt="" className="w-full h-full rounded-full object-cover" containerClassName="w-full h-full" />
                          ) : (
                            <UserCheck className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{report.analyst?.name || '专业分析师'}</div>
                          <div className="text-xs text-text-muted">{new Date(report.created_at).toLocaleDateString('zh-CN')}</div>
                        </div>
                      </div>
                      {/* 评分 */}
                      {report.rating && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                          isCyberpunk
                            ? 'bg-[rgba(255,193,7,0.15)] border border-[rgba(255,193,7,0.3)]'
                            : 'bg-yellow-500/10'
                        }`}>
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-bold text-yellow-400">{report.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 报告标题 */}
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent/70" />
                      {report.title}
                    </h4>
                    
                    {/* 评语内容 */}
                    <div className="text-sm text-text-secondary leading-relaxed">
                      {expandedReport === report.id ? (
                        <div className="whitespace-pre-wrap">{report.content || report.description}</div>
                      ) : (
                        <p className="line-clamp-2">{report.description || report.content}</p>
                      )}
                    </div>
                    
                    {/* 展开/收起按钮 */}
                    {(report.content?.length > 100 || report.description?.length > 100) && (
                      <button
                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                        className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        {expandedReport === report.id ? '收起' : '查看完整评语'}
                      </button>
                    )}

                    {/* 点赞和收藏按钮 */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                      <LikeButton
                        targetType="analyst_report"
                        targetId={report.id}
                        initialCount={0}
                        size="sm"
                      />
                      <FavoriteButton
                        targetType="analyst_report"
                        targetId={report.id}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
                
                {/* 查看更多报告 */}
                {reports.length > 3 && (
                  <div className="text-center pt-2">
                    <Link 
                      to={`/player/${currentId}/reports`}
                      className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                    >
                      查看全部 {reports.length} 份报告
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 足球经历 - 次模块 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-accent" />
              </span>
              足球经历
            </h3>
            <div className="space-y-4 relative">
              {/* 时间线装饰 */}
              <div className="absolute left-[26px] top-4 bottom-4 w-px bg-gradient-to-b from-accent/50 via-accent/20 to-transparent" />
              {displayData.growthExperiences?.map((exp: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-[rgba(10,14,23,0.5)] hover:bg-[rgba(10,14,23,0.7)] transition-colors relative">
                  {/* 时间线节点 */}
                  <div className="relative z-10">
                    <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-accent font-bold text-sm">{exp.year}</span>
                      <span className="font-medium text-white">{exp.title}</span>
                    </div>
                    <div className="text-sm text-text-secondary">{exp.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 动态区域 - 社区动态 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            {isOwnProfile && (
              <div className="mb-4">
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[rgba(57,255,20,0.08)] hover:bg-[rgba(57,255,20,0.15)] border border-[rgba(57,255,20,0.2)] hover:border-[rgba(57,255,20,0.4)] rounded-xl transition-all text-[#39ff14] text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>分享你的训练日常、比赛心得...</span>
                </button>
              </div>
            )}
            <SocialFeed
              userId={Number(currentId) || undefined}
              hideCreate
              title="TA的动态"
              maxPosts={6}
            />
          </div>

          <CreatePostModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={() => setIsCreateOpen(false)}
            defaultRoleTag="player"
          />

          {isMessageOpen && currentId && (
            <MessageModal
              isOpen={isMessageOpen}
              onClose={() => setIsMessageOpen(false)}
              userId={Number(currentId)}
              userName={displayData.name || '球员'}
              userAvatar={displayData.avatar}
            />
          )}

          {/* 打Call区域 - 次模块 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
              <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-accent" />
              </span>
              为TA打Call
            </h3>
            
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl font-bold text-accent">{dacallCount}</div>
              <button onClick={() => setShowDacallForm(true)} className="btn-primary">
                <Zap className="w-4 h-4" /> 打Call
              </button>
            </div>

            {showDacallForm && (
              <div className="mb-6 p-4 rounded-xl bg-[rgba(10,14,23,0.7)] border border-[rgba(57,255,20,0.2)]">
                <input type="text" value={dacallName} onChange={e => setDacallName(e.target.value)} placeholder="你的昵称" className="form-input mb-3" />
                <textarea value={dacallMsg} onChange={e => setDacallMsg(e.target.value)} placeholder="留言（可选）" rows={3} className="form-input mb-3 resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowDacallForm(false)} className="btn-ghost">取消</button>
                  <button onClick={submitDacall} className="btn-primary">提交</button>
                </div>
              </div>
            )}

            {/* 留言列表 */}
            <div className="space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-[rgba(10,14,23,0.5)] border border-[rgba(57,255,20,0.1)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{c.name}</span>
                    <span className="text-xs text-text-muted">{c.time}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{c.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 评论区 - 社交组件 */}
          <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <CommentSection
              targetType="player_homepage"
              targetId={Number(currentId) || 0}
              maxLength={500}
              placeholder="发表你对这位球员的看法..."
            />
          </div>

          {/* 品牌Logo模块 */}
          <div className={`rounded-2xl p-6 mb-8 text-center backdrop-blur-md transition-all duration-500 card-hover ${
            isCyberpunk
              ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)]'
              : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isCyberpunk
                  ? 'bg-gradient-to-br from-[#39ff14] to-[#00D4FF] shadow-[0_0_20px_rgba(57,255,20,0.4)]'
                  : 'bg-gradient-to-br from-accent to-blue-500 shadow-lg'
              }`}>
                <span className="text-2xl">⚽</span>
              </div>
              <div className="text-left">
                <h3 className={`text-xl font-bold ${
                  isCyberpunk 
                    ? 'text-[#39ff14]' 
                    : 'bg-gradient-to-r from-white to-accent bg-clip-text text-transparent'
                }`}>少年球探</h3>
                <p className={`text-xs ${
                  isCyberpunk ? 'text-[#39ff14]/60' : 'text-text-muted'
                }`}>Youth Scout</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-3">发现下一个足球之星</p>
            <div className="pt-3 border-t border-[rgba(57,255,20,0.1)]">
              <p className="text-xs text-text-muted">www.shaonianqiutan.com</p>
            </div>
          </div>

          {/* 页脚 */}
          <div className="text-center pt-8 border-t border-[rgba(57,255,20,0.1)]">
            <p className="text-text-muted text-sm">少年球探 Youth Scout - 发现下一个足球之星</p>
          </div>
        </div>
      </div>
      
      {/* 隐藏的海报模板 - 用于生成海报 (9:16 竖版 450x800) */}
      <div 
        ref={posterRef}
        className="fixed -left-[9999px] top-0 overflow-hidden"
        style={{ width: '450px', height: '800px' }}
      >
        <div className={`w-full h-full flex flex-col relative ${
          isCyberpunk 
            ? 'bg-[#05070c]' 
            : 'bg-gradient-to-b from-[#0a0e14] via-[#0d1119] to-[#05070c]'
        }`}>
          {/* 赛博朋克装饰线条 */}
          {isCyberpunk && (
            <>
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#39ff14] to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-80" />
              <div className="absolute top-20 left-0 w-[100px] h-[1px] bg-gradient-to-r from-[#39ff14] to-transparent opacity-60" />
              <div className="absolute top-20 right-0 w-[100px] h-[1px] bg-gradient-to-l from-[#00D4FF] to-transparent opacity-60" />
            </>
          )}
          
          {/* 顶部品牌区域 */}
          <div className="pt-8 pb-4 px-8 text-center">
            {/* Logo图标 */}
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
              isCyberpunk
                ? 'bg-gradient-to-br from-[#39ff14] to-[#00D4FF] shadow-[0_0_25px_rgba(57,255,20,0.6)]'
                : 'bg-gradient-to-br from-[#39ff14] to-[#00D4FF] shadow-lg'
            }`}>
              <span className="text-2xl">⚽</span>
            </div>
            {/* 品牌名称 */}
            <h2 className={`text-2xl font-bold ${
              isCyberpunk 
                ? 'text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]' 
                : 'text-white'
            }`}>少年球探</h2>
            <p className={`text-xs mt-1 tracking-widest ${
              isCyberpunk ? 'text-[#39ff14]/60' : 'text-gray-400'
            }`}>YOUTH SCOUT</p>
            {/* 装饰线 */}
            <div className={`mt-3 mx-auto w-20 h-[2px] rounded-full ${
              isCyberpunk ? 'bg-gradient-to-r from-transparent via-[#39ff14] to-transparent' : 'bg-gradient-to-r from-transparent via-accent to-transparent'
            }`} />
          </div>
          
          {/* 球员信息卡片 */}
          <div className="flex-1 mx-6 mb-4 rounded-3xl overflow-hidden flex flex-col" style={{
            background: isCyberpunk 
              ? 'linear-gradient(135deg, rgba(57,255,20,0.08) 0%, rgba(0,212,255,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(26,31,46,0.95) 0%, rgba(17,24,39,0.98) 100%)',
            border: isCyberpunk ? '1px solid rgba(57,255,20,0.25)' : '1px solid rgba(57,255,20,0.15)',
            boxShadow: isCyberpunk ? '0 0 30px rgba(57,255,20,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            {/* 卡片顶部装饰 */}
            <div className={`h-1 w-full ${
              isCyberpunk 
                ? 'bg-gradient-to-r from-[#39ff14] via-[#00D4FF] to-[#A855F7]' 
                : 'bg-gradient-to-r from-[#39ff14] to-[#00D4FF]'
            }`} />
            
            <div className="flex-1 p-6 flex flex-col items-center">
              {/* 头像 */}
              <div className={`w-20 h-20 rounded-full overflow-hidden mb-3 ${
                isCyberpunk 
                  ? 'border-[3px] border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.5)]' 
                  : 'border-[3px] border-[#39ff14]'
              }`}>
                {displayData.avatar ? (
                  <LazyImage src={displayData.avatar} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[rgba(57,255,20,0.2)] to-[rgba(0,212,255,0.2)]">
                    ⚽
                  </div>
                )}
              </div>
              
              {/* 姓名和昵称 */}
              <h3 className="text-xl font-bold text-white mb-1">{displayData.name}</h3>
              <p className={`text-sm mb-3 ${
                isCyberpunk ? 'text-[#39ff14]' : 'text-[#39ff14]'
              }`}>@{displayData.nickname}</p>
              
              {/* 位置和城市 */}
              <div className="flex gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isCyberpunk
                    ? 'bg-[rgba(57,255,20,0.15)] text-[#39ff14] border border-[rgba(57,255,20,0.3)]'
                    : 'bg-[rgba(57,255,20,0.1)] text-[#39ff14] border border-[rgba(57,255,20,0.25)]'
                }`}>
                  {positionMap[displayData.position] || displayData.position}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isCyberpunk
                    ? 'bg-[rgba(0,212,255,0.15)] text-[#00D4FF] border border-[rgba(0,212,255,0.3)]'
                    : 'bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.25)]'
                }`}>
                  {displayData.city}
                </span>
              </div>
              
              {/* 年龄和俱乐部 */}
              <div className={`text-xs mb-4 ${isCyberpunk ? 'text-gray-400' : 'text-gray-400'}`}>
                <span>{displayData.age}岁</span>
                <span className="mx-2">·</span>
                <span>{displayData.club}</span>
              </div>
              
              {/* 技术特点 */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {displayData.skillsTags?.slice(0, 3).map((tag: string, i: number) => (
                  <span key={i} className={`px-2 py-1 rounded-full text-xs ${
                    isCyberpunk
                      ? 'bg-[rgba(168,85,247,0.15)] text-[#A855F7] border border-[rgba(168,85,247,0.25)]'
                      : 'bg-[rgba(168,85,247,0.1)] text-[#A855F7] border border-[rgba(168,85,247,0.2)]'
                  }`}>
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* 分隔装饰 */}
              <div className="w-full flex items-center gap-3 mb-4">
                <div className={`flex-1 h-px ${isCyberpunk ? 'bg-gradient-to-r from-transparent to-[rgba(57,255,20,0.3)]' : 'bg-gradient-to-r from-transparent to-gray-700'}`} />
                <Sparkles className={`w-4 h-4 ${isCyberpunk ? 'text-[#39ff14]' : 'text-[#39ff14]'}`} />
                <div className={`flex-1 h-px ${isCyberpunk ? 'bg-gradient-to-l from-transparent to-[rgba(57,255,20,0.3)]' : 'bg-gradient-to-l from-transparent to-gray-700'}`} />
              </div>
              
              {/* 二维码区域 */}
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <p className={`text-sm font-bold mb-3 ${
                  isCyberpunk ? 'text-[#39ff14]' : 'text-[#39ff14]'
                }`}>👇 扫码为TA打Call 👇</p>
                
                {/* 二维码 */}
                <div className={`p-2 rounded-2xl ${
                  isCyberpunk 
                    ? 'bg-white border-2 border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.3)]' 
                    : 'bg-white border-2 border-[#39ff14] shadow-lg'
                }`}>
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="二维码" 
                      className="w-28 h-28"
                    />
                  ) : (
                    <div className="w-28 h-28 flex items-center justify-center text-gray-400">
                      <span className="text-2xl">📱</span>
                    </div>
                  )}
                </div>
                
                {/* 提示文案 */}
                <p className={`text-xs mt-3 ${isCyberpunk ? 'text-gray-500' : 'text-gray-500'}`}>
                  长按识别 · 进入个人主页 · 为球员加油
                </p>
              </div>
            </div>
          </div>
          
          {/* 底部品牌区域 */}
          <div className="pb-6 px-8 text-center">
            {/* 口号 */}
            <p className={`text-sm font-medium mb-2 ${
              isCyberpunk ? 'text-white' : 'text-white'
            }`}>发现下一个足球之星</p>
            
            {/* 品牌信息 */}
            <div className={`flex items-center justify-center gap-2 text-xs ${
              isCyberpunk ? 'text-[#39ff14]/70' : 'text-gray-500'
            }`}>
              <span>⚽</span>
              <span>少年球探 Youth Scout</span>
              <span>⚽</span>
            </div>
            <p className={`text-xs mt-1 ${
              isCyberpunk ? 'text-[#39ff14]/50' : 'text-gray-600'
            }`}>www.shaonianqiutan.com</p>
            
            {/* 底部装饰 */}
            <div className={`mt-3 mx-auto w-32 h-[1px] rounded-full ${
              isCyberpunk ? 'bg-gradient-to-r from-transparent via-[#39ff14]/50 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'
            }`} />
          </div>
        </div>
      </div>
      
      {/* 赛博朋克动画样式 */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(57,255,20,0.5)) drop-shadow(0 0 60px rgba(0,212,255,0.3));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 50px rgba(57,255,20,0.8)) drop-shadow(0 0 80px rgba(0,212,255,0.5));
          }
        }
        
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: 200% 0%;
          }
          100% {
            background-position: -200% 0%;
          }
        }
        
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PersonalHomepage;
