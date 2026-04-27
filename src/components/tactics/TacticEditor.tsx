import React, { useState, useRef } from 'react';
import { X, Save, Camera, RotateCcw } from 'lucide-react';
import { TacticBoard } from './TacticBoard';
import type { MatchFormat, PlayerPosition } from './TacticBoard';
import type { BallPosition, DrawnLine } from './TacticBoard';

export interface TacticScenario {
  index: number;
  title: string;
  description: string;
  question: string;
  format: MatchFormat;
  positions: PlayerPosition[];
  /** 足球位置 */
  ball?: BallPosition;
  /** 标记线条 */
  lines?: DrawnLine[];
  imageUrl?: string;
}

interface TacticEditorProps {
  scenario: TacticScenario;
  onSave: (scenario: TacticScenario) => void;
  onCancel: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export const TacticEditor: React.FC<TacticEditorProps> = ({
  scenario,
  onSave,
  onCancel,
  onDelete,
  readOnly = false,
}) => {
  const [title, setTitle] = useState(scenario.title);
  const [description, setDescription] = useState(scenario.description);
  const [question, setQuestion] = useState(scenario.question);
  const [players, setPlayers] = useState<PlayerPosition[]>(scenario.positions);
  const [ball, setBall] = useState<BallPosition>(scenario.ball || { x: 50, y: 50 });
  const [lines, setLines] = useState<DrawnLine[]>(scenario.lines || []);
  const [saving, setSaving] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    setSaving(true);

    const updatedScenario: TacticScenario = {
      ...scenario,
      title: title.trim(),
      description: description.trim(),
      question: question.trim(),
      positions: players,
      ball,
      lines,
    };

    onSave(updatedScenario);
    setSaving(false);
  };

  const handleDelete = () => {
    if (readOnly) return;
    if (confirm(`确定要删除"${title}"这个情景吗？`)) {
      onDelete?.();
    }
  };

  const handleReset = () => {
    if (readOnly) return;
    if (confirm('确定要重置战术板吗？所有球员将被清空。')) {
      setPlayers([]);
    }
  };

  // 导出战术图占位符（实际实现在 T5 任务中）
  const handleExportImage = () => {
    alert('战术图导出功能将在 T5 任务中实现（html2canvas）');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl
        w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {readOnly ? '查看战术情景' : '编辑战术情景'}
            </h2>
            {scenario.index > 0 && (
              <p className="text-sm text-gray-400">情景 #{scenario.index}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2
                      bg-red-500/10 text-red-400 hover:bg-red-500/20
                      rounded-lg transition-colors"
                  >
                    <X size={16} />
                    删除
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2
                    bg-gray-700 text-white hover:bg-gray-600
                    rounded-lg transition-colors"
                >
                  <RotateCcw size={16} />
                  重置
                </button>
              </>
            )}

            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex flex-col lg:flex-row max-h-[calc(95vh-140px)] overflow-hidden">
          {/* 左侧：战术板 */}
          <div className="flex-1 p-6 overflow-auto">
            <div ref={boardRef}>
              <TacticBoard
                format={scenario.format}
                players={players}
                onPlayersChange={setPlayers}
                readOnly={readOnly}
                showControls={!readOnly}
                ball={ball}
                onBallChange={setBall}
                lines={lines}
                onLinesChange={setLines}
              />
            </div>

            {/* 战术图导出按钮 */}
            {!readOnly && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleExportImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500
                    text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Camera size={16} />
                  导出战术图
                </button>
              </div>
            )}
          </div>

          {/* 右侧：表单 */}
          <div className="w-full lg:w-96 p-6 border-l border-gray-800 overflow-auto">
            <div className="space-y-6">
              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  情景标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={readOnly}
                  placeholder="例如：第15分钟 - 进球瞬间"
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700
                    rounded-lg text-white placeholder-gray-500
                    focus:border-[#39ff14] focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  情景描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={readOnly}
                  rows={6}
                  placeholder="描述这个战术情景的背景和细节..."
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700
                    rounded-lg text-white placeholder-gray-500 resize-none
                    focus:border-[#39ff14] focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* 球员疑问（球员自评时填写） */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  球员疑问
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={readOnly}
                  rows={4}
                  placeholder="你对这个战术情景有什么疑问或想向教练请教的问题..."
                  className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700
                    rounded-lg text-white placeholder-gray-500 resize-none
                    focus:border-[#39ff14] focus:outline-none
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* 战术图预览（如果已生成） */}
              {scenario.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    战术图预览
                  </label>
                  <img
                    src={scenario.imageUrl}
                    alt="战术图"
                    className="w-full rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        {!readOnly && (
          <div className="flex items-center justify-end gap-3 px-6 py-4
            border-t border-gray-800"
          >
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-700 text-white
                rounded-lg hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-[#39ff14] text-black
                font-medium rounded-lg hover:bg-[#22c55e]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30
                    border-t-black rounded-full animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticEditor;
