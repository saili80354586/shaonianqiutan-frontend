import { Home, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ViewLevel, ProvinceStats, CityStats } from './types';

interface BreadcrumbProps {
  viewLevel: ViewLevel;
  currentProvince: ProvinceStats | null;
  currentCity: CityStats | null;
  onBackToNational: () => void;
  onBackToProvince: () => void;
}

export function Breadcrumb({
  viewLevel,
  currentProvince,
  currentCity,
  onBackToNational,
  onBackToProvince,
}: BreadcrumbProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/70 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg border border-slate-700/50"
    >
      <button
        onClick={onBackToNational}
        className={`flex items-center gap-1.5 transition-colors ${
          viewLevel === 'national' ? 'text-emerald-400 font-medium' : 'hover:text-emerald-400'
        }`}
        disabled={viewLevel === 'national'}
      >
        <Home className="w-4 h-4" />
        全国
      </button>

      {currentProvince && (
        <>
          <ChevronLeft className="w-4 h-4 text-slate-500" />
          <button
            onClick={onBackToProvince}
            className={`transition-colors ${
              viewLevel === 'province' ? 'text-emerald-400 font-medium' : 'hover:text-emerald-400'
            }`}
            disabled={viewLevel === 'province'}
          >
            {currentProvince.name}
          </button>
        </>
      )}

      {currentCity && viewLevel === 'city' && (
        <>
          <ChevronLeft className="w-4 h-4 text-slate-500" />
          <span className="text-emerald-400 font-medium">{currentCity.name}</span>
        </>
      )}
    </motion.div>
  );
}
