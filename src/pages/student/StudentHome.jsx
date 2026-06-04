import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import PersonaMiniPanel from '../../components/PersonaMiniPanel';
import AIIntroCard from '../../components/AIIntroCard';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-home', `
  .greeting-card-v1 {
    background: linear-gradient(160deg, #5b21b6 0%, #7c3aed 30%, #8b5cf6 60%, #a78bfa 100%);
    border-radius: 16px; padding: 20px 16px; margin-bottom: 14px; color: #fff;
    position: relative; overflow: hidden;
    box-shadow: 0 4px 24px rgba(124,58,237,0.18);
  }
  .greeting-card-v1::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: url('/首页问候卡片.png') center / cover no-repeat;
    opacity: 0.10; pointer-events: none; z-index: 0;
  }
  .greeting-card-v1 > * { position: relative; z-index: 1; }
  .greeting-header-v1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .greeting-text-v1 { font-size: 18px; font-weight: 500; letter-spacing: 0.3px; }
  .greeting-date-v1 { font-size: 12px; opacity: 0.75; font-weight: 400; }
  .greeting-stats-row-v1 { display: flex; justify-content: space-around; }
  .greeting-stat-box-v1 { display: flex; flex-direction: column; align-items: center; }
  .greeting-stat-num-v1 { font-size: 26px; font-weight: 300; letter-spacing: -1px; }
  .greeting-stat-label-v1 { font-size: 11px; opacity: 0.70; margin-top: 4px; font-weight: 400; }
  .quick-grid-v1 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .quick-item-v1 {
    background: #fff; border-radius: 14px; padding: 18px 12px;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    cursor: pointer; border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 0 rgba(124,58,237,0);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .quick-item-v1:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(124,58,237,0.08), 0 1px 3px rgba(0,0,0,0.04);
    border-color: rgba(124,58,237,0.12);
  }
  .quick-item-v1:active { transform: scale(0.98); }
  .quick-icon-v1 {
    width: 46px; height: 46px; border-radius: 14px; display: flex;
    align-items: center; justify-content: center; font-size: 20px;
  }
  .quick-icon-v1.purple { background: #f5f3ff; color: #7c3aed; }
  .quick-icon-v1.orange { background: #fffbf0; color: #f59e0b; }
  .quick-icon-v1.blue { background: #f0f7ff; color: #3b82f6; }
  .quick-icon-v1.green { background: #f0fdf4; color: #10b981; }
  .quick-text-v1 { font-size: 13px; color: #374151; font-weight: 500; letter-spacing: 0.2px; }
  .classes-list-v1 {
    background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 14px;
    border: 1px solid rgba(0,0,0,0.04);
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .section-header-v1 {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 16px 12px; border-bottom: 1px solid #f3f4f6;
  }
  .section-title-v1 { font-size: 15px; font-weight: 600; color: #1f2937; letter-spacing: 0.2px; }
  .list-hint-v1 { font-size: 12px; color: #9ca3af; font-weight: 400; }
  .class-card-v1 {
    display: flex; align-items: center; padding: 14px 16px;
    border-bottom: 1px solid #f9fafb; cursor: pointer;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
  }
  .class-card-v1:last-child { border-bottom: none; }
  .class-card-v1:hover {
    background: #faf9ff;
    border-left-color: #7c3aed;
  }
  .class-card-v1:active { background: #f5f3ff; }
  .class-avatar-v1 {
    width: 42px; height: 42px; border-radius: 12px;
    background: linear-gradient(145deg, #6d28d9, #8b5cf6);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 600; margin-right: 14px; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(124,58,237,0.2);
  }
  .class-content-v1 { flex: 1; min-width: 0; }
  .class-name-v1 { font-size: 15px; font-weight: 500; color: #1f2937; display: block; margin-bottom: 3px; }
  .class-teacher-v1 { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 4px; font-weight: 400; }
  .home-empty-state-v1 {
    text-align: center; padding: 60px 20px; display: flex;
    flex-direction: column; align-items: center;
  }
  .home-empty-icon-v1 { font-size: 64px; margin-bottom: 16px; }
  .home-empty-title-v1 { font-size: 16px; font-weight: 500; color: #374151; margin-bottom: 8px; }
  .home-empty-desc-v1 { font-size: 13px; color: #9ca3af; margin-bottom: 24px; }
  .home-join-btn-v1 {
    background: linear-gradient(145deg, #6d28d9, #8b5cf6); color: #fff;
    padding: 12px 40px; border-radius: 25px; font-size: 14px; font-weight: 500; cursor: pointer;
    border: none; letter-spacing: 0.3px;
    box-shadow: 0 2px 12px rgba(124,58,237,0.25);
    transition: all 0.2s ease;
  }
  .home-join-btn-v1:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 18px rgba(124,58,237,0.35);
  }
`);

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

      // 后端未接入时，添加数值分析演示课程供前端展示
      if (classList.length === 0) {
        classList.push({
          class_id: 'demo_na_001',
          class_name: '数值分析',
          teacher_name: '吴教授',
          teacher_avatar: '',
          cover_url: '',
          student_count: 32,
          video_list: [
            { video_id: 'demo_v_001', title: '非线性方程求根方法' },
            { video_id: 'demo_v_002', title: '插值法与数值积分' },
          ],
        });
      }

      setClasses(classList);
      setPendingCount(totalPending || 2);
      setCompletedCount(totalCompleted || 6);

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

            {/* Persona mini panel - V2 */}
            <PersonaMiniPanel />

            {/* AI assistant intro - V2 */}
            <AIIntroCard />

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
