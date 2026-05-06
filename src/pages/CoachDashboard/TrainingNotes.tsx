import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Calendar, Edit2, Trash2, X, Save, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';
import { CardGridSkeleton } from '../../components/ui/loading';
import { coachApi, teamApi } from '../../services/club';

type NoteCategory = 'technical' | 'tactical' | 'physical' | 'mental';
type NotePriority = 'high' | 'medium' | 'low';

interface TrainingNote {
  id: string;
  playerName: string;
  playerId: string;
  date: string;
  title: string;
  content: string;
  category: NoteCategory;
  priority: NotePriority;
}

interface PlayerOption {
  id: string;
  name: string;
  teamName: string;
  position?: string;
}

interface TrainingNotesProps {
  onBack: () => void;
}

const priorityToRating: Record<NotePriority, number> = {
  high: 5,
  medium: 3,
  low: 1,
};

const ratingToPriority = (rating?: number): NotePriority => {
  if ((rating || 0) >= 4) return 'high';
  if ((rating || 0) >= 2) return 'medium';
  return 'low';
};

const normalizeList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  return [];
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const TrainingNotes: React.FC<TrainingNotesProps> = ({ onBack }) => {
  const [notes, setNotes] = useState<TrainingNote[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TrainingNote | null>(null);

  const [formData, setFormData] = useState<{
    playerId: string;
    title: string;
    content: string;
    category: NoteCategory;
    priority: NotePriority;
  }>({
    playerId: '',
    title: '',
    content: '',
    category: 'technical',
    priority: 'medium',
  });

  const loadPlayers = useCallback(async () => {
    const teamsRes = await teamApi.getMyTeams();
    const teams = normalizeList(teamsRes.data?.data);
    const playerGroups = await Promise.all(
      teams.map(async (team: any) => {
        const res = await teamApi.getTeamPlayers(Number(team.id));
        return normalizeList(res.data?.data).map((player: any) => ({
          id: String(player.userId || player.user_id || player.id),
          name: player.name || player.user?.name || '未命名球员',
          teamName: team.name || '未命名球队',
          position: player.position,
        }));
      })
    );

    const unique = new Map<string, PlayerOption>();
    playerGroups.flat().forEach((player) => unique.set(player.id, player));
    setPlayers(Array.from(unique.values()));
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notesRes] = await Promise.all([
        coachApi.getTrainingNotes({ page: 1, pageSize: 50 }),
        loadPlayers(),
      ]);
      const list = normalizeList(notesRes.data?.data);
      setNotes(list.map((note: any) => ({
        id: String(note.id),
        playerId: String(note.playerId || note.player_id || ''),
        playerName: note.playerName || note.player?.name || '未命名球员',
        date: formatDate(note.createdAt || note.created_at),
        title: note.title || '',
        content: note.content || '',
        category: (note.category || 'technical') as NoteCategory,
        priority: ratingToPriority(note.rating),
      })));
    } catch (err) {
      setError('训练笔记加载失败，请稍后重试');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [loadPlayers]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setFormData({ playerId: '', title: '', content: '', category: 'technical', priority: 'medium' });
  };

  const openEditModal = (note: TrainingNote) => {
    setEditingNote(note);
    setFormData({
      playerId: note.playerId,
      title: note.title,
      content: note.content,
      category: note.category,
      priority: note.priority,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.playerId || !formData.title || !formData.content) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: [formData.priority],
        rating: priorityToRating[formData.priority],
        isPublic: false,
      };

      if (editingNote) {
        await coachApi.updateTrainingNote(Number(editingNote.id), payload);
      } else {
        await coachApi.createTrainingNote({
          playerId: Number(formData.playerId),
          ...payload,
        });
      }

      closeModal();
      await loadNotes();
    } catch (err) {
      setError(editingNote ? '训练笔记更新失败' : '训练笔记创建失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('确认删除这条训练笔记？')) return;
    setError('');
    try {
      await coachApi.deleteTrainingNote(Number(noteId));
      await loadNotes();
    } catch (err) {
      setError('训练笔记删除失败');
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchSearch = n.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || n.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const getCategoryBadge = (cat: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      technical: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '技术' },
      tactical: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '战术' },
      physical: { bg: 'bg-green-500/20', text: 'text-green-400', label: '体能' },
      mental: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '心理' },
    };
    const c = map[cat] || map.technical;
    return <span className={`px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const getPriorityBadge = (prio: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高优先级' },
      medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '中优先级' },
      low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低优先级' },
    };
    const p = map[prio] || map.medium;
    return <span className={`px-2 py-1 rounded-full text-xs ${p.bg} ${p.text}`}>{p.label}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">训练笔记</h1>
              <p className="text-gray-400 mt-1">共 {notes.length} 条训练记录</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> 新建笔记
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球员姓名或笔记标题..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-[#1a1f2e] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
            <option value="all">所有分类</option>
            <option value="technical">技术</option>
            <option value="tactical">战术</option>
            <option value="physical">体能</option>
            <option value="mental">心理</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <CardGridSkeleton count={4} columns={1} />
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">暂无训练笔记</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 text-orange-400 hover:text-orange-300">创建第一条笔记</button>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">{note.playerName}</span>
                      {getCategoryBadge(note.category)}
                      {getPriorityBadge(note.priority)}
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-white">{note.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{note.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {note.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => openEditModal(note)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteNote(note.id)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editingNote ? '编辑笔记' : '新建训练笔记'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">球员 *</label>
                <select
                  value={formData.playerId}
                  disabled={Boolean(editingNote)}
                  onChange={e => setFormData({ ...formData, playerId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 disabled:opacity-60"
                >
                  <option value="">选择球员</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} · {player.teamName}{player.position ? ` · ${player.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">标题 *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="输入笔记标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">分类</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as NoteCategory })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
                    <option value="technical">技术</option>
                    <option value="tactical">战术</option>
                    <option value="physical">体能</option>
                    <option value="mental">心理</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">优先级</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as NotePriority })} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">内容 *</label>
                <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" placeholder="输入训练笔记内容..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">取消</button>
              <button onClick={handleSave} disabled={saving || !formData.playerId || !formData.title || !formData.content} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingNotes;
