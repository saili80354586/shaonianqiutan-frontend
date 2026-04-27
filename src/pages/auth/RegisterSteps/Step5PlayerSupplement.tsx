import React, { useState } from 'react';
import {
  Phone, MessageCircle, GraduationCap, Users, Dna,
  Target, Brain, Activity, ArrowLeft, ArrowRight, CheckCircle2, Lightbulb
} from 'lucide-react';

interface Step5PlayerSupplementProps {
  onSubmit: (data: PlayerSupplementData) => void;
  onSkip: () => void;
  onBack: () => void;
  defaultValues?: Partial<PlayerSupplementData>;
}

export interface PlayerSupplementData {
  // 联系信息
  contact: {
    school?: string;
    wechat?: string;
    phone?: string;
  };
  // 家庭信息
  family: {
    fatherHeight?: number;
    motherHeight?: number;
    fatherOccupation?: string;
    motherOccupation?: string;
    fatherAthlete?: boolean;
    motherAthlete?: boolean;
  };
  // 技术特点标签
  technicalTags: string[];
  // 心智性格标签
  mentalTags: string[];
  // 体测数据
  physicalTests: {
    sprint30m?: number;      // 30米跑（秒）
    longJump?: number;       // 立定跳远（厘米）
    flexibility?: number;    // 坐位体前屈（厘米）
    pullUps?: number;        // 引体向上（个）
    pushUps?: number;        // 俯卧撑（个）
    sitUps?: number;         // 仰卧起坐（个）
    fiveMeterShuttle?: number; // 5×25米折返跑（秒）
    coordination?: number;   // 协调性测试（秒）
  };
}

// 技术特点标签选项
const technicalTagOptions = [
  { value: 'speed', label: '速度快', category: '速度' },
  { value: 'explosive', label: '爆发力强', category: '速度' },
  { value: 'passing', label: '传球准', category: '技术' },
  { value: 'dribbling', label: '盘带好', category: '技术' },
  { value: 'shooting', label: '射门准', category: '技术' },
  { value: 'heading', label: '头球好', category: '技术' },
  { value: 'tackling', label: '抢断强', category: '防守' },
  { value: 'positioning', label: '位置感好', category: '防守' },
  { value: 'vision', label: '视野开阔', category: '意识' },
  { value: 'decision', label: '决策快', category: '意识' },
  { value: 'first_touch', label: '停球稳', category: '技术' },
  { value: 'long_shot', label: '远射能力', category: '技术' },
  { value: 'free_kick', label: '任意球', category: '技术' },
  { value: 'crossing', label: '传中准', category: '技术' },
];

// 心智性格标签选项
const mentalTagOptions = [
  { value: 'leadership', label: '领导力', desc: '能够带领团队' },
  { value: 'pressure', label: '抗压能力', desc: '关键时刻不慌乱' },
  { value: 'teamwork', label: '团队协作', desc: '配合意识强' },
  { value: 'aggressive', label: '进攻欲望', desc: '敢于突破' },
  { value: 'discipline', label: '纪律性强', desc: '遵守战术安排' },
  { value: 'resilience', label: '韧性强', desc: '不轻易放弃' },
  { value: 'confidence', label: '自信心', desc: '敢于表现自己' },
  { value: 'focus', label: '专注力', desc: '比赛专注度高' },
  { value: 'learning', label: '学习能力', desc: '进步速度快' },
  { value: 'communication', label: '沟通能力', desc: '与队友交流顺畅' },
];

// 职业选项
const occupationOptions = [
  '体育从业者', '教育工作者', '企业职员', '公务员', 
  '个体经营', '自由职业', '专业技术人员', '其他'
];

