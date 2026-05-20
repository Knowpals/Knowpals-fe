import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import request from '../../utils/request';

export default function StudentReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('正在加载学情报告...');
  const [showWeaknessModal, setShowWeaknessModal] = useState(false);
  const [currentWeakness, setCurrentWeakness] = useState(null);
  const [activeTab, setActiveTab] = useState('pause');

  const [studyData, setStudyData] = useState({
    duration: 0, completionRate: 0, watchCount: 0,
    totalWatchTime: 0, avgWatchTime: 0,
  });
  const [quizData, setQuizData] = useState({
    correctRate: 0, totalQuestions: 0, knowledgePoints: [],
  });
  const [comparisonData, setComparisonData] = useState([]);
  const [courseDifficulties, setCourseDifficulties] = useState([]);
  const [personalWeaknesses, setPersonalWeaknesses] = useState([]);
  const [behaviorData, setBehaviorData] = useState({
    pauseCount: 0, reviewCount: 0, pausePoints: [], reviewPoints: [],
  });

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const videoTitle = searchParams.get('title') || '课程学情报告';

  useEffect(() => {
    if (videoId) {
      loadCourseAnalysis(videoId, classId);
    } else if (classId) {
      loadClassAnalysis(classId);
    } else {
      setLoading(false);
    }
  }, [videoId, classId]);

  const loadCourseAnalysis = async (videoId, classId) => {
    setLoadingText('正在加载学情报告...');
    setLoading(true);
    try {
      const [res, videoRes] = await Promise.all([
        request.get(`/stat/student/${videoId}`),
        request.get(`/video/getDetail/${videoId}`).catch(() => null),
      ]);

      if ((res.code === 0 || res.code === 200) && res.data) {
        const data = res.data;
        let videoDurationSec = 0;
        if (videoRes && (videoRes.code === 0 || videoRes.code === 200) && videoRes.data) {
          videoDurationSec = videoRes.data.duration || 0;
          if (videoDurationSec < 10000) videoDurationSec = videoDurationSec * 1000;
        }

        const timeCostMs = data.time_cost || data.watch_time || data.watchTime || 0;
        const timeCostMin = Math.round(timeCostMs / 60000 * 10) / 10;

        let completionRate = 0;
        if (data.status === 'completed' || data.status === 'finished') {
          completionRate = 100;
        } else if (data.completion_rate !== undefined) {
          completionRate = data.completion_rate > 1 ? data.completion_rate : data.completion_rate * 100;
        } else if (data.progress !== undefined) {
          completionRate = data.progress;
        } else if (data.progress_percent !== undefined) {
          completionRate = data.progress_percent > 1 ? data.progress_percent : data.progress_percent * 100;
        } else if (timeCostMs > 0 && videoDurationSec > 0) {
          completionRate = Math.min(100, Math.round((timeCostMs / (videoDurationSec * 1000)) * 100));
        }

        const knowledgePoints = (data.knowledge_points || data.knowledgePoints || data.knowledge || []).map(kp => ({
          name: kp.title || kp.name || '未知知识点',
          correctRate: Math.round((kp.master_score || kp.correct_rate || kp.score || 0) * 100),
          segmentId: kp.segment_id || kp.segmentId || null,
          knowledgeId: kp.knowledge_id || kp.knowledgeId || null,
          recommendedSegments: kp.recommended_segments || [],
        }));

        const pausePoints = (data.top_pause_action || data.pausePoints || data.pause_points || []).map(a => ({
          time: `${a.start || 0}-${a.end || 0}`,
          reason: a.reason || '高频暂停',
          count: a.pause_count || a.count || 0,
        }));

        const reviewPoints = (data.top_replay_action || data.replayPoints || data.replay_points || []).map(a => ({
          time: `${a.start || 0}-${a.end || 0}`,
          reason: a.reason || '高频回放',
          count: a.replay_count || a.count || 0,
        }));

        let totalQuestions = data.questions_count || data.questionsCount || data.total_questions || 0;
        if (totalQuestions === 0 && videoRes && videoRes.data && videoRes.data.questions) {
          totalQuestions = videoRes.data.questions.length;
        }

        setStudyData({
          duration: timeCostMin,
          completionRate: Math.round(completionRate),
          watchCount: data.watch_count || data.watchCount || 1,
          totalWatchTime: timeCostMin,
          avgWatchTime: timeCostMin,
        });
        setQuizData({
          correctRate: Math.round((data.correct_rate || data.correctRate || 0) * 100),
          totalQuestions,
          knowledgePoints,
        });
        setBehaviorData({
          pauseCount: data.pause_count || data.pauseCount || 0,
          reviewCount: data.replay_count || data.replayCount || 0,
          pausePoints,
          reviewPoints,
        });
        setPersonalWeaknesses(knowledgePoints.filter(kp => kp.correctRate < 50).map(kp => ({
          point: kp.name,
          wrongCount: Math.round((100 - kp.correctRate) / 10),
          correctRate: kp.correctRate,
          description: `知识点掌握度：${kp.correctRate}%`,
          segmentId: kp.segmentId,
        })));
      }
    } catch (err) {
      console.error('加载学情报告失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassAnalysis = async (classId) => {
    setLoadingText('正在加载班级数据...');
    setLoading(true);
    try {
      const res = await request.post('/stat/class', { class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        const data = res.data;
        setStudyData({
          duration: 0,
          completionRate: (data.overview?.complete_rate || 0) * 100,
          watchCount: 0,
          totalWatchTime: data.overview?.average_time_cost || 0,
          avgWatchTime: data.overview?.average_time_cost || 0,
        });
        setQuizData({
          correctRate: (data.overview?.average_correct_rate || 0) * 100,
          totalQuestions: 0,
          knowledgePoints: (data.weak_knowledge_point || []).map(kp => ({
            name: kp.title,
            correctRate: Math.round((1 - kp.weak_rate) * 100),
          })),
        });
        setCourseDifficulties((data.top_questions || []).map(q => ({
          topic: q.content,
          avgWrong: Math.round(q.error_rate * 100),
          myCorrect: false,
        })));
        setBehaviorData({
          pauseCount: data.overview?.total_pause_count || 0,
          reviewCount: 0,
          pausePoints: (data.top_pause_action || []).map(a => ({
            time: `${a.start}-${a.end}`, reason: '高频暂停', count: a.pause_count,
          })),
          reviewPoints: (data.top_replay_action || []).map(a => ({
            time: `${a.start}-${a.end}`, reason: '高频回放', count: a.replay_count,
          })),
        });
      }
    } catch (err) {
      console.error('加载班级数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FFA500';
    return '#FF4757';
  };

  const showWeaknessDetail = (w) => {
    setCurrentWeakness(w);
    setShowWeaknessModal(true);
  };

  const goToPractice = () => {
    setShowWeaknessModal(false);
    if (currentWeakness?.segmentId && videoId) {
      navigate(`/student/practice?videoId=${videoId}&knowledgeId=${currentWeakness.segmentId}&title=${encodeURIComponent(videoTitle)}`);
    } else if (videoId) {
      navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`);
    }
  };

  const onMenuTap = () => {
    const action = prompt('请选择操作：\n1. 刷新数据\n2. 分享报告\n3. 查看原始数据');
    if (action === '1') {
      if (videoId) loadCourseAnalysis(videoId, classId);
      else if (classId) loadClassAnalysis(classId);
    } else if (action === '2') {
      alert('可以将本课程学情报告分享给老师或家长');
    } else if (action === '3') {
      alert('原始数据功能开发中...');
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 999,
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '40px 60px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div className="loading-spinner-v1" />
          <span style={{ fontSize: 14, color: '#666', marginTop: 15 }}>{loadingText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page-v1">
      {/* Header */}
      <div className="report-header-card-v1">
        <div className="report-header-content-v1">
          <div className="report-back-btn-v1" onClick={() => navigate(-1)}>←</div>
          <div className="report-title-section-v1">
            <span className="report-video-title-v1">{decodeURIComponent(videoTitle)}</span>
            <span className="report-subtitle-v1">课程学情报告</span>
          </div>
        </div>
        <div className="report-menu-btn-v1" onClick={onMenuTap}>⋮</div>
      </div>

      <div className="report-content-v1">
        {/* Course watching status */}
        <div className="report-card-v1">
          <div className="report-card-header-v1">
            <span className="report-card-title-v1">课程观看情况</span>
            <div className="report-card-subtitle-v1">本视频时长: {studyData.duration}分钟</div>
          </div>
          <div className="report-card-body-v1">
            <div className="report-preview-progress-v1">
              <div
                className="report-progress-circle-v1"
                style={{ background: `conic-gradient(#4A6FFF 0% ${studyData.completionRate}%, #E5E9FF ${studyData.completionRate}% 100%)` }}
              >
                <span className="report-progress-text-v1">{studyData.completionRate}%</span>
                <span className="report-progress-label-v1">完成度</span>
              </div>
              <div className="report-preview-stats-v1">
                <span className="report-stat-value-v1">观看次数: {studyData.watchCount}次</span>
                <span className="report-stat-label-v1">总观看时长: {studyData.totalWatchTime}分钟</span>
                <span className="report-stat-label-v1">平均观看时长: {studyData.avgWatchTime}分钟/视频</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course interaction performance */}
        <div className="report-card-v1">
          <div className="report-card-header-v1">
            <span className="report-card-title-v1">课程互动表现</span>
            <div className="report-card-subtitle-v1">本课程互动题: {quizData.totalQuestions}题</div>
          </div>
          <div className="report-card-body-v1">
            <div className="report-quiz-overview-v1">
              <div className="report-quiz-rate-v1">
                <span className="report-rate-value-v1">{quizData.correctRate}%</span>
                <span className="report-rate-label-v1">正确率</span>
              </div>
            </div>
            <div className="report-weak-topics-v1">
              <span className="report-section-label-v1">知识点掌握情况</span>
              <div className="report-topic-list-v1">
                {quizData.knowledgePoints.length === 0 ? (
                  <div className="report-topic-item-v1"><span>暂无数据</span></div>
                ) : (
                  quizData.knowledgePoints.map((kp, idx) => {
                    const color = getScoreColor(kp.correctRate);
                    return (
                      <div key={idx} className="report-topic-item-v1">
                        <div className="report-topic-info-v1">
                          <span className="report-topic-type-v1">{kp.name}</span>
                          <div className="report-topic-rate-v1">
                            <span className="report-topic-rate-value-v1">{kp.correctRate}%</span>
                            <span className="report-topic-rate-label-v1">正确率</span>
                          </div>
                        </div>
                        <div className="report-topic-progress-v1" style={{
                          background: `linear-gradient(to right, ${color} ${kp.correctRate}%, #f0f0f0 ${kp.correctRate}%)`,
                        }} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Class comparison */}
        <div className="report-card-v1">
          <div className="report-card-header-v1">
            <span className="report-card-title-v1">与班级对比</span>
            <span className="report-card-subtitle-v1">本课程学习情况对比</span>
          </div>
          <div className="report-card-body-v1">
            <div className="report-comparison-chart-v1">
              {[
                { name: '完成度', classAvg: studyData.completionRate, myValue: studyData.completionRate, color: '#4A6FFF' },
                { name: '正确率', classAvg: 0, myValue: quizData.correctRate, color: '#4CAF50' },
                { name: '学习时长', classAvg: 0, myValue: studyData.totalWatchTime, color: '#FFA500' },
              ].map((item, idx) => {
                const maxVal = Math.max(item.classAvg, item.myValue, 1, 100);
                return (
                  <div key={idx} className="report-chart-item-v1">
                    <span className="report-chart-label-v1">{item.name}</span>
                    <div className="report-chart-bars-v1">
                      <div className="report-bar-wrapper-v1">
                        <span className="report-bar-label-v1">班级平均</span>
                        <div className="report-bar-container-v1">
                          <div className="report-bar-v1 report-bar-class-v1" style={{
                            width: `${(item.classAvg / maxVal) * 100}%`, backgroundColor: item.color,
                          }} />
                          <span className="report-bar-value-v1">{item.classAvg}</span>
                        </div>
                      </div>
                      <div className="report-bar-wrapper-v1">
                        <span className="report-bar-label-v1">我的</span>
                        <div className="report-bar-container-v1">
                          <div className="report-bar-v1 report-bar-mine-v1" style={{
                            width: `${(item.myValue / maxVal) * 100}%`, backgroundColor: item.color,
                          }} />
                          <span className="report-bar-value-v1">{item.myValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Course difficulty analysis */}
        {courseDifficulties.length > 0 && (
          <div className="report-card-v1">
            <div className="report-card-header-v1">
              <span className="report-card-title-v1">课程难点分析</span>
              <span className="report-card-subtitle-v1">本课程学生普遍难点</span>
            </div>
            <div className="report-card-body-v1">
              <div className="report-difficulty-list-v1">
                {courseDifficulties.map((q, idx) => (
                  <div key={idx} className="report-difficulty-item-v1">
                    <div className="report-difficulty-info-v1">
                      <span className="report-difficulty-topic-v1">{q.topic}</span>
                      <span className="report-difficulty-stats-v1">班级{q.avgWrong}%答错</span>
                    </div>
                    <div className="report-difficulty-count-v1">
                      <span className="report-count-value-v1" style={{ color: q.myCorrect ? '#4CAF50' : '#FF4757' }}>
                        {q.myCorrect ? '已掌握' : '需加强'}
                      </span>
                      <span className="report-count-label-v1">我的掌握</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Personal weak points */}
        <div className="report-card-v1">
          <div className="report-card-header-v1">
            <span className="report-card-title-v1">个人易错点</span>
            <span className="report-card-subtitle-v1">您在本课程的薄弱环节</span>
          </div>
          <div className="report-card-body-v1">
            <div className="report-weakness-list-v1">
              {personalWeaknesses.length === 0 ? (
                <div className="report-weakness-item-v1"><span>暂无薄弱点</span></div>
              ) : (
                personalWeaknesses.map((w, idx) => (
                  <div key={idx} className="report-weakness-item-v1">
                    <div className="report-weakness-info-v1">
                      <span className="report-weakness-topic-v1">{w.point}</span>
                      <span className="report-weakness-desc-v1">错误{w.wrongCount}次，正确率{w.correctRate}%</span>
                    </div>
                    <div className="report-weakness-actions-v1">
                      <span className="report-weakness-btn-v1" onClick={() => showWeaknessDetail(w)}>查看详情</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Learning behavior analysis */}
        <div className="report-card-v1">
          <div className="report-card-header-v1">
            <span className="report-card-title-v1">学习行为分析</span>
          </div>
          <div className="report-behavior-stats-v1">
            <div
              className={`report-behavior-stat-item-v1 ${activeTab === 'pause' ? 'active' : ''}`}
              onClick={() => setActiveTab('pause')}
            >
              <span className="report-behavior-stat-value-v1">{behaviorData.pauseCount}</span>
              <span className="report-behavior-stat-label-v1">暂停次数</span>
            </div>
            <div
              className={`report-behavior-stat-item-v1 ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              <span className="report-behavior-stat-value-v1">{behaviorData.reviewCount}</span>
              <span className="report-behavior-stat-label-v1">回看次数</span>
            </div>
          </div>
          {activeTab === 'pause' && (
            <div className="report-behavior-list-v1">
              <span className="report-section-label-v1">高频暂停点</span>
              {behaviorData.pausePoints.length === 0 ? (
                <div className="report-behavior-item-v1"><span>暂无数据</span></div>
              ) : (
                behaviorData.pausePoints.map((p, idx) => (
                  <div key={idx} className="report-behavior-item-v1">
                    <div className="report-behavior-content-v1">
                      <span className="report-behavior-text-v1">{p.reason}</span>
                      <span className="report-behavior-time-v1">视频{p.time}处，暂停{p.count}次</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'review' && (
            <div className="report-behavior-list-v1">
              <span className="report-section-label-v1">高频回看点</span>
              {behaviorData.reviewPoints.length === 0 ? (
                <div className="report-behavior-item-v1"><span>暂无数据</span></div>
              ) : (
                behaviorData.reviewPoints.map((p, idx) => (
                  <div key={idx} className="report-behavior-item-v1">
                    <div className="report-behavior-content-v1">
                      <span className="report-behavior-text-v1">{p.reason}</span>
                      <span className="report-behavior-time-v1">视频{p.time}处，回看{p.count}次</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weakness detail modal */}
      {showWeaknessModal && currentWeakness && (
        <div className="modal-overlay" onClick={() => setShowWeaknessModal(false)}>
          <div className="report-weakness-modal-v1" onClick={e => e.stopPropagation()}>
            <div className="report-modal-header-v1">易错点详情</div>
            <div className="report-modal-body-v1">
              <div className="report-modal-item-v1">
                <span className="report-modal-label-v1">知识点</span>
                <span className="report-modal-value-v1">{currentWeakness.point}</span>
              </div>
              <div className="report-modal-item-v1">
                <span className="report-modal-label-v1">错误次数</span>
                <span className="report-modal-value-v1">{currentWeakness.wrongCount}次</span>
              </div>
              <div className="report-modal-item-v1">
                <span className="report-modal-label-v1">正确率</span>
                <span className="report-modal-value-v1">{currentWeakness.correctRate}%</span>
              </div>
              <div className="report-modal-item-v1">
                <span className="report-modal-label-v1">掌握情况</span>
                <span className="report-modal-value-v1">{currentWeakness.description}</span>
              </div>
            </div>
            <div className="report-modal-footer-v1">
              <div className="report-modal-btn-v1 cancel" onClick={() => setShowWeaknessModal(false)}>知道了</div>
              <div className="report-modal-btn-v1 confirm" onClick={goToPractice}>开始练习</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
