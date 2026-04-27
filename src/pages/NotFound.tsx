import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-[#39ff14] mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-4">页面未找到</h1>
        <p className="text-gray-400 mb-8">您访问的页面不存在或已被移除</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#39ff14] text-black font-semibold rounded-full hover:bg-[#2dd410] transition-colors"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
