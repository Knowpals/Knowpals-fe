/**
 * 题目类型统一定义
 * -------------------
 * 所有题目类型的数据模型、答案格式、渲染配置均在此定义，
 * 教师端表单、学生端答题、学情分析均引用此文件。
 */

// ==================== 题目类型枚举 ====================

export const QUESTION_TYPE = {
  SINGLE_CHOICE: 'single_choice',     // 单选题
  MULTIPLE_CHOICE: 'multiple_choice', // 多选题
  TRUE_FALSE: 'true_false',           // 判断题
  FILL_BLANK: 'fill_blank',           // 填空题
  SHORT_ANSWER: 'short_answer',       // 简答题
};

// ==================== 题型元信息 ====================

export const QUESTION_TYPE_META = {
  [QUESTION_TYPE.SINGLE_CHOICE]: {
    label: '单选题',
    shortLabel: '单选',
    icon: '🔘',
    color: '#1890ff',
    bg: '#e6f7ff',
    border: '#91d5ff',
    answerLabel: '正确答案',
    answerHint: '选择一个正确选项',
    defaultOptionCount: 4,
    hasOptions: true,
    multiAnswer: false,
    apiType: 'single_choice',
  },
  [QUESTION_TYPE.MULTIPLE_CHOICE]: {
    label: '多选题',
    shortLabel: '多选',
    icon: '☑️',
    color: '#722ed1',
    bg: '#f9f0ff',
    border: '#d3adf7',
    answerLabel: '正确答案（可多选）',
    answerHint: '选择一个或多个正确选项',
    defaultOptionCount: 4,
    hasOptions: true,
    multiAnswer: true,
    apiType: 'multiple_choice',
  },
  [QUESTION_TYPE.TRUE_FALSE]: {
    label: '判断题',
    shortLabel: '判断',
    icon: '⚖️',
    color: '#52c41a',
    bg: '#f6ffed',
    border: '#b7eb8f',
    answerLabel: '正确答案',
    answerHint: '选择对或错',
    defaultOptionCount: 2,
    hasOptions: false,
    multiAnswer: false,
    apiType: 'true_false',
    presetOptions: ['对', '错'],
  },
  [QUESTION_TYPE.FILL_BLANK]: {
    label: '填空题',
    shortLabel: '填空',
    icon: '✏️',
    color: '#faad14',
    bg: '#fffbe6',
    border: '#ffe58f',
    answerLabel: '参考答案',
    answerHint: '输入参考答案，多个空用 | 分隔',
    defaultOptionCount: 0,
    hasOptions: false,
    multiAnswer: false,
    apiType: 'fill_blank',
  },
  [QUESTION_TYPE.SHORT_ANSWER]: {
    label: '简答题',
    shortLabel: '简答',
    icon: '📝',
    color: '#13c2c2',
    bg: '#e6fffb',
    border: '#87e8de',
    answerLabel: '参考答案',
    answerHint: '输入参考答案或评分要点',
    defaultOptionCount: 0,
    hasOptions: false,
    multiAnswer: false,
    apiType: 'short_answer',
  },
};

// ==================== 选项字母 ====================

export const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ==================== 工具函数 ====================

/** 将后端 type 字符串映射到标准 QUESTION_TYPE */
export function normalizeQuestionType(rawType) {
  if (!rawType) return QUESTION_TYPE.SINGLE_CHOICE;
  const t = String(rawType).toLowerCase().trim();
  const aliasMap = {
    'choice': QUESTION_TYPE.SINGLE_CHOICE,
    'single': QUESTION_TYPE.SINGLE_CHOICE,
    'single_choice': QUESTION_TYPE.SINGLE_CHOICE,
    'multiple': QUESTION_TYPE.MULTIPLE_CHOICE,
    'multi_choice': QUESTION_TYPE.MULTIPLE_CHOICE,
    'multiple_choice': QUESTION_TYPE.MULTIPLE_CHOICE,
    'judge': QUESTION_TYPE.TRUE_FALSE,
    'true_false': QUESTION_TYPE.TRUE_FALSE,
    'bool': QUESTION_TYPE.TRUE_FALSE,
    'fill': QUESTION_TYPE.FILL_BLANK,
    'fill_blank': QUESTION_TYPE.FILL_BLANK,
    'fill_in': QUESTION_TYPE.FILL_BLANK,
    'blank': QUESTION_TYPE.FILL_BLANK,
    'short': QUESTION_TYPE.SHORT_ANSWER,
    'short_answer': QUESTION_TYPE.SHORT_ANSWER,
    'qa': QUESTION_TYPE.SHORT_ANSWER,
    'subjective': QUESTION_TYPE.SHORT_ANSWER,
    'essay': QUESTION_TYPE.SHORT_ANSWER,
  };
  return aliasMap[t] || QUESTION_TYPE.SINGLE_CHOICE;
}

/** 获取题型的中文标签 */
export function getQuestionTypeLabel(rawType) {
  const normalized = normalizeQuestionType(rawType);
  return QUESTION_TYPE_META[normalized]?.label || '未知题型';
}

