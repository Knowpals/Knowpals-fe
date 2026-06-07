import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import request from '../../utils/request';
import BackArrow from '../../components/BackArrow';
import AIFloatButton from '../../components/AIFloatButton';
import { injectStyles } from '../../utils/injectStyles';
import '../../utils/sharedPageStyles';

injectStyles('student-practice', `
  .practice-page-v1 { min-height: 100vh; background: #f5f7fa; }
  .practice-header-v1 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px 10px; color: #fff;
  }
  .practice-header-content-v1 { display: flex; align-items: center; justify-content: space-between; }
  .practice-back-btn-v1 { font-size: 28px; cursor: pointer; padding: 0 5px; }
  .practice-header-title-v1 { font-size: 18px; font-weight: 600; flex: 1; text-align: center; }
  .practice-progress-bar-v1 { background: rgba(255,255,255,0.3); height: 4px; border-radius: 2px; margin-top: 12px; overflow: hidden; }
  .practice-progress-fill-v1 { background: #fff; height: 100%; border-radius: 2px; transition: width 0.3s; }
  .practice-progress-text-v1 { font-size: 12px; opacity: 0.9; margin-top: 6px; text-align: center; }
  .practice-empty-v1 { text-align: center; padding: 60px 15px; }
  .practice-empty-icon-v1 { font-size: 60px; margin-bottom: 15px; }
  .practice-empty-title-v1 { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .practice-empty-desc-v1 { font-size: 14px; color: #999; }
  .practice-card-v1 {
    background: #fff; margin: 15px; border-radius: 15px;
    padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .practice-card-header-v1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .practice-type-tag-v1 {
    padding: 5px 12px; background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff; border-radius: 15px; font-size: 12px;
  }
  .practice-question-num-v1 { font-size: 13px; color: #999; }
  .practice-question-v1 { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px; }
  .practice-options-v1 { display: flex; flex-direction: column; gap: 12px; }
  .practice-option-v1 {
    display: flex; align-items: center; padding: 15px;
    border: 2px solid #f0f0f0; border-radius: 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .practice-option-v1:active { background: #f5f5f5; }
  .practice-option-v1.selected { border-color: #7c3aed; background: rgba(124,58,237,0.1); }
  .practice-option-v1.correct { border-color: #43e97b; background: rgba(67,233,123,0.1); }
  .practice-option-v1.wrong { border-color: #f5576c; background: rgba(245,87,108,0.1); }
  .practice-option-letter-v1 {
    width: 30px; height: 30px; border-radius: 50%; background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: bold; color: #666; margin-right: 12px;
  }
  .practice-option-v1.selected .practice-option-letter-v1 { background: #7c3aed; color: #fff; }
  .practice-option-v1.correct .practice-option-letter-v1 { background: #43e97b; color: #fff; }
  .practice-option-v1.wrong .practice-option-letter-v1 { background: #f5576c; color: #fff; }
  .practice-option-text-v1 { flex: 1; font-size: 15px; color: #333; }
  .practice-footer-v1 { margin-top: 25px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
  .practice-submit-btn-v1 {
    width: 100%; padding: 14px; background: #e5e5e5; color: #999;
    border-radius: 10px; font-size: 16px; text-align: center; cursor: pointer;
  }
  .practice-submit-btn-v1.active {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff; box-shadow: 0 4px 15px rgba(124,58,237,0.3);
  }
  .practice-next-btn-v1 {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #43e97b, #38f9d7);
    color: #fff; border-radius: 10px; font-size: 16px;
    text-align: center; cursor: pointer;
  }
  .practice-analysis-v1 { background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px; }
  .practice-analysis-title-v1 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .practice-analysis-text-v1 { font-size: 14px; color: #666; line-height: 1.6; }
  .result-overlay-v1 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 9998;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .result-content-v1 {
    background: #fff; border-radius: 20px; width: 100%;
    max-width: 360px; padding: 30px; text-align: center;
  }
  .result-icon-v1 { font-size: 80px; margin-bottom: 20px; }
  .result-title-v1 { font-size: 24px; font-weight: 700; color: #333; margin-bottom: 10px; }
  .result-score-v1 {
    font-size: 48px; font-weight: 700;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 15px;
  }
  .result-comment-v1 { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px; }
  .result-btn-v1 {
    width: 100%; padding: 14px; border-radius: 25px;
    font-size: 16px; cursor: pointer; margin-bottom: 10px;
  }
  .result-btn-v1.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .result-btn-v1.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
  .practice-mode-switch-v2 {
    margin: 10px 15px 0; padding: 10px 14px;
    background: #fff; border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex; align-items: center; justify-content: space-between;
  }
  .practice-mode-label-v2 { font-size: 13px; color: #6b7280; }
  .practice-mode-link-v2 { font-size: 13px; color: #7c3aed; font-weight: 500; cursor: pointer; }
`);

