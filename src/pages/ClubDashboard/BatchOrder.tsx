import React, { useState } from 'react';
import { ArrowLeft, Users, FileText, CreditCard, Check, Search, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi, orderApi } from '../../services/api';

interface BatchOrderProps {
  onBack: () => void;
}

interface Player {
  id: number;
  name: string;
  positionName: string;
  ageGroup: string;
}

const SERVICES = [
  { id: 'quick_report', name: '快速分析', price: 99, duration: '24小时', features: ['基础评分', '技术建议'] },
  { id: 'full_report', name: '全方位报告', price: 299, duration: '48小时', features: ['全面分析', '成长建议', '战术建议'], recommended: true },
  { id: 'video_analysis', name: '视频分析', price: 499, duration: '72小时', features: ['视频解读', '深度分析', '专业建议'] },
];

const DISCOUNTS = [
  { min: 5, max: 9, rate: 0.95, label: '5-9人95折' },
  { min: 10, max: 19, rate: 0.9, label: '10-19人9折' },
  { min: 20, max: 49, rate: 0.85, label: '20-49人85折' },
  { min: 50, max: 999, rate: 0.8, label: '50人以上8折' },
];

const BatchOrder: React.FC<BatchOrderProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [serviceType, setServiceType] = useState('full_report');
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [remark, setRemark] = useState('');

  const service = SERVICES.find(s => s.id === serviceType) || SERVICES[1];
  const discount = DISCOUNTS.find(d => selectedPlayers.length >= d.min && selectedPlayers.length <= d.max) || DISCOUNTS[0];
  const originalPrice = service.price * selectedPlayers.length;
  const finalPrice = originalPrice * discount.rate;
  const discountAmount = originalPrice - finalPrice;

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getPlayers({ keyword: searchQuery, pageSize: 20 });
      if (res.data?.success && res.data?.data) setPlayers(res.data.data.list || []);
    } catch (error) {
      setPlayers([
        { id: 1, name: '张小明', positionName: '前锋', ageGroup: 'U12' },
        { id: 2, name: '李小红', positionName: '中场', ageGroup: 'U10' },
        { id: 3, name: '王强', positionName: '后卫', ageGroup: 'U12' },
      ]);
    }
    setLoading(false);
  };

  const togglePlayer = (player: Player) => {
    setSelectedPlayers(prev => prev.find(p => p.id === player.id) ? prev.filter(p => p.id !== player.id) : [...prev, player]);
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length === 0) return;
    setLoading(true);
    try {
      await orderApi.create({ playerIds: selectedPlayers.map(p => p.id), serviceType, amount: finalPrice, remark });
      toast.success('订单创建成功！');
      onBack();
    } catch (error) {
      toast.error('订单创建失败，请重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="max-w-4xl mx-auto p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" />返回
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">批量下单</h1>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-4 mb-8">
          {['选择球员', '选择服务', '确认订单'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 ${step > i + 1 ? 'text-emerald-400' : step === i + 1 ? 'text-white' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > i + 1 ? 'bg-emerald-500' : step === i + 1 ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-gray-800'}`}>
                  {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="font-medium">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-emerald-500' : 'bg-gray-700'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索球员姓名..." className="w-full pl-10 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <button onClick={handleSearch} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors">搜索</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map(player => {
                  const isSelected = selectedPlayers.some(p => p.id === player.id);
                  return (
                    <div key={player.id} onClick={() => togglePlayer(player)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-[#0f1419] border border-gray-700 hover:border-gray-600'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {player.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.positionName} · {player.ageGroup}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <div className="font-medium text-white mb-3">已选择 {selectedPlayers.length} 名球员</div>
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map(p => (
                  <span key={p.id} onClick={() => togglePlayer(p)} className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm cursor-pointer hover:bg-emerald-500/30">
                    {p.name} <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={selectedPlayers.length === 0}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors">
              下一步：选择服务
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {SERVICES.map(s => (
                <div key={s.id} onClick={() => setServiceType(s.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${serviceType === s.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-[#1a1f2e] hover:border-gray-600'}`}>
                  {s.recommended && <span className="inline-block px-2 py-0.5 bg-yellow-500 text-black text-xs font-medium rounded mb-2">推荐</span>}
                  <div className="text-xl font-bold text-white mb-1">{s.name}</div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">¥{s.price}</div>
                  <div className="text-sm text-gray-400 mb-3">{s.duration}</div>
                  {s.features.map(f => <div key={f} className="text-sm text-gray-400">• {f}</div>)}
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">上一步</button>
              <button onClick={() => setStep(3)} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">下一步：确认订单</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">订单确认</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex justify-between"><span>服务类型</span><span className="text-white">{service.name} × {selectedPlayers.length}人</span></div>
                <div className="flex justify-between"><span>原价</span><span className="text-white">¥{originalPrice.toLocaleString()}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-emerald-400"><span>团队折扣 ({discount.label})</span><span>-¥{discountAmount.toLocaleString()}</span></div>}
                <div className="flex justify-between text-xl font-bold text-white pt-3 border-t border-gray-700"><span>实付金额</span><span className="text-emerald-400">¥{finalPrice.toLocaleString()}</span></div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">备注</label>
              <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} placeholder="如：U12梯队季度评估"
                className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors">上一步</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors">
                {loading ? '提交中...' : '确认下单并支付'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchOrder;
