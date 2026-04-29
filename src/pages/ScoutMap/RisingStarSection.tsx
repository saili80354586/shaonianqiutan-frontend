import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  User,
} from "lucide-react";
import { LazyImage } from "../../components";
import { scoutMapApi } from "../../services/api";
import type { Player } from "./data";

interface RisingStar {
  id: number;
  name: string;
  avatar: string;
  position: string;
  age: number;
  province: string;
  city: string;
  score: number;
  reason?: string;
  slogan?: string;
  callCount?: number;
  potential?: string;
}

interface Props {
  onSelectPlayer: (player: Player) => void;
}

const RisingStarSection: React.FC<Props> = ({ onSelectPlayer }) => {
  const [stars, setStars] = useState<RisingStar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setLoading(true);
    });
    const fetchStars = async () => {
      try {
        if (!scoutMapApi.getRisingStars) {
          if (mounted) {
            setError("新星接口暂不可用");
            setStars([]);
          }
          return;
        }
        const res = await scoutMapApi.getRisingStars();
        if (!mounted) return;
        setError(null);
        if (res?.data?.success) {
          const data = res.data.data;
          let list: RisingStar[] = [];
          if (data?.players && Array.isArray(data.players)) {
            list = data.players;
          } else if (Array.isArray(data)) {
            list = data;
          }
          setStars(list.slice(0, 10));
        } else {
          setError("新星数据暂不可用");
          setStars([]);
        }
      } catch (e) {
        if (mounted) {
          setError("新星数据加载失败");
          setStars([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStars();
    return () => {
      mounted = false;
    };
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const isEmpty = !loading && stars.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    // 延迟再检查一次，内容加载后尺寸会变
    const t = setTimeout(checkScroll, 500);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      clearTimeout(t);
    };
  }, [stars]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSelect = (s: RisingStar) => {
    onSelectPlayer({
      id: String(s.id),
      userId: s.id,
      name: s.name,
      avatar: s.avatar,
      age: s.age,
      position: s.position,
      preferredFoot: "右脚",
      foot: "右脚",
      city: s.city,
      province: s.province,
      tags: [],
      score: s.score,
      potential: s.potential || "待评估",
      hasReport: false,
    });
  };

  const potentialColor = (p?: string) => {
    switch (p) {
      case "S":
        return "text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10";
      case "A+":
        return "text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10";
      case "A":
        return "text-[#39ff14] border-[#39ff14]/40 bg-[#39ff14]/10";
      default:
        return "text-[#94a3b8] border-[#94a3b8]/40 bg-[#94a3b8]/10";
    }
  };

  return (
    <div className="relative">
      {/* 标题区 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#fbbf24]" />
            <div className="absolute inset-0 blur-md bg-[#fbbf24]/30 rounded-full" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-[#f8fafc] flex items-center gap-2">
              <span className="neon-text-gold">本周新星</span>
              <span className="px-2 py-0.5 rounded-md bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[10px] text-[#fbbf24] font-mono tracking-wider">
                TOP 10
              </span>
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              每周精选十位高潜力球员
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${canScrollLeft ? "border-[#2d3748] hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 text-[#f8fafc]" : "border-[#2d3748]/50 text-[#475569] cursor-not-allowed"}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${canScrollRight ? "border-[#2d3748] hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 text-[#f8fafc]" : "border-[#2d3748]/50 text-[#475569] cursor-not-allowed"}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 横向滚动轨道 */}
      <div className="relative group">
        {/* 左渐变遮罩 */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0e17] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? "opacity-100" : "opacity-0"}`}
        />
        {/* 右渐变遮罩 */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? "opacity-100" : "opacity-0"}`}
        />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {stars.map((s, index) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s)}
              className="star-card flex-shrink-0 w-[280px] md:w-[320px] snap-start cursor-pointer"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* 卡片主体 */}
              <div className="relative h-full rounded-2xl border border-[#2d3748] bg-gradient-to-br from-[#1a2332]/90 to-[#111827]/90 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-[#fbbf24]/30 hover:shadow-[0_0_30px_rgba(251,191,36,0.08)] hover:-translate-y-1">
                {/* 顶部排名光条 */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#fbbf24]/40 to-transparent" />

                {/* 角标装饰 */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono tracking-wider ${potentialColor(s.potential)}`}
                  >
                    <Star className="w-3 h-3" />
                    {s.potential || "待评估"}
                  </span>
                </div>

                <div className="p-4 flex items-center gap-4">
                  {/* 左侧头像 */}
                  <div className="relative flex-shrink-0">
                    <div className="star-avatar-ring w-[72px] h-[72px] rounded-full p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#0a0e17] flex items-center justify-center overflow-hidden">
                        {s.avatar ? (
                          <LazyImage
                            src={s.avatar}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-[#475569]" />
                        )}
                      </div>
                    </div>
                    {/* 排名数字 */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0e17] border border-[#fbbf24]/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#fbbf24] font-mono">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* 右侧信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold text-[#f8fafc] truncate">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#94a3b8] mb-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#2d3748]/60 text-[#f8fafc] text-[10px]">
                        {s.position}
                      </span>
                      <span>{s.age}岁</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {s.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[#2d3748] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b]"
                          style={{ width: `${Math.min(s.score, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#fbbf24] font-mono">
                        {s.score}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748b] truncate">
                      {s.reason || s.slogan || "真实评分来源待补充"}
                    </p>
                  </div>
                </div>

                {/* 底部打Call条 */}
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); /* TODO: 打Call逻辑 */
                    }}
                    className="w-full py-2 rounded-lg bg-[#fbbf24]/5 border border-[#fbbf24]/10 hover:bg-[#fbbf24]/10 hover:border-[#fbbf24]/30 transition-all flex items-center justify-center gap-1.5 group"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#fbbf24] group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-[#fbbf24]/80 font-medium">
                      为他打 Call
                    </span>
                    {!!s.callCount && s.callCount > 0 && (
                      <span className="text-[10px] text-[#fbbf24]/60 font-mono">
                        {s.callCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {isEmpty && (
            <div className="w-full rounded-xl border border-[#2d3748] bg-[#111827]/60 p-8 text-center text-sm text-[#94a3b8]">
              {error || "暂无可追溯评分的新星数据"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RisingStarSection;