const Step5PlayerSupplement: React.FC<Step5PlayerSupplementProps> = ({ 
  onSubmit, onSkip, onBack, defaultValues 
}) => {
  const [formData, setFormData] = useState<PlayerSupplementData>({
    contact: {
      school: defaultValues?.contact?.school || '',
      wechat: defaultValues?.contact?.wechat || '',
      phone: defaultValues?.contact?.phone || '',
    },
    family: {
      fatherHeight: defaultValues?.family?.fatherHeight,
      motherHeight: defaultValues?.family?.motherHeight,
      fatherOccupation: defaultValues?.family?.fatherOccupation || '',
      motherOccupation: defaultValues?.family?.motherOccupation || '',
      fatherAthlete: defaultValues?.family?.fatherAthlete || false,
      motherAthlete: defaultValues?.family?.motherAthlete || false,
    },
    technicalTags: defaultValues?.technicalTags || [],
    mentalTags: defaultValues?.mentalTags || [],
    physicalTests: {
      sprint30m: defaultValues?.physicalTests?.sprint30m,
      longJump: defaultValues?.physicalTests?.longJump,
      flexibility: defaultValues?.physicalTests?.flexibility,
      pullUps: defaultValues?.physicalTests?.pullUps,
      pushUps: defaultValues?.physicalTests?.pushUps,
      sitUps: defaultValues?.physicalTests?.sitUps,
      fiveMeterShuttle: defaultValues?.physicalTests?.fiveMeterShuttle,
      coordination: defaultValues?.physicalTests?.coordination,
    },
  });

  // Tab 顺序：能力标签 -> 体测数据 -> 家庭信息 -> 联系信息
  const [activeTab, setActiveTab] = useState<'tags' | 'physical' | 'family' | 'contact'>('tags');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const handleContactChange = (field: keyof typeof formData.contact, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const handleFamilyChange = (field: keyof typeof formData.family, value: any) => {
    setFormData(prev => ({
      ...prev,
      family: { ...prev.family, [field]: value }
    }));
  };

  const handlePhysicalTestChange = (field: keyof typeof formData.physicalTests, value: string) => {
    setFormData(prev => ({
      ...prev,
      physicalTests: { 
        ...prev.physicalTests, 
        [field]: value ? parseFloat(value) : undefined 
      }
    }));
  };

  const toggleTechnicalTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      technicalTags: prev.technicalTags.includes(tag)
        ? prev.technicalTags.filter(t => t !== tag)
        : [...prev.technicalTags, tag].slice(0, 5)
    }));
  };

  const toggleMentalTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      mentalTags: prev.mentalTags.includes(tag)
        ? prev.mentalTags.filter(t => t !== tag)
        : [...prev.mentalTags, tag].slice(0, 4)
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    
    // 至少填写一项体测数据才提示
    const hasPhysicalData = Object.values(formData.physicalTests).some(v => v !== undefined && v > 0);
    if (!hasPhysicalData) {
      newErrors.physical = '建议至少填写一项体测数据';
    }

    setErrors(newErrors);
    return true; // 允许跳过，所以不强制验证
  };

  const handleSubmit = () => {
    validate();
    onSubmit(formData);
  };

  // Tab 顺序：能力标签 -> 体测数据 -> 家庭信息 -> 联系信息
  const tabs = [
    { id: 'tags', label: '能力标签', icon: Target },
    { id: 'physical', label: '体测数据', icon: Activity },
    { id: 'family', label: '家庭信息', icon: Users },
    { id: 'contact', label: '联系信息', icon: Phone },
  ];

  // 获取下一个 tab
  const getNextTab = (): typeof activeTab | null => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      return tabs[currentIndex + 1].id as typeof activeTab;
    }
    return null;
  };

  // 处理下一步
  const handleNext = () => {
    const nextTab = getNextTab();
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  // 是否是最后一步（联系信息）
  const isLastStep = activeTab === 'contact';

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">完善球员档案</h2>
        <p className="text-blue-200/60">补充详细资料，让球探更好地了解你</p>
      </div>

      {/* Tab 导航 */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-blue-200/60 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 联系信息 */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="block text-blue-200/80 font-medium mb-2 text-sm">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              所在学校/机构
            </label>
            <input
              type="text"
              value={formData.contact.school}
              onChange={(e) => handleContactChange('school', e.target.value)}
              placeholder="例如：北京市第一中学"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                微信号
              </label>
              <input
                type="text"
                value={formData.contact.wechat}
                onChange={(e) => handleContactChange('wechat', e.target.value)}
                placeholder="用于联系"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                <Phone className="w-4 h-4 inline mr-1" />
                联系手机
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => handleContactChange('phone', e.target.value)}
                placeholder="家长或本人手机号"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* 家庭信息 */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                父亲身高 (cm)
              </label>
              <input
                type="number"
                value={formData.family.fatherHeight || ''}
                onChange={(e) => handleFamilyChange('fatherHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="厘米"
                min={150}
                max={220}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                母亲身高 (cm)
              </label>
              <input
                type="number"
                value={formData.family.motherHeight || ''}
                onChange={(e) => handleFamilyChange('motherHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="厘米"
                min={140}
                max={200}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                父亲职业
              </label>
              <select
                value={formData.family.fatherOccupation}
                onChange={(e) => handleFamilyChange('fatherOccupation', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                <option value="" className="bg-slate-800">请选择</option>
                {occupationOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                母亲职业
              </label>
              <select
                value={formData.family.motherOccupation}
                onChange={(e) => handleFamilyChange('motherOccupation', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 appearance-none"
              >
                <option value="" className="bg-slate-800">请选择</option>
                {occupationOptions.map(opt => (
                  <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-blue-200/80 font-medium text-sm">
              <Dna className="w-4 h-4 inline mr-1" />
              运动世家背景
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.family.fatherAthlete}
                  onChange={(e) => handleFamilyChange('fatherAthlete', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-blue-200/70 text-sm">父亲有专业运动经历</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.family.motherAthlete}
                  onChange={(e) => handleFamilyChange('motherAthlete', e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-blue-200/70 text-sm">母亲有专业运动经历</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 能力标签 */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          {/* 技术特点 */}
          <div>
            <label className="block text-blue-200/80 font-medium mb-3 text-sm">
              <Target className="w-4 h-4 inline mr-1" />
              技术特点 <span className="text-blue-400">（最多选5个）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {technicalTagOptions.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => toggleTechnicalTag(tag.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.technicalTags.includes(tag.value)
                      ? 'bg-emerald-500/30 border border-emerald-500 text-emerald-300'
                      : 'bg-white/5 border border-white/10 text-blue-200/60 hover:border-white/30'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 心智性格 */}
          <div>
            <label className="block text-blue-200/80 font-medium mb-3 text-sm">
              <Brain className="w-4 h-4 inline mr-1" />
              心智性格 <span className="text-blue-400">（最多选4个）</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mentalTagOptions.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => toggleMentalTag(tag.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.mentalTags.includes(tag.value)
                      ? 'bg-purple-500/30 border-purple-500'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    formData.mentalTags.includes(tag.value) ? 'text-purple-300' : 'text-blue-200/80'
                  }`}>
                    {tag.label}
                  </div>
                  <div className="text-xs text-blue-200/50 mt-0.5">{tag.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 体测数据 */}
      {activeTab === 'physical' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-sm">
              体测数据为选填项，建议填写真实数据以提高被选中的机会
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                30米跑 (秒)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.physicalTests.sprint30m || ''}
                onChange={(e) => handlePhysicalTestChange('sprint30m', e.target.value)}
                placeholder="例如：4.50"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-blue-200/40 text-xs mt-1">数值越小越好</p>
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                立定跳远 (cm)
              </label>
              <input
                type="number"
                value={formData.physicalTests.longJump || ''}
                onChange={(e) => handlePhysicalTestChange('longJump', e.target.value)}
                placeholder="例如：250"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-blue-200/40 text-xs mt-1">数值越大越好</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                坐位体前屈 (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.physicalTests.flexibility || ''}
                onChange={(e) => handlePhysicalTestChange('flexibility', e.target.value)}
                placeholder="例如：15.5"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                引体向上 (个)
              </label>
              <input
                type="number"
                value={formData.physicalTests.pullUps || ''}
                onChange={(e) => handlePhysicalTestChange('pullUps', e.target.value)}
                placeholder="例如：15"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                俯卧撑 (个)
              </label>
              <input
                type="number"
                value={formData.physicalTests.pushUps || ''}
                onChange={(e) => handlePhysicalTestChange('pushUps', e.target.value)}
                placeholder="例如：40"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                仰卧起坐 (个/分钟)
              </label>
              <input
                type="number"
                value={formData.physicalTests.sitUps || ''}
                onChange={(e) => handlePhysicalTestChange('sitUps', e.target.value)}
                placeholder="例如：50"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                5×25米折返跑 (秒)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.physicalTests.fiveMeterShuttle || ''}
                onChange={(e) => handlePhysicalTestChange('fiveMeterShuttle', e.target.value)}
                placeholder="例如：35.50"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-blue-200/80 font-medium mb-2 text-sm">
                协调性测试 (秒)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.physicalTests.coordination || ''}
                onChange={(e) => handlePhysicalTestChange('coordination', e.target.value)}
                placeholder="例如：12.50"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* 按钮组 */}
      <div className="flex flex-col gap-3 pt-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            上一步
          </button>
          
          {isLastStep ? (
            // 最后一步（联系信息）：显示"完成并进入官网"
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              完成并进入官网
            </button>
          ) : (
            // 非最后一步：显示"下一步"
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              下一步
            </button>
          )}
        </div>
        
        {/* 仅在最后一步显示"暂不填写"选项 */}
        {isLastStep && (
          <button
            type="button"
            onClick={onSkip}
            className="py-3 text-blue-200/50 hover:text-blue-200 text-sm transition-colors"
          >
            暂不填写，直接进入官网 →
          </button>
        )}
      </div>
    </div>
  );
};

export default Step5PlayerSupplement;
