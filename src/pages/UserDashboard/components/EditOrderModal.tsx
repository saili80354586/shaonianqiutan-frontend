import React, { useState } from 'react';
import { X, Edit2, Save, AlertCircle } from 'lucide-react';
// 内联类型定义
type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  title: string;
  status: OrderStatus;
  price: number;
  createdAt: string;
  analystName?: string;
  videoUrl?: string;
}

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: keyof Order, value: string | number) => {
    setEditedOrder((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedOrder.title.trim()) {
      newErrors.title = '视频标题不能为空';
    }

    if (editedOrder.price <= 0) {
      newErrors.price = '订单金额必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(editedOrder);
      onClose();
    }
  };

  const isEditable = ['pending', 'paid'].includes(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Edit2 className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">编辑订单</h2>
              <p className="text-gray-500 text-sm">订单号: {order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isEditable && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-yellow-400 font-medium">此订单无法编辑</p>
                  <p className="text-yellow-400/70 text-sm mt-1">
                    订单已进入"分析中"或"已完成"状态，无法修改订单信息。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 视频标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              视频标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={editedOrder.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={!isEditable}
              className={`
                w-full px-4 py-3 rounded-lg border transition-all
                ${errors.title 
                  ? 'border-red-500 bg-red-500/10 text-red-400' 
                  : 'border-gray-700 bg-[#0f1419] text-white focus:border-[#39ff14]'
                }
                ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              placeholder="请输入视频标题"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.title}
              </p>
            )}
          </div>

          {/* 订单金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              订单金额 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={editedOrder.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                disabled={!isEditable}
                min={0}
                step={0.01}
                className={`
                  w-full pl-8 pr-4 py-3 rounded-lg border transition-all
                  ${errors.price 
                    ? 'border-red-500 bg-red-500/10 text-red-400' 
                    : 'border-gray-700 bg-[#0f1419] text-white focus:border-[#39ff14]'
                  }
                  ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
            </div>
            {errors.price && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.price}
              </p>
            )}
          </div>

          {/* 当前状态 */}
          <div className="bg-[#0f1419] rounded-xl p-4 border border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">当前状态</label>
            <div className="flex items-center gap-2">
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                ${order.status === 'paid' ? 'bg-blue-500/10 text-blue-400' : ''}
                ${order.status === 'processing' ? 'bg-purple-500/10 text-purple-400' : ''}
                ${order.status === 'completed' ? 'bg-green-500/10 text-green-400' : ''}
                ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : ''}
              `}>
                {order.status === 'pending' && '待支付'}
                {order.status === 'paid' && '已支付'}
                {order.status === 'processing' && '分析中'}
                {order.status === 'completed' && '已完成'}
                {order.status === 'cancelled' && '已取消'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          {isEditable && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-[#39ff14] to-[#22c55e] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#39ff14]/30 transition-all flex items-center gap-2"
            >
              <Save size={18} />
              保存修改
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
