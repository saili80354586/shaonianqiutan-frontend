import React, { useState } from 'react';
import type { UserRole } from '../../../types/auth';
import { Users, BarChart3, Building2, GraduationCap, Search, ArrowRight, ArrowLeft, Sparkles, Check, Target, TrendingUp, Shield } from 'lucide-react';
import { roleThemes } from './theme.config';

interface Step2RoleSelectProps {
  onNext: (role: UserRole) => void;
  onBack: () => void;
  defaultRole?: UserRole | null;
}

interface RoleOption {
  type: UserRole;
  icon: React.ElementType;
  features: string[];
  benefits: string[];
  requiresAudit: boolean;
}

const roles: RoleOption[] = [
  {
    type: 'player',
    icon: Users,
    features: ['视频上传', '球探报告', '成长档案', '技能评估'],
    benefits: ['免费基础服务', '专业分析报告', '俱乐部曝光'],
    requiresAudit: false,
  },
  {
    type: 'analyst',
    icon: BarChart3,
    features: ['接单分析', '70%分成', '灵活接单', '专业工具'],
    benefits: ['高比例分成', '自由安排时间', '职业发展'],
    requiresAudit: true,
  },
  {
    type: 'club',
    icon: Building2,
    features: ['球队管理', '批量订单', '数据分析', '教练协作'],
    benefits: ['专属客户经理', '优惠价格', '数据支持'],
    requiresAudit: true,
  },
  {
    type: 'coach',
    icon: GraduationCap,
    features: ['球员关注', '训练计划', '进度跟踪', '视频标注'],
    benefits: ['教学工具', '学员管理', '专业资源'],
    requiresAudit: true,
  },
  {
    type: 'scout',
    icon: Search,
    features: ['发现人才', '撰写报告', '潜力评估', '俱乐部对接'],
    benefits: ['发掘天才球员', '建立人才库', '专业成长'],
    requiresAudit: true,
  },
];

const Step2RoleSelect: React.FC<Step2RoleSelectProps> = ({ onNext, onBack, defaultRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(defaultRole || null);
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const handleNext = () => {
    if (selectedRole) {
      onNext(selectedRole);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-full mb-4">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-200 font-medium">选择适合您的身份</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">您是谁？</h2>
        <p className="text-slate-400 text-sm">选择角色后，我们将为您定制专属功能</p>
      </div>

      {/* 角色选择卡片 - 宽屏优化布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.type;
          const isHovered = hoveredRole === role.type;
          const theme = roleThemes[role.type];

          return (
            <button
              key={role.type}
              type="button"
              onClick={() => setSelectedRole(role.type)}
              onMouseEnter={() => setHoveredRole(role.type)}
              onMouseLeave={() => setHoveredRole(null)}
              className={`relative p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                isSelected
                  ? `border-${theme.primary} ${theme.bgCard} shadow-lg ${theme.shadow}`
                  : `border-white/10 bg-white/[0.03] hover:border-${theme.primary}/40 hover:bg-white/[0.06]`
              }`}
            >
              {/* 选中标记 */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 bg-gradient-to-r ${theme.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="flex gap-4">
                {/* 左侧：图标和标题 */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 ${
                      isHovered ? 'scale-105' : ''
                    } ${theme.shadow}`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* 右侧：内容 */}
                <div className="flex-1 min-w-0">
                  {/* 标题行 */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className={`text-lg font-bold ${theme.textPrimary}`}>
                      {theme.name}
                    </h3>
                    {/* 角色标签 - SVG 图标替代 emoji */}
                    <span className={`w-6 h-6 rounded flex items-center justify-center ${theme.bgCard} border ${theme.border}`}>
                      <Icon className={`w-3.5 h-3.5 ${theme.textSecondary}`} />
                    </span>
                    {!role.requiresAudit && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">
                        免审核
                      </span>
                    )}
                  </div>

                  {/* 英文名称 */}
                  <p className={`text-xs ${theme.textMuted} uppercase tracking-wider mb-2`}>
                    {theme.nameEn}
                  </p>

                  {/* 描述 */}
                  <p className={`text-sm ${theme.textSecondary} leading-relaxed mb-3 line-clamp-2`}>
                    {theme.style.description}
                  </p>

                  {/* 功能标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {role.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          isSelected 
                            ? `${theme.bgCard} ${theme.textPrimary} border ${theme.border}`
                            : 'bg-white/5 text-white/50'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* 优势 */}
                  <div className="flex items-center gap-3 text-[11px]">
                    {role.benefits.slice(0, 2).map((benefit, idx) => (
                      <span key={idx} className={`flex items-center gap-1 ${theme.accentLight || 'text-white/40'}`}>
                        <TrendingUp className="w-3 h-3" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 审核提示 */}
              {role.requiresAudit && (
                <div className={`mt-3 pt-3 border-t ${theme.border} flex items-center gap-1.5`}>
                  <Shield className={`w-3.5 h-3.5 ${theme.accentLight || 'text-amber-400/60'}`} />
                  <span className={`text-[11px] ${theme.accentLight || 'text-amber-400/60'}`}>
                    需要提交资质审核
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 提示信息 */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/20 rounded-xl">
        <p className="text-sm text-blue-200/80 flex items-start gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
          <span>
            <span className="text-blue-400 font-medium">提示：</span>
            选择分析师、俱乐部或教练需要提交相关资质进行审核。您也可以先以球员身份注册，之后随时申请其他角色。
          </span>
        </p>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedRole}
          className={`flex-1 py-3.5 bg-gradient-to-r ${selectedRole ? roleThemes[selectedRole].gradient : 'from-slate-600 to-slate-700'} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm ${
            selectedRole ? roleThemes[selectedRole].shadow : ''
          }`}
        >
          下一步
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step2RoleSelect;
