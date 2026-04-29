import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface ClubGuardProps {
  children: React.ReactNode;
}

const ClubGuard: React.FC<ClubGuardProps> = ({ children }) => {
  const { user, isAuthenticated, currentRole, setCurrentRole } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    // 检查当前角色是否为俱乐部
    if (currentRole !== 'club') {
      // 如果用户有 club 角色但当前角色不是 club，切换到 club 角色
      const hasClubRole = user?.roles?.some((r: any) => r.type === 'club');
      if (hasClubRole) {
        setCurrentRole('club');
      } else {
        navigate('/', { replace: true });
      }
      return;
    }
  }, [isAuthenticated, user, currentRole, navigate, setCurrentRole]);

  return isAuthenticated && currentRole === 'club' ? <>{children}</> : null;
};

export default ClubGuard;
