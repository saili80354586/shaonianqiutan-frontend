import React, { useState, useEffect, useRef } from 'react';
import { clubApi, uploadApi } from '../../services/api';
import { Building2, Save, X, Camera, CheckCircle, Loader2 } from 'lucide-react';

interface ClubProfileSettingsProps {
  onBack: () => void;
}

interface ClubFormData {
  name: string;
  logo: string;
  description: string;
  address: string;
  contactName: string;
  contactPhone: string;
}

const ClubProfileSettings: React.FC<ClubProfileSettingsProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    logo: '',
    description: '',
    address: '',
    contactName: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await clubApi.getProfile();
      if (res.data?.success && res.data?.data) {
        const pdata = res.data.data;
        setFormData({
          name: pdata.name || '',
          logo: pdata.logo || '',
          description: pdata.description || '',
          address: pdata.address || '',
          contactName: pdata.contactName || '',
          contactPhone: pdata.contactPhone || '',
        });
      }
    } catch (err) {
      setError('加载资料失败');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await clubApi.updateProfile(formData);
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.data?.message || '保存失败');
      }
    } catch (err) {
      setError((err as Error).message || '保存失败');
    }
    setSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('图片不能超过2MB');
      return;
    }

    setUploadingLogo(true);
    setError('');
    setSuccess(false);
    try {
      const res = await uploadApi.uploadAvatar(file);
      if (res.data?.success && res.data.data?.avatar) {
        setFormData(prev => ({ ...prev, logo: res.data.data.avatar }));
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.data?.message || res.data?.error?.message || '上传失败');
      }
    } catch (err) {
      setError((err as Error).message || '上传失败');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* 头部 */}
      <header className="bg-[#1a1f2e] border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">编辑俱乐部资料</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      {/* 成功提示 */}
      {success && (
        <div className="mx-6 mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">资料更新成功</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* 表单 */}
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">俱乐部标志</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                {formData.logo ? (
                  <img src={formData.logo} alt="logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploadingLogo ? '上传中...' : '上传图片'}
                </button>
                <p className="text-xs text-gray-500 mt-1">建议尺寸 200x200，最大2MB，上传后点击保存生效</p>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">基本信息</h3>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">俱乐部名称</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="请输入俱乐部名称"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">俱乐部简介</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                placeholder="请输入俱乐部简介"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">地址</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="请输入详细地址"
              />
            </div>
          </div>

          {/* 联系方式 */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">联系方式</h3>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">联系人</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="请输入联系人姓名"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">联系电话</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="请输入联系电话"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClubProfileSettings;
