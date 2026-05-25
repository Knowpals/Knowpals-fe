import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-class-course', `
  .class-course-page-v1 { padding-bottom: 16px; }
  .class-course-header-v1 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 12px; padding: 16px; margin-bottom: 12px; color: #fff;
  }
  .class-course-desc-v1 { font-size: 13px; opacity: 0.85; }
  .class-course-stats-row-v1 { display: flex; justify-content: space-around; margin-top: 12px; }
  .course-stat-item-v1 { display: flex; flex-direction: column; align-items: center; }
  .course-stat-value-v1 { font-size: 24px; font-weight: 700; }
  .course-stat-label-v1 { font-size: 12px; opacity: 0.85; margin-top: 2px; }
  .course-tasks-scroll-v1 { flex: 1; overflow-y: auto; }
  .course-tasks-list-v1 { background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
  .course-task-item-v1 {
    display: flex; align-items: center; padding: 14px 16px;
    border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.15s;
  }
  .course-task-item-v1:last-child { border-bottom: none; }
  .course-task-item-v1.completed { opacity: 0.7; }
  .course-task-item-v1:active { background: #f9fafb; }
  .course-task-content-v1 { flex: 1; min-width: 0; }
  .course-task-header-v1 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .course-task-title-v1 { font-size: 15px; font-weight: 500; color: #333; flex: 1; }
  .course-task-badges-v1 { display: flex; gap: 6px; flex-shrink: 0; margin-left: 8px; }
  .course-task-badge-v1 { font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .course-task-badge-v1.type { background: #ede9fe; color: #7c3aed; }
  .course-task-badge-v1.deadline { background: #fef3c7; color: #d97706; }
  .course-task-details-v1 { display: flex; flex-direction: column; gap: 6px; }
  .course-task-meta-v1 { font-size: 12px; color: #999; }
  .course-task-progress-v1 { display: flex; align-items: center; gap: 8px; }
  .course-progress-bar-v1 { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
  .course-progress-fill-v1 { height: 100%; background: #7c3aed; border-radius: 3px; transition: width 0.3s; }
  .course-progress-fill-v1.completed { background: #10b981; }
  .course-progress-text-v1 { font-size: 12px; color: #999; min-width: 80px; }
  .course-task-status-v1 { display: flex; flex-direction: column; align-items: center; margin-left: 10px; font-size: 12px; color: #666; }
  .course-status-dot-v1 { width: 10px; height: 10px; border-radius: 50%; margin-bottom: 4px; background: #f59e0b; }
  .course-status-dot-v1.completed { background: #10b981; }
  .course-empty-state-v1 { text-align: center; padding: 60px 20px; }
  .course-empty-icon-v1 { font-size: 64px; margin-bottom: 16px; }
  .course-empty-title-v1 { font-size: 17px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .course-empty-text-v1 { font-size: 14px; color: #999; }
  .action-modal-v1 {
    width: 100%; max-width: 480px; background: #fff;
    border-radius: 16px 16px 0 0; padding: 24px 20px 32px;
    animation: slideUp 0.3s ease;
  }
  .action-modal-header-v1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .action-modal-title-v1 { font-size: 18px; font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 85%; }
  .action-modal-close-v1 { font-size: 24px; color: #999; cursor: pointer; padding: 4px; }
  .action-modal-body-v1 { display: flex; flex-direction: column; gap: 12px; }
  .action-modal-buttons-v1 { display: flex; gap: 12px; }
  .action-modal-btn-v1 {
    flex: 1; padding: 16px 12px; border-radius: 12px;
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; cursor: pointer; transition: all 0.2s;
  }
  .action-modal-btn-v1.watch { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
  .action-modal-btn-v1.analysis { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
  .action-modal-btn-v1.deep { background: linear-gradient(135deg, #fef3c7, #fde68a); }
  .action-modal-btn-v1.practice { background: linear-gradient(135deg, #fce7f3, #fbcfe8); }
  .action-modal-btn-v1.smallkg { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
  .action-modal-buttons-v2 { display: flex; gap: 12px; }
  .action-modal-buttons-v2 .action-modal-btn-v1 { flex: 1; }
  .action-modal-btn-v1.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: auto; }
  .action-modal-icon-v1 { font-size: 24px; }
  .action-modal-text-v1 { font-size: 14px; font-weight: 600; color: #333; }
  .action-modal-desc-v1 { font-size: 11px; color: #999; }
  .action-modal-progress-v1 { text-align: center; font-size: 14px; color: #666; padding: 8px 0; }
  .action-modal-progress-value-v1 { font-weight: 600; color: #7c3aed; }
  .kg-preview-card-v2 {
    background: #fff; border-radius: 12px; padding: 16px;
    margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .kg-preview-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .kg-preview-title-v2 { font-size: 15px; font-weight: 600; color: #333; }
  .kg-preview-link-v2 { font-size: 12px; color: #7c3aed; cursor: pointer; }
  .kg-preview-nodes-v2 { display: flex; flex-wrap: wrap; gap: 8px; }
  .kg-preview-node-v2 {
    padding: 4px 10px; border-radius: 12px; font-size: 11px;
    font-weight: 500; display: flex; align-items: center; gap: 4px;
  }
  .kg-preview-node-dot-v2 {
    width: 6px; height: 6px; border-radius: 50%;
  }
  .kg-preview-more-v2 { font-size: 11px; color: #9ca3af; margin-top: 8px; }
`);

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

  const goToLearningAnalysis = () => {
    if (!selectedTask || !selectedTask.progress || selectedTask.progress === 0) {
      alert('您尚未观看此课程，暂无学情分析。请先观看视频课程。');
      return;
    }
    closeActionModal();
    navigate(`/student/learning-analysis?videoId=${selectedTask.video_id}&classId=${classId}&title=${encodeURIComponent(selectedTask.title)}`);
  };

  const goToSmallKG = () => {
    if (!selectedTask) return;
    closeActionModal();
    navigate(`/student/small-kg?videoId=${selectedTask.video_id}&classId=${classId}&title=${encodeURIComponent(selectedTask.title)}`);
  };

  const goToDeepPractice = () => {
    if (!selectedTask || selectedTask.progress < 100) {
      alert('请先观看视频课程，解锁深度练习功能。');
      return;
    }
    closeActionModal();
    navigate(`/student/deep-practice?videoId=${selectedTask.video_id}&classId=${classId}&title=${encodeURIComponent(selectedTask.title)}`);
  };

  const goToBigKG = () => {
    navigate(`/student/big-kg?classId=${classId}&title=${encodeURIComponent(className)}`);
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

            {/* KG preview card */}
            <div className="kg-preview-card-v2">
              <div className="kg-preview-header-v2">
                <span className="kg-preview-title-v2">本课程知识图谱概览</span>
                <span className="kg-preview-link-v2" onClick={goToBigKG}>查看完整大图谱 →</span>
              </div>
              <div className="kg-preview-nodes-v2">
                {[
                  { name: '插值法', mastery: 0.72 },
                  { name: '数值积分', mastery: 0.64 },
                  { name: '方程求根', mastery: 0.70 },
                  { name: '线性方程组', mastery: 0.60 },
                  { name: '特征值问题', mastery: 0.45 },
                  { name: 'Lagrange 插值', mastery: 0.78 },
                  { name: 'Newton 迭代', mastery: 0.72 },
                  { name: 'Gauss 消元', mastery: 0.85 },
                ].map(node => {
                  const mColor = node.mastery >= 0.8 ? '#10b981' : node.mastery >= 0.5 ? '#f59e0b' : '#ef4444';
                  const bgColor = node.mastery >= 0.8 ? '#d1fae5' : node.mastery >= 0.5 ? '#fef3c7' : '#fee2e2';
                  return (
                    <span key={node.name} className="kg-preview-node-v2" style={{ background: bgColor }}>
                      <span className="kg-preview-node-dot-v2" style={{ background: mColor }} />
                      {node.name}
                    </span>
                  );
                })}
              </div>
              <div className="kg-preview-more-v2">共 30+ 个知识点 · 点击上方链接查看完整图谱</div>
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
                    className={`action-modal-btn-v1 analysis ${(!selectedTask.progress || selectedTask.progress === 0) ? 'disabled' : ''}`}
                    onClick={goToLearningAnalysis}
                  >
                    <span className="action-modal-icon-v1">📊</span>
                    <span className="action-modal-text-v1">学习分析</span>
                    <span className="action-modal-desc-v1">
                      {selectedTask.progress > 0 ? '查看分析报告' : '暂无数据'}
                    </span>
                  </div>
                </div>
                <div className="action-modal-buttons-v2">
                  <div
                    className={`action-modal-btn-v1 deep ${selectedTask.progress < 100 ? 'disabled' : ''}`}
                    onClick={goToDeepPractice}
                  >
                    <span className="action-modal-icon-v1">🔗</span>
                    <span className="action-modal-text-v1">深度练习</span>
                    <span className="action-modal-desc-v1">
                      {selectedTask.progress >= 100 ? 'BFS追溯练习' : '看完视频解锁'}
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
                  <div className="action-modal-btn-v1 smallkg" onClick={goToSmallKG}>
                    <span className="action-modal-icon-v1">🗺️</span>
                    <span className="action-modal-text-v1">小图谱</span>
                    <span className="action-modal-desc-v1">查看知识结构</span>
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
