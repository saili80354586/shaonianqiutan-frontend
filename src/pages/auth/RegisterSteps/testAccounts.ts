// 测试账号数据 - 每个角色一套完整数据
export const testAccounts: Record<string, {
  account: { phone: string; password: string; verifyCode: string };
  baseInfo: Record<string, unknown>;
  specificInfo: Record<string, unknown>;
}> = {
  player: {
    account: { phone: '13800138001', password: 'Test123456', verifyCode: '123456' },
    baseInfo: { nickname: '小明', gender: 'male', birthDate: '2012-05-15', location: '广东省深圳市', bio: '热爱足球，梦想成为职业球员' },
    specificInfo: { position: 'forward', dominantFoot: 'right', height: '145', weight: '38', currentTeam: '深圳少年队', jerseyNumber: '10', playingExperience: '5年', trainingGoal: '提升射门技术和身体对抗能力', guardianName: '张大明', guardianPhone: '13900139001', guardianRelation: '父亲' },
  },
  analyst: {
    account: { phone: '13800138002', password: 'Test123456', verifyCode: '123456' },
    baseInfo: { nickname: '李分析师', gender: 'male', birthDate: '1985-03-20', location: '北京市朝阳区', bio: '前职业球员，现任青少年足球分析师' },
    specificInfo: { profession: '青少年足球技术分析师', experience: '10年以上', isProPlayer: true, hasCase: true, caseDetail: '曾指导多名球员进入职业俱乐部青训体系', certificates: [], contactPhone: '13800138002', contactEmail: 'analyst@example.com' },
  },
  club: {
    account: { phone: '13800138003', password: 'Test123456', verifyCode: '123456' },
    baseInfo: { nickname: '深圳雄鹰俱乐部', gender: 'male', birthDate: '1995-01-01', location: '广东省深圳市南山区', bio: '专注青少年足球培训的专业俱乐部' },
    specificInfo: { clubName: '深圳雄鹰足球俱乐部', establishedYear: '2010', clubType: 'youth', clubScale: 'medium', contactName: '王经理', contactPhone: '13800138003', contactEmail: 'club@example.com', clubAddress: '深圳市南山区科技园足球场' },
  },
  coach: {
    account: { phone: '13800138004', password: 'Test123456', verifyCode: '123456' },
    baseInfo: { nickname: '陈教练', gender: 'male', birthDate: '1980-08-08', location: '上海市浦东新区', bio: '20年执教经验，专注青少年技术训练' },
    specificInfo: { coachType: 'technical', licenseLevel: 'AFC_B', coachingYears: '20年', specialty: '技术训练', introduction: '曾带领球队获得全国青少年足球锦标赛冠军' },
  },
  scout: {
    account: { phone: '13800138005', password: 'Test123456', verifyCode: '123456' },
    baseInfo: { nickname: '刘球探', gender: 'male', birthDate: '1975-06-15', location: '江苏省南京市', bio: '20年球探经验，发掘多名职业球员' },
    specificInfo: { scoutingExperience: '5-10', specialties: ['forward'], preferredAgeGroups: ['U12'], scoutingRegions: ['华东'], currentOrganization: '江苏苏宁青训球探部', bio: '曾发掘多名职业球员' },
  },
};

export type TestAccountRole = keyof typeof testAccounts;
