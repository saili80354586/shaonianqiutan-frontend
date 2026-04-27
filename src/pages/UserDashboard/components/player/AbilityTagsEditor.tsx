import React from 'react';
import { Check, Zap, Brain } from 'lucide-react';
import { TECHNICAL_TAGS, MENTAL_TAGS } from '../../../../types/player';

interface TagsData {
  technicalTags: string[];
  mentalTags: string[];
}

interface Props {
  isEditing: boolean;
  formData: TagsData;
  onChange: (field: string, value: any) => void;
}

export const AbilityTagsEditor: React.FC<Props> = ({ isEditing, formData, onChange }) => {
  const toggleTag = (tag: string, field: 'technicalTags' | 'mentalTags') => {
    if (!isEditing) return;
    const current = formData[field] || [];
    onChange(field, current.includes(tag) ? current.filter((t: string) => t !== tag) : [...current, tag]);
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">能力标签</h3>

      {/* 技术特点 */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          技术特点 <span className="text-slate-500">(多选)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TECHNICAL_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag, 'technicalTags')}
              disabled={!isEditing}
              className={`px-4 py-2 rounded-full border transition-all disabled:opacity-60 ${
                formData.technicalTags?.includes(tag)
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              {formData.technicalTags?.includes(tag) && (
                <Check className="w-3 h-3 inline mr-1" />
              )}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 心智性格 */}
      <div>
        <label className="block text-sm text-slate-400 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          心智性格 <span className="text-slate-500">(多选)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MENTAL_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag, 'mentalTags')}
              disabled={!isEditing}
              className={`px-4 py-2 rounded-full border transition-all disabled:opacity-60 ${
                formData.mentalTags?.includes(tag)
                  ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                  : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              {formData.mentalTags?.includes(tag) && (
                <Check className="w-3 h-3 inline mr-1" />
              )}
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-xl">
        <p className="text-xs text-slate-500">
          💡 技术特点展示球员在场上的技术能力，心智性格展示球员的心理素质。真实、准确的标签有助于球探和教练更准确地评估球员。
        </p>
      </div>
    </div>
  );
};

export default AbilityTagsEditor;
