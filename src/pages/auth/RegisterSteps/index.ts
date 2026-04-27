// 注册步骤组件导出
export { default as Step1Account } from './Step1Account';
export { default as Step2RoleSelect } from './Step2RoleSelect';
export { default as Step3BaseInfo } from './Step3BaseInfo';
export { default as Step4PlayerSpecific } from './Step4PlayerSpecific';
export { default as Step4AnalystSpecific } from './Step4AnalystSpecific';
export { default as Step4ClubSpecific } from './Step4ClubSpecific';
export { default as Step4CoachSpecific } from './Step4CoachSpecific';
export { default as Step4ScoutSpecific } from './Step4ScoutSpecific';

// 保留旧组件兼容
export { default as Step3PlayerProfile } from './Step3PlayerProfile';
export { default as Step3AnalystProfile } from './Step3AnalystProfile';
export { default as Step3ClubProfile } from './Step3ClubProfile';
export { default as Step3CoachProfile } from './Step3CoachProfile';

// 球员补充资料导出
export { default as Step5PlayerSupplement } from './Step5PlayerSupplement';
export type { PlayerSupplementData } from './Step5PlayerSupplement';

// 主题配置导出
export { roleThemes, getStepTheme, getButtonStyles, getInputStyles, getCardStyles } from './theme.config';
export type { RoleTheme } from './theme.config';

// 类型导出
export type { BaseInfoData } from './Step3BaseInfo';
export type { PlayerSpecificData } from './Step4PlayerSpecific';
export type { AnalystSpecificData } from './Step4AnalystSpecific';
export type { ClubSpecificData } from './Step4ClubSpecific';
export type { CoachSpecificData } from './Step4CoachSpecific';
export type { ScoutSpecificData } from './Step4ScoutSpecific';
export type { PlayerProfileData } from './Step3PlayerProfile';
export type { AnalystProfileData } from './Step3AnalystProfile';
export type { ClubProfileData } from './Step3ClubProfile';
export type { CoachProfileData } from './Step3CoachProfile';
