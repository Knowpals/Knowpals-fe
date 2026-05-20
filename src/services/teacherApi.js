import request from '../utils/request';

// ==================== 班级相关 ====================

// 创建班级
export const createClass = (data) => request.post('/class/create', data);

// 获取班级详情
export const getClassInfo = (classId) => request.get(`/class/info/${classId}`);

// 获取教师创建的班级列表
export const getMyCreatedClasses = () => request.get('/class/my-created');

// 获取班级内学生列表
export const getClassStudents = (classId) => request.get(`/class/students/${classId}`);

// ==================== 视频相关 ====================

// 获取视频详情（包含分段和题目）
export const getVideoDetail = (videoId) => request.get(`/video/getDetail/${videoId}`);

// 获取班级视频任务列表
export const getVideoTasks = (classId) => request.get(`/video/getTasks/${classId}`);

// 获取老师上传的视频列表
export const getMyUploadedVideos = () => request.get('/video/my-uploaded');

// 下发视频任务到班级
export const postVideoToClass = (data) => request.post('/video/post-to-class', data);

// 上传视频
export const uploadVideo = (formData) =>
  request.post('/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ==================== 行为统计相关 ====================

// 获取班级内视频观看进度
export const getClassProgress = (classId, status) =>
  request.get(`/behavior/class-progress/${classId}/${status}`);

// 提交答题记录
export const submitAnswer = (data) => request.post('/behavior/answer', data);

// ==================== 题目相关 ====================

// 生成课后习题（AI生成）
export const generateQuestions = (videoId) => request.get(`/question/generate/${videoId}`);

// ==================== 统计分析相关 ====================

// 获取班级整体学情统计
export const getClassStat = (data) => request.post('/stat/class', data);

// 获取学生个人学情统计
export const getStudentStat = (videoId) => request.get(`/stat/student/${videoId}`);

// ==================== 视频审核相关 ====================

// 视频进入审核
export const startVideoReview = (videoId) => request.post(`/video/${videoId}/review/start`);

// 发布视频（审核通过后发布）
export const publishVideo = (videoId) => request.post(`/video/${videoId}/review/publish`);

// ==================== 班级相关（教师端也可用） ====================

// 学生加入班级
export const joinClass = (data) => request.post('/class/join', data);
