import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';

function formatDuration(seconds) {
  if (!seconds) return '0分钟';
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  return `${minutes}分钟`;
}

function isUrgent(deadline) {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

function isTodayTask(deadline) {
  if (!deadline) return false;
  const today = new Date().toISOString().split('T')[0];
  return deadline === today;
}

export default function StudentPendingTasks() {
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const loadPendingTasks = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await request.get('/class/my-joined');
      const allClasses = [];

      if ((res.code === 0 || res.code === 200) && res.data && res.data.class_list) {
        res.data.class_list.forEach(c => {
          allClasses.push({
            classId: c.class_id,
            className: c.class_name,
            teacherName: c.teacher_name,
          });
        });
      }

      const taskPromises = allClasses.map(c =>
        request.get(`/behavior/class-progress/${c.classId}/todo`).then(todoRes => {
          if ((todoRes.code === 0 || todoRes.code === 200) && todoRes.data && todoRes.data.progress_list) {
            return todoRes.data.progress_list.map(item => {
              const progressInfo = item.progress_info || {};
              return {
                id: item.video_id,
                title: item.title,
                type: '教学视频',
                deadline: item.deadline,
                createdAt: item.created_at,
                teacherName: c.teacherName,
                progress: item.progress_percent || 0,
                watchTime: item.watch_time || 0,
                duration: item.duration || 0,
                videoDuration: progressInfo.duration || item.duration || 0,
                className: c.className,
                classId: c.classId,
                isUrgent: isUrgent(item.deadline),
                isToday: isTodayTask(item.deadline),
              };
            });
          }
          return [];
        }).catch(() => [])
      );

      const allTasksArray = await Promise.all(taskPromises);
      const tasks = allTasksArray.flat();
      const pendingTasks = tasks.filter(task => task.progress < 100);

      const urgent = pendingTasks.filter(task => task.isUrgent).length;
      const today = pendingTasks.filter(task => task.isToday).length;

      setAllTasks(pendingTasks);
      setUrgentCount(urgent);
      setTodayCount(today);

      if (isRefresh && selectedTask && selectedTask.id) {
        const updatedTask = pendingTasks.find(t => t.id === selectedTask.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
          if (updatedTask.progress >= 100) {
            setShowActionModal(false);
          }
        } else if (!pendingTasks.find(t => t.id === selectedTask.id)) {
          setShowActionModal(false);
        }
      }

      applyFilter(activeFilter, pendingTasks);
    } catch (err) {
      console.error('获取待完成任务失败:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, selectedTask]);

  useEffect(() => {
    loadPendingTasks();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPendingTasks(true);
      }
    };
    const handleFocus = () => {
      loadPendingTasks(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadPendingTasks]);

  const applyFilter = (filter, tasks = allTasks) => {
    let filtered = [];
    if (filter === 'all') {
      filtered = tasks;
    } else if (filter === 'urgent') {
      filtered = tasks.filter(task => task.isUrgent);
    } else if (filter === 'today') {
      filtered = tasks.filter(task => task.isToday);
    }
    setFilteredTasks(filtered);
    setActiveFilter(filter);
  };

  const handleFilterChange = (filter) => {
    applyFilter(filter);
  };

  const handleTaskTap = (task) => {
    setSelectedTask(task);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
  };

  const goToVideoPlay = () => {
    if (!selectedTask) return;
    closeActionModal();
    navigate(`/student/video/${selectedTask.classId}/${selectedTask.id}?title=${encodeURIComponent(selectedTask.title)}`);
  };

  const goToStudyData = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先看完视频课程，解锁学情报告功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/report?videoId=${selectedTask.id}&title=${encodeURIComponent(selectedTask.title)}&classId=${selectedTask.classId}`);
  };

  const goToQuizPractice = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先看完视频课程，解锁个性练习功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/practice?videoId=${selectedTask.id}&videoTitle=${encodeURIComponent(selectedTask.title)}&classId=${selectedTask.classId}`);
  };

  const goToVideoSummary = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先看完视频课程，解锁视频总结功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/report?videoId=${selectedTask.id}&videoTitle=${encodeURIComponent(selectedTask.title)}&classId=${selectedTask.classId}&type=summary`);
  };

  const getEmptyState = () => {
    switch (activeFilter) {
      case 'urgent':
        return { icon: '😅', title: '暂无即将截止任务', text: '暂时没有即将截止的任务', showBack: true };
      case 'today':
        return { icon: '📅', title: '暂无今日任务', text: '暂时没有今日需要完成的任务', showBack: true };
      default:
        return { icon: '🎉', title: '暂无未完成任务', text: '您已完成所有预习任务', showBack: false };
    }
  };

  const pendingCount = allTasks.length;
  const empty = getEmptyState();

  return (
    <div className="pending-tasks-page">
      {/* Stats section */}
      <div className="pending-stats-section">
        <div className="pending-stats-content">
          <span className="pending-stats-icon">📋</span>
          <div className="pending-stats-info">
            <span className="pending-stats-title">未完成预习</span>
            <span className="pending-stats-count">{pendingCount} 个</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="pending-filter-section">
        <div className="pending-filter-tabs">
          <div
            className={`pending-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <span>全部课程</span>
          </div>
          <div
            className={`pending-filter-tab ${activeFilter === 'urgent' ? 'active' : ''}`}
            onClick={() => handleFilterChange('urgent')}
          >
            <span>即将截止</span>
            {urgentCount > 0 && <span className="pending-filter-badge">{urgentCount}</span>}
          </div>
          <div
            className={`pending-filter-tab ${activeFilter === 'today' ? 'active' : ''}`}
            onClick={() => handleFilterChange('today')}
          >
            <span>今日任务</span>
            {todayCount > 0 && <span className="pending-filter-badge">{todayCount}</span>}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="pending-tasks-scroll">
        {loading ? (
          <div className="pending-loading-text">加载中...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="pending-empty-state">
            <span className="pending-empty-icon">{empty.icon}</span>
            <span className="pending-empty-title">{empty.title}</span>
            <span className="pending-empty-text">{empty.text}</span>
            {empty.showBack && (
              <div className="pending-back-btn" onClick={() => handleFilterChange('all')}>
                查看全部任务
              </div>
            )}
          </div>
        ) : (
          <div className="pending-tasks-list">
            {filteredTasks.map((item) => {
              const isCompleted = item.progress >= 100;
              const deadlineStr = item.deadline ? `📅 ${item.deadline}` : '';
              return (
                <div
                  key={item.id}
                  className={`pending-task-item ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleTaskTap(item)}
                >
                  <div className="pending-task-content">
                    <div className="pending-task-header">
                      <span className="pending-task-title">{item.title}</span>
                      <div className="pending-task-badges">
                        <span className="pending-task-badge type">视频课程</span>
                        {deadlineStr && <span className="pending-task-badge deadline">{deadlineStr}</span>}
                      </div>
                    </div>
                    <div className="pending-task-details">
                      <div className="pending-task-meta">
                        <div className="pending-meta-item">
                          <span className="pending-meta-icon">⏱️</span>
                          <span className="pending-meta-text">{formatDuration(item.videoDuration || item.duration)}</span>
                        </div>
                      </div>
                      <div className="pending-task-progress">
                        <div className="pending-progress-bar">
                          <div className="pending-progress-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="pending-progress-text">完成进度 {item.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className={`pending-task-status ${isCompleted ? 'completed' : 'pending'}`}>
                    <div className={`pending-status-indicator ${isCompleted ? 'completed' : ''}`} />
                    <span className="pending-status-text">{isCompleted ? '已完成' : '待完成'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action modal */}
      {showActionModal && selectedTask && (
        <div className="pending-action-modal">
          <div className="pending-modal-mask" onClick={closeActionModal} />
          <div className="pending-modal-content">
            <div className="pending-modal-header">
              <span className="pending-modal-title">{selectedTask.title}</span>
              <span className="pending-modal-close" onClick={closeActionModal}>×</span>
            </div>
            <div className="pending-modal-body">
              <div className="pending-action-buttons">
                <div className="pending-action-btn watch-video" onClick={goToVideoPlay}>
                  <span className="pending-action-icon">🎬</span>
                  <span className="pending-action-text">观看视频</span>
                  <span className="pending-action-desc">进入互动学习</span>
                </div>
                <div
                  className={`pending-action-btn video-summary ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                  onClick={goToVideoSummary}
                >
                  <span className="pending-action-icon">📝</span>
                  <span className="pending-action-text">视频总结</span>
                  <span className="pending-action-desc">
                    {selectedTask.progress < 100 ? '看完视频解锁' : '查看视频总结'}
                  </span>
                </div>
              </div>
              <div className="pending-action-buttons">
                <div
                  className={`pending-action-btn study-report ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                  onClick={goToStudyData}
                >
                  <span className="pending-action-icon">📊</span>
                  <span className="pending-action-text">学情报告</span>
                  <span className="pending-action-desc">
                    {selectedTask.progress < 100 ? '看完视频解锁' : '查看学习情况'}
                  </span>
                </div>
                <div
                  className={`pending-action-btn quiz-practice ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                  onClick={goToQuizPractice}
                >
                  <span className="pending-action-icon">✍️</span>
                  <span className="pending-action-text">个性练习</span>
                  <span className="pending-action-desc">
                    {selectedTask.progress < 100 ? '看完视频解锁' : '巩固薄弱点'}
                  </span>
                </div>
              </div>
              {selectedTask.progress > 0 && (
                <div className="pending-task-progress-info">
                  <span>当前进度：</span>
                  <span className="pending-progress-value">{selectedTask.progress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
