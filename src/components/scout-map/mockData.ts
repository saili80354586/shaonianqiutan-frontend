import type { NationalStats, ProvinceStats, Player, Club, OverseasStats, ClubStats, CountryStats, ClubBasicInfo, PlayerLocation } from './types';
import { POSITIONS, OVERSEAS_COUNTRIES } from './types';

// 重新导出 POSITIONS
export { POSITIONS, OVERSEAS_COUNTRIES };

// ===== Mock 数据生成 =====

// 俱乐部数据
const generateMockClubs = (): Club[] => {
  const clubs: Club[] = [
    { id: 1, name: '恒大足校', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=HD', province: '广东', city: '广州', lat: 23.1291, lng: 113.2644, playerCount: 320, teamCount: 6, coachCount: 24, isVerified: true, followerCount: 1256, viewCount: 8956, status: 'active', description: '广州恒大足球学校' },
    { id: 2, name: '鲁能的校', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=LN', province: '山东', city: '济南', lat: 36.6512, lng: 117.1201, playerCount: 256, teamCount: 5, coachCount: 18, isVerified: true, followerCount: 892, viewCount: 6723, status: 'active', description: '山东泰山足球俱乐部' },
    { id: 3, name: '星辉青训', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=XH', province: '广东', city: '深圳', lat: 22.5431, lng: 114.0579, playerCount: 180, teamCount: 4, coachCount: 15, isVerified: true, followerCount: 567, viewCount: 4231, status: 'active', description: '星辉足球青训营' },
    { id: 4, name: '根宝基地', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GB', province: '上海', city: '上海', lat: 31.2304, lng: 121.4737, playerCount: 145, teamCount: 4, coachCount: 12, isVerified: true, followerCount: 445, viewCount: 3567, status: 'active', description: '徐根宝足球基地' },
    { id: 5, name: '国安青训', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=GA', province: '北京', city: '北京', lat: 39.9042, lng: 116.4074, playerCount: 198, teamCount: 5, coachCount: 16, isVerified: true, followerCount: 678, viewCount: 4890, status: 'active', description: '北京国安青训' },
    { id: 6, name: '东亚足球', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=DY', province: '上海', city: '上海', lat: 31.2304, lng: 121.4737, playerCount: 156, teamCount: 4, coachCount: 14, isVerified: false, followerCount: 334, viewCount: 2876, status: 'active', description: '上海东亚足球俱乐部' },
    { id: 7, name: '富力足校', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FL', province: '广东', city: '广州', lat: 23.1291, lng: 113.2644, playerCount: 134, teamCount: 3, coachCount: 11, isVerified: true, followerCount: 289, viewCount: 2134, status: 'active', description: '广州富力足球学校' },
    { id: 8, name: '苏宁青训', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SN', province: '江苏', city: '南京', lat: 32.0603, lng: 118.7969, playerCount: 167, teamCount: 4, coachCount: 13, isVerified: true, followerCount: 412, viewCount: 3245, status: 'active', description: '江苏苏宁青训营' },
    { id: 9, name: '浙江绿城', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ZL', province: '浙江', city: '杭州', lat: 30.2741, lng: 120.1551, playerCount: 142, teamCount: 3, coachCount: 10, isVerified: false, followerCount: 256, viewCount: 1987, status: 'active', description: '浙江绿城足球俱乐部' },
    { id: 10, name: '四川足球', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SC', province: '四川', city: '成都', lat: 30.5728, lng: 104.0668, playerCount: 123, teamCount: 3, coachCount: 9, isVerified: false, followerCount: 198, viewCount: 1567, status: 'active', description: '四川足球俱乐部' },
  ];
  return clubs;
};

export const MOCK_CLUBS = generateMockClubs();

// 俱乐部基础信息
export const getClubBasicInfo = (club: Club): ClubBasicInfo => ({
  id: club.id,
  name: club.name,
  logo: club.logo,
  playerCount: club.playerCount,
  teamCount: club.teamCount,
  isVerified: club.isVerified,
});

// 海外球员数据
const generateMockOverseasPlayers = (): Player[] => {
  const players: Player[] = [];
  const nicknames = ['伟明', '建国', '志豪', '志强', '俊杰', '浩然', '子轩', '宇轩', '天宇', '思远'];
  const overseasCities = ['伦敦', '曼彻斯特', '巴塞罗那', '马德里', '慕尼黑', '柏林', '巴黎', '米兰', '罗马', '东京', '首尔', '洛杉矶', '温哥华', '圣保罗', '布宜诺斯艾利斯', '悉尼'];

  OVERSEAS_COUNTRIES.forEach((country) => {
    const count = 3 + Math.floor(Math.random() * 8); // 每个国家3-10人
    for (let i = 0; i < count; i++) {
      const score = 65 + Math.floor(Math.random() * 35);
      const likeCount = Math.floor(Math.random() * 50);
      const viewCount = Math.floor(Math.random() * 500);
      const favoriteCount = Math.floor(Math.random() * 20);

      players.push({
        id: `overseas_${country.code}_${i}`,
        nickname: nicknames[Math.floor(Math.random() * nicknames.length)] + (i + 1),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=overseas_${country.code}_${i}`,
        location: {
          type: 'overseas',
          country: country.name,
          countryCode: country.code,
          city: overseasCities[Math.floor(Math.random() * overseasCities.length)],
          lat: 0,
          lng: 0,
        },
        score,
        skillTags: ['技术细腻', '意识佳', '传球好'].slice(0, 2 + Math.floor(Math.random() * 2)),
        name: `王${nicknames[Math.floor(Math.random() * nicknames.length)]}`,
        age: 10 + Math.floor(Math.random() * 8),
        gender: '男',
        height: 130 + Math.floor(Math.random() * 50),
        weight: 30 + Math.floor(Math.random() * 40),
        foot: ['左脚', '右脚', '双脚'][Math.floor(Math.random() * 3)],
        position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)].value,
        club: `${country.name}某俱乐部`,
        likeCount,
        viewCount,
        favoriteCount,
        heatScore: likeCount * 1 + viewCount * 0.1 + favoriteCount * 5,
      });
    }
  });

  return players.sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
};

export const MOCK_OVERSEAS_PLAYERS = generateMockOverseasPlayers();

// 海外球员统计
export const generateOverseasStats = (): OverseasStats => {
  const byCountry: CountryStats[] = OVERSEAS_COUNTRIES.map((country) => ({
    country: country.name,
    countryCode: country.code,
    flag: country.flag,
    playerCount: MOCK_OVERSEAS_PLAYERS.filter((p) => p.location.type === 'overseas' && (p.location as any).countryCode === country.code).length,
  })).filter((c) => c.playerCount > 0);

  return {
    totalPlayers: MOCK_OVERSEAS_PLAYERS.length,
    byCountry,
    byLeague: [
      { league: '英超', playerCount: 28 },
      { league: '西甲', playerCount: 22 },
      { league: '德甲', playerCount: 18 },
      { league: 'J联赛', playerCount: 24 },
      { league: 'K联赛', playerCount: 16 },
    ],
  };
};

// 俱乐部统计
export const generateClubStats = (): ClubStats => {
  const clubs = MOCK_CLUBS;
  return {
    totalClubs: clubs.length,
    byProvince: [
      { province: '广东', clubCount: 3 },
      { province: '上海', clubCount: 2 },
      { province: '山东', clubCount: 1 },
      { province: '北京', clubCount: 1 },
      { province: '江苏', clubCount: 1 },
      { province: '浙江', clubCount: 1 },
      { province: '四川', clubCount: 1 },
    ],
    topClubs: clubs.slice(0, 5).map(getClubBasicInfo),
  };
};

// 城市坐标映射
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '佛山': { lat: 23.0227, lng: 113.122 },
  '东莞': { lat: 23.0469, lng: 113.7462 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '苏州': { lat: 31.2989, lng: 120.5853 },
  '无锡': { lat: 31.4912, lng: 120.3119 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '宁波': { lat: 29.8683, lng: 121.544 },
  '温州': { lat: 28.0005, lng: 120.6721 },
  '济南': { lat: 36.6512, lng: 117.1201 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '烟台': { lat: 37.4638, lng: 121.448 },
  '郑州': { lat: 34.7466, lng: 113.6253 },
  '洛阳': { lat: 34.6197, lng: 112.454 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '绵阳': { lat: 31.4675, lng: 104.6791 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '宜昌': { lat: 30.6919, lng: 111.2865 },
};

export const generateMockData = (): NationalStats => {
  const provinces: ProvinceStats[] = [
    {
      name: '北京',
      code: '110000',
      playerCount: 856,
      clubCount: 1,
      cityCount: 1,
      cities: [{ name: '北京', playerCount: 856, clubCount: 1, lat: 39.9042, lng: 116.4074, clubs: [getClubBasicInfo(MOCK_CLUBS[4])] }],
      clubs: [getClubBasicInfo(MOCK_CLUBS[4])],
    },
    {
      name: '上海',
      code: '310000',
      playerCount: 723,
      clubCount: 2,
      cityCount: 1,
      cities: [{ name: '上海', playerCount: 723, clubCount: 2, lat: 31.2304, lng: 121.4737, clubs: [getClubBasicInfo(MOCK_CLUBS[3]), getClubBasicInfo(MOCK_CLUBS[5])] }],
      clubs: [getClubBasicInfo(MOCK_CLUBS[3]), getClubBasicInfo(MOCK_CLUBS[5])],
    },
    {
      name: '广东',
      code: '440000',
      playerCount: 1245,
      clubCount: 3,
      cityCount: 4,
      cities: [
        { name: '广州', playerCount: 567, clubCount: 2, lat: 23.1291, lng: 113.2644, clubs: [getClubBasicInfo(MOCK_CLUBS[0]), getClubBasicInfo(MOCK_CLUBS[6])] },
        { name: '深圳', playerCount: 423, clubCount: 1, lat: 22.5431, lng: 114.0579, clubs: [getClubBasicInfo(MOCK_CLUBS[2])] },
        { name: '佛山', playerCount: 156, clubCount: 0, lat: 23.0227, lng: 113.122, clubs: [] },
        { name: '东莞', playerCount: 99, clubCount: 0, lat: 23.0469, lng: 113.7462, clubs: [] },
      ],
      clubs: [getClubBasicInfo(MOCK_CLUBS[0]), getClubBasicInfo(MOCK_CLUBS[2]), getClubBasicInfo(MOCK_CLUBS[6])],
    },
    {
      name: '江苏',
      code: '320000',
      playerCount: 892,
      clubCount: 1,
      cityCount: 3,
      cities: [
        { name: '南京', playerCount: 445, clubCount: 1, lat: 32.0603, lng: 118.7969, clubs: [getClubBasicInfo(MOCK_CLUBS[7])] },
        { name: '苏州', playerCount: 312, clubCount: 0, lat: 31.2989, lng: 120.5853, clubs: [] },
        { name: '无锡', playerCount: 135, clubCount: 0, lat: 31.4912, lng: 120.3119, clubs: [] },
      ],
      clubs: [getClubBasicInfo(MOCK_CLUBS[7])],
    },
    {
      name: '浙江',
      code: '330000',
      playerCount: 678,
      clubCount: 1,
      cityCount: 3,
      cities: [
        { name: '杭州', playerCount: 356, clubCount: 1, lat: 30.2741, lng: 120.1551, clubs: [getClubBasicInfo(MOCK_CLUBS[8])] },
        { name: '宁波', playerCount: 198, clubCount: 0, lat: 29.8683, lng: 121.544, clubs: [] },
        { name: '温州', playerCount: 124, clubCount: 0, lat: 28.0005, lng: 120.6721, clubs: [] },
      ],
      clubs: [getClubBasicInfo(MOCK_CLUBS[8])],
    },
    {
      name: '山东',
      code: '370000',
      playerCount: 756,
      clubCount: 1,
      cityCount: 3,
      cities: [
        { name: '济南', playerCount: 298, clubCount: 1, lat: 36.6512, lng: 117.1201, clubs: [getClubBasicInfo(MOCK_CLUBS[1])] },
        { name: '青岛', playerCount: 312, clubCount: 0, lat: 36.0671, lng: 120.3826, clubs: [] },
        { name: '烟台', playerCount: 146, clubCount: 0, lat: 37.4638, lng: 121.448, clubs: [] },
      ],
      clubs: [getClubBasicInfo(MOCK_CLUBS[1])],
    },
    {
      name: '河南',
      code: '410000',
      playerCount: 534,
      clubCount: 0,
      cityCount: 2,
      cities: [
        { name: '郑州', playerCount: 356, clubCount: 0, lat: 34.7466, lng: 113.6253, clubs: [] },
        { name: '洛阳', playerCount: 178, clubCount: 0, lat: 34.6197, lng: 112.454, clubs: [] },
      ],
      clubs: [],
    },
    {
      name: '四川',
      code: '510000',
      playerCount: 623,
      clubCount: 1,
      cityCount: 2,
      cities: [
        { name: '成都', playerCount: 467, clubCount: 1, lat: 30.5728, lng: 104.0668, clubs: [getClubBasicInfo(MOCK_CLUBS[9])] },
        { name: '绵阳', playerCount: 156, clubCount: 0, lat: 31.4675, lng: 104.6791, clubs: [] },
      ],
      clubs: [getClubBasicInfo(MOCK_CLUBS[9])],
    },
    {
      name: '湖北',
      code: '420000',
      playerCount: 445,
      clubCount: 0,
      cityCount: 2,
      cities: [
        { name: '武汉', playerCount: 312, clubCount: 0, lat: 30.5928, lng: 114.3055, clubs: [] },
        { name: '宜昌', playerCount: 133, clubCount: 0, lat: 30.6919, lng: 111.2865, clubs: [] },
      ],
      clubs: [],
    },
  ];

  const totalPlayers = provinces.reduce((sum, p) => sum + p.playerCount, 0);
  const totalCities = provinces.reduce((sum, p) => sum + p.cityCount, 0);
  const totalClubs = MOCK_CLUBS.length;

  return {
    totalPlayers,
    totalOverseasPlayers: MOCK_OVERSEAS_PLAYERS.length,
    totalClubs,
    totalCities,
    provinces,
    overseasStats: generateOverseasStats(),
    clubStats: generateClubStats(),
  };
};

// 技能标签池
const SKILL_TAGS = ['速度快', '射门准', '传球好', '防守稳', '意识佳', '爆发力强', '技术细腻', '视野开阔', '头球好', '任意球'];

// 生成模拟球员
export const generateMockPlayers = (
  cityName: string,
  provinceName: string,
  count: number
): Player[] => {
  const players: Player[] = [];
  const nicknames = ['小明', '阿龙', '小虎', '飞飞', '球球', '跑跑', '闪电', '疾风', '雷霆', '火焰'];
  const coords = CITY_COORDS[cityName] || { lat: 30, lng: 120 };

  for (let i = 0; i < Math.min(count, 50); i++) {
    // 随机评分 60-99
    const score = 60 + Math.floor(Math.random() * 40);
    // 随机技能标签 2-4个
    const skillCount = 2 + Math.floor(Math.random() * 3);
    const skillTags = [...SKILL_TAGS].sort(() => 0.5 - Math.random()).slice(0, skillCount);
    // 互动数据
    const likeCount = Math.floor(Math.random() * 30);
    const viewCount = Math.floor(Math.random() * 300);
    const favoriteCount = Math.floor(Math.random() * 15);

    players.push({
      id: `player_${cityName}_${i}`,
      nickname: nicknames[Math.floor(Math.random() * nicknames.length)] + Math.floor(Math.random() * 100),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cityName}_${i}`,
      location: {
        type: 'china',
        province: provinceName,
        city: cityName,
        lat: coords.lat,
        lng: coords.lng,
      },
      score,
      skillTags,
      name: `张${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      age: 8 + Math.floor(Math.random() * 10),
      gender: Math.random() > 0.5 ? '男' : '女',
      height: 120 + Math.floor(Math.random() * 60),
      weight: 25 + Math.floor(Math.random() * 45),
      foot: ['左脚', '右脚', '双脚'][Math.floor(Math.random() * 3)],
      position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)].value,
      club: ['恒大足校', '鲁能的校', '根宝基地', '星辉青训', '城市青训营'][Math.floor(Math.random() * 5)],
      faRegistered: Math.random() > 0.3,
      likeCount,
      viewCount,
      favoriteCount,
      heatScore: likeCount * 1 + viewCount * 0.1 + favoriteCount * 5,
    });
  }

  // 按评分降序排列
  return players.sort((a, b) => (b.score || 0) - (a.score || 0));
};

// 计算位置统计（将11个位置归类为4大类）
export const calculatePositionStats = (players: Player[]): { forward: number; midfielder: number; defender: number; goalkeeper: number } => {
  const stats = { forward: 0, midfielder: 0, defender: 0, goalkeeper: 0 };

  players.forEach(player => {
    const pos = player.position;
    if (!pos) return;

    // 前锋类: CF, ST, LW, RW
    if (['CF', 'ST', 'LW', 'RW'].includes(pos)) {
      stats.forward++;
    }
    // 中场类: CM, AM, DM
    else if (['CM', 'AM', 'DM'].includes(pos)) {
      stats.midfielder++;
    }
    // 后卫类: CB, LB, RB
    else if (['CB', 'LB', 'RB'].includes(pos)) {
      stats.defender++;
    }
    // 门将
    else if (pos === 'GK') {
      stats.goalkeeper++;
    }
  });

  return stats;
};
