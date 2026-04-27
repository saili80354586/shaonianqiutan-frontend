import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ScoutGuardProps {
  children: React.ReactNode;
}

const ScoutGuard: React.FC<ScoutGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles || [];
    const hasScoutRole = roles.length > 0
      ? roles.some((r: any) => r.type === 'scout')
      : user?.role === 'scout';
    if (!hasScoutRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const roles = user?.roles || [];
  const hasScoutRole = roles.length > 0
    ? roles.some((r: any) => r.type === 'scout')
    : user?.role === 'scout';

  return isAuthenticated && hasScoutRole ? <>{children}</> : null;
};

export default ScoutGuard;
