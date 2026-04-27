import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface AnalystGuardProps {
  children: React.ReactNode;
}

const AnalystGuard: React.FC<AnalystGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    // 兼容两种格式：roles 数组 或 role 字符串
    const roles = user?.roles || [];
    const hasAnalystRole = roles.length > 0
      ? roles.some((r: any) => r.type === 'analyst')
      : user?.role === 'analyst';
    if (!hasAnalystRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const roles = user?.roles || [];
  const hasAnalystRole = roles.length > 0
    ? roles.some((r: any) => r.type === 'analyst')
    : user?.role === 'analyst';
  return isAuthenticated && hasAnalystRole ? <>{children}</> : null;
};

export default AnalystGuard;
