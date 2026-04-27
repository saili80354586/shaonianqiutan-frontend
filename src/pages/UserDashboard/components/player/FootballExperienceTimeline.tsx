import React from 'react';
import { Calendar, Plus, Trash2, Trophy } from 'lucide-react';
import { type ExperienceItem } from '../../../../types/player';

interface TimelineData {
  experiences: ExperienceItem[];
}

interface Props {
  isEditing: boolean;
  formData: TimelineData;
  onChange: (field: string, value: any) => void;
}

export const FootballExperienceTimeline: React.FC<Props> = ({ isEditing, formData, onChange }) => {
  const addExperience = () => {
    const newExp: ExperienceItem = { period: '', team: '', position: '', achievement: '' };
    onChange('experiences', [...(formData.experiences || []), newExp]);
  };

  const updateExp = (index: number, field: keyof ExperienceItem, value: string) => {
    const updated = (formData.experiences || []).map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    );
    onChange('experiences', updated);
  };

  const removeExp = (index: number) => {
    onChange('experiences', (formData.experiences || []).filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          足球经历
        </h3>
        {isEditing && (
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            添加经历
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(formData.experiences || []).map((exp, index) => (
          <div key={index} className="relative pl-6 pb-4 border-l-2 border-slate-700 last:border-l-0 last:pb-0">
            {/* 时间线节点 */}
            <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] rounded-full bg-amber-500 border-2 border-slate-800" />
            
            <div className="bg-slate-700/30 rounded-xl p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">时间段</label>
                      <input
                        type="text"
                        value={exp.period}
                        onChange={e => updateExp(index, 'period', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="2022-2024"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">球队/学校</label>
                      <input
                        type="text"
                        value={exp.team}
                        onChange={e => updateExp(index, 'team', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="北京国安青训"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">担任位置</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={e => updateExp(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="球员/队长"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">主要成绩 <span className="text-slate-500">(选填)</span></label>
                      <input
                        type="text"
                        value={exp.achievement || ''}
                        onChange={e => updateExp(index, 'achievement', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                        placeholder="市级冠军"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeExp(index)}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除此条
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{exp.team || '未填写球队'}</p>
                    <p className="text-slate-400 text-sm">{exp.period} · {exp.position || '未填写位置'}</p>
                    {exp.achievement && (
                      <p className="text-amber-400 text-sm mt-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {exp.achievement}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 空状态 */}
        {(formData.experiences || []).length === 0 && (
          <div className="text-center py-8 text-slate-500">
            {isEditing ? (
              <p>点击上方"添加经历"按钮添加足球经历</p>
            ) : (
              <p>暂无足球经历记录</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FootballExperienceTimeline;
