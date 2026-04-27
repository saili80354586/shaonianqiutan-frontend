import React, { useState } from 'react';
import { Briefcase, FileText, Award, ArrowLeft, ArrowRight, CheckCircle2, Plus, X, Upload } from 'lucide-react';

interface Step4AnalystSpecificProps {
  onSubmit: (data: AnalystSpecificData) => void;
  onBack: () => void;
  defaultValues?: Partial<AnalystSpecificData>;
}

export interface AnalystSpecificData {
  profession: string;
  experience: string;
  isProPlayer: boolean;
  hasCase: boolean;
  caseDetail?: string;
  certificates: CertificateItem[];
  contactPhone: string;
  contactEmail: string;
}

interface CertificateItem {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  image?: string;
}

const professions = [
  { value: 'scout', label: '职业球探' },
  { value: 'coach', label: '职业教练' },
  { value: 'player', label: '职业/退役球员' },
  { value: 'journalist', label: '足球记者/评论员' },
  { value: 'data', label: '数据分析师' },
  { value: 'other', label: '其他' },
];

const Step4AnalystSpecific: React.FC<Step4AnalystSpecificProps> = ({ onSubmit, onBack, defaultValues }) => {
  const [formData, setFormData] = useState<AnalystSpecificData>({
    profession: defaultValues?.profession || '',
    experience: defaultValues?.experience || '',
    isProPlayer: defaultValues?.isProPlayer || false,
    hasCase: defaultValues?.hasCase || false,
    caseDetail: defaultValues?.caseDetail || '',
    certificates: defaultValues?.certificates || [],
    contactPhone: defaultValues?.contactPhone || '',
    contactEmail: defaultValues?.contactEmail || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AnalystSpecificData, string>>>({});
  const [showCertForm, setShowCertForm] = useState(false);
  const [newCert, setNewCert] = useState<Partial<CertificateItem>>({});

  const handleChange = (field: keyof AnalystSpecificData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addCertificate = () => {
    if (newCert.name) {
      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, { ...newCert, id: Date.now().toString() } as CertificateItem],
      }));
      setNewCert({});
      setShowCertForm(false);
    }
  };

  const removeCertificate = (id: string) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter(c => c.id !== id),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AnalystSpecificData, string>> = {};

    if (!formData.profession) {
      newErrors.profession = '请选择职业背景';
    }
    if (!formData.experience) {
      newErrors.experience = '请填写从业经验';
    }
    if (!formData.contactPhone) {
      newErrors.contactPhone = '请填写联系电话';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">专业资质</h2>
        <p className="text-blue-200/60">填写您的专业背景和从业经历</p>
      </div>

      {/* 职业背景 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          职业背景 <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.profession}
          onChange={(e) => handleChange('profession', e.target.value)}
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all appearance-none ${
            errors.profession ? 'border-red-500/50' : 'border-white/10'
          }`}
        >
          <option value="" className="bg-slate-800">请选择职业背景</option>
          {professions.map(p => (
            <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
          ))}
        </select>
        {errors.profession && <p className="mt-1 text-red-400 text-xs">{errors.profession}</p>}
      </div>

      {/* 从业经验 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          从业经验 <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.experience}
          onChange={(e) => handleChange('experience', e.target.value)}
          placeholder="请简述您的足球分析/球探工作经历，包括曾任职的机构、参与的项目等"
          rows={4}
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none ${
            errors.experience ? 'border-red-500/50' : 'border-white/10'
          }`}
        />
        {errors.experience && <p className="mt-1 text-red-400 text-xs">{errors.experience}</p>}
      </div>

      {/* 职业球员背景 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          是否有职业球员背景
        </label>
        <div className="flex gap-3">
          {[
            { value: true, label: '是' },
            { value: false, label: '否' },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleChange('isProPlayer', option.value)}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                formData.isProPlayer === option.value
                  ? 'border-blue-500 bg-blue-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分析案例 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          是否有分析案例
        </label>
        <div className="flex gap-3 mb-3">
          {[
            { value: true, label: '有' },
            { value: false, label: '无' },
          ].map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleChange('hasCase', option.value)}
              className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                formData.hasCase === option.value
                  ? 'border-blue-500 bg-blue-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-blue-200/60 hover:border-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {formData.hasCase && (
          <textarea
            value={formData.caseDetail || ''}
            onChange={(e) => handleChange('caseDetail', e.target.value)}
            placeholder="请描述您最满意的一个分析案例"
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none"
          />
        )}
      </div>

      {/* 资质证书 */}
      <div>
        <label className="block text-blue-200/80 font-medium mb-2 text-sm">
          相关证书 <span className="text-blue-400">（选填）</span>
        </label>
        
        {formData.certificates.length > 0 && (
          <div className="space-y-2 mb-3">
            {formData.certificates.map((cert) => (
              <div key={cert.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{cert.name}</div>
                    {cert.issuer && <div className="text-blue-200/60 text-xs">{cert.issuer}</div>}
                  </div>
                </div>
                <button
                  onClick={() => removeCertificate(cert.id)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCertForm ? (
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <input
              type="text"
              placeholder="证书名称，如：A级教练证"
              value={newCert.name || ''}
              onChange={(e) => setNewCert(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <input
              type="text"
              placeholder="颁发机构（选填）"
              value={newCert.issuer || ''}
              onChange={(e) => setNewCert(prev => ({ ...prev, issuer: e.target.value }))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={addCertificate}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认添加
              </button>
              <button
                onClick={() => { setShowCertForm(false); setNewCert({}); }}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCertForm(true)}
            className="w-full py-3 border border-dashed border-white/20 rounded-xl text-blue-200/60 hover:text-blue-200 hover:border-white/40 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加证书
          </button>
        )}
      </div>

      {/* 联系方式 */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-blue-200/80 font-medium mb-2 text-sm">
            联系电话 <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="用于工作联系"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all ${
              errors.contactPhone ? 'border-red-500/50' : 'border-white/10'
            }`}
          />
          {errors.contactPhone && <p className="mt-1 text-red-400 text-xs">{errors.contactPhone}</p>}
        </div>
        <div>
          <label className="block text-blue-200/80 font-medium mb-2 text-sm">
            联系邮箱 <span className="text-blue-400">（选填）</span>
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="用于接收平台通知"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-amber-500/10 border border-amber-400/20 rounded-xl">
        <p className="text-sm text-amber-200/80">
          <span className="font-medium">⚠️ 提示：</span>
          提交后您的资料将进入审核流程，审核通过后方可开始接单。请确保填写的信息真实有效。
        </p>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          提交审核
        </button>
      </div>
    </div>
  );
};

export default Step4AnalystSpecific;
