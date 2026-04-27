import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Shield, Plus, Trash2, Edit2, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SensitiveWord {
  id: number;
  word: string;
  category: string;
  level: number;
  enabled: boolean;
  created_at: string;
}

const levelMap: Record<number, { label: string; color: string }> = {
  1: { label: '警告', color: 'bg-amber-500/20 text-amber-400' },
  2: { label: '拦截', color: 'bg-orange-500/20 text-orange-400' },
  3: { label: '封禁', color: 'bg-red-500/20 text-red-400' },
};

const SensitiveWords: React.FC = () => {
  const [words, setWords] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
  const [form, setForm] = useState({ word: '', category: '', level: 1, enabled: true });
  const [saving, setSaving] = useState(false);

  const fetchWords = async () => {
    try {
      const res = await adminApi.getSensitiveWords();
      if (res.data?.success) setWords(res.data.data?.list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWords(); }, []);

  const openCreate = () => {
    setEditingWord(null);
    setForm({ word: '', category: '', level: 1, enabled: true });
    setShowModal(true);
  };

  const openEdit = (w: SensitiveWord) => {
    setEditingWord(w);
    setForm({ word: w.word, category: w.category, level: w.level, enabled: w.enabled });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.word.trim()) return;
    setSaving(true);
    try {
      if (editingWord) {
        await adminApi.updateSensitiveWord(editingWord.id, form);
      } else {
        await adminApi.createSensitiveWord(form);
      }
      setShowModal(false);
      fetchWords();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该敏感词？')) return;
    try {
      await adminApi.deleteSensitiveWord(id);
      fetchWords();
    } catch (e) { console.error(e); }
  };

  const toggleEnable = async (w: SensitiveWord) => {
    try {
      await adminApi.updateSensitiveWord(w.id, { ...w, enabled: !w.enabled });
      fetchWords();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" /> 敏感词配置</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm">
          <Plus className="w-4 h-4" /> 添加敏感词
        </button>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-slate-400 font-medium px-4 py-3">敏感词</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">分类</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">级别</th>
              <th className="text-left text-slate-400 font-medium px-4 py-3">状态</th>
              <th className="text-right text-slate-400 font-medium px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {words.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-12">暂无敏感词配置</td></tr>
            )}
            {words.map((w) => (
              <tr key={w.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{w.word}</td>
                <td className="px-4 py-3 text-slate-300">{w.category || '通用'}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${levelMap[w.level]?.color || 'bg-slate-500/20 text-slate-400'}`}>{levelMap[w.level]?.label || w.level}</span></td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleEnable(w)} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${w.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {w.enabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {w.enabled ? '启用' : '禁用'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  <button onClick={() => openEdit(w)} className="text-slate-400 hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(w.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1419] border border-white/[0.08] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">{editingWord ? '编辑敏感词' : '添加敏感词'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">敏感词</label>
                <input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="输入敏感词" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">分类</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50" placeholder="如：政治、广告、辱骂" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">级别</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                  <option value={1}>警告 - 提示用户</option>
                  <option value={2}>拦截 - 阻止发布</option>
                  <option value={3}>封禁 - 触发风控</option>
                </select>
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
    </div>
  );
};

export default SensitiveWords;
