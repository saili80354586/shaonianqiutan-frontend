import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  FileVideo,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  RefreshCw,
  FolderOpen,
  Loader2,
  Video,
  ShoppingBag,
} from 'lucide-react';
import { orderApi } from '../../../services/api';
import { getApiUrl } from '../../../config/api';

// 内联类型定义
type OrderStatus = 'pending' | 'paid' | 'uploaded' | 'processing' | 'completed' | 'cancelled' | 'refunded';

interface Order {
  id: number;
  order_no: string;
  status: OrderStatus;
  amount: number;
  created_at: string;
  analyst?: {
    user?: {
      name?: string;
    };
  } | null;
  player_name?: string;
  match_name?: string;
  order_type?: string;
  video_url?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  orderId?: number;
}

// 上传接口返回类型
interface UploadResponse {
  url: string;
  filename: string;
  original: string;
  size: number;
}

export const UploadModule: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [completedUploads, setCompletedUploads] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // 获取可上传视频的订单列表（status = paid）
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await orderApi.getOrders({ page: 1, pageSize: 100 });
      if (response.data?.success) {
        const allOrders: Order[] = response.data.data?.list || [];
        const paidOrders = allOrders.filter((o: Order) => o.status === 'paid');
        setOrders(paidOrders);
      } else {
        setOrdersError(response.data?.message || '获取订单列表失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取订单列表失败';
      setOrdersError(message);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  // 处理拖拽进入
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  // 处理拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 处理文件放置
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    setValidationError(null);
    if (!selectedOrder) {
      setValidationError('请先选择一个订单');
      return;
    }

    // 验证文件类型
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

    const invalidFiles = files.filter(file => {
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
      );
      return !hasValidType && !hasValidExtension;
    });

    if (invalidFiles.length > 0) {
      setValidationError(`以下文件格式不支持：${invalidFiles.map(f => f.name).join('、')}。仅支持 MP4、MOV、AVI、MKV、WebM 格式`);
      return;
    }

    // 验证文件大小
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setValidationError(`以下文件超过2GB限制：${oversizedFiles.map(f => f.name).join('、')}`);
      return;
    }

    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading',
      orderId: selectedOrder.id,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // 真实上传
    newUploadingFiles.forEach((uploadingFile) => {
      uploadFile(uploadingFile);
    });
  };

  // 真实文件上传（XMLHttpRequest 支持进度）
  const uploadFile = async (uploadingFile: UploadingFile) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', uploadingFile.file);
    formData.append('type', 'video');

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, progress } : f
          )
        );
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const uploadResult: UploadResponse = JSON.parse(xhr.responseText);

          // 上传成功，补充订单信息
          if (uploadingFile.orderId) {
            try {
              await orderApi.supplementOrder(uploadingFile.orderId, {
                video_url: uploadResult.url,
                video_filename: uploadResult.filename || uploadingFile.file.name,
                player_name: uploadingFile.file.name.replace(/\.[^/.]+$/, ''),
                player_position: '',
              });

              // 标记完成
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, progress: 100, status: 'completed' }
                    : f
                )
              );

              setCompletedUploads((prev) => [
                ...prev,
                { ...uploadingFile, progress: 100, status: 'completed' },
              ]);

              setTimeout(() => {
                setUploadingFiles((prev) =>
                  prev.filter((f) => f.id !== uploadingFile.id)
                );
              }, 2000);
            } catch (supplementErr) {
              const msg = supplementErr instanceof Error ? supplementErr.message : '关联订单失败';
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadingFile.id
                    ? { ...f, status: 'error', errorMessage: msg }
                    : f
                )
              );
            }
          }
        } catch {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? { ...f, status: 'error', errorMessage: '解析上传结果失败' }
                : f
            )
          );
        }
      } else {
        let msg = '上传失败';
        try {
          const errData = JSON.parse(xhr.responseText);
          msg = errData.message || `上传失败 (${xhr.status})`;
        } catch {
          msg = `上传失败 (${xhr.status})`;
        }
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error', errorMessage: msg }
              : f
          )
        );
      }
    });

    xhr.addEventListener('error', () => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id
            ? { ...f, status: 'error', errorMessage: '网络错误，上传失败' }
            : f
        )
      );
    });

    xhr.addEventListener('abort', () => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadingFile.id
            ? { ...f, status: 'error', errorMessage: '上传已取消' }
            : f
        )
      );
    });

    xhr.open('POST', getApiUrl('/upload/file'));

    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  };

  // 移除上传中的文件
  const handleRemoveUploading = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 移除已完成的文件
  const handleRemoveCompleted = (id: string) => {
    setCompletedUploads((prev) => prev.filter((f) => f.id !== id));
  };

  // 重新上传
  const handleRetry = (file: UploadingFile) => {
    handleRemoveCompleted(file.id);

    const newUpload: UploadingFile = {
      ...file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles((prev) => [...prev, newUpload]);
    uploadFile(newUpload);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取订单显示标题
  const getOrderTitle = (order: Order): string => {
    if (order.match_name) return order.match_name;
    if (order.player_name) return `${order.player_name} 的比赛视频`;
    return `订单 #${order.order_no}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{validationError}</span>
          <button onClick={() => setValidationError(null)} className="ml-auto text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#39ff14] to-[#22c55e] rounded-xl flex items-center justify-center shrink-0">
            <Upload className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">上传比赛视频</h2>
            <p className="text-gray-400">
              选择您的已支付订单，上传比赛视频，我们的专业分析师将为您提供详细的技术分析报告。
            </p>
          </div>
        </div>
      </div>

      {/* Order Selection */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          选择订单 <span className="text-red-400">*</span>
        </label>

        {ordersLoading ? (
          <div className="flex items-center gap-3 py-4 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            <span>加载订单列表...</span>
          </div>
        ) : ordersError ? (
          <div className="flex items-center gap-3 py-4 text-red-400">
            <AlertCircle size={20} />
            <span>{ordersError}</span>
            <button
              onClick={fetchOrders}
              className="ml-2 px-3 py-1 bg-[#39ff14]/10 text-[#39ff14] text-sm rounded-lg hover:bg-[#39ff14]/20 transition-colors"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
              disabled={orders.length === 0}
              className={`
                w-full px-4 py-3 rounded-lg border text-left transition-all
                ${orders.length === 0
                  ? 'border-gray-800 bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  : selectedOrder
                    ? 'border-[#39ff14] bg-[#39ff14]/5 text-white'
                    : 'border-gray-700 bg-[#0f1419] text-gray-500'
                }
                hover:border-gray-600
              `}
            >
              {orders.length === 0 ? (
                <span className="text-gray-500">暂无待上传的已支付订单</span>
              ) : selectedOrder ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{getOrderTitle(selectedOrder)}</p>
                    <p className="text-gray-500 text-sm">{selectedOrder.order_no}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">
                    ¥{selectedOrder.amount}
                  </span>
                </div>
              ) : (
                '请选择一个订单'
              )}
              {orders.length > 0 && (
                isOrderDropdownOpen ? (
                  <ChevronUp className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                )
              )}
            </button>

            {/* Dropdown Menu */}
            {isOrderDropdownOpen && orders.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f2e] border border-gray-800 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setValidationError(null);
                      setIsOrderDropdownOpen(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left transition-colors border-b border-gray-800 last:border-b-0
                      ${selectedOrder?.id === order.id
                        ? 'bg-[#39ff14]/10 border-l-2 border-l-[#39ff14]'
                        : 'hover:bg-[#252b3d]'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${selectedOrder?.id === order.id ? 'text-[#39ff14]' : 'text-white'}`}>
                          {getOrderTitle(order)}
                        </p>
                        <p className="text-gray-500 text-sm">{order.order_no}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">
                        ¥{order.amount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - No Paid Orders */}
        {!ordersLoading && !ordersError && orders.length === 0 && (
          <div className="mt-4 p-6 bg-[#0f1419] rounded-lg border border-gray-800 text-center">
            <ShoppingBag className="mx-auto mb-3 text-gray-600" size={40} />
            <p className="text-gray-400 mb-2">暂无符合条件的订单</p>
            <p className="text-gray-500 text-sm mb-4">您需要先支付一个视频分析订单，才能在此上传视频</p>
            <a
              href="/video-analysis"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#39ff14]/10 text-[#39ff14] rounded-lg hover:bg-[#39ff14]/20 transition-colors text-sm font-medium"
            >
              <Video size={16} />
              去下单视频分析
            </a>
          </div>
        )}

        {/* Selected Order Info */}
        {selectedOrder && (
          <div className="mt-4 p-4 bg-[#0f1419] rounded-lg border border-gray-800">
            <h4 className="text-white font-medium mb-2">订单信息</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">订单号</span>
                <p className="text-white">{selectedOrder.order_no}</p>
              </div>
              <div>
                <span className="text-gray-500">分析师</span>
                <p className="text-white">{selectedOrder.analyst?.user?.name || '待定'}</p>
              </div>
              <div>
                <span className="text-gray-500">订单金额</span>
                <p className="text-[#39ff14] font-medium">¥{selectedOrder.amount}</p>
              </div>
              <div>
                <span className="text-gray-500">订单类型</span>
                <p className="text-white">{selectedOrder.order_type === 'pro' ? '专业版' : '基础版'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area with Drag & Drop */}
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">上传视频</h3>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${isDragging
              ? 'border-[#39ff14] bg-[#39ff14]/10'
              : selectedOrder
                ? 'border-gray-700 hover:border-gray-600 bg-[#0f1419]'
                : 'border-gray-800 bg-gray-800/50 cursor-not-allowed'
            }
          `}
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
            {isDragging ? (
              <Upload className="text-[#39ff14]" size={32} />
            ) : (
              <FolderOpen className={selectedOrder ? 'text-gray-400' : 'text-gray-600'} size={32} />
            )}
          </div>

          {isDragging ? (
            <p className="text-[#39ff14] font-medium">释放以上传视频</p>
          ) : selectedOrder ? (
            <>
              <p className="text-white font-medium mb-2">点击或拖拽视频到此处上传</p>
              <p className="text-gray-500 text-sm">
                支持 MP4、MOV、AVI、MKV、WebM 格式，单个文件最大 2GB
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium mb-2">请先选择一个订单</p>
              <p className="text-gray-600 text-sm">
                选择订单后即可上传视频
              </p>
            </>
          )}
        </div>

        {/* File Requirements */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f1419] rounded-lg p-3 text-center">
            <p className="text-[#39ff14] font-semibold text-lg">2GB</p>
            <p className="text-gray-500 text-xs">最大文件大小</p>
          </div>
          <div className="bg-[#0f1419] rounded-lg p-3 text-center">
            <p className="text-[#39ff14] font-semibold text-lg">5+</p>
            <p className="text-gray-500 text-xs">支持格式</p>
          </div>
          <div className="bg-[#0f1419] rounded-lg p-3 text-center">
            <p className="text-[#39ff14] font-semibold text-lg">SSL</p>
            <p className="text-gray-500 text-xs">安全传输</p>
          </div>
          <div className="bg-[#0f1419] rounded-lg p-3 text-center">
            <p className="text-[#39ff14] font-semibold text-lg">24h</p>
            <p className="text-gray-500 text-xs">分析周期</p>
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
                        {file.status === 'error' && file.errorMessage && (
                          <span className="text-red-400 ml-2">{file.errorMessage}</span>
                        )}
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
                      className={`h-full transition-all duration-300 ${
                        file.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-[#39ff14] to-[#22c55e]'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${
                    file.status === 'error' ? 'text-red-400' : 'text-white'
                  }`}>
                    {file.status === 'error' ? '失败' : `${Math.round(file.progress)}%`}
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
                      {formatFileSize(file.file.size)} &bull; 上传成功
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

      {/* Tips */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">上传提示</h4>
            <ul className="text-blue-400/70 text-sm space-y-1">
              <li>&bull; 请确保视频质量清晰，能够清楚地看到球员的动作和技术细节</li>
              <li>&bull; 建议上传完整的比赛视频或训练片段，时长建议在 5-30 分钟</li>
              <li>&bull; 上传完成后，分析师将在 24-48 小时内完成分析报告</li>
              <li>&bull; 如需修改已上传的视频，请重新上传并选择同一订单</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
