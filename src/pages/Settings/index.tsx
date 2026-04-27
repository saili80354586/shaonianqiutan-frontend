import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Eye, Lock, Phone, Monitor, Save, Loader2, Camera, Trash2, Smartphone } from 'lucide-react';
import { userApi, settingsApi, authApi, uploadApi, clubApi, scoutApi, analystApi, playerApi } from '../../services/api';
import { coachApi } from '../../services/club';
import { useAuthStore } from '../../store';
import { toast } from 'sonner';

type TabKey = 'profile' | 'role' | 'security' | 'notifications' | 'devices';

const ROLE_LABELS: Record<string, string> = { user: '球员', analyst: '分析师', club: '俱乐部', coach: '教练', scout: '球探', admin: '管理员' };
const POSITIONS = ['门将','后卫','中后卫','左后卫','右后卫','边后卫','中场','后腰','前腰','中前卫','左前卫','右前卫','前锋','中锋','左边锋','右边锋'];
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'role', label: '角色资料', icon: Shield },
  { key: 'security', label: '账号安全', icon: Lock },
  { key: 'notifications', label: '通知与隐私', icon: Bell },
  { key: 'devices', label: '登录设备', icon: Monitor },
];

// Shared compact form components
const F = ({ label, value, onChange, type = 'text', placeholder, maxLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; maxLength?: number }) => (
  <div>
    <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
  </div>
);

const S = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div>
    <label className="block text-slate-400 text-sm mb-1.5">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TG = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
    <div>
      <p className="text-white text-sm">{label}</p>
      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

const normalizeListText = (value: unknown): string => {
  if (Array.isArray(value)) return value.filter(Boolean).join('，');
  if (value === null || value === undefined) return '';
  return String(value);
};

