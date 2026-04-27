/**
 * 体测项目完整配置（唯一数据源）
 * 
 * 包含全部 14 个体测指标的：
 * - 基础元信息（名称、单位、分类、方向）
 * - 标准化测试说明（目的、做法、设备、规则、误区）
 * 
 * 所有页面/组件统一引用此文件，确保标准一致
 */

// ===== 类型定义 =====

export type TestCategory = 'basic' | 'speed' | 'agility' | 'power' | 'flexibility' | 'strength';

export interface PhysicalTestItemDef {
  /** 数据库字段名 (snake_case) */
  key: string;
  /** 中文名称 */
  label: string;
  /** 单位 */
  unit: string;
  /** 分类 */
  category: TestCategory;
  /** 分类中文名 */
  categoryName: string;
  /** 是否越小越好 */
  lowerIsBetter: boolean;
  /** Lucide icon 名称 */
  icon: string;

  /** 标准化测试说明 */
  standard: {
    /** 测试目的（1句话） */
    purpose: string;
    /** 标准做法（2-4条要点） */
    method: string[];
    /** 所需设备/场地 */
    equipment: string;
    /** 判罚规则/注意事项（2-3条） */
    rules: string[];
    /** 常见误区 */
    commonMistake: string;
    /** 实用提示（1-2条） */
    tips: string[];
  };
}

// ===== 分类配置 =====

export const CATEGORY_CONFIG: Record<TestCategory, { label: string; color: string; bgColor: string }> = {
  basic:     { label: '基础',   color: '#9ca3af', bgColor: 'bg-gray-500/20' },
  speed:     { label: '速度',   color: '#f97316', bgColor: 'bg-orange-500/20' },
  agility:   { label: '灵敏',   color: '#a855f7', bgColor: 'bg-purple-500/20' },
  power:     { label: '爆发',   color: '#eab308', bgColor: 'bg-yellow-500/20' },
  flexibility:{ label: '柔韧',  color: '#10b981', bgColor: 'bg-emerald-500/20' },
  strength:   { label: '力量',   color: '#ef4444', bgColor: 'bg-red-500/20' },
};

// ===== 全部体测项目配置 =====

