import React, { useState } from 'react';
import TeamDetail from '../ClubDashboard/TeamDetail';
import PlayerDetail from '../ClubDashboard/PlayerDetail';

interface CoachTeamDetailProps {
  teamId: number;
  onBack: () => void;
}

/**
 * 教练球队详情页
 * 直接使用 ClubDashboard 的 TeamDetail 组件
 * 因为 API 已经统一 (/api/teams/:teamId/*)，支持俱乐部和教练访问
 *
 * 教练拥有球队管理权限（isAdmin=true）
 * 但教练组增删改仍仅限俱乐部管理员，避免展示后端会拒绝的入口
 */
const CoachTeamDetail: React.FC<CoachTeamDetailProps> = ({ teamId, onBack }) => {
  const [viewingPlayerId, setViewingPlayerId] = useState<number | null>(null);

  // 如果正在查看球员详情，渲染完整 PlayerDetail 页面
  if (viewingPlayerId) {
    return <PlayerDetail playerId={viewingPlayerId} onBack={() => setViewingPlayerId(null)} />;
  }

  return (
    <TeamDetail
      teamId={teamId}
      onBack={onBack}
      isAdmin={true}
      canManageCoaches={false}
      showCoachSwitchHint={false}
      onViewDetail={(id) => setViewingPlayerId(id)}
    />
  );
};

export default CoachTeamDetail;
