import React, { useState } from 'react';
import { ShoppingCart, FileText, Upload } from 'lucide-react';
import { OrdersModule } from './OrdersModule';
import { ReportsModule } from './ReportsModule';
import { UploadModule } from './UploadModule';

type OrderSubTab = 'orders' | 'reports' | 'upload';

const subTabs: { id: OrderSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: '我的订单', icon: <ShoppingCart size={16} /> },
  { id: 'reports', label: '我的报告', icon: <FileText size={16} /> },
  { id: 'upload', label: '视频上传', icon: <Upload size={16} /> },
];

export const OrderCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<OrderSubTab>('orders');

  return (
    <div className="space-y-6">
      {/* 子导航 */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-2">
        <div className="flex flex-wrap gap-1">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#39ff14]/10 text-[#39ff14]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 子内容 */}
      <div className="animate-fadeIn">
        {activeSubTab === 'orders' && <OrdersModule />}
        {activeSubTab === 'reports' && <ReportsModule />}
        {activeSubTab === 'upload' && <UploadModule />}
      </div>
    </div>
  );
};
