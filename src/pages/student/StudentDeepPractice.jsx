import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message, Progress } from 'antd';
import BackArrow from '../../components/BackArrow';
import AIFloatButton from '../../components/AIFloatButton';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';
import '../../utils/sharedPageStyles';

injectStyles('student-deep-practice', `
  .dp-page-v3 { min-height: 100vh; background: #f5f7fa; }
  .dp-header-v3 {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    padding: 16px 15px 10px; color: #fff;
  }
  .dp-header-row-v3 { display: flex; align-items: center; gap: 12px; }
  .dp-header-title-v3 { font-size: 17px; font-weight: 600; flex: 1; }
  .dp-header-sub-v3 { font-size: 12px; opacity: 0.85; }
  .dp-content-v3 { padding: 12px 15px; max-width: 860px; margin: 0 auto; }
  @media (min-width: 769px) { .dp-content-v3 { padding: 16px 32px; } }

  /* BFS 概览 banner */
  .dp-bfs-banner-v3 {
    background: #fff; border-radius: 14px; padding: 16px;
    margin-bottom: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border-left: 4px solid #7c3aed;
  }
  .dp-bfs-target-v3 { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .dp-bfs-target-icon-v3 {
    width: 40px; height: 40px; border-radius: 50%; background: #fee2e2;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
  }
  .dp-bfs-target-name-v3 { font-size: 16px; font-weight: 700; color: #333; }
  .dp-bfs-target-tag-v3 {
    padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
    background: #fee2e2; color: #dc2626;
  }
  .dp-bfs-desc-v3 { font-size: 12px; color: #888; line-height: 1.5; }

  /* 层叠卡片 */
  .dp-layer-stack-v3 { position: relative; margin-bottom: 12px; }
  .dp-layer-card-v3 {
    background: #fff; border-radius: 14px; overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: all 0.2s;
    margin-bottom: 0;
  }
  .dp-layer-card-v3.expanded { box-shadow: 0 4px 20px rgba(124,58,237,0.15); border: 1px solid #e9d5ff; }
  .dp-layer-header-v3 {
    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
    cursor: pointer; transition: background 0.15s;
  }
  .dp-layer-header-v3:hover { background: #fafafa; }
  .dp-layer-depth-v3 {
    width: 32px; height: 32px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 13px; font-weight: 700;
    color: #fff; flex-shrink: 0;
  }
  .dp-layer-info-v3 { flex: 1; min-width: 0; }
  .dp-layer-name-v3 { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 2px; }
  .dp-layer-reason-v3 { font-size: 11px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dp-layer-status-v3 {
    padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; flex-shrink: 0;
  }
  .dp-layer-arrow-v3 { font-size: 14px; color: #ccc; transition: transform 0.2s; flex-shrink: 0; }
  .dp-layer-arrow-v3.open { transform: rotate(180deg); }

  /* 卡片展开内容 */
  .dp-layer-body-v3 { padding: 0 16px 16px; border-top: 1px solid #f5f5f5; }
  .dp-layer-mastery-v3 { padding: 12px 0 8px; }
  .dp-layer-mastery-row-v3 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .dp-layer-mastery-label-v3 { font-size: 12px; color: #666; }
  .dp-layer-mastery-val-v3 { font-size: 14px; font-weight: 700; }
  .dp-layer-exercise-list-v3 { margin-top: 10px; }
  .dp-layer-exercise-title-v3 {
    font-size: 13px; font-weight: 600; color: #333; margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .dp-exercise-item-v3 {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    background: #f9fafb; border-radius: 8px; margin-bottom: 8px;
    border: 1px solid #f0f0f0; cursor: pointer; transition: all 0.15s;
  }
  .dp-exercise-item-v3:hover { background: #f0f4ff; border-color: #d9c8ff; }
  .dp-exercise-item-v3.done { background: #f0fdf4; border-color: #bbf7d0; }
  .dp-exercise-num-v3 {
    width: 24px; height: 24px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
    background: #e5e5e5; color: #666; flex-shrink: 0;
  }
  .dp-exercise-item-v3.done .dp-exercise-num-v3 { background: #22c55e; color: #fff; }
  .dp-exercise-text-v3 { flex: 1; font-size: 12px; color: #555; line-height: 1.4; }
  .dp-exercise-diff-v3 {
    padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 500; flex-shrink: 0;
  }
  .dp-layer-start-btn-v3 {
    display: block; width: 100%; padding: 12px; margin-top: 10px;
    border-radius: 20px; font-size: 14px; font-weight: 600; text-align: center;
    cursor: pointer; border: none; transition: all 0.2s;
  }
  .dp-layer-start-btn-v3.primary { background: #7c3aed; color: #fff; }
  .dp-layer-start-btn-v3.primary:hover { background: #6d28d9; }
  .dp-layer-start-btn-v3.done { background: #dcfce7; color: #16a34a; }

  /* 层级连线 */
  .dp-layer-connector-v3 {
    display: flex; align-items: center; justify-content: center;
    padding: 4px 0; color: #c4b5fd; font-size: 18px;
  }

  /* 练习模式 */
  .dp-quiz-overlay-v3 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: #f5f7fa; z-index: 9990; display: flex; flex-direction: column;
  }
  .dp-quiz-nav-v3 {
    display: flex; align-items: center; height: 48px; background: #fff;
    padding: 0 15px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
  }
  .dp-quiz-nav-back-v3 { font-size: 18px; cursor: pointer; margin-right: 12px; color: #666; }
  .dp-quiz-nav-title-v3 { font-size: 15px; font-weight: 600; flex: 1; }
  .dp-quiz-nav-progress-v3 { font-size: 12px; color: #999; }
  .dp-quiz-body-v3 { flex: 1; overflow-y: auto; padding: 16px; }
  .dp-quiz-card-v3 {
    background: #fff; border-radius: 14px; padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 16px;
  }
  .dp-quiz-qnum-v3 { font-size: 12px; color: #999; margin-bottom: 12px; }
  .dp-quiz-question-v3 { font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 20px; }
  .dp-quiz-options-v3 { display: flex; flex-direction: column; gap: 10px; }
  .dp-quiz-option-v3 {
    display: flex; align-items: center; padding: 14px; border: 2px solid #f0f0f0;
    border-radius: 10px; cursor: pointer; transition: all 0.15s;
  }
  .dp-quiz-option-v3.selected { border-color: #7c3aed; background: rgba(124,58,237,0.06); }
  .dp-quiz-option-v3.correct { border-color: #22c55e; background: rgba(34,197,94,0.08); }
  .dp-quiz-option-v3.wrong { border-color: #ef4444; background: rgba(239,68,68,0.08); }
  .dp-quiz-opt-letter-v3 {
    width: 28px; height: 28px; border-radius: 50%; background: #f5f5f5;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #666; margin-right: 10px; flex-shrink: 0;
  }
  .dp-quiz-option-v3.selected .dp-quiz-opt-letter-v3 { background: #7c3aed; color: #fff; }
  .dp-quiz-option-v3.correct .dp-quiz-opt-letter-v3 { background: #22c55e; color: #fff; }
  .dp-quiz-option-v3.wrong .dp-quiz-opt-letter-v3 { background: #ef4444; color: #fff; }
  .dp-quiz-opt-text-v3 { flex: 1; font-size: 14px; color: #333; }
  .dp-quiz-analysis-v3 { background: #f8f9fa; padding: 14px; border-radius: 10px; margin-top: 16px; }
  .dp-quiz-analysis-title-v3 { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .dp-quiz-analysis-text-v3 { font-size: 13px; color: #666; line-height: 1.6; }
  .dp-quiz-btn-row-v3 { display: flex; gap: 10px; margin-top: 16px; }
  .dp-quiz-btn-v3 {
    flex: 1; padding: 14px; border-radius: 25px; font-size: 15px;
    font-weight: 500; text-align: center; cursor: pointer; border: none; transition: all 0.2s;
  }
  .dp-quiz-btn-v3.submit { background: #e5e5e5; color: #999; }
  .dp-quiz-btn-v3.submit.active { background: #7c3aed; color: #fff; }
  .dp-quiz-btn-v3.next { background: #22c55e; color: #fff; }

  /* 完成总结 */
  .dp-summary-overlay-v3 {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .dp-summary-content-v3 {
    background: #fff; border-radius: 20px; width: 100%; max-width: 380px;
    max-height: 85vh; overflow-y: auto; padding: 28px; text-align: center;
  }
  .dp-summary-icon-v3 { font-size: 64px; margin-bottom: 12px; }
  .dp-summary-title-v3 { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 6px; }
  .dp-summary-sub-v3 { font-size: 13px; color: #999; margin-bottom: 16px; }
  .dp-summary-layers-v3 { text-align: left; margin-bottom: 20px; }
  .dp-summary-layer-v3 {
    display: flex; align-items: center; gap: 8px; padding: 8px 0;
    border-bottom: 1px solid #f0f0f0; font-size: 12px;
  }
  .dp-summary-btn-v3 {
    width: 100%; padding: 14px; border-radius: 25px; font-size: 15px;
    cursor: pointer; margin-bottom: 10px; border: none;
  }
  .dp-summary-btn-v3.primary { background: #7c3aed; color: #fff; }
  .dp-summary-btn-v3.secondary { background: transparent; color: #7c3aed; border: 1px solid #7c3aed; }
`);

