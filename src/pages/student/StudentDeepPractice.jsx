import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import AIFloatButton from '../../components/AIFloatButton';
import { getDeepPractice } from '../../services/studentApi';
import { injectStyles } from '../../utils/injectStyles';

injectStyles('student-deep-practice', `
  .dp-page-v2 { min-height: 100vh; background: #f5f7fa; }
  .dp-header-v2 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px 10px; color: #fff;
  }
  .dp-header-content-v2 { display: flex; align-items: center; justify-content: space-between; }
  .dp-back-btn-v2 { font-size: 28px; cursor: pointer; padding: 0 5px; }
  .dp-header-title-v2 { font-size: 18px; font-weight: 600; flex: 1; text-align: center; }
  .dp-progress-bar-v2 { background: rgba(255,255,255,0.3); height: 4px; border-radius: 2px; margin-top: 12px; overflow: hidden; }
  .dp-progress-fill-v2 { background: #fff; height: 100%; border-radius: 2px; transition: width 0.3s; }
  .dp-progress-text-v2 { font-size: 12px; opacity: 0.9; margin-top: 6px; text-align: center; }
  .dp-mode-badge-v2 {
    text-align: center; margin: 12px 15px 0;
  }
  .dp-mode-tag-v2 {
    display: inline-block; padding: 4px 14px; border-radius: 12px;
    font-size: 12px; background: linear-gradient(135deg, #fef3c7, #fde68a);
    color: #92400e;
  }
  .dp-layer-info-v2 {
    margin: 0 15px 8px; padding: 10px 14px;
    background: #fff; border-radius: 10px; font-size: 13px;
    color: #6b7280; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex; align-items: center; gap: 8px;
  }
  .dp-layer-dot-v2 {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  .dp-empty-v2 { text-align: center; padding: 60px 15px; }
  .dp-empty-icon-v2 { font-size: 60px; margin-bottom: 15px; }
  .dp-empty-title-v2 { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .dp-empty-desc-v2 { font-size: 14px; color: #999; }
  .dp-card-v2 {
    background: #fff; margin: 15px; border-radius: 15px;
    padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .dp-card-header-v2 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .dp-type-tag-v2 {
    padding: 5px 12px; background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff; border-radius: 15px; font-size: 12px;
  }
  .dp-question-num-v2 { font-size: 13px; color: #999; }
  .dp-question-v2 { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px; }
  .dp-options-v2 { display: flex; flex-direction: column; gap: 12px; }
  .dp-option-v2 {
    display: flex; align-items: center; padding: 15px;
    border: 2px solid #f0f0f0; border-radius: 12px;
    cursor: pointer; transition: all 0.2s;
  }
  .dp-option-v2:active { background: #f5f5f5; }
  .dp-option-v2.selected { border-color: #7c3aed; background: rgba(124,58,237,0.1); }
  .dp-option-v2.correct { border-color: #43e97b; background: rgba(67,233,123,0.1); }
  .dp-option-v2.wrong { border-color: #f5576c; background: rgba(245,87,108,0.1); }
  .dp-option-letter-v2 {
    width: 30px; height: 30px; border-radius: 50%; background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: bold; color: #666; margin-right: 12px;
  }
  .dp-option-v2.selected .dp-option-letter-v2 { background: #7c3aed; color: #fff; }
  .dp-option-v2.correct .dp-option-letter-v2 { background: #43e97b; color: #fff; }
  .dp-option-v2.wrong .dp-option-letter-v2 { background: #f5576c; color: #fff; }
  .dp-option-text-v2 { flex: 1; font-size: 15px; color: #333; }
  .dp-footer-v2 { margin-top: 25px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
  .dp-submit-btn-v2 {
    width: 100%; padding: 14px; background: #e5e5e5; color: #999;
    border-radius: 10px; font-size: 16px; text-align: center; cursor: pointer;
  }
  .dp-submit-btn-v2.active {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    color: #fff; box-shadow: 0 4px 15px rgba(124,58,237,0.3);
  }
  .dp-next-btn-v2 {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #43e97b, #38f9d7);
    color: #fff; border-radius: 10px; font-size: 16px;
    text-align: center; cursor: pointer;
  }
  .dp-analysis-v2 { background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px; }
  .dp-analysis-title-v2 { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
  .dp-analysis-text-v2 { font-size: 14px; color: #666; line-height: 1.6; }
  .dp-result-overlay-v2 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 9998;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .dp-result-content-v2 {
    background: #fff; border-radius: 20px; width: 100%;
    max-width: 360px; max-height: 80vh; overflow-y: auto;
    padding: 30px; text-align: center;
  }
  .dp-result-icon-v2 { font-size: 80px; margin-bottom: 20px; }
  .dp-result-title-v2 { font-size: 24px; font-weight: 700; color: #333; margin-bottom: 10px; }
  .dp-result-score-v2 {
    font-size: 48px; font-weight: 700;
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 15px;
  }
  .dp-result-comment-v2 { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 15px; }
  .dp-result-layers-v2 { text-align: left; margin-bottom: 20px; }
  .dp-result-layer-v2 {
    display: flex; align-items: center; gap: 8px; padding: 8px 0;
    border-bottom: 1px solid #f0f0f0; font-size: 13px;
  }
  .dp-result-layer-v2:last-child { border-bottom: none; }
  .dp-result-btn-v2 {
    width: 100%; padding: 14px; border-radius: 25px;
    font-size: 16px; cursor: pointer; margin-bottom: 10px; border: none;
  }
  .dp-result-btn-v2.primary { background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  .dp-result-btn-v2.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
`);

