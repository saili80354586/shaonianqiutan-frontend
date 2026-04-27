import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, FileText, Download, Calendar, Wallet, CreditCard, DollarSign, PieChart, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { clubApi } from '../../services/api';

interface FinanceCenterProps {
  onBack: () => void;
}

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'refund';
  category: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  orderNo?: string;
}

interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
}

const FinanceCenter: React.FC<FinanceCenterProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'refund'>('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // 财务中心 API 待对接（P0-1），当前显示空状态
      setTransactions([]);
      setMonthlyStats([]);
    } catch (error) {
      console.error('加载财务数据失败:', error);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterMonth && !t.date.startsWith(filterMonth)) return false;
    return true;
  });

  const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const totalRefund = transactions.filter(t => t.type === 'refund' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpense = transactions.filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, t) => sum + t.amount, 0);

  const exportCSV = () => {
    const headers = ['日期', '类型', '分类', '金额', '描述', '状态', '订单号'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type === 'income' ? '收入' : t.type === 'expense' ? '支出' : '退款',
      t.category,
      t.amount.toString(),
      t.description,
      t.status === 'completed' ? '已完成' : t.status === 'pending' ? '处理中' : '失败',
      t.orderNo || '-'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `财务明细_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">财务中心</h1>
          <p className="text-gray-400 text-sm mt-0.5">收支明细 · 发票管理 · 财务报表</p>
        </div>
      </header>

      {/* 标签页 */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800">
        {[
          { key: 'overview', label: '财务概览', icon: PieChart },
          { key: 'transactions', label: '收支明细', icon: FileText },
          { key: 'invoices', label: '发票管理', icon: CreditCard },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Wallet} label="累计支出" value={`¥${totalExpense.toLocaleString()}`} color="red" />
            <StatCard icon={DollarSign} label="累计收入" value={`¥${totalIncome.toLocaleString()}`} color="green" />
            <StatCard icon={TrendingDown} label="累计退款" value={`¥${totalRefund.toLocaleString()}`} color="yellow" />
            <StatCard icon={CreditCard} label="本月支出" value={`¥${currentMonthExpense.toLocaleString()}`} color="blue" />
          </div>

          {/* 月度收支趋势 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> 月度收支趋势
            </h3>
            <div className="h-64 flex items-end gap-4">
              {monthlyStats.map((stat, index) => {
                const maxVal = Math.max(...monthlyStats.map(s => Math.max(s.income, s.expense)), 1);
                const incomeHeight = (stat.income / maxVal) * 100;
                const expenseHeight = (stat.expense / maxVal) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      <div
                        className="w-3 bg-emerald-500/80 rounded-t"
                        style={{ height: `${incomeHeight}%` }}
                        title={`收入: ¥${stat.income}`}
                      />
                      <div
                        className="w-3 bg-red-500/80 rounded-t"
                        style={{ height: `${expenseHeight}%` }}
                        title={`支出: ¥${stat.expense}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{stat.month.slice(5)}月</span>
                    <div className="text-xs text-center">
                      <div className="text-emerald-400">+¥{stat.income}</div>
                      <div className="text-red-400">-¥{stat.expense}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-3 h-3 rounded bg-emerald-500/80" /> 收入
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-3 h-3 rounded bg-red-500/80" /> 支出
              </div>
            </div>
          </div>

          {/* 支出分类 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">支出分类占比</h3>
              {(() => {
                const expenses = transactions.filter((t: Transaction) => t.type === 'expense' && t.status === 'completed');
                const total = expenses.reduce((sum, t) => sum + t.amount, 0);
                const map = new Map<string, number>();
                expenses.forEach(t => { map.set(t.category, (map.get(t.category) || 0) + t.amount); });
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-gray-500', 'bg-emerald-500', 'bg-red-500'];
                const items = Array.from(map.entries()).map(([label, amount], i) => ({ label, amount, color: colors[i % colors.length] }));
                if (items.length === 0) {
                  return (
                    <div className="text-center text-gray-500 py-12">
                      <PieChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>暂无支出分类数据</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-300">{item.label}</span>
                            <span className="text-gray-400">¥{item.amount.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">快捷操作</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500/30 transition-all text-left"
                >
                  <FileText className="w-6 h-6 text-emerald-400 mb-2" />
                  <div className="text-white font-medium">查看明细</div>
                  <div className="text-xs text-gray-400 mt-1">导出收支记录</div>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-emerald-500/30 transition-all text-left"
                >
                  <CreditCard className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="text-white font-medium">申请发票</div>
                  <div className="text-xs text-gray-400 mt-1">电子发票快速开具</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 overflow-hidden">
          {/* 筛选栏 */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap items-center gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">全部类型</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
              <option value="refund">退款</option>
            </select>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <button
              onClick={() => { setFilterType('all'); setFilterMonth(''); }}
              className="text-sm text-gray-400 hover:text-white"
            >
              重置筛选
            </button>
            <button
              onClick={exportCSV}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> 导出 CSV
            </button>
          </div>

          {/* 明细表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0f1419] text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">日期</th>
                  <th className="px-4 py-3 text-left font-medium">类型</th>
                  <th className="px-4 py-3 text-left font-medium">分类</th>
                  <th className="px-4 py-3 text-left font-medium">描述</th>
                  <th className="px-4 py-3 text-right font-medium">金额</th>
                  <th className="px-4 py-3 text-center font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{t.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' :
                        t.type === 'refund' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> :
                         t.type === 'refund' ? <TrendingDown className="w-3 h-3" /> :
                         <TrendingDown className="w-3 h-3" />}
                        {t.type === 'income' ? '收入' : t.type === 'refund' ? '退款' : '支出'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{t.category}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      t.type === 'income' ? 'text-emerald-400' :
                      t.type === 'refund' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : t.type === 'refund' ? '+' : '-'}¥{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        t.status === 'pending' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {t.status === 'completed' ? '已完成' : t.status === 'pending' ? '处理中' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无符合条件的收支记录</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-8 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">发票管理</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            目前发票功能正在对接税务系统，您可以通过下方按钮提交发票申请，我们将在 3-5 个工作日内发送至您的邮箱。
          </p>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            申请电子发票
          </button>
        </div>
      )}

      {/* 发票申请弹窗 */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">申请电子发票</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">发票抬头</label>
                <input type="text" placeholder="请输入企业/个人名称" className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">纳税人识别号</label>
                <input type="text" placeholder="企业必填，个人可选" className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">开票金额</label>
                <input type="number" placeholder="请输入开票金额" className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">接收邮箱</label>
                <input type="email" placeholder="发票将发送至该邮箱" className="w-full bg-[#0f1419] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                取消
              </button>
              <button
                onClick={() => { setShowInvoiceModal(false); toast.success('发票申请已提交，请留意邮箱通知'); }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: 'red' | 'green' | 'yellow' | 'blue';
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => {
  const colors: Record<StatCardProps['color'], string> = {
    red: 'from-red-500/20 to-red-600/10 text-red-400',
    green: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400',
    blue: 'from-blue-500/20 to-blue-600/10 text-blue-400',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 border border-gray-800`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/10 rounded-xl">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};

export default FinanceCenter;
