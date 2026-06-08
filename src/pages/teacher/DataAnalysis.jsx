import React, { useState, useEffect } from 'react';
import { Select, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import MainLayout from '../../layouts/TeacherLayout';
import MasteryBar from '../../components/MasteryBar';
import WrongQuestionItem from '../../components/WrongQuestionItem';
import { getMyCreatedClasses, getClassStat, getVideoTasks, getStudentOverview } from '../../services/teacherApi';
import { mapTeacherToAnalysis, getGradeClass } from '../../utils/mapTeacherToAnalysis';
import { injectStyles } from '../../utils/injectStyles';

const { Option } = Select;

injectStyles('teacher-analysis', `
  .ta-page { background: #f8f9fa; min-height: calc(100vh - 64px - 48px); }
  .ta-content { padding: 16px 24px; max-width: 1200px; margin: 0 auto; }
  .ta-selector-bar { display: flex; gap: 16px; margin-bottom: 20px; background: #fff; padding: 12px 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .ta-score-card { display: flex; flex-direction: column; align-items: center; padding: 24px; background: #fff; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
  .ta-score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; margin-bottom: 10px; }
  .ta-score-circle.grade-s { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .ta-score-circle.grade-a { background: linear-gradient(135deg, #10b981, #059669); }
  .ta-score-circle.grade-b { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
  .ta-score-circle.grade-c { background: linear-gradient(135deg, #f97316, #ea580c); }
  .ta-score-circle.grade-d { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .ta-score-value { font-size: 36px; font-weight: 700; line-height: 1; }
  .ta-grade { font-size: 18px; font-weight: 700; }
  .ta-evaluation { font-size: 14px; color: #666; margin-top: 4px; text-align: center; max-width: 400px; }
  .ta-stats-row { display: flex; justify-content: space-around; padding: 16px 0; margin-bottom: 12px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .ta-stat-item { display: flex; flex-direction: column; align-items: center; }
  .ta-stat-value { font-size: 20px; font-weight: 600; color: #7c3aed; }
  .ta-stat-label { font-size: 12px; color: #999; margin-top: 4px; }
  .ta-section { background: #fff; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .ta-section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .ta-knowledge-list { display: flex; flex-direction: column; gap: 10px; }
  .ta-weakness-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
  .ta-weakness-row:last-child { border-bottom: none; padding-bottom: 0; }
  .ta-weakness-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .ta-weakness-topic { font-size: 13px; color: #333; font-weight: 500; }
  .ta-weakness-desc { font-size: 11px; color: #666; }
  .ta-weakness-rate { font-size: 14px; font-weight: 700; color: #ef4444; margin-right: 12px; }
  .ta-behavior-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  @media (max-width: 640px) { .ta-behavior-grid { grid-template-columns: 1fr 1fr; } }
  .ta-behavior-item { background: #f8f9fa; border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
  .ta-behavior-value { font-size: 18px; font-weight: 700; color: #7c3aed; }
  .ta-behavior-label { font-size: 12px; color: #999; }
  .ta-pause-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .ta-pause-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 8px 10px; background: #f8f9fa; border-radius: 6px; }
  .ta-category-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .ta-category-count { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
  .ta-category-bar-wrap { flex: 1; min-width: 0; }
  .ta-category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .ta-category-name { font-size: 13px; font-weight: 600; color: #333; }
  .ta-category-pct { font-size: 15px; font-weight: 700; }
  .ta-category-track { width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .ta-category-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .ta-category-desc { font-size: 11px; color: #999; margin-top: 3px; }
  .ta-remediation { border-left: 3px solid #7c3aed !important; }
  .ta-remediation-step { background: #fafafa; border-radius: 10px; padding: 14px; border: 1px solid #e8e8e8; position: relative; margin-bottom: 12px; }
  .ta-remediation-step:last-child { margin-bottom: 0; }
  .ta-remediation-tag { padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; }
  .ta-remediation-topic { font-size: 14px; font-weight: 600; color: #333; }
  .ta-remediation-reason { font-size: 12px; color: #666; line-height: 1.5; padding: 8px 10px; background: #fff; border-radius: 6px; margin-bottom: 10px; border: 1px dashed #e0e0e0; }
  .ta-remediation-exercise { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #fff; border-radius: 6px; border: 1px solid #f0f0f0; font-size: 12px; }
  .ta-exercise-num { width: 20px; height: 20px; border-radius: 50%; background: #f0f4ff; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .ta-suggestion { font-size: 13px; color: #666; line-height: 1.6; background: #f0f4ff; padding: 12px 14px; border-radius: 8px; }
`);

const DataAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [overviewStats, setOverviewStats] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchOverviewStats();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchVideos(selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedVideo) fetchClassStat(selectedClass, selectedVideo);
  }, [selectedClass, selectedVideo]);

  const fetchOverviewStats = async () => {
    try {
      const res = await getStudentOverview();
      setOverviewStats(res.data);
    } catch { /* 静默 */ }
  };

  const fetchVideos = async (classId) => {
    try {
      const res = await getVideoTasks(classId);
      const videoList = res.data?.video_tasks || [];
      setVideos(videoList);
      if (videoList.length > 0) {
        setSelectedVideo(videoList[0].video_id);
      } else {
        setSelectedVideo(null);
        setAnalysisData(null);
      }
    } catch {
      setVideos([]);
      setSelectedVideo(null);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await getMyCreatedClasses();
      const classList = res.data?.class_list || [];
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].class_id);
      }
    } catch {
      /* 静默 */
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStat = async (classId, videoId) => {
    if (!classId || !videoId) return;
    setLoading(true);
    try {
      const res = await getClassStat({ class_id: classId, video_id: videoId });
      const data = mapTeacherToAnalysis(res.data, overviewStats);
      setAnalysisData(data);
    } catch {
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analysisData) {
    return (
      <MainLayout pageTitle="班级学情数据分析">
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  const data = analysisData;
  const b = data?.behavior_records;

  return (
    <MainLayout pageTitle="班级学情数据分析">
      <div className="ta-page">
        <div className="ta-content">

          {/* 班级 + 视频选择器 */}
          <div className="ta-selector-bar">
            <Select
              style={{ width: 180 }}
              placeholder="选择班级"
              value={selectedClass}
              onChange={(v) => setSelectedClass(v)}
            >
              {classes.map((cls) => (
                <Option key={cls.class_id} value={cls.class_id}>{cls.class_name}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 220 }}
              placeholder="选择视频"
              value={selectedVideo}
              onChange={(v) => setSelectedVideo(v)}
              notFoundContent={videos.length === 0 ? '该班级暂无视频任务' : undefined}
            >
              {videos.map((v) => (
                <Option key={v.video_id} value={v.video_id}>
                  {v.video_title || v.title || `视频 ${v.video_id}`}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              ghost
              style={{ marginLeft: 'auto', borderColor: '#7c3aed', color: '#7c3aed' }}
              onClick={() => navigate(`/semester-portrait/${selectedClass || 1}`)}
            >
              学期画像
            </Button>
          </div>

          {!data ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16 }}>暂无数据</div>
              <div style={{ fontSize: 13, color: '#bbb', marginTop: 8 }}>
                请选择一个有视频任务的班级
              </div>
            </div>
          ) : (
            <>
              {/* ====== 1. 综合评分卡片 ====== */}
              <div className="ta-score-card">
                <div className={`ta-score-circle ${getGradeClass(data.grade)}`}>
                  <span className="ta-score-value">{data.score}</span>
                  <span className="ta-grade">{data.grade}</span>
                </div>
                <span className="ta-evaluation">{data.evaluation}</span>
              </div>

              {/* ====== 2. 统计行 ====== */}
              <div className="ta-stats-row">
                <div className="ta-stat-item">
                  <span className="ta-stat-value">{data.study_time_min} 分钟</span>
                  <span className="ta-stat-label">平均学习时长</span>
                </div>
                <div className="ta-stat-item">
                  <span className="ta-stat-value">{Math.round(data.correct_rate * 100)}%</span>
                  <span className="ta-stat-label">平均正确率</span>
                </div>
                <div className="ta-stat-item">
                  <span className="ta-stat-value">{Math.round(data.knowledge_coverage * 100)}%</span>
                  <span className="ta-stat-label">任务完成率</span>
                </div>
                <div className="ta-stat-item">
                  <span className="ta-stat-value">{b?.pause_count ?? 0}</span>
                  <span className="ta-stat-label">总暂停次数</span>
                </div>
              </div>

              {/* ====== 3. 知识点掌握度 ====== */}
              {data.knowledge_points?.length > 0 && (
                <div className="ta-section">
                  <div className="ta-section-title">📚 知识点掌握度</div>
                  <div className="ta-knowledge-list">
                    {data.knowledge_points.map((kp, idx) => (
                      <MasteryBar key={idx} label={kp.name} rate={kp.rate} />
                    ))}
                  </div>
                </div>
              )}

              {/* ====== 4. 薄弱点分析 ====== */}
              {data.weaknesses?.length > 0 && (
                <div className="ta-section">
                  <div className="ta-section-title">⚠️ 薄弱点分析</div>
                  {data.weaknesses.map((w, idx) => (
                    <div key={idx} className="ta-weakness-row">
                      <div className="ta-weakness-info">
                        <span className="ta-weakness-topic">{w.topic}</span>
                        <span className="ta-weakness-desc">{w.desc}</span>
                      </div>
                      <span className="ta-weakness-rate">{w.rate}%</span>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/analysis-video/${w.knowledge_id || ''}`)}
                      >
                        查看关联视频
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* ====== 5. 学习行为记录 ====== */}
              {b && (
                <div className="ta-section">
                  <div className="ta-section-title">📈 学习行为记录</div>
                  <div className="ta-behavior-grid">
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.total_sessions}</span>
                      <span className="ta-behavior-label">任务总数</span>
                    </div>
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.avg_session_min} 分钟</span>
                      <span className="ta-behavior-label">平均观看时长</span>
                    </div>
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.pause_count} 次</span>
                      <span className="ta-behavior-label">暂停总次数</span>
                    </div>
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.replay_count} 次</span>
                      <span className="ta-behavior-label">回看总次数</span>
                    </div>
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.answer_speed_sec}</span>
                      <span className="ta-behavior-label">平均答题速度</span>
                    </div>
                    <div className="ta-behavior-item">
                      <span className="ta-behavior-value">{b.peak_study_time}</span>
                      <span className="ta-behavior-label">学习高峰时段</span>
                    </div>
                  </div>

                  {/* 高频暂停片段 */}
                  {b.top_pause_segments?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 6 }}>🔴 高频暂停时刻</div>
                      <div className="ta-pause-list">
                        {b.top_pause_segments.slice(0, 5).map((p, i) => (
                          <div key={i} className="ta-pause-item">
                            <span style={{ color: '#666' }}>{p.start ?? '?'}s ~ {p.end ?? '?'}s</span>
                            <span style={{ color: '#f5222d', fontWeight: 600 }}>{p.pause_count} 次暂停</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 高频回看片段 */}
                  {b.top_replay_segments?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 6 }}>🔵 高频回看时刻</div>
                      <div className="ta-pause-list">
                        {b.top_replay_segments.slice(0, 5).map((r, i) => (
                          <div key={i} className="ta-pause-item">
                            <span style={{ color: '#666' }}>{r.start ?? '?'}s ~ {r.end ?? '?'}s</span>
                            <span style={{ color: '#4096ff', fontWeight: 600 }}>{r.replay_count} 次回看</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ====== 6. 错题错因分析 ====== */}
              {data.wrong_questions?.length > 0 && (
                <div className="ta-section">
                  <div className="ta-section-title">🔍 高频错题分析</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
                    共 {data.wrong_questions.length} 道高频错题，点击展开查看详情
                  </div>
                  {data.wrong_questions.map((q, qi) => (
                    <WrongQuestionItem key={q.id} question={q} index={qi} />
                  ))}
                </div>
              )}

              {/* ====== 7. 四类错因占比 ====== */}
              {data.error_category_distribution && data.wrong_questions?.length > 0 && (
                <div className="ta-section">
                  <div className="ta-section-title">📊 错因分布</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
                    基于错误率阈值的近似分类
                  </div>
                  {data.error_category_distribution.map((cat, idx) => (
                    <div key={idx} className="ta-category-row">
                      <div className="ta-category-count" style={{ background: cat.color + '18', color: cat.color }}>
                        {cat.count}
                      </div>
                      <div className="ta-category-bar-wrap">
                        <div className="ta-category-header">
                          <span className="ta-category-name">{cat.category}</span>
                          <span className="ta-category-pct" style={{ color: cat.color }}>{cat.pct}%</span>
                        </div>
                        <div className="ta-category-track">
                          <div className="ta-category-fill" style={{ width: `${cat.pct}%`, background: cat.color }} />
                        </div>
                        <div className="ta-category-desc">{cat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ====== 8. 分层补救路径 ====== */}
              {data.remediation_path?.length > 0 && (
                <div className="ta-section ta-remediation">
                  <div className="ta-section-title">🗺️ 分层补救路径</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                    基于班级薄弱点的递进式教学建议
                  </div>
                  {data.remediation_path.map((step, idx) => (
                    <div key={idx} className="ta-remediation-step">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span className="ta-remediation-tag" style={{
                          background: idx === 0 ? '#fef2f2' : idx === 1 ? '#fff7ed' : '#f0fdf4',
                          color: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#10b981',
                        }}>
                          {step.title}
                        </span>
                        <span className="ta-remediation-topic">{step.icon} {step.topic}</span>
                      </div>
                      <div className="ta-remediation-reason">
                        📍 {step.reason}
                      </div>
                      {step.exercises && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', marginBottom: 2 }}>📝 推荐练习</div>
                          {step.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="ta-remediation-exercise">
                              <span className="ta-exercise-num">{exIdx + 1}</span>
                              <span style={{ flex: 1 }}>{ex.title}</span>
                              <span style={{
                                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 500,
                                background: ex.difficulty === '基础' ? '#dcfce7' : ex.difficulty === '进阶' ? '#fef3c7' : '#fee2e2',
                                color: ex.difficulty === '基础' ? '#16a34a' : ex.difficulty === '进阶' ? '#d97706' : '#dc2626',
                              }}>
                                {ex.difficulty}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ====== 9. 学习建议 ====== */}
              {data.suggestion && (
                <div className="ta-section">
                  <div className="ta-section-title">💡 教学建议</div>
                  <div className="ta-suggestion">{data.suggestion}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DataAnalysis;