// BFS 前置知识追溯 demo 数据 — 数值积分知识链
const demoDeepQuestions = [
  // Layer 0: 多项式求值 (最基础)
  {
    knowledge_id: '多项式求值',
    layer: 0, layer_name: '前置基础',
    questions: [
      {
        id: 'd1', knowledge_id: '多项式求值', question: '用 Horner 算法计算 P(x)=2x³-3x²+4x-5 在 x=2 处的值时，第一步应计算什么？', type: 'choice',
        options: [{ letter: 'A', text: '2×2-3' }, { letter: 'B', text: '2×2+4' }, { letter: 'C', text: '2×2³' }, { letter: 'D', text: '2×2' }],
        answer: 'A', analysis: 'Horner 算法从最高次系数开始：((2×2-3)×2+4)×2-5 = 11。第一步计算 2×2-3=1。',
      },
      {
        id: 'd2', knowledge_id: '多项式求值', question: '直接计算 P(x)=x⁴-x³+x²-x+1 在 x=-1 处的值，结果是？', type: 'choice',
        options: [{ letter: 'A', text: '1' }, { letter: 'B', text: '3' }, { letter: 'C', text: '5' }, { letter: 'D', text: '0' }],
        answer: 'C', analysis: '(-1)⁴-(-1)³+(-1)²-(-1)+1 = 1+1+1+1+1 = 5。',
      },
    ],
  },
  // Layer 1: 插值基函数
  {
    knowledge_id: '插值基函数',
    layer: 1, layer_name: 'Lagrange 基函数',
    questions: [
      {
        id: 'd3', knowledge_id: '插值基函数', question: 'Lagrange 插值基函数 lᵢ(x) 的性质是：', type: 'choice',
        options: [
          { letter: 'A', text: 'lᵢ(xⱼ) = 1 对所有 j 成立' },
          { letter: 'B', text: 'lᵢ(xⱼ) = δᵢⱼ (Kronecker δ)' },
          { letter: 'C', text: 'lᵢ(xⱼ) = 0 对所有 j 成立' },
          { letter: 'D', text: 'lᵢ(xⱼ) = xᵢ' },
        ],
        answer: 'B', analysis: 'Lagrange 基函数满足 lᵢ(xⱼ)=δᵢⱼ，即 i=j 时为 1，否则为 0。',
      },
      {
        id: 'd4', knowledge_id: '插值基函数', question: '给定节点 x₀=0, x₁=1, x₂=2，基函数 l₁(x) 的表达式为？', type: 'choice',
        options: [
          { letter: 'A', text: 'x(x-2)/(-1)' },
          { letter: 'B', text: 'x(x-2)/1' },
          { letter: 'C', text: '(x-0)(x-1)/2' },
          { letter: 'D', text: '(x-0)(x-2)/2' },
        ],
        answer: 'A', analysis: 'l₁(x) = (x-x₀)(x-x₂)/((x₁-x₀)(x₁-x₂)) = x(x-2)/(1×(-1)) = -x(x-2) = x(x-2)/(-1)。',
      },
    ],
  },
  // Layer 2: Lagrange 插值公式
  {
    knowledge_id: 'Lagrange 插值',
    layer: 2, layer_name: 'Lagrange 插值应用',
    questions: [
      {
        id: 'd5', knowledge_id: 'Lagrange 插值', question: '已知 f(0)=1, f(1)=3, f(2)=7，用 Lagrange 插值求 f(0.5) 的近似值最接近？', type: 'choice',
        options: [
          { letter: 'A', text: '1.5' }, { letter: 'B', text: '1.875' },
          { letter: 'C', text: '2.0' }, { letter: 'D', text: '2.25' },
        ],
        answer: 'B', analysis: 'L(x)=1·(x-1)(x-2)/2 - 3·x(x-2)/1 + 7·x(x-1)/2，代入 x=0.5 得约 1.875。',
      },
      {
        id: 'd6', knowledge_id: 'Lagrange 插值', question: '三次 Lagrange 插值多项式通过 4 个数据点。该多项式的次数最高为？', type: 'choice',
        options: [
          { letter: 'A', text: '1 次' }, { letter: 'B', text: '2 次' },
          { letter: 'C', text: '3 次' }, { letter: 'D', text: '取决于数据' },
        ],
        answer: 'C', analysis: 'n+1 个数据点确定不超过 n 次的多项式，4 个点最高 3 次。',
      },
    ],
  },
  // Layer 3: 插值型数值积分
  {
    knowledge_id: '数值积分',
    layer: 3, layer_name: '数值积分公式',
    questions: [
      {
        id: 'd7', knowledge_id: '数值积分', question: '梯形公式 ∫ₐᵇ f(x)dx ≈ (b-a)/2·[f(a)+f(b)] 的代数精度是多少？', type: 'choice',
        options: [
          { letter: 'A', text: '0 次（仅对常数精确）' },
          { letter: 'B', text: '1 次（对线性函数精确）' },
          { letter: 'C', text: '2 次（对二次函数精确）' },
          { letter: 'D', text: '3 次' },
        ],
        answer: 'B', analysis: '梯形公式由线性插值导出，对 f(x)=1 和 f(x)=x 精确成立，对 f(x)=x² 有误差，代数精度为 1。',
      },
      {
        id: 'd8', knowledge_id: '数值积分', question: 'Simpson 公式需要将积分区间分为多少个子区间？', type: 'choice',
        options: [
          { letter: 'A', text: '1 个' }, { letter: 'B', text: '2 个' },
          { letter: 'C', text: '3 个' }, { letter: 'D', text: '4 个' },
        ],
        answer: 'B', analysis: '基本 Simpson 公式在 [a,b] 上使用 3 个节点（端点+中点），等分为 2 个子区间。',
      },
    ],
  },
];

