import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';

export default function StudentSettings() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [registerTime, setRegisterTime] = useState('--');
  const [registerDays, setRegisterDays] = useState('--');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try {
        const info = JSON.parse(stored);
        setUserInfo(info);
        loadUserInfoFromServer(info);
      } catch (e) { /* ignore */ }
    }
  }, []);

  const loadUserInfoFromServer = async (localInfo) => {
    try {
      const res = await request.get('/user/getUserInfo');
      if ((res.code === 0 || res.code === 200) && res.data) {
        const data = res.data;
        const updated = {
          username: data.username || localInfo?.username || '用户',
          email: data.email || '',
          created_at: data.created_at || '',
          register_day: data.register_day || 0,
          student_id: data.student_id || '000000',
          avatarUrl: localInfo?.avatarUrl || '',
        };
        localStorage.setItem('userInfo', JSON.stringify(updated));
        setUserInfo(updated);
        updateRegisterInfo(updated);
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      if (localInfo) updateRegisterInfo(localInfo);
    }
  };

  const updateRegisterInfo = (info) => {
    if (!info) return;
    const days = info.register_day || 0;
    let time = '--';
    if (info.created_at) {
      try {
        const date = new Date(info.created_at);
        time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } catch (e) {
        time = info.created_at;
      }
    }
    setRegisterDays(days > 0 ? `${days}天` : '--');
    setRegisterTime(time);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const changeAvatar = () => {
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
          showToast('头像更新成功');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const changeEmail = () => {
    showToast('此功能在后续版本开放');
  };

  const showAbout = () => {
    alert('Knowpals v1.0.0\n\n一个智能学习助手，帮助你更好地学习和掌握知识。\n\n© 2024 All Rights Reserved');
  };

  const handleLogout = () => {
    if (!window.confirm('确定要退出登录吗？')) return;
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <StudentLayout title="设置">
      <div className="settings-page-v1">
        {/* User info card - matches H5 settings.html */}
        <div className="settings-user-card-v1">
          <img
            className="settings-avatar-v1"
            src={userInfo?.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ddd'/%3E%3C/svg%3E"}
            alt=""
          />
          <span className="settings-name-v1">{userInfo?.username || userInfo?.nickName || '用户'}</span>
          <span className="settings-id-v1">学号: {userInfo?.student_id || userInfo?.studentId || '000000'}</span>
        </div>

        {/* Info list - matches H5 settings.html */}
        <div className="settings-info-list-v1">
          <div className="settings-info-item-v1">
            <span className="settings-label-v1">绑定邮箱</span>
            <span className="settings-value-v1">{userInfo?.email || '未绑定'}</span>
          </div>
          <div className="settings-info-item-v1">
            <span className="settings-label-v1">注册时间</span>
            <span className="settings-value-v1">{registerTime}</span>
          </div>
          <div className="settings-info-item-v1">
            <span className="settings-label-v1">学习天数</span>
            <span className="settings-value-v1">{registerDays}</span>
          </div>
        </div>

        {/* Action buttons - matches H5 settings.html */}
        <div className="settings-action-section-v1">
          <span className="settings-action-title-v1">账号设置</span>
          <div className="settings-action-buttons-v1">
            <button className="settings-action-btn-v1 avatar" onClick={changeAvatar}>📷 修改头像</button>
            <button className="settings-action-btn-v1 email" onClick={changeEmail}>✉️ 修改绑定邮箱</button>
          </div>
        </div>

        <div className="settings-action-section-v1">
          <span className="settings-action-title-v1">其他</span>
          <div className="settings-action-buttons-v1">
            <button className="settings-action-btn-v1 about" onClick={showAbout}>ℹ️ 关于我们</button>
            <button className="settings-action-btn-v1 logout" onClick={handleLogout}>🚪 退出登录</button>
          </div>
        </div>

        {/* Version info */}
        <div className="settings-version-v1">
          <p>Knowpals v1.0.0</p>
          <p>© 2024 All Rights Reserved</p>
        </div>

        {/* Toast */}
        {toastMsg && <div className="settings-toast-v1">{toastMsg}</div>}
      </div>
    </StudentLayout>
  );
}
