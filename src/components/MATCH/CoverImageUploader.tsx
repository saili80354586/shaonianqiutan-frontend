import React, { useState, useRef } from 'react';
import { Upload, Image, X, ExternalLink, Camera, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { matchApi } from '@/services/matchApi';

interface CoverImageUploaderProps {
  matchId: number;
  coverImage: string;
  onCoverImageChange?: (url: string) => void;
  readonly?: boolean;
}

type UploadMode = 'upload' | 'url';

export const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  matchId,
  coverImage,
  onCoverImageChange,
  readonly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload');
  const [previewUrl, setPreviewUrl] = useState(coverImage);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 更新预览
  React.useEffect(() => {
    setPreviewUrl(coverImage);
  }, [coverImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setError('');

    // 上传图片（这里需要接入实际的 OSS 上传，暂时用 URL 方式）
    // TODO: 集成阿里云 OSS 上传
    uploadToOSS(file);
  };

  const uploadToOSS = async (file: File) => {
    setLoading(true);
    try {
      // 模拟上传到 OSS
      // 实际应该调用 OSS 上传 API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 临时使用本地预览 URL
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      onCoverImageChange?.(localUrl);

      // 更新到后端
      await matchApi.updateCoverImage(matchId, localUrl);
    } catch (error) {
      console.error('上传失败:', error);
      setError('上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // 验证 URL 格式
    try {
      new URL(urlInput);
    } catch {
      setError('请输入有效的图片链接');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await matchApi.updateCoverImage(matchId, urlInput);
      setPreviewUrl(urlInput);
      onCoverImageChange?.(urlInput);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (error) {
      console.error('更新失败:', error);
      setError('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除封面图吗？')) return;

    setLoading(true);
    try {
      await matchApi.updateCoverImage(matchId, '');
      setPreviewUrl('');
      onCoverImageChange?.('');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!readonly && !previewUrl) {
    // 上传区域
    return (
      <div className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="text-red-400" size={16} />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* 上传模式选择 */}
        {!showUrlInput && (
          <div className="grid grid-cols-2 gap-3">
            {/* 本地上传 */}
            <button
              onClick={() => setUploadMode('upload')}
              className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-3 ${
                uploadMode === 'upload'
                  ? 'border-[#39ff14] bg-[#39ff14]/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#39ff14]/20 flex items-center justify-center">
                <Upload className={uploadMode === 'upload' ? 'text-[#39ff14]' : 'text-gray-500'} size={24} />
              </div>
              <div className="text-center">
                <p className={`font-medium mb-1 ${uploadMode === 'upload' ? 'text-[#39ff14]' : 'text-gray-400'}`}>
                  本地上传
                </p>
                <p className="text-xs text-gray-500">从设备选择图片</p>
              </div>
            </button>

            {/* URL 输入 */}
            <button
              onClick={() => {
                setUploadMode('url');
                setShowUrlInput(true);
              }}
              className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-3 ${
                uploadMode === 'url'
                  ? 'border-[#39ff14] bg-[#39ff14]/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#39ff14]/20 flex items-center justify-center">
                <LinkIcon className={uploadMode === 'url' ? 'text-[#39ff14]' : 'text-gray-500'} size={24} />
              </div>
              <div className="text-center">
                <p className={`font-medium mb-1 ${uploadMode === 'url' ? 'text-[#39ff14]' : 'text-gray-400'}`}>
                  链接输入
                </p>
                <p className="text-xs text-gray-500">输入图片地址</p>
              </div>
            </button>
          </div>
        )}

        {/* 本地上传区域 */}
        {uploadMode === 'upload' && !showUrlInput && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-[#39ff14] hover:bg-[#39ff14]/5 transition-all cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#39ff14]/20 to-[#22c55e]/20 flex items-center justify-center">
              <Image className="text-[#39ff14]" size={32} />
            </div>

            <p className="text-white font-medium mb-2">点击上传封面图</p>
            <p className="text-gray-500 text-sm mb-4">或拖拽图片到此处</p>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <span>支持 JPG、PNG、GIF</span>
              <span>•</span>
              <span>最大 5MB</span>
            </div>
          </div>
        )}

        {/* URL 输入表单 */}
        {showUrlInput && (
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-2">图片链接</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#39ff14] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="flex-1 py-2 bg-[#39ff14] hover:bg-[#22c55e] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '确认'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // 有封面图时的预览
  return (
    <div className="relative group">
      {/* 封面图 */}
      <div className="aspect-video rounded-lg overflow-hidden border border-gray-800 bg-[#0f1419]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="比赛封面"
            className="w-full h-full object-cover"
            onError={() => {
              setError('图片加载失败');
              setPreviewUrl('');
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="text-gray-600" size={48} />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!readonly && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {previewUrl && (
            <>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-black/80 backdrop-blur rounded-lg text-white hover:text-[#39ff14] transition-colors"
                title="查看原图"
              >
                <ExternalLink size={18} />
              </a>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 bg-black/80 backdrop-blur rounded-lg text-white hover:text-red-400 transition-colors"
                title="删除封面"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
      )}

      {/* 加载遮罩 */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="w-8 h-8 border-2 border-[#39ff14] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 只读提示 */}
      {readonly && !previewUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1419]/80">
          <p className="text-gray-500 text-sm">暂无封面图</p>
        </div>
      )}
    </div>
  );
};

export default CoverImageUploader;
