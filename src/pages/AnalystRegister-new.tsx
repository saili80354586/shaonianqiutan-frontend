import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, DollarSign, Users, Award, Briefcase, ArrowLeft, Sparkles, TrendingUp, Clock, Star, FileText, Video, BarChart3, Wallet } from 'lucide-react';
import { analystApplicationApi } from '../services/api';

const cityData: Record<string, string[]> = {
  beijing: ['北京市'],
  shanghai: ['上海市'],
  tianjin: ['天津市'],
  chongqing: ['重庆市'],
  hebei: ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
  shanxi: ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
  liaoning: ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
  jilin: ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市', '延边朝鲜族自治州'],
  heilongjiang: ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市', '大兴安岭地区'],
  jiangsu: ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  zhejiang: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
  anhui: ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'],
  fujian: ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'],
  jiangxi: ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'],
  shandong: ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
  henan: ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市'],
  hubei: ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施土家族苗族自治州'],
  hunan: ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'],
  guangdong: ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
  hainan: ['海口市', '三亚市', '三沙市', '儋州市'],
  sichuan: ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'],
  guizhou: ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'],
  yunnan: ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'],
  shaanxi: ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'],
  gansu: ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏回族自治州', '甘南藏族自治州'],
  qinghai: ['西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'],
  taiwan: ['台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉义市'],
  neimenggu: ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'],
  guangxi: ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
  xizang: ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'],
  ningxia: ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  xinjiang: ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区'],
  hongkong: ['香港特别行政区'],
  macau: ['澳门特别行政区'],
};

const provinces = [
  { value: '', label: '请选择省份' },
  { value: 'beijing', label: '北京市' },
  { value: 'shanghai', label: '上海市' },
  { value: 'tianjin', label: '天津市' },
  { value: 'chongqing', label: '重庆市' },
  { value: 'hebei', label: '河北省' },
  { value: 'shanxi', label: '山西省' },
  { value: 'liaoning', label: '辽宁省' },
  { value: 'jilin', label: '吉林省' },
  { value: 'heilongjiang', label: '黑龙江省' },
  { value: 'jiangsu', label: '江苏省' },
  { value: 'zhejiang', label: '浙江省' },
  { value: 'anhui', label: '安徽省' },
  { value: 'fujian', label: '福建省' },
  { value: 'jiangxi', label: '江西省' },
  { value: 'shandong', label: '山东省' },
  { value: 'henan', label: '河南省' },
  { value: 'hubei', label: '湖北省' },
  { value: 'hunan', label: '湖南省' },
  { value: 'guangdong', label: '广东省' },
  { value: 'hainan', label: '海南省' },
  { value: 'sichuan', label: '四川省' },
  { value: 'guizhou', label: '贵州省' },
  { value: 'yunnan', label: '云南省' },
  { value: 'shaanxi', label: '陕西省' },
  { value: 'gansu', label: '甘肃省' },
  { value: 'qinghai', label: '青海省' },
  { value: 'taiwan', label: '台湾省' },
  { value: 'neimenggu', label: '内蒙古自治区' },
  { value: 'guangxi', label: '广西壮族自治区' },
  { value: 'xizang', label: '西藏自治区' },
  { value: 'ningxia', label: '宁夏回族自治区' },
  { value: 'xinjiang', label: '新疆维吾尔自治区' },
  { value: 'hongkong', label: '香港特别行政区' },
  { value: 'macau', label: '澳门特别行政区' },
];

const AnalystRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    country: 'china',
    province: '',
    city: '',
    isProPlayer: '',
    hasCase: '',
    caseDetail: '',
    contact: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const availableCities = formData.province ? cityData[formData.province] || [] : [];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致，请重新输入');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (!formData.name || !formData.age || !formData.country || !formData.province || !formData.city || 
        !formData.isProPlayer || !formData.hasCase || !formData.contact) {
      setError('请填写所有必填项');
      return;
    }

    try {
      setLoading(true);
      setError('');
      // 按照后端API要求的格式发送，age作为经验字段传递
      await analystApplicationApi.apply({
        name: formData.name,
        phone: formData.contact,
        email: '',
        experience: String(formData.age),
        resume: `${formData.country} ${formData.province} ${formData.city}\n职业球员: ${formData.isProPlayer}\n有案例: ${formData.hasCase}\n案例说明: ${formData.caseDetail}`,
      });
      navigate('/analyst/apply-success');
    } catch (err: any) {
      setError(err.response?.data?.error || '提交申请失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '50px 50px'}} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/become-analyst" className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>返回招募页</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-white/80 text-sm">安全申请</span>
          </div>
        </div>
      </nav>
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="max-w-[600px] mx-auto bg-white rounded-[20px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-8">
            <h1 className="text-primary text-2xl font-bold mb-2">分析师入驻申请</h1>
            <p className="text-text-muted">加入我们的专业分析师团队</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                姓名 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入您的真实姓名"
                required
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                年龄 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', Number(e.target.value))}
                placeholder="请输入年龄"
                min={18}
                max={70}
                required
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  国家/地区 <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">请选择</option>
                  <option value="china">中国</option>
                  <option value="hongkong">中国香港</option>
                  <option value="macau">中国澳门</option>
                  <option value="taiwan">中国台湾</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  省份 <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  required
                  disabled={formData.country !== 'china'}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                >
                  {provinces.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">
                  城市 <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                  disabled={!formData.province}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">请先选择省份</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                是否是职业足球运动员 <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isProPlayer"
                    value="yes"
                    checked={formData.isProPlayer === 'yes'}
                    onChange={(e) => handleInputChange('isProPlayer', e.target.value)}
                    required
                    className="w-5 h-5 accent-accent"
                  />
                  <span className="text-primary">是</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isProPlayer"
                    value="no"
                    checked={formData.isProPlayer === 'no'}
                    onChange={(e) => handleInputChange('isProPlayer', e.target.value)}
                    required
                    className="w-5 h-5 accent-accent"
                  />
                  <span className="text-primary">否</span>
                </label>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                是否有视频分析案例 <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasCase"
                    value="yes"
                    checked={formData.hasCase === 'yes'}
                    onChange={(e) => handleInputChange('hasCase', e.target.value)}
                    required
                    className="w-5 h-5 accent-accent"
                  />
                  <span className="text-primary">是</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasCase"
                    value="no"
                    checked={formData.hasCase === 'no'}
                    onChange={(e) => handleInputChange('hasCase', e.target.value)}
                    required
                    className="w-5 h-5 accent-accent"
                  />
                  <span className="text-primary">否</span>
                </label>
              </div>
            </div>

            {formData.hasCase === 'yes' && (
              <div className="mb-5">
                <label className="block text-primary font-semibold mb-2 text-sm">案例描述/链接</label>
                <textarea
                  value={formData.caseDetail}
                  onChange={(e) => handleInputChange('caseDetail', e.target.value)}
                  placeholder="请描述您的视频分析案例，或提供案例链接"
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors min-h-[100px] resize-y font-inherit"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                联系方式（手机/邮箱） <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                placeholder="请输入手机号或邮箱"
                required
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                登录密码 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="请设置登录密码（至少6位）"
                required
                minLength={6}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="mb-5">
              <label className="block text-primary font-semibold mb-2 text-sm">
                确认密码 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="请再次输入密码"
                required
                minLength={6}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-accent text-white border-none rounded-xl text-lg font-semibold cursor-pointer transition-all hover:bg-accent-light"
            >
              {loading ? '提交中...' : '提交申请'}
            </button>
          </form>

          <div className="text-center mt-6 text-text-muted">
            已有账号？<Link to="/login" className="text-accent font-semibold no-underline">分析师登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystRegister;
