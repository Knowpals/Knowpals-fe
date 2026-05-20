import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import request from '../../utils/request';

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
  const [generatingReport, setGeneratingReport] = useState(false);

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
      { id: 'q1', knowledge_id: '勾股定理', question: '已知直角三角形的两直角边分别为3和4，则斜边的长度为多少？', type: 'choice',
        options: [{ letter: 'A', text: '5' }, { letter: 'B', text: '6' }, { letter: 'C', text: '7' }, { letter: 'D', text: '8' }], answer: 'A',
        analysis: '根据勾股定理，a² + b² = c²，即 3² + 4² = 9 + 16 = 25，c = 5。' },
      { id: 'q2', knowledge_id: '勾股定理', question: '下列哪组数可以作为直角三角形的三边长？', type: 'choice',
        options: [{ letter: 'A', text: '3, 4, 6' }, { letter: 'B', text: '5, 12, 13' }, { letter: 'C', text: '7, 24, 25' }, { letter: 'D', text: '8, 15, 17' }], answer: 'B',
        analysis: '5² + 12² = 25 + 144 = 169 = 13²。' },
      { id: 'q3', knowledge_id: '勾股定理应用', question: '一个等腰三角形的底边长为6，腰长为5，求这个三角形的高？', type: 'choice',
        options: [{ letter: 'A', text: '3' }, { letter: 'B', text: '4' }, { letter: 'C', text: '5' }, { letter: 'D', text: '6' }], answer: 'B',
        analysis: '等腰三角形底边上的高也是中线，3² + h² = 5²，h = 4。' },
      { id: 'q4', knowledge_id: '勾股定理', question: '在平面直角坐标系中，点A(3,4)到原点的距离是多少？', type: 'choice',
        options: [{ letter: 'A', text: '3' }, { letter: 'B', text: '4' }, { letter: 'C', text: '5' }, { letter: 'D', text: '7' }], answer: 'C',
        analysis: '√(3² + 4²) = √25 = 5。' },
      { id: 'q5', knowledge_id: '勾股定理逆定理', question: '如果一个三角形的三边长分别为6、8、10，则这个三角形是什么三角形？', type: 'choice',
        options: [{ letter: 'A', text: '锐角三角形' }, { letter: 'B', text: '直角三角形' }, { letter: 'C', text: '钝角三角形' }, { letter: 'D', text: '等腰三角形' }], answer: 'B',
        analysis: '6² + 8² = 36 + 64 = 100 = 10²，是直角三角形。' },
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
          <div className="practice-back-btn-v1" onClick={() => navigate(-1)}>‹</div>
          <span className="practice-header-title-v1">{decodeURIComponent(pageTitle)}</span>
          <div style={{ width: 40 }} />
        </div>
        <div className="practice-progress-bar-v1">
          <div className="practice-progress-fill-v1" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <div className="practice-progress-text-v1">{currentIdx + 1} / {questions.length}</div>
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
            <div className="result-btn-v1 primary" onClick={async () => {
              if (!videoId) { navigate(-1); return; }
              setGeneratingReport(true);
              try {
                await request.post('/agent/report', { video_id: String(videoId) });
              } catch (e) { /* ignore */ }
              setGeneratingReport(false);
              navigate(`/student/report?videoId=${videoId}&title=${encodeURIComponent(pageTitle)}`);
            }}>{generatingReport ? '生成中...' : '查看学情报告'}</div>
            <div className="result-btn-v1 secondary" onClick={() => {
              setShowResult(false);
              if (videoId) navigate(`/student/video/${videoId}/0?title=${encodeURIComponent(pageTitle)}`);
              else navigate(-1);
            }}>返回学习</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPractice;
