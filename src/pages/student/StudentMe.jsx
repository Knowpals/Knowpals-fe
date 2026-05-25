import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-me', `
  .me-page-v1 { padding-bottom: 20px; }
  .me-user-header-v1 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 0 0 15px 15px; padding: 24px; color: #fff; margin-bottom: 10px;
  }
  .me-user-info-row-v1 { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .me-avatar-wrapper-v1 { position: relative; cursor: pointer; flex-shrink: 0; }
  .me-avatar-img-v1 { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.4); }
  .me-avatar-edit-v1 { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #7c3aed; }
  .me-user-detail-v1 { flex: 1; min-width: 0; }
  .me-name-section-v1 { display: flex; flex-direction: column; }
  .me-user-name-v1 { font-size: 20px; font-weight: 600; }
  .me-user-id-v1 { font-size: 12px; opacity: 0.7; }
  .me-user-level-v1 { font-size: 13px; margin-top: 6px; display: flex; align-items: center; gap: 4px; opacity: 0.9; }
  .me-register-info-v1 { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .me-register-email-v1 { font-size: 12px; opacity: 0.7; }
  .me-register-time-v1, .me-register-days-v1 { font-size: 11px; opacity: 0.6; }
  .me-login-btn-v1 { background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 8px 24px; font-size: 14px; cursor: pointer; text-align: center; }
  .me-stats-overview-v1 {
    display: flex; background: #fff; margin: 0 15px 10px; padding: 15px 0;
    border-radius: 10px; justify-content: space-around;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .me-overview-item-v1 { display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; cursor: pointer; }
  .me-overview-value-v1 { font-size: 20px; font-weight: 700; color: #1f1072; margin-bottom: 5px; }
  .me-overview-label-v1 { font-size: 13px; color: #666; }
  .me-menu-section-v1 { background: #fff; margin: 0 15px 10px; border-radius: 10px; overflow: hidden; }
  .me-menu-section-header-v1 { padding: 15px 15px 10px; font-size: 14px; color: #999; }
  .me-menu-list-v1 { /* container */ }
  .me-menu-item-v1 {
    display: flex; align-items: center; justify-content: space-between;
    padding: 15px; border-bottom: 1px solid #f5f5f5; cursor: pointer;
  }
  .me-menu-item-v1:last-child { border-bottom: none; }
  .me-menu-left-v1 { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; }
  .me-menu-icon-v1 { font-size: 20px; width: 30px; text-align: center; }
  .me-menu-arrow-v1 { font-size: 20px; color: #ddd; }
  .me-badge-v1 { background: #ff4757; color: #fff; font-size: 10px; padding: 2px 7px; border-radius: 10px; min-width: 18px; text-align: center; }
  .me-badge-v1.show { display: inline-block; }
  .me-logout-section-v1 { margin-top: 20px; text-align: center; padding: 0 15px 20px; }
  .me-logout-btn-v1 { background: #fff; color: #ff4757; border: 1px solid #ff4757; padding: 12px; border-radius: 8px; font-size: 14px; cursor: pointer; width: 100%; }
  .me-info-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 999; display: flex; align-items: center; justify-content: center; }
  .me-info-modal-box { width: 85%; max-width: 320px; background: #fff; border-radius: 12px; overflow: hidden; animation: slideUp 0.3s ease; }
  .me-info-modal-title { padding: 16px; text-align: center; font-size: 17px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
  .me-info-modal-body { padding: 16px; font-size: 14px; color: #666; line-height: 1.6; white-space: pre-wrap; }
  .me-info-modal-footer { border-top: 1px solid #f0f0f0; display: flex; }
  .me-info-modal-btn { flex: 1; padding: 12px 0; text-align: center; font-size: 15px; cursor: pointer; background: #fff; color: #7c3aed; font-weight: 600; border: none; }
`);

function calculateRegisterDays(createdAt) {
  if (!createdAt) return 0;
  try {
    const registerDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - registerDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateStr;
  }
}

export default function StudentMe() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registerTime, setRegisterTime] = useState('');
  const [registerDays, setRegisterDays] = useState(0);
  const [studyData, setStudyData] = useState({
    totalDuration: '0分钟',
    completedCourses: 0,
    totalCourses: 0,
    correctRate: 0,
  });
  const [unreadCount] = useState(3);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalContent, setInfoModalContent] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('userInfo');
    if (token) {
      setIsLoggedIn(true);
      if (stored) {
        try {
          const info = JSON.parse(stored);
          setUserInfo(info);
          if (info.created_at) {
            setRegisterTime(formatDate(info.created_at));
            setRegisterDays(info.register_day || calculateRegisterDays(info.created_at));
          }
        } catch (e) { /* ignore */ }
      }
      loadUserDetail();
      loadStudyData();
    }
  }, []);

  const loadUserDetail = async () => {
    try {
      const res = await request.get('/user/getUserInfo');
      if ((res.code === 0 || res.code === 200) && res.data) {
        const userData = res.data;
        const days = userData.register_day || calculateRegisterDays(userData.created_at);
        const time = formatDate(userData.created_at);

        const localInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const updated = {
          ...localInfo,
          username: userData.username || localInfo.username,
          email: userData.email || localInfo.email,
          created_at: userData.created_at,
          register_day: days,
        };
        localStorage.setItem('userInfo', JSON.stringify(updated));
        setUserInfo(updated);
        setRegisterTime(time);
        setRegisterDays(days);
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  };

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
          correctRate: Math.round((data.correct_rate || 0) * 100),
        });
      }
    } catch (err) {
      console.error('获取学习数据失败:', err);
    }
  };

  const showFeatureDetail = (feature, title) => {
    const contentMap = {
      notifications: '📢 欢迎新同学加入',
      help: '📞 联系我们\n邮箱: 2594606621@qq.com\n电话: 15308650273\n\n⏰ 服务时间: 周一到周五9:00-18:00',
      about: '🏫 知伴 - 智能学习伴侣\n版本: 1.0.0\n© 2026 知伴团队\n\n让学习更有趣，让知识更易懂',
    };
    setInfoModalTitle(title);
    setInfoModalContent(contentMap[feature] || '');
    setShowInfoModal(true);
  };

  const handleLogout = () => {
    if (!window.confirm('确定要退出登录吗？')) return;
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate('/');
  };

  const chooseAvatar = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const updated = { ...(userInfo || {}), avatarUrl: ev.target.result };
          setUserInfo(updated);
          localStorage.setItem('userInfo', JSON.stringify(updated));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const username = userInfo?.username || userInfo?.nickName || userInfo?.name || '未登录';
  const userId = userInfo?.studentId || userInfo?.student_id || '000000';

  return (
    <StudentLayout title="我的">
      <div className="me-page-v1">
        {/* User header card - matches H5 me.html */}
        <div className="me-user-header-v1">
          <div className="me-user-info-row-v1">
            <div className="me-avatar-wrapper-v1" onClick={() => isLoggedIn ? chooseAvatar() : navigate('/')}>
              <img
                src={userInfo?.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ddd'/%3E%3Ctext x='50' y='65' text-anchor='middle' font-size='40'%3E👤%3C/text%3E%3C/svg%3E"}
                alt=""
                className="me-avatar-img-v1"
              />
              {isLoggedIn && <div className="me-avatar-edit-v1">✎</div>}
            </div>
            <div className="me-user-detail-v1">
              <div className="me-name-section-v1">
                <span className="me-user-name-v1">{username}</span>
                <span className="me-user-id-v1">{isLoggedIn ? `ID: ${userId}` : '点击登录'}</span>
              </div>
              {isLoggedIn && (
                <>
                  <div className="me-user-level-v1">
                    <span>⭐</span>
                    <span>Lv.{userInfo?.level || 1}</span>
                  </div>
                  {(userInfo?.email || registerTime || registerDays > 0) && (
                    <div className="me-register-info-v1">
                      {userInfo?.email && <span className="me-register-email-v1">{userInfo.email}</span>}
                      {registerTime && <span className="me-register-time-v1">注册于 {registerTime}</span>}
                      {registerDays > 0 && <span className="me-register-days-v1">已使用 {registerDays} 天</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {!isLoggedIn && (
            <div className="me-login-btn-v1" onClick={() => navigate('/')}>登录/注册</div>
          )}
        </div>

        {/* Study stats overview - matches H5 me.html */}
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
              <span className="me-overview-value-v1">{studyData.correctRate}%</span>
              <span className="me-overview-label-v1">答题正确率</span>
            </div>
          </div>
        )}

        {/* Menu sections - matches H5 me.html */}
        <div className="me-menu-section-v1">
          <div className="me-menu-section-header-v1">
            <span>系统设置</span>
          </div>
          <div className="me-menu-list-v1">
            {isLoggedIn && (
              <div className="me-menu-item-v1" onClick={() => navigate('/student/settings')}>
                <div className="me-menu-left-v1">
                  <span className="me-menu-icon-v1">👤</span>
                  <span>账户设置</span>
                </div>
                <span className="me-menu-arrow-v1">›</span>
              </div>
            )}
            <div className="me-menu-item-v1" onClick={() => showFeatureDetail('notifications', '消息通知')}>
              <div className="me-menu-left-v1">
                <span className="me-menu-icon-v1">🔔</span>
                <span>消息通知</span>
                {unreadCount > 0 && (
                  <span className="me-badge-v1 show">{unreadCount}</span>
                )}
              </div>
              <span className="me-menu-arrow-v1">›</span>
            </div>
            <div className="me-menu-item-v1" onClick={() => showFeatureDetail('help', '帮助与反馈')}>
              <div className="me-menu-left-v1">
                <span className="me-menu-icon-v1">❓</span>
                <span>帮助与反馈</span>
              </div>
              <span className="me-menu-arrow-v1">›</span>
            </div>
            <div className="me-menu-item-v1" onClick={() => showFeatureDetail('about', '关于知伴')}>
              <div className="me-menu-left-v1">
                <span className="me-menu-icon-v1">ℹ️</span>
                <span>关于知伴</span>
              </div>
              <span className="me-menu-arrow-v1">›</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        {isLoggedIn && (
          <div className="me-logout-section-v1">
            <button className="me-logout-btn-v1" onClick={handleLogout}>退出登录</button>
          </div>
        )}

        {/* Info modal */}
        {showInfoModal && (
          <div className="me-info-modal-overlay" onClick={() => setShowInfoModal(false)}>
            <div className="me-info-modal-box" onClick={e => e.stopPropagation()}>
              <div className="me-info-modal-title">{infoModalTitle}</div>
              <div className="me-info-modal-body">{infoModalContent}</div>
              <div className="me-info-modal-footer">
                <button className="me-info-modal-btn" onClick={() => setShowInfoModal(false)}>知道了</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
