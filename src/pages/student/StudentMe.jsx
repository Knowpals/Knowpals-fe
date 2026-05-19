import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';

// V1 me.html 逻辑：「我的」页面
const StudentMe = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({});
  const [studyData, setStudyData] = useState({ totalDuration: '0分钟', completedCourses: 0, totalCourses: 0, correctRate: '0%' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      if (stored) {
        try { setUserInfo(JSON.parse(stored)); } catch (e) { /* ignore */ }
      }
      loadStudyData();
    }
  }, []);

  const loadStudyData = async () => {
    try {
      const res = await request.get('/stat/student/overview');
      if ((res.code === 0 || res.code === 200) && res.data) {
        const data = res.data;
        const totalMinutes = Math.floor((data.total_watch_time_sec || 0) / 60);
        setStudyData({
          totalDuration: totalMinutes > 0 ? `${totalMinutes}分钟` : '0分钟',
          completedCourses: data.finished_count || 0,
          totalCourses: data.total_count || 0,
          correctRate: `${Math.round((data.correct_rate || 0) * 100)}%`,
        });
      }
    } catch (e) {
      console.error('获取学习数据失败:', e);
    }
  };

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

  return (
    <StudentLayout title="我的">
      <div className="me-page">
        {/* 用户信息卡片 */}
        <div className="me-profile-card-v1">
          <div className="me-avatar-v1">👤</div>
          <div className="me-name-v1">{userInfo.username || userInfo.name || '同学'}</div>
          <div className="me-email-v1">{userInfo.email || ''}</div>
        </div>

        {/* 学习数据概览 */}
        {isLoggedIn && (
          <div className="me-stats-overview-v1">
            <div className="me-overview-item-v1">
              <span className="me-overview-value-v1">{studyData.totalDuration}</span>
              <span className="me-overview-label-v1">总学习时长</span>
            </div>
            <div className="me-overview-item-v1">
              <span className="me-overview-value-v1">{studyData.completedCourses}/{studyData.totalCourses}</span>
              <span className="me-overview-label-v1">完成课程</span>
            </div>
            <div className="me-overview-item-v1">
              <span className="me-overview-value-v1">{studyData.correctRate}</span>
              <span className="me-overview-label-v1">答题正确率</span>
            </div>
          </div>
        )}

        {/* 功能菜单 */}
        <div className="me-menu-section-v1">
          <div className="me-menu-header-v1">
            <span>系统设置</span>
          </div>
          {isLoggedIn && (
            <div className="me-menu-item-v1" onClick={() => navigate('/student/settings')}>
              <div className="me-menu-left-v1">
                <span className="me-menu-icon-v1">👤</span>
                <span>账户设置</span>
              </div>
              <span className="me-menu-arrow-v1">›</span>
            </div>
          )}
          <div className="me-menu-item-v1" onClick={() => message.info('帮助与反馈\n邮箱: 2594606621@qq.com\n电话: 15308650273')}>
            <div className="me-menu-left-v1">
              <span className="me-menu-icon-v1">❓</span>
              <span>帮助与反馈</span>
            </div>
            <span className="me-menu-arrow-v1">›</span>
          </div>
          <div className="me-menu-item-v1" onClick={() => message.info('知伴 - 智能学习伴侣\n版本: 1.0.0')}>
            <div className="me-menu-left-v1">
              <span className="me-menu-icon-v1">ℹ️</span>
              <span>关于知伴</span>
            </div>
            <span className="me-menu-arrow-v1">›</span>
          </div>
        </div>

        {/* 退出登录 */}
        {isLoggedIn && (
          <div className="me-logout-section-v1">
            <div className="me-logout-btn-v1" onClick={handleLogout}>退出登录</div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentMe;
