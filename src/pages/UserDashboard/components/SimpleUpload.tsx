import React, { useState, useRef } from 'react';
import { Upload, FileVideo, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export const SimpleUpload: React.FC = () => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [completedUploads, setCompletedUploads] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // 模拟上传进度
    newUploadingFiles.forEach((uploadingFile) => {
      simulateUpload(uploadingFile);
    });
  };

  const simulateUpload = (uploadingFile: UploadingFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // 上传完成
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, progress: 100, status: 'completed' }
              : f
          )
        );
        
        // 移到已完成列表
        setCompletedUploads((prev) => [
          ...prev,
          { ...uploadingFile, progress: 100, status: 'completed' },
        ]);
        
        // 从上传中列表移除
        setTimeout(() => {
          setUploadingFiles((prev) =>
            prev.filter((f) => f.id !== uploadingFile.id)
          );
        }, 2000);
      }
      
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id ? { ...f, progress } : f
        )
      );
    }, 500);
  };

  const handleRemoveUploading = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleRemoveCompleted = (id: string) => {
    setCompletedUploads((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#39ff14] to-[#22c55e] rounded-xl flex items-center justify-center shrink-0">
            <Upload className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">上传比赛视频</h2>
            <p className="text-gray-400">
              选择您的订单，上传比赛视频，我们的专业分析师将为您提供详细的技术分析报告。
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">选择视频文件</h3>
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#39ff14]/20 to-[#22c55e]/20 flex items-center justify-center">
            <FileVideo className="text-[#39ff14]" size={32} />
          </div>
          
          <h4 className="text-white font-medium mb-2">点击选择视频文件</h4>
          <p className="text-gray-500 text-sm mb-4">
            或拖拽文件到此处
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <span>支持 MP4、MOV、AVI、MKV</span>
            <span>•</span>
            <span>最大 2GB</span>
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="text-[#39ff14]" size={20} />
            正在上传 ({uploadingFiles.length})
          </h3>
          <div className="space-y-4">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="bg-[#0f1419] rounded-lg p-4 border border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileVideo className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <p className="text-white font-medium truncate max-w-[200px] md:max-w-[300px]">
                        {file.file.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUploading(file.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="取消上传"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#39ff14] to-[#22c55e] transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-medium w-12 text-right">
                    {Math.round(file.progress)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Uploads */}
      {completedUploads.length > 0 && (
        <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-400" size={20} />
            上传完成 ({completedUploads.length})
          </h3>
          <div className="space-y-3">
            {completedUploads.map((file) => (
              <div
                key={file.id}
                className="bg-[#0f1419] rounded-lg p-4 border border-gray-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{file.file.name}</p>
                    <p className="text-gray-500 text-sm">
                      {formatFileSize(file.file.size)} • 上传成功
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRetry(file)}
                    className="p-2 text-gray-500 hover:text-[#39ff14] transition-colors"
                    title="重新上传"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => handleRemoveCompleted(file.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="移除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