// V1 quiz-practice.html 逻辑：个性化练习页面
const StudentPractice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const videoId = searchParams.get('videoId');
  const pageTitle = searchParams.get('title') || '个性化练习';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      if (videoId) {
        const res = await request.post('/agent/quiz', { video_id: String(videoId), num_questions: 5 });
        if ((res.code === 0 || res.code === 200) && res.data?.quizzes?.length > 0) {
          processQuestions(res.data.quizzes);
          return;
        }
      }
    } catch (err) {
      console.error('加载习题失败:', err);
    }
    // Mock 数据作为后备
    loadMockQuestions();
    setLoading(false);
  };

  const loadMockQuestions = () => {
    processQuestions([
      { id: 'q1', knowledge_id: 'Lagrange 插值', question: '给定数据点 (0,1), (1,3), (2,7)，用 Lagrange 插值计算 f(0.5) 的近似值为？', type: 'choice',
        options: [{ letter: 'A', text: '1.5' }, { letter: 'B', text: '1.875' }, { letter: 'C', text: '2.0' }, { letter: 'D', text: '2.25' }], answer: 'B',
        analysis: '基函数 l₀=x(x-2)/2, l₁=-x(x-2), l₂=x(x-1)/2。L(0.5)=1·l₀(0.5)+3·l₁(0.5)+7·l₂(0.5)=1.875。' },
      { id: 'q2', knowledge_id: '数值积分', question: '梯形公式 ∫ₐᵇ f(x)dx ≈ (b-a)[f(a)+f(b)]/2 的代数精度是？', type: 'choice',
        options: [{ letter: 'A', text: '0次' }, { letter: 'B', text: '1次' }, { letter: 'C', text: '2次' }, { letter: 'D', text: '3次' }], answer: 'B',
        analysis: '梯形公式由线性插值导出，对 f(x)=1 和 f(x)=x 精确，对 f(x)=x² 有误差，代数精度为 1。' },
      { id: 'q3', knowledge_id: '方程求根', question: '用二分法求方程 f(x)=x³-x-1=0 在 [1,2] 内的根，至少需要多少次迭代才能使误差小于 10⁻³？', type: 'choice',
        options: [{ letter: 'A', text: '7次' }, { letter: 'B', text: '10次' }, { letter: 'C', text: '13次' }, { letter: 'D', text: '20次' }], answer: 'B',
        analysis: '区间长度 1，每步减半，需满足 (1/2)ⁿ < 10⁻³，即 2ⁿ > 1000，n > log₂(1000) ≈ 9.97，至少 10 次。' },
      { id: 'q4', knowledge_id: 'Newton 迭代', question: '用 Newton 迭代法求 √2，取初始值 x₀=1.5，一步迭代后 x₁ 的值为？', type: 'choice',
        options: [{ letter: 'A', text: '1.4' }, { letter: 'B', text: '1.4167' }, { letter: 'C', text: '1.5' }, { letter: 'D', text: '1.4142' }], answer: 'B',
        analysis: '方程 x²-2=0，Newton 迭代：x₁ = x₀ - (x₀²-2)/(2x₀) = 1.5 - (2.25-2)/3 = 1.5 - 0.0833 = 1.4167。' },
      { id: 'q5', knowledge_id: '线性方程组', question: '用 Gauss 消元法求解 2x+3y=8, 4x+7y=18，消元后第二个方程变为？', type: 'choice',
        options: [{ letter: 'A', text: 'y=2' }, { letter: 'B', text: 'y=4' }, { letter: 'C', text: 'y=1' }, { letter: 'D', text: 'y=3' }], answer: 'A',
        analysis: '第二行减去第一行×2：(4-4)x + (7-6)y = 18-16，即 y=2。回代得 x=1。' },
    ]);
  };

  const processQuestions = (quizzes) => {
    const processed = quizzes.map((q, i) => ({
      id: (q.knowledge_id || 'q') + '_' + i,
      knowledge_id: q.knowledge_id,
      question: q.question,
      type: q.type || 'choice',
      options: (q.options || []).map((opt, j) =>
        typeof opt === 'string' ? { letter: String.fromCharCode(65 + j), text: opt } : { letter: opt.letter || String.fromCharCode(65 + j), text: opt.text || opt }
      ),
      answer: q.answer,
      analysis: q.analysis,
    }));
    setQuestions(processed);
    setLoading(false);
  };

  const current = questions[currentIdx];
  const correctCount = answers.filter((a) => a.isCorrect).length;

  const handleSelect = (idx) => {
    if (hasSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedIdx === -1) { message.info('请先选择答案'); return; }
    const question = questions[currentIdx];
    const selectedLetter = question.options[selectedIdx]?.letter;
    const isCorrect = selectedLetter === question.answer;
    const newAnswer = { questionId: question.id, selectedAnswer: selectedLetter, isCorrect };
    const newAnswers = [...answers];
    newAnswers[currentIdx] = newAnswer;
    setAnswers(newAnswers);
    setHasSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
      setSelectedIdx(-1);
      setHasSubmitted(false);
    } else {
      setShowResult(true);
    }
  };

  const getResultComment = (correct, total) => {
    const rate = correct / total;
    if (rate >= 1) return '太棒了！全部正确，继续保持！';
    if (rate >= 0.8) return '很不错！基本掌握，可以针对错题进行巩固。';
    if (rate >= 0.6) return '还需努力！建议观看薄弱点的讲解视频。';
    return '建议重新学习相关知识点，再做练习。';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#f5f7fa', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="practice-page-v1">
      {/* 顶部导航 */}
      <div className="practice-header-v1">
        <div className="practice-header-content-v1">
          <BackArrow onClick={() => navigate(-1)} />
          <span className="practice-header-title-v1">{decodeURIComponent(pageTitle)}</span>
          <div style={{ width: 40 }} />
        </div>
        <div className="practice-progress-bar-v1">
          <div className="practice-progress-fill-v1" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="practice-progress-text-v1">{currentIdx + 1} / {questions.length}</div>
      </div>

      <div className="practice-mode-switch-v2">
        <span className="practice-mode-label-v2">当前：个性练习模式</span>
        <span
          className="practice-mode-link-v2"
          onClick={() => navigate(`/student/deep-practice?videoId=${videoId || ''}&classId=${searchParams.get('classId') || ''}&title=${encodeURIComponent(pageTitle)}`)}
        >
          切换到深度练习 →
        </span>
      </div>

      {questions.length === 0 ? (
        <div className="practice-empty-v1">
          <div className="practice-empty-icon-v1">📝</div>
          <div className="practice-empty-title-v1">暂无习题</div>
          <div className="practice-empty-desc-v1">请联系老师添加习题内容</div>
        </div>
      ) : (
        <>
          {/* 题目卡片 */}
          <div className="practice-card-v1">
            <div className="practice-card-header-v1">
              <span className="practice-type-tag-v1">单选题</span>
              <span className="practice-question-num-v1">第 {currentIdx + 1} 题</span>
            </div>
            <div className="practice-question-v1">{current?.question}</div>
            <div className="practice-options-v1">
              {current?.options.map((opt, idx) => {
                let cls = 'practice-option-v1';
                if (selectedIdx === idx) cls += ' selected';
                if (hasSubmitted && idx === questions[currentIdx].options.findIndex((o) => o.letter === questions[currentIdx].answer)) cls += ' correct';
                if (hasSubmitted && selectedIdx === idx && opt.letter !== questions[currentIdx].answer) cls += ' wrong';
                return (
                  <div key={idx} className={cls} onClick={() => handleSelect(idx)}>
                    <div className="practice-option-letter-v1">{opt.letter}</div>
                    <span className="practice-option-text-v1">{opt.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="practice-footer-v1">
              {!hasSubmitted ? (
                <div className={`practice-submit-btn-v1 ${selectedIdx >= 0 ? 'active' : ''}`} onClick={handleSubmit}>提交答案</div>
              ) : (
                <>
                  {current?.analysis && (
                    <div className="practice-analysis-v1">
                      <div className="practice-analysis-title-v1">📝 答案解析</div>
                      <div className="practice-analysis-text-v1">{current.analysis}</div>
                    </div>
                  )}
                  <div className="practice-next-btn-v1" onClick={handleNext}>
                    {currentIdx < questions.length - 1 ? '下一题' : '查看结果'}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* 结果弹窗 */}
      {showResult && (
        <div className="result-overlay-v1">
          <div className="result-content-v1">
            <div className="result-icon-v1">
              {correctCount / questions.length >= 0.8 ? '🎉' : correctCount / questions.length >= 0.5 ? '👍' : '💪'}
            </div>
            <div className="result-title-v1">练习完成</div>
            <div className="result-score-v1">{correctCount}/{questions.length}</div>
            <div className="result-comment-v1">{getResultComment(correctCount, questions.length)}</div>
            <div className="result-btn-v1 primary" onClick={() => {
              if (videoId) navigate(`/student/report?videoId=${videoId}&title=${encodeURIComponent(pageTitle)}`);
            }}>查看学情报告</div>
            <div
              className="result-btn-v1 primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
              onClick={() => navigate(`/student/deep-practice?videoId=${videoId || ''}&classId=${searchParams.get('classId') || ''}&title=${encodeURIComponent(pageTitle)}`)}
            >
              深度练习
            </div>
            <div className="result-btn-v1 secondary" onClick={() => navigate(-1)}>返回学习</div>
          </div>
        </div>
      )}

      <AIFloatButton />
    </div>
  );
};

export default StudentPractice;
