import React from 'react';
import { Trophy, Ruler, Weight, Shirt, Footprints } from 'lucide-react';
import { PLAYING_STYLES, POSITIONS, FOOT_OPTIONS, JERSEY_COLORS } from '../../../../types/player';

interface FootballProfileFormData {
  position: string;
  secondPosition: string;
  foot: string;
  height: number;
  weight: number;
  playingStyle: string[];
  jerseyNumber: number;
  jerseyColor: string;
  currentTeam: string;
  startYear: number;
  faRegistered: boolean;
  association: string;
}

interface FootballProfileFormProps {
  isEditing: boolean;
  formData: FootballProfileFormData;
  onChange: (field: string, value: any) => void;
}

export const FootballProfileForm: React.FC<FootballProfileFormProps> = ({ isEditing, formData, onChange }) => {
  const togglePlayingStyle = (style: string) => {
    if (!isEditing) return;
    const current = formData.playingStyle || [];
    if (current.includes(style)) {
      onChange('playingStyle', current.filter((s: string) => s !== style));
    } else if (current.length < 3) {
      onChange('playingStyle', [...current, style]);
    }
  };

  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return '0.0';
    const m = formData.height / 100;
    return (formData.weight / (m * m)).toFixed(1);
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-400" />
        足球档案
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 主要位置 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">主要位置</label>
          {isEditing ? (
            <select
              value={formData.position}
              onChange={e => onChange('position', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            >
              <option value="">选择位置</option>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <p className="text-white py-3">
              {POSITIONS.find(p => p.value === formData.position)?.label || '-'}
            </p>
          )}
        </div>

        {/* 次要位置 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            次要位置 <span className="text-slate-500">(选填)</span>
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.secondPosition}
              onChange={e => onChange('secondPosition', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="如: 边锋"
            />
          ) : (
            <p className="text-white py-3">{formData.secondPosition || '-'}</p>
          )}
        </div>

        {/* 惯用脚 */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">惯用脚</label>
          {isEditing ? (
            <div className="flex gap-2">
              {FOOT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange('foot', opt.value)}
                  className={`flex-1 py-2.5 rounded-xl border transition-all ${
                    formData.foot === opt.value
                      ? 'border-emerald-500 bg-emerald-500/20 text-white'
                      : 'border-slate-600 bg-slate-700/50 text-slate-400'
                  }`}
                >
                  <Footprints className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white py-3">
              {FOOT_OPTIONS.find(f => f.value === formData.foot)?.label || '-'}
            </p>
          )}
        </div>

        {/* 身高/体重 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              <Ruler className="w-4 h-4 inline mr-1" />
              身高(cm)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.height || ''}
                onChange={e => onChange('height', Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                placeholder="165"
              />
            ) : (
              <p className="text-white py-3">{formData.height || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              <Weight className="w-4 h-4 inline mr-1" />
              体重(kg)
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.weight || ''}
                onChange={e => onChange('weight', Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                placeholder="48"
              />
            ) : (
              <p className="text-white py-3">{formData.weight || '-'}</p>
            )}
          </div>
        </div>

        {/* BMI */}
        {formData.height > 0 && formData.weight > 0 && (
          <div className="md:col-span-2 p-3 bg-slate-700/30 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">BMI 指数</span>
              <span className="text-xl font-bold text-emerald-400">{calculateBMI()}</span>
            </div>
          </div>
        )}

        {/* 当前球队 */}
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-1">当前球队/学校</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.currentTeam}
              onChange={e => onChange('currentTeam', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="如: 北京国安青训U12"
            />
          ) : (
            <p className="text-white py-3">{formData.currentTeam || '-'}</p>
          )}
        </div>

        {/* 球衣号码 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            <Shirt className="w-4 h-4 inline mr-1" />
            球衣号码
          </label>
          {isEditing ? (
            <input
              type="number"
              value={formData.jerseyNumber || ''}
              onChange={e => onChange('jerseyNumber', Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="10"
              min={1}
              max={99}
            />
          ) : (
            <p className="text-white py-3">{formData.jerseyNumber || '-'}</p>
          )}
        </div>

        {/* 球衣颜色 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">球衣颜色</label>
          {isEditing ? (
            <select
              value={formData.jerseyColor}
              onChange={e => onChange('jerseyColor', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            >
              <option value="">选择颜色</option>
              {JERSEY_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          ) : (
            <p className="text-white py-3">
              {JERSEY_COLORS.find(c => c.value === formData.jerseyColor)?.label || '-'}
            </p>
          )}
        </div>

        {/* 开始踢球年份 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">开始踢球年份</label>
          {isEditing ? (
            <input
              type="number"
              value={formData.startYear || ''}
              onChange={e => onChange('startYear', Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="2019"
              min={2000}
              max={2030}
            />
          ) : (
            <p className="text-white py-3">{formData.startYear || '-'}</p>
          )}
        </div>

        {/* 足协同注册 */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer py-3">
            <input
              type="checkbox"
              checked={formData.faRegistered}
              onChange={e => isEditing && onChange('faRegistered', e.target.checked)}
              disabled={!isEditing}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500"
            />
            <span className="text-slate-300 text-sm">已在足协同注册</span>
          </label>
        </div>

        {/* 注册协会 */}
        {formData.faRegistered && (
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">注册协会</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.association}
                onChange={e => onChange('association', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                placeholder="如: 中国足球协会"
              />
            ) : (
              <p className="text-white py-3">{formData.association || '-'}</p>
            )}
          </div>
        )}

        {/* 踢球风格 */}
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-2">
            踢球风格 <span className="text-slate-500">(最多选3个)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PLAYING_STYLES.map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => togglePlayingStyle(style.value)}
                disabled={!isEditing}
                className={`p-3 rounded-xl border text-left transition-all disabled:opacity-60 ${
                  (formData.playingStyle || []).includes(style.value)
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-slate-600 bg-slate-700/50'
                }`}
              >
                <div className={`font-medium text-sm ${
                  (formData.playingStyle || []).includes(style.value) ? 'text-white' : 'text-slate-300'
                }`}>
                  {style.label}
                </div>
                <div className="text-xs text-slate-500">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FootballProfileForm;