/** 获取题型的颜色 */
export function getQuestionTypeColor(rawType) {
  const normalized = normalizeQuestionType(rawType);
  return QUESTION_TYPE_META[normalized]?.color || '#666';
}

/** 格式化选项列表（统一转为 { letter, text }[]） */
export function formatOptions(options, questionType) {
  const type = normalizeQuestionType(questionType);

  // 判断题使用预设选项
  if (type === QUESTION_TYPE.TRUE_FALSE) {
    return [
      { letter: 'A', text: '对' },
      { letter: 'B', text: '错' },
    ];
  }

  // 填空题和简答题无需选项
  if (type === QUESTION_TYPE.FILL_BLANK || type === QUESTION_TYPE.SHORT_ANSWER) {
    return [];
  }

  // 选择题
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt, i) => {
    if (typeof opt === 'string') {
      return { letter: OPTION_LETTERS[i], text: opt };
    }
    return {
      letter: opt.letter || opt.label || OPTION_LETTERS[i],
      text: opt.text || opt.option || opt.content || String(opt),
    };
  });
}

/** 从答案字符串/数组解析为可用于比对的标准化形式 */
export function parseAnswer(rawAnswer, questionType) {
  const type = normalizeQuestionType(questionType);

  if (rawAnswer === null || rawAnswer === undefined) return null;

  switch (type) {
    case QUESTION_TYPE.SINGLE_CHOICE:
      // 返回标准字母
      return String(rawAnswer).trim().toUpperCase();

    case QUESTION_TYPE.MULTIPLE_CHOICE:
      // 返回字母数组
      if (Array.isArray(rawAnswer)) {
        return rawAnswer.map(a => String(a).trim().toUpperCase()).sort();
      }
      // "A,C" 或 "AC" → ["A","C"]
      const joined = String(rawAnswer).replace(/[^A-Za-z,]/g, '');
      return joined.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).sort();

    case QUESTION_TYPE.TRUE_FALSE:
      const v = String(rawAnswer).trim();
      if (v === '对' || v === '正确' || v === 'true' || v === 'True' || v === 'T' || v === 'A') return '对';
      if (v === '错' || v === '错误' || v === 'false' || v === 'False' || v === 'F' || v === 'B') return '错';
      return v;

    case QUESTION_TYPE.FILL_BLANK:
    case QUESTION_TYPE.SHORT_ANSWER:
    default:
      return String(rawAnswer).trim();
  }
}

/** 判断学生答案是否正确 */
export function isAnswerCorrect(studentAnswer, correctAnswer, questionType) {
  const type = normalizeQuestionType(questionType);
  const s = parseAnswer(studentAnswer, type);
  const c = parseAnswer(correctAnswer, type);

  if (s === null || c === null) return false;

  switch (type) {
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.TRUE_FALSE:
      return s === c;

    case QUESTION_TYPE.MULTIPLE_CHOICE:
      if (!Array.isArray(s) || !Array.isArray(c)) return false;
      return s.length === c.length && s.every((v, i) => v === c[i]);

    case QUESTION_TYPE.FILL_BLANK:
      // 模糊匹配：忽略大小写和首尾空格
      return s.toLowerCase() === c.toLowerCase();

    case QUESTION_TYPE.SHORT_ANSWER:
      // 简答题：包含关键词即算半对（实际应由服务端判断）
      return s.length > 0;

    default:
      return s === c;
  }
}

/** 构建提交给后端的答案格式（对齐 POST /question/answer StudentAnswer schema） */
export function buildAnswerPayload(questionId, rawAnswer, questionType, timeCost) {
  const type = normalizeQuestionType(questionType);
  const parsed = parseAnswer(rawAnswer, type);

  return {
    question_id: questionId,
    answer: parsed,
    time_cost: timeCost || 0,
  };
}

/** 从 CSV/JSON 导入时，标准化一条题目数据 */
export function normalizeQuestionData(raw) {
  const qType = normalizeQuestionType(raw.type || raw.question_type);
  const meta = QUESTION_TYPE_META[qType];

  let options = raw.options || raw.choices || [];
  if (typeof options === 'string') {
    try { options = JSON.parse(options); } catch { options = options.split(',').map(o => o.trim()); }
  }

  return {
    id: raw.id || raw.question_id,
    type: qType,
    typeLabel: meta.label,
    typeIcon: meta.icon,
    typeColor: meta.color,
    content: raw.content || raw.title || raw.question || '',
    options: formatOptions(options, qType),
    answer: raw.answer || raw.correct_answer || raw.answer_key || '',
    parsedAnswer: parseAnswer(raw.answer || raw.correct_answer || raw.answer_key || '', qType),
    analysis: raw.analysis || raw.explanation || '',
    time: raw.time || raw.insert_time || raw.insertTime || 0,
    difficulty: raw.difficulty || 0.5,
    knowledge: raw.knowledge || raw.knowledge_point || '',
  };
}
