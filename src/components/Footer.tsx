import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0a0e14] border-t border-[#2d3748] py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* 居中大Logo */}
        <div className="flex flex-col items-center mb-10">
          {/* Brand - 带动态效果的Logo */}
          <div className="relative group mb-8" style={{ perspective: '1000px' }}>
            {/* 光晕背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#4a90d9]/30 via-[#34d399]/30 to-[#4a90d9]/30 rounded-full blur-2xl opacity-60 animate-pulse-glow"></div>
            {/* Logo - 扩大2倍 */}
            <img 
              src="/images/logo-footer.png" 
              alt="少年球探" 
              className="relative h-56 w-auto object-contain animate-logo-3d drop-shadow-[0_0_40px_rgba(74,144,217,0.7)]"
            />
          </div>

          {/* Links - Logo下方 */}
          <div className="flex gap-8 mb-6">
            <Link 
              to="/" 
              className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors"
            >
              首页
            </Link>
            <Link 
              to="/video-analysis" 
              className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors"
            >
              视频分析
            </Link>
            <Link 
              to="/become-analyst" 
              className="text-[#9aa0a6] text-sm hover:text-[#4a90d9] transition-colors"
            >
              分析师招募
            </Link>
          </div>
        </div>

        {/* Bottom - 版权信息 */}
        <div className="text-center pt-8 border-t border-[#2d3748]">
          <p className="text-[#9aa0a6] text-sm">
            &copy; 2025 少年球探 Youth Scout. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