// ==================== BFS 4层追溯 Demo 数据 ====================
// 场景：学生在 Newton 迭代法上出错 → BFS 反向追溯前置知识链
const demoBfsLayers = [
  {
    layer: 1,
    depth: 4,
    knowledge_id: '函数求值',
    knowledge_name: '函数求值与多项式计算',
    relation: 'weak_prerequisite',
    current_mastery: 0.72,
    threshold: 0.75,
    status: 'moderate',
    status_label: '中等',
    status_color: '#f59e0b',
    reason: '学生在计算 f(x)=x²-2 在 x₀=1 处值时得到 0 而非 -1，存在符号处理偏差，导致 Newton 迭代初值代入不正确',
    exercises: [
      {
        id: 'e1_1', type: 'choice', difficulty: '基础',
        question: '用 Horner 算法计算 P(x)=2x³-3x²+4x-5 在 x=2 处的值时，第一步应计算什么？',
        options: [{ letter: 'A', text: '2×2-3' }, { letter: 'B', text: '2×2+4' }, { letter: 'C', text: '2×2³' }, { letter: 'D', text: '2×2' }],
        answer: 'A',
        analysis: 'Horner 算法从最高次系数开始：((2×2-3)×2+4)×2-5。第一步计算 2×2-3=1，即系数与 x 相乘后加下一系数。',
      },
      {
        id: 'e1_2', type: 'choice', difficulty: '基础',
        question: '计算 f(x)=x²-2 在 x=1 处的函数值，正确结果是？',
        options: [{ letter: 'A', text: '-1' }, { letter: 'B', text: '0' }, { letter: 'C', text: '1' }, { letter: 'D', text: '-2' }],
        answer: 'A',
        analysis: 'f(1) = 1² - 2 = 1 - 2 = -1。注意符号：平方结果为正，减去 2 后为负。这是 Newton 迭代公式中 f(xₙ) 的值。',
      },
      {
        id: 'e1_3', type: 'choice', difficulty: '进阶',
        question: '若 f(x)=x³-x-1，计算 f(1.5) 的值最接近？',
        options: [{ letter: 'A', text: '0.875' }, { letter: 'B', text: '1.375' }, { letter: 'C', text: '-0.125' }, { letter: 'D', text: '2.375' }],
        answer: 'A',
        analysis: 'f(1.5)=1.5³-1.5-1=3.375-2.5=0.875。多次代入计算是 Newton 迭代的基本功，需要确保每次代入都准确。',
      },
    ],
  },
  {
    layer: 2,
    depth: 3,
    knowledge_id: 'Taylor展开',
    knowledge_name: 'Taylor 展开与多项式逼近',
    relation: 'strong_prerequisite',
    current_mastery: 0.48,
    threshold: 0.70,
    status: 'critical',
    status_label: '严重不足',
    status_color: '#ef4444',
    reason: 'Newton 迭代公式 x_{n+1}=x_n-f(x_n)/f\'(x_n) 本质是 f 在 x_n 处的一阶 Taylor 展开截断，学生未掌握 Taylor 展开的截断思想，无法理解迭代公式的来源',
    exercises: [
      {
        id: 'e2_1', type: 'choice', difficulty: '基础',
        question: 'f(x) 在 x₀ 处的一阶 Taylor 展开为 f(x) ≈ f(x₀) + f\'(x₀)(x-x₀)。令其为零求解 x，得到的公式是？',
        options: [
          { letter: 'A', text: 'x = x₀ - f(x₀)/f\'(x₀)' },
          { letter: 'B', text: 'x = x₀ + f(x₀)·f\'(x₀)' },
          { letter: 'C', text: 'x = x₀ - f\'(x₀)/f(x₀)' },
          { letter: 'D', text: 'x = x₀ + f(x₀)/f\'(x₀)' },
        ],
        answer: 'A',
        analysis: '由 f(x₀)+f\'(x₀)(x-x₀)=0 ⇒ x-x₀=-f(x₀)/f\'(x₀) ⇒ x=x₀-f(x₀)/f\'(x₀)。这正是 Newton 迭代公式，说明 Newton 法 = 一阶 Taylor 展开求根。',
      },
      {
        id: 'e2_2', type: 'choice', difficulty: '进阶',
        question: 'f(x)=sin(x) 在 x=0 处的三阶 Taylor 展开式为？',
        options: [
          { letter: 'A', text: 'x - x³/6' },
          { letter: 'B', text: 'x + x³/6' },
          { letter: 'C', text: '1 - x²/2 + x⁴/24' },
          { letter: 'D', text: 'x + x²/2 + x³/3' },
        ],
        answer: 'A',
        analysis: 'sin(x) = x - x³/3! + x⁵/5! - ...。因为 sin 是奇函数，展开式只有奇次项，且符号交替。三阶展开为 x - x³/6。',
      },
    ],
  },
  {
    layer: 3,
    depth: 2,
    knowledge_id: '导数计算',
    knowledge_name: '导数与微分计算',
    relation: 'strong_prerequisite',
    current_mastery: 0.82,
    threshold: 0.70,
    status: 'solid',
    status_label: '已掌握',
    status_color: '#22c55e',
    reason: 'Newton 法需要计算 f\'(xₙ)，学生导数计算正确率 82%，基础尚可但需注意复合函数和分式函数的求导',
    exercises: [
      {
        id: 'e3_1', type: 'choice', difficulty: '基础',
        question: 'f(x)=x²-2 的导数 f\'(x) 为？',
        options: [{ letter: 'A', text: '2x' }, { letter: 'B', text: 'x' }, { letter: 'C', text: '2x-2' }, { letter: 'D', text: 'x²' }],
        answer: 'A',
        analysis: 'f\'(x)=2x，这是 Newton 迭代公式中分母的值。在 x₀=1 处 f\'(1)=2，代入 x₁=1-(-1)/2=1.5。',
      },
    ],
  },
  {
    layer: 4,
    depth: 1,
    knowledge_id: '迭代收敛',
    knowledge_name: '迭代法与收敛性分析',
    relation: 'strong_prerequisite',
    current_mastery: 0.58,
    threshold: 0.70,
    status: 'weak',
    status_label: '薄弱',
    status_color: '#f97316',
    reason: '学生理解迭代的基本思想，但对收敛阶和收敛条件的掌握不牢——选错 Newton 法收敛阶说明未理解二阶收敛的本质（g\'=0 于不动点处）',
    exercises: [
      {
        id: 'e4_1', type: 'choice', difficulty: '基础',
        question: '不动点迭代 x_{n+1}=g(x_n) 收敛的充分条件是？',
        options: [
          { letter: 'A', text: '|g\'(x*)| < 1 在不动点 x* 附近' },
          { letter: 'B', text: 'g(x) 连续可导' },
          { letter: 'C', text: '初始值足够接近' },
          { letter: 'D', text: '以上全部' },
        ],
        answer: 'A',
        analysis: '压缩映射原理：若 |g\'(x*)|<1，则存在邻域使迭代收敛。这是判定迭代收敛的核心条件，也是理解 Newton 法二阶收敛（g\'(x*)=0）的前提。',
      },
      {
        id: 'e4_2', type: 'choice', difficulty: '进阶',
        question: 'Newton 迭代法在单根处是几阶收敛的？为什么？',
        options: [
          { letter: 'A', text: '一阶收敛，因为是一次近似' },
          { letter: 'B', text: '二阶收敛，因为迭代函数 g(x)=x-f/f\' 满足 g\'(x*)=0' },
          { letter: 'C', text: '一阶收敛，与不动点迭代相同' },
          { letter: 'D', text: '超线性收敛但非二阶' },
        ],
        answer: 'B',
        analysis: '令 g(x)=x-f(x)/f\'(x)，求导得 g\'(x)=f(x)f\'\'(x)/[f\'(x)]²，在 f(x*)=0 处 g\'(x*)=0，因此至少二阶收敛。这是 Newton 法区别于一般不动点迭代的关键。',
      },
    ],
  },
];

