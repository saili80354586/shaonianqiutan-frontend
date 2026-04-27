import React from 'react';
import { User, Ruler, Weight, Footprints, Calendar, Building2, Users, Trophy, MapPin, GraduationCap } from 'lucide-react';

type Theme = 'classic' | 'cyberpunk';
type Gender = 'male' | 'female';
type Foot = 'left' | 'right' | 'both';

interface FamilyInfo {
  fatherHeight?: number;
  motherHeight?: number;
  fatherOccupation?: string;
  motherOccupation?: string;
  fatherAthlete?: boolean;
  motherAthlete?: boolean;
}

interface FootballProfileProps {
  name?: string;
  nickname?: string;
  birthDate?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  dominantFoot?: Foot;
  position?: string;
  secondPosition?: string;
  startYear?: number;
  team?: string;
  school?: string;
  province?: string;
  city?: string;
  faRegistered?: boolean;
  association?: string;
  jerseyNumber?: number;
  jerseyColor?: string;
  family?: FamilyInfo;
  theme: Theme;
  embedded?: boolean;
}

const positionMap: Record<string, string> = {
  'ST': '前锋', 'CF': '中锋', 'LW': '左边锋', 'RW': '右边锋',
  'CAM': '攻击型中场', 'CM': '中场', 'CDM': '防守型中场',
  'LM': '左边前卫', 'RM': '右边前卫',
  'LB': '左边后卫', 'RB': '右边后卫', 'CB': '中后卫',
  'GK': '门将'
};

const footMap: Record<Foot, string> = {
  'left': '左脚',
  'right': '右脚',
  'both': '双脚'
};

const genderMap: Record<Gender, string> = {
  'male': '男',
  'female': '女'
};

const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || 
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const calculatePlayingYears = (startYear?: number): number => {
  if (!startYear) return 0;
  return new Date().getFullYear() - startYear;
};

