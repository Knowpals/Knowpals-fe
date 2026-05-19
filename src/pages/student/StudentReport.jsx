import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import request from '../../utils/request';

// V1 study-data.html 逻辑：学情报告页面
const StudentReport = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [showWeaknessModal, setShowWeaknessModal] = useState(false);
  const [currentWeakness, setCurrentWeakness] = useState(null);

  const videoId = searchParams.get('videoId');
  const videoTitle = searchParams.get('title') || '课程学情报告';

  useEffect(() => {
    if (videoId) loadReport();
  }, [videoId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await request.get(`/stat/student/${videoId}`);
      if ((res.code === 0 || res.code === 200) && res.data) {
        processReportData(res.data);
      }
    } catch (err) {
      console.error('加载报告失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data) => {
    const completionRate = data.status === 'finished' ? 100
      : data.completion_rate ? (data.completion_rate > 1 ? data.completion_rate : data.completion_rate * 100)
      : data.progress_percent ? (data.progress_percent > 1 ? data.progress_percent : data.progress_percent * 100)
      : 0;

    const watchTimeMs = data.time_cost || data.watch_time || 0;
    const watchTimeMin = Math.round(watchTimeMs / 60000 * 10) / 10;

    const knowledgePoints = (data.knowledge_points || data.knowledge || []).map((kp) => ({
      name: kp.title || kp.name || '未知知识点',
      correctRate: Math.round((kp.master_score || kp.correct_rate || kp.score || 0) * 100),
      segmentId: kp.segment_id || null,
    }));

    const weaknesses = knowledgePoints.filter((kp) => kp.correctRate < 50).map((kp) => ({
      point: kp.name,
      wrongCount: Math.round((100 - kp.correctRate) / 10),
      correctRate: kp.correctRate,
      description: `知识点掌握度：${kp.correctRate}%`,
      segmentId: kp.segmentId,
    }));

    setReport({
      score: Math.round((data.correct_rate || 0) * 100),
      completionRate: Math.round(completionRate),
      watchTime: watchTimeMin,
      correctCount: data.correct_count || 0,
      totalQuestions: data.questions_count || data.total_questions || 0,
      knowledgePoints,
      weaknesses,
      evaluation: completionRate >= 80 ? '学习效果优秀，继续保持！' : completionRate >= 50 ? '还需努力，建议针对薄弱点加强练习。' : '建议重新学习相关知识。',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#f8f9fa', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="report-page-v1">
      {/* 顶部标题栏 */}
      <div className="report-header-card-v1">
        <div className="report-header-content-v1">
          <div className="report-back-btn-v1" onClick={() => navigate(-1)}>←</div>
          <div className="report-title-section-v1">
            <span className="report-video-title-v1">{decodeURIComponent(videoTitle)}</span>
            <span className="report-subtitle-v1">课程学情报告</span>
          </div>
        </div>
      </div>

      <div className="report-content-v1">
        {report ? (
          <>
            {/* 总分 */}
            <div className="report-score-card-v1">
              <div className="report-score-circle-v1">
                <span className="report-score-value-v1">{report.score}</span>
                <span className="report-score-label-v1">分</span>
              </div>
              <span className="report-evaluation-v1">{report.evaluation}</span>
            </div>

            {/* 统计数据 */}
            <div className="report-stats-row-v1">
              <div className="report-stat-card-v1">
                <span className="report-stat-value-v1">{report.completionRate}%</span>
                <span className="report-stat-label-v1">完成度</span>
              </div>
              <div className="report-stat-card-v1">
                <span className="report-stat-value-v1">{report.watchTime}分钟</span>
                <span className="report-stat-label-v1">学习时长</span>
              </div>
              <div className="report-stat-card-v1">
                <span className="report-stat-value-v1">{report.correctCount}/{report.totalQuestions}</span>
                <span className="report-stat-label-v1">正确题数</span>
              </div>
            </div>

            {/* 知识点掌握情况 */}
            {report.knowledgePoints.length > 0 && (
              <div className="report-section-card-v1">
                <div className="report-section-title-v1">知识点掌握情况</div>
                <div className="knowledge-list-v1">
                  {report.knowledgePoints.map((kp, idx) => {
                    let color = '#4CAF50';
                    if (kp.correctRate < 50) color = '#FF4757';
                    else if (kp.correctRate < 80) color = '#FFA500';
                    return (
                      <div key={idx} className="knowledge-item-v1">
                        <div className="knowledge-item-info-v1">
                          <span className="knowledge-name-v1">{kp.name}</span>
                          <span className="knowledge-rate-v1">{kp.correctRate}%</span>
                        </div>
                        <div className="knowledge-bar-v1">
                          <div className="knowledge-bar-fill-v1" style={{ width: `${kp.correctRate}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 薄弱点 */}
            {report.weaknesses.length > 0 && (
              <div className="report-section-card-v1">
                <div className="report-section-title-v1">个人易错点</div>
                <div className="weakness-list-v1">
                  {report.weaknesses.map((w, idx) => (
                    <div key={idx} className="weakness-item-v1">
                      <div className="weakness-info-v1">
                        <span className="weakness-topic-v1">{w.point}</span>
                        <span className="weakness-desc-v1">正确率 {w.correctRate}%</span>
                      </div>
                      <div
                        className="weakness-btn-v1"
                        onClick={() => {
                          setCurrentWeakness(w);
                          setShowWeaknessModal(true);
                        }}
                      >
                        查看详情
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="report-actions-v1">
              <div className="report-action-btn-v1 primary" onClick={() => navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`)}>
                个性练习
              </div>
              <div className="report-action-btn-v1 secondary" onClick={() => navigate(-1)}>
                返回学习
              </div>
            </div>
          </>
        ) : (
          <div className="report-empty-v1">暂无报告数据</div>
        )}
      </div>

      {/* 薄弱点详情弹窗 */}
      {showWeaknessModal && currentWeakness && (
        <div className="modal-overlay" onClick={() => setShowWeaknessModal(false)}>
          <div className="weakness-modal-v1" onClick={(e) => e.stopPropagation()}>
            <div className="weakness-modal-header-v1">易错点详情</div>
            <div className="weakness-modal-body-v1">
              <div className="weakness-modal-row-v1">
                <span className="weakness-modal-label-v1">知识点</span>
                <span className="weakness-modal-value-v1">{currentWeakness.point}</span>
              </div>
              <div className="weakness-modal-row-v1">
                <span className="weakness-modal-label-v1">正确率</span>
                <span className="weakness-modal-value-v1">{currentWeakness.correctRate}%</span>
              </div>
              <div className="weakness-modal-row-v1">
                <span className="weakness-modal-label-v1">掌握情况</span>
                <span className="weakness-modal-value-v1">{currentWeakness.description}</span>
              </div>
            </div>
            <div className="weakness-modal-footer-v1">
              <div className="weakness-modal-btn-v1 cancel" onClick={() => setShowWeaknessModal(false)}>知道了</div>
              <div className="weakness-modal-btn-v1 confirm" onClick={() => {
                setShowWeaknessModal(false);
                navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`);
              }}>开始练习</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReport;
