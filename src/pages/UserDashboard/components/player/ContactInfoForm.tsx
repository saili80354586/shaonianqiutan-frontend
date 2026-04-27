import React from 'react';
import { MapPin, Phone, MessageCircle, GraduationCap } from 'lucide-react';

const PROVINCES = [
  '北京市', '上海市', '天津市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
  '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区'
];

interface ContactData {
  province: string;
  city: string;
  wechat: string;
  school: string;
}

interface ContactInfoFormProps {
  isEditing: boolean;
  phone?: string;
  formData: ContactData;
  onChange: (field: string, value: any) => void;
}

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ isEditing, phone, formData, onChange }) => {
  const maskPhone = (p?: string) => p ? p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '';

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-400" />
        联系信息
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 手机号（不可修改） */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            <Phone className="w-4 h-4 inline mr-1" />
            手机号
          </label>
          <p className="text-white py-3">{maskPhone(phone) || '未绑定'}</p>
        </div>

        {/* 微信 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            <MessageCircle className="w-4 h-4 inline mr-1" />
            微信
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.wechat}
              onChange={e => onChange('wechat', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="填写微信号"
            />
          ) : (
            <p className="text-white py-3">{formData.wechat || <span className="text-slate-500">未填写</span>}</p>
          )}
        </div>

        {/* 学校 */}
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-400 mb-1">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            学校
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.school}
              onChange={e => onChange('school', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="填写学校名称"
            />
          ) : (
            <p className="text-white py-3">{formData.school || <span className="text-slate-500">未填写</span>}</p>
          )}
        </div>

        {/* 省份 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">省份</label>
          {isEditing ? (
            <select
              value={formData.province}
              onChange={e => onChange('province', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            >
              <option value="">选择省份</option>
              {PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <p className="text-white py-3">{formData.province || <span className="text-slate-500">未选择</span>}</p>
          )}
        </div>

        {/* 城市 */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">城市</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.city}
              onChange={e => onChange('city', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
              placeholder="填写城市"
            />
          ) : (
            <p className="text-white py-3">{formData.city || <span className="text-slate-500">未填写</span>}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoForm;
