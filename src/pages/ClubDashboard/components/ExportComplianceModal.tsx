import React, { useState } from 'react';
import { X, FileText, AlertTriangle } from 'lucide-react';

export type ExportPurpose = 'internal_training' | 'parent_communication' | 'other';

interface ExportComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (purpose: ExportPurpose, note: string) => void;
  title?: string;
  clubName?: string;
}

const purposeOptions: { value: ExportPurpose; label: string }[] = [
  { value: 'internal_training', label: '内部训练分析' },
  { value: 'parent_communication', label: '家长沟通' },
  { value: 'other', label: '其他' },
];

export const ExportComplianceModal: React.FC<ExportComplianceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '数据导出合规确认',
  clubName = '本俱乐部',
}) => {
  const [purpose, setPurpose] = useState<ExportPurpose>('internal_training');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(purpose, note);
    setNote('');
    setPurpose('internal_training');
  };

  const watermarkText = `本文件由「${clubName}」于 ${new Date().toLocaleString('zh-CN')} 导出，用途：${purposeOptions.find(p => p.value === purpose)?.label}。包含未成年人个人信息，仅限内部使用，禁止向第三方泄露。`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90">
              导出的文件可能包含未成年人个人信息，受《个人信息保护法》保护。请确认用途并严格遵守数据安全规范。
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">导出用途 *</label>
            <div className="space-y-2">
              {purposeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    purpose === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-purpose"
                    value={opt.value}
                    checked={purpose === opt.value}
                    onChange={() => setPurpose(opt.value)}
                    className="w-4 h-4 text-emerald-500 bg-gray-800 border-gray-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-white">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {purpose === 'other' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">补充说明</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="请简要说明导出用途..."
                className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">CSV 首行将自动注入水印声明</div>
            <p className="text-xs text-gray-400 leading-relaxed">{watermarkText}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={purpose === 'other' && !note.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
          >
            确认导出
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportComplianceModal;
