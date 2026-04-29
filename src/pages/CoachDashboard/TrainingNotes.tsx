import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Calendar, Edit2, Trash2, ChevronRight, Clock, CheckCircle, AlertCircle, X, Save } from 'lucide-react';
import { CardGridSkeleton } from '../../components/ui/loading';

interface TrainingNote {
  id: string;
  playerName: string;
  playerId: string;
  date: string;
  title: string;
  content: string;
  category: 'technical' | 'tactical' | 'physical' | 'mental';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

interface TrainingNotesProps {
  onBack: () => void;
}

const createTrainingNoteId = () => Date.now().toString();

const TrainingNotes: React.FC<TrainingNotesProps> = ({ onBack }) => {
  const [notes, setNotes] = useState<TrainingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TrainingNote | null>(null);

  const [formData, setFormData] = useState<{
    playerName: string;
    title: string;
    content: string;
    category: TrainingNote['category'];
    priority: TrainingNote['priority'];
  }>({
    playerName: '',
    title: '',
    content: '',
    category: 'technical',
    priority: 'medium',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setNotes([
      { id: '1', playerName: '李明', playerId: '1', date: '2025-03-20', title: '射门技术改进', content: '左脚射门力量不足，需要加强左脚训练。建议在下次训练中增加左脚射门练习20分钟。', category: 'technical', priority: 'high', completed: false },
      { id: '2', playerName: '王强', playerId: '2', date: '2025-03-18', title: '体能恢复计划', content: '最近比赛密集，需要调整训练强度。建议本周减少高强度对抗，增加恢复性训练。', category: 'physical', priority: 'medium', completed: true },
      { id: '3', playerName: '张浩', playerId: '3', date: '2025-03-15', title: '防守站位指导', content: '一对一防守时站位过于激进，容易被过。需要练习保持适当距离，延缓对方进攻。', category: 'tactical', priority: 'high', completed: false },
      { id: '4', playerName: '李明', playerId: '1', date: '2025-03-10', title: '心理状态关注', content: '最近比赛压力较大，表现出焦虑情绪。建议进行心理辅导，帮助他建立自信。', category: 'mental', priority: 'medium', completed: false },
    ]);
    setLoading(false);
  };

  const handleSave = () => {
    if (!formData.playerName || !formData.title) return;
    
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...n, ...formData } : n));
    } else {
      const newNote: TrainingNote = {
        id: createTrainingNoteId(),
        ...formData,
        playerId: 'new',
        date: new Date().toISOString().split('T')[0],
        completed: false,
      };
      setNotes([newNote, ...notes]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setFormData({ playerName: '', title: '', content: '', category: 'technical', priority: 'medium' });
  };

  const toggleComplete = (noteId: string) => {
    setNotes(notes.map(n => n.id === noteId ? { ...n, completed: !n.completed } : n));
  };

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
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
    const c = map[cat];
    return <span className={`px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const getPriorityBadge = (prio: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高优先级' },
      medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '中优先级' },
      low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低优先级' },
    };
    const p = map[prio];
    return <span className={`px-2 py-1 rounded-full text-xs ${p.bg} ${p.text}`}>{p.label}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="p-8">
        {/* 头部 */}
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

        {/* 筛选栏 */}
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

        {/* 笔记列表 */}
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
              <div key={note.id} className={`bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 transition-all ${note.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-white">{note.playerName}</span>
                      {getCategoryBadge(note.category)}
                      {getPriorityBadge(note.priority)}
                      {note.completed && <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">已完成</span>}
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${note.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{note.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{note.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {note.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => toggleComplete(note.id)} className={`p-2 rounded-lg transition-colors ${note.completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400 hover:text-green-400'}`}>
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setEditingNote(note); setFormData({ playerName: note.playerName, title: note.title, content: note.content, category: note.category, priority: note.priority }); setShowAddModal(true); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-colors">
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

      {/* 添加/编辑弹窗 */}
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
                <label className="block text-sm text-gray-400 mb-2">球员姓名 *</label>
                <input type="text" value={formData.playerName} onChange={e => setFormData({...formData, playerName: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="输入球员姓名" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">标题 *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500" placeholder="输入笔记标题" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">分类</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
                    <option value="technical">技术</option>
                    <option value="tactical">战术</option>
                    <option value="physical">体能</option>
                    <option value="mental">心理</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">优先级</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500">
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">内容</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={4} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none" placeholder="输入训练笔记内容..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors">取消</button>
              <button onClick={handleSave} disabled={!formData.playerName || !formData.title} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ClipboardList icon component
const ClipboardList = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

export default TrainingNotes;