export default function StudentDeepPractice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState([]);
  const [currentLayerIdx, setCurrentLayerIdx] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [layerResults, setLayerResults] = useState([]);

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '深度练习';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await getDeepPractice({ video_id: videoId, class_id: classId, count: 10 });
      if ((res.code === 0 || res.code === 200) && res.data?.layers?.length > 0) {
        setLayers(res.data.layers);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setLayers(demoDeepQuestions);
    setLoading(false);
  };

  const currentLayer = layers[currentLayerIdx];
  const currentQuestion = currentLayer?.questions?.[currentQIdx];
  const totalQuestions = layers.reduce((sum, l) => sum + (l.questions?.length || 0), 0);
  const doneQuestions = layers.slice(0, currentLayerIdx).reduce((sum, l) => sum + (l.questions?.length || 0), 0) + currentQIdx + (hasSubmitted ? 1 : 0);
  const correctCount = answers.filter(a => a.isCorrect).length;

  const isLayerPassed = (layerIdx) => {
    const layerAnswers = answers.filter(a => a.layerIdx === layerIdx);
    if (layerAnswers.length === 0) return false;
    return layerAnswers.every(a => a.isCorrect);
  };

  const handleSelect = (idx) => {
    if (hasSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedIdx === -1) { message.info('请先选择答案'); return; }
    const selectedLetter = currentQuestion.options[selectedIdx]?.letter;
    const isCorrect = selectedLetter === currentQuestion.answer;
    const newAnswer = { layerIdx: currentLayerIdx, questionId: currentQuestion.id, selectedAnswer: selectedLetter, isCorrect };
    const newAnswers = [...answers];
    const globalIdx = answers.findIndex(a => a.layerIdx === currentLayerIdx && a.questionId === currentQuestion.id);
    if (globalIdx >= 0) {
      newAnswers[globalIdx] = newAnswer;
    } else {
      newAnswers.push(newAnswer);
    }
    setAnswers(newAnswers);
    setHasSubmitted(true);

    // 答对自动跳过该知识层剩余题目
    if (isCorrect) {
      const layer = layers[currentLayerIdx];
      const remaining = layer.questions?.slice(currentQIdx + 1) || [];
      if (remaining.length > 0) {
        setTimeout(() => {
          advanceToNextLayer();
        }, 800);
      } else {
        // last question in layer, move on
      }
    }
  };

  const handleNext = () => {
    if (currentQIdx < (currentLayer?.questions?.length || 0) - 1) {
      setCurrentQIdx(p => p + 1);
      setSelectedIdx(-1);
      setHasSubmitted(false);
    } else {
      advanceToNextLayer();
    }
  };

  const advanceToNextLayer = () => {
    if (currentLayerIdx < layers.length - 1) {
      setCurrentLayerIdx(p => p + 1);
      setCurrentQIdx(0);
      setSelectedIdx(-1);
      setHasSubmitted(false);
      // Record layer result
      const passed = isLayerPassed(currentLayerIdx);
      setLayerResults(prev => [...prev.filter(r => r.layer !== currentLayerIdx), { layer: currentLayerIdx, name: currentLayer?.layer_name, passed, total: currentLayer?.questions?.length || 0, correct: answers.filter(a => a.layerIdx === currentLayerIdx && a.isCorrect).length }]);
    } else {
      // Record final layer
      const passed = isLayerPassed(currentLayerIdx);
      setLayerResults(prev => [...prev.filter(r => r.layer !== currentLayerIdx), { layer: currentLayerIdx, name: currentLayer?.layer_name, passed, total: currentLayer?.questions?.length || 0, correct: answers.filter(a => a.layerIdx === currentLayerIdx && a.isCorrect).length }]);
      setShowResult(true);
    }
  };

  const getResultComment = (correct, total) => {
    const rate = correct / total;
    if (rate >= 1) return '太棒了！所有知识层全部通过，基础非常扎实！';
    if (rate >= 0.8) return '表现不错！大部分前置知识已掌握，继续巩固薄弱层。';
    if (rate >= 0.6) return '还需努力！部分前置知识需要回顾，建议查看知识图谱。';
    return '建议系统学习前置知识，再尝试深度练习。';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#f5f7fa', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dp-page-v2">
      <div className="dp-header-v2">
        <div className="dp-header-content-v2">
          <div className="dp-back-btn-v2" onClick={() => navigate(-1)}>‹</div>
          <span className="dp-header-title-v2">{decodeURIComponent(pageTitle)}</span>
          <div style={{ width: 40 }} />
        </div>
        <div className="dp-progress-bar-v2">
          <div className="dp-progress-fill-v2" style={{ width: `${totalQuestions > 0 ? (doneQuestions / totalQuestions) * 100 : 0}%` }} />
        </div>
        <div className="dp-progress-text-v2">{doneQuestions} / {totalQuestions} 题</div>
      </div>

      <div className="dp-mode-badge-v2">
        <span className="dp-mode-tag-v2">🔗 BFS 前置知识追溯练习</span>
      </div>

      {currentLayer && (
        <div className="dp-layer-info-v2">
          <div className="dp-layer-dot-v2" style={{ background: `hsl(${260 + currentLayer.layer * 30}, 70%, 60%)` }} />
          <span>第 {currentLayer.layer + 1} 层：{currentLayer.layer_name}</span>
        </div>
      )}

      {layers.length === 0 || !currentQuestion ? (
        <div className="dp-empty-v2">
          <div className="dp-empty-icon-v2">📝</div>
          <div className="dp-empty-title-v2">暂无深度练习</div>
          <div className="dp-empty-desc-v2">请联系老师添加练习内容</div>
        </div>
      ) : (
        <>
          <div className="dp-card-v2">
            <div className="dp-card-header-v2">
              <span className="dp-type-tag-v2">单选题</span>
              <span className="dp-question-num-v2">知识层 {currentLayerIdx + 1} / 第 {currentQIdx + 1} 题</span>
            </div>
            <div className="dp-question-v2">{currentQuestion.question}</div>
            <div className="dp-options-v2">
              {currentQuestion.options.map((opt, idx) => {
                let cls = 'dp-option-v2';
                if (selectedIdx === idx) cls += ' selected';
                if (hasSubmitted && idx === currentQuestion.options.findIndex(o => o.letter === currentQuestion.answer)) cls += ' correct';
                if (hasSubmitted && selectedIdx === idx && opt.letter !== currentQuestion.answer) cls += ' wrong';
                return (
                  <div key={idx} className={cls} onClick={() => handleSelect(idx)}>
                    <div className="dp-option-letter-v2">{opt.letter}</div>
                    <span className="dp-option-text-v2">{opt.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="dp-footer-v2">
              {!hasSubmitted ? (
                <div className={`dp-submit-btn-v2 ${selectedIdx >= 0 ? 'active' : ''}`} onClick={handleSubmit}>提交答案</div>
              ) : (
                <>
                  {currentQuestion.analysis && (
                    <div className="dp-analysis-v2">
                      <div className="dp-analysis-title-v2">📝 答案解析</div>
                      <div className="dp-analysis-text-v2">{currentQuestion.analysis}</div>
                    </div>
                  )}
                  <div className="dp-next-btn-v2" onClick={handleNext}>
                    {currentLayerIdx < layers.length - 1 || currentQIdx < (currentLayer?.questions?.length || 0) - 1 ? '下一题' : '查看结果'}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showResult && (
        <div className="dp-result-overlay-v2">
          <div className="dp-result-content-v2">
            <div className="dp-result-icon-v2">
              {correctCount / totalQuestions >= 0.8 ? '🎉' : correctCount / totalQuestions >= 0.5 ? '👍' : '💪'}
            </div>
            <div className="dp-result-title-v2">深度练习完成</div>
            <div className="dp-result-score-v2">{correctCount}/{totalQuestions}</div>
            <div className="dp-result-comment-v2">{getResultComment(correctCount, totalQuestions)}</div>

            <div className="dp-result-layers-v2">
              {layerResults.map((lr, idx) => (
                <div key={idx} className="dp-result-layer-v2">
                  <span>{lr.passed ? '✅' : '⚠️'}</span>
                  <span style={{ flex: 1 }}>{lr.name}</span>
                  <span style={{ color: '#999' }}>{lr.correct}/{lr.total} 对</span>
                </div>
              ))}
            </div>

            <button
              className="dp-result-btn-v2 primary"
              onClick={() => navigate(`/student/learning-analysis?videoId=${videoId || ''}&classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}
            >
              查看学情分析
            </button>
            <button
              className="dp-result-btn-v2 secondary"
              onClick={() => navigate(`/student/big-kg?classId=${classId || ''}&title=${encodeURIComponent('课程知识图谱')}`)}
            >
              查看大图谱
            </button>
            <button className="dp-result-btn-v2 secondary" onClick={() => navigate(-1)}>返回</button>
          </div>
        </div>
      )}

      <AIFloatButton />
    </div>
  );
}
