import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../services/api';
import { Image, Plus, Trash2, Edit2, Loader2, CheckCircle, Eye, EyeOff, GripVertical } from 'lucide-react';
import AdminConfirmDialog from './components/AdminConfirmDialog';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  position: string;
  sort_order: number;
  enabled: boolean;
  start_at: string;
  end_at: string;
  click_count: number;
}

const Banners: React.FC = () => {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', image_url: '', link_url: '', position: 'home', sort_order: 0, enabled: true, start_at: '', end_at: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const fetchItems = async () => {
    try {
      const res = await adminApi.getBanners();
      if (res.data?.success) setItems(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', image_url: '', link_url: '', position: 'home', sort_order: 0, enabled: true, start_at: '', end_at: '' });
    setShowModal(true);
  };

  const openEdit = (item: Banner) => {
    setEditing(item);
    setForm({
      title: item.title,
      image_url: item.image_url,
      link_url: item.link_url,
      position: item.position,
      sort_order: item.sort_order,
      enabled: item.enabled,
      start_at: item.start_at ? item.start_at.slice(0, 16) : '',
      end_at: item.end_at ? item.end_at.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.image_url.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateBanner(editing.id, form);
      } else {
        await adminApi.createBanner(form);
      }
      setShowModal(false);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteBanner(deleteTarget.id);
      toast.success('轮播图已删除');
      setDeleteTarget(null);
      fetchItems();
    } catch (e) { console.error(e); toast.error('删除轮播图失败'); }
  };

  const toggleEnable = async (item: Banner) => {
    try {
      await adminApi.updateBanner(item.id, { ...item, enabled: !item.enabled });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Image className="w-5 h-5 text-emerald-400" /> 轮播图管理</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
          <Plus className="w-4 h-4" /> 添加轮播图
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-3 text-center text-slate-500 py-12 bg-white/[0.03] border border-white/[0.06] rounded-xl">暂无轮播图</div>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden group">
            <div className="relative aspect-[16/9] bg-[#0a0d12]">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600"><Image className="w-8 h-8" /></div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => openEdit(item)} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(item)} className="p-2 bg-white/10 rounded-lg text-white hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              {!item.enabled && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-slate-400 text-sm">已禁用</span></div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                <button onClick={() => toggleEnable(item)} className={`text-xs flex items-center gap-1 ${item.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {item.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {item.enabled ? '启用' : '禁用'}
                </button>
              </div>
              <p className="text-slate-400 text-xs truncate mb-2">{item.link_url || '无跳转链接'}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>位置: {item.position}</span>
                <span>点击: {item.click_count || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1419] border border-white/[0.08] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{editing ? '编辑轮播图' : '添加轮播图'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">标题</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="轮播图标题" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">图片URL</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">跳转链接</label>
                <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">位置</label>
                  <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                    <option value="home">首页</option>
                    <option value="player">球员端</option>
                    <option value="scout">球探端</option>
                    <option value="club">俱乐部端</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">排序</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded border-white/[0.2] bg-white/[0.03]" />
                  启用
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-white/[0.04] text-sm">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} 保存
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除轮播图"
        description={`确定删除「${deleteTarget?.title || ''}」吗？删除后前台将不再展示该轮播图。`}
        confirmText="删除"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Banners;