const pickData = (res: any) => res?.data?.data || {};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth, updateUser } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ nickname: '', name: '', gender: '', birth_date: '', province: '', city: '', avatar: '', phone: '', role: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [roleProfile, setRoleProfile] = useState<Record<string, any>>({});
  const [pwd, setPwd] = useState({ old: '', new: '', confirm: '' });
  const [phoneForm, setPhoneForm] = useState({ new_phone: '', code: '' });
  const [codeCD, setCodeCD] = useState(0);
  const [notif, setNotif] = useState({ system_announcements: true, order_status: true, weekly_report: true, social_interaction: true, private_message: true, email_notification: true });
  const [privacy, setPrivacy] = useState({ profile_visible: true, phone_visible: true, allow_search: true, show_real_name: true });
  const [devices, setDevices] = useState<any[]>([]);

  const role = user?.role || 'user';

  const loadRoleProfile = useCallback(async (currentRole: string) => {
    if (currentRole === 'admin') {
      setRoleProfile({});
      return;
    }

    try {
      if (currentRole === 'user') {
        const res = await playerApi.getProfile();
        const p = pickData(res).profile || {};
        setRoleProfile({
          position: p.position || '',
          second_position: p.second_position || '',
          foot: p.dominant_foot || p.foot || '',
          height: p.height || '',
          weight: p.weight || '',
          club: p.club || p.school || '',
          school: p.school || '',
          current_team: p.current_team || '',
          wechat: p.wechat || '',
        });
      } else if (currentRole === 'coach') {
        const res = await coachApi.getProfile();
        const data = pickData(res);
        const c = data.coach || {};
        setRoleProfile({
          license_level: c.license_type || '',
          license_number: c.license_number || '',
          coach_type: data.position || '',
          coach_experience: c.coaching_years ? String(c.coaching_years) : '',
          coach_specialty: normalizeListText(c.specialties),
          current_team: c.current_club || '',
          club: c.current_club || '',
        });
      } else if (currentRole === 'scout') {
        const res = await scoutApi.getProfile();
        const scout = pickData(res);
        setRoleProfile({
          current_organization: scout.current_organization || '',
          scouting_experience: scout.scouting_experience || '',
          scouting_regions: normalizeListText(scout.scouting_regions),
          preferred_age_groups: normalizeListText(scout.preferred_age_groups),
          scouting_specialty: normalizeListText(scout.specialties),
        });
      } else if (currentRole === 'analyst') {
        const res = await analystApi.getMyProfile();
        const analyst = pickData(res).analyst || {};
        setRoleProfile({
          profession: analyst.profession || '',
          experience: analyst.experience ? String(analyst.experience) : '',
          bio: analyst.bio || '',
          specialty: analyst.specialty || '',
        });
      } else if (currentRole === 'club') {
        const res = await clubApi.getProfile();
        const club = pickData(res);
        setRoleProfile({
          name: club.name || '',
          logo: club.logo || '',
          description: club.description || '',
          address: club.address || '',
          contactName: club.contactName || '',
          contactPhone: club.contactPhone || '',
          playerCount: club.playerCount || 0,
        });
      }
    } catch {
      setRoleProfile({});
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, dRes] = await Promise.all([
        userApi.getProfile().catch(() => null),
        settingsApi.getSettings().catch(() => null),
        settingsApi.getLoginDevices().catch(() => null)
      ]);
      let currentRole = role;
      if (pRes?.data?.success && pRes.data.data?.user) {
        const u = pRes.data.data.user;
        currentRole = u.role || role;
        setProfile({ nickname: u.nickname || '', name: u.name || '', gender: u.gender || '', birth_date: u.birth_date || '', province: u.province || '', city: u.city || '', avatar: u.avatar || '', phone: u.phone || '', role: currentRole || '' });
        setAvatarPreview(u.avatar || '');
      }
      await loadRoleProfile(currentRole);
      if (sRes?.data?.success) { const d = sRes.data.data; if (d?.notification) setNotif(d.notification); if (d?.privacy) setPrivacy(d.privacy); }
      if (dRes?.data?.success && dRes.data.data?.devices) setDevices(dRes.data.data.devices);
    } catch { toast.error('加载数据失败'); }
    finally { setLoading(false); }
  }, [loadRoleProfile, role]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (codeCD <= 0) return; const t = setTimeout(() => setCodeCD(c => c - 1), 1000); return () => clearTimeout(t); }, [codeCD]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await userApi.updateProfile({ nickname: profile.nickname, name: profile.name, gender: profile.gender, birth_date: profile.birth_date, province: profile.province, city: profile.city, avatar: avatarPreview });
      if (res.data?.success) {
        toast.success('保存成功');
        const updatedUser = res.data.data?.user || res.data.data;
        if (updatedUser) updateUser(updatedUser);
      }
      else toast.error(res.data?.error?.message || '保存失败');
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  const saveRole = async () => {
    setSaving(true);
    try {
      let res;
      if (role === 'user') {
        res = await playerApi.updateProfile({
          position: roleProfile.position,
          second_position: roleProfile.second_position,
          foot: roleProfile.foot,
          height: roleProfile.height ? parseFloat(roleProfile.height) : undefined,
          weight: roleProfile.weight ? parseFloat(roleProfile.weight) : undefined,
          school: roleProfile.school,
          current_team: roleProfile.current_team,
          wechat: roleProfile.wechat,
        });
      } else if (role === 'coach') {
        res = await coachApi.updateProfile({
          licenseType: roleProfile.license_level,
          licenseNumber: roleProfile.license_number,
          specialties: roleProfile.coach_specialty ? String(roleProfile.coach_specialty).split(/[，,]/).map(s => s.trim()).filter(Boolean) : [],
          coachingYears: roleProfile.coach_experience ? parseInt(roleProfile.coach_experience, 10) || 0 : 0,
          currentClub: roleProfile.current_team || roleProfile.club || '',
          position: roleProfile.coach_type,
        });
      } else if (role === 'scout') {
        res = await scoutApi.updateProfile({
          scouting_experience: roleProfile.scouting_experience,
          specialties: roleProfile.scouting_specialty,
          preferred_age_groups: roleProfile.preferred_age_groups,
          scouting_regions: roleProfile.scouting_regions,
          current_organization: roleProfile.current_organization,
        });
      } else if (role === 'analyst') {
        res = await analystApi.updateMyProfile({
          name: profile.name || profile.nickname || '分析师',
          bio: roleProfile.bio || '',
          specialty: roleProfile.profession || '',
          experience: roleProfile.experience ? parseInt(roleProfile.experience, 10) || 0 : 0,
          profession: roleProfile.profession || '',
        });
      } else if (role === 'club') {
        res = await clubApi.updateProfile({
          name: roleProfile.name || profile.name || profile.nickname || '俱乐部',
          logo: roleProfile.logo || '',
          description: roleProfile.description || '',
          address: roleProfile.address || '',
          contactName: roleProfile.contactName || profile.name || '',
          contactPhone: roleProfile.contactPhone || profile.phone || '',
        });
      } else {
        toast.info('当前角色暂无需要保存的专属资料');
        return;
      }
      if (res?.data?.success) toast.success('保存成功'); else toast.error(res?.data?.error?.message || res?.data?.message || '保存失败');
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  const changePwd = async () => {
    if (!pwd.old || !pwd.new) { toast.error('请填写完整'); return; }
    if (pwd.new.length < 6) { toast.error('新密码至少6位'); return; }
    if (pwd.new !== pwd.confirm) { toast.error('两次密码不一致'); return; }
    setSaving(true);
    try {
      const res = await settingsApi.changePassword({ old_password: pwd.old, new_password: pwd.new });
      if (res.data?.success) { toast.success('密码修改成功'); setPwd({ old: '', new: '', confirm: '' }); }
      else toast.error(res.data?.error?.message || '修改失败');
    } catch (err: any) { toast.error(err.response?.data?.error?.message || '修改失败'); }
    finally { setSaving(false); }
  };

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phoneForm.new_phone)) { toast.error('手机号格式错误'); return; }
    try { await authApi.sendCode(phoneForm.new_phone, 'reset'); toast.success('验证码已发送'); setCodeCD(60); }
    catch { toast.error('发送失败'); }
  };

  const changePhone = async () => {
    if (!phoneForm.new_phone || !phoneForm.code) { toast.error('请填写完整'); return; }
    setSaving(true);
    try {
      const res = await settingsApi.changePhone({ new_phone: phoneForm.new_phone, code: phoneForm.code });
      if (res.data?.success) { toast.success('手机号修改成功'); setPhoneForm({ new_phone: '', code: '' }); loadAll(); }
      else toast.error(res.data?.error?.message || '修改失败');
    } catch (err: any) { toast.error(err.response?.data?.error?.message || '修改失败'); }
    finally { setSaving(false); }
  };

  const saveNotifPrivacy = async () => {
    setSaving(true);
    try { const res = await settingsApi.updateSettings({ notification: notif, privacy }); if (res.data?.success) toast.success('保存成功'); else toast.error('保存失败'); }
    catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  const logoutDevice = async (id: number) => {
    try { await settingsApi.logoutDevice(String(id)); toast.success('已登出'); setDevices(prev => prev.filter(d => d.id !== id)); }
    catch { toast.error('操作失败'); }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('头像不能超过2MB'); return; }
    setSaving(true);
    try {
      const res = await uploadApi.uploadAvatar(file);
      if (res.data?.success && res.data.data?.avatar) {
        const avatarUrl = res.data.data.avatar;
        setAvatarPreview(avatarUrl);
        setProfile(prev => ({ ...prev, avatar: avatarUrl }));
        toast.success('头像上传成功，请点击保存资料完成更新');
      } else {
        toast.error(res.data?.error?.message || res.data?.message || '头像上传失败');
      }
    } catch {
      toast.error('头像上传失败');
    } finally {
      setSaving(false);
    }
  };

  const Btn = ({ onClick, text }: { onClick: () => void; text: string }) => (
    <button type="button" onClick={onClick} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{text}
    </button>
  );

  const Card = ({ children, title, icon: Icon }: { children: React.ReactNode; title: string; icon: any }) => (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6 space-y-4">
      <h3 className="text-white font-medium flex items-center gap-2"><Icon size={16} className="text-emerald-400" />{title}</h3>
      {children}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400"><Loader2 size={20} className="animate-spin" />加载中...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold">账号设置</h1>
            <p className="text-slate-500 text-sm">管理你的个人资料、账号安全和偏好设置</p>
          </div>
          <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
            {ROLE_LABELS[role] || role}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-6 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
                <Icon size={16} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {tab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="relative mb-4">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/50" />
                    : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-2xl">{profile.nickname?.[0] || '?'}</div>}
                  <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 transition-colors">
                    <Camera size={14} /><input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                  </label>
                </div>
                <p className="text-slate-400 text-xs">点击相机更换头像，最大2MB</p>
              </div>
              <Card title="基础信息" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="昵称" value={profile.nickname} onChange={v => setProfile({ ...profile, nickname: v })} maxLength={20} />
                  <F label="真实姓名" value={profile.name} onChange={v => setProfile({ ...profile, name: v })} maxLength={20} />
                  <S label="性别" value={profile.gender} onChange={v => setProfile({ ...profile, gender: v })} options={[{ value: '', label: '请选择' }, { value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'secret', label: '保密' }]} />
                  <F label="出生日期" value={profile.birth_date} onChange={v => setProfile({ ...profile, birth_date: v })} type="date" />
                  <F label="所在省份" value={profile.province} onChange={v => setProfile({ ...profile, province: v })} placeholder="例如：广东省" />
                  <F label="所在城市" value={profile.city} onChange={v => setProfile({ ...profile, city: v })} placeholder="例如：深圳市" />
                </div>
              </Card>
              <Card title="账号信息" icon={Shield}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1.5">注册手机号</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300 text-sm"><Phone size={14} className="text-slate-500" />{profile.phone || '-'}<span className="text-xs text-slate-500 ml-auto">修改请到账号安全</span></div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1.5">用户角色</label>
                    <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300 text-sm">{ROLE_LABELS[profile.role] || profile.role || '-'}</div>
                  </div>
                </div>
              </Card>
              <div className="flex justify-end"><Btn onClick={saveProfile} text="保存资料" /></div>
            </div>
          )}

          {tab === 'role' && (
            role === 'admin' ? (
              <div className="text-center py-16 text-slate-500"><Shield size={48} className="mx-auto mb-4 opacity-30" /><p>管理员无需角色资料</p></div>
            ) : (
              <div className="space-y-6">
                <Card title={`${ROLE_LABELS[role]}专属资料`} icon={Shield}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {role === 'user' && (<>
                      <S label="场上位置" value={roleProfile.position || ''} onChange={v => setRoleProfile({ ...roleProfile, position: v })} options={[{ value: '', label: '请选择' }, ...POSITIONS.map(p => ({ value: p, label: p }))]} />
                      <S label="第二位置" value={roleProfile.second_position || ''} onChange={v => setRoleProfile({ ...roleProfile, second_position: v })} options={[{ value: '', label: '请选择' }, ...POSITIONS.map(p => ({ value: p, label: p }))]} />
                      <S label="惯用脚" value={roleProfile.foot || ''} onChange={v => setRoleProfile({ ...roleProfile, foot: v })} options={[{ value: '', label: '请选择' }, { value: 'left', label: '左脚' }, { value: 'right', label: '右脚' }, { value: 'both', label: '双脚' }]} />
                      <F label="身高 (cm)" value={String(roleProfile.height || '')} onChange={v => setRoleProfile({ ...roleProfile, height: v })} type="number" placeholder="175" />
                      <F label="体重 (kg)" value={String(roleProfile.weight || '')} onChange={v => setRoleProfile({ ...roleProfile, weight: v })} type="number" placeholder="65" />
                      <F label="所属俱乐部/学校" value={roleProfile.club || ''} onChange={v => setRoleProfile({ ...roleProfile, club: v })} placeholder="俱乐部或学校名称" />
                      <F label="当前球队" value={roleProfile.current_team || ''} onChange={v => setRoleProfile({ ...roleProfile, current_team: v })} placeholder="当前球队" />
                      <F label="微信号" value={roleProfile.wechat || ''} onChange={v => setRoleProfile({ ...roleProfile, wechat: v })} placeholder="微信号" />
                    </>)}
                    {role === 'coach' && (<>
                      <F label="执教资质" value={roleProfile.license_level || ''} onChange={v => setRoleProfile({ ...roleProfile, license_level: v })} placeholder="例如：亚足联A级" />
                      <F label="资质编号" value={roleProfile.license_number || ''} onChange={v => setRoleProfile({ ...roleProfile, license_number: v })} placeholder="资质编号" />
                      <S label="教练类型" value={roleProfile.coach_type || ''} onChange={v => setRoleProfile({ ...roleProfile, coach_type: v })} options={[{ value: '', label: '请选择' }, { value: 'head', label: '主教练' }, { value: 'assistant', label: '助理教练' }, { value: 'goalkeeper', label: '守门员教练' }, { value: 'fitness', label: '体能教练' }]} />
                      <F label="执教经历" value={roleProfile.coach_experience || ''} onChange={v => setRoleProfile({ ...roleProfile, coach_experience: v })} placeholder="执教经历" />
                      <F label="擅长领域" value={roleProfile.coach_specialty || ''} onChange={v => setRoleProfile({ ...roleProfile, coach_specialty: v })} placeholder="例如：青训、战术" />
                    </>)}
                    {role === 'scout' && (<>
                      <F label="所属机构" value={roleProfile.current_organization || ''} onChange={v => setRoleProfile({ ...roleProfile, current_organization: v })} placeholder="所属机构" />
                      <F label="球探经验" value={roleProfile.scouting_experience || ''} onChange={v => setRoleProfile({ ...roleProfile, scouting_experience: v })} placeholder="例如：5年" />
                      <F label="专注地区" value={roleProfile.scouting_regions || ''} onChange={v => setRoleProfile({ ...roleProfile, scouting_regions: v })} placeholder="例如：华南地区" />
                      <F label="擅长年龄段" value={roleProfile.preferred_age_groups || ''} onChange={v => setRoleProfile({ ...roleProfile, preferred_age_groups: v })} placeholder="例如：U12-U15" />
                      <F label="专业特长" value={roleProfile.scouting_specialty || ''} onChange={v => setRoleProfile({ ...roleProfile, scouting_specialty: v })} placeholder="例如：前锋选材" />
                    </>)}
                    {role === 'analyst' && (<>
                      <F label="专业领域" value={roleProfile.profession || ''} onChange={v => setRoleProfile({ ...roleProfile, profession: v })} placeholder="例如：战术分析" />
                      <F label="从业年限" value={roleProfile.experience || ''} onChange={v => setRoleProfile({ ...roleProfile, experience: v })} placeholder="例如：3年" />
                    </>)}
                    {role === 'club' && (<>
                      <F label="俱乐部名称" value={roleProfile.name || ''} onChange={v => setRoleProfile({ ...roleProfile, name: v })} placeholder="俱乐部名称" />
                      <F label="俱乐部简介" value={roleProfile.description || ''} onChange={v => setRoleProfile({ ...roleProfile, description: v })} placeholder="俱乐部简介" />
                      <F label="详细地址" value={roleProfile.address || ''} onChange={v => setRoleProfile({ ...roleProfile, address: v })} placeholder="俱乐部地址" />
                      <F label="联系人" value={roleProfile.contactName || ''} onChange={v => setRoleProfile({ ...roleProfile, contactName: v })} placeholder="联系人姓名" />
                      <F label="联系电话" value={roleProfile.contactPhone || ''} onChange={v => setRoleProfile({ ...roleProfile, contactPhone: v })} placeholder="联系电话" />
                      <div>
                        <label className="block text-slate-400 text-sm mb-1.5">球员数量</label>
                        <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300 text-sm">{roleProfile.playerCount || 0}<span className="text-xs text-slate-500 ml-2">系统统计，不可手动修改</span></div>
                      </div>
                    </>)}
                  </div>
                </Card>
                <div className="flex justify-end"><Btn onClick={saveRole} text="保存角色资料" /></div>
              </div>
            )
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <Card title="修改密码" icon={Lock}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="原密码" value={pwd.old} onChange={v => setPwd({ ...pwd, old: v })} type="password" placeholder="当前密码" />
                  <div />
                  <F label="新密码" value={pwd.new} onChange={v => setPwd({ ...pwd, new: v })} type="password" placeholder="至少6位" />
                  <F label="确认新密码" value={pwd.confirm} onChange={v => setPwd({ ...pwd, confirm: v })} type="password" placeholder="再次输入" />
                </div>
                <div className="flex justify-end"><Btn onClick={changePwd} text="修改密码" /></div>
              </Card>
              <Card title="修改手机号" icon={Phone}>
                <p className="text-slate-400 text-sm">当前手机号：{profile.phone}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="新手机号" value={phoneForm.new_phone} onChange={v => setPhoneForm({ ...phoneForm, new_phone: v })} placeholder="新手机号" />
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><F label="验证码" value={phoneForm.code} onChange={v => setPhoneForm({ ...phoneForm, code: v })} placeholder="6位验证码" /></div>
                    <button type="button" onClick={sendCode} disabled={codeCD > 0} className="px-4 py-2 mb-[1px] bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 text-emerald-400 rounded-lg text-sm border border-white/[0.08] transition-colors whitespace-nowrap">
                      {codeCD > 0 ? `${codeCD}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end"><Btn onClick={changePhone} text="修改手机号" /></div>
              </Card>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-6">
              <Card title="通知设置" icon={Bell}>
                <TG label="系统公告" desc="平台重要通知和更新" checked={notif.system_announcements} onChange={v => setNotif({ ...notif, system_announcements: v })} />
                <TG label="订单状态通知" desc="订单支付、完成等状态变更" checked={notif.order_status} onChange={v => setNotif({ ...notif, order_status: v })} />
                <TG label="周报/比赛提醒" desc="周报提交和比赛相关提醒" checked={notif.weekly_report} onChange={v => setNotif({ ...notif, weekly_report: v })} />
                <TG label="社交互动" desc="点赞、评论、关注等互动通知" checked={notif.social_interaction} onChange={v => setNotif({ ...notif, social_interaction: v })} />
                <TG label="私信通知" desc="收到新私信时通知" checked={notif.private_message} onChange={v => setNotif({ ...notif, private_message: v })} />
                <TG label="邮件通知" desc="通过邮件接收通知" checked={notif.email_notification} onChange={v => setNotif({ ...notif, email_notification: v })} />
              </Card>
              <Card title="隐私设置" icon={Eye}>
                <TG label="个人主页可见" desc="其他用户可以查看你的个人主页" checked={privacy.profile_visible} onChange={v => setPrivacy({ ...privacy, profile_visible: v })} />
                <TG label="展示真实姓名" desc="在个人主页展示真实姓名，不开启时仅展示昵称" checked={privacy.show_real_name} onChange={v => setPrivacy({ ...privacy, show_real_name: v })} />
                <TG label="手机号对其他用户可见" desc="在个人主页展示手机号" checked={privacy.phone_visible} onChange={v => setPrivacy({ ...privacy, phone_visible: v })} />
                <TG label="允许被搜索到" desc="其他用户可以通过搜索找到你" checked={privacy.allow_search} onChange={v => setPrivacy({ ...privacy, allow_search: v })} />
              </Card>
              <div className="flex justify-end"><Btn onClick={saveNotifPrivacy} text="保存设置" /></div>
            </div>
          )}

          {tab === 'devices' && (
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-6">
                <h3 className="text-white font-medium flex items-center gap-2 mb-4"><Monitor size={16} className="text-emerald-400" />登录设备</h3>
                {devices.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">暂无设备记录</p>
                ) : (
                  <div className="space-y-3">
                    {devices.map((d) => (
                      <div key={d.id} className={`flex items-center gap-4 p-4 rounded-lg border ${d.is_current ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                        <div className={`p-2.5 rounded-lg ${d.is_current ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.04] text-slate-400'}`}>
                          {d.device_type === 'mobile' ? <Smartphone size={20} /> : <Monitor size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{d.device_name}</span>
                            {d.is_current && <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">当前设备</span>}
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5">{d.browser} · {d.os} · {d.ip} · {d.location}</p>
                          <p className="text-slate-600 text-xs">登录时间：{d.login_at}</p>
                        </div>
                        {!d.is_current && (
                          <button onClick={() => logoutDevice(d.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
