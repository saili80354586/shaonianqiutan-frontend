import React, { useState } from 'react';
import { Layout, ChevronDown, ChevronUp, MessageSquare, Reply } from 'lucide-react';
import { TacticBoard } from './TacticBoard';
import type { PlayerPosition, MatchFormat } from './TacticBoard';

export interface TacticScenarioViewProps {
  /** 战术情景数据 */
  scenario: {
    title?: string;
    description?: string;
    playerQuestion?: string;
    players?: PlayerPosition[];
    matchFormat?: MatchFormat;
    imageUrl?: string; // 生成的战术图 URL
  };
  /** 球员姓名 */
  playerName?: string;
  /** 教练回复内容 */
  coachReply?: string;
  /** 是否隐藏回复按钮（只读展示） */
  coachReplyReadOnly?: boolean;
  /** 教练回复回调 */
  onCoachReply?: (reply: string) => void;
  /** 是否只读 */
  readOnly?: boolean;
}

/**
 * 教练视角的战术情景展示组件
 * 用于在 CoachReviewPanel 中显示球员提交的战术图
 */
export const TacticScenarioView: React.FC<TacticScenarioViewProps> = ({
  scenario,
  playerName,
  coachReply,
  onCoachReply,
  readOnly = true,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [replyText, setReplyText] = useState(coachReply || '');
  const [replying, setReplying] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;

    setReplying(true);
    // 模拟异步提交
    setTimeout(() => {
      onCoachReply?.(replyText.trim());
      setShowReplyForm(false);
      setReplying(false);
    }, 300);
  };

  return (
    <div className="bg-[#0f1419] border border-gray-800 rounded-lg overflow-hidden">
      {/* 标题栏 - 可折叠 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#1a1f2e]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Layout className="text-[#39ff14]" size={18} />
          <span className="text-white font-medium">
            {scenario.title || '战术示意图'}
          </span>
          {playerName && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              {playerName} 提交
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="text-gray-500" size={20} />
        ) : (
          <ChevronDown className="text-gray-500" size={20} />
        )}
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 描述文本 */}
          {(scenario.description || scenario.playerQuestion) && (
            <div className="space-y-2">
              {scenario.description && (
                <p className="text-gray-400 text-sm">{scenario.description}</p>
              )}
              {scenario.playerQuestion && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
                  <MessageSquare size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-blue-400 mb-1">球员疑问</p>
                    <p className="text-sm text-gray-300">{scenario.playerQuestion}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 战术图展示 */}
          {scenario.players && scenario.players.length > 0 ? (
            <TacticBoard
              format={scenario.matchFormat || '11人制'}
              players={scenario.players}
              onPlayersChange={() => {}}
              readOnly
              showControls={false}
            />
          ) : scenario.imageUrl ? (
            <img
              src={scenario.imageUrl}
              alt="战术图"
              className="w-full max-h-[300px] object-contain rounded-lg"
            />
          ) : (
            <div className="aspect-[8/5] bg-[#1a1f2e] rounded-lg flex items-center justify-center">
              <p className="text-gray-600 text-sm">暂无战术图</p>
            </div>
          )}

          {/* 教练回复区域 */}
          {!readOnly && (
            <div className="border-t border-gray-800 pt-4">
              {coachReply ? (
                /* 已回复 */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#39ff14] font-medium flex items-center gap-2">
                      <Reply size={14} />
                      教练回复
                    </p>
                    {!showReplyForm && (
                      <button
                        onClick={() => setShowReplyForm(true)}
                        className="text-xs text-gray-500 hover:text-[#39ff14] transition-colors"
                      >
                        修改回复
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 pl-5">{coachReply}</p>

                  {/* 回复编辑表单 */}
                  {showReplyForm && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="输入您的回复..."
                        rows={3}
                        className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg
                          text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReplySubmit}
                          disabled={replying || !replyText.trim()}
                          className="px-3 py-1.5 bg-[#39ff14] text-black text-sm font-medium
                            rounded hover:bg-[#22c55e] transition-colors disabled:opacity-50"
                        >
                          {replying ? '提交中...' : '更新回复'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyText(coachReply || '');
                          }}
                          className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 未回复 */
                <div className="space-y-2">
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#39ff14] transition-colors"
                  >
                    <Reply size={16} />
                    回复此战术图
                  </button>

                  {showReplyForm && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="对球员的战术分析进行点评或回答疑问..."
                        rows={3}
                        className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg
                          text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReplySubmit}
                          disabled={replying || !replyText.trim()}
                          className="px-3 py-1.5 bg-[#39ff14] text-black text-sm font-medium
                            rounded hover:bg-[#22c55e] transition-colors disabled:opacity-50"
                        >
                          {replying ? '提交中...' : '提交回复'}
                        </button>
                        <button
                          onClick={() => setShowReplyForm(false)}
                          className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 只读模式下的回复展示 */}
          {readOnly && coachReply && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-sm text-[#39ff14] font-medium mb-2 flex items-center gap-2">
                <Reply size={14} />
                教练回复
              </p>
              <p className="text-sm text-gray-300 pl-5">{coachReply}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 多个战术情景的列表展示
 */
interface TacticScenarioListViewProps {
  scenarios: Array<{
    title?: string;
    description?: string;
    playerQuestion?: string;
    players?: PlayerPosition[];
    matchFormat?: MatchFormat;
    imageUrl?: string;
  }>;
  /** 球员名（用于区分不同球员的提交） */
  playerName?: string;
  /** 已有回复 */
  replies?: Record<number, string>;
  /** 回复回调 */
  onReply?: (index: number, reply: string) => void;
  /** 是否只读 */
  readOnly?: boolean;
}

export const TacticScenarioListView: React.FC<TacticScenarioListViewProps> = ({
  scenarios = [],
  playerName,
  replies = {},
  onReply,
  readOnly = false,
}) => {
  if (scenarios.length === 0) {
    return (
      <div className="bg-[#0f1419] border border-dashed border-gray-800 rounded-lg p-6 text-center">
        <Layout className="mx-auto text-gray-600 mb-2" size={32} />
        <p className="text-gray-500 text-sm">暂无战术图</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenarios.map((scenario, index) => (
        <TacticScenarioView
          key={index}
          scenario={scenario}
          playerName={playerName}
          coachReply={replies[index]}
          coachReplyReadOnly={!readOnly}
          onCoachReply={(reply) => onReply?.(index, reply)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default TacticScenarioView;