function getStatusStyle(status) {
  const map = {
    solid: { bg: '#dcfce7', color: '#16a34a', label: '✅ 已掌握' },
    moderate: { bg: '#fef3c7', color: '#d97706', label: '⚠ 中等' },
    weak: { bg: '#fff7ed', color: '#ea580c', label: '⚠ 薄弱' },
    critical: { bg: '#fee2e2', color: '#dc2626', label: '🔴 严重不足' },
  };
  return map[status] || map.moderate;
}

export default function StudentDeepPractice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState([]);
  const [expandedLayer, setExpandedLayer] = useState(null);

  // 练习模式
  const [quizMode, setQuizMode] = useState(false);
  const [quizLayer, setQuizLayer] = useState(null);
  const [quizQIdx, setQuizQIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // { layerId: { qId: true/false } }

  // 完成总结
  const [showSummary, setShowSummary] = useState(false);

  const videoId = searchParams.get('videoId');
  const classId = searchParams.get('classId');
  const pageTitle = searchParams.get('title') || '深度练习';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request.post('/agent/quiz', {
        video_id: String(videoId),
        class_id: classId,
        num_questions: 10,
      });
      if ((res.code === 0 || res.code === 200) && res.data?.quizzes?.length > 0) {
        // 按 knowledge_id 分组，每组作为一个 BFS 层级
        const groupMap = {};
        res.data.quizzes.forEach(q => {
          const kid = q.knowledge_id || '综合练习';
          if (!groupMap[kid]) groupMap[kid] = [];
          groupMap[kid].push(q);
        });

        const kidEntries = Object.entries(groupMap);
        const layers = kidEntries.map(([kid, quizzes], idx) => ({
          layer: idx + 1,
          depth: kidEntries.length - idx,
          knowledge_id: kid,
          knowledge_name: kid,
          relation: 'direct',
          current_mastery: 0.5,
          threshold: 0.7,
          status: 'moderate',
          status_label: '待练习',
          status_color: '#f59e0b',
          reason: `知识点「${kid}」的相关练习（共 ${quizzes.length} 题）`,
          exercises: quizzes.map(q => ({
            id: q.id || (kid + '_' + idx),
            type: q.type || 'choice',
            difficulty: '基础',
            question: q.question,
            // 兼容 options 两种格式：[{letter, text}] 或 ["A. text"]
            options: (q.options || []).map((opt, j) =>
              typeof opt === 'string'
                ? { letter: String.fromCharCode(65 + j), text: opt }
                : { letter: opt.letter || String.fromCharCode(65 + j), text: opt.text || opt }
            ),
            answer: q.answer,
            analysis: q.analysis || '',
          })),
        }));
        setLayers(layers);
        setLoading(false);
        return;
      }
    } catch (e) { /* fallback to demo */ }
    setLayers(demoBfsLayers);
    setLoading(false);
  };

  // ==================== 练习模式逻辑 ====================

  const currentQuizLayerData = quizLayer ? layers.find(l => l.layer === quizLayer) : null;
  const currentExercise = currentQuizLayerData?.exercises?.[quizQIdx];
  const totalLayerExercises = currentQuizLayerData?.exercises?.length || 0;
  const layerDoneCount = quizAnswers[quizLayer] ? Object.values(quizAnswers[quizLayer]).filter(Boolean).length : 0;

  const handleSelectOption = (idx) => {
    if (hasSubmitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedIdx === -1) { message.info('请先选择答案'); return; }
    const correctLetter = currentExercise.options[selectedIdx]?.letter;
    const isCorrect = correctLetter === currentExercise.answer;
    setHasSubmitted(true);
    setQuizAnswers(prev => ({
      ...prev,
      [quizLayer]: { ...(prev[quizLayer] || {}), [currentExercise.id]: isCorrect },
    }));
  };

  const handleNextOrFinish = () => {
    if (quizQIdx < totalLayerExercises - 1) {
      setQuizQIdx(q => q + 1);
      setSelectedIdx(-1);
      setHasSubmitted(false);
    } else {
      // 当前层完成，退出练习模式
      setQuizMode(false);
      setQuizLayer(null);
      setQuizQIdx(0);
      setSelectedIdx(-1);
      setHasSubmitted(false);
    }
  };

  const startLayerQuiz = (layerNum) => {
    setQuizLayer(layerNum);
    setQuizQIdx(0);
    setSelectedIdx(-1);
    setHasSubmitted(false);
    setQuizMode(true);
  };

  // 检查某层所有练习是否已完成
  const isLayerAllDone = (layerNum) => {
    const layer = layers.find(l => l.layer === layerNum);
    if (!layer) return false;
    const answers = quizAnswers[layerNum] || {};
    return layer.exercises.every(ex => answers[ex.id] === true);
  };

  const isLayerAnyDone = (layerNum) => {
    const layer = layers.find(l => l.layer === layerNum);
    if (!layer) return false;
    const answers = quizAnswers[layerNum] || {};
    return layer.exercises.some(ex => answers[ex.id] === true);
  };

  // 所有层是否全部完成
  const allLayersDone = layers.every(l => isLayerAllDone(l.layer));
  const totalDone = layers.reduce((sum, l) => {
    const a = quizAnswers[l.layer] || {};
    return sum + Object.values(a).filter(Boolean).length;
  }, 0);
  const totalAll = layers.reduce((sum, l) => sum + l.exercises.length, 0);

  // ==================== 练习模式界面 ====================
  if (quizMode && currentQuizLayerData && currentExercise) {
    return (
      <div className="dp-quiz-overlay-v3">
        <div className="dp-quiz-nav-v3">
          <span className="dp-quiz-nav-back-v3" onClick={() => { setQuizMode(false); setQuizLayer(null); }}>←</span>
          <span className="dp-quiz-nav-title-v3">{currentQuizLayerData.knowledge_name}</span>
          <span className="dp-quiz-nav-progress-v3">{quizQIdx + 1}/{totalLayerExercises}</span>
        </div>
        <div className="dp-quiz-body-v3">
          <div className="dp-quiz-card-v3">
            <div className="dp-quiz-qnum-v3">
              第 {quizQIdx + 1} 题 · {currentExercise.difficulty}
            </div>
            <div className="dp-quiz-question-v3">{currentExercise.question}</div>
            <div className="dp-quiz-options-v3">
              {currentExercise.options.map((opt, idx) => {
                const correctLetter = currentExercise.options.find(o => o.letter === currentExercise.answer)?.letter;
                let cls = 'dp-quiz-option-v3';
                if (selectedIdx === idx) cls += ' selected';
                if (hasSubmitted && opt.letter === correctLetter) cls += ' correct';
                if (hasSubmitted && selectedIdx === idx && opt.letter !== currentExercise.answer) cls += ' wrong';
                return (
                  <div key={idx} className={cls} onClick={() => handleSelectOption(idx)}>
                    <div className="dp-quiz-opt-letter-v3">{opt.letter}</div>
                    <span className="dp-quiz-opt-text-v3">{opt.text}</span>
                  </div>
                );
              })}
            </div>
            {hasSubmitted && currentExercise.analysis && (
              <div className="dp-quiz-analysis-v3">
                <div className="dp-quiz-analysis-title-v3">📝 解析</div>
                <div className="dp-quiz-analysis-text-v3">{currentExercise.analysis}</div>
              </div>
            )}
            <div className="dp-quiz-btn-row-v3">
              {!hasSubmitted ? (
                <button className={`dp-quiz-btn-v3 submit ${selectedIdx >= 0 ? 'active' : ''}`} onClick={handleSubmitAnswer}>
                  提交答案
                </button>
              ) : (
                <button className="dp-quiz-btn-v3 next" onClick={handleNextOrFinish}>
                  {quizQIdx < totalLayerExercises - 1 ? '下一题 →' : '✓ 完成本层练习'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 主界面：BFS 追溯总览 ====================
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#f5f7fa', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 按 depth 降序排列（最底层在前）
  const sortedLayers = [...layers].sort((a, b) => b.depth - a.depth);

  return (
    <div className="dp-page-v3">
      <div className="dp-header-v3">
        <div className="dp-header-row-v3">
          <BackArrow onClick={() => navigate(-1)} />
          <div>
            <div className="dp-header-title-v3">{decodeURIComponent(pageTitle)}</div>
            <div className="dp-header-sub-v3">BFS 前置知识追溯 · {sortedLayers.length} 层深度</div>
          </div>
        </div>
      </div>

      <div className="dp-content-v3">
        {/* BFS 追溯说明横幅 */}
        <div className="dp-bfs-banner-v3">
          <div className="dp-bfs-target-v3">
            <div className="dp-bfs-target-icon-v3">🎯</div>
            <div>
              <div className="dp-bfs-target-name-v3">Newton 迭代法</div>
              <div style={{ fontSize: 11, color: '#999' }}>当前学习目标知识点</div>
            </div>
            <span className="dp-bfs-target-tag-v3">❌ 未掌握</span>
          </div>
          <div className="dp-bfs-desc-v3">
            💡 BFS 反向追溯发现 <b>{sortedLayers.filter(l => l.status === 'critical' || l.status === 'weak').length} 个薄弱前置知识</b>，
            按「从底层基础→上层应用」顺序逐层巩固。建议先完成 🔴 标注层，再逐步上溯。
          </div>
          {totalDone > 0 && (
            <div style={{ marginTop: 10 }}>
              <Progress percent={Math.round((totalDone / totalAll) * 100)} size="small" strokeColor="#7c3aed" />
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>整体进度 {totalDone}/{totalAll} 题已完成</div>
            </div>
          )}
        </div>

        {/* BFS 层叠卡片（从最深→最浅，即基础→应用） */}
        {sortedLayers.map((layer, idx) => {
          const isExpanded = expandedLayer === layer.layer;
          const allDone = isLayerAllDone(layer.layer);
          const anyDone = isLayerAnyDone(layer.layer);
          const statusStyle = getStatusStyle(layer.status);
          const depthColors = ['#ef4444', '#f97316', '#f59e0b', '#7c3aed'];
          const depthColor = depthColors[(layer.depth - 1) % depthColors.length];

          return (
            <div key={layer.layer} className="dp-layer-stack-v3">
              {/* 层级连线 */}
              {idx > 0 && (
                <div className="dp-layer-connector-v3">
                  <span style={{ fontSize: 20, lineHeight: 1 }}>⬆</span>
                  <span style={{ fontSize: 10, color: '#c4b5fd', marginLeft: 4 }}>前置依赖</span>
                </div>
              )}

              <div className={`dp-layer-card-v3 ${isExpanded ? 'expanded' : ''}`}>
                {/* 卡片头部（可点击展开） */}
                <div className="dp-layer-header-v3" onClick={() => setExpandedLayer(isExpanded ? null : layer.layer)}>
                  <div className="dp-layer-depth-v3" style={{ background: depthColor }}>
                    L{layer.depth}
                  </div>
                  <div className="dp-layer-info-v3">
                    <div className="dp-layer-name-v3">{layer.knowledge_name}</div>
                    <div className="dp-layer-reason-v3">{layer.reason}</div>
                  </div>
                  <span className="dp-layer-status-v3" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                    {allDone ? '✅ 已完成' : statusStyle.label}
                  </span>
                  <span className={`dp-layer-arrow-v3 ${isExpanded ? 'open' : ''}`}>▼</span>
                </div>

                {/* 展开内容 */}
                {isExpanded && (
                  <div className="dp-layer-body-v3">
                    {/* 掌握度 */}
                    <div className="dp-layer-mastery-v3">
                      <div className="dp-layer-mastery-row-v3">
                        <span className="dp-layer-mastery-label-v3">当前估算掌握度</span>
                        <span className="dp-layer-mastery-val-v3" style={{ color: statusStyle.color }}>
                          {Math.round(layer.current_mastery * 100)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.round(layer.current_mastery * 100)}
                        strokeColor={layer.current_mastery >= layer.threshold ? '#22c55e' : layer.current_mastery >= 0.6 ? '#f59e0b' : '#ef4444'}
                        trailColor="#f0f0f0"
                        size="small"
                        format={() => ''}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginTop: 2 }}>
                        <span>0%</span>
                        <span style={{ color: '#ef4444', fontWeight: 500 }}>达标阈值 {Math.round(layer.threshold * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 前置关系说明 */}
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6 }}>
                      📍 <b>追溯依据：</b>{layer.reason}
                    </div>

                    {/* 补救练习题列表 */}
                    <div className="dp-layer-exercise-list-v3">
                      <div className="dp-layer-exercise-title-v3">
                        📝 关联补救练习（{layer.exercises.length} 题）
                        <span style={{ fontSize: 10, color: '#999', fontWeight: 400 }}>
                          — 从题库中根据 tested_by 关系自动检索
                        </span>
                      </div>
                      {layer.exercises.map((ex, ei) => {
                        const isDone = quizAnswers[layer.layer]?.[ex.id] === true;
                        return (
                          <div key={ex.id} className={`dp-exercise-item-v3 ${isDone ? 'done' : ''}`}>
                            <div className="dp-exercise-num-v3">{isDone ? '✓' : ei + 1}</div>
                            <div className="dp-exercise-text-v3">{ex.question}</div>
                            <span className="dp-exercise-diff-v3" style={{
                              background: ex.difficulty === '基础' ? '#dcfce7' : ex.difficulty === '进阶' ? '#fef3c7' : '#fee2e2',
                              color: ex.difficulty === '基础' ? '#16a34a' : ex.difficulty === '进阶' ? '#d97706' : '#dc2626',
                            }}>
                              {ex.difficulty}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 开始练习按钮 */}
                    <button
                      className={`dp-layer-start-btn-v3 ${allDone ? 'done' : 'primary'}`}
                      onClick={() => startLayerQuiz(layer.layer)}
                    >
                      {allDone ? '✅ 本层已完成 — 点击重练' : anyDone ? `继续练习 (${layerDoneCount}/${totalLayerExercises} 已完成)` : '开始本层练习 →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 底层连线到目标 */}
        {sortedLayers.length > 0 && (
          <div style={{ textAlign: 'center', padding: '6px 0 12px', color: '#c4b5fd', fontSize: 18 }}>
            ⬇
          </div>
        )}
        <div style={{
          textAlign: 'center', padding: '12px 16px', background: '#fff',
          borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '2px dashed #fecaca',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>🎯 Newton 迭代法</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>当前目标知识点 — 完成上方所有前置层后回到此知识点</div>
        </div>

        {/* 全层完成后展示总结按钮 */}
        {allLayersDone && totalAll > 0 && (
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button
              className="dp-summary-btn-v3 primary"
              style={{ flex: 1, display: 'block' }}
              onClick={() => setShowSummary(true)}
            >
              🎉 全部完成 — 查看总结
            </button>
          </div>
        )}

        {/* 底部辅助按钮 */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            className="dp-summary-btn-v3 secondary"
            style={{ flex: 1, display: 'block' }}
            onClick={() => navigate(`/student/learning-analysis?videoId=${videoId || ''}&classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}
          >
            查看学情分析
          </button>
          <button
            className="dp-summary-btn-v3 secondary"
            style={{ flex: 1, display: 'block' }}
            onClick={() => navigate(`/student/big-kg?classId=${classId || ''}&title=${encodeURIComponent('课程知识图谱')}`)}
          >
            查看大图谱
          </button>
        </div>
      </div>

      {/* 完成总结弹窗 */}
      {showSummary && (
        <div className="dp-summary-overlay-v3" onClick={() => setShowSummary(false)}>
          <div className="dp-summary-content-v3" onClick={e => e.stopPropagation()}>
            <div className="dp-summary-icon-v3">{totalDone / totalAll >= 0.8 ? '🎉' : '👍'}</div>
            <div className="dp-summary-title-v3">BFS 追溯练习完成</div>
            <div className="dp-summary-sub-v3">
              {totalDone}/{totalAll} 题正确 · {sortedLayers.filter(l => isLayerAllDone(l.layer)).length}/{sortedLayers.length} 层达标
            </div>

            <div className="dp-summary-layers-v3">
              {sortedLayers.map(l => {
                const allDone = isLayerAllDone(l.layer);
                const st = getStatusStyle(l.status);
                return (
                  <div key={l.layer} className="dp-summary-layer-v3">
                    <span>{allDone ? '✅' : '⬜'}</span>
                    <span style={{ flex: 1 }}>L{l.depth} {l.knowledge_name}</span>
                    <span style={{ color: st.color, fontSize: 11 }}>
                      {allDone ? '已巩固' : st.label} → {Math.round(l.current_mastery * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <button className="dp-summary-btn-v3 primary" onClick={() => setShowSummary(false)}>
              返回追溯总览
            </button>
            <button
              className="dp-summary-btn-v3 secondary"
              onClick={() => navigate(`/student/learning-analysis?videoId=${videoId || ''}&classId=${classId || ''}&title=${encodeURIComponent(pageTitle)}`)}
            >
              查看学情分析
            </button>
            <button className="dp-summary-btn-v3 secondary" onClick={() => navigate(-1)}>返回</button>
          </div>
        </div>
      )}

      <AIFloatButton />
    </div>
  );
}
