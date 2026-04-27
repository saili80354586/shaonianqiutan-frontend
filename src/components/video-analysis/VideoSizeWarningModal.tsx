import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Smartphone, Video } from 'lucide-react';

interface VideoSizeWarningModalProps {
  isOpen: boolean;
  fileSize: number;
  onClose: () => void;
  onContinue?: () => void;
}

const VideoSizeWarningModal: React.FC<VideoSizeWarningModalProps> = ({
  isOpen,
  fileSize,
  onClose,
  onContinue,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">视频文件过大</h3>
                <p className="text-sm text-slate-400">
                  当前文件大小: <span className="text-amber-400 font-semibold">{formatFileSize(fileSize)}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-auto p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Warning Message */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-300 text-sm leading-relaxed">
                  为了保证上传速度和分析效率，单个视频大小请控制在{' '}
                  <strong className="text-red-400">100MB</strong> 以内。
                  请按照以下方法压缩后重新上传：
                </p>
              </div>

              {/* Compression Methods */}
              <div className="space-y-4">
                {/* Method 1: WeChat */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <span className="text-emerald-400 text-xs font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      首选：微信文件压缩（最简单快捷）
                    </h4>
                  </div>
                  <ol className="text-sm text-slate-300 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500/50">•</span>
                      <span>打开微信「文件传输助手」</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500/50">•</span>
                      <span>把原视频发送给自己（不发送也没关系）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500/50">•</span>
                      <span>微信会自动压缩视频</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500/50">•</span>
                      <span>长按视频，选择「保存视频」到相册</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500/50">•</span>
                      <span>用保存后的视频上传即可</span>
                    </li>
                  </ol>
                </div>

                {/* Method 2: CapCut */}
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-slate-600/30 rounded-full flex items-center justify-center">
                      <span className="text-slate-400 text-xs font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-slate-300 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      备选：剪映APP压缩
                    </h4>
                  </div>
                  <ol className="text-sm text-slate-400 space-y-2 ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500">•</span>
                      <span>打开剪映，开始创作，导入你的视频</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500">•</span>
                      <span>直接点击右上角「导出」</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500">•</span>
                      <span>导出设置中调低「分辨率」或「码率」</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500">•</span>
                      <span>导出后保存到相册，再上传即可</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                我明白了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSizeWarningModal;
