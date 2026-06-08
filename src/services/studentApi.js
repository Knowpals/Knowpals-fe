import request from '../utils/request';

// ==================== 班级相关 ====================

// 获取学生加入的班级列表
export const getMyJoinedClasses = () => request.get('/class/my-joined');

// 学生加入班级
export const joinClass = (data) => request.post('/class/join', data);

// 获取班级详情
export const getClassInfo = (classId) => request.get(`/class/info/${classId}`);

// 学生退出班级
export const quitClass = (classId) => request.post(`/class/quit/${classId}`);

// ==================== 视频相关 ====================

// 获取视频详情（包含分段、题目、小图谱 subgraph）
export const getVideoDetail = (videoId) => request.get(`/video/getDetail/${videoId}`);

// 获取班级视频任务列表
export const getVideoTasks = (classId) => request.get(`/video/getTasks/${classId}`);

// ==================== 行为统计相关 ====================

// 获取班级内视频观看进度
export const getClassProgress = (classId, status) =>
  request.get(`/behavior/class-progress/${classId}/${status}`);

/**
 * 提交答题记录（单个）
 * @param {Object} data
 * @param {number} data.video_id
 * @param {Array} data.studentanswers - [{ question_id, question_type, answer, time_cost }]
 *   answer 格式按题型：
 *   - single_choice: "A"
 *   - multiple_choice: ["A", "C"]
 *   - true_false: "对" | "错"
 *   - fill_blank: "答案1,答案2"
 *   - short_answer: "自由文本"
 */
export const submitAnswer = (data) => request.post('/question/answer', data);

/** 学生批量提交答题答案（格式同 submitAnswer） */
export const submitAnswers = (data) => request.post('/question/answer/batch', data);

// 记录学生视频观看行为（暂停、回放等）
export const recordBehavior = (data) => request.post('/behavior/record', data);

// 更新学生视频观看进度
export const updateProgress = (data) => request.post('/behavior/update-progress', data);

// 获取学生未完成任务列表
export const getUnfinishedTasks = () => request.get('/behavior/my/unfinished');

// ==================== 统计分析相关 ====================

// 获取学生个人学情统计（单视频）
export const getStudentStat = (videoId) => request.get(`/stat/student/${videoId}`);

// 获取学生总体学习统计
export const getStudentOverview = () => request.get('/stat/student/overview');

// ==================== AI助手相关 ====================

// 智能对话助手
export const chatWithAgent = (data) => request.post('/agent/chat', data);

// 获取聊天历史记录
export const getChatHistory = (params) => request.get('/agent/history', { params });

// 生成学情报告
export const generateReport = (data) => request.post('/agent/report', data);

// 获取学习报告
export const getReport = (params) => request.get('/agent/report', { params });

// 生成习题（AI生成）
export const generateQuiz = (data) => request.post('/agent/quiz', data);

// ==================== V2 新增 API ====================

// 获取学情分析
export const getLearningAnalysis = (params) => request.get('/agent/learning-analysis', { params });

// 获取深度练习题目（BFS 前置知识追溯）
export const getDeepPractice = (params) => request.get('/agent/deep-practice', { params });

// 获取小图谱（视频级知识图谱）
export const getSmallKG = (params) => request.get('/agent/small-kg', { params });

// 获取大图谱（课程级知识图谱）
export const getBigKG = (params) => request.get('/agent/big-kg', { params });

// 获取学生画像
export const getStudentPersona = () => request.get('/agent/persona');
