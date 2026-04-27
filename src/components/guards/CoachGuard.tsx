import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface CoachGuardProps {
  children: React.ReactNode;
}

const CoachGuard: React.FC<CoachGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    // 兼容两种格式：roles 数组 或 role 字符串
    const roles = user?.roles || [];
    const hasCoachRole = roles.length > 0
      ? roles.some((r: any) => r.type === 'coach')
      : user?.role === 'coach';
    if (!hasCoachRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const roles = user?.roles || [];
  const hasCoachRole = roles.length > 0
    ? roles.some((r: any) => r.type === 'coach')
    : user?.role === 'coach';

  return isAuthenticated && hasCoachRole ? <>{children}</> : null;
};

export default CoachGuard;
