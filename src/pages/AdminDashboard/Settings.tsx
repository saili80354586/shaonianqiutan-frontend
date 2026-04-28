import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Globe, DollarSign } from 'lucide-react';
import { adminApi } from '../../services/api';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange, danger }) => (
  <div className="flex items-center justify-between py-4 border-t border-white/[0.06]">
    <div>
      <h4 className="text-sm font-medium text-white">{label}</h4>
      <p className="text-sm text-slate-400 mt-0.5">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full ${
        danger
          ? 'bg-slate-700 peer-checked:bg-red-500'
          : 'bg-slate-700 peer-checked:bg-emerald-500'
      }`} />
    </label>
  </div>
);

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    siteName: '少年球探',
    allowRegistration: true,
    requireApproval: true,
    defaultAnalystPrice: 299,
    commissionRate: 20,
    maintenanceMode: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await adminApi.getSettings();
        if (res.data?.success && res.data?.data) {
          setSettings({
            siteName: res.data.data.siteName ?? '少年球探',
            allowRegistration: Boolean(res.data.data.allowRegistration),
            requireApproval: Boolean(res.data.data.requireApproval),
            defaultAnalystPrice: Number(res.data.data.defaultAnalystPrice ?? 299),
            commissionRate: Number(res.data.data.commissionRate ?? 20),
            maintenanceMode: Boolean(res.data.data.maintenanceMode),
          });
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || '系统设置加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await adminApi.updateSettings(settings);
      if (res.data?.success) {
        toast.success('设置已保存');
      } else {
        setError(res.data?.error?.message || '保存失败');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">系统设置加载中...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5 text-slate-400" /> 系统设置
      </h2>

      <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}
        {/* 网站名称 */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-400" /> 网站名称
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* 默认分析师价格 */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-slate-400" /> 默认分析师价格（元）
          </label>
          <input
            type="number"
            value={settings.defaultAnalystPrice}
            onChange={(e) => setSettings({ ...settings, defaultAnalystPrice: Number(e.target.value) })}
            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* 平台佣金比例 */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-slate-400" /> 平台佣金比例（%）
          </label>
          <input
            type="number"
            value={settings.commissionRate}
            onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* 开关项 */}
        <ToggleRow
          label="开放注册"
          description="允许新用户注册账号"
          checked={settings.allowRegistration}
          onChange={(v) => setSettings({ ...settings, allowRegistration: v })}
        />
        <ToggleRow
          label="分析师申请审核"
          description="新分析师申请需要管理员审核"
          checked={settings.requireApproval}
          onChange={(v) => setSettings({ ...settings, requireApproval: v })}
        />
        <ToggleRow
          label="维护模式"
          description="启用后只有管理员可以访问网站"
          checked={settings.maintenanceMode}
          onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
          danger
        />

        {/* 保存按钮 */}
        <div className="pt-6 border-t border-white/[0.06]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
