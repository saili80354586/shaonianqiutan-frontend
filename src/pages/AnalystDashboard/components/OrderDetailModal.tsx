import React, { useEffect } from 'react';
import type { Order, User } from '../../../types';
import {
  Clock,
  FileText,
  Footprints,
  MapPin,
  Phone,
  ShieldCheck,
  Trophy,
  UserRound,
  Video,
  X,
} from 'lucide-react';

type ProfileUser = User & {
  current_team?: string;
  dominant_foot?: string;
  playing_style?: unknown;
  technical_tags?: unknown;
  mental_tags?: unknown;
  experiences?: unknown;
  privacy_settings?: unknown;
  privacy_show_phone?: boolean;
  parent_phone?: string;
  parent_name?: string;
};

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
}

const statusMap: Record<Order['status'], { label: string; className: string }> = {
  pending: { label: '待支付', className: 'bg-gray-100 text-gray-700' },
  paid: { label: '已支付', className: 'bg-blue-100 text-blue-700' },
  uploaded: { label: '待派单', className: 'bg-cyan-100 text-cyan-700' },
  assigned: { label: '待接单', className: 'bg-amber-100 text-amber-700' },
  accepted: { label: '已接单', className: 'bg-indigo-100 text-indigo-700' },
  processing: { label: '分析中', className: 'bg-purple-100 text-purple-700' },
  submitted: { label: '待审核', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', className: 'bg-red-100 text-red-700' },
  refunded: { label: '已退款', className: 'bg-slate-100 text-slate-700' },
};

const orderTypeMap: Record<Order['order_type'], string> = {
  basic: '基础版',
  text: '文字版',
  video: '视频解析版',
  pro: '专业版',
};

const footMap: Record<string, string> = {
  left: '左脚',
  right: '右脚',
  both: '双脚',
};

const genderMap: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他',
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('zh-CN');
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}秒`;
  return secs ? `${mins}分${secs}秒` : `${mins}分钟`;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return '-';
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const parseUnknown = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const parseList = (value: unknown): string[] => {
  const parsed = parseUnknown(value);
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.map(formatValue).filter((item) => item !== '-');
  }
  if (typeof parsed === 'string') {
    return parsed
      .split(/[，,;；]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  const record = toRecord(parsed);
  if (!record) return [];
  return Object.entries(record)
    .map(([key, val]) => `${key}: ${formatValue(val)}`)
    .filter((item) => !item.endsWith(': -'));
};

const parseExperiences = (value: unknown): string[] => {
  const parsed = parseUnknown(value);
  if (!parsed) return [];
  const items = Array.isArray(parsed) ? parsed : [parsed];
  return items
    .map((item) => {
      if (typeof item === 'string') return item;
      const record = toRecord(item);
      if (!record) return '';
      const title = formatValue(record.title ?? record.name ?? record.team ?? record.club ?? record.competition);
      const period = formatValue(record.period ?? record.year ?? record.date ?? record.time);
      const desc = formatValue(record.description ?? record.desc ?? record.result ?? record.role);
      return [period, title, desc].filter((part) => part !== '-').join(' · ');
    })
    .filter(Boolean);
};

const canShowPhone = (player?: ProfileUser) => {
  if (!player) return false;
  if (player.privacy_show_phone === false) return false;
  const privacySettings = toRecord(parseUnknown(player.privacy_settings));
  if (privacySettings?.phoneVisible === false) return false;
  return true;
};

const DetailItem: React.FC<{ label: string; value: unknown }> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900 break-words">{formatValue(value)}</p>
  </div>
);

const DetailSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <section className="rounded-lg border border-gray-100 bg-white p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </section>
);

const TagList: React.FC<{ items: string[]; emptyText?: string }> = ({ items, emptyText = '暂无' }) => {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [order, onClose]);

  if (!order) return null;

  const player = order.user as ProfileUser | undefined;
  const status = statusMap[order.status];
  const technicalTags = parseList(player?.technical_tags);
  const mentalTags = parseList(player?.mental_tags);
  const playingStyles = parseList(player?.playing_style);
  const experiences = parseExperiences(player?.experiences);
  const displayFoot = player?.dominant_foot || player?.foot || player?.preferredFoot;
  const phoneVisible = canShowPhone(player);
  const familyPhone = [player?.parent_phone, player?.father_phone, player?.mother_phone].filter(Boolean).join(' / ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-gray-50 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-gray-500">{order.order_no}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
              {order.report_id && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                  <FileText className="h-3 w-3" />
                  报告 #{order.report_id}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-gray-900">
              {player?.name || order.player_name || '未命名球员'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {order.match_name || '比赛信息未填写'} {order.opponent ? `vs ${order.opponent}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="关闭详情"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <DetailSection title="订单信息" icon={<FileText className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="订单类型" value={orderTypeMap[order.order_type]} />
                <DetailItem label="订单金额" value={`¥${order.amount}`} />
                <DetailItem label="创建时间" value={formatDateTime(order.created_at)} />
                <DetailItem label="支付时间" value={formatDateTime(order.paid_at)} />
                <DetailItem label="派单时间" value={formatDateTime(order.assigned_at)} />
                <DetailItem label="接单时间" value={formatDateTime(order.accepted_at)} />
                <DetailItem label="截止时间" value={formatDateTime(order.deadline)} />
                <DetailItem label="提交时间" value={formatDateTime(order.submitted_at)} />
              </div>
            </DetailSection>

            <DetailSection title="视频与比赛" icon={<Video className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="视频时长" value={formatDuration(order.video_duration)} />
                <DetailItem label="比赛日期" value={formatDate(order.match_date)} />
                <DetailItem label="对手" value={order.opponent} />
                <DetailItem label="比赛结果" value={order.match_result} />
              </div>
              {order.video_url && (
                <a
                  href={order.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  <Video className="h-4 w-4" />
                  打开原始视频
                </a>
              )}
            </DetailSection>

            <DetailSection title="球员基础资料" icon={<UserRound className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="姓名" value={player?.name || order.player_name} />
                <DetailItem label="昵称" value={player?.nickname} />
                <DetailItem label="年龄" value={player?.age ?? order.player_age} />
                <DetailItem label="出生日期" value={formatDate(player?.birth_date || player?.birthDate)} />
                <DetailItem label="性别" value={player?.gender ? genderMap[player.gender] || player.gender : undefined} />
                <DetailItem label="常用脚" value={displayFoot ? footMap[String(displayFoot)] || displayFoot : undefined} />
                <DetailItem label="身高" value={player?.height ? `${player.height} cm` : undefined} />
                <DetailItem label="体重" value={player?.weight ? `${player.weight} kg` : undefined} />
              </div>
            </DetailSection>

            <DetailSection title="位置与归属" icon={<MapPin className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="主位置" value={player?.position || order.player_position} />
                <DetailItem label="副位置" value={player?.second_position} />
                <DetailItem label="当前球队" value={player?.current_team || player?.club} />
                <DetailItem label="学校" value={player?.school} />
                <DetailItem label="地区" value={[player?.province, player?.city].filter(Boolean).join(' / ') || undefined} />
                <DetailItem label="开始训练年份" value={player?.start_year} />
                <DetailItem label="球衣" value={[player?.jersey_color, player?.jersey_number].filter(Boolean).join(' / ') || undefined} />
                <DetailItem label="足协注册" value={player?.fa_registered} />
              </div>
            </DetailSection>

            <DetailSection title="技术特点" icon={<Footprints className="h-4 w-4" />}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">技术标签</p>
                  <TagList items={technicalTags} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">心理标签</p>
                  <TagList items={mentalTags} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500">踢球风格</p>
                  <TagList items={playingStyles} />
                </div>
              </div>
            </DetailSection>

            <DetailSection title="经历与联系" icon={<Trophy className="h-4 w-4" />}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="所属协会" value={player?.association} />
                  <DetailItem label="公开联系电话" value={phoneVisible ? player?.phone || player?.contactPhone : '已隐藏'} />
                  <DetailItem label="家长姓名" value={player?.parent_name} />
                  <DetailItem label="家长电话" value={phoneVisible ? familyPhone : '已隐藏'} />
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    足球经历
                  </p>
                  {experiences.length > 0 ? (
                    <ul className="space-y-2">
                      {experiences.map((item) => (
                        <li key={item} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">暂无</p>
                  )}
                </div>
              </div>
            </DetailSection>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>该详情使用当前订单接口返回的数据展示，不额外修改演示数据。若球员资料为空，请先检查下单补充资料或种子数据。</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="h-4 w-4" />
            <span>资料仅用于当前分析任务</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
