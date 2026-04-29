import React, { useState, useRef } from 'react';
import type { UserRole } from '../../../types/auth';
import { User, MapPin, Calendar, MessageSquare, ArrowRight, ArrowLeft, Upload, Globe, UserRound, UserRoundCheck } from 'lucide-react';
import { roleThemes } from './theme.config';

// 中国省份数据
const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾',
];

// 中国主要城市数据（按省份）
const citiesByProvince: Record<string, string[]> = {
  '北京': ['北京市'],
  '天津': ['天津市'],
  '河北': ['石家庄', '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水'],
  '山西': ['太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁'],
  '内蒙古': ['呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布', '兴安盟', '锡林郭勒', '阿拉善'],
  '辽宁': ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛'],
  '吉林': ['长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边'],
  '黑龙江': ['哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭'],
  '上海': ['上海市'],
  '江苏': ['南京', '无锡', '徐州', '常州', '苏州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁'],
  '浙江': ['杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水'],
  '安徽': ['合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城'],
  '福建': ['福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德'],
  '江西': ['南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶'],
  '山东': ['济南', '青岛', '淄博', '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '莱芜', '临沂', '德州', '聊城', '滨州', '菏泽'],
  '河南': ['郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店'],
  '湖北': ['武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施', '仙桃', '潜江', '天门', '神农架'],
  '湖南': ['长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西'],
  '广东': ['广州', '深圳', '珠海', '汕头', '韶关', '佛山', '江门', '湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮'],
  '广西': ['南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左'],
  '海南': ['海口', '三亚', '三沙', '儋州', '五指山', '琼海', '文昌', '万宁', '东方', '定安', '屯昌', '澄迈', '临高', '白沙', '昌江', '乐东', '陵水', '保亭', '琼中'],
  '重庆': ['重庆市'],
  '四川': ['成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝', '甘孜', '凉山'],
  '贵州': ['贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南'],
  '云南': ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆'],
  '西藏': ['拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里'],
  '陕西': ['西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛'],
  '甘肃': ['兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南'],
  '青海': ['西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西'],
  '宁夏': ['银川', '石嘴山', '吴忠', '固原', '中卫'],
  '新疆': ['乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰', '石河子', '阿拉尔', '图木舒克', '五家渠', '北屯', '铁门关', '双河', '可克达拉', '昆玉', '胡杨河', '新星'],
  '台湾': ['台北', '新北', '桃园', '台中', '台南', '高雄', '基隆', '新竹', '嘉义', '宜兰', '苗栗', '彰化', '南投', '云林', '屏东', '台东', '花莲', '澎湖'],
};

// 海外主要国家（常用）
const overseasCountries = [
  '日本', '韩国', '新加坡', '马来西亚', '泰国', '菲律宾', '印度尼西亚', '越南',
  '英国', '法国', '德国', '意大利', '西班牙', '荷兰', '比利时', '瑞士', '瑞典', '挪威', '丹麦', '芬兰',
  '美国', '加拿大', '墨西哥',
  '澳大利亚', '新西兰',
  '巴西', '阿根廷', '智利', '秘鲁',
  '南非', '埃及', '尼日利亚',
  '俄罗斯', '乌克兰', '波兰', '捷克',
  '阿联酋', '沙特阿拉伯', '以色列', '土耳其',
  '其他',
];

// 教练执教位置选项
const coachPositionOptions = [
  { value: '守门员教练', label: '守门员教练' },
  { value: '后卫教练', label: '后卫教练' },
  { value: '中场教练', label: '中场教练' },
  { value: '前锋教练', label: '前锋教练' },
  { value: '体能教练', label: '体能教练' },
  { value: '战术教练', label: '战术教练' },
  { value: '技术教练', label: '技术教练' },
  { value: '青训教练', label: '青训教练' },
  { value: '主教练', label: '主教练' },
  { value: '助理教练', label: '助理教练' },
];

// 角色配置：决定显示哪些字段
const roleConfig: Record<string, {
  title: string;
  subtitle: string;
  fields: ('avatar' | 'nickname' | 'realName' | 'birthDate' | 'gender' | 'region' | 'signature' | 'position')[];
  labels: Record<string, string>;
}>
= {
  player: {
    title: '基础档案',
    subtitle: '完善您的个人资料',
    fields: ['avatar', 'nickname', 'realName', 'birthDate', 'gender', 'region', 'signature'],
    labels: {
      avatar: '头像',
      nickname: '球员昵称',
      realName: '真实姓名',
      birthDate: '出生日期',
      gender: '性别',
      region: '所在城市',
      signature: '个性签名',
    },
  },
  analyst: {
    title: '基础档案',
    subtitle: '完善您的分析师资料',
    fields: ['avatar', 'realName', 'birthDate', 'gender', 'region', 'signature'],
    labels: {
      avatar: '头像',
      realName: '真实姓名',
      birthDate: '出生日期',
      gender: '性别',
      region: '所在城市',
      signature: '个人简介',
    },
  },
  club: {
    title: '基础档案',
    subtitle: '完善俱乐部基本信息',
    fields: ['avatar', 'nickname', 'region', 'signature'],
    labels: {
      avatar: '俱乐部Logo',
      nickname: '俱乐部简称',
      region: '所在城市',
      signature: '俱乐部简介',
    },
  },
  coach: {
    title: '基础档案',
    subtitle: '完善您的教练资料',
    fields: ['avatar', 'realName', 'birthDate', 'gender', 'region', 'signature', 'position'],
    labels: {
      avatar: '头像',
      realName: '真实姓名',
      birthDate: '出生日期',
      gender: '性别',
      region: '所在城市',
      signature: '执教理念',
      position: '执教位置',
    },
  },
  scout: {
    title: '基础档案',
    subtitle: '完善您的球探资料',
    fields: ['avatar', 'realName', 'birthDate', 'gender', 'region', 'signature'],
    labels: {
      avatar: '头像',
      realName: '真实姓名',
      birthDate: '出生日期',
      gender: '性别',
      region: '所在城市',
      signature: '球探简介',
    },
  },
};

export interface BaseInfoData {
  avatar?: string;
  nickname?: string;
  realName?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  regionType?: 'domestic' | 'overseas';
  province?: string;
  city?: string;
  country?: string;
  overseasCity?: string;
  signature?: string;
  bio?: string;
  position?: string;  // 执教位置（教练用）
}

interface Step3BaseInfoProps {
  role: UserRole;
  onNext: (data: BaseInfoData) => void;
  onBack: () => void;
  defaultValues?: Partial<BaseInfoData>;
}

const Step3BaseInfo: React.FC<Step3BaseInfoProps> = ({ role, onNext, onBack, defaultValues }) => {
  const config = roleConfig[role] || roleConfig.player;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<BaseInfoData>({
    avatar: defaultValues?.avatar || '',
    nickname: defaultValues?.nickname || '',
    realName: defaultValues?.realName || '',
    birthDate: defaultValues?.birthDate || '',
    gender: defaultValues?.gender || undefined,
    regionType: defaultValues?.regionType || 'domestic',
    province: defaultValues?.province || '',
    city: defaultValues?.city || '',
    country: defaultValues?.country || '',
    overseasCity: defaultValues?.overseasCity || '',
    signature: defaultValues?.signature || defaultValues?.bio || '',
    position: defaultValues?.position || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BaseInfoData, string>>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (field: keyof BaseInfoData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // 切换省份时重置城市
      if (field === 'province') {
        newData.city = '';
      }
      // 切换区域类型时重置相关字段
      if (field === 'regionType') {
        newData.province = '';
        newData.city = '';
        newData.country = '';
        newData.overseasCity = '';
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BaseInfoData, string>> = {};

    if (config.fields.includes('nickname') && !formData.nickname?.trim()) {
      newErrors.nickname = `请填写${config.labels.nickname}`;
    }
    if (config.fields.includes('realName') && !formData.realName?.trim()) {
      newErrors.realName = `请填写${config.labels.realName}`;
    }
    if (config.fields.includes('birthDate') && !formData.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    if (config.fields.includes('gender') && !formData.gender) {
      newErrors.gender = '请选择性别';
    }
    if (config.fields.includes('position') && !formData.position?.trim()) {
      newErrors.position = `请选择${config.labels.position}`;
    }
    if (config.fields.includes('region')) {
      if (formData.regionType === 'domestic') {
        if (!formData.province) newErrors.province = '请选择省份';
        if (!formData.city?.trim()) newErrors.city = '请输入城市';
      } else {
        if (!formData.country) newErrors.country = '请选择国家';
        if (!formData.overseasCity?.trim()) newErrors.overseasCity = '请输入城市';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext(formData);
    }
  };

  // 获取角色主题
  const theme = roleThemes[role] || roleThemes.player;

  // 渲染头像上传
  const renderAvatar = () => (
    <div className="flex flex-col items-center lg:items-start mb-4 sm:mb-5">
      <label className={`${theme.textSecondary} font-medium mb-2 sm:mb-3 text-sm text-center lg:text-left`}>
        {config.labels.avatar} <span className="text-white/40">（选填）</span>
      </label>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, avatar: '请选择图片文件' }));
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, avatar: '图片大小不能超过5MB' }));
                return;
              }
              setIsUploading(true);
              setErrors(prev => ({ ...prev, avatar: undefined }));

              // 本地压缩为 base64（注册时随表单一起提交，无需先上传）
              const reader = new FileReader();
              reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const maxSize = 400;
                  let { width, height } = img;
                  if (width > maxSize || height > maxSize) {
                    if (width > height) {
                      height = Math.round((height * maxSize) / width);
                      width = maxSize;
                    } else {
                      width = Math.round((width * maxSize) / height);
                      height = maxSize;
                    }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  const base64 = canvas.toDataURL('image/jpeg', 0.8);
                  handleChange('avatar', base64);
                  setIsUploading(false);
                };
                img.onerror = () => {
                  setErrors(prev => ({ ...prev, avatar: '图片读取失败' }));
                  setIsUploading(false);
                };
                img.src = ev.target?.result as string;
              };
              reader.onerror = () => {
                setErrors(prev => ({ ...prev, avatar: '图片读取失败' }));
                setIsUploading(false);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-white/10 border-2 border-dashed ${theme.border} flex items-center justify-center cursor-pointer hover:border-${theme.primary}/50 transition-colors overflow-hidden relative`}
        >
          {formData.avatar ? (
            <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white/30" />
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r ${theme.gradient} rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-colors`}
        >
          {formData.avatar ? (
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          ) : (
            <span className="text-white text-base sm:text-lg">+</span>
          )}
        </div>
      </div>
      {errors.avatar && <p className="mt-2 text-red-400 text-xs text-center lg:text-left">{errors.avatar}</p>}
      <p className={`mt-2 ${theme.textMuted} text-xs text-center lg:text-left`}>点击上传，支持 JPG/PNG</p>
    </div>
  );

  // 渲染输入框
  const renderInput = (field: keyof BaseInfoData, label: string, placeholder: string, type: string = 'text') => (
    <div>
      <label className={`block ${theme.textSecondary} font-medium mb-1.5 text-sm`}>
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type={type}
        value={formData[field] || ''}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all ${
          errors[field] ? 'border-red-500/50' : theme.border
        }`}
      />
      {errors[field] && <p className="mt-1 text-red-400 text-xs">{errors[field]}</p>}
    </div>
  );

  // 渲染日期选择
  const renderDatePicker = () => (
    <div>
      <label className={`block ${theme.textSecondary} font-medium mb-1.5 text-sm`}>
        {config.labels.birthDate} <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
        <input
          type="date"
          value={formData.birthDate || ''}
          onChange={(e) => handleChange('birthDate', e.target.value)}
          className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all ${
            errors.birthDate ? 'border-red-500/50' : theme.border
          }`}
        />
      </div>
      {errors.birthDate && <p className="mt-1 text-red-400 text-xs">{errors.birthDate}</p>}
    </div>
  );

  // 渲染性别选择
  const renderGender = () => (
    <div>
      <label className={`block ${theme.textSecondary} font-medium mb-1.5 text-sm`}>
        {config.labels.gender} <span className="text-red-400">*</span>
      </label>
      <div className="flex gap-3">
        {[
          { value: 'male', label: '男', icon: UserRound },
          { value: 'female', label: '女', icon: UserRoundCheck },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange('gender', option.value)}
            className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm ${
              formData.gender === option.value
                ? `border-${theme.primary} ${theme.bgCard} ${theme.textPrimary}`
                : `${theme.border} bg-white/5 ${theme.textSecondary} hover:border-${theme.primary}/30`
            }`}
          >
            <option.icon className="w-5 h-5" />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {errors.gender && <p className="mt-1 text-red-400 text-xs">{errors.gender}</p>}
    </div>
  );

  // 渲染执教位置选择（教练用）
  const renderPosition = () => (
    <div>
      <label className={`block ${theme.textSecondary} font-medium mb-1.5 text-sm`}>
        {config.labels.position} <span className="text-red-400">*</span>
      </label>
      <select
        value={formData.position || ''}
        onChange={(e) => handleChange('position', e.target.value)}
        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none ${
          errors.position ? 'border-red-500/50' : theme.border
        }`}
      >
        <option value="" className="bg-slate-800">选择执教位置</option>
        {coachPositionOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
        ))}
      </select>
      {errors.position && <p className="mt-1 text-red-400 text-xs">{errors.position}</p>}
    </div>
  );

  // 渲染地区选择
  const renderRegion = () => (
    <div className="lg:col-span-2">
      <label className={`block ${theme.textSecondary} font-medium mb-2 text-sm`}>
        {config.labels.region} <span className="text-red-400">*</span>
      </label>
      {/* 区域类型切换 */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleChange('regionType', 'domestic')}
          className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm ${
            formData.regionType === 'domestic'
              ? `border-${theme.primary} ${theme.bgCard} ${theme.textPrimary}`
              : `${theme.border} bg-white/5 ${theme.textSecondary} hover:border-${theme.primary}/30`
          }`}
        >
          <MapPin className="w-4 h-4" />
          中国
        </button>
        <button
          type="button"
          onClick={() => handleChange('regionType', 'overseas')}
          className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm ${
            formData.regionType === 'overseas'
              ? `border-${theme.primary} ${theme.bgCard} ${theme.textPrimary}`
              : `${theme.border} bg-white/5 ${theme.textSecondary} hover:border-${theme.primary}/30`
          }`}
        >
          <Globe className="w-4 h-4" />
          海外
        </button>
      </div>

      {/* 国内选择 */}
      {formData.regionType === 'domestic' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <select
              value={formData.province || ''}
              onChange={(e) => handleChange('province', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none ${
                errors.province ? 'border-red-500/50' : theme.border
              }`}
            >
              <option value="" className="bg-slate-800">选择省份</option>
              {provinces.map((p) => (
                <option key={p} value={p} className="bg-slate-800">{p}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <select
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={!formData.province}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.city ? 'border-red-500/50' : theme.border
              }`}
            >
              <option value="" className="bg-slate-800">
                {formData.province ? '选择城市' : '请先选择省份'}
              </option>
              {formData.province && citiesByProvince[formData.province]?.map((city) => (
                <option key={city} value={city} className="bg-slate-800">{city}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 海外选择 */}
      {formData.regionType === 'overseas' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-${theme.primary}`} />
            <select
              value={formData.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all appearance-none ${
                errors.country ? 'border-red-500/50' : theme.border
              }`}
            >
              <option value="" className="bg-slate-800">选择国家</option>
              {overseasCountries.map((c) => (
                <option key={c} value={c} className="bg-slate-800">{c}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={formData.overseasCity || ''}
            onChange={(e) => handleChange('overseasCity', e.target.value)}
            placeholder="输入城市"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all ${
              errors.overseasCity ? 'border-red-500/50' : theme.border
            }`}
          />
        </div>
      )}

      {(errors.province || errors.city || errors.country || errors.overseasCity) && (
        <p className="mt-1 text-red-400 text-xs">
          {errors.province || errors.city || errors.country || errors.overseasCity}
        </p>
      )}
    </div>
  );

  // 渲染签名
  const renderSignature = () => (
    <div className="lg:col-span-2">
      <label className={`block ${theme.textSecondary} font-medium mb-2 text-sm`}>
        {config.labels.signature} <span className="text-white/40">（选填）</span>
      </label>
      <div className="relative">
        <MessageSquare className={`absolute left-4 top-3 w-5 h-5 text-${theme.primary}`} />
        <textarea
          value={formData.signature || ''}
          onChange={(e) => handleChange('signature', e.target.value)}
          placeholder={`请输入${config.labels.signature}`}
          rows={3}
          maxLength={100}
          className={`w-full pl-12 pr-4 py-3 bg-white/5 border ${theme.border} rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-${theme.primary}/50 focus:bg-white/10 transition-all resize-none`}
        />
      </div>
      <p className={`text-right ${theme.textMuted} text-xs mt-1`}>
        {(formData.signature?.length || 0)}/100
      </p>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 标题 */}
      <div className="text-center mb-4 sm:mb-6">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 bg-gradient-to-br ${theme.gradient} rounded-xl flex items-center justify-center shadow-lg ${theme.shadow}`}>
          <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${theme.textPrimary} mb-1.5`}>{config.title}</h2>
        <p className={`${theme.textSecondary} text-sm`}>{config.subtitle}</p>
      </div>

      {/* 表单内容 - PC端两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-[140px_1fr] gap-6 lg:gap-8">
        {/* 头像区域 */}
        {config.fields.includes('avatar') && (
          <div className="flex justify-center lg:justify-start">
            {renderAvatar()}
          </div>
        )}

        {/* 表单字段区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {config.fields.includes('nickname') && (
            renderInput('nickname', config.labels.nickname, `请输入${config.labels.nickname}`)
          )}
          
          {config.fields.includes('realName') && (
            renderInput('realName', config.labels.realName, `请输入${config.labels.realName}`)
          )}
          
          {config.fields.includes('birthDate') && renderDatePicker()}

          {config.fields.includes('gender') && renderGender()}

          {config.fields.includes('position') && renderPosition()}

          {config.fields.includes('region') && renderRegion()}
          
          {config.fields.includes('signature') && renderSignature()}
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
        <button
          type="button"
          onClick={onBack}
          className={`flex-1 py-3 sm:py-4 bg-white/5 border ${theme.border} hover:bg-white/10 ${theme.textPrimary} font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base`}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          上一步
        </button>
        <button
          type="button"
          onClick={handleNext}
          className={`flex-1 py-3 sm:py-4 bg-gradient-to-r ${theme.gradient} hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base ${theme.shadow}`}
        >
          下一步
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default Step3BaseInfo;
