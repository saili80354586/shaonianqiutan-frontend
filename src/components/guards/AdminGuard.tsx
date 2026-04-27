import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = user?.roles || [];
    const hasAdminRole = roles.length > 0
      ? roles.some((r: any) => r.type === 'admin')
      : user?.role === 'admin';
    if (!hasAdminRole) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const roles = user?.roles || [];
  const hasAdminRole = roles.length > 0
    ? roles.some((r: any) => r.type === 'admin')
    : user?.role === 'admin';

  return isAuthenticated && hasAdminRole ? <>{children}</> : null;
};

export default AdminGuard;
