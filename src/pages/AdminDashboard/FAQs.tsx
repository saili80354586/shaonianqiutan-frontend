import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../services/api';
import { HelpCircle, Plus, Trash2, Edit2, Loader2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AdminConfirmDialog from './components/AdminConfirmDialog';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  view_count: number;
  is_hot: boolean;
  created_at: string;
}

const FAQs: React.FC = () => {
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', sort_order: 0, is_hot: false });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  const fetchItems = async () => {
    try {
      const res = await adminApi.getFAQs();
      if (res.data?.success) setItems(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: '', answer: '', category: 'general', sort_order: 0, is_hot: false });
    setShowModal(true);
  };

  const openEdit = (item: FAQ) => {
    setEditing(item);
    setForm({ question: item.question, answer: item.answer, category: item.category, sort_order: item.sort_order, is_hot: item.is_hot });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await adminApi.updateFAQ(editing.id, form);
      } else {
        await adminApi.createFAQ(form);
      }
      setShowModal(false);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteFAQ(deleteTarget.id);
      toast.success('FAQ 已删除');
      setDeleteTarget(null);
      fetchItems();
    } catch (e) { console.error(e); toast.error('删除 FAQ 失败'); }
  };

  const categories: Record<string, string> = { general: '通用', player: '球员', parent: '家长', analyst: '分析师', club: '俱乐部', payment: '支付' };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><HelpCircle className="w-5 h-5 text-emerald-400" /> FAQ管理</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
          <Plus className="w-4 h-4" /> 添加FAQ
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center text-slate-500 py-12 bg-white/[0.03] border border-white/[0.06] rounded-xl">暂无FAQ</div>
        )}
        {items.map((item) => (
          <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_hot ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {item.is_hot ? '热门' : categories[item.category] || item.category}
                </span>
                <span className="text-white text-sm font-medium">{item.question}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">{item.view_count || 0} 次浏览</span>
                {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === item.id && (
              <div className="px-4 pb-4 border-t border-white/[0.04]">
                <p className="text-slate-300 text-sm mt-3 leading-relaxed">{item.answer}</p>
                <div className="flex gap-2 mt-3 justify-end">
                  <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1"><Edit2 className="w-3 h-3" /> 编辑</button>
                  <button onClick={() => setDeleteTarget(item)} className="text-slate-400 hover:text-red-400 transition-colors text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> 删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1419] border border-white/[0.08] rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-white mb-4">{editing ? '编辑FAQ' : '添加FAQ'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">问题</label>
                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="输入问题" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">回答</label>
                <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="输入回答..." rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">分类</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                    {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">排序</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.is_hot} onChange={(e) => setForm({ ...form, is_hot: e.target.checked })} className="rounded border-white/[0.2] bg-white/[0.03]" />
                标记为热门
              </label>
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
        title="删除 FAQ"
        description={`确定删除「${deleteTarget?.question || ''}」吗？前台帮助中心将不再展示该内容。`}
        confirmText="删除"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FAQs;
