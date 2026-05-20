import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';

function formatGreeting() {
  const hours = new Date().getHours();
  let greeting = '晚上好';
  if (hours >= 6 && hours < 12) greeting = '早上好';
  else if (hours >= 12 && hours < 14) greeting = '中午好';
  else if (hours >= 14 && hours < 18) greeting = '下午好';
  const dateStr = `${new Date().getMonth() + 1}月${new Date().getDate()}日`;
  return { greeting, dateStr };
}

function formatStudyTime(totalMinutes) {
  if (totalMinutes <= 0) return '--';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;
}

export default function StudentHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [studyTime, setStudyTime] = useState('--');
  const [userInfo, setUserInfo] = useState(null);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try { setUserInfo(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/class/my-joined');
      const classList = (res.code === 0 || res.code === 200)
        ? (res.data?.class_list || [])
        : [];

      let totalPending = 0;
      let totalCompleted = 0;

      if (classList.length > 0) {
        const promises = classList.map(c => {
          const classId = c.class_id;
          return request.get(`/behavior/class-progress/${classId}/todo`).then(todoRes => {
            if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data?.progress_list) {
              const list = todoRes.data.progress_list;
              const pending = list.filter(item => (item.progress_percent || 0) < 100).length;
              const completed = list.filter(item => (item.progress_percent || 0) >= 100).length;
              return { pending, completed };
            }
            return { pending: 0, completed: 0 };
          }).catch(() => ({ pending: 0, completed: 0 }));
        });

        const results = await Promise.all(promises);
        results.forEach(r => {
          totalPending += r.pending;
          totalCompleted += r.completed;
        });
      }

      setClasses(classList);
      setPendingCount(totalPending);
      setCompletedCount(totalCompleted);

      // Load study stats
      try {
        const statsRes = await request.get('/stat/student/overview');
        if ((statsRes.code === 0 || statsRes.code === 200) && statsRes.data) {
          const totalMinutes = Math.floor((statsRes.data.total_watch_time_sec || 0) / 60);
          setStudyTime(formatStudyTime(totalMinutes));
        }
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const res = await request.post('/class/join', { invite_code: inviteCode.trim() });
      if (res.code === 0 || res.code === 200) {
        setJoinModalVisible(false);
        setInviteCode('');
        loadData();
      } else {
        alert(res.msg || '加入失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setJoining(false);
    }
  };

  const { greeting, dateStr } = formatGreeting();
  const nickname = userInfo?.username || userInfo?.name || userInfo?.nickname || '同学';

  return (
    <StudentLayout title="首页">
      <div className="home-page">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>加载中...</div>
        ) : (
          <>
            {/* Greeting card - matches H5 index.html */}
            <div className="greeting-card-v1">
              <div className="greeting-header-v1">
                <span className="greeting-text-v1">{greeting}，{nickname}</span>
                <span className="greeting-date-v1">{dateStr}</span>
              </div>
              <div className="greeting-stats-row-v1">
                <div className="greeting-stat-box-v1">
                  <div className="greeting-stat-num-v1">{pendingCount}</div>
                  <div className="greeting-stat-label-v1">待完成任务</div>
                </div>
                <div className="greeting-stat-box-v1">
                  <div className="greeting-stat-num-v1">{completedCount}</div>
                  <div className="greeting-stat-label-v1">已完成</div>
                </div>
                <div className="greeting-stat-box-v1">
                  <div className="greeting-stat-num-v1">{studyTime}</div>
                  <div className="greeting-stat-label-v1">学习时长</div>
                </div>
              </div>
            </div>

            {/* Quick entry grid - matches H5 index.html */}
            <div className="quick-grid-v1">
              <div className="quick-item-v1" onClick={() => navigate('/student/learn')}>
                <div className="quick-icon-v1 purple">📚</div>
                <span className="quick-text-v1">我的班级</span>
              </div>
              <div className="quick-item-v1" onClick={() => navigate('/student/pending-tasks')}>
                <div className="quick-icon-v1 orange">📋</div>
                <span className="quick-text-v1">未完成任务</span>
              </div>
              <div className="quick-item-v1" onClick={() => navigate('/student/settings')}>
                <div className="quick-icon-v1 blue">⚙️</div>
                <span className="quick-text-v1">设置</span>
              </div>
              <div className="quick-item-v1" onClick={() => setJoinModalVisible(true)}>
                <div className="quick-icon-v1 green">➕</div>
                <span className="quick-text-v1">加入班级</span>
              </div>
            </div>

            {/* Class list section */}
            {classes.length > 0 && (
              <div className="classes-list-v1">
                <div className="section-header-v1">
                  <span className="section-title-v1">我的班级</span>
                  <span className="list-hint-v1">点击班级查看对应课程</span>
                </div>
                {classes.map(cls => {
                  const classId = cls.class_id;
                  return (
                    <div
                      key={classId}
                      className="class-card-v1"
                      onClick={() => navigate(`/student/class/${classId}?name=${encodeURIComponent(cls.class_name || '')}`)}
                    >
                      <div className="class-avatar-v1">
                        <span>{(cls.class_name || '班').substring(0, 1)}</span>
                      </div>
                      <div className="class-content-v1">
                        <span className="class-name-v1">{cls.class_name}</span>
                        <div className="class-teacher-v1">
                          <span>👨‍🏫</span>
                          <span>{cls.teacher_name || '老师'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {classes.length === 0 && !loading && (
              <div className="home-empty-state-v1">
                <div className="home-empty-icon-v1">📚</div>
                <span className="home-empty-title-v1">还没有加入班级</span>
                <span className="home-empty-desc-v1">加入班级，开启你的学习之旅</span>
                <div className="home-join-btn-v1" onClick={() => setJoinModalVisible(true)}>加入班级</div>
              </div>
            )}
          </>
        )}

        {/* Join class modal */}
        {joinModalVisible && (
          <div className="modal-overlay" onClick={() => setJoinModalVisible(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-sheet-title">加入班级</div>
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>
                请输入老师提供的班级号
              </div>
              <input
                className="modal-input"
                placeholder="请输入8位班级号"
                maxLength={8}
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
              />
              <div className="modal-sheet-btns">
                <button className="modal-btn cancel" onClick={() => setJoinModalVisible(false)}>取消</button>
                <button className="modal-btn confirm" onClick={handleJoinClass} disabled={joining || inviteCode.length !== 8}>
                  {joining ? '加入中...' : '确定'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
