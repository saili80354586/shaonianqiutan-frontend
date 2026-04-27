import React from 'react';
import { Users, User, Ruler, Briefcase, Award } from 'lucide-react';

interface FamilyData {
  fatherHeight: number;
  fatherPhone: string;
  fatherJob: string;
  fatherAthlete: boolean;
  motherHeight: number;
  motherPhone: string;
  motherJob: string;
  motherAthlete: boolean;
}

interface Props {
  isEditing: boolean;
  formData: FamilyData;
  onChange: (field: string, value: any) => void;
}

export const FamilyBackgroundForm: React.FC<Props> = ({ isEditing, formData, onChange }) => {
  const mask = (v?: string) => v ? v.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-400" />
        家庭背景
      </h3>

      <div className="space-y-4">
        {/* 父亲信息 */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            父亲
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                <Ruler className="w-3 h-3 inline mr-1" /> 身高(cm)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.fatherHeight || ''}
                  onChange={e => onChange('fatherHeight', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="175"
                />
              ) : (
                <p className="text-white py-2">{formData.fatherHeight ? `${formData.fatherHeight} cm` : '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                <Briefcase className="w-3 h-3 inline mr-1" /> 职业
              </label>
              {isEditing ? (
                <select
                  value={formData.fatherJob}
                  onChange={e => onChange('fatherJob', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="">选择职业</option>
                  <option value="教师">教师</option>
                  <option value="医生">医生</option>
                  <option value="工程师">工程师</option>
                  <option value="律师">律师</option>
                  <option value="会计">会计</option>
                  <option value="公务员">公务员</option>
                  <option value="企业管理者">企业管理者</option>
                  <option value="自由职业">自由职业</option>
                  <option value="运动员">运动员</option>
                  <option value="教练">教练</option>
                  <option value="其他">其他</option>
                </select>
              ) : (
                <p className="text-white py-2">{formData.fatherJob || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">联系电话</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.fatherPhone}
                  onChange={e => onChange('fatherPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="138****"
                />
              ) : (
                <p className="text-white py-2">{mask(formData.fatherPhone) || '-'}</p>
              )}
            </div>
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={formData.fatherAthlete}
                onChange={e => onChange('fatherAthlete', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500"
              />
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Award className="w-3 h-3" />
                运动员经历
              </span>
            </div>
          </div>
        </div>

        {/* 母亲信息 */}
        <div className="p-4 bg-slate-700/30 rounded-xl">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            母亲
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                <Ruler className="w-3 h-3 inline mr-1" /> 身高(cm)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.motherHeight || ''}
                  onChange={e => onChange('motherHeight', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="165"
                />
              ) : (
                <p className="text-white py-2">{formData.motherHeight ? `${formData.motherHeight} cm` : '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                <Briefcase className="w-3 h-3 inline mr-1" /> 职业
              </label>
              {isEditing ? (
                <select
                  value={formData.motherJob}
                  onChange={e => onChange('motherJob', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="">选择职业</option>
                  <option value="教师">教师</option>
                  <option value="医生">医生</option>
                  <option value="工程师">工程师</option>
                  <option value="律师">律师</option>
                  <option value="会计">会计</option>
                  <option value="公务员">公务员</option>
                  <option value="企业管理者">企业管理者</option>
                  <option value="自由职业">自由职业</option>
                  <option value="运动员">运动员</option>
                  <option value="教练">教练</option>
                  <option value="其他">其他</option>
                </select>
              ) : (
                <p className="text-white py-2">{formData.motherJob || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">联系电话</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.motherPhone}
                  onChange={e => onChange('motherPhone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                  placeholder="138****"
                />
              ) : (
                <p className="text-white py-2">{mask(formData.motherPhone) || '-'}</p>
              )}
            </div>
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={formData.motherAthlete}
                onChange={e => onChange('motherAthlete', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500"
              />
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Award className="w-3 h-3" />
                运动员经历
              </span>
            </div>
          </div>
        </div>

        {/* 提示 */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300">
            💡 父母身高和运动经历可为球员潜力评估提供遗传参考。所有信息仅用于科学选材，不会公开显示。
          </p>
        </div>
      </div>
    </div>
  );
};

export default FamilyBackgroundForm;