export const PHYSICAL_TEST_ITEMS: PhysicalTestItemDef[] = [
  // ──────────────────────────────────────
  // 基础类
  // ──────────────────────────────────────
  {
    key: 'height',
    label: '身高',
    unit: 'cm',
    category: 'basic',
    categoryName: '基础',
    lowerIsBetter: false,
    icon: 'Ruler',
    standard: {
      purpose: '评估身体发育水平和生长趋势',
      method: [
        '脱鞋站立在身高计下，脚跟、臀部、肩胛骨、后脑勺紧贴立柱',
        '双眼平视前方，身体保持直立',
        '水平压板轻触头顶，读取数值'
      ],
      equipment: '身高计或墙面+直角板+卷尺',
      rules: ['测量时不能踮脚', '头发过厚者需压实'],
      commonMistake: '❌ 踮脚测量 → ✅ 脚跟必须贴地',
      tips: ['建议同一时间段测量（如早晨起床后），减少日间误差'],
    },
  },
  {
    key: 'weight',
    label: '体重',
    unit: 'kg',
    category: 'basic',
    categoryName: '基础',
    lowerIsBetter: false,
    icon: 'Weight',
    standard: {
      purpose: '评估体重变化和 BMI 计算，监控生长发育与营养状态',
      method: [
        '穿着轻便服装，脱鞋站上体重秤',
        '双脚均匀分布站在秤面中心',
        '身体静止不动，读取稳定数值'
      ],
      equipment: '电子体重秤（精度±0.1kg）',
      rules: ['测量前先归零校准', '饭后30分钟内不宜测量'],
      commonMistake: '❌ 穿厚重衣服/鞋子测量 → ✅ 尽量穿轻薄运动服',
      tips: ['固定时间测量更利于追踪变化趋势'],
    },
  },

  // ──────────────────────────────────────
  // 速度类
  // ──────────────────────────────────────
  {
    key: 'sprint_30m',
    label: '30米跑',
    unit: '秒',
    category: 'speed',
    categoryName: '速度',
    lowerIsBetter: true,
    icon: 'Timer',
    standard: {
      purpose: '评估短距离绝对速度和加速能力，足球中最关键的体能指标之一',
      method: [
        '从静止姿势起跑（站立式或蹲踞式），全力冲刺通过30米终点线',
        '计时从脚离开起跑线开始，到躯干越过终点线结束',
        '允许2次尝试，取最佳成绩'
      ],
      equipment: '电子计时器或手持秒表、平直跑道（≥35米含缓冲区）',
      rules: [
        '起跑信号必须统一（口令或发令枪）',
        '风力超过3级应暂停测试',
        '禁止穿钉鞋以外的 footwear'
      ],
      commonMistake: '❌ "从慢到快逐渐加速" → ✅ 应全程最大速度冲刺',
      tips: ['正式测试前充分热身10-15分钟', 'U12以下建议使用站立式起跑'],
    },
  },
  {
    key: 'sprint_50m',
    label: '50米跑',
    unit: '秒',
    category: 'speed',
    categoryName: '速度',
    lowerIsBetter: true,
    icon: 'Timer',
    standard: {
      purpose: '评估中短距离冲刺能力和速度耐力，反映加速后的速度维持能力',
      method: [
        '与30米跑相同流程，距离延长至50米',
        '重点观察30-50米段的速度维持能力（不出现明显减速）',
        '允许2次尝试，取最佳成绩'
      ],
      equipment: '电子计时器或手持秒表、平直跑道（≥55米）',
      rules: ['全程保持最大强度', '终点减速时仍需冲过终线'],
      commonMistake: '❌ 前30米保留体力 → ✅ 全程最大速度',
      tips: ['此项目能很好区分球员的"速度耐力"差异'],
    },
  },
  {
    key: 'sprint_100m',
    label: '100米跑',
    unit: '秒',
    category: 'speed',
    categoryName: '速度',
    lowerIsBetter: true,
    icon: 'Timer',
    standard: {
      purpose: '评估长距离速度耐力和无氧代谢能力（选做项目）',
      method: [
        '从静止起跑，全力冲刺100米',
        '主要用于评估速度耐力储备，而非纯短跑能力',
        '允许1次正式测试（负荷较大）'
      ],
      equipment: '标准跑道或平直区域（≥110米）、电子/手动计时器',
      rules: ['此项目对U12以下年龄组负荷较大，建议作为选做项目', '注意观察球员疲劳反应'],
      commonMistake: '❌ 前50米用尽全力导致后半程严重掉速 → ✅ 合理分配体能但全程高强度',
      tips: ['适合U14及以上年龄段', '可与30m/50m数据结合评估速度衰减曲线'],
    },
  },

  // ──────────────────────────────────────
  // 灵敏类
  // ──────────────────────────────────────
  {
    key: 'agility_ladder',
    label: '敏捷梯',
    unit: '秒',
    category: 'agility',
    categoryName: '灵敏',
    lowerIsBetter: true,
    icon: 'Zap',
    standard: {
      purpose: '评估脚步频率、协调性和快速变向能力——足球控球和盘带的核心基础',
      method: [
        '使用标准敏捷梯（每格约40cm×40cm，共8-10格，总长约3.6-4米）',
        '以最快速度双脚交替进出每一格（in-in-out-out 或 单脚进单脚出）',
        '从第一格踏入开始计时，到最后一格完全踏出停止计时'
      ],
      equipment: '敏捷梯（绳梯）、电子/手动秒表',
      rules: [
        '踩线/漏格/顺序错误 → 该次无效，重新测试',
        '允许2次尝试，取最佳成绩',
        '需明确使用哪种步法模式并在结果中标注'
      ],
      commonMistake: '❌ 只求快而踩出格外 → ✅ 必须准确踏在每格内才算有效',
      tips: ['推荐使用"双进双出"步法作为标准测试步法', '熟练后可增加侧向移动变体'],
    },
  },
  {
    key: 't_test',
    label: 'T型跑',
    unit: '秒',
    category: 'agility',
    categoryName: '灵敏',
    lowerIsBetter: true,
    icon: 'Zap',
    standard: {
      purpose: '评估多方向变向移动能力（前向冲刺 + 侧向滑步 + 后退跑组合）',
      method: [
        '设置T型标志物：起点A → 正前方10米B点 → B点左右各5米的C点和D点',
        '路线：A→B(前冲) → C(左侧向) → B(右侧回) → D(右出) → B(左回) → A(后退)',
        '全程约40米（含折返），计时从起跑到返回A点'
      ],
      equipment: '4个标志桶/锥筒、秒表、平整场地（15m×10m区域）',
      rules: [
        '每次绕过B/C/D点时必须用手触碰标志物',
        '后退阶段(A←B)必须面向前方倒退跑，不允许转身'
      ],
      commonMistake: '❌ 绕标志物时大幅减速绕大圈 → ✅ 保持重心稳定的前提下尽量贴近标志物快速切转',
      tips: ['这个项目特别考验足球运动员的防守转身和进攻变向能力'],
    },
  },
  {
    key: 'shuttle_run',
    label: '折返跑',
    unit: '秒',
    category: 'agility',
    categoryName: '灵敏',
    lowerIsBetter: true,
    icon: 'Zap',
    standard: {
      purpose: '评估反复冲刺能力和恢复能力（模拟比赛中攻防转换的间歇冲刺场景）',
      method: [
        '【标准方案：10米×5次往返】在两条相距10米的平行线之间往返跑5个来回（共100米）',
        '从起跑线出发，手触对面线后立即折返，循环5次',
        '每次到达起跑线时脚必须触线或过线'
      ],
      equipment: '2条平行标志线（间距10米）、标志桶、秒表',
      rules: [
        '每次折返时必须用手或脚触及/越过目标线，否则该趟不计入',
        '替代方案：15m×4次（120m）或 20m×4次（160m），需在结果中注明具体方案'
      ],
      commonMistake: '❌ 快到目标线就提前减速转身 → ✅ 必须明确触线后再转向',
      tips: ['这是最能模拟比赛场景的体能指标之一', '建议采用10m×5方案作为青少年足球标准'],
    },
  },

  // ──────────────────────────────────────
  // 爆发类
  // ──────────────────────────────────────
  {
    key: 'standing_long_jump',
    label: '立定跳远',
    unit: 'cm',
    category: 'power',
    categoryName: '爆发',
    lowerIsBetter: false,
    icon: 'ArrowUpFromLine',
    standard: {
      purpose: '评估下肢爆发力和全身协调发力能力——起跳、争顶的核心力量基础',
      method: [
        '站在起跳线后，双脚与肩同宽，可以摆臂预摆但不允许垫步',
        '双脚同时蹬地起跳，落地时测量起跳线到脚跟最近接触点的垂直距离',
        '每人测试2次，取最远成绩'
      ],
      equipment: '沙坑或软垫、卷尺/跳远测量仪、起跳线（地面标记）',
      rules: [
        '小跳一下再起跳（垫步）= 犯规',
        '落地后向后摔倒以后方手/臀着地点为准'
      ],
      commonMistake: '❌ 小跳一下再跳（垫步犯规）→ ✅ 双脚原地直接起跳，无任何预位移',
      tips: ['摆臂动作很重要：手臂向后摆→向前上方带动起跳', '起跳角度约20-25度效果最佳'],
    },
  },
  {
    key: 'vertical_jump',
    label: '纵跳',
    unit: 'cm',
    category: 'power',
    categoryName: '爆发',
    lowerIsBetter: false,
    icon: 'ArrowUp',
    standard: {
      purpose: '评估下肢垂直爆发力和弹跳能力——头球争顶的关键指标',
      method: [
        '【推荐】使用纵跳墙/电子仪：侧身靠近纵跳板，单手沾粉',
        '先测量站立摸高（手臂充分上伸），然后原地双脚用力纵跳触摸最高点',
        '纵跳高度 = 跳跃摸高 - 站立摸高，每人2次，取最高值'
      ],
      equipment: 'Vertec纵跳仪 / 纵跳墙+刻度尺 / 电子纵跳垫',
      rules: ['必须双脚原地起跳', '不允许垫步或助跑', '跳跃时身体不得触碰辅助装置'],
      commonMistake: '❌ 助跑起跳 → ✅ 必须双脚原地起跳，不允许任何预位移',
      tips: ['简易版：在墙面贴刻度尺，用粉笔涂抹手指后手动读取差值', '与立定跳远配合可全面评估下肢爆发力'],
    },
  },

  // ──────────────────────────────────────
  // 柔韧类
  // ──────────────────────────────────────
  {
    key: 'sit_and_reach',
    label: '坐位体前屈',
    unit: 'cm',
    category: 'flexibility',
    categoryName: '柔韧',
    lowerIsBetter: false,
    icon: 'StretchHorizontal',
    standard: {
      purpose: '评估躯干和腿后侧柔韧性（髋关节与脊柱灵活性），影响射门动作幅度和受伤风险',
      method: [
        '坐在地面/测试台上，双腿伸直并拢，脚掌抵住测试盒挡板',
        '上身缓慢前倾，双手尽量向前推动游标',
        '保持姿势2秒不动，读取指尖到达的刻度（正值=超出脚底，负值=未到达）'
      ],
      equipment: '坐位体前屈测试仪（或自制：长凳+直尺）、瑜伽垫',
      rules: [
        '测试前应有5-10分钟的热身（动态拉伸）',
        '膝盖不能弯曲',
        '前倾要缓慢均匀，不要猛冲反弹'
      ],
      commonMistake: '❌ 用力猛冲导致反弹读数不准 → ✅ 缓慢前推，稳住2秒再读数',
      tips: ['足球运动员普遍此项偏弱，需持续拉伸训练', '正值>15cm为良好水平'],
    },
  },

  // ──────────────────────────────────────
  // 力量类
  // ──────────────────────────────────────
  {
    key: 'push_up',
    label: '俯卧撑',
    unit: '个',
    category: 'strength',
    categoryName: '力量',
    lowerIsBetter: false,
    icon: 'Dumbbell',
    standard: {
      purpose: '评估上肢推力、胸肌和核心稳定性——对抗和护球的身体基础',
      method: [
        '双手略宽于肩撑地，身体从头到脚跟呈一条直线',
        '下降至胸部接近地面（肘关节约90°），然后用力推回起始位置',
        '连续完成尽可能多的次数（做到力竭为止），记录总次数'
      ],
      equipment: '平整地面/瑜伽垫（无需其他器械）',
      rules: [
        '每次：胸部必须接近地面；推起时手臂伸直但不超伸',
        '身体始终保持直线（不能塌腰/撅臀）',
        '中间不允许长时间休息（>3秒则停止计数）'
      ],
      commonMistake: '❌ 只做了半程（没下到位）→ ✅ 每次胸部必须接近地面才计数',
      tips: [
        'U12可采用跪姿俯卧撑（膝盖着地），但需在备注中标注',
        '核心收紧是做好俯卧撑的关键：想象肚脐往脊柱方向吸'
      ],
    },
  },
  {
    key: 'sit_up',
    label: '仰卧起坐',
    unit: '个/分钟',
    category: 'strength',
    categoryName: '力量',
    lowerIsBetter: false,
    icon: 'Activity',
    standard: {
      purpose: '评估核心肌群耐力（腹肌力量）——快速转身、平衡对抗的基础',
      method: [
        '仰卧于垫子上，双膝弯曲约90°，双脚固定（他人压脚踝或器械固定）',
        '双手交叉置于胸前或耳侧',
        '严格在1分钟内完成尽可能多的完整次数'
      ],
      equipment: '瑜伽垫、固定双脚的方式（同伴/器械）、秒表',
      rules: [
        '**时间限制：严格1分钟**，超出的不计入',
        '完整定义：仰卧时肩胛骨触垫 ↔ 坐起时双肘触碰或超过大腿根部',
        '双手不得拉头颈部借力；臀部不得离垫'
      ],
      commonMistake: '❌ 做得太快只做半程（没躺下去就起来）→ ✅ 每次要肩胛骨触垫+手肘过膝才算1个',
      tips: ['节奏建议：匀速做比忽快忽慢得分更高', '呼气时起身，吸气时放下'],
    },
  },
  {
    key: 'plank',
    label: '平板支撑',
    unit: '秒',
    category: 'strength',
    categoryName: '力量',
    lowerIsBetter: false,
    icon: 'Dumbbell',
    standard: {
      purpose: '评估核心静力性耐力和抗疲劳能力——维持比赛姿态稳定性的关键',
      method: [
        '以双肘和前臂支撑身体，脚尖着地',
        '身体从头到脚跟呈一条直线（可请旁人从侧面检查）',
        '保持姿势直到无法坚持，记录持续时间（秒）'
      ],
      equipment: '瑜伽垫、秒表',
      rules: [
        '**终止条件**（任一出现即停）：臀部明显下沉/上拱；腰部明显疼痛；无法保持直线超3秒',
        '不要为了追求时间长而牺牲正确姿势'
      ],
      commonMistake: '❌ 臀部翘太高（像登山姿势）→ ✅ 头、背、臀、腿必须成一条直线',
      tips: [
        '收紧腹部（像准备被人轻轻打一拳的感觉）是关键',
        '初学者目标：30秒为合格，60秒为良好，120秒以上为优秀'
      ],
    },
  },
];

// ===== 工具函数 =====

/** 根据 key 查找配置项 */
export function getTestItem(key: string): PhysicalTestItemDef | undefined {
  return PHYSICAL_TEST_ITEMS.find(item => item.key === key);
}

/** 获取指定分类的所有项目 */
export function getItemsByCategory(category: TestCategory): PhysicalTestItemDef[] {
  return PHYSICAL_TEST_ITEMS.filter(item => item.category === category);
}

/** 获取所有分类（去重有序） */
export function getAllCategories(): TestCategory[] {
  const seen = new Set<TestCategory>();
  const result: TestCategory[] = [];
  for (const item of PHYSICAL_TEST_ITEMS) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      result.push(item.category);
    }
  }
  return result;
}

/** 排除基础类（身高/BMI），获取纯体测项目列表 */
export function getPureTestItems(): PhysicalTestItemDef[] {
  return PHYSICAL_TEST_ITEMS.filter(item => item.category !== 'basic');
}
