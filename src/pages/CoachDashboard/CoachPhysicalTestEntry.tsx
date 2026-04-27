import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Calendar, Users, ChevronRight, Shield } from 'lucide-react';
import { teamApi } from '../../services/club';
import CoachPhysicalTests from './CoachPhysicalTests';

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  playerCount: number;
  coachCount: number;
}

interface CoachPhysicalTestEntryProps {
  onBack: () => void;
}

const CoachPhysicalTestEntry: React.FC<CoachPhysicalTestEntryProps> = ({ onBack }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await teamApi.getMyTeams();
      if (res.data?.success && res.data?.data) {
        setTeams(res.data.data);
      }
    } catch (error) {
      console.error('获取球队列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (selectedTeam) {
    return (
      <CoachPhysicalTests
        teamId={selectedTeam.id}
        teamName={selectedTeam.name}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  return (
    <div className="p-6 bg-[#0f1419] min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">体测数据</h1>
      </div>

      <p className="text-gray-400 mb-6">选择球队查看体测记录与报告</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 animate-pulse h-32" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">暂无关联球队</h3>
          <p className="text-gray-500">您当前没有管理的球队，无法查看体测数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="bg-[#1a1f2e] rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
              <p className="text-sm text-emerald-400 mb-4">{team.ageGroup}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {team.playerCount} 球员
                </span>
                <span>{team.coachCount} 教练</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachPhysicalTestEntry;
