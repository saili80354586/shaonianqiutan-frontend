import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, MapPin, Users, CheckCircle, ChevronRight, Loader2, Download, BarChart3, Check, X, Trash2, HelpCircle } from 'lucide-react';
import { physicalTestApi, coachApi, teamApi } from '../../services/club';
import PhysicalTestRecord from '../ClubDashboard/PhysicalTestRecord';
import { ListItemSkeleton } from '../../components/ui/loading';
import { PhysicalTestTooltip } from '../../components/ui/PhysicalTestTooltip';

const ALL_TEST_ITEMS = [
  { key: 'height', name: '身高', unit: 'cm', category: '基础指标' },
  { key: 'weight', name: '体重', unit: 'kg', category: '基础指标' },
  { key: 'bmi', name: 'BMI', unit: '', category: '基础指标' },
  { key: 'sprint_30m', name: '30米跑', unit: '秒', category: '速度类' },
  { key: 'sprint_50m', name: '50米跑', unit: '秒', category: '速度类' },
  { key: 'sprint_100m', name: '100米跑', unit: '秒', category: '速度类' },
  { key: 'agility_ladder', name: '敏捷梯', unit: '秒', category: '灵敏类' },
  { key: 't_test', name: 'T型跑', unit: '秒', category: '灵敏类' },
  { key: 'shuttle_run', name: '折返跑', unit: '秒', category: '灵敏类' },
  { key: 'standing_long_jump', name: '立定跳远', unit: 'cm', category: '爆发类' },
  { key: 'vertical_jump', name: '纵跳', unit: 'cm', category: '爆发类' },
  { key: 'sit_and_reach', name: '坐位体前屈', unit: 'cm', category: '柔韧类' },
  { key: 'push_up', name: '俯卧撑', unit: '个', category: '力量类' },
  { key: 'sit_up', name: '仰卧起坐', unit: '个/分钟', category: '力量类' },
  { key: 'plank', name: '平板支撑', unit: '秒', category: '力量类' },
];

const BUILTIN_TEMPLATES = [
  { id: 'basic', name: '基础版', description: '适合快速筛查', items: ['身高', '体重', 'BMI', '30米跑'], itemKeys: ['height', 'weight', 'bmi', 'sprint_30m'], color: 'gray' },
  { id: 'advanced', name: '进阶版', description: '常规训练评估（推荐）', items: ['身高', '体重', 'BMI', '30米跑', '折返跑', '立定跳远', '坐位体前屈'], itemKeys: ['height', 'weight', 'bmi', 'sprint_30m', 'shuttle_run', 'standing_long_jump', 'sit_and_reach'], color: 'emerald' },
  { id: 'professional', name: '专业版', description: '全面能力评估', items: ['身高', '体重', 'BMI', '30米跑', '50米跑', '敏捷梯', 'T型跑', '折返跑', '立定跳远', '纵跳', '坐位体前屈', '俯卧撑', '仰卧起坐', '平板支撑'], itemKeys: ['height', 'weight', 'bmi', 'sprint_30m', 'sprint_50m', 'agility_ladder', 't_test', 'shuttle_run', 'standing_long_jump', 'vertical_jump', 'sit_and_reach', 'push_up', 'sit_up', 'plank'], color: 'blue' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'text-gray-400 bg-gray-800' },
  ongoing: { label: '进行中', color: 'text-blue-400 bg-blue-500/20' },
  completed: { label: '已完成', color: 'text-emerald-400 bg-emerald-500/20' },
};

