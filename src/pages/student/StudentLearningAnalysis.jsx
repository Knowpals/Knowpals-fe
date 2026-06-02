import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import MasteryBar from '../../components/MasteryBar';
import AIFloatButton from '../../components/AIFloatButton';
import { getLearningAnalysis } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-learning-analysis', `
  .la-page-v2 { min-height: 100vh; background: #f8f9fa; }
  .la-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 20px 15px; color: #fff;
    border-radius: 0 0 20px 20px; box-shadow: 0 4px 20px rgba(124,58,237,0.3);
  }
  .la-header-content-v2 { display: flex; align-items: center; gap: 12px; }
  .la-back-btn-v2 { font-size: 22px; color: #fff; cursor: pointer; width: 30px; text-align: center; }
  .la-title-section-v2 { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  .la-title-v2 { font-size: 17px; font-weight: 600; }
  .la-subtitle-v2 { font-size: 12px; opacity: 0.85; }
  .la-content-v2 { padding: 12px 15px; max-width: 480px; margin: 0 auto; }
  @media (min-width: 481px) { .la-content-v2 { max-width: 1200px; padding: 16px 32px; } }
  .la-score-card-v2 {
    display: flex; flex-direction: column; align-items: center;
    padding: 20px; background: #fff; border-radius: 12px;
    margin-bottom: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .la-score-circle-v2 {
    width: 100px; height: 100px; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; color: #fff; margin-bottom: 10px;
  }
  .la-score-circle-v2.grade-s { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .la-score-circle-v2.grade-a { background: linear-gradient(135deg, #10b981, #059669); }
  .la-score-circle-v2.grade-b { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
  .la-score-circle-v2.grade-c { background: linear-gradient(135deg, #f97316, #ea580c); }
  .la-score-circle-v2.grade-d { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .la-score-value-v2 { font-size: 36px; font-weight: 700; line-height: 1; }
  .la-grade-v2 { font-size: 18px; font-weight: 700; }
  .la-evaluation-v2 { font-size: 14px; color: #666; margin-top: 4px; }
  .la-stats-row-v2 { display: flex; justify-content: space-around; padding: 15px 0; margin-bottom: 10px; }
  .la-stat-card-v2 { display: flex; flex-direction: column; align-items: center; }
  .la-stat-value-v2 { font-size: 18px; font-weight: 600; color: #8b5cf6; }
  .la-stat-label-v2 { font-size: 11px; color: #999; margin-top: 4px; }
  .la-section-card-v2 {
    background: #fff; border-radius: 12px; padding: 15px;
    margin-bottom: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  .la-section-title-v2 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
  .la-knowledge-list-v2 { display: flex; flex-direction: column; gap: 10px; }
  .la-weakness-item-v2 { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
  .la-weakness-item-v2:last-child { border-bottom: none; padding-bottom: 0; }
  .la-weakness-info-v2 { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .la-weakness-topic-v2 { font-size: 13px; color: #333; font-weight: 500; }
  .la-weakness-desc-v2 { font-size: 11px; color: #666; }
  .la-weakness-btn-v2 {
    padding: 5px 12px; background: #4A6FFF; color: #fff;
    border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;
  }
  .la-suggestion-v2 {
    font-size: 13px; color: #666; line-height: 1.6;
    background: #f0f4ff; padding: 12px; border-radius: 8px;
  }
  .la-footer-v2 { display: flex; gap: 12px; margin-top: 12px; }
  .la-footer-btn-v2 {
    flex: 1; padding: 14px; border-radius: 25px; text-align: center;
    font-size: 15px; font-weight: 500; cursor: pointer; border: none;
  }
  .la-footer-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .la-footer-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
  .la-behavior-grid-v2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .la-behavior-item-v2 {
    background: #f8f9fa; border-radius: 8px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .la-behavior-value-v2 { font-size: 18px; font-weight: 700; color: #7c3aed; }
  .la-behavior-label-v2 { font-size: 11px; color: #999; }
  .la-completion-curve-v2 { display: flex; align-items: flex-end; gap: 8px; height: 80px; margin-top: 4px; }
  .la-curve-bar-v2 { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .la-curve-fill-v2 { width: 100%; border-radius: 6px 6px 0 0; transition: height 0.3s; min-height: 4px; }
  .la-curve-day-v2 { font-size: 10px; color: #999; }
  .la-curve-rate-v2 { font-size: 10px; color: #7c3aed; font-weight: 600; }
  .la-error-list-v2 { display: flex; flex-direction: column; gap: 10px; }
  .la-error-item-v2 { display: flex; gap: 12px; align-items: flex-start; }
  .la-error-bar-col-v2 { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  .la-error-header-v2 { display: flex; justify-content: space-between; align-items: center; }
  .la-error-name-v2 { font-size: 13px; font-weight: 500; color: #333; }
  .la-error-pct-v2 { font-size: 14px; font-weight: 700; }
  .la-error-track-v2 { width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
  .la-error-fill-v2 { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .la-error-examples-v2 { font-size: 11px; color: #999; line-height: 1.5; }
  .la-error-icon-v2 { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
`);

const demoAnalysis = {
  score: 74,
  grade: 'B',
  evaluation: '你对数值分析的核心概念有较好理解，但在数值积分和特征值问题方面需要加强。',
  study_time_min: 245,
  correct_rate: 0.72,
  knowledge_coverage: 0.65,
  knowledge_points: [
    { name: 'Lagrange 插值', rate: 85 },
    { name: 'Newton 插值', rate: 68 },
    { name: '梯形积分公式', rate: 80 },
    { name: 'Simpson 公式', rate: 75 },
    { name: '二分法求根', rate: 88 },
    { name: 'Newton 迭代法', rate: 72 },
    { name: 'Gauss 消元法', rate: 85 },
    { name: 'LU 分解', rate: 70 },
    { name: 'Jacobi 迭代', rate: 55 },
    { name: '幂法求特征值', rate: 52 },
    { name: 'Runge 现象', rate: 65 },
    { name: 'Gauss 型积分', rate: 48 },
  ],
  weaknesses: [
    { topic: 'Gauss 型积分', desc: '正交多项式的概念不够清晰，建议回顾 Legendre 多项式。', rate: 48 },
    { topic: '幂法求特征值', desc: '对主特征值的迭代过程理解有偏差。', rate: 52 },
    { topic: 'Jacobi 迭代收敛性', desc: '迭代矩阵的谱半径判断方法需加强。', rate: 55 },
  ],
  // V2 新增：行为记录
  behavior_records: {
    total_sessions: 12,
    avg_session_min: 20,
    pause_count: 8,
    replay_count: 15,
    answer_speed_sec: 42,
    peak_study_time: '晚上 20:00-22:00',
    completion_curve: [
      { day: '第1天', rate: 100 },
      { day: '第2天', rate: 85 },
      { day: '第3天', rate: 92 },
      { day: '第4天', rate: 78 },
      { day: '第5天', rate: 88 },
      { day: '第6天', rate: 65 },
      { day: '第7天', rate: 90 },
    ],
  },
  // V2 错因分析：按错题展开，每题独立诊断
  wrong_questions: [
    {
      id: 'Q1',
      title: '用 Newton 迭代法求 f(x)=x²-2=0 在 x₀=1 处的第一次迭代结果',
      difficulty: 0.6,
      correctAnswer: '1.5',
      studentAnswer: '1.4',
      primaryError: '方法误用',
      primaryLevel: '能力天花板',
      confidence: 0.42,
      evidence: [
        { name: '难度梯度', score: 0.75, desc: '该题为 0.6 难度，学生中低难度正确率尚可' },
        { name: '答题时间', score: 0.35, desc: '用时 85s，接近中位时间 78s，非快速猜测' },
        { name: '错误选项', score: 0.62, desc: '选择了 Newton 法近似结果的常见错误值' },
        { name: '解题步骤', score: 0.58, desc: '导数计算正确，但代入公式时计算偏差' },
        { name: '历史表现', score: 0.45, desc: '近期迭代法相关题正确率 55%' },
        { name: '知识图谱', score: 0.40, desc: '前置知识"导数"掌握较好，"Taylor公式"一般' },
      ],
    },
    {
      id: 'Q2',
      title: '判断 x=cos(x) 在区间 [0, π/2] 上不动点迭代的收敛性',
      difficulty: 0.7,
      correctAnswer: '收敛',
      studentAnswer: '不收敛',
      primaryError: '能力天花板',
      primaryLevel: '能力天花板',
      confidence: 0.38,
      evidence: [
        { name: '难度梯度', score: 0.82, desc: '0.7 难度，学生会做 0.4 以下的题，0.6+ 骤降' },
        { name: '答题时间', score: 0.50, desc: '用时 180s，比中位 95s 明显长' },
        { name: '错误选项', score: 0.55, desc: '错误地认为余弦函数不是压缩映射' },
        { name: '解题步骤', score: 0.65, desc: '没有检查导数绝对值是否 < 1' },
        { name: '历史表现', score: 0.52, desc: '收敛性判断题历史正确率仅 40%' },
        { name: '知识图谱', score: 0.45, desc: '前置"压缩映射"掌握度 0.48' },
      ],
    },
    {
      id: 'Q3',
      title: '用 Gauss-Seidel 迭代法判断系数矩阵是否满足收敛条件',
      difficulty: 0.55,
      correctAnswer: '满足严格对角占优',
      studentAnswer: '不满足',
      primaryError: '粗心失误',
      primaryLevel: '粗心失误',
      confidence: 0.28,
      evidence: [
        { name: '难度梯度', score: 0.30, desc: '0.55 难度，学生低难度正确率高，本题意外答错' },
        { name: '答题时间', score: 0.85, desc: '用时仅 32s，比中位 65s 快很多，疑似粗心' },
        { name: '错误选项', score: 0.40, desc: '可能没逐行检查对角元素大小' },
        { name: '解题步骤', score: 0.35, desc: '未展示检查过程，直接给出结论' },
        { name: '历史表现', score: 0.70, desc: '低难度题历史正确率 88%，本题波动异常' },
        { name: '知识图谱', score: 0.20, desc: '前置"对角占优条件"掌握度 0.82' },
      ],
    },
  ],
  suggestion: '建议重点复习数值积分中的 Gauss 型求积公式，以及线性方程组迭代法的收敛性分析。可以从 Lagrange 插值出发，理解插值型积分公式的构造思想，再过渡到 Gauss 积分的高精度特性。',
};

function getGradeClass(grade) {
  const map = { S: 'grade-s', A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d' };
  return map[grade] || 'grade-b';
}

// 单题错因分析折叠面板
function WrongQuestionItem({ question, index }) {
  const [open, setOpen] = useState(false);
  const levelColors = {
    '基础薄弱': '#ef4444', '能力天花板': '#f97316', '粗心失误': '#f59e0b', '正常过渡': '#6b7280',
  };
  const lc = levelColors[question.primaryLevel] || '#6b7280';

  return (
    <div style={{ marginBottom: 10, border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: open ? '#f8f5ff' : '#fff',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#9ca3af', marginRight: 6 }}>#{index + 1}</span>
            {question.title}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11 }}>
            <span style={{ color: '#999' }}>难度 {question.difficulty}</span>
            <span style={{ color: '#ef4444' }}>答：{question.studentAnswer}</span>
            <span style={{ color: '#10b981' }}>正解：{question.correctAnswer}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 12, background: lc + '18', color: lc,
            fontSize: 11, fontWeight: 600,
          }}>
            {question.primaryLevel} · {question.primaryError}
          </span>
          <span style={{ fontSize: 14, color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : '' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>证据维度分析</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              置信度 {Math.round(question.confidence * 100)}%
              {question.confidence > 0.4 ? ' · 较稳定' : question.confidence > 0.2 ? ' · 中等' : ' · 待审核'}
            </span>
          </div>
          {question.evidence.map((ev, ei) => (
            <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 58, fontSize: 11, color: '#6b7280', textAlign: 'right', flexShrink: 0 }}>{ev.name}</span>
              <div style={{ flex: 1, height: 5, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${ev.score * 100}%`, height: '100%', borderRadius: 3, background: ev.score > 0.6 ? '#10b981' : ev.score > 0.4 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span style={{ width: 32, fontSize: 11, fontWeight: 600, color: '#333' }}>{Math.round(ev.score * 100)}%</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
            证据可靠性：选项/步骤 {'>'} 难度/历史 {'>'} 时间
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentLearningAnalysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '学情分析';

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const res = await getLearningAnalysis({ video_id: videoId, class_id: classId });
      if ((res.code === 0 || res.code === 200) && res.data) {
        setAnalysis(res.data);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setAnalysis(demoAnalysis);
    setLoading(false);
  };

  const data = analysis || demoAnalysis;

  return (
    <div className="la-page-v2">
      <div className="la-header-v2">
        <div className="la-header-content-v2">
          <div className="la-back-btn-v2" onClick={() => navigate(-1)}>←</div>
          <div className="la-title-section-v2">
            <span className="la-title-v2">{decodeURIComponent(pageTitle)}</span>
            <span className="la-subtitle-v2">学情分析报告</span>
          </div>
        </div>
      </div>

      <div className="la-content-v2">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="la-score-card-v2">
              <div className={`la-score-circle-v2 ${getGradeClass(data.grade)}`}>
                <span className="la-score-value-v2">{data.score}</span>
                <span className="la-grade-v2">{data.grade}</span>
              </div>
              <span className="la-evaluation-v2">{data.evaluation}</span>
            </div>

            <div className="la-stats-row-v2">
              <div className="la-stat-card-v2">
                <span className="la-stat-value-v2">{data.study_time_min} 分钟</span>
                <span className="la-stat-label-v2">学习时长</span>
              </div>
              <div className="la-stat-card-v2">
                <span className="la-stat-value-v2">{Math.round(data.correct_rate * 100)}%</span>
                <span className="la-stat-label-v2">正确率</span>
              </div>
              <div className="la-stat-card-v2">
                <span className="la-stat-value-v2">{Math.round(data.knowledge_coverage * 100)}%</span>
                <span className="la-stat-label-v2">知识点覆盖</span>
              </div>
            </div>

            {data.knowledge_points?.length > 0 && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">知识点掌握度</div>
                <div className="la-knowledge-list-v2">
                  {data.knowledge_points.map((kp, idx) => (
                    <MasteryBar key={idx} label={kp.name} rate={kp.rate} />
                  ))}
                </div>
              </div>
            )}

            {data.weaknesses?.length > 0 && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">薄弱点分析</div>
                {data.weaknesses.map((w, idx) => (
                  <div key={idx} className="la-weakness-item-v2">
                    <div className="la-weakness-info-v2">
                      <span className="la-weakness-topic-v2">{w.topic}</span>
                      <span className="la-weakness-desc-v2">{w.desc}</span>
                    </div>
                    <div
                      className="la-weakness-btn-v2"
                      onClick={() => navigate(`/student/deep-practice?videoId=${videoId || ''}&title=${encodeURIComponent(w.topic)}&classId=${classId || ''}`)}
                    >
                      深度练习
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.behavior_records && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">学习行为记录</div>
                <div className="la-behavior-grid-v2">
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.total_sessions} 次</span>
                    <span className="la-behavior-label-v2">学习次数</span>
                  </div>
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.avg_session_min} 分钟</span>
                    <span className="la-behavior-label-v2">平均每次学习</span>
                  </div>
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.pause_count} 次</span>
                    <span className="la-behavior-label-v2">暂停次数</span>
                  </div>
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.replay_count} 次</span>
                    <span className="la-behavior-label-v2">回看次数</span>
                  </div>
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.answer_speed_sec}s</span>
                    <span className="la-behavior-label-v2">平均答题速度</span>
                  </div>
                  <div className="la-behavior-item-v2">
                    <span className="la-behavior-value-v2">{data.behavior_records.peak_study_time}</span>
                    <span className="la-behavior-label-v2">学习高峰时段</span>
                  </div>
                </div>
                {data.behavior_records.completion_curve && (
                  <>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 12, marginBottom: 4 }}>近7天完成率趋势</div>
                    <div className="la-completion-curve-v2">
                      {data.behavior_records.completion_curve.map((point, idx) => (
                        <div key={idx} className="la-curve-bar-v2">
                          <span className="la-curve-rate-v2">{point.rate}%</span>
                          <div className="la-curve-fill-v2" style={{ height: `${point.rate * 0.6}px`, background: point.rate >= 80 ? '#10b981' : point.rate >= 60 ? '#f59e0b' : '#ef4444' }} />
                          <span className="la-curve-day-v2">{point.day}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {data.wrong_questions && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">错题错因分析</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                  共 {data.wrong_questions.length} 道错题，点击展开查看每题独立诊断（基于 F_error(s,k,r)）
                </div>
                {data.wrong_questions.map((q, qi) => (
                  <WrongQuestionItem key={q.id} question={q} index={qi} />
                ))}
              </div>
            )}

            {false && data.error_analysis && (
              <>
                {/* 诊断摘要 */}
                <div className="la-section-card-v2" style={{ background: 'linear-gradient(135deg, #fef2f2, #fff7ed)', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="la-section-title-v2" style={{ marginBottom: 0 }}>错因诊断</div>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      置信度 {Math.round((data.error_analysis.confidence || 0.35) * 100)}%
                      {data.error_analysis.confidence > 0.4 ? ' · 较稳定' : data.error_analysis.confidence > 0.2 ? ' · 中等' : ' · 待审核'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ padding: '6px 14px', borderRadius: 20, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                      主错因：{data.error_analysis.primary_error}（{data.error_analysis.primary_sub}）
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: 20, background: '#fef3c7', color: '#d97706', fontSize: 13, fontWeight: 500 }}>
                      次错因：{data.error_analysis.secondary_error}
                    </div>
                  </div>
                </div>

                {/* 四大类错因 */}
                <div className="la-section-card-v2">
                  <div className="la-section-title-v2">一级错因分布（4 类合并）</div>
                  <div className="la-error-list-v2">
                    {data.error_analysis.first_level.map((err, idx) => (
                      <div key={idx} className="la-error-item-v2">
                        <div className="la-error-icon-v2" style={{ background: err.color + '18', color: err.color }}>{idx + 1}</div>
                        <div className="la-error-bar-col-v2">
                          <div className="la-error-header-v2">
                            <span className="la-error-name-v2">{err.category}</span>
                            <span className="la-error-pct-v2" style={{ color: err.color }}>{err.pct}%</span>
                          </div>
                          <div className="la-error-track-v2">
                            <div className="la-error-fill-v2" style={{ width: `${err.pct}%`, background: err.color }} />
                          </div>
                          <div className="la-error-examples-v2">含：{err.sub.join('、')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 10 种细分错因 */}
                <div className="la-section-card-v2">
                  <div className="la-section-title-v2">细分错因（10 类）</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {data.error_analysis.fine_grained.map((err, idx) => (
                      <div key={idx} style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${err.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>{err.category}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: err.color }}>{err.pct}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>{err.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6 证据维度 */}
                <div className="la-section-card-v2">
                  <div className="la-section-title-v2">证据维度评分</div>
                  {data.error_analysis.evidence.map((ev, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ width: 65, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>{ev.name}</span>
                      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${ev.score * 100}%`, height: '100%', borderRadius: 3, background: ev.score > 0.6 ? '#10b981' : ev.score > 0.4 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span style={{ width: 36, fontSize: 12, fontWeight: 600, color: '#333' }}>{Math.round(ev.score * 100)}%</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                    可靠性系数：选项/步骤 {'>'} 难度/历史 {'>'} 时间（仅辅助）
                  </div>
                </div>
              </>
            )}

            {data.suggestion && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">学习建议</div>
                <div className="la-suggestion-v2">💡 {data.suggestion}</div>
              </div>
            )}

            <div className="la-footer-v2">
              <button
                className="la-footer-btn-v2 primary"
                onClick={() => navigate(`/student/deep-practice?videoId=${videoId || ''}&classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}
              >
                深度练习
              </button>
              <button
                className="la-footer-btn-v2 secondary"
                onClick={() => navigate(`/student/big-kg?classId=${classId || ''}&title=${encodeURIComponent('课程知识图谱')}`)}
              >
                查看大图谱
              </button>
            </div>
          </>
        )}
      </div>

      <AIFloatButton />
    </div>
  );
}
