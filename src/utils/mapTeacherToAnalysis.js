/**
 * 将教师端 API 数据映射为学生端学情分析数据模型
 *
 * @param {Object} classStat   - getClassStat() 返回的 data 字段
 * @param {Object} overviewStats - getStudentOverview() 返回的 data 字段 (可选)
 * @returns {Object} 与 demoAnalysis 同结构的对象
 */
export function mapTeacherToAnalysis(classStat, overviewStats) {
  if (!classStat) return null;

  const { overview, weak_knowledge_point, top_pause_action, top_replay_action, top_questions } = classStat;

  // 基础数值
  const avgCorrectRate = overview?.average_correct_rate ?? 0;
  const avgTimeCost = overview?.average_time_cost ?? 0;
  const completeRate = overview?.complete_rate ?? 0;
  const totalPause = overview?.total_pause_count ?? 0;

  // 评分映射
  const score = Math.round(avgCorrectRate * 100);
  const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

  // 评价语
  const evaluationTexts = {
    S: '班级整体表现优异，对核心知识点掌握扎实。',
    A: '班级整体表现良好，少数知识点需要加强。',
    B: '班级整体表现中等，部分知识点存在薄弱环节。',
    C: '班级整体表现一般，多个知识点需要重点巩固。',
    D: '班级整体表现较弱，建议系统性复习基础知识。',
  };

  // 知识点掌握度
  const weakPoints = weak_knowledge_point || [];
  const knowledge_points = weakPoints.map(w => ({
    name: w.title,
    rate: Math.round((1 - (w.weak_rate ?? 0)) * 100),
  }));

  // 薄弱点
  const weaknesses = weakPoints
    .filter(w => (w.weak_rate ?? 0) > 0.25)
    .sort((a, b) => (b.weak_rate ?? 0) - (a.weak_rate ?? 0))
    .map(w => ({
      topic: w.title,
      desc: `班级薄弱率 ${Math.round((w.weak_rate ?? 0) * 100)}%，需重点关注。`,
      rate: Math.round((w.weak_rate ?? 0) * 100),
      knowledge_id: w.knowledge_id,
    }));

  // 行为记录
  const topPause = top_pause_action || [];
  const topReplay = top_replay_action || [];
  const behavior_records = {
    total_sessions: overviewStats?.total_count ?? '--',
    avg_session_min: avgTimeCost > 0 ? Math.round(avgTimeCost / 60) : 0,
    pause_count: totalPause,
    replay_count: topReplay.reduce((sum, r) => sum + (r.replay_count || 0), 0),
    answer_speed_sec: '--', // 教师端暂无
    peak_study_time: '--',
    completion_curve: [], // 教师端暂无每日数据
    top_pause_segments: topPause.slice(0, 5).map(p => ({
      start: p.start,
      end: p.end,
      pause_count: p.pause_count,
      segment_id: p.segment_id,
    })),
    top_replay_segments: topReplay.slice(0, 5).map(r => ({
      start: r.start,
      end: r.end,
      replay_count: r.replay_count,
      segment_id: r.segment_id,
    })),
  };

  // 错题列表
  const topQs = top_questions || [];
  const wrong_questions = topQs.map(q => ({
    id: q.question_id,
    title: q.content || '未知题目',
    type: 'choice', // 默认类型
    difficulty: null,
    error_rate: q.error_rate ?? 0,
    studentAnswer: null,
    correctAnswer: null,
    primaryError: (q.error_rate ?? 0) > 0.35 ? '高频错误' : (q.error_rate ?? 0) > 0.2 ? '常见错误' : '一般错误',
    primaryLevel: (q.error_rate ?? 0) > 0.35 ? '需重点关注' : (q.error_rate ?? 0) > 0.2 ? '注意排查' : '过渡性错误',
    confidence: 0.5,
    evidence: [
      { name: '错误率', score: q.error_rate ?? 0, desc: `班级错误率 ${Math.round((q.error_rate ?? 0) * 100)}%` },
    ],
    viz: null, // 教师端暂无完整六维数据
  }));

  // 四类错因占比（根据错误率阈值近似分类）
  const highErrors = topQs.filter(q => (q.error_rate ?? 0) > 0.35).length;
  const midErrors = topQs.filter(q => (q.error_rate ?? 0) > 0.2 && (q.error_rate ?? 0) <= 0.35).length;
  const lowErrors = topQs.filter(q => (q.error_rate ?? 0) > 0 && (q.error_rate ?? 0) <= 0.2).length;
  const totalErrors = topQs.length || 1;
  const error_category_distribution = [
    {
      category: '高频错误',
      pct: Math.round((highErrors / totalErrors) * 100),
      color: '#ef4444',
      count: highErrors,
      desc: '错误率 > 35%，需重点回溯和强化训练',
    },
    {
      category: '常见错误',
      pct: Math.round((midErrors / totalErrors) * 100),
      color: '#f97316',
      count: midErrors,
      desc: '错误率 20%-35%，需针对性地排查知识点盲区',
    },
    {
      category: '一般错误',
      pct: Math.round((lowErrors / totalErrors) * 100),
      color: '#f59e0b',
      count: lowErrors,
      desc: '错误率 < 20%，正常学习过程中的过渡性错误',
    },
  ];

  // 分层补救路径（基于 top 3 薄弱点生成）
  const topWeaknesses = weaknesses.slice(0, 3);
  const remediation_path = topWeaknesses.map((w, idx) => ({
    level: idx + 1,
    title: `L${idx + 1} ${idx === 0 ? '重点突破' : idx === 1 ? '核心强化' : '拓展提升'}`,
    icon: idx === 0 ? '🔧' : idx === 1 ? '🎯' : '🚀',
    chapter: '',
    topic: w.topic,
    reason: `班级薄弱率 ${w.rate}%，${w.desc}`,
    exercises: [
      { title: `针对"${w.topic}"的基础练习`, difficulty: '基础' },
      { title: `针对"${w.topic}"的强化练习`, difficulty: '进阶' },
      { title: `针对"${w.topic}"的综合应用`, difficulty: '综合' },
    ],
    video: { title: '', duration: '', segment: '', url: '' },
  }));

  // 学习建议
  const weakTitles = topWeaknesses.map(w => w.topic).join('、');
  const suggestion = topWeaknesses.length > 0
    ? `建议重点复习${weakTitles}等薄弱知识点，可结合视频分段中的高频暂停/回看位置进行针对性讲解。`
    : '班级整体表现良好，继续保持当前学习节奏。';

  return {
    score,
    grade,
    evaluation: evaluationTexts[grade] || evaluationTexts.B,
    study_time_min: Math.round(avgTimeCost / 60),
    correct_rate: avgCorrectRate,
    knowledge_coverage: completeRate,
    knowledge_points,
    weaknesses,
    behavior_records,
    wrong_questions,
    error_category_distribution,
    remediation_path,
    suggestion,
  };
}

/** 评分 → CSS class */
export function getGradeClass(grade) {
  const map = { S: 'grade-s', A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d' };
  return map[grade] || 'grade-b';
}
