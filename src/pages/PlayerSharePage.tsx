import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { playerApi, reportApi } from '../services/api';
import { Loading } from '../components';
import { MapPin, Ruler, Weight, Trophy, Star, UserCheck, FileText, MessageCircle, Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

// 位置名称映射
const positionMap: Record<string, string> = {
  'ST': '前锋', 'LW': '左边锋', 'RW': '右边锋',
  'CAM': '攻击型中场', 'CM': '中场', 'CDM': '防守型中场',
  'LM': '左边前卫', 'RM': '右边前卫', 'LB': '左边后卫',
  'RB': '右边后卫', 'CB': '中后卫', 'GK': '门将'
};

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

// 雷达图组件（简化版）
const RadarChart: React.FC<{ data: any }> = ({ data }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (!canvasRef.current || !data) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 280;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = 90;
    ctx.clearRect(0, 0, size, size);
    const speed = data.run30m ? Math.min(100, Math.max(0, (6 - parseFloat(data.run30m)) / 2 * 100)) : 60;
    const explosive = data.longJump ? Math.min(100, Math.max(0, parseFloat(data.longJump) / 250 * 100)) : 55;
    const strength = data.pullUp ? Math.min(100, Math.max(0, parseFloat(data.pullUp) / 20 * 100)) : 50;
    const flexibility = data.sitReach ? Math.min(100, Math.max(0, parseFloat(data.sitReach) / 25 * 100)) : 65;
    const values = [speed, explosive, strength, flexibility, 70, 75];
    const labels = ['速度', '爆发力', '力量', '柔韧性', '敏捷', '耐力'];
    const angleStep = (Math.PI * 2) / 6;
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.12)';
      for (let j = 0; j < 6; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelX = center + (radius + 22) * Math.cos(angle);
      const labelY = center + (radius + 22) * Math.sin(angle);
      ctx.fillText(labels[i], labelX, labelY);
    }
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = values[i] / 100;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [data]);
  return <canvas ref={canvasRef} className="w-full max-w-[280px] h-auto mx-auto" />;
};

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
  skillsTags: ['传球精准', '视野开阔', '远射能力强'],
  run30m: '4.5',
  longJump: '195',
  pullUp: '12',
  sitReach: '18',
  growthExperiences: [
    { year: '2021', title: '入选校队', description: '凭借出色表现入选学校足球队' },
    { year: '2023', title: '获得市级冠军', description: '带领球队获得市青少年足球联赛冠军' }
  ]
};

const sampleReports = [
  {
    id: 1,
    title: '技术能力全面评估报告',
    description: '该球员在中场组织方面展现出了超越同龄人的成熟度，传球视野开阔。',
    rating: 4.8,
    analyst: { name: '李教练' },
    created_at: '2026-03-15T10:30:00Z'
  },
  {
    id: 2,
    title: '身体素质专项分析',
    description: '球员身体素质优秀，30米跑成绩在同年龄段处于前10%水平。',
    rating: 4.5,
    analyst: { name: '张分析师' },
    created_at: '2026-02-20T09:00:00Z'
  }
];

const PlayerSharePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>(sampleReports);
  const [loading, setLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [dacallCount, setDacallCount] = useState(128);
  const [showDacallForm, setShowDacallForm] = useState(false);
  const [dacallName, setDacallName] = useState('');
  const [dacallMsg, setDacallMsg] = useState('');
  const [comments, setComments] = useState([
    { name: '李教练', msg: '进步很大，继续保持！', time: '2天前' },
    { name: '张爸爸', msg: '儿子加油！', time: '5天前' }
  ]);

  useEffect(() => {
    if (id) loadProfile();
    else setLoading(false);
  }, [id]);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/player/${id}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 160, margin: 1, color: { dark: '#0a0e14', light: '#ffffff' } });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('二维码生成失败:', err);
      }
    };
    generateQR();
  }, [id]);

  const loadProfile = async () => {
    try {
      const pRes = await playerApi.getPublicProfile(Number(id));
      if (pRes.data?.success) {
        const playerData = pRes.data.data?.player || pRes.data.data;
        setProfile(playerData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayData = profile ? {
    ...sampleData,
    ...profile,
    name: profile.real_name || profile.realName || profile.name || sampleData.name,
    nickname: profile.nickname || sampleData.nickname,
    age: profile.age || (profile.birth_date ? calculateAge(profile.birth_date) : sampleData.age),
    height: profile.height || sampleData.height,
    weight: profile.weight || sampleData.weight,
    club: profile.current_team || profile.club || sampleData.club,
    city: profile.province && profile.city ? `${profile.province} ${profile.city}` : sampleData.city,
    position: profile.position || sampleData.position,
    skillsTags: profile.technical_tags || profile.technicalTags || sampleData.skillsTags,
    run30m: profile.latest_physical_test?.sprint_30m?.toString() || sampleData.run30m,
    longJump: profile.latest_physical_test?.standing_long_jump?.toString() || sampleData.longJump,
    pullUp: profile.latest_physical_test?.push_up?.toString() || sampleData.pullUp,
    sitReach: profile.latest_physical_test?.sit_and_reach?.toString() || sampleData.sitReach,
    growthExperiences: profile.experiences || sampleData.growthExperiences,
  } : sampleData;

  const submitDacall = () => {
    if (!dacallName.trim()) return;
    setDacallCount(c => c + 1);
    if (dacallMsg.trim()) {
      setComments(prev => [{ name: dacallName, msg: dacallMsg, time: '刚刚' }, ...prev]);
    }
    setShowDacallForm(false);
    setDacallName('');
    setDacallMsg('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] pb-8">
      {/* 顶部品牌 */}
      <div className="bg-gradient-to-b from-[#0f1419] to-[#0a0e14] pt-6 pb-4 px-4 text-center border-b border-white/5">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-lg">
            ⚽
          </div>
          <span className="text-lg font-bold text-white">少年球探</span>
        </div>
        <p className="text-xs text-gray-500">发现下一个足球之星</p>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* 个人资料卡 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-500/50 overflow-hidden bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center text-2xl">
              {displayData.avatar ? <img src={displayData.avatar} alt="" className="w-full h-full object-cover" /> : '⚽'}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{displayData.name}</h1>
              <p className="text-emerald-400/70 text-sm">@{displayData.nickname}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                  {positionMap[displayData.position] || displayData.position}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {displayData.city}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#0f1419] rounded-xl p-3">
              <div className="text-lg font-bold text-white">{displayData.age}</div>
              <div className="text-xs text-gray-500">岁</div>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-3">
              <div className="text-lg font-bold text-white">{displayData.height}</div>
              <div className="text-xs text-gray-500">cm</div>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-3">
              <div className="text-lg font-bold text-white">{displayData.weight}</div>
              <div className="text-xs text-gray-500">kg</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>{displayData.club}</span>
            </div>
          </div>
        </div>

        {/* 技术特点 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">⚡</span>
            技术特点
          </h3>
          <div className="flex flex-wrap gap-2">
            {displayData.skillsTags?.map((tag: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-400/90 text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 体测数据 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">🏃</span>
            体测数据
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1419] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{displayData.run30m || '--'}</div>
              <div className="text-xs text-gray-500">30米跑(秒)</div>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-orange-400">{displayData.longJump || '--'}</div>
              <div className="text-xs text-gray-500">立定跳远(cm)</div>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-400">{displayData.pullUp || '--'}</div>
              <div className="text-xs text-gray-500">俯卧撑(个)</div>
            </div>
            <div className="bg-[#0f1419] rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-purple-400">{displayData.sitReach || '--'}</div>
              <div className="text-xs text-gray-500">坐位体前屈(cm)</div>
            </div>
          </div>
        </div>

        {/* 雷达图 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">📊</span>
            技能雷达图
          </h3>
          <RadarChart data={displayData} />
        </div>

        {/* 球探报告 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">📝</span>
            球探报告
          </h3>
          <div className="space-y-3">
            {reports.slice(0, 2).map((report: any) => (
              <div key={report.id} className="bg-[#0f1419] rounded-xl p-4 border border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{report.analyst?.name || '专业分析师'}</div>
                      <div className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                  </div>
                  {report.rating && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      {report.rating}
                    </div>
                  )}
                </div>
                <h4 className="text-white text-sm font-medium mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  {report.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2">{report.description || report.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 足球经历 */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">🏆</span>
            足球经历
          </h3>
          <div className="space-y-3 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 to-transparent" />
            {displayData.growthExperiences?.map((exp: any, i: number) => (
              <div key={i} className="flex gap-3 relative">
                <div className="relative z-10 w-3 h-3 rounded-full bg-emerald-500 mt-1" />
                <div className="flex-1 bg-[#0f1419] rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-400 text-sm font-bold">{exp.year}</span>
                    <span className="text-white text-sm">{exp.title}</span>
                  </div>
                  <p className="text-xs text-gray-400">{exp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 为TA打Call */}
        <div className="bg-[#1a1f2e] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs">👏</span>
            为TA打Call
          </h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold text-emerald-400">{dacallCount}</div>
            <button onClick={() => setShowDacallForm(true)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
              打Call
            </button>
          </div>
          {showDacallForm && (
            <div className="mb-4 p-3 rounded-xl bg-[#0f1419] border border-emerald-500/20">
              <input type="text" value={dacallName} onChange={e => setDacallName(e.target.value)} placeholder="你的昵称" className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2" />
              <textarea value={dacallMsg} onChange={e => setDacallMsg(e.target.value)} placeholder="留言（可选）" rows={2} className="w-full bg-transparent border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-2 resize-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDacallForm(false)} className="px-3 py-1.5 text-gray-400 text-sm">取消</button>
                <button onClick={submitDacall} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm">提交</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {comments.slice(0, 3).map((c, i) => (
              <div key={i} className="p-3 rounded-lg bg-[#0f1419] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-gray-500">{c.time}</span>
                </div>
                <p className="text-xs text-gray-400">{c.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 二维码卡片 */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-5 border border-emerald-500/20 text-center">
          <p className="text-emerald-400 text-sm font-medium mb-3">长按识别二维码</p>
          <div className="w-32 h-32 mx-auto bg-white rounded-xl p-2 mb-3">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="二维码" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">加载中...</div>
            )}
          </div>
          <p className="text-gray-500 text-xs">查看完整球员档案 · 获取更多球探报告</p>
        </div>

        {/* 底部品牌 */}
        <div className="text-center pt-4 border-t border-white/5">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm">⚽</div>
            <span className="text-sm font-bold text-white">少年球探</span>
          </div>
          <p className="text-xs text-gray-600">www.shaonianqiutan.com</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerSharePage;
