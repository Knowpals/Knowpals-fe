import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard = ({ children, allowedRole }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    const fallback = role === 'teacher' ? '/home' : '/student/home';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default AuthGuard;
