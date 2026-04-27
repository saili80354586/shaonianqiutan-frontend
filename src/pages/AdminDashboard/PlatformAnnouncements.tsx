import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Megaphone, Plus, Trash2, Edit2, Loader2, CheckCircle, XCircle, Pin } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_public: boolean;
  start_at: string;
  end_at: string;
  view_count: number;
  created_at: string;
}

const PlatformAnnouncements: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', type: 'system', is_pinned: false, is_public: true, start_at: '', end_at: '' });
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await adminApi.getPlatformAnnouncements();
      if (res.data?.success) setItems(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', type: 'system', is_pinned: false, is_public: true, start_at: '', end_at: '' });
    setShowModal(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      is_pinned: item.is_pinned,
      is_public: item.is_public,
      start_at: item.start_at ? item.start_at.slice(0, 16) : '',
      end_at: item.end_at ? item.end_at.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updatePlatformAnnouncement(editing.id, form);
      } else {
        await adminApi.createPlatformAnnouncement(form);
      }
      setShowModal(false);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该公告？')) return;
    try {
      await adminApi.deletePlatformAnnouncement(id);
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const togglePin = async (item: Announcement) => {
    try {
      await adminApi.updatePlatformAnnouncement(item.id, { ...item, is_pinned: !item.is_pinned });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-emerald-400" /> 平台公告</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
          <Plus className="w-4 h-4" /> 发布公告
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3">标题</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">类型</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">置顶</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">可见</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">浏览</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">有效期</th>
              <th className="text-right text-slate-400 font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-12">暂无公告</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{item.title}</td>
                <td className="px-4 py-3 text-slate-300">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${item.type === 'urgent' ? 'bg-red-500/20 text-red-400' : item.type === 'activity' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.type === 'urgent' ? '紧急' : item.type === 'activity' ? '活动' : '系统'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePin(item)} className={`transition-colors ${item.is_pinned ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Pin className={`w-4 h-4 ${item.is_pinned ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-300">{item.is_public ? '公开' : '内部'}</td>
                <td className="px-4 py-3 text-slate-300">{item.view_count || 0}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {item.start_at ? new Date(item.start_at).toLocaleDateString() : '-'} ~ {item.end_at ? new Date(item.end_at).toLocaleDateString() : '永久'}
                </td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1419] border border-white/[0.08] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">{editing ? '编辑公告' : '发布公告'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">标题</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="公告标题" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">内容</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="公告内容..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                    <option value="system">系统</option>
                    <option value="activity">活动</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">开始时间</label>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">结束时间</label>
                  <input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="rounded border-white/[0.2] bg-white/[0.03]" />
                    置顶
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="rounded border-white/[0.2] bg-white/[0.03]" />
                    公开
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:bg-white/[0.04] text-sm">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} 发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAnnouncements;
