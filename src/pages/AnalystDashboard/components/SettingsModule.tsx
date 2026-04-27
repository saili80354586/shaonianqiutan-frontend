import React, { useState } from 'react';
import { Bell, Lock, User, CreditCard, Moon, Globe, Shield, Mail } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const [notifications, setNotifications] = useState({
    newOrders: true,
    reportCompleted: true,
    systemUpdates: false,
    marketingEmails: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Notifications */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">通知设置</h3>
            <p className="text-gray-400 text-sm">管理您接收的通知类型</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'newOrders', label: '新订单通知', desc: '当有新订单分配给时通知我' },
            { key: 'reportCompleted', label: '报告完成通知', desc: '当我的报告被用户下载或评分时通知我' },
            { key: 'systemUpdates', label: '系统更新', desc: '接收平台功能更新和系统维护通知' },
            { key: 'marketingEmails', label: '营销邮件', desc: '接收推广活动和优惠信息' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={() => handleNotificationChange(item.key as keyof typeof notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39ff14]"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">偏好设置</h3>
            <p className="text-gray-400 text-sm">自定义您的工作环境</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">深色模式</p>
                <p className="text-gray-500 text-sm">切换深色/浅色主题</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.darkMode}
                onChange={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#39ff14]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">语言</p>
                <p className="text-gray-500 text-sm">选择界面语言</p>
              </div>
            </div>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#39ff14]"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">时区</p>
                <p className="text-gray-500 text-sm">设置您的本地时区</p>
              </div>
            </div>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#39ff14]"
            >
              <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
              <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
              <option value="America/New_York">纽约时间 (UTC-5)</option>
              <option value="Europe/London">伦敦时间 (UTC+0)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