export default function CoachPhysicalTests({ teamId, teamName, onBack }: { teamId: number; teamName: string; onBack: () => void }) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'create' | 'record'>('list');
  const [recordTestId, setRecordTestId] = useState<number | null>(null);

  useEffect(() => { loadTests(); }, [teamId, statusFilter]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const res = await coachApi.getTeamPhysicalTests(teamId, { page: 1, pageSize: 20, status: statusFilter !== 'all' ? statusFilter : undefined });
      if (res.data?.success) setTests(res.data.data.list || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadDetail = async (testId: number) => {
    try {
      const res = await coachApi.getTeamPhysicalTestDetail(teamId, testId);
      if (res.data?.success) setSelectedTest(res.data.data);
    } catch (e) { console.error(e); }
  };

  if (view === 'create') return <CreateView teamId={teamId} teamName={teamName} onBack={() => setView('list')} onSuccess={() => { setView('list'); loadTests(); }} />;
  if (view === 'record' && recordTestId) return <PhysicalTestRecord testId={recordTestId} onBack={() => { setView('list'); setRecordTestId(null); }} />;
  if (selectedTest) return <DetailView test={selectedTest} teamId={teamId} onBack={() => setSelectedTest(null)} onRecord={() => { setRecordTestId(selectedTest.id); setView('record'); }} />;

  return (
    <div className="p-6 bg-[#0f1419] min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-white">{teamName} - 体测管理</h1>
        <div className="flex-1" />
        <button onClick={() => setView('create')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"><Plus className="w-4 h-4" /> 创建体测</button>
      </div>
      <div className="flex gap-2 mb-6">
        {['all','pending','ongoing','completed'].map(k => (
          <button key={k} onClick={() => setStatusFilter(k)} className={`px-4 py-2 rounded-xl text-sm font-medium ${statusFilter===k?'bg-blue-600 text-white':'bg-[#1a1f2e] text-gray-400 border border-gray-800'}`}>
            {k==='all'?'全部':k==='pending'?'待开始':k==='ongoing'?'进行中':'已完成'}
          </button>
        ))}
      </div>
      {loading ? <ListItemSkeleton count={3} /> :
       tests.length===0 ? <div className="text-center py-16"><BarChart3 className="w-16 h-16 mx-auto text-gray-600 mb-4"/><h3 className="text-xl font-semibold text-gray-400 mb-2">暂无体测活动</h3><p className="text-gray-500 mb-6">还没有创建任何体测活动</p><button onClick={()=>setView('create')} className="px-6 py-2 bg-emerald-500 text-white rounded-xl">创建第一个体测活动</button></div> :
       <div className="space-y-4">{tests.map(t=>(
         <div key={t.id} onClick={()=>loadDetail(t.id)} className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-5 hover:border-gray-700 cursor-pointer">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.status==='completed'?'bg-emerald-500/20':t.status==='ongoing'?'bg-blue-500/20':'bg-gray-500/20'}`}>
                 <BarChart3 className={`w-6 h-6 ${t.status==='completed'?'text-emerald-400':t.status==='ongoing'?'text-blue-400':'text-gray-400'}`}/>
               </div>
               <div>
                 <h3 className="font-semibold text-white">{t.name}</h3>
                 <p className="text-sm text-gray-400 flex items-center gap-3 mt-1"><Calendar className="w-4 h-4"/>{t.startDate} <MapPin className="w-4 h-4"/>{t.location||'未设置地点'}</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className="text-right"><div className="text-sm text-gray-400"><Users className="w-4 h-4 inline mr-1"/>{t.completedCount}/{t.playerCount}</div><div className="text-xs text-gray-500">{t.templateName}</div></div>
               <div className={`px-3 py-1 rounded-full text-sm ${statusConfig[t.status]?.color}`}>{statusConfig[t.status]?.label}</div>
               <ChevronRight className="w-5 h-5 text-gray-600"/>
             </div>
           </div>
         </div>
       ))}</div>}
    </div>
  );
}

function DetailView({ test, teamId, onBack, onRecord }: { test: any; teamId: number; onBack: () => void; onRecord: () => void }) {
  const templateItemKeys = test.templateItems?.length
    ? test.templateItems
    : BUILTIN_TEMPLATES.find(t=>t.id===test.template)?.itemKeys || [];
  const fields = templateItemKeys.map((k:string)=>({key:k,name:ALL_TEST_ITEMS.find(i=>i.key===k)?.name||k,unit:ALL_TEST_ITEMS.find(i=>i.key===k)?.unit||''}));
  const exportReport = async () => {
    try {
      const res = await coachApi.getTeamPhysicalTestRecords(teamId, test.id);
      if (res.data?.success) {
        const records = res.data.data.records || res.data.data.list || [];
        let report = `${test.name}\n${'='.repeat(40)}\n\n测试时间: ${test.startDate} - ${test.endDate}\n测试地点: ${test.location}\n参与球员: ${records.length}人\n\n球员体测数据:\n${'-'.repeat(40)}\n`;
        records.forEach((r:any)=>{ report+=`\n${r.playerName}\n`; fields.forEach((f:any)=>{ const v=r.data?.[f.key]; report+=`  ${f.name}: ${v!==undefined?v+f.unit:'未测'}\n`; }); });
        report+=`\n${'='.repeat(40)}\n生成时间: ${new Date().toLocaleString()}\n`;
        const blob = new Blob([report],{type:'text/plain;charset=utf-8'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download=`${test.name}_体测报告.txt`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      }
    } catch(e){ alert('导出失败'); }
  };
  return (
    <div className="p-6 bg-[#0f1419] min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">{test.name}</h1><p className="text-gray-400 text-sm mt-1">{test.startDate} - {test.endDate} · {test.location||'未设置地点'}</p></div>
        {test.status!=='completed' && <button onClick={onRecord} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl"><CheckCircle className="w-4 h-4"/>录入数据</button>}
        <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl"><Download className="w-4 h-4"/>导出报告</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800"><div className="text-gray-400 text-sm mb-1">参与球员</div><div className="text-2xl font-bold text-white">{test.playerCount}</div></div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800"><div className="text-gray-400 text-sm mb-1">已完成</div><div className="text-2xl font-bold text-emerald-400">{test.completedCount}</div></div>
        <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800"><div className="text-gray-400 text-sm mb-1">完成率</div><div className="text-2xl font-bold text-blue-400">{test.playerCount>0?Math.round(test.completedCount/test.playerCount*100):0}%</div></div>
      </div>
      <div className="bg-[#1a1f2e] rounded-xl p-4 border border-gray-800 mb-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">测试项目</h3>
        <div className="flex flex-wrap gap-2">{fields.map((f:any)=>(<span key={f.key} className="px-3 py-1 bg-[#0f1419] rounded-lg text-sm text-gray-300 inline-flex items-center gap-1">{f.name} {f.unit&&`(${f.unit})`}<PhysicalTestTooltip itemKey={f.key} compact /></span>))}</div>
      </div>
      <div className="bg-[#1a1f2e] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800"><h3 className="font-medium text-white">球员数据</h3></div>
        {test.records?.length>0 ? <div className="divide-y divide-gray-800">{test.records.map((r:any)=>(
          <div key={r.id} className="px-4 py-3 hover:bg-[#0f1419]/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"><span className="text-blue-400 text-sm font-medium">{r.playerName?.charAt(0)||'?'}</span></div><div><div className="text-white font-medium">{r.playerName}</div><div className="text-xs text-gray-500">{r.position}</div></div></div>
              <div className={`px-2 py-1 rounded text-xs ${r.completed?'bg-emerald-500/20 text-emerald-400':'bg-gray-700 text-gray-400'}`}>{r.completed?'已完成':'未完成'}</div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">{fields.slice(0,4).map((f:any)=>(<div key={f.key} className="bg-[#0f1419] rounded px-2 py-1"><div className="text-xs text-gray-500">{f.name}</div><div className="text-sm text-white">{r.data?.[f.key]!==undefined?`${r.data[f.key]}${f.unit}`:'-'}</div></div>))}</div>
          </div>
        ))}</div> : <div className="px-4 py-8 text-center text-gray-500">暂无体测数据记录</div>}
      </div>
    </div>
  );
}

function CreateView({ teamId, teamName, onBack, onSuccess }: { teamId: number; teamName: string; onBack: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', location: '', template: 'advanced', customTemplateId: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', description: '' });
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customSaving, setCustomSaving] = useState(false);

  useEffect(() => { loadCustomTemplates(); loadPlayers(); }, []);
  const loadCustomTemplates = async () => { try { const res = await physicalTestApi.getCustomTemplates(); if (res.data?.success) setCustomTemplates(res.data.data.list || []); } catch (e) {} };
  const loadPlayers = async () => { try { const res = await teamApi.getTeamPlayers(teamId); if (res.data?.success) { const list = res.data.data.list || res.data.data || []; setPlayers(list); setSelectedPlayerIds(list.map((p: any) => p.id)); } } catch (e) {} };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('请输入活动名称'); return; }
    if (!form.startDate) { setError('请选择体测时间'); return; }
    if (form.template === 'custom' && form.customTemplateId === 0) { setError('请选择自定义模板'); return; }
    setLoading(true); setError('');
    try {
      const payload: any = { name: form.name, description: form.description, startDate: form.startDate, endDate: form.endDate || undefined, location: form.location || undefined, template: form.template, playerIds: selectedPlayerIds };
      if (form.template === 'custom' && form.customTemplateId > 0) payload.customTemplateId = form.customTemplateId;
      const res = await coachApi.createTeamPhysicalTest(teamId, payload);
      if (res.data?.success) onSuccess(); else setError(res.data?.error?.message || '创建失败');
    } catch (err: any) { setError(err.message || '创建失败'); }
    setLoading(false);
  };

  const handleCreateCustomTemplate = async () => {
    if (!customForm.name.trim()) { setError('请输入模板名称'); return; }
    if (selectedItems.length === 0) { setError('请至少选择一个测试项目'); return; }
    setCustomSaving(true); setError('');
    try {
      const res = await physicalTestApi.createCustomTemplate({ name: customForm.name, description: customForm.description, items: selectedItems });
      if (res.data?.success) { await loadCustomTemplates(); setShowCustomModal(false); setCustomForm({ name: '', description: '' }); setSelectedItems([]); } else setError(res.data?.error?.message || '保存失败');
    } catch (err: any) { setError(err.message || '保存失败'); }
    setCustomSaving(false);
  };

  const handleDeleteCustom = async (ev: React.MouseEvent, id: number) => {
    ev.stopPropagation();
    if (!confirm('确定删除该自定义模板吗？')) return;
    try { await physicalTestApi.deleteCustomTemplate(id); await loadCustomTemplates(); if (form.customTemplateId === id) setForm(f => ({ ...f, template: 'advanced', customTemplateId: 0 })); } catch (e) {}
  };

  const displayed = [...BUILTIN_TEMPLATES.map(t => ({ ...t, isCustom: false, customId: 0 })), ...customTemplates.map(t => ({ id: `custom-${t.id}`, name: t.name, description: t.description || '自定义模板', items: t.items.map((k: string) => ALL_TEST_ITEMS.find(i => i.key === k)?.name || k), color: 'purple', isCustom: true, customId: t.id }))];
  const selectedNames = form.template === 'custom' && form.customTemplateId > 0 ? (customTemplates.find(t => t.id === form.customTemplateId)?.items || []).map((k: string) => ALL_TEST_ITEMS.find(i => i.key === k)?.name || k) : BUILTIN_TEMPLATES.find(t => t.id === form.template)?.items || [];

  return (
    <div className="p-6 bg-[#0f1419] min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
          <div><h1 className="text-2xl font-bold text-white">创建体测活动</h1><p className="text-gray-400 mt-1">为 {teamName} 创建体测活动</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">{error}</div>}
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">基本信息</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-400 mb-2">活动名称 <span className="text-red-400">*</span></label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：春季体能测试" className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"/></div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">活动描述</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="简要描述本次体测的目的..." rows={3} className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-400 mb-2">开始日期 <span className="text-red-400">*</span></label><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"/></div></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-2">结束日期</label><div className="relative"><Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"/></div></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-400 mb-2">体测地点</label><div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"/><input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="如：俱乐部训练场" className="w-full pl-12 pr-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"/></div></div>
            </div>
          </div>
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">体测模板</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayed.map((template: any) => (
                <div key={template.id} onClick={() => { if (template.isCustom) setForm(f => ({ ...f, template: 'custom', customTemplateId: template.customId })); else setForm(f => ({ ...f, template: template.id, customTemplateId: 0 })); }} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${ (template.isCustom && form.template==='custom' && form.customTemplateId===template.customId) || (!template.isCustom && form.template===template.id) ? `border-${template.color}-500 bg-${template.color}-500/10` : 'border-gray-700 hover:border-gray-600'}`}>
                  {template.isCustom && <button type="button" onClick={(e)=>handleDeleteCustom(e, template.customId)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4"/></button>}
                  <div className="flex items-center justify-between mb-2 pr-6"><span className="font-medium text-white">{template.name}</span>{(template.isCustom && form.template==='custom' && form.customTemplateId===template.customId) || (!template.isCustom && form.template===template.id) ? <Check className={`w-5 h-5 text-${template.color}-400`}/> : null}</div>
                  <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">{template.items.slice(0,3).map((item:string)=>(<span key={item} className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">{item}</span>))}{template.items.length>3&&<span className="px-2 py-0.5 text-xs text-gray-400">+{template.items.length-3}</span>}</div>
                </div>
              ))}
              <div onClick={()=>setShowCustomModal(true)} className="p-4 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-400 cursor-pointer transition-all flex flex-col items-center justify-center text-gray-400 hover:text-white min-h-[120px]"><Plus className="w-6 h-6 mb-2"/><span className="text-sm font-medium">新建自定义模板</span></div>
            </div>
            <div className="mt-4 p-4 bg-[#0f1419] rounded-xl"><p className="text-sm text-gray-400 mb-2">已选模板包含项目：</p><div className="flex flex-wrap gap-2">{selectedNames.map((item:string)=>(<span key={item} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">{item}</span>))}</div></div>
          </div>
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">参与球员</h2>
            {players.length === 0 ? <p className="text-gray-400">加载球员中...</p> : (
              <div className="flex flex-wrap gap-2">
                {players.map((p: any) => {
                  const selected = selectedPlayerIds.includes(p.id);
                  return (
                    <button key={p.id} type="button" onClick={() => setSelectedPlayerIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#0f1419] border-gray-700 text-gray-300 hover:border-gray-500'}`}>{p.name}</button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">已选 {selectedPlayerIds.length} / {players.length} 人</p>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={onBack} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">取消</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50">{loading ? '创建中...' : '创建活动'}</button>
          </div>
        </form>
      </div>
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#1a1f2e] rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700"><h3 className="text-lg font-semibold text-white">新建自定义模板</h3><button onClick={()=>{setShowCustomModal(false);setError('');}} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button></div>
            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-400 mb-1">模板名称 <span className="text-red-400">*</span></label><input type="text" value={customForm.name} onChange={e=>setCustomForm(f=>({...f,name:e.target.value}))} placeholder="如：U10速度专项" className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"/></div>
                <div><label className="block text-sm font-medium text-gray-400 mb-1">模板描述</label><input type="text" value={customForm.description} onChange={e=>setCustomForm(f=>({...f,description:e.target.value}))} placeholder="简要描述该模板的用途..." className="w-full px-4 py-2 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"/></div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">选择测试项目 <span className="text-red-400">*</span><span className="text-gray-500 font-normal ml-2">（已选 {selectedItems.length} 项）</span></label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TEST_ITEMS.map(item => { const sel = selectedItems.includes(item.key); return (
                      <button key={item.key} type="button" onClick={()=>setSelectedItems(prev=>prev.includes(item.key)?prev.filter(k=>k!==item.key):[...prev,item.key])} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors inline-flex items-center gap-1 ${sel ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#0f1419] border-gray-700 text-gray-300 hover:border-gray-500'}`}>{item.name}<PhysicalTestTooltip itemKey={item.key} compact /></button>
                    ); })}
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <div className="p-3 bg-[#0f1419] rounded-xl"><div className="text-xs text-gray-500 mb-2">已选项目预览</div><div className="flex flex-wrap gap-2">{selectedItems.map((key:string) => { const item = ALL_TEST_ITEMS.find(i => i.key === key); return (<span key={key} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm">{item?.name || key}</span>); })}</div></div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
              <button type="button" onClick={()=>{setShowCustomModal(false);setError('');}} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl">取消</button>
              <button type="button" onClick={handleCreateCustomTemplate} disabled={customSaving} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50">{customSaving ? '保存中...' : '保存模板'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
