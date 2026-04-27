import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Eye, X, Loader2, LayoutGrid, Image, Edit2, Award, Users, Shield, Star, Dumbbell, Newspaper, MessageCircle, Phone, Globe, Trash2, ChevronUp, ChevronDown, Mail, MapPin, Calendar, PartyPopper, Plus, Pin, Upload, type LucideIcon } from 'lucide-react';
import { clubHomeApi, clubActivityApi } from '../../services/api';
import ClubHomePage from './ClubHomePage';

interface Props { clubId: number; onBack: () => void; }

const defOrder = ['hero','about','achievements','teams','coaches','players','facilities','news','activities','recruitment','contact'];
const defVis: Record<string,boolean> = { hero:true,about:true,achievements:true,teams:true,coaches:true,players:false,facilities:false,news:true,activities:true,recruitment:false,contact:true };
const labels: Record<string,string> = { hero:'Hero 横幅',about:'关于我们',achievements:'荣誉成就',teams:'球队展示',coaches:'教练团队',players:'球员风采',facilities:'训练环境',news:'最新动态',activities:'活动专区',recruitment:'招生信息',contact:'联系我们' };

type ClubHomeData = Record<string, unknown>;

export default function ClubHomeEditor({ clubId, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClubHomeData | null>(null);
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [preview, setPreview] = useState(false);
  const [inlinePreview, setInlinePreview] = useState(false);

  useEffect(() => { loadData(); }, [clubId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await clubHomeApi.getClubHome(clubId);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (!d.modules) d.modules = { order:[...defOrder], visibility:{...defVis} };
        if (!d.modules.order?.length) d.modules.order = [...defOrder];
        if (!d.modules.visibility) d.modules.visibility = { ...defVis };
        setData(d);
      }
    } finally { setLoading(false); }
  };

  const toast = (m: string) => { setMsg(m); setTimeout(()=>setMsg(null),2500); };

  const save = async (fn: (id: number, payload: unknown) => Promise<{ data?: { success?: boolean } }>, payload: unknown, name: string) => {
    setSaving(true);
    try { const res = await fn(clubId, payload); toast(res.data?.success ? `${name} 保存成功` : `${name} 保存失败`); }
    catch { toast(`${name} 保存失败`); } finally { setSaving(false); }
  };

  const setPath = (path: string, value: unknown) => {
    setData((prev: ClubHomeData | null) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

interface NavItemProps { id: string; label: string; icon: LucideIcon; active?: boolean; onClick: (id: string) => void; }
function NavItem({ id, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <button onClick={()=>onClick(id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active?'bg-emerald-500/20 text-emerald-400':'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
      <Icon className="w-4 h-4"/>{label}
    </button>
  );
}

interface NavGroupProps { title: string; children: React.ReactNode; }
function NavGroup({ title, children }: NavGroupProps) {
  return (
    <div className="mb-3">
      <div className="px-3 text-xs text-gray-500 mb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

interface SectionHeaderProps { title: string; onSave: () => void; saving?: boolean; }
function SectionHeader({ title, onSave, saving }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <button onClick={onSave} disabled={saving} className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:'保存'}</button>
    </div>
  );
}

interface TProps { label: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; rows?: number; }
function T({ label, value, onChange, rows=1 }: TProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {rows>1 ? (
        <textarea value={value||''} onChange={onChange} rows={rows} className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
      ) : (
        <input type="text" value={value||''} onChange={onChange} className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
      )}
    </div>
  );
}

function ImageUploader({ onUpload, multiple }: { onUpload: (url: string) => void; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} onChange={handleFileChange} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-1">
        <Upload className="w-3 h-3" /> 上传
      </button>
    </>
  );
}

interface ImageFieldProps { label: string; value?: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; rows?: number; multiple?: boolean; }
function ImageField({ label, value, onChange, rows=1, multiple=false }: ImageFieldProps) {
  const handleUpload = (url: string) => {
    const newValue = value && multiple ? `${value}\n${url}` : url;
    onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs text-gray-400">{label}</label>
        <ImageUploader onUpload={handleUpload} multiple={multiple} />
      </div>
      {rows>1 ? (
        <textarea value={value||''} onChange={onChange} rows={rows} className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
      ) : (
        <input type="text" value={value||''} onChange={onChange} className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500" />
      )}
    </div>
  );
}

  const Overview = () => {
    const order = data.modules.order || defOrder;
    const vis = data.modules.visibility || defVis;
    const move = (i: number, d: number) => { const j=i+d; if(j<0||j>=order.length) return; const n=[...order]; [n[i],n[j]]=[n[j],n[i]]; setPath('modules.order',n); };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">页面总览</h2>
          <div className="flex gap-2">
            <button onClick={()=>{ setPath('modules.order',[...defOrder]); setPath('modules.visibility',{...defVis}); }} className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg">恢复默认</button>
            <button onClick={()=>save(clubHomeApi.updateModules,{moduleOrder:order,moduleVisibility:vis},'模块设置')} disabled={saving} className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:'保存'}</button>
          </div>
        </div>
        <div className="space-y-2">
          {order.map((id:string,i:number)=> (
            <div key={id} className={`flex items-center gap-2 bg-[#1a1f2e] border border-gray-800 rounded-xl p-3 ${vis[id]?'':'opacity-50'}`}>
              <span className="flex-1 text-white text-sm">{labels[id]}</span>
              <button onClick={()=>move(i,-1)} disabled={i===0} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4 text-gray-400"/></button>
              <button onClick={()=>move(i,1)} disabled={i===order.length-1} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4 text-gray-400"/></button>
              <button onClick={()=>setPath('modules.visibility',{...vis,[id]:!vis[id]})} className={`px-2 py-1 text-xs rounded ${vis[id]?'bg-emerald-500/20 text-emerald-400':'bg-gray-800 text-gray-400'}`}>{vis[id]?'显示':'隐藏'}</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const HeroEd = () => {
    const h = data.hero||{};
    return (
      <div className="space-y-4">
        <SectionHeader title="Hero 横幅" onSave={()=>save(clubHomeApi.updateHero,h,'Hero')} saving={saving} />
        <T label="主标题" value={h.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('hero.title',e.target.value)} />
        <T label="副标题" value={h.subtitle} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('hero.subtitle',e.target.value)} />
        <ImageField label="背景图" value={h.backgroundImage} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath("hero.backgroundImage",e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!h.showStats} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('hero.showStats',e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>显示统计数据</label>
      </div>
    );
  };

  const AboutEd = () => {
    const a = data.about||{}; const feats = a.features||[];
    return (
      <div className="space-y-4">
        <SectionHeader title="关于我们" onSave={()=>save(clubHomeApi.updateAbout,a,'关于我们')} saving={saving} />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!a.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('about.enabled',e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>启用</label>
        <T label="标题" value={a.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('about.title',e.target.value)} />
        <T label="内容" value={a.content} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('about.content',e.target.value)} rows={4} />
        <ImageField label="相册图片（每行一个）" value={(a.images||[]).join('\n')} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('about.images',e.target.value.split('\n').filter(Boolean))} rows={3} multiple />
        <div>
          <label className="block text-xs text-gray-400 mb-1">特色标签</label>
          <div className="space-y-2">
            {feats.map((f: Record<string, unknown>, i: number)=> (
              <div key={i} className="flex gap-2">
                <input type="text" value={f.title||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...feats]; n[i]={...n[i],title:e.target.value}; setPath('about.features',n); }} placeholder="标题" className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <input type="text" value={f.description||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...feats]; n[i]={...n[i],description:e.target.value}; setPath('about.features',n); }} placeholder="描述" className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <button onClick={()=>setPath('about.features',feats.filter((_: unknown,idx:number)=>idx!==i))} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            <button onClick={()=>setPath('about.features',[...feats,{title:'',description:''}])} className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400 text-sm">+ 添加标签</button>
          </div>
        </div>
      </div>
    );
  };

  const AchievementsEd = () => {
    const list = data.achievements||[];
    return (
      <div className="space-y-4">
        <SectionHeader title="荣誉成就" onSave={()=>save(clubHomeApi.saveClubHome,{achievements:list},'荣誉成就')} saving={saving} />
        <div className="space-y-2">
          {list.map((item: Record<string, unknown>, i: number)=> (
            <div key={item.id||i} className="bg-[#1a1f2e] rounded-xl p-3 border border-gray-800">
              <div className="grid grid-cols-12 gap-2">
                <input type="text" value={item.title||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...list]; n[i]={...n[i],title:e.target.value}; setPath('achievements',n); }} placeholder="标题" className="col-span-3 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <input type="text" value={item.description||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...list]; n[i]={...n[i],description:e.target.value}; setPath('achievements',n); }} placeholder="描述" className="col-span-4 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <input type="text" value={item.count||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...list]; n[i]={...n[i],count:e.target.value}; setPath('achievements',n); }} placeholder="数值" className="col-span-2 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <div className="col-span-3 flex items-center gap-1">
                  <button onClick={()=>{ const n=[...list]; if(i>0)[n[i-1],n[i]]=[n[i],n[i-1]]; setPath('achievements',n); }} disabled={i===0} className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4 text-gray-400"/></button>
                  <button onClick={()=>{ const n=[...list]; if(i<n.length-1)[n[i],n[i+1]]=[n[i+1],n[i]]; setPath('achievements',n); }} disabled={i===list.length-1} className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4 text-gray-400"/></button>
                  <button onClick={()=>setPath('achievements',list.filter((_: unknown,idx:number)=>idx!==i))} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={()=>setPath('achievements',[...list,{id:Date.now(),title:'',description:'',count:''}])} className="w-full py-2 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400 text-sm">+ 添加成就</button>
        </div>
      </div>
    );
  };

  interface SelectorItem {
    [key: string]: unknown;
    isShown?: boolean;
    name?: string;
    nickname?: string;
    ageGroup?: string;
    position?: string;
    id?: number | string;
    user_id?: number | string;
    showPlayerCount?: boolean;
    recommendText?: string;
  }
  interface SelectorProps {
    items: SelectorItem[];
    field: string;
    label: string;
    apiFn: (id: number, payload: unknown) => Promise<{ data?: { success?: boolean } }>;
    extra?: (item: SelectorItem) => React.ReactNode;
  }
  const Selector = ({ items, field, label, apiFn, extra }: SelectorProps) => {
    const shown = items.filter((t)=>t.isShown!==false);
    const hidden = items.filter((t)=>t.isShown===false);
    const move = (arr: SelectorItem[], idx: number, dir: number) => { const n=[...arr], j=idx+dir; if(j<0||j>=n.length) return arr; [n[idx],n[j]]=[n[j],n[idx]]; return n; };
    const toggle = (item: SelectorItem) => {
      const all = [...shown, ...hidden];
      const t = all.find((x)=>x[field]===item[field]); if(!t) return;
      t.isShown = !t.isShown;
      const s = shown.map((x)=>x[field]===item[field]?{...x,isShown:!x.isShown}:x).filter((x)=>x.isShown!==false);
      const h = hidden.map((x)=>x[field]===item[field]?{...x,isShown:!x.isShown}:x).filter((x)=>x.isShown===false);
      if(t.isShown) s.push({...t});
      updateList([...s,...h]);
    };
    const updateList = (next: SelectorItem[]) => {
      if(label==='teams') setPath('teams',next); else if(label==='coaches') setPath('coaches',next); else setPath('players',next);
    };
    const payload = () => {
      if(label==='teams') return shown.map((t,i)=>({teamID:t.id,sort:i,showPlayerCount:t.showPlayerCount!==false}));
      if(label==='coaches') return shown.map((c,i)=>({coachID:c.id||c.user_id,sort:i}));
      return shown.map((p,i)=>({playerID:p.id||p.user_id,sort:i,recommendText:p.recommendText||''}));
    };
    return (
      <div className="space-y-4">
        <SectionHeader title={labels[label]} onSave={()=>save(apiFn,payload(),labels[label])} saving={saving} />
        <div className="space-y-2">
          {shown.map((item,i)=> (
            <div key={String(item[field])} className="flex items-center gap-2 bg-[#1a1f2e] border border-gray-800 rounded-xl p-3">
              <input type="checkbox" checked onChange={()=>toggle(item)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{item.name||item.nickname}</div>
                {item.ageGroup && <div className="text-gray-500 text-xs">{item.ageGroup}{item.position?` · ${item.position}`:''}</div>}
              </div>
              {extra && extra(item)}
              <div className="flex items-center gap-1">
                <button onClick={()=>updateList([...move(shown,i,-1),...hidden])} disabled={i===0} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4 text-gray-400"/></button>
                <button onClick={()=>updateList([...move(shown,i,1),...hidden])} disabled={i===shown.length-1} className="p-1 hover:bg-gray-800 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4 text-gray-400"/></button>
              </div>
            </div>
          ))}
          {hidden.length>0 && <div className="pt-2 text-xs text-gray-500">未展示</div>}
          {hidden.map((item)=> (
            <div key={String(item[field])} className="flex items-center gap-2 bg-[#1a1f2e]/60 border border-gray-800 rounded-xl p-3 opacity-60">
              <input type="checkbox" checked={false} onChange={()=>toggle(item)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{item.name||item.nickname}</div>
                {item.ageGroup && <div className="text-gray-500 text-xs">{item.ageGroup}{item.position?` · ${item.position}`:''}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FacilitiesEd = () => {
    const f = data.facilities||{}; const sch = f.schedule||[];
    return (
      <div className="space-y-4">
        <SectionHeader title="训练环境" onSave={()=>save(clubHomeApi.updateFacilities,f,'训练环境')} saving={saving} />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!f.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('facilities.enabled',e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>启用</label>
        <T label="标题" value={f.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('facilities.title',e.target.value)} />
        <T label="描述" value={f.description} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('facilities.description',e.target.value)} rows={3} />
        <ImageField label="图片（每行一个）" value={(f.images||[]).join('\n')} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('facilities.images',e.target.value.split('\n').filter(Boolean))} rows={3} multiple />
        <div>
          <label className="block text-xs text-gray-400 mb-1">训练时间表</label>
          <div className="space-y-2">
            {sch.map((s: Record<string, unknown>, i: number)=> (
              <div key={i} className="flex gap-2">
                <input type="text" value={s.day||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...sch]; n[i]={...n[i],day:e.target.value}; setPath('facilities.schedule',n); }} placeholder="星期" className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <input type="text" value={s.timeRange||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...sch]; n[i]={...n[i],timeRange:e.target.value}; setPath('facilities.schedule',n); }} placeholder="时间段" className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <input type="text" value={s.group||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=[...sch]; n[i]={...n[i],group:e.target.value}; setPath('facilities.schedule',n); }} placeholder="组别" className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                <button onClick={()=>setPath('facilities.schedule',sch.filter((_: unknown,idx:number)=>idx!==i))} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            <button onClick={()=>setPath('facilities.schedule',[...sch,{day:'',timeRange:'',group:''}])} className="w-full py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400 text-sm">+ 添加时间段</button>
          </div>
        </div>
      </div>
    );
  };

  const RecruitmentEd = () => {
    const r = data.recruitment||{};
    return (
      <div className="space-y-4">
        <SectionHeader title="招生信息" onSave={()=>save(clubHomeApi.updateRecruitment,r,'招生信息')} saving={saving} />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!r.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.enabled',e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>启用</label>
        <T label="标题" value={r.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.title',e.target.value)} />
        <T label="描述" value={r.description} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.description',e.target.value)} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <T label="试训日期" value={r.trialDate} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.trialDate',e.target.value)} />
          <T label="联系电话" value={r.contactPhone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.contactPhone',e.target.value)} />
          <T label="联系微信" value={r.contactWechat} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.contactWechat',e.target.value)} />
          <ImageField label="二维码" value={r.qrCode} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('recruitment.qrCode',e.target.value)} />
        </div>
      </div>
    );
  };

  const ContactEd = () => {
    const c = data.contact||{};
    return (
      <div className="space-y-4">
        <SectionHeader title="联系我们" onSave={()=>save(clubHomeApi.updateContact,c,'联系我们')} saving={saving} />
        <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!c.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('contact.enabled',e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>启用</label>
        <T label="地址" value={c.address} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('contact.address',e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <T label="电话" value={c.phone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('contact.phone',e.target.value)} />
          <T label="邮箱" value={c.email} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('contact.email',e.target.value)} />
          <T label="微信" value={c.wechat} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('contact.wechat',e.target.value)} />
        </div>
      </div>
    );
  };

  const SocialEd = () => {
    const s = data.socialLinks||{};
    return (
      <div className="space-y-4">
        <SectionHeader title="社交媒体" onSave={()=>save(clubHomeApi.updateSocialLinks,s,'社交媒体')} saving={saving} />
        <T label="官网" value={s.website} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('socialLinks.website',e.target.value)} />
        <T label="微博" value={s.weibo} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('socialLinks.weibo',e.target.value)} />
        <T label="抖音" value={s.douyin} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('socialLinks.douyin',e.target.value)} />
        <T label="小红书" value={s.xiaohongshu} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('socialLinks.xiaohongshu',e.target.value)} />
        <T label="微信公众号" value={s.wechat} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setPath('socialLinks.wechat',e.target.value)} />
      </div>
    );
  };

  const NewsEd = () => {
    const manual = data.news?.manualItems || [];
    const move = <T,>(arr: T[], idx: number, dir: number) => {
      const n = [...arr], j = idx + dir;
      if (j < 0 || j >= n.length) return n;
      [n[idx], n[j]] = [n[j], n[idx]];
      return n;
    };
    return (
      <div className="space-y-4">
        <SectionHeader title="最新动态" onSave={() => save(clubHomeApi.updateNews, manual, '手工公告')} saving={saving} />
        <p className="text-gray-400 text-sm">自动展示最近的比赛和体测活动。下方手工公告将置顶显示。</p>
        <div className="space-y-3">
          {manual.map((item: Record<string, unknown>, i: number) => (
            <div key={item.id || i} className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
              <div className="grid grid-cols-12 gap-2 mb-2">
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const n = [...manual];
                    n[i] = { ...n[i], title: e.target.value };
                    setPath('news.manualItems', n);
                  }}
                  placeholder="公告标题"
                  className="col-span-4 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={item.link || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const n = [...manual];
                    n[i] = { ...n[i], link: e.target.value };
                    setPath('news.manualItems', n);
                  }}
                  placeholder="链接（可选）"
                  className="col-span-4 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="date"
                  value={item.publishDate || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const n = [...manual];
                    n[i] = { ...n[i], publishDate: e.target.value };
                    setPath('news.manualItems', n);
                  }}
                  className="col-span-2 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                />
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setPath('news.manualItems', move(manual, i, -1))}
                    disabled={i === 0}
                    className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setPath('news.manualItems', move(manual, i, 1))}
                    disabled={i === manual.length - 1}
                    className="p-1.5 hover:bg-gray-800 rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setPath('news.manualItems', manual.filter((_: unknown, idx: number) => idx !== i))}
                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <textarea
                  value={item.content || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const n = [...manual];
                    n[i] = { ...n[i], content: e.target.value };
                    setPath('news.manualItems', n);
                  }}
                  placeholder="公告内容"
                  rows={2}
                  className="col-span-8 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"
                />
                <div className="col-span-4"><ImageField label="" value={item.image || ''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const n = [...manual]; n[i] = { ...n[i], image: e.target.value }; setPath('news.manualItems', n); }} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white mt-2">
                <input
                  type="checkbox"
                  checked={!!item.isPinned}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    const n = [...manual];
                    n[i] = { ...n[i], isPinned: e.target.checked };
                    setPath('news.manualItems', n);
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-[#0f1419] text-emerald-500"
                />
                <Pin className="w-3 h-3 text-emerald-400" /> 置顶显示
              </label>
            </div>
          ))}
          <button
            onClick={() =>
              setPath('news.manualItems', [
                ...manual,
                {
                  id: Date.now(),
                  title: '',
                  content: '',
                  link: '',
                  image: '',
                  isPinned: true,
                  publishDate: new Date().toISOString().split('T')[0],
                },
              ])
            }
            className="w-full py-2 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-emerald-500/50 hover:text-emerald-400 text-sm"
          >
            + 添加置顶公告
          </button>
        </div>
      </div>
    );
  };

  const ActivitiesEd = () => {
    const [acts, setActs] = useState<Record<string, unknown>[]>(data.activities || []);
    const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
    const [showReg, setShowReg] = useState<Record<string, unknown> | null>(null);
    const [regs, setRegs] = useState<Record<string, unknown>[]>([]);
    const [loadingActs, setLoadingActs] = useState(false);

    useEffect(() => { setActs(data.activities || []); }, [data.activities]);

    const loadRegs = async  (act: Record<string, unknown>) => {
      const res = await clubActivityApi.getRegistrations(clubId, act.id);
      if (res.data?.success) setRegs(res.data?.data || []);
    };

    const saveAct = async  (act: Record<string, unknown>) => {
      setLoadingActs(true);
      try {
        if (act.id) {
          const res = await clubActivityApi.updateActivity(clubId, act.id, act);
          if (res.data?.success) { toast('活动更新成功'); setEditing(null); loadData(); }
          else toast('活动更新失败');
        } else {
          const res = await clubActivityApi.createActivity(clubId, act);
          if (res.data?.success) { toast('活动创建成功'); setEditing(null); loadData(); }
          else toast('活动创建失败');
        }
      } catch { toast('保存失败'); }
      finally { setLoadingActs(false); }
    };

    const delAct = async (id: number) => {
      if (!confirm('确定删除该活动吗？')) return;
      try {
        const res = await clubActivityApi.deleteActivity(clubId, id);
        if (res.data?.success) { toast('删除成功'); loadData(); }
        else toast('删除失败');
      } catch { toast('删除失败'); }
    };

    const ActivityModal = () => {
      const [form, setForm] = useState<Record<string, unknown>>(editing || {
        title: '', type: 'external', description: '', coverImage: '',
        startTime: '', endTime: '', location: '', maxParticipants: 0,
        contactPhone: '', contactWechat: '', isReview: false, reviewContent: '', reviewImages: []
      });
      return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{form.id ? '编辑活动' : '新建活动'}</h3>
              <button onClick={()=>setEditing(null)} className="p-1 hover:bg-gray-800 rounded"><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">标题</label>
                  <input type="text" value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,title:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">类型</label>
                  <select value={form.type} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,type:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500">
                    <option value="external">公开活动（足球嘉年华等）</option>
                    <option value="internal">内部活动（球员团建等）</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">描述</label>
                <textarea value={form.description} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,description:e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">封面图</label>
                <div className="flex gap-2">
                  <input type="text" value={form.coverImage} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,coverImage:e.target.value})} className="flex-1 px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                  <ImageUploader onUpload={(url:string)=>setForm({...form,coverImage:url})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">开始时间</label>
                  <input type="datetime-local" value={form.startTime} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,startTime:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">结束时间</label>
                  <input type="datetime-local" value={form.endTime} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,endTime:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">地点</label>
                  <input type="text" value={form.location} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,location:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">人数上限（0 表示不限）</label>
                  <input type="number" value={form.maxParticipants} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,maxParticipants:parseInt(e.target.value)||0})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">联系电话</label>
                  <input type="text" value={form.contactPhone} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,contactPhone:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">联系微信</label>
                  <input type="text" value={form.contactWechat} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,contactWechat:e.target.value})} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={!!form.isReview} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,isReview:e.target.checked})} className="w-4 h-4 rounded border-gray-600 bg-[#0f1419] text-emerald-500"/>作为回顾展示（仅已结束活动）</label>
              {form.isReview && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">回顾内容</label>
                    <textarea value={form.reviewContent} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,reviewContent:e.target.value})} rows={3} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1"><label className="block text-xs text-gray-400">回顾图片（每行一个）</label><ImageUploader onUpload={(url:string)=>setForm({...form,reviewImages:[...(form.reviewImages||[]),url]})} multiple /></div>
                    <textarea value={(form.reviewImages||[]).join('\n')} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>setForm({...form,reviewImages:e.target.value.split('\n').filter(Boolean)})} rows={3} className="w-full px-3 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm outline-none focus:border-emerald-500"/>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={()=>setEditing(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm">取消</button>
              <button onClick={()=>saveAct(form)} disabled={loadingActs} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50">{loadingActs?<Loader2 className="w-4 h-4 animate-spin"/>:'保存'}</button>
            </div>
          </div>
        </div>
      );
    };

    const RegModal = () => (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">报名名单 - {showReg.title}</h3>
            <button onClick={()=>setShowReg(null)} className="p-1 hover:bg-gray-800 rounded"><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <div className="space-y-2">
            {regs.length === 0 && <p className="text-gray-400 text-sm">暂无报名</p>}
            {regs.map((r: Record<string, unknown>)=> (
              <div key={r.id} className="bg-[#0f1419] rounded-xl p-3 border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-medium">{r.name}</div>
                  <div className="text-gray-500 text-xs">{r.phone}{r.wechat?` / ${r.wechat}`:''}</div>
                  {r.remark && <div className="text-gray-500 text-xs mt-1">备注：{r.remark}</div>}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${r.status==='confirmed'?'bg-emerald-500/20 text-emerald-400':r.status==='cancelled'?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-400'}`}>
                  {r.status==='confirmed'?'已确认':r.status==='cancelled'?'已取消':'待确认'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">活动专区</h2>
          <button onClick={()=>setEditing({title:'',type:'external',description:'',coverImage:'',startTime:'',endTime:'',location:'',maxParticipants:0,contactPhone:'',contactWechat:'',isReview:false,reviewContent:'',reviewImages:[]})} className="px-3 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Plus className="w-4 h-4"/>新建活动</button>
        </div>
        <div className="space-y-3">
          {acts.map((act: Record<string, unknown>)=> (
            <div key={act.id} className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800">
              <div className="flex items-start gap-4">
                {act.coverImage && <img src={act.coverImage} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${act.type==='external'?'bg-cyan-500/20 text-cyan-400':'bg-purple-500/20 text-purple-400'}`}>{act.type==='external'?'公开':'内部'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${act.status==='upcoming'?'bg-emerald-500/20 text-emerald-400':act.status==='ongoing'?'bg-yellow-500/20 text-yellow-400':'bg-gray-700 text-gray-400'}`}>
                      {act.status==='upcoming'?'即将开始':act.status==='ongoing'?'进行中':'已结束'}
                    </span>
                    {act.isReview && <span className="px-2 py-0.5 rounded text-xs bg-pink-500/20 text-pink-400">回顾</span>}
                  </div>
                  <h4 className="text-white font-medium truncate">{act.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{act.startTime} · {act.location}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={()=>{ setShowReg(act); loadRegs(act); }} className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded">报名</button>
                  <button onClick={()=>setEditing(act)} className="p-1.5 text-gray-400 hover:bg-gray-800 rounded"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={()=>delAct(act.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
          {acts.length===0 && <p className="text-gray-400 text-sm">暂无活动，点击右上角新建。</p>}
        </div>
        {editing && <ActivityModal />}
        {showReg && <RegModal />}
      </div>
    );
  };

  const renderEditor = () => {
    switch(tab) {
      case 'overview': return Overview();
      case 'hero': return HeroEd();
      case 'about': return AboutEd();
      case 'achievements': return AchievementsEd();
      case 'teams': return Selector({ items: data.teams||[], field: 'id', label: 'teams', apiFn: clubHomeApi.updateTeams, extra: (item: Record<string, unknown>)=>(
        <label className="flex items-center gap-1 text-xs text-gray-300"><input type="checkbox" checked={item.showPlayerCount!==false} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=(data.teams||[]).map((x: Record<string, unknown>)=>x.id===item.id?{...x,showPlayerCount:e.target.checked}:x); setPath('teams',n); }} className="w-3 h-3 rounded border-gray-600 bg-[#1a1f2e] text-emerald-500"/>显示人数</label>
      )});
      case 'coaches': return Selector({ items: data.coaches||[], field: 'user_id', label: 'coaches', apiFn: clubHomeApi.updateCoaches });
      case 'players': return Selector({ items: data.players||[], field: 'user_id', label: 'players', apiFn: clubHomeApi.updatePlayers, extra: (item: Record<string, unknown>)=>(
        <input type="text" value={item.recommendText||''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{ const n=(data.players||[]).map((x: Record<string, unknown>)=>x.user_id===item.user_id?{...x,recommendText:e.target.value}:x); setPath('players',n); }} placeholder="推荐语" className="w-28 px-2 py-1 bg-[#0f1419] border border-gray-700 rounded text-white text-xs outline-none focus:border-emerald-500"/>
      )});
      case 'facilities': return FacilitiesEd();
      case 'news': return NewsEd();
      case 'activities': return ActivitiesEd();
      case 'recruitment': return RecruitmentEd();
      case 'contact': return ContactEd();
      case 'social': return SocialEd();
      default: return null;
    }
  };

  if (preview) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f1419]">
        <div className="absolute top-4 right-4 z-10">
          <button onClick={()=>setPreview(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm">
            <X className="w-5 h-5" /> 关闭预览
          </button>
        </div>
        <ClubHomePage clubId={clubId} previewData={data} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          {loading ? (
            <>
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">加载中...</p>
            </>
          ) : (
            <>
              <p className="text-gray-400">加载失败，请刷新重试</p>
              <button onClick={loadData} className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm">重新加载</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="flex h-screen">
        <aside className="w-56 bg-[#1a1f2e] border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
              <ArrowLeft className="w-4 h-4" /> 返回后台
            </button>
          </div>
          <div className="p-3">
            <NavItem id="overview" label="页面总览" icon={LayoutGrid} active={tab==='overview'} onClick={setTab} />
            <NavGroup title="品牌展示">
              <NavItem id="hero" label="Hero 横幅" icon={Image} active={tab==='hero'} onClick={setTab} />
              <NavItem id="about" label="关于我们" icon={Edit2} active={tab==='about'} onClick={setTab} />
            </NavGroup>
            <NavGroup title="业务展示">
              <NavItem id="achievements" label="荣誉成就" icon={Award} active={tab==='achievements'} onClick={setTab} />
              <NavItem id="teams" label="球队展示" icon={Users} active={tab==='teams'} onClick={setTab} />
              <NavItem id="coaches" label="教练团队" icon={Shield} active={tab==='coaches'} onClick={setTab} />
              <NavItem id="players" label="球员风采" icon={Star} active={tab==='players'} onClick={setTab} />
            </NavGroup>
            <NavGroup title="动态内容">
              <NavItem id="facilities" label="训练环境" icon={Dumbbell} active={tab==='facilities'} onClick={setTab} />
              <NavItem id="news" label="最新动态" icon={Newspaper} active={tab==='news'} onClick={setTab} />
              <NavItem id="activities" label="活动专区" icon={PartyPopper} active={tab==='activities'} onClick={setTab} />
              <NavItem id="recruitment" label="招生信息" icon={MessageCircle} active={tab==='recruitment'} onClick={setTab} />
            </NavGroup>
            <NavItem id="contact" label="联系我们" icon={Phone} active={tab==='contact'} onClick={setTab} />
            <NavItem id="social" label="社交媒体" icon={Globe} active={tab==='social'} onClick={setTab} />
          </div>
          <div className="p-3 border-t border-gray-800">
            {msg && <div className={`mb-2 text-xs ${msg.includes('失败')?'text-red-400':'text-emerald-400'}`}>{msg}</div>}
            <button onClick={()=>setPreview(true)} className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"><Eye className="w-4 h-4"/>预览</button>
          </div>
        </aside>
        <main className="flex-1 bg-[#0f1419] border-r border-gray-800 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-[#0f1419]/95 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between xl:hidden">
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setInlinePreview(false)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!inlinePreview ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                编辑
              </button>
              <button
                onClick={() => setInlinePreview(true)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${inlinePreview ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                预览
              </button>
            </div>
            <span className="text-xs text-gray-500">大屏幕自动显示右侧实时预览</span>
          </div>
          <div className="max-w-3xl mx-auto p-6">
            {inlinePreview ? (
              <div className="xl:hidden">
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">当前为预览模式，实际效果可能因缩放略有差异</span>
                </div>
                <div className="scale-[0.85] origin-top">
                  <ClubHomePage clubId={clubId} previewData={data} />
                </div>
              </div>
            ) : (
              renderEditor()
            )}
          </div>
        </main>
        <aside className="w-[420px] bg-[#0f1419] overflow-y-auto hidden xl:block">
          <div className="p-4 text-sm text-gray-400 border-b border-gray-800">实时预览</div>
          <div className="scale-[0.65] origin-top">
            <ClubHomePage clubId={clubId} previewData={data} />
          </div>
        </aside>
      </div>
    </div>
  );
}
