import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import ReactECharts from 'echarts-for-react';
import MasteryBar from '../../components/MasteryBar';
import BackArrow from '../../components/BackArrow';
import AIFloatButton from '../../components/AIFloatButton';
import request from '../../utils/request';
import { injectStyles } from '../../utils/injectStyles';
import { QUESTION_TYPE, normalizeQuestionType, QUESTION_TYPE_META } from '../../constants/questionTypes';
import '../../utils/sharedPageStyles';

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

  /* ===== V4 六维可视化 ===== */
  .la-viz-grid-v4 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-bottom: 12px;
  }
  @media (max-width: 640px) { .la-viz-grid-v4 { grid-template-columns: 1fr; } }
  .la-viz-card-v4 {
    background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
    padding: 10px; overflow: hidden;
  }
  .la-viz-card-v4.full { grid-column: 1 / -1; }
  .la-viz-card-title-v4 {
    font-size: 11px; font-weight: 600; color: #555; margin-bottom: 8px;
    display: flex; align-items: center; gap: 4px;
  }
  .la-viz-card-title-v4 .la-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .la-time-compare-v4 { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
  .la-time-bar-wrap-v4 { flex: 1; position: relative; height: 28px; background: #f5f5f5; border-radius: 4px; }
  .la-time-class-range-v4 {
    position: absolute; top: 3px; bottom: 3px; background: #e0e7ff; border-radius: 3px;
    border-left: 1px dashed #818cf8; border-right: 1px dashed #818cf8;
    display: flex; align-items: center; justify-content: center; font-size: 9px; color: #6366f1;
  }
  .la-time-student-marker-v4 {
    position: absolute; top: -2px; bottom: -2px; width: 3px;
    background: #ef4444; border-radius: 2px; z-index: 2;
  }
  .la-time-student-marker-v4::after {
    content: ''; position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent;
    border-bottom: 6px solid #ef4444;
  }
  .la-time-legend-v4 { display: flex; gap: 12px; font-size: 10px; color: #888; margin-top: 4px; }
  .la-error-tag-v4 {
    display: inline-block; padding: 3px 8px; margin: 2px 4px 2px 0;
    border-radius: 10px; font-size: 10px; font-weight: 500;
  }
  .la-step-row-v4 {
    display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5;
    font-size: 11px; align-items: flex-start;
  }
  .la-step-num-v4 {
    width: 22px; height: 22px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 10px; font-weight: 700;
    flex-shrink: 0; color: #fff;
  }
  .la-step-num-v4.ok { background: #10b981; }
  .la-step-num-v4.err { background: #ef4444; }
  .la-step-num-v4.skp { background: #d1d5db; }
  .la-step-compare-v4 { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .la-step-std-v4 { color: #10b981; font-size: 10px; }
  .la-step-stu-v4 { color: #ef4444; font-size: 10px; }

  /* ===== 综合结论面板 ===== */
  .la-conclusion-v4 {
    background: linear-gradient(135deg, #fef2f2, #fff7ed, #fefce8);
    border: 1px solid #fecaca; border-radius: 10px; padding: 14px;
  }
  .la-conclusion-header-v4 {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .la-conclusion-tag-v4 {
    padding: 4px 14px; border-radius: 16px; font-size: 13px; font-weight: 700; color: #fff;
  }
  .la-conclusion-confidence-v4 { font-size: 12px; color: #6b7280; }
  .la-conclusion-bar-v4 {
    width: 100%; height: 6px; background: #e5e5e5; border-radius: 3px;
    margin: 6px 0 10px; overflow: hidden;
  }
  .la-conclusion-bar-fill-v4 { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .la-conclusion-summary-v4 { font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 8px; }
  .la-conclusion-advice-v4 {
    font-size: 12px; color: #7c3aed; line-height: 1.5;
    padding: 8px 10px; background: #f0f4ff; border-radius: 6px;
    border-left: 3px solid #7c3aed;
  }
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
      type: QUESTION_TYPE.SINGLE_CHOICE,
      title: '下列哪个是 Newton 迭代法的收敛阶？',
      difficulty: 0.5,
      options: [
        { letter: 'A', text: '线性收敛' },
        { letter: 'B', text: '平方收敛' },
        { letter: 'C', text: '三次收敛' },
        { letter: 'D', text: '超线性收敛' },
      ],
      correctAnswer: 'B',
      studentAnswer: 'A',
      primaryError: '概念混淆',
      primaryLevel: '基础薄弱',
      confidence: 0.45,
      evidence: [
        { name: '难度梯度', score: 0.70, desc: '难度 0.5，正常应答对，存在知识盲区' },
        { name: '答题时间', score: 0.35, desc: '用时 45s，中位 50s，时间正常' },
        { name: '错误选项', score: 0.80, desc: '选"线性收敛"，混淆了不动点迭代和 Newton 法的收敛阶' },
        { name: '解题步骤', score: 0.55, desc: '未使用 Taylor 展开分析收敛阶' },
        { name: '历史表现', score: 0.50, desc: '迭代法相关题正确率 55%' },
        { name: '知识图谱', score: 0.40, desc: '前置"Taylor公式"掌握度一般' },
      ],
      // V4 六维可视化详细数据
      viz: {
        difficulty_gradient: {
          categories: ['基础', '进阶', '综合'],
          student_rates: [0.85, 0.62, 0.40],
          class_avg_rates: [0.82, 0.71, 0.58],
          cliff_at: 1,
        },
        time_comparison: {
          student_time: 45,
          class_median: 50,
          class_p25: 32,
          class_p75: 72,
          deviation: 'normal',
          deviation_label: '正常',
        },
        error_option_analysis: {
          selected_option: 'A',
          error_tags: [
            { tag: '概念混淆：线性收敛 vs 平方收敛', freq: 0.35 },
            { tag: '未区分不动点迭代与 Newton 法', freq: 0.22 },
            { tag: '收敛阶判定方法缺失', freq: 0.18 },
          ],
          student_label: '选择了"线性收敛"——属于不动点迭代的一阶收敛，混淆了两种方法的本质区别',
        },
        solution_steps: [
          { step: 1, desc: '回忆 Newton 法收敛阶定理', standard: 'Newton 法在单根处为二阶收敛（平方收敛）', student: '认为 Newton 法是不动点迭代的特例', ok: false },
          { step: 2, desc: '区分不动点迭代与 Newton 法', standard: '不动点 x=g(x) 线性收敛 ⇔ g\'≠0；Newton 法 g\'=0 故平方收敛', student: '未做区分，直接套用不动点迭代结论', ok: false },
          { step: 3, desc: '确认答案', standard: '选择 B：平方收敛', student: '选择了 A：线性收敛', ok: false },
        ],
        history_trend: {
          dates: ['5/20', '5/22', '5/25', '5/28', '5/30', '6/1', '6/3', '6/5'],
          rates: [60, 55, 70, 65, 80, 60, 55, 50],
          knowledge_point: 'Newton 迭代收敛阶',
        },
        prerequisite_gap: {
          dimensions: [
            { name: 'Taylor公式', mastery: 0.55, threshold: 0.70 },
            { name: '导数计算', mastery: 0.85, threshold: 0.70 },
            { name: '迭代思想', mastery: 0.60, threshold: 0.70 },
            { name: '收敛概念', mastery: 0.48, threshold: 0.70 },
            { name: '误差分析', mastery: 0.52, threshold: 0.70 },
          ],
        },
        conclusion: {
          primary_category: '基础薄弱',
          confidence: 0.72,
          evidence_summary: '错误选项指向"概念混淆"，选择了不动点迭代的一阶收敛特征而非 Newton 法的二阶收敛；解题步骤分析显示学生在第一步就未回忆出正确的收敛阶定理；历史数据显示该知识点正确率呈下降趋势(80%→50%)；前置知识 Taylor 公式掌握度仅 0.55（阈值 0.70），是导致无法区分两种迭代方法收敛阶的根本原因。',
          learning_advice: '建议回溯第三章第二节 Taylor 展开与收敛阶理论，完成以下动作：① 推导 Newton 法的二阶收敛证明（理解为何 g\'=0）；② 对比不动点迭代与 Newton 法的收敛阶差异；③ 完成 3 道收敛阶判定练习后再重新尝试迭代法相关题目。',
        },
      },
    },
    {
      id: 'Q2',
      type: QUESTION_TYPE.MULTIPLE_CHOICE,
      title: '以下哪些条件可以保证 Gauss-Seidel 迭代法收敛？（多选）',
      difficulty: 0.7,
      options: [
        { letter: 'A', text: '系数矩阵严格对角占优' },
        { letter: 'B', text: '系数矩阵对称正定' },
        { letter: 'C', text: '系数矩阵可逆' },
        { letter: 'D', text: '迭代矩阵谱半径小于 1' },
      ],
      correctAnswer: ['A', 'B', 'D'],
      studentAnswer: ['A', 'D'],
      primaryError: '漏选关键条件',
      primaryLevel: '能力天花板',
      confidence: 0.38,
      evidence: [
        { name: '难度梯度', score: 0.82, desc: '难度 0.7，综合性强，需同时掌握多个收敛条件' },
        { name: '答题时间', score: 0.45, desc: '用时 165s，中位 90s，明显纠结' },
        { name: '错误选项', score: 0.75, desc: '漏选 B（对称正定），说明对此条件的充分性不熟悉' },
        { name: '解题步骤', score: 0.60, desc: '未系统回顾所有收敛充分条件' },
        { name: '历史表现', score: 0.52, desc: '矩阵分析相关题正确率 50%' },
        { name: '知识图谱', score: 0.45, desc: '前置"正定矩阵"概念掌握度 0.55' },
      ],
      viz: {
        difficulty_gradient: {
          categories: ['基础', '进阶', '综合'],
          student_rates: [0.78, 0.55, 0.32],
          class_avg_rates: [0.80, 0.68, 0.50],
          cliff_at: 1,
        },
        time_comparison: {
          student_time: 165,
          class_median: 90,
          class_p25: 60,
          class_p75: 130,
          deviation: 'slow',
          deviation_label: '纠结',
        },
        error_option_analysis: {
          selected_option: '漏选B',
          error_tags: [
            { tag: '对称正定条件遗漏', freq: 0.42 },
            { tag: '收敛充分条件不完整', freq: 0.30 },
            { tag: '未区分充要/充分条件', freq: 0.20 },
          ],
          student_label: '漏选了 B（对称正定）——该条件在教材 §4.2.3 明确列出，属于高频考点',
        },
        solution_steps: [
          { step: 1, desc: '列举 GS 法所有收敛充分条件', standard: '① 严格对角占优 ② 对称正定 ③ ρ(G)<1', student: '只列出 ① 和 ③', ok: false },
          { step: 2, desc: '检查每个条件的充分性', standard: 'A✓ B✓ C✗(可逆不保证收敛) D✓(充要)', student: 'A✓ B? C✗ D✓（不确定B）', ok: false },
          { step: 3, desc: '选择所有正确项', standard: '选择 A, B, D', student: '选择 A, D（漏 B）', ok: false },
        ],
        history_trend: {
          dates: ['5/20', '5/22', '5/25', '5/28', '5/30', '6/1', '6/3', '6/5'],
          rates: [50, 60, 45, 55, 40, 50, 45, 50],
          knowledge_point: 'Gauss-Seidel 收敛性判定',
        },
        prerequisite_gap: {
          dimensions: [
            { name: '正定矩阵', mastery: 0.42, threshold: 0.70 },
            { name: '对角占优', mastery: 0.75, threshold: 0.70 },
            { name: '谱半径', mastery: 0.68, threshold: 0.70 },
            { name: '矩阵范数', mastery: 0.55, threshold: 0.70 },
            { name: '迭代矩阵构造', mastery: 0.60, threshold: 0.70 },
          ],
        },
        conclusion: {
          primary_category: '能力天花板',
          confidence: 0.65,
          evidence_summary: '本题难度 0.7 属综合档，学生正确率从基础的 78% 断崖降至 32%（降幅 46pp）；答题用时 165s 远超班级中位 90s（↑83%），表现为"纠结"状态；漏选对称正定条件，该错因标签在学生历史中出现频率高达 42%；前置知识"正定矩阵"掌握度仅 0.42（阈值 0.70），是最关键的缺口。',
          learning_advice: '建议降维训练：① 先从"对角占优⇒收敛"的单一条件判断题入手；② 系统整理 GS/Jacobi 收敛条件的 Venn 图（充要条件 ∩ 充分条件）；③ 重点复习正定矩阵的定义与判定方法（§3.5）；④ 完成 5 道多选题（含全部收敛条件组合）后再挑战综合难度题目。',
        },
      },
    },
    {
      id: 'Q3',
      type: QUESTION_TYPE.TRUE_FALSE,
      title: 'Jacobi 迭代法的收敛性与 Gauss-Seidel 迭代法的收敛性总是相同的。',
      difficulty: 0.55,
      correctAnswer: '错',
      studentAnswer: '对',
      primaryError: '概念混淆',
      primaryLevel: '粗心失误',
      confidence: 0.28,
      evidence: [
        { name: '难度梯度', score: 0.30, desc: '难度 0.55，基础概念题，不应出错' },
        { name: '答题时间', score: 0.80, desc: '用时 18s，中位 35s，过快，疑似未仔细思考' },
        { name: '错误选项', score: 0.50, desc: '忽略了两种方法收敛域不同的反例' },
        { name: '解题步骤', score: 0.35, desc: '直接判断，未构造反例' },
        { name: '历史表现', score: 0.65, desc: '判断题历史正确率 85%，本题异常' },
        { name: '知识图谱', score: 0.20, desc: '"Jacobi vs GS 收敛域"掌握度 0.78' },
      ],
      viz: {
        difficulty_gradient: {
          categories: ['基础', '进阶', '综合'],
          student_rates: [0.88, 0.72, 0.55],
          class_avg_rates: [0.85, 0.70, 0.52],
          cliff_at: -1,
        },
        time_comparison: {
          student_time: 18,
          class_median: 35,
          class_p25: 22,
          class_p75: 55,
          deviation: 'fast',
          deviation_label: '仓促',
        },
        error_option_analysis: {
          selected_option: '对',
          error_tags: [
            { tag: 'Jacobi/GS 收敛域混同', freq: 0.25 },
            { tag: '判断题审题过快', freq: 0.30 },
          ],
          student_label: '回答"对"——忽略了存在反例：某些矩阵 Jacobi 收敛而 GS 不收敛，反之亦然',
        },
        solution_steps: [
          { step: 1, desc: '理解命题范围"总是"', standard: '"总是"意味着对所有矩阵成立，只要存在一个反例即为假', student: '未注意"总是"这一全称量词', ok: false },
          { step: 2, desc: '搜索反例', standard: '教材 §4.3 有反例：A=[1 2; -1 4] Jacobi 收敛，GS 不收敛', student: '没有主动搜索反例', ok: false },
          { step: 3, desc: '给出判定', standard: '命题为假（×），因为存在反例', student: '直接判为真（√）', ok: false },
        ],
        history_trend: {
          dates: ['5/20', '5/22', '5/25', '5/28', '5/30', '6/1', '6/3', '6/5'],
          rates: [85, 80, 90, 85, 95, 80, 90, 85],
          knowledge_point: 'Jacobi/GS 收敛域对比',
        },
        prerequisite_gap: {
          dimensions: [
            { name: 'Jacobi迭代', mastery: 0.82, threshold: 0.70 },
            { name: 'GS迭代', mastery: 0.78, threshold: 0.70 },
            { name: '收敛域概念', mastery: 0.65, threshold: 0.70 },
            { name: '反例构造', mastery: 0.48, threshold: 0.70 },
            { name: '矩阵分析', mastery: 0.70, threshold: 0.70 },
          ],
        },
        conclusion: {
          primary_category: '粗心失误',
          confidence: 0.55,
          evidence_summary: '答题仅用 18s，远快于班级中位 35s（↓49%），表现为"仓促"；学生在该知识点历史正确率高达 85%，本题异常偏低；解题步骤显示学生未注意"总是"全称量词且未搜索反例；前置知识整体良好（4/5 项达标），但"反例构造"能力仅 0.48 是薄弱环节。',
          learning_advice: '判定为粗心失误而非知识缺陷。建议：① 做题时养成"遇到全称量词→主动搜索反例"的思维习惯；② 回顾教材 §4.3 中 J/GS 收敛域的经典反例，理解两种方法收敛域不相互包含的原因；③ 做 3 道带"总是/一定/必然"关键词的判断题练习审题。',
        },
      },
    },
  ],
  suggestion: '建议重点复习数值积分中的 Gauss 型求积公式，以及线性方程组迭代法的收敛性分析。可以从 Lagrange 插值出发，理解插值型积分公式的构造思想，再过渡到 Gauss 积分的高精度特性。',
  // V3 四类错因占比（从错题中聚合统计）
  error_category_distribution: [
    { category: '基础薄弱', pct: 33, color: '#ef4444', count: 1, desc: '前置知识掌握不足，需回溯前置知识链' },
    { category: '能力天花板', pct: 33, color: '#f97316', count: 1, desc: '当前难度超出能力范围，需降维练习' },
    { category: '粗心失误', pct: 33, color: '#f59e0b', count: 1, desc: '答题过快或注意力分散，非知识性错误' },
    { category: '正常过渡', pct: 0, color: '#6b7280', count: 0, desc: '正常学习过程中的过渡性错误' },
  ],
  // V3 结构化分层补救路径
  remediation_path: [
    {
      level: 1,
      title: 'L1 基础回补',
      icon: '🔧',
      chapter: '第三章 第二节',
      topic: 'Taylor 展开与多项式逼近',
      reason: 'Newton 迭代公式的推导依赖于 Taylor 展开截断，前置知识薄弱导致迭代结果计算偏差',
      exercises: [
        { title: '用 Taylor 公式展开 f(x)=sin(x) 在 x=0 处至三阶余项', difficulty: '基础' },
        { title: '推导 Newton 迭代公式 x_{n+1}=x_n - f(x_n)/f\'(x_n) 的 Taylor 展开证明', difficulty: '进阶' },
        { title: '分析初始值 x₀ 选取对 Newton 法收敛速度的影响', difficulty: '综合' },
      ],
      video: { title: 'Taylor 展开与数值微分', duration: '5分钟', segment: '第2段 12:30～17:45', url: '' },
    },
    {
      level: 2,
      title: 'L2 核心强化',
      icon: '🎯',
      chapter: '第四章 第一节',
      topic: '不动点迭代收敛性判定',
      reason: '压缩映射原理是判断迭代收敛的核心工具，需要使用导数绝对值 < 1 来判定',
      exercises: [
        { title: '判断 x=(x+2/x)/2 在区间 [1,2] 上是否满足压缩映射条件', difficulty: '基础' },
        { title: '证明 x=cos(x) 在 [0,π/2] 上存在唯一不动点并分析收敛阶', difficulty: '进阶' },
        { title: '比较 Jacobi 与 Gauss-Seidel 迭代法在不同谱半径下的收敛速度', difficulty: '综合' },
      ],
      video: { title: '不动点迭代与压缩映射原理', duration: '8分钟', segment: '第1段 03:20～11:45', url: '' },
    },
    {
      level: 3,
      title: 'L3 拓展提升',
      icon: '🚀',
      chapter: '第五章 第三节',
      topic: 'Gauss 型求积公式',
      reason: 'Gauss 积分是插值型积分的升级版，需在掌握 Lagrange 插值基础上引入正交多项式',
      exercises: [
        { title: '用两点 Gauss-Legendre 公式计算 ∫_{-1}^{1} x²e^x dx', difficulty: '基础' },
        { title: '推导 Gauss 型求积公式的代数精度上限（2n+1 阶）', difficulty: '进阶' },
        { title: '对比 Newton-Cotes 与 Gauss 求积在相同节点数下的精度差异', difficulty: '综合' },
      ],
      video: { title: 'Gauss 求积与正交多项式', duration: '6分钟', segment: '第3段 18:00～24:30', url: '' },
    },
  ],
};

function getGradeClass(grade) {
  const map = { S: 'grade-s', A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d' };
  return map[grade] || 'grade-b';
}

import WrongQuestionItem from '../../components/WrongQuestionItem';

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
      // 并行请求：学情报告 + 学习统计（行为数据）
      const [reportRes, statRes] = await Promise.all([
        request.get('/agent/report', { params: { video_id: videoId } }),
        request.get(`/stat/student/${videoId}`),
      ]);
      console.log('📊 /agent/report:', JSON.stringify(reportRes, null, 2));
      console.log('📊 /stat/student:', JSON.stringify(statRes, null, 2));

      const reportOk = (reportRes.code === 0 || reportRes.code === 200) && reportRes.data;
      const statOk = (statRes.code === 0 || statRes.code === 200) && statRes.data;

      if (reportOk || statOk) {
        const rpt = reportOk ? reportRes.data : {};
        const stat = statOk ? statRes.data : {};

        // ===== 从 /agent/report 解析 =====
        // 结构: { items: [{knowledge_id, mastery(0-1), summary, weakness[], behavior_pattern[], trend, recommended_segments}], overall_summary }
        const items = Array.isArray(rpt.items) ? rpt.items : [];

        // 辅助：mastery 可能 0-1 也可能 0-100，统一归到 0-100
        const toRate = (v) => {
          if (typeof v !== 'number') return 50;
          return Math.round(v > 1 ? v : v * 100);
        };

        // 知识点掌握度 → {name, rate(0-100)}
        const knowledge_points = items.map(it => ({
          name: it.knowledge_id || '未知',
          rate: toRate(it.mastery),
        }));

        // 平均 mastery → score
        const avgMastery = items.length > 0
          ? items.reduce((s, it) => s + toRate(it.mastery), 0) / items.length
          : 0;
        const score = Math.round(avgMastery);

        // 评级
        let grade = 'D';
        if (score >= 90) grade = 'S';
        else if (score >= 80) grade = 'A';
        else if (score >= 65) grade = 'B';
        else if (score >= 50) grade = 'C';

        // 薄弱点：mastery < 60(百分制) 的
        const weaknesses = items
          .filter(it => toRate(it.mastery) < 60)
          .map(it => ({
            topic: it.knowledge_id || '未知',
            desc: it.summary || `掌握度 ${toRate(it.mastery)}%`,
            rate: toRate(it.mastery),
          }));

        // 综合评价
        const evaluation = rpt.overall_summary
          || items.map(it => it.summary).filter(Boolean).join('；')
          || demoAnalysis.evaluation;

        // ===== 从 /stat/student 解析行为数据 =====
        let studyMin = demoAnalysis.study_time_min;
        let correctRate = demoAnalysis.correct_rate;
        let coverage = demoAnalysis.knowledge_coverage;
        let behaviorRecords = demoAnalysis.behavior_records;

        if (statOk) {
          // 学习时长
          const watchSec = stat.time_cost || stat.watch_time || 0;
          studyMin = Math.round(watchSec / 60) || demoAnalysis.study_time_min;

          // 正确率
          if (stat.correct_rate != null) {
            correctRate = stat.correct_rate > 1 ? stat.correct_rate / 100 : stat.correct_rate;
          }

          // 知识覆盖
          const statKps = stat.knowledge_points || stat.knowledge || [];
          if (statKps.length > 0) {
            coverage = statKps.length / 12; // 粗略估算
          }

          // 行为记录
          behaviorRecords = {
            total_sessions: stat.session_count || stat.total_sessions || demoAnalysis.behavior_records.total_sessions,
            avg_session_min: stat.avg_session_min || (studyMin > 0 ? Math.round(studyMin / Math.max(stat.session_count || 1, 1)) : demoAnalysis.behavior_records.avg_session_min),
            pause_count: stat.pause_count ?? demoAnalysis.behavior_records.pause_count,
            replay_count: stat.replay_count ?? demoAnalysis.behavior_records.replay_count,
            answer_speed_sec: stat.answer_speed_sec || stat.avg_answer_time || demoAnalysis.behavior_records.answer_speed_sec,
            peak_study_time: stat.peak_study_time || stat.peak_time || demoAnalysis.behavior_records.peak_study_time,
            completion_curve: Array.isArray(stat.completion_curve) && stat.completion_curve.length > 0
              ? stat.completion_curve.map(p => ({ day: p.day || p.date || '', rate: p.rate ?? p.value ?? 0 }))
              : demoAnalysis.behavior_records.completion_curve,
          };
        }

        setAnalysis({
          ...demoAnalysis,
          score,
          grade,
          evaluation,
          study_time_min: studyMin,
          correct_rate: correctRate,
          knowledge_coverage: coverage,
          knowledge_points: knowledge_points.length > 0 ? knowledge_points : demoAnalysis.knowledge_points,
          weaknesses: weaknesses.length > 0 ? weaknesses : demoAnalysis.weaknesses,
          suggestion: rpt.overall_summary || demoAnalysis.suggestion,
          behavior_records: behaviorRecords,
        });
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('❌ 请求失败:', e);
    }
    console.warn('⚠️ 使用 demo 数据');
    setAnalysis(demoAnalysis);
    setLoading(false);
  };

  const data = analysis || demoAnalysis;

  return (
    <div className="la-page-v2">
      <div className="la-header-v2">
        <div className="la-header-content-v2">
          <BackArrow onClick={() => navigate(-1)} />
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
                  共 {data.wrong_questions.length} 道错题，点击展开查看每题独立诊断
                </div>
                {data.wrong_questions.map((q, qi) => (
                  <WrongQuestionItem key={q.id} question={q} index={qi} />
                ))}
              </div>
            )}

            {/* === 四类错因占比 === */}
            {data.error_category_distribution && (
              <div className="la-section-card-v2">
                <div className="la-section-title-v2">四类错因占比</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
                  基于 6 维证据融合诊断，将错因归类为四大教学干预类别
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.error_category_distribution.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: cat.color + '18', color: cat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {cat.count}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{cat.category}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.pct}%</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            width: `${cat.pct}%`, height: '100%', borderRadius: 4,
                            background: cat.color, transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{cat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 14, padding: '10px 12px', borderRadius: 8,
                  background: '#f0f4ff', fontSize: 11, color: '#6b7280', lineHeight: 1.6,
                }}>
                  💡 <b>判定逻辑：</b>基础薄弱 → BFS 追溯前置知识链；能力天花板 → 降维练习；粗心失误 → 注意力提醒；正常过渡 → 继续当前路径
                </div>
              </div>
            )}

            {/* === 分层补救路径 === */}
            {data.remediation_path && (
              <div className="la-section-card-v2" style={{ borderLeft: '3px solid #7c3aed' }}>
                <div className="la-section-title-v2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  🗺️ 分层补救路径
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
                  基于 BFS 前置知识追溯 + 错因诊断，生成三级递进式补救方案
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {data.remediation_path.map((step, idx) => (
                    <div key={idx} style={{
                      background: '#fafafa', borderRadius: 10, padding: 14,
                      border: '1px solid #e8e8e8', position: 'relative',
                    }}>
                      {/* 层级标签 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 10,
                          background: idx === 0 ? '#fef2f2' : idx === 1 ? '#fff7ed' : '#f0fdf4',
                          color: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#10b981',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {step.title}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                          {step.icon} {step.topic}
                        </span>
                      </div>

                      {/* 原因 */}
                      <div style={{
                        fontSize: 12, color: '#666', lineHeight: 1.5,
                        padding: '8px 10px', background: '#fff', borderRadius: 6,
                        marginBottom: 10, border: '1px dashed #e0e0e0',
                      }}>
                        📍 <b>定位：</b>{step.chapter} — {step.reason}
                      </div>

                      {/* 练习题 */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', marginBottom: 6 }}>
                          📝 推荐练习题（3 道）
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {step.exercises.map((ex, exIdx) => (
                            <div key={exIdx} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', background: '#fff', borderRadius: 6,
                              border: '1px solid #f0f0f0',
                            }}>
                              <span style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#f0f4ff', color: '#7c3aed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                              }}>
                                {exIdx + 1}
                              </span>
                              <span style={{ flex: 1, fontSize: 12, color: '#333', lineHeight: 1.4 }}>
                                {ex.title}
                              </span>
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
                      </div>

                      {/* 推荐视频 */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)',
                        borderRadius: 8, cursor: 'pointer',
                      }}>
                        <span style={{ fontSize: 20 }}>🎬</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                            {step.video.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#999' }}>
                            ⏱ {step.video.duration} · 📍 {step.video.segment}
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 12px', borderRadius: 14, fontSize: 11,
                          background: '#7c3aed', color: '#fff', fontWeight: 500,
                        }}>
                          去观看
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
