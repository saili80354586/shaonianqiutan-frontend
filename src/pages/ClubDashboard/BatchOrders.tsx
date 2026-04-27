import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Check, FileText, Video, ShoppingCart, Trash2, ChevronRight, Tag, Info, type LucideIcon } from 'lucide-react';
import { CardGridSkeleton } from '../../components/ui/loading';
import { clubApi } from '../../services/club';

interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  jerseyNumber: string;
}

interface CartItem {
  playerId: string;
  playerName: string;
  type: 'text' | 'video';
  price: number;
}

interface BatchOrdersProps {
  onBack: () => void;
  clubId?: number;
}

const BatchOrders: React.FC<BatchOrdersProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const response = await clubApi.getPlayers({ pageSize: 100 });
      if (response.data?.success) {
        const list = response.data.data?.list || [];
        setPlayers(list.map((p: any) => ({
          id: String(p.id),
          name: p.name || '未知球员',
          age: p.age || (p.birthDate ? new Date().getFullYear() - new Date(p.birthDate).getFullYear() : 0),
          position: p.position || p.positionName || '未知',
          jerseyNumber: p.jerseyNumber || '-',
        })));
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('加载球员失败:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.jerseyNumber.includes(searchQuery)
  );

  const togglePlayer = (playerId: string) => {
    const newSet = new Set(selectedPlayers);
    if (newSet.has(playerId)) newSet.delete(playerId);
    else newSet.add(playerId);
    setSelectedPlayers(newSet);
  };

  const addToCart = (type: 'text' | 'video') => {
    const newItems: CartItem[] = [];
    selectedPlayers.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        newItems.push({
          playerId: player.id,
          playerName: player.name,
          type,
          price: type === 'video' ? 299 : 99
        });
      }
    });
    setCart([...cart, ...newItems]);
    setSelectedPlayers(new Set());
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getDiscountRate = () => {
    const count = cart.length;
    if (count >= 10) return 0.85;
    if (count >= 5) return 0.90;
    if (count >= 3) return 0.95;
    return 1;
  };

  const getDiscountLabel = () => {
    const rate = getDiscountRate();
    if (rate === 0.85) return '8.5折';
    if (rate === 0.90) return '9折';
    if (rate === 0.95) return '95折';
    return null;
  };

  const getOriginalTotalPrice = () => cart.reduce((sum, item) => sum + item.price, 0);
  const getTotalPrice = () => Math.round(getOriginalTotalPrice() * getDiscountRate());
  const getSavedAmount = () => getOriginalTotalPrice() - getTotalPrice();

  const getPositionColor = (pos: string) => {
    const map: Record<string, string> = {
      '前锋': 'bg-red-500/20 text-red-300',
      '中场': 'bg-blue-500/20 text-blue-300',
      '后卫': 'bg-green-500/20 text-green-300',
      '门将': 'bg-yellow-500/20 text-yellow-300',
    };
    return map[pos] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">批量下单</h1>
            <p className="text-gray-400 mt-1">为多名球员同时购买分析服务</p>
          </div>
        </div>

        {/* 步骤条 */}
        <div className="flex items-center gap-4 mb-8">
          <Step number={1} active={step >= 1} label="选择球员" />
          <div className="flex-1 h-0.5 bg-gray-800"><div className={`h-full transition-all ${step >= 2 ? 'bg-emerald-500' : ''}`} /></div>
          <Step number={2} active={step >= 2} label="选择服务" />
          <div className="flex-1 h-0.5 bg-gray-800"><div className={`h-full transition-all ${step >= 3 ? 'bg-emerald-500' : ''}`} /></div>
          <Step number={3} active={step >= 3} label="确认订单" />
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* 左侧：球员列表 */}
          <div className="col-span-2 space-y-6">
            {step === 1 && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="搜索球员姓名或球衣号..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-medium">选择球员 ({selectedPlayers.size} 已选)</span>
                    <button onClick={() => setSelectedPlayers(new Set(players.map(p => p.id)))} className="text-sm text-emerald-400 hover:text-emerald-300">
                      全选
                    </button>
                  </div>
                  {loading ? (
                    <CardGridSkeleton count={4} columns={2} />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {filteredPlayers.map(player => (
                        <div
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPlayers.has(player.id) 
                              ? 'border-emerald-500 bg-emerald-500/10' 
                              : 'border-gray-800 hover:border-gray-700 bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedPlayers.has(player.id) ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
                            }`}>
                              {selectedPlayers.has(player.id) && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{player.name}</span>
                                <span className={`px-2 py-0.5 rounded text-xs ${getPositionColor(player.position)}`}>{player.position}</span>
                              </div>
                              <div className="text-sm text-gray-500">{player.age}岁 · 球衣号 {player.jerseyNumber}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setStep(2)} 
                  disabled={selectedPlayers.size === 0}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  下一步：选择服务类型
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">选择分析服务</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ServiceCard 
                      icon={FileText} 
                      title="文字版报告" 
                      price={99} 
                      features={['专业文字分析', '技术评分', '改进建议', '3-5天交付']}
                      onSelect={() => { addToCart('text'); setStep(3); }}
                      color="blue"
                    />
                    <ServiceCard 
                      icon={Video} 
                      title="视频版报告" 
                      price={299} 
                      features={['高清视频讲解', '逐帧技术分析', '动态对比', '7-10天交付']}
                      onSelect={() => { addToCart('video'); setStep(3); }}
                      color="purple"
                      recommended
                    />
                  </div>
                </div>
                <button onClick={() => setStep(1)} className="w-full py-3 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">
                  返回重新选择球员
                </button>
              </>
            )}

            {step === 3 && (
              <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">订单确认</h3>
                {getSavedAmount() > 0 && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                    <Tag className="w-5 h-5 text-emerald-400" />
                    <div className="flex-1">
                      <div className="text-sm text-emerald-400 font-medium">
                        批量优惠 {getDiscountLabel()} 已生效
                      </div>
                      <div className="text-xs text-emerald-400/70">
                        购买 {cart.length} 项服务，共节省 ¥{getSavedAmount()}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 mb-6">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.type === 'video' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                          {item.type === 'video' ? <Video className="w-4 h-4 text-purple-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">{item.playerName}</div>
                          <div className="text-sm text-gray-500">{item.type === 'video' ? '视频版报告' : '文字版报告'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-medium">¥{item.price}</span>
                        <button onClick={() => removeFromCart(i)} className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">商品原价</span>
                    <span className="text-gray-400 line-through">¥{getOriginalTotalPrice()}</span>
                  </div>
                  {getSavedAmount() > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">批量优惠</span>
                      <span className="text-emerald-400">-¥{getSavedAmount()} ({getDiscountLabel()})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t border-gray-700">
                    <span className="text-white">应付金额</span>
                    <span className="text-emerald-400">¥{getTotalPrice()}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">
                    返回修改
                  </button>
                  <button className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                    确认支付 ¥{getTotalPrice()}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：购物车 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 h-fit sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">订单清单</h3>
              <span className="ml-auto px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">{cart.length}</span>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>购物车为空</p>
                <p className="text-sm mt-1">请先选择球员和服务</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-auto">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-800">
                      <span className="text-gray-400">{item.playerName}</span>
                      <span className="text-white">¥{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">商品原价</span>
                    <span className="text-gray-400">¥{getOriginalTotalPrice()}</span>
                  </div>
                  {getSavedAmount() > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">批量优惠</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> -¥{getSavedAmount()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t border-gray-800">
                    <span className="text-white">合计</span>
                    <span className="text-emerald-400">¥{getTotalPrice()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Step = ({ number, active, label }: { number: number; active: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
      active ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500'
    }`}>
      {number}
    </div>
    <span className={`text-sm ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
  </div>
);

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  price: number | string;
  features: string[];
  onSelect: () => void;
  color: string;
  recommended?: boolean;
}
const ServiceCard = ({ icon: Icon, title, price, features, onSelect, color, recommended }: ServiceCardProps) => {
  const colors: Record<string, string> = {
    blue: 'hover:border-blue-500/50 hover:shadow-blue-500/20',
    purple: 'hover:border-purple-500/50 hover:shadow-purple-500/20',
  };
  return (
    <div onClick={onSelect} className={`p-6 bg-gray-800/30 rounded-2xl border-2 border-gray-800 cursor-pointer transition-all ${colors[color]} relative`}>
      {recommended && (
        <span className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
          推荐
        </span>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color === 'purple' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
        <Icon className={`w-6 h-6 ${color === 'purple' ? 'text-purple-400' : 'text-blue-400'}`} />
      </div>
      <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
      <div className="text-2xl font-bold text-emerald-400 mb-4">¥{price}<span className="text-sm text-gray-500 font-normal">/份</span></div>
      <ul className="space-y-2 mb-6">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
            <Check className="w-4 h-4 text-emerald-500" /> {f}
          </li>
        ))}
      </ul>
      <button className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
        color === 'purple' 
          ? 'bg-purple-500 hover:bg-purple-600 text-white' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}>
        选择此服务
      </button>
    </div>
  );
};

export default BatchOrders;
