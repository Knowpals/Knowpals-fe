import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Empty, message } from 'antd';
import request from '../../utils/request';

// V1 class-course.html 逻辑：班级内的课程任务列表 + 操作弹窗
const StudentClassCourse = () => {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [className, setClassName] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [stats, setStats] = useState({ completed: 0, pending: 0, total: 0 });

  useEffect(() => {
    if (classId) loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      setClassName(searchParams.get('name') || '课程详情');

      // V1: 同时请求 all 和 todo
      const [allRes, todoRes] = await Promise.all([
        request.get(`/behavior/class-progress/${classId}/all`),
        request.get(`/behavior/class-progress/${classId}/todo`),
      ]);

      let allTasks = [];
      let todoCount = 0;

      if ((allRes.code === 0 || allRes.code === 200) && allRes.data?.progress_list) {
        allTasks = allRes.data.progress_list.map((item) => ({
          video_id: item.video_id,
          title: item.title,
          status: item.status,
          progress: item.progress_percent || 0,
          watch_time: item.watch_time || 0,
          duration: item.duration || 0,
          deadline: item.deadline,
        }));
      }

      if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data?.progress_list) {
        todoCount = todoRes.data.progress_list.length;
      }

      setTasks(allTasks);
      const completed = allTasks.filter((t) => t.progress >= 100).length;
      setStats({ completed, pending: todoCount, total: allTasks.length });
    } catch (error) {
      console.error('加载课程失败:', error);
      message.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (task) => {
    setSelectedTask(task);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedTask(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0分钟';
    return Math.floor(seconds / 60) + '分钟';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="class-course-page">
      {/* 班级信息头 - V1 current-class-info */}
      <div className="class-course-header">
        <div
          className="back-btn-v1"
          onClick={() => navigate('/student/learn')}
          style={{ cursor: 'pointer', padding: '8px 0', color: '#7c3aed', fontSize: 14 }}
        >
          ← 返回班级列表
        </div>
        <div className="class-course-name">{className}</div>
        <div className="class-course-stats">
          <div className="stat-item-v1">
            <span className="stat-value-v1">{stats.completed}</span>
            <span className="stat-label-v1">已完成</span>
          </div>
          <div className="stat-item-v1">
            <span className="stat-value-v1">{stats.pending}</span>
            <span className="stat-label-v1">未完成</span>
          </div>
          <div className="stat-item-v1">
            <span className="stat-value-v1">{stats.total}</span>
            <span className="stat-label-v1">总课程</span>
          </div>
        </div>
      </div>

      {/* 任务列表 - V1 tasks-list */}
      <div className="tasks-list-v1">
        {tasks.length === 0 ? (
          <Empty description="暂无课程" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          tasks.map((task) => {
            const isCompleted = task.progress >= 100;
            return (
              <div
                key={task.video_id}
                className={`task-item-v1 ${isCompleted ? 'completed' : ''}`}
                onClick={() => openActionModal(task)}
              >
                <div className="task-content-v1">
                  <div className="task-header-v1">
                    <span className="task-title-v1">{task.title}</span>
                    <div className="task-badges-v1">
                      <span className="task-badge-v1 type">视频课程</span>
                      {task.deadline && (
                        <span className="task-badge-v1 deadline">📅 {task.deadline}</span>
                      )}
                    </div>
                  </div>
                  <div className="task-details-v1">
                    <div className="task-meta-v1">
                      <span>⏱ {formatDuration(task.duration)}</span>
                    </div>
                    <div className="task-progress-v1">
                      <div className="progress-bar-v1">
                        <div
                          className={`progress-fill-v1 ${isCompleted ? 'completed' : ''}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="progress-text-v1">完成进度 {task.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className={`task-status-v1 ${isCompleted ? 'completed' : 'pending'}`}>
                  <div className={`status-dot-v1 ${isCompleted ? 'completed' : ''}`} />
                  <span>{isCompleted ? '已完成' : '待完成'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 操作弹窗 - V1 action-modal */}
      {showActionModal && selectedTask && (
        <div className="modal-overlay" onClick={closeActionModal}>
          <div className="action-modal-v1" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-v1">
              <span className="modal-title-v1">{selectedTask.title}</span>
              <span className="modal-close-v1" onClick={closeActionModal}>×</span>
            </div>
            <div className="modal-body-v1">
              <div className="action-buttons-v1">
                <div
                  className="action-btn-v1 watch"
                  onClick={() => {
                    closeActionModal();
                    navigate(
                      `/student/video/${classId}/${selectedTask.video_id}?title=${encodeURIComponent(selectedTask.title)}`
                    );
                  }}
                >
                  <span className="action-icon-v1">🎬</span>
                  <span className="action-text-v1">观看视频</span>
                  <span className="action-desc-v1">进入互动学习</span>
                </div>
                <div
                  className={`action-btn-v1 summary ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (selectedTask.progress < 100) {
                      message.info('请先看完视频');
                      return;
                    }
                    closeActionModal();
                    navigate(
                      `/student/report?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}`
                    );
                  }}
                >
                  <span className="action-icon-v1">📝</span>
                  <span className="action-text-v1">视频总结</span>
                  <span className="action-desc-v1">{selectedTask.progress >= 100 ? '查看视频总结' : '看完视频解锁'}</span>
                </div>
              </div>
              <div className="action-buttons-v1">
                <div
                  className={`action-btn-v1 report ${(!selectedTask.progress || selectedTask.progress === 0) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!selectedTask.progress || selectedTask.progress === 0) {
                      message.info('请先观看视频');
                      return;
                    }
                    closeActionModal();
                    navigate(
                      `/student/report?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}`
                    );
                  }}
                >
                  <span className="action-icon-v1">📊</span>
                  <span className="action-text-v1">学情报告</span>
                  <span className="action-desc-v1">{selectedTask.progress > 0 ? '查看学习情况' : '暂无报告'}</span>
                </div>
                <div
                  className={`action-btn-v1 practice ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                  onClick={() => {
                    if (selectedTask.progress < 100) {
                      message.info('请先看完视频解锁');
                      return;
                    }
                    closeActionModal();
                    navigate(
                      `/student/practice?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}`
                    );
                  }}
                >
                  <span className="action-icon-v1">✍️</span>
                  <span className="action-text-v1">个性练习</span>
                  <span className="action-desc-v1">{selectedTask.progress >= 100 ? '巩固薄弱点' : '看完视频解锁'}</span>
                </div>
              </div>
              {selectedTask.progress > 0 && (
                <div className="progress-info-v1">
                  当前进度：<span className="progress-value-v1">{selectedTask.progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassCourse;