const FootballProfile: React.FC<FootballProfileProps> = (props) => {
  const {
    name, nickname, birthDate, gender, height, weight, dominantFoot,
    position, secondPosition, startYear, team, school, province, city,
    faRegistered, association, jerseyNumber, jerseyColor, family, theme,
    embedded
  } = props;
  
  const isCyberpunk = theme === 'cyberpunk';
  const age = calculateAge(birthDate);
  const playingYears = calculatePlayingYears(startYear);

  const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | boolean; suffix?: string; highlight?: boolean }> = 
    ({ icon, label, value, suffix, highlight }) => {
    if (value === undefined || value === null || value === '') return null;
    
    return (
      <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
        isCyberpunk 
          ? 'bg-[rgba(10,14,23,0.5)] border border-white/5 hover:border-[rgba(57,255,20,0.3)]' 
          : 'bg-[rgba(10,14,23,0.3)] border border-white/5 hover:border-accent/30'
      }`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          highlight ? 'bg-accent/20' : 'bg-white/5'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text-muted mb-0.5">{label}</div>
          <div className={`font-medium truncate ${highlight ? 'text-accent' : 'text-white'}`}>
            {typeof value === 'boolean' ? (value ? '是' : '否') : value}
            {suffix && <span className="text-text-muted ml-0.5">{suffix}</span>}
          </div>
        </div>
      </div>
    );
  };

  const content = (
    <>
      {/* 基础信息 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          基础信息
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoItem 
            icon={<Calendar className="w-4 h-4 text-blue-400" />}
            label="年龄"
            value={age > 0 ? age : undefined}
            suffix="岁"
            highlight
          />
          <InfoItem 
            icon={<User className="w-4 h-4 text-purple-400" />}
            label="性别"
            value={gender ? genderMap[gender] : undefined}
          />
          <InfoItem 
            icon={<Ruler className="w-4 h-4 text-emerald-400" />}
            label="身高"
            value={height}
            suffix="cm"
          />
          <InfoItem 
            icon={<Weight className="w-4 h-4 text-orange-400" />}
            label="体重"
            value={weight}
            suffix="kg"
          />
          <InfoItem 
            icon={<Footprints className="w-4 h-4 text-cyan-400" />}
            label="惯用脚"
            value={dominantFoot ? footMap[dominantFoot] : undefined}
            highlight
          />
          <InfoItem 
            icon={<MapPin className="w-4 h-4 text-red-400" />}
            label="所在地区"
            value={province && city ? `${province} ${city}` : province || city}
          />
        </div>
      </div>

      {/* 踢球信息 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          踢球信息
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoItem 
            icon={<Trophy className="w-4 h-4 text-yellow-400" />}
            label="主打位置"
            value={position ? positionMap[position] || position : undefined}
            highlight
          />
          <InfoItem 
            icon={<Trophy className="w-4 h-4 text-yellow-400/60" />}
            label="次要位置"
            value={secondPosition ? positionMap[secondPosition] || secondPosition : undefined}
          />
          <InfoItem 
            icon={<Calendar className="w-4 h-4 text-indigo-400" />}
            label="球龄"
            value={playingYears > 0 ? playingYears : undefined}
            suffix="年"
            highlight
          />
          <InfoItem 
            icon={<Building2 className="w-4 h-4 text-pink-400" />}
            label="当前球队"
            value={team}
            highlight
          />
          <InfoItem 
            icon={<GraduationCap className="w-4 h-4 text-teal-400" />}
            label="学校/机构"
            value={school}
          />
          <InfoItem 
            icon={<div className={`w-4 h-4 rounded-full ${faRegistered ? 'bg-emerald-400' : 'bg-gray-400'}`} />}
            label="足协注册"
            value={faRegistered !== undefined ? (faRegistered ? '已注册' : '未注册') : undefined}
          />
          {association && (
            <InfoItem 
              icon={<Users className="w-4 h-4 text-amber-400" />}
              label="所属足协"
              value={association}
            />
          )}
          {jerseyNumber && (
            <InfoItem 
              icon={<div className="w-4 h-4 rounded text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">{jerseyNumber}</div>}
              label="球衣号码"
              value={`#${jerseyNumber}`}
              highlight
            />
          )}
        </div>
      </div>

      {/* 家庭背景 */}
      {family && (family.fatherHeight || family.motherHeight) && (
        <div>
          <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            家庭背景
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {family.fatherHeight && (
              <InfoItem 
                icon={<User className="w-4 h-4 text-blue-400" />}
                label="父亲身高"
                value={family.fatherHeight}
                suffix="cm"
              />
            )}
            {family.motherHeight && (
              <InfoItem 
                icon={<User className="w-4 h-4 text-pink-400" />}
                label="母亲身高"
                value={family.motherHeight}
                suffix="cm"
              />
            )}
            {family.fatherAthlete !== undefined && (
              <InfoItem 
                icon={<Trophy className="w-4 h-4 text-amber-400" />}
                label="父亲运动背景"
                value={family.fatherAthlete}
              />
            )}
            {family.motherAthlete !== undefined && (
              <InfoItem 
                icon={<Trophy className="w-4 h-4 text-amber-400" />}
                label="母亲运动背景"
                value={family.motherAthlete}
              />
            )}
          </div>
          
          {/* 遗传身高预测 */}
          {family.fatherHeight && family.motherHeight && height && (
            <div className={`mt-4 p-4 rounded-xl ${
              isCyberpunk 
                ? 'bg-gradient-to-r from-[rgba(57,255,20,0.1)] to-transparent border border-[rgba(57,255,20,0.2)]' 
                : 'bg-gradient-to-r from-accent/10 to-transparent border border-accent/20'
            }`}>
              <div className="text-sm text-text-muted mb-2">遗传身高预测</div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs text-text-secondary">预测成年身高</span>
                  <div className="text-xl font-bold text-accent">
                    {gender === 'male' 
                      ? Math.round((family.fatherHeight + family.motherHeight + 13) / 2)
                      : Math.round((family.fatherHeight + family.motherHeight - 13) / 2)}
                    <span className="text-sm text-text-muted ml-1">cm</span>
                  </div>
                </div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(100, (height / 190) * 100)}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-secondary">当前</span>
                  <div className="font-medium text-white">{height}cm</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className={`rounded-2xl p-6 mb-8 backdrop-blur-md transition-all duration-500 card-hover ${
      isCyberpunk
        ? 'bg-[rgba(26,31,46,0.3)] border border-[rgba(57,255,20,0.25)] shadow-[0_0_20px_rgba(57,255,20,0.05)]'
        : 'bg-gradient-to-br from-[rgba(30,35,48,0.95)] to-[rgba(22,28,40,0.95)] border border-white/8'
    }`}>
      <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
        <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <User className="w-4 h-4 text-accent" />
        </span>
        足球档案
      </h3>
      {content}
    </div>
  );
};

export default FootballProfile;
