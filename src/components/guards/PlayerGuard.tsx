import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface PlayerGuardProps {
  children: React.ReactNode;
}

const PlayerGuard: React.FC<PlayerGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles || [];
    const hasPlayerRole = roles.length > 0
      ? roles.some((r: any) => r.type === 'player')
      : user?.role === 'player';
    if (!hasPlayerRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const roles = user?.roles || [];
  const hasPlayerRole = roles.length > 0
    ? roles.some((r: any) => r.type === 'player')
    : user?.role === 'player';

  return isAuthenticated && hasPlayerRole ? <>{children}</> : null;
};

export default PlayerGuard;
