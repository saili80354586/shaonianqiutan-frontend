import React from 'react';
import { NotificationCenter } from '../components/social';
import { Bell } from 'lucide-react';

const Notifications: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e14] to-[#111820] pt-20 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center">
            <Bell size={20} className="text-[#39ff14]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">通知中心</h1>
            <p className="text-xs text-slate-500">查看和管理你的所有通知</p>
          </div>
        </div>

        <NotificationCenter />
      </div>
    </div>
  );
};

export default Notifications;
