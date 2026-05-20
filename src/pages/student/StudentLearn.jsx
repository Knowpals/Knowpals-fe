import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';

// 学习 tab = V1 class-detail.html
export default function StudentLearn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [totalPending, setTotalPending] = useState(0);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await request.get('/class/my-joined');
      const classList = (res.code === 0 || res.code === 200)
        ? (res.data?.class_list || [])
        : [];
      setClasses(classList);

      const counts = {};
      let total = 0;
      await Promise.all(classList.map(async (cls) => {
        const classId = cls.class_id || cls.id;
        try {
          const todoRes = await request.get(`/behavior/class-progress/${classId}/todo`);
          if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data?.progress_list) {
            const pending = todoRes.data.progress_list.filter(
              item => (item.progress_percent || 0) < 100
            ).length;
            counts[classId] = pending;
            total += pending;
          }
        } catch (e) { counts[classId] = 0; }
      }));
      setPendingCounts(counts);
      setTotalPending(total);
    } catch (error) {
      console.error('获取班级失败:', error);
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
        fetchClasses();
      } else {
        alert(res.msg || '加入失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setJoining(false);
    }
  };

  const goToPendingTasks = () => {
    navigate('/student/pending-tasks');
  };

  return (
    <StudentLayout title="学习">
      <div className="learn-page-v1">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>加载中...</div>
        ) : (
          <>
            {/* Stats section - matches H5 class-detail.html */}
            <div className="stats-section-v1">
              <div className="stats-content-v1">
                <span className="stats-icon-v1">🏫</span>
                <div className="stats-info-v1">
                  <span className="stats-title-v1">我的班级</span>
                  <span className="stats-count-v1">{classes.length} 个</span>
                </div>
              </div>
            </div>

            {/* Bottom notice for pending tasks - matches H5 */}
            {totalPending > 0 && (
              <div className="bottom-notice-v1" onClick={goToPendingTasks}>
                <div className="notice-content-v1">
                  <span className="notice-icon-v1">📋</span>
                  <div className="notice-info-v1">
                    <span className="notice-title-v1">您有 {totalPending} 个未完成预习</span>
                    <span className="notice-subtitle-v1">点击查看并继续学习</span>
                  </div>
                </div>
                <span className="notice-arrow-v1">›</span>
              </div>
            )}

            {/* Class list */}
            <div className="classes-list-v1">
              <div className="section-header-v1">
                <span className="section-title-v1">我的班级</span>
                <span className="list-hint-v1">点击班级查看对应课程</span>
              </div>

              {classes.length === 0 ? (
                <div className="learn-empty-state-v1">
                  <div className="learn-empty-icon-v1">🏫</div>
                  <span className="learn-empty-title-v1">暂无班级</span>
                  <span className="learn-empty-text-v1">您还没有加入任何班级</span>
                  <div className="learn-join-btn-v1" onClick={() => setJoinModalVisible(true)}>加入班级</div>
                </div>
              ) : (
                classes.map(cls => {
                  const classId = cls.class_id || cls.id;
                  const pending = pendingCounts[classId] || 0;
                  return (
                    <div
                      key={classId}
                      className="class-card-v1"
                      onClick={() => navigate(`/student/class/${classId}?name=${encodeURIComponent(cls.class_name || cls.name || '')}`)}
                    >
                      <div className="class-avatar-v1">
                        <span>{(cls.class_name || cls.name || '班').substring(0, 1)}</span>
                      </div>
                      <div className="class-content-v1">
                        <span className="class-name-v1">{cls.class_name || cls.name}</span>
                        <div className="class-teacher-v1">
                          <span>👨‍🏫</span>
                          <span>{cls.teacher_name || '老师'}</span>
                        </div>
                        <div className="class-meta-v1">
                          {pending > 0 && (
                            <span style={{ color: '#f59e0b' }}>{pending} 个待完成</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
