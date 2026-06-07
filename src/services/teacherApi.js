import request from '../utils/request';

// ==================== 班级相关 ====================

// 创建班级（invite_code 由服务端自动生成，不再需要前端传入）
export const createClass = (data) => request.post('/class/create', data);

// 获取班级详情
export const getClassInfo = (classId) => request.get(`/class/info/${classId}`);

// 获取教师创建的班级列表
export const getMyCreatedClasses = () => request.get('/class/my-created');

// 获取班级内学生列表
export const getClassStudents = (classId) => request.get(`/class/students/${classId}`);

// 学生加入班级
export const joinClass = (data) => request.post('/class/join', data);

// ==================== 视频相关 ====================

// 获取视频详情（包含分段和题目）
export const getVideoDetail = (videoId) => request.get(`/video/getDetail/${videoId}`);

// 获取班级视频任务列表
export const getVideoTasks = (classId) => request.get(`/video/getTasks/${classId}`);

// 获取老师上传的视频列表
export const getMyUploadedVideos = () => request.get('/video/my-uploaded');

// 上传视频
export const uploadVideo = (formData) =>
  request.post('/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ==================== 题目相关（新版） ====================

// 老师按时间点添加题目
export const addQuestion = (data) => request.post('/question/review/add', data);

// 老师修改题目
export const updateQuestion = (questionId, data) => request.put(`/question/review/${questionId}`, data);

// 老师删除题目
export const deleteQuestion = (questionId) => request.delete(`/question/review/${questionId}`);

// 老师查看待审核视频列表（status=processing 的视频）
export const getReviewVideos = () => request.get('/question/review/videos');

// AI生成课后习题（旧版）
export const generateQuestions = (videoId) => request.get(`/question/generate/${videoId}`);

// 学生批量提交答题答案（新版路径）
export const submitAnswer = (data) => request.post('/question/answer', data);

// ==================== 视频审核与发布（新版） ====================

// 发布视频到班级（审核+发布+下发，class_ids 和 video_id 均通过 body 传递）
export const publishVideo = (data) => request.post('/video/review/publish', data);

// ==================== 视频处理进度 ====================

// 获取视频任务处理进度
export const getTaskProcess = (jobID) => request.post('/video/task/process', { jobID });

// ==================== AI 智能体相关 ====================

// AI 对话助手
export const agentChat = (data) => request.post('/agent/chat', data);

// 获取聊天历史
export const getChatHistory = (params) => request.get('/agent/history', { params });

// AI 生成习题（新版，支持数量/难度）
export const agentQuiz = (data) => request.post('/agent/quiz', data);

// 生成学情报告
export const generateReport = (data) => request.post('/agent/report', data);

// 获取已存储的学情报告
export const getReport = (params) => request.get('/agent/report', { params });

// ==================== 统计分析相关 ====================

// 获取班级整体学情统计
export const getClassStat = (data) => request.get('/stat/class', { data });

// 获取学生个人学情统计
export const getStudentStat = (videoId) => request.get(`/stat/student/${videoId}`);

// 获取学生总体学情概览
export const getStudentOverview = () => request.get('/stat/student/overview');
