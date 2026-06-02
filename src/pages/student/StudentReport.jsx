import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import request from '../../utils/request';
import AIFloatButton from '../../components/AIFloatButton';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-report', `
  .report-page-v1 { min-height: 100vh; background: #f8f9fa; }
  .report-header-card-v1 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 20px; border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 20px rgba(124,58,237,0.3);
  }
  .report-header-content-v1 { display: flex; align-items: center; gap: 12px; }
  .report-back-btn-v1 { font-size: 22px; color: #fff; width: 30px; text-align: center; cursor: pointer; }
  .report-title-section-v1 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .report-video-title-v1 { font-size: 17px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .report-subtitle-v1 { font-size: 12px; color: rgba(255,255,255,0.9); }
  .report-content-v1 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .report-content-v1 { max-width: 1200px; padding: 16px 32px; } }
  .report-score-card-v1 {
    display: flex; flex-direction: column; align-items: center;
    padding: 20px; background: #fff; border-radius: 12px;
    margin-bottom: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .report-score-circle-v1 {
    width: 100px; height: 100px;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    border-radius: 50%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; color: #fff; margin-bottom: 10px;
  }
  .report-score-value-v1 { font-size: 36px; font-weight: 700; line-height: 1; }
  .report-score-label-v1 { font-size: 12px; opacity: 0.9; }
  .report-evaluation-v1 { font-size: 14px; color: #666; }
  .report-stats-row-v1 { display: flex; justify-content: space-around; padding: 15px 0; margin-bottom: 10px; }
  .report-stat-card-v1 { display: flex; flex-direction: column; align-items: center; }
  .report-stat-value-v1 { font-size: 18px; font-weight: 600; color: #8b5cf6; }
  .report-stat-label-v1 { font-size: 11px; color: #999; margin-top: 4px; }
  .report-section-card-v1 {
    background: #fff; border-radius: 12px; padding: 15px;
    margin-bottom: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .report-section-title-v1 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
  .knowledge-list-v1 { display: flex; flex-direction: column; gap: 10px; }
  .knowledge-item-v1 { display: flex; flex-direction: column; gap: 5px; }
  .knowledge-item-info-v1 { display: flex; justify-content: space-between; align-items: center; }
  .knowledge-name-v1 { font-size: 13px; color: #333; font-weight: 500; }
  .knowledge-rate-v1 { font-size: 13px; font-weight: 600; color: #333; }
  .knowledge-bar-v1 { width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .knowledge-bar-fill-v1 { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .weakness-list-v1 { display: flex; flex-direction: column; gap: 10px; }
  .weakness-item-v1 { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
  .weakness-item-v1:last-child { border-bottom: none; padding-bottom: 0; }
  .weakness-info-v1 { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .weakness-topic-v1 { font-size: 13px; color: #333; font-weight: 500; }
  .weakness-desc-v1 { font-size: 11px; color: #666; }
  .weakness-btn-v1 {
    padding: 5px 12px; background: #4A6FFF; color: #fff;
    border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;
  }
  .report-actions-v1 { display: flex; gap: 12px; margin-top: 16px; }
  .report-action-btn-v1 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer;
  }
  .report-action-btn-v1.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .report-action-btn-v1.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
  .report-empty-v1 { text-align: center; padding: 60px 0; color: #999; }
  .weakness-modal-v1 {
    width: 90%; max-width: 300px; background: #fff;
    border-radius: 12px; overflow: hidden; animation: slideUp 0.3s ease;
  }
  .weakness-modal-header-v1 { padding: 15px; text-align: center; font-size: 16px; font-weight: 600; border-bottom: 1px solid #f0f0f0; }
  .weakness-modal-body-v1 { padding: 15px; }
  .weakness-modal-row-v1 { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f5f5f5; }
  .weakness-modal-row-v1:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .weakness-modal-label-v1 { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
  .weakness-modal-value-v1 { font-size: 14px; color: #333; }
  .weakness-modal-footer-v1 { display: flex; border-top: 1px solid #f0f0f0; }
  .weakness-modal-btn-v1 { flex: 1; padding: 12px 0; text-align: center; font-size: 14px; font-weight: 500; cursor: pointer; }
  .weakness-modal-btn-v1.cancel { background: #f5f5f5; color: #333; }
  .weakness-modal-btn-v1.confirm { background: #fff; color: #4A6FFF; font-weight: 600; }
`);

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
      errorDiagnosis: {
        primary: '能力天花板', primarySub: '方法误用', confidence: 0.35,
        summary: '中高难度正确率断崖下降，可能存在方法选择偏差',
      },
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

            {/* 错因诊断摘要 */}
            {report.errorDiagnosis && (
              <div className="report-section-card-v1" style={{ background: 'linear-gradient(135deg, #fef2f2, #fff7ed)', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>错因诊断</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    置信度 {Math.round(report.errorDiagnosis.confidence * 100)}%
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                  主错因：{report.errorDiagnosis.primary}（{report.errorDiagnosis.primarySub}）
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                  {report.errorDiagnosis.summary}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{ fontSize: 12, color: '#7c3aed', fontWeight: 500, cursor: 'pointer' }}
                    onClick={() => navigate(`/student/learning-analysis?videoId=${videoId}&classId=${searchParams.get('classId') || ''}&title=${encodeURIComponent(videoTitle)}`)}
                  >
                    查看完整错因分析 →
                  </span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="report-actions-v1">
              <div className="report-action-btn-v1 primary" onClick={() => navigate(`/student/practice?videoId=${videoId}&title=${encodeURIComponent(videoTitle)}`)}>
                个性练习
              </div>
              <div className="report-action-btn-v1 secondary" onClick={() => navigate(`/student/learning-analysis?videoId=${videoId}&classId=${searchParams.get('classId') || ''}&title=${encodeURIComponent(videoTitle)}`)}>
                详细分析
              </div>
            </div>
            <div className="report-actions-v1" style={{ marginTop: 0 }}>
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
                navigate(`/student/deep-practice?videoId=${videoId}&classId=${searchParams.get('classId') || ''}&title=${encodeURIComponent(currentWeakness.point)}`);
              }}>深度练习</div>
            </div>
          </div>
        </div>
      )}

      <AIFloatButton />
    </div>
  );
};

export default StudentReport;
