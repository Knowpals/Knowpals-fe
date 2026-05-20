import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';

function formatDuration(seconds) {
  if (!seconds) return '0分钟';
  return Math.floor(seconds / 60) + '分钟';
}

export default function StudentClassCourse() {
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

      const [allRes, todoRes] = await Promise.all([
        request.get(`/behavior/class-progress/${classId}/all`),
        request.get(`/behavior/class-progress/${classId}/todo`),
      ]);

      let allTasks = [];
      let todoCount = 0;

      if ((allRes.code === 0 || allRes.code === 200) && allRes.data?.progress_list) {
        allTasks = allRes.data.progress_list.map(item => ({
          video_id: item.video_id,
          title: item.title,
          status: item.status,
          progress: item.progress_percent || 0,
          watch_time: item.watch_time || 0,
          duration: item.duration || 0,
          deadline: item.deadline,
        }));
        localStorage.setItem(`video_list_${classId}`, JSON.stringify(allTasks));
      }

      if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data?.progress_list) {
        todoCount = todoRes.data.progress_list.filter(item => (item.progress_percent || 0) < 100).length;
      }

      setTasks(allTasks);
      const completed = allTasks.filter(t => t.progress >= 100).length;
      setStats({ completed, pending: todoCount, total: allTasks.length });
    } catch (error) {
      console.error('加载课程失败:', error);
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

  const goToVideoPlay = () => {
    if (!selectedTask) return;
    closeActionModal();
    navigate(`/student/video/${classId}/${selectedTask.video_id}?title=${encodeURIComponent(selectedTask.title)}`);
  };

  const goToStudyData = () => {
    if (!selectedTask || !selectedTask.progress || selectedTask.progress === 0) {
      alert('您尚未观看此课程，暂无学情报告。请先观看视频课程。');
      return;
    }
    closeActionModal();
    navigate(`/student/report?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}&classId=${classId}&progress=${selectedTask.progress}`);
  };

  const goToQuizPractice = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先观看视频课程，解锁个性练习功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/practice?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}&classId=${classId}`);
  };

  const goToVideoSummary = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先看完视频课程，解锁视频总结功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/report?videoId=${selectedTask.video_id}&title=${encodeURIComponent(selectedTask.title)}&classId=${classId}&type=summary`);
  };

  return (
    <StudentLayout title={className}>
      <div className="class-course-page-v1">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>加载中...</div>
        ) : (
          <>
            {/* Class info header - matches H5 class-course.html */}
            <div className="class-course-header-v1">
              <span className="class-course-desc-v1">本班级的预习任务</span>
              <div className="class-course-stats-row-v1">
                <div className="course-stat-item-v1">
                  <span className="course-stat-value-v1">{stats.completed}</span>
                  <span className="course-stat-label-v1">已完成</span>
                </div>
                <div className="course-stat-item-v1">
                  <span className="course-stat-value-v1">{stats.pending}</span>
                  <span className="course-stat-label-v1">未完成</span>
                </div>
                <div className="course-stat-item-v1">
                  <span className="course-stat-value-v1">{stats.total}</span>
                  <span className="course-stat-label-v1">总课程</span>
                </div>
              </div>
            </div>

            {/* Task list - matches H5 class-course.html */}
            <div className="course-tasks-scroll-v1">
              {tasks.length === 0 ? (
                <div className="course-empty-state-v1">
                  <div className="course-empty-icon-v1">📚</div>
                  <span className="course-empty-title-v1">暂无课程</span>
                  <span className="course-empty-text-v1">本班级还没有发布课程</span>
                </div>
              ) : (
                <div className="course-tasks-list-v1">
                  {tasks.map(task => {
                    const isCompleted = task.progress >= 100;
                    return (
                      <div
                        key={task.video_id}
                        className={`course-task-item-v1 ${isCompleted ? 'completed' : ''}`}
                        onClick={() => openActionModal(task)}
                      >
                        <div className="course-task-content-v1">
                          <div className="course-task-header-v1">
                            <span className="course-task-title-v1">{task.title}</span>
                            <div className="course-task-badges-v1">
                              <span className="course-task-badge-v1 type">视频课程</span>
                              {task.deadline && (
                                <span className="course-task-badge-v1 deadline">📅 {task.deadline}</span>
                              )}
                            </div>
                          </div>
                          <div className="course-task-details-v1">
                            <div className="course-task-meta-v1">
                              <span>⏱️ {formatDuration(task.duration)}</span>
                            </div>
                            <div className="course-task-progress-v1">
                              <div className="course-progress-bar-v1">
                                <div
                                  className={`course-progress-fill-v1 ${isCompleted ? 'completed' : ''}`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="course-progress-text-v1">完成进度 {task.progress}%</span>
                            </div>
                          </div>
                        </div>
                        <div className={`course-task-status-v1 ${isCompleted ? 'completed' : 'pending'}`}>
                          <div className={`course-status-dot-v1 ${isCompleted ? 'completed' : ''}`} />
                          <span>{isCompleted ? '已完成' : '待完成'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action modal */}
        {showActionModal && selectedTask && (
          <div className="modal-overlay" onClick={closeActionModal}>
            <div className="action-modal-v1" onClick={e => e.stopPropagation()}>
              <div className="action-modal-header-v1">
                <span className="action-modal-title-v1">{selectedTask.title}</span>
                <span className="action-modal-close-v1" onClick={closeActionModal}>×</span>
              </div>
              <div className="action-modal-body-v1">
                <div className="action-modal-buttons-v1">
                  <div className="action-modal-btn-v1 watch" onClick={goToVideoPlay}>
                    <span className="action-modal-icon-v1">🎬</span>
                    <span className="action-modal-text-v1">观看视频</span>
                    <span className="action-modal-desc-v1">进入互动学习</span>
                  </div>
                  <div
                    className={`action-modal-btn-v1 summary ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                    onClick={goToVideoSummary}
                  >
                    <span className="action-modal-icon-v1">📝</span>
                    <span className="action-modal-text-v1">视频总结</span>
                    <span className="action-modal-desc-v1">
                      {selectedTask.progress >= 100 ? '查看视频总结' : '看完视频解锁'}
                    </span>
                  </div>
                </div>
                <div className="action-modal-buttons-v1">
                  <div
                    className={`action-modal-btn-v1 report ${(!selectedTask.progress || selectedTask.progress === 0) ? 'disabled' : ''}`}
                    onClick={goToStudyData}
                  >
                    <span className="action-modal-icon-v1">📊</span>
                    <span className="action-modal-text-v1">学情报告</span>
                    <span className="action-modal-desc-v1">
                      {selectedTask.progress > 0 ? '查看学习情况' : '暂无报告'}
                    </span>
                  </div>
                  <div
                    className={`action-modal-btn-v1 practice ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                    onClick={goToQuizPractice}
                  >
                    <span className="action-modal-icon-v1">✍️</span>
                    <span className="action-modal-text-v1">个性练习</span>
                    <span className="action-modal-desc-v1">
                      {selectedTask.progress >= 100 ? '巩固薄弱点' : '看完视频解锁'}
                    </span>
                  </div>
                </div>
                {selectedTask.progress > 0 && (
                  <div className="action-modal-progress-v1">
                    <span>当前进度：</span>
                    <span className="action-modal-progress-value-v1">{selectedTask.progress}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
