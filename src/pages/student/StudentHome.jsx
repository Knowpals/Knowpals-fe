import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StudentLayout from '../../layouts/StudentLayout';
import { getMyJoinedClasses } from '../../services/studentApi';
import request from '../../utils/request';

const StudentHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({});
  const [joinModal, setJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await request.get('/class/my-joined');
      const classList = (res.code === 0 || res.code === 200)
        ? (res.data?.class_list || res.data?.classes || [])
        : [];

      setClasses(classList);

      // 为每个班级获取待完成数量 (V1逻辑: 调 behavior/class-progress/{id}/todo)
      const counts = {};
      for (const cls of classList) {
        const classId = cls.class_id || cls.id;
        try {
          const todoRes = await request.get(`/behavior/class-progress/${classId}/todo`);
          if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data?.progress_list) {
            counts[classId] = todoRes.data.progress_list.filter(
              (item) => (item.progress_percent || 0) < 100
            ).length;
          }
        } catch (e) { counts[classId] = 0; }
      }
      setPendingCounts(counts);
    } catch (error) {
      console.error('获取班级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = Object.values(pendingCounts).reduce((a, b) => a + b, 0);

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) { message.warning('请输入邀请码'); return; }
    setJoining(true);
    try {
      await request.post('/class/join', { invite_code: inviteCode.trim() });
      message.success('加入班级成功！');
      setJoinModal(false);
      setInviteCode('');
      fetchClasses();
    } catch (error) {
      message.error(error.message || '加入失败');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="首页">
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="首页">
      {/* 顶部统计 - 匹配 V1 class-detail 的 stats-section */}
      <div className="stats-section-v1">
        <div className="stats-content-v1">
          <span className="stats-icon-v1">🏫</span>
          <div className="stats-info-v1">
            <span className="stats-title-v1">我的班级</span>
            <span className="stats-count-v1">{classes.length} 个</span>
          </div>
        </div>
      </div>

      {/* 底部未完成提示 - 匹配 V1 bottom-notice */}
      {totalPending > 0 && (
        <div className="bottom-notice-v1" onClick={() => navigate('/student/learn')}>
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

      {/* 班级列表 - 匹配 V1 class-detail 的 classes-list */}
      <div className="classes-list-v1">
        <div className="section-header-v1">
          <span className="section-title-v1">我的班级</span>
          <span className="list-hint-v1">点击班级查看对应课程</span>
        </div>

        {classes.length === 0 ? (
          <Empty description="还没有加入任何班级" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => setJoinModal(true)}>加入班级</Button>
          </Empty>
        ) : (
          classes.map((cls) => {
            const classId = cls.class_id || cls.id;
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
                    <span>邀请码: {cls.invite_code || '无'}</span>
                    {pendingCounts[classId] > 0 && (
                      <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                        {pendingCounts[classId]} 个待完成
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 加入班级按钮 */}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => setJoinModal(true)}
        style={{ marginTop: 16, height: 48, borderRadius: 12 }}
      >
        加入新班级
      </Button>

      {/* 加入班级弹窗 */}
      {joinModal && (
        <div className="modal-overlay" onClick={() => setJoinModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-title">加入C++班级</div>
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>
              输入老师提供的邀请码
            </div>
            <input
              className="modal-input"
              placeholder="请输入邀请码"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <div className="modal-sheet-btns">
              <button className="modal-btn cancel" onClick={() => setJoinModal(false)}>取消</button>
              <button className="modal-btn confirm" onClick={handleJoinClass} disabled={joining}>
                {joining ? '加入中...' : '确认加入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentHome;
