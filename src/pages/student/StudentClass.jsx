import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spin, Empty, Tag, Button, message } from 'antd';
import { PlusOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons';
import StudentLayout from '../../layouts/StudentLayout';
import { getMyJoinedClasses, getVideoTasks, joinClass } from '../../services/studentApi';

const StudentClass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [joinModal, setJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await getMyJoinedClasses();
      const classList = res.data?.classes || res.data || [];
      setClasses(classList);
    } catch (error) {
      console.error('获取班级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim()) {
      message.warning('请输入邀请码');
      return;
    }
    setJoining(true);
    try {
      await joinClass({ invite_code: inviteCode.trim() });
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
      <StudentLayout title="我的班级">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="我的班级">
      <div className="student-class">
        {classes.length === 0 ? (
          <Empty
            description="还没有加入任何班级"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setJoinModal(true)}>
              加入班级
            </Button>
          </Empty>
        ) : (
          <>
            {classes.map((cls) => (
              <Card
                key={cls.class_id || cls.id}
                className="class-card"
                onClick={() => navigate(`/student/class/${cls.class_id || cls.id}`)}
                styles={{ body: { padding: 16 } }}
              >
                <div className="class-card-row">
                  <div>
                    <div className="class-card-name">{cls.name || cls.class_name}</div>
                    <div className="class-card-meta">
                      <TeamOutlined style={{ marginRight: 4 }} />
                      {cls.student_count || 0} 名同学
                      {cls.invite_code && (
                        <Tag style={{ marginLeft: 8 }}>邀请码: {cls.invite_code}</Tag>
                      )}
                    </div>
                  </div>
                  <RightOutlined style={{ color: '#999' }} />
                </div>
              </Card>
            ))}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => setJoinModal(true)}
              style={{ marginTop: 16, height: 48, borderRadius: 12 }}
            >
              加入新班级
            </Button>
          </>
        )}

        {/* 简易加入班级弹窗 */}
        {joinModal && (
          <div className="modal-overlay" onClick={() => setJoinModal(false)}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-sheet-title">加入班级</div>
              <input
                className="modal-input"
                placeholder="输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <div className="modal-sheet-btns">
                <button className="modal-btn cancel" onClick={() => setJoinModal(false)}>
                  取消
                </button>
                <button className="modal-btn confirm" onClick={handleJoinClass} disabled={joining}>
                  {joining ? '加入中...' : '确认加入'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentClass;
