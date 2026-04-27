import React, { useState } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { GrowthModule } from './GrowthModule';
import { MyPhysicalTests } from './MyPhysicalTests';

type GrowthSubTab = 'overview' | 'physical_tests';

const subTabs: { id: GrowthSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: '成长概览', icon: <TrendingUp size={16} /> },
  { id: 'physical_tests', label: '体测数据', icon: <Activity size={16} /> },
];

export const GrowthCenter: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<GrowthSubTab>('overview');

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
        {activeSubTab === 'overview' && <GrowthModule />}
        {activeSubTab === 'physical_tests' && <MyPhysicalTests />}
      </div>
    </div>
  );
};
