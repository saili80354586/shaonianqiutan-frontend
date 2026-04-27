import React, { useEffect, useState } from 'react';
import { clubApi } from '../../services/api';
import { toast } from 'sonner';
import { ChevronLeft, Bell, Plus, Pin, Trash2, Edit2, X, Loader2 } from 'lucide-react';

interface ClubAnnouncementsProps {
  onBack: () => void;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

const ClubAnnouncements: React.FC<ClubAnnouncementsProps> = ({ onBack }) => {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPinned: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getAnnouncements();
      const data = (res.data?.data || res.data) as Announcement[];
      if (Array.isArray(data)) {
        // 置顶在前，按时间倒序
        setList(
          data.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
        );
      }
    } catch (err) {
      console.error('加载公告失败:', err);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', isPinned: false });
    setModalOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, isPinned: item.isPinned });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await clubApi.updateAnnouncement(editing.id, {
          title: form.title.trim(),
          content: form.content.trim(),
          isPinned: form.isPinned,
        });
      } else {
        await clubApi.createAnnouncement({
          title: form.title.trim(),
          content: form.content.trim(),
          isPinned: form.isPinned,
        });
      }
      setModalOpen(false);
      await loadList();
      toast.success(editing ? '更新成功' : '发布成功');
    } catch (err) {
      console.error('保存公告失败:', err);
      toast.error('保存失败，请重试');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该公告？')) return;
    try {
      await clubApi.deleteAnnouncement(id);
      await loadList();
      toast.success('删除成功');
    } catch (err) {
      console.error('删除公告失败:', err);
      toast.error('删除失败');
    }
  };

  const togglePin = async (item: Announcement) => {
    try {
      await clubApi.updateAnnouncement(item.id, {
        title: item.title,
        content: item.content,
        isPinned: !item.isPinned,
      });
      await loadList();
      toast.success(item.isPinned ? '已取消置顶' : '置顶成功');
    } catch (err) {
      console.error('更新置顶状态失败:', err);
      toast.error('操作失败');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">俱乐部公告管理</h1>
              <p className="text-sm text-gray-400">发布、编辑和置顶俱乐部公告</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 发布公告
          </button>
        </div>

        {/* 列表 */}
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl overflow-hidden">
          {loading && list.length === 0 && (
            <div className="px-4 py-16 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              加载中...
            </div>
          )}
          {!loading && list.length === 0 && (
            <div className="px-4 py-16 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无公告</p>
              <p className="text-sm mt-1">点击右上角发布公告</p>
            </div>
          )}
          <div className="divide-y divide-gray-800">
            {list.map((item) => (
              <div key={item.id} className="p-5 hover:bg-gray-900/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{item.title}</span>
                      {item.isPinned && (
                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] flex items-center gap-1">
                          <Pin className="w-3 h-3" /> 置顶
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{item.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePin(item)}
                      className={`p-2 rounded-lg transition-colors ${item.isPinned ? 'text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                      title={item.isPinned ? '取消置顶' : '置顶'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{editing ? '编辑公告' : '发布公告'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">标题</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="输入公告标题"
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">内容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="输入公告内容"
                  rows={5}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500 rounded border-gray-600 bg-[#0f1419]"
                />
                置顶公告
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? '保存' : '发布'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubAnnouncements;
