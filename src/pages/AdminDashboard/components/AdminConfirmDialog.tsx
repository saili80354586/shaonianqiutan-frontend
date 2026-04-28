import React from 'react';

interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger' | 'success';
  disabled?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
};

const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  tone = 'primary',
  disabled = false,
  children,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0f1419] p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06] disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${toneClasses[tone]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmDialog;
