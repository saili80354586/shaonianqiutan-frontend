import React from 'react';
import type { Level } from './data';

interface BreadcrumbProps {
  level: Level;
  province: string | null;
  city: string | null;
  onNavigate: (level: Level, province?: string, city?: string) => void;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ level, province, city, onNavigate, className }) => {
  return (
    <nav className={`bg-[rgba(10,14,23,0.9)] backdrop-blur-md border border-[#2d3748] rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg ${className || 'absolute top-10 left-10 z-10'}`}>
      <button
        onClick={() => onNavigate('country')}
        className={`text-sm transition-colors ${
          level === 'country' 
            ? 'text-[#39ff14] font-semibold' 
            : 'text-[#94a3b8] hover:text-[#39ff14]'
        }`}
      >
        全国
      </button>
      
      {(level === 'province' || level === 'city') && province && (
        <>
          <span className="text-[#64748b]">›</span>
          <button
            onClick={() => onNavigate('province', province)}
            className={`text-sm transition-colors ${
              level === 'province' 
                ? 'text-[#39ff14] font-semibold' 
                : 'text-[#94a3b8] hover:text-[#39ff14]'
            }`}
          >
            {province}
          </button>
        </>
      )}
      
      {level === 'city' && city && (
        <>
          <span className="text-[#64748b]">›</span>
          <span className="text-sm text-[#39ff14] font-semibold">{city}</span>
        </>
      )}
    </nav>
  );
};

export default React.memo(Breadcrumb);
