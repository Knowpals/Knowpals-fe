import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Empty, Tag, Progress, message } from 'antd';
import { RightOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import StudentLayout from '../../layouts/StudentLayout';
import { getClassInfo, getVideoTasks } from '../../services/studentApi';

const StudentClassDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infoRes, taskRes] = await Promise.all([
        getClassInfo(classId),
        getVideoTasks(classId),
      ]);
      setClassInfo(infoRes.data || infoRes);
      setTasks(taskRes.data?.tasks || taskRes.data || []);
    } catch (error) {
      message.error('获取班级信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="班级详情">
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </StudentLayout>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <StudentLayout title={classInfo?.name || classInfo?.class_name || '班级详情'}>
      <div className="class-detail-page">
        {/* 班级信息 */}
        <Card className="class-info-card" styles={{ body: { padding: 16 } }}>
          <div className="class-info-name">
            {classInfo?.name || classInfo?.class_name}
          </div>
          <div className="class-info-meta">
            <Tag color="purple">邀请码: {classInfo?.invite_code || '无'}</Tag>
            <span>{classInfo?.student_count || tasks.length} 名同学</span>
          </div>
        </Card>

        {/* 待完成视频任务 */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              待完成 ({pendingTasks.length})
            </span>
          </div>
          {pendingTasks.length === 0 ? (
            <Empty description="所有任务已完成" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            pendingTasks.map((task) => (
              <Card
                key={task.video_id || task.id}
                className="task-card"
                onClick={() =>
                  navigate(`/student/video/${classId}/${task.video_id || task.id}`)
                }
                styles={{ body: { padding: 14 } }}
              >
                <div className="task-card-row">
                  <div className="task-card-info">
                    <div className="task-card-title">{task.title || task.video_title || '未命名视频'}</div>
                    {task.deadline && (
                      <div className="task-card-meta">
                        截止: {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <RightOutlined style={{ color: '#999' }} />
                </div>
                {task.progress !== undefined && (
                  <Progress
                    percent={Math.round((task.progress || 0) * 100)}
                    size="small"
                    strokeColor="#7c3aed"
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>
            ))
          )}
        </div>

        {/* 已完成任务 */}
        {completedTasks.length > 0 && (
          <div className="section">
            <div className="section-header">
              <span className="section-title">
                <CheckCircleOutlined style={{ marginRight: 6, color: '#10b981' }} />
                已完成 ({completedTasks.length})
              </span>
            </div>
            {completedTasks.map((task) => (
              <Card
                key={task.video_id || task.id}
                className="task-card completed"
                styles={{ body: { padding: 14 } }}
              >
                <div className="task-card-row">
                  <div className="task-card-info">
                    <div className="task-card-title">{task.title || task.video_title || '未命名视频'}</div>
                    <Tag color="green">已完成</Tag>
                  </div>
                  <span style={{ fontSize: 13, color: '#10b981' }}>100%</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentClassDetail;
