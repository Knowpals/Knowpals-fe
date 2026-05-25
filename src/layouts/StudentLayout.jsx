import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import { HomeOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import { injectStyles } from '../utils/injectStyles';

injectStyles('student-layout', `
  .student-app {
    max-width: 480px; margin: 0 auto; min-height: 100vh;
    background: #f5f5f5; position: relative; padding-bottom: 60px;
  }
  .student-header {
    position: sticky; top: 0; z-index: 100; background: #fff;
    padding: 12px 16px; display: flex; align-items: center;
    justify-content: space-between; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .student-logo { font-size: 20px; font-weight: 700; color: #7c3aed; }
  .student-header-right { display: flex; align-items: center; cursor: pointer; }
  .student-avatar {
    width: 32px; height: 32px; border-radius: 50%; background: #ede9fe;
    display: flex; align-items: center; justify-content: center; color: #7c3aed;
  }
  .student-page-title {
    background: #fff; padding: 12px 16px; font-size: 18px;
    font-weight: 600; color: #1f2937; border-bottom: 1px solid #f3f4f6;
  }
  .student-content { padding: 12px 16px; }
  .student-tabbar {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px; height: 56px; background: #fff;
    display: flex; align-items: center; justify-content: space-around;
    box-shadow: 0 -1px 8px rgba(0,0,0,0.06); z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .student-tabbar-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 4px 0; cursor: pointer;
    color: #9ca3af; transition: color 0.2s;
  }
  .student-tabbar-item.active { color: #7c3aed; }
  .student-tabbar-icon { font-size: 20px; margin-bottom: 2px; }
  .student-tabbar-label { font-size: 11px; }
  @media (min-width: 481px) {
    .student-app { max-width: 100%; padding-bottom: 70px; box-shadow: none; min-height: 100vh; }
    .student-header { padding: 14px 32px; }
    .student-page-title { padding: 14px 32px; }
    .student-content { padding: 16px 32px; max-width: 1200px; margin: 0 auto; }
    .student-tabbar { max-width: 100%; }
  }
`);

const tabs = [
  { key: '/student/home', label: '首页', icon: <HomeOutlined /> },
  { key: '/student/learn', label: '学习', icon: <BookOutlined /> },
  { key: '/student/me', label: '我的', icon: <UserOutlined /> },
];

const StudentLayout = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try { setUserInfo(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userInfo');
        message.success('已退出登录');
        navigate('/');
      },
    });
  };

  const pathParts = location.pathname.split('/');
  const activeKey = '/student/' + (pathParts[2] || 'home');

  const isLearnActive = ['/student/learn', '/student/class', '/student/video', '/student/pending-tasks', '/student/weak-points', '/student/learning-analysis', '/student/deep-practice', '/student/small-kg', '/student/big-kg'].includes(activeKey)
    || location.pathname.startsWith('/student/class/')
    || location.pathname.startsWith('/student/video/');

  return (
    <div className="student-app">
      <div className="student-header">
        <div className="student-header-left">
          <span className="student-logo">知伴AI</span>
        </div>
        <div className="student-header-right" onClick={handleLogout}>
          <span style={{ fontSize: 13, marginRight: 8 }}>
            {userInfo.username || userInfo.name || '同学'}
          </span>
          <div className="student-avatar"><UserOutlined /></div>
        </div>
      </div>

      {title && <div className="student-page-title">{title}</div>}

      <div className="student-content">{children}</div>

      <div className="student-tabbar">
        {tabs.map((tab) => {
          const isActive = tab.key === '/student/learn' ? isLearnActive : activeKey === tab.key;
          return (
            <div
              key={tab.key}
              className={`student-tabbar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(tab.key)}
            >
              <span className="student-tabbar-icon">{tab.icon}</span>
              <span className="student-tabbar-label">{tab.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentLayout;
