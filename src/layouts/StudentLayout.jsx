import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import { HomeOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';

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

  const isLearnActive = ['/student/learn', '/student/class', '/student/video', '/student/pending-tasks', '/student/weak-points'].includes(activeKey)
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
