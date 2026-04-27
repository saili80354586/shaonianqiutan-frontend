import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { TacticBoard } from '@/components/tactics/TacticBoard';
import type { TacticScenario, MatchFormat, PlayerPosition } from '@/components/tactics';
import type { BallPosition, DrawnLine } from '@/components/tactics';

const STORAGE_KEY_RESULT = 'tactic_edit_result';

export const TacticEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 初始状态
  const [initialized, setInitialized] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [scenarioIndex, setScenarioIndex] = useState<number | undefined>();

  // 编辑器状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [question, setQuestion] = useState('');
  const [format, setFormat] = useState<MatchFormat>('11人制');
  const [players, setPlayers] = useState<PlayerPosition[]>([]);
  const [ball, setBall] = useState<BallPosition>({ x: 50, y: 50 });
  const [lines, setLines] = useState<DrawnLine[]>([]);
  const [saving, setSaving] = useState(false);

  // ========== 初始化 ==========
  useEffect(() => {
    // 从 URL params 获取模式
    const urlMode = searchParams.get('mode') as 'create' | 'edit' | null;
    const urlIndex = searchParams.get('index');

    setMode(urlMode === 'edit' ? 'edit' : 'create');
    if (urlIndex) setScenarioIndex(parseInt(urlIndex));

    // 尝试从 sessionStorage 获取已有数据（编辑模式）
    const raw = sessionStorage.getItem('tactic_edit_data');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.scenario) {
          setTitle(data.scenario.title || '');
          setDescription(data.scenario.description || '');
          setQuestion(data.scenario.question || '');
          setFormat(data.scenario.format || '11人制');
          setPlayers(data.scenario.positions || []);
          if (data.scenario.ball) setBall(data.scenario.ball);
          if (data.scenario.lines) setLines(data.scenario.lines);
        }
        if (data.mode) setMode(data.mode);
        if (data.scenarioIndex !== undefined) setScenarioIndex(data.scenarioIndex);
        sessionStorage.removeItem('tactic_edit_data');
      } catch { /* ignore */ }
    }

    // 始终标记为已初始化，不再强制重定向
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== 保存并返回 ==========
  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入情景标题');
      return;
    }

    setSaving(true);

    const result: TacticScenario = {
      index: scenarioIndex ?? 0,
      title: title.trim(),
      description: description.trim(),
      question: question.trim(),
      format,
      positions: players,
      ball,
      lines,
    };

    // 写入结果到 sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify({
        action: 'save',
        scenario: result,
        scenarioIndex: scenarioIndex ?? null,
      }));
    } catch { /* ignore */ }

    setTimeout(() => {
      window.location.href = '/match-self-review';
    }, 100);
  };

  // ========== 取消返回（不保存） ==========
  const handleCancel = () => {
    window.location.href = '/match-self-review';
  };

  // ========== 重置战术板 ==========
  const handleReset = () => {
    if (confirm('确定要重置战术板吗？所有球员、标记线将被清空。')) {
      setPlayers([]);
      setLines([]);
      setBall({ x: 50, y: 50 });
    }
  };

  // 未初始化完成前显示加载
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  const isEditing = mode === 'edit';

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      {/* ═══ 顶部导航栏 ═══ */}
      <header className="sticky top-0 z-40 bg-[#0f1419]/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">
                {isEditing ? '编辑战术情景' : '添加战术情景'}
              </h1>
              <p className="text-xs text-gray-500">{isEditing ? `情景 #${scenarioIndex}` : '新情景'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 text-white hover:bg-gray-600 rounded-lg transition-colors text-sm">
                <RotateCcw size={16} /> 重置
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !title.trim()} className="flex items-center gap-2 px-5 py-2 bg-[#39ff14] text-black font-medium rounded-lg hover:bg-[#22c55e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> 保存中...</>
              ) : (
                <><Save size={16} /> 保存并返回</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ 主内容区 ═══ */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full">
          <div className="flex flex-col lg:flex-row h-full">
            {/* 左侧：战术板画布 */}
            <div className="flex-1 p-4 lg:p-8 overflow-auto min-h-[50vh] lg:min-h-0">
              <TacticBoard
                format={format}
                players={players}
                onPlayersChange={setPlayers}
                showControls={!isEditing}
                readOnly={isEditing}
                ball={ball}
                onBallChange={setBall}
                lines={lines}
                onLinesChange={setLines}
              />
            </div>

            {/* 右侧：表单面板 */}
            <aside className="w-full lg:w-96 xl:w-[420px] bg-[#111827] border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto p-5 lg:p-6 space-y-6">
              {/* 标题 */}
              <fieldset>
                <label className="block text-sm font-semibold text-gray-300 mb-2">情景标题 <span className="text-red-400">*</span></label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={isEditing}
                  placeholder="例如：第15分钟 · 进球瞬间"
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-gray-700 rounded-xl text-white placeholder-gray-500 text-base focus:border-[#39ff14] focus:ring-2 focus:ring-[#39ff14]/20 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </fieldset>

              {/* 描述 */}
              <fieldset>
                <label className="block text-sm font-semibold text-gray-300 mb-2">情景描述</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={isEditing}
                  rows={5} placeholder="描述这个战术情景的背景、球员跑位、配合细节等..."
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:border-[#39ff14] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
              </fieldset>

              {/* 疑问 */}
              <fieldset>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                  球员疑问
                </label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)} disabled={isEditing}
                  rows={4} placeholder="你对这个战术有什么想问教练的？教练会在点评时回复你..."
                  className="w-full px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-xl text-white placeholder-gray-500 resize-none focus:border-amber-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
                <p className="text-xs text-amber-400/40 mt-1.5">教练可在比赛点评中查看并回复</p>
              </fieldset>

              {/* 布阵统计 */}
              <div className="bg-[#0a0e17] rounded-xl p-4 border border-gray-800">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">当前布阵</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{players.filter(p => p.type === 'our').length}</p>
                    <p className="text-xs text-emerald-400/60 mt-0.5">我方球员</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-400">{players.filter(p => p.type === 'opp').length}</p>
                    <p className="text-xs text-red-400/60 mt-0.5">对方球员</p>
                  </div>
                </div>
              </div>

              {/* 操作提示 */}
              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
                <p className="text-xs text-blue-400/70 leading-relaxed">💡 拖拽球员调整位置 · 点击编号可修改球衣号 · 点击 × 可删除球员</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TacticEditPage;
