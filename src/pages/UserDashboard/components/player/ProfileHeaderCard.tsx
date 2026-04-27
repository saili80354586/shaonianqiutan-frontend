import React from 'react';
import { User, Camera, Check } from 'lucide-react';
import { PLAYING_STYLES } from '../../../../types/player';

interface ProfileHeaderCardProps {
  profile: any;
  isEditing: boolean;
  completeness: number;
  onAvatarChange?: (file: File) => void;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile, isEditing, completeness, onAvatarChange }) => {
  const handleAvatarClick = () => {
    if (!isEditing || !onAvatarChange) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onAvatarChange(file);
    };
    input.click();
  };

  const getPlayingStyleLabels = () => {
    return (profile?.playingStyle || []).map((style: string) => {
      const info = PLAYING_STYLES.find(s => s.value === style);
      return info?.label || style;
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-start gap-6">
        {/* 头像 */}
        <div
          onClick={handleAvatarClick}
          className={`relative ${isEditing ? 'cursor-pointer' : ''}`}
        >
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-500" />
            )}
          </div>
          {isEditing && (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-800">
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* 基本信息 */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">
            {profile?.nickname || profile?.realName || '未设置昵称'}
          </h2>
          <p className="text-slate-400 mb-2">
            {profile?.realName && profile?.nickname !== profile?.realName
              ? `${profile.realName} · ${profile?.age || 0}岁`
              : `${profile?.age || 0}岁`}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile?.position && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                {profile.position}
              </span>
            )}
            {getPlayingStyleLabels().map((label: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">资料完善度</span>
          <span className="text-emerald-400">{completeness}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
