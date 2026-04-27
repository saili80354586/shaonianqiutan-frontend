import React, { useState } from 'react';
import { Phone, MessageCircle, Crown, X, ChevronRight } from 'lucide-react';

// 联系我们弹窗
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a2332] rounded-2xl p-6 w-full max-w-md mx-4 border border-[#2d3748]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#f8fafc]">联系我们</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2d3748] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#94a3b8]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 客服微信 */}
          <div className="flex items-center gap-4 p-4 bg-[#0f1419] rounded-xl border border-[#2d3748]">
            <div className="w-12 h-12 bg-[#39ff14]/10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#39ff14]" />
            </div>
            <div className="flex-1">
              <p className="text-[#f8fafc] font-medium">客服微信</p>
              <p className="text-sm text-[#94a3b8]">shaonianqiutan2024</p>
            </div>
          </div>

          {/* 服务热线 */}
          <div className="flex items-center gap-4 p-4 bg-[#0f1419] rounded-xl border border-[#2d3748]">
            <div className="w-12 h-12 bg-[#39ff14]/10 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#39ff14]" />
            </div>
            <div className="flex-1">
              <p className="text-[#f8fafc] font-medium">服务热线</p>
              <p className="text-sm text-[#94a3b8]">400-888-9999</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#2d3748]">
          <p className="text-xs text-[#64748b] text-center">
            工作时间：周一至周日 9:00-21:00
          </p>
        </div>
      </div>
    </div>
  );
};

// 升级会员弹窗
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  feature = '该功能' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a2332] rounded-2xl p-6 w-full max-w-sm mx-4 border border-[#2d3748]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#fbbf24]/20">
            <Crown className="w-8 h-8 text-[#0a0e17]" />
          </div>
          <h3 className="text-xl font-bold text-[#f8fafc] mb-2">
            会员专享功能
          </h3>
          <p className="text-sm text-[#94a3b8]">
            {feature}仅对会员开放，开通会员即可解锁更多专属权益
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              // 跳转到会员开通页面
              window.location.href = '/membership';
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#39ff14] to-[#2dd4bf] text-[#0a0e17] font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            立即开通会员
          </button>

          <button
            onClick={() => {
              // 打开联系我们弹窗
              onClose();
              // 触发联系弹窗（需要父组件处理）
            }}
            className="w-full py-3 px-4 bg-[#2d3748] text-[#f8fafc] font-medium rounded-xl hover:bg-[#3d4758] transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            联系我们咨询
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
};

// 会员入口组件
export const MemberEntrance: React.FC = () => {
  return (
    <button
      onClick={() => window.location.href = '/membership'}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fbbf24]/10 to-[#f59e0b]/10 border border-[#fbbf24]/30 rounded-lg hover:from-[#fbbf24]/20 hover:to-[#f59e0b]/20 transition-all"
    >
      <Crown className="w-4 h-4 text-[#fbbf24]" />
      <span className="text-sm font-medium text-[#fbbf24]">开通会员</span>
      <ChevronRight className="w-4 h-4 text-[#fbbf24]" />
    </button>
  );
};

// 联系按钮组件
interface ContactButtonProps {
  onClick: () => void;
}

export const ContactButton: React.FC<ContactButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-[#2d3748] hover:bg-[#3d4758] text-[#f8fafc] rounded-lg transition-colors"
    >
      <Phone className="w-4 h-4 text-[#39ff14]" />
      <span className="text-sm font-medium">联系我们</span>
    </button>
  );
};
